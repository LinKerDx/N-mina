import { Link } from 'react-router-dom';
import { Boton } from '@nomina360/ui';

export function NoEncontradaPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <p className="text-6xl font-semibold text-brand-400/80">404</p>
        <h1 className="mt-3 text-xl font-semibold text-white">Página no encontrada</h1>
        <p className="mt-2 text-sm text-slate-400">
          La ruta que buscas no existe o cambió de lugar.
        </p>
        <Link to="/tablero" className="mt-6 inline-block">
          <Boton>Volver al tablero</Boton>
        </Link>
      </div>
    </div>
  );
}
