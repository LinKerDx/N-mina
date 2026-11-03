import type { ErrorApiCuerpo, Sesion } from './tipos';

const CLAVE_ACCESS = 'nomina360.access';
const CLAVE_REFRESH = 'nomina360.refresh';

let baseUrl = '';
let alExpirarSesion: (() => void) | null = null;

/**
 * Configura el cliente HTTP. En la web se llama una vez al arrancar con
 * `VITE_API_URL` (por defecto el dev-server hace proxy hacia el gateway).
 */
export function configurarApi(opciones: { baseUrl?: string; alExpirarSesion?: () => void }): void {
  if (opciones.baseUrl !== undefined) {
    baseUrl = opciones.baseUrl.replace(/\/$/, '');
  }
  alExpirarSesion = opciones.alExpirarSesion ?? null;
}

export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem(CLAVE_ACCESS, sesion.accessToken);
  localStorage.setItem(CLAVE_REFRESH, sesion.refreshToken);
}

export function accessToken(): string | null {
  return localStorage.getItem(CLAVE_ACCESS);
}

export function refreshTokenActual(): string | null {
  return localStorage.getItem(CLAVE_REFRESH);
}

export function limpiarSesion(): void {
  localStorage.removeItem(CLAVE_ACCESS);
  localStorage.removeItem(CLAVE_REFRESH);
}

export function haySesion(): boolean {
  return accessToken() !== null;
}

export class ErrorApi extends Error {
  readonly estado: number;
  readonly codigo: string;
  readonly detalles: string[];
  readonly correlationId: string | null;

  constructor(
    estado: number,
    codigo: string,
    mensaje: string,
    detalles: string[] = [],
    correlationId: string | null = null,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
    this.correlationId = correlationId;
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OpcionesPeticion {
  metodo?: Metodo;
  cuerpo?: unknown;
  senal?: AbortSignal;
  requiereAuth?: boolean;
  reintentar?: boolean;
}

/**
 * Cliente tipado con refresco transparente de la sesion (un reintento por 401).
 */
export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, senal, requiereAuth = true, reintentar = true } = opciones;

  const cabeceras = new Headers({ Accept: 'application/json' });
  if (cuerpo !== undefined) {
    cabeceras.set('Content-Type', 'application/json');
  }
  if (requiereAuth) {
    const token = accessToken();
    if (token) {
      cabeceras.set('Authorization', `Bearer ${token}`);
    }
  }

  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: senal,
  });

  if (respuesta.status === 401 && requiereAuth && reintentar) {
    const renovada = await renovarToken();
    if (renovada) {
      return peticion<T>(ruta, { ...opciones, reintentar: false });
    }
    limpiarSesion();
    alExpirarSesion?.();
    throw new ErrorApi(401, 'SESION_EXPIRADA', 'Tu sesion expiro, inicia sesion de nuevo');
  }

  if (!respuesta.ok) {
    throw await construirError(respuesta);
  }
  if (respuesta.status === 204) {
    return undefined as T;
  }

  const texto = await respuesta.text();
  return (texto ? (JSON.parse(texto) as T) : (undefined as T));
}

async function construirError(respuesta: Response): Promise<ErrorApi> {
  let cuerpo: Partial<ErrorApiCuerpo> = {};
  try {
    cuerpo = (await respuesta.json()) as Partial<ErrorApiCuerpo>;
  } catch {
    // respuesta sin JSON (por ejemplo, error de red del proxy)
  }
  return new ErrorApi(
    respuesta.status,
    cuerpo.codigo ?? 'ERROR_DESCONOCIDO',
    cuerpo.mensaje ?? `La peticion fallo con estado ${respuesta.status}`,
    cuerpo.detalles ?? [],
    cuerpo.correlationId ?? null,
  );
}

async function renovarToken(): Promise<boolean> {  const token = refreshTokenActual();
  if (!token) {
    return false;
  }
  try {
    const respuesta = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (!respuesta.ok) {
      return false;
    }
    const sesion = (await respuesta.json()) as Sesion;
    guardarSesion(sesion);
    return true;
  } catch {
    return false;
  }
}

export function construirQuery(
  parametros: Record<string, string | number | boolean | null | undefined>,
): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      busqueda.set(clave, String(valor));
    }
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : '';
}

/**
 * Descarga un archivo protegido (por ejemplo el recibo en PDF) respetando el
 * JWT y el refresco transparente. Devuelve el nombre con el que se guardó.
 */
export async function descargarArchivo(ruta: string, nombreSugerido: string): Promise<string> {
  const solicitar = () => {
    const token = accessToken();
    return fetch(`${baseUrl}${ruta}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  let respuesta = await solicitar();
  if (respuesta.status === 401) {
    if (await renovarToken()) {
      respuesta = await solicitar();
    }
  }
  if (!respuesta.ok) {
    throw await construirError(respuesta);
  }

  const nombre =
    nombreDesdeDisposicion(respuesta.headers.get('Content-Disposition')) ?? nombreSugerido;
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
  return nombre;
}

function nombreDesdeDisposicion(cabecera: string | null): string | null {
  if (!cabecera) {
    return null;
  }
  const extendido = /filename\*=UTF-8''([^;]+)/i.exec(cabecera);
  if (extendido?.[1]) {
    try {
      return decodeURIComponent(extendido[1].trim());
    } catch {
      return extendido[1].trim();
    }
  }
  const simple = /filename="?([^";]+)"?/i.exec(cabecera);
  return simple?.[1]?.trim() ?? null;
}
