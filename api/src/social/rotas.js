import { Router } from 'express';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { apelidoSchema } from '../perfis/esquemas.js';

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

  return rotas;
}
