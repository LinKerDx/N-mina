import {
  descargarArchivo,
  peticion,
  type AjusteNomina,
  type EstatusPeriodo,
  type Pagina,
  type PeriodoNomina,
  type ReciboNomina,
  type ResultadoCalculo,
  type TipoPeriodo,
  type TipoAjusteNomina,
} from '@nomina360/core';

export function listarPeriodos(
  pagina = 0,
  tamano = 24,
  senal?: AbortSignal,
): Promise<Pagina<PeriodoNomina>> {
  return peticion<Pagina<PeriodoNomina>>(`/api/rh/periodos?page=${pagina}&size=${tamano}`, {
    senal,
  });
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

export interface NuevoAjusteNomina {
  empleadoId: string;
  tipo: TipoAjusteNomina;
  descripcion: string;
  importe: number;
  gravable: boolean;
}

export function listarAjustesNomina(
  periodoId: string,
  senal?: AbortSignal,
): Promise<AjusteNomina[]> {
  return peticion<AjusteNomina[]>(`/api/rh/periodos/${periodoId}/ajustes`, { senal });
}

export function crearAjusteNomina(
  periodoId: string,
  ajuste: NuevoAjusteNomina,
): Promise<AjusteNomina> {
  return peticion<AjusteNomina>(`/api/rh/periodos/${periodoId}/ajustes`, {
    metodo: 'POST',
    cuerpo: ajuste,
  });
}

export function eliminarAjusteNomina(id: string): Promise<void> {
  return peticion<void>(`/api/rh/ajustes/${id}`, { metodo: 'DELETE' });
}

/**
 * Descarga el recibo individual en PDF (datos del trabajador + desglose).
 */
export function descargarReciboPdf(reciboId: string, numeroEmpleado: string): Promise<string> {
  return descargarArchivo(`/api/rh/recibos/${reciboId}/pdf`, `recibo-${numeroEmpleado}.pdf`);
}
