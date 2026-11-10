import { esquemaEmpleado, type Departamento, type Empleado, type Puesto } from '@nomina360/core';
import { Boton, Campo, MensajeError, Selector } from '@nomina360/ui';
import { useState, type FormEvent } from 'react';
import { actualizarEmpleado, crearEmpleado, type NuevoEmpleado } from '@/features/empleados/api';
import { mensajeDeError } from '@/shared/lib/errores';
import { useAccion } from '@/shared/hooks/useAccion';
import { fechaCalendarioLocal } from '@/shared/lib/fechaCalendario';

export function FormularioEmpleado({
  departamentos,
  puestos,
  empleado,
  onGuardado,
  onCancelar,
}: {
  departamentos: Departamento[];
  puestos: Puesto[];
  empleado?: Empleado;
  onGuardado: (empleado: Empleado) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState(() => ({
    numeroEmpleado: empleado?.numeroEmpleado ?? '',
    nombre: empleado?.nombre ?? '',
    apellidoPaterno: empleado?.apellidoPaterno ?? '',
    apellidoMaterno: empleado?.apellidoMaterno ?? '',
    curp: empleado?.curp ?? '',
    rfc: empleado?.rfc ?? '',
    nss: empleado?.nss ?? '',
    email: empleado?.email ?? '',
    telefono: empleado?.telefono ?? '',
    departamentoId: empleado?.departamentoId ?? '',
    puestoId: empleado?.puestoId ?? '',
    tipoContrato: (empleado?.tipoContrato ?? 'INDEFINIDO') as NuevoEmpleado['tipoContrato'],
    fechaIngreso: empleado?.fechaIngreso ?? fechaCalendarioLocal(),
    salarioDiario: empleado ? String(empleado.salarioDiario) : '',
    estatus: empleado?.estatus ?? 'ACTIVO',
  }));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const guardar = useAccion((datos: NuevoEmpleado) =>
    empleado ? actualizarEmpleado(empleado.id, datos) : crearEmpleado(datos),
  );

  function actualizar(campo: keyof typeof valores, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = esquemaEmpleado.safeParse({
      ...valores,
      salarioDiario: Number(valores.salarioDiario),
    });

    if (!resultado.success) {
      const nuevos: Record<string, string> = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0];
        if (typeof campo === 'string' && !nuevos[campo]) {
          nuevos[campo] = problema.message;
        }
      }
      setErrores(nuevos);
      return;
    }

    setErrores({});
    try {
      const datos = resultado.data;
      const guardado = await guardar.ejecutar({
        numeroEmpleado: datos.numeroEmpleado,
        nombre: datos.nombre,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno || undefined,
        curp: datos.curp || undefined,
        rfc: datos.rfc || undefined,
        nss: datos.nss || undefined,
        email: datos.email || undefined,
        telefono: datos.telefono || undefined,
        departamentoId: datos.departamentoId || undefined,
        puestoId: datos.puestoId || undefined,
        tipoContrato: datos.tipoContrato,
        fechaIngreso: datos.fechaIngreso,
        salarioDiario: datos.salarioDiario,
        estatus: valores.estatus,
      });
      onGuardado(guardado);
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
    }
  }

  return (
    <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Número de empleado"
          name="numeroEmpleado"
          required
          placeholder="E-009"
          value={valores.numeroEmpleado}
          onChange={(evento) => actualizar('numeroEmpleado', evento.target.value)}
          error={errores.numeroEmpleado}
        />
        <Campo
          etiqueta="Correo"
          name="email"
          type="email"
          placeholder="persona@nomina360.mx"
          value={valores.email}
          onChange={(evento) => actualizar('email', evento.target.value)}
          error={errores.email}
        />
        <Campo
          etiqueta="Nombre(s)"
          name="nombre"
          required
          value={valores.nombre}
          onChange={(evento) => actualizar('nombre', evento.target.value)}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Apellido paterno"
          name="apellidoPaterno"
          required
          value={valores.apellidoPaterno}
          onChange={(evento) => actualizar('apellidoPaterno', evento.target.value)}
          error={errores.apellidoPaterno}
        />
        <Campo
          etiqueta="Apellido materno"
          name="apellidoMaterno"
          value={valores.apellidoMaterno}
          onChange={(evento) => actualizar('apellidoMaterno', evento.target.value)}
        />
        <Campo
          etiqueta="CURP"
          name="curp"
          maxLength={18}
          value={valores.curp}
          onChange={(evento) => actualizar('curp', evento.target.value.toUpperCase())}
          error={errores.curp}
        />
        <Campo
          etiqueta="RFC"
          name="rfc"
          maxLength={13}
          value={valores.rfc}
          onChange={(evento) => actualizar('rfc', evento.target.value.toUpperCase())}
          error={errores.rfc}
        />
        <Campo
          etiqueta="NSS"
          name="nss"
          maxLength={15}
          value={valores.nss}
          onChange={(evento) => actualizar('nss', evento.target.value)}
          error={errores.nss}
        />
        <Campo
          etiqueta="Teléfono"
          name="telefono"
          type="tel"
          maxLength={20}
          value={valores.telefono}
          onChange={(evento) => actualizar('telefono', evento.target.value)}
          error={errores.telefono}
        />
        <Campo
          etiqueta="Salario diario (MXN)"
          name="salarioDiario"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={valores.salarioDiario}
          onChange={(evento) => actualizar('salarioDiario', evento.target.value)}
          error={errores.salarioDiario}
        />
        <Selector
          etiqueta="Departamento"
          name="departamentoId"
          value={valores.departamentoId}
          onChange={(evento) => actualizar('departamentoId', evento.target.value)}
        >
          <option value="">Sin asignar</option>
          {departamentos.map((departamento) => (
            <option key={departamento.id} value={departamento.id}>
              {departamento.nombre}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="Puesto"
          name="puestoId"
          value={valores.puestoId}
          onChange={(evento) => actualizar('puestoId', evento.target.value)}
        >
          <option value="">Sin asignar</option>
          {puestos.map((puesto) => (
            <option key={puesto.id} value={puesto.id}>
              {puesto.nombre}
            </option>
          ))}
        </Selector>
        <Selector
          etiqueta="Tipo de contrato"
          name="tipoContrato"
          value={valores.tipoContrato}
          onChange={(evento) => actualizar('tipoContrato', evento.target.value)}
        >
          <option value="INDEFINIDO">Indefinido</option>
          <option value="TEMPORAL">Temporal</option>
          <option value="HONORARIOS">Honorarios</option>
          <option value="PRACTICAS">Prácticas</option>
        </Selector>
        <Campo
          etiqueta="Fecha de ingreso"
          name="fechaIngreso"
          type="date"
          required
          value={valores.fechaIngreso}
          onChange={(evento) => actualizar('fechaIngreso', evento.target.value)}
          error={errores.fechaIngreso}
        />
      </div>

      {errorGeneral ? <MensajeError>{errorGeneral}</MensajeError> : null}

      <div className="flex justify-end gap-3 pt-2">
        <Boton variante="secundario" onClick={onCancelar} type="button">
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardar.ejecutando}>
          {empleado ? 'Guardar cambios' : 'Guardar empleado'}
        </Boton>
      </div>
    </form>
  );
}
