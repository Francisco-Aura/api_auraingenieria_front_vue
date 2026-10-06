/*
 * Comparador único para ordenar las columnas de cualquier tabla.
 *
 * Las pantallas comparaban con `>` y `<`, que ordenan por el código del carácter:
 * «Álvarez» quedaba detrás de «Zapata» y «10» delante de «9». Comisiones MCAS ya
 * usaba esta versión (dos copias idénticas); ahora es la de todas.
 *
 * - Las celdas vacías (null, undefined, '') se van al final, no se mezclan.
 * - Dos números se comparan como números.
 * - El resto se compara en español, sin distinguir acentos ni mayúsculas, y con
 *   los números dentro del texto ordenados por su valor («PS-9» antes que «PS-10»).
 */
export function compararValores(a, b) {
  const vacioA = a === null || a === undefined || a === '';
  const vacioB = b === null || b === undefined || b === '';
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : (vacioA ? 1 : -1);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

export default compararValores;
