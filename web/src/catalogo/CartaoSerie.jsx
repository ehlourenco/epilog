import { Link } from 'react-router';
import { Poster } from '../componentes/Poster.jsx';

export function CartaoSerie({ serie }) {
  return (
    <li>
      <Link
        to={`/series/${serie.tmdbId}`}
        className="group block rounded-md focus-visible:outline-2"
      >
        <Poster url={serie.posterUrl} nome={serie.nome} />
        <p className="mt-2 font-medium leading-tight group-hover:text-destaque">{serie.nome}</p>
        {serie.ano && <p className="text-sm text-texto-suave">{serie.ano}</p>}
      </Link>
    </li>
  );
}
