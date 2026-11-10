import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Boton, Campo, Cargador, EstadoVacio, Tarjeta } from '@nomina360/ui';
import { accessToken, iniciales } from '@nomina360/core';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { contactosChat, conversacionChat, enviarChat } from './api';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { useAccion } from '@/shared/hooks/useAccion';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';
import { EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { queryClient } from '@/shared/lib/queryClient';
import { API_URL } from '@/shared/config/entorno';

export function ChatPage() {
  const { usuario } = useSesion();
  const [contacto, setContacto] = useState('');
  const [contenido, setContenido] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [conectado, setConectado] = useState(false);
  const [aviso, setAviso] = useState('');
  const mensajesRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const contactos = useConsulta(contactosChat, 'chat-contactos');
  const mensajes = useConsulta(
    (s) => (contacto ? conversacionChat(contacto, s) : Promise.resolve([])),
    `chat:${contacto}`,
    !!contacto,
  );
  useEffect(() => {
    const elemento = mensajesRef.current;
    if (elemento) elemento.scrollTo({ top: elemento.scrollHeight, behavior: 'smooth' });
  }, [mensajes.datos]);
  useEffect(() => {
    if (!contacto) return;
    const token = accessToken();
    if (!token) return;
    let cancelado = false;
    let reintento: number | undefined;
    const conectar = () => {
      if (cancelado) return;
      const url = API_URL
        ? API_URL.replace(/^http/, 'ws') + '/api/auth/chat/ws'
        : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/auth/chat/ws`;
      const socket = new WebSocket(url, ['nomina360-chat', `bearer.${token}`]);
      socketRef.current = socket;
      socket.onopen = () => {
        setConectado(true);
        socket.send(JSON.stringify({ tipo: 'suscribir', contactoId: contacto }));
      };
      socket.onmessage = (event) => {
        const respuesta = JSON.parse(event.data) as {
          tipo: 'historial' | 'mensaje' | 'error';
          mensajes?: import('./api').MensajeChat[];
          mensaje?: import('./api').MensajeChat;
        };
        const clave = ['nomina360', `chat:${contacto}`];
        if (respuesta.tipo === 'historial')
          queryClient.setQueryData(clave, respuesta.mensajes ?? []);
        if (respuesta.tipo === 'mensaje' && respuesta.mensaje) {
          queryClient.setQueryData<import('./api').MensajeChat[]>(clave, (previos = []) =>
            previos.some((m) => m.id === respuesta.mensaje?.id)
              ? previos
              : [...previos, respuesta.mensaje!],
          );
          if (respuesta.mensaje.remitenteId !== usuario?.id) {
            const nombre =
              contactos.datos?.find((c) => c.id === respuesta.mensaje?.remitenteId)?.nombre ??
              'Alguien';
            setAviso(`Tienes un mensaje nuevo de ${nombre}`);
            window.setTimeout(() => setAviso(''), 4500);
          }
        }
        if (respuesta.tipo === 'error') setAviso('No se pudo enviar el mensaje. Intenta de nuevo.');
      };
      socket.onclose = () => {
        setConectado(false);
        if (!cancelado) reintento = window.setTimeout(conectar, 2500);
      };
      socket.onerror = () => socket.close();
    };
    conectar();
    return () => {
      cancelado = true;
      if (reintento) window.clearTimeout(reintento);
      socketRef.current?.close();
      socketRef.current = null;
      setConectado(false);
    };
  }, [contacto, usuario?.id, contactos.datos]);
  const enviar = useAccion(enviarChat);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const texto = contenido.trim();
    if (!contacto || !texto) return;
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ tipo: 'enviar', contactoId: contacto, contenido: texto }),
        );
      } else {
        await enviar.ejecutar(contacto, texto);
      }
      setContenido('');
      if (socketRef.current?.readyState !== WebSocket.OPEN) mensajes.recargar();
    } catch {
      // El error de envío se presenta junto al compositor.
    }
  }
  function manejarTecla(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }
  const seleccionado = contactos.datos?.find((c) => c.id === contacto);
  const contactosFiltrados = (contactos.datos ?? []).filter((c) =>
    `${c.nombre} ${c.rol} ${c.area}`
      .toLocaleLowerCase('es-MX')
      .includes(busqueda.toLocaleLowerCase('es-MX')),
  );
  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Chat"
        descripcion="Comunícate con las personas de tu organización."
      />
      {aviso && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-brand-400/30 bg-brand-400/10 px-4 py-3 text-sm text-brand-100"
        >
          {aviso}
        </div>
      )}
      <Tarjeta className="overflow-hidden !p-0">
        <div className="grid min-h-[min(76vh,760px)] md:grid-cols-[280px_1fr]">
          <aside
            className={`${contacto ? 'hidden md:block' : 'block'} border-b border-white/10 bg-black/10 p-3 md:border-b-0 md:border-r`}
          >
            <div className="flex items-center justify-between px-2 py-2">
              <h2 className="text-sm font-semibold text-white">Mensajes</h2>
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
                {contactos.datos?.length ?? 0}
              </span>
            </div>
            <label className="relative my-2 block">
              <span className="sr-only">Buscar contacto</span>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar contacto…"
                className="w-full rounded-xl border border-white/10 bg-ink-900/70 py-2 pl-3 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-brand-400/50"
              />
            </label>
            {contactos.cargando ? (
              <Cargador />
            ) : contactos.error ? (
              <ErrorCarga
                mensaje={contactos.error}
                onReintentar={contactos.recargar}
                recurso="los contactos"
              />
            ) : contactos.datos?.length ? (
              <ul className="flex max-h-[60vh] gap-1 overflow-x-auto md:flex-col md:overflow-y-auto">
                {contactosFiltrados.map((c) => (
                  <li key={c.id} className="min-w-52 shrink-0 md:min-w-0">
                    <button
                      onClick={() => setContacto(c.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${contacto === c.id ? 'bg-brand-400/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.04]'}`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400/30 to-violet-400/20 text-xs font-semibold text-brand-100">
                        {iniciales(c.nombre)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-100">
                          {c.nombre}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {c.rol} · {c.area}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
                {contactosFiltrados.length === 0 && (
                  <li className="px-3 py-5 text-center text-xs text-slate-500">
                    No hay contactos que coincidan.
                  </li>
                )}
              </ul>
            ) : (
              <p className="p-2 text-xs text-slate-500">No hay contactos disponibles.</p>
            )}
          </aside>
          <section
            className={`${contacto ? 'flex' : 'hidden md:flex'} min-h-[55vh] min-w-0 flex-col`}
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.015] px-4 py-3">
              {contacto && (
                <button
                  type="button"
                  onClick={() => setContacto('')}
                  className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 md:hidden"
                >
                  Volver
                </button>
              )}
              {seleccionado && (
                <span className="grid size-9 place-items-center rounded-full bg-brand-400/15 text-xs font-semibold text-brand-200">
                  {iniciales(seleccionado.nombre)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {seleccionado?.nombre ?? 'Tus conversaciones'}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {seleccionado
                    ? `${seleccionado.rol} · ${seleccionado.area} · ${conectado ? 'En tiempo real' : 'Conectando…'}`
                    : 'Selecciona un contacto para comenzar'}
                </p>
              </div>
            </header>
            <div
              ref={mensajesRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,.035),transparent_60%)] p-4 sm:p-6"
            >
              {mensajes.cargando ? (
                <Cargador mensaje="Cargando mensajes…" />
              ) : mensajes.error ? (
                <ErrorCarga
                  mensaje={mensajes.error}
                  onReintentar={mensajes.recargar}
                  recurso="la conversación"
                />
              ) : mensajes.datos?.length ? (
                mensajes.datos.map((m) => {
                  const propio = m.remitenteId === usuario?.id;
                  return (
                    <div key={m.id} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[72%] ${propio ? 'rounded-br-md bg-brand-400/15 text-slate-100 ring-1 ring-brand-300/10' : 'rounded-bl-md bg-white/[0.055] text-slate-200 ring-1 ring-white/5'}`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {m.contenido}
                        </p>
                        <time className="mt-1.5 block text-right text-[10px] text-slate-500">
                          {new Date(m.enviadoEn).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </time>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EstadoVacio
                  titulo="Inicia la conversación"
                  descripcion="Envía un mensaje para comenzar el chat."
                />
              )}
            </div>
            <form
              onSubmit={submit}
              className="flex items-end gap-2 border-t border-white/10 bg-ink-900/30 p-3 sm:p-4"
            >
              <div className="min-w-0 flex-1">
                <Campo
                  etiqueta="Mensaje"
                  name="mensaje"
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escribe un mensaje…"
                  maxLength={2000}
                  disabled={!contacto}
                  onKeyDown={manejarTecla}
                  className="h-10 py-0"
                />
              </div>
              <Boton
                type="submit"
                disabled={!contacto || !contenido.trim()}
                cargando={enviar.ejecutando}
              >
                Enviar
              </Boton>
            </form>
            {enviar.error && (
              <p role="alert" className="px-4 pb-3 text-xs text-rose-300">
                {enviar.error}
              </p>
            )}
          </section>
        </div>
      </Tarjeta>
    </div>
  );
}
