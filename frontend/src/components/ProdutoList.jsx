import React, { useEffect, useState } from 'react'
import axios from 'axios'

export function ProdutoList({ onEdit }) {
  const [produtos, setProdutos] = useState([])

  // mantém só esta função
  const carregar = async () => {
    try {
      const response = await axios.get('http://localhost:5000/produtos')
      setProdutos(response.data)
    } catch (err) {
      console.error('Falha ao carregar produtos:', err)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const excluir = async id => {
    if (!window.confirm('Confirma exclusão deste produto?')) return
    await axios.delete(`http://localhost:5000/produtos/${id}`)
    carregar()
  }

  const algumBaixo = produtos.some(p => p.quantidade <= p.minimo)

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
            <th>Nome</th><th>Qtd</th><th>Min</th><th>Localização</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map(p => {
            const baixo = p.quantidade <= p.minimo
            return (
              <tr key={p.id} style={baixo ? { background: '#fdd' } : {}}>
                <td>{p.nome}</td>
                <td>{p.quantidade}</td>
                <td>{p.minimo}</td>
                <td>{p.localizacao}</td>
                <td>
                  <button onClick={() => onEdit(p)} aria-label={`Editar ${p.nome}`}>
                    ✏️
                  </button>{' '}
                  <button onClick={() => excluir(p.id)} aria-label={`Excluir ${p.nome}`}>
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
