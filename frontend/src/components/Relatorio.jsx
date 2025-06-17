import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL;

export function Relatorio() {
  const [estoque, setEstoque] = useState([]);
  const [movimentos, setMovimentos] = useState({ entradas: [], saidas: [] });
  const [filtroProduto, setFiltroProduto] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const relatorioRef = useRef();

  useEffect(() => {
    axios.get(`${API_URL}/api/relatorios/estoque`)
      .then(res => setEstoque(res.data))
      .catch(err => console.error('Erro ao buscar estoque:', err));
  }, []);

  const fetchMovimentos = () => {
    if (!dataInicio || !dataFim) return;
    axios.get(`${API_URL}/api/relatorios/movimentos`, {
      params: { inicio: dataInicio, fim: dataFim, produto: filtroProduto || undefined }
    })
    .then(res => setMovimentos(res.data))
    .catch(err => console.error('Erro nos movimentos filtrados:', err));
  };

  const handleExportPDF = () => {
    if (!dataInicio || !dataFim) return alert('Defina datas antes de exportar.');
    const params = new URLSearchParams({ inicio: dataInicio, fim: dataFim, produto: filtroProduto || '' });
    window.open(`${API_URL}/api/relatorios/pdf?${params}`, '_blank');
  };

  const chartData = estoque
    .filter(p => !filtroProduto || p.nome === filtroProduto)
    .map(p => {
      const ent = movimentos.entradas.filter(m => m.produto === p.nome)
        .reduce((a, b) => a + b.quantidade, 0);
      const sai= movimentos.saidas.filter(m => m.produto === p.nome)
        .reduce((a, b) => a + b.quantidade, 0);
      return { name: p.nome, Entradas: ent, Saídas: sai };
    })
    .filter(d => d.Entradas || d.Saídas);

  return (
    <main className="container">
      <section aria-labelledby="titulo-relatorio">
        <h1 id="titulo-relatorio">Relatório Personalizado</h1>

        <div className="filters" role="group" aria-labelledby="filtros-relatorio">
          <h2 id="filtros-relatorio" className="sr-only">Filtros de Relatório</h2>

          <div className="field">
            <label htmlFor="dataInicio">Data Início:</label>
            <input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="dataFim">Data Fim:</label>
            <input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="produtoFiltro">Produto:</label>
            <select
              id="produtoFiltro"
              value={filtroProduto}
              onChange={e => setFiltroProduto(e.target.value)}
            >
              <option value="">Todos</option>
              {estoque.map(p => (
                <option key={p.nome} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          <button className="btnPrimary" onClick={fetchMovimentos} aria-label="Aplicar filtros ao relatório">
            Aplicar Filtros
          </button>

          <button className="btnPrimary" onClick={handleExportPDF} aria-label="Exportar relatório para PDF">
            Exportar PDF
          </button>
        </div>

        <h2>Estoque Atual</h2>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Qtd</th>
              <th scope="col">Mín</th>
            </tr>
          </thead>
          <tbody>
            {estoque
              .filter(p => !filtroProduto || p.nome === filtroProduto)
              .map(p => (
                <tr key={p.nome}>
                  <td>{p.nome}</td>
                  <td style={{ textAlign: 'right' }}>{p.quantidade}</td>
                  <td style={{ textAlign: 'right' }}>{p.minimo}</td>
                </tr>
            ))}
          </tbody>
        </table>

        <h2>Entradas x Saídas</h2>
        <div className="responsive-container">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Entradas" />
                <Bar dataKey="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p aria-live="polite">Sem dados para o período selecionado.</p>
          )}
        </div>
      </section>
    </main>
  );
}