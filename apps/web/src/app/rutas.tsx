import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaPermitida, RutaProtegida } from '@/shared/componentes/RutaProtegida';
import { NoEncontradaPage } from '@/shared/componentes/NoEncontradaPage';
import { AppShell } from '@/shell/AppShell';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { TableroPage } from '@/features/dashboard/pages/TableroPage';
import { EmpleadosPage } from '@/features/empleados/pages/EmpleadosPage';
import { NominaPage } from '@/features/nomina/pages/NominaPage';
import { ProduccionPage } from '@/features/produccion/pages/ProduccionPage';
import { AdministracionPage } from '@/features/administracion/pages/AdministracionPage';

export function RutasApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RutaProtegida />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/tablero" replace />} />
          <Route path="tablero" element={<TableroPage />} />

          <Route element={<RutaPermitida roles={['ADMIN', 'RH']} />}>
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
