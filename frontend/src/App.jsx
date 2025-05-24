import React, { useState } from 'react'
import { ProdutoForm } from './components/ProdutoForm'
import { ProdutoList } from './components/ProdutoList'
import { Relatorio } from './components/Relatorio'

export default function App() {
  // ─── Hooks de estado (sempre no topo) ───────────────────────────
  const [produtoEdit, setProdutoEdit] = useState(null)
  const [reload, setReload]           = useState(false)
  const [view, setView]               = useState('crud')

  // ─── Renderização ────────────────────────────────────────────────
  return (
    <main style={{ padding: '1rem', maxWidth: '800px', margin: 'auto' }}>
      <h1>Vital Água — Sistema de Estoque</h1>

      <nav style={{ marginBottom: '1rem' }}>
        <button onClick={() => setView('crud')}>Gerenciar Estoque</button>
        <button
          onClick={() => setView('relatorio')}
          style={{ marginLeft: '1rem' }}
        >
          Relatório Diário
        </button>
      </nav>

      {view === 'crud' ? (
        <>
          <ProdutoForm
            produtoEdit={produtoEdit}
            onSave={(p) => {
              // depois de salvar, limpa edição e força recarga da lista
              setProdutoEdit(null)
              setReload((r) => !r)
            }}
          />
          <ProdutoList
            key={reload}
            onEdit={(p) => {
              setProdutoEdit(p)
            }}
          />
        </>
      ) : (
        <Relatorio />
      )}
    </main>
  )
}
