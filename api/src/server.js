import { criarApp } from './app.js';
import { carregarConfig } from './config.js';

const config = carregarConfig(process.env);
const app = criarApp({ config, clientes: {}, catalogo: {} });

app.listen(config.port, () => {
  console.log(`API do EpiLog em http://localhost:${config.port}/api`);
});
