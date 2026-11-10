import { useQuery } from '@tanstack/react-query';
import { mensajeDeError } from '@/shared/lib/errores';

export interface EstadoConsulta<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/** Compatibilidad de la UI con TanStack Query y claves tipadas por pantalla. */
export function useConsulta<T>(
  consulta: (senal: AbortSignal) => Promise<T>,
  clave: string,
  habilitado = true,
): EstadoConsulta<T> {
  const query = useQuery({
    queryKey: ['nomina360', clave],
    queryFn: ({ signal }) => consulta(signal),
    enabled: habilitado,
  });

  return {
    datos: query.data ?? null,
    cargando: query.isLoading,
    error: query.error ? mensajeDeError(query.error) : null,
    recargar: () => void query.refetch(),
  };
}
