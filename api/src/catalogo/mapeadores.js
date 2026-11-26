const BASE_IMAGENS = 'https://image.tmdb.org/t/p/';

export function urlPoster(path, tamanho = 'w342') {
  return path ? `${BASE_IMAGENS}${tamanho}${path}` : null;
}

const anoDe = (data) => (data ? Number(data.slice(0, 4)) : null);
const textoOuNulo = (valor) => (valor ? valor : null);

// Temporadas em ordem crescente, com a 0 (especiais do TMDB) por último.
export function ordenarTemporadas(lista) {
  const chave = (t) => (t.numero === 0 ? Number.POSITIVE_INFINITY : t.numero);
  return [...lista].sort((a, b) => chave(a) - chave(b));
}

export function mapearResultadoBusca(json) {
  return {
    pagina: json.page,
    totalPaginas: json.total_pages,
    resultados: (json.results ?? []).map((r) => ({
      tmdbId: r.id,
      nome: r.name,
      ano: anoDe(r.first_air_date),
      posterUrl: urlPoster(r.poster_path),
    })),
  };
}

export function mapearSerie(pt, en = null) {
  const sinopsePt = textoOuNulo(pt.overview);
  const sinopseEn = textoOuNulo(en?.overview);
  return {
    tmdbId: pt.id,
    nome: pt.name,
    anoEstreia: anoDe(pt.first_air_date),
    generos: (pt.genres ?? []).map((g) => g.name),
    sinopse: sinopsePt ?? sinopseEn,
    idiomaSinopse: sinopsePt ? 'pt' : sinopseEn ? 'en' : null,
    posterPath: pt.poster_path ?? null,
    temporadas: ordenarTemporadas(
      (pt.seasons ?? []).map((s) => ({
        numero: s.season_number,
        nome: textoOuNulo(s.name),
        qtdEpisodios: s.episode_count ?? null,
      })),
    ),
  };
}

export function mapearTemporada(pt, en = null) {
  const descricaoEn = new Map((en?.episodes ?? []).map((e) => [e.episode_number, textoOuNulo(e.overview)]));
  return {
    numero: pt.season_number,
    nome: textoOuNulo(pt.name),
    episodios: (pt.episodes ?? []).map((e) => ({
      numero: e.episode_number,
      nome: textoOuNulo(e.name),
      descricao: textoOuNulo(e.overview) ?? descricaoEn.get(e.episode_number) ?? null,
    })),
  };
}
