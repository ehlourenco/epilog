import { expect, test } from 'vitest';
import { codificarCursor, decodificarCursor } from '../../src/util/paginacao.js';

const b64 = (texto) => Buffer.from(texto).toString('base64url');

test('ida e volta', () =>
  expect(decodificarCursor(codificarCursor({ chave: '2026-11-25', id: 7 }))).toEqual({ chave: '2026-11-25', id: 7 }));

test.each(['lixo', b64('{"chave":"x"}'), b64('{"chave":"x","id":"1"}')])('cursor adulterado %s → 400', (c) =>
  expect(() => decodificarCursor(c)).toThrow(expect.objectContaining({ status: 400, codigo: 'cursor_invalido' })));

test('chave fora do formato esperado → 400', () =>
  expect(() => decodificarCursor(codificarCursor({ chave: 'x),id.gt.0', id: 1 }), /^\d{4}-\d{2}-\d{2}$/)).toThrow(
    expect.objectContaining({ codigo: 'cursor_invalido' }),
  ));
