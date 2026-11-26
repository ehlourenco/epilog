import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ErroApi } from '../../src/erros.js';
import { criarServicoCatalogo } from '../../src/catalogo/servico.js';

const AGORA = new Date('2026-11-26T12:00:00Z');
const UMA_HORA_ATRAS = new Date('2026-11-26T11:00:00Z');
const VINTE_CINCO_HORAS_ATRAS = new Date('2026-11-25T11:00:00Z');

const serieTmdb = (overview = 'Sinopse em português') => ({
  id: 1396,
  name: 'Breaking Bad',
  overview,
  first_air_date: '2008-01-20',
  genres: [{ name: 'Drama' }],
  poster_path: '/bb.jpg',
  seasons: [{ season_number: 1, name: 'Temporada 1', episode_count: 7 }],
});
const temporadaTmdb = (overviews = ['Piloto pt']) => ({
  season_number: 1,
  name: 'Temporada 1',
  episodes: overviews.map((o, i) => ({ episode_number: i + 1, name: `Ep ${i + 1}`, overview: o })),
});
const linhaSerie = (atualizadoEm) => ({
  id: 10,
  tmdbId: 1396,
  nome: 'Breaking Bad (banco)',
  sinopse: 'Do banco',
  idiomaSinopse: 'pt',
  anoEstreia: 2008,
  generos: ['Drama'],
  posterPath: '/bb.jpg',
  atualizadoEm,
  temporadas: [{ numero: 1, nome: 'Temporada 1', qtdEpisodios: 7 }],
});
const linhaTemporada = (episodiosAtualizadosEm, episodios = [{ id: 500, numero: 1, nome: 'Ep banco', descricao: null }]) => ({
  id: 20,
  numero: 1,
  nome: 'Temporada 1',
  episodiosAtualizadosEm,
  episodios,
});

let tmdb;
let repositorio;
const criar = (cacheHoras = 24) =>
  criarServicoCatalogo({ tmdb, repositorio, cacheHoras, agora: () => AGORA });

beforeEach(() => {
  tmdb = {
    buscarSeries: vi.fn(),
    serie: vi.fn(async () => serieTmdb()),
    temporada: vi.fn(async () => temporadaTmdb()),
  };
  repositorio = {
    buscarSerie: vi.fn(async () => null),
    salvarSerie: vi.fn(async () => ({ id: 10 })),
    buscarTemporada: vi.fn(async () => null),
    salvarTemporada: vi.fn(async (serieId, t) => ({
      id: 20,
      episodios: t.episodios.map((e, i) => ({ id: 700 + i, ...e })),
    })),
  };
});

describe('obterSerie', () => {
  test('sem cache: consulta TMDB, salva, origem tmdb', async () => {
    const r = await criar().obterSerie(1396);
    expect(tmdb.serie).toHaveBeenCalledTimes(1);
    expect(repositorio.salvarSerie).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({
      tmdbId: 1396,
      nome: 'Breaking Bad',
      posterUrl: 'https://image.tmdb.org/t/p/w500/bb.jpg',
      origem: 'tmdb',
    });
  });

  test('cache de 1h: não chama TMDB, origem cache', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(UMA_HORA_ATRAS));
    const r = await criar().obterSerie(1396);
    expect(tmdb.serie).not.toHaveBeenCalled();
    expect(r).toMatchObject({ nome: 'Breaking Bad (banco)', origem: 'cache' });
  });

  test('cache de 25h: chama TMDB, origem tmdb', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(VINTE_CINCO_HORAS_ATRAS));
    expect((await criar().obterSerie(1396)).origem).toBe('tmdb');
    expect(tmdb.serie).toHaveBeenCalled();
  });

  test('cacheHoras 0: sempre TMDB mesmo com cache de 1 min', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(new Date('2026-11-26T11:59:00Z')));
    expect((await criar(0).obterSerie(1396)).origem).toBe('tmdb');
  });

  test('cache vencido + TMDB 502: origem cache_vencido', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(VINTE_CINCO_HORAS_ATRAS));
    tmdb.serie.mockRejectedValue(new ErroApi(502, 'catalogo_indisponivel'));
    expect(await criar().obterSerie(1396)).toMatchObject({ nome: 'Breaking Bad (banco)', origem: 'cache_vencido' });
  });

  test('sem cache + TMDB 502: lança 502 catalogo_indisponivel', async () => {
    tmdb.serie.mockRejectedValue(new ErroApi(502, 'catalogo_indisponivel'));
    await expect(criar().obterSerie(1396)).rejects.toMatchObject({ status: 502, codigo: 'catalogo_indisponivel' });
  });

  test('TMDB 404: lança 404 mesmo com cache vencido', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(VINTE_CINCO_HORAS_ATRAS));
    tmdb.serie.mockRejectedValue(new ErroApi(404, 'nao_encontrado_no_catalogo'));
    await expect(criar().obterSerie(1396)).rejects.toMatchObject({ status: 404 });
  });

  test('sinopse pt vazia: consulta en-US, idiomaSinopse en', async () => {
    tmdb.serie.mockImplementation(async (id, idioma) =>
      idioma === 'pt-BR' ? serieTmdb('') : serieTmdb('English synopsis'),
    );
    const r = await criar().obterSerie(1396);
    expect(tmdb.serie).toHaveBeenCalledWith(1396, 'en-US');
    expect(r).toMatchObject({ sinopse: 'English synopsis', idiomaSinopse: 'en' });
  });
});

describe('obterTemporada', () => {
  test('temporada de série ausente no banco: obtém a série antes (FK)', async () => {
    await criar().obterTemporada(1396, 1);
    expect(repositorio.salvarSerie).toHaveBeenCalledTimes(1);
    expect(repositorio.salvarTemporada).toHaveBeenCalledWith(10, expect.objectContaining({ numero: 1 }));
  });

  test('temporada devolve episódios com os ids que o repositório retornou', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(UMA_HORA_ATRAS));
    const r = await criar().obterTemporada(1396, 1);
    expect(r).toMatchObject({ serieTmdbId: 1396, serieNome: 'Breaking Bad (banco)', numero: 1, origem: 'tmdb' });
    expect(r.episodios).toEqual([{ id: 700, numero: 1, nome: 'Ep 1', descricao: 'Piloto pt' }]);
  });

  test('temporada em cache fresco não chama TMDB', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(UMA_HORA_ATRAS));
    repositorio.buscarTemporada.mockResolvedValue(linhaTemporada(UMA_HORA_ATRAS));
    const r = await criar().obterTemporada(1396, 1);
    expect(tmdb.temporada).not.toHaveBeenCalled();
    expect(r.origem).toBe('cache');
    expect(r.episodios[0].id).toBe(500);
  });

  test('episódio sem descrição pt: uma chamada en-US', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(UMA_HORA_ATRAS));
    tmdb.temporada.mockImplementation(async (id, n, idioma) =>
      idioma === 'pt-BR' ? temporadaTmdb(['pt', '']) : temporadaTmdb(['en1', 'en2']),
    );
    const r = await criar().obterTemporada(1396, 1);
    expect(tmdb.temporada).toHaveBeenCalledTimes(2);
    expect(r.episodios.map((e) => e.descricao)).toEqual(['pt', 'en2']);
  });

  test('temporada sem episódios no banco + TMDB 502: lança 502', async () => {
    repositorio.buscarSerie.mockResolvedValue(linhaSerie(UMA_HORA_ATRAS));
    repositorio.buscarTemporada.mockResolvedValue(linhaTemporada(null, []));
    tmdb.temporada.mockRejectedValue(new ErroApi(502, 'catalogo_indisponivel'));
    await expect(criar().obterTemporada(1396, 1)).rejects.toMatchObject({ status: 502 });
  });
});
