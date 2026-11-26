import { useParams } from 'react-router';
import { ListaResenhas } from '../avaliacoes/ListaResenhas.jsx';
import { Carregando, Erro, Vazio } from '../componentes/Estados.jsx';
import { usePerfil } from './consultas.js';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const desde = (iso) => `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;

export function PaginaPerfilPublico() {
  const { apelido } = useParams();
  const perfil = usePerfil(apelido);

  if (perfil.isPending) return <Carregando />;
  if (perfil.isError && perfil.error.status === 404)
    return <Vazio mensagem="Perfil não encontrado." />;
  if (perfil.isError) return <Erro erro={perfil.error} aoTentarDeNovo={perfil.refetch} />;

  const p = perfil.data;
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">@{p.apelido}</h1>
        {p.souEu && <p className="text-sm text-destaque">Este é você</p>}
        <p className="text-sm text-texto-suave">No EpiLog desde {desde(p.criadoEm)}</p>
        <ul className="flex gap-6 text-sm">
          <li>
            <strong>{p.seguidores}</strong> seguidores
          </li>
          <li>
            <strong>{p.seguindo}</strong> seguindo
          </li>
        </ul>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Resenhas</h2>
        <ListaResenhas
          filtros={{ autorApelido: p.apelido }}
          vazio="Nenhuma resenha publicada ainda."
        />
      </section>
    </article>
  );
}
