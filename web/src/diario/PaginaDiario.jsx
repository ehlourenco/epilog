import { Link } from 'react-router';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { Poster } from '../componentes/Poster.jsx';
import { BarraProgresso } from './BarraProgresso.jsx';
import { useDiario, useProgresso } from './consultas.js';
import { ItemRegistro } from './RegistrosEpisodio.jsx';

const nomeTemporada = (n) => (n === 0 ? 'Especiais' : `Temporada ${n}`);

function Progresso() {
  const progresso = useProgresso();
  if (progresso.isPending) return <Carregando />;
  if (progresso.isError) return <Erro erro={progresso.error} aoTentarDeNovo={progresso.refetch} />;
  if (progresso.data.length === 0) {
    return <Vazio mensagem="Nenhuma temporada em andamento. Registre um episódio para começar." />;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {progresso.data.map((p) => (
        <li key={`${p.serieTmdbId}-${p.temporadaNumero}`}>
          <Link
            to={`/series/${p.serieTmdbId}/temporadas/${p.temporadaNumero}`}
            className="flex gap-3 rounded-md border border-borda bg-superficie p-3 hover:border-destaque"
          >
            <Poster url={p.posterUrl} nome={p.serieNome} tamanho="pequeno" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-semibold">{p.serieNome}</p>
              <p className="text-sm text-texto-suave">{nomeTemporada(p.temporadaNumero)}</p>
              <BarraProgresso assistidos={p.assistidos} total={p.total} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Registros() {
  const diario = useDiario();
  if (diario.isPending) return <Carregando />;
  if (diario.isError) return <Erro erro={diario.error} aoTentarDeNovo={diario.refetch} />;
  const itens = diario.data.pages.flatMap((p) => p.itens);
  if (itens.length === 0) return <Vazio mensagem="Seu diário está vazio." />;
  return (
    <>
      <ul className="divide-y divide-borda rounded-md border border-borda bg-superficie px-4">
        {itens.map((item) => (
          <ItemRegistro key={item.id} registro={item}>
            <span className="text-texto-suave">
              T{item.temporada.numero}E{item.episodio.numero}
            </span>
            <span>{item.episodio.nome ?? `Episódio ${item.episodio.numero}`}</span>
            <Link
              to={`/series/${item.serie.tmdbId}`}
              className="text-sm text-texto-suave underline"
            >
              {item.serie.nome}
            </Link>
          </ItemRegistro>
        ))}
      </ul>
      {diario.hasNextPage && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => diario.fetchNextPage()}
            disabled={diario.isFetchingNextPage}
            className="mt-4 min-h-10 rounded-md border border-borda px-5 disabled:opacity-50"
          >
            {diario.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </>
  );
}

export function PaginaDiario() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Meu diário</h1>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Em andamento</h2>
        <Progresso />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Registros</h2>
        <Registros />
      </section>
    </div>
  );
}
