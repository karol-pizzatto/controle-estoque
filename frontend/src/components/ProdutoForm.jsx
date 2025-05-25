import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export function ProdutoForm({ produtoEdit, onSave }) {
  const [nome, setNome]                 = useState('');
  const [marca, setMarca]               = useState('');
  const [quantidade, setQuantidade]     = useState(0);
  const [minimo, setMinimo]             = useState(0);
  const [dataValidade, setDataValidade] = useState('');
  const [valorCusto, setValorCusto]     = useState(0);
  const [valorVenda, setValorVenda]     = useState(0);

  useEffect(() => {
    if (!produtoEdit) {
      // limpa o formulário quando não há edição
      setNome('');
      setMarca('');
      setQuantidade(0);
      setMinimo(0);
      setDataValidade('');
      setValorCusto(0);
      setValorVenda(0);
      return;
    }

    setNome(produtoEdit.nome || '');
    setMarca(produtoEdit.marca || '');
    setQuantidade(produtoEdit.quantidade ?? 0);
    setMinimo(produtoEdit.minimo ?? 0);

    // converte pra YYYY-MM-DD para o <input type="date">
   if (produtoEdit.data_validade) {
     const d = new Date(produtoEdit.data_validade);
     const iso = d.toISOString().split('T')[0];  
     setDataValidade(iso);
   } else {
     setDataValidade('');
   }

    setValorCusto(produtoEdit.valor_custo ?? 0);
    setValorVenda(produtoEdit.valor_venda ?? 0);
  }, [produtoEdit]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      nome,
      marca,
      quantidade,
      minimo,
      data_validade: dataValidade || null,
      valor_custo: valorCusto,
      valor_venda: valorVenda,
    };

    try {
      if (produtoEdit && produtoEdit.id) {        
        await axios.put(`${API_URL}/produtos/${produtoEdit.id}`, payload);
      } else {       
        await axios.post(`${API_URL}/produtos`, payload);
      }      
      onSave && onSave(); //informa para recarregar a lista
      setNome('');
      setMarca('');
      setQuantidade(0);
      setMinimo(0);
      setDataValidade('');
      setValorCusto(0);
      setValorVenda(0);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Não foi possível salvar o produto.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>      
      <div>
        <label htmlFor="nome">Nome:</label><br />
        <input
          id="nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>
     
      <div>
        <label htmlFor="marca">Marca:</label><br />
        <input
          id="marca"
          value={marca}
          onChange={e => setMarca(e.target.value)}
          required
        />
      </div>
     
      <div>
        <label htmlFor="quantidade">Quantidade:</label><br />
        <input
          id="quantidade"
          type="number"
          value={quantidade}
          onChange={e => setQuantidade(+e.target.value)}
          required
        />
      </div>
     
      <div>
        <label htmlFor="minimo">Estoque Mínimo:</label><br />
        <input
          id="minimo"
          type="number"
          value={minimo}
          onChange={e => setMinimo(+e.target.value)}
          required
        />
      </div>
      
      <div>
        <label htmlFor="dataValidade">Data de Validade:</label><br />
        <input
          id="dataValidade"
          type="date"
          value={dataValidade}
          onChange={e => setDataValidade(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="valorCusto">Valor de Custo:</label><br />
        <input
          id="valorCusto"
          type="number"
          value={valorCusto}
          onChange={e => setValorCusto(+e.target.value)}
          step="0.01"
          required
        />
      </div>

      <div>
        <label htmlFor="valorVenda">Valor de Venda:</label><br />
        <input
          id="valorVenda"
          type="number"
          value={valorVenda}
          onChange={e => setValorVenda(+e.target.value)}
          step="0.01"
          required
        />
      </div>

      <button type="submit">
        {produtoEdit ? 'Atualizar' : 'Cadastrar'}
      </button>
      {produtoEdit && (
        <button
          type="button"
          onClick={() => onSave(null)}
          style={{ marginLeft: '0.5rem' }}
        >
          Cancelar
        </button>
      )}
    </form>
  );
}
