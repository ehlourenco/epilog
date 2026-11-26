import { expect, test } from 'vitest';
import { apelidoSchema } from '../../src/perfis/esquemas.js';

test('normaliza para minúsculas e corta espaços', () =>
  expect(apelidoSchema.parse(' Enzo_99 ')).toBe('enzo_99'));

test.each(['ab', 'enzo lourenço', 'a'.repeat(21), 'nome-com-hifen'])('rejeita %s', (v) =>
  expect(apelidoSchema.safeParse(v).success).toBe(false));

test('mensagem explica a regra', () =>
  expect(apelidoSchema.safeParse('ab').error.issues[0].message).toMatch(/3 a 20 caracteres/));
