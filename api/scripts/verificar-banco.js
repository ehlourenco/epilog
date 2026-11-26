// Verifica, contra o projeto Supabase real, as regras de dados e de acesso do EpiLog.
// Cria dois usuários de teste (qa_a, qa_b) e duas séries de teste (tmdb_id negativos) e apaga tudo no fim.
// Uso: npm run verificar:banco -w api
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY } = process.env;
const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, opcoes);
const anonimo = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, opcoes);

const SENHA = `Verificacao-${crypto.randomUUID()}`;
const USUARIOS = [
  { email: 'qa-a@example.com', apelido: 'qa_a' },
  { email: 'qa-b@example.com', apelido: 'qa_b' },
];
const SERIES_TESTE = [-9999, -9998];
const hojeUtc = () => new Date().toISOString().slice(0, 10);
const daquiADias = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

let total = 0;
async function checar(nome, fn) {
  await fn();
  total += 1;
  console.log(`✔ ${total}. ${nome}`);
}

function semErro({ data, error }) {
  if (error) throw new Error(`erro inesperado: ${error.code} ${error.message}`);
  return data;
}

function esperaErro({ error }, codigo) {
  assert.ok(error, 'era esperado um erro e a operação passou');
  if (codigo) assert.equal(error.code, codigo, `código ${error.code} (${error.message})`);
}

async function limpar() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (USUARIOS.some((x) => x.email === u.email)) await admin.auth.admin.deleteUser(u.id);
  }
  await admin.from('serie').delete().in('tmdb_id', SERIES_TESTE);
}

async function criarUsuario({ email, apelido }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
    user_metadata: { apelido },
  });
  if (error) throw error;
  const cliente = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, opcoes);
  const login = await cliente.auth.signInWithPassword({ email, password: SENHA });
  if (login.error) throw login.error;
  return { id: data.user.id, db: cliente };
}

async function criarSerieDeTeste(tmdbId, qtdEpisodios) {
  const serie = semErro(
    await admin.from('serie').insert({ tmdb_id: tmdbId, nome: `Série de verificação ${tmdbId}` }).select('id').single(),
  );
  const temporada = semErro(
    await admin.from('temporada').insert({ serie_id: serie.id, numero: 1 }).select('id').single(),
  );
  const episodios = semErro(
    await admin
      .from('episodio')
      .insert(Array.from({ length: qtdEpisodios }, (_, i) => ({ temporada_id: temporada.id, numero: i + 1 })))
      .select('id, numero')
      .order('numero'),
  );
  return { serieId: serie.id, temporadaId: temporada.id, episodios };
}

async function principal() {
  await limpar();
  const A = await criarUsuario(USUARIOS[0]);
  const B = await criarUsuario(USUARIOS[1]);
  const s1 = await criarSerieDeTeste(SERIES_TESTE[0], 8);
  const s2 = await criarSerieDeTeste(SERIES_TESTE[1], 1);
  const e1 = s1.episodios[0].id;

  await checar('cadastro cria perfil (apelido em minúsculas) e lista Quero assistir privada', async () => {
    const perfil = semErro(await admin.from('perfil').select('apelido').eq('id', A.id).single());
    assert.equal(perfil.apelido, 'qa_a');
    const listas = semErro(await admin.from('lista').select('tipo, visibilidade').eq('perfil_id', A.id));
    assert.deepEqual(listas, [{ tipo: 'quero_assistir', visibilidade: 'privada' }]);
  });

  await checar('anônimo lê série, mas não insere', async () => {
    const lidas = semErro(await anonimo.from('serie').select('id').eq('tmdb_id', SERIES_TESTE[0]));
    assert.equal(lidas.length, 1);
    esperaErro(await anonimo.from('serie').insert({ tmdb_id: -1, nome: 'invasor' }));
  });

  await checar('diário de A é invisível para B e para anônimo', async () => {
    semErro(await A.db.from('diario').insert({ perfil_id: A.id, episodio_id: e1, assistido_em: hojeUtc() }));
    assert.equal(semErro(await A.db.from('diario').select('id').eq('perfil_id', A.id)).length, 1);
    assert.equal(semErro(await B.db.from('diario').select('id').eq('perfil_id', A.id)).length, 0);
    assert.equal(semErro(await anonimo.from('diario').select('id').eq('perfil_id', A.id)).length, 0);
  });

  await checar('A não insere no diário em nome de B', async () => {
    esperaErro(
      await A.db.from('diario').insert({ perfil_id: B.id, episodio_id: e1, assistido_em: hojeUtc() }),
      '42501',
    );
  });

  await checar('E01 registrado 2× numa temporada de 8 → progresso 1 de 8', async () => {
    semErro(
      await A.db
        .from('diario')
        .insert({ perfil_id: A.id, episodio_id: e1, assistido_em: hojeUtc(), revisita: true }),
    );
    const progresso = semErro(await A.db.rpc('meu_progresso', { p_temporada_id: s1.temporadaId }));
    assert.equal(progresso.length, 1);
    assert.equal(progresso[0].assistidos, 1);
    assert.equal(progresso[0].total, 8);
  });

  await checar('data de visualização no futuro é recusada', async () => {
    esperaErro(
      await A.db.from('diario').insert({ perfil_id: A.id, episodio_id: e1, assistido_em: daquiADias(2) }),
      '23514',
    );
  });

  await checar('nota fora da meia estrela é recusada; uma avaliação por série', async () => {
    esperaErro(await A.db.from('avaliacao').insert({ perfil_id: A.id, serie_id: s1.serieId, nota: 0.3 }), '23514');
    semErro(await A.db.from('avaliacao').insert({ perfil_id: A.id, serie_id: s1.serieId, nota: 4.5 }));
    esperaErro(await A.db.from('avaliacao').insert({ perfil_id: A.id, serie_id: s1.serieId, nota: 3 }), '23505');
  });

  let resenhaB;
  await checar('publicado_em é do servidor e não muda ao editar o texto', async () => {
    resenhaB = semErro(
      await B.db
        .from('avaliacao')
        .insert({ perfil_id: B.id, serie_id: s1.serieId, nota: 4, texto: 'Ótima', publicado_em: '2000-01-01' })
        .select('id, publicado_em')
        .single(),
    );
    const publicado = new Date(resenhaB.publicado_em).getTime();
    assert.ok(Math.abs(Date.now() - publicado) < 5 * 60_000, `publicado_em = ${resenhaB.publicado_em}`);
    const editada = semErro(
      await B.db.from('avaliacao').update({ texto: 'Ótima série' }).eq('id', resenhaB.id).select('publicado_em').single(),
    );
    assert.equal(new Date(editada.publicado_em).getTime(), publicado);
  });

  let listaPublica;
  await checar('lista privada só para o dono; pública para todos', async () => {
    const privada = semErro(
      await A.db.from('lista').insert({ perfil_id: A.id, titulo: 'Privada A', tipo: 'personalizada', visibilidade: 'privada' }).select('id').single(),
    );
    listaPublica = semErro(
      await A.db.from('lista').insert({ perfil_id: A.id, titulo: 'Pública A', tipo: 'personalizada', visibilidade: 'publica' }).select('id').single(),
    );
    assert.equal(semErro(await B.db.from('lista').select('id').eq('id', privada.id)).length, 0);
    assert.equal(semErro(await anonimo.from('lista').select('id').eq('id', privada.id)).length, 0);
    assert.equal(semErro(await B.db.from('lista').select('id').eq('id', listaPublica.id)).length, 1);
    assert.equal(semErro(await anonimo.from('lista').select('id').eq('id', listaPublica.id)).length, 1);
  });

  await checar('Quero assistir não se apaga, não se duplica e não fica pública', async () => {
    const qa = semErro(await A.db.from('lista').select('id').eq('tipo', 'quero_assistir').eq('perfil_id', A.id).single());
    const apagadas = semErro(await A.db.from('lista').delete().eq('id', qa.id).select('id'));
    assert.equal(apagadas.length, 0);
    assert.equal(semErro(await admin.from('lista').select('id').eq('id', qa.id)).length, 1);
    esperaErro(await A.db.from('lista').insert({ perfil_id: A.id, titulo: 'Outra', tipo: 'quero_assistir', visibilidade: 'privada' }));
    esperaErro(await A.db.from('lista').update({ visibilidade: 'publica' }).eq('id', qa.id), '23514');
  });

  await checar('série não se repete na lista; B não mexe na lista de A', async () => {
    semErro(await A.db.from('item_lista').insert({ lista_id: listaPublica.id, serie_id: s1.serieId, ordem: 1 }));
    esperaErro(await A.db.from('item_lista').insert({ lista_id: listaPublica.id, serie_id: s1.serieId, ordem: 2 }), '23505');
    esperaErro(await B.db.from('item_lista').insert({ lista_id: listaPublica.id, serie_id: s2.serieId, ordem: 3 }));
  });

  await checar('não se segue o próprio perfil; seguir é único', async () => {
    esperaErro(await A.db.from('seguidor').insert({ seguidor_id: A.id, seguido_id: A.id }), '23514');
    semErro(await A.db.from('seguidor').insert({ seguidor_id: A.id, seguido_id: B.id }));
    esperaErro(await A.db.from('seguidor').insert({ seguidor_id: A.id, seguido_id: B.id }), '23505');
  });

  await checar('feed de A traz a resenha com texto de B e não a nota sem texto', async () => {
    semErro(await B.db.from('avaliacao').insert({ perfil_id: B.id, serie_id: s2.serieId, nota: 3 }));
    const feed = semErro(await A.db.rpc('listar_resenhas', { p_so_seguidos: true }));
    const deTeste = feed.filter((r) => SERIES_TESTE.includes(r.serie_tmdb_id));
    assert.deepEqual(deTeste.map((r) => r.id), [resenhaB.id]);
    assert.equal(deTeste[0].autor_apelido, 'qa_b');
  });
}

try {
  await principal();
  console.log(`\nTodas as ${total} verificações passaram.`);
} catch (erro) {
  console.error(`\n✘ Falhou na verificação ${total + 1}:`, erro.message);
  process.exitCode = 1;
} finally {
  await limpar();
}
