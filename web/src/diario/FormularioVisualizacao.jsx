import { useId, useState } from 'react';
import { hojeLocal } from '../lib/datas.js';

export function FormularioVisualizacao({
  inicial,
  aoSalvar,
  aoCancelar,
  salvando,
  erro,
  rotulo = 'Salvar',
}) {
  const [assistidoEm, setAssistidoEm] = useState(inicial.assistidoEm);
  const [revisita, setRevisita] = useState(inicial.revisita);
  const id = useId();
  const hoje = hojeLocal();

  function enviar(evento) {
    evento.preventDefault();
    aoSalvar({ assistidoEm, revisita });
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-borda bg-fundo p-3"
    >
      <div className="space-y-1">
        <label htmlFor={`${id}-data`} className="block text-sm">
          Assistido em
        </label>
        <input
          id={`${id}-data`}
          type="date"
          required
          max={hoje}
          value={assistidoEm}
          onChange={(e) => setAssistidoEm(e.target.value)}
          className="min-h-10 rounded-md border border-borda bg-superficie px-2"
        />
      </div>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={revisita}
          onChange={(e) => setRevisita(e.target.checked)}
          className="size-4"
        />
        Reassistida
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="min-h-10 rounded-md bg-destaque px-4 font-semibold text-fundo disabled:opacity-60"
        >
          {salvando ? 'Salvando…' : rotulo}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="min-h-10 rounded-md border border-borda px-4"
        >
          Cancelar
        </button>
      </div>
      {erro && (
        <p role="alert" className="w-full text-sm text-perigo">
          {erro.message}
        </p>
      )}
    </form>
  );
}
