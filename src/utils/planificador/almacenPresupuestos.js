import { parseCosts, takeLegacyCosts } from './motor/costes.js';
const KEY = 'planificador.presupuestos.v1';
const nonNegative = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
const text = (v) => (typeof v === 'string' ? v : '');
/** Cómo se llama el presupuesto en el listado: el cliente y, si la tiene, su referencia. */
export const budgetName = (state) => {
    const base = state.client.trim() || 'Sin nombre';
    const reference = state.reference.trim();
    return reference ? `${base} · ${reference}` : base;
};
export function newId() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            return crypto.randomUUID();
    }
    catch {
        // sin crypto.randomUUID (contexto no seguro): se arma uno a mano
    }
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}
const numbersOf = (state) => ({ kwp: (state.moduleWp * state.moduleCount) / 1000, panels: state.moduleCount, total: 0 });
function sanitize(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const b = raw;
    if (typeof b.id !== 'string' || !b.id)
        return null;
    const state = parseCosts(b.state);
    const r = b.remote;
    const remote = r && typeof r === 'object' && typeof r.version === 'number'
        ? {
            version: r.version,
            syncedJson: text(r.syncedJson),
            owner: text(r.owner),
            ownerId: text(r.ownerId),
            updatedBy: text(r.updatedBy),
            updatedAt: text(r.updatedAt),
            status: r.status === 'enviado' || r.status === 'validado' || r.status === 'descartado' ? r.status : 'borrador',
        }
        : null;
    const fallback = numbersOf(state);
    return {
        id: b.id,
        state,
        numbers: { kwp: nonNegative(b.numbers?.kwp) || fallback.kwp, panels: nonNegative(b.numbers?.panels) || fallback.panels, total: nonNegative(b.numbers?.total) },
        updatedAt: text(b.updatedAt) || new Date().toISOString(),
        remote,
    };
}
function read() {
    const store = {};
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}');
        for (const raw of Object.values(parsed)) {
            const b = sanitize(raw);
            if (b)
                store[b.id] = b;
        }
    }
    catch {
        // almacenamiento ilegible: se empieza de cero
    }
    // El presupuesto que había antes de que existiera el listado pasa a ser un presupuesto local
    const legacy = takeLegacyCosts();
    if (legacy) {
        const b = newLocal(legacy);
        store[b.id] = b;
        write(store);
    }
    return store;
}
function write(store) {
    try {
        localStorage.setItem(KEY, JSON.stringify(store));
    }
    catch {
        // Sin almacenamiento (modo privado, bloqueado): el presupuestador sigue funcionando, solo no recuerda.
    }
}
/** Una copia de trabajo nueva, solo local (todavía sin guardar en ningún sitio). */
export function newLocal(state) {
    return { id: newId(), state, numbers: numbersOf(state), updatedAt: new Date().toISOString(), remote: null };
}
/** Quita de una referencia su número de versión («Nave 3 v2» → «Nave 3») o el «(copia)» de las copias antiguas. */
const baseReference = (reference) => reference.trim().replace(/\s*(\(copia\)|v\d+)$/i, '').trim();
/**
 * La referencia de la versión siguiente de un presupuesto: «Nave 3» pasa a «Nave 3 v2» y esa a «Nave 3 v3»… Sigue al número más
 * alto que ya exista con ese cliente y esa referencia (`takenNames` son los nombres de los presupuestos que ya hay), así no se repite.
 */
export function nextVersionReference(state, takenNames) {
    const base = baseReference(state.reference);
    const taken = new Set(takenNames.map((n) => n.toLowerCase()));
    const label = (n) => (base ? `${base} v${n}` : `v${n}`);
    const exists = (n) => taken.has(budgetName({ ...state, reference: label(n) }).toLowerCase());
    let highest = Number(/\s*v(\d+)$/i.exec(state.reference.trim())?.[1] ?? 1);
    for (let n = 2; n <= 200; n++)
        if (exists(n))
            highest = Math.max(highest, n);
    return label(highest + 1);
}
/** Una copia de otro presupuesto, local y con el número de versión siguiente (v2, v3…): una versión propia sin tocar la original. */
export function copyOf(state, takenNames = []) {
    return newLocal({ ...state, reference: nextVersionReference(state, takenNames) });
}
/** La copia de trabajo de un borrador del servidor, tal cual está allí (sin cambios sin guardar). */
export function fromServer(full) {
    const state = parseCosts(full.data);
    return {
        id: full.id,
        state,
        numbers: { kwp: full.kwp, panels: full.panels, total: full.budget_total },
        updatedAt: new Date().toISOString(),
        remote: {
            version: full.version,
            syncedJson: canonical(state),
            owner: full.owner,
            ownerId: full.owner_id,
            updatedBy: full.updated_by,
            updatedAt: full.updated_at,
            status: full.status,
        },
    };
}
/**
 * El presupuesto en una forma única para compararlo: tras guardarlo y volver a leerlo (del navegador o del servidor) las claves
 * pueden venir en otro orden o con valores por defecto, y eso no son cambios.
 */
export const canonical = (state) => JSON.stringify(parseCosts(state));
/** Hay cambios sin guardar en el servidor (solo los borradores pueden tenerlos). */
export const isDirty = (b) => !!b.remote && canonical(b.state) !== b.remote.syncedJson;
export function listLocal() {
    return Object.values(read()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function getLocal(id) {
    return read()[id] ?? null;
}
export function putLocal(b) {
    const store = read();
    store[b.id] = b;
    write(store);
}
export function removeLocal(id) {
    const store = read();
    delete store[id];
    write(store);
}
/** El presupuesto tocado más recientemente en este navegador (el que se toma como «el del Presupuestador»). */
export function latestLocal() {
    return listLocal()[0] ?? null;
}
