import {
  descargarArchivo,
  peticion,
  type MiPerfil,
  type MiRecibo,
  type MiReciboDetalle,
  type MiResumenNomina,
} from '@nomina360/core';

export function miPerfil(senal?: AbortSignal): Promise<MiPerfil> {
  return peticion<MiPerfil>('/api/rh/mi-nomina/perfil', { senal });
}

export function misRecibos(senal?: AbortSignal): Promise<MiRecibo[]> {
  return peticion<MiRecibo[]>('/api/rh/mi-nomina/recibos', { senal });
}

export function miResumen(senal?: AbortSignal): Promise<MiResumenNomina> {
  return peticion<MiResumenNomina>('/api/rh/mi-nomina/resumen', { senal });
}

export function miRecibo(id: string, senal?: AbortSignal): Promise<MiReciboDetalle> {
  return peticion<MiReciboDetalle>(`/api/rh/mi-nomina/recibos/${id}`, { senal });
}

export function descargarMiReciboPdf(id: string, numeroEmpleado: string): Promise<string> {
  return descargarArchivo(
    `/api/rh/mi-nomina/recibos/${id}/pdf`,
    `recibo-${numeroEmpleado}.pdf`,
  );
}
