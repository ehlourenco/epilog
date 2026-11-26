import { expect, test } from 'vitest';
import { avaliacaoSchema } from '../../src/avaliacoes/esquemas.js';

test('4.5 passa', () =>
  expect(avaliacaoSchema.parse({ nota: 4.5 })).toEqual({ nota: 4.5, texto: null, contemSpoiler: false }));

test.each([0, 0.3, 4.25, 5.5])('nota %s rejeitada', (nota) =>
  expect(avaliacaoSchema.safeParse({ nota }).success).toBe(false));

test('texto só com espaços vira null e desliga o spoiler', () =>
  expect(avaliacaoSchema.parse({ nota: 3, texto: '   ', contemSpoiler: true })).toMatchObject({
    texto: null,
    contemSpoiler: false,
  }));

test('texto acima de 5000 caracteres rejeitado', () =>
  expect(avaliacaoSchema.safeParse({ nota: 3, texto: 'a'.repeat(5001) }).success).toBe(false));

test('texto com spoiler mantém a marcação e corta espaços', () =>
  expect(avaliacaoSchema.parse({ nota: 5, texto: '  Final incrível  ', contemSpoiler: true })).toEqual({
    nota: 5,
    texto: 'Final incrível',
    contemSpoiler: true,
  }));
