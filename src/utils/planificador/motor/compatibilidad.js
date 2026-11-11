import { effectiveQty, isPerModule, lineName, newLine } from './costes.js';
import { fuseKind, fuseNeed, fuseReason } from './protecciones.js';
import { analyzeStrings, autoStrings, clampTotals, effectiveStrings, fitStrings, reportProblems, spreadPanels, spreadStrings, summarizeStrings } from './strings.js';
import { batteryCompat, COLD_VOC, ROOF_ITEM_VALUES, ROOF_LABEL, stringPlan } from './pasosConfig.js';
/** Reglas cuyo error es una incompatibilidad de fondo (el resto depende de cantidades o de la potencia y solo avisa). */
const HARD_RULES = new Set([
    'strings-imposible', 'optimizador-marca', 'medidor-fases', 'suministro', 'bateria', 'estructura-marco',
    'prot-tension', 'prot-corriente', 'cable-dc-seccion', 'cable-ac-seccion', 'ac-calibre', 'ac-polos',
]);
// ---- Ayudas ----------------------------------------------------------------------------------------------------------
const num = (v) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v.replace(',', '.')) : NaN;
    return Number.isFinite(n) ? n : null;
};
const txt = (v) => String(v ?? '').trim();
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const has = (v, fragment) => norm(txt(v)).includes(fragment);
const fmt = (n, digits = 1) => n.toLocaleString('es-ES', { maximumFractionDigits: digits });
/** Fases de un inversor o medidor: 1 (monofásico), 3 (trifásico) o null si no se sabe. */
function phasesOf(item) {
    const f = norm(txt(item.attrs.fases));
    if (f.startsWith('mono') || f === '1')
        return 1;
    if (f.startsWith('tri') || f === '3')
        return 3;
    return null;
}
/** Corriente admisible (A) de un conductor de cobre por su sección, para alterna (en tubo) y para cable solar al aire. */
const AMPACITY_AC = [[1.5, 15], [2.5, 21], [4, 27], [6, 36], [10, 50], [16, 66], [25, 84], [35, 104], [50, 125], [70, 160], [95, 194]];
const AMPACITY_DC = [[2.5, 30], [4, 44], [6, 57], [10, 79], [16, 107], [25, 142], [35, 175]];
function ampacity(table, section) {
    const row = table.find(([s]) => s === section) ?? [...table].reverse().find(([s]) => s <= section);
    return row ? row[1] : null;
}
// ---- Las reglas ------------------------------------------------------------------------------------------------------
/**
 * El diseño de strings que vale ahora en el presupuesto (el hecho a medida o el automático), para el PDF. Vacío si no hay panel
 * o inversor de strings (con microinversores u optimizadores no hay strings que diseñar) o no hay paneles.
 */
export function currentStrings(state, catalog) {
    const ctx = stringContext(state, catalog);
    return ctx && state.moduleCount > 0 ? effectiveStrings(state.strings) : [];
}
/**
 * Con qué se comprueba el diseño de strings: el panel y el inversor de strings que hay elegidos (con cuántos inversores de ese
 * modelo). null si falta alguno de los dos o si el inversor es un microinversor u optimizador.
 */
/**
 * Los strings del presupuesto tras cambiar los paneles de la instalación: los mismos strings (con su tipo) con los paneles
 * repartidos de nuevo por igual. Si ya suman los paneles que hay, se dejan como están.
 */
export function rebalanceStrings(state, catalog) {
    const design = state.strings;
    const count = Math.round(state.moduleCount);
    if (!design || design.length === 0 || count <= 0)
        return design;
    if (design.reduce((sum, s) => sum + (s.panels > 0 ? s.panels : 0), 0) === count)
        return design;
    const ctx = stringContext(state, catalog);
    return ctx ? spreadStrings(design, ctx) : spreadPanels(design, count);
}
export function stringContext(state, catalog) {
    const byId = new Map(catalog.items.map((i) => [i.id, i]));
    const entries = [];
    for (const line of state.lines) {
        const item = line.itemId ? byId.get(line.itemId) : undefined;
        if (item)
            entries.push({ line, item, qty: effectiveQty(line, state) });
    }
    const panel = entries.find((e) => e.item.category === 'modulos')?.item;
    const central = entries.filter((e) => e.item.category === 'inversores' && !['Microinversor', 'Optimizador'].includes(txt(e.item.attrs.tipo)));
    const inverter = central[0]?.item;
    if (!panel || !inverter)
        return null;
    const units = Math.max(1, central.filter((e) => e.item.id === inverter.id).reduce((s, e) => s + e.qty, 0));
    return { panel, inverter, units, groups: inverterGroupsOf(central), moduleCount: state.moduleCount };
}
/** Los modelos de inversor de strings del presupuesto con sus unidades, en el orden de las filas (varios modelos = entradas seguidas). */
function inverterGroupsOf(central) {
    const groups = [];
    for (const e of central) {
        const g = groups.find((x) => x.item.id === e.item.id);
        if (g)
            g.units += e.qty;
        else
            groups.push({ item: e.item, units: e.qty });
    }
    return groups.map((g) => ({ item: g.item, units: Math.max(1, g.units) }));
}
/**
 * Con strings repartidos y un inversor de strings con su panel: si las entradas de los inversores que hay no bastan, sube las
 * unidades del inversor a las que hacen falta (nunca las baja) y reasigna las entradas de los strings entre todos. null si no
 * hay que cambiar nada o si los strings no valen con ese inversor (eso lo avisa la compatibilidad).
 */
export function sizeInverters(state, catalog) {
    const ctx = stringContext(state, catalog);
    if (!ctx || !state.strings || state.strings.length === 0 || state.moduleCount <= 0)
        return null;
    // Con varios modelos de inversor ya elegidos a mano, no se ajustan unidades solas: es una combinación decidida por quien presupuesta
    if (ctx.groups.length > 1)
        return null;
    const fit = fitStrings(state.strings, ctx.panel, ctx.inverter, state.moduleCount);
    if (!fit || fit.units <= ctx.units)
        return null;
    const first = state.lines.find((l) => l.itemId === ctx.inverter.id);
    if (!first)
        return null;
    const extra = fit.units - ctx.units;
    return {
        ...state,
        strings: fit.design,
        lines: state.lines.map((l) => (l.id === first.id ? { ...l, qty: effectiveQty(l, state) + extra } : l)),
    };
}
export function checkCompatibility(state, catalog) {
    const byId = new Map(catalog.items.map((i) => [i.id, i]));
    const entries = [];
    for (const line of state.lines) {
        const item = line.itemId ? byId.get(line.itemId) : undefined;
        if (item)
            entries.push({ line, item, qty: effectiveQty(line, state) });
    }
    const cat = (key) => entries.filter((e) => e.item.category === key);
    const name = (e) => lineName(e.line);
    const names = (es) => [...new Set(es.map(name))].join(' y ');
    const sum = (es) => es.reduce((s, e) => s + e.qty, 0);
    const issues = [];
    const add = (level, key, step, message, ...affected) => {
        const lineIds = [...new Set(affected.flat().map((e) => e.line.id))];
        if (lineIds.length === 0)
            return;
        const id = `${key}|${lineIds.join(',')}`;
        if (!issues.some((i) => i.id === id))
            issues.push({ id, level, message, lineIds, step, hard: level === 'error' && HARD_RULES.has(key.split('|')[0]) });
    };
    const modules = cat('modulos');
    const inverters = cat('inversores');
    const micro = inverters.filter((e) => txt(e.item.attrs.tipo) === 'Microinversor');
    const optimizers = inverters.filter((e) => txt(e.item.attrs.tipo) === 'Optimizador');
    const central = inverters.filter((e) => !micro.includes(e) && !optimizers.includes(e)); // inversores de strings o híbridos
    const panel = modules[0]?.item;
    const inverter = central[0]?.item;
    const n = state.moduleCount;
    const survey = state.survey;
    // --- Paneles
    if (new Set(modules.map((e) => e.item.id)).size > 1) {
        add('warn', 'paneles-mezclados', 'paneles', `Hay modelos de panel distintos (${names(modules)}): dentro de un mismo string no se mezclan y el presupuesto calcula con una sola potencia.`, modules);
    }
    for (const e of modules) {
        if (!e.line.auto && e.qty !== n) {
            add('warn', 'paneles-cantidad', 'paneles', `${name(e)}: la fila tiene ${fmt(e.qty, 0)} unidades y el presupuesto calcula con ${n} paneles.`, [e]);
        }
    }
    // --- Paneles ↔ inversor de strings
    // Los inversores de este modelo (cada uno con sus entradas MPPT) y el diseño de strings a medida, si lo hay
    const inverterUnits = Math.max(1, central.filter((e) => e.item.id === inverter?.id).reduce((s, e) => s + e.qty, 0));
    const plan = panel && inverter ? stringPlan(panel, inverter, n, inverterUnits) : null;
    if (plan) {
        if (plan.length === null) {
            // Ningún largo de string vale con este panel y este inversor: es una incompatibilidad de fondo, haya o no diseño
            for (const p of plan.problems)
                add('error', `strings-imposible|${p}`, 'inversor', `${names(modules)} con ${name(central[0])}: ${p}`, modules, [central[0]]);
        }
        else if (panel && inverter) {
            // Se comprueba el diseño que se ha creado (si todavía no hay strings, no hay nada que comprobar): tensiones, entradas,
            // corrientes y que sumen los paneles
            // Con varios modelos de inversor, las entradas se cuentan entre todos y cada string se comprueba con el de su entrada
            const groups = inverterGroupsOf(central);
            for (const g of groups.slice(1)) {
                const other = stringPlan(panel, g.item, n, g.units);
                if (other && other.length === null) {
                    const e = central.find((c) => c.item.id === g.item.id);
                    for (const p of other.problems)
                        add('error', `strings-imposible|${p}`, 'inversor', `${names(modules)} con ${name(e)}: ${p}`, modules, [e]);
                }
            }
            const ctx = { panel, inverter, units: inverterUnits, groups, moduleCount: n };
            const report = state.strings ? analyzeStrings(state.strings, ctx) : null;
            for (const p of report ? reportProblems(report) : [])
                add('error', `strings-diseno|${p}`, 'inversor', `${names(modules)} con ${groups.length > 1 ? names(central) : name(central[0])}: ${p}`, modules, groups.length > 1 ? central : [central[0]]);
        }
    }
    // Potencia: la de los paneles frente a la del inversor
    const kwp = (state.moduleWp * n) / 1000;
    const acKw = central.reduce((s, e) => s + e.qty * (num(e.item.attrs.potencia_kw) ?? 0), 0);
    if (kwp > 0 && acKw > 0) {
        const ratio = kwp / acKw;
        if (ratio > 1.5) {
            add('error', 'dcac', 'inversor', `Los paneles suman ${fmt(kwp, 2)} kWp y ${names(central)} da ${fmt(acKw, 2)} kW: ${fmt(ratio, 2)} veces, demasiado por encima (lo habitual es hasta 1,3).`, modules, central);
        }
        else if (ratio > 1.35) {
            add('warn', 'dcac', 'inversor', `Los paneles suman ${fmt(kwp, 2)} kWp y ${names(central)} da ${fmt(acKw, 2)} kW (${fmt(ratio, 2)} veces): por encima de lo habitual (hasta 1,3).`, modules, central);
        }
        else if (ratio < 0.7) {
            add('warn', 'dcac', 'inversor', `${names(central)} da ${fmt(acKw, 2)} kW para ${fmt(kwp, 2)} kWp de paneles: el inversor es muy grande para esta potencia.`, modules, central);
        }
    }
    for (const e of central) {
        // El dato propio de la característica «Potencia DC máx.» es el límite; la «recomendada» de la ficha es una pauta (aviso)
        const dcMax = num(e.item.attrs.potencia_dc_max_kw);
        const recommended = num(e.item.attrs['x:Potencia FV máx. recomendada (Wp)']);
        if (dcMax !== null && kwp > dcMax * e.qty) {
            add('error', 'dc-max', 'inversor', `${name(e)} admite como máximo ${fmt(dcMax * e.qty, 2)} kW de paneles en continua y hay ${fmt(kwp, 2)} kWp.`, modules, [e]);
        }
        else if (dcMax === null && recommended !== null && kwp > (recommended / 1000) * e.qty) {
            add('warn', 'dc-max', 'inversor', `${name(e)} recomienda como máximo ${fmt((recommended / 1000) * e.qty, 2)} kW de paneles y hay ${fmt(kwp, 2)} kWp.`, modules, [e]);
        }
    }
    // --- Microinversores y optimizadores: uno por cada tantos paneles, y los optimizadores con su inversor
    for (const e of [...micro, ...optimizers]) {
        const per = num(e.item.attrs.paneles_por_unidad);
        if (per !== null && per > 0 && n > 0 && e.qty < Math.ceil(n / per)) {
            add('error', 'micro-cantidad', 'inversor', `${name(e)} lleva ${per === 1 ? 'una unidad por panel' : `una unidad por cada ${per} paneles`}: para ${n} paneles hacen falta ${Math.ceil(n / per)} y hay ${fmt(e.qty, 0)}.`, [e], modules);
        }
    }
    for (const o of optimizers) {
        const other = central.filter((c) => norm(c.item.brand) !== norm(o.item.brand));
        if (other.length > 0 && o.item.brand) {
            add('error', 'optimizador-marca', 'inversor', `Los optimizadores ${name(o)} solo funcionan con inversores de ${o.item.brand} y hay ${names(other)}.`, [o], other);
        }
    }
    // --- Fases: suministro, inversor, medidor
    const invPhases = inverter ? phasesOf(inverter) : null;
    if (inverter && invPhases === 3 && survey.supply === 'monofasico') {
        add('error', 'suministro', 'inversor', `${name(central[0])} es trifásico y el suministro del cliente es monofásico.`, [central[0]]);
    }
    if (inverter && invPhases === 1 && acKw > 5) {
        add('warn', 'mono-5kw', 'inversor', `${name(central[0])} es monofásico y da ${fmt(acKw, 1)} kW: en España la potencia monofásica de inyección se limita a 5 kW; por encima hay que repartirla entre fases.`, [central[0]]);
    }
    const meters = cat('contadores');
    for (const m of meters) {
        const mp = phasesOf(m.item);
        if (mp !== null && invPhases !== null && mp !== invPhases) {
            add('error', 'medidor-fases', 'inversor', `${name(m)} es ${mp === 1 ? 'monofásico' : 'trifásico'} y ${name(central[0])} es ${invPhases === 1 ? 'monofásico' : 'trifásico'}.`, [m], [central[0]]);
        }
        if (mp === 3 && survey.supply === 'monofasico') {
            add('warn', 'medidor-suministro', 'inversor', `${name(m)} es trifásico y el suministro del cliente es monofásico.`, [m]);
        }
    }
    if (sum(meters) > 1) {
        add('warn', 'medidor-cantidad', 'inversor', `Hay ${fmt(sum(meters), 0)} medidores (${names(meters)}): se pone uno por instalación, en el punto de conexión.`, meters);
    }
    // Medidores y dispositivos de comunicación de una marca de inversores: suelen funcionar solo con esa marca
    const invBrands = new Set(catalog.items.filter((i) => i.category === 'inversores').map((i) => norm(i.brand)).filter(Boolean));
    for (const e of [...meters, ...cat('monitorizacion')]) {
        const brand = norm(e.item.brand);
        const compatible = norm(txt(e.item.attrs.compatible));
        if (inverter && brand && invBrands.has(brand) && brand !== norm(inverter.brand) && !compatible.includes(norm(inverter.brand))) {
            add('warn', 'marca-comunicacion', 'inversor', `${name(e)} es de ${e.item.brand} y ${name(central[0])} de ${inverter.brand}: estos equipos suelen funcionar solo con inversores de su marca.`, [e], [central[0]]);
        }
    }
    // --- Baterías
    const batteries = cat('baterias');
    const batModules = batteries.filter((e) => has(e.item.attrs.componente, 'modulo'));
    const controllers = batteries.filter((e) => has(e.item.attrs.componente, 'controlador'));
    if (inverter) {
        for (const b of batteries) {
            if (b.item.attrs.compatible === undefined)
                continue;
            const c = batteryCompat(b.item, inverter);
            if (!c.ok)
                add('error', `bateria|${b.item.id}`, 'baterias', `${name(b)} con ${name(central[0])}: ${c.reason}`, [b], [central[0]]);
        }
    }
    if (new Set(batModules.map((e) => e.item.id)).size > 1) {
        add('warn', 'baterias-mezcla', 'baterias', `Hay modelos de batería distintos (${names(batModules)}): no se mezclan capacidades ni modelos en una misma instalación.`, batModules);
    }
    const controllerBrands = new Set(catalog.items.filter((i) => i.category === 'baterias' && has(i.attrs.componente, 'controlador')).map((i) => norm(i.brand)));
    for (const b of batModules) {
        const brand = norm(b.item.brand);
        if (controllerBrands.has(brand) && !controllers.some((c) => norm(c.item.brand) === brand)) {
            add('warn', 'bateria-controlador', 'baterias', `${name(b)} necesita un controlador o módulo de potencia de ${b.item.brand} y no hay ninguno elegido.`, [b]);
        }
    }
    for (const c of controllers) {
        const max = num(c.item.attrs.modulos_max);
        const mods = batModules.filter((b) => norm(b.item.brand) === norm(c.item.brand));
        const same = controllers.filter((x) => norm(x.item.brand) === norm(c.item.brand));
        if (max !== null && sum(mods) > max * sum(same)) {
            add('error', 'bateria-modulos', 'baterias', `${name(c)} admite ${fmt(max, 0)} módulos de batería cada uno y hay ${fmt(sum(mods), 0)} módulos para ${fmt(sum(same), 0)} controlador${sum(same) === 1 ? '' : 'es'}.`, same, mods);
        }
    }
    const kwh = batModules.reduce((s, e) => s + e.qty * (num(e.item.attrs.capacidad_kwh) ?? 0), 0);
    for (const e of central) {
        const max = num(e.item.attrs.bat_kwh_max);
        if (max !== null && kwh > max * e.qty) {
            add('error', 'bateria-kwh', 'baterias', `${name(e)} admite como máximo ${fmt(max * e.qty, 1)} kWh de batería y hay ${fmt(kwh, 1)} kWh.`, [e], batModules);
        }
    }
    if (survey.futureBattery && inverter && batteries.length === 0) {
        const ok = txt(inverter.attrs.hibrido) === 'Sí' || txt(inverter.attrs.tipo) === 'Híbrido';
        if (!ok)
            add('warn', 'futuro-bateria', 'inversor', `Se prevén baterías más adelante y ${name(central[0])} no es híbrido.`, [central[0]]);
    }
    // --- Estructura
    const roof = ROOF_ITEM_VALUES[survey.roof];
    for (const e of cat('estructura')) {
        const roofOf = txt(e.item.attrs.cubierta) || 'Todas';
        if (!roof.includes(roofOf)) {
            add('error', 'cubierta', 'estructura', `${name(e)} es para cubierta ${roofOf.toLowerCase()} y el presupuesto está en cubierta ${ROOF_LABEL[survey.roof].toLowerCase()}.`, [e]);
        }
    }
    for (const e of [...cat('estructura'), ...cat('mano_obra')]) {
        const perKit = num(e.item.attrs.modulos_por_kit);
        const perPanel = num(e.item.attrs.uds_por_panel);
        if (perKit !== null && perKit > 0 && n > 0) {
            const covers = e.qty * perKit;
            if (covers < n)
                add('error', 'estructura-kits', 'estructura', `${name(e)} cubre ${fmt(covers, 0)} paneles (${fmt(e.qty, 0)} × ${fmt(perKit, 0)}) y hay ${n}.`, [e]);
            else if (covers - n >= perKit)
                add('warn', 'estructura-kits', 'estructura', `${name(e)} cubre ${fmt(covers, 0)} paneles y solo hay ${n}: sobra algún kit.`, [e]);
        }
        else if (isPerModule(e.item.unit) && n > 0 && e.qty !== n && !e.line.auto) {
            add('warn', 'estructura-modulos', 'estructura', `${name(e)} se calcula por módulo: tiene ${fmt(e.qty, 0)} y el presupuesto lleva ${n} paneles.`, [e]);
        }
        if (perPanel !== null && perPanel > 0 && n > 0 && e.qty < Math.ceil(n * perPanel)) {
            add('warn', 'estructura-uds', 'estructura', `${name(e)}: hacen falta al menos ${fmt(Math.ceil(n * perPanel), 0)} unidades para ${n} paneles (${fmt(perPanel, 1)} por panel) y hay ${fmt(e.qty, 0)}.`, [e]);
        }
        const thick = num(panel?.attrs.grosor_mm);
        const min = num(e.item.attrs.grosor_min_mm);
        const max = num(e.item.attrs.grosor_max_mm);
        if (thick !== null && ((min !== null && thick < min) || (max !== null && thick > max))) {
            add('error', 'estructura-marco', 'estructura', `${name(e)} admite marcos de ${min ?? '…'} a ${max ?? '…'} mm y el panel tiene ${fmt(thick)} mm.`, [e]);
        }
    }
    // Grapas que pide el diseño de strings (finales e intermedias, cada tramo de string en una fila): si las del presupuesto no llegan, se avisa
    const designed = effectiveStrings(state.strings);
    if (designed.length > 0 && n > 0) {
        const need = clampTotals(designed);
        const clamps = cat('estructura').filter((e) => txt(e.item.attrs.componente) === 'Grapas');
        const have = (word) => clamps.filter((e) => norm(e.item.model).includes(word));
        for (const [word, label, wanted] of [['final', 'finales', need.finals], ['intermedia', 'intermedias', need.intermediates]]) {
            const lines = have(word);
            if (lines.length > 0 && sum(lines) < wanted) {
                add('warn', `grapas-${word}`, 'estructura', `Los strings piden ${fmt(wanted, 0)} grapas ${label} (${fmt(need.rows, 0)} filas, dos raíles por fila) y hay ${fmt(sum(lines), 0)}.`, lines);
            }
        }
    }
    // --- Continua: cable y protecciones
    const isc = num(panel?.attrs.isc_a);
    const cableDc = cat('cableado').filter((e) => txt(e.item.attrs.tipo) === 'CC');
    const cableAc = cat('cableado').filter((e) => txt(e.item.attrs.tipo) === 'AC');
    const red = cableDc.filter((e) => norm(txt(e.item.attrs.color)) === 'rojo');
    const black = cableDc.filter((e) => norm(txt(e.item.attrs.color)) === 'negro');
    if ((red.length > 0) !== (black.length > 0)) {
        add('warn', 'cable-polaridad', 'cableado_cc', `Falta el cable solar de una polaridad: hay ${red.length > 0 ? 'rojo' : 'negro'} (${names([...red, ...black])}) y no ${red.length > 0 ? 'negro' : 'rojo'}.`, [...red, ...black]);
    }
    else if (red.length > 0 && sum(red) !== sum(black)) {
        add('warn', 'cable-polaridad', 'cableado_cc', `Los metros de cable rojo (${fmt(sum(red), 0)}) y negro (${fmt(sum(black), 0)}) no coinciden.`, red, black);
    }
    if (survey.cableMeters > 0) {
        for (const e of [...red, ...black]) {
            if (e.qty < survey.cableMeters)
                add('warn', 'cable-metros', 'cableado_cc', `${name(e)}: hay ${fmt(e.qty, 0)} m y has previsto ${fmt(survey.cableMeters, 0)} m por polaridad.`, [e]);
        }
    }
    if (survey.acMeters > 0) {
        for (const e of cableAc) {
            if (e.qty < survey.acMeters)
                add('warn', 'cable-ac-metros', 'alterna', `${name(e)}: hay ${fmt(e.qty, 0)} m y has previsto ${fmt(survey.acMeters, 0)} m de alterna.`, [e]);
        }
    }
    if (isc !== null) {
        for (const e of cableDc) {
            const section = num(e.item.attrs.seccion_mm2);
            const cap = section !== null ? ampacity(AMPACITY_DC, section) : null;
            if (cap !== null && isc * 1.25 > cap) {
                add('error', 'cable-dc-seccion', 'cableado_cc', `${name(e)} (${fmt(section ?? 0)} mm²) aguanta unos ${cap} A y el string da ${fmt(isc * 1.25, 1)} A (1,25 × Isc).`, [e]);
            }
        }
    }
    // La tensión más alta que verán las protecciones es la del string más largo (con un diseño a medida, el más largo del diseño)
    const longestString = state.strings && state.strings.length > 0 ? Math.max(...state.strings.map((s) => s.panels)) : plan ? (plan.length ?? plan.max) : 0;
    const vocCold = panel && plan && num(panel.attrs.voc_v) !== null ? num(panel.attrs.voc_v) * longestString * COLD_VOC : null;
    for (const e of cat('protecciones').filter((x) => txt(x.item.attrs.tipo) === 'CC')) {
        const el = norm(txt(e.item.attrs.elemento));
        const volts = num(e.item.attrs.tension_v);
        const amps = num(e.item.attrs.corriente_a);
        if (volts !== null && vocCold !== null && volts < vocCold && (el.startsWith('fusible') || el.startsWith('seccion') || el.startsWith('dps'))) {
            add('error', 'prot-tension', 'cableado_cc', `${name(e)} soporta ${fmt(volts, 0)} V y el string puede llegar a ${fmt(vocCold, 0)} V el día más frío (Voc × paneles × 1,12).`, [e]);
        }
        if (amps !== null && isc !== null && (el.startsWith('fusible') || el.startsWith('seccion'))) {
            if (amps < isc * 1.25) {
                add('error', 'prot-corriente', 'cableado_cc', `${name(e)} (${fmt(amps, 0)} A) es pequeño para un panel de Isc ${fmt(isc, 1)} A: tiene que ser, al menos, ${fmt(isc * 1.25, 1)} A.`, [e]);
            }
            else if (el.startsWith('fusible') && (amps < isc * 1.5 || amps > isc * 2.4)) {
                add('warn', 'prot-corriente', 'cableado_cc', `${name(e)} (${fmt(amps, 0)} A): para un panel de Isc ${fmt(isc, 1)} A el fusible suele ir entre ${fmt(isc * 1.5, 1)} y ${fmt(isc * 2.4, 1)} A.`, [e]);
            }
        }
    }
    // --- Alterna: cable y protecciones
    const phases = invPhases ?? (survey.supply === 'trifasico' ? 3 : survey.supply === 'monofasico' ? 1 : null);
    // Corriente de salida del inversor: la de su ficha si el inventario la tiene; si no, la que sale de su potencia y sus fases
    const outputs = central.map((e) => num(e.item.attrs['x:Corriente máx. de salida (A)']));
    const iNom = central.length > 0 && outputs.every((v) => v !== null)
        ? central.reduce((s, e, i) => s + e.qty * outputs[i], 0)
        : acKw > 0 && phases !== null
            ? (acKw * 1000) / (phases === 3 ? Math.sqrt(3) * 400 : 230)
            : null;
    if (iNom !== null) {
        for (const e of cableAc) {
            const section = num(e.item.attrs.seccion_mm2);
            const cap = section !== null ? ampacity(AMPACITY_AC, section) : null;
            if (cap !== null && iNom * 1.25 > cap) {
                add('error', 'cable-ac-seccion', 'alterna', `${name(e)} (${fmt(section ?? 0)} mm²) aguanta unos ${cap} A y el inversor da ${fmt(iNom, 1)} A (hay que dejar un 25 % de margen).`, [e]);
            }
        }
    }
    for (const e of cat('protecciones').filter((x) => txt(x.item.attrs.tipo) === 'AC')) {
        const el = norm(txt(e.item.attrs.elemento));
        if (!el.startsWith('magneto') && !el.includes('diferencial'))
            continue;
        const amps = num(e.item.attrs.corriente_a);
        const poles = num(e.item.attrs.polos);
        if (amps !== null && iNom !== null && el.startsWith('magneto')) {
            if (amps < iNom)
                add('error', 'ac-calibre', 'alterna', `${name(e)} (${fmt(amps, 0)} A) no llega a la corriente del inversor (${fmt(iNom, 1)} A).`, [e]);
            else if (amps < iNom * 1.25)
                add('warn', 'ac-calibre', 'alterna', `${name(e)} (${fmt(amps, 0)} A) va justo para ${fmt(iNom, 1)} A: se deja un 25 % de margen (${fmt(iNom * 1.25, 1)} A).`, [e]);
        }
        if (poles !== null && phases !== null) {
            if (phases === 3 && poles < 3)
                add('error', 'ac-polos', 'alterna', `${name(e)} tiene ${fmt(poles, 0)} polos y la instalación es trifásica (3 o 4).`, [e]);
            if (phases === 1 && poles < 2)
                add('error', 'ac-polos', 'alterna', `${name(e)} tiene ${fmt(poles, 0)} polo y la instalación es monofásica (2).`, [e]);
            if (phases === 1 && poles > 2)
                add('warn', 'ac-polos', 'alterna', `${name(e)} tiene ${fmt(poles, 0)} polos y la instalación es monofásica: bastan 2.`, [e]);
        }
        const ma = num(e.item.attrs.sensibilidad_ma);
        if (el.startsWith('diferencial') && ma !== null && ma > 30) {
            add('warn', 'ac-diferencial', 'alterna', `${name(e)} es de ${fmt(ma, 0)} mA: en autoconsumo se pone de 30 mA.`, [e]);
        }
    }
    // --- Puesta a tierra
    for (const e of cat('tierra')) {
        const section = num(e.item.attrs.seccion_mm2);
        if (section !== null && has(e.item.attrs.componente, 'cable') && section < 6) {
            add('warn', 'tierra-seccion', 'tierra', `${name(e)} es de ${fmt(section)} mm²: el cable de tierra de la estructura y los marcos suele ser de, al menos, 6 mm².`, [e]);
        }
    }
    return issues.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
}
/** Clase CSS del nivel (no `error`: esa clase ya existe en la aplicación y pinta el texto de rojo). */
export const levelClass = (level) => (level === 'error' ? 'bad' : 'warn');
/** Los avisos de cada fila del presupuesto. */
export function issuesByLine(issues) {
    const out = new Map();
    for (const issue of issues)
        for (const id of issue.lineIds)
            out.set(id, [...(out.get(id) ?? []), issue]);
    return out;
}
/** Los avisos de cada producto del catálogo (por si alguna fila del presupuesto es de él). */
export function issuesByItem(issues, state) {
    const lineItem = new Map(state.lines.map((l) => [l.id, l.itemId]));
    const out = new Map();
    for (const issue of issues) {
        for (const lineId of issue.lineIds) {
            const itemId = lineItem.get(lineId);
            if (itemId && !(out.get(itemId) ?? []).includes(issue))
                out.set(itemId, [...(out.get(itemId) ?? []), issue]);
        }
    }
    return out;
}
/**
 * Las unidades con las que se añadiría un inversor de strings al presupuesto `context`: las que hacen falta para las entradas de
 * los strings ya diseñados (con los strings reasignados entre todos), o 1 si no hay diseño o el producto no es de strings.
 */
export function packOf(candidate, context, catalog) {
    const none = { units: 1, strings: context.strings };
    if (candidate.category !== 'inversores' || ['Microinversor', 'Optimizador'].includes(txt(candidate.attrs.tipo)))
        return none;
    const panel = context.lines.map((l) => (l.itemId ? catalog.items.find((i) => i.id === l.itemId) : undefined)).find((i) => i?.category === 'modulos');
    if (!panel || !context.strings || context.strings.length === 0 || context.moduleCount <= 0)
        return none;
    const fit = fitStrings(context.strings, panel, candidate, context.moduleCount);
    return fit ? { units: fit.units, strings: fit.design } : none;
}
/** Los avisos que saldrían al añadir un producto al presupuesto `context` (lo elegido hasta el paso en el que se mira); un inversor, con las unidades que hacen falta para sus strings. */
export function candidateIssues(candidate, context, catalog) {
    const label = catalog.categories.find((c) => c.key === candidate.category)?.label ?? candidate.category;
    const pack = packOf(candidate, context, catalog);
    const line = { ...newLine(candidate, label), id: '__candidato__', qty: pack.units };
    return checkCompatibility({ ...context, strings: pack.strings, lines: [...context.lines, line] }, catalog).filter((i) => i.lineIds.includes(line.id));
}
/**
 * Por qué un producto no casa con lo ya elegido: los avisos de fondo que saldrían al añadirlo al presupuesto `context`.
 * Vacío = encaja o no se sabe (sin datos en el inventario no se oculta nada).
 */
export function hardConflicts(candidate, context, catalog) {
    return candidateIssues(candidate, context, catalog).filter((i) => i.hard).map((i) => i.message);
}
const productName = (i) => [i.brand, i.model].filter(Boolean).join(' ');
/**
 * Lo que CONFIRMA, con datos del inventario, que un producto encaja con lo ya elegido (`state`): una marca que coincide,
 * strings iguales, una tensión que cuadra, un calibre que sobra lo justo… Vacío = no hay nada que lo confirme (puede que
 * falten datos): un producto así no se sugiere, aunque no tenga ningún aviso.
 */
export function fitReasons(item, state, catalog) {
    const byId = new Map(catalog.items.map((i) => [i.id, i]));
    const chosen = (category) => state.lines.flatMap((l) => {
        const it = l.itemId ? byId.get(l.itemId) : undefined;
        return it && it.category === category ? [it] : [];
    });
    const isMicroOrOpt = (i) => ['Microinversor', 'Optimizador'].includes(txt(i.attrs.tipo));
    const panel = chosen('modulos')[0];
    const inverter = chosen('inversores').filter((i) => !isMicroOrOpt(i))[0];
    const n = state.moduleCount;
    const survey = state.survey;
    const sameBrand = (a, b) => !!a.brand && norm(a.brand) === norm(b.brand);
    const out = [];
    const isc = num(panel?.attrs.isc_a);
    const plan = panel && inverter ? stringPlan(panel, inverter, n) : null;
    // La tensión más alta que verán las protecciones es la del string más largo (con un diseño a medida, el más largo del diseño)
    const longestString = state.strings && state.strings.length > 0 ? Math.max(...state.strings.map((s) => s.panels)) : plan ? (plan.length ?? plan.max) : 0;
    const vocCold = panel && plan && num(panel.attrs.voc_v) !== null ? num(panel.attrs.voc_v) * longestString * COLD_VOC : null;
    const kwInv = inverter ? num(inverter.attrs.potencia_kw) : null;
    const phases = inverter ? phasesOf(inverter) : survey.supply === 'trifasico' ? 3 : survey.supply === 'monofasico' ? 1 : null;
    const outputA = inverter ? num(inverter.attrs['x:Corriente máx. de salida (A)']) : null;
    const iNom = outputA ?? (kwInv && phases ? (kwInv * 1000) / (phases === 3 ? Math.sqrt(3) * 400 : 230) : null);
    switch (item.category) {
        case 'inversores': {
            if (isMicroOrOpt(item))
                break;
            if (panel) {
                // Con los strings ya diseñados, si este inversor los admite; si no, el reparto automático de los paneles con este inversor
                const designed = state.strings && state.strings.length > 0 ? state.strings : null;
                if (designed) {
                    const fit = fitStrings(designed, panel, item, n);
                    if (fit)
                        out.push(`admite tus strings (${summarizeStrings(designed)})${fit.units > 1 ? ` con ${fit.units} inversores` : ''}`);
                }
                else {
                    const ctx = { panel, inverter: item, units: 1, moduleCount: n };
                    const auto = autoStrings(ctx);
                    if (n > 0 && auto.length > 0 && reportProblems(analyzeStrings(auto, ctx)).length === 0) {
                        out.push(`${n} paneles en ${summarizeStrings(auto).replace(/ paneles$/, '')}`);
                    }
                }
                const kw = num(item.attrs.potencia_kw);
                const kwp = (state.moduleWp * n) / 1000;
                if (kw && kwp > 0 && kwp / kw >= 0.9 && kwp / kw <= 1.3)
                    out.push(`relación paneles/inversor de ${fmt(kwp / kw, 2)}`);
            }
            const ph = phasesOf(item);
            if (ph !== null && survey.supply && (survey.supply === 'monofasico') === (ph === 1)) {
                out.push(`fases del suministro (${ph === 1 ? 'monofásico' : 'trifásico'})`);
            }
            const mate = [...chosen('contadores'), ...chosen('monitorizacion'), ...chosen('baterias')].find((e) => sameBrand(e, item));
            if (mate)
                out.push(`misma marca que ${productName(mate)}`);
            if (survey.futureBattery && (txt(item.attrs.hibrido) === 'Sí' || txt(item.attrs.tipo) === 'Híbrido'))
                out.push('híbrido, listo para baterías');
            break;
        }
        case 'baterias': {
            if (inverter && item.attrs.compatible !== undefined && batteryCompat(item, inverter).ok)
                out.push(`compatible con ${productName(inverter)}`);
            const t = txt(item.attrs.tension);
            const accepted = inverter ? txt(inverter.attrs.bateria_tension) : '';
            if (t && accepted && [t, 'Ambas'].includes(accepted))
                out.push(`tensión ${t.toLowerCase()}, la que admite el inversor`);
            break;
        }
        case 'contadores':
        case 'monitorizacion': {
            if (inverter && sameBrand(item, inverter))
                out.push(`misma marca que ${productName(inverter)}`);
            const ph = phasesOf(item);
            if (item.category === 'contadores' && ph !== null && phases !== null && ph === phases)
                out.push(`${ph === 1 ? 'monofásico' : 'trifásico'}, como el inversor`);
            break;
        }
        case 'estructura': {
            const roofOf = txt(item.attrs.cubierta) || 'Todas';
            if (roofOf !== 'Todas' && ROOF_ITEM_VALUES[survey.roof].includes(roofOf))
                out.push(`para cubierta ${ROOF_LABEL[survey.roof].toLowerCase()}`);
            const perKit = num(item.attrs.modulos_por_kit);
            if (perKit && n > 0 && n % perKit === 0)
                out.push(`${n / perKit} kit${n / perKit === 1 ? '' : 's'} cubren exactamente los ${n} paneles`);
            const thick = num(panel?.attrs.grosor_mm);
            const min = num(item.attrs.grosor_min_mm);
            const max = num(item.attrs.grosor_max_mm);
            if (thick !== null && (min !== null || max !== null) && (min === null || thick >= min) && (max === null || thick <= max)) {
                out.push(`admite el marco de ${fmt(thick)} mm del panel`);
            }
            break;
        }
        case 'protecciones': {
            const el = norm(txt(item.attrs.elemento));
            const volts = num(item.attrs.tension_v);
            const amps = num(item.attrs.corriente_a);
            const poles = num(item.attrs.polos);
            if (txt(item.attrs.tipo) === 'CC') {
                if (volts !== null && vocCold !== null && volts >= vocCold)
                    out.push(`soporta ${fmt(volts, 0)} V y el string llega a ${fmt(vocCold, 0)} V`);
                if (el.startsWith('fusible') && amps !== null && isc !== null && amps >= isc * 1.5 && amps <= isc * 2.4) {
                    out.push(`${fmt(amps, 0)} A para un panel de Isc ${fmt(isc, 1)} A`);
                }
                // Los fusibles y portafusibles de continua van por string: cuántos hacen falta
                const fuseNeeded = fuseKind(item) ? fuseNeed(state, catalog) : null;
                if (fuseNeeded && out.length > 0)
                    out.push(fuseReason(fuseNeeded));
                if (el.startsWith('seccion') && amps !== null && isc !== null && amps >= isc * 1.25)
                    out.push(`${fmt(amps, 0)} A, por encima de 1,25 × Isc`);
            }
            else if (txt(item.attrs.tipo) === 'Cuadro') {
                const inverters = state.lines.filter((l) => { const it = l.itemId ? byId.get(l.itemId) : undefined; return it?.category === 'inversores' && !isMicroOrOpt(it); });
                const units = inverters.reduce((s, l) => s + effectiveQty(l, state), 0);
                if (el === 'cuadro' && units > 0)
                    out.push(`uno por inversor: ${fmt(units, 0)} ${units === 1 ? 'cuadro' : 'cuadros'}`);
            }
            else if (txt(item.attrs.tipo) === 'AC') {
                if (el.startsWith('magneto') && amps !== null && iNom !== null && amps >= iNom * 1.25 && amps <= iNom * 2) {
                    out.push(`${fmt(amps, 0)} A para ${fmt(iNom, 1)} A del inversor`);
                }
                // Un magnetotérmico regulable vale si su margen de ajuste llega a lo que pide el inversor (de 1,25 a 2 veces su corriente)
                const minAmps = num(item.attrs.corriente_min_a);
                if (el.startsWith('magneto') && minAmps !== null && amps !== null && iNom !== null && minAmps <= iNom * 2 && amps >= iNom * 1.25) {
                    out.push(`regulable de ${fmt(minAmps, 0)} a ${fmt(amps, 0)} A: cubre los ${fmt(iNom, 1)} A del inversor`);
                }
                if (el.includes('diferencial') && amps !== null && iNom !== null && amps >= iNom)
                    out.push(`${fmt(amps, 0)} A, por encima de los ${fmt(iNom, 1)} A del inversor`);
                if (el.includes('diferencial') && num(item.attrs.sensibilidad_ma) !== null) {
                    out.push(`${fmt(num(item.attrs.sensibilidad_ma), 0)} mA${el.startsWith('rele') ? ' regulable, con toroidal' : ''}`);
                }
                // Los fusibles de 6 A protegen el circuito de medida: hacen falta si el presupuesto lleva contador o analizador
                if (el === 'fusible' && amps !== null && amps <= 10 && [...chosen('contadores'), ...chosen('monitorizacion')].length > 0) {
                    out.push('protege el circuito de medida del contador');
                }
                if (poles !== null && phases !== null && (phases === 3 ? poles >= 3 : poles === 2)) {
                    out.push(`${fmt(poles, 0)} polos, los que pide la instalación ${phases === 3 ? 'trifásica' : 'monofásica'}`);
                }
            }
            break;
        }
        case 'cableado': {
            const section = num(item.attrs.seccion_mm2);
            if (section === null)
                break;
            if (txt(item.attrs.tipo) === 'CC' && isc !== null) {
                const cap = ampacity(AMPACITY_DC, section);
                if (cap !== null && cap >= isc * 1.25)
                    out.push(`${fmt(section)} mm²: aguanta ${cap} A y el string da ${fmt(isc * 1.25, 1)} A`);
            }
            else if (txt(item.attrs.tipo) === 'AC' && iNom !== null) {
                const cap = ampacity(AMPACITY_AC, section);
                if (cap !== null && cap >= iNom * 1.25)
                    out.push(`${fmt(section)} mm²: aguanta ${cap} A y el inversor da ${fmt(iNom, 1)} A`);
            }
            break;
        }
        case 'tierra': {
            const section = num(item.attrs.seccion_mm2);
            if (section !== null && has(item.attrs.componente, 'cable') && section >= 6)
                out.push(`${fmt(section)} mm², suficiente para la estructura y los marcos`);
            break;
        }
    }
    return out;
}
/**
 * Los sugeridos de un paso: productos sin ningún aviso con lo ya elegido (`context`). Los que hay en stock se sugieren siempre
 * (aunque no haya nada que confirme que encajan, y sin tope); el resto, solo si algo lo confirma y hasta completar `limit`.
 * Primero los de stock; dentro de cada grupo, los que más cosas confirman y, a igualdad, los más baratos.
 */
export function suggestions(candidates, context, catalog, limit = 4) {
    const stocked = [];
    const others = [];
    for (const item of candidates) {
        if (item.sample || item.unit_price <= 0)
            continue;
        if (candidateIssues(item, context, catalog).length > 0)
            continue;
        const reasons = fitReasons(item, context, catalog);
        const units = packOf(item, context, catalog).units;
        if (item.stock >= units)
            stocked.push({ item, reasons: reasons.length > 0 ? reasons : ['en stock y sin incompatibilidades con lo elegido'], inStock: true, units });
        else if (reasons.length > 0)
            others.push({ item, reasons, inStock: false, units });
    }
    const order = (a, b) => b.reasons.length - a.reasons.length || a.item.unit_price - b.item.unit_price;
    return [...stocked.sort(order), ...others.sort(order).slice(0, Math.max(0, limit - stocked.length))];
}
