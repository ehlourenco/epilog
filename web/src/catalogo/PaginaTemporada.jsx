import { Link, useParams } from 'react-router';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { AvisoCache } from './AvisoCache.jsx';
import { useTemporada } from './consultas.js';

export function PaginaTemporada() {
  const { tmdbId, n } = useParams();
  const { data: temporada, isPending, isError, error, refetch } = useTemporada(tmdbId, n);

  if (isPending) return <Carregando />;
  if (isError && error.status === 404) return <Vazio mensagem="Temporada não encontrada." />;
  if (isError) return <Erro erro={error} aoTentarDeNovo={refetch} />;

  const titulo =
    temporada.nome ?? (temporada.numero === 0 ? 'Especiais' : `Temporada ${temporada.numero}`);

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <Link
          to={`/series/${tmdbId}`}
          className="text-sm text-texto-suave underline hover:text-texto"
        >
          ← {temporada.serieNome}
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
      </header>
      <AvisoCache origem={temporada.origem} />

      {temporada.episodios.length === 0 ? (
        <Vazio mensagem="Nenhum episódio listado para esta temporada." />
      ) : (
        <ol className="space-y-3">
          {temporada.episodios.map((ep) => (
            <li key={ep.id} className="rounded-md border border-borda bg-superficie p-4">
              <h2 className="font-semibold">
                <span className="mr-2 text-texto-suave">{ep.numero}.</span>
                {ep.nome ?? `Episódio ${ep.numero}`}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-texto-suave">
                {ep.descricao ?? 'Sem descrição.'}
              </p>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
