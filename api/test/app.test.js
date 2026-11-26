import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste } from './ajudantes.js';

test('GET /api/saude', async () => {
  const r = await request(criarAppDeTeste()).get('/api/saude');
  expect(r.status).toBe(200);
  expect(r.body).toEqual({ ok: true });
});

test('rota desconhecida', async () => {
  const r = await request(criarAppDeTeste()).get('/api/nao-existe');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('rota_nao_encontrada');
});

test('JSON malformado', async () => {
  const r = await request(criarAppDeTeste())
    .post('/api/saude')
    .set('Content-Type', 'application/json')
    .send('{');
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('json_invalido');
});
