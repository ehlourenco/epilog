import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/contexto.js';
import { caminhoSeguro } from '../auth/voltar.js';
import { supabase } from '../lib/supabase.js';
import { REGRA_APELIDO, apelidoValido, normalizarApelido, verificarApelido } from './consultas.js';

const MENSAGENS = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  user_already_exists: 'Já existe conta com esse e-mail.',
  email_exists: 'Já existe conta com esse e-mail.',
  weak_password: 'A senha precisa ter pelo menos 6 caracteres.',
  unexpected_failure: 'Não foi possível criar a conta. Verifique o apelido e tente de novo.',
};
const POR_TEXTO = {
  'Invalid login credentials': MENSAGENS.invalid_credentials,
  'User already registered': MENSAGENS.user_already_exists,
};
const traduzir = (erro) =>
  MENSAGENS[erro?.code] ?? POR_TEXTO[erro?.message] ?? erro?.message ?? 'Algo deu errado.';

const campo = 'min-h-11 w-full rounded-md border border-borda bg-fundo px-3';
const botao =
  'min-h-11 w-full rounded-md bg-destaque px-4 font-semibold text-fundo hover:brightness-110 disabled:opacity-60';

export function PaginaEntrar() {
  const [params, setParams] = useSearchParams();
  const { sessao, carregando } = useAuth();
  const navigate = useNavigate();
  const aba = params.get('aba') === 'criar' ? 'criar' : 'entrar';
  const destino = caminhoSeguro(params.get('voltar'));

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [apelido, setApelido] = useState('');
  const [situacaoApelido, setSituacaoApelido] = useState(null); // { ok, texto }
  const [erro, setErro] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (!carregando && sessao) return <Navigate to={destino} replace />;

  function trocarAba(nova) {
    const proximos = new URLSearchParams(params);
    if (nova === 'criar') proximos.set('aba', 'criar');
    else proximos.delete('aba');
    setParams(proximos, { replace: true });
    setErro(null);
  }

  async function conferirApelido() {
    const valor = normalizarApelido(apelido);
    if (!valor) return setSituacaoApelido(null);
    if (!apelidoValido(valor)) return setSituacaoApelido({ ok: false, texto: REGRA_APELIDO });
    try {
      const { disponivel } = await verificarApelido(valor);
      setSituacaoApelido(
        disponivel
          ? { ok: true, texto: 'Apelido disponível.' }
          : { ok: false, texto: 'Esse apelido já está em uso.' },
      );
      return disponivel;
    } catch (e) {
      setSituacaoApelido({ ok: false, texto: e.message });
      return false;
    }
  }

  async function entrar(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setEnviando(false);
    if (error) return setErro(traduzir(error));
    navigate(destino, { replace: true });
  }

  async function criarConta(evento) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const disponivel = await conferirApelido();
    if (!disponivel) {
      setEnviando(false);
      return setErro('Escolha um apelido válido e disponível.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { apelido: normalizarApelido(apelido) } },
    });
    setEnviando(false);
    if (error) return setErro(traduzir(error));
    if (!data.session)
      return setAviso('Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.');
    navigate(destino, { replace: true });
  }

  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">{aba === 'criar' ? 'Criar conta' : 'Entrar'}</h1>
      <div
        role="tablist"
        aria-label="Acesso"
        className="grid grid-cols-2 rounded-md border border-borda p-1"
      >
        {[
          ['entrar', 'Entrar'],
          ['criar', 'Criar conta'],
        ].map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => trocarAba(id)}
            className={`min-h-10 rounded ${aba === id ? 'bg-superficie font-semibold' : 'text-texto-suave'}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-md border border-perigo/40 bg-perigo/10 px-3 py-2 text-sm"
        >
          {erro}
        </p>
      )}
      {aviso && (
        <p
          role="status"
          className="rounded-md border border-destaque/40 bg-destaque/10 px-3 py-2 text-sm"
        >
          {aviso}
        </p>
      )}

      <form onSubmit={aba === 'criar' ? criarConta : entrar} className="space-y-4">
        {aba === 'criar' && (
          <div className="space-y-1">
            <label htmlFor="apelido" className="block text-sm">
              Apelido
            </label>
            <input
              id="apelido"
              required
              autoComplete="username"
              value={apelido}
              onChange={(e) => {
                setApelido(e.target.value);
                setSituacaoApelido(null);
              }}
              onBlur={conferirApelido}
              aria-describedby="apelido-ajuda"
              className={campo}
            />
            <p
              id="apelido-ajuda"
              className={`text-sm ${situacaoApelido ? (situacaoApelido.ok ? 'text-destaque' : 'text-perigo') : 'text-texto-suave'}`}
            >
              {situacaoApelido?.texto ?? REGRA_APELIDO}
            </p>
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="senha" className="block text-sm">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            minLength={6}
            autoComplete={aba === 'criar' ? 'new-password' : 'current-password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby={aba === 'criar' ? 'senha-ajuda' : undefined}
            className={campo}
          />
          {aba === 'criar' && (
            <p id="senha-ajuda" className="text-sm text-texto-suave">
              Mínimo de 6 caracteres.
            </p>
          )}
        </div>
        <button type="submit" disabled={enviando} className={botao}>
          {enviando ? 'Aguarde…' : aba === 'criar' ? 'Criar conta' : 'Entrar'}
        </button>
      </form>
      <p className="text-center text-sm text-texto-suave">
        <Link to="/" className="underline">
          Voltar ao catálogo
        </Link>
      </p>
    </section>
  );
}
