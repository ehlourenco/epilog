import { Router } from 'express';
import { z } from 'zod';
import { urlPoster } from '../catalogo/mapeadores.js';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { decodificarCursor, paginar, TAMANHO_PAGINA } from '../util/paginacao.js';
import { criarEsquemasDiario } from './esquemas.js';

const SELECT_ENTRADA =
  'id, assistido_em, revisita, episodio:episodio_id(id, numero, nome, temporada:temporada_id(numero, serie:serie_id(tmdb_id, nome, poster_path)))';
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const ID_INVALIDO = { error: 'Identificador inválido.' };
const idPositivo = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).positive(ID_INVALIDO);
const numeroTemporada = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).min(0, ID_INVALIDO);
const naoEncontrado = () => new ErroApi(404, 'registro_nao_encontrado', 'Registro não encontrado no seu diário.');

function semErro({ data, error }, mapa) {
  if (error) throw traduzirErroBanco(error, mapa);
  return data;
}

export function mapearEntrada(linha) {
  const { episodio } = linha;
  return {
    id: linha.id,
    assistidoEm: linha.assistido_em,
    revisita: linha.revisita,
    episodio: { id: episodio.id, numero: episodio.numero, nome: episodio.nome },
    temporada: { numero: episodio.temporada.numero },
    serie: {
      tmdbId: episodio.temporada.serie.tmdb_id,
      nome: episodio.temporada.serie.nome,
      posterUrl: urlPoster(episodio.temporada.serie.poster_path),
    },
  };
}

export function criarRotasDiario({ exigir, hoje }) {
  const rotas = Router();
  const { novaEntrada, edicaoEntrada } = criarEsquemasDiario({ hoje });

  rotas.get('/me/diario', exigir, async (req, res) => {
    const cursor = req.query.antes ? decodificarCursor(String(req.query.antes), FORMATO_DATA) : null;
    let consulta = req.db
      .from('diario')
      .select(SELECT_ENTRADA)
      .eq('perfil_id', req.usuario.id)
      .order('assistido_em', { ascending: false })
      .order('id', { ascending: false })
      .limit(TAMANHO_PAGINA + 1);
    if (cursor) {
      consulta = consulta.or(
        `assistido_em.lt.${cursor.chave},and(assistido_em.eq.${cursor.chave},id.lt.${cursor.id})`,
      );
    }
    const pagina = paginar(semErro(await consulta), (l) => l.assistido_em);
    res.json({ itens: pagina.itens.map(mapearEntrada), proximoCursor: pagina.proximoCursor });
  });

  rotas.post('/me/diario', exigir, async (req, res) => {
    const entrada = novaEntrada.parse(req.body ?? {});
    const linha = semErro(
      await req.db
        .from('diario')
        .insert({
          perfil_id: req.usuario.id,
          episodio_id: entrada.episodioId,
          assistido_em: entrada.assistidoEm,
          revisita: entrada.revisita,
        })
        .select(SELECT_ENTRADA)
        .single(),
      { referencia: 'episodio_nao_encontrado', mensagem: 'Episódio não encontrado.' },
    );
    res.status(201).json(mapearEntrada(linha));
  });

  rotas.patch('/me/diario/:id', exigir, async (req, res) => {
    const id = idPositivo.parse(req.params.id);
    const edicao = edicaoEntrada.parse(req.body ?? {});
    const campos = {};
    if (edicao.assistidoEm !== undefined) campos.assistido_em = edicao.assistidoEm;
    if (edicao.revisita !== undefined) campos.revisita = edicao.revisita;
    const linha = semErro(
      await req.db
        .from('diario')
        .update(campos)
        .eq('id', id)
        .eq('perfil_id', req.usuario.id)
        .select(SELECT_ENTRADA)
        .maybeSingle(),
    );
    if (!linha) throw naoEncontrado();
    res.json(mapearEntrada(linha));
  });

  rotas.delete('/me/diario/:id', exigir, async (req, res) => {
    const id = idPositivo.parse(req.params.id);
    const apagadas = semErro(
      await req.db.from('diario').delete().eq('id', id).eq('perfil_id', req.usuario.id).select('id'),
    );
    if (!apagadas?.length) throw naoEncontrado();
    res.status(204).end();
  });

  rotas.get('/me/series/:tmdbId/temporadas/:n', exigir, async (req, res) => {
    const tmdbId = idPositivo.parse(req.params.tmdbId);
    const numero = numeroTemporada.parse(req.params.n);
    const temporada = semErro(
      await req.db
        .from('temporada')
        .select('id, serie!inner(tmdb_id)')
        .eq('serie.tmdb_id', tmdbId)
        .eq('numero', numero)
        .maybeSingle(),
    );
    if (!temporada) return res.json({ assistidos: 0, total: 0, porEpisodio: {}, registros: [] });

    const [progresso, registros] = await Promise.all([
      req.db.rpc('meu_progresso', { p_temporada_id: temporada.id }).then((r) => semErro(r)),
      req.db
        .from('diario')
        .select('id, episodio_id, assistido_em, revisita, episodio!inner(temporada_id)')
        .eq('perfil_id', req.usuario.id)
        .eq('episodio.temporada_id', temporada.id)
        .order('assistido_em', { ascending: false })
        .order('id', { ascending: false })
        .then((r) => semErro(r)),
    ]);

    let total = progresso?.[0]?.total;
    if (total === undefined) {
      const { count, error } = await req.db
        .from('episodio')
        .select('*', { count: 'exact', head: true })
        .eq('temporada_id', temporada.id);
      if (error) throw traduzirErroBanco(error);
      total = count ?? 0;
    }

    const porEpisodio = {};
    for (const r of registros) porEpisodio[r.episodio_id] = (porEpisodio[r.episodio_id] ?? 0) + 1;
    res.json({
      assistidos: progresso?.[0]?.assistidos ?? 0,
      total,
      porEpisodio,
      registros: registros.map((r) => ({
        id: r.id,
        episodioId: r.episodio_id,
        assistidoEm: r.assistido_em,
        revisita: r.revisita,
      })),
    });
  });

  rotas.get('/me/progresso', exigir, async (req, res) => {
    const linhas = semErro(await req.db.rpc('meu_progresso'));
    res.json(
      linhas.map((l) => ({
        serieTmdbId: l.serie_tmdb_id,
        serieNome: l.serie_nome,
        posterUrl: urlPoster(l.poster_path),
        temporadaNumero: l.temporada_numero,
        assistidos: l.assistidos,
        total: l.total,
        ultimoAssistido: l.ultimo_assistido,
      })),
    );
  });

  return rotas;
}
