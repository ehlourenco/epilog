import { criarApp } from '../src/app.js';

const configDeTeste = {
  port: 0,
  supabaseUrl: 'https://teste.supabase.co',
  supabasePublishableKey: 'pk',
  supabaseSecretKey: 'sk',
  tmdbReadToken: 't',
  corsOrigin: null,
  cacheCatalogoHoras: 24,
};

export function criarAppDeTeste(sobrescritas = {}) {
  return criarApp({ config: configDeTeste, clientes: {}, catalogo: {}, ...sobrescritas });
}
