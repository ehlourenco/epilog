import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { useMe } from '../conta/consultas.js';

// Itens do menu da conta; os PRs da Etapa 2 acrescentam "Minhas listas" e "Atividade".
const ITENS = [
  { para: '/me/diario', rotulo: 'Diário' },
  { para: '/me', rotulo: 'Perfil' },
];

export function MenuConta() {
  const { sair } = useAuth();
  const me = useMe();
  const [aberto, setAberto] = useState(false);
  const raiz = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fecharFora = (e) => !raiz.current?.contains(e.target) && setAberto(false);
    const fecharEsc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fecharFora);
    document.addEventListener('keydown', fecharEsc);
    return () => {
      document.removeEventListener('mousedown', fecharFora);
      document.removeEventListener('keydown', fecharEsc);
    };
  }, [aberto]);

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="inline-flex min-h-10 items-center gap-1 rounded-md px-3 hover:bg-fundo"
      >
        {me.data ? `@${me.data.apelido}` : 'Conta'} <span aria-hidden="true">▾</span>
      </button>
      {aberto && (
        <ul className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-borda bg-superficie py-1 shadow-lg">
          {ITENS.map((item) => (
            <li key={item.para}>
              <Link
                to={item.para}
                onClick={() => setAberto(false)}
                className="block min-h-10 px-4 py-2 hover:bg-fundo"
              >
                {item.rotulo}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setAberto(false);
                sair();
              }}
              className="block min-h-10 w-full px-4 py-2 text-left hover:bg-fundo"
            >
              Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
