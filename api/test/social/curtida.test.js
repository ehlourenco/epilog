import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('curtir duas vezes → 204 nas duas', async () => {
  const db = criarDbFalso({ curtida: { data: null, error: { code: '23505' } } });
  const app = criarAppDeTeste({ db });
  for (let i = 0; i < 2; i++) {
    expect((await request(app).put('/api/avaliacoes/5/curtida').set('Authorization', 'Bearer bom')).status).toBe(204);
  }
});

test('curtir avaliação inexistente → 404 avaliacao_nao_encontrada', async () => {
  const db = criarDbFalso({ curtida: { data: null, error: { code: '23503' } } });
  const r = await request(criarAppDeTeste({ db })).put('/api/avaliacoes/999/curtida').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('avaliacao_nao_encontrada');
});

test('curtir grava em nome do usuário do token', async () => {
  const db = criarDbFalso({});
  await request(criarAppDeTeste({ db })).put('/api/avaliacoes/5/curtida').set('Authorization', 'Bearer bom');
  expect(db.registro).toContainEqual(['curtida', 'insert', [{ perfil_id: 'u1', avaliacao_id: 5 }]]);
});

test('descurtir o que não curtiu → 204 (idempotente)', async () => {
  const r = await request(criarAppDeTeste()).delete('/api/avaliacoes/5/curtida').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(204);
});

test('GET /api/feed sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).get('/api/feed')).status).toBe(401));

test('feed pede só resenhas de quem o usuário segue', async () => {
  const db = criarDbFalso({ 'rpc:listar_resenhas': { data: [], error: null } });
  const r = await request(criarAppDeTeste({ db })).get('/api/feed').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(200);
  expect(r.body).toEqual({ itens: [], proximoCursor: null });
  expect(db.registro).toContainEqual([
    'rpc:listar_resenhas',
    'rpc',
    [{ p_serie_tmdb_id: null, p_autor_apelido: null, p_so_seguidos: true, p_antes_publicado: null, p_antes_id: null, p_limite: 21 }],
  ]);
});
