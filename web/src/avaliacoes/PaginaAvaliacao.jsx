import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useEstadoSerie, useSerie } from '../catalogo/consultas.js';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { Poster } from '../componentes/Poster.jsx';
import { useExcluirAvaliacao, useSalvarAvaliacao } from './consultas.js';
import { EntradaEstrelas } from './EntradaEstrelas.jsx';

function Formulario({ tmdbId, avaliacao }) {
  const navigate = useNavigate();
  const salvar = useSalvarAvaliacao(tmdbId);
  const excluir = useExcluirAvaliacao(tmdbId);
  const [nota, setNota] = useState(avaliacao?.nota ?? null);
  const [texto, setTexto] = useState(avaliacao?.texto ?? '');
  const [contemSpoiler, setContemSpoiler] = useState(avaliacao?.contemSpoiler ?? false);
  const [aviso, setAviso] = useState(null);
  const voltar = () => navigate(`/series/${tmdbId}`);

  function enviar(evento) {
    evento.preventDefault();
    if (nota === null) return setAviso('Escolha uma nota.');
    salvar.mutate({ nota, texto, contemSpoiler }, { onSuccess: voltar });
  }

  function apagar() {
    if (window.confirm('Excluir sua nota e resenha desta série?'))
      excluir.mutate(undefined, { onSuccess: voltar });
  }

  const erro = aviso ?? salvar.error?.message ?? excluir.error?.message;
  return (
    <form onSubmit={enviar} className="space-y-5">
      <EntradaEstrelas
        valor={nota}
        aoMudar={(n) => {
          setNota(n);
          setAviso(null);
        }}
      />
      <div className="space-y-1">
        <label htmlFor="texto-resenha" className="block text-sm">
          Resenha (opcional)
        </label>
        <textarea
          id="texto-resenha"
          rows={6}
          maxLength={5000}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full rounded-md border border-borda bg-fundo p-3"
        />
        <p className="text-sm text-texto-suave">{texto.length}/5000 · resenhas são públicas</p>
      </div>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={contemSpoiler}
          onChange={(e) => setContemSpoiler(e.target.checked)}
          className="size-4"
        />
        Contém spoiler (o texto fica oculto até o leitor pedir para ver)
      </label>
      {erro && (
        <p role="alert" className="text-sm text-perigo">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={salvar.isPending}
          className="min-h-11 rounded-md bg-destaque px-5 font-semibold text-fundo disabled:opacity-60"
        >
          {salvar.isPending ? 'Salvando…' : 'Salvar'}
        </button>
        <Link
          to={`/series/${tmdbId}`}
          className="inline-flex min-h-11 items-center rounded-md border border-borda px-5"
        >
          Cancelar
        </Link>
        {avaliacao && (
          <button
            type="button"
            onClick={apagar}
            disabled={excluir.isPending}
            className="ml-auto min-h-11 rounded-md px-4 text-perigo hover:bg-superficie disabled:opacity-60"
          >
            Excluir avaliação
          </button>
        )}
      </div>
    </form>
  );
}

export function PaginaAvaliacao() {
  const { tmdbId } = useParams();
  const serie = useSerie(tmdbId);
  const estado = useEstadoSerie(tmdbId);

  if (serie.isPending || estado.isPending) return <Carregando />;
  if (serie.isError && [400, 404].includes(serie.error.status))
    return <Vazio mensagem="Série não encontrada." />;
  if (serie.isError) return <Erro erro={serie.error} aoTentarDeNovo={serie.refetch} />;
  if (estado.isError) return <Erro erro={estado.error} aoTentarDeNovo={estado.refetch} />;

  const avaliacao = estado.data.avaliacao;
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <Poster url={serie.data.posterUrl} nome={serie.data.nome} tamanho="pequeno" />
        <div>
          <h1 className="text-2xl font-bold">{avaliacao ? 'Editar avaliação' : 'Avaliar'}</h1>
          <p className="text-texto-suave">{serie.data.nome}</p>
        </div>
      </header>
      <Formulario key={avaliacao?.id ?? 'nova'} tmdbId={tmdbId} avaliacao={avaliacao} />
    </section>
  );
}
