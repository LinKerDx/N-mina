import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Boton, Campo, Cargador, EstadoVacio, Modal, Tarjeta } from '@nomina360/ui';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import {
  crearEventoCalendario,
  listarEventosCalendario,
  listarMisMarcaciones,
} from '@/features/produccion/api';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';
import { EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { ErrorApi, fecha } from '@nomina360/core';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fechaUtcDesdeLocal = (valor: string, fin = false) => {
  const [year, month, day] = valor.split('-').map(Number);
  const fechaLocal = new Date(year, month - 1, day + (fin ? 1 : 0));
  if (fin) fechaLocal.setMilliseconds(fechaLocal.getMilliseconds() - 1);
  return fechaLocal.toISOString();
};
const lunes = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const nombreMes = (d: Date) => d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
function lunesDeMes(year: number, month: number, ordinal: number) {
  const d = new Date(year, month, 1);
  d.setDate(1 + ((8 - d.getDay()) % 7) + (ordinal - 1) * 7);
  return iso(d);
}
function festivos(year: number) {
  return new Map([
    [`${year}-01-01`, 'Año Nuevo'],
    [lunesDeMes(year, 1, 1), 'Día de la Constitución'],
    [lunesDeMes(year, 2, 3), 'Natalicio de Benito Juárez'],
    [`${year}-05-01`, 'Día del Trabajo'],
    [`${year}-09-16`, 'Día de la Independencia'],
    [lunesDeMes(year, 10, 3), 'Día de la Revolución'],
    [`${year}-12-25`, 'Navidad'],
  ]);
}
const etiquetaTipo: Record<string, string> = {
  ENTRADA_TURNO: 'Entrada',
  SALIDA_COMIDA: 'Salida a comer',
  ENTRADA_COMIDA: 'Regreso de comida',
  SALIDA_TURNO: 'Salida de turno',
};

export function AsistenciaPage() {
  const { usuario } = useSesion();
  const [mes, setMes] = useState(() => new Date());
  const [dia, setDia] = useState(iso(new Date()));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: iso(new Date()),
    fechaFin: iso(new Date()),
  });
  const desdeDate = lunes(mes);
  const hastaDate = new Date(mes.getFullYear(), mes.getMonth() + 1, 7);
  const desde = iso(desdeDate),
    hasta = iso(hastaDate);
  const desdeUtc = fechaUtcDesdeLocal(desde),
    hastaUtc = fechaUtcDesdeLocal(hasta, true);
  const eventos = useConsulta(async (s) => {
    try {
      return (await listarEventosCalendario(desde, hasta, s)) ?? [];
    } catch (error) {
      if (error instanceof ErrorApi && error.estado >= 500) return [];
      throw error;
    }
  }, `eventos-cal:${desde}`);
  const asistencia = useConsulta(async (s) => {
    try {
      return (await listarMisMarcaciones(desdeUtc, hastaUtc, s)) ?? [];
    } catch (error) {
      if (error instanceof ErrorApi && error.estado >= 500) return [];
      throw error;
    }
  }, `asistencia-propia:${desde}`);
  const crear = useAccion(crearEventoCalendario);
  const feriados = useMemo(() => festivos(mes.getFullYear()), [mes]);
  const celdas = useMemo(() => {
    const out: Date[] = [];
    const d = new Date(desdeDate);
    while (d <= hastaDate) {
      out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, [desde, hasta]);
  const delDia = (date: string) =>
    (asistencia.datos ?? []).filter((m) => iso(new Date(m.ocurridoEn)) === date);
  const eventosDelDia = (date: string) =>
    (eventos.datos ?? []).filter((e) => e.fechaInicio <= date && e.fechaFin >= date);
  async function guardarEvento(e: FormEvent) {
    e.preventDefault();
    await crear.ejecutar(form);
    setModal(false);
    setForm({ titulo: '', descripcion: '', fechaInicio: dia, fechaFin: dia });
    eventos.recargar();
  }
  const puedeCrear = usuario?.rol === 'ADMIN' || usuario?.rol === 'RH';
  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Asistencia"
        descripcion="Consulta tus entradas y salidas, los días festivos y las actividades de la organización."
        accion={
          puedeCrear ? <Boton onClick={() => setModal(true)}>Agregar evento</Boton> : undefined
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Tarjeta>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold capitalize text-white">{nombreMes(mes)}</h2>
              <p className="text-xs text-slate-500">
                Los días festivos y eventos se muestran para toda la organización.
              </p>
            </div>
            <div className="flex gap-2">
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
              >
                Anterior
              </Boton>
              <Boton variante="secundario" tamano="sm" onClick={() => setMes(new Date())}>
                Hoy
              </Boton>
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
              >
                Siguiente
              </Boton>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((x) => (
              <div key={x} className="py-2">
                {x}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-white/10">
            {celdas.map((d) => {
              const key = iso(d);
              const fuera = d.getMonth() !== mes.getMonth();
              const holiday = feriados.get(key);
              const ev = eventosDelDia(key);
              const marcas = delDia(key);
              return (
                <button
                  key={key}
                  onClick={() => setDia(key)}
                  className={`min-h-20 border-b border-r border-white/5 p-1.5 text-left transition hover:bg-white/[0.06] sm:min-h-24 sm:p-2 ${fuera ? 'opacity-40' : ''} ${dia === key ? 'bg-brand-400/10 ring-1 ring-inset ring-brand-400/60' : ''}`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-xs ${key === iso(new Date()) ? 'bg-brand-400 font-bold text-ink-950' : 'text-slate-200'}`}
                  >
                    {d.getDate()}
                  </span>
                  {holiday && (
                    <span className="mt-1 block truncate rounded bg-amber-400/10 px-1 py-0.5 text-[9px] text-amber-200">
                      {holiday}
                    </span>
                  )}
                  {ev.slice(0, 1).map((e) => (
                    <span
                      key={e.id}
                      className="mt-1 block truncate rounded bg-violet-400/10 px-1 py-0.5 text-[9px] text-violet-200"
                    >
                      {e.titulo}
                    </span>
                  ))}
                  {!!marcas.length && (
                    <span className="mt-1 block truncate rounded bg-emerald-400/10 px-1 py-0.5 text-[9px] text-emerald-200">
                      {marcas.length} marc.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-400">
            <span>🟢 Asistencia</span>
            <span>🟡 Festivo</span>
            <span>🟣 Evento RH</span>
          </div>
        </Tarjeta>
        <Tarjeta>
          <h2 className="text-base font-semibold text-white">{fecha(dia)}</h2>
          <p className="mb-4 text-xs text-slate-500">Detalle del día seleccionado</p>
          {feriados.get(dia) && (
            <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3">
              <p className="text-xs font-semibold text-amber-200">Día festivo</p>
              <p className="text-sm text-slate-200">{feriados.get(dia)}</p>
            </div>
          )}
          {eventosDelDia(dia).map((e) => (
            <div
              key={e.id}
              className="mb-3 rounded-xl border border-violet-300/20 bg-violet-300/5 p-3"
            >
              <p className="text-xs font-semibold text-violet-200">{e.titulo}</p>
              {e.descripcion && <p className="mt-1 text-xs text-slate-300">{e.descripcion}</p>}
            </div>
          ))}
          {asistencia.cargando ? (
            <Cargador mensaje="Cargando marcaciones…" />
          ) : asistencia.error ? (
            <ErrorCarga
              mensaje={asistencia.error}
              onReintentar={asistencia.recargar}
              recurso="tus marcaciones"
            />
          ) : delDia(dia).length ? (
            <ul className="divide-y divide-white/5">
              {delDia(dia).map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-3">
                  <span className="text-sm text-slate-200">{etiquetaTipo[m.tipo] ?? m.tipo}</span>
                  <span className="text-sm tabular-nums text-brand-200">
                    {new Date(m.ocurridoEn).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoVacio
              titulo="No hay detalles de este día"
              descripcion="No se encontraron entradas ni salidas registradas para la fecha seleccionada."
            />
          )}
        </Tarjeta>
      </div>
      <Modal
        abierto={modal}
        onCerrar={() => setModal(false)}
        titulo="Nuevo evento de RH"
        descripcion="El evento aparecerá en el calendario de toda la organización."
      >
        <form className="space-y-3" onSubmit={guardarEvento}>
          <Campo
            etiqueta="Título"
            name="titulo"
            required
            maxLength={120}
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <Campo
            etiqueta="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo
              etiqueta="Desde"
              name="fechaInicio"
              type="date"
              required
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
            />
            <Campo
              etiqueta="Hasta"
              name="fechaFin"
              type="date"
              required
              min={form.fechaInicio}
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
            />
          </div>
          {crear.error && (
            <p role="alert" className="text-xs text-rose-300">
              {crear.error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Boton variante="secundario" type="button" onClick={() => setModal(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={crear.ejecutando}>
              Guardar evento
            </Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
