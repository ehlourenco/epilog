import { ErroApi } from '../erros.js';

const BASE = 'https://api.themoviedb.org/3';

export function criarClienteTmdb({ token, fetch = globalThis.fetch, timeoutMs = 8000 }) {
  async function obter(caminho, parametros) {
    const url = `${BASE}${caminho}?${new URLSearchParams(parametros)}`;
    let resposta;
    try {
      resposta = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new ErroApi(502, 'catalogo_indisponivel', 'O catálogo de séries está indisponível no momento.');
    }
    if (resposta.status === 404) {
      throw new ErroApi(404, 'nao_encontrado_no_catalogo', 'Não encontramos essa série no catálogo.');
    }
    if (!resposta.ok) {
      throw new ErroApi(502, 'catalogo_indisponivel', 'O catálogo de séries está indisponível no momento.');
    }
    return resposta.json();
  }

  return {
    buscarSeries: (q, pagina) =>
      obter('/search/tv', { query: q, page: String(pagina), language: 'pt-BR', include_adult: 'false' }),
    serie: (tmdbId, idioma) => obter(`/tv/${tmdbId}`, { language: idioma }),
    temporada: (tmdbId, numero, idioma) => obter(`/tv/${tmdbId}/season/${numero}`, { language: idioma }),
  };
}
