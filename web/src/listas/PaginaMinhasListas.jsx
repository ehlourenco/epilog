import { useState } from 'react';
import { Link } from 'react-router';
import { Carregando, Erro } from '../componentes/Estados.jsx';
import { useCriarLista, useMinhasListas } from './consultas.js';

const ROTULO = { publica: 'Pública', privada: 'Privada' };

function NovaLista() {
  const criar = useCriarLista();
  const [titulo, setTitulo] = useState('');
  const [visibilidade, setVisibilidade] = useState('privada');

  function enviar(evento) {
    evento.preventDefault();
    criar.mutate({ titulo, visibilidade }, { onSuccess: () => setTitulo('') });
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-md border border-borda bg-superficie p-4">
      <h2 className="text-lg font-semibold">Nova lista</h2>
      <div className="space-y-1">
        <label htmlFor="titulo-lista" className="block text-sm">
          Título
        </label>
        <input
          id="titulo-lista"
          required
          maxLength={80}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="min-h-11 w-full rounded-md border border-borda bg-fundo px-3"
        />
      </div>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="mb-1 text-sm">Quem pode ver</legend>
        {['privada', 'publica'].map((v) => (
          <label key={v} className="flex min-h-10 items-center gap-2">
            <input
              type="radio"
              name="visibilidade"
              value={v}
              checked={visibilidade === v}
              onChange={() => setVisibilidade(v)}
            />
            {v === 'publica' ? 'Pública (aparece no seu perfil)' : 'Privada (só você)'}
          </label>
        ))}
      </fieldset>
      {criar.isError && (
        <p role="alert" className="text-sm text-perigo">
          {criar.error.message}
        </p>
      )}
      <button
        type="submit"
        disabled={criar.isPending}
        className="min-h-11 rounded-md bg-destaque px-5 font-semibold text-fundo disabled:opacity-60"
      >
        {criar.isPending ? 'Criando…' : 'Criar lista'}
      </button>
    </form>
  );
}

export function PaginaMinhasListas() {
  const listas = useMinhasListas();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Minhas listas</h1>
      {listas.isPending && <Carregando />}
      {listas.isError && <Erro erro={listas.error} aoTentarDeNovo={listas.refetch} />}
      {listas.data && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {listas.data.map((l) => (
            <li key={l.id}>
              <Link
                to={`/listas/${l.id}`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-borda bg-superficie px-4 py-3 hover:border-destaque"
              >
                <span className="font-semibold">{l.titulo}</span>
                <span className="text-right text-sm text-texto-suave">
                  {l.qtdItens} {l.qtdItens === 1 ? 'série' : 'séries'} · {ROTULO[l.visibilidade]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NovaLista />
    </div>
  );
}
