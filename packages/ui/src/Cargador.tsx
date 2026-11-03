import type { ReactNode } from 'react';
import { cn } from './cn';

export function Cargador({ mensaje = 'Cargando información…' }: { mensaje?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-400" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-400/40 border-t-brand-400" />
      <span>{mensaje}</span>
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-white/5', className)} />;
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  icono,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  icono?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
      {icono ? <div className="text-3xl text-slate-500">{icono}</div> : null}
      <div>
        <p className="font-medium text-white">{titulo}</p>
        {descripcion ? <p className="mt-1 max-w-md text-sm text-slate-400">{descripcion}</p> : null}
      </div>
      {accion}
    </div>
  );
}
