import { Router } from 'express';
import { z } from 'zod';
import { ErroApi, traduzirErroBanco } from '../erros.js';
import { apelidoSchema } from './esquemas.js';

const paraPerfil = (p) => ({ id: p.id, apelido: p.apelido, criadoEm: p.criado_em });
const naoEncontrado = () => new ErroApi(404, 'perfil_nao_encontrado', 'Perfil não encontrado.');

async function contar(db, coluna, perfilId) {
  const { count, error } = await db
    .from('seguidor')
    .select('*', { count: 'exact', head: true })
    .eq(coluna, perfilId);
  if (error) throw traduzirErroBanco(error);
  return count ?? 0;
}

export function criarRotasPerfis({ exigir }) {
  const rotas = Router();

  rotas.get('/perfis/disponivel', async (req, res) => {
    const apelido = apelidoSchema.parse(req.query.apelido);
    const { data, error } = await req.db.from('perfil').select('id').eq('apelido', apelido).maybeSingle();
    if (error) throw traduzirErroBanco(error);
    res.json({ disponivel: !data });
  });

  rotas.get('/perfis/:apelido', async (req, res) => {
    const apelido = apelidoSchema.safeParse(req.params.apelido);
    if (!apelido.success) throw naoEncontrado();
    const { data: perfil, error } = await req.db
      .from('perfil')
      .select('id, apelido, criado_em')
      .eq('apelido', apelido.data)
      .maybeSingle();
    if (error) throw traduzirErroBanco(error);
    if (!perfil) throw naoEncontrado();

    const [seguidores, seguindo] = await Promise.all([
      contar(req.db, 'seguido_id', perfil.id),
      contar(req.db, 'seguidor_id', perfil.id),
    ]);
    let euSigo = false;
    if (req.usuario && req.usuario.id !== perfil.id) {
      const { data, error: erroSigo } = await req.db
        .from('seguidor')
        .select('seguido_id')
        .eq('seguidor_id', req.usuario.id)
        .eq('seguido_id', perfil.id)
        .maybeSingle();
      if (erroSigo) throw traduzirErroBanco(erroSigo);
      euSigo = Boolean(data);
    }
    res.json({
      apelido: perfil.apelido,
      criadoEm: perfil.criado_em,
      seguidores,
      seguindo,
      euSigo,
      souEu: req.usuario?.id === perfil.id,
    });
  });

  rotas.get('/me', exigir, async (req, res) => {
    const { data, error } = await req.db
      .from('perfil')
      .select('id, apelido, criado_em')
      .eq('id', req.usuario.id)
      .single();
    if (error) throw traduzirErroBanco(error);
    res.json(paraPerfil(data));
  });

  rotas.patch('/me', exigir, async (req, res) => {
    const { apelido } = z.object({ apelido: apelidoSchema }).parse(req.body ?? {});
    const { data, error } = await req.db
      .from('perfil')
      .update({ apelido })
      .eq('id', req.usuario.id)
      .select('id, apelido, criado_em')
      .single();
    if (error) {
      throw traduzirErroBanco(error, { conflito: 'apelido_em_uso', mensagem: 'Esse apelido já está em uso.' });
    }
    res.json(paraPerfil(data));
  });

  return rotas;
}
