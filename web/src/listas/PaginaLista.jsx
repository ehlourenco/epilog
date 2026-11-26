import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { Poster } from '../componentes/Poster.jsx';
import {
  useEditarLista,
  useExcluirLista,
  useLista,
  useRemoverDaLista,
  useReordenarLista,
} from './consultas.js';

function EdicaoLista({ lista, aoTerminar }) {
  const editar = useEditarLista(lista.id);
  const [titulo, setTitulo] = useState(lista.titulo);
  const [visibilidade, setVisibilidade] = useState(lista.visibilidade);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        editar.mutate({ titulo, visibilidade }, { onSuccess: aoTerminar });
      }}
      className="flex flex-wrap items-end gap-3 rounded-md border border-borda bg-superficie p-3"
    >
      <div className="space-y-1">
        <label htmlFor="editar-titulo" className="block text-sm">
          Título
        </label>
        <input
          id="editar-titulo"
          required
          maxLength={80}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="min-h-10 rounded-md border border-borda bg-fundo px-3"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="editar-visibilidade" className="block text-sm">
          Visibilidade
        </label>
        <select
          id="editar-visibilidade"
          value={visibilidade}
          onChange={(e) => setVisibilidade(e.target.value)}
          className="min-h-10 rounded-md border border-borda bg-fundo px-3"
        >
          <option value="privada">Privada</option>
          <option value="publica">Pública</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={editar.isPending}
        className="min-h-10 rounded-md bg-destaque px-4 font-semibold text-fundo"
      >
        Salvar
      </button>
      <button
        type="button"
        onClick={aoTerminar}
        className="min-h-10 rounded-md border border-borda px-4"
      >
        Cancelar
      </button>
      {editar.isError && (
        <p role="alert" className="w-full text-sm text-perigo">
          {editar.error.message}
        </p>
      )}
    </form>
  );
}

export function PaginaLista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lista = useLista(id);
  const remover = useRemoverDaLista();
  const reordenar = useReordenarLista(id);
  const excluir = useExcluirLista(id);
  const [editando, setEditando] = useState(false);

  if (lista.isPending) return <Carregando />;
  if (lista.isError && [400, 404].includes(lista.error.status))
    return <Vazio mensagem="Lista não encontrada." />;
  if (lista.isError) return <Erro erro={lista.error} aoTentarDeNovo={lista.refetch} />;

  const l = lista.data;
  const podeEditar = l.souDono && l.tipo === 'personalizada';
  const ocupado = remover.isPending || reordenar.isPending;

  function mover(indice, deslocamento) {
    const ids = l.itens.map((i) => i.tmdbId);
    [ids[indice], ids[indice + deslocamento]] = [ids[indice + deslocamento], ids[indice]];
    reordenar.mutate(ids);
  }

  function apagarLista() {
    if (window.confirm(`Excluir a lista "${l.titulo}"?`)) {
      excluir.mutate(undefined, { onSuccess: () => navigate('/me/listas') });
    }
  }

  const erro = remover.error ?? reordenar.error ?? excluir.error;
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{l.titulo}</h1>
        <p className="text-sm text-texto-suave">
          Lista {l.visibilidade === 'publica' ? 'pública' : 'privada'} de{' '}
          <Link to={`/u/${l.dono.apelido}`} className="underline">
            @{l.dono.apelido}
          </Link>{' '}
          · {l.itens.length} {l.itens.length === 1 ? 'série' : 'séries'}
        </p>
        {podeEditar && !editando && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="min-h-10 rounded-md border border-borda px-4"
            >
              Editar lista
            </button>
            <button
              type="button"
              onClick={apagarLista}
              className="min-h-10 rounded-md px-4 text-perigo hover:bg-superficie"
            >
              Excluir lista
            </button>
          </div>
        )}
        {editando && <EdicaoLista lista={l} aoTerminar={() => setEditando(false)} />}
      </header>
      {erro && (
        <p role="alert" className="text-sm text-perigo">
          {erro.message}
        </p>
      )}
      {l.itens.length === 0 ? (
        <Vazio mensagem="Lista vazia. Adicione séries pela página de cada série." />
      ) : (
        <ol className="space-y-2">
          {l.itens.map((item, indice) => (
            <li
              key={item.tmdbId}
              className="flex items-center gap-3 rounded-md border border-borda bg-superficie p-3"
            >
              <span className="w-6 text-right text-texto-suave">{indice + 1}.</span>
              <Poster url={item.posterUrl} nome={item.nome} tamanho="pequeno" />
              <Link
                to={`/series/${item.tmdbId}`}
                className="min-w-0 flex-1 truncate font-medium hover:text-destaque"
              >
                {item.nome}
              </Link>
              {l.souDono && (
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Subir ${item.nome}`}
                    disabled={ocupado || indice === 0}
                    onClick={() => mover(indice, -1)}
                    className="min-h-10 min-w-10 rounded-md border border-borda disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Descer ${item.nome}`}
                    disabled={ocupado || indice === l.itens.length - 1}
                    onClick={() => mover(indice, 1)}
                    className="min-h-10 min-w-10 rounded-md border border-borda disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${item.nome}`}
                    disabled={ocupado}
                    onClick={() => remover.mutate({ listaId: l.id, tmdbId: item.tmdbId })}
                    className="min-h-10 rounded-md px-3 text-sm text-perigo hover:bg-fundo disabled:opacity-30"
                  >
                    Remover
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
