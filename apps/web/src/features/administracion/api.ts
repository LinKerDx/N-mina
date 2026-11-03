import {
  construirQuery,
  peticion,
  type CentroCosto,
  type Pago,
  type Presupuesto,
  type Proveedor,
  type ResumenAdministracion,
} from '@nomina360/core';

export function listarPresupuestos(
  ejercicio: number,
  senal?: AbortSignal,
): Promise<Presupuesto[]> {
  return peticion<Presupuesto[]>(`/api/administracion/presupuestos?ejercicio=${ejercicio}`, {
    senal,
  });
}

export interface NuevoPresupuesto {
  centroCostoId: string;
  ejercicio: number;
  mes: number;
  montoPresupuestado: number;
}

export function definirPresupuesto(datos: NuevoPresupuesto): Promise<Presupuesto> {
  return peticion<Presupuesto>('/api/administracion/presupuestos', {
    metodo: 'POST',
    cuerpo: datos,
  });
}

export function listarPagos(
  desde?: string,
  hasta?: string,
  senal?: AbortSignal,
): Promise<Pago[]> {
  return peticion<Pago[]>(`/api/administracion/pagos${construirQuery({ desde, hasta })}`, {
    senal,
  });
}

export interface NuevoPago {
  tipo: 'NOMINA' | 'PROVEEDOR' | 'IMPUESTO';
  centroCostoId: string;
  proveedorId?: string;
  periodoNominaId?: string;
  monto: number;
  moneda?: string;
  fechaPago: string;
  referenciaExterna?: string;
}

export function registrarPago(datos: NuevoPago): Promise<Pago> {
  return peticion<Pago>('/api/administracion/pagos', { metodo: 'POST', cuerpo: datos });
}

export function catalogoCentrosCosto(senal?: AbortSignal): Promise<CentroCosto[]> {
  return peticion<CentroCosto[]>('/api/administracion/centros-costo', { senal });
}

export function catalogoProveedores(senal?: AbortSignal): Promise<Proveedor[]> {
  return peticion<Proveedor[]>('/api/administracion/proveedores', { senal });
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
