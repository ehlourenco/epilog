import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('rota pessoal sem token → 401 nao_autenticado', async () => {
  const r = await request(criarAppDeTeste()).get('/api/me');
  expect(r.status).toBe(401);
  expect(r.body.erro.codigo).toBe('nao_autenticado');
});

test.each(['Bearer ruim', 'Basic xyz'])(
  'header %s → 401 token_invalido mesmo em rota pública',
  async (h) => {
    const r = await request(criarAppDeTeste()).get('/api/saude').set('Authorization', h);
    expect(r.status).toBe(401);
    expect(r.body.erro.codigo).toBe('token_invalido');
  },
);

test('token válido chega à rota pessoal com o usuário do token', async () => {
  const db = criarDbFalso({
    perfil: { data: { id: 'u1', apelido: 'enzo', criado_em: '2026-11-25T00:00:00Z' }, error: null },
  });
  const r = await request(criarAppDeTeste({ db })).get('/api/me').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(200);
  expect(r.body).toEqual({ id: 'u1', apelido: 'enzo', criadoEm: '2026-11-25T00:00:00Z' });
  expect(db.registro).toContainEqual(['perfil', 'eq', ['id', 'u1']]);
});
