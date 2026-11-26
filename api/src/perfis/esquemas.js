import { z } from 'zod';

const REGRA = 'Use de 3 a 20 caracteres: letras sem acento, números ou _';

export const apelidoSchema = z
  .string({ error: REGRA })
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,20}$/, { error: REGRA });
