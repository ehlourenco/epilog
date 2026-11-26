import { traduzirErroBanco } from '../erros.js';

function semErro({ data, error }) {
  if (error) throw traduzirErroBanco(error);
  return data;
}

const paraEpisodio = (e) => ({ id: e.id, numero: e.numero, nome: e.nome, descricao: e.descricao });
const porNumero = (a, b) => a.numero - b.numero;

// Acesso às tabelas de catálogo com o cliente admin (chave secreta). Só este módulo grava nelas.
export function criarRepositorioCatalogo(admin) {
  return {
    async buscarSerie(tmdbId) {
      const linha = semErro(
        await admin
          .from('serie')
          .select(
            'id, tmdb_id, nome, sinopse, idioma_sinopse, ano_estreia, generos, poster_path, atualizado_em, temporada(numero, nome, qtd_episodios)',
          )
          .eq('tmdb_id', tmdbId)
          .maybeSingle(),
      );
      if (!linha) return null;
      return {
        id: linha.id,
        tmdbId: linha.tmdb_id,
        nome: linha.nome,
        sinopse: linha.sinopse,
        idiomaSinopse: linha.idioma_sinopse,
        anoEstreia: linha.ano_estreia,
        generos: linha.generos ?? [],
        posterPath: linha.poster_path,
        atualizadoEm: new Date(linha.atualizado_em),
        temporadas: linha.temporada.map((t) => ({ numero: t.numero, nome: t.nome, qtdEpisodios: t.qtd_episodios })),
      };
    },

    async salvarSerie(serie) {
      const agora = new Date().toISOString();
      const { id } = semErro(
        await admin
          .from('serie')
          .upsert(
            {
              tmdb_id: serie.tmdbId,
              nome: serie.nome,
              sinopse: serie.sinopse,
              idioma_sinopse: serie.idiomaSinopse,
              ano_estreia: serie.anoEstreia,
              generos: serie.generos,
              poster_path: serie.posterPath,
              atualizado_em: agora,
            },
            { onConflict: 'tmdb_id' },
          )
          .select('id')
          .single(),
      );
      if (serie.temporadas.length > 0) {
        semErro(
          await admin.from('temporada').upsert(
            serie.temporadas.map((t) => ({
              serie_id: id,
              numero: t.numero,
              nome: t.nome,
              qtd_episodios: t.qtdEpisodios,
              atualizado_em: agora,
            })),
            { onConflict: 'serie_id,numero' },
          ),
        );
      }
      return { id };
    },

    async buscarTemporada(serieId, numero) {
      const linha = semErro(
        await admin
          .from('temporada')
          .select('id, numero, nome, episodios_atualizados_em, episodio(id, numero, nome, descricao)')
          .eq('serie_id', serieId)
          .eq('numero', numero)
          .maybeSingle(),
      );
      if (!linha) return null;
      return {
        id: linha.id,
        numero: linha.numero,
        nome: linha.nome,
        episodiosAtualizadosEm: linha.episodios_atualizados_em ? new Date(linha.episodios_atualizados_em) : null,
        episodios: linha.episodio.map(paraEpisodio).sort(porNumero),
      };
    },

    async salvarTemporada(serieId, temporada) {
      const agora = new Date().toISOString();
      const { id } = semErro(
        await admin
          .from('temporada')
          .upsert(
            {
              serie_id: serieId,
              numero: temporada.numero,
              nome: temporada.nome,
              qtd_episodios: temporada.episodios.length,
              atualizado_em: agora,
              episodios_atualizados_em: agora,
            },
            { onConflict: 'serie_id,numero' },
          )
          .select('id')
          .single(),
      );
      if (temporada.episodios.length === 0) return { id, episodios: [] };
      const episodios = semErro(
        await admin
          .from('episodio')
          .upsert(
            temporada.episodios.map((e) => ({
              temporada_id: id,
              numero: e.numero,
              nome: e.nome,
              descricao: e.descricao,
              atualizado_em: agora,
            })),
            { onConflict: 'temporada_id,numero' },
          )
          .select('id, numero, nome, descricao'),
      );
      return { id, episodios: episodios.map(paraEpisodio).sort(porNumero) };
    },
  };
}
