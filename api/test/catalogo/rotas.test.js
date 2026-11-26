import request from 'supertest';
import { beforeEach, expect, test, vi } from 'vitest';
import { ErroApi } from '../../src/erros.js';
import { criarAppDeTeste } from '../ajudantes.js';

let catalogo;
let app;
beforeEach(() => {
  catalogo = {
    buscar: vi.fn().mockResolvedValue({ pagina: 1, totalPaginas: 1, resultados: [] }),
    obterSerie: vi.fn().mockResolvedValue({ tmdbId: 1399 }),
    obterTemporada: vi.fn().mockResolvedValue({ numero: 0, episodios: [] }),
  };
  app = criarAppDeTeste({ catalogo });
});

test('q em branco → 400', async () => {
  const r = await request(app).get('/api/series/busca?q=%20%20');
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('validacao');
});

test('/series/busca não cai em /:tmdbId', async () => {
  const r = await request(app).get('/api/series/busca?q=x');
  expect(r.status).toBe(200);
  expect(catalogo.buscar).toHaveBeenCalledWith('x', 1);
});

test('tmdbId inválido → 400', async () =>
  expect((await request(app).get('/api/series/abc')).status).toBe(400));

test('repassa o id numérico', async () => {
  await request(app).get('/api/series/1399');
  expect(catalogo.obterSerie).toHaveBeenCalledWith(1399);
});

test('temporada 0 (especiais) é aceita', async () => {
  const r = await request(app).get('/api/series/1399/temporadas/0');
  expect(r.status).toBe(200);
  expect(catalogo.obterTemporada).toHaveBeenCalledWith(1399, 0);
});

test('série inexistente → 404 com código', async () => {
  catalogo.obterSerie.mockRejectedValue(
    new ErroApi(404, 'nao_encontrado_no_catalogo', 'Série não encontrada'),
  );
  const r = await request(app).get('/api/series/999999999');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('nao_encontrado_no_catalogo');
});

test.each(['/api/series/2147483648', '/api/series/1399/temporadas/2147483648'])(
  'ID acima do inteiro do banco (%s) → 400 sem consultar o catálogo',
  async (url) => {
    const r = await request(app).get(url);
    expect(r.status).toBe(400);
    expect(catalogo.obterSerie).not.toHaveBeenCalled();
    expect(catalogo.obterTemporada).not.toHaveBeenCalled();
  },
);
