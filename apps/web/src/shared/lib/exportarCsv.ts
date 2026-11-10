/** Download a CSV that opens cleanly in Excel (UTF-8 BOM and escaped cells). */
export function exportarCsv(
  nombre: string,
  encabezados: string[],
  filas: Array<Array<string | number>>,
) {
  const escapar = (valor: string | number) => {
    const seguro =
      typeof valor === 'string' && /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : String(valor);
    return `"${seguro.replaceAll('"', '""')}"`;
  };
  const contenido = [encabezados, ...filas].map((fila) => fila.map(escapar).join(',')).join('\r\n');
  const archivo = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
