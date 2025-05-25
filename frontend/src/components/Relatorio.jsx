import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;

export function Relatorio() {
  const [estoque, setEstoque] = useState([])
  const [movimentos, setMovimentos] = useState({})
  const hoje = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    axios.get(`${API_URL}/relatorios/estoque`)
      .then(res => setEstoque(res.data))
      .catch(console.error);
    axios.get(`${API_URL}/relatorios/movimentos/${hoje}`)
      .then(res => setMovimentos(res.data))
      .catch(console.error);
  }, [hoje]);

  const dadosGrafico = estoque.map(p => ({
    nome: p.nome,
    estoque: p.quantidade,
    entrada: movimentos[p.id]?.entrada || 0,
    saida: movimentos[p.id]?.saida || 0
  }));

  return (
    <section style={{ padding: '1rem' }}>
      <h2>Relatório Diário — {hoje}</h2>
      <h3>Estoque Atual</h3>
      <table>
        <thead>
          <tr><th>Produto</th><th>Qtd</th><th>Min</th></tr>
        </thead>
        <tbody>
          {estoque.map(p => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.quantidade}</td>
              <td>{p.minimo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Entradas x Saídas</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={dadosGrafico}>
            <XAxis dataKey="nome" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="entrada" name="Entradas" />
            <Bar dataKey="saida" name="Saídas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
