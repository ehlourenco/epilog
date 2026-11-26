import request from 'supertest';
import { expect, test } from 'vitest';
import { criarAppDeTeste, criarDbFalso } from '../ajudantes.js';

const listaDe = (dono, tipo = 'personalizada') => ({
  data: { id: 7, perfil_id: dono, titulo: 'L', tipo, visibilidade: 'publica', perfil: { apelido: 'enzo' } },
  error: null,
});
const comToken = (req) => req.set('Authorization', 'Bearer bom');

test('GET /me/listas sem sessão → 401', async () =>
  expect((await request(criarAppDeTeste()).get('/api/me/listas')).status).toBe(401));

test('editar a Quero assistir → 400 lista_fixa', async () => {
  const db = criarDbFalso({ lista: listaDe('u1', 'quero_assistir') });
  const r = await comToken(request(criarAppDeTeste({ db })).patch('/api/listas/7')).send({ titulo: 'Outro' });
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('lista_fixa');
});

test('apagar a Quero assistir → 400 lista_fixa', async () => {
  const db = criarDbFalso({ lista: listaDe('u1', 'quero_assistir') });
  const r = await comToken(request(criarAppDeTeste({ db })).delete('/api/listas/7'));
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('lista_fixa');
});

test('alterar lista de outra pessoa → 403', async () => {
  const db = criarDbFalso({ lista: listaDe('outra') });
  const r = await comToken(request(criarAppDeTeste({ db })).patch('/api/listas/7')).send({ titulo: 'X' });
  expect(r.status).toBe(403);
});

test('lista inexistente ou invisível → 404 lista_nao_encontrada', async () => {
  const r = await request(criarAppDeTeste()).get('/api/listas/7');
  expect(r.status).toBe(404);
  expect(r.body.erro.codigo).toBe('lista_nao_encontrada');
});

test('série repetida na lista → 409 serie_ja_na_lista', async () => {
  const db = criarDbFalso({
    lista: listaDe('u1'),
    serie: { data: { id: 10 }, error: null },
    item_lista: (chamadas) =>
      chamadas.some(([, metodo]) => metodo === 'insert')
        ? { data: null, error: { code: '23505' } }
        : { data: { ordem: 2 }, error: null },
  });
  const r = await comToken(request(criarAppDeTeste({ db })).post('/api/listas/7/itens')).send({ tmdbId: 1396 });
  expect(r.status).toBe(409);
  expect(r.body.erro.codigo).toBe('serie_ja_na_lista');
});

test('nova ordem diferente dos itens atuais → 400 ordem_invalida', async () => {
  const db = criarDbFalso({
    lista: listaDe('u1'),
    item_lista: { data: [{ serie_id: 10, serie: { tmdb_id: 1396 } }, { serie_id: 11, serie: { tmdb_id: 1399 } }], error: null },
  });
  const r = await comToken(request(criarAppDeTeste({ db })).put('/api/listas/7/ordem')).send({ tmdbIds: [1396] });
  expect(r.status).toBe(400);
  expect(r.body.erro.codigo).toBe('ordem_invalida');
});

test('listas do perfil filtram explicitamente as públicas', async () => {
  const db = criarDbFalso({ lista: { data: [], error: null } });
  await request(criarAppDeTeste({ db })).get('/api/perfis/enzo/listas').set('Authorization', 'Bearer bom');
  expect(db.registro).toContainEqual(['lista', 'eq', ['visibilidade', 'publica']]);
});
