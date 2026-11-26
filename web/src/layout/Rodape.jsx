import { Link } from 'react-router';

export function Rodape() {
  return (
    <footer className="mt-12 border-t border-borda">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-texto-suave">
        <div className="flex flex-wrap items-center gap-3">
          <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" className="h-3" />
          <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        </div>
        <Link to="/sobre" className="underline hover:text-texto">
          Sobre o EpiLog
        </Link>
      </div>
    </footer>
  );
}
