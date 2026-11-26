import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('PATCH /me com apelido em uso → 409', async () => {
  const db = criarDbFalso({ perfil: { data: null, error: { code: '23505' } } });
  const r = await request(criarAppDeTeste({ db }))
    .patch('/api/me')
    .set('Authorization', 'Bearer bom')
    .send({ apelido: 'enzo' });
  expect(r.status).toBe(409);
  expect(r.body.erro.codigo).toBe('apelido_em_uso');
});

test('disponível com apelido inválido → 400', async () =>
  expect((await request(criarAppDeTeste()).get('/api/perfis/disponivel?apelido=a b')).status).toBe(400));

test('disponível normaliza e consulta em minúsculas', async () => {
  const db = criarDbFalso({ perfil: { data: null, error: null } });
  const r = await request(criarAppDeTeste({ db })).get('/api/perfis/disponivel?apelido=Enzo_99');
  expect(r.body).toEqual({ disponivel: true });
  expect(db.registro).toContainEqual(['perfil', 'eq', ['apelido', 'enzo_99']]);
});

test('perfil público inexistente → 404 perfil_nao_encontrado', async () => {
  const r = await request(criarAppDeTeste()).get('/api/perfis/ninguem');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('perfil_nao_encontrado');
});
