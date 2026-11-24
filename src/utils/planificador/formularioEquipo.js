// Lógica del formulario de un producto del inventario, sin pantalla (equivale a Form/formOf/payloadOf de Inventory.tsx).

import { claveExtra, leerClaveExtra } from './caracteristicas.js'
import { diasDesde } from './formato.js'

export const UNIDADES = ['ud', 'módulo', 'kit', 'm', 'h', 'día', 'viaje']

/** Campos (filtros y datos técnicos) de una categoría. */
export const camposDe = (categoria) => [...((categoria && categoria.filters) || []), ...((categoria && categoria.specs) || [])]

/** « Wp» de «Potencia (Wp)»: la unidad que acompaña al valor en la etiqueta. */
export function unidadDe(etiqueta) {
  const m = /\((.+)\)/.exec(etiqueta)
  return m ? ` ${m[1]}` : ''
}

/** «615» o «1,5» se guardan como número; el resto, como texto. */
export function valorAtributo(crudo) {
  const n = Number(crudo.trim().replace(',', '.'))
  return crudo.trim() !== '' && Number.isFinite(n) ? n : crudo.trim()
}

export const aNumero = (texto) => Number(String(texto).trim().replace(',', '.')) || 0

export const formularioVacio = (categoria) => ({
  category: categoria,
  brand: '',
  model: '',
  offers: [],
  principal: '',
  unit: 'ud',
  stock: '0',
  notes: '',
  attrs: {},
  extras: []
})

export function formularioDe(producto, categoria) {
  const conocidas = new Set(camposDe(categoria).map((f) => f.key))
  const attrs = {}
  const extras = []
  for (const [clave, valor] of Object.entries(producto.attrs || {})) {
    if (conocidas.has(clave)) attrs[clave] = String(valor)
    else extras.push({ clave, ...leerClaveExtra(clave), valor: String(valor) })
  }
  return {
    category: producto.category,
    brand: producto.brand,
    model: producto.model,
    offers: (producto.offers || []).map((o) => ({ supplier: o.supplier, price: String(o.price).replace('.', ','), ref: o.ref })),
    principal: producto.supplier,
    unit: producto.unit,
    stock: String(producto.stock ?? 0).replace('.', ','),
    notes: producto.notes,
    attrs,
    extras
  }
}

/** El proveedor principal: el elegido si sigue en la lista, y si no el primero. */
export function principalDe(form) {
  if (form.offers.some((o) => o.supplier && o.supplier === form.principal)) return form.principal
  const primera = form.offers.find((o) => o.supplier)
  return primera ? primera.supplier : ''
}

/** El cuerpo que se envía al servidor al crear o cambiar un producto. */
export function cuerpoDe(form) {
  const attrs = {}
  for (const [clave, crudo] of Object.entries(form.attrs)) if (crudo.trim() !== '') attrs[clave] = valorAtributo(crudo)
  for (const extra of form.extras) {
    if (!extra.nombre.trim() || !extra.valor.trim()) continue
    attrs[extra.clave ?? claveExtra(extra.grupo, extra.nombre)] = valorAtributo(extra.valor)
  }
  const principal = principalDe(form)
  const ofertaPrincipal = form.offers.find((o) => o.supplier === principal)
  return {
    brand: form.brand.trim(),
    model: form.model.trim(),
    supplier: principal,
    offers: form.offers
      .filter((o) => o.supplier)
      .map((o) => ({ supplier: o.supplier, price: aNumero(o.price), ref: o.ref.trim(), note: '' })),
    unit: form.unit.trim() || 'ud',
    unit_price: aNumero(ofertaPrincipal ? ofertaPrincipal.price : '0'),
    stock: Number(form.stock.trim().replace(',', '.')) || 0,
    notes: form.notes.trim(),
    attrs
  }
}

/** Qué falla en el formulario (texto para el usuario) o null si está bien. */
export function problemaDe(form) {
  if (!form) return null
  if (!form.category) return 'Elige una categoría.'
  if (!form.brand.trim() && !form.model.trim()) return 'Indica al menos la marca o el modelo.'
  if (form.offers.some((o) => o.price.trim() !== '' && !(Number(o.price.replace(',', '.')) >= 0))) return 'Algún precio no es un número válido.'
  if (form.offers.some((o) => !o.supplier && (o.price.trim() !== '' || o.ref.trim() !== ''))) return 'Elige el proveedor de cada precio.'
  const conProveedor = form.offers.filter((o) => o.supplier)
  if (new Set(conProveedor.map((o) => o.supplier)).size !== conProveedor.length) return 'Un proveedor está repetido.'
  if (form.stock.trim() !== '' && !(Number(form.stock.replace(',', '.')) >= 0)) return 'El stock tiene que ser un número igual o mayor que 0.'
  return null
}

/** Precio por revisar: nunca revisado o hace ya el plazo (15 días) o más. Sin precio no hay nada que revisar. */
export const necesitaRevision = (producto, plazo, hoy = new Date()) =>
  producto.unit_price > 0 && (!producto.price_reviewed_at || diasDesde(producto.price_reviewed_at, hoy) >= plazo)

/** Las características principales (las que también sirven de filtro) para la tarjeta del producto. */
export function destacadas(producto, categoria, esValorVacio) {
  const datos = []
  for (const f of (categoria && categoria.filters) || []) {
    const crudo = (producto.attrs || {})[f.key]
    if (crudo === undefined || esValorVacio(crudo)) continue
    datos.push({ key: f.key, label: f.label.replace(/\s*\(.+\)$/, ''), value: `${crudo}${unidadDe(f.label)}` })
  }
  const mostradas = new Set(datos.map((d) => d.key))
  const mas = Object.entries(producto.attrs || {}).filter(([k, v]) => !esValorVacio(v) && !mostradas.has(k)).length
  return { datos, mas }
}
