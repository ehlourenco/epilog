import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { useExigirSessao } from '../auth/useExigirSessao.js';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { BarraProgresso } from '../diario/BarraProgresso.jsx';
import { useMeuEstadoTemporada, useRegistrarVisualizacao } from '../diario/consultas.js';
import { FormularioVisualizacao } from '../diario/FormularioVisualizacao.jsx';
import { RegistrosEpisodio } from '../diario/RegistrosEpisodio.jsx';
import { hojeLocal } from '../lib/datas.js';
import { AvisoCache } from './AvisoCache.jsx';
import { useTemporada } from './consultas.js';

function Episodio({ ep, vezes, registros }) {
  const [registrando, setRegistrando] = useState(false);
  const exigirSessao = useExigirSessao();
  const registrar = useRegistrarVisualizacao();

  return (
    <li className="rounded-md border border-borda bg-superficie p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">
            <span className="mr-2 text-texto-suave">{ep.numero}.</span>
            {ep.nome ?? `Episódio ${ep.numero}`}
          </h2>
          {vezes > 0 && <p className="text-sm text-destaque">Visto {vezes}×</p>}
        </div>
        <button
          type="button"
          onClick={() => exigirSessao() && setRegistrando(true)}
          className="min-h-10 rounded-md border border-borda px-4 text-sm hover:border-destaque"
        >
          Registrar
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-texto-suave">
        {ep.descricao ?? 'Sem descrição.'}
      </p>
      {registrando && (
        <FormularioVisualizacao
          inicial={{ assistidoEm: hojeLocal(), revisita: vezes > 0 }}
          rotulo="Registrar"
          salvando={registrar.isPending}
          erro={registrar.error}
          aoCancelar={() => setRegistrando(false)}
          aoSalvar={(dados) =>
            registrar.mutate(
              { episodioId: ep.id, ...dados },
              { onSuccess: () => setRegistrando(false) },
            )
          }
        />
      )}
      <RegistrosEpisodio registros={registros} />
    </li>
  );
}

export function PaginaTemporada() {
  const { tmdbId, n } = useParams();
  const { sessao } = useAuth();
  const { data: temporada, isPending, isError, error, refetch } = useTemporada(tmdbId, n);
  // Pedido depois da temporada: é ela que grava os episódios no banco na primeira visita.
  const meuEstado = useMeuEstadoTemporada(tmdbId, n, { enabled: Boolean(temporada) });

  if (isPending) return <Carregando />;
  // 400 = identificador malformado na URL; para quem digitou, é o mesmo que não existir.
  if (isError && [400, 404].includes(error.status))
    return <Vazio mensagem="Temporada não encontrada." />;
  if (isError) return <Erro erro={error} aoTentarDeNovo={refetch} />;

  const titulo =
    temporada.nome ?? (temporada.numero === 0 ? 'Especiais' : `Temporada ${temporada.numero}`);
  const estado = meuEstado.data;
  const registrosDo = (episodioId) =>
    estado?.registros.filter((r) => r.episodioId === episodioId) ?? [];

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
      {sessao && estado && (
        <BarraProgresso
          assistidos={estado.assistidos}
          total={estado.total || temporada.episodios.length}
        />
      )}

      {temporada.episodios.length === 0 ? (
        <Vazio mensagem="Nenhum episódio listado para esta temporada." />
      ) : (
        <ol className="space-y-3">
          {temporada.episodios.map((ep) => (
            <Episodio
              key={ep.id}
              ep={ep}
              vezes={estado?.porEpisodio[ep.id] ?? 0}
              registros={registrosDo(ep.id)}
            />
          ))}
        </ol>
      )}
    </article>
  );
}
