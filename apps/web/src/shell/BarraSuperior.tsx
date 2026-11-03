import { iniciales, tituloRol } from '@nomina360/core';
import { Insignia } from '@nomina360/ui';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { Icono } from '@/shell/iconos';

const FECHA = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function BarraSuperior({
  titulo,
  onAbrirMenu,
}: {
  titulo: string;
  onAbrirMenu: () => void;
}) {
  const { usuario } = useSesion();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-950/85 px-4 backdrop-blur-xl lg:px-8">
      <button
        type="button"
        onClick={onAbrirMenu}
        className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden"
        aria-label="Abrir menú"
      >
        <Icono nombre="menu" className="size-4" />
      </button>

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Nómina360</p>
        <h1 className="truncate text-sm font-semibold text-white">{titulo}</h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-xs capitalize text-slate-500 md:block">
          {FECHA.format(new Date())}
        </span>
        <Insignia tono="exito" className="hidden sm:inline-flex">
          En línea
        </Insignia>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-acento/70 to-brand-500/70 text-[10px] font-semibold text-white">
            {iniciales(usuario?.nombreCompleto ?? 'NN')}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[11px] font-medium text-white">{usuario?.nombreCompleto}</span>
            <span className="block text-[10px] text-slate-500">
              {usuario ? tituloRol(usuario.rol) : ''}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
