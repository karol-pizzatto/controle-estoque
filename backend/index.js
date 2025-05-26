const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2/promise');
const PDFDocument = require('pdfkit');

const app    = express();
const router = express.Router();

const pool = mysql.createPool({
  host:             '34.95.223.214',
  user:             'adminK',
  password:         'Neosoro30vida',
  database:         'estoqueVital',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// CORS unificado para dev e prod
const allowedOrigins = [
  'http://localhost:5173',
  'https://controleestoquevitalagua.web.app',
  'https://vitalagua-api-347908612509.southamerica-east1.run.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} não permitida pelo CORS`));
  },
  credentials: true
}));

app.use(express.json());

// Health-check (antes das rotas)
app.get('/', (_, res) => res.send('OK'));

// ROTAS CRUD de produto
router.get('/produtos', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM produto');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

router.post('/produtos', async (req, res) => {
  try {
    const {
      nome,
      marca,
      quantidade    = 0,
      minimo        = 0,
      data_validade = null,
      valor_custo   = 0,
      valor_venda   = 0
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO produto
         (nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda]
    );

    // registra movimento de entrada inicial
    await pool.query(
      `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
       VALUES (?, 'entrada', ?, ?)`,
      [result.insertId, quantidade, new Date()]
    );

    const [produto] = await pool.query('SELECT * FROM produto WHERE id = ?', [result.insertId]);
    res.status(201).json(produto[0]);
  } catch (err) {
    console.error('Erro ao cadastrar produto:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

router.put('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      marca,
      quantidade,
      minimo,
      data_validade,
      valor_custo,
      valor_venda
    } = req.body;

    const [[{ quantidade: qtdAntes }]] = await pool.query(
      'SELECT quantidade FROM produto WHERE id = ?',
      [id]
    );

    await pool.query(
      `UPDATE produto SET
         nome         = COALESCE(?, nome),
         marca        = COALESCE(?, marca),
         quantidade   = COALESCE(?, quantidade),
         minimo       = COALESCE(?, minimo),
         data_validade= COALESCE(?, data_validade),
         valor_custo  = COALESCE(?, valor_custo),
         valor_venda  = COALESCE(?, valor_venda)
       WHERE id = ?`,
      [nome, marca, quantidade, minimo, data_validade, valor_custo, valor_venda, id]
    );

    const [[{ quantidade: qtdDepois }]] = await pool.query(
      'SELECT quantidade FROM produto WHERE id = ?',
      [id]
    );

    const delta = (qtdDepois ?? 0) - (qtdAntes ?? 0);
    if (delta !== 0) {
      const tipo = delta > 0 ? 'entrada' : 'saida';
      await pool.query(
        `INSERT INTO movimento (produto_id, tipo, quantidade, criado_em)
         VALUES (?, ?, ?, ?)`,
        [id, tipo, Math.abs(delta), new Date()]
      );
    }

    const [produto] = await pool.query('SELECT * FROM produto WHERE id = ?', [id]);
    res.json(produto[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

router.delete('/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM movimento WHERE produto_id = ?', [id]);
    await pool.query('DELETE FROM produto WHERE id = ?', [id]);
    res.status(204).end();
  } catch (err) {
    console.error('Erro ao excluir produto:', err);
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
});

// 1) Estoque atual
router.get('/relatorios/estoque', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT nome, quantidade, minimo FROM produto'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar estoque:', err);
    res.status(500).json({ erro: 'Falha ao buscar estoque.' });
  }
});

// 2) Movimentos filtrados por data e produto
//    GET /api/relatorios/movimentos?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&produto=Nome
router.get('/relatorios/movimentos', async (req, res) => {
  try {
    const { inicio, fim, produto } = req.query;
    if (!inicio || !fim) {
      return res.status(400).json({
        erro: 'Informe inicio e fim no formato YYYY-MM-DD'
      });
    }

    const params = [inicio, fim];
    let sql = `
      SELECT
        p.nome   AS produto,
        m.tipo,
        m.quantidade,
        DATE(m.criado_em) AS data
      FROM movimento m
      JOIN produto p ON p.id = m.produto_id
      WHERE DATE(m.criado_em) BETWEEN ? AND ?
    `;
    if (produto) {
      sql += ' AND p.nome = ?';
      params.push(produto);
    }

    const [rows] = await pool.query(sql, params);
    const entradas = rows.filter(r => r.tipo === 'entrada');
    const saidas   = rows.filter(r => r.tipo === 'saida');
    res.json({ entradas, saidas });
  } catch (err) {
    console.error('Erro ao buscar movimentos:', err);
    res.status(500).json({ erro: 'Falha ao buscar movimentos.' });
  }
});

// 3) PDF completo (estoque + movimentos)
router.get('/relatorios/pdf', async (req, res) => {
  try {
    const { inicio, fim, produto } = req.query;
    if (!inicio || !fim) {
      return res.status(400).json({
        erro: 'Informe inicio e fim no formato YYYY-MM-DD'
      });
    }

    // busca estoque
    const [estoqueRows] = await pool.query(
      'SELECT nome, quantidade, minimo FROM produto'
    );

    // busca movimentos
    const paramsBase = [inicio, fim];
    let movSql = `
      SELECT
        p.nome AS produto,
        m.tipo,
        m.quantidade,
        DATE(m.criado_em) AS data
      FROM movimento m
      JOIN produto p ON p.id = m.produto_id
      WHERE DATE(m.criado_em) BETWEEN ? AND ?
    `;
    if (produto) {
      movSql += ' AND p.nome = ?';
      paramsBase.push(produto);
    }
    const [movRows] = await pool.query(movSql, paramsBase);

    // configura headers de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=relatorio_${inicio}_a_${fim}.pdf`
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18)
       .text(`Relatório de ${inicio} a ${fim}`, { align: 'center' })
       .moveDown();

    // Estoque
    doc.fontSize(14).text('Estoque Atual:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX    = 50;
    const qtdX     = 300;
    const minX     = 370;

    doc.fontSize(12)
       .text('Produto', itemX, tableTop)
       .text('Qtd',     qtdX, tableTop)
       .text('Mín',     minX, tableTop);
    doc.moveDown(0.5);

    estoqueRows.forEach((p, i) => {
      const y = tableTop + 20 + i * 20;
      doc.text(p.nome, itemX, y);
      doc.text(String(p.quantidade), qtdX, y);
      doc.text(String(p.minimo),    minX, y);
    });

    doc.moveDown(estoqueRows.length * 0.08 + 1);

    // Movimentos
    doc.fontSize(14).text('Movimentos:', { underline: true });
    doc.moveDown(0.5);

    const movTop = doc.y;
    doc.fontSize(12)
       .text('Data',    itemX,       movTop)
       .text('Produto', itemX + 80,  movTop)
       .text('Tipo',    itemX + 250, movTop)
       .text('Qtd',     itemX + 330, movTop);
    doc.moveDown(0.5);

    movRows.forEach((m, i) => {
      const y = movTop + 20 + i * 20;
      doc.text(m.data,        itemX,       y);
      doc.text(m.produto,     itemX + 80,  y);
      doc.text(m.tipo,        itemX + 250, y);
      doc.text(String(m.quantidade), itemX + 330, y);
    });

    doc.end();
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    res.status(500).json({ erro: 'Falha ao gerar PDF.' });
  }
});

// monta todas as rotas sob /api
app.use('/api', router);

// inicia servidor ouvindo em 0.0.0.0 na porta definida em ENV
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
});
