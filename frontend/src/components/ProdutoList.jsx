import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export function ProdutoList({ onEdit }) {
  const [produtos, setProdutos] = useState([]);

  const carregar = async () => {
    try {
      const response = await axios.get(`${API_URL}/produtos`);
      setProdutos(response.data);
    } catch (err) {
      console.error('Falha ao carregar produtos:', err);
      alert('Não foi possível carregar os produtos.');
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const excluir = async (id) => {
    if (!window.confirm('Confirma exclusão deste produto?')) return;
    try {
      await axios.delete(`${API_URL}/produtos/${id}`);
      carregar();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Não foi possível excluir o produto.');
    }
  };

  const algumBaixo = produtos.some(p => (p.quantidade ?? 0) <= (p.minimo ?? 0));

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
            const baixo = (p.quantidade ?? 0) <= (p.minimo ?? 0);

            // formata data YYYY-MM-DD → DD-MM-YYYY
            const validade = p.data_validade
              ? new Date(p.data_validade).toLocaleDateString('pt-BR')
              : '';

            // converte strings DECIMAL para número antes de toFixed
            const custoFormatado = Number(p.valor_custo ?? 0).toFixed(2);
            const vendaFormatada = Number(p.valor_venda ?? 0).toFixed(2);

            return (
              <tr key={p.id} style={baixo ? { background: '#fdd' } : {}}>
                <td>{p.nome}</td>
                <td>{p.marca}</td>
                <td>{p.quantidade ?? 0}</td>
                <td>{p.minimo ?? 0}</td>
                <td>{validade}</td>
                <td>{custoFormatado}</td>
                <td>{vendaFormatada}</td>
                <td>
                  <button onClick={() => onEdit(p)} title={`Editar ${p.nome}`}>
                    ✏️
                  </button>{' '}
                  <button onClick={() => excluir(p.id)} title={`Excluir ${p.nome}`}>
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
