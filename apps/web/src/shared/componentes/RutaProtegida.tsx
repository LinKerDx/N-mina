import type { Rol } from '@nomina360/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { rutaInicio } from '@/shared/lib/navegacion';
import { Cargador } from '@nomina360/ui';

export function RutaProtegida() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950">
        <Cargador mensaje="Restaurando sesión…" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  }

  return <Outlet />;
}

export function RutaPermitida({ roles }: { roles: Rol[] }) {
  const { usuario } = useSesion();

  if (usuario && !roles.includes(usuario.rol)) {
    return <Navigate to={rutaInicio(usuario.rol)} replace />;
  }

  return <Outlet />;
}
