// Cálculos del editor de «Presupuesto con cambios» sin pantalla (equivale a la lógica de BudgetChanges.tsx): un cambio se redacta
// escribiendo las cantidades que quedan y, al guardarlo, se calcula cuántas unidades se añaden o se quitan en cada línea.

import { effectiveQty } from '../motor/costes.js'

const redondear3 = (n) => Math.round(n * 1000) / 1000
const redondear2 = (n) => Math.round(n * 100) / 100

/** Identificador de una línea nueva que nace en un cambio. */
export const nuevoIdLinea = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Borrador de cambio: parte de las cantidades vigentes. `impacto` null = el que sale de la variación del presupuesto de venta. */
export function crearBorrador(vista, hoy) {
  return {
    modulos: vista.current.module_count,
    cantidades: Object.fromEntries(vista.lines.filter((l) => !l.auto).map((l) => [l.id, l.current_qty])),
    nuevas: [], fecha: hoy, motivo: '', impacto: null, modoPago: 'split'
  }
}

/** Cantidad que tendría una línea con lo que se ha escrito (las que siguen a los módulos usan el número de módulos del borrador). */
export function cantidadDeBorrador(fila, borrador) {
  if (!borrador) return fila.current_qty
  return fila.auto ? borrador.modulos : (borrador.cantidades[fila.id] ?? fila.current_qty)
}

/** Coste, venta y sus diferencias con lo vigente, contando lo escrito en el borrador. */
export function totalesDeBorrador(vista, borrador) {
  if (!borrador) return { coste: vista.current.cost, venta: vista.current.budget, dCoste: 0, dVenta: 0 }
  const coste = vista.lines.reduce((s, l) => s + cantidadDeBorrador(l, borrador) * l.price, 0) + borrador.nuevas.reduce((s, a) => s + a.qty * a.data.price, 0)
  const venta = vista.sale_ratio * vista.module_wp * borrador.modulos
  return { coste, venta, dCoste: redondear2(coste - vista.current.cost), dVenta: redondear2(venta - vista.current.budget) }
}

/**
 * Lo que el borrador cambia: variación de cada línea y de módulos. Si cambian los módulos, también cambian los datos del contrato que las
 * tareas usan (paneles y potencia), y por eso se reabren las hechas. Devuelve null si no se ha tocado nada.
 */
export function construirCambio(vista, borrador) {
  const lines = []
  for (const fila of vista.lines) {
    if (fila.auto) continue
    const delta = redondear3((borrador.cantidades[fila.id] ?? fila.current_qty) - fila.current_qty)
    if (delta !== 0) lines.push({ id: fila.id, qty_delta: delta })
  }
  for (const a of borrador.nuevas) if (a.qty > 0) lines.push({ id: a.id, qty_delta: a.qty, new: a.data })
  const module_delta = borrador.modulos - vista.current.module_count
  if (module_delta === 0 && lines.length === 0) return null
  const set = module_delta !== 0 ? { paneles_uds: borrador.modulos, potencia_kwp: Math.round((vista.module_wp * borrador.modulos) / 10) / 100 } : {}
  return { budget: { module_delta, lines }, set }
}

/** Línea nueva (con los datos de un producto del catálogo) que se añade al borrador con cantidad 1. */
export function lineaNueva(linea) {
  return {
    id: nuevoIdLinea(), qty: 1,
    data: { itemId: linea.itemId, group: linea.group, equipment: linea.equipment, model: linea.model, supplier: linea.supplier, unit: linea.unit, qty: 0, auto: false, price: linea.price, notes: linea.notes }
  }
}

/** El presupuesto del Presupuestador como presupuesto inicial del proyecto (las cantidades que siguen a los paneles se fijan). */
export function baseDesdePresupuestador(costes) {
  return {
    client: costes.client, moduleWp: costes.moduleWp, moduleCount: costes.moduleCount, saleRatio: costes.saleRatio,
    lines: costes.lines.map((l) => (l.perPanel ? { ...l, qty: effectiveQty(l, costes), perPanel: undefined } : l))
  }
}

/** Partidas que se ven, en el orden del catálogo (y al final las que el catálogo no conoce). */
export function gruposOrdenados(filas, partidas) {
  const grupos = [...new Set(filas.map((l) => l.group))]
  if (!partidas) return grupos
  const conocidas = new Set(partidas.map((p) => p.key))
  return [...partidas.map((p) => p.key).filter((k) => grupos.includes(k)), ...grupos.filter((g) => !conocidas.has(g))]
}
