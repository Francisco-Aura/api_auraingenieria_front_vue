import { diffDays, parseDate, todayStr } from './fechas.js';
const LEVEL_COLORS = {
    1: '#f59e0b', // ámbar
    2: '#f97316', // naranja
    3: '#dc2626', // rojo
};
const LEVEL_NAMES = { 1: 'leve', 2: 'media', 3: 'grave' };
export const levelName = (level) => LEVEL_NAMES[level];
export function levelOf(days) {
    return days >= 7 ? 3 : days >= 3 ? 2 : 1;
}
/** Retraso de una tarea sin terminar respecto a su plazo de referencia, o null si va en fecha. */
export function delayOf(task, today = todayStr()) {
    if (task.status === 'done')
        return null;
    const planned = task.planned_end ?? task.end;
    const days = diffDays(parseDate(planned), parseDate(task.end));
    if (days <= 0)
        return null;
    const level = levelOf(days);
    const own = planned < today;
    return {
        days,
        level,
        color: LEVEL_COLORS[level],
        own,
        planned,
        label: own ? `Retrasada ${days} d` : `Desplazada ${days} d`,
    };
}
/** Días que se ha corrido la entrega del proyecto entera (último fin real frente al previsto). */
export function projectSlip(tasks) {
    if (tasks.length === 0)
        return { days: 0, late: 0 };
    const end = Math.max(...tasks.map((t) => parseDate(t.end)));
    const planned = Math.max(...tasks.map((t) => parseDate(t.planned_end ?? t.end)));
    return {
        days: Math.max(0, Math.round((end - planned) / 86400000)),
        late: tasks.filter((t) => delayOf(t) !== null).length,
    };
}
