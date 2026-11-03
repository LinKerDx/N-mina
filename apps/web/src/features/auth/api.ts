import {
  peticion,
  refreshTokenActual,
  type DatosLogin,
  type Sesion,
  type Usuario,
} from '@nomina360/core';

export async function iniciarSesion(datos: DatosLogin): Promise<Sesion> {
  return peticion<Sesion>('/api/auth/login', {
    metodo: 'POST',
    cuerpo: datos,
    requiereAuth: false,
  });
}

export async function refrescarSesion(): Promise<Sesion> {
  const refreshToken = refreshTokenActual();
  return peticion<Sesion>('/api/auth/refresh', {
    metodo: 'POST',
    cuerpo: { refreshToken },
    requiereAuth: false,
  });
}

export async function cerrarSesionRemota(): Promise<void> {
  const refreshToken = refreshTokenActual();
  if (!refreshToken) {
    return;
  }
  await peticion<void>('/api/auth/logout', {
    metodo: 'POST',
    cuerpo: { refreshToken },
  });
}

export async function obtenerPerfil(): Promise<Usuario> {
  return peticion<Usuario>('/api/auth/me');
}
