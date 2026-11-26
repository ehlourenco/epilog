import { useState } from 'react';
import { formatarData } from '../lib/datas.js';
import { useEditarVisualizacao, useExcluirVisualizacao } from './consultas.js';
import { FormularioVisualizacao } from './FormularioVisualizacao.jsx';

const SeloReassistida = () => (
  <span className="rounded bg-destaque/15 px-2 py-0.5 text-xs text-destaque">Reassistida</span>
);

// Uma visualização do diário, com editar (data e reassistida) e excluir. `children` acrescenta contexto
// (ex.: série e episódio, na página do diário).
export function ItemRegistro({ registro, children }) {
  const [editando, setEditando] = useState(false);
  const editar = useEditarVisualizacao();
  const excluir = useExcluirVisualizacao();

  function confirmarExclusao() {
    if (window.confirm('Excluir este registro do diário?')) excluir.mutate(registro.id);
  }

  return (
    <li className="py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{formatarData(registro.assistidoEm)}</span>
        {registro.revisita && <SeloReassistida />}
        {children}
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="min-h-9 rounded-md px-3 text-sm text-texto-suave hover:bg-fundo hover:text-texto"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={confirmarExclusao}
            disabled={excluir.isPending}
            className="min-h-9 rounded-md px-3 text-sm text-perigo hover:bg-fundo disabled:opacity-60"
          >
            Excluir
          </button>
        </span>
      </div>
      {excluir.isError && (
        <p role="alert" className="text-sm text-perigo">
          {excluir.error.message}
        </p>
      )}
      {editando && (
        <FormularioVisualizacao
          inicial={{ assistidoEm: registro.assistidoEm, revisita: registro.revisita }}
          salvando={editar.isPending}
          erro={editar.error}
          aoCancelar={() => setEditando(false)}
          aoSalvar={(dados) =>
            editar.mutate({ id: registro.id, ...dados }, { onSuccess: () => setEditando(false) })
          }
        />
      )}
    </li>
  );
}

export function RegistrosEpisodio({ registros }) {
  if (registros.length === 0) return null;
  return (
    <ul
      className="mt-2 divide-y divide-borda border-t border-borda"
      aria-label="Seus registros deste episódio"
    >
      {registros.map((r) => (
        <ItemRegistro key={r.id} registro={r} />
      ))}
    </ul>
  );
}
