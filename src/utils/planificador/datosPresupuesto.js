// Los datos de partida de un presupuesto (equivale a Values/valuesOf/applyValues de BudgetSetup.tsx del Planificador actual):
// se fijan al crearlo y condicionan todos los pasos.

import { defaultLayout, layoutOf, panelCount, repartoDePaneles, roofsOf } from './motor/pasosConfig.js'
import { claveGrupo } from './proyectos.js'
import { budgetName } from './almacenPresupuestos.js'

/** Cómo se colocan los paneles en cada cubierta y cuántos van en cada una; lo que falta se rellena (disposición por defecto, reparto igual). */
export function disposicionDe(survey, total) {
  const roofs = roofsOf(survey)
  return {
    roofLayouts: Object.fromEntries(roofs.filter((r) => defaultLayout(r)).map((r) => [r, layoutOf(survey, r) || defaultLayout(r)])),
    roofPanels: repartoDePaneles(roofs, survey && survey.roofPanels, total)
  }
}

/** De un presupuesto (CostState) a los valores del formulario de datos de partida. */
export function valoresDe(state) {
  const s = state.survey
  return {
    customer: state.customer,
    reference: state.reference,
    // El CIF de la empresa; en presupuestos anteriores solo estaba en el cliente potencial
    cif: state.cif || (state.customer && state.customer.cif) || '',
    clientLogo: state.clientLogo || '',
    encaje: state.encaje || '',
    targetKwp: s.targetKwp,
    moduleWp: state.moduleWp,
    moduleCount: state.moduleCount,
    // El nº de paneles lo ha puesto a mano quien crea el presupuesto: ya no sigue a la potencia a instalar
    manualPanels: s.targetKwp > 0 && panelCount(s.targetKwp, state.moduleWp) !== state.moduleCount,
    roofs: roofsOf(s),
    ...disposicionDe(s, state.moduleCount),
    supply: s.supply,
    futureBattery: s.futureBattery,
    strings: state.strings,
    cableMeters: s.cableMeters,
    acMeters: s.acMeters,
    saleRatio: state.saleRatio
  }
}

/** Nº de paneles que valen los valores: el puesto a mano o el que sale de la potencia a instalar. */
export function cuantosPaneles(v) {
  const auto = panelCount(v.targetKwp, v.moduleWp)
  return v.manualPanels ? v.moduleCount : auto || v.moduleCount
}

/** El presupuesto `base` con los datos de partida puestos (lo demás —filas, orden…— se conserva). */
export function aplicarValores(base, v) {
  const moduleCount = v.manualPanels ? v.moduleCount : panelCount(v.targetKwp, v.moduleWp) || v.moduleCount
  return {
    ...base,
    client: (v.customer && v.customer.name) || base.client,
    // El CIF también se anota en el cliente potencial que no lo tenga (se pide al validar)
    customer: v.customer && v.customer.kind === 'potencial' && !v.customer.cif && v.cif.trim() ? { ...v.customer, cif: v.cif.trim() } : v.customer,
    reference: v.reference.trim(),
    cif: v.cif.trim(),
    clientLogo: v.clientLogo,
    encaje: v.encaje || '',
    moduleWp: v.moduleWp,
    moduleCount,
    saleRatio: v.saleRatio,
    strings: v.strings,
    survey: {
      ...base.survey,
      roof: roofsOf({ roofs: v.roofs })[0],
      roofs: roofsOf({ roofs: v.roofs }),
      // Solo de las cubiertas elegidas; con una sola cubierta no hay reparto que guardar
      roofLayouts: Object.fromEntries(roofsOf({ roofs: v.roofs }).filter((r) => v.roofLayouts && layoutOf({ roofLayouts: v.roofLayouts }, r)).map((r) => [r, v.roofLayouts[r]])),
      roofPanels: roofsOf({ roofs: v.roofs }).length > 1 ? repartoDePaneles(roofsOf({ roofs: v.roofs }), v.roofPanels, moduleCount) : {},
      supply: v.supply,
      targetKwp: v.targetKwp,
      futureBattery: v.futureBattery,
      cableMeters: v.cableMeters,
      acMeters: v.acMeters
    }
  }
}

/**
 * La propuesta del servidor a la que pertenece un presupuesto (mismo cliente y mismo nombre de proyecto), entre `registros` (la lista de
 * propuestas: { id, customer, project }). Null si no hay.
 */
export function propuestaDelPresupuesto(state, registros) {
  if (!state || !state.customer || !(state.reference || '').trim()) return null
  const clave = claveGrupo(budgetName(state), state.customer.kind)
  return (registros || []).find((v) => v.customer && claveGrupo(v.customer.name + ' · ' + v.project, v.customer.kind) === clave) || null
}

/** El CIF, el logo y el encaje que tiene la propuesta y le faltan al presupuesto. El mismo estado si no hay nada que completar. */
export function conEmpresaDePropuesta(state, propuesta) {
  if (!propuesta) return state
  const cif = (state.cif || '').trim() ? state.cif : (propuesta.customer && propuesta.customer.cif) || ''
  const clientLogo = state.clientLogo || propuesta.logo || ''
  const encaje = state.encaje || propuesta.encaje || ''
  if (cif === (state.cif || '') && clientLogo === (state.clientLogo || '') && encaje === (state.encaje || '')) return state
  return { ...state, cif, clientLogo, encaje }
}

/** Lo que falta para poder crear el presupuesto. Con `empresaDeLaPropuesta`, el CIF no se pide aquí: lo pide la propia propuesta. */
export function problemasDe(v, count, { empresaDeLaPropuesta = false } = {}) {
  const problemas = []
  if (!v.customer) problemas.push('Elige el cliente del presupuesto: uno existente o un cliente potencial nuevo.')
  if (!Array.isArray(v.roofs) || v.roofs.length === 0) problemas.push('Elige al menos un tipo de cubierta.')
  if (Array.isArray(v.roofs) && v.roofs.length > 1 && count >= 1) {
    const puestos = v.roofs.reduce((s, r) => s + (Number.isInteger(v.roofPanels && v.roofPanels[r]) ? v.roofPanels[r] : 0), 0)
    if (puestos !== count) problemas.push(`Reparte los ${count} paneles entre las cubiertas: ahora suman ${puestos}.`)
  }
  if (!v.reference.trim()) problemas.push('Escribe el nombre del proyecto (por ejemplo «Nave 2»): con el cliente identifica a qué proyecto pertenece el presupuesto.')
  if (!empresaDeLaPropuesta && (!v.cif || v.cif.trim().length < 5)) problemas.push('Escribe el CIF de la empresa del cliente: sale en la propuesta.')
  if (!(v.targetKwp > 0)) problemas.push('Indica la potencia que se quiere instalar (kWp).')
  if (!(v.moduleWp > 0)) problemas.push('Indica la potencia de cada panel (Wp).')
  if (!(count >= 1)) problemas.push('El presupuesto necesita al menos un panel.')
  return problemas
}

/** El cuerpo que se manda al servidor al guardar un presupuesto compartido. */
export function cuerpoParaServidor(trabajo, nombre, cliente) {
  return {
    name: nombre,
    data: trabajo.state,
    customer_kind: cliente.kind,
    customer_id: cliente.kind === 'existente' ? cliente.id : undefined,
    kwp: trabajo.numbers.kwp,
    panels: trabajo.numbers.panels,
    budget_total: trabajo.numbers.total
  }
}

/** Lo guardado en el servidor pasa a ser lo último sincronizado de la copia de trabajo. */
export function sincronizado(trabajo, completo, enviado, canonical) {
  if (!trabajo || trabajo.id !== completo.id) return trabajo
  return {
    ...trabajo,
    remote: {
      version: completo.version,
      syncedJson: canonical(enviado),
      owner: completo.owner,
      ownerId: completo.owner_id,
      updatedBy: completo.updated_by,
      updatedAt: completo.updated_at,
      status: completo.status
    }
  }
}
