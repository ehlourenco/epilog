import { Router } from 'express';
import { z } from 'zod';

const ID_INVALIDO = { error: 'Identificador inválido.' };
const idTmdb = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).positive(ID_INVALIDO);
const numeroTemporada = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).min(0, ID_INVALIDO);
const busca = z.object({
  q: z
    .string({ error: 'Digite o nome de uma série.' })
    .trim()
    .min(1, { error: 'Digite o nome de uma série.' })
    .max(100, { error: 'Busca muito longa (máximo de 100 caracteres).' }),
  pagina: z.coerce.number().int().min(1).max(500).default(1),
});

export function criarRotasCatalogo({ catalogo }) {
  const rotas = Router();

  // /series/busca precisa vir antes de /series/:tmdbId.
  rotas.get('/series/busca', async (req, res) => {
    const { q, pagina } = busca.parse(req.query);
    res.json(await catalogo.buscar(q, pagina));
  });

  rotas.get('/series/:tmdbId', async (req, res) => {
    res.json(await catalogo.obterSerie(idTmdb.parse(req.params.tmdbId)));
  });

  rotas.get('/series/:tmdbId/temporadas/:n', async (req, res) => {
    res.json(await catalogo.obterTemporada(idTmdb.parse(req.params.tmdbId), numeroTemporada.parse(req.params.n)));
  });

  return rotas;
}
