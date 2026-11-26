import request from 'supertest';
import { expect, test } from 'vitest';
import { codificarCursor } from '../../src/util/paginacao.js';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

test('GET /me/diario sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).get('/api/me/diario')).status).toBe(401));

test('GET /me/progresso sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).get('/api/me/progresso')).status).toBe(401));

test('POST /me/diario com corpo inválido → 400 sem tocar no banco', async () => {
  const db = criarDbFalso({});
  const r = await request(criarAppDeTeste({ db }))
    .post('/api/me/diario')
    .set('Authorization', 'Bearer bom')
    .send({ episodioId: 'x' });
  expect(r.status).toBe(400);
  expect(db.registro).toHaveLength(0);
});

test('?antes=lixo → 400 cursor_invalido', async () => {
  const r = await request(criarAppDeTeste()).get('/api/me/diario?antes=lixo').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('cursor_invalido');
});

test('cursor com chave que não é data → 400 (nada chega ao filtro do banco)', async () => {
  const db = criarDbFalso({});
  const cursor = codificarCursor({ chave: '2026-01-01,id.gt.0', id: 1 });
  const r = await request(criarAppDeTeste({ db }))
    .get(`/api/me/diario?antes=${cursor}`)
    .set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400);
  expect(db.registro).toHaveLength(0);
});

test('POST /me/diario sempre grava em nome do usuário do token', async () => {
  const db = criarDbFalso({
    diario: {
      data: {
        id: 9,
        assistido_em: '2026-11-25',
        revisita: false,
        episodio: { id: 3, numero: 1, nome: 'Piloto', temporada: { numero: 1, serie: { tmdb_id: 1396, nome: 'Breaking Bad', poster_path: '/p.jpg' } } },
      },
      error: null,
    },
  });
  const r = await request(criarAppDeTeste({ db }))
    .post('/api/me/diario')
    .set('Authorization', 'Bearer bom')
    .send({ episodioId: 3, assistidoEm: '2026-11-25', perfil_id: 'outro' });
  expect(r.status).toBe(201);
  expect(db.registro).toContainEqual([
    'diario',
    'insert',
    [{ perfil_id: 'u1', episodio_id: 3, assistido_em: '2026-11-25', revisita: false }],
  ]);
  expect(r.body).toMatchObject({ id: 9, serie: { tmdbId: 1396, posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg' } });
});

test('DELETE de registro que não é seu (ou não existe) → 404', async () => {
  const db = criarDbFalso({ diario: { data: [], error: null } });
  const r = await request(criarAppDeTeste({ db })).delete('/api/me/diario/42').set('Authorization', 'Bearer bom');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('registro_nao_encontrado');
});

test('ID de série acima do inteiro do banco no estado da temporada → 400 sem tocar no banco', async () => {
  const db = criarDbFalso({});
  const r = await request(criarAppDeTeste({ db }))
    .get('/api/me/series/2147483648/temporadas/1')
    .set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400);
  expect(db.registro).toHaveLength(0);
});

test('cursor bem formado com data inexistente → 400 sem tocar no banco', async () => {
  const db = criarDbFalso({});
  const r = await request(criarAppDeTeste({ db }))
    .get(`/api/me/diario?antes=${codificarCursor({ chave: '2026-13-45', id: 1 })}`)
    .set('Authorization', 'Bearer bom');
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('cursor_invalido');
  expect(db.registro).toHaveLength(0);
});
