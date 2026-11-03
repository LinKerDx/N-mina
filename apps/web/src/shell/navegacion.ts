import type { Rol } from '@nomina360/core';
import type { NombreIcono } from '@/shell/iconos';

export interface ItemNavegacion {
  ruta: string;
  etiqueta: string;
  descripcion: string;
  icono: NombreIcono;
  roles: Rol[];
}

export const NAVEGACION: ItemNavegacion[] = [
  {
    ruta: '/mi-nomina',
    etiqueta: 'Mi nómina',
    descripcion: 'Tus recibos y desglose',
    icono: 'nomina',
    roles: ['EMPLEADO'],
  },
  {
    ruta: '/tablero',
    etiqueta: 'Tablero',
    descripcion: 'Indicadores generales de nómina',
    icono: 'tablero',
    roles: ['ADMIN', 'RH', 'PRODUCCION', 'ADMINISTRACION'],
  },
  {
    ruta: '/nomina',
    etiqueta: 'Nómina',
    descripcion: 'Periodos, cálculo y recibos',
    icono: 'nomina',
    roles: ['ADMIN', 'RH'],
  },
  {
    ruta: '/empleados',
    etiqueta: 'Empleados',
    descripcion: 'Plantilla, altas y bajas',
    icono: 'empleados',
    roles: ['ADMIN', 'RH'],
  },
  {
    ruta: '/produccion',
    etiqueta: 'Producción',
    descripcion: 'Horas trabajadas y tiempo extra',
    icono: 'produccion',
    roles: ['ADMIN', 'PRODUCCION'],
  },
  {
    ruta: '/administracion',
    etiqueta: 'Administración',
    descripcion: 'Presupuesto, centros de costo y pagos',
    icono: 'administracion',
    roles: ['ADMIN', 'ADMINISTRACION'],
  },
];

export function itemsParaRol(rol: Rol | undefined): ItemNavegacion[] {
  if (!rol) {
    return [];
  }
  return NAVEGACION.filter((item) => item.roles.includes(rol));
}

export function tituloDeRuta(ruta: string): string {
  const item = NAVEGACION.find((elemento) => ruta.startsWith(elemento.ruta));
  return item?.etiqueta ?? 'Nómina360';
}
