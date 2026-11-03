/**
 * Contratos compartidos con el backend (una sola fuente de verdad para el front).
 * Los importes viajan como number (el backend usa BigDecimal con 2 decimales).
 */

export type Rol = 'ADMIN' | 'RH' | 'PRODUCCION' | 'ADMINISTRACION';

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: Rol;
  area: string;
}

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiraEnSegundos: number;
  usuario: Usuario;
}

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface ErrorApiCuerpo {
  timestamp: string;
  status: number;
  codigo: string;
  mensaje: string;
  ruta: string;
  correlationId: string | null;
  detalles: string[];
}

export type EstatusPeriodo = 'BORRADOR' | 'CALCULADO' | 'CERRADO';
export type TipoPeriodo = 'MENSUAL' | 'QUINCENAL' | 'CATORCENAL' | 'SEMANAL';

export interface PeriodoNomina {
  id: string;
  nombre: string;
  tipo: TipoPeriodo;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  diasPeriodo: number;
  estatus: EstatusPeriodo;
  calculadoEn: string | null;
}

export interface ConceptoNomina {
  tipo: 'PERCEPCION' | 'DEDUCCION';
  clave: string;
  descripcion: string;
  importe: number;
  gravable: boolean;
}

export interface ReciboNomina {
  id: string;
  empleadoId: string;
  numeroEmpleado: string;
  nombreEmpleado: string;
  diasPagados: number;
  totalPercepciones: number;
  totalDeducciones: number;
  neto: number;
  estatus: string;
  conceptos: ConceptoNomina[];
}

export interface ResultadoCalculo {
  periodoId: string;
  nombrePeriodo: string;
  recibosGenerados: number;
  totalPercepciones: number;
  totalDeducciones: number;
  totalNeto: number;
}

export type EstatusEmpleado = 'ACTIVO' | 'BAJA' | 'VACACIONES' | 'INCAPACIDAD';

export interface Empleado {
  id: string;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombreCompleto: string;
  curp: string | null;
  rfc: string | null;
  nss: string | null;
  email: string | null;
  telefono: string | null;
  departamentoId: string | null;
  departamentoNombre: string | null;
  puestoId: string | null;
  puestoNombre: string | null;
  tipoContrato: string;
  fechaIngreso: string;
  fechaBaja: string | null;
  salarioDiario: number;
  estatus: EstatusEmpleado;
}

export interface Departamento {
  id: string;
  nombre: string;
  area: string;
  activo: boolean;
}

export interface Puesto {
  id: string;
  nombre: string;
  departamentoId: string | null;
  salarioBaseDiario: number;
  nivel: number;
  activo: boolean;
}

export type TipoIncidencia =
  | 'FALTA'
  | 'RETARDO'
  | 'HORAS_EXTRA'
  | 'VACACIONES'
  | 'INCAPACIDAD'
  | 'PERMISO'
  | 'BONO_PRODUCTIVIDAD';

export interface Incidencia {
  id: string;
  empleadoId: string;
  tipo: TipoIncidencia;
  fecha: string;
  cantidad: number;
  motivo: string | null;
  autorizada: boolean;
  origen: 'MANUAL' | 'PRODUCCION';
  referenciaExterna: string | null;
}

export interface ResumenRh {
  empleadosActivos: number;
  periodosAbiertos: number;
  periodoRecienteId: string | null;
  periodoReciente: string | null;
  estatusPeriodoReciente: EstatusPeriodo | null;
  netoPeriodoReciente: number;
  recibosPeriodoReciente: number;
}

export type EstatusRegistro = 'REGISTRADO' | 'APROBADO' | 'RECHAZADO';

export interface RegistroHoras {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  centroTrabajoId: string | null;
  turnoId: string;
  fecha: string;
  horasNormales: number;
  horasExtra: number;
  estatus: EstatusRegistro;
  aprobadoPor: string | null;
  aprobadoEn: string | null;
  observaciones: string | null;
}

export interface CentroTrabajo {
  id: string;
  codigo: string;
  nombre: string;
  capacidadDiaria: number;
  activo: boolean;
}

export interface Turno {
  id: string;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  horas: number;
}

export interface ResumenHoras {
  empleadoId: string;
  desde: string;
  hasta: string;
  horasNormales: number;
  horasExtra: number;
  registros: number;
  aprobados: number;
}

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  area: string;
  activo: boolean;
}

export interface Presupuesto {
  id: string;
  centroCostoId: string;
  centroCostoNombre: string | null;
  ejercicio: number;
  mes: number;
  montoPresupuestado: number;
  montoEjercido: number;
  disponible: number;
  porcentajeEjercido: number;
}

export interface Proveedor {
  id: string;
  rfc: string;
  razonSocial: string;
  email: string | null;
  activo: boolean;
}

export interface Pago {
  id: string;
  folio: string;
  tipo: 'NOMINA' | 'PROVEEDOR' | 'IMPUESTO';
  referenciaExterna: string | null;
  proveedorId: string | null;
  centroCostoId: string;
  periodoNominaId: string | null;
  monto: number;
  moneda: string;
  fechaPago: string;
  estatus: string;
}

export interface ResumenAdministracion {
  ejercicio: number;
  totalPresupuestado: number;
  totalEjercido: number;
  disponible: number;
  pagosDelMes: number;
  montoPagadoMes: number;
}
