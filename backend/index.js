const functions = require('firebase-functions')
const express = require('express')
const cors = require('cors')
const mqtt = require('mqtt')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(cors())
app.use(express.json())

// Health-check para Gen-2 e Functions Framework
app.get('/', (req, res) => {
  res.status(200).send('OK')
})

// 1) Conexão SQLite e seed
const dbPromise = open({
  filename: './estoque.db',
  driver: sqlite3.Database
})

;(async () => {
  const db = await dbPromise

  // Tabela produto
  await db.run(`
    CREATE TABLE IF NOT EXISTS produto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      marca TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 0,
      minimo INTEGER NOT NULL DEFAULT 0,
      data_validade TEXT,
      valor_custo REAL NOT NULL DEFAULT 0,
      valor_venda REAL NOT NULL DEFAULT 0
    )
  `)

  // Seed padrão
  const { cnt } = await db.get('SELECT COUNT(*) as cnt FROM produto')
  if (cnt === 0) {
    const padrao = [
      { nome: 'Galão 10L', marca: '', quantidade: 0, minimo: 5, data_validade: null, valor_custo: 20, valor_venda: 35 },
      { nome: 'Galão 20L', marca: '', quantidade: 0, minimo: 5, data_validade: null, valor_custo: 20, valor_venda: 45 },
      { nome: 'Fardo 500mL sem gás', marca: '', quantidade: 0, minimo: 20, data_validade: null, valor_custo: 10, valor_venda: 14 },
      { nome: 'Fardo 500mL c/ gás', marca: '', quantidade: 0, minimo: 20, data_validade: null, valor_custo: 12, valor_venda: 21 }
    ]
    for (const p of padrao) {
      await db.run(
        `INSERT INTO produto (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        p.nome, p.marca, p.quantidade, p.minimo, p.data_validade, p.valor_custo, p.valor_venda
      )
    }
  }

  // Tabela movimento
  await db.run(`
    CREATE TABLE IF NOT EXISTS movimento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(produto_id) REFERENCES produto(id)
    )
  `)
})()

// Rotas CRUD prefixadas com /api
app.get('/api/produtos', async (_, res) => {
  const db = await dbPromise
  const produtos = await db.all('SELECT * FROM produto')
  res.json(produtos)
})

app.post('/api/produtos', async (req, res) => {
  const { nome, marca, quantidade = 0, minimo = 0, data_validade = null, valor_custo = 0, valor_venda = 0 } = req.body
  const db = await dbPromise
  const result = await db.run(
    `INSERT INTO produto (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda
  )
  await db.run(
    `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
     VALUES (?, 'entrada', ?, ?)`,
    result.lastID, quantidade, new Date().toISOString()
  )
  const produto = await db.get('SELECT * FROM produto WHERE id = ?', result.lastID)
  res.status(201).json(produto)
})

app.put('/api/produtos/:id', async (req, res) => {
  const { id } = req.params
  const { nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda } = req.body
  const db = await dbPromise
  const before = await db.get('SELECT quantidade FROM produto WHERE id = ?', id)
  await db.run(
    `UPDATE produto
     SET nome = COALESCE(?, nome),
         marca = COALESCE(?, marca),
         quantidade = COALESCE(?, quantidade),
         minimo = COALESCE(?, minimo),
         data_validade = COALESCE(?, data_validade),
         valor_custo = COALESCE(?, valor_custo),
         valor_venda = COALESCE(?, valor_venda)
     WHERE id = ?`,
    nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda, id
  )
  const after = await db.get('SELECT quantidade FROM produto WHERE id = ?', id)
  const delta = after.quantidade - before.quantidade
  if (delta !== 0) {
    const tipo = delta > 0 ? 'entrada' : 'saida'
    await db.run(
      `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
       VALUES (?, ?, ?, ?)`,
      id, tipo, Math.abs(delta), new Date().toISOString()
    )
  }
  const produto = await db.get('SELECT * FROM produto WHERE id = ?', id)
  res.json(produto)
})

app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params
  const db = await dbPromise
  await db.run('DELETE FROM produto WHERE id = ?', id)
  res.status(204).end()
})

// Integração IoT via MQTT (inicialização assíncrona)
setImmediate(() => {
  const mqttUrl = functions.config().mqtt?.url || 'mqtt://broker.emqx.io'
  const client = mqtt.connect(mqttUrl)
  client.on('connect', () => client.subscribe('estoque/sensor/+'))
  client.on('message', async (topic, msg) => {
    try {
      const { id, quantidade } = JSON.parse(msg.toString())
      const db = await dbPromise
      await db.run('UPDATE produto SET quantidade = ? WHERE id = ?', quantidade, id)
    } catch (e) {
      console.error('Erro ao processar mensagem MQTT:', e)
    }
  })
})

// Export para o Functions Gen-2 invocar seu app em /api/*
exports.app = functions.https.onRequest(app)

// Expõe HTTP server no container para o TCP health-check
if (process.env.K_SERVICE) {
  const port = process.env.PORT || 8080
  app.listen(port, () => console.log(`Container listening on port ${port}`))
}
