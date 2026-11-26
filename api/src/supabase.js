import { createClient } from '@supabase/supabase-js';

const SEM_SESSAO = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

export function criarClientesSupabase(config) {
  return {
    // Chave secreta: ignora RLS. Usada SOMENTE pelo módulo de catálogo (src/catalogo/).
    admin: createClient(config.supabaseUrl, config.supabaseSecretKey, { auth: SEM_SESSAO }),
    // Visitante sem login: role anon, RLS aplicada.
    anonimo: createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: SEM_SESSAO }),
    // Usuário logado: o banco enxerga auth.uid() e aplica a RLS como essa pessoa.
    doUsuario: (token) =>
      createClient(config.supabaseUrl, config.supabasePublishableKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: SEM_SESSAO,
      }),
  };
}
