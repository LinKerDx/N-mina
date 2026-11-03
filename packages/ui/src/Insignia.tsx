import type { ReactNode } from 'react';
import { cn } from './cn';

export type Tono = 'neutro' | 'exito' | 'alerta' | 'peligro' | 'info';

const TONOS: Record<Tono, string> = {
  neutro: 'bg-white/5 text-slate-300 ring-white/10',
  exito: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/25',
  alerta: 'bg-amber-500/10 text-amber-300 ring-amber-400/25',
  peligro: 'bg-rose-500/10 text-rose-300 ring-rose-400/25',
  info: 'bg-sky-500/10 text-sky-300 ring-sky-400/25',
};

export function Insignia({
  children,
  tono = 'neutro',
  className,
}: {
  children: ReactNode;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function tonoPorEstatus(estatus: string): Tono {
  switch (estatus) {
    case 'ACTIVO':
    case 'APROBADO':
    case 'PAGADO':
    case 'CALCULADO':
      return 'exito';
    case 'BORRADOR':
    case 'REGISTRADO':
    case 'PROGRAMADO':
      return 'info';
    case 'VACACIONES':
    case 'INCAPACIDAD':
      return 'alerta';
    case 'BAJA':
    case 'RECHAZADO':
    case 'CANCELADO':
      return 'peligro';
    case 'CERRADO':
      return 'neutro';
    default:
      return 'neutro';
  }
}
