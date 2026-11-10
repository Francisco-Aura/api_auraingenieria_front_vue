// Los datos de partida de un presupuesto (equivale a Values/valuesOf/applyValues de BudgetSetup.tsx del Planificador actual):
// se fijan al crearlo y condicionan todos los pasos.

import { panelCount } from './motor/pasosConfig.js'

/** De un presupuesto (CostState) a los valores del formulario de datos de partida. */
export function valoresDe(state) {
  const s = state.survey
  return {
    customer: state.customer,
    reference: state.reference,
    targetKwp: s.targetKwp,
    moduleWp: state.moduleWp,
    moduleCount: state.moduleCount,
    // El nº de paneles lo ha puesto a mano quien crea el presupuesto: ya no sigue a la potencia a instalar
    manualPanels: s.targetKwp > 0 && panelCount(s.targetKwp, state.moduleWp) !== state.moduleCount,
    roof: s.roof,
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
    customer: v.customer,
    reference: v.reference.trim(),
    moduleWp: v.moduleWp,
    moduleCount,
    saleRatio: v.saleRatio,
    strings: v.strings,
    survey: {
      ...base.survey,
      roof: v.roof,
      supply: v.supply,
      targetKwp: v.targetKwp,
      futureBattery: v.futureBattery,
      cableMeters: v.cableMeters,
      acMeters: v.acMeters
    }
  }
}

/** Lo que falta para poder crear el presupuesto. */
export function problemasDe(v, count) {
  const problemas = []
  if (!v.customer) problemas.push('Elige el cliente del presupuesto: uno existente o un cliente potencial nuevo.')
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
