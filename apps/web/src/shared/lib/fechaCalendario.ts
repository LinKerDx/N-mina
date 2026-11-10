/** Return YYYY-MM-DD from the local calendar without converting through UTC. */
export function fechaCalendarioLocal(fecha = new Date()): string {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
  ].join('-');
}
