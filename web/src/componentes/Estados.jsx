export function Carregando({ mensagem = 'Carregando…' }) {
  return (
    <p role="status" className="py-10 text-center text-texto-suave">
      {mensagem}
    </p>
  );
}

export function Vazio({ mensagem }) {
  return <p className="py-10 text-center text-texto-suave">{mensagem}</p>;
}

export function Erro({ erro, aoTentarDeNovo }) {
  return (
    <div
      role="alert"
      className="my-6 rounded-md border border-perigo/40 bg-perigo/10 p-4 text-center"
    >
      <p>{erro?.message ?? 'Algo deu errado.'}</p>
      {aoTentarDeNovo && (
        <button
          type="button"
          onClick={aoTentarDeNovo}
          className="mt-3 min-h-10 rounded-md border border-borda px-4 hover:bg-superficie"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
