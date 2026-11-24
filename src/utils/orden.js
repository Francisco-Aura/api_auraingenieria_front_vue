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
 *
 * El comparador de textos se crea una sola vez: `a.localeCompare(b, 'es', {...})`
 * construye uno nuevo en cada llamada y ordenar 5.000 filas costaba ~400 ms (cada
 * pulsación en un filtro con la tabla ordenada); con el mismo Intl.Collator, ~15 ms.
 * El resultado es idéntico: localeCompare con idioma y opciones es justo esto.
 */
const comparadorTextos = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export function compararValores(a, b) {
  const vacioA = a === null || a === undefined || a === '';
  const vacioB = b === null || b === undefined || b === '';
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : (vacioA ? 1 : -1);
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return comparadorTextos.compare(String(a), String(b));
}

export default compararValores;
