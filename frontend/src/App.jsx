import React, { useState } from 'react'
import { ProdutoForm } from './components/ProdutoForm'
import { ProdutoList } from './components/ProdutoList'
import { Relatorio } from './components/Relatorio'

export default function App() {
  const [produtoEdit, setProdutoEdit] = useState(null)
  const [reload, setReload] = useState(false)
const [view, setView] = useState('crud') // 'crud' ou 'relatorio'

  return (
    <main style={{ padding:'1rem', maxWidth:'800px', margin:'auto' }}>
      <h1>Vital Água — Sistema de Estoque</h1>
      <nav>
       <button onClick={() => setView('crud')}>CRUD</button>
       <button onClick={() => setView('relatorio')} style={{ marginLeft: '1rem' }}>Relatório Diário</button>
     </nav>

+    {view === 'crud' ? (
        <>
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
        </>
      ) : (
        <Relatorio />
      )}
    </main>
  )
}
