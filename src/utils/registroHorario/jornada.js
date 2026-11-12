// Reglas del calendario del Registro horario: estado de cada día, marcas de la persona y resumen del mes.
// Mismas que el programa de escritorio y que el Registro horario anterior. Funciones puras: sin Vue ni navegador.
import { diaSemana, diasDelMes, iso } from './fechas.js'
import { aMinutos, errorHorario } from './horas.js'

export const ESTADOS = ['MANANA', 'TARDE', 'FESTIVO', 'VACACIONES', 'PERMISO', 'ENFERMEDAD', 'LIBRE']

/** Texto corto dentro de cada día. */
export const TEXTO_ESTADO = {
  MANANA: 'Mañana', TARDE: 'Con tarde', FESTIVO: 'Festivo', VACACIONES: 'Vacaciones', PERMISO: 'Permiso',
  ENFERMEDAD: 'Enfermedad', LIBRE: '—'
}

/** Nombre del pincel con el que se marca cada estado (en este orden). */
export const PINCELES = [
  { estado: 'TARDE', nombre: 'Mañana y tarde' },
  { estado: 'MANANA', nombre: 'Solo mañana' },
  { estado: 'FESTIVO', nombre: 'Festivo' },
  { estado: 'VACACIONES', nombre: 'Vacaciones' },
  { estado: 'PERMISO', nombre: 'Permiso' },
  { estado: 'ENFERMEDAD', nombre: 'Enfermedad' }
]

/** Lo que la persona ha cambiado: solo lo que difiere del valor por defecto. */
export const MARCAS_VACIAS = Object.freeze({ cambios: Object.freeze({}), horas: Object.freeze({}) })
export const HORARIO_BASE = Object.freeze({ manana: ['08:00', '15:00'], tarde: ['16:00', '19:00'] })

/** Estado de un día sin marcas: fin de semana libre, festivo, o mañana. */
export function estadoDefecto(fecha, festivos) {
  const [a, m, d] = fecha.split('-').map(Number)
  if (diaSemana(a, m, d) >= 5) return 'LIBRE'
  return festivos.has(fecha) ? 'FESTIVO' : 'MANANA'
}

/** Día anterior a la fecha de alta: todavía no se trabajaba, sale siempre en blanco. */
export const antesDelAlta = (fecha, alta) => alta !== null && alta !== undefined && fecha < alta

/** Sábado o domingo: no se trabaja ni se puede marcar. */
export function esFinDeSemana(fecha) {
  const [a, m, d] = fecha.split('-').map(Number)
  return diaSemana(a, m, d) >= 5
}

/** Todo lo que hace falta para saber el estado de un día: { festivos: Set, marcas, alta }. */
export function estadoDe(fecha, c) {
  if (esFinDeSemana(fecha) || antesDelAlta(fecha, c.alta)) return 'LIBRE' // aunque haya una marca antigua guardada
  return c.marcas.cambios[fecha] ?? estadoDefecto(fecha, c.festivos)
}

/** Último día que se rellena: hoy si «solo hasta hoy» está activo y se ve el mes actual; si no, null. */
export function limiteDe(anio, mes, hastaHoy, hoy) {
  return hastaHoy && hoy.startsWith(iso(anio, mes, 1).slice(0, 8)) ? hoy : null
}

// ---- marcas (funciones puras: devuelven unas marcas nuevas)

export function pintar(marcas, fecha, estado, c) {
  // los fines de semana y los días anteriores al alta no se pueden marcar
  if (esFinDeSemana(fecha) || antesDelAlta(fecha, c.alta) || estadoDe(fecha, c) === estado) return marcas
  const cambios = { ...marcas.cambios }
  if (estado === estadoDefecto(fecha, c.festivos)) delete cambios[fecha]
  else cambios[fecha] = estado
  return { ...marcas, cambios }
}

/** El día vuelve a su valor por defecto (estado y horas). */
export function quitarMarca(marcas, fecha) {
  if (!(fecha in marcas.cambios) && !(fecha in marcas.horas)) return marcas
  const cambios = { ...marcas.cambios }
  const horas = { ...marcas.horas }
  delete cambios[fecha]
  delete horas[fecha]
  return { cambios, horas }
}

/** Guarda las horas de un día; solo se anota lo que difiere del horario habitual. */
export function ponerHoras(marcas, fecha, nuevas, base) {
  const actual = { ...marcas.horas[fecha] }
  for (const f of ['manana', 'tarde']) {
    const v = nuevas[f]
    if (!v) continue
    if (v[0] === base[f][0] && v[1] === base[f][1]) delete actual[f]
    else actual[f] = v
  }
  const horas = { ...marcas.horas }
  if (actual.manana || actual.tarde) horas[fecha] = actual
  else delete horas[fecha]
  return { ...marcas, horas }
}

export function restablecerMes(marcas, anio, mes) {
  const prefijo = iso(anio, mes, 1).slice(0, 8)
  const filtrar = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith(prefijo)))
  return { cambios: filtrar(marcas.cambios), horas: filtrar(marcas.horas) }
}

export function hayMarcasEnMes(marcas, anio, mes) {
  const prefijo = iso(anio, mes, 1).slice(0, 8)
  return [...Object.keys(marcas.cambios), ...Object.keys(marcas.horas)].some((k) => k.startsWith(prefijo))
}

// ---- resumen y datos para el servidor

const duracion = (t) => aMinutos(t[1]) - aMinutos(t[0])

export function resumenMes(anio, mes, c, horario, limite) {
  let dias = 0
  let tardes = 0
  let minutos = 0
  for (let n = 1; n <= diasDelMes(anio, mes); n++) {
    const f = iso(anio, mes, n)
    const est = estadoDe(f, c)
    if ((est !== 'MANANA' && est !== 'TARDE') || (limite !== null && f > limite)) continue
    const prop = c.marcas.horas[f] ?? {}
    minutos += duracion(prop.manana ?? horario.manana)
    dias++
    if (est === 'TARDE') {
      minutos += duracion(prop.tarde ?? horario.tarde)
      tardes++
    }
  }
  return { dias, tardes, minutos }
}

/** Un estado por cada día del mes: los posteriores al límite («solo hasta hoy») salen en blanco. */
export function estadoDiasDelMes(anio, mes, c, limite) {
  const out = {}
  for (let n = 1; n <= diasDelMes(anio, mes); n++) {
    const f = iso(anio, mes, n)
    out[f] = limite !== null && f > limite ? 'LIBRE' : estadoDe(f, c)
  }
  return out
}

export function horasDelMes(anio, mes, marcas) {
  const prefijo = iso(anio, mes, 1).slice(0, 8)
  return Object.fromEntries(Object.entries(marcas.horas).filter(([k]) => k.startsWith(prefijo)))
}

// ---- validación

/** Lo que impide generar el documento (lista vacía si está todo). */
export function faltan(p, empresaValida, hayEmpresas, hayFirma, horario, resumen) {
  const f = []
  if (!p.trabajador.trim()) f.push('tu nombre y apellidos')
  if (!p.nif.trim()) f.push('tu NIF')
  if (!p.num_afiliacion.trim()) f.push('tu nº de afiliación')
  if (!hayEmpresas) f.push('la empresa (no hay ninguna configurada: avisa al administrador)')
  else if (!empresaValida) f.push('elegir tu empresa')
  if (!hayFirma) f.push('la imagen de tu firma')
  if (errorHorario(horario.manana, horario.tarde)) f.push('un horario habitual válido (formato HH:MM)')
  else if (resumen.dias === 0) f.push('al menos un día trabajado en el periodo')
  return f
}

export function unir(lista) {
  return lista.length <= 1 ? (lista[0] ?? '') : `${lista.slice(0, -1).join(', ')} y ${lista[lista.length - 1]}`
}
