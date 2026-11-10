import {
  construirQuery,
  peticion,
  type CentroTrabajo,
  type MarcacionAsistencia,
  type RegistroHoras,
  type ResumenHoras,
  type Turno,
  type TipoMarcacion,
} from '@nomina360/core';

export interface FiltroRegistros {
  fecha?: string;
  desde?: string;
  hasta?: string;
  empleadoId?: string;
}

export function listarRegistros(
  filtro: FiltroRegistros,
  senal?: AbortSignal,
): Promise<RegistroHoras[]> {
  return peticion<RegistroHoras[]>(`/api/produccion/registros${construirQuery({ ...filtro })}`, {
    senal,
  });
}

export function aprobarRegistro(id: string): Promise<RegistroHoras> {
  return peticion<RegistroHoras>(`/api/produccion/registros/${id}/aprobar`, { metodo: 'POST' });
}

export function rechazarRegistro(id: string, motivo: string): Promise<RegistroHoras> {
  return peticion<RegistroHoras>(
    `/api/produccion/registros/${id}/rechazar${construirQuery({ motivo })}`,
    { metodo: 'POST' },
  );
}

export interface NuevoRegistro {
  empleadoId: string;
  empleadoNombre: string;
  centroTrabajoId?: string;
  turnoId: string;
  fecha: string;
  horasNormales: number;
  horasExtra: number;
  observaciones?: string;
}

export function registrarHoras(registros: NuevoRegistro[]): Promise<RegistroHoras[]> {
  return peticion<RegistroHoras[]>('/api/produccion/registros', {
    metodo: 'POST',
    cuerpo: { registros },
  });
}

export interface NuevaMarcacionDispositivo {
  empleadoId: string;
  empleadoNombre: string;
  tipo: TipoMarcacion;
  ocurridoEn: string;
  dispositivoId: string;
  eventoDispositivoId: string;
}

/** Recibe el evento en formato normalizado para mantener el API independiente del fabricante. */
export function registrarMarcacionDispositivo(
  marcacion: NuevaMarcacionDispositivo,
): Promise<MarcacionAsistencia> {
  return peticion<MarcacionAsistencia>('/api/produccion/marcaciones', {
    metodo: 'POST',
    cuerpo: marcacion,
  });
}

export function listarMarcacionesAsistencia(
  empleadoId: string,
  desde: string,
  hasta: string,
  senal?: AbortSignal,
): Promise<MarcacionAsistencia[]> {
  return peticion<MarcacionAsistencia[]>(
    `/api/produccion/marcaciones${construirQuery({ empleadoId, desde, hasta })}`,
    { senal },
  );
}

export function resumenHoras(
  empleadoId: string,
  desde?: string,
  hasta?: string,
  senal?: AbortSignal,
): Promise<ResumenHoras> {
  return peticion<ResumenHoras>(
    `/api/produccion/resumen${construirQuery({ empleadoId, desde, hasta })}`,
    { senal },
  );
}

export function catalogoCentros(senal?: AbortSignal): Promise<CentroTrabajo[]> {
  return peticion<CentroTrabajo[]>('/api/produccion/centros-trabajo', { senal });
}

export function catalogoTurnos(senal?: AbortSignal): Promise<Turno[]> {
  return peticion<Turno[]>('/api/produccion/turnos', { senal });
}
