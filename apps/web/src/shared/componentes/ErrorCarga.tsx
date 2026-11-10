import { Boton } from '@nomina360/ui';

export function ErrorCarga({
  mensaje,
  onReintentar,
  recurso = 'la información',
}: {
  mensaje: string;
  onReintentar: () => void;
  recurso?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-rose-200">No pudimos cargar {recurso}.</p>
        <p className="mt-0.5 break-words text-xs text-rose-200/70">{mensaje}</p>
      </div>
      <Boton variante="secundario" tamano="sm" onClick={onReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}
