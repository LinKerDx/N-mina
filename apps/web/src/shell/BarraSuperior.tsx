import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useSesionStore, type Disponibilidad } from '@/features/auth/contexto/SesionContexto';
import { Icono } from '@/shell/iconos';
import { BuscadorGlobal } from '@/shell/BuscadorGlobal';
import { CentroAvisos } from '@/shell/CentroAvisos';

const FECHA = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const ESTADOS_DISPONIBILIDAD: Record<Disponibilidad, { etiqueta: string; color: string }> = {
  EN_LINEA: { etiqueta: 'En línea', color: 'bg-emerald-400' },
  AUSENTE: { etiqueta: 'Ausente', color: 'bg-amber-400' },
  NO_MOLESTAR: { etiqueta: 'No molestar', color: 'bg-rose-400' },
};

export function BarraSuperior({
  titulo,
  onAbrirMenu,
  menuAbierto,
  menuBotonRef,
}: {
  titulo: string;
  onAbrirMenu: () => void;
  menuAbierto: boolean;
  menuBotonRef: RefObject<HTMLButtonElement | null>;
}) {
  const disponibilidad = useSesionStore((estado) => estado.disponibilidad);
  const establecerDisponibilidad = useSesionStore((estado) => estado.establecerDisponibilidad);
  const [menuDisponibilidad, setMenuDisponibilidad] = useState(false);
  const disponibilidadBotonRef = useRef<HTMLButtonElement>(null);
  const estadoActual = ESTADOS_DISPONIBILIDAD[disponibilidad];

  useEffect(() => {
    if (!menuDisponibilidad) return;
    document.querySelector<HTMLElement>('#menu-disponibilidad [role="menuitemradio"]')?.focus();
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setMenuDisponibilidad(false);
        disponibilidadBotonRef.current?.focus();
      } else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
        const opciones = Array.from(
          document.querySelectorAll<HTMLElement>('#menu-disponibilidad [role="menuitemradio"]'),
        );
        const indiceActual = opciones.indexOf(document.activeElement as HTMLElement);
        const desplazamiento = evento.key === 'ArrowDown' ? 1 : -1;
        const indiceSiguiente = (indiceActual + desplazamiento + opciones.length) % opciones.length;
        evento.preventDefault();
        opciones[indiceSiguiente]?.focus();
      } else if (evento.key === 'Home' || evento.key === 'End') {
        const opciones = document.querySelectorAll<HTMLElement>(
          '#menu-disponibilidad [role="menuitemradio"]',
        );
        evento.preventDefault();
        opciones[evento.key === 'Home' ? 0 : opciones.length - 1]?.focus();
      }
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [menuDisponibilidad]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-white/10 bg-ink-950/85 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 lg:px-8">
      <button
        ref={menuBotonRef}
        type="button"
        onClick={onAbrirMenu}
        aria-expanded={menuAbierto}
        aria-controls="navegacion-principal"
        className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
      >
        <Icono nombre="menu" className="size-4" />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nómina360</p>
        <h1 className="truncate text-sm font-semibold text-white">{titulo}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <BuscadorGlobal />
        <CentroAvisos />
        <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 sm:gap-3 sm:px-2">
          <span className="hidden whitespace-nowrap px-1 text-center text-xs capitalize text-slate-500 lg:block">
            {FECHA.format(new Date())}
          </span>
          <div className="relative">
            <button
              ref={disponibilidadBotonRef}
              type="button"
              onClick={() => setMenuDisponibilidad((abierto) => !abierto)}
              aria-expanded={menuDisponibilidad}
              aria-controls="menu-disponibilidad"
              aria-haspopup="menu"
              aria-label={`Disponibilidad: ${estadoActual.etiqueta}`}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.07] sm:px-3"
            >
              <span className={`size-2 rounded-full ${estadoActual.color}`} />
              <span className="hidden text-center sm:inline">{estadoActual.etiqueta}</span>
            </button>
            {menuDisponibilidad ? (
              <>
                <button
                  className="fixed inset-0 z-30 cursor-default"
                  aria-label="Cerrar selector de disponibilidad"
                  onClick={() => {
                    setMenuDisponibilidad(false);
                    disponibilidadBotonRef.current?.focus();
                  }}
                />
                <div
                  id="menu-disponibilidad"
                  className="absolute right-0 top-12 z-40 w-48 rounded-xl border border-white/10 bg-ink-900 p-1.5 shadow-xl"
                  role="menu"
                  aria-label="Cambiar disponibilidad"
                >
                  {(Object.keys(ESTADOS_DISPONIBILIDAD) as Disponibilidad[]).map((clave) => {
                    const estado = ESTADOS_DISPONIBILIDAD[clave];
                    return (
                      <button
                        key={clave}
                        type="button"
                        role="menuitemradio"
                        aria-checked={disponibilidad === clave}
                        onClick={() => {
                          establecerDisponibilidad(clave);
                          setMenuDisponibilidad(false);
                          disponibilidadBotonRef.current?.focus();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06]"
                      >
                        <span className={`size-2 rounded-full ${estado.color}`} />
                        {estado.etiqueta}
                        {disponibilidad === clave ? (
                          <span className="ml-auto text-brand-300">✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
