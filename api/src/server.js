import { criarApp } from './app.js';
import { criarRepositorioCatalogo } from './catalogo/repositorio.js';
import { criarServicoCatalogo } from './catalogo/servico.js';
import { criarClienteTmdb } from './catalogo/tmdb-cliente.js';
import { carregarConfig } from './config.js';
import { criarClientesSupabase } from './supabase.js';

const config = carregarConfig(process.env);
const clientes = criarClientesSupabase(config);
const catalogo = criarServicoCatalogo({
  tmdb: criarClienteTmdb({ token: config.tmdbReadToken }),
  repositorio: criarRepositorioCatalogo(clientes.admin),
  cacheHoras: config.cacheCatalogoHoras,
});

criarApp({ config, clientes, catalogo }).listen(config.port, () => {
  console.log(`API do EpiLog em http://localhost:${config.port}/api`);
});
