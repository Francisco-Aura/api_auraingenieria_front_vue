// Lógica de los pasos guiados del presupuestador, sin pantalla (equivale a lo que hay dentro de BudgetSteps.tsx del Planificador
// actual): qué se ha elegido en cada paso, cuándo se puede avanzar, qué se oculta por incompatible y qué se sugiere.

import { ROOF_ITEM_VALUES, ROOF_LABEL, STEPS, batteryCompat, stepRank } from './motor/pasosConfig.js'
import { effectiveQty } from './motor/costes.js'
import { hardConflicts, suggestions } from './motor/compatibilidad.js'
import { fitStrings, summarizeStrings } from './motor/strings.js'
import { esValorVacio } from './caracteristicas.js'
import { unidadDe } from './formularioEquipo.js'

export const CLAVE_PASO = 'planificador.costes.paso'
const claveDe = (presupuestoId) => `${CLAVE_PASO}.${presupuestoId}`

/** El paso en el que se dejó este presupuesto (por su clave, para que valga aunque cambie el orden); el primero si no hay. */
export function pasoGuardado(presupuestoId, almacen = window.localStorage) {
  try {
    const indice = STEPS.findIndex((s) => s.key === almacen.getItem(claveDe(presupuestoId)))
    return indice >= 0 ? indice : 0
  } catch (e) {
    return 0
  }
}

export function guardarPaso(presupuestoId, indice, almacen = window.localStorage) {
  try { almacen.setItem(claveDe(presupuestoId), STEPS[indice].key) } catch (e) { /* sin almacenamiento: no se recuerda */ }
}

/** ¿El producto es de esta sección? (categoría y valores fijos de sus características: p. ej. «Componente = Grapas»). */
export const esDeSeccion = (item, seccion) =>
  item.category === seccion.category && Object.entries(seccion.fixed || {}).every(([clave, valores]) => valores.includes(String(item.attrs[clave] ?? '')))

/** Los productos de una categoría que hay elegidos (sin repetir). */
export function elegidos(state, catalogo, categoria) {
  const porId = new Map(catalogo.items.map((i) => [i.id, i]))
  const vistos = new Set()
  const salida = []
  for (const linea of state.lines) {
    const item = linea.itemId ? porId.get(linea.itemId) : undefined
    if (item && item.category === categoria && !vistos.has(item.id)) {
      vistos.add(item.id)
      salida.push(item)
    }
  }
  return salida
}

/** Filas del presupuesto que son de algún producto de estas secciones. */
function filasDe(state, catalogo, secciones) {
  const porId = new Map(catalogo.items.map((i) => [i.id, i]))
  return state.lines.filter((l) => {
    const item = l.itemId ? porId.get(l.itemId) : undefined
    return !!item && secciones.some((sec) => esDeSeccion(item, sec))
  })
}

export const contarPaso = (paso, state, catalogo) => filasDe(state, catalogo, paso.sections).length
export const contarSeccion = (seccion, state, catalogo) => filasDe(state, catalogo, [seccion]).length

/** Un paso está hecho cuando se ha elegido algo de lo que lo define (en el inversor, el inversor: no basta el medidor). */
export function pasoHecho(paso, state, catalogo) {
  const definen = paso.sections.filter((sec) => !paso.doneBy || paso.doneBy.includes(sec.id))
  return filasDe(state, catalogo, definen).length > 0
}

/**
 * Los pasos dependen unos de otros: solo se puede dejar un paso sin elegir, y hay pasos que no se pueden saltar porque se
 * comprueban contra otro concreto. Devuelve el motivo si no se puede abrir el paso `indice`, o null.
 */
export function motivoBloqueo(indice, state, catalogo) {
  // Hasta el último paso en el que hay algo elegido todo está abierto (aunque se hayan vaciado pasos anteriores); a partir de ahí solo se
  // puede dejar un paso sin elegir
  const ultimoElegido = STEPS.reduce((ultimo, s, i) => (pasoHecho(s, state, catalogo) ? i : ultimo), -1)
  if (indice <= ultimoElegido) return null
  const destino = STEPS[indice]
  const requerido = destino.requires ? STEPS.find((s) => s.key === destino.requires) : undefined
  if (requerido && !pasoHecho(requerido, state, catalogo)) {
    return `«${destino.title}» depende de «${requerido.title}»: elige antes algo allí para poder comprobar la compatibilidad.`
  }
  const faltan = STEPS.slice(ultimoElegido + 1, indice)
  if (faltan.length > 1) return `Solo se puede saltar un paso y faltan por elegir: ${faltan.map((s) => `«${s.title}»`).join(', ')}.`
  return null
}

/**
 * Lo que no casa con lo elegido hasta este paso (los pasos anteriores y este) se oculta en este paso y en los siguientes: el
 * contexto del paso son solo las filas hasta él. Los pasos anteriores enseñan todo.
 */
export function contextoDelPaso(state, catalogo, indice) {
  const porId = new Map(catalogo.items.map((i) => [i.id, i]))
  return {
    ...state,
    lines: state.lines.filter((l) => {
      const item = l.itemId ? porId.get(l.itemId) : undefined
      return !item || Math.floor(stepRank(item) / 100) <= indice
    })
  }
}

const candidatos = (catalogo, state, seccion) =>
  catalogo.items.filter((i) => esDeSeccion(i, seccion) && !state.lines.some((l) => l.itemId === i.id))

/** Los sugeridos de cada sección del paso: sin ningún aviso con lo elegido hasta aquí y con algo que confirma que encajan. */
export function sugeridosDelPaso(state, catalogo, indice) {
  const contexto = contextoDelPaso(state, catalogo, indice)
  const salida = new Map()
  for (const seccion of STEPS[indice].sections) salida.set(seccion.id, suggestions(candidatos(catalogo, state, seccion), contexto, catalogo))
  return salida
}

/** Productos que no casan con lo elegido (con el motivo): se ocultan salvo que se pida verlos. */
export function conflictosDelPaso(state, catalogo, indice) {
  const contexto = contextoDelPaso(state, catalogo, indice)
  const salida = new Map()
  for (const seccion of STEPS[indice].sections) {
    for (const item of candidatos(catalogo, state, seccion)) {
      const motivos = hardConflicts(item, contexto, catalogo)
      if (motivos.length > 0) salida.set(item.id, motivos)
    }
  }
  return salida
}

/** El filtro por defecto de una sección según lo elegido antes (cubierta, o híbridos si se prevén baterías), o null. */
export function filtroPorDefecto(seccion, survey) {
  if (seccion.id === 'estructura') {
    const valores = ROOF_ITEM_VALUES[survey.roof]
    return { label: `cubierta ${ROOF_LABEL[survey.roof].toLowerCase()}`, test: (i) => valores.includes(String(i.attrs.cubierta ?? 'Todas')) }
  }
  if (seccion.id === 'inversores' && survey.futureBattery) {
    return {
      label: 'una instalación con baterías (híbridos)',
      test: (i) => i.attrs.hibrido === 'Sí' || i.attrs.tipo === 'Microinversor' || i.attrs.tipo === 'Optimizador'
    }
  }
  return null
}

/** La etiqueta «Compatible» / «Revisar» de una batería frente al inversor elegido, o null. */
export function insigniaBateria(item, inversor) {
  if (!inversor || item.attrs.compatible === undefined) return null
  const c = batteryCompat(item, inversor)
  return { text: c.ok ? 'Compatible' : 'Revisar', kind: c.ok ? 'ok' : 'warn', title: c.reason }
}

/** «Voc 56 V · Isc 13,9 A…»: los datos técnicos que tiene el equipo. */
export const lineaEspec = (specs, item) =>
  specs.filter((f) => !esValorVacio(item.attrs[f.key]))
    .map((f) => `${f.label.replace(/\s*\(.+\)$/, '')}: ${item.attrs[f.key]}${unidadDe(f.label)}`).join(' · ')

/** Con un panel elegido y los strings ya diseñados: los inversores del inventario que los admiten y cuántos de cada modelo hacen falta. */
export function inversoresCompatibles(state, panel, catalogo) {
  const diseno = state.strings || []
  if (!panel || diseno.length === 0) return []
  return catalogo.items
    .filter((i) => i.category === 'inversores' && !['Microinversor', 'Optimizador'].includes(String(i.attrs.tipo ?? '').trim()))
    .flatMap((item) => {
      const encaje = fitStrings(diseno, panel, item, state.moduleCount)
      return encaje ? [{ item, units: encaje.units }] : []
    })
    .sort((a, b) => a.units - b.units || a.item.unit_price * a.units - b.item.unit_price * b.units)
}

export const resumenStrings = summarizeStrings

/** Cuántos inversores de este modelo hay en el presupuesto. */
export const unidadesDeInversor = (state, inversor) =>
  Math.max(1, inversor ? state.lines.filter((l) => l.itemId === inversor.id).reduce((s, l) => s + effectiveQty(l, state), 0) : 1)
