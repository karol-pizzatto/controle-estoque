// src/App.jsx
import React, { useState } from 'react';
import { ProdutoForm } from './components/ProdutoForm';
import { ProdutoList } from './components/ProdutoList';
import { Relatorio }    from './components/Relatorio';
import ClientForm       from './components/ClientForm'; 

export default function App() {
  const [produtoEdit, setProdutoEdit] = useState(null);
  const [reload, setReload]           = useState(false);
  const [view, setView]               = useState('crud');

  return (
    <main className="container">
      <h1>Vital Água — Sistema de Estoque</h1>

      <nav className="filters" role="navigation" aria-label="Menu principal">
        <button
          className="btnPrimary"
          onClick={() => setView('crud')}
          aria-pressed={view === 'crud'}
        >
          Gerenciar Estoque
        </button>
        <button
          className="btnPrimary"
          onClick={() => setView('relatorio')}
          aria-pressed={view === 'relatorio'}
        >
          Relatório Diário
        </button>
        <button
          className="btnPrimary"
          onClick={() => setView('clientes')}
          aria-pressed={view === 'clientes'}
        >
          Cadastro de Clientes
        </button>
      </nav>

      {view === 'crud' ? (
        <>
          <ProdutoForm
            produtoEdit={produtoEdit}
            onSave={() => {
              setProdutoEdit(null);
              setReload(r => !r);
            }}
          />
          <ProdutoList
            key={reload}
            reload={reload}
            onEdit={setProdutoEdit}
          />
        </>
      ) : view === 'relatorio' ? (
        <Relatorio />
      ) : (
        <ClientForm />
      )}
    </main>
  );
}
