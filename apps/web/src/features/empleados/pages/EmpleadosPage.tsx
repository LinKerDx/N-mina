import { fecha, iniciales, moneda, type Empleado } from '@nomina360/core';
import {
  Boton,
  Campo,
  Cargador,
  Columna,
  EstadoVacio,
  Insignia,
  Modal,
  Tabla,
  Tarjeta,
  tonoPorEstatus,
} from '@nomina360/ui';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import {
  buscarEmpleados,
  catalogoDepartamentos,
  catalogoPuestos,
  darDeBajaEmpleado,
  reingresarEmpleado,
  revertirBajaEmpleado,
} from '@/features/empleados/api';
import { FormularioEmpleado } from '@/features/empleados/components/FormularioEmpleado';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';
import { exportarCsv } from '@/shared/lib/exportarCsv';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';
import { fechaCalendarioLocal } from '@/shared/lib/fechaCalendario';

const ESTATUS = ['ACTIVO', 'BAJA', 'VACACIONES', 'INCAPACIDAD'];
const ETIQUETA_ESTATUS: Record<(typeof ESTATUS)[number], string> = {
  ACTIVO: 'Activo',
  BAJA: 'Baja',
  VACACIONES: 'Vacaciones',
  INCAPACIDAD: 'Incapacidad',
};

export function EmpleadosPage() {
  const [parametros] = useSearchParams();
  const busquedaInicial = parametros.get('q') ?? '';
  const [texto, setTexto] = useState(busquedaInicial);
  const [textoAplicado, setTextoAplicado] = useState(busquedaInicial);
  const [estatus, setEstatus] = useState('');
  const [pagina, setPagina] = useState(0);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Empleado | null>(null);
  const [empleadoABaja, setEmpleadoABaja] = useState<Empleado | null>(null);
  const [empleadoAReingresar, setEmpleadoAReingresar] = useState<Empleado | null>(null);
  const [fechaReingreso, setFechaReingreso] = useState(fechaCalendarioLocal());
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    setTexto(busquedaInicial);
    setTextoAplicado(busquedaInicial);
    setPagina(0);
  }, [busquedaInicial]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setTextoAplicado(texto);
      setPagina(0);
    }, 350);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const empleados = useConsulta(
    (senal) => buscarEmpleados({ q: textoAplicado, estatus, page: pagina }, senal),
    `empleados:${textoAplicado}:${estatus}:${pagina}`,
  );
  const departamentos = useConsulta((senal) => catalogoDepartamentos(senal), 'departamentos');
  const puestos = useConsulta((senal) => catalogoPuestos(senal), 'puestos');
  const baja = useAccion(darDeBajaEmpleado);
  const reingreso = useAccion(reingresarEmpleado);
  const revertirBaja = useAccion(revertirBajaEmpleado);

  const total = empleados.datos?.totalElementos ?? 0;
  const totalPaginas = empleados.datos?.totalPaginas ?? 0;

  async function confirmarBaja() {
    if (!empleadoABaja) {
      return;
    }
    try {
      await baja.ejecutar(empleadoABaja.id);
      setMensaje(`Se dio de baja a ${empleadoABaja.nombreCompleto}`);
      setEmpleadoABaja(null);
      empleados.recargar();
    } catch {
      // el mensaje de error se muestra en el modal
    }
  }

  async function confirmarReingreso() {
    if (!empleadoAReingresar) return;
    try {
      const empleado = await reingreso.ejecutar(empleadoAReingresar.id, fechaReingreso);
      setMensaje(`${empleado.nombreCompleto} reingresó el ${fecha(empleado.fechaIngreso)}`);
      setEmpleadoAReingresar(null);
      if (estatus === 'BAJA') setEstatus('');
      empleados.recargar();
    } catch {
      // El error se muestra en el modal.
    }
  }

  async function confirmarReversionBaja() {
    if (!empleadoAReingresar) return;
    try {
      const empleado = await revertirBaja.ejecutar(empleadoAReingresar.id);
      setMensaje(`Se revirtió la baja de ${empleado.nombreCompleto}`);
      setEmpleadoAReingresar(null);
      if (estatus === 'BAJA') setEstatus('');
      empleados.recargar();
    } catch {
      // El error se muestra en el modal.
    }
  }

  const columnas: Array<Columna<Empleado>> = [
    {
      clave: 'empleado',
      encabezado: 'Empleado',
      render: (fila) => (
        <div className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acento/60 to-brand-500/60 text-[10px] font-semibold text-white">
            {iniciales(fila.nombreCompleto)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white" title={fila.nombreCompleto}>
              {fila.nombreCompleto}
            </p>
            <p className="text-[11px] text-slate-400">N.º {fila.numeroEmpleado}</p>
            {fila.email ? (
              <p className="max-w-56 truncate text-[11px] text-slate-500" title={fila.email}>
                {fila.email}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      clave: 'puesto',
      encabezado: 'Puesto y área',
      render: (fila) => (
        <div>
          <p className="text-sm text-slate-200">{fila.puestoNombre ?? 'Sin puesto'}</p>
          <p className="text-[11px] text-slate-500">
            {fila.departamentoNombre ?? 'Sin departamento'}
          </p>
        </div>
      ),
    },
    {
      clave: 'ingreso',
      encabezado: 'Ingreso / baja',
      alinear: 'derecha',
      render: (fila) => (
        <div className="text-xs">
          <p className="whitespace-nowrap text-slate-200">{fecha(fila.fechaIngreso)}</p>
          {fila.fechaBaja ? (
            <p className="mt-0.5 whitespace-nowrap text-[11px] text-rose-300">
              Baja: {fecha(fila.fechaBaja)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      clave: 'salario',
      encabezado: 'Salario diario',
      alinear: 'derecha',
      render: (fila) => (
        <div>
          <p className="whitespace-nowrap font-semibold tabular-nums text-slate-100">
            {moneda(fila.salarioDiario)}
          </p>
          <p className="text-[10px] text-slate-500">por día</p>
        </div>
      ),
    },
    {
      clave: 'estatus',
      encabezado: 'Estatus',
      alinear: 'derecha',
      render: (fila) => (
        <Insignia tono={tonoPorEstatus(fila.estatus)}>
          {ETIQUETA_ESTATUS[fila.estatus] ?? fila.estatus}
        </Insignia>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinear: 'derecha',
      render: (fila) => (
        <div className="flex flex-wrap justify-end gap-1.5">
          <Boton variante="secundario" tamano="sm" onClick={() => setEmpleadoAEditar(fila)}>
            Editar
          </Boton>
          {fila.estatus === 'BAJA' ? (
            <Boton
              tamano="sm"
              onClick={() => {
                setFechaReingreso(fechaCalendarioLocal());
                setEmpleadoAReingresar(fila);
              }}
            >
              Reingresar
            </Boton>
          ) : (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setEmpleadoABaja(fila)}
              className="text-slate-400 hover:text-rose-200"
            >
              Dar de baja
            </Boton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Empleados"
        descripcion="Plantilla de la organización. Cada alta queda disponible para el cálculo de nómina del área."
        accion={
          <Boton
            onClick={() => setModalNuevo(true)}
            iconoIzquierda={<Icono nombre="mas" className="size-4" />}
          >
            Nuevo empleado
          </Boton>
        }
      />

      {mensaje ? <Aviso tono="exito">{mensaje}</Aviso> : null}

      <Tarjeta>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Icono
              nombre="buscar"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
            />
            <input
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder="Buscar por nombre, número o correo…"
              className="w-full rounded-xl border border-white/10 bg-ink-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              aria-label="Buscar empleados"
              autoComplete="off"
            />
          </div>
          <select
            value={estatus}
            onChange={(evento) => {
              setEstatus(evento.target.value);
              setPagina(0);
            }}
            className="rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2.5 text-sm text-slate-200 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            aria-label="Filtrar por estatus"
          >
            <option value="">Todos los estatus</option>
            {ESTATUS.map((valor) => (
              <option key={valor} value={valor}>
                {ETIQUETA_ESTATUS[valor]}
              </option>
            ))}
          </select>
          {texto || estatus ? (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => {
                setTexto('');
                setEstatus('');
                setPagina(0);
              }}
            >
              Limpiar filtros
            </Boton>
          ) : null}
          <Boton
            variante="secundario"
            disabled={!empleados.datos?.contenido.length}
            onClick={() => {
              const filas = empleados.datos?.contenido ?? [];
              exportarCsv(
                `empleados-pagina-${pagina + 1}.csv`,
                [
                  'Número',
                  'Nombre',
                  'Correo',
                  'Puesto',
                  'Departamento',
                  'Fecha de ingreso',
                  'Fecha de baja',
                  'Salario diario',
                  'Estatus',
                ],
                filas.map((fila) => [
                  fila.numeroEmpleado,
                  fila.nombreCompleto,
                  fila.email ?? '',
                  fila.puestoNombre ?? '',
                  fila.departamentoNombre ?? '',
                  fila.fechaIngreso,
                  fila.fechaBaja ?? '',
                  fila.salarioDiario,
                  fila.estatus,
                ]),
              );
            }}
            iconoIzquierda={<Icono nombre="descargar" className="size-4" />}
          >
            Exportar página CSV
          </Boton>
        </div>

        {empleados.cargando ? (
          <Cargador />
        ) : empleados.error ? (
          <ErrorCarga
            mensaje={empleados.error}
            onReintentar={empleados.recargar}
            recurso="empleados"
          />
        ) : (
          <Tabla<Empleado>
            etiqueta="Empleados"
            filas={empleados.datos?.contenido ?? []}
            obtenerClave={(fila) => fila.id}
            columnas={columnas}
            vacio={
              <EstadoVacio
                titulo="Sin empleados"
                descripcion="No hay resultados con los filtros actuales. Da de alta al primer empleado."
                accion={
                  <Boton tamano="sm" onClick={() => setModalNuevo(true)}>
                    Nuevo empleado
                  </Boton>
                }
              />
            }
          />
        )}

        {!empleados.cargando && !empleados.error ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {total === 0
                ? 'Sin registros'
                : `Mostrando ${(empleados.datos?.pagina ?? 0) * (empleados.datos?.tamano ?? 20) + 1}–${Math.min(
                    ((empleados.datos?.pagina ?? 0) + 1) * (empleados.datos?.tamano ?? 20),
                    total,
                  )} de ${total}`}
            </span>
            <div className="flex items-center gap-2">
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={pagina === 0}
                onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
              >
                Anterior
              </Boton>
              <span className="px-1">
                {pagina + 1} / {Math.max(totalPaginas, 1)}
              </span>
              <Boton
                variante="secundario"
                tamano="sm"
                disabled={pagina + 1 >= totalPaginas}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente
              </Boton>
            </div>
          </div>
        ) : null}
      </Tarjeta>

      <Modal
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        titulo="Alta de empleado"
        descripcion="Los datos se guardan en la base de datos de Recursos Humanos."
        ancho="lg"
      >
        {departamentos.cargando || puestos.cargando ? (
          <Cargador mensaje="Cargando catálogos…" />
        ) : departamentos.error ? (
          <ErrorCarga
            mensaje={departamentos.error}
            onReintentar={departamentos.recargar}
            recurso="los departamentos"
          />
        ) : puestos.error ? (
          <ErrorCarga
            mensaje={puestos.error}
            onReintentar={puestos.recargar}
            recurso="los puestos"
          />
        ) : (
          <FormularioEmpleado
            departamentos={departamentos.datos ?? []}
            puestos={puestos.datos ?? []}
            onCancelar={() => setModalNuevo(false)}
            onGuardado={(empleado) => {
              setModalNuevo(false);
              setMensaje(`Empleado ${empleado.nombreCompleto} registrado`);
              empleados.recargar();
            }}
          />
        )}
      </Modal>

      <Modal
        abierto={empleadoAEditar !== null}
        onCerrar={() => setEmpleadoAEditar(null)}
        titulo="Editar empleado"
        descripcion={
          empleadoAEditar
            ? `Actualiza la información de ${empleadoAEditar.nombreCompleto}.`
            : undefined
        }
        ancho="lg"
      >
        {departamentos.cargando || puestos.cargando ? (
          <Cargador mensaje="Cargando catálogos…" />
        ) : departamentos.error ? (
          <ErrorCarga
            mensaje={departamentos.error}
            onReintentar={departamentos.recargar}
            recurso="los departamentos"
          />
        ) : puestos.error ? (
          <ErrorCarga
            mensaje={puestos.error}
            onReintentar={puestos.recargar}
            recurso="los puestos"
          />
        ) : empleadoAEditar ? (
          <FormularioEmpleado
            key={empleadoAEditar.id}
            empleado={empleadoAEditar}
            departamentos={departamentos.datos ?? []}
            puestos={puestos.datos ?? []}
            onCancelar={() => setEmpleadoAEditar(null)}
            onGuardado={(empleado) => {
              setEmpleadoAEditar(null);
              setMensaje(`Cambios de ${empleado.nombreCompleto} guardados`);
              empleados.recargar();
            }}
          />
        ) : null}
      </Modal>

      <Modal
        abierto={empleadoAReingresar !== null}
        onCerrar={() => setEmpleadoAReingresar(null)}
        titulo="Reingresar empleado"
        descripcion={
          empleadoAReingresar
            ? `${empleadoAReingresar.nombreCompleto} volverá a quedar activo.`
            : undefined
        }
        ancho="sm"
        pie={
          <>
            <Boton
              variante="secundario"
              cargando={revertirBaja.ejecutando}
              disabled={!empleadoAReingresar?.fechaBaja || reingreso.ejecutando}
              onClick={() => void confirmarReversionBaja()}
            >
              Revertir baja
            </Boton>
            <Boton
              cargando={reingreso.ejecutando}
              disabled={!fechaReingreso || revertirBaja.ejecutando}
              onClick={() => void confirmarReingreso()}
            >
              Registrar reingreso
            </Boton>
          </>
        }
      >
        {(reingreso.error || revertirBaja.error) && (
          <Aviso>{reingreso.error ?? revertirBaja.error}</Aviso>
        )}
        <div className="space-y-3">
          <Campo
            etiqueta="Fecha del nuevo ingreso"
            name="fechaReingreso"
            type="date"
            required
            min={empleadoAReingresar?.fechaBaja ?? undefined}
            value={fechaReingreso}
            onChange={(evento) => setFechaReingreso(evento.target.value)}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            “Revertir baja” conserva la fecha de ingreso original. “Registrar reingreso” inicia una
            nueva fecha de ingreso.
          </p>
        </div>
      </Modal>

      <Modal
        abierto={empleadoABaja !== null}
        onCerrar={() => setEmpleadoABaja(null)}
        titulo="Dar de baja al empleado"
        descripcion={
          empleadoABaja
            ? `${empleadoABaja.nombreCompleto} dejará de aparecer en los siguientes cálculos de nómina.`
            : undefined
        }
        ancho="sm"
        pie={
          <>
            <Boton variante="secundario" onClick={() => setEmpleadoABaja(null)}>
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              cargando={baja.ejecutando}
              onClick={() => void confirmarBaja()}
            >
              Confirmar baja
            </Boton>
          </>
        }
      >
        {baja.error ? <Aviso>{baja.error}</Aviso> : null}
        <p className="text-sm text-slate-400">
          La baja es lógica: el historial de nómina y los recibos anteriores se conservan.
        </p>
      </Modal>
    </div>
  );
}
