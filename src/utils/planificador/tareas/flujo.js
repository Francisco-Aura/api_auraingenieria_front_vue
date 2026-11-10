/**
 * Reglas de cambio de estado (el servidor las aplica también):
 * - Una tarea iniciada no vuelve a Pendiente; para retomarla se pone En curso.
 * - Solo se pausa o bloquea lo que ya está en marcha.
 * - Las subtareas son solo de seguimiento: no impiden darla por hecha (sí los documentos obligatorios, que comprueba el servidor).
 * Devuelve el motivo por el que no se puede, o null si está permitido.
 */
export function moveBlockedReason(task, to) {
    if (task.status === to)
        return null;
    if (to === 'todo')
        return 'Una tarea iniciada no puede volver a Pendiente. Para retomarla, ponla En curso.';
    if ((to === 'paused' || to === 'blocked') && task.status === 'todo') {
        return 'Primero hay que iniciar la tarea (En curso) para poder pausarla o bloquearla.';
    }
    return null;
}
export const canMove = (task, to) => moveBlockedReason(task, to) === null;
/** Elementos requeridos que aún no se han aportado ni descartado. */
export function pendingDeliverables(task) {
    const provided = new Set(task.attachments.map((a) => a.requirement));
    return task.deliverables.filter((d) => !d.na && !provided.has(d.key));
}
