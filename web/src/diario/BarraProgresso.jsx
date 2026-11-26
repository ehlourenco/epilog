export function BarraProgresso({ assistidos, total }) {
  if (!total) return <p className="text-sm text-texto-suave">Sem episódios</p>;
  const texto = `${assistidos} de ${total} episódios`;
  const porcentagem = Math.min(100, Math.round((assistidos / total) * 100));
  return (
    <div className="space-y-1">
      <div
        role="progressbar"
        aria-label="Progresso da temporada"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={assistidos}
        aria-valuetext={texto}
        className="h-2 w-full overflow-hidden rounded-full bg-borda"
      >
        <div className="h-full rounded-full bg-destaque" style={{ width: `${porcentagem}%` }} />
      </div>
      <p className="text-sm text-texto-suave">{texto}</p>
    </div>
  );
}
