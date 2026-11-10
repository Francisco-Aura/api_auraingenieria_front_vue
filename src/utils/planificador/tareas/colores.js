// Un color por fase, en el orden de la plantilla. Valen igual en tema claro y oscuro.
const PHASE_PALETTE = [
    '#6366f1', // índigo
    '#0ea5e9', // cielo
    '#14b8a6', // turquesa
    '#f59e0b', // ámbar
    '#ef6a4a', // coral
    '#a855f7', // violeta
    '#22c55e', // verde
    '#ec4899', // rosa
];
const DEPARTMENT_COLORS = {
    COMERCIAL: '#f59e0b',
    INGENIERÍA: '#22c55e',
    ADMINISTRACIÓN: '#ff32e0',
    COORDINACIÓN: '#0ea5e9',
};
export const NO_COLOR = 'var(--accent)';
export const STATUS_ORDER = ['todo', 'doing', 'paused', 'blocked', 'done'];
export const STATUS_META = {
    todo: { label: 'Pendiente', color: '#8b93a1', icon: '' },
    doing: { label: 'En curso', color: '#3b82f6', icon: '' },
    paused: { label: 'Pausada', color: '#06b6d4', icon: '⏸' },
    blocked: { label: 'Bloqueada', color: '#8b5cf6', icon: '⛔' },
    done: { label: 'Hecha', color: '#16a34a', icon: '✓' },
};
/** Motivos habituales para bloquear una tarea; el último permite escribir uno propio. */
export const BLOCK_REASONS = [
    'Esperando al cliente',
    'Esperando documentación',
    'Esperando a un proveedor o material',
    'Esperando aprobación o licencia',
    'Falta de personal o recursos',
    'Incidencia técnica',
    'Condiciones meteorológicas',
    'Otro',
];
/** Fases en el orden en que aparecen en la plantilla (por la posición de su primera tarea). */
export function orderedPhases(tasks) {
    const first = new Map();
    for (const t of tasks) {
        if (!t.phase)
            continue;
        first.set(t.phase, Math.min(first.get(t.phase) ?? Infinity, t.position));
    }
    return [...first.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name);
}
export function phaseColors(tasks) {
    return new Map(orderedPhases(tasks).map((name, i) => [name, PHASE_PALETTE[i % PHASE_PALETTE.length]]));
}
export function departmentColor(name) {
    const known = DEPARTMENT_COLORS[name.toUpperCase()];
    if (known)
        return known;
    let hash = 0;
    for (const ch of name)
        hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PHASE_PALETTE[hash % PHASE_PALETTE.length];
}
