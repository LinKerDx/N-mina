import { useEffect, type ReactNode } from 'react';
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

export function Modal({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = 'md' }: ModalProps) {
  useEffect(() => {
    if (!abierto) {
      return;
    }
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    document.addEventListener('keydown', manejarTecla);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', manejarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          'relative w-full rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          ANCHOS[ancho],
        )}
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{titulo}</h2>
          {descripcion ? <p className="mt-1 text-sm text-slate-400">{descripcion}</p> : null}
        </div>
        {children}
        {pie ? <div className="mt-6 flex justify-end gap-3">{pie}</div> : null}
      </div>
    </div>
  );
}
