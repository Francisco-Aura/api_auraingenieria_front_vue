// Formatos y utilidades del inventario (equivalen a costs.ts del Planificador actual).

const formatoEuro = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export const eur = (n) => formatoEuro.format(n)

/** Cantidad con hasta 2 decimales: 1234,5 */
export const cantidad = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 2 })

/** Valores distintos y no vacíos que devuelve `leer` para cada producto, ordenados como en español (números incluidos). */
export function valoresDistintos(productos, leer) {
  const vistos = new Set()
  for (const p of productos) {
    const v = leer(p)
    if (v !== undefined && v !== null && String(v).trim() !== '') vistos.add(String(v))
  }
  return [...vistos].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
}

/** AAAA-MM-DD → DD/MM/AAAA */
export const fechaCorta = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Días desde una fecha AAAA-MM-DD hasta hoy. */
export const diasDesde = (iso, hoy = new Date()) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round((Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - Date.UTC(y, m - 1, d)) / 86_400_000)
}

export const nombreProducto = (p) => [p.brand, p.model].filter(Boolean).join(' ') || 'Producto sin nombre'
