import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaPermitida, RutaProtegida } from '@/shared/componentes/RutaProtegida';
import { NoEncontradaPage } from '@/shared/componentes/NoEncontradaPage';
import { rutaInicio } from '@/shared/lib/navegacion';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { AppShell } from '@/shell/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { TableroPage } from '@/features/dashboard/pages/TableroPage';
import { EmpleadosPage } from '@/features/empleados/pages/EmpleadosPage';
import { NominaPage } from '@/features/nomina/pages/NominaPage';
import { ProduccionPage } from '@/features/produccion/pages/ProduccionPage';
import { AdministracionPage } from '@/features/administracion/pages/AdministracionPage';
import { MiNominaPage } from '@/features/mi-nomina/pages/MiNominaPage';
import { AsistenciaPage } from '@/features/produccion/pages/AsistenciaPage';
import { ChatPage } from '@/features/chat/ChatPage';

function InicioRedirect() {
  const { usuario } = useSesion();
  return <Navigate to={rutaInicio(usuario?.rol)} replace />;
}

export function RutasApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RutaProtegida />}>
        <Route element={<AppShell />}>
          <Route index element={<InicioRedirect />} />
          <Route path="asistencia" element={<AsistenciaPage />} />
          <Route path="chat" element={<ChatPage />} />

          <Route
            element={<RutaPermitida roles={['ADMIN', 'RH', 'PRODUCCION', 'ADMINISTRACION']} />}
          >
            <Route path="tablero" element={<TableroPage />} />
          </Route>

          <Route element={<RutaPermitida roles={['EMPLEADO']} />}>
            <Route path="mi-nomina" element={<MiNominaPage />} />
          </Route>

          <Route element={<RutaPermitida roles={['ADMIN', 'RH', 'ADMINISTRACION']} />}>
            <Route path="nomina" element={<NominaPage />} />
            <Route path="empleados" element={<EmpleadosPage />} />
          </Route>

          <Route element={<RutaPermitida roles={['ADMIN', 'PRODUCCION']} />}>
            <Route path="produccion" element={<ProduccionPage />} />
          </Route>

          <Route element={<RutaPermitida roles={['ADMIN', 'ADMINISTRACION']} />}>
            <Route path="administracion" element={<AdministracionPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NoEncontradaPage />} />
    </Routes>
  );
}
