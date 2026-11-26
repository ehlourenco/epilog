import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { useExigirSessao } from '../auth/useExigirSessao.js';
import { Estrelas } from '../avaliacoes/Estrelas.jsx';
import { ListaResenhas } from '../avaliacoes/ListaResenhas.jsx';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { Poster } from '../componentes/Poster.jsx';
import { BotaoQueroAssistir } from '../listas/BotaoQueroAssistir.jsx';
import { SeletorListas } from '../listas/SeletorListas.jsx';
import { AvisoCache } from './AvisoCache.jsx';
import { useEstadoSerie, useSerie } from './consultas.js';

export function PaginaSerie() {
  const { tmdbId } = useParams();
  const { data: serie, isPending, isError, error, refetch } = useSerie(tmdbId);
  const { sessao } = useAuth();
  const estado = useEstadoSerie(tmdbId);
  const exigirSessao = useExigirSessao();
  const navigate = useNavigate();
  const minhaAvaliacao = sessao ? estado.data?.avaliacao : null;

  if (isPending) return <Carregando />;
  // 400 = identificador malformado na URL; para quem digitou, é o mesmo que não existir.
  if (isError && [400, 404].includes(error.status))
    return <Vazio mensagem="Série não encontrada." />;
  if (isError) return <Erro erro={error} aoTentarDeNovo={refetch} />;

  return (
    <article className="space-y-8">
      <AvisoCache origem={serie.origem} />
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-48 shrink-0 sm:mx-0 sm:w-64">
          <Poster url={serie.posterUrl} nome={serie.nome} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">
            {serie.nome}
            {serie.anoEstreia && (
              <span className="ml-2 font-normal text-texto-suave">({serie.anoEstreia})</span>
            )}
          </h1>
          {serie.generos.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Gêneros">
              {serie.generos.map((g) => (
                <li
                  key={g}
                  className="rounded-full border border-borda px-3 py-0.5 text-sm text-texto-suave"
                >
                  {g}
                </li>
              ))}
            </ul>
          )}
          <div className="space-y-1">
            {serie.idiomaSinopse === 'en' && (
              <span className="inline-block rounded bg-superficie px-2 py-0.5 text-xs text-texto-suave">
                Sinopse em inglês
              </span>
            )}
            <p className="max-w-prose leading-relaxed">
              {serie.sinopse ?? 'Sem sinopse disponível.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => exigirSessao() && navigate(`/series/${serie.tmdbId}/avaliacao`)}
              className="min-h-10 rounded-md bg-destaque px-4 font-semibold text-fundo hover:brightness-110"
            >
              {minhaAvaliacao ? 'Editar avaliação' : 'Avaliar'}
            </button>
            {minhaAvaliacao && (
              <span className="text-sm">
                Sua nota: <Estrelas nota={minhaAvaliacao.nota} />
              </span>
            )}
            <BotaoQueroAssistir tmdbId={String(serie.tmdbId)} />
            <SeletorListas tmdbId={String(serie.tmdbId)} />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Temporadas</h2>
        {serie.temporadas.length === 0 ? (
          <Vazio mensagem="Nenhuma temporada listada no catálogo." />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {serie.temporadas.map((t) => (
              <li key={t.numero}>
                <Link
                  to={`/series/${serie.tmdbId}/temporadas/${t.numero}`}
                  className="flex min-h-12 items-center justify-between rounded-md border border-borda bg-superficie px-4 py-2 hover:border-destaque"
                >
                  <span>{t.nome ?? (t.numero === 0 ? 'Especiais' : `Temporada ${t.numero}`)}</span>
                  {t.qtdEpisodios != null && (
                    <span className="text-sm text-texto-suave">{t.qtdEpisodios} episódios</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Resenhas</h2>
        <ListaResenhas
          filtros={{ serieTmdbId: String(serie.tmdbId) }}
          mostrarSerie={false}
          vazio="Ninguém escreveu uma resenha desta série ainda."
        />
      </section>
    </article>
  );
}
