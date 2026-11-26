import { formatarNota } from './formatar.js';

// Exibição da nota: estrelas cheias, meia estrela e o número (leitores de tela ouvem "4,5 de 5 estrelas").
export function Estrelas({ nota }) {
  const cheias = Math.floor(nota);
  const meia = nota % 1 !== 0;
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`${formatarNota(nota)} de 5 estrelas`}
      role="img"
    >
      <span aria-hidden="true" className="tracking-tight text-destaque">
        {'★'.repeat(cheias)}
        {meia && '½'}
      </span>
      <span aria-hidden="true" className="text-sm text-texto-suave">
        {formatarNota(nota)}
      </span>
    </span>
  );
}
