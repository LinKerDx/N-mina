import type { ReactNode } from 'react';

export function EncabezadoPagina({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{titulo}</h2>
        {descripcion ? (
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{descripcion}</p>
        ) : null}
      </div>
      {accion}
    </div>
  );
}

export function Aviso({
  children,
  tono = 'error',
}: {
  children: ReactNode;
  tono?: 'error' | 'exito' | 'info';
}) {
  const estilos = {
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    exito: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  } as const;
  const rolAccesible = tono === 'error' ? 'alert' : 'status';

  return (
    <div
      role={rolAccesible}
      aria-live={tono === 'error' ? 'assertive' : 'polite'}
      className={`rounded-xl border px-4 py-3 text-sm ${estilos[tono]}`}
    >
      {children}
    </div>
  );
}
