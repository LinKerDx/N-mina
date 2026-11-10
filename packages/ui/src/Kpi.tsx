import type { ReactNode } from 'react';
import { cn } from './cn';

export function Kpi({
  titulo,
  valor,
  detalle,
  icono,
  acento = 'brand',
  cargando = false,
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
  icono?: ReactNode;
  acento?: 'brand' | 'violeta' | 'ambar' | 'cielo';
  cargando?: boolean;
}) {
  const acentos = {
    brand: 'from-brand-500/20 text-brand-300',
    violeta: 'from-violet-500/20 text-violet-300',
    ambar: 'from-amber-500/20 text-amber-300',
    cielo: 'from-sky-500/20 text-sky-300',
  } as const;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/60 p-5"
      aria-busy={cargando}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br to-transparent blur-2xl',
          acentos[acento],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{titulo}</p>
        {icono ? <span className={cn('text-lg', acentos[acento])}>{icono}</span> : null}
      </div>
      <p
        className={cn(
          'mt-3 text-2xl font-semibold tracking-tight text-white',
          cargando && 'animate-pulse',
        )}
      >
        {cargando ? '—' : valor}
      </p>
      {detalle ? <div className="mt-1 text-xs text-slate-400">{detalle}</div> : null}
    </div>
  );
}

export function BarraProgreso({
  valor,
  tono = 'brand',
  etiqueta,
}: {
  valor: number;
  tono?: 'brand' | 'ambar' | 'peligro';
  etiqueta?: string;
}) {
  const limitado = Math.max(0, Math.min(100, valor));
  const tonos = {
    brand: 'bg-brand-400',
    ambar: 'bg-amber-400',
    peligro: 'bg-rose-400',
  } as const;

  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(limitado)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiqueta ?? 'Progreso'}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', tonos[tono])}
          style={{ width: `${limitado}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
