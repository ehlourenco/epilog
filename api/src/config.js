const OBRIGATORIAS = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
  'TMDB_READ_TOKEN',
];

export function carregarConfig(env) {
  const faltando = OBRIGATORIAS.filter((nome) => !env[nome]);
  if (faltando.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${faltando.join(', ')}`);
  }

  const cacheHoras = Number(env.CACHE_CATALOGO_HORAS ?? 24);
  if (!Number.isFinite(cacheHoras) || cacheHoras < 0) {
    throw new Error('CACHE_CATALOGO_HORAS deve ser um número maior ou igual a 0');
  }

  return {
    port: Number(env.PORT ?? 3333),
    supabaseUrl: env.SUPABASE_URL,
    supabasePublishableKey: env.SUPABASE_PUBLISHABLE_KEY,
    supabaseSecretKey: env.SUPABASE_SECRET_KEY,
    tmdbReadToken: env.TMDB_READ_TOKEN,
    corsOrigin: env.CORS_ORIGIN || null,
    cacheCatalogoHoras: cacheHoras,
  };
}
