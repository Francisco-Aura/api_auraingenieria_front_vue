// Estudio asociado a un presupuesto. Solo se asocian los del mismo cliente y del mismo proyecto (el servidor lo exige también:
// PresupuestoService.motivoIncompatible), así que el selector solo ofrece esos.

import { claveTexto, partesDeNombre } from './proyectos.js'

/** ¿Es del mismo cliente? Uno de la intranet, por su id; un potencial, por el nombre. `p` = { name, customer_kind, customer_id }. */
function mismoCliente(p, e) {
  const c = e.customer || {}
  if (p.customer_kind === 'existente') return c.kind === 'existente' && c.id === p.customer_id
  return c.kind !== 'existente' && claveTexto(e.cliente) === claveTexto(partesDeNombre(p.name).cliente)
}

/** Los estudios que se pueden asociar al presupuesto `p` (resumen del servidor): mismo cliente y mismo proyecto. */
export function estudiosCompatibles(p, estudios) {
  const proyecto = claveTexto(partesDeNombre(p.name).proyecto)
  return (estudios || []).filter((e) => mismoCliente(p, e) && claveTexto(e.proyecto) === proyecto)
}

const kw = (n) => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 })

/** «120 kWp · En estudio»: lo que distingue un estudio de otro del mismo proyecto. */
export function etiquetaEstudio(e) {
  return [e.kwp > 0 ? kw(e.kwp) + ' kWp' : 'Sin calcular', e.estadoNombre || e.estado].join(' · ')
}
