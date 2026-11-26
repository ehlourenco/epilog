import { ErroApi } from '../erros.js';
import { mapearResultadoBusca, mapearSerie, mapearTemporada, ordenarTemporadas, urlPoster } from './mapeadores.js';

export function estaFresco(data, horas, agora) {
  if (!horas || !data) return false;
  return agora.getTime() - data.getTime() < horas * 3_600_000;
}

const catalogoIndisponivel = (erro) => erro instanceof ErroApi && erro.status === 502;

// Catálogo sob demanda (Figura 6): lê o cache do banco; se ausente ou vencido, consulta o TMDB e grava.
// Se o TMDB falhar e houver dados salvos, devolve-os com origem 'cache_vencido'.
export function criarServicoCatalogo({ tmdb, repositorio, cacheHoras, agora = () => new Date() }) {
  async function carregarSerie(tmdbId) {
    const linha = await repositorio.buscarSerie(tmdbId);
    if (linha && estaFresco(linha.atualizadoEm, cacheHoras, agora())) return { serie: linha, origem: 'cache' };
    try {
      const pt = await tmdb.serie(tmdbId, 'pt-BR');
      const en = pt.overview ? null : await tmdb.serie(tmdbId, 'en-US');
      const mapeada = mapearSerie(pt, en);
      const { id } = await repositorio.salvarSerie(mapeada);
      return { serie: { id, ...mapeada }, origem: 'tmdb' };
    } catch (erro) {
      if (catalogoIndisponivel(erro) && linha) return { serie: linha, origem: 'cache_vencido' };
      throw erro;
    }
  }

  return {
    async buscar(q, pagina) {
      return mapearResultadoBusca(await tmdb.buscarSeries(q, pagina));
    },

    async obterSerie(tmdbId) {
      const { serie, origem } = await carregarSerie(tmdbId);
      return {
        tmdbId: serie.tmdbId,
        nome: serie.nome,
        anoEstreia: serie.anoEstreia,
        generos: serie.generos,
        sinopse: serie.sinopse,
        idiomaSinopse: serie.idiomaSinopse,
        posterUrl: urlPoster(serie.posterPath, 'w500'),
        temporadas: ordenarTemporadas(serie.temporadas),
        origem,
      };
    },

    async obterTemporada(tmdbId, numero) {
      const serie = (await repositorio.buscarSerie(tmdbId)) ?? (await carregarSerie(tmdbId)).serie;
      const linha = await repositorio.buscarTemporada(serie.id, numero);
      const resposta = (temporada, origem) => ({
        serieTmdbId: tmdbId,
        serieNome: serie.nome,
        numero: temporada.numero,
        nome: temporada.nome,
        episodios: temporada.episodios,
        origem,
      });

      if (linha && linha.episodios.length > 0 && estaFresco(linha.episodiosAtualizadosEm, cacheHoras, agora())) {
        return resposta(linha, 'cache');
      }
      try {
        const pt = await tmdb.temporada(tmdbId, numero, 'pt-BR');
        const faltaDescricao = (pt.episodes ?? []).some((e) => !e.overview);
        const en = faltaDescricao ? await tmdb.temporada(tmdbId, numero, 'en-US') : null;
        const mapeada = mapearTemporada(pt, en);
        const salva = await repositorio.salvarTemporada(serie.id, mapeada);
        return resposta({ ...mapeada, episodios: salva.episodios }, 'tmdb');
      } catch (erro) {
        if (catalogoIndisponivel(erro) && linha?.episodios.length > 0) return resposta(linha, 'cache_vencido');
        if (erro instanceof ErroApi && erro.status === 404) {
          throw new ErroApi(404, 'nao_encontrado_no_catalogo', 'Não encontramos essa temporada no catálogo.');
        }
        throw erro;
      }
    },
  };
}
