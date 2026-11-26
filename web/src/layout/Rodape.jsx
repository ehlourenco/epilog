import { Link } from 'react-router';

export function Rodape() {
  return (
    <footer className="mt-12 border-t border-borda">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-texto-suave">
        <p>Dados de séries fornecidos pelo TMDB.</p>
        <Link to="/sobre" className="underline hover:text-texto">
          Sobre o EpiLog
        </Link>
      </div>
    </footer>
  );
}
