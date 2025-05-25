const functions = require('firebase-functions');
const express   = require('express');
const cors      = require('cors');
const { open }  = require('sqlite');
const sqlite3   = require('sqlite3');
const app = express();
const router = express.Router();

const dbPromise = open({
  filename: './estoque.db',
  driver: sqlite3.Database
});

// tabelas
(async () => {
  const db = await dbPromise;

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
  `);

  const { cnt } = await db.get('SELECT COUNT(*) as cnt FROM produto');
  if (cnt === 0) {
    const padrao = [
      { nome: 'Galão 10L', marca: '', quantidade: 0, minimo: 5, data_validade: null, valor_custo: 20, valor_venda: 35 },
      { nome: 'Galão 20L', marca: '', quantidade: 0, minimo: 5, data_validade: null, valor_custo: 20, valor_venda: 45 },
      { nome: 'Fardo 500mL sem gás', marca: '', quantidade: 0, minimo: 20, data_validade: null, valor_custo: 10, valor_venda: 14 },
      { nome: 'Fardo 500mL c/ gás', marca: '', quantidade: 0, minimo: 20, data_validade: null, valor_custo: 12, valor_venda: 21 }
    ];
    for (const p of padrao) {
      await db.run(
        `INSERT INTO produto (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        p.nome, p.marca, p.quantidade, p.minimo, p.data_validade, p.valor_custo, p.valor_venda
      );
    }
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS movimento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY(produto_id) REFERENCES produto(id)
    )
  `);
})();

//middlewares

app.use(cors());
app.use(express.json());

// ROTAS ---------------------------------------------------------------------------------------------
// passou
router.get('/produtos', async (_, res) => {
  const db = await dbPromise
  res.json(await db.all('SELECT * FROM produto'))
});

// PASSOU, PASSANDO
router.post('/produtos', async (req, res) => {
  try {
    const { nome, marca, quantidade=0, minimo=0, data_validade=null, valor_custo=0, valor_venda=0 } = req.body;
    const db = await dbPromise;
    const result = await db.run(
      `INSERT INTO produto (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda
    );
    // registra movimento de entrada
    await db.run(
      `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
       VALUES (?, 'entrada', ?, ?)`,
      result.lastID, quantidade, new Date().toISOString()
    );
    res.status(201).json(await db.get('SELECT * FROM produto WHERE id = ?', result.lastID));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

// passou tbm
router.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda } = req.body;
  const db = await dbPromise;

  const before = await db.get('SELECT quantidade FROM produto WHERE id = ?', id);
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
  );
                        // fechava nesta linha antes

const after = await db.get('SELECT quantidade FROM produto WHERE id = ?', id);      //passou

// Garante que o produto existe
if (before && after) {
  const delta = (after.quantidade ?? 0) - (before.quantidade ?? 0);

  if (delta !== 0) {
    const tipo = delta > 0 ? 'entrada' : 'saida';
    await db.run(
      `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
       VALUES (?, ?, ?, ?)`,
      id, tipo, Math.abs(delta), new Date().toISOString()
    );
  }
  res.json(await db.get('SELECT * FROM produto WHERE id = ?', id));
} else {
  res.status(404).json({ error: 'Produto não encontrado!' });
}

});  //fecha o router.put incluindo o const afeter no role

// ultima rota de teste
router.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const db = await dbPromise;
  await db.run('DELETE FROM produto WHERE id = ?', id);
  res.status(204).end();
});

// Health-check ---------------------------------------------------------------------------------------------
app.get('/', (_, res) => res.send('OK'));

// Exporta pro Firebase Functions
exports.app = functions.https.onRequest(app)
