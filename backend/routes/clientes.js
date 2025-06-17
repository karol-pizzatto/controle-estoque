// //rotas de clientes
// const express = require('express');
// const router = express.Router();
// const db = require('../firebase');

// // GET todos os clientes
// router.get('/', async (req, res) => {
//   try {
//     const snapshot = await db.collection('clientes').orderBy('criado_em', 'desc').get();
//     const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     res.json(clientes);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Erro ao buscar clientes' });
//   }
// });

// // POST novo cliente
// router.post('/', async (req, res) => {
//   try {
//     const { nome, telefone, email, endereco } = req.body;
//     const novoRef = await db.collection('clientes').add({
//       nome,
//       telefone,
//       email,
//       endereco,
//       criado_em: admin.firestore.FieldValue.serverTimestamp()
//     });
//     res.status(201).json({ message: 'Cliente cadastrado', id: novoRef.id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Erro ao cadastrar cliente' });
//   }
// });

// module.exports = router;
