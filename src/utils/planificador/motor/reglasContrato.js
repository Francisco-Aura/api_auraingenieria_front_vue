// Comprobaciones automáticas sobre los datos del contrato que se teclean a partir de un escaneo.
// Sirven para cazar errores de transcripción (un cero de más, un 1 por un 7…) comparando unos datos con otros.
const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const dec = (n, digits = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits, useGrouping: 'always' }).format(n);
/** Acepta 1234.5, 1234,5 y 1.234,50. */
export function parseNumber(raw) {
    if (raw === undefined)
        return null;
    let text = raw.trim().replace(/\s/g, '');
    if (text === '')
        return null;
    if (text.includes(','))
        text = text.replace(/\./g, '').replace(',', '.');
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
}
/** Potencia unitaria (W) que figura en el modelo de panel, p. ej. "Jinko Tiger Neo 450W" → 450. */
export function panelWatts(model) {
    const m = /(\d{3,4})\s*w(?:p)?\b/i.exec(model ?? '');
    return m ? Number(m[1]) : null;
}
/** Potencia (kW) que figura en el modelo de inversor, p. ej. "Huawei SUN2000-25KTL" → 25. */
export function inverterKw(model) {
    const m = /(\d{1,3}(?:[.,]\d)?)\s*k(?:w|tl|l)?\b/i.exec(model ?? '');
    return m ? parseNumber(m[1]) : null;
}
/** Reparto habitual de pagos (anticipo, material, estructura y paneles, entrega de documentación). */
export const PAYMENT_SPLIT = [30, 40, 20, 10];
export function checkContract(values, split = PAYMENT_SPLIT) {
    const out = [];
    const importe = parseNumber(values.importe_total);
    const kwp = parseNumber(values.potencia_kwp);
    const panels = parseNumber(values.paneles_uds);
    const inverters = parseNumber(values.inversor_uds);
    const watts = panelWatts(values.paneles_modelo);
    // Valores imposibles: un contrato no tiene importes ni unidades negativos o con decimales.
    for (const key of ['paneles_uds', 'inversor_uds']) {
        const n = parseNumber(values[key]);
        if (n !== null && (n < 0 || !Number.isInteger(n))) {
            out.push({ level: 'warn', text: 'Las unidades deben ser un número entero positivo.' });
            break;
        }
    }
    // Los cálculos se enseñan tal cual, sin valorarlos ni aconsejar nada.
    // Paneles × potencia unitaria
    if (panels && watts) {
        const computed = (panels * watts) / 1000;
        out.push({
            level: 'info',
            text: `${dec(panels, 0)} paneles × ${watts} W = ${dec(computed)} kWp` + (kwp ? ` (potencia indicada: ${dec(kwp)} kWp).` : '.'),
        });
    }
    // Precio por vatio pico
    if (importe && kwp) {
        out.push({
            level: 'info',
            text: `${eur.format(importe)} ÷ ${dec(kwp * 1000, 0)} Wp = ${dec(importe / (kwp * 1000))} €/Wp.`,
        });
    }
    // Potencia pico entre potencia del inversor (solo si el modelo la indica)
    const kwInv = inverterKw(values.inversor_modelo);
    if (kwp && kwInv && inverters) {
        const nominal = kwInv * inverters;
        out.push({
            level: 'info',
            text: `${dec(kwp)} kWp ÷ ${dec(nominal)} kW de inversor = ${dec(kwp / nominal)}.`,
        });
    }
    // Importe de cada pago
    if (importe) {
        const parts = split.map((p) => `${dec(p)} % = ${eur.format((importe * p) / 100)}`);
        out.push({ level: 'info', text: `Pagos: ${parts.join(' · ')}.` });
    }
    else {
        out.push({ level: 'info', text: 'Falta el importe total del contrato.' });
    }
    return out;
}
