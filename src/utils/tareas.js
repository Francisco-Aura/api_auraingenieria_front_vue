// Textos e iconos de las tareas que comparten la lista de tareas, su detalle y la ficha
// del cliente.

/** 0 Urgente, 1 Alta, 2 Media, 3 Baja; cualquier otro valor, 'Normal'. */
export function textoPrioridad(prioridad) {
  switch (prioridad) {
    case 0: return 'Urgente';
    case 1: return 'Alta';
    case 2: return 'Media';
    case 3: return 'Baja';
    default: return 'Normal';
  }
}

/** Solo para mostrar: «EN_PROGRESO» -> «En Progreso». */
export function nombreEstado(nombre) {
  if (!nombre) return '';
  return nombre.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
}

const ICONOS_ESTADO = {
  pendiente: 'far fa-clock',
  'en progreso': 'far fa-play-circle',
  progreso: 'far fa-play-circle',
  completada: 'far fa-check-circle',
  finalizada: 'far fa-check-circle',
  cancelada: 'far fa-times-circle',
  pausada: 'far fa-pause-circle',
  bloqueada: 'fas fa-lock',
};

const ICONOS_ESTADO_INGLES = {
  pending: 'far fa-clock',
  'in progress': 'far fa-play-circle',
  completed: 'far fa-check-circle',
  cancelled: 'far fa-times-circle',
  paused: 'far fa-pause-circle',
  blocked: 'fas fa-lock',
};

/**
 * Icono de Font Awesome del estado de una tarea (por su nombre, sin distinguir mayúsculas).
 * La lista de tareas también reconoce los nombres en inglés; la ficha del cliente, no.
 */
export function iconoEstadoTarea(nombre, tambienEnIngles = true) {
  const estado = nombre ? nombre.toLowerCase() : '';
  if (Object.prototype.hasOwnProperty.call(ICONOS_ESTADO, estado)) return ICONOS_ESTADO[estado];
  if (tambienEnIngles && Object.prototype.hasOwnProperty.call(ICONOS_ESTADO_INGLES, estado)) return ICONOS_ESTADO_INGLES[estado];
  return 'fas fa-circle';
}
