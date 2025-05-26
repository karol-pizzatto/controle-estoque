import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ProdutoForm.module.css';

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
      setNome(''); setMarca(''); setQuantidade(0);
      setMinimo(0); setDataValidade(''); setValorCusto(0);
      setValorVenda(0);
      return;
    }
    setNome(produtoEdit.nome || '');
    setMarca(produtoEdit.marca || '');
    setQuantidade(produtoEdit.quantidade ?? 0);
    setMinimo(produtoEdit.minimo ?? 0);

    if (produtoEdit.data_validade) {
      const iso = new Date(produtoEdit.data_validade)
        .toISOString().split('T')[0];
      setDataValidade(iso);
    } else {
      setDataValidade('');
    }

    setValorCusto(produtoEdit.valor_custo ?? 0);
    setValorVenda(produtoEdit.valor_venda ?? 0);
  }, [produtoEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome, marca,
      quantidade,
      minimo,
      data_validade: dataValidade || null,
      valor_custo: valorCusto,
      valor_venda: valorVenda
    };
    try {
      if (produtoEdit?.id) {
        await axios.put(`${API_URL}/produtos/${produtoEdit.id}`, payload);
      } else {
        await axios.post(`${API_URL}/produtos`, payload);
      }
      onSave && onSave();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Não foi possível salvar o produto.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
      aria-label={produtoEdit ? 'Formulário de edição de produto' : 'Formulário de cadastro de produto'}
    >
      <div className={styles.field}>
        <label htmlFor="nome">Nome:</label>
        <input
          id="nome"
          className={styles.input}
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="marca">Marca:</label>
        <input
          id="marca"
          className={styles.input}
          value={marca}
          onChange={e => setMarca(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="quantidade">Quantidade:</label>
        <input
          id="quantidade"
          type="number"
          className={styles.input}
          value={quantidade}
          onChange={e => setQuantidade(+e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="minimo">Estoque Mínimo:</label>
        <input
          id="minimo"
          type="number"
          className={styles.input}
          value={minimo}
          onChange={e => setMinimo(+e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="dataValidade">Data de Validade:</label>
        <input
          id="dataValidade"
          type="date"
          className={styles.input}
          value={dataValidade}
          onChange={e => setDataValidade(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="valorCusto">Valor de Custo:</label>
        <input
          id="valorCusto"
          type="number"
          className={styles.input}
          step="0.01"
          value={valorCusto}
          onChange={e => setValorCusto(+e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="valorVenda">Valor de Venda:</label>
        <input
          id="valorVenda"
          type="number"
          className={styles.input}
          step="0.01"
          value={valorVenda}
          onChange={e => setValorVenda(+e.target.value)}
          required
        />
      </div>

      <div>
        <button
          type="submit"
          className={styles.btnPrimary}
          aria-label={produtoEdit ? 'Atualizar produto' : 'Cadastrar produto'}
        >
          {produtoEdit ? 'Atualizar' : 'Cadastrar'}
        </button>
        {produtoEdit && (
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => onSave(null)}
            aria-label="Cancelar edição de produto"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
