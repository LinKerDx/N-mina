import { ErrorApi } from '@nomina360/core';

/**
 * Convierte cualquier error en un mensaje listo para mostrar al usuario.
 */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorApi) {
    if (error.detalles.length > 0) {
      return `${error.message}: ${error.detalles.join(' · ')}`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado, intenta de nuevo';
}
