const formatoMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoNumero = new Intl.NumberFormat('es-MX', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatoFechaLarga = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const formatoFechaHora = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function moneda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return '—';
  }
  return formatoMoneda.format(valor);
}

export function numero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return '—';
  }
  return formatoNumero.format(valor);
}

export function porcentaje(valor: number | null | undefined, decimales = 1): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) {
    return '—';
  }
  return `${valor.toFixed(decimales)}%`;
}

/**
 * Convierte 'YYYY-MM-DD' a Date local (evita el corrimiento por zona horaria de
 * `new Date('YYYY-MM-DD')`, que interpreta UTC).
 */
export function aFechaLocal(iso: string | null | undefined): Date | null {
  if (!iso) {
    return null;
  }
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (soloFecha) {
    return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  }
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function fecha(iso: string | null | undefined): string {
  const valor = aFechaLocal(iso);
  return valor ? formatoFecha.format(valor) : '—';
}

export function fechaLarga(iso: string | null | undefined): string {
  const valor = aFechaLocal(iso);
  return valor ? formatoFechaLarga.format(valor) : '—';
}

export function fechaHora(iso: string | null | undefined): string {
  const valor = aFechaLocal(iso);
  return valor ? formatoFechaHora.format(valor) : '—';
}

export function hora(cadena: string | null | undefined): string {
  if (!cadena) {
    return '—';
  }
  return cadena.slice(0, 5);
}

export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

export function sumar(valores: number[]): number {
  return redondear(valores.reduce((total, valor) => total + valor, 0));
}

export function iniciales(nombreCompleto: string): string {
  return nombreCompleto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

export function tituloRol(rol: string): string {
  switch (rol) {
    case 'ADMIN':
      return 'Administrador';
    case 'RH':
      return 'Recursos Humanos';
    case 'PRODUCCION':
      return 'Producción';
    case 'ADMINISTRACION':
      return 'Administración';
    default:
      return rol;
  }
}
