import type { ReactNode } from 'react';
import { cn } from './cn';

export interface Columna<T> {
  clave: string;
  encabezado: string;
  alinear?: 'izquierda' | 'derecha' | 'centro';
  render: (fila: T) => ReactNode;
  className?: string;
}

export interface TablaProps<T> {
  columnas: Array<Columna<T>>;
  filas: T[];
  obtenerClave: (fila: T) => string;
  vacio?: ReactNode;
  onFilaClick?: (fila: T) => void;
}

const ALINEACION = {
  izquierda: 'text-left',
  derecha: 'text-right',
  centro: 'text-center',
} as const;

export function Tabla<T>({ columnas, filas, obtenerClave, vacio, onFilaClick }: TablaProps<T>) {
  if (filas.length === 0 && vacio) {
    return <>{vacio}</>;
  }

  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm">
        <thead>
          <tr>
            {columnas.map((columna) => (
              <th
                key={columna.clave}
                scope="col"
                className={cn(
                  'px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400',
                  ALINEACION[columna.alinear ?? 'izquierda'],
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
              onClick={onFilaClick ? () => onFilaClick(fila) : undefined}
              className={cn(
                'bg-white/[0.02] transition hover:bg-white/[0.05]',
                onFilaClick && 'cursor-pointer',
              )}
            >
              {columnas.map((columna, indice) => (
                <td
                  key={columna.clave}
                  className={cn(
                    'border-y border-white/5 px-3 py-3 align-middle text-slate-200 first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r',
                    ALINEACION[columna.alinear ?? 'izquierda'],
                    indice === 0 && 'font-medium text-white',
                    columna.className,
                  )}
                >
                  {columna.render(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
