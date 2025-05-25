import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export function ProdutoList({ onEdit }) {
  const [produtos, setProdutos] = useState([]);

  // 1) Busca via endpoint reescrito 
  const carregar = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(data);
    } catch (err) {
      console.error('Falha ao carregar produtos:', err);
      alert('Não foi possível carregar os produtos.');
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async id => {
    if (!window.confirm('Confirma exclusão deste produto?')) return;
    try {
      await axios.delete(`${API_URL}/produtos/${produtoId}`);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Não foi possível excluir o produto.');
    }
  };

  const algumBaixo = produtos.some(p => p.quantidade <= p.minimo);

  return (
    <div>
      {algumBaixo && (
        <div
          role="alert"
          style={{ padding: '0.5rem', background: '#fcc', marginBottom: '1rem' }}
        >
          ⚠️ Atenção: alguns produtos estão com estoque baixo!
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Marca</th>
            <th>Qtd</th>
            <th>Min</th>
            <th>Validade</th>
            <th>Custo</th>
            <th>Venda</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(p => {
            const baixo = p.quantidade <= p.minimo;

            // 2) Formata data de validade para DD-MM-YYYY
            let validade = '';
            if (p.data_validade) {
              const [y, m, d] = p.data_validade.split('-');
              validade = `${d}-${m}-${y}`;
            }

            return (
              <tr key={p.id} style={baixo ? { background: '#fdd' } : {}}>
                <td>{p.nome}</td>
                <td>{p.marca}</td>
                <td>{p.quantidade}</td>
                <td>{p.minimo}</td>
                <td>{validade}</td>
                <td>{p.valor_custo.toFixed(2)}</td>
                <td>{p.valor_venda.toFixed(2)}</td>
                <td>
                  <button onClick={() => onEdit(p)} title={`Editar ${p.nome}`}>
                    ✏️
                  </button>{' '}
                  <button onClick={() => excluir(p.id)} title={`Excluir ${p.nome}`}>
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}
