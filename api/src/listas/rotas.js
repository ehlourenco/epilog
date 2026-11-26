import { Router } from 'express';
import { urlPoster } from '../catalogo/mapeadores.js';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { apelidoSchema } from '../perfis/esquemas.js';
import { idPositivo } from '../util/validacao.js';
import { edicaoListaSchema, itemSchema, novaListaSchema, ordemSchema } from './esquemas.js';

const RESUMO = 'id, titulo, tipo, visibilidade, criada_em, item_lista(count)';
const paraResumo = (l) => ({
  id: l.id,
  titulo: l.titulo,
  tipo: l.tipo,
  visibilidade: l.visibilidade,
  qtdItens: l.item_lista?.[0]?.count ?? 0,
});
const queroAssistirPrimeiro = (a, b) => (a.tipo === 'quero_assistir' ? -1 : b.tipo === 'quero_assistir' ? 1 : 0);

function semErro({ data, error }, mapa) {
  if (error) throw traduzirErroBanco(error, mapa);
  return data;
}

// A RLS já esconde listas privadas de outras pessoas: para quem pede, "invisível" e "inexistente" são o mesmo 404.
async function carregarLista(db, id) {
  const lista = semErro(
    await db
      .from('lista')
      .select('id, perfil_id, titulo, tipo, visibilidade, perfil:perfil_id(apelido)')
      .eq('id', id)
      .maybeSingle(),
  );
  if (!lista) throw new ErroApi(404, 'lista_nao_encontrada', 'Lista não encontrada.');
  return lista;
}

async function carregarMinhaLista(req, { permitirFixa = true } = {}) {
  const lista = await carregarLista(req.db, idPositivo.parse(req.params.id));
  if (lista.perfil_id !== req.usuario.id) throw new ErroApi(403, 'nao_e_dono', 'Só o dono pode alterar esta lista.');
  if (!permitirFixa && lista.tipo === 'quero_assistir') {
    throw new ErroApi(400, 'lista_fixa', 'A lista Quero assistir não pode ser renomeada, tornada pública nem excluída.');
  }
  return lista;
}

async function idDaSerie(db, tmdbId) {
  const serie = semErro(await db.from('serie').select('id').eq('tmdb_id', tmdbId).maybeSingle());
  if (!serie) throw new ErroApi(404, 'serie_nao_encontrada', 'Série não encontrada. Abra a página da série antes.');
  return serie.id;
}

export function criarRotasListas({ exigir }) {
  const rotas = Router();

  rotas.get('/me/listas', exigir, async (req, res) => {
    const listas = semErro(
      await req.db.from('lista').select(RESUMO).eq('perfil_id', req.usuario.id).order('criada_em', { ascending: true }),
    );
    res.json(listas.map(paraResumo).sort(queroAssistirPrimeiro));
  });

  rotas.post('/me/listas', exigir, async (req, res) => {
    const { titulo, visibilidade } = novaListaSchema.parse(req.body ?? {});
    const lista = semErro(
      await req.db
        .from('lista')
        .insert({ perfil_id: req.usuario.id, titulo, tipo: 'personalizada', visibilidade })
        .select(RESUMO)
        .single(),
    );
    res.status(201).json(paraResumo(lista));
  });

  rotas.get('/listas/:id', async (req, res) => {
    const lista = await carregarLista(req.db, idPositivo.parse(req.params.id));
    const itens = semErro(
      await req.db
        .from('item_lista')
        .select('ordem, serie:serie_id(tmdb_id, nome, poster_path)')
        .eq('lista_id', lista.id)
        .order('ordem', { ascending: true }),
    );
    res.json({
      id: lista.id,
      titulo: lista.titulo,
      tipo: lista.tipo,
      visibilidade: lista.visibilidade,
      dono: { apelido: lista.perfil.apelido },
      souDono: req.usuario?.id === lista.perfil_id,
      itens: itens.map((i) => ({
        tmdbId: i.serie.tmdb_id,
        nome: i.serie.nome,
        posterUrl: urlPoster(i.serie.poster_path),
        ordem: i.ordem,
      })),
    });
  });

  rotas.patch('/listas/:id', exigir, async (req, res) => {
    const edicao = edicaoListaSchema.parse(req.body ?? {});
    const lista = await carregarMinhaLista(req, { permitirFixa: false });
    const atualizada = semErro(
      await req.db.from('lista').update(edicao).eq('id', lista.id).eq('perfil_id', req.usuario.id).select(RESUMO).single(),
    );
    res.json(paraResumo(atualizada));
  });

  rotas.delete('/listas/:id', exigir, async (req, res) => {
    const lista = await carregarMinhaLista(req, { permitirFixa: false });
    semErro(await req.db.from('lista').delete().eq('id', lista.id).eq('perfil_id', req.usuario.id));
    res.status(204).end();
  });

  rotas.post('/listas/:id/itens', exigir, async (req, res) => {
    const { tmdbId } = itemSchema.parse(req.body ?? {});
    const lista = await carregarMinhaLista(req);
    const serieId = await idDaSerie(req.db, tmdbId);
    const ultimo = semErro(
      await req.db
        .from('item_lista')
        .select('ordem')
        .eq('lista_id', lista.id)
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    const ordem = (ultimo?.ordem ?? 0) + 1;
    semErro(await req.db.from('item_lista').insert({ lista_id: lista.id, serie_id: serieId, ordem }), {
      conflito: 'serie_ja_na_lista',
      mensagem: 'Essa série já está na lista.',
    });
    res.status(201).json({ tmdbId, ordem });
  });

  rotas.delete('/listas/:id/itens/:tmdbId', exigir, async (req, res) => {
    const tmdbId = idPositivo.parse(req.params.tmdbId);
    const lista = await carregarMinhaLista(req);
    const serieId = await idDaSerie(req.db, tmdbId);
    const removidos = semErro(
      await req.db.from('item_lista').delete().eq('lista_id', lista.id).eq('serie_id', serieId).select('serie_id'),
    );
    if (!removidos?.length) throw new ErroApi(404, 'item_nao_encontrado', 'Essa série não está na lista.');
    res.status(204).end();
  });

  // Não é atômico (uma atualização por item), o que basta para listas pequenas de um único dono.
  rotas.put('/listas/:id/ordem', exigir, async (req, res) => {
    const { tmdbIds } = ordemSchema.parse(req.body ?? {});
    const lista = await carregarMinhaLista(req);
    const atuais = semErro(await req.db.from('item_lista').select('serie_id, serie:serie_id(tmdb_id)').eq('lista_id', lista.id));
    const serieIdPorTmdb = new Map(atuais.map((i) => [i.serie.tmdb_id, i.serie_id]));
    const mesmoConjunto = tmdbIds.length === serieIdPorTmdb.size && tmdbIds.every((id) => serieIdPorTmdb.has(id));
    if (!mesmoConjunto) {
      throw new ErroApi(400, 'ordem_invalida', 'A nova ordem precisa conter exatamente as séries da lista.');
    }
    const resultados = await Promise.all(
      tmdbIds.map((id, indice) =>
        req.db
          .from('item_lista')
          .update({ ordem: indice + 1 })
          .eq('lista_id', lista.id)
          .eq('serie_id', serieIdPorTmdb.get(id)),
      ),
    );
    resultados.forEach((r) => semErro(r));
    res.status(204).end();
  });

  // Página pública do perfil: só listas públicas, mesmo quando o próprio dono está vendo.
  rotas.get('/perfis/:apelido/listas', async (req, res) => {
    const apelido = apelidoSchema.safeParse(req.params.apelido);
    if (!apelido.success) return res.json([]);
    const listas = semErro(
      await req.db
        .from('lista')
        .select(`${RESUMO}, perfil!inner(apelido)`)
        .eq('perfil.apelido', apelido.data)
        .eq('visibilidade', 'publica')
        .order('criada_em', { ascending: true }),
    );
    res.json(listas.map(paraResumo));
  });

  return rotas;
}
