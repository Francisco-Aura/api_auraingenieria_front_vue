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
