const LARGURAS = { pequeno: 'w-16', medio: 'w-full', grande: 'w-full sm:w-64' };

export function Poster({ url, nome, tamanho = 'medio' }) {
  return (
    <img
      src={url ?? '/poster-padrao.svg'}
      alt={`Pôster de ${nome}`}
      loading="lazy"
      className={`${LARGURAS[tamanho]} aspect-[2/3] rounded-md border border-borda bg-superficie object-cover`}
    />
  );
}
