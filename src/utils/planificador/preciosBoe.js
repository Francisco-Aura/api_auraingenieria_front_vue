// Los peajes y cargos de un BOE, tal como se editan en la pantalla: su nombre, desde cuándo vale y una celda de texto por tarifa, término,
// concepto y periodo. Cada BOE es propio: puede haber varios en el mismo año, o uno cada dos.

export const TERMINOS = [
  { id: 'energia', titulo: 'Energía', unidad: '€/kWh' },
  { id: 'potencia', titulo: 'Potencia', unidad: '€/kW·año' }
]
export const CONCEPTOS = [
  { id: 'peaje', titulo: 'Peaje' },
  { id: 'cargo', titulo: 'Cargo' }
]

/** Periodos que tiene la tarifa en ese término: la 2.0TD tiene 3 de energía y 2 de potencia; las demás, 6. */
export const nPeriodos = (tarifa, termino) => (tarifa === '2.0TD' ? (termino === 'energia' ? 3 : 2) : 6)

export const clave = (tarifa, termino, concepto) => `${tarifa}|${termino}|${concepto}`

const aTexto = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ','))

/** Un número escrito con coma o punto; null si está vacío o no es un número. */
export function leerNumero(texto) {
  const t = String(texto === null || texto === undefined ? '' : texto).trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/**
 * El borrador editable de un BOE. Con `id` es el BOE guardado con ese id. Sin `id` es uno nuevo: parte de los precios de `copiaDe` (otro
 * BOE, normalmente el último, sin sus referencias, su nombre ni su fecha) o vacío si no hay ninguno.
 */
export function borradorDe(datos, id, copiaDe = null) {
  const guardado = id !== null && datos.boes.some((b) => b.id === id)
  const boe = guardado ? datos.boes.find((b) => b.id === id) : null
  const origen = guardado ? id : copiaDe
  const filas = datos.precios.filter((p) => p.boeId === origen)
  const celdas = {}
  const refs = { peaje: '', cargo: '' }
  for (const t of datos.tarifas) {
    for (const { id: termino } of TERMINOS) {
      for (const { id: concepto } of CONCEPTOS) {
        const f = filas.find((x) => x.tarifa === t && x.termino === termino && x.concepto === concepto)
        celdas[clave(t, termino, concepto)] = Array.from({ length: nPeriodos(t, termino) }, (_, i) => (f ? aTexto(f.periodos[i]) : ''))
        if (guardado && f && f.referencia && !refs[concepto]) refs[concepto] = f.referencia
      }
    }
  }
  return { id: guardado ? id : null, guardado, nombre: boe ? boe.nombre : '', vigenteDesde: boe ? boe.vigenteDesde : '', refs, celdas }
}

/** Peaje + cargo de un periodo; null si falta alguno. */
export function total(borrador, tarifa, termino, i) {
  const a = leerNumero(borrador.celdas[clave(tarifa, termino, 'peaje')][i])
  const b = leerNumero(borrador.celdas[clave(tarifa, termino, 'cargo')][i])
  return a === null || b === null ? null : Math.round((a + b) * 1e6) / 1e6
}

/** Celdas vacías o que no son un número válido (no negativo). */
export function celdasMalas(borrador) {
  const malas = new Set()
  for (const [k, valores] of Object.entries(borrador.celdas)) {
    valores.forEach((v, i) => {
      const n = leerNumero(v)
      if (n === null || n < 0) malas.add(`${k}|${i}`)
    })
  }
  return malas
}

/** Lo que falta para guardar el BOE (además de las celdas): su nombre y desde cuándo vale. */
export function faltas(borrador) {
  const f = []
  if (!borrador.nombre.trim()) f.push('Pon el nombre del BOE.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(borrador.vigenteDesde)) f.push('Pon la fecha desde la que vale.')
  return f
}

/** Lo que se manda al servidor para guardar el BOE. */
export function cuerpoDe(borrador) {
  return {
    nombre: borrador.nombre.trim(),
    vigenteDesde: borrador.vigenteDesde,
    precios: Object.entries(borrador.celdas).map(([k, valores]) => {
      const [tarifa, termino, concepto] = k.split('|')
      return { tarifa, termino, concepto, periodos: valores.map(leerNumero), referencia: borrador.refs[concepto].trim() }
    })
  }
}

/** Para saber si el borrador ha cambiado. */
export const firma = (borrador) => JSON.stringify([borrador.nombre, borrador.vigenteDesde, borrador.refs, borrador.celdas])

/** El BOE vigente en una fecha (AAAA-MM-DD): el que empezó más recientemente. Los BOE vienen del más reciente al más antiguo. */
export const vigenteEn = (boes, fecha) => boes.find((b) => b.vigenteDesde <= fecha) || null

/** «2026-01-01» como «01/01/2026». */
export const fechaCorta = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.split('-').reverse().join('/') : iso)
