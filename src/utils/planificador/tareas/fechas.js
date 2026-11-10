// Fechas como "YYYY-MM-DD" y días como milisegundos UTC, para evitar problemas de zona horaria/DST.
export const DAY = 86400000;
export const parseDate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
};
export const formatDate = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (ms, n) => ms + n * DAY;
export const diffDays = (from, to) => Math.round((to - from) / DAY);
/** "15 oct" a partir de "2026-10-15". */
export const shortDate = (s) => new Date(parseDate(s))
    .toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replace('.', '');
/** Número de días naturales de la tarea, ambos extremos incluidos. */
export const durationDays = (start, end) => diffDays(parseDate(start), parseDate(end)) + 1;
/** Hoy según el calendario local del usuario, no UTC. */
export const todayStr = () => {
    const d = new Date();
    return formatDate(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
};
