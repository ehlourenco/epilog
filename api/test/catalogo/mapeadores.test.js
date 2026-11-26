import { expect, test } from 'vitest';
import {
  mapearResultadoBusca,
  mapearSerie,
  mapearTemporada,
  urlPoster,
} from '../../src/catalogo/mapeadores.js';

test('resultado de busca', () =>
  expect(
    mapearResultadoBusca({
      page: 1,
      total_pages: 3,
      results: [
        { id: 1399, name: 'Game of Thrones', first_air_date: '2011-04-17', poster_path: '/p.jpg' },
        { id: 2, name: 'X', first_air_date: '', poster_path: null },
      ],
    }),
  ).toEqual({
    pagina: 1,
    totalPaginas: 3,
    resultados: [
      { tmdbId: 1399, nome: 'Game of Thrones', ano: 2011, posterUrl: 'https://image.tmdb.org/t/p/w342/p.jpg' },
      { tmdbId: 2, nome: 'X', ano: null, posterUrl: null },
    ],
  }));

test('urlPoster com tamanho e sem caminho', () => {
  expect(urlPoster('/a.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/a.jpg');
  expect(urlPoster(null)).toBeNull();
});

const pt = (o) => ({
  id: 1,
  name: 'S',
  first_air_date: '2020-01-01',
  genres: [{ name: 'Drama' }],
  poster_path: null,
  seasons: [],
  ...o,
});

test('sinopse pt', () =>
  expect(mapearSerie(pt({ overview: 'Texto' }))).toMatchObject({
    sinopse: 'Texto',
    idiomaSinopse: 'pt',
    generos: ['Drama'],
    anoEstreia: 2020,
  }));

test('fallback en', () =>
  expect(mapearSerie(pt({ overview: '' }), { overview: 'Text' })).toMatchObject({
    sinopse: 'Text',
    idiomaSinopse: 'en',
  }));

test('sem sinopse', () =>
  expect(mapearSerie(pt({ overview: '' }), { overview: '' })).toMatchObject({
    sinopse: null,
    idiomaSinopse: null,
  }));

test('Especiais por último', () =>
  expect(
    mapearSerie(
      pt({
        seasons: [
          { season_number: 0, name: 'Especiais', episode_count: 2 },
          { season_number: 2, name: 'T2', episode_count: 8 },
          { season_number: 1, name: 'T1', episode_count: 8 },
        ],
      }),
    ).temporadas.map((t) => t.numero),
  ).toEqual([1, 2, 0]));

test('sem temporadas', () => expect(mapearSerie(pt({ seasons: undefined })).temporadas).toEqual([]));

test('episódio usa descrição en quando pt vazia', () =>
  expect(
    mapearTemporada(
      {
        season_number: 1,
        name: 'T1',
        episodes: [
          { episode_number: 1, name: 'Piloto', overview: 'pt' },
          { episode_number: 2, name: '', overview: '' },
        ],
      },
      { episodes: [{ episode_number: 2, overview: 'en' }] },
    ).episodios,
  ).toEqual([
    { numero: 1, nome: 'Piloto', descricao: 'pt' },
    { numero: 2, nome: null, descricao: 'en' },
  ]));
