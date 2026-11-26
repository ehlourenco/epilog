import { useAuth } from '../auth/contexto.js';
import { useExigirSessao } from '../auth/useExigirSessao.js';
import { useEstadoSerie } from '../catalogo/consultas.js';
import { useAdicionarNaLista, useRemoverDaLista } from './consultas.js';

export function BotaoQueroAssistir({ tmdbId }) {
  const { sessao } = useAuth();
  const estado = useEstadoSerie(tmdbId);
  const exigirSessao = useExigirSessao();
  const adicionar = useAdicionarNaLista();
  const remover = useRemoverDaLista();
  const qa = sessao ? estado.data?.queroAssistir : null;
  const ocupado = adicionar.isPending || remover.isPending || (sessao && estado.isPending);

  function alternar() {
    if (!exigirSessao() || !qa?.listaId) return;
    const dados = { listaId: qa.listaId, tmdbId };
    if (qa.contem) remover.mutate(dados);
    else adicionar.mutate(dados);
  }

  const erro = adicionar.error ?? remover.error;
  return (
    <>
      <button
        type="button"
        aria-pressed={Boolean(qa?.contem)}
        onClick={alternar}
        disabled={ocupado}
        className={`min-h-10 rounded-md border px-4 disabled:opacity-60 ${qa?.contem ? 'border-destaque text-destaque' : 'border-borda hover:border-destaque'}`}
      >
        {qa?.contem ? '✓ Na Quero assistir' : '+ Quero assistir'}
      </button>
      {erro && (
        <span role="alert" className="text-sm text-perigo">
          {erro.message}
        </span>
      )}
    </>
  );
}
