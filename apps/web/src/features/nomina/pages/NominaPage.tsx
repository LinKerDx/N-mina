import {
  esquemaPeriodo,
  fecha,
  fechaHora,
  moneda,
  type PeriodoNomina,
  type ReciboNomina,
  type ResultadoCalculo,
  type TipoPeriodo,
} from '@nomina360/core';
import {
  Boton,
  Campo,
  Cargador,
  EstadoVacio,
  Insignia,
  Kpi,
  MensajeError,
  Modal,
  Selector,
  Tarjeta,
  tonoPorEstatus,
} from '@nomina360/ui';
import { useState, type FormEvent, type MouseEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import {
  calcularPeriodo,
  cerrarPeriodo,
  crearPeriodo,
  descargarReciboPdf,
  listarPeriodos,
  recibosDePeriodo,
} from '@/features/nomina/api';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { mensajeDeError } from '@/shared/lib/errores';
import { Aviso, EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { Icono } from '@/shell/iconos';
import { exportarCsv } from '@/shared/lib/exportarCsv';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';
import { ContenedorRecibosMensuales } from '@/features/nomina/components/ContenedorRecibosMensuales';
import { AjustesPeriodo } from '@/features/nomina/components/AjustesPeriodo';

export function NominaPage() {
  const { usuario } = useSesion();
  const puedeGestionarNomina = usuario?.rol === 'ADMIN' || usuario?.rol === 'RH';
  const puedeAjustarNomina = puedeGestionarNomina || usuario?.rol === 'ADMINISTRACION';
  const [parametros] = useSearchParams();
  const filtroPeriodo = parametros.get('buscar')?.toLocaleLowerCase('es-MX') ?? '';
  const [modalNuevo, setModalNuevo] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [periodoRecibos, setPeriodoRecibos] = useState<PeriodoNomina | null>(null);
  const [periodoAjustes, setPeriodoAjustes] = useState<PeriodoNomina | null>(null);

  const periodos = useConsulta((senal) => listarPeriodos(0, 24, senal), 'periodos-nomina');
  const periodosFiltrados = (periodos.datos?.contenido ?? []).filter((periodo) =>
    periodo.nombre.toLocaleLowerCase('es-MX').includes(filtroPeriodo),
  );
  const calcular = useAccion(calcularPeriodo);
  const cerrar = useAccion(cerrarPeriodo);

  async function manejarCalculo(periodo: PeriodoNomina) {
    try {
      const calculo = await calcular.ejecutar(periodo.id);
      setResultado(calculo);
      periodos.recargar();
    } catch {
      // el error se muestra en el banner
    }
  }

  async function manejarCierre(periodo: PeriodoNomina) {
    try {
      await cerrar.ejecutar(periodo.id);
      periodos.recargar();
    } catch {
      // el error se muestra en el banner
    }
  }

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo={puedeGestionarNomina ? 'Nómina' : 'Ajustes de nómina'}
        descripcion={
          puedeGestionarNomina
            ? 'Crea periodos, administra conceptos y calcula percepciones y deducciones (ISR, IMSS).'
            : 'Agrega o quita conceptos adicionales en periodos que aún no se han calculado.'
        }
        accion={
          puedeGestionarNomina ? (
            <Boton
              onClick={() => setModalNuevo(true)}
              iconoIzquierda={<Icono nombre="mas" className="size-4" />}
            >
              Nuevo periodo
            </Boton>
          ) : undefined
        }
      />

      {resultado ? (
        <Aviso tono="exito">
          Se generaron <strong>{resultado.recibosGenerados}</strong> recibos para{' '}
          {resultado.nombrePeriodo}: percepciones {moneda(resultado.totalPercepciones)}, deducciones{' '}
          {moneda(resultado.totalDeducciones)} y neto {moneda(resultado.totalNeto)}.
        </Aviso>
      ) : null}
      {calcular.error ? <Aviso>{calcular.error}</Aviso> : null}
      {cerrar.error ? <Aviso>{cerrar.error}</Aviso> : null}

      {periodos.cargando ? (
        <Tarjeta>
          <Cargador />
        </Tarjeta>
      ) : periodos.error ? (
        <Tarjeta>
          <ErrorCarga
            mensaje={periodos.error}
            onReintentar={periodos.recargar}
            recurso="los periodos de nómina"
          />
        </Tarjeta>
      ) : periodosFiltrados.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            titulo={filtroPeriodo ? 'Sin periodos coincidentes' : 'Sin periodos de nómina'}
            descripcion={
              filtroPeriodo
                ? `No encontramos periodos que coincidan con “${filtroPeriodo}”.`
                : 'Crea un periodo mensual o quincenal para calcular la primera nómina.'
            }
            accion={
              puedeGestionarNomina ? (
                <Boton onClick={() => setModalNuevo(true)}>Crear periodo</Boton>
              ) : undefined
            }
          />
        </Tarjeta>
      ) : (
        <>
          <div className="flex justify-end">
            <Boton
              variante="secundario"
              disabled={!periodos.datos?.contenido.length}
              onClick={() =>
                exportarCsv(
                  'periodos-nomina.csv',
                  ['Periodo', 'Tipo', 'Inicio', 'Fin', 'Fecha de pago', 'Días', 'Estatus'],
                  periodosFiltrados.map((fila) => [
                    fila.nombre,
                    fila.tipo,
                    fila.fechaInicio,
                    fila.fechaFin,
                    fila.fechaPago,
                    fila.diasPeriodo,
                    fila.estatus,
                  ]),
                )
              }
              iconoIzquierda={<Icono nombre="descargar" className="size-4" />}
            >
              Exportar periodos
            </Boton>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {periodosFiltrados.map((periodo) => (
              <Tarjeta key={periodo.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{periodo.nombre}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {periodo.tipo} · {periodo.diasPeriodo} días
                    </p>
                  </div>
                  <Insignia tono={tonoPorEstatus(periodo.estatus)}>{periodo.estatus}</Insignia>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Inicio</dt>
                    <dd className="text-slate-200">{fecha(periodo.fechaInicio)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Fin</dt>
                    <dd className="text-slate-200">{fecha(periodo.fechaFin)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Pago</dt>
                    <dd className="text-slate-200">{fecha(periodo.fechaPago)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Calculado</dt>
                    <dd className="text-slate-200">
                      {periodo.calculadoEn ? fechaHora(periodo.calculadoEn) : 'Pendiente'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  {puedeGestionarNomina && periodo.estatus === 'BORRADOR' ? (
                    <Boton
                      tamano="sm"
                      cargando={calcular.ejecutando}
                      onClick={() => void manejarCalculo(periodo)}
                      iconoIzquierda={<Icono nombre="calculadora" className="size-4" />}
                    >
                      Calcular
                    </Boton>
                  ) : null}
                  {puedeGestionarNomina && periodo.estatus === 'CALCULADO' ? (
                    <Boton
                      tamano="sm"
                      variante="secundario"
                      cargando={cerrar.ejecutando}
                      onClick={() => void manejarCierre(periodo)}
                    >
                      Cerrar periodo
                    </Boton>
                  ) : null}
                  {puedeAjustarNomina && periodo.estatus === 'BORRADOR' ? (
                    <Boton
                      tamano="sm"
                      variante="secundario"
                      onClick={() => setPeriodoAjustes(periodo)}
                    >
                      Conceptos adicionales
                    </Boton>
                  ) : null}
                  {puedeGestionarNomina && periodo.estatus !== 'BORRADOR' ? (
                    <Boton
                      tamano="sm"
                      variante="fantasma"
                      onClick={() => setPeriodoRecibos(periodo)}
                    >
                      Ver recibos
                    </Boton>
                  ) : null}
                </div>
              </Tarjeta>
            ))}
          </div>
        </>
      )}

      <Modal
        abierto={modalNuevo}
        onCerrar={() => setModalNuevo(false)}
        titulo="Nuevo periodo de nómina"
        descripcion="El número de días se calcula automáticamente a partir de las fechas."
      >
        <FormularioPeriodo
          onCancelar={() => setModalNuevo(false)}
          onCreado={() => {
            setModalNuevo(false);
            periodos.recargar();
          }}
        />
      </Modal>

      <Modal
        abierto={periodoAjustes !== null}
        onCerrar={() => setPeriodoAjustes(null)}
        titulo={`Conceptos adicionales · ${periodoAjustes?.nombre ?? ''}`}
        descripcion="Estos conceptos se guardan por empleado y solo se pueden modificar mientras el periodo siga en borrador."
        ancho="lg"
      >
        {periodoAjustes ? <AjustesPeriodo periodo={periodoAjustes} /> : null}
      </Modal>

      <Modal
        abierto={periodoRecibos !== null}
        onCerrar={() => setPeriodoRecibos(null)}
        titulo={`Recibos · ${periodoRecibos?.nombre ?? ''}`}
        descripcion="Desglose de percepciones y deducciones por empleado."
        ancho="lg"
      >
        <ContenedorRecibosMensuales>
          {periodoRecibos ? <ListaRecibos periodoId={periodoRecibos.id} /> : null}
        </ContenedorRecibosMensuales>
      </Modal>
    </div>
  );
}

function FormularioPeriodo({
  onCancelar,
  onCreado,
}: {
  onCancelar: () => void;
  onCreado: () => void;
}) {
  const hoy = new Date();
  const fechaLocal = (fecha: Date) =>
    [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
  const inicioMes = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const finMes = fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

  const [valores, setValores] = useState({
    nombre: `Nómina ${hoy.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`,
    tipo: 'MENSUAL' as TipoPeriodo,
    fechaInicio: inicioMes,
    fechaFin: finMes,
    fechaPago: finMes,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const crear = useAccion(crearPeriodo);

  function actualizar(campo: keyof typeof valores, valor: string) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = esquemaPeriodo.safeParse(valores);
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
      await crear.ejecutar(resultado.data);
      onCreado();
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
    }
  }

  return (
    <form className="space-y-4" onSubmit={manejarEnvio} noValidate>
      <Campo
        etiqueta="Nombre del periodo"
        name="nombre"
        required
        value={valores.nombre}
        onChange={(evento) => actualizar('nombre', evento.target.value)}
        error={errores.nombre}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selector
          etiqueta="Tipo"
          name="tipo"
          required
          value={valores.tipo}
          onChange={(evento) => actualizar('tipo', evento.target.value)}
        >
          <option value="MENSUAL">Mensual</option>
          <option value="QUINCENAL">Quincenal</option>
          <option value="CATORCENAL">Catorcenal</option>
          <option value="SEMANAL">Semanal</option>
        </Selector>
        <Campo
          etiqueta="Fecha de pago"
          name="fechaPago"
          type="date"
          required
          value={valores.fechaPago}
          onChange={(evento) => actualizar('fechaPago', evento.target.value)}
          error={errores.fechaPago}
        />
        <Campo
          etiqueta="Fecha de inicio"
          name="fechaInicio"
          type="date"
          required
          value={valores.fechaInicio}
          onChange={(evento) => actualizar('fechaInicio', evento.target.value)}
          error={errores.fechaInicio}
        />
        <Campo
          etiqueta="Fecha de fin"
          name="fechaFin"
          type="date"
          required
          value={valores.fechaFin}
          onChange={(evento) => actualizar('fechaFin', evento.target.value)}
          error={errores.fechaFin}
        />
      </div>

      {errorGeneral ? <MensajeError>{errorGeneral}</MensajeError> : null}

      <div className="flex justify-end gap-3 pt-2">
        <Boton variante="secundario" type="button" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={crear.ejecutando}>
          Crear periodo
        </Boton>
      </div>
    </form>
  );
}

function ListaRecibos({ periodoId }: { periodoId: string }) {
  const recibos = useConsulta(
    (senal) => recibosDePeriodo(periodoId, senal),
    `recibos:${periodoId}`,
  );

  if (recibos.cargando) {
    return <Cargador mensaje="Cargando recibos…" />;
  }

  if (recibos.error) {
    return (
      <ErrorCarga mensaje={recibos.error} onReintentar={recibos.recargar} recurso="los recibos" />
    );
  }

  if ((recibos.datos?.length ?? 0) === 0) {
    return (
      <EstadoVacio
        titulo="Sin recibos"
        descripcion="Calcula el periodo para generar los recibos de nómina."
      />
    );
  }

  const lista = recibos.datos ?? [];
  const totalNeto = lista.reduce((total, recibo) => total + recibo.neto, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi titulo="Recibos" valor={lista.length} />
        <Kpi
          titulo="Percepciones"
          valor={moneda(lista.reduce((total, recibo) => total + recibo.totalPercepciones, 0))}
          acento="cielo"
        />
        <Kpi titulo="Neto a pagar" valor={moneda(totalNeto)} acento="violeta" />
      </div>

      <ul className="space-y-2">
        {lista.map((recibo) => (
          <ReciboItem key={recibo.id} recibo={recibo} />
        ))}
      </ul>
    </div>
  );
}

function ReciboItem({ recibo }: { recibo: ReciboNomina }) {
  const descarga = useAccion(() => descargarReciboPdf(recibo.id, recibo.numeroEmpleado), {
    invalidarAlCompletar: false,
  });

  async function descargarPdf(evento: MouseEvent<HTMLButtonElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    descarga.limpiarError();
    try {
      await descarga.ejecutar();
    } catch {
      // El error de la mutación se muestra junto al recibo.
    }
  }

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02]">
      <details className="group">
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{recibo.nombreEmpleado}</p>
            <p className="text-[11px] text-slate-500">
              {recibo.numeroEmpleado} · {recibo.diasPagados} días pagados
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Percepciones</p>
              <p className="text-xs text-slate-300">{moneda(recibo.totalPercepciones)}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Deducciones</p>
              <p className="text-xs text-slate-300">{moneda(recibo.totalDeducciones)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Neto</p>
              <p className="text-sm font-semibold text-brand-300">{moneda(recibo.neto)}</p>
            </div>
            <Boton
              variante="secundario"
              tamano="sm"
              cargando={descarga.ejecutando}
              onClick={(evento) => void descargarPdf(evento)}
              iconoIzquierda={<Icono nombre="descargar" className="size-3.5" />}
              title="Descargar recibo en PDF con datos del trabajador"
            >
              PDF
            </Boton>
            <Icono
              nombre="flecha"
              className="size-4 rotate-90 text-slate-500 transition group-open:-rotate-90"
            />
          </div>
        </summary>

        {descarga.error ? (
          <p role="alert" className="px-4 pt-3 text-xs text-rose-300">
            {descarga.error}
          </p>
        ) : null}

        <div className="border-t border-white/5 px-4 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="pb-2 text-left">Concepto</th>
                <th className="pb-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {recibo.conceptos.map((concepto) => (
                <tr
                  key={`${concepto.clave}-${concepto.descripcion}`}
                  className="border-t border-white/5"
                >
                  <td className="py-1.5 text-slate-300">
                    <span className="mr-2 text-[10px] text-slate-600">{concepto.clave}</span>
                    {concepto.descripcion}
                    {concepto.tipo === 'PERCEPCION' ? (
                      <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                        percepción
                      </span>
                    ) : (
                      <span className="ml-2 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-300">
                        deducción
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-200">
                    {moneda(concepto.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </li>
  );
}
