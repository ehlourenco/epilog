const doisDigitos = (n) => String(n).padStart(2, '0');

// Data de hoje no fuso do navegador, no formato AAAA-MM-DD.
// Não usar toISOString(): depois das 21h em Brasília ela já devolve o dia seguinte (UTC).
export function hojeLocal(agora = new Date()) {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

// 'AAAA-MM-DD' → 'DD/MM/AAAA', só manipulando o texto (new Date('AAAA-MM-DD') seria UTC e
// mostraria o dia anterior no Brasil).
export function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
