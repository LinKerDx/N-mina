import { useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  configurarApi,
  guardarSesion,
  haySesion,
  limpiarSesion,
  type DatosLogin,
  type Usuario,
} from '@nomina360/core';
import { cerrarSesionRemota, iniciarSesion, obtenerPerfil } from '@/features/auth/api';
import { queryClient } from '@/shared/lib/queryClient';

interface EstadoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  disponibilidad: Disponibilidad;
  establecerUsuario: (usuario: Usuario | null) => void;
  establecerCargando: (cargando: boolean) => void;
  establecerDisponibilidad: (disponibilidad: Disponibilidad) => void;
  iniciar: (datos: DatosLogin) => Promise<Usuario>;
  cerrar: () => Promise<void>;
}

export type Disponibilidad = 'EN_LINEA' | 'AUSENTE' | 'NO_MOLESTAR';

export const useSesionStore = create<EstadoSesion>((set) => ({
  usuario: null,
  cargando: true,
  disponibilidad: 'EN_LINEA',
  establecerUsuario: (usuario) => set({ usuario }),
  establecerCargando: (cargando) => set({ cargando }),
  establecerDisponibilidad: (disponibilidad) => set({ disponibilidad }),
  iniciar: async (datos) => {
    const sesion = await iniciarSesion(datos);
    queryClient.clear();
    guardarSesion(sesion);
    set({ usuario: sesion.usuario, cargando: false, disponibilidad: 'EN_LINEA' });
    return sesion.usuario;
  },
  cerrar: async () => {
    try {
      await cerrarSesionRemota();
    } catch {
      // La sesión local también debe cerrarse si el refresh ya expiró.
    } finally {
      limpiarSesion();
      queryClient.clear();
      set({ usuario: null, cargando: false, disponibilidad: 'EN_LINEA' });
    }
  },
}));

interface ContextoSesion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciar: (datos: DatosLogin) => Promise<Usuario>;
  cerrar: () => Promise<void>;
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const usuario = useSesionStore((estado) => estado.usuario);
  const establecerUsuario = useSesionStore((estado) => estado.establecerUsuario);
  const establecerCargando = useSesionStore((estado) => estado.establecerCargando);
  const perfil = useQuery({
    queryKey: ['sesion', 'perfil'],
    queryFn: obtenerPerfil,
    enabled: haySesion() && !usuario,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    configurarApi({
      alExpirarSesion: () => {
        limpiarSesion();
        queryClient.clear();
        establecerUsuario(null);
        establecerCargando(false);
      },
    });
  }, [establecerCargando, establecerUsuario]);

  useEffect(() => {
    if (!haySesion()) {
      establecerCargando(false);
    } else if (perfil.data) {
      establecerUsuario(perfil.data);
      establecerCargando(false);
    } else if (perfil.isError) {
      limpiarSesion();
      establecerUsuario(null);
      establecerCargando(false);
    }
  }, [perfil.data, perfil.isError, establecerCargando, establecerUsuario]);

  return children;
}

export function useSesion(): ContextoSesion {
  return useSesionStore(
    useShallow((estado) => ({
      usuario: estado.usuario,
      cargando: estado.cargando,
      iniciar: estado.iniciar,
      cerrar: estado.cerrar,
    })),
  );
}
