import { cn } from '@nomina360/ui';

export type NombreIcono =
  | 'tablero'
  | 'nomina'
  | 'empleados'
  | 'produccion'
  | 'administracion'
  | 'salir'
  | 'menu'
  | 'cerrar'
  | 'buscar'
  | 'mas'
  | 'check'
  | 'equis'
  | 'flecha'
  | 'calculadora'
  | 'dinero'
  | 'reloj'
  | 'alerta'
  | 'usuario';

const TRAZOS: Record<NombreIcono, string[]> = {
  tablero: ['M3 3h7v7H3z', 'M14 3h7v4h-7z', 'M14 11h7v10h-7z', 'M3 14h7v7H3z'],
  nomina: ['M4 6h16v12H4z', 'M8 6V4h8v2', 'M8 11h8', 'M8 15h5'],
  empleados: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  produccion: ['M4 20V10l5 3V10l5 3V6l6 3v11H4Z', 'M7 20v-3', 'M12 20v-3', 'M17 20v-3'],
  administracion: ['M3 7h18v12H3z', 'M3 7l2-3h14l2 3', 'M16 13h2', 'M3 11h18'],
  salir: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  cerrar: ['M6 6l12 12', 'M18 6L6 18'],
  buscar: ['M21 21l-4.35-4.35', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z'],
  mas: ['M12 5v14', 'M5 12h14'],
  check: ['M20 6L9 17l-5-5'],
  equis: ['M6 6l12 12', 'M18 6L6 18'],
  flecha: ['M5 12h14', 'M13 6l6 6-6 6'],
  calculadora: [
    'M5 3h14v18H5z',
    'M8 7h8',
    'M8 11h.01',
    'M12 11h.01',
    'M16 11h.01',
    'M8 15h.01',
    'M12 15h.01',
    'M16 15h.01',
  ],
  dinero: [
    'M12 3v18',
    'M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 3 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3',
  ],
  reloj: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 7v5l3 2'],
  alerta: [
    'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
    'M12 9v4',
    'M12 17h.01',
  ],
  usuario: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
};

export function Icono({ nombre, className }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-5 shrink-0', className)}
      aria-hidden="true"
    >
      {TRAZOS[nombre].map((trazo, indice) => (
        <path key={indice} d={trazo} />
      ))}
    </svg>
  );
}
