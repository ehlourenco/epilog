import { urlPoster } from '../catalogo/mapeadores.js';
import { traduzirErroBanco } from '../erros.js';
import { decodificarCursor, paginar, TAMANHO_PAGINA } from '../util/paginacao.js';

// A chave do cursor é o publicado_em cru do banco (com microssegundos), validado como data.
const chaveDeTimestamp = (chave) => !Number.isNaN(Date.parse(chave));

export function mapearResenha(linha) {
  return {
    id: linha.id,
    nota: Number(linha.nota),
    texto: linha.texto,
    contemSpoiler: linha.contem_spoiler,
    publicadoEm: linha.publicado_em,
    autor: { apelido: linha.autor_apelido },
    serie: { tmdbId: linha.serie_tmdb_id, nome: linha.serie_nome, posterUrl: urlPoster(linha.poster_path) },
    curtidas: Number(linha.curtidas),
    curti: linha.curti,
  };
}

// Resenhas (avaliações com texto) por série, por autor ou dos perfis seguidos. Reutilizada pelo feed (RF06).
export async function listarResenhas(db, { serieTmdbId, autorApelido, soSeguidos } = {}, antes) {
  const cursor = antes ? decodificarCursor(String(antes), chaveDeTimestamp) : null;
  const { data, error } = await db.rpc('listar_resenhas', {
    p_serie_tmdb_id: serieTmdbId ?? null,
    p_autor_apelido: autorApelido ?? null,
    p_so_seguidos: Boolean(soSeguidos),
    p_antes_publicado: cursor?.chave ?? null,
    p_antes_id: cursor?.id ?? null,
    p_limite: TAMANHO_PAGINA + 1,
  });
  if (error) throw traduzirErroBanco(error);
  const pagina = paginar(data, (l) => l.publicado_em);
  return { itens: pagina.itens.map(mapearResenha), proximoCursor: pagina.proximoCursor };
}
