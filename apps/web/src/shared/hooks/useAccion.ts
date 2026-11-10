import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { mensajeDeError } from '@/shared/lib/errores';
import { queryClient } from '@/shared/lib/queryClient';

export interface EstadoAccion<TArgs extends unknown[], TResult> {
  ejecutar: (...args: TArgs) => Promise<TResult>;
  ejecutando: boolean;
  error: string | null;
  limpiarError: () => void;
}

/** Ejecuta operaciones de escritura como mutaciones de TanStack Query. */
export function useAccion<TArgs extends unknown[], TResult>(
  accion: (...args: TArgs) => Promise<TResult>,
  opciones: { invalidarAlCompletar?: boolean } = {},
): EstadoAccion<TArgs, TResult> {
  const mutacion = useMutation<TResult, unknown, TArgs>({
    mutationFn: (argumentos) => accion(...argumentos),
    onSuccess: () => {
      if (opciones.invalidarAlCompletar !== false) {
        void queryClient.invalidateQueries({ queryKey: ['nomina360'] });
      }
    },
  });
  const ejecutar = useCallback(
    (...argumentos: TArgs) => mutacion.mutateAsync(argumentos),
    [mutacion.mutateAsync],
  );

  return {
    ejecutar,
    ejecutando: mutacion.isPending,
    error: mutacion.error ? mensajeDeError(mutacion.error) : null,
    limpiarError: mutacion.reset,
  };
}
