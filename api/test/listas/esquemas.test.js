import { expect, test } from 'vitest';
import { edicaoListaSchema, novaListaSchema, ordemSchema } from '../../src/listas/esquemas.js';

test('lista válida com título aparado', () =>
  expect(novaListaSchema.parse({ titulo: '  Para maratonar ', visibilidade: 'publica' })).toEqual({
    titulo: 'Para maratonar',
    visibilidade: 'publica',
  }));

test.each([
  ['título em branco', { titulo: '  ', visibilidade: 'publica' }],
  ['título com 81 caracteres', { titulo: 'a'.repeat(81), visibilidade: 'privada' }],
  ['visibilidade desconhecida', { titulo: 'X', visibilidade: 'amigos' }],
])('nova lista rejeita %s', (_, corpo) => expect(novaListaSchema.safeParse(corpo).success).toBe(false));

test('edição exige pelo menos um campo', () => expect(edicaoListaSchema.safeParse({}).success).toBe(false));

test.each([
  ['série repetida', [3, 3]],
  ['lista vazia', []],
  ['id não inteiro', [1.5]],
])('ordem rejeita %s', (_, tmdbIds) => expect(ordemSchema.safeParse({ tmdbIds }).success).toBe(false));

test('ordem válida', () => expect(ordemSchema.parse({ tmdbIds: [3, 1, 2] })).toEqual({ tmdbIds: [3, 1, 2] }));
