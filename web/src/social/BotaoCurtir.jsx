import { useExigirSessao } from '../auth/useExigirSessao.js';
import { useCurtir } from './consultas.js';

export function BotaoCurtir({ resenha }) {
  const exigirSessao = useExigirSessao();
  const curtir = useCurtir();
  const rotulo = `${resenha.curti ? 'Descurtir' : 'Curtir'} a resenha de @${resenha.autor.apelido}`;
  return (
    <button
      type="button"
      aria-pressed={resenha.curti}
      aria-label={`${rotulo} (${resenha.curtidas} ${resenha.curtidas === 1 ? 'curtida' : 'curtidas'})`}
      disabled={curtir.isPending}
      onClick={() => exigirSessao() && curtir.mutate({ id: resenha.id, curtir: !resenha.curti })}
      className={`inline-flex min-h-9 items-center gap-1 rounded-md border px-3 text-sm disabled:opacity-60 ${resenha.curti ? 'border-destaque text-destaque' : 'border-borda text-texto-suave hover:text-texto'}`}
    >
      <span aria-hidden="true">{resenha.curti ? '♥' : '♡'}</span>
      <span aria-hidden="true">{resenha.curtidas}</span>
    </button>
  );
}
