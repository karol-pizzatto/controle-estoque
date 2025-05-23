import React, { useState, useEffect } from 'react'
import axios from 'axios'

export function ProdutoForm({ produtoEdit, onSave }) {
  const [nome, setNome] = useState('')
  const [qtde, setQtde] = useState(0)
  const [local, setLocal] = useState('')
  const [minimo, setMinimo] = useState(0)

  useEffect(() => {
    if (produtoEdit) {
      setNome(produtoEdit.nome)
      setQtde(produtoEdit.quantidade)
      setLocal(produtoEdit.localizacao)
      setMinimo(produtoEdit.minimo)
    }
  }, [produtoEdit])

  const handleSubmit = async e => {
    e.preventDefault()
    const payload = { nome, quantidade: qtde, localizacao: local, minimo }
    if (produtoEdit) {
      await axios.put(`/produtos/${produtoEdit.id}`, payload)
    } else {
      await axios.post('/produtos', payload)
    }
    setNome(''); setQtde(0); setLocal(''); setMinimo(0)
    onSave()
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <div>
        <label htmlFor="nome">Nome:</label><br/>
        <input id="nome" value={nome} onChange={e=>setNome(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="qtde">Quantidade:</label><br/>
        <input id="qtde" type="number" value={qtde} onChange={e=>setQtde(+e.target.value)} required />
      </div>
      <div>
        <label htmlFor="minimo">Estoque Mínimo:</label><br/>
        <input id="minimo" type="number" value={minimo} onChange={e=>setMinimo(+e.target.value)} required />
      </div>
      <div>
        <label htmlFor="local">Localização:</label><br/>
        <input id="local" value={local} onChange={e=>setLocal(e.target.value)} />
      </div>
      <button type="submit">{produtoEdit ? 'Atualizar' : 'Cadastrar'}</button>
      {produtoEdit && (
        <button type="button" onClick={() => onSave(null)} style={{ marginLeft: '0.5rem' }}>
          Cancelar
        </button>
      )}
    </form>
  )
}
