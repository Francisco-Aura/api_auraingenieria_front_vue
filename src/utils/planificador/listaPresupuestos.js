// Lógica de la lista de presupuestos, sin pantalla (equivale a BudgetList.tsx del Planificador actual).
// Una fila es un presupuesto local (solo en este navegador) o un borrador compartido del servidor.

import { budgetName, isDirty } from './almacenPresupuestos.js'
import { variantLabels } from './variantes.js'
import { sortRows } from './orden.js'

/** Con nivel de acceso 1 en la intranet se puede eliminar cualquier presupuesto del listado, no solo los propios. */
export const NIVEL_ADMIN = 1

export const ETIQUETA_ESTADO = {
  local: 'Local', borrador: 'Borrador', enviado: 'Enviado', validado: 'Validado', descartado: 'Descartado'
}

export const TITULO_ESTADO = {
  local: 'Solo existe en este navegador: nadie más lo ve',
  borrador: 'Guardado en el servidor: lo ven y lo pueden modificar todos los usuarios de la intranet',
  enviado: 'Ya se ha enviado al cliente: no se puede editar (para cambiar algo, crea una variante)',
  validado: 'El presupuesto elegido de su oferta',
  descartado: 'Se validó otra variante de su oferta'
}

export const ETIQUETA_PROPUESTA = {
  borrador: 'Propuesta en borrador', enviada: 'Propuesta entregada', aprobada: 'Aprobado', rechazada: 'Propuesta rechazada'
}

/** Las etiquetas de estado que ya existen en el programa: enviada = enviado, aprobada = validado, rechazada = descartado. */
export const CLASE_PROPUESTA = { borrador: 'borrador', enviada: 'enviado', aprobada: 'validado', rechazada: 'descartado' }

/** Una sola etiqueta por fila: la fase en la que está. Un presupuesto validado enseña cómo va su propuesta. */
export function etiquetaEstado(r) {
  if (r.kind !== 'validado') return { cls: r.kind, label: ETIQUETA_ESTADO[r.kind], title: TITULO_ESTADO[r.kind] }
  if (!r.proposal) return { cls: 'enviado', label: 'Falta propuesta', title: 'Presupuesto validado: falta hacer la propuesta que se manda al cliente' }
  return {
    cls: CLASE_PROPUESTA[r.proposal], label: ETIQUETA_PROPUESTA[r.proposal],
    title: 'Presupuesto validado · ' + ETIQUETA_PROPUESTA[r.proposal].toLowerCase()
  }
}

/** ¿Es de quien lo mira? Por id de la intranet y, sin él, por nombre. `usuario` = { id, nombre }. */
export function esMio(propietario, propietarioId, usuario) {
  const miId = usuario.id ? String(usuario.id) : ''
  if (propietarioId && miId) return propietarioId === miId
  return !!propietario && !!usuario.nombre && propietario.toLowerCase() === usuario.nombre.toLowerCase()
}

/** ¿Puede eliminarlo? Quien lo creó, un presupuesto sin autor o un usuario de nivel 1 (el servidor lo comprueba también). */
export const puedeBorrar = (propietario, propietarioId, usuario) =>
  usuario.nivel === NIVEL_ADMIN || !propietario || esMio(propietario, propietarioId, usuario)

/**
 * Las filas de la lista: los presupuestos del servidor y los locales de este navegador.
 * `locales` = listLocal(); `copiaLocal(id)` = getLocal(id). `remotos` es null mientras no se han podido leer.
 */
export function construirFilas({ remotos, locales, copiaLocal, usuario }) {
  const filas = []
  const vistos = new Set()
  for (const b of remotos || []) {
    vistos.add(b.id)
    const copia = copiaLocal(b.id)
    filas.push({
      id: b.id, name: b.name || 'Sin nombre', kind: b.status, offerId: b.offer_id, owner: b.owner, kwp: b.kwp, panels: b.panels,
      total: b.budget_total, updatedAt: b.updated_at, updatedBy: b.updated_by, mine: esMio(b.owner, b.owner_id, usuario),
      customer: b.customer_kind, proposal: b.proposal_status, variantName: b.variant_name, created: b.created_at,
      dirty: !!copia && isDirty(copia), orphan: false
    })
  }
  for (const l of locales) {
    if (vistos.has(l.id)) continue
    // Una copia de un borrador que el servidor ya no tiene (y el listado sí se ha podido leer): queda como local, con el aviso
    const huerfano = !!l.remote && remotos !== null
    // Si el listado del servidor no se ha podido leer, un borrador se sigue enseñando como tal con lo último que se sabía
    if (l.remote && remotos === null) {
      filas.push({
        id: l.id, name: budgetName(l.state), kind: l.remote.status, offerId: '', owner: l.remote.owner, kwp: l.numbers.kwp,
        panels: l.numbers.panels, total: l.numbers.total, updatedAt: l.updatedAt, updatedBy: l.remote.updatedBy,
        mine: esMio(l.remote.owner, l.remote.ownerId, usuario), customer: (l.state.customer && l.state.customer.kind) || '',
        dirty: isDirty(l), orphan: false
      })
      continue
    }
    filas.push({
      id: l.id, name: budgetName(l.state), kind: 'local', offerId: '', owner: usuario.nombre, kwp: l.numbers.kwp, panels: l.numbers.panels,
      total: l.numbers.total, updatedAt: l.updatedAt, updatedBy: '', mine: true, customer: (l.state.customer && l.state.customer.kind) || '',
      dirty: false, orphan: huerfano
    })
  }
  // Lo modificado más recientemente, primero; las variantes de una misma oferta juntas (donde está la primera de ellas)
  filas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const primera = new Map()
  filas.forEach((r, i) => { if (r.offerId && !primera.has(r.offerId)) primera.set(r.offerId, i) })
  return filas
    .map((r, i) => ({ r, at: r.offerId ? primera.get(r.offerId) : i, i }))
    .sort((a, b) => a.at - b.at || a.i - b.i)
    .map((x) => x.r)
}

/** Lo que tiene pendiente quien valida: ofertas enviadas (una oferta con varias variantes cuenta una vez) y propuestas entregadas. */
export function contarPendientes(filas, esValidador) {
  if (!esValidador) return 0
  const ofertas = new Set(filas.filter((r) => r.kind === 'enviado').map((r) => r.offerId || r.id)).size
  return ofertas + filas.filter((r) => r.kind === 'validado' && r.proposal === 'enviada').length
}

/** Filtros del listado: búsqueda de texto y «Mostrar» (todos, borradores compartidos, locales, pendientes de validar). */
export function filtrarFilas(filas, consulta, filtro) {
  const q = consulta.trim().toLowerCase()
  return filas.filter((r) =>
    (!q || (r.name + ' ' + r.owner + ' ' + r.updatedBy).toLowerCase().includes(q)) &&
    (filtro === 'todos' ||
      (filtro === 'porvalidar' ? r.kind === 'enviado' || (r.kind === 'validado' && r.proposal === 'enviada')
        : filtro === 'borradores' ? r.kind !== 'local' : r.kind === 'local')))
}

function valorColumna(r, clave) {
  switch (clave) {
    case 'name': return r.name
    case 'kind': return ETIQUETA_ESTADO[r.kind]
    case 'owner': return r.kind === 'local' ? 'Tú' : r.owner
    case 'kwp': return r.kwp
    case 'total': return r.total > 0 ? r.total : null // sin importe, al final
    case 'updated': return r.updatedAt
    default: return null
  }
}

/**
 * Lo que se ve en la tabla: las variantes de una oferta se recogen en una fila genérica que se despliega; se ordenan las filas
 * principales y cada una lleva debajo sus variantes (ordenar por una columna nunca separa una oferta).
 * Devuelve { items, etiquetas }: items = [{ tipo: 'grupo', ofertaId, name, count } | { tipo: 'fila', row, hija }].
 */
export function armarTabla(filtradas, orden, desplegadas) {
  const grupos = new Map()
  const cabezas = []
  for (const r of filtradas) {
    if (!r.offerId) cabezas.push(r)
    else if (!grupos.has(r.offerId)) { grupos.set(r.offerId, [r]); cabezas.push(r) } else grupos.get(r.offerId).push(r)
  }
  const mostradas = sortRows(cabezas, orden, valorColumna)
  const etiquetas = new Map()
  for (const g of grupos.values()) {
    variantLabels(g.map((r) => ({ id: r.id, created_at: r.created || '', variant_name: r.variantName || '' })))
      .forEach((etiqueta, id) => etiquetas.set(id, etiqueta))
  }
  const items = mostradas.flatMap((r) => {
    const cuenta = r.offerId ? (grupos.get(r.offerId) || []).length : 1
    if (!r.offerId || cuenta < 2) return [{ tipo: 'fila', row: r, hija: false }]
    const cabecera = { tipo: 'grupo', ofertaId: r.offerId, name: r.name, count: cuenta }
    return desplegadas.has(r.offerId) ? [cabecera, ...grupos.get(r.offerId).map((v) => ({ tipo: 'fila', row: v, hija: true }))] : [cabecera]
  })
  return { items, etiquetas, principales: mostradas.length }
}

/** Un presupuesto compartido se duplica como variante de su oferta; uno local o descartado, como copia local. */
export const esVariantable = (r) => r.kind !== 'local' && r.kind !== 'descartado' && !r.orphan

/** Qué botones de estado le tocan a un presupuesto del servidor (equivale al StatusBox del Planificador actual). */
export function accionesDeEstado({ estado, esValidador, estadoPropuesta, sinGuardar }) {
  if (estado === 'descartado') return { tipo: 'ninguna' }
  if (estado === 'enviado') return { tipo: esValidador ? 'validar' : 'esperar' }
  if (estado === 'validado') {
    if (!esValidador) return { tipo: 'elegido' }
    if (estadoPropuesta === 'enviada' || estadoPropuesta === 'aprobada') return { tipo: 'bloqueado', propuesta: estadoPropuesta }
    return { tipo: 'desvalidar' }
  }
  return { tipo: 'enviar', habilitado: !sinGuardar }
}
