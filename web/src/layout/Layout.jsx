import { Outlet } from 'react-router';
import { Cabecalho } from './Cabecalho.jsx';
import { Rodape } from './Rodape.jsx';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:p-2">
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Rodape />
    </div>
  );
}
