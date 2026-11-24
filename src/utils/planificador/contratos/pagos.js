// Forma de pago: la habitual del contrato modelo o una personalizada (las etapas y porcentajes que
// decida administración). La validación definitiva la hace el servidor; aquí solo se guía al teclear.
export const STANDARD_STAGES = [
    { label: 'A la firma del contrato', note: 'Reserva del material', percent: 30 },
    { label: 'A la recepción del material', note: 'Inicio de obra', percent: 40 },
    { label: 'A la colocación de los paneles', note: 'Avance de obra', percent: 20 },
    { label: 'A la puesta en marcha', note: 'Al acabar la instalación', percent: 10 },
];
export const STANDARD_PLAN = { mode: 'standard', stages: STANDARD_STAGES };
// Texto que se sugiere en cada pago según cuántos haya: con uno, «Pago único»; con más, los últimos de los cuatro
// habituales. Es solo una sugerencia: cada pago se puede escribir como se quiera, y el contrato usa lo escrito.
const SUGGESTED_TEXTS = ['Reserva del material', 'Inicio de obra', 'Avance de obra', 'Al acabar la instalación'];
const SINGLE_TEXT = 'Pago único';
export function suggestedTexts(count) {
    if (count === 1)
        return [SINGLE_TEXT];
    if (count >= 2 && count <= SUGGESTED_TEXTS.length)
        return SUGGESTED_TEXTS.slice(-count);
    return null;
}
const norm = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
// Lo que cuenta como «sin tocar»: vacío, alguna sugerencia o el concepto largo de antes.
const UNTOUCHED = new Set(['', SINGLE_TEXT, ...SUGGESTED_TEXTS, ...STANDARD_STAGES.map((s) => s.label), 'A la finalización de la obra'].map(norm));
/**
 * Al cambiar el número de pagos, los que siguen con su texto sugerido (o vacío) pasan a llevar el que corresponde
 * ahora; los que se hayan escrito a mano se respetan tal cual. Conserva los porcentajes.
 */
export function withSuggestedTexts(stages) {
    const texts = suggestedTexts(stages.length);
    return stages.map((s, i) => ({
        ...s,
        label: texts && UNTOUCHED.has(norm(s.label)) ? texts[i] : s.label,
        note: '',
    }));
}
export const MAX_STAGES = 12;
const toNumber = (value) => {
    if (typeof value === 'number')
        return value;
    const n = Number(value.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
};
export const stagePercent = (stage) => toNumber(stage.percent);
export function planPercents(plan) {
    return plan.stages.map(stagePercent).filter((n) => Number.isFinite(n));
}
export function planTotal(plan) {
    return Math.round(planPercents(plan).reduce((a, b) => a + b, 0) * 100) / 100;
}
const round2 = (n) => Math.round(n * 100) / 100;
const pctOf = (s) => {
    const n = stagePercent(s);
    return Number.isFinite(n) ? n : 0;
};
/**
 * Cambia el porcentaje de un pago y reparte la diferencia para que la suma siga siendo 100 %: la absorbe
 * el pago anterior (el último, si se cambia el primero). Si el anterior no tiene tanto que ceder, se
 * queda en 0 y el resto se toma del que va antes, y así hacia atrás.
 */
export function applyPercentEdit(stages, index, text) {
    const out = stages.map((s, i) => (i === index ? { ...s, percent: text } : s));
    const n = out.length;
    if (n < 2)
        return out;
    // Quién absorbe la diferencia, del más cercano al más lejano.
    const absorbers = [];
    if (index > 0)
        for (let j = index - 1; j >= 0; j--)
            absorbers.push(j);
    else
        for (let j = n - 1; j >= 1; j--)
            absorbers.push(j);
    const fixed = out.reduce((sum, s, i) => (absorbers.includes(i) ? sum : sum + pctOf(s)), 0);
    const current = absorbers.reduce((sum, j) => sum + pctOf(out[j]), 0);
    let delta = round2(100 - fixed - current); // lo que hay que sumar (+) o quitar (−) a los que absorben
    for (const j of absorbers) {
        if (Math.abs(delta) < 0.005)
            break;
        const before = pctOf(out[j]);
        const after = delta > 0 ? before + delta : Math.max(0, before + delta);
        out[j] = { ...out[j], percent: String(round2(after)) };
        delta = round2(delta - (after - before));
    }
    return out;
}
/** Tras quitar un pago, su porcentaje pasa al último para seguir sumando 100 %. */
export function settleOnLast(stages) {
    if (stages.length === 0)
        return stages;
    const last = stages.length - 1;
    const others = stages.reduce((sum, s, i) => (i === last ? sum : sum + pctOf(s)), 0);
    return stages.map((s, i) => (i === last ? { ...s, percent: String(Math.max(0, round2(100 - others))) } : s));
}
/** Por qué la forma de pago no se puede guardar, o null si está bien. */
export function planProblem(plan) {
    if (plan.mode === 'standard')
        return null;
    if (plan.stages.length === 0)
        return 'Añade al menos un pago.';
    if (planTotal(plan) > 100.01)
        return `Los porcentajes fijados suman ${planTotal(plan)} %: pasan de 100 %.`;
    for (const s of plan.stages) {
        if (!s.label.trim())
            return 'Indica a qué corresponde cada pago.';
        const p = stagePercent(s);
        if (!Number.isFinite(p) || p <= 0 || p > 100)
            return `El porcentaje de «${s.label.trim()}» debe estar entre 0 y 100.`;
    }
    const total = planTotal(plan);
    if (Math.abs(total - 100) > 0.01)
        return `Los porcentajes suman ${total} %: deben sumar exactamente 100 %.`;
    return null;
}
/** Lo que se envía al servidor. */
export function planPayload(plan) {
    if (plan.mode === 'standard')
        return { mode: 'standard' };
    return {
        mode: 'custom',
        stages: plan.stages.map((s) => ({ label: s.label.trim(), note: '', percent: stagePercent(s) })),
    };
}
