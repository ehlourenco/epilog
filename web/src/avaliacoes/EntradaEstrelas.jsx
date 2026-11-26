import { useId } from 'react';
import { formatarNota } from './formatar.js';

const NOTAS = Array.from({ length: 10 }, (_, i) => (i + 1) / 2);

// Grupo de 10 radios (0,5 a 5): o navegador já cuida das setas do teclado dentro do grupo.
export function EntradaEstrelas({ valor, aoMudar }) {
  const nome = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm">Nota</legend>
      <div className="flex flex-wrap gap-2">
        {NOTAS.map((nota) => (
          <label key={nota} className="cursor-pointer">
            <input
              type="radio"
              name={nome}
              value={nota}
              checked={valor === nota}
              onChange={() => aoMudar(nota)}
              className="peer sr-only"
            />
            <span className="inline-flex min-h-10 min-w-12 items-center justify-center rounded-md border border-borda px-2 text-sm peer-checked:border-destaque peer-checked:bg-destaque peer-checked:font-semibold peer-checked:text-fundo peer-focus-visible:outline-2 peer-focus-visible:outline-destaque">
              ★ {formatarNota(nota)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
