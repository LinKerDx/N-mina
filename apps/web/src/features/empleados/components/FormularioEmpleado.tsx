import { esquemaEmpleado, type Departamento, type Empleado, type Puesto } from '@nomina360/core';
import { Boton, Campo, MensajeError, Selector } from '@nomina360/ui';
import { useState, type FormEvent } from 'react';
import { crearEmpleado } from '@/features/empleados/api';
import { mensajeDeError } from '@/shared/lib/errores';

export function FormularioEmpleado({
  departamentos,
  puestos,
  onCreado,
  onCancelar,
}: {
  departamentos: Departamento[];
  puestos: Puesto[];
  onCreado: (empleado: Empleado) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState({
    numeroEmpleado: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    departamentoId: '',
    puestoId: '',
    tipoContrato: 'INDEFINIDO' as const,
    fechaIngreso: new Date().toISOString().slice(0, 10),
    salarioDiario: '',
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
    setEnviando(true);
    try {
      const datos = resultado.data;
      const empleado = await crearEmpleado({
        numeroEmpleado: datos.numeroEmpleado,
        nombre: datos.nombre,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno || undefined,
        email: datos.email || undefined,
        departamentoId: datos.departamentoId || undefined,
        puestoId: datos.puestoId || undefined,
        tipoContrato: datos.tipoContrato,
        fechaIngreso: datos.fechaIngreso,
        salarioDiario: datos.salarioDiario,
      });
      onCreado(empleado);
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Número de empleado"
          name="numeroEmpleado"
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
          value={valores.nombre}
          onChange={(evento) => actualizar('nombre', evento.target.value)}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Apellido paterno"
          name="apellidoPaterno"
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
          etiqueta="Salario diario (MXN)"
          name="salarioDiario"
          type="number"
          min="0.01"
          step="0.01"
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
        <Boton type="submit" cargando={enviando}>
          Guardar empleado
        </Boton>
      </div>
    </form>
  );
}
