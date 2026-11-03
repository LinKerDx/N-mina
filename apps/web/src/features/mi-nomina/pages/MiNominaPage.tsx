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
import { useState } from 'react';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import {
  descargarMiReciboPdf,
  miPerfil,
  miRecibo,
  miResumen,
  misRecibos,
} from '@/features/mi-nomina/api';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { mensajeDeError } from '@/shared/lib/errores';
import { Icono } from '@/shell/iconos';

export function MiNominaPage() {
  const { usuario } = useSesion();
  const [reciboAbierto, setReciboAbierto] = useState<MiRecibo | null>(null);

  const perfil = useConsulta((senal) => miPerfil(senal), 'mi-perfil');
  const resumen = useConsulta((senal) => miResumen(senal), 'mi-resumen');
  const recibos = useConsulta((senal) => misRecibos(senal), 'mis-recibos');

  const primerNombre = usuario?.nombreCompleto.split(' ')[0] ?? '';
  const errorGeneral = perfil.error ?? resumen.error ?? recibos.error;
  const ultimaFecha = resumen.datos?.ultimaFechaPago;

  const columnas: Array<Columna<MiRecibo>> = [
    {
      clave: 'periodo',
      encabezado: 'Periodo',
      render: (fila) => (
        <div>
          <p className="text-sm font-medium text-white">{fila.periodo?.nombre ?? 'Periodo'}</p>
          <p className="text-[11px] text-slate-500">
            {fecha(fila.periodo?.fechaInicio)} — {fecha(fila.periodo?.fechaFin)}
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
        <span className="tabular-nums text-xs text-emerald-300">{moneda(fila.totalPercepciones)}</span>
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
        <span className="tabular-nums text-sm font-semibold text-brand-300">{moneda(fila.neto)}</span>
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
          Ver desglose
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

      {errorGeneral ? <Aviso>{errorGeneral}</Aviso> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo="Último neto"
          valor={moneda(resumen.datos?.ultimoNeto ?? 0)}
          detalle={resumen.datos?.ultimoPeriodo ?? 'Aún sin recibos'}
          icono={<Icono nombre="dinero" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Percepciones acumuladas"
          valor={moneda(resumen.datos?.totalPercepciones ?? 0)}
          detalle={`${resumen.datos?.totalRecibos ?? 0} recibos`}
          acento="cielo"
          icono={<Icono nombre="nomina" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Deducciones acumuladas"
          valor={moneda(resumen.datos?.totalDeducciones ?? 0)}
          detalle="ISR, IMSS y demás descuentos"
          acento="ambar"
          icono={<Icono nombre="calculadora" className="size-5" />}
          cargando={resumen.cargando}
        />
        <Kpi
          titulo="Último pago"
          valor={ultimaFecha ? fecha(ultimaFecha) : '—'}
          detalle={resumen.datos?.ultimoPeriodo ?? 'Sin periodos'}
          acento="violeta"
          icono={<Icono nombre="reloj" className="size-5" />}
          cargando={resumen.cargando}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Tarjeta>
          <EncabezadoTarjeta
            titulo="Mis recibos"
            descripcion="Selecciona un periodo para ver el desglose completo y descargar el PDF."
          />
          {recibos.cargando ? (
            <Cargador />
          ) : (
            <Tabla<MiRecibo>
              filas={recibos.datos ?? []}
              obtenerClave={(fila) => fila.id}
              columnas={columnas}
              vacio={
                <EstadoVacio
                  titulo="Aún no tienes recibos"
                  descripcion="Cuando Recursos Humanos calcule un periodo, tu recibo aparecerá aquí."
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
  const detalle = useConsulta(
    (senal) => miRecibo(recibo.id, senal),
    `mi-recibo:${recibo.id}`,
  );

  if (detalle.cargando) {
    return <Cargador mensaje="Cargando el desglose…" />;
  }

  if (detalle.error || !detalle.datos) {
    return <Aviso>{detalle.error ?? 'No se pudo cargar el recibo'}</Aviso>;
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
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setDescargando(true);
    setError(null);
    try {
      await descargarMiReciboPdf(reciboId, numeroEmpleado);
    } catch (excepcion) {
      setError(mensajeDeError(excepcion));
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton
        cargando={descargando}
        onClick={() => void descargar()}
        iconoIzquierda={<Icono nombre="descargar" className="size-4" />}
      >
        Descargar PDF
      </Boton>
      {error ? <span className="text-[11px] text-rose-300">{error}</span> : null}
    </div>
  );
}
