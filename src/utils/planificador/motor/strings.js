import { COLD_VOC, HOT_VMP, MAX_STRING_PANELS, MIN_STRING_PANELS, stringLimits } from './pasosConfig.js';
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const fmt = (n, digits = 0) => n.toLocaleString('es-ES', { maximumFractionDigits: digits });
let counter = 0;
export const newStringId = () => `s-${Date.now().toString(36)}-${(counter++).toString(36)}`;
/** Entradas MPPT que hay en total: las de cada inversor por cuántos inversores hay. */
export const inputsOf = (inverter, units) => Math.max(1, (num(inverter.attrs.n_mppt) ?? 1) * Math.max(1, units));
/**
 * El reparto automático: el menor número de strings que dejan todos dentro de los límites del inversor, iguales si se puede y,
 * si no, con una diferencia de un panel entre ellos. Los strings se reparten entre las entradas una a una.
 */
export function autoStrings(ctx) {
    const n = Math.round(ctx.moduleCount);
    if (n <= 0)
        return [];
    const limits = stringLimits(ctx.panel, ctx.inverter);
    // Sin datos del panel o del inversor, solo manda el máximo de paneles por string; sin ningún largo válido: un solo string con todo, para poder editarlo
    if (limits && (limits.max < limits.min || limits.max < 1))
        return [{ id: 'auto-0', panels: n, input: 1 }];
    const { min, max } = limits ?? { min: MIN_STRING_PANELS, max: MAX_STRING_PANELS };
    const first = Math.max(1, Math.ceil(n / max));
    const last = Math.floor(n / min);
    const inputs = inputsOf(ctx.inverter, ctx.units);
    // Cuántos strings iguales admite cada entrada en paralelo (por corriente de trabajo y de cortocircuito); sin datos, uno
    const imp = num(ctx.panel.attrs.imp_a);
    const isc = num(ctx.panel.attrs.isc_a);
    const imax = num(ctx.inverter.attrs.imax_mppt_a);
    const iscMax = num(ctx.inverter.attrs['x:Corriente de cortocircuito máx. (A)']);
    const byImp = imp !== null && imp > 0 && imax !== null ? Math.floor(imax / imp) : 1;
    const byIsc = isc !== null && isc > 0 && iscMax !== null ? Math.floor(iscMax / isc) : byImp;
    const capacity = inputs * Math.max(1, Math.min(byImp, byIsc));
    const equal = (upTo) => {
        for (let s = first; s <= Math.min(last, upTo); s++)
            if (n % s === 0)
                return s;
        return null;
    };
    const balanced = (upTo) => {
        for (let s = first; s <= Math.min(last, upTo); s++)
            if (Math.floor(n / s) >= min && Math.ceil(n / s) <= max)
                return s;
        return null;
    };
    // El menor número de strings que dejan todo dentro de los límites del inversor y caben en sus entradas: iguales si se puede;
    // si no, con un string por entrada y una diferencia de un panel. Si nada cabe, lo mismo sin mirar las entradas, y el diseño
    // marcará lo que falla.
    const count = equal(capacity) ?? balanced(Math.min(inputs, capacity)) ?? equal(Infinity) ?? balanced(Infinity) ?? first;
    const base = Math.floor(n / count);
    const extra = n % count;
    return Array.from({ length: count }, (_, i) => ({ id: `auto-${i}`, panels: base + (i < extra ? 1 : 0), input: (i % inputs) + 1 }));
}
/**
 * Reparte los paneles del presupuesto por igual entre los strings que hay (los que sobren van de uno en uno a los primeros), sin
 * cambiar cuántos son: sirve tras añadir o quitar un string. Si con el reparto quedarían strings de distinto tamaño en una misma
 * entrada, o hay alguno sin entrada o con una que no existe, se vuelven a asignar las entradas una a una.
 */
export function spreadStrings(design, ctx) {
    const n = Math.round(ctx.moduleCount);
    const k = design.length;
    if (k === 0 || n <= 0)
        return design;
    const spread = design.map((s, i) => ({ ...s, panels: Math.floor(n / k) + (i < n % k ? 1 : 0) }));
    const inputs = inputsOf(ctx.inverter, ctx.units);
    const mixed = spread.some((s) => s.input >= 1 && spread.some((o) => o.input === s.input && o.panels !== s.panels));
    const invalid = spread.some((s) => s.input < 1 || s.input > inputs);
    if (!mixed && !invalid)
        return spread;
    return assignInputs(spread, inputs);
}
/**
 * Asigna una entrada a cada string sin cambiar sus paneles: los strings del mismo tamaño comparten entrada y los de distinto tamaño
 * van a entradas distintas (si hay entradas para eso).
 */
export function assignInputs(spread, inputs) {
    // Las entradas que sobran se dan al grupo con más strings por entrada
    const groups = [...new Set(spread.map((s) => s.panels))].map((panels) => spread.flatMap((s, i) => (s.panels === panels ? [i] : [])));
    if (groups.length > inputs)
        return spread.map((s, i) => ({ ...s, input: (i % inputs) + 1 }));
    const per = groups.map(() => 1);
    for (let spare = inputs - groups.length; spare > 0; spare--) {
        let best = -1;
        groups.forEach((g, k) => {
            if (g.length > per[k] && (best < 0 || g.length / per[k] > groups[best].length / per[best]))
                best = k;
        });
        if (best < 0)
            break;
        per[best]++;
    }
    const out = spread.map((s) => ({ ...s }));
    let next = 1;
    groups.forEach((g, k) => {
        g.forEach((idx, j) => (out[idx].input = next + (j % per[k])));
        next += per[k];
    });
    return out;
}
// ---- Con el inventario: qué inversores admiten unos strings ya diseñados ------------------------------------------------
/** Si un diseño vale con este panel e inversor (analyzeStrings sin problemas), sin montar los mensajes: para probar muchos inversores deprisa. */
function isValidDesign(design, ctx) {
    const limits = stringLimits(ctx.panel, ctx.inverter);
    if (!limits || design.length === 0)
        return false;
    const inputs = inputsOf(ctx.inverter, ctx.units);
    const imp = num(ctx.panel.attrs.imp_a);
    const isc = num(ctx.panel.attrs.isc_a);
    const imax = num(ctx.inverter.attrs.imax_mppt_a);
    const iscMax = num(ctx.inverter.attrs['x:Corriente de cortocircuito máx. (A)']);
    const byInput = new Map();
    let total = 0;
    for (const s of design) {
        if (!(s.panels >= limits.min && s.panels <= limits.max) || s.input < 1 || s.input > inputs)
            return false;
        total += s.panels;
        const g = byInput.get(s.input);
        if (!g)
            byInput.set(s.input, { size: s.panels, count: 1 });
        else if (g.size !== s.panels)
            return false;
        else
            g.count++;
    }
    for (const g of byInput.values()) {
        if (imp !== null && imax !== null && imp * g.count > imax)
            return false;
        if (isc !== null && iscMax !== null && isc * g.count > iscMax)
            return false;
    }
    return total === Math.round(ctx.moduleCount);
}
/**
 * Si los strings ya diseñados valen con este inversor: con cuántos inversores de ese modelo (los menos posibles) y con las entradas
 * asignadas. null si algún string no cabe en su rango de tensiones o las corrientes de una entrada se pasan.
 */
export function fitStrings(design, panel, inverter, moduleCount) {
    if (design.length === 0 || !stringLimits(panel, inverter))
        return null;
    for (let units = 1; units <= design.length; units++) {
        const ctx = { panel, inverter, units, moduleCount };
        const assigned = assignInputs(design, inputsOf(inverter, units));
        if (isValidDesign(assigned, ctx))
            return { units, design: assigned };
    }
    return null;
}
/** Comprueba un diseño contra el panel y el inversor: tensiones, entradas, corrientes y que sumen los paneles del presupuesto. */
export function analyzeStrings(design, ctx) {
    const p = ctx.panel.attrs;
    const inv = ctx.inverter.attrs;
    const voc = num(p.voc_v);
    const vmp = num(p.vmp_v);
    const isc = num(p.isc_a);
    const imp = num(p.imp_a);
    const mpptMin = num(inv.mppt_min_v);
    const mpptMax = num(inv.mppt_max_v);
    const vmax = num(inv.vmax_v);
    const imax = num(inv.imax_mppt_a);
    const iscMax = num(inv['x:Corriente de cortocircuito máx. (A)']);
    const limits = stringLimits(ctx.panel, ctx.inverter);
    const inputsAvailable = inputsOf(ctx.inverter, ctx.units);
    const strings = design.map((s) => {
        const problems = [];
        const vocCold = voc !== null ? s.panels * voc * COLD_VOC : null;
        const vmpHot = vmp !== null ? s.panels * vmp * HOT_VMP : null;
        if (!(s.panels >= 1))
            problems.push('No tiene paneles.');
        else if (s.panels < MIN_STRING_PANELS)
            problems.push(`Un string no puede llevar menos de ${MIN_STRING_PANELS} paneles y este lleva ${s.panels}.`);
        else if (s.panels > MAX_STRING_PANELS)
            problems.push(`Un string no puede llevar más de ${MAX_STRING_PANELS} paneles y este lleva ${s.panels}.`);
        else if (limits) {
            if (s.panels < limits.min) {
                problems.push(`${s.panels} paneles dan unos ${fmt(vmpHot ?? 0)} V en el día más caluroso y el inversor arranca desde ${fmt(mpptMin ?? 0)} V: hacen falta al menos ${limits.min}.`);
            }
            else if (s.panels > limits.max) {
                problems.push(vocCold !== null && vmax !== null && vocCold > vmax
                    ? `En el día más frío llegaría a ${fmt(vocCold)} V y el inversor admite ${fmt(vmax)} V: como máximo ${limits.max} paneles.`
                    : `Trabajaría a ${fmt(s.panels * (vmp ?? 0))} V y el rango MPPT acaba en ${fmt(mpptMax ?? 0)} V: como máximo ${limits.max} paneles.`);
            }
        }
        if (s.input < 1)
            problems.push('Sin entrada asignada.');
        else if (s.input > inputsAvailable) {
            problems.push(`La entrada ${s.input} no existe: el inversor tiene ${inputsAvailable}${ctx.units > 1 ? ` (${ctx.units} inversores)` : ''}.`);
        }
        return { id: s.id, panels: s.panels, input: s.input, vocCold, vmpHot, problems };
    });
    // Entradas: los strings que comparten una se conectan en paralelo, así que tienen que ser iguales y sus corrientes se suman
    const inputs = [];
    const used = [...new Set(design.filter((s) => s.input >= 1).map((s) => s.input))].sort((a, b) => a - b);
    for (const input of used) {
        const group = design.filter((s) => s.input === input);
        const problems = [];
        const sizes = [...new Set(group.map((s) => s.panels))];
        if (group.length > 1 && sizes.length > 1) {
            problems.push(`La entrada ${input} mezcla strings de ${sizes.join(' y ')} paneles: en paralelo tienen que ser iguales; ponlos en entradas distintas.`);
        }
        const totalImp = imp !== null ? imp * group.length : null;
        const totalIsc = isc !== null ? isc * group.length : null;
        if (totalImp !== null && imax !== null && totalImp > imax) {
            problems.push(`La entrada ${input} recibe ${group.length} strings en paralelo: ${fmt(totalImp, 1)} A y admite ${fmt(imax, 1)} A.`);
        }
        if (totalIsc !== null && iscMax !== null && totalIsc > iscMax) {
            problems.push(`La entrada ${input} da ${fmt(totalIsc, 1)} A de cortocircuito con ${group.length} strings y admite ${fmt(iscMax, 1)} A.`);
        }
        inputs.push({ input, strings: group.length, imp: totalImp, isc: totalIsc, problems });
    }
    const total = design.reduce((sum, s) => sum + (s.panels > 0 ? s.panels : 0), 0);
    const target = Math.round(ctx.moduleCount);
    const problems = [];
    if (design.length === 0 && target > 0)
        problems.push('Todavía no hay strings: reparte los paneles.');
    else if (total !== target) {
        problems.push(total < target
            ? `Los strings suman ${total} paneles y el presupuesto lleva ${target}: faltan ${target - total}.`
            : `Los strings suman ${total} paneles y el presupuesto lleva ${target}: sobran ${total - target}.`);
    }
    return { strings, inputs, total, missing: target - total, inputsAvailable, limits, problems };
}
/** Los problemas de «esta entrada no existe» se juntan en uno solo (con 26 strings y un inversor eran decenas de líneas iguales). */
export const isMissingInput = (message) => message.includes('no existe: el inversor');
/** Un único aviso para todos los strings que van a entradas que el inversor no tiene; null si no hay ninguno. */
export function missingInputsProblem(report) {
    const lost = report.strings.flatMap((s, i) => (s.input > report.inputsAvailable ? [i + 1] : []));
    if (lost.length === 0)
        return null;
    const last = Math.max(...report.strings.map((s) => s.input));
    return `${lost.length} string${lost.length === 1 ? '' : 's'} (${lost.length > 6 ? `del ${lost[0]} al ${lost[lost.length - 1]}` : lost.join(', ')}) van a entradas que no existen: hay ${report.inputsAvailable} entrada${report.inputsAvailable === 1 ? '' : 's'} y usan hasta la ${last}. Faltan inversores.`;
}
/** Todos los problemas de un diseño, cada uno con el string o la entrada a la que se refiere. */
export function reportProblems(report) {
    const missing = missingInputsProblem(report);
    return [
        ...report.problems,
        ...(missing ? [missing] : []),
        ...report.strings.flatMap((s, i) => s.problems.filter((m) => !isMissingInput(m)).map((m) => `String ${i + 1}: ${m}`)),
        ...report.inputs.flatMap((i) => i.problems),
    ];
}
/**
 * Las grapas de la estructura que salen del diseño de strings, con dos raíles por fila y cada tramo de string en una fila (un
 * string partida son varios tramos): cada fila lleva 2 grapas finales por raíl (4) y una intermedia por raíl en cada unión entre
 * paneles contiguos (2 por unión).
 */
export function clampTotals(design) {
    const used = design.filter((s) => s.panels > 0);
    const rows = used.reduce((sum, s) => sum + Math.min(Math.max(1, s.parts ?? 1), s.panels), 0);
    const panels = used.reduce((sum, s) => sum + s.panels, 0);
    return { rows, panels, finals: 4 * rows, intermediates: 2 * (panels - rows) };
}
/** Los strings que hay ahora: los creados en el diseñador; ninguno mientras no se hayan repartido. */
export const effectiveStrings = (design) => design ?? [];
/** Reparte los paneles por igual entre los strings que hay (los que sobren van de uno en uno a los primeros), sin mirar ningún inversor. */
export function spreadPanels(design, moduleCount) {
    const n = Math.round(moduleCount);
    const k = design.length;
    if (k === 0 || n <= 0)
        return design;
    return design.map((s, i) => ({ ...s, panels: Math.floor(n / k) + (i < n % k ? 1 : 0) }));
}
/** `count` strings con los paneles repartidos por igual (conservando los que ya había); con inversor, además cada uno en su entrada. */
export function createStrings(count, current, moduleCount, ctx) {
    const base = Array.from({ length: count }, (_, i) => current[i] ?? { id: newStringId(), panels: 0, input: 0 });
    return ctx ? spreadStrings(base, ctx) : spreadPanels(base, moduleCount);
}
/** «2 strings: 20 + 5 paneles» (o «1 string de 12 paneles»), para el PDF y para enseñarlo resumido. */
export function summarizeStrings(design) {
    const list = design.filter((s) => s.panels > 0);
    if (list.length === 0)
        return '';
    if (list.length === 1)
        return `1 string de ${fmt(list[0].panels)} paneles`;
    const sizes = list.map((s) => s.panels);
    const equal = sizes.every((n) => n === sizes[0]);
    if (equal)
        return `${list.length} strings de ${fmt(sizes[0])} paneles`;
    if (list.length <= 4)
        return `${list.length} strings: ${sizes.join(' + ')} paneles`;
    // Con muchos strings no se listan uno a uno: se agrupan por tamaño («6 de 17 y 14 de 16 paneles»)
    const groups = [...new Set(sizes)].sort((a, b) => b - a).map((size) => ({ size, count: sizes.filter((n) => n === size).length }));
    if (groups.length > 3)
        return `${list.length} strings de ${Math.min(...sizes)} a ${Math.max(...sizes)} paneles`;
    return `${list.length} strings: ${groups.map((g) => `${g.count} de ${g.size}`).join(' y ')} paneles`;
}
