import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProveedorSesion } from '@/features/auth/contexto/SesionContexto';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { queryClient } from '@/shared/lib/queryClient';

function renderizarLogin() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProveedorSesion>
          <LoginPage />
        </ProveedorSesion>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('renderiza el formulario de acceso', () => {
    renderizarLogin();

    expect(screen.getByRole('heading', { name: /inicia sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar a nómina360/i })).toBeInTheDocument();
  });

  it('ofrece cuentas de demostración sin exponer datos reales', () => {
    renderizarLogin();

    expect(screen.queryByText(/rh@nomina360\.mx/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ver cuentas de demostración/i)).toBeInTheDocument();
  });
});
