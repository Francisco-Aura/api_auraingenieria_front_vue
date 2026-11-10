// Cálculos del cronograma (Gantt) sin pantalla: rango de días, meses, filas por fase, flechas de dependencia y arrastre de barras
// (equivale a la parte de cálculo de Gantt.tsx del Planificador actual).

import { addDays, diffDays, parseDate } from './fechas.js'

/** Índice del «zoom» que ajusta todo el proyecto al ancho disponible. */
export const FIT = 3
export const ZOOMS = [
  { label: 'Día', px: 36 },
  { label: 'Semana', px: 16 },
  { label: 'Mes', px: 6 },
  { label: 'Ajustar', px: 0 }
]

export const ROW_H = 36 // alto de fila; las flechas SVG se calculan con este valor
export const BAR_H = 20 // alto de la barra (igual que --bar-h en el CSS)
export const LABEL_W = 340 // ancho de la columna de nombres
export const ELBOW = 7 // largo de los tramos horizontales de las flechas
export const NO_PHASE = 'Sin fase'

export const limitar = (n, min, max) => Math.min(Math.max(n, min), max)

/**
 * El rango depende solo de las tareas guardadas, no del borrador, para que no se desplace al arrastrar. «Hoy» solo se incluye si
 * cae cerca del proyecto; si no, se ignora para no dejar huecos enormes. `hoy` y las fechas son milisegundos UTC.
 */
export function rangoDelProyecto(tareas, hoy) {
  if (tareas.length === 0) return { origin: addDays(hoy, -7), days: 42 }
  let min = Infinity
  let max = -Infinity
  for (const t of tareas) {
    min = Math.min(min, parseDate(t.start))
    max = Math.max(max, parseDate(t.end))
  }
  if (hoy >= addDays(min, -30) && hoy <= addDays(max, 30)) {
    min = Math.min(min, hoy)
    max = Math.max(max, hoy)
  }
  const origin = addDays(min, -3)
  return { origin, days: Math.max(28, diffDays(origin, addDays(max, 7)) + 1) }
}

/** Los meses que cubre el rango, con la primera y la última columna de cada uno. */
export function mesesDelRango(origin, days) {
  const salida = []
  for (let i = 0; i < days; i++) {
    const d = new Date(addDays(origin, i))
    const clave = d.getUTCFullYear() * 12 + d.getUTCMonth()
    const ultimo = salida[salida.length - 1]
    if (ultimo && ultimo.key === clave) ultimo.to = i
    else {
      const mes = d.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })
      salida.push({ key: clave, month: mes.charAt(0).toUpperCase() + mes.slice(1), year: d.getUTCFullYear(), from: i, to: i })
    }
  }
  return salida
}

/** Cada día del rango: si es fin de semana, su número y si es lunes. */
export function celdasDelRango(origin, days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(addDays(origin, i))
    const dow = d.getUTCDay()
    return { weekend: dow === 0 || dow === 6, date: d.getUTCDate(), monday: dow === 1 }
  })
}

/** Posición de cada tarea en días desde el origen (con el borrador del arrastre aplicado, si lo hay). */
export function rangosDe(tareas, borrador, origin) {
  const indice = (s) => diffDays(origin, parseDate(s))
  return new Map(tareas.map((t) => [t.id, borrador && borrador.id === t.id ? { start: borrador.start, end: borrador.end } : { start: indice(t.start), end: indice(t.end) }]))
}

/** Agrupación por fase, en el orden de la plantilla. */
export function agruparPorFase(tareas, rangos) {
  const porNombre = new Map()
  for (const t of tareas) {
    const nombre = t.phase || (tareas.some((x) => x.phase) ? NO_PHASE : '')
    porNombre.set(nombre, [...(porNombre.get(nombre) || []), t])
  }
  const grupos = []
  for (const [name, lista] of porNombre) {
    const rs = lista.map((t) => rangos.get(t.id))
    grupos.push({
      name, tasks: lista,
      start: Math.min(...rs.map((r) => r.start)), end: Math.max(...rs.map((r) => r.end)),
      progress: Math.round(lista.reduce((suma, t) => suma + t.progress, 0) / lista.length)
    })
  }
  const primera = (g) => Math.min(...g.tasks.map((t) => t.position))
  return grupos.sort((a, b) => primera(a) - primera(b))
}

/** Las filas que se ven: una por fase y, si no está plegada, una por tarea. */
export function filasVisibles(grupos, plegadas) {
  const filas = []
  for (const group of grupos) {
    if (group.name) filas.push({ kind: 'phase', group })
    if (!plegadas.has(group.name)) for (const task of group.tasks) filas.push({ kind: 'task', task })
  }
  return filas
}

// ---- Flechas ------------------------------------------------------------------------------------------------------

/**
 * Ruta en «L» de una flecha fin → inicio: sale del borde inferior (o superior) de la barra predecesora, justo antes de su final,
 * baja en vertical hasta la fila de la sucesora y entra por la izquierda de esta.
 */
export function puntosDeRuta({ xStart, x1, y1, x2, y2, fromMilestone }) {
  const dir = y2 >= y1 ? 1 : -1
  const inset = fromMilestone ? (x1 - xStart) / 2 : Math.min(9, Math.max(2, (x1 - xStart) / 2))
  const sx = x1 - inset
  const sy = y1 + dir * (BAR_H / 2)
  if (x2 - sx >= 3) return [[sx, sy], [sx, y2], [x2, y2]]
  // La sucesora empieza antes de ese punto (solo con fechas manuales): se rodea por el borde entre filas
  const ym = y1 + dir * (ROW_H / 2)
  const xa = x1 + ELBOW
  const xb = x2 - ELBOW
  return [[x1, y1], [xa, y1], [xa, ym], [xb, ym], [xb, y2], [x2, y2]]
}

/** Polilínea con las esquinas redondeadas. */
export function rutaRedondeada(pts, radio = 5) {
  const hacia = (desde, a, dist) => {
    const largo = Math.hypot(a[0] - desde[0], a[1] - desde[1]) || 1
    return [desde[0] + ((a[0] - desde[0]) / largo) * dist, desde[1] + ((a[1] - desde[1]) / largo) * dist]
  }
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1]
    const cur = pts[i]
    const sig = pts[i + 1]
    const r1 = Math.min(radio, Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) / 2)
    const r2 = Math.min(radio, Math.hypot(sig[0] - cur[0], sig[1] - cur[1]) / 2)
    const a = hacia(cur, prev, r1)
    const b = hacia(cur, sig, r2)
    d += ` L${a[0]},${a[1]} Q${cur[0]},${cur[1]} ${b[0]},${b[1]}`
  }
  const ultimo = pts[pts.length - 1]
  return `${d} L${ultimo[0]},${ultimo[1]}`
}

/**
 * Las flechas de dependencia que se dibujan: las de la tarea con el foco (la que tiene el ratón o la abierta en el panel) o todas
 * si `verTodas`. Si alguna de las dos tareas está oculta por una fase plegada, no se dibuja.
 */
export function calcularFlechas({ tareas, rangos, filaDe, foco, verTodas, anchoDia }) {
  const filaY = (id) => (filaDe.get(id) ?? 0) * ROW_H + ROW_H / 2
  return tareas.flatMap((t) =>
    t.depends_on.flatMap((depId) => {
      const desde = rangos.get(depId)
      const hasta = rangos.get(t.id)
      if (!desde || !hasta || !filaDe.has(depId) || !filaDe.has(t.id)) return []
      const enfocada = foco !== null && (depId === foco || t.id === foco)
      if (!verTodas && !enfocada) return []
      const origen = tareas.find((x) => x.id === depId)
      // El rombo de un hito va centrado en su columna, no pegado al borde
      const centrado = (anchoDia - BAR_H) / 2
      const x1 = (desde.end + 1) * anchoDia
      const x2 = hasta.start * anchoDia + (t.milestone ? centrado : 0)
      const y1 = filaY(depId)
      const y2 = filaY(t.id)
      const d = rutaRedondeada(puntosDeRuta({ xStart: desde.start * anchoDia, x1, y1, x2, y2, fromMilestone: origen ? !!origen.milestone : false }))
      const punta = `${x2},${y2} ${x2 - 7},${y2 - 4.5} ${x2 - 7},${y2 + 4.5}`
      return [{ key: `${depId}>${t.id}`, from: depId, to: t.id, d, head: punta, focused: enfocada }]
    })
  )
}

// ---- Arrastre -----------------------------------------------------------------------------------------------------

/** Lo mínimo que puede empezar una tarea: el día siguiente a que terminen sus predecesoras. */
export function inicioMinimo(tarea, tareas, origin) {
  return tarea.depends_on.reduce((min, depId) => {
    const dep = tareas.find((x) => x.id === depId)
    return dep ? Math.max(min, diffDays(origin, parseDate(dep.end)) + 1) : min
  }, 0)
}

/** El nuevo inicio y fin al arrastrar una barra `deltaPx` píxeles: mover (conserva la duración) o cambiar un extremo. */
export function calcularArrastre({ modo, start, end, minStart }, deltaPx, anchoDia, days) {
  const delta = Math.round(deltaPx / anchoDia)
  let nuevoInicio = start
  let nuevoFin = end
  if (modo === 'move') {
    const largo = end - start
    nuevoInicio = limitar(start + delta, minStart, days - 1 - largo)
    nuevoFin = nuevoInicio + largo
  } else if (modo === 'start') {
    nuevoInicio = limitar(start + delta, minStart, end)
  } else {
    nuevoFin = limitar(end + delta, start, days - 1)
  }
  return { start: nuevoInicio, end: nuevoFin }
}
