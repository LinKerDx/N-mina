import { fecha, moneda, porcentaje, type Pago, type Presupuesto } from '@nomina360/core';
import {
  BarraProgreso,
  Boton,
  Cargador,
  type Columna,
  EstadoVacio,
  Insignia,
  Kpi,
  Modal,
  Tabla,
  Tarjeta,
  EncabezadoTarjeta,
  tonoPorEstatus,
} from '@nomina360/ui';
import { useState } from 'react';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import {
  catalogoCentrosCosto,
  catalogoProveedores,
  listarPagos,
  listarPresupuestos,
  registrarPago,
  resumenAdministracion,
} from '@/features/administracion/api';
import { FormularioPago } from '@/features/administracion/components/FormularioPago';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';
import { exportarCsv } from '@/shared/lib/exportarCsv';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';

const EJERCICIO = new Date().getFullYear();
const ANIOS = [EJERCICIO - 1, EJERCICIO, EJERCICIO + 1];

export function AdministracionPage() {
  const [anio, setAnio] = useState(EJERCICIO);
  const [modalPago, setModalPago] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const resumen = useConsulta(
    (senal) => resumenAdministracion(anio, senal),
    `admin-resumen:${anio}`,
  );
  const presupuestos = useConsulta(
    (senal) => listarPresupuestos(anio, senal),
    `admin-presupuestos:${anio}`,
  );
  const pagos = useConsulta((senal) => listarPagos(undefined, undefined, senal), 'admin-pagos');
  const centros = useConsulta((senal) => catalogoCentrosCosto(senal), 'admin-centros');
  const proveedores = useConsulta((senal) => catalogoProveedores(senal), 'admin-proveedores');
  const crearPago = useAccion(registrarPago);

  const nombreCentro = new Map(
    (centros.datos ?? []).map((centro) => [centro.id, `${centro.codigo} · ${centro.nombre}`]),
  );

  async function manejarPago(datos: Parameters<typeof crearPago.ejecutar>[0]) {
    const pago = await crearPago.ejecutar(datos);
    setModalPago(false);
    setMensaje(`Pago ${pago.folio} registrado por ${moneda(pago.monto)}`);
    resumen.recargar();
    presupuestos.recargar();
    pagos.recargar();
  }

  const columnasPresupuesto: Array<Columna<Presupuesto>> = [
    {
      clave: 'centro',
      encabezado: 'Centro de costo',
      render: (fila) => (
        <div>
          <p className="text-sm font-medium text-white">{fila.centroCostoNombre ?? 'Centro'}</p>
          <p className="text-[11px] text-slate-500">
            {String(fila.mes).padStart(2, '0')}/{fila.ejercicio}
          </p>
        </div>
      ),
    },
    {
      clave: 'presupuestado',
      encabezado: 'Presupuestado',
      alinear: 'derecha',
      render: (fila) => <span className="tabular-nums">{moneda(fila.montoPresupuestado)}</span>,
    },
    {
      clave: 'ejercido',
      encabezado: 'Ejercido',
      alinear: 'derecha',
      render: (fila) => (
        <div className="min-w-[120px]">
          <p className="tabular-nums text-xs text-slate-200">{moneda(fila.montoEjercido)}</p>
          <BarraProgreso
            valor={fila.porcentajeEjercido}
            tono={
              fila.porcentajeEjercido > 90
                ? 'peligro'
                : fila.porcentajeEjercido > 70
                  ? 'ambar'
                  : 'brand'
            }
            etiqueta={`Ejercicio de ${fila.centroCostoNombre}`}
          />
        </div>
      ),
    },
    {
      clave: 'porcentaje',
      encabezado: '%',
      alinear: 'derecha',
      render: (fila) => (
        <span className="text-xs text-slate-400">{porcentaje(fila.porcentajeEjercido)}</span>
      ),
    },
    {
      clave: 'disponible',
      encabezado: 'Disponible',
      alinear: 'derecha',
      render: (fila) => (
        <span className="tabular-nums text-sm text-brand-300">{moneda(fila.disponible)}</span>
      ),
    },
  ];

  const columnasPago: Array<Columna<Pago>> = [
    {
      clave: 'folio',
      encabezado: 'Folio',
      render: (fila) => (
        <div>
          <p className="font-mono text-xs text-slate-200">{fila.folio}</p>
          <p className="text-[11px] text-slate-500">
            {nombreCentro.get(fila.centroCostoId) ?? '—'}
          </p>
        </div>
      ),
    },
    {
      clave: 'tipo',
      encabezado: 'Tipo',
      render: (fila) => <Insignia tono="info">{fila.tipo}</Insignia>,
    },
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      alinear: 'derecha',
      render: (fila) => <span className="text-xs text-slate-400">{fecha(fila.fechaPago)}</span>,
    },
    {
      clave: 'monto',
      encabezado: 'Monto',
      alinear: 'derecha',
      render: (fila) => <span className="tabular-nums">{moneda(fila.monto)}</span>,
    },
    {
      clave: 'estatus',
      encabezado: 'Estatus',
      alinear: 'derecha',
      render: (fila) => <Insignia tono={tonoPorEstatus(fila.estatus)}>{fila.estatus}</Insignia>,
    },
  ];

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Administración"
        descripcion="Presupuesto por centro de costo y registro de pagos. Cada pago afecta el disponible del mes."
        accion={
          <div className="flex items-center gap-2">
            <select
              value={anio}
              onChange={(evento) => setAnio(Number(evento.target.value))}
              className="rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2 text-sm text-slate-200 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              aria-label="Ejercicio fiscal"
            >
              {ANIOS.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
            <Boton
              onClick={() => setModalPago(true)}
              iconoIzquierda={<Icono nombre="dinero" className="size-4" />}
            >
              Registrar pago
            </Boton>
          </div>
        }
      />

      {mensaje ? <Aviso tono="exito">{mensaje}</Aviso> : null}
      {resumen.error ? (
        <ErrorCarga
          mensaje={resumen.error}
          onReintentar={resumen.recargar}
          recurso="el resumen presupuestal"
        />
      ) : null}
      {crearPago.error ? <Aviso>{crearPago.error}</Aviso> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Presupuesto"
          valor={resumen.error ? '—' : moneda(resumen.datos?.totalPresupuestado ?? 0)}
          detalle={resumen.error ? 'No disponible' : `Ejercicio ${anio}`}
          icono={<Icono nombre="dinero" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Ejercido"
          valor={resumen.error ? '—' : moneda(resumen.datos?.totalEjercido ?? 0)}
          detalle={
            resumen.error
              ? 'No disponible'
              : `${porcentaje(
                  resumen.datos && resumen.datos.totalPresupuestado > 0
                    ? (resumen.datos.totalEjercido / resumen.datos.totalPresupuestado) * 100
                    : 0,
                )} del total`
          }
          acento="ambar"
          icono={<Icono nombre="administracion" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Disponible"
          valor={resumen.error ? '—' : moneda(resumen.datos?.disponible ?? 0)}
          detalle={resumen.error ? 'No disponible' : 'Remanente presupuestal'}
          acento="cielo"
          icono={<Icono nombre="check" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Pagos del mes"
          valor={resumen.error ? '—' : (resumen.datos?.pagosDelMes ?? 0)}
          detalle={resumen.error ? 'No disponible' : moneda(resumen.datos?.montoPagadoMes ?? 0)}
          acento="violeta"
          icono={<Icono nombre="nomina" className="size-5" />}
          cargando={resumen.cargando}
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_1fr]">
        <Tarjeta>
          <EncabezadoTarjeta
            titulo="Presupuesto por centro de costo"
            descripcion="Montos mensuales y porcentaje ejercido"
            accion={
              <Boton
                variante="fantasma"
                tamano="sm"
                disabled={!presupuestos.datos?.length}
                onClick={() =>
                  exportarCsv(
                    `presupuestos-${anio}.csv`,
                    [
                      'Centro de costo',
                      'Ejercicio',
                      'Mes',
                      'Presupuestado',
                      'Ejercido',
                      'Disponible',
                      'Porcentaje ejercido',
                    ],
                    (presupuestos.datos ?? []).map((fila) => [
                      fila.centroCostoNombre ?? '',
                      fila.ejercicio,
                      fila.mes,
                      fila.montoPresupuestado,
                      fila.montoEjercido,
                      fila.disponible,
                      fila.porcentajeEjercido,
                    ]),
                  )
                }
              >
                Exportar CSV
              </Boton>
            }
          />
          {presupuestos.cargando ? (
            <Cargador />
          ) : presupuestos.error ? (
            <ErrorCarga
              mensaje={presupuestos.error}
              onReintentar={presupuestos.recargar}
              recurso="los presupuestos"
            />
          ) : (
            <Tabla<Presupuesto>
              filas={presupuestos.datos ?? []}
              obtenerClave={(fila) => fila.id}
              columnas={columnasPresupuesto}
              vacio={
                <EstadoVacio
                  titulo="Sin presupuestos"
                  descripcion={`No hay presupuesto definido para ${anio}.`}
                />
              }
            />
          )}
        </Tarjeta>

        <Tarjeta>
          <EncabezadoTarjeta
            titulo="Pagos recientes"
            descripcion="Últimos movimientos del mes"
            accion={
              <div className="flex gap-2">
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  disabled={!pagos.datos?.length}
                  onClick={() =>
                    exportarCsv(
                      'pagos.csv',
                      ['Folio', 'Tipo', 'Centro de costo', 'Fecha', 'Monto', 'Estatus'],
                      (pagos.datos ?? []).map((fila) => [
                        fila.folio,
                        fila.tipo,
                        nombreCentro.get(fila.centroCostoId) ?? '',
                        fila.fechaPago,
                        fila.monto,
                        fila.estatus,
                      ]),
                    )
                  }
                >
                  Exportar
                </Boton>
                <Boton variante="fantasma" tamano="sm" onClick={() => setModalPago(true)}>
                  Nuevo pago
                </Boton>
              </div>
            }
          />
          {pagos.cargando ? (
            <Cargador />
          ) : pagos.error ? (
            <ErrorCarga mensaje={pagos.error} onReintentar={pagos.recargar} recurso="los pagos" />
          ) : (
            <Tabla<Pago>
              filas={(pagos.datos ?? []).slice(0, 8)}
              obtenerClave={(fila) => fila.id}
              columnas={columnasPago}
              vacio={
                <EstadoVacio
                  titulo="Sin pagos"
                  descripcion="Registra el primer pago para afectar el presupuesto."
                />
              }
            />
          )}
        </Tarjeta>
      </div>

      <Modal
        abierto={modalPago}
        onCerrar={() => setModalPago(false)}
        titulo="Registrar pago"
        descripcion="El pago se valida contra el presupuesto disponible del centro de costo."
        ancho="lg"
      >
        {centros.cargando || proveedores.cargando ? (
          <Cargador />
        ) : centros.error ? (
          <ErrorCarga
            mensaje={centros.error}
            onReintentar={centros.recargar}
            recurso="los centros de costo"
          />
        ) : proveedores.error ? (
          <ErrorCarga
            mensaje={proveedores.error}
            onReintentar={proveedores.recargar}
            recurso="los proveedores"
          />
        ) : (
          <FormularioPago
            centros={centros.datos ?? []}
            proveedores={proveedores.datos ?? []}
            onCancelar={() => setModalPago(false)}
            onRegistrado={manejarPago}
          />
        )}
      </Modal>
    </div>
  );
}
