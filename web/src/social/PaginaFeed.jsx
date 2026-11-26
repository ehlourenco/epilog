import { ListaResenhas } from '../avaliacoes/ListaResenhas.jsx';

export function PaginaFeed() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">Atividade</h1>
      <p className="text-texto-suave">Resenhas mais recentes dos perfis que você segue.</p>
      <ListaResenhas
        filtros={{ soSeguidos: true }}
        vazio="Siga perfis para ver as resenhas deles aqui."
      />
    </div>
  );
}
