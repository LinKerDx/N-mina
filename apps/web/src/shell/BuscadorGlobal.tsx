import { useEffect, useState } from 'react';
import { Treadmill } from 'ldrs/react';
import 'ldrs/react/Treadmill.css';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { buscarEmpleados } from '@/features/empleados/api';
import { listarPeriodos } from '@/features/nomina/api';
import { catalogoCentrosCosto, listarPagos } from '@/features/administracion/api';
import { catalogoCentros, listarRegistros } from '@/features/produccion/api';
import { misRecibos } from '@/features/mi-nomina/api';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { Icono } from '@/shell/iconos';
import { Modal } from '@nomina360/ui';

export function BuscadorGlobal() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [termino, setTermino] = useState('');
  const puedeVerEmpleados = usuario?.rol === 'ADMIN' || usuario?.rol === 'RH';
  const puedeVerPeriodos = puedeVerEmpleados;
  const esProduccion = usuario?.rol === 'ADMIN' || usuario?.rol === 'PRODUCCION';
  const esAdministracion = usuario?.rol === 'ADMIN' || usuario?.rol === 'ADMINISTRACION';
  const esEmpleado = usuario?.rol === 'EMPLEADO';
  useEffect(() => {
    const temporizador = window.setTimeout(() => setTermino(consulta.trim()), 250);
    return () => window.clearTimeout(temporizador);
  }, [consulta]);

  const habilitar = abierto && termino.length >= 2;
  const empleados = useConsulta(
    (senal) => buscarEmpleados({ q: termino, size: 5 }, senal),
    `busqueda-empleados:${termino}`,
    habilitar && puedeVerEmpleados,
  );
  const periodos = useConsulta(
    (senal) => listarPeriodos(0, 40, senal),
    'busqueda-periodos',
    habilitar && puedeVerPeriodos,
  );
  const centrosTrabajo = useConsulta(
    (senal) => catalogoCentros(senal),
    'busqueda-centros-trabajo',
    habilitar && esProduccion,
  );
  const registros = useConsulta(
    (senal) => listarRegistros({}, senal),
    'busqueda-registros',
    habilitar && esProduccion,
  );
  const centrosCosto = useConsulta(
    (senal) => catalogoCentrosCosto(senal),
    'busqueda-centros-costo',
    habilitar && esAdministracion,
  );
  const pagos = useConsulta(
    (senal) => listarPagos(undefined, undefined, senal),
    'busqueda-pagos',
    habilitar && esAdministracion,
  );
  const recibos = useConsulta(
    (senal) => misRecibos(senal),
    'busqueda-mis-recibos',
    habilitar && esEmpleado,
  );
  const resultadosPeriodo = (periodos.datos?.contenido ?? [])
    .filter((periodo) =>
      periodo.nombre.toLocaleLowerCase('es-MX').includes(termino.toLocaleLowerCase('es-MX')),
    )
    .slice(0, 5);
  const normalizar = (texto: string) => texto.toLocaleLowerCase('es-MX');
  const resultadosCentros = [
    ...(centrosTrabajo.datos ?? []).map((centro) => ({
      id: centro.id,
      nombre: centro.nombre,
      tipo: 'Trabajo',
    })),
    ...(centrosCosto.datos ?? []).map((centro) => ({
      id: centro.id,
      nombre: centro.nombre,
      tipo: 'Costo',
    })),
  ]
    .filter((centro) => normalizar(centro.nombre).includes(normalizar(termino)))
    .slice(0, 5);
  const resultadosRegistros = (registros.datos ?? [])
    .filter((registro) => normalizar(registro.empleadoNombre).includes(normalizar(termino)))
    .slice(0, 5);
  const resultadosPagos = (pagos.datos ?? [])
    .filter((pago) => normalizar(pago.folio).includes(normalizar(termino)))
    .slice(0, 5);
  const resultadosRecibos = (recibos.datos ?? [])
    .filter((recibo) => normalizar(recibo.periodo?.nombre ?? '').includes(normalizar(termino)))
    .slice(0, 5);
  const consultasActivas = [
    ...(puedeVerEmpleados ? [empleados, periodos] : []),
    ...(esProduccion ? [centrosTrabajo, registros] : []),
    ...(esAdministracion ? [centrosCosto, pagos] : []),
    ...(esEmpleado ? [recibos] : []),
  ];
  const buscando = habilitar && consultasActivas.some((consulta) => consulta.cargando);
  const errorBusqueda = consultasActivas.find((consulta) => consulta.error)?.error;
  const hayResultados = Boolean(
    empleados.datos?.contenido.length ||
    resultadosPeriodo.length ||
    resultadosCentros.length ||
    resultadosRegistros.length ||
    resultadosPagos.length ||
    resultadosRecibos.length,
  );
  const sinResultados = habilitar && !buscando && !errorBusqueda && !hayResultados;

  useEffect(() => {
    const atajo = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault();
        setAbierto((valor) => !valor);
      } else if (evento.key === 'Escape') {
        setAbierto(false);
      }
    };
    window.addEventListener('keydown', atajo);
    return () => window.removeEventListener('keydown', atajo);
  }, []);

  function ir(ruta: string) {
    setAbierto(false);
    navegar(ruta);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-label="Abrir búsqueda global"
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-xs text-slate-400 hover:bg-white/[0.07] hover:text-white sm:px-3"
      >
        <Icono nombre="buscar" className="size-4" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500 md:inline">
          Ctrl K
        </kbd>
      </button>
      {abierto ? (
        <Modal
          abierto={abierto}
          onCerrar={() => setAbierto(false)}
          titulo="Buscar en Nómina360"
          descripcion="Encuentra la información de tu área. Los resultados respetan los permisos de tu cuenta."
          ancho="lg"
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-ink-900/60">
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Icono nombre="buscar" className="size-4 text-slate-500" />
              <input
                autoFocus
                value={consulta}
                onChange={(evento) => setConsulta(evento.target.value)}
                placeholder="Buscar en Nómina360…"
                className="w-full bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-500"
                aria-label="Buscar en Nómina360"
              />
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar búsqueda"
                className="text-xs text-slate-500 hover:text-white"
              >
                Esc
              </button>
            </div>
            {termino.length < 2 ? (
              <p className="px-4 py-5 text-xs text-slate-500">
                Escribe al menos dos caracteres para buscar.
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {buscando ? (
                  <div
                    className="flex items-center justify-center gap-3 px-2 py-5 text-xs text-slate-400"
                    role="status"
                    aria-live="polite"
                  >
                    <Treadmill size="36" speed="1.25" color="#6ee7b7" />
                    <span>Buscando…</span>
                  </div>
                ) : null}
                {puedeVerEmpleados ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Empleados
                    </p>
                    {(empleados.datos?.contenido ?? []).map((empleado) => (
                      <button
                        key={empleado.id}
                        onClick={() => ir(`/empleados?q=${encodeURIComponent(termino)}`)}
                        className="block w-full rounded-lg px-2 py-2 text-left hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">{empleado.nombreCompleto}</span>
                        <span className="text-[11px] text-slate-500">
                          {empleado.numeroEmpleado} · {empleado.puestoNombre ?? 'Empleado'}
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                {puedeVerPeriodos ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Periodos
                    </p>
                    {resultadosPeriodo.map((periodo) => (
                      <Link
                        key={periodo.id}
                        to={`/nomina?buscar=${encodeURIComponent(termino)}`}
                        onClick={() => setAbierto(false)}
                        className="block rounded-lg px-2 py-2 hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">{periodo.nombre}</span>
                        <span className="text-[11px] text-slate-500">
                          {periodo.estatus} · {periodo.fechaInicio} – {periodo.fechaFin}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : null}
                {esProduccion || esAdministracion ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Centros de costo y trabajo
                    </p>
                    {resultadosCentros.map((centro) => (
                      <button
                        key={`${centro.tipo}-${centro.id}`}
                        onClick={() =>
                          ir(centro.tipo === 'Trabajo' ? '/produccion' : '/administracion')
                        }
                        className="block w-full rounded-lg px-2 py-2 text-left hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">{centro.nombre}</span>
                        <span className="text-[11px] text-slate-500">
                          Centro de {centro.tipo.toLowerCase()}
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                {esProduccion && resultadosRegistros.length ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Registros recientes
                    </p>
                    {resultadosRegistros.map((registro) => (
                      <button
                        key={registro.id}
                        onClick={() => ir('/produccion')}
                        className="block w-full rounded-lg px-2 py-2 text-left hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">{registro.empleadoNombre}</span>
                        <span className="text-[11px] text-slate-500">
                          {registro.fecha} · {registro.estatus}
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                {esAdministracion && resultadosPagos.length ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Pagos
                    </p>
                    {resultadosPagos.map((pago) => (
                      <button
                        key={pago.id}
                        onClick={() => ir('/administracion')}
                        className="block w-full rounded-lg px-2 py-2 text-left hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">{pago.folio}</span>
                        <span className="text-[11px] text-slate-500">
                          {pago.tipo} · {pago.fechaPago}
                        </span>
                      </button>
                    ))}
                  </>
                ) : null}
                {esEmpleado ? (
                  <>
                    <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Mis recibos
                    </p>
                    {resultadosRecibos.map((recibo) => (
                      <Link
                        key={recibo.id}
                        to="/mi-nomina"
                        onClick={() => setAbierto(false)}
                        className="block rounded-lg px-2 py-2 hover:bg-white/5"
                      >
                        <span className="block text-sm text-white">
                          {recibo.periodo?.nombre ?? 'Recibo'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {recibo.estatus} ·{' '}
                          {recibo.neto.toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          })}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : null}
                {errorBusqueda ? (
                  <p
                    className="m-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-200"
                    role="alert"
                  >
                    Algunos resultados no se pudieron cargar. {errorBusqueda}
                  </p>
                ) : null}
                {sinResultados ? (
                  <p className="px-3 py-5 text-center text-sm text-slate-400" role="status">
                    No encontramos coincidencias. Prueba con otro nombre, folio o periodo.
                  </p>
                ) : null}
              </div>
            )}
            <div className="border-t border-white/10 px-4 py-2 text-[10px] text-slate-500">
              Búsqueda limitada a la información que tu rol puede consultar.
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
