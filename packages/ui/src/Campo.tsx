import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';

const BASE =
  'w-full rounded-xl border bg-ink-900/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition focus:outline-none focus:ring-2';

function clasesEstado(error?: string): string {
  return error
    ? 'border-rose-500/60 focus:border-rose-400/70 focus:ring-rose-400/30'
    : 'border-white/10 focus:border-brand-400/60 focus:ring-brand-400/30';
}

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

export function Campo({ etiqueta, error, ayuda, className, id, ...resto }: CampoProps) {
  const identificador = id ?? resto.name ?? `campo-${etiqueta.replace(/\s+/g, '-').toLowerCase()}`;
  const ayudaId = `${identificador}-ayuda`;
  const errorId = `${identificador}-error`;
  const ariaDescribedBy =
    [resto['aria-describedby'], error ? errorId : ayuda ? ayudaId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <label className="block" htmlFor={identificador}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-300">
        {etiqueta}
        {resto.required ? (
          <span className="ml-1 text-brand-300" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <input
        {...resto}
        id={identificador}
        className={cn(BASE, clasesEstado(error), className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-errormessage={error ? errorId : undefined}
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-rose-300">
          {error}
        </span>
      ) : ayuda ? (
        <span id={ayudaId} className="mt-1 block text-xs text-slate-500">
          {ayuda}
        </span>
      ) : null}
    </label>
  );
}

export interface SelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  error?: string;
}

export function Selector({ etiqueta, error, className, id, children, ...resto }: SelectorProps) {
  const identificador =
    id ?? resto.name ?? `selector-${etiqueta.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = `${identificador}-error`;
  const ariaDescribedBy =
    [resto['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <label className="block" htmlFor={identificador}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-300">
        {etiqueta}
        {resto.required ? (
          <span className="ml-1 text-brand-300" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <span className="relative block">
        <select
          {...resto}
          id={identificador}
          className={cn(BASE, clasesEstado(error), 'appearance-none pr-9', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          aria-errormessage={error ? errorId : undefined}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          fill="none"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-rose-300">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export interface AreaTextoProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta: string;
  error?: string;
}

export function AreaTexto({ etiqueta, error, className, id, ...resto }: AreaTextoProps) {
  const identificador = id ?? resto.name ?? `area-${etiqueta.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = `${identificador}-error`;
  const ariaDescribedBy =
    [resto['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <label className="block" htmlFor={identificador}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-300">
        {etiqueta}
        {resto.required ? (
          <span className="ml-1 text-brand-300" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      <textarea
        {...resto}
        id={identificador}
        className={cn(BASE, clasesEstado(error), 'min-h-24 resize-y', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        aria-errormessage={error ? errorId : undefined}
      />
      {error ? (
        <span id={errorId} className="mt-1 block text-xs text-rose-300">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function MensajeError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
    >
      {children}
    </p>
  );
}
