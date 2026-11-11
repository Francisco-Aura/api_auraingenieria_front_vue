// Horas del Registro horario: tramos [entrada, salida] con textos «HH:MM».

/** «8:30», «08.30» o «8:5» → «08:30»; null si no es una hora. */
export function normalizarHora(txt) {
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(txt)
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export function aMinutos(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** 145 hrs. (con minutos sueltos: 145:30 hrs.) */
export function fmtHoras(minutos) {
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `${h} hrs.` : `${h}:${String(m).padStart(2, '0')} hrs.`
}

/** Mensaje de error si el tramo no es válido (la salida debe ser posterior a la entrada). */
export function errorTramo(t, nombre) {
  if (!normalizarHora(t[0]) || !normalizarHora(t[1])) return `${nombre}: escribe las horas con el formato HH:MM.`
  if (aMinutos(t[1]) <= aMinutos(t[0])) return `${nombre}: la salida debe ser posterior a la entrada.`
  return null
}

/** Error de un par mañana/tarde (la tarde no puede empezar antes de que acabe la mañana), o null. */
export function errorHorario(manana, tarde) {
  const e = errorTramo(manana, 'Mañana') ?? (tarde ? errorTramo(tarde, 'Tarde') : null)
  if (e) return e
  if (tarde && aMinutos(tarde[0]) < aMinutos(manana[1])) return 'La tarde no puede empezar antes de que termine la mañana.'
  return null
}
