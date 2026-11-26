import { z } from 'zod';

// Limite do tipo integer do Postgres: acima disso o banco responde erro 22003 (que viraria 500).
export const MAIOR_INTEIRO = 2_147_483_647;
const ID_INVALIDO = { error: 'Identificador inválido.' };

export const idPositivo = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).positive(ID_INVALIDO).max(MAIOR_INTEIRO, ID_INVALIDO);
export const numeroTemporada = z.coerce.number(ID_INVALIDO).int(ID_INVALIDO).min(0, ID_INVALIDO).max(MAIOR_INTEIRO, ID_INVALIDO);
