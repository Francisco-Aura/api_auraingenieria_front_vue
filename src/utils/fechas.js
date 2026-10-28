// Utilidades de fecha compartidas por las pantallas.

const dosCifras = (n) => String(n).padStart(2, '0');

/**
 * Fecha en formato AAAA-MM-DD (el de los <input type="date">) según el día LOCAL.
 *
 * No usar `toISOString().split('T')[0]`: convierte a UTC y, en España, cualquier hora
 * entre las 00:00 y las 01:59 se convierte en el día anterior.
 *
 * @param {Date|string|number|null} valor fecha, texto ISO (con o sin hora) o marca de tiempo
 * @returns {string} 'AAAA-MM-DD', o '' si el valor no es una fecha válida
 */
export function fechaLocalISO(valor = new Date()) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`;
}

/**
 * ¿Está en vigor hoy un periodo que empieza el día `inicio` y acaba el día `fin`
 * (inicio <= hoy < fin)? Compara días locales: `new Date('2026-01-15')` es la medianoche
 * UTC (la 01:00 o las 02:00 en España) y, de madrugada, el primer día salía como no
 * vigente y el último como vigente. El servidor usa CURRENT_DATE, igual que aquí.
 */
export function enVigorHoy(inicio, fin, hoy = fechaLocalISO()) {
  const desde = fechaLocalISO(inicio);
  const hasta = fechaLocalISO(fin);
  return desde !== '' && hasta !== '' && desde <= hoy && hoy < hasta;
}

/** ¿Ha terminado ya (fin <= hoy) un periodo que acaba el día `fin`? */
export function terminadoHoy(fin, hoy = fechaLocalISO()) {
  const hasta = fechaLocalISO(fin);
  return hasta !== '' && hasta <= hoy;
}

// Formateadores creados una sola vez (toLocale*String con opciones crea uno nuevo en cada
// llamada). Dan exactamente el mismo texto que toLocaleDateString/toLocaleString con estas
// opciones; para una fecha inválida, «Invalid Date», igual que aquellos.
const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const FORMATO_FECHA_HORA = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});
const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat('es-ES');

function formatear(formato, valor, vacio) {
  if (!valor) return vacio;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(fecha) : formato.format(fecha);
}

/** «05/03/2026». Sin valor, `vacio` (cada pantalla usa el suyo: '-', '' o '—'). */
export function fechaES(valor, vacio = '-') {
  return formatear(FORMATO_FECHA, valor, vacio);
}

/** «05/03/2026, 08:07». Sin valor, `vacio`. */
export function fechaHoraES(valor, vacio = '-') {
  return formatear(FORMATO_FECHA_HORA, valor, vacio);
}

/** «5/3/2026» (sin ceros delante, como toLocaleDateString('es-ES')). Sin valor, `vacio`. */
export function fechaCortaES(valor, vacio = '') {
  return formatear(FORMATO_FECHA_CORTA, valor, vacio);
}
