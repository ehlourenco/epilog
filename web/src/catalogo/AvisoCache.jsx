export function AvisoCache({ origem }) {
  if (origem !== 'cache_vencido') return null;
  return (
    <p
      role="status"
      className="rounded-md border border-destaque/40 bg-destaque/10 px-3 py-2 text-sm"
    >
      Não foi possível atualizar com o TMDB; mostrando dados salvos.
    </p>
  );
}
