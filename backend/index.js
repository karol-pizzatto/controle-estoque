// backend/index.js
import express from 'express'
import cors from 'cors'
import mqtt from 'mqtt'
import 'dotenv/config'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

const app = express()
app.use(cors(), express.json())

// Abre (ou cria) o SQLite “estoque.db”
const dbPromise = open({
  filename: './estoque.db',
  driver: sqlite3.Database
})

// Cria tabela + seed padrão
;(async () => {
  const db = await dbPromise
// tabela produto
  await db.run(`
    CREATE TABLE IF NOT EXISTS produto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 0,
      localizacao TEXT DEFAULT '',
      minimo INTEGER NOT NULL DEFAULT 0
    )
  `)
  console.log('✅ Tabela produto pronta!')

  const { cnt } = await db.get('SELECT COUNT(*) as cnt FROM produto')
  if (cnt === 0) {
    const padrao = [
      { nome: 'Galão 10L',              quantidade: 0, localizacao: 'Estoque', minimo: 5 },
      { nome: 'Galão 20L',              quantidade: 0, localizacao: 'Estoque', minimo: 5 },
      { nome: 'Fardo 500mL sem gás',    quantidade: 0, localizacao: 'Estoque', minimo: 20 },
      { nome: 'Fardo 500mL c/ gás',     quantidade: 0, localizacao: 'Estoque', minimo: 20 }
    ]
    for (const p of padrao) {
      await db.run(
        'INSERT INTO produto (nome, quantidade, localizacao, minimo) VALUES (?, ?, ?, ?)',
        p.nome, p.quantidade, p.localizacao, p.minimo
      )
    }
    console.log('🛠️  Produtos padrão Vital Água inseridos')
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
  console.log('✅ Tabela movimento pronta!')
})()

// Teste de vida - rota raiz
app.get('/', (_, res) => res.send('API Vital Água está viva!'))

// Rotas CRUD

// GET /produtos
app.get('/produtos', async (_, res) => {
  const db = await dbPromise
  const produtos = await db.all('SELECT * FROM produto')
  console.log('Chamou GET /produtos, retornando', produtos.length, 'itens')
  res.json(produtos)
})

// POST /produtos
app.post('/produtos', async (req, res) => {
  const { nome, quantidade = 0, minimo = 0 } = req.body
  const db = await dbPromise

  // Insere produto
  const result = await db.run(
    `INSERT INTO produto (nome, quantidade, minimo)
     VALUES (?, ?, ?, ?)`,
    nome, quantidade, minimo
  )

// registra entrada inicial
await db.run(
   `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
     VALUES (?, 'entrada', ?, ?)`,
    result.lastID, quantidade, new Date().toISOString()
)
  const produto = await db.get('SELECT * FROM produto WHERE id = ?', result.lastID)
  res.status(201).json(produto)
})

// PUT /produtos/:id
app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params
  const { nome, quantidade, localizacao, minimo } = req.body
  const db = await dbPromise

// busca quantidade atual antes do update
  const before = await db.get('SELECT quantidade FROM produto WHERE id = ?', id)

// atualiza produto
  await db.run(
    `UPDATE produto
     SET nome        = COALESCE(?, nome),
         quantidade  = COALESCE(?, quantidade),
         minimo      = COALESCE(?, minimo)
     WHERE id = ?`,
    nome, quantidade, localizacao, minimo, id
  )

// Busca quantidade depois da atualização
  const after = await db.get('SELECT quantidade FROM produto WHERE id = ?', id)
  const delta = after.quantidade - before.quantidade

// Registra movimento se houver variação
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

// DELETE /produtos/:id
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params
  const db = await dbPromise
  await db.run('DELETE FROM produto WHERE id = ?', id)
  res.status(204).end()
})

// Integração IoT via MQTT
const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://broker.emqx.io')
client.on('connect', () => {
  console.log('🔌 MQTT conectado!')
  client.subscribe('estoque/sensor/+')
})
client.on('message', async (topic, msg) => {
  try {
    const { id, quantidade } = JSON.parse(msg.toString())
    const db = await dbPromise
    await db.run('UPDATE produto SET quantidade = ? WHERE id = ?', quantidade, id)
    console.log(`📶 Sensor ${id} → ${quantidade}`)
  } catch (e) {
    console.error('Erro ao processar mensagem MQTT:', e)
  }
})

// Sobe o servidor
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Backend SQLite em http://localhost:${PORT}`))
