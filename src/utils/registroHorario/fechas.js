// Fechas del Registro horario. Todas son textos AAAA-MM-DD, sin zonas horarias.

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre',
  'Noviembre', 'Diciembre']

const pad = (n) => String(n).padStart(2, '0')

/** AAAA-MM-DD (mes de 1 a 12). */
export const iso = (anio, mes, dia) => `${anio}-${pad(mes)}-${pad(dia)}`

export const diasDelMes = (anio, mes) => new Date(anio, mes, 0).getDate()

/** 0 = lunes … 6 = domingo */
export const diaSemana = (anio, mes, dia) => (new Date(anio, mes - 1, dia).getDay() + 6) % 7

/** La fecha de hoy en la zona horaria de la persona. */
export function hoyISO(ahora = new Date()) {
  return iso(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate())
}

export const partes = (fecha) => {
  const [a, m, d] = fecha.split('-').map(Number)
  return { anio: a, mes: m, dia: d }
}

/** ¿Es una fecha AAAA-MM-DD que existe? */
export function fechaValida(txt) {
  if (typeof txt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txt)) return false
  const { anio, mes, dia } = partes(txt)
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasDelMes(anio, mes)
}

/** «5 oct 2026» */
export function corta(fecha) {
  const { anio, mes, dia } = partes(fecha)
  return `${dia} ${MESES[mes - 1].slice(0, 3).toLowerCase()} ${anio}`
}
