import { configurarApi } from '@nomina360/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/app/App';
import { ProveedorSesion } from '@/features/auth/contexto/SesionContexto';
import { API_URL } from '@/shared/config/entorno';
import { queryClient } from '@/shared/lib/queryClient';
import '@/index.css';

configurarApi({ baseUrl: API_URL });

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontro el elemento #root');
}

createRoot(contenedor).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ProveedorSesion>
          <App />
        </ProveedorSesion>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
