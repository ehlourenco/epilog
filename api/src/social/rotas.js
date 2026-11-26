import { Router } from 'express';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { listarResenhas } from '../avaliacoes/resenhas.js';
import { apelidoSchema } from '../perfis/esquemas.js';
import { idPositivo } from '../util/validacao.js';

const perfilNaoEncontrado = () =>
  new ErroApi(404, 'perfil_nao_encontrado', 'Perfil não encontrado.');

async function idDoPerfil(db, apelidoBruto) {
  const apelido = apelidoSchema.safeParse(apelidoBruto);
  if (!apelido.success) throw perfilNaoEncontrado();
  const { data, error } = await db
    .from('perfil')
    .select('id')
    .eq('apelido', apelido.data)
    .maybeSingle();
  if (error) throw traduzirErroBanco(error);
  if (!data) throw perfilNaoEncontrado();
  return data.id;
}

// Seguir e curtir são idempotentes: repetir o pedido (duplo clique, outra aba) responde 204 do mesmo jeito.
export function criarRotasSocial({ exigir }) {
  const rotas = Router();

  rotas.put('/perfis/:apelido/seguir', exigir, async (req, res) => {
    const seguidoId = await idDoPerfil(req.db, req.params.apelido);
    if (seguidoId === req.usuario.id) {
      throw new ErroApi(400, 'seguir_a_si_mesmo', 'Você não pode seguir o próprio perfil.');
    }
    const { error } = await req.db
      .from('seguidor')
      .insert({ seguidor_id: req.usuario.id, seguido_id: seguidoId });
    if (error && error.code !== '23505') throw traduzirErroBanco(error);
    res.status(204).end();
  });

  rotas.delete('/perfis/:apelido/seguir', exigir, async (req, res) => {
    const seguidoId = await idDoPerfil(req.db, req.params.apelido);
    const { error } = await req.db
      .from('seguidor')
      .delete()
      .eq('seguidor_id', req.usuario.id)
      .eq('seguido_id', seguidoId);
    if (error) throw traduzirErroBanco(error);
    res.status(204).end();
  });

  rotas.put('/avaliacoes/:id/curtida', exigir, async (req, res) => {
    const avaliacaoId = idPositivo.parse(req.params.id);
    const { error } = await req.db.from('curtida').insert({ perfil_id: req.usuario.id, avaliacao_id: avaliacaoId });
    if (error && error.code !== '23505') {
      throw traduzirErroBanco(error, { referencia: 'avaliacao_nao_encontrada', mensagem: 'Resenha não encontrada.' });
    }
    res.status(204).end();
  });

  rotas.delete('/avaliacoes/:id/curtida', exigir, async (req, res) => {
    const avaliacaoId = idPositivo.parse(req.params.id);
    const { error } = await req.db
      .from('curtida')
      .delete()
      .eq('perfil_id', req.usuario.id)
      .eq('avaliacao_id', avaliacaoId);
    if (error) throw traduzirErroBanco(error);
    res.status(204).end();
  });

  // Feed: resenhas dos perfis seguidos, da mais recente para a mais antiga (por data de publicação).
  rotas.get('/feed', exigir, async (req, res) => {
    res.json(await listarResenhas(req.db, { soSeguidos: true }, req.query.antes));
  });

  return rotas;
}
