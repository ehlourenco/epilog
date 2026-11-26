import { expect, test } from 'vitest';
import { criarEsquemasDiario } from '../../src/diario/esquemas.js';

// 25/11 23:30 em Brasília = 26/11 02:30 UTC
const { novaEntrada, edicaoEntrada } = criarEsquemasDiario({ hoje: () => new Date('2026-11-26T02:30:00Z') });

test('aceita a data UTC de hoje (registro à noite no Brasil)', () =>
  expect(novaEntrada.parse({ episodioId: 1, assistidoEm: '2026-11-26' })).toEqual({
    episodioId: 1,
    assistidoEm: '2026-11-26',
    revisita: false,
  }));

test('aceita a data local do Brasil (um dia antes do UTC)', () =>
  expect(novaEntrada.safeParse({ episodioId: 1, assistidoEm: '2026-11-25' }).success).toBe(true));

test.each(['2026-11-27', '2026-02-30', '25/11/2026', ''])('rejeita data %s', (d) =>
  expect(novaEntrada.safeParse({ episodioId: 1, assistidoEm: d }).success).toBe(false));

test('episodioId precisa ser inteiro positivo', () =>
  expect(novaEntrada.safeParse({ episodioId: 'x', assistidoEm: '2026-11-25' }).success).toBe(false));

test('edição exige pelo menos um campo', () => expect(edicaoEntrada.safeParse({}).success).toBe(false));

test('edição só da revisita', () =>
  expect(edicaoEntrada.parse({ revisita: true })).toEqual({ revisita: true }));
