import { ZodError } from 'zod';

export class ErroApi extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem ?? codigo);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}

// Traduz erros do PostgREST/Postgres (campo `code`) para respostas da API.
export function traduzirErroBanco(erro, mapa = {}) {
  switch (erro?.code) {
    case '23505':
      return new ErroApi(409, mapa.conflito ?? 'conflito', mapa.mensagem ?? 'Registro já existe.');
    case '23503':
      return new ErroApi(
        404,
        mapa.referencia ?? 'referencia_inexistente',
        mapa.mensagem ?? 'Referência não encontrada.',
      );
    case '23514':
      return new ErroApi(400, 'validacao', 'Dados fora das regras permitidas.');
    case '42501':
      return new ErroApi(403, 'proibido', 'Você não tem permissão para esta ação.');
    default:
      return new ErroApi(500, 'erro_banco', 'Erro ao acessar o banco de dados.');
  }
}

// eslint-disable-next-line no-unused-vars -- o Express identifica o tratador pelos 4 parâmetros
export function tratadorDeErros(err, req, res, next) {
  if (err instanceof ZodError) {
    const mensagem = err.issues[0]?.message ?? 'Dados inválidos.';
    return res.status(400).json({ erro: { codigo: 'validacao', mensagem } });
  }
  if (err instanceof ErroApi) {
    return res.status(err.status).json({ erro: { codigo: err.codigo, mensagem: err.message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      erro: { codigo: 'json_invalido', mensagem: 'Corpo da requisição não é um JSON válido.' },
    });
  }
  console.error(err);
  return res
    .status(500)
    .json({ erro: { codigo: 'erro_interno', mensagem: 'Erro interno do servidor.' } });
}
