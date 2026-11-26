import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { Carregando, Erro } from '../componentes/Estados.jsx';
import {
  REGRA_APELIDO,
  apelidoValido,
  normalizarApelido,
  useAtualizarApelido,
  useMe,
} from './consultas.js';

export function PaginaMeuPerfil() {
  const { sessao, sair } = useAuth();
  const me = useMe();
  const atualizar = useAtualizarApelido();
  const [novo, setNovo] = useState(null); // null = ainda não editou
  const [mensagem, setMensagem] = useState(null);

  if (me.isPending) return <Carregando />;
  if (me.isError) return <Erro erro={me.error} aoTentarDeNovo={me.refetch} />;

  const valor = novo ?? me.data.apelido;

  function salvar(evento) {
    evento.preventDefault();
    const apelido = normalizarApelido(valor);
    if (!apelidoValido(apelido)) return setMensagem({ ok: false, texto: REGRA_APELIDO });
    atualizar.mutate(apelido, {
      onSuccess: () => {
        setNovo(null);
        setMensagem({ ok: true, texto: 'Apelido atualizado.' });
      },
      onError: (e) => setMensagem({ ok: false, texto: e.message }),
    });
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <dl className="space-y-1 text-sm">
        <dt className="text-texto-suave">E-mail (não aparece para ninguém)</dt>
        <dd>{sessao.user.email}</dd>
      </dl>
      <form onSubmit={salvar} className="space-y-2">
        <label htmlFor="novo-apelido" className="block text-sm">
          Apelido
        </label>
        <div className="flex gap-2">
          <input
            id="novo-apelido"
            value={valor}
            onChange={(e) => {
              setNovo(e.target.value);
              setMensagem(null);
            }}
            aria-describedby="novo-apelido-ajuda"
            className="min-h-11 flex-1 rounded-md border border-borda bg-fundo px-3"
          />
          <button
            type="submit"
            disabled={atualizar.isPending}
            className="min-h-11 rounded-md bg-destaque px-4 font-semibold text-fundo disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
        <p
          id="novo-apelido-ajuda"
          role={mensagem ? 'status' : undefined}
          className={`text-sm ${mensagem ? (mensagem.ok ? 'text-destaque' : 'text-perigo') : 'text-texto-suave'}`}
        >
          {mensagem?.texto ?? REGRA_APELIDO}
        </p>
      </form>
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/u/${me.data.apelido}`}
          className="inline-flex min-h-10 items-center rounded-md border border-borda px-4"
        >
          Ver meu perfil público
        </Link>
        <button
          type="button"
          onClick={sair}
          className="min-h-10 rounded-md border border-borda px-4"
        >
          Sair
        </button>
      </div>
    </section>
  );
}
