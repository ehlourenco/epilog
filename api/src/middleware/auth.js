import { ErroApi } from '../erros.js';

const tokenInvalido = () => new ErroApi(401, 'token_invalido', 'Sua sessão expirou ou é inválida. Entre novamente.');

// Sem Authorization: visitante (cliente anônimo). Com "Bearer <token>" válido: o banco passa a
// enxergar o usuário (RLS). Header presente mas inválido: 401 em qualquer rota, para o front relogar.
export function criarAuth(clientes) {
  async function autenticacaoOpcional(req, res, next) {
    const cabecalho = req.get('authorization');
    if (!cabecalho) {
      req.usuario = null;
      req.db = clientes.anonimo;
      return next();
    }
    const [tipo, token] = cabecalho.split(' ');
    if (tipo !== 'Bearer' || !token) throw tokenInvalido();

    const { data, error } = await clientes.anonimo.auth.getUser(token);
    if (error && (error.status ?? 500) >= 500) {
      throw new ErroApi(503, 'autenticacao_indisponivel', 'Não foi possível validar sua sessão agora.');
    }
    if (error || !data?.user) throw tokenInvalido();

    req.usuario = { id: data.user.id };
    req.db = clientes.doUsuario(token);
    return next();
  }

  function exigirAutenticacao(req, res, next) {
    if (!req.usuario) throw new ErroApi(401, 'nao_autenticado', 'Entre na sua conta para continuar.');
    next();
  }

  return { autenticacaoOpcional, exigirAutenticacao };
}
