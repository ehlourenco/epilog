import { supabase } from './supabase.js';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ErroDaApi extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.name = 'ErroDaApi';
    this.status = status;
    this.codigo = codigo;
  }
}

export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroDaApi(0, 'sem_conexao', 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  if (resposta.status === 204) return null;
  const json = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const codigo = json?.erro?.codigo ?? 'erro_desconhecido';
    if (resposta.status === 401 && codigo === 'token_invalido') await supabase.auth.signOut();
    throw new ErroDaApi(resposta.status, codigo, json?.erro?.mensagem ?? 'Algo deu errado.');
  }
  return json;
}
