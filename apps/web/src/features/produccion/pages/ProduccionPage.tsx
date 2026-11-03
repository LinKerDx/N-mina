import { fecha, type RegistroHoras } from '@nomina360/core';
import {
  Boton,
  Cargador,
  type Columna,
  EstadoVacio,
  Insignia,
  Kpi,
  Modal,
  Tabla,
  Tarjeta,
  tonoPorEstatus,
} from '@nomina360/ui';
import { useState } from 'react';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import {
  aprobarRegistro,
  catalogoCentros,
  catalogoTurnos,
  listarRegistros,
  rechazarRegistro,
  registrarHoras,
} from '@/features/produccion/api';
import { FormularioRegistroHoras } from '@/features/produccion/components/FormularioRegistroHoras';
import { empleadosActivos } from '@/features/empleados/api';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';

const HOY = new Date().toISOString().slice(0, 10);

export function ProduccionPage() {
  const [dia, setDia] = useState(HOY);
  const [modalRegistro, setModalRegistro] = useState(false);
  const [registroARechazar, setRegistroARechazar] = useState<RegistroHoras | null>(null);
  const [motivo, setMotivo] = useState('');

  const registros = useConsulta(
    (senal) => listarRegistros({ fecha: dia }, senal),
    `produccion:${dia}`,
  );
  const centros = useConsulta((senal) => catalogoCentros(senal), 'centros-trabajo');
  const turnos = useConsulta((senal) => catalogoTurnos(senal), 'turnos');
  const empleados = useConsulta((senal) => empleadosActivos(senal), 'empleados-activos');

  const aprobar = useAccion(aprobarRegistro);
  const rechazar = useAccion(rechazarRegistro);
  const registrar = useAccion(registrarHoras);

  const lista = registros.datos ?? [];
  const horasExtra = lista.reduce((total, item) => total + item.horasExtra, 0);
  const pendientes = lista.filter((item) => item.estatus === 'REGISTRADO').length;

  const nombreCentro = new Map((centros.datos ?? []).map((centro) => [centro.id, centro.nombre]));
  const nombreTurno = new Map((turnos.datos ?? []).map((turno) => [turno.id, turno.nombre]));

  async function manejarAprobacion(registro: RegistroHoras) {
    try {
      await aprobar.ejecutar(registro.id);
      registros.recargar();
    } catch {
      // el error se muestra en el banner
    }
  }

  async function confirmarRechazo() {
    if (!registroARechazar) {
      return;
    }
    try {
      await rechazar.ejecutar(registroARechazar.id, motivo || 'Sin motivo especificado');
      setRegistroARechazar(null);
      setMotivo('');
      registros.recargar();
    } catch {
      // el error se muestra en el modal
    }
  }

  const columnas: Array<Columna<RegistroHoras>> = [
    {
      clave: 'empleado',
      encabezado: 'Empleado',
      render: (fila) => (
        <div>
          <p className="text-sm font-medium text-white">{fila.empleadoNombre}</p>
          <p className="text-[11px] text-slate-500">
            {fila.centroTrabajoId ? (nombreCentro.get(fila.centroTrabajoId) ?? 'Centro') : 'Sin centro'}
            {' · '}
            {nombreTurno.get(fila.turnoId) ?? 'Turno'}
          </p>
        </div>
      ),
    },
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      alinear: 'derecha',
      render: (fila) => <span className="text-xs text-slate-400">{fecha(fila.fecha)}</span>,
    },
    {
      clave: 'horas',
      encabezado: 'Horas',
      alinear: 'derecha',
      render: (fila) => (
        <div className="text-xs">
          <p className="text-slate-200">{fila.horasNormales} normales</p>
          <p className={fila.horasExtra > 0 ? 'text-amber-300' : 'text-slate-500'}>
            {fila.horasExtra} extra
          </p>
        </div>
      ),
    },
    {
      clave: 'estatus',
      encabezado: 'Estatus',
      alinear: 'derecha',
      render: (fila) => <Insignia tono={tonoPorEstatus(fila.estatus)}>{fila.estatus}</Insignia>,
    },
    {
      clave: 'acciones',
      encabezado: '',
      alinear: 'derecha',
      render: (fila) =>
        fila.estatus !== 'REGISTRADO' ? (
          <span className="text-[11px] text-slate-500">
            {fila.aprobadoPor ? `por ${fila.aprobadoPor}` : '—'}
          </span>
        ) : (
          <div className="flex items-center justify-end gap-1">
            <Boton
              tamano="sm"
              variante="secundario"
              onClick={() => void manejarAprobacion(fila)}
              cargando={aprobar.ejecutando}
              iconoIzquierda={<Icono nombre="check" className="size-3.5" />}
            >
              Aprobar
            </Boton>
            <Boton
              tamano="sm"
              variante="fantasma"
              onClick={() => setRegistroARechazar(fila)}
              className="text-slate-400 hover:text-rose-200"
            >
              Rechazar
            </Boton>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Producción"
        descripcion="Captura y aprobación de horas trabajadas. Al aprobar, el tiempo extra se publica como evento para Recursos Humanos."
        accion={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dia}
              onChange={(evento) => setDia(evento.target.value)}
              className="rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-slate-200 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              aria-label="Fecha de registros"
            />
            <Boton
              onClick={() => setModalRegistro(true)}
              iconoIzquierda={<Icono nombre="mas" className="size-4" />}
            >
              Registrar horas
            </Boton>
          </div>
        }
      />

      {aprobar.error ? <Aviso>{aprobar.error}</Aviso> : null}
      {registrar.error ? <Aviso>{registrar.error}</Aviso> : null}
      {registros.error ? <Aviso>{registros.error}</Aviso> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          titulo="Registros del día"
          valor={lista.length}
          detalle={fecha(dia)}
          icono={<Icono nombre="reloj" className="size-5" />}
          cargando={registros.cargando}
        />
        <Kpi
          titulo="Horas extra"
          valor={horasExtra}
          detalle={`${pendientes} pendientes de aprobar`}
          acento="ambar"
          icono={<Icono nombre="produccion" className="size-5" />}
          cargando={registros.cargando}
        />
        <Kpi
          titulo="Aprobados"
          valor={lista.filter((item) => item.estatus === 'APROBADO').length}
          detalle="Notificados a RH"
          acento="cielo"
          icono={<Icono nombre="check" className="size-5" />}
          cargando={registros.cargando}
        />
      </div>

      <Tarjeta>
        {registros.cargando ? (
          <Cargador />
        ) : (
          <Tabla<RegistroHoras>
            filas={lista}
            obtenerClave={(fila) => fila.id}
            columnas={columnas}
            vacio={
              <EstadoVacio
                titulo="Sin registros para esta fecha"
                descripcion="Cambia la fecha o captura las horas del turno."
                accion={<Boton onClick={() => setModalRegistro(true)}>Registrar horas</Boton>}
              />
            }
          />
        )}
      </Tarjeta>

      <Modal
        abierto={modalRegistro}
        onCerrar={() => setModalRegistro(false)}
        titulo="Registrar horas"
        descripcion="Un registro por empleado, fecha y turno."
        ancho="lg"
      >
        <FormularioRegistroHoras
          empleados={empleados.datos ?? []}
          centros={centros.datos ?? []}
          turnos={turnos.datos ?? []}
          onCancelar={() => setModalRegistro(false)}
          onRegistrado={async (nuevos) => {
            await registrar.ejecutar(nuevos);
            setModalRegistro(false);
            registros.recargar();
          }}
        />
      </Modal>

      <Modal
        abierto={registroARechazar !== null}
        onCerrar={() => setRegistroARechazar(null)}
        titulo="Rechazar registro"
        descripcion={
          registroARechazar
            ? `${registroARechazar.empleadoNombre} · ${fecha(registroARechazar.fecha)}`
            : undefined
        }
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setRegistroARechazar(null)}>
              Cancelar
            </Boton>
            <Boton variante="peligro" cargando={rechazar.ejecutando} onClick={() => void confirmarRechazo()}>
              Rechazar
            </Boton>
          </>
        }
      >
        {rechazar.error ? <Aviso>{rechazar.error}</Aviso> : null}
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-slate-300">Motivo</span>
          <textarea
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            className="min-h-24 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            placeholder="Explica por qué se rechaza el registro"
          />
        </label>
        <p className="mt-3 text-xs text-slate-500">
          El registro quedará en estatus RECHAZADO y no se enviará a Recursos Humanos.
        </p>
      </Modal>
    </div>
  );
}
