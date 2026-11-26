import request from 'supertest';
import { expect, test } from 'vitest';
import { codificarCursor } from '../../src/util/paginacao.js';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('PUT /me/avaliacoes sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).put('/api/me/avaliacoes/1396').send({ nota: 4 })).status).toBe(401));

test('PUT com nota inválida → 400 sem tocar no banco', async () => {
  const db = criarDbFalso({});
  const r = await request(criarAppDeTeste({ db }))
    .put('/api/me/avaliacoes/1396')
    .set('Authorization', 'Bearer bom')
    .send({ nota: 4.25 });
  expect(r.status).toBe(400);
  expect(db.registro).toHaveLength(0);
});

test('PUT em série que não está no banco → 404 serie_nao_encontrada', async () => {
  const db = criarDbFalso({ serie: { data: null, error: null } });
  const r = await request(criarAppDeTeste({ db }))
    .put('/api/me/avaliacoes/1396')
    .set('Authorization', 'Bearer bom')
    .send({ nota: 4 });
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('serie_nao_encontrada');
});

test('PUT sem avaliação anterior insere em nome do usuário do token (sem upsert)', async () => {
  const db = criarDbFalso({
    serie: { data: { id: 10 }, error: null },
    avaliacao: (chamadas) =>
      chamadas.some(([, metodo]) => metodo === 'insert')
        ? { data: { id: 5, nota: 4.5, texto: 'Ótima', contem_spoiler: false, publicado_em: '2026-11-26T01:00:00Z' }, error: null }
        : { data: null, error: null },
  });
  const r = await request(criarAppDeTeste({ db }))
    .put('/api/me/avaliacoes/1396')
    .set('Authorization', 'Bearer bom')
    .send({ nota: 4.5, texto: 'Ótima' });
  expect(r.status).toBe(201);
  expect(db.registro).toContainEqual([
    'avaliacao',
    'insert',
    [{ perfil_id: 'u1', serie_id: 10, nota: 4.5, texto: 'Ótima', contem_spoiler: false }],
  ]);
  expect(db.registro.some(([, metodo]) => metodo === 'upsert')).toBe(false);
  expect(r.body).toEqual({ id: 5, nota: 4.5, texto: 'Ótima', contemSpoiler: false, publicadoEm: '2026-11-26T01:00:00Z' });
});

test('resenhas com cursor de data inválida → 400', async () => {
  const r = await request(criarAppDeTeste()).get(
    `/api/series/1396/resenhas?antes=${codificarCursor({ chave: 'não é data', id: 1 })}`,
  );
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('cursor_invalido');
});

test('resenhas da série mapeiam autor, série e curtidas', async () => {
  const db = criarDbFalso({
    'rpc:listar_resenhas': {
      data: [
        {
          id: 7, nota: '4.5', texto: 'Muito bom', contem_spoiler: true, publicado_em: '2026-11-26T01:00:00.123456+00:00',
          autor_apelido: 'qa_b', serie_tmdb_id: 1396, serie_nome: 'Breaking Bad', poster_path: '/p.jpg', curtidas: 2, curti: false,
        },
      ],
      error: null,
    },
  });
  const r = await request(criarAppDeTeste({ db })).get('/api/series/1396/resenhas');
  expect(r.status).toBe(200);
  expect(r.body).toEqual({
    itens: [
      {
        id: 7, nota: 4.5, texto: 'Muito bom', contemSpoiler: true, publicadoEm: '2026-11-26T01:00:00.123456+00:00',
        autor: { apelido: 'qa_b' }, serie: { tmdbId: 1396, nome: 'Breaking Bad', posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg' },
        curtidas: 2, curti: false,
      },
    ],
    proximoCursor: null,
  });
  expect(db.registro).toContainEqual([
    'rpc:listar_resenhas',
    'rpc',
    [{ p_serie_tmdb_id: 1396, p_autor_apelido: null, p_so_seguidos: false, p_antes_publicado: null, p_antes_id: null, p_limite: 21 }],
  ]);
});

test('DELETE de avaliação inexistente → 404 avaliacao_nao_encontrada', async () => {
  const db = criarDbFalso({ serie: { data: { id: 10 }, error: null }, avaliacao: { data: [], error: null } });
  const r = await request(criarAppDeTeste({ db })).delete('/api/me/avaliacoes/1396').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('avaliacao_nao_encontrada');
});
