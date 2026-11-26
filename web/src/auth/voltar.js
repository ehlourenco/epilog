// Só aceita caminhos internos ("/algo"). Barra endereços externos e os truques
// "//host" e "/\host", que o navegador trataria como outro domínio.
export function caminhoSeguro(valor) {
  if (typeof valor !== 'string') return '/';
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return '/';
  return valor;
}
