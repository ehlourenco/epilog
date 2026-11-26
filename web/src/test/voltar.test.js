import { expect, test } from 'vitest';
import { caminhoSeguro } from '../auth/voltar.js';

test.each([
  ['/series/1399/temporadas/1', '/series/1399/temporadas/1'],
  ['https://mal.com', '/'],
  ['//mal.com', '/'],
  ['/\\mal.com', '/'],
  ['series', '/'],
  [undefined, '/'],
  [null, '/'],
])('caminhoSeguro(%s)', (entrada, esperado) => expect(caminhoSeguro(entrada)).toBe(esperado));
