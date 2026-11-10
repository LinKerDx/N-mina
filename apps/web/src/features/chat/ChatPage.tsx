import { useEffect, useState, type FormEvent } from 'react';
import { Boton, Campo, Cargador, EstadoVacio, Tarjeta } from '@nomina360/ui';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { contactosChat, conversacionChat, enviarChat } from './api';
import { useConsulta } from '@/shared/hooks/useConsulta';
import { useAccion } from '@/shared/hooks/useAccion';
import { ErrorCarga } from '@/shared/componentes/ErrorCarga';
import { EncabezadoPagina } from '@/shared/componentes/EncabezadoPagina';
import { queryClient } from '@/shared/lib/queryClient';

export function ChatPage() {
  const { usuario } = useSesion();
  const [contacto, setContacto] = useState('');
  const [contenido, setContenido] = useState('');
  const contactos = useConsulta(contactosChat, 'chat-contactos');
  useEffect(() => {
    if (!contacto && contactos.datos?.length) setContacto(contactos.datos[0].id);
  }, [contacto, contactos.datos]);
  const mensajes = useConsulta(
    (s) => (contacto ? conversacionChat(contacto, s) : Promise.resolve([])),
    `chat:${contacto}`,
    !!contacto,
  );
  useEffect(() => {
    if (!contacto) return;
    const temporizador = window.setInterval(
      () => void queryClient.invalidateQueries({ queryKey: ['nomina360', `chat:${contacto}`] }),
      5000,
    );
    return () => window.clearInterval(temporizador);
  }, [contacto]);
  const enviar = useAccion(enviarChat);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const texto = contenido.trim();
    if (!contacto || !texto) return;
    await enviar.ejecutar(contacto, texto);
    setContenido('');
    mensajes.recargar();
  }
  const seleccionado = contactos.datos?.find((c) => c.id === contacto);
  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Chat"
        descripcion="Comunícate con las personas de tu organización."
      />
      <Tarjeta className="overflow-hidden !p-0">
        <div className="grid min-h-[min(70vh,680px)] md:grid-cols-[260px_1fr]">
          <aside className="border-b border-white/10 p-3 md:border-b-0 md:border-r">
            <h2 className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Conversaciones
            </h2>
            {contactos.cargando ? (
              <Cargador />
            ) : contactos.error ? (
              <ErrorCarga
                mensaje={contactos.error}
                onReintentar={contactos.recargar}
                recurso="los contactos"
              />
            ) : contactos.datos?.length ? (
              <ul className="flex gap-2 overflow-x-auto md:flex-col">
                {contactos.datos.map((c) => (
                  <li key={c.id} className="shrink-0 md:shrink">
                    <button
                      onClick={() => setContacto(c.id)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left transition ${contacto === c.id ? 'bg-brand-400/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.04]'}`}
                    >
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {c.nombre}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {c.rol} · {c.area}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-2 text-xs text-slate-500">No hay contactos disponibles.</p>
            )}
          </aside>
          <section className="flex min-h-[55vh] min-w-0 flex-col">
            <header className="border-b border-white/10 px-4 py-3">
              <p className="font-semibold text-white">
                {seleccionado?.nombre ?? 'Selecciona una conversación'}
              </p>
              <p className="text-xs text-slate-500">
                {seleccionado
                  ? `${seleccionado.rol} · ${seleccionado.area}`
                  : 'Tus mensajes privados'}
              </p>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
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
                        className={`max-w-[85%] rounded-2xl px-3 py-2 ${propio ? 'bg-brand-400/15 text-slate-100' : 'bg-white/[0.05] text-slate-200'}`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm">{m.contenido}</p>
                        <time className="mt-1 block text-right text-[10px] text-slate-500">
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
            <form onSubmit={submit} className="flex items-end gap-2 border-t border-white/10 p-3">
              <Campo
                etiqueta="Mensaje"
                name="mensaje"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                placeholder="Escribe un mensaje…"
                maxLength={2000}
                disabled={!contacto}
              />
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
