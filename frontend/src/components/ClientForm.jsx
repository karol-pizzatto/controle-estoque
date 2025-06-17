import React, { useState, useEffect } from 'react';
import { db, serverTimestamp, collection, addDoc, getDocs, query, orderBy } from '../firebase';

const ClientForm = () => {
  const [formData, setFormData] = useState({ nome: '', telefone: '', email: '', endereco: '' });
  const [message, setMessage] = useState('');
  const [clientes, setClientes] = useState([]);

  const fetchClientes = async () => {
    const q = query(collection(db, 'clientes'), orderBy('criado_em', 'desc'));
    const snapshot = await getDocs(q);
    setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'clientes'), {
        ...formData,
        criado_em: serverTimestamp()
      });
      setMessage('Cliente cadastrado com sucesso!');
      setFormData({ nome: '', telefone: '', email: '', endereco: '' });
      fetchClientes();
    } catch (error) {
      console.error(error);
      setMessage('Erro ao cadastrar cliente.');
    }
  };

  return (
    <div className="client-form">
      <h2>Cadastro de Clientes</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
        <input name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} />
        <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
        <textarea name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleChange} />
        <button type="submit">Cadastrar Cliente</button>
      </form>
      <ul>
        {clientes.map(c => (
          <li key={c.id}>{c.nome} - {c.email}</li>
        ))}
      </ul>
    </div>
  );
};

export default ClientForm;