import { expect, test } from 'vitest';
import { ErroApi, traduzirErroBanco } from '../src/erros.js';

test.each([
  ['23505', 409, 'apelido_em_uso'],
  ['23503', 404, 'referencia_inexistente'],
  ['23514', 400, 'validacao'],
  ['42501', 403, 'proibido'],
  ['XX000', 500, 'erro_banco'],
])('traduz %s', (code, status, codigo) => {
  const e = traduzirErroBanco({ code }, { conflito: 'apelido_em_uso' });
  expect(e).toBeInstanceOf(ErroApi);
  expect(e.status).toBe(status);
  expect(e.codigo).toBe(codigo);
});
