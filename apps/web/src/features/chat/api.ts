import { peticion } from '@nomina360/core';

export interface ContactoChat {
  id: string;
  nombre: string;
  rol: string;
  area: string;
}
export interface MensajeChat {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  contenido: string;
  enviadoEn: string;
}
export const contactosChat = (senal?: AbortSignal) =>
  peticion<ContactoChat[]>('/api/auth/chat/contactos', { senal });
export const conversacionChat = (id: string, senal?: AbortSignal) =>
  peticion<MensajeChat[]>(`/api/auth/chat/${id}`, { senal });
export const enviarChat = (id: string, contenido: string) =>
  peticion<MensajeChat>(`/api/auth/chat/${id}`, { metodo: 'POST', cuerpo: { contenido } });
