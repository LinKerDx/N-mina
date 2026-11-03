import type { CentroTrabajo, Turno } from '@nomina360/core';
import { Boton, Campo, MensajeError, Selector } from '@nomina360/ui';
import { useState, type FormEvent } from 'react';
import type { NuevoRegistro } from '@/features/produccion/api';
import type { EmpleadoResumen } from '@/features/empleados/api';
import { mensajeDeError } from '@/shared/lib/errores';

export function FormularioRegistroHoras({
  empleados,
  centros,
  turnos,
  onRegistrado,
  onCancelar,
}: {
  empleados: EmpleadoResumen[];
  centros: CentroTrabajo[];
  turnos: Turno[];
  onRegistrado: (registros: NuevoRegistro[]) => Promise<void>;
  onCancelar: () => void;
}) {
  const hoy = new Date().toISOString().slice(0, 10);
  const [valores, setValores] = useState({
    empleadoId: '',
    centroTrabajoId: '',
    turnoId: '',
    fecha: hoy,
    horasNormales: '8',
    horasExtra: '0',
    observaciones: '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(campo: keyof typeof valores, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const empleado = empleados.find((item) => item.id === valores.empleadoId);
    const invalidos: Record<string, string> = {};

    if (!empleado) {
      invalidos.empleadoId = 'Selecciona un empleado';
    }
    if (!valores.turnoId) {
      invalidos.turnoId = 'Selecciona un turno';
    }
    if (!valores.fecha) {
      invalidos.fecha = 'La fecha es obligatoria';
    }

    const normales = Number(valores.horasNormales);
    const extra = Number(valores.horasExtra);
    if (!Number.isFinite(normales) || normales < 0 || normales > 24) {
      invalidos.horasNormales = 'Horas inválidas (0 a 24)';
    }
    if (!Number.isFinite(extra) || extra < 0 || extra > 24) {
      invalidos.horasExtra = 'Horas inválidas (0 a 24)';
    }

    if (Object.keys(invalidos).length > 0) {
      setErrores(invalidos);
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      await onRegistrado([
        {
          empleadoId: valores.empleadoId,
          empleadoNombre: empleado?.nombreCompleto ?? '',
          centroTrabajoId: valores.centroTrabajoId || undefined,
          turnoId: valores.turnoId,
          fecha: valores.fecha,
          horasNormales: normales,
          horasExtra: extra,
          observaciones: valores.observaciones || undefined,
        },
      ]);
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
      <Selector
        etiqueta="Empleado"
        name="empleadoId"
        value={valores.empleadoId}
        onChange={(evento) => actualizar('empleadoId', evento.target.value)}
        error={errores.empleadoId}
      >
        <option value="">Selecciona un empleado</option>
        {empleados.map((empleado) => (
          <option key={empleado.id} value={empleado.id}>
            {empleado.numeroEmpleado} · {empleado.nombreCompleto}
          </option>
        ))}
      </Selector>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Centro de trabajo"
          name="centroTrabajoId"
          value={valores.centroTrabajoId}
          onChange={(evento) => actualizar('centroTrabajoId', evento.target.value)}
        >
          <option value="">Sin asignar</option>
          {centros.map((centro) => (
            <option key={centro.id} value={centro.id}>
              {centro.nombre}
            </option>
          ))}
        </Selector>

        <Selector
          etiqueta="Turno"
          name="turnoId"
          value={valores.turnoId}
          onChange={(evento) => actualizar('turnoId', evento.target.value)}
          error={errores.turnoId}
        >
          <option value="">Selecciona un turno</option>
          {turnos.map((turno) => (
            <option key={turno.id} value={turno.id}>
              {turno.nombre} ({turno.horaInicio.slice(0, 5)}–{turno.horaFin.slice(0, 5)})
            </option>
          ))}
        </Selector>

        <Campo
          etiqueta="Fecha"
          name="fecha"
          type="date"
          value={valores.fecha}
          onChange={(evento) => actualizar('fecha', evento.target.value)}
          error={errores.fecha}
        />

        <Campo
          etiqueta="Horas normales"
          name="horasNormales"
          type="number"
          step="0.25"
          min="0"
          max="24"
          value={valores.horasNormales}
          onChange={(evento) => actualizar('horasNormales', evento.target.value)}
          error={errores.horasNormales}
        />

        <Campo
          etiqueta="Horas extra"
          name="horasExtra"
          type="number"
          step="0.25"
          min="0"
          max="24"
          value={valores.horasExtra}
          onChange={(evento) => actualizar('horasExtra', evento.target.value)}
          error={errores.horasExtra}
          ayuda="Al aprobar se envían a RH como incidencia."
        />

        <Campo
          etiqueta="Observaciones"
          name="observaciones"
          value={valores.observaciones}
          onChange={(evento) => actualizar('observaciones', evento.target.value)}
        />
      </div>

      {errorGeneral ? <MensajeError>{errorGeneral}</MensajeError> : null}

      <div className="flex justify-end gap-3 pt-2">
        <Boton variante="secundario" type="button" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={enviando}>
          Registrar horas
        </Boton>
      </div>
    </form>
  );
}
