import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-brand-500 text-ink-950 hover:bg-brand-400 shadow-[0_12px_30px_-14px_rgba(16,185,129,0.9)]',
  secundario: 'bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10',
  fantasma: 'text-slate-300 hover:bg-white/5 hover:text-white',
  peligro: 'bg-rose-500/90 text-white hover:bg-rose-500',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  iconoIzquierda?: ReactNode;
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  iconoIzquierda,
  className,
  children,
  disabled,
  type = 'button',
  ...resto
}: BotonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        'disabled:cursor-not-allowed disabled:opacity-60',
        TAMANOS[tamano],
        VARIANTES[variante],
        className,
      )}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        iconoIzquierda
      )}
      {children}
    </button>
  );
}
