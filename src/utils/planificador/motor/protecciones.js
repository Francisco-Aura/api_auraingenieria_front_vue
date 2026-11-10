import { COLD_VOC } from './pasosConfig.js';
import { effectiveStrings } from './strings.js';
/** Fusibles por string: uno en cada polaridad (positivo y negativo). Pendiente de confirmar con Ingeniería si siempre van los dos. */
export const FUSES_PER_STRING = 2;
/** Calibre de un fusible de string respecto a la Isc del panel: entre 1,5 y 2,4 veces. */
export const FUSE_MIN_X_ISC = 1.5;
export const FUSE_MAX_X_ISC = 2.4;
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const fold = (v) => String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
const fmt = (n, digits = 0) => n.toLocaleString('es-ES', { maximumFractionDigits: digits });
/** Qué es un producto de protección de continua para los fusibles de string, o null si no es nada de eso. */
export function fuseKind(item) {
    if (item.category !== 'protecciones' || fold(item.attrs.tipo) !== 'cc')
        return null;
    const el = fold(item.attrs.elemento);
    if (el === 'fusible con portafusibles' || el === 'fusibles por string')
        return 'combined';
    if (el.startsWith('portafusible'))
        return 'holder';
    if (el.startsWith('fusible'))
        return 'fuse';
    return null;
}
/** Lo que piden los fusibles según el panel, el inversor y el diseño de strings elegidos; null mientras falte alguno de ellos. */
export function fuseNeed(state, catalog) {
    const byId = new Map(catalog.items.map((i) => [i.id, i]));
    const chosen = (category) => state.lines.flatMap((l) => {
        const it = l.itemId ? byId.get(l.itemId) : undefined;
        return it && it.category === category ? [{ it, line: l }] : [];
    });
    const panel = chosen('modulos')[0]?.it;
    const inverters = chosen('inversores').filter((e) => !['microinversor', 'optimizador'].includes(fold(e.it.attrs.tipo)));
    const inverter = inverters[0]?.it;
    if (!panel || !inverter || !(state.moduleCount > 0))
        return null;
    const design = effectiveStrings(state.strings);
    const strings = design.filter((s) => s.panels > 0).length;
    if (strings === 0)
        return null;
    const longest = Math.max(...design.map((s) => s.panels));
    const voc = num(panel.attrs.voc_v);
    const isc = num(panel.attrs.isc_a);
    return {
        strings,
        quantity: strings * FUSES_PER_STRING,
        minVolts: voc !== null ? voc * longest * COLD_VOC : null,
        minAmps: isc !== null ? isc * FUSE_MIN_X_ISC : null,
        maxAmps: isc !== null ? isc * FUSE_MAX_X_ISC : null,
    };
}
/** ¿Cumple el producto lo que piden los fusibles? Sin el dato necesario no se da por bueno (se pide revisar la ficha). */
export function meetsFuseNeed(item, need) {
    const kind = fuseKind(item);
    if (!kind)
        return false;
    const volts = num(item.attrs.tension_v);
    const amps = num(item.attrs.corriente_a);
    if (need.minVolts !== null && (volts === null || volts < need.minVolts))
        return false;
    if (kind === 'holder')
        return need.minAmps === null || (amps !== null && amps >= need.minAmps); // el portafusibles aguanta, al menos, el calibre mínimo
    if (need.minAmps !== null && need.maxAmps !== null && (amps === null || amps < need.minAmps || amps > need.maxAmps))
        return false;
    return true;
}
export function fuseCoverage(state, catalog) {
    const need = fuseNeed(state, catalog);
    if (!need)
        return null;
    const pool = catalog.items.filter((i) => fuseKind(i) !== null && meetsFuseNeed(i, need));
    const combined = pool.filter((i) => fuseKind(i) === 'combined');
    const fuses = pool.filter((i) => fuseKind(i) === 'fuse');
    const holders = pool.filter((i) => fuseKind(i) === 'holder');
    const missing = [];
    if (combined.length === 0) {
        const caliber = need.minAmps !== null && need.maxAmps !== null ? ` de ${fmt(need.minAmps, 0)} a ${fmt(need.maxAmps, 0)} A` : '';
        const volts = need.minVolts !== null ? ` y al menos ${fmt(need.minVolts, 0)} V` : '';
        if (fuses.length === 0)
            missing.push(`Fusible de continua${caliber}${volts}: ${need.quantity} unidades`);
        if (holders.length === 0)
            missing.push(`Portafusibles de continua${volts}: ${need.quantity} unidades`);
    }
    return { need, combined, fuses, holders, missing };
}
/** Para qué cantidad se añade un producto de fusibles de string: la de strings × polaridades; null si no es uno de ellos. */
export function fuseQuantity(item, state, catalog) {
    if (!fuseKind(item))
        return null;
    return fuseNeed(state, catalog)?.quantity ?? null;
}
/** Texto para el motivo de un fusible sugerido. */
export const fuseReason = (need) => `${need.quantity} unidades: ${FUSES_PER_STRING} por string (${need.strings} string${need.strings === 1 ? '' : 's'})`;
