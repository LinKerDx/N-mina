import { useCallback, useState } from 'react';
import { mensajeDeError } from '@/shared/lib/errores';

export interface EstadoAccion<TArgs extends unknown[], TResult> {
  ejecutar: (...args: TArgs) => Promise<TResult>;
  ejecutando: boolean;
  error: string | null;
  limpiarError: () => void;
}

/**
 * Envuelve una mutacion (POST/PUT/DELETE) con estado de carga y error.
 */
export function useAccion<TArgs extends unknown[], TResult>(
  accion: (...args: TArgs) => Promise<TResult>,
): EstadoAccion<TArgs, TResult> {
  const [ejecutando, setEjecutando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = useCallback(
    async (...args: TArgs) => {
      setEjecutando(true);
      setError(null);
      try {
        return await accion(...args);
      } catch (excepcion) {
        setError(mensajeDeError(excepcion));
        throw excepcion;
      } finally {
        setEjecutando(false);
      }
    },
    [accion],
  );

  const limpiarError = useCallback(() => setError(null), []);

  return { ejecutar, ejecutando, error, limpiarError };
}
