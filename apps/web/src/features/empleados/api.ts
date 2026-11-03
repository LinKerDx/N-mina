import {
  construirQuery,
  peticion,
  type Departamento,
  type Empleado,
  type Pagina,
  type Puesto,
} from '@nomina360/core';

export interface FiltroEmpleados {
  q?: string;
  estatus?: string;
  page?: number;
  size?: number;
}

export function buscarEmpleados(filtro: FiltroEmpleados, senal?: AbortSignal): Promise<Pagina<Empleado>> {
  return peticion<Pagina<Empleado>>(
    `/api/rh/empleados${construirQuery({
      q: filtro.q,
      estatus: filtro.estatus,
      page: filtro.page ?? 0,
      size: filtro.size ?? 20,
    })}`,
    { senal },
  );
}

export interface NuevoEmpleado {
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  email?: string;
  telefono?: string;
  departamentoId?: string;
  puestoId?: string;
  tipoContrato: 'INDEFINIDO' | 'TEMPORAL' | 'HONORARIOS' | 'PRACTICAS';
  fechaIngreso: string;
  salarioDiario: number;
  estatus?: 'ACTIVO';
}

export function crearEmpleado(datos: NuevoEmpleado): Promise<Empleado> {
  return peticion<Empleado>('/api/rh/empleados', { metodo: 'POST', cuerpo: datos });
}

export function actualizarEmpleado(id: string, datos: NuevoEmpleado): Promise<Empleado> {
  return peticion<Empleado>(`/api/rh/empleados/${id}`, { metodo: 'PUT', cuerpo: datos });
}

export function darDeBajaEmpleado(id: string, fechaBaja?: string): Promise<void> {
  return peticion<void>(`/api/rh/empleados/${id}${construirQuery({ fechaBaja })}`, {
    metodo: 'DELETE',
  });
}

export function catalogoDepartamentos(senal?: AbortSignal): Promise<Departamento[]> {
  return peticion<Departamento[]>('/api/rh/departamentos', { senal });
}

export function catalogoPuestos(senal?: AbortSignal): Promise<Puesto[]> {
  return peticion<Puesto[]>('/api/rh/puestos', { senal });
}

export interface EmpleadoResumen {
  id: string;
  numeroEmpleado: string;
  nombreCompleto: string;
}

export function empleadosActivos(senal?: AbortSignal): Promise<EmpleadoResumen[]> {
  return peticion<EmpleadoResumen[]>('/api/rh/empleados/activos', { senal });
}
