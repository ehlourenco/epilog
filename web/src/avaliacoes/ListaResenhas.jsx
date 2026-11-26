import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { CartaoResenha } from './CartaoResenha.jsx';
import { useResenhas } from './consultas.js';

export function ListaResenhas({ filtros, mostrarSerie = true, vazio = 'Nenhuma resenha ainda.' }) {
  const resenhas = useResenhas(filtros);
  if (resenhas.isPending) return <Carregando />;
  if (resenhas.isError) return <Erro erro={resenhas.error} aoTentarDeNovo={resenhas.refetch} />;
  const itens = resenhas.data.pages.flatMap((p) => p.itens);
  if (itens.length === 0) return <Vazio mensagem={vazio} />;
  return (
    <>
      <ul className="space-y-3">
        {itens.map((r) => (
          <CartaoResenha key={r.id} resenha={r} mostrarSerie={mostrarSerie} />
        ))}
      </ul>
      {resenhas.hasNextPage && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => resenhas.fetchNextPage()}
            disabled={resenhas.isFetchingNextPage}
            className="mt-3 min-h-10 rounded-md border border-borda px-5 disabled:opacity-50"
          >
            {resenhas.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </>
  );
}
