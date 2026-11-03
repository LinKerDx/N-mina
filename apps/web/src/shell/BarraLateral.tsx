import { iniciales, tituloRol } from '@nomina360/core';
import { cn } from '@nomina360/ui';
import { NavLink } from 'react-router-dom';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { Icono } from '@/shell/iconos';
import { itemsParaRol } from '@/shell/navegacion';

export function BarraLateral({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const { usuario, cerrar } = useSesion();
  const items = itemsParaRol(usuario?.rol);

  return (
    <>
      {abierta ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onCerrar}
          className="fixed inset-0 z-30 bg-ink-950/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-ink-900/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          abierta ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-950">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
              <path
                d="M4 18V7.5c0-.9 1.1-1.4 1.8-.8L12 12l6.2-5.3c.7-.6 1.8-.1 1.8.8V18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Nómina360</p>
            <p className="truncate text-[11px] text-slate-500">Control de nóminas</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <Icono nombre="cerrar" className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Navegación principal">
          {items.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              onClick={onCerrar}
              className={({ isActive }) =>
                cn(
                  'group flex items-start gap-3 rounded-xl px-3 py-2.5 transition',
                  isActive
                    ? 'bg-brand-500/10 text-white ring-1 ring-brand-400/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icono
                    nombre={item.icono}
                    className={cn('mt-0.5 size-[18px]', isActive ? 'text-brand-300' : 'text-slate-500')}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.etiqueta}</span>
                    <span className="block truncate text-[11px] text-slate-500">{item.descripcion}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-acento/70 to-brand-500/70 text-xs font-semibold text-white">
              {iniciales(usuario?.nombreCompleto ?? 'NN')}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{usuario?.nombreCompleto}</p>
              <p className="truncate text-[11px] text-slate-500">
                {usuario ? tituloRol(usuario.rol) : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void cerrar()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200"
          >
            <Icono nombre="salir" className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
