import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { CartaoSerie } from './CartaoSerie.jsx';
import { useBusca } from './consultas.js';

export function PaginaInicio() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() ?? '';
  const [termo, setTermo] = useState(q);
  const [qAnterior, setQAnterior] = useState(q);

  // Mantém o campo em dia quando a busca vem do cabeçalho ou do histórico do navegador
  // (ajuste durante o render, como recomenda o React, em vez de um efeito).
  if (q !== qAnterior) {
    setQAnterior(q);
    setTermo(q);
  }

  // Debounce de 300 ms: busca enquanto digita, sem disparar a cada tecla.
  useEffect(() => {
    const limpo = termo.trim();
    if (limpo === q) return undefined;
    const t = setTimeout(() => setParams(limpo ? { q: limpo } : {}, { replace: true }), 300);
    return () => clearTimeout(t);
  }, [termo, q, setParams]);

  function enviar(evento) {
    evento.preventDefault();
    const limpo = termo.trim();
    setParams(limpo ? { q: limpo } : {});
  }

  const busca = useBusca(q);
  const resultados = busca.data?.pages.flatMap((p) => p.resultados) ?? [];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Encontre uma série</h1>
      <form role="search" onSubmit={enviar}>
        <label htmlFor="busca-principal" className="sr-only">
          Título da série
        </label>
        <input
          id="busca-principal"
          type="search"
          autoFocus
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Ex.: Breaking Bad, The Office, Dark…"
          className="min-h-12 w-full rounded-md border border-borda bg-superficie px-4 text-lg placeholder:text-texto-suave"
        />
      </form>

      {!q && <Vazio mensagem="Busque uma série pelo título." />}
      {q && busca.isPending && <Carregando mensagem="Buscando…" />}
      {q && busca.isError && <Erro erro={busca.error} aoTentarDeNovo={() => busca.refetch()} />}
      {q && busca.isSuccess && resultados.length === 0 && (
        <Vazio mensagem={`Nenhuma série encontrada para “${q}”.`} />
      )}

      {resultados.length > 0 && (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {resultados.map((serie) => (
            <CartaoSerie key={serie.tmdbId} serie={serie} />
          ))}
        </ul>
      )}

      {busca.hasNextPage && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => busca.fetchNextPage()}
            disabled={busca.isFetchingNextPage}
            className="min-h-10 rounded-md border border-borda px-5 hover:bg-superficie disabled:opacity-50"
          >
            {busca.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </section>
  );
}
