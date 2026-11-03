import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '@/shared/lib/errores';

export interface EstadoConsulta<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/**
 * Hook minimo de consulta: la `clave` describe las dependencias (por ejemplo
 * `empleados:ana:1`). Cambiarla vuelve a ejecutar la peticion.
 */
export function useConsulta<T>(
  consulta: (senal: AbortSignal) => Promise<T>,
  clave: string,
  habilitado = true,
): EstadoConsulta<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(habilitado);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;

  useEffect(() => {
    if (!habilitado) {
      setCargando(false);
      return;
    }

    const controlador = new AbortController();
    let activo = true;

    setCargando(true);
    setError(null);

    consultaRef
      .current(controlador.signal)
      .then((resultado) => {
        if (activo) {
          setDatos(resultado);
        }
      })
      .catch((excepcion: unknown) => {
        if (activo && !controlador.signal.aborted) {
          setError(mensajeDeError(excepcion));
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
      controlador.abort();
    };
  }, [clave, habilitado, version]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  return { datos, cargando, error, recargar };
}
