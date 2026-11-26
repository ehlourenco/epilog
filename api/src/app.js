import cors from 'cors';
import express from 'express';
import { criarRotasCatalogo } from './catalogo/rotas.js';
import { ErroApi, tratadorDeErros } from './erros.js';

// eslint-disable-next-line no-unused-vars -- clientes passa a ser usado na Task 6
export function criarApp({ config, clientes, catalogo }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  if (config.corsOrigin) app.use(cors({ origin: config.corsOrigin }));

  const api = express.Router();
  api.get('/saude', (req, res) => res.json({ ok: true }));
  api.use(criarRotasCatalogo({ catalogo }));

  app.use('/api', api);
  app.use((req, res, next) => next(new ErroApi(404, 'rota_nao_encontrada', 'Rota não encontrada.')));
  app.use(tratadorDeErros);
  return app;
}
