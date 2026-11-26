import { criarApp } from '../src/app.js';

const configDeTeste = {
  port: 0,
  supabaseUrl: 'https://teste.supabase.co',
  supabasePublishableKey: 'pk',
  supabaseSecretKey: 'sk',
  tmdbReadToken: 't',
  corsOrigin: null,
  cacheCatalogoHoras: 24,
};

// Banco falso: qualquer método de query encadeia; `await` resolve para respostas[tabela]
// (valor ou função que recebe as chamadas já feitas àquela chave). rpc(nome) usa 'rpc:nome'.
export function criarDbFalso(respostas = {}) {
  const registro = [];
  const resolver = (chave) => {
    const resposta = respostas[chave];
    const valor =
      typeof resposta === 'function' ? resposta(registro.filter(([c]) => c === chave)) : resposta;
    return valor ?? { data: null, error: null };
  };
  const cadeia = (chave) => {
    const proxy = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (ok, falha) => Promise.resolve(resolver(chave)).then(ok, falha);
          }
          return (...args) => {
            registro.push([chave, metodo, args]);
            return proxy;
          };
        },
      },
    );
    return proxy;
  };
  return {
    from: (tabela) => {
      registro.push([tabela, 'from', []]);
      return cadeia(tabela);
    },
    rpc: (nome, args) => {
      registro.push([`rpc:${nome}`, 'rpc', [args]]);
      return cadeia(`rpc:${nome}`);
    },
    registro,
  };
}

// O token 'bom' é aceito como o usuário 'u1'; qualquer outro é recusado.
const authFalso = {
  getUser: async (token) =>
    token === 'bom'
      ? { data: { user: { id: 'u1' } }, error: null }
      : { data: { user: null }, error: { status: 401, message: 'invalid JWT' } },
};

export function criarAppDeTeste({ db = criarDbFalso(), catalogo = {} } = {}) {
  const clientes = { admin: db, anonimo: { ...db, auth: authFalso }, doUsuario: () => db };
  return criarApp({ config: configDeTeste, clientes, catalogo });
}
