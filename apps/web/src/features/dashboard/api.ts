import { peticion, type ResumenAdministracion, type ResumenRh } from '@nomina360/core';

export function resumenRh(senal?: AbortSignal): Promise<ResumenRh> {
  return peticion<ResumenRh>('/api/rh/resumen', { senal });
}

export function resumenAdministracion(
  ejercicio: number,
  senal?: AbortSignal,
): Promise<ResumenAdministracion> {
  return peticion<ResumenAdministracion>(
    `/api/administracion/resumen?ejercicio=${ejercicio}`,
    { senal },
  );
}
