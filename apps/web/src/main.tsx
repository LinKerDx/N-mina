import { configurarApi } from '@nomina360/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { ProveedorSesion } from '@/features/auth/contexto/SesionContexto';
import { API_URL } from '@/shared/config/entorno';
import '@/index.css';

configurarApi({ baseUrl: API_URL });

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontro el elemento #root');
}

createRoot(contenedor).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
);
