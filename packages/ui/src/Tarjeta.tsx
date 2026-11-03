import type { ReactNode } from 'react';
import { cn } from './cn';

export interface TarjetaProps {
  children: ReactNode;
  className?: string;
  sinRelleno?: boolean;
}

export function Tarjeta({ children, className, sinRelleno = false }: TarjetaProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-ink-800/60 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur',
        !sinRelleno && 'p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

export interface EncabezadoTarjetaProps {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}

export function EncabezadoTarjeta({ titulo, descripcion, accion }: EncabezadoTarjetaProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-white">{titulo}</h2>
        {descripcion ? <p className="mt-0.5 text-xs text-slate-400">{descripcion}</p> : null}
      </div>
      {accion}
    </div>
  );
}
