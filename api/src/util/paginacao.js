import { ErroApi } from '../erros.js';

export const TAMANHO_PAGINA = 20;

export function codificarCursor({ chave, id }) {
  return Buffer.from(JSON.stringify({ chave, id })).toString('base64url');
}

// `validarChave` (regex ou função) restringe a chave — ex.: data AAAA-MM-DD que exista — antes de ela chegar
// a qualquer filtro do banco; o id precisa ser um inteiro seguro positivo.
export function decodificarCursor(texto, validarChave = /^.+$/) {
  const chaveValida = typeof validarChave === 'function' ? validarChave : (c) => validarChave.test(c);
  try {
    const valor = JSON.parse(Buffer.from(texto, 'base64url').toString('utf8'));
    const idValido = Number.isSafeInteger(valor?.id) && valor.id > 0;
    if (typeof valor?.chave !== 'string' || !chaveValida(valor.chave) || !idValido) {
      throw new Error('cursor fora do formato');
    }
    return { chave: valor.chave, id: valor.id };
  } catch {
    throw new ErroApi(400, 'cursor_invalido', 'Parâmetro de paginação inválido.');
  }
}

// Recebe até TAMANHO_PAGINA + 1 linhas e devolve a página com o cursor da próxima, se houver.
export function paginar(linhas, chaveDe) {
  const itens = linhas.slice(0, TAMANHO_PAGINA);
  const ultimo = itens.at(-1);
  const proximoCursor =
    linhas.length > TAMANHO_PAGINA ? codificarCursor({ chave: chaveDe(ultimo), id: ultimo.id }) : null;
  return { itens, proximoCursor };
}
