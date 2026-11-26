import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

export function Cabecalho() {
  const [params] = useSearchParams();
  const [termo, setTermo] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  function buscar(evento) {
    evento.preventDefault();
    const q = termo.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  }

  return (
    <header className="border-b border-borda bg-superficie/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Epi<span className="text-destaque">Log</span>
        </Link>
        <form role="search" onSubmit={buscar} className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <label htmlFor="busca-cabecalho" className="sr-only">
            Buscar séries
          </label>
          <input
            id="busca-cabecalho"
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar séries…"
            className="min-h-10 w-full rounded-md border border-borda bg-fundo px-3 placeholder:text-texto-suave"
          />
        </form>
        <nav className="ml-auto" aria-label="Conta">
          <Link to="/entrar" className="inline-flex min-h-10 items-center rounded-md px-3 hover:bg-fundo">
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
