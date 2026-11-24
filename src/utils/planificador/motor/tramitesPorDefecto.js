// Las partidas de proyecto y trámites que un presupuesto nuevo lleva ya puestas, según la potencia de la instalación. Cada regla enlaza con
// su producto del inventario por el «Trámite» (categoría Proyecto), no por el nombre ni el precio: esos los puede cambiar el inventario.

import { newLine } from './costes.js'

/** Por encima de esta potencia (kW) la instalación necesita proyecto técnico; hasta ella, memoria técnica. */
export const KW_PROYECTO = 10
/** Cada tramo de esta potencia (kW) suma una unidad de dirección de obra. */
export const KW_POR_DIRECCION_DE_OBRA = 50

/** `cuando(kw)`: si se aplica (siempre, si no está); `cantidad(kw)`: unidades (1, si no está). */
export const TRAMITES_POR_DEFECTO = [
  { tramite: 'Proyecto técnico', cuando: (kw) => kw > KW_PROYECTO },
  { tramite: 'Memoria técnica', cuando: (kw) => kw <= KW_PROYECTO },
  { tramite: 'Dirección de obra', cantidad: (kw) => Math.max(1, Math.ceil(kw / KW_POR_DIRECCION_DE_OBRA - 1e-9)) },
  { tramite: 'Tramitación' },
  { tramite: 'Seguridad y salud', cuando: (kw) => kw > KW_PROYECTO },
  { tramite: 'Legalización (boletín)' },
  { tramite: 'Registro de autoconsumo' },
  { tramite: 'Excedentes' },
  { tramite: 'Licencia municipal' }
]

/** La potencia de la instalación en kW: la de los paneles del presupuesto. */
export const potenciaKw = (state) => (state.moduleWp * state.moduleCount) / 1000

/** Lo que toca por defecto con esta potencia y el inventario: [{ item, qty }]. Una regla sin producto en el inventario se salta. */
export function partidasPorDefecto(kw, catalogo) {
  const salida = []
  for (const regla of TRAMITES_POR_DEFECTO) {
    if (regla.cuando && !regla.cuando(kw)) continue
    const item = catalogo.items.find((i) => i.category === 'proyecto' && String(i.attrs.tramite || '').trim() === regla.tramite)
    if (item) salida.push({ item, qty: regla.cantidad ? regla.cantidad(kw) : 1 })
  }
  return salida
}

/**
 * El presupuesto nuevo con sus partidas por defecto puestas, y sin la marca de «pendiente». Las que ya estén en el presupuesto no se repiten.
 * Sin potencia todavía (sin paneles), no se pone nada pero la marca se quita igualmente.
 */
export function conTramitesPorDefecto(state, catalogo) {
  const { tramitesPendientes, ...resto } = state // eslint-disable-line no-unused-vars
  const kw = potenciaKw(state)
  if (!(kw > 0)) return resto
  const etiqueta = (catalogo.categories.find((c) => c.key === 'proyecto') || {}).label || 'Proyecto'
  const lineas = partidasPorDefecto(kw, catalogo)
    .filter(({ item }) => !state.lines.some((l) => l.itemId === item.id))
    .map(({ item, qty }) => ({ ...newLine(item, etiqueta), qty }))
  return { ...resto, lines: [...state.lines, ...lineas] }
}
