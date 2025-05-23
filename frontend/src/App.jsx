import React, { useState } from 'react'
import { ProdutoForm } from './components/ProdutoForm'
import { ProdutoList } from './components/ProdutoList'

export default function App() {
  const [produtoEdit, setProdutoEdit] = useState(null)
  const [reload, setReload] = useState(false)

  return (
    <main style={{ padding:'1rem', maxWidth:'600px', margin:'auto' }}>
      <h1>Controle de Estoque – Vital Água</h1>
      <ProdutoForm
        produtoEdit={produtoEdit}
        onSave={p => {
          setProdutoEdit(null)
          setReload(r => !r)
        }}
      />
      <ProdutoList
        key={reload}
        onEdit={p => setProdutoEdit(p)}
      />
    </main>
  )
}
