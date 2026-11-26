import { useExigirSessao } from '../auth/useExigirSessao.js';
import { useSeguir } from './consultas.js';

export function BotaoSeguir({ apelido, euSigo, souEu }) {
  const exigirSessao = useExigirSessao();
  const seguir = useSeguir(apelido);
  if (souEu) return null;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-pressed={euSigo}
        disabled={seguir.isPending}
        onClick={() => exigirSessao() && seguir.mutate(!euSigo)}
        className={`min-h-10 rounded-md px-5 font-semibold disabled:opacity-60 ${euSigo ? 'border border-borda' : 'bg-destaque text-fundo'}`}
      >
        {euSigo ? 'Seguindo' : 'Seguir'}
      </button>
      {seguir.isError && (
        <span role="alert" className="text-sm text-perigo">
          {seguir.error.message}
        </span>
      )}
    </div>
  );
}
