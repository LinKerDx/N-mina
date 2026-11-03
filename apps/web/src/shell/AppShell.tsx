import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarraLateral } from '@/shell/BarraLateral';
import { BarraSuperior } from '@/shell/BarraSuperior';
import { tituloDeRuta } from '@/shell/navegacion';

export function AppShell() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-ink-950">
      <BarraLateral abierta={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior titulo={tituloDeRuta(pathname)} onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
