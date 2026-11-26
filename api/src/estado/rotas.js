import { Router } from 'express';
import { traduzirErroBanco } from '../erros.js';
import { idPositivo as idTmdb } from '../util/validacao.js';

function semErro({ data, error }) {
  if (error) throw traduzirErroBanco(error);
  return data;
}

// Relação do usuário logado com uma série: avaliação, Quero assistir e listas personalizadas.
// Consumida pelos PRs RF04 (nota e resenha) e RF05 (listas).
export function criarRotasEstado({ exigir }) {
  const rotas = Router();

  rotas.get('/me/series/:tmdbId/estado', exigir, async (req, res) => {
    const tmdbId = idTmdb.parse(req.params.tmdbId);
    const serie = semErro(
      await req.db.from('serie').select('id').eq('tmdb_id', tmdbId).maybeSingle(),
    );

    const avaliacao = serie
      ? semErro(
          await req.db
            .from('avaliacao')
            .select('id, nota, texto, contem_spoiler, publicado_em')
            .eq('perfil_id', req.usuario.id)
            .eq('serie_id', serie.id)
            .maybeSingle(),
        )
      : null;

    let consultaListas = req.db
      .from('lista')
      .select('id, titulo, tipo, criada_em, item_lista(serie_id)')
      .eq('perfil_id', req.usuario.id)
      .order('criada_em', { ascending: true });
    // Sem a série no banco, nenhuma lista pode contê-la; com ela, só traz o item dessa série.
    consultaListas = consultaListas.eq('item_lista.serie_id', serie?.id ?? -1);
    const listas = semErro(await consultaListas);

    const contem = (l) => l.item_lista.length > 0;
    const queroAssistir = listas.find((l) => l.tipo === 'quero_assistir');
    res.json({
      avaliacao: avaliacao && {
        id: avaliacao.id,
        nota: Number(avaliacao.nota),
        texto: avaliacao.texto,
        contemSpoiler: avaliacao.contem_spoiler,
        publicadoEm: avaliacao.publicado_em,
      },
      queroAssistir: {
        listaId: queroAssistir?.id ?? null,
        contem: queroAssistir ? contem(queroAssistir) : false,
      },
      listas: listas
        .filter((l) => l.tipo === 'personalizada')
        .map((l) => ({ id: l.id, titulo: l.titulo, contem: contem(l) })),
    });
  });

  return rotas;
}
