import cors from 'cors';
import express from 'express';
import { criarRotasAvaliacoes } from './avaliacoes/rotas.js';
import { criarRotasCatalogo } from './catalogo/rotas.js';
import { criarRotasDiario } from './diario/rotas.js';
import { ErroApi, tratadorDeErros } from './erros.js';
import { criarRotasEstado } from './estado/rotas.js';
import { criarAuth } from './middleware/auth.js';
import { criarRotasPerfis } from './perfis/rotas.js';

export function criarApp({ config, clientes, catalogo }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin }));

  const auth = criarAuth(clientes);
  const exigir = auth.exigirAutenticacao;
  const api = express.Router();
  api.use(auth.autenticacaoOpcional);
  api.get('/saude', (req, res) => res.json({ ok: true }));
  api.use(criarRotasCatalogo({ catalogo }));
  api.use(criarRotasPerfis({ exigir }));
  api.use(criarRotasDiario({ exigir }));
  api.use(criarRotasEstado({ exigir }));
  api.use(criarRotasAvaliacoes({ exigir }));

  app.use('/api', api);
  app.use((req, res, next) => next(new ErroApi(404, 'rota_nao_encontrada', 'Rota não encontrada.')));
  app.use(tratadorDeErros);
  return app;
}
