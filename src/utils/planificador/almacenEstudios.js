// Estudios fotovoltaicos en este navegador: la copia de trabajo de cada estudio, igual que el Presupuestador (almacenPresupuestos.js).
// Un estudio nuevo vive solo aquí («Local»); al «Guardar y compartir» se guarda en el servidor, donde lo ven y lo modifican todos.
// Esta copia sigue siendo la que se edita, y «remote» recuerda con qué versión del servidor está sincronizada.
import { newId } from './almacenPresupuestos.js'

const KEY = 'planificador.estudios.v1'
const texto = (v) => (typeof v === 'string' ? v : '')
const copia = (o) => JSON.parse(JSON.stringify(o ?? {}))
const seis = (l, vacio) => Array.from({ length: 6 }, (_, i) => (Array.isArray(l) && l[i] !== undefined && l[i] !== null ? l[i] : vacio))

export { newId }

/** El suministro vacío: lo que queda al quitar el SIPS. */
export const suministroVacio = () => ({ cups: '', tarifa: '', localidad: '', provincia: '', cnae: '', potencias: [], sips: null })

/** Los parámetros de un estudio nuevo, con los valores de partida. Los porcentajes del horario van de 0 a 100. */
export function estadoInicial() {
  return {
    customer: null,
    proyecto: '',
    observaciones: '',
    suministro: suministroVacio(),
    curva: null,
    horario: { ini: 7, fin: 19, fuera: 15, finde: 10, excepciones: [] },
    instalacion: { kwp: '', bateriaKwh: 0, orientacion: 'este-oeste', latitud: null, longitud: null, inclinacion: 15, azimut: 0, produccionEspecifica: null },
    economia: {
      modo: 'red', precioGasoil: 1.2, consumoGrupo: 0.3, mantenimientoGrupo: 0.03,
      precioWp: 0.85, precioBateriaKwh: 250, precioEnergia: 0.1, mantenimientoPct: 1, ahorroPotencia: 0, inversionTotal: null, mantenimiento: null,
      // El presupuesto del que sale el coste de la instalación (su id y su importe y kWp al elegirlo); sin él, el precio provisional
      presupuestoId: '', presupuestoTotal: null, presupuestoKwp: null,
      reposicionAno: 13, reposicion: 0, modoPrecio: 'medio', incluyePeajes: false, boeId: null, financiacionMeses: null, financiacionTae: 9.8,
      preciosPeriodo: seis(null, null), reduccionPotencia: seis(null, 0)
    }
  }
}

/** Los parámetros a partir del estudio que devuelve el servidor (completa lo que falte en los guardados antes de cada campo). */
export function estadoDe(e) {
  const d = e.datos || {}
  const base = estadoInicial()
  const hor = copia(d.horario)
  const eco = { ...base.economia, ...copia(d.economia) }
  eco.modo = eco.modo === 'aislada' ? 'aislada' : 'red'
  eco.modoPrecio = eco.modoPrecio || 'medio'
  eco.incluyePeajes = !!eco.incluyePeajes
  eco.boeId = eco.boeId ?? null
  eco.financiacionMeses = Number(eco.financiacionMeses) > 0 ? eco.financiacionMeses : null
  eco.financiacionTae = eco.financiacionTae ?? 9.8
  delete eco.anioPrecios // los estudios de antes elegían un año; ahora, un BOE (sin elegir, el vigente hoy)
  eco.preciosPeriodo = seis(eco.preciosPeriodo, null)
  eco.reduccionPotencia = seis(eco.reduccionPotencia, 0)
  const ins = { ...base.instalacion, ...copia(d.instalacion) }
  if (!(Number(ins.kwp) > 0)) ins.kwp = ''
  return {
    customer: e.customer ? copia(e.customer) : null,
    proyecto: e.proyecto || '',
    observaciones: e.observaciones || '',
    suministro: {
      cups: texto(d.cups), tarifa: texto(d.tarifa), localidad: texto(d.localidad), provincia: texto(d.provincia), cnae: texto(d.cnae),
      potencias: Array.isArray(d.potencias) ? d.potencias.slice(0, 6) : [], sips: d.sips ? copia(d.sips) : null
    },
    curva: e.curva && e.curva.texto ? { texto: e.curva.texto, origen: e.curva.origen || '' } : null,
    horario: {
      ini: hor.ini ?? 7, fin: hor.fin ?? 19, fuera: Math.round((hor.fraccionFuera ?? 0.15) * 100), finde: Math.round((hor.fraccionFinde ?? 0.1) * 100),
      excepciones: (Array.isArray(hor.excepciones) ? hor.excepciones : []).map((x) => ({
        meses: Array.isArray(x.meses) ? x.meses.slice() : [], ini: x.ini ?? 7, fin: x.fin ?? 19,
        fuera: Math.round((x.fraccionFuera ?? 0.15) * 100), finde: Math.round((x.fraccionFinde ?? 0.1) * 100)
      }))
    },
    instalacion: ins,
    economia: eco
  }
}

/** ¿El coste de la instalación sale de un presupuesto (con su importe y sus kWp) y no del precio provisional? */
export function conPresupuesto(state) {
  const e = (state && state.economia) || {}
  return !!e.presupuestoId && Number(e.presupuestoTotal) > 0 && Number(e.presupuestoKwp) > 0
}

/**
 * Los mismos parámetros con el coste sacado de un presupuesto `{ id, total, kwp }` o, si no se pasa ninguno (o no tiene importe o kWp), con
 * el precio provisional.
 */
export function conCoste(state, presupuesto) {
  const s = JSON.parse(JSON.stringify(state))
  const vale = !!presupuesto && !!presupuesto.id && Number(presupuesto.total) > 0 && Number(presupuesto.kwp) > 0
  s.economia.presupuestoId = vale ? String(presupuesto.id) : ''
  s.economia.presupuestoTotal = vale ? Number(presupuesto.total) : null
  s.economia.presupuestoKwp = vale ? Number(presupuesto.kwp) : null
  return s
}

/** ¿Ya parte de ese presupuesto, con el mismo importe y los mismos kWp? (si el presupuesto ha cambiado, no) */
export function usaElCoste(state, presupuesto) {
  if (!presupuesto || !(Number(presupuesto.total) > 0) || !(Number(presupuesto.kwp) > 0)) return !conPresupuesto(state)
  const e = state.economia
  return e.presupuestoId === String(presupuesto.id) && Number(e.presupuestoTotal) === Number(presupuesto.total) && Number(e.presupuestoKwp) === Number(presupuesto.kwp)
}

/** Lo que se envía al servidor: los vacíos de los campos opcionales viajan como cadena vacía y se toman como «sin valor». */
export function cuerpoDe(f) {
  const v = (x) => (x === null || x === undefined ? '' : x)
  const s = f.suministro
  return {
    customer: f.customer,
    proyecto: (f.proyecto || '').trim(),
    observaciones: f.observaciones || '',
    datos: {
      cups: s.cups, tarifa: s.tarifa, localidad: s.localidad, provincia: s.provincia, cnae: s.cnae, potencias: s.potencias, sips: s.sips,
      // Sin potencia puesta se manda 0 y el servidor propone la que produce la mitad de lo que consume el cliente
      instalacion: {
        kwp: v(f.instalacion.kwp) === '' ? 0 : f.instalacion.kwp, bateriaKwh: v(f.instalacion.bateriaKwh) === '' ? 0 : f.instalacion.bateriaKwh,
        orientacion: f.instalacion.orientacion, latitud: v(f.instalacion.latitud), longitud: v(f.instalacion.longitud),
        inclinacion: v(f.instalacion.inclinacion), azimut: v(f.instalacion.azimut), produccionEspecifica: v(f.instalacion.produccionEspecifica)
      },
      economia: {
        modo: f.economia.modo === 'aislada' ? 'aislada' : 'red', precioGasoil: v(f.economia.precioGasoil), consumoGrupo: v(f.economia.consumoGrupo),
        mantenimientoGrupo: v(f.economia.mantenimientoGrupo),
        precioWp: v(f.economia.precioWp), precioBateriaKwh: v(f.economia.precioBateriaKwh), precioEnergia: v(f.economia.precioEnergia),
        mantenimientoPct: v(f.economia.mantenimientoPct), ahorroPotencia: v(f.economia.ahorroPotencia) === '' ? 0 : f.economia.ahorroPotencia,
        inversionTotal: v(f.economia.inversionTotal), mantenimiento: v(f.economia.mantenimiento),
        presupuestoId: f.economia.presupuestoId || '', presupuestoTotal: v(f.economia.presupuestoTotal), presupuestoKwp: v(f.economia.presupuestoKwp),
        reposicionAno: v(f.economia.reposicionAno), reposicion: v(f.economia.reposicion) === '' ? 0 : f.economia.reposicion,
        modoPrecio: f.economia.modoPrecio, incluyePeajes: !!f.economia.incluyePeajes, boeId: v(f.economia.boeId),
        financiacionMeses: v(f.economia.financiacionMeses) === '' ? 0 : f.economia.financiacionMeses, financiacionTae: v(f.economia.financiacionTae),
        preciosPeriodo: f.economia.preciosPeriodo.map(v), reduccionPotencia: f.economia.reduccionPotencia.map((x) => (v(x) === '' ? 0 : x))
      },
      horario: {
        ini: v(f.horario.ini), fin: v(f.horario.fin), fraccionFuera: f.horario.fuera === '' ? '' : f.horario.fuera / 100, fraccionFinde: f.horario.finde === '' ? '' : f.horario.finde / 100,
        excepciones: (f.horario.excepciones || []).filter((x) => x.meses.length > 0).map((x) => ({
          meses: x.meses.slice().sort((a, b) => a - b), ini: v(x.ini), fin: v(x.fin),
          fraccionFuera: x.fuera === '' ? '' : x.fuera / 100, fraccionFinde: x.finde === '' ? '' : x.finde / 100
        }))
      }
    },
    // Solo va la curva real; con SIPS y sin ella el servidor la estima
    curva: f.curva ? { texto: f.curva.texto, origen: f.curva.origen || '', estimada: false } : null
  }
}

function resumenTexto(t) {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return t.length + ':' + (h >>> 0).toString(36)
}

/** Los parámetros en una forma única para compararlos (la curva, que pesa, va resumida): así «hay cambios» no depende del orden de las claves. */
export function canonical(state) {
  const c = cuerpoDe(state)
  if (c.curva) c.curva = { ...c.curva, texto: resumenTexto(c.curva.texto) }
  return JSON.stringify(c)
}

/** Cómo se llama el estudio en el listado: el cliente y, si lo tiene, el proyecto. */
export function nombreEstudio(state) {
  const cliente = state.customer && state.customer.name ? state.customer.name.trim() : ''
  const base = cliente || 'Sin cliente'
  const proyecto = (state.proyecto || '').trim()
  return proyecto ? `${base} · ${proyecto}` : base
}

/** Del estudio que devuelve el servidor, lo que se guarda aparte de los parámetros: el resultado y cómo es la curva (sin el texto de la curva). */
export function calcDe(e) {
  const c = e.curva || {}
  return { resultado: e.resultado || {}, curva: { presente: !!c.presente, estimada: !!c.estimada, origen: c.origen || '' }, aviso: e.aviso || '' }
}

/** Una copia de trabajo nueva, solo local (todavía sin guardar en ningún sitio). */
export function newLocal(state, calc) {
  const ahora = new Date().toISOString()
  return { id: newId(), state, calc, updatedAt: ahora, createdAt: ahora, remote: null }
}

/** Una copia local de otro estudio, con otro id: es una versión propia sin tocar la original. */
export function copyOf(trabajo) {
  return newLocal(copia(trabajo.state), copia(trabajo.calc))
}

/** La copia de trabajo de un estudio compartido, tal cual está en el servidor (sin cambios sin guardar). */
export function fromServer(e) {
  const state = estadoDe(e)
  return {
    id: e.id,
    state,
    calc: calcDe(e),
    updatedAt: new Date().toISOString(),
    createdAt: e.creadoEl || new Date().toISOString(),
    remote: { version: e.version, estado: e.estado || 'en_estudio', syncedJson: canonical(state), owner: e.creadoPor || '', updatedBy: e.actualizadoPor || '', updatedAt: e.actualizadoEl || '' }
  }
}

/** El mismo objeto con las claves ordenadas, para comparar sin que importe el orden en que se escribieron. */
function ordenado(o) {
  if (Array.isArray(o)) return o.map(ordenado)
  if (o && typeof o === 'object') return Object.fromEntries(Object.keys(o).sort().map((k) => [k, ordenado(o[k])]))
  return o
}

/**
 * Pone `o` en la forma de `defecto`: completa lo que falte con sus valores y quita lo que ya no existe (en los objetos, clave a clave; las
 * listas y los valores se dejan como están). Así lo guardado por una versión anterior se compara con la de ahora.
 */
function conDefectos(o, defecto) {
  if (!o || typeof o !== 'object' || Array.isArray(o) || !defecto || typeof defecto !== 'object' || Array.isArray(defecto)) return o
  const r = {}
  for (const k of Object.keys(defecto)) r[k] = k in o ? conDefectos(o[k], defecto[k]) : defecto[k]
  return r
}

/**
 * Hay cambios sin guardar en el servidor (solo un estudio compartido puede tenerlos). Lo sincronizado se completa con los valores de
 * partida de los campos que se añadieron después de guardarlo: una versión nueva del programa no marca como cambiados los estudios de antes.
 */
export function isDirty(t) {
  if (!t.remote) return false
  let sincronizado
  try {
    sincronizado = JSON.parse(t.remote.syncedJson)
  } catch (e) {
    return true
  }
  const inicial = JSON.parse(canonical(estadoInicial()))
  return JSON.stringify(ordenado(conDefectos(sincronizado, inicial))) !== JSON.stringify(ordenado(JSON.parse(canonical(t.state))))
}

function normalizar(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id || !raw.state || typeof raw.state !== 'object') return null
  const base = estadoInicial()
  const s = raw.state
  const state = {
    ...base,
    ...s,
    suministro: { ...base.suministro, ...(s.suministro || {}) },
    horario: { ...base.horario, ...(s.horario || {}), excepciones: Array.isArray((s.horario || {}).excepciones) ? s.horario.excepciones : [] },
    instalacion: { ...base.instalacion, ...(s.instalacion || {}) },
    economia: { ...base.economia, ...(s.economia || {}) }
  }
  state.economia.preciosPeriodo = seis(state.economia.preciosPeriodo, null)
  state.economia.reduccionPotencia = seis(state.economia.reduccionPotencia, 0)
  const r = raw.remote
  const remote = r && typeof r === 'object' && typeof r.version === 'number'
    ? { version: r.version, syncedJson: texto(r.syncedJson), owner: texto(r.owner), updatedBy: texto(r.updatedBy), updatedAt: texto(r.updatedAt) }
    : null
  const updatedAt = texto(raw.updatedAt) || new Date().toISOString()
  const calc = raw.calc && typeof raw.calc === 'object' ? raw.calc : { resultado: {}, curva: { presente: false, estimada: false, origen: '' }, aviso: '' }
  return { id: raw.id, state, calc, updatedAt, createdAt: texto(raw.createdAt) || updatedAt, remote }
}

function read() {
  const almacen = {}
  try {
    const leido = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    for (const raw of Object.values(leido)) {
      const t = normalizar(raw)
      if (t) almacen[t.id] = t
    }
  } catch (e) {
    // almacenamiento ilegible: se empieza de cero
  }
  return almacen
}

function write(almacen) {
  try {
    localStorage.setItem(KEY, JSON.stringify(almacen))
  } catch (e) {
    // Sin almacenamiento (modo privado, bloqueado o lleno): los estudios siguen funcionando, solo que este navegador no los recuerda.
  }
}

export const listLocal = () => Object.values(read()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
export const getLocal = (id) => read()[id] ?? null

export function putLocal(t) {
  const almacen = read()
  almacen[t.id] = t
  write(almacen)
}

export function removeLocal(id) {
  const almacen = read()
  delete almacen[id]
  write(almacen)
}
