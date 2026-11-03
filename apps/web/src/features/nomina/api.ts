import {
  descargarArchivo,
  peticion,
  type EstatusPeriodo,
  type Pagina,
  type PeriodoNomina,
  type ReciboNomina,
  type ResultadoCalculo,
  type TipoPeriodo,
} from '@nomina360/core';

export function listarPeriodos(
  pagina = 0,
  tamano = 24,
  senal?: AbortSignal,
): Promise<Pagina<PeriodoNomina>> {
  return peticion<Pagina<PeriodoNomina>>(
    `/api/rh/periodos?page=${pagina}&size=${tamano}`,
    { senal },
  );
}

export interface NuevoPeriodo {
  nombre: string;
  tipo: TipoPeriodo;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
}

export function crearPeriodo(datos: NuevoPeriodo): Promise<PeriodoNomina> {
  return peticion<PeriodoNomina>('/api/rh/periodos', { metodo: 'POST', cuerpo: datos });
}

export function calcularPeriodo(id: string): Promise<ResultadoCalculo> {
  return peticion<ResultadoCalculo>(`/api/rh/periodos/${id}/calcular`, { metodo: 'POST' });
}

export function cerrarPeriodo(id: string): Promise<PeriodoNomina> {
  return peticion<PeriodoNomina>(`/api/rh/periodos/${id}/cerrar`, { metodo: 'POST' });
}

export function recibosDePeriodo(id: string, senal?: AbortSignal): Promise<ReciboNomina[]> {
  return peticion<ReciboNomina[]>(`/api/rh/periodos/${id}/recibos`, { senal });
}

export function esPeriodoCalculable(estatus: EstatusPeriodo): boolean {
  return estatus === 'BORRADOR';
}

/**
 * Descarga el recibo individual en PDF (datos del trabajador + desglose).
 */
export function descargarReciboPdf(reciboId: string, numeroEmpleado: string): Promise<string> {
  return descargarArchivo(`/api/rh/recibos/${reciboId}/pdf`, `recibo-${numeroEmpleado}.pdf`);
}
