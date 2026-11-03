import { configurarApi, guardarSesion, haySesion, limpiarSesion, type DatosLogin, type Usuario } from '@nomina360/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cerrarSesionRemota, iniciarSesion, obtenerPerfil } from '@/features/auth/api';

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciar: (datos: DatosLogin) => Promise<void>;
  cerrar: () => Promise<void>;
}

const SesionContexto = createContext<ContextoSesion | null>(null);

/**
 * Estado global de sesion. Guarda los tokens y recupera el perfil al recargar.
 */
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    configurarApi({
      alExpirarSesion: () => setUsuario(null),
    });
  }, []);

  useEffect(() => {
    let activo = true;

    async function recuperar() {
      if (!haySesion()) {
        setCargando(false);
        return;
      }
      try {
        const perfil = await obtenerPerfil();
        if (activo) {
          setUsuario(perfil);
        }
      } catch {
        limpiarSesion();
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void recuperar();
    return () => {
      activo = false;
    };
  }, []);

  const iniciar = useCallback(async (datos: DatosLogin) => {
    const sesion = await iniciarSesion(datos);
    guardarSesion(sesion);
    setUsuario(sesion.usuario);
  }, []);

  const cerrar = useCallback(async () => {
    try {
      await cerrarSesionRemota();
    } catch {
      // si el refresh ya expiro, igual limpiamos la sesion local
    }
    limpiarSesion();
    setUsuario(null);
  }, []);

  const valor = useMemo<ContextoSesion>(
    () => ({ usuario, cargando, iniciar, cerrar }),
    [usuario, cargando, iniciar, cerrar],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(SesionContexto);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  }
  return contexto;
}
