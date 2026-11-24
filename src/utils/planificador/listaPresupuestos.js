// Lógica de la lista de presupuestos, sin pantalla (equivale a BudgetList.tsx del Planificador actual).
// Una fila es un presupuesto local (solo en este navegador) o un borrador compartido del servidor.

import { budgetName, isDirty } from './almacenPresupuestos.js'
import { variantLabels } from './variantes.js'
import { claveCliente, claveGrupo, partesDeNombre } from './proyectos.js'
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
  validado: 'Presupuesto validado: el que acepta el cliente (queda bloqueado)',
  descartado: 'Se aprobó otra variante de su oferta'
}

export const ETIQUETA_PROPUESTA = {
  borrador: 'Propuesta en borrador', enviada: 'Propuesta entregada', aprobada: 'Validada', rechazada: 'Anulada'
}

/** Las etiquetas de estado que ya existen en el programa: enviada = enviado, aprobada = validado, rechazada = descartado. */
export const CLASE_PROPUESTA = { borrador: 'borrador', enviada: 'enviado', aprobada: 'validado', rechazada: 'descartado' }

/** Los estados de un estudio (EstudioService.ESTADOS), con la etiqueta corta de la lista y la clase de color de su equivalente. */
export const ESTADOS_ESTUDIO = {
  en_estudio: { label: 'En estudio', cls: 'borrador' }, pte_doc: { label: 'Pte. documentación', cls: 'borrador' },
  entregado: { label: 'Informe entregado', cls: 'enviado' }, pte_cliente: { label: 'Pte. cliente', cls: 'enviado' },
  aceptado: { label: 'Aceptado', cls: 'validado' }, rechazado: { label: 'Rechazado', cls: 'descartado' }, cancelado: { label: 'Cancelado', cls: 'descartado' }
}

/**
 * Una sola etiqueta por fila: el estado del propio documento. Un estudio enseña el suyo y un presupuesto el suyo (validado es «Validado»);
 * cómo va la propuesta al cliente no sale aquí sino en la columna «Propuesta final» (etiquetaPropuesta).
 */
export function etiquetaEstado(r) {
  if (r.tipo === 'estudio') {
    if (r.kind === 'local') return { cls: 'local', label: ETIQUETA_ESTADO.local, title: TITULO_ESTADO.local }
    const e = ESTADOS_ESTUDIO[r.estado] || { label: r.estadoNombre || r.estado, cls: 'borrador' }
    return { cls: e.cls, label: e.label, title: r.estadoNombre || e.label }
  }
  return { cls: r.kind, label: ETIQUETA_ESTADO[r.kind], title: TITULO_ESTADO[r.kind] }
}

/** Cómo va la propuesta final de un presupuesto validado (lo que se entrega al cliente): solo para la columna «Propuesta final». */
export function etiquetaPropuesta(r) {
  if (!r.proposal) return { cls: 'enviado', label: 'Falta propuesta', title: 'Presupuesto validado: falta hacer la propuesta que se manda al cliente' }
  return {
    cls: CLASE_PROPUESTA[r.proposal], label: ETIQUETA_PROPUESTA[r.proposal],
    title: 'Propuesta final · ' + ETIQUETA_PROPUESTA[r.proposal].toLowerCase()
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
 * `estudios` = las filas de los estudios (filasDeEstudios): van en la misma lista, agrupadas por cliente y proyecto con sus presupuestos.
 */
export function construirFilas({ remotos, locales, copiaLocal, usuario, estudios = [] }) {
  const filas = []
  const vistos = new Set()
  for (const b of remotos || []) {
    vistos.add(b.id)
    const copia = copiaLocal(b.id)
    filas.push({
      id: b.id, name: b.name || 'Sin nombre', kind: b.status, offerId: b.offer_id, owner: b.owner, kwp: b.kwp, panels: b.panels,
      total: b.budget_total, updatedAt: b.updated_at, updatedBy: b.updated_by, mine: esMio(b.owner, b.owner_id, usuario),
      customer: b.customer_kind, proposal: b.proposal_status, variantName: b.variant_name, created: b.created_at,
      estudioId: b.study_id || '', proyectoId: b.project_id || '', dirty: !!copia && isDirty(copia), orphan: false
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
        created: l.createdAt || l.updatedAt, dirty: isDirty(l), orphan: false
      })
      continue
    }
    filas.push({
      id: l.id, name: budgetName(l.state), kind: 'local', offerId: '', owner: usuario.nombre, kwp: l.numbers.kwp, panels: l.numbers.panels,
      total: l.numbers.total, updatedAt: l.updatedAt, updatedBy: '', mine: true, customer: (l.state.customer && l.state.customer.kind) || '',
      created: l.createdAt || l.updatedAt, dirty: false, orphan: huerfano
    })
  }
  filas.push(...estudios)
  asignarGrupos(filas)
  // Lo modificado más recientemente, primero; las variantes de un mismo proyecto juntas (donde está la primera de ellas)
  filas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const primera = new Map()
  filas.forEach((r, i) => { if (r.grupo && !primera.has(r.grupo)) primera.set(r.grupo, i) })
  return filas
    .map((r, i) => ({ r, at: r.grupo ? primera.get(r.grupo) : i, i }))
    .sort((a, b) => a.at - b.at || a.i - b.i)
    .map((x) => x.r)
}

/**
 * Las filas de los estudios para la lista unificada. `remotos` = estudios del servidor (resumen); `locales` = copias de este navegador
 * (almacenEstudios.listLocal()); un estudio local que no está en el servidor es una fila «Local». Su nombre es «Cliente · Proyecto», como el
 * de un presupuesto, para que se agrupen por el mismo criterio.
 */
export function filasDeEstudios({ remotos, locales, usuario }) {
  const nombre = (cliente, proyecto) => (proyecto ? cliente + ' · ' + proyecto : cliente)
  const filas = []
  const vistos = new Set()
  for (const s of remotos || []) {
    vistos.add(s.id)
    filas.push({
      id: s.id, tipo: 'estudio', name: nombre(s.cliente || 'Sin cliente', s.proyecto), kind: 'estudio', estado: s.estado, estadoNombre: s.estadoNombre,
      offerId: '', owner: s.creadoPor || s.actualizadoPor || '', kwp: Number(s.kwp) || 0, panels: 0, total: 0, updatedAt: s.actualizadoEl || '',
      updatedBy: s.actualizadoPor || '', mine: false, customer: (s.customer && s.customer.kind) || '', created: s.creadoEl || s.actualizadoEl || '',
      proyectoId: s.project_id || '', dirty: false, orphan: false
    })
  }
  for (const l of locales || []) {
    if (vistos.has(l.id)) continue
    const c = l.state.customer
    const sim = l.calc && l.calc.resultado && l.calc.resultado.simulacion
    filas.push({
      id: l.id, tipo: 'estudio', name: nombre(c ? c.name : 'Sin cliente', l.state.proyecto), kind: 'local', estado: '', estadoNombre: '', offerId: '',
      owner: usuario.nombre, kwp: sim ? Number(sim.kwp) || 0 : 0, panels: 0, total: 0, updatedAt: l.updatedAt, updatedBy: '', mine: true,
      customer: (c && c.kind) || '', created: l.createdAt || l.updatedAt, dirty: false, orphan: false
    })
  }
  return filas
}

/**
 * A cada fila le pone su cliente y su proyecto (del nombre «Cliente · Proyecto») y su `grupo`. Si el servidor ya le dio su propuesta
 * (`proyectoId`), el grupo es esa propuesta, esté el nombre escrito como esté; las copias locales, que aún no la tienen, entran en la de
 * las filas del servidor con su mismo cliente y proyecto. Sin propuesta, los presupuestos del mismo cliente y del mismo proyecto son
 * variantes unos de otros, tengan o no la oferta del servidor (los locales no la tienen); sin proyecto en el nombre, o si la fila está
 * sola, el grupo es el de su oferta (o ninguno).
 */
function asignarGrupos(filas) {
  const cuenta = new Map()
  const ofertaDe = new Map()
  const propuestaDe = new Map()
  for (const r of filas) {
    const { cliente, proyecto } = partesDeNombre(r.name)
    r.clienteNombre = cliente
    r.proyectoNombre = proyecto
    r.clienteClave = claveCliente(r.name, r.customer)
    r.proyectoClave = claveGrupo(r.name, r.customer)
    if (!r.proyectoClave) continue
    cuenta.set(r.proyectoClave, (cuenta.get(r.proyectoClave) || 0) + 1)
    if (r.offerId && !ofertaDe.has(r.proyectoClave)) ofertaDe.set(r.proyectoClave, r.offerId)
    if (r.proyectoId && !propuestaDe.has(r.proyectoClave)) propuestaDe.set(r.proyectoClave, r.proyectoId)
  }
  for (const r of filas) {
    r.proyectoId = r.proyectoId || (r.proyectoClave && propuestaDe.get(r.proyectoClave)) || ''
    if (r.proyectoId) {
      r.grupo = 'propuesta:' + r.proyectoId
      continue
    }
    r.grupo = r.offerId || (r.proyectoClave && cuenta.get(r.proyectoClave) > 1 ? ofertaDe.get(r.proyectoClave) || 'proyecto:' + r.proyectoClave : '')
  }
}

/**
 * Las opciones de los filtros «Cliente» y «Proyecto» (los proyectos, solo los del cliente elegido): [{ valor, etiqueta }].
 * Distintas escrituras del mismo cliente o proyecto cuentan como uno.
 */
export function opcionesFiltro(filas, clienteElegido = '') {
  const clientes = new Map()
  const proyectos = new Map()
  for (const r of filas) {
    if (r.clienteNombre && !clientes.has(r.clienteClave)) clientes.set(r.clienteClave, r.clienteNombre)
    if (r.proyectoNombre && (!clienteElegido || r.clienteClave === clienteElegido) && !proyectos.has(r.proyectoClave)) {
      proyectos.set(r.proyectoClave, clienteElegido ? r.proyectoNombre : r.clienteNombre + ' · ' + r.proyectoNombre)
    }
  }
  const lista = (m) => [...m].map(([valor, etiqueta]) => ({ valor, etiqueta })).sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'))
  return { clientes: lista(clientes), proyectos: lista(proyectos) }
}

/** Estados de un estudio con los que no se valida su propuesta: los decide una persona (el cliente lo rechazó o se cayó). */
export const ESTADOS_QUE_BLOQUEAN_LA_VALIDACION = ['rechazado', 'cancelado']

/**
 * Los presupuestos cuya propuesta entregada ya se puede validar: presupuesto aprobado y estudio asociado que no esté rechazado ni
 * cancelado (al validar la propuesta, el estudio pasa solo a aceptado).
 */
export function pendientesDeValidar(filas) {
  const validos = new Set(filas.filter((r) => r.tipo === 'estudio' && r.kind !== 'local' && !ESTADOS_QUE_BLOQUEAN_LA_VALIDACION.includes(r.estado)).map((r) => r.id))
  return filas.filter((r) => r.tipo !== 'estudio' && r.kind === 'validado' && r.proposal === 'enviada' && validos.has(r.estudioId))
}

/** Lo que tiene pendiente quien valida: las propuestas entregadas que ya cumplen las condiciones. */
export function contarPendientes(filas, esValidador) {
  return esValidador ? pendientesDeValidar(filas).length : 0
}

/**
 * Filtros del listado: búsqueda de texto, «Mostrar» (todos, borradores compartidos, locales, pendientes de validar) y, si se pasan,
 * el cliente y el proyecto (por las claves de opcionesFiltro).
 */
export function filtrarFilas(filas, consulta, filtro, cliente = '', proyecto = '', tipo = '') {
  const q = consulta.trim().toLowerCase()
  const porValidar = filtro === 'porvalidar' ? new Set(pendientesDeValidar(filas).map((r) => r.id)) : null
  return filas.filter((r) =>
    (!tipo || (r.tipo === 'estudio' ? 'estudio' : 'presupuesto') === tipo) &&
    (!q || (r.name + ' ' + r.owner + ' ' + r.updatedBy).toLowerCase().includes(q)) &&
    (!cliente || r.clienteClave === cliente) && (!proyecto || r.proyectoClave === proyecto) &&
    (filtro === 'todos' ||
      (filtro === 'porvalidar' ? porValidar.has(r.id)
        : filtro === 'borradores' ? r.kind !== 'local' : r.kind === 'local')))
}

/** Cuántos presupuestos de cada estudio se enseñan antes de «Ver todos». */
export const MAX_VERSIONES = 3

const masReciente = (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')

function valorProyecto(p, clave) {
  return clave === 'updated' ? p.updatedAt : p.nombre
}

/**
 * Una fila por proyecto (mismo cliente y proyecto, o la misma oferta). Los filtros eligen proyectos: de un proyecto que cumple, salen
 * todos sus estudios y presupuestos. `todas` = todas las filas; `filtradas` = las que cumplen los filtros.
 * Cada proyecto lleva su `resumen` (el más reciente de cada tipo y cuántos más hay; si falta un tipo, el hueco para crearlo) y, si
 * tiene más de un estudio o de un presupuesto y está abierto (`desplegados`), sus `lineas`: una por presupuesto, con el estudio al que
 * está enlazado (study_id). `verTodos` = proyectos que enseñan todos sus presupuestos y no solo los MAX_VERSIONES últimos de cada estudio.
 * `vacios` = los proyectos creados en el servidor que se quieren enseñar (ya filtrados): salen los que todavía no tienen ningún estudio
 * ni presupuesto (mismo cliente y mismo nombre de proyecto), con los dos huecos para crearlos. `registros` = todas las propuestas creadas
 * en el servidor (por defecto, las mismas): la que corresponde a cada proyecto queda en su `registro` (con ella se editan el CIF, el logo y
 * el encaje que heredan los presupuestos nuevos).
 */
export function armarProyectos(todas, filtradas, orden = null, desplegados = new Set(), verTodos = new Set(), vacios = [], registros = vacios) {
  const claveDe = (r) => (r.grupo !== undefined ? r.grupo : r.offerId) || 'solo:' + r.id
  const visibles = new Set(filtradas.map(claveDe))
  const grupos = new Map()
  for (const r of todas) {
    const k = claveDe(r)
    if (!visibles.has(k)) continue
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(r)
  }
  const proyectos = [...grupos].map(([k, filas]) => armarProyecto(k, filas, desplegados.has(k), verTodos.has(k)))
  const conDocumentos = new Set(todas.map((r) => r.proyectoClave).filter(Boolean))
  const conPropuesta = new Set(todas.map((r) => r.proyectoId).filter(Boolean))
  for (const v of vacios) if (!conPropuesta.has(v.id) && !conDocumentos.has(claveDeProyectoServidor(v))) proyectos.push(proyectoVacio(v))
  const registroDe = new Map(registros.map((v) => [claveDeProyectoServidor(v), v]))
  const registroDeId = new Map(registros.map((v) => [v.id, v]))
  for (const p of proyectos) if (!p.registro) p.registro = registroDeId.get(p.proyectoId) || registroDe.get(p.proyectoClave) || null
  // Sin ordenar, lo modificado (o creado) más recientemente, primero
  if (!orden) proyectos.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return sortRows(proyectos, orden, valorProyecto)
}

/** La clave que tendrían los estudios y presupuestos de un proyecto del servidor (la de asignarGrupos). */
export function claveDeProyectoServidor(p) {
  return claveGrupo(p.customer.name + ' · ' + p.project, p.customer.kind)
}

/** Los estados de un estudio en los que ya está hecho el informe (entregado, esperando al cliente o aceptado). */
export const ESTUDIO_TERMINADO = ['entregado', 'pte_cliente', 'aceptado']

/**
 * La propuesta final de una propuesta de la lista: aparece cuando ya hay un estudio terminado y un presupuesto validado (el elegido).
 * Devuelve { presupuesto, estudio, etiqueta } (la etiqueta enseña cómo va lo que se entrega al cliente) o null mientras falte algo.
 */
export function propuestaFinalDe(estudios, presupuestos) {
  const presupuesto = presupuestos.find((r) => r.kind === 'validado')
  const estudio = presupuesto && (estudios.find((e) => e.id === presupuesto.estudioId && ESTUDIO_TERMINADO.includes(e.estado)) || estudios.find((e) => ESTUDIO_TERMINADO.includes(e.estado)))
  return presupuesto && estudio ? { presupuesto, estudio, etiqueta: etiquetaPropuesta(presupuesto) } : null
}

/** Un proyecto del servidor sin estudios ni presupuestos: sus dos huecos y el cliente entero, para precargar lo que se cree. */
function proyectoVacio(v) {
  return {
    clave: 'proyecto:' + v.id, vacio: true, id: v.id, registro: v, proyectoClave: claveDeProyectoServidor(v), customer: v.customer, estudios: [], presupuestos: [], etiquetas: new Map(),
    final: null, plegable: false, abierto: false, todos: false, cliente: v.customer.name, proyecto: v.project, nombre: v.customer.name + ' ' + v.project,
    sinCliente: false, potencial: v.customer.kind === 'potencial', updatedAt: v.created_at || '', lineas: [],
    resumen: { estudio: null, presupuesto: null, masEstudios: 0, masPresupuestos: 0, huecoEstudio: true, huecoPresupuesto: true, origen: null }
  }
}

function armarProyecto(clave, filas, abierto, todos) {
  const estudios = filas.filter((r) => r.tipo === 'estudio').sort(masReciente)
  const presupuestos = filas.filter((r) => r.tipo !== 'estudio').sort(masReciente)
  const primera = [...filas].sort(masReciente)[0]
  const etiquetas = variantLabels(presupuestos.map((r) => ({ id: r.id, created_at: r.created || '', variant_name: r.variantName || '' })))
  const plegable = estudios.length > 1 || presupuestos.length > 1
  const proyecto = {
    clave, estudios, presupuestos, etiquetas, plegable, final: propuestaFinalDe(estudios, presupuestos), abierto: plegable && abierto, todos, proyectoClave: primera.proyectoClave || '', proyectoId: (filas.find((r) => r.proyectoId) || {}).proyectoId || '', registro: null,
    cliente: primera.clienteNombre || primera.name, proyecto: primera.proyectoNombre || '',
    nombre: (primera.clienteNombre || primera.name) + ' ' + (primera.proyectoNombre || ''),
    sinCliente: filas.some((r) => r.customer === ''), potencial: filas.some((r) => r.customer === 'potencial'),
    updatedAt: primera.updatedAt || '',
    resumen: {
      estudio: estudios[0] || null, presupuesto: presupuestos[0] || null,
      masEstudios: Math.max(0, estudios.length - 1), masPresupuestos: Math.max(0, presupuestos.length - 1),
      huecoEstudio: estudios.length === 0, huecoPresupuesto: presupuestos.length === 0,
      origen: estudios.length === 0 ? presupuestos[0] : presupuestos.length === 0 ? estudios[0] : null
    },
    lineas: []
  }
  if (proyecto.abierto) proyecto.lineas = armarLineas(estudios, presupuestos, todos)
  return proyecto
}

function armarLineas(estudios, presupuestos, todos) {
  const deEstudio = new Map(estudios.map((e) => [e.id, []]))
  const sueltos = []
  for (const p of presupuestos) (deEstudio.has(p.estudioId) ? deEstudio.get(p.estudioId) : sueltos).push(p)
  const ultimo = (par) => [par.e.updatedAt, par.ps[0] && par.ps[0].updatedAt].filter(Boolean).sort().pop() || ''
  const parejas = estudios.map((e) => ({ e, ps: deEstudio.get(e.id) })).sort((a, b) => ultimo(b).localeCompare(ultimo(a)))
  const lineas = []
  let restan = 0
  const limitar = (lista) => {
    if (todos || lista.length <= MAX_VERSIONES) return lista
    restan += lista.length - MAX_VERSIONES
    return lista.slice(0, MAX_VERSIONES)
  }
  for (const { e, ps } of parejas) {
    if (ps.length === 0) { lineas.push({ clave: e.id, estudio: e, presupuesto: null, huecoPresupuesto: true, origen: e }); continue }
    limitar(ps).forEach((p, i) => lineas.push({ clave: e.id + '/' + p.id, estudio: i === 0 ? e : null, continuacion: i > 0, presupuesto: p }))
  }
  limitar(sueltos).forEach((p) => lineas.push({ clave: p.id, estudio: null, presupuesto: p, huecoEstudio: true, origen: p }))
  if (restan > 0) lineas.push({ clave: 'mas', mas: restan })
  else if (todos && [...deEstudio.values(), sueltos].some((l) => l.length > MAX_VERSIONES)) lineas.push({ clave: 'menos', menos: true })
  return lineas
}

/** Un presupuesto compartido se duplica como variante de su oferta; uno local o descartado, como copia local. */
export const esVariantable = (r) => r.tipo !== 'estudio' && r.kind !== 'local' && r.kind !== 'descartado' && !r.orphan

/** Qué botones de estado le tocan a un presupuesto del servidor (equivale al StatusBox del Planificador actual). */
export function accionesDeEstado({ estado, esValidador, estadoPropuesta, sinGuardar }) {
  if (estado === 'descartado') return { tipo: 'ninguna' }
  if (estado === 'enviado') return { tipo: 'validar' }
  if (estado === 'validado') {
    if (!esValidador) return { tipo: 'elegido' }
    if (estadoPropuesta === 'enviada' || estadoPropuesta === 'aprobada') return { tipo: 'bloqueado', propuesta: estadoPropuesta }
    return { tipo: 'desvalidar' }
  }
  return { tipo: 'enviar', habilitado: !sinGuardar }
}
