import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
}

const ANCHOS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const;

export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCerrarRef = useRef(onCerrar);
  const identificador = useId();
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!abierto) {
      return;
    }

    const elementoPrevio =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialogo = dialogRef.current;
    const selectorEnfocable =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elementosEnfocables = () =>
      Array.from(dialogo?.querySelectorAll<HTMLElement>(selectorEnfocable) ?? []).filter(
        (elemento) => !elemento.closest('[hidden], [aria-hidden="true"]'),
      );

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCerrarRef.current();
      } else if (evento.key === 'Tab') {
        const enfocados = elementosEnfocables();
        const primero = enfocados[0];
        const ultimo = enfocados[enfocados.length - 1];
        if (!primero || !ultimo) {
          evento.preventDefault();
          dialogo?.focus();
        } else if (!dialogo?.contains(document.activeElement)) {
          evento.preventDefault();
          (evento.shiftKey ? ultimo : primero).focus();
        } else if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', manejarTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => (elementosEnfocables()[0] ?? dialogo)?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowPrevio;
      elementoPrevio?.focus();
    };
  }, [abierto]);

  if (!abierto) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${identificador}-titulo`}
        aria-describedby={descripcion ? `${identificador}-descripcion` : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          ANCHOS[ancho],
        )}
      >
        <div className="mb-5">
          <h2 id={`${identificador}-titulo`} className="text-lg font-semibold text-white">
            {titulo}
          </h2>
          {descripcion ? (
            <p id={`${identificador}-descripcion`} className="mt-1 text-sm text-slate-400">
              {descripcion}
            </p>
          ) : null}
        </div>
        {children}
        {pie ? <div className="mt-6 flex justify-end gap-3">{pie}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
