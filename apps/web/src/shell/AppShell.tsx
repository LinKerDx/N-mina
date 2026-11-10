import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarraLateral } from '@/shell/BarraLateral';
import { BarraSuperior } from '@/shell/BarraSuperior';
import { tituloDeRuta } from '@/shell/navegacion';

export function AppShell() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const menuBotonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const titulo = tituloDeRuta(pathname);
    document.title = `${titulo} | Nómina360`;
    setMenuAbierto(false);
    requestAnimationFrame(() => document.getElementById('contenido-principal')?.focus());
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) return;
    document.querySelector<HTMLElement>('#navegacion-principal a')?.focus();
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        menuBotonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', cerrarConEscape);
    return () => document.removeEventListener('keydown', cerrarConEscape);
  }, [menuAbierto]);

  const abrirMenu = useCallback(() => setMenuAbierto(true), []);
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);

  return (
    <div className="flex min-h-screen bg-ink-950">
      <a
        href="#contenido-principal"
        className="sr-only z-[100] rounded-lg bg-brand-400 px-4 py-2 font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <BarraLateral abierta={menuAbierto} onCerrar={cerrarMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior
          titulo={tituloDeRuta(pathname)}
          onAbrirMenu={abrirMenu}
          menuAbierto={menuAbierto}
          menuBotonRef={menuBotonRef}
        />
        <main
          id="contenido-principal"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none lg:px-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
