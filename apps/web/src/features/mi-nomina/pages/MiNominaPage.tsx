import {
  fecha,
  moneda,
  type ConceptoNomina,
  type MiPerfil,
  type MiRecibo,
  type MiReciboDetalle,
} from '@nomina360/core';
import {
  Boton,
  Cargador,
  type Columna,
  EncabezadoTarjeta,
  EstadoVacio,
  Insignia,
  Kpi,
  Modal,
  Tabla,
  Tarjeta,
  tonoPorEstatus,
} from '@nomina360/ui';
import { useMemo, useState } from 'react';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import {
  descargarMiReciboPdf,
  miPerfil,
  miRecibo,
  miResumen,
  misRecibos,
} from '@/features/mi-nomina/api';
import { EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { Icono } from '@/shell/iconos';
import { useAccion } from '@/shared/hooks/useAccion';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';

export function MiNominaPage() {
  const { usuario } = useSesion();
  const [reciboAbierto, setReciboAbierto] = useState<MiRecibo | null>(null);
  const [tipoPeriodo, setTipoPeriodo] = useState<'TODOS' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>(
    'TODOS',
  );

  const perfil = useConsulta((senal) => miPerfil(senal), 'mi-perfil');
  const resumen = useConsulta((senal) => miResumen(senal), 'mi-resumen');
  const recibos = useConsulta((senal) => misRecibos(senal), 'mis-recibos');

  const primerNombre = usuario?.nombreCompleto.split(' ')[0] ?? '';
  const ultimaFecha = resumen.datos?.ultimaFechaPago;
  const recibosFiltrados = useMemo(
    () =>
      (recibos.datos ?? []).filter((recibo) => {
        const tipo = recibo.periodo?.tipo;
        if (tipoPeriodo === 'TODOS') return true;
        if (tipoPeriodo === 'QUINCENAL') return tipo === 'QUINCENAL' || tipo === 'CATORCENAL';
        return tipo === tipoPeriodo;
      }),
    [recibos.datos, tipoPeriodo],
  );

  const columnas: Array<Columna<MiRecibo>> = [
    {
      clave: 'periodo',
      encabezado: 'Periodo',
      render: (fila) => (
        <div>
          <p className="text-sm font-medium text-white">{fila.periodo?.nombre ?? 'Periodo'}</p>
          <p className="text-[11px] text-slate-500">
            {rangoPeriodo(fila.periodo?.fechaInicio, fila.periodo?.fechaFin)}
          </p>
        </div>
      ),
    },
    {
      clave: 'dias',
      encabezado: 'Días',
      alinear: 'derecha',
      render: (fila) => <span className="text-xs text-slate-400">{fila.diasPagados}</span>,
    },
    {
      clave: 'percepciones',
      encabezado: 'Percepciones',
      alinear: 'derecha',
      render: (fila) => (
        <span className="tabular-nums text-xs text-emerald-300">
          {moneda(fila.totalPercepciones)}
        </span>
      ),
    },
    {
      clave: 'deducciones',
      encabezado: 'Deducciones',
      alinear: 'derecha',
      render: (fila) => (
        <span className="tabular-nums text-xs text-rose-300">{moneda(fila.totalDeducciones)}</span>
      ),
    },
    {
      clave: 'neto',
      encabezado: 'Neto',
      alinear: 'derecha',
      render: (fila) => (
        <span className="tabular-nums text-sm font-semibold text-brand-300">
          {moneda(fila.neto)}
        </span>
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
      render: (fila) => (
        <Boton variante="secundario" tamano="sm" onClick={() => setReciboAbierto(fila)}>
          Ver
        </Boton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo={`Hola, ${primerNombre}`}
        descripcion="Este es tu espacio personal: consulta tus recibos, revisa cómo se compone tu pago y descarga tu comprobante."
      />

      {resumen.error ? (
        <ErrorCarga
          mensaje={resumen.error}
          onReintentar={resumen.recargar}
          recurso="el resumen de nómina"
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Último neto"
          valor={resumen.error ? '—' : moneda(resumen.datos?.ultimoNeto ?? 0)}
          detalle={
            resumen.error ? 'No disponible' : (resumen.datos?.ultimoPeriodo ?? 'Aún sin recibos')
          }
          icono={<Icono nombre="dinero" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Percepciones acumuladas"
          valor={resumen.error ? '—' : moneda(resumen.datos?.totalPercepciones ?? 0)}
          detalle={resumen.error ? 'No disponible' : `${resumen.datos?.totalRecibos ?? 0} recibos`}
          acento="cielo"
          icono={<Icono nombre="nomina" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Deducciones acumuladas"
          valor={resumen.error ? '—' : moneda(resumen.datos?.totalDeducciones ?? 0)}
          detalle={resumen.error ? 'No disponible' : 'ISR, IMSS y demás descuentos'}
          acento="ambar"
          icono={<Icono nombre="calculadora" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Último pago"
          valor={resumen.error ? '—' : ultimaFecha ? fecha(ultimaFecha) : '—'}
          detalle={
            resumen.error ? 'No disponible' : (resumen.datos?.ultimoPeriodo ?? 'Sin periodos')
          }
          acento="violeta"
          icono={<Icono nombre="reloj" className="size-5" />}
          cargando={resumen.cargando}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Tarjeta className="overflow-hidden">
          <EncabezadoTarjeta
            titulo="Mis recibos"
            descripcion="Selecciona un periodo para ver el desglose completo y descargar el PDF."
          />
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-brand-500/[0.09] via-white/[0.025] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-100">Frecuencia de pago</p>
              <p className="text-xs text-slate-500">Filtra tus recibos por tipo de periodo.</p>
            </div>
            <div
              className="grid grid-cols-2 gap-2 sm:flex"
              role="group"
              aria-label="Filtrar recibos por frecuencia"
            >
              {(['TODOS', 'SEMANAL', 'QUINCENAL', 'MENSUAL'] as const).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  aria-pressed={tipoPeriodo === tipo}
                  onClick={() => setTipoPeriodo(tipo)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${tipoPeriodo === tipo ? 'bg-brand-400 text-ink-950 shadow-[0_8px_24px_-12px_rgba(52,211,153,.8)]' : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'}`}
                >
                  {tipo === 'TODOS'
                    ? 'Todos'
                    : tipo === 'QUINCENAL'
                      ? 'Quincenal'
                      : tipo === 'MENSUAL'
                        ? 'Mensual'
                        : 'Semanal'}
                </button>
              ))}
            </div>
          </div>
          {recibos.cargando ? (
            <Cargador />
          ) : recibos.error ? (
            <ErrorCarga
              mensaje={recibos.error}
              onReintentar={recibos.recargar}
              recurso="tus recibos"
            />
          ) : (
            <Tabla<MiRecibo>
              filas={recibosFiltrados}
              obtenerClave={(fila) => fila.id}
              columnas={columnas}
              vacio={
                <EstadoVacio
                  titulo={
                    recibos.datos?.length
                      ? 'No hay recibos en esta frecuencia'
                      : 'Aún no tienes recibos'
                  }
                  descripcion={
                    recibos.datos?.length
                      ? 'Prueba con otra frecuencia para consultar tus recibos.'
                      : 'Cuando Recursos Humanos calcule un periodo, tu recibo aparecerá aquí.'
                  }
                />
              }
            />
          )}
        </Tarjeta>

        <Tarjeta>
          <EncabezadoTarjeta
            titulo="Mis datos"
            descripcion="Información laboral registrada por Recursos Humanos."
          />
          {perfil.cargando ? (
            <Cargador />
          ) : perfil.error ? (
            <ErrorCarga mensaje={perfil.error} onReintentar={perfil.recargar} recurso="tu perfil" />
          ) : perfil.datos ? (
            <DatosPersonales perfil={perfil.datos} />
          ) : (
            <EstadoVacio
              titulo="Sin datos"
              descripcion="No encontramos tu ficha de empleado. Contacta a Recursos Humanos."
            />
          )}
        </Tarjeta>
      </div>

      <Modal
        abierto={reciboAbierto !== null}
        onCerrar={() => setReciboAbierto(null)}
        titulo="Desglose de tu recibo"
        descripcion="Así se compone tu pago en el periodo seleccionado."
        ancho="lg"
      >
        {reciboAbierto ? <DetalleRecibo recibo={reciboAbierto} /> : null}
      </Modal>
    </div>
  );
}

function rangoPeriodo(inicio?: string, fin?: string): string {
  const corto = (valor?: string) => {
    if (!valor) return '—';
    const [year, month, day] = valor.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day)
      .toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
      .replace('.', '')
      .toLocaleUpperCase('es-MX');
  };
  return `${corto(inicio)} - ${corto(fin)}`;
}

function DatosPersonales({ perfil }: { perfil: MiPerfil }) {
  const filas: Array<[string, string]> = [
    ['Número de empleado', perfil.numeroEmpleado],
    ['CURP', perfil.curp ?? '—'],
    ['RFC', perfil.rfc ?? '—'],
    ['NSS', perfil.nss ?? '—'],
    ['Correo', perfil.email ?? '—'],
    ['Teléfono', perfil.telefono ?? '—'],
    ['Puesto', perfil.puesto ?? '—'],
    ['Departamento', perfil.departamento ?? '—'],
    ['Tipo de contrato', perfil.tipoContrato],
    ['Fecha de ingreso', fecha(perfil.fechaIngreso)],
    ['Salario diario', moneda(perfil.salarioDiario)],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
        <span className="text-xs text-slate-400">Estatus</span>
        <Insignia tono={tonoPorEstatus(perfil.estatus)}>{perfil.estatus}</Insignia>
      </div>
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="rounded-xl bg-white/[0.02] px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">{etiqueta}</dt>
            <dd className="break-words text-sm text-slate-200">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DetalleRecibo({ recibo }: { recibo: MiRecibo }) {
  const detalle = useConsulta((senal) => miRecibo(recibo.id, senal), `mi-recibo:${recibo.id}`);

  if (detalle.cargando) {
    return <Cargador mensaje="Cargando el desglose…" />;
  }

  if (detalle.error || !detalle.datos) {
    return (
      <ErrorCarga
        mensaje={detalle.error ?? 'No se pudo cargar el recibo.'}
        onReintentar={detalle.recargar}
        recurso="el desglose del recibo"
      />
    );
  }

  const datos: MiReciboDetalle = detalle.datos;
  const percepciones = datos.conceptos.filter((concepto) => concepto.tipo === 'PERCEPCION');
  const deducciones = datos.conceptos.filter((concepto) => concepto.tipo === 'DEDUCCION');

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Dato etiqueta="Periodo" valor={datos.periodo?.nombre ?? '—'} />
        <Dato etiqueta="Días pagados" valor={String(datos.diasPagados)} />
        <Dato etiqueta="Fecha de pago" valor={fecha(datos.periodo?.fechaPago)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TablaConceptos
          titulo="Percepciones"
          conceptos={percepciones}
          subtotal={datos.totalPercepciones}
          acento="emerald"
        />
        <TablaConceptos
          titulo="Deducciones"
          conceptos={deducciones}
          subtotal={datos.totalDeducciones}
          acento="rose"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-400/30 bg-brand-500/10 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-200">
            Neto a pagar
          </p>
          <p className="text-2xl font-semibold text-brand-200">{moneda(datos.neto)}</p>
        </div>
        <p className="text-xs text-slate-400">
          {moneda(datos.totalPercepciones)} − {moneda(datos.totalDeducciones)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <p className="max-w-md text-[11px] leading-relaxed text-slate-500">
          Este desglose es informativo. Si detectas una diferencia, contacta a Recursos Humanos
          antes de que cierre el periodo.
        </p>
        <BotonPdf reciboId={datos.id} numeroEmpleado={datos.empleado.numeroEmpleado} />
      </div>
    </div>
  );
}

function TablaConceptos({
  titulo,
  conceptos,
  subtotal,
  acento,
}: {
  titulo: string;
  conceptos: ConceptoNomina[];
  subtotal: number;
  acento: 'emerald' | 'rose';
}) {
  const colorTitulo = acento === 'emerald' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${colorTitulo}`}>
          {titulo}
        </p>
        <p className="text-xs tabular-nums text-slate-300">{moneda(subtotal)}</p>
      </div>

      {conceptos.length === 0 ? (
        <p className="px-3 py-4 text-xs text-slate-500">Sin conceptos en este recibo.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {conceptos.map((concepto) => (
            <li
              key={`${concepto.clave}-${concepto.descripcion}`}
              className="flex items-start justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-200">{concepto.descripcion}</p>
                <p className="text-[10px] text-slate-500">
                  {concepto.clave} · {concepto.gravable ? 'Gravable' : 'Exento'}
                </p>
              </div>
              <p className="shrink-0 text-xs tabular-nums text-slate-200">
                {moneda(concepto.importe)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{etiqueta}</p>
      <p className="text-sm text-slate-200">{valor}</p>
    </div>
  );
}

function BotonPdf({ reciboId, numeroEmpleado }: { reciboId: string; numeroEmpleado: string }) {
  const descarga = useAccion(() => descargarMiReciboPdf(reciboId, numeroEmpleado), {
    invalidarAlCompletar: false,
  });

  async function descargar() {
    descarga.limpiarError();
    try {
      await descarga.ejecutar();
    } catch {
      // El error de la mutación se muestra bajo el botón.
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton
        cargando={descarga.ejecutando}
        onClick={() => void descargar()}
        iconoIzquierda={<Icono nombre="descargar" className="size-4" />}
      >
        Descargar PDF
      </Boton>
      {descarga.error ? <span className="text-[11px] text-rose-300">{descarga.error}</span> : null}
    </div>
  );
}
