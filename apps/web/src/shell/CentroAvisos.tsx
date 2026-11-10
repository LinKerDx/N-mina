import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { porcentaje } from '@nomina360/core';
import { listarPresupuestos } from '@/features/administracion/api';
import { listarPeriodos } from '@/features/nomina/api';
import { listarRegistros } from '@/features/produccion/api';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { Icono } from '@/shell/iconos';
import { fechaCalendarioLocal } from '@/shared/lib/fechaCalendario';

const HOY = fechaCalendarioLocal();
const EJERCICIO = new Date().getFullYear();

export function CentroAvisos() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const rh = usuario?.rol === 'ADMIN' || usuario?.rol === 'RH';
  const produccion = usuario?.rol === 'ADMIN' || usuario?.rol === 'PRODUCCION';
  const administracion = usuario?.rol === 'ADMIN' || usuario?.rol === 'ADMINISTRACION';
  const periodos = useConsulta((senal) => listarPeriodos(0, 6, senal), 'avisos-periodos', rh);
  const registros = useConsulta(
    (senal) => listarRegistros({ fecha: HOY }, senal),
    'avisos-registros',
    produccion,
  );
  const presupuestos = useConsulta(
    (senal) => listarPresupuestos(EJERCICIO, senal),
    `avisos-presupuestos:${EJERCICIO}`,
    administracion,
  );
  const pendientesPeriodo = (periodos.datos?.contenido ?? []).filter((periodo) =>
    ['BORRADOR', 'CALCULADO'].includes(periodo.estatus),
  );
  const pendientesHoras = (registros.datos ?? []).filter(
    (registro) => registro.estatus === 'REGISTRADO',
  );
  const alertasPresupuesto = (presupuestos.datos ?? []).filter(
    (presupuesto) => presupuesto.porcentajeEjercido >= 70,
  );
  const total =
    pendientesPeriodo.length + (pendientesHoras.length ? 1 : 0) + alertasPresupuesto.length;

  function abrir(ruta: string) {
    setAbierto(false);
    navegar(ruta);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-label={`Avisos pendientes: ${total}`}
        aria-expanded={abierto}
        className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 hover:bg-white/[0.07] hover:text-white"
      >
        <Icono nombre="alerta" className="size-4" />
        {total > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-ink-950">
            {total > 9 ? '9+' : total}
          </span>
        ) : null}
      </button>
      {abierto ? (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar avisos"
            onClick={() => setAbierto(false)}
          />
          <section
            className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-2xl"
            aria-label="Avisos pendientes"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Avisos de tu área</h2>
                <p className="text-[11px] text-slate-500">Pendientes detectados en el sistema</p>
              </div>
              <span className="text-xs text-slate-400">{total} activos</span>
            </header>
            <ul className="max-h-[60vh] divide-y divide-white/5 overflow-y-auto">
              {pendientesPeriodo.map((periodo) => (
                <li key={periodo.id}>
                  <button
                    onClick={() => abrir('/nomina')}
                    className="w-full px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span className="block text-xs font-medium text-white">{periodo.nombre}</span>
                    <span className="text-[11px] text-amber-300">
                      {periodo.estatus === 'BORRADOR'
                        ? 'Pendiente de calcular'
                        : 'Pendiente de cerrar'}
                    </span>
                  </button>
                </li>
              ))}
              {pendientesHoras.length > 0 ? (
                <li>
                  <button
                    onClick={() => abrir('/produccion')}
                    className="w-full px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span className="block text-xs font-medium text-white">
                      {pendientesHoras.length} registros de horas esperan aprobación
                    </span>
                    <span className="text-[11px] text-amber-300">Producción · Hoy</span>
                  </button>
                </li>
              ) : null}
              {alertasPresupuesto.map((presupuesto) => (
                <li key={presupuesto.id}>
                  <button
                    onClick={() => abrir('/administracion')}
                    className="w-full px-4 py-3 text-left hover:bg-white/[0.04]"
                  >
                    <span className="block text-xs font-medium text-white">
                      {presupuesto.centroCostoNombre ?? 'Centro de costo'}
                    </span>
                    <span
                      className={`text-[11px] ${presupuesto.porcentajeEjercido >= 90 ? 'text-rose-300' : 'text-amber-300'}`}
                    >
                      {porcentaje(presupuesto.porcentajeEjercido)} del presupuesto ejercido
                    </span>
                  </button>
                </li>
              ))}
              {total === 0 ? (
                <li className="px-4 py-5 text-xs text-slate-400">
                  No hay pendientes para tu área.
                </li>
              ) : null}
            </ul>
            <footer className="border-t border-white/10 px-4 py-2 text-[10px] text-slate-500">
              El estado se actualiza al volver a cargar la página.
            </footer>
          </section>
        </>
      ) : null}
    </div>
  );
}
