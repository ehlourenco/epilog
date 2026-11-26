import { z } from 'zod';
import { MAIOR_INTEIRO } from '../util/validacao.js';

const titulo = z
  .string({ error: 'Dê um título à lista.' })
  .trim()
  .min(1, { error: 'Dê um título à lista.' })
  .max(80, { error: 'O título pode ter no máximo 80 caracteres.' });
const visibilidade = z.enum(['publica', 'privada'], {
  error: 'Escolha se a lista é pública ou privada.',
});
const tmdbId = z.number({ error: 'Série inválida.' }).int().positive().max(MAIOR_INTEIRO);

export const novaListaSchema = z.object({ titulo, visibilidade });

export const edicaoListaSchema = z
  .object({ titulo: titulo.optional(), visibilidade: visibilidade.optional() })
  .refine((o) => o.titulo !== undefined || o.visibilidade !== undefined, {
    error: 'Informe o novo título ou a visibilidade.',
  });

export const itemSchema = z.object({ tmdbId });

export const ordemSchema = z.object({
  tmdbIds: z
    .array(tmdbId)
    .min(1, { error: 'Informe a nova ordem.' })
    .refine((ids) => new Set(ids).size === ids.length, { error: 'Série repetida na ordem.' }),
});
