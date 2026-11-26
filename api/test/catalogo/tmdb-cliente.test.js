import { expect, test, vi } from 'vitest';
import { criarClienteTmdb } from '../../src/catalogo/tmdb-cliente.js';

const fetchQue = (status, corpo = {}) =>
  vi.fn(async () => new Response(JSON.stringify(corpo), { status }));

test('busca envia query codificada, página, pt-BR, sem adulto e token', async () => {
  const fetch = fetchQue(200, { page: 1, total_pages: 1, results: [] });
  await criarClienteTmdb({ token: 'tk', fetch }).buscarSeries('the office & co', 2);
  const [url, opts] = fetch.mock.calls[0];
  const u = new URL(url);
  expect(u.pathname).toBe('/3/search/tv');
  expect(u.searchParams.get('query')).toBe('the office & co');
  expect(u.searchParams.get('page')).toBe('2');
  expect(u.searchParams.get('language')).toBe('pt-BR');
  expect(u.searchParams.get('include_adult')).toBe('false');
  expect(opts.headers.Authorization).toBe('Bearer tk');
});

test('série e temporada usam o idioma pedido', async () => {
  const fetch = fetchQue(200, {});
  const tmdb = criarClienteTmdb({ token: 't', fetch });
  await tmdb.serie(1396, 'en-US');
  await tmdb.temporada(1396, 2, 'pt-BR');
  const [u1, u2] = fetch.mock.calls.map(([url]) => new URL(url));
  expect(u1.pathname).toBe('/3/tv/1396');
  expect(u1.searchParams.get('language')).toBe('en-US');
  expect(u2.pathname).toBe('/3/tv/1396/season/2');
  expect(u2.searchParams.get('language')).toBe('pt-BR');
});

test('404 vira nao_encontrado_no_catalogo', async () =>
  await expect(criarClienteTmdb({ token: 't', fetch: fetchQue(404) }).serie(999999999, 'pt-BR'))
    .rejects.toMatchObject({ status: 404, codigo: 'nao_encontrado_no_catalogo' }));

test.each([500, 429])('%i vira catalogo_indisponivel', async (s) =>
  await expect(criarClienteTmdb({ token: 't', fetch: fetchQue(s) }).serie(1, 'pt-BR'))
    .rejects.toMatchObject({ status: 502, codigo: 'catalogo_indisponivel' }));

test('falha de rede vira catalogo_indisponivel', async () =>
  await expect(
    criarClienteTmdb({ token: 't', fetch: vi.fn().mockRejectedValue(new TypeError('fetch failed')) }).serie(1, 'pt-BR'),
  ).rejects.toMatchObject({ status: 502 }));
