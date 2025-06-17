import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export function ProdutoList({ onEdit }) {
  const [produtos, setProdutos] = useState([]);

  const carregar = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/produtos`);
      setProdutos(data);
    } catch (err) {
      console.error('Falha ao carregar produtos:', err);
      alert('Não foi possível carregar os produtos.');
    }
  };

  useEffect(() => { carregar(); }, []);

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

  const algumBaixo = produtos.some(
    p => (p.quantidade ?? 0) <= (p.minimo ?? 0)
  );

  return (
    <div>
      {algumBaixo && (
        <div role="alert" className="alert">
          ⚠️ Atenção: alguns produtos estão com estoque baixo!
        </div>
      )}

      <table className="table" aria-label="Lista de Produtos">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Marca</th>
            <th scope="col">Qtd</th>
            <th scope="col">Min</th>
            <th scope="col">Validade</th>
            <th scope="col">Custo</th>
            <th scope="col">Venda</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(p => {
            const baixo = (p.quantidade ?? 0) <= (p.minimo ?? 0);
            const validade = p.data_validade
              ? new Date(p.data_validade).toLocaleDateString('pt-BR')
              : '';
            const custoFormatado = Number(p.valor_custo ?? 0).toFixed(2);
            const vendaFormatada = Number(p.valor_venda ?? 0).toFixed(2);

            return (
              <tr
                key={p.id}
                className={baixo ? 'lowStock' : undefined}
              >
                <td>{p.nome}</td>
                <td>{p.marca}</td>
                <td>{p.quantidade ?? 0}</td>
                <td>{p.minimo ?? 0}</td>
                <td>{validade}</td>
                <td>{custoFormatado}</td>
                <td>{vendaFormatada}</td>
                <td>
                  <button
                    type="button"
                    className="btnIcon"
                    onClick={() => onEdit(p)}
                    aria-label={`Editar ${p.nome}`}>
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btnIcon"
                    onClick={() => excluir(p.id)}
                    aria-label={`Excluir ${p.nome}`}>
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