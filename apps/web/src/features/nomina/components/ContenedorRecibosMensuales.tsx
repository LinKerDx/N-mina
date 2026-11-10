import type { ReactNode } from 'react';

/** Mantiene estable el alto del modal al desplegar conceptos en escritorio. */
export function ContenedorRecibosMensuales({ children }: { children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label="Contenido de los recibos del periodo"
      tabIndex={0}
      className="lg:h-[min(68vh,42rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
    >
      {children}
    </div>
  );
}
