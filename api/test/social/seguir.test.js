import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('seguir duas vezes → 204 nas duas', async () => {
  const db = criarDbFalso({
    perfil: { data: { id: 'u2' }, error: null },
    seguidor: { data: null, error: { code: '23505' } },
  });
  const app = criarAppDeTeste({ db });
  for (let i = 0; i < 2; i++) {
    expect((await request(app).put('/api/perfis/qa_b/seguir').set('Authorization', 'Bearer bom')).status).toBe(204);
  }
});

test('seguir a si mesmo → 400', async () => {
  const db = criarDbFalso({ perfil: { data: { id: 'u1' }, error: null } });
  const r = await request(criarAppDeTeste({ db })).put('/api/perfis/eu_mesmo/seguir').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('seguir_a_si_mesmo');
});

test('seguir perfil inexistente → 404', async () => {
  const r = await request(criarAppDeTeste()).put('/api/perfis/ninguem/seguir').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('perfil_nao_encontrado');
});

test('seguir grava em nome do usuário do token', async () => {
  const db = criarDbFalso({ perfil: { data: { id: 'u2' }, error: null } });
  await request(criarAppDeTeste({ db })).put('/api/perfis/qa_b/seguir').set('Authorization', 'Bearer bom');
  expect(db.registro).toContainEqual(['seguidor', 'insert', [{ seguidor_id: 'u1', seguido_id: 'u2' }]]);
});

test('deixar de seguir quem não segue → 204 (idempotente)', async () => {
  const db = criarDbFalso({ perfil: { data: { id: 'u2' }, error: null }, seguidor: { data: [], error: null } });
  const r = await request(criarAppDeTeste({ db })).delete('/api/perfis/qa_b/seguir').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(204);
});

test('seguir sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).put('/api/perfis/qa_b/seguir')).status).toBe(401));
