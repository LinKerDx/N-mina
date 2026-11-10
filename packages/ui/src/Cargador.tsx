import type { ReactNode } from 'react';
import { Treadmill } from 'ldrs/react';
import 'ldrs/react/Treadmill.css';
import { cn } from './cn';

export function Cargador({ mensaje = 'Cargando información…' }: { mensaje?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-slate-400"
      role="status"
      aria-live="polite"
    >
      <Treadmill size="70" speed="1.25" color="#6ee7b7" />
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
