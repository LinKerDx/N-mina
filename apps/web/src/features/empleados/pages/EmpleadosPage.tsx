import { fecha, iniciales, moneda, type Empleado } from '@nomina360/core';
import {
  Boton,
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
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import {
  buscarEmpleados,
  catalogoDepartamentos,
  catalogoPuestos,
  darDeBajaEmpleado,
} from '@/features/empleados/api';
import { FormularioEmpleado } from '@/features/empleados/components/FormularioEmpleado';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';

const ESTATUS = ['ACTIVO', 'BAJA', 'VACACIONES', 'INCAPACIDAD'];

export function EmpleadosPage() {
  const [texto, setTexto] = useState('');
  const [textoAplicado, setTextoAplicado] = useState('');
  const [estatus, setEstatus] = useState('');
  const [pagina, setPagina] = useState(0);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [empleadoABaja, setEmpleadoABaja] = useState<Empleado | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

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
            <p className="truncate text-sm font-medium text-white">{fila.nombreCompleto}</p>
            <p className="text-[11px] text-slate-500">{fila.numeroEmpleado}</p>
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
          <p className="text-[11px] text-slate-500">{fila.departamentoNombre ?? 'Sin departamento'}</p>
        </div>
      ),
    },
    {
      clave: 'ingreso',
      encabezado: 'Ingreso',
      alinear: 'derecha',
      render: (fila) => <span className="text-xs text-slate-400">{fecha(fila.fechaIngreso)}</span>,
    },
    {
      clave: 'salario',
      encabezado: 'Salario diario',
      alinear: 'derecha',
      render: (fila) => <span className="tabular-nums">{moneda(fila.salarioDiario)}</span>,
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
        fila.estatus === 'BAJA' ? null : (
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => setEmpleadoABaja(fila)}
            className="text-slate-400 hover:text-rose-200"
          >
            Dar de baja
          </Boton>
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
      {empleados.error ? <Aviso>{empleados.error}</Aviso> : null}

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
              placeholder="Buscar por nombre o número de empleado…"
              className="w-full rounded-xl border border-white/10 bg-ink-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              aria-label="Buscar empleados"
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
                {valor}
              </option>
            ))}
          </select>
        </div>

        {empleados.cargando ? (
          <Cargador />
        ) : (
          <Tabla<Empleado>
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
      </Tarjeta>

      <Modal
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        titulo="Alta de empleado"
        descripcion="Los datos se guardan en la base de datos de Recursos Humanos."
        ancho="lg"
      >
        <FormularioEmpleado
          departamentos={departamentos.datos ?? []}
          puestos={puestos.datos ?? []}
          onCancelar={() => setModalNuevo(false)}
          onCreado={(empleado) => {
            setModalNuevo(false);
            setMensaje(`Empleado ${empleado.nombreCompleto} registrado`);
            empleados.recargar();
          }}
        />
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
            <Boton variante="peligro" cargando={baja.ejecutando} onClick={() => void confirmarBaja()}>
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
