import type { Rol } from '@nomina360/core';

/**
 * Ruta inicial según el rol: los empleados entran directo a su portal.
 */
export function rutaInicio(rol?: Rol | null): string {
  return rol === 'EMPLEADO' ? '/mi-nomina' : '/tablero';
}
