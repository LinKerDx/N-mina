import { moneda, type PeriodoNomina, type TipoAjusteNomina } from '@nomina360/core';
import { Boton, Campo, Cargador, EstadoVacio, Selector } from '@nomina360/ui';
import { useState, type FormEvent } from 'react';
import { empleadosActivos } from '@/features/empleados/api';
import { Aviso } from '@/shared/componentes/EncabezadoPagina';
import {
  crearAjusteNomina,
  eliminarAjusteNomina,
  listarAjustesNomina,
} from '@/features/nomina/api';
import { useAccion } from '@/shared/hooks/useAccion';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';

export function AjustesPeriodo({ periodo }: { periodo: PeriodoNomina }) {
  const [empleadoId, setEmpleadoId] = useState('');
  const [tipo, setTipo] = useState<TipoAjusteNomina>('PERCEPCION');
  const [descripcion, setDescripcion] = useState('');
  const [importe, setImporte] = useState('');
  const [gravable, setGravable] = useState(true);
  const ajustes = useConsulta(
    (senal) => listarAjustesNomina(periodo.id, senal),
    `ajustes-nomina:${periodo.id}`,
  );
  const empleados = useConsulta((senal) => empleadosActivos(senal), 'empleados-activos');
  const crear = useAccion((datos: Parameters<typeof crearAjusteNomina>[1]) =>
    crearAjusteNomina(periodo.id, datos),
  );
  const eliminar = useAccion(eliminarAjusteNomina);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const seleccionado = empleados.datos?.find((empleado) => empleado.id === empleadoId);
    const monto = Number(importe);
    if (!seleccionado || !descripcion.trim() || !Number.isFinite(monto) || monto <= 0) return;

    crear.limpiarError();
    try {
      await crear.ejecutar({
        empleadoId,
        tipo,
        descripcion: descripcion.trim(),
        importe: monto,
        gravable: tipo === 'PERCEPCION' && gravable,
      });
      setDescripcion('');
      setImporte('');
      setGravable(true);
      ajustes.recargar();
    } catch {
      // El error de guardado se muestra en el formulario.
    }
  }

  async function quitar(id: string) {
    eliminar.limpiarError();
    try {
      await eliminar.ejecutar(id);
      ajustes.recargar();
    } catch {
      // El error se muestra encima de la lista.
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white">Agregar concepto</h3>
        <p className="mt-1 text-xs text-slate-500">
          Los cambios se incluirán cuando se calcule este periodo.
        </p>
        <form className="mt-4 space-y-3" onSubmit={guardar}>
          {empleados.cargando ? (
            <Cargador mensaje="Cargando empleados…" />
          ) : empleados.error ? (
            <ErrorCarga
              mensaje={empleados.error}
              onReintentar={empleados.recargar}
              recurso="los empleados"
            />
          ) : (
            <>
              {crear.error ? <Aviso>{crear.error}</Aviso> : null}
              <Selector
                etiqueta="Empleado"
                name="empleadoId"
                required
                value={empleadoId}
                onChange={(evento) => setEmpleadoId(evento.target.value)}
              >
                <option value="">Selecciona un empleado</option>
                {(empleados.datos ?? []).map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombreCompleto} · {empleado.numeroEmpleado}
                  </option>
                ))}
              </Selector>
              <div className="grid gap-3 sm:grid-cols-2">
                <Selector
                  etiqueta="Tipo de concepto"
                  name="tipo"
                  value={tipo}
                  onChange={(evento) => setTipo(evento.target.value as TipoAjusteNomina)}
                >
                  <option value="PERCEPCION">Bonificación / percepción</option>
                  <option value="DEDUCCION">Cargo / deducción</option>
                </Selector>
                <Campo
                  etiqueta="Importe (MXN)"
                  name="importe"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={importe}
                  onChange={(evento) => setImporte(evento.target.value)}
                />
              </div>
              <Campo
                etiqueta="Concepto"
                name="descripcion"
                maxLength={120}
                required
                placeholder="Ej. Bono de puntualidad o descuento de préstamo"
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
              />
              {tipo === 'PERCEPCION' ? (
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={gravable}
                    onChange={(evento) => setGravable(evento.target.checked)}
                    className="size-4 rounded border-white/20 bg-ink-900 accent-brand-400"
                  />
                  Incluir en la base gravable para ISR
                </label>
              ) : null}
              <div className="flex justify-end">
                <Boton
                  type="submit"
                  cargando={crear.ejecutando}
                  disabled={!empleadoId || !descripcion.trim() || Number(importe) <= 0}
                >
                  Agregar concepto
                </Boton>
              </div>
            </>
          )}
        </form>
      </div>

      <section aria-labelledby="lista-ajustes-titulo">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 id="lista-ajustes-titulo" className="text-sm font-semibold text-white">
            Conceptos agregados
          </h3>
          <span className="text-xs text-slate-500">{ajustes.datos?.length ?? 0}</span>
        </div>
        {eliminar.error ? <Aviso>{eliminar.error}</Aviso> : null}
        {ajustes.cargando ? (
          <Cargador mensaje="Cargando conceptos…" />
        ) : ajustes.error ? (
          <ErrorCarga
            mensaje={ajustes.error}
            onReintentar={ajustes.recargar}
            recurso="los conceptos del periodo"
          />
        ) : (ajustes.datos?.length ?? 0) === 0 ? (
          <EstadoVacio
            titulo="Aún no hay conceptos manuales"
            descripcion="Agrega una percepción o deducción para un empleado de este periodo."
          />
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {ajustes.datos?.map((ajuste) => (
              <li
                key={ajuste.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{ajuste.descripcion}</p>
                  <p className="text-xs text-slate-500">
                    {ajuste.empleadoNombre} ·{' '}
                    {ajuste.tipo === 'PERCEPCION' ? 'Percepción' : 'Deducción'}
                    {ajuste.gravable ? ' · Gravable' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold tabular-nums ${ajuste.tipo === 'PERCEPCION' ? 'text-emerald-300' : 'text-amber-300'}`}
                  >
                    {ajuste.tipo === 'DEDUCCION' ? '−' : '+'}
                    {moneda(ajuste.importe)}
                  </span>
                  <Boton
                    tamano="sm"
                    variante="fantasma"
                    disabled={eliminar.ejecutando}
                    onClick={() => void quitar(ajuste.id)}
                    aria-label={`Quitar ${ajuste.descripcion} de ${ajuste.empleadoNombre}`}
                  >
                    Quitar
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
