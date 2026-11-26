import { expect, test } from 'vitest';
import { formatarData, hojeLocal } from '../lib/datas.js';

test('roda no fuso de São Paulo', () =>
  expect(new Date(2026, 10, 25, 23, 30).getTimezoneOffset()).toBe(180));

test('hojeLocal usa a data local, não UTC', () =>
  expect(hojeLocal(new Date(2026, 10, 25, 23, 30))).toBe('2026-11-25'));

test('formatarData não desloca fuso', () => expect(formatarData('2026-11-25')).toBe('25/11/2026'));
