import { Router } from 'express';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { apelidoSchema } from '../perfis/esquemas.js';
import { idPositivo } from '../util/validacao.js';
import { avaliacaoSchema } from './esquemas.js';
import { listarResenhas } from './resenhas.js';

const CAMPOS = 'id, nota, texto, contem_spoiler, publicado_em';
const paraAvaliacao = (a) => ({
  id: a.id,
  nota: Number(a.nota),
  texto: a.texto,
  contemSpoiler: a.contem_spoiler,
  publicadoEm: a.publicado_em,
});

function semErro({ data, error }, mapa) {
  if (error) throw traduzirErroBanco(error, mapa);
  return data;
}

async function idDaSerie(db, tmdbId) {
  const serie = semErro(await db.from('serie').select('id').eq('tmdb_id', tmdbId).maybeSingle());
  if (!serie) throw new ErroApi(404, 'serie_nao_encontrada', 'Série não encontrada. Abra a página da série antes de avaliar.');
  return serie.id;
}

export function criarRotasAvaliacoes({ exigir }) {
  const rotas = Router();

  // Sem upsert: a permissão de update e a RLS valem por linha; buscar e decidir entre update e insert.
  rotas.put('/me/avaliacoes/:tmdbId', exigir, async (req, res) => {
    const tmdbId = idPositivo.parse(req.params.tmdbId);
    const { nota, texto, contemSpoiler } = avaliacaoSchema.parse(req.body ?? {});
    const serieId = await idDaSerie(req.db, tmdbId);
    const existente = semErro(
      await req.db.from('avaliacao').select('id').eq('perfil_id', req.usuario.id).eq('serie_id', serieId).maybeSingle(),
    );
    if (existente) {
      const atualizada = semErro(
        await req.db
          .from('avaliacao')
          .update({ nota, texto, contem_spoiler: contemSpoiler })
          .eq('id', existente.id)
          .eq('perfil_id', req.usuario.id)
          .select(CAMPOS)
          .single(),
      );
      return res.json(paraAvaliacao(atualizada));
    }
    const criada = semErro(
      await req.db
        .from('avaliacao')
        .insert({ perfil_id: req.usuario.id, serie_id: serieId, nota, texto, contem_spoiler: contemSpoiler })
        .select(CAMPOS)
        .single(),
      { conflito: 'avaliacao_existente', mensagem: 'Você já avaliou esta série.' },
    );
    return res.status(201).json(paraAvaliacao(criada));
  });

  rotas.delete('/me/avaliacoes/:tmdbId', exigir, async (req, res) => {
    const tmdbId = idPositivo.parse(req.params.tmdbId);
    const serieId = await idDaSerie(req.db, tmdbId);
    const apagadas = semErro(
      await req.db.from('avaliacao').delete().eq('perfil_id', req.usuario.id).eq('serie_id', serieId).select('id'),
    );
    if (!apagadas?.length) throw new ErroApi(404, 'avaliacao_nao_encontrada', 'Você não avaliou esta série.');
    res.status(204).end();
  });

  rotas.get('/series/:tmdbId/resenhas', async (req, res) => {
    const serieTmdbId = idPositivo.parse(req.params.tmdbId);
    res.json(await listarResenhas(req.db, { serieTmdbId }, req.query.antes));
  });

  rotas.get('/perfis/:apelido/resenhas', async (req, res) => {
    const apelido = apelidoSchema.safeParse(req.params.apelido);
    if (!apelido.success) return res.json({ itens: [], proximoCursor: null });
    res.json(await listarResenhas(req.db, { autorApelido: apelido.data }, req.query.antes));
  });

  return rotas;
}
