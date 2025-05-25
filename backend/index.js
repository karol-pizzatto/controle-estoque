const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const router = express.Router();

const pool = mysql.createPool({
  host:     '34.95.223.214',      // ex: IP do Cloud SQL
  user:     'adminK',             // usuário do banco
  password: 'Neosoro30vida',      // senha
  database: 'estoqueVital',       // nome do banco
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middlewares
app.use(cors({
  origin: "https://controleestoquevitalagua.web.app",
  credentials: true,
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://controleestoquevitalagua.web.app");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(express.json());

// ROTAS ---------------------------------------------------------------------------------------------
router.get('/produtos', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM produto');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

router.post('/produtos', async (req, res) => {
  try {
    const { nome, marca, quantidade = 0, minimo = 0, data_validade = null, valor_custo = 0, valor_venda = 0 } = req.body;
    const [result] = await pool.query(
      `INSERT INTO produto (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda]
    );
    await pool.query(
      `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
      VALUES (?, 'entrada', ?, ?)`,
      [result.insertId, quantidade, new Date()]
    );
    const [produto] = await pool.query('SELECT * FROM produto WHERE id = ?', [result.insertId]);
    res.status(201).json(produto[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

router.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda } = req.body;

    const [antesArr] = await pool.query('SELECT quantidade FROM produto WHERE id = ?', [id]);
    const before = antesArr[0];
    await pool.query(
      `UPDATE produto SET nome = COALESCE(?, nome), marca = COALESCE(?, marca), quantidade = COALESCE(?, quantidade), minimo = COALESCE(?, minimo), data_validade = COALESCE(?, data_validade), valor_custo = COALESCE(?, valor_custo), valor_venda = COALESCE(?, valor_venda) WHERE id = ?`,
      [nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda, id]
    );
    const [depoisArr] = await pool.query('SELECT quantidade FROM produto WHERE id = ?', [id]);
    const after = depoisArr[0];

    if (before && after) {
      const delta = (after.quantidade ?? 0) - (before.quantidade ?? 0);
      if (delta !== 0) {
        const tipo = delta > 0 ? 'entrada' : 'saida';
        await pool.query(
          `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em) VALUES (?, ?, ?, ?)`,
          [id, tipo, Math.abs(delta), new Date()]
        );
      }
      const [produto] = await pool.query('SELECT * FROM produto WHERE id = ?', [id]);
      res.json(produto[0]);
    } else {
      res.status(404).json({ error: 'Produto não encontrado!' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

router.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM produto WHERE id = ?', [id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
});

// Health-check
app.get('/', (_, res) => res.send('OK'));

// Usa o router em /api
app.use('/api', router);

// Inicia servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
});
