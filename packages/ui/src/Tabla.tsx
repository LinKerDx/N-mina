import type { ReactNode } from 'react';
import { cn } from './cn';

export interface Columna<T> {
  clave: string;
  encabezado: string;
  alinear?: 'izquierda' | 'derecha' | 'centro';
  render: (fila: T) => ReactNode;
  className?: string;
  classNameEncabezado?: string;
}

export interface TablaProps<T> {
  columnas: Array<Columna<T>>;
  filas: T[];
  obtenerClave: (fila: T) => string;
  vacio?: ReactNode;
  onFilaClick?: (fila: T) => void;
  etiqueta?: string;
}

const ALINEACION = {
  izquierda: 'text-left',
  derecha: 'text-right',
  centro: 'text-center',
} as const;

export function Tabla<T>({
  columnas,
  filas,
  obtenerClave,
  vacio,
  onFilaClick,
  etiqueta = 'Registros',
}: TablaProps<T>) {
  if (filas.length === 0 && vacio) {
    return <>{vacio}</>;
  }

  return (
    <div
      className="-mx-5 overflow-x-auto px-5 pb-1 focus-visible:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
      role="region"
      tabIndex={0}
      aria-label={`${etiqueta}: ${filas.length} registros. Desplázate horizontalmente para ver más columnas.`}
    >
      <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
        <caption className="sr-only">{etiqueta}</caption>
        <thead>
          <tr>
            {columnas.map((columna, indice) => (
              <th
                key={columna.clave}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400',
                  ALINEACION[columna.alinear ?? 'izquierda'],
                  columna.classNameEncabezado,
                  indice === 0 && 'max-md:sticky max-md:left-0 max-md:z-20 max-md:bg-ink-900',
                )}
              >
                {columna.encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={obtenerClave(fila)}
              onClick={
                onFilaClick
                  ? (evento) => {
                      const objetivo = evento.target;
                      if (
                        objetivo instanceof Element &&
                        objetivo.closest('a, button, input, select, textarea, [role="button"]')
                      ) {
                        return;
                      }
                      onFilaClick(fila);
                    }
                  : undefined
              }
              onKeyDown={
                onFilaClick
                  ? (evento) => {
                      if (
                        evento.target === evento.currentTarget &&
                        (evento.key === 'Enter' || evento.key === ' ')
                      ) {
                        evento.preventDefault();
                        onFilaClick(fila);
                      }
                    }
                  : undefined
              }
              tabIndex={onFilaClick ? 0 : undefined}
              aria-label={onFilaClick ? `Abrir registro ${obtenerClave(fila)}` : undefined}
              className={cn(
                'transition-colors odd:bg-white/[0.025] even:bg-white/[0.01] hover:bg-white/[0.06]',
                onFilaClick &&
                  'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400/70',
              )}
            >
              {columnas.map((columna, indice) => (
                <td
                  key={columna.clave}
                  className={cn(
                    'border-y border-white/5 px-3 py-3 align-middle text-slate-200 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r',
                    ALINEACION[columna.alinear ?? 'izquierda'],
                    indice === 0 && 'font-medium text-white',
                    indice === 0 && 'max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-ink-900',
                    columna.className,
                  )}
                >
                  {columna.render(fila)}
                </td>
              ))}
            </tr>
          ))}
          {filas.length === 0 ? (
            <tr>
              <td colSpan={columnas.length} className="rounded-xl border border-white/10 px-4 py-8">
                <p className="text-center text-sm text-slate-400">No hay registros para mostrar.</p>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p className="px-2 pt-2 text-right text-[10px] text-slate-500 md:hidden" aria-hidden="true">
        Desliza la tabla para ver todas las columnas
      </p>
    </div>
  );
}
