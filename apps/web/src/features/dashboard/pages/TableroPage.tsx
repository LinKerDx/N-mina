import { fecha, moneda, porcentaje } from '@nomina360/core';
import {
  BarraProgreso,
  Boton,
  Cargador,
  EstadoVacio,
  Insignia,
  Kpi,
  Tabla,
  Tarjeta,
  EncabezadoTarjeta,
  tonoPorEstatus,
  type Columna,
} from '@nomina360/ui';
import type { PeriodoNomina, RegistroHoras } from '@nomina360/core';
import { Link } from 'react-router-dom';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { resumenAdministracion, resumenRh } from '@/features/dashboard/api';
import { listarPeriodos } from '@/features/nomina/api';
import { listarRegistros } from '@/features/produccion/api';
import { listarPresupuestos } from '@/features/administracion/api';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';

const HOY = new Date().toISOString().slice(0, 10);
const EJERCICIO = new Date().getFullYear();

export function TableroPage() {
  const { usuario } = useSesion();
  const rol = usuario?.rol;

  const puedeRh = rol === 'ADMIN' || rol === 'RH';
  const puedeAdministracion = rol === 'ADMIN' || rol === 'ADMINISTRACION';
  const puedeProduccion = rol === 'ADMIN' || rol === 'PRODUCCION';

  const rh = useConsulta((senal) => resumenRh(senal), 'tablero-rh', puedeRh);
  const admin = useConsulta(
    (senal) => resumenAdministracion(EJERCICIO, senal),
    `tablero-admin-${EJERCICIO}`,
    puedeAdministracion,
  );
  const periodos = useConsulta(
    (senal) => listarPeriodos(0, 6, senal),
    'tablero-periodos',
    puedeRh,
  );
  const presupuestos = useConsulta(
    (senal) => listarPresupuestos(EJERCICIO, senal),
    `tablero-presupuestos-${EJERCICIO}`,
    puedeAdministracion,
  );
  const registrosHoy = useConsulta(
    (senal) => listarRegistros({ fecha: HOY }, senal),
    'tablero-registros-hoy',
    puedeProduccion,
  );

  const primerNombre = usuario?.nombreCompleto.split(' ')[0] ?? '';

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo={`Hola, ${primerNombre}`}
        descripcion="Resumen de la operación de nómina por área. Los indicadores se alimentan de la base de datos de cada microservicio."
        accion={
          puedeRh ? (
            <Link to="/nomina">
              <Boton
                variante="secundario"
                iconoIzquierda={<Icono nombre="calculadora" className="size-4" />}
              >
                Ir a periodos
              </Boton>
            </Link>
          ) : undefined
        }
      />

      {rh.error ? <Aviso>{rh.error}</Aviso> : null}
      {admin.error ? <Aviso>{admin.error}</Aviso> : null}

      {puedeRh ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            titulo="Empleados activos"
            valor={rh.datos?.empleadosActivos ?? 0}
            detalle="Plantilla vigente en RH"
            icono={<Icono nombre="empleados" className="size-5" />}
            cargando={rh.cargando}
          />
          <Kpi
            titulo="Periodos abiertos"
            valor={rh.datos?.periodosAbiertos ?? 0}
            detalle="Listos para calcular"
            acento="ambar"
            icono={<Icono nombre="calculadora" className="size-5" />}
            cargando={rh.cargando}
          />
          <Kpi
            titulo="Neto periodo reciente"
            valor={moneda(rh.datos?.netoPeriodoReciente ?? 0)}
            detalle={rh.datos?.periodoReciente ?? 'Sin periodos'}
            acento="violeta"
            icono={<Icono nombre="dinero" className="size-5" />}
            cargando={rh.cargando}
          />
          <Kpi
            titulo="Recibos generados"
            valor={rh.datos?.recibosPeriodoReciente ?? 0}
            detalle={rh.datos?.estatusPeriodoReciente ?? 'Sin calcular'}
            acento="cielo"
            icono={<Icono nombre="nomina" className="size-5" />}
            cargando={rh.cargando}
          />
        </div>
      ) : null}

      {!puedeRh && puedeAdministracion ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi
            titulo="Presupuesto del ejercicio"
            valor={moneda(admin.datos?.totalPresupuestado ?? 0)}
            detalle={`Ejercicio ${EJERCICIO}`}
            icono={<Icono nombre="dinero" className="size-5" />}
            cargando={admin.cargando}
          />
          <Kpi
            titulo="Ejercido"
            valor={moneda(admin.datos?.totalEjercido ?? 0)}
            detalle={`${admin.datos?.pagosDelMes ?? 0} pagos este mes`}
            acento="ambar"
            icono={<Icono nombre="administracion" className="size-5" />}
            cargando={admin.cargando}
          />
          <Kpi
            titulo="Disponible"
            valor={moneda(admin.datos?.disponible ?? 0)}
            detalle="Presupuesto remanente"
            acento="cielo"
            icono={<Icono nombre="check" className="size-5" />}
            cargando={admin.cargando}
          />
        </div>
      ) : null}

      {!puedeRh && !puedeAdministracion && puedeProduccion ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi
            titulo="Registros de hoy"
            valor={registrosHoy.datos?.length ?? 0}
            detalle={fecha(HOY)}
            icono={<Icono nombre="reloj" className="size-5" />}
            cargando={registrosHoy.cargando}
          />
          <Kpi
            titulo="Horas extra de hoy"
            valor={(registrosHoy.datos ?? []).reduce((total, item) => total + item.horasExtra, 0)}
            detalle="Pendientes de aprobar"
            acento="ambar"
            icono={<Icono nombre="produccion" className="size-5" />}
            cargando={registrosHoy.cargando}
          />
          <Kpi
            titulo="Aprobados"
            valor={(registrosHoy.datos ?? []).filter((item) => item.estatus === 'APROBADO').length}
            detalle="Se envían a RH por evento"
            acento="cielo"
            icono={<Icono nombre="check" className="size-5" />}
            cargando={registrosHoy.cargando}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {puedeRh ? (
          <Tarjeta>
            <EncabezadoTarjeta
              titulo="Periodos recientes"
              descripcion="Estado del cálculo de los últimos periodos de nómina"
              accion={
                <Link to="/nomina" className="text-xs font-medium text-brand-300 hover:text-brand-200">
                  Ver todos
                </Link>
              }
            />
            {periodos.cargando ? (
              <Cargador />
            ) : (periodos.datos?.contenido.length ?? 0) === 0 ? (
              <EstadoVacio
                titulo="Aún no hay periodos"
                descripcion="Crea el primer periodo de nómina para comenzar a calcular."
                accion={
                  <Link to="/nomina">
                    <Boton tamano="sm">Crear periodo</Boton>
                  </Link>
                }
              />
            ) : (
              <Tabla<PeriodoNomina>
                filas={periodos.datos?.contenido ?? []}
                obtenerClave={(fila) => fila.id}
                columnas={columnasPeriodo}
              />
            )}
          </Tarjeta>
        ) : (
          <Tarjeta>
            <EncabezadoTarjeta
              titulo="Registros de hoy"
              descripcion="Horas capturadas por el área de producción"
              accion={
                <Link to="/produccion" className="text-xs font-medium text-brand-300 hover:text-brand-200">
                  Ir a producción
                </Link>
              }
            />
            {registrosHoy.cargando ? (
              <Cargador />
            ) : (registrosHoy.datos?.length ?? 0) === 0 ? (
              <EstadoVacio
                titulo="Sin registros hoy"
                descripcion="Cuando producción capture horas aparecerán aquí."
              />
            ) : (
              <Tabla<RegistroHoras>
                filas={registrosHoy.datos ?? []}
                obtenerClave={(fila) => fila.id}
                columnas={[
                  {
                    clave: 'empleado',
                    encabezado: 'Empleado',
                    render: (fila) => fila.empleadoNombre,
                  },
                  {
                    clave: 'horas',
                    encabezado: 'Horas',
                    alinear: 'derecha',
                    render: (fila) => `${fila.horasNormales} + ${fila.horasExtra} extra`,
                  },
                  {
                    clave: 'estatus',
                    encabezado: 'Estatus',
                    alinear: 'derecha',
                    render: (fila) => (
                      <Insignia tono={tonoPorEstatus(fila.estatus)}>{fila.estatus}</Insignia>
                    ),
                  },
                ]}
              />
            )}
          </Tarjeta>
        )}

        <div className="space-y-6">
          {puedeAdministracion ? (
            <Tarjeta>
              <EncabezadoTarjeta
                titulo="Ejecución presupuestal"
                descripcion={`Centros de costo con presupuesto en ${EJERCICIO}`}
                accion={
                  <Link
                    to="/administracion"
                    className="text-xs font-medium text-brand-300 hover:text-brand-200"
                  >
                    Detalle
                  </Link>
                }
              />
              {presupuestos.cargando ? (
                <Cargador />
              ) : (presupuestos.datos?.length ?? 0) === 0 ? (
                <EstadoVacio titulo="Sin presupuestos" descripcion="Define montos por centro de costo." />
              ) : (
                <ul className="space-y-4">
                  {presupuestos.datos?.slice(0, 4).map((presupuesto) => (
                    <li key={presupuesto.id}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">
                          {presupuesto.centroCostoNombre ?? 'Centro de costo'}
                        </span>
                        <span className="text-slate-400">
                          {porcentaje(presupuesto.porcentajeEjercido)}
                        </span>
                      </div>
                      <BarraProgreso
                        valor={presupuesto.porcentajeEjercido}
                        tono={
                          presupuesto.porcentajeEjercido > 90
                            ? 'peligro'
                            : presupuesto.porcentajeEjercido > 70
                              ? 'ambar'
                              : 'brand'
                        }
                        etiqueta={`Ejercicio de ${presupuesto.centroCostoNombre}`}
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        {moneda(presupuesto.montoEjercido)} de {moneda(presupuesto.montoPresupuestado)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          ) : null}

          <Tarjeta>
            <EncabezadoTarjeta
              titulo="Flujo de la nómina"
              descripcion="Cómo se conectan las áreas en este sistema"
            />
            <ol className="space-y-4">
              {[
                {
                  titulo: 'Producción captura horas',
                  detalle: 'Registra turnos y tiempo extra; al aprobar publica un evento.',
                },
                {
                  titulo: 'RH calcula la nómina',
                  detalle: 'Integra incidencias y aplica ISR, IMSS y percepciones.',
                },
                {
                  titulo: 'Administración paga',
                  detalle: 'Registra el pago contra el presupuesto del centro de costo.',
                },
              ].map((paso, indice) => (
                <li key={paso.titulo} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-xs font-semibold text-brand-300">
                    {indice + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{paso.titulo}</p>
                    <p className="text-xs leading-relaxed text-slate-400">{paso.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
}

const columnasPeriodo: Array<Columna<PeriodoNomina>> = [
  {
    clave: 'periodo',
    encabezado: 'Periodo',
    render: (fila) => (
      <div>
        <p className="text-sm font-medium text-white">{fila.nombre}</p>
        <p className="text-[11px] text-slate-500">
          {fecha(fila.fechaInicio)} — {fecha(fila.fechaFin)}
        </p>
      </div>
    ),
  },
  {
    clave: 'dias',
    encabezado: 'Días',
    alinear: 'derecha',
    render: (fila) => fila.diasPeriodo,
  },
  {
    clave: 'pago',
    encabezado: 'Pago',
    alinear: 'derecha',
    render: (fila) => fecha(fila.fechaPago),
  },
  {
    clave: 'estatus',
    encabezado: 'Estatus',
    alinear: 'derecha',
    render: (fila) => <Insignia tono={tonoPorEstatus(fila.estatus)}>{fila.estatus}</Insignia>,
  },
];
