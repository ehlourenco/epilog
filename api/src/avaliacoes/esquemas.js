import { z } from 'zod';

const NOTA = { error: 'Escolha uma nota de 0,5 a 5 estrelas (meia em meia).' };

export const avaliacaoSchema = z
  .object({
    nota: z
      .number(NOTA)
      .min(0.5, NOTA)
      .max(5, NOTA)
      .refine((n) => Number.isInteger(n * 2), NOTA),
    texto: z
      .string()
      .trim()
      .max(5000, { error: 'A resenha pode ter no máximo 5000 caracteres.' })
      .nullish()
      .transform((t) => (t ? t : null)),
    contemSpoiler: z.boolean().default(false),
  })
  // Sem texto não há o que esconder: a marcação de spoiler só vale para resenhas.
  .transform((a) => ({ ...a, contemSpoiler: a.texto ? a.contemSpoiler : false }));
