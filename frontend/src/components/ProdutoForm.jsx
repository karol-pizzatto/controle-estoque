import React, { useState, useEffect } from 'react'

export function ProdutoForm({ produtoEdit, onSave }) {
  const [nome, setNome]                 = useState('')
  const [marca, setMarca]               = useState('')
  const [quantidade, setQuantidade]     = useState(0)
  const [minimo, setMinimo]             = useState(0)
  const [dataValidade, setDataValidade] = useState('')
  const [valorCusto, setValorCusto]     = useState(0)
  const [valorVenda, setValorVenda]     = useState(0)

  useEffect(() => {
    if (produtoEdit) {
      setNome(produtoEdit.nome)
      setMarca(produtoEdit.marca)
      setQuantidade(produtoEdit.quantidade)
      setMinimo(produtoEdit.minimo)

      // Corrigido slice e formatação:
      if (produtoEdit.data_validade) {
        const v = produtoEdit.data_validade
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const [y,m,d] = v.split('-')
          setDataValidade(`${d}-${m}-${y}`)
        } else {
          setDataValidade(v)
        }
      } else {
        setDataValidade('')
      }

      setValorCusto(produtoEdit.valor_custo)
      setValorVenda(produtoEdit.valor_venda)
    }
  }, [produtoEdit])

  const handleSubmit = async e => {
    e.preventDefault()
    const p = {
      nome,
      marca,
      quantidade,
      minimo,
      data_validade: dataValidade,
      valor_custo: valorCusto,
      valor_venda: valorVenda
    }
    await onSave(p)
    // limpa form só depois de salvar
    setNome('')
    setMarca('')
    setQuantidade(0)
    setMinimo(0)
    setDataValidade('')
    setValorCusto(0)
    setValorVenda(0)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      {/* Nome */}
      <div>
        <label htmlFor="nome">Nome:</label><br/>
        <input id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>

      {/* Marca */}
      <div>
        <label htmlFor="marca">Marca:</label><br/>
        <input id="marca" value={marca} onChange={e => setMarca(e.target.value)} required />
      </div>

      {/* Quantidade */}
      <div>
        <label htmlFor="quantidade">Quantidade:</label><br/>
        <input
          id="quantidade"
          type="number"
          value={quantidade}
          onChange={e => setQuantidade(+e.target.value)}
          required
        />
      </div>

      {/* Estoque Mínimo */}
      <div>
        <label htmlFor="minimo">Estoque Mínimo:</label><br/>
        <input
          id="minimo"
          type="number"
          value={minimo}
          onChange={e => setMinimo(+e.target.value)}
          required
        />
      </div>

      {/* Data de Validade */}
      <div>
        <label htmlFor="dataValidade">Data de Validade:</label><br/>
        <input
          id="dataValidade"
          type="date"
          value={dataValidade}
          onChange={e => setDataValidade(e.target.value)}
        />
      </div>

      {/* Valor de Custo */}
      <div>
        <label htmlFor="valorCusto">Valor de Custo:</label><br/>
        <input
          id="valorCusto"
          type="number"
          value={valorCusto}
          onChange={e => setValorCusto(+e.target.value)}
          step="0.01"
          required
        />
      </div>

      {/* Valor de Venda */}
      <div>
        <label htmlFor="valorVenda">Valor de Venda:</label><br/>
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
  )
}
