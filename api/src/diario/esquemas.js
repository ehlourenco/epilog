import { z } from 'zod';

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;
const dataExiste = (d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

// A data limite é a de hoje em UTC: no Brasil (UTC-3) a data local nunca passa dela,
// então um registro feito às 23h continua válido. O banco aplica a mesma regra (current_date em UTC).
export function criarEsquemasDiario({ hoje = () => new Date() } = {}) {
  const dataNaoFutura = z
    .string({ error: 'Informe a data.' })
    .regex(FORMATO, { error: 'Data inválida (use AAAA-MM-DD).' })
    .refine(dataExiste, { error: 'Data inválida.' })
    .refine((d) => d <= hoje().toISOString().slice(0, 10), { error: 'A data não pode estar no futuro.' });

  const novaEntrada = z.object({
    episodioId: z.number({ error: 'Episódio inválido.' }).int().positive(),
    assistidoEm: dataNaoFutura,
    revisita: z.boolean().default(false),
  });

  const edicaoEntrada = z
    .object({ assistidoEm: dataNaoFutura.optional(), revisita: z.boolean().optional() })
    .refine((o) => o.assistidoEm !== undefined || o.revisita !== undefined, {
      error: 'Informe a nova data ou se foi reassistida.',
    });

  return { novaEntrada, edicaoEntrada };
}
