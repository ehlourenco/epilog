import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { useEstadoSerie } from '../catalogo/consultas.js';
import { useAdicionarNaLista, useRemoverDaLista } from './consultas.js';

// "Adicionar à lista": marca/desmarca a série nas listas personalizadas do usuário.
export function SeletorListas({ tmdbId }) {
  const { sessao } = useAuth();
  const estado = useEstadoSerie(tmdbId);
  const adicionar = useAdicionarNaLista();
  const remover = useRemoverDaLista();
  const [aberto, setAberto] = useState(false);
  if (!sessao || !estado.data) return null;
  const listas = estado.data.listas;
  const ocupado = adicionar.isPending || remover.isPending;
  const erro = adicionar.error ?? remover.error;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="min-h-10 rounded-md border border-borda px-4 hover:border-destaque"
      >
        Adicionar à lista ▾
      </button>
      {aberto && (
        <div className="absolute z-10 mt-1 w-64 rounded-md border border-borda bg-superficie p-3 shadow-lg">
          {listas.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Você ainda não tem listas.{' '}
              <Link to="/me/listas" className="underline">
                Criar uma lista
              </Link>
            </p>
          ) : (
            <fieldset disabled={ocupado} className="space-y-1">
              <legend className="sr-only">Suas listas</legend>
              {listas.map((l) => (
                <label key={l.id} className="flex min-h-10 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={l.contem}
                    onChange={() =>
                      (l.contem ? remover : adicionar).mutate({ listaId: l.id, tmdbId })
                    }
                    className="size-4"
                  />
                  {l.titulo}
                </label>
              ))}
            </fieldset>
          )}
          {erro && (
            <p role="alert" className="mt-2 text-sm text-perigo">
              {erro.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
