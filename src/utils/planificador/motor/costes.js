import { clampTotals } from './strings.js';
export const EMPTY_SURVEY = {
    roof: 'teja',
    targetKwp: 0,
    cableMeters: 0,
    acMeters: 0,
    futureBattery: false,
    supply: '',
};
export const EMPTY_COSTS = {
    client: '',
    customer: null,
    reference: '',
    cif: '',
    clientLogo: '',
    strings: null,
    moduleWp: 615,
    moduleCount: 12,
    saleRatio: 1.1,
    lines: [],
    survey: EMPTY_SURVEY,
    order: 'insercion',
};
const STORAGE_KEY = 'planificador.costes.v5';
const OLD_STORAGE_KEY = 'planificador.costes.v4';
function loadSurvey(raw) {
    const d = (raw && typeof raw === 'object' ? raw : {});
    const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    const roofs = ['teja', 'chapa', 'plana', 'suelo'];
    return {
        roof: roofs.includes(d.roof) ? d.roof : EMPTY_SURVEY.roof,
        targetKwp: num(d.targetKwp),
        cableMeters: num(d.cableMeters),
        acMeters: num(d.acMeters),
        futureBattery: d.futureBattery === true,
        supply: d.supply === 'monofasico' || d.supply === 'trifasico' ? d.supply : '',
    };
}
let lineCounter = 0;
const newLineId = () => `${Date.now().toString(36)}-${(lineCounter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
function parseStrings(raw) {
    if (!Array.isArray(raw))
        return null;
    const list = raw
        .filter((s) => s && typeof s === 'object')
        .map((s, i) => {
        const d = s;
        const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : 0);
        const parts = n(d.parts);
        return { id: typeof d.id === 'string' && d.id ? d.id : `s-${i}`, panels: n(d.panels), input: n(d.input), ...(parts > 1 ? { parts } : {}), ...(d.fixed === true ? { fixed: true } : {}) };
    });
    return list;
}
function parseCustomer(raw) {
    const d = (raw && typeof raw === 'object' ? raw : null);
    const str = (v) => (typeof v === 'string' ? v : '');
    if (!d || !str(d.name).trim())
        return null;
    if (d.kind === 'existente' && typeof d.id === 'number' && Number.isInteger(d.id) && d.id > 0) {
        return { kind: 'existente', id: d.id, name: str(d.name), tradeName: str(d.tradeName), cif: str(d.cif) };
    }
    if (d.kind === 'potencial')
        return { kind: 'potencial', name: str(d.name), phone: str(d.phone), email: str(d.email), cif: str(d.cif) };
    return null;
}
/** Un presupuesto leído de donde sea (el navegador o el servidor): lo que falte o venga mal toma su valor por defecto. */
/** El logo de la empresa del cliente: una imagen en data URI de hasta ~1,5 MB; cualquier otra cosa, vacío. */
function validLogo(v) {
    return typeof v === 'string' && v.length <= 2000000 && /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : '';
}
export function parseCosts(raw) {
    {
        const data = (raw && typeof raw === 'object' ? raw : {});
        const num = (v, fallback) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
        const str = (v) => (typeof v === 'string' ? v : '');
        return {
            client: str(data.client),
            customer: parseCustomer(data.customer),
            reference: str(data.reference),
            cif: str(data.cif).trim().slice(0, 30),
            clientLogo: validLogo(data.clientLogo),
            strings: parseStrings(data.strings),
            moduleWp: num(data.moduleWp, EMPTY_COSTS.moduleWp),
            moduleCount: num(data.moduleCount, EMPTY_COSTS.moduleCount),
            saleRatio: num(data.saleRatio, EMPTY_COSTS.saleRatio),
            survey: loadSurvey(data.survey),
            order: data.order === 'fijo' ? 'fijo' : 'insercion',
            lines: Array.isArray(data.lines)
                ? data.lines
                    .filter((l) => l && typeof l.group === 'string')
                    .map((l) => ({
                    id: str(l.id) || newLineId(),
                    itemId: typeof l.itemId === 'string' ? l.itemId : null,
                    group: l.group,
                    equipment: str(l.equipment),
                    model: str(l.model),
                    supplier: str(l.supplier),
                    unit: str(l.unit) || 'ud',
                    qty: num(l.qty, 1),
                    auto: l.auto === true,
                    ...(typeof l.perPanel === 'number' && Number.isFinite(l.perPanel) && l.perPanel > 0 ? { perPanel: l.perPanel } : {}),
                    ...(l.clamp === 'final' || l.clamp === 'intermedia' ? { clamp: l.clamp } : {}),
                    price: num(l.price, 0),
                    priceEdited: l.priceEdited === true,
                    notes: str(l.notes),
                }))
                : [],
        };
    }
}
/**
 * El presupuesto que había en este navegador antes de que hubiera listado (uno solo): se recoge una vez para convertirlo en
 * un presupuesto local y se borra, para que no vuelva a aparecer. Sin nada guardado, devuelve null.
 */
export function takeLegacyCosts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
        if (!raw)
            return null;
        const state = parseCosts(JSON.parse(raw));
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OLD_STORAGE_KEY);
        return state.lines.length > 0 || state.client.trim() || state.survey.targetKwp > 0 ? state : null;
    }
    catch {
        return null;
    }
}
/** El precio es de un módulo («módulo» como unidad): la cantidad es el número de módulos de la instalación. */
export const isPerModule = (unit) => unit
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .startsWith('modulo');
/**
 * Unidades que lleva cada panel, según las características del producto: un kit que cubre N módulos (1/N), unidades por panel
 * (por ejemplo, grapas) o un microinversor/optimizador que atiende a P paneles (1/P). Sin ese dato, null.
 */
export function unitsPerPanel(item) {
    const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
    const kit = n(item.attrs.modulos_por_kit);
    if (kit)
        return 1 / kit;
    const perPanel = n(item.attrs.uds_por_panel);
    if (perPanel)
        return perPanel;
    const per = n(item.attrs.paneles_por_unidad);
    return per ? 1 / per : null;
}
/** Si el equipo es una grapa final o intermedia de la estructura (por su componente y su nombre): su cantidad sale de los strings. */
export function clampKind(item) {
    if (item.category !== 'estructura' || String(item.attrs.componente ?? '').trim() !== 'Grapas')
        return null;
    const name = item.model
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
    return name.includes('intermedia') ? 'intermedia' : name.includes('final') ? 'final' : null;
}
/** Fila nueva de un equipo del catálogo: la cantidad habitual y su precio. */
export function newLine(item, categoryLabel) {
    const perModule = isPerModule(item.unit);
    const perPanel = perModule ? null : unitsPerPanel(item);
    const clamp = clampKind(item);
    return {
        id: newLineId(),
        itemId: item.id,
        group: item.group,
        equipment: categoryLabel,
        model: [item.brand, item.model].filter(Boolean).join(' '),
        supplier: item.supplier,
        unit: item.unit,
        qty: perModule ? 0 : item.default_qty,
        auto: perModule,
        ...(perPanel ? { perPanel } : {}),
        ...(clamp ? { clamp } : {}),
        price: item.unit_price,
        priceEdited: false,
        notes: item.notes,
    };
}
/**
 * El presupuesto en curso sigue al inventario: cada fila que viene de un producto toma su precio (y su proveedor,
 * nombre y unidad) tal como está ahora en el catálogo, salvo las que tengan el precio puesto a mano. Las
 * cantidades no se tocan. Devuelve el mismo estado si no hay nada que cambiar.
 */
export function syncWithCatalog(state, catalog) {
    const byId = new Map(catalog.items.map((i) => [i.id, i]));
    const changes = [];
    let touched = false;
    const lines = state.lines.map((line) => {
        const item = line.itemId ? byId.get(line.itemId) : undefined;
        if (!item)
            return line;
        const model = [item.brand, item.model].filter(Boolean).join(' ');
        const price = line.priceEdited ? line.price : item.unit_price;
        if (price === line.price && model === line.model && item.supplier === line.supplier && item.unit === line.unit)
            return line;
        touched = true;
        if (price !== line.price)
            changes.push({ name: model || lineName(line), from: line.price, to: price });
        return { ...line, price, model, supplier: item.supplier, unit: item.unit };
    });
    return { state: touched ? { ...state, lines } : state, changes };
}
/** Nombre corto de la fila, para listas y etiquetas de accesibilidad. */
export const lineName = (line) => line.model || line.equipment || 'Fila sin nombre';
export const effectiveQty = (line, state) => {
    if (line.auto)
        return state.moduleCount;
    if (line.clamp && state.strings && state.strings.length > 0) {
        const totals = clampTotals(state.strings);
        if (totals.rows > 0)
            return line.clamp === 'final' ? totals.finals : totals.intermediates;
    }
    // Pequeño margen para que 12 × (1/3) no salga 4,0000000001 y suba a 5
    if (line.perPanel && line.perPanel > 0)
        return Math.max(1, Math.ceil(state.moduleCount * line.perPanel - 1e-9));
    return line.qty;
};
export const lineTotal = (line, state) => effectiveQty(line, state) * line.price;
export function summarize(state, catalog) {
    const byPartida = Object.fromEntries(catalog.partidas.map((p) => [p.key, 0]));
    let cost = 0;
    for (const line of state.lines) {
        const total = lineTotal(line, state);
        byPartida[line.group] = (byPartida[line.group] ?? 0) + total;
        cost += total;
    }
    const wp = state.moduleWp * state.moduleCount;
    const budget = state.saleRatio * wp;
    const profit = budget - cost;
    return {
        byPartida,
        cost,
        wp,
        costRatio: wp > 0 ? cost / wp : 0,
        budget,
        profit,
        margin: budget > 0 ? profit / budget : 0,
    };
}
/** Valores distintos de un atributo, en orden (números de menor a mayor, textos alfabéticos). */
export function distinctValues(items, read) {
    const seen = new Set();
    for (const item of items) {
        const v = read(item);
        if (v !== undefined && v !== null && String(v).trim() !== '')
            seen.add(String(v));
    }
    return [...seen].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}
const eurFmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const eur = (n) => eurFmt.format(n);
export const pct = (n) => `${(n * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
export const ratio = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
