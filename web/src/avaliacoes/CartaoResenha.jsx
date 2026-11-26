import { useId, useState } from 'react';
import { Link } from 'react-router';
import { Poster } from '../componentes/Poster.jsx';
import { Estrelas } from './Estrelas.jsx';

const dataLocal = (iso) => new Date(iso).toLocaleDateString('pt-BR');

// `acoes` é o espaço para o botão de curtir (RF06).
export function CartaoResenha({ resenha, mostrarSerie = true, acoes = null }) {
  const [revelado, setRevelado] = useState(false);
  const idTexto = useId();
  const escondido = resenha.contemSpoiler && !revelado;

  return (
    <li className="flex gap-3 rounded-md border border-borda bg-superficie p-4">
      {mostrarSerie && (
        <Link to={`/series/${resenha.serie.tmdbId}`} className="shrink-0">
          <Poster url={resenha.serie.posterUrl} nome={resenha.serie.nome} tamanho="pequeno" />
        </Link>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Link to={`/u/${resenha.autor.apelido}`} className="font-semibold hover:text-destaque">
            @{resenha.autor.apelido}
          </Link>
          {mostrarSerie && (
            <Link to={`/series/${resenha.serie.tmdbId}`} className="underline">
              {resenha.serie.nome}
            </Link>
          )}
          <Estrelas nota={resenha.nota} />
          <span className="text-texto-suave">{dataLocal(resenha.publicadoEm)}</span>
        </div>
        {resenha.contemSpoiler && (
          <button
            type="button"
            aria-expanded={revelado}
            aria-controls={idTexto}
            onClick={() => setRevelado((v) => !v)}
            className="min-h-9 rounded-md border border-destaque/50 px-3 text-sm text-destaque"
          >
            {revelado ? 'Esconder spoiler' : 'Mostrar spoiler'}
          </button>
        )}
        <p id={idTexto} hidden={escondido} className="whitespace-pre-line leading-relaxed">
          {resenha.texto}
        </p>
        <div className="flex items-center gap-3 text-sm text-texto-suave">
          {acoes}
          <span>
            {resenha.curtidas} {resenha.curtidas === 1 ? 'curtida' : 'curtidas'}
          </span>
        </div>
      </div>
    </li>
  );
}
