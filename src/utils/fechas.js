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

// ---- Campos de fecha (components/CampoFecha.vue) ----
// Todo trabaja con textos 'AAAA-MM-DD' (lo que guardan los formularios) y días locales.

const isoDe = (anio, mes, dia) => `${anio}-${dosCifras(mes)}-${dosCifras(dia)}`;
const partes = (iso) => String(iso).slice(0, 10).split('-').map(Number);
const esFechaReal = (anio, mes, dia) => {
  const f = new Date(anio, mes - 1, dia);
  return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia;
};

/**
 * Lo que alguien escribe a mano en un campo de fecha, como fecha (medianoche local), o null
 * si no se entiende. Admite «15/10/2026», «15-10-26», «15.10.2026», «15 10 2026», «15102026»,
 * «151026», «15/10» y «1510» (del año en curso) y «2026-10-15» (pegada de otra pantalla).
 * Los años de dos cifras son de este siglo.
 */
export function interpretarFechaEscrita(texto, hoy = new Date()) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return null;
  let anio;
  let mes;
  let dia;
  const trozos = limpio.split(/[\s/.-]+/).filter(Boolean);
  if (!trozos.every((t) => /^\d+$/.test(t))) return null;
  if (trozos.length === 3 && trozos[0].length === 4) {
    [anio, mes, dia] = trozos.map(Number);
  } else if (trozos.length === 3 || trozos.length === 2) {
    [dia, mes] = trozos.map(Number);
    if (trozos.length === 2) anio = hoy.getFullYear();
    else if (trozos[2].length === 2) anio = 2000 + Number(trozos[2]);
    else if (trozos[2].length === 4) anio = Number(trozos[2]);
    else return null;
  } else if (trozos.length === 1 && [4, 6, 8].includes(trozos[0].length)) {
    const t = trozos[0];
    dia = Number(t.slice(0, 2));
    mes = Number(t.slice(2, 4));
    anio = t.length === 4 ? hoy.getFullYear() : t.length === 6 ? 2000 + Number(t.slice(4)) : Number(t.slice(4));
  } else {
    return null;
  }
  if (anio < 1900 || anio > 2199 || !esFechaReal(anio, mes, dia)) return null;
  return new Date(anio, mes - 1, dia);
}

/** 'AAAA-MM-DD' + `dias` días (negativos para restar). '' si la fecha no es válida. */
export function sumarDias(iso, dias) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(iso ?? ''))) return '';
  const [a, m, d] = partes(iso);
  return fechaLocalISO(new Date(a, m - 1, d + dias));
}

/**
 * Último día de un periodo de `meses` meses que empieza el día `inicio`: el mismo día
 * `meses` meses después, menos uno (01/11/2026 + 12 meses: 31/10/2027; 29/02/2028 + 12
 * meses: 28/02/2029). '' si el inicio no es válido.
 */
export function finDePeriodo(inicio, meses) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(inicio ?? ''))) return '';
  const [a, m, d] = partes(inicio);
  return fechaLocalISO(new Date(a, m - 1 + meses, d - 1));
}

/** Día 1 del mes siguiente a `hoy`, 'AAAA-MM-DD'. */
export function primeroDelMesSiguiente(hoy = new Date()) {
  return isoDe(hoy.getMonth() === 11 ? hoy.getFullYear() + 1 : hoy.getFullYear(), (hoy.getMonth() + 1) % 12 + 1, 1);
}

/** 1 de enero del año siguiente a `hoy`, 'AAAA-MM-DD'. */
export function primeroDeEneroSiguiente(hoy = new Date()) {
  return isoDe(hoy.getFullYear() + 1, 1, 1);
}

/** 31 de diciembre del año de la fecha `iso` ('AAAA-MM-DD'); '' si no es válida. */
export function finDeAnio(iso) {
  return /^\d{4}-\d{2}-\d{2}/.test(String(iso ?? '')) ? `${String(iso).slice(0, 4)}-12-31` : '';
}

/**
 * Años, meses y días que dura un periodo del día `inicio` al día `fin`, ambos incluidos
 * (01/11/2026 a 31/10/2027: 1 año). null si falta alguna o el fin es anterior al inicio.
 */
export function duracionPeriodo(inicio, fin) {
  const desde = fechaLocalISO(inicio);
  const hasta = fechaLocalISO(fin);
  if (!desde || !hasta || hasta < desde) return null;
  const [a, m, d] = partes(desde);
  const finMasUno = sumarDias(hasta, 1);
  let meses = 0;
  while (fechaLocalISO(new Date(a, m - 1 + meses + 1, d)) <= finMasUno) meses += 1;
  const tras = new Date(a, m - 1 + meses, d);
  const [fa, fm, fd] = partes(finMasUno);
  const dias = Math.round((Date.UTC(fa, fm - 1, fd) - Date.UTC(tras.getFullYear(), tras.getMonth(), tras.getDate())) / 86400000);
  return { anios: Math.floor(meses / 12), meses: meses % 12, dias };
}

/** «1 año», «1 año y 6 meses», «2 meses y 3 días», «15 días»; '' si no hay periodo. */
export function textoDuracion(inicio, fin) {
  const p = duracionPeriodo(inicio, fin);
  if (!p) return '';
  const trozos = [];
  if (p.anios) trozos.push(`${p.anios} ${p.anios === 1 ? 'año' : 'años'}`);
  if (p.meses) trozos.push(`${p.meses} ${p.meses === 1 ? 'mes' : 'meses'}`);
  if (p.dias) trozos.push(`${p.dias} ${p.dias === 1 ? 'día' : 'días'}`);
  return trozos.length <= 1 ? trozos.join('') : `${trozos.slice(0, -1).join(', ')} y ${trozos[trozos.length - 1]}`;
}

// ---- Atajos de los calendarios ({ etiqueta, detalle, valor }) ----
const ddmmaaaa = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '');
const atajo = (etiqueta, valor) => ({ etiqueta, detalle: ddmmaaaa(valor), valor });

/** «1 del mes que viene» */
export function atajoPrimeroDelMes(hoy = new Date()) {
  return atajo('1 del mes que viene', primeroDelMesSiguiente(hoy));
}

/** «1 de enero» del año que viene */
export function atajoPrimeroDeEnero(hoy = new Date()) {
  return atajo('1 de enero', primeroDeEneroSiguiente(hoy));
}

/** «31 de diciembre» del año de `iso` (o del actual); null si no hay fecha. */
export function atajoFinDeAnio(iso = fechaLocalISO()) {
  const valor = finDeAnio(iso);
  return valor ? atajo('31 de diciembre', valor) : null;
}

/** «Mañana», «En una semana»… contando desde hoy. */
export function atajoDentroDe(dias, etiqueta, hoy = new Date()) {
  return atajo(etiqueta, sumarDias(fechaLocalISO(hoy), dias));
}

/** «1 año», «2 años», «3 años» desde `inicio` (último día de cada periodo); [] sin inicio. */
export function atajosDuracion(inicio, anios = [1, 2, 3]) {
  if (!fechaLocalISO(inicio)) return [];
  return anios.map((n) => atajo(`${n} ${n === 1 ? 'año' : 'años'}`, finDePeriodo(fechaLocalISO(inicio), n * 12)));
}

/** Meses exactos de un periodo (12 si va del 01/11/2026 al 31/10/2027); null si no son meses justos. */
export function mesesExactos(inicio, fin) {
  const p = duracionPeriodo(inicio, fin);
  return p && p.dias === 0 && (p.anios || p.meses) ? p.anios * 12 + p.meses : null;
}
