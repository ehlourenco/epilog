import { expect, test } from 'vitest';
import { carregarConfig } from '../src/config.js';

const base = {
  SUPABASE_URL: 'https://x.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'pk',
  SUPABASE_SECRET_KEY: 'sk',
  TMDB_READ_TOKEN: 't',
};

test('aplica padrões', () => {
  const c = carregarConfig(base);
  expect(c.port).toBe(3333);
  expect(c.cacheCatalogoHoras).toBe(24);
  expect(c.corsOrigin).toBeNull();
});

test('CACHE_CATALOGO_HORAS=0 desliga o cache', () =>
  expect(carregarConfig({ ...base, CACHE_CATALOGO_HORAS: '0' }).cacheCatalogoHoras).toBe(0));

test('acusa variável obrigatória ausente', () =>
  expect(() => carregarConfig({ ...base, TMDB_READ_TOKEN: undefined })).toThrow(/TMDB_READ_TOKEN/));
