import test from 'node:test'
import assert from 'node:assert/strict'
import {
  etiquetaEstado, esMio, puedeBorrar, construirFilas, contarPendientes, filtrarFilas, armarTabla, esVariantable, accionesDeEstado, opcionesFiltro
} from '../../src/utils/planificador/listaPresupuestos.js'
import { canonical } from '../../src/utils/planificador/almacenPresupuestos.js'
import { EMPTY_COSTS } from '../../src/utils/planificador/motor/costes.js'
import { variantLabels } from '../../src/utils/planificador/variantes.js'
import { nextSort, sortRows } from '../../src/utils/planificador/orden.js'

const ANA = { id: '7', nombre: 'Ana', nivel: 3 }
const JEFE = { id: '1', nombre: 'Jefe', nivel: 1 }

const remoto = (id, extra = {}) => ({
  id, name: 'Casa ' + id, owner: 'Ana', owner_id: '7', status: 'borrador', offer_id: '', customer_id: 5, customer_kind: 'existente',
  variant_name: '', kwp: 10, panels: 20, budget_total: 1000, version: 1, created_at: '2026-11-01T10:00:00.000000+00:00',
  updated_at: '2026-11-01T10:00:00.000000+00:00', updated_by: 'Ana', proposal_status: '', proposal_version: 0, ...extra
})

const local = (id, extra = {}) => ({
  id, state: { ...EMPTY_COSTS, client: 'Local ' + id }, numbers: { kwp: 5, panels: 8, total: 500 }, updatedAt: '2026-11-02T10:00:00.000Z', remote: null, ...extra
})

const filas = (remotos, locales = [], usuario = ANA, copias = {}) =>
  construirFilas({ remotos, locales, copiaLocal: (id) => copias[id] ?? null, usuario })

test('etiquetaEstado: una sola etiqueta por fila; un validado enseña cómo va su propuesta', () => {
  assert.equal(etiquetaEstado({ kind: 'borrador' }).label, 'Borrador')
  assert.equal(etiquetaEstado({ kind: 'local' }).label, 'Local')
  assert.deepEqual(etiquetaEstado({ kind: 'validado', proposal: '' }).label, 'Falta propuesta')
  assert.equal(etiquetaEstado({ kind: 'validado', proposal: 'enviada' }).label, 'Propuesta entregada')
  assert.equal(etiquetaEstado({ kind: 'validado', proposal: 'enviada' }).cls, 'enviado')
  assert.equal(etiquetaEstado({ kind: 'validado', proposal: 'aprobada' }).label, 'Aprobado')
  assert.equal(etiquetaEstado({ kind: 'validado', proposal: 'aprobada' }).cls, 'validado')
  assert.equal(etiquetaEstado({ kind: 'validado', proposal: 'rechazada' }).cls, 'descartado')
})

test('esMio: por id de la intranet y, sin él, por nombre; puedeBorrar: el autor, sin autor o nivel 1', () => {
  assert.equal(esMio('Ana', '7', ANA), true)
  assert.equal(esMio('Ana', '9', ANA), false, 'con id manda el id')
  assert.equal(esMio('ana', '', ANA), true, 'sin id, por nombre sin distinguir mayúsculas')
  assert.equal(esMio('Luis', '', ANA), false)
  assert.equal(puedeBorrar('Luis', '9', ANA), false)
  assert.equal(puedeBorrar('Luis', '9', JEFE), true, 'nivel 1')
  assert.equal(puedeBorrar('', '', ANA), true, 'sin autor, cualquiera')
})

test('las filas juntan los borradores del servidor y los locales, lo más reciente primero', () => {
  const r = filas([remoto('a', { updated_at: '2026-11-03T10:00:00.000000+00:00' }), remoto('b')], [local('x')])
  assert.deepEqual(r.map((f) => f.id), ['a', 'x', 'b'])
  assert.equal(r[1].kind, 'local')
  assert.equal(r[1].owner, 'Ana')
  assert.equal(r[0].mine, true)
  assert.equal(r[0].name, 'Casa a')
  assert.equal(filas([remoto('c', { name: '' })])[0].name, 'Sin nombre')
})

test('las variantes de una oferta van juntas, donde está la primera de ellas', () => {
  const r = filas([
    remoto('a', { offer_id: 'o1', updated_at: '2026-11-03T10:00:00.000000+00:00' }),
    remoto('b', { updated_at: '2026-11-02T10:00:00.000000+00:00' }),
    remoto('c', { offer_id: 'o1', updated_at: '2026-11-01T10:00:00.000000+00:00' })
  ])
  assert.deepEqual(r.map((f) => f.id), ['a', 'c', 'b'])
})

test('un borrador local que el servidor ya no tiene queda como local con el aviso «ya no está compartido»', () => {
  const copia = local('z', { remote: { status: 'borrador', owner: 'Luis', ownerId: '9', updatedBy: 'Luis', syncedJson: '' } })
  const r = filas([remoto('a')], [copia])
  const huerfano = r.find((f) => f.id === 'z')
  assert.equal(huerfano.kind, 'local')
  assert.equal(huerfano.orphan, true)
  assert.equal(esVariantable(huerfano), false)
})

test('si no se pudo leer el servidor, un borrador se sigue enseñando como tal con lo último que se sabía', () => {
  const copia = local('z', { remote: { status: 'enviado', owner: 'Luis', ownerId: '9', updatedBy: 'Luis', syncedJson: canonical(EMPTY_COSTS) } })
  const r = filas(null, [copia])
  assert.equal(r[0].kind, 'enviado')
  assert.equal(r[0].orphan, false)
  assert.equal(r[0].owner, 'Luis')
})

test('«cambios sin guardar»: la copia local de un borrador del servidor difiere de lo sincronizado', () => {
  const sincronizada = local('a', { state: { ...EMPTY_COSTS }, remote: { status: 'borrador', owner: 'Ana', ownerId: '7', updatedBy: 'Ana', syncedJson: canonical(EMPTY_COSTS) } })
  assert.equal(filas([remoto('a')], [], ANA, { a: sincronizada })[0].dirty, false)
  const cambiada = { ...sincronizada, state: { ...EMPTY_COSTS, moduleCount: 99 } }
  assert.equal(filas([remoto('a')], [], ANA, { a: cambiada })[0].dirty, true)
})

test('filtros: texto (nombre, autor, quién modificó), borradores, locales y pendientes de validar', () => {
  const todas = filas([
    remoto('a', { status: 'enviado' }),
    remoto('b', { status: 'validado', proposal_status: 'enviada', owner: 'Luis', owner_id: '9', updated_by: 'Marta' }),
    remoto('c'),
    remoto('d', { status: 'validado', proposal_status: 'aprobada' })
  ], [local('x')])
  const ids = (f) => f.map((r) => r.id).sort()
  assert.deepEqual(ids(filtrarFilas(todas, '', 'todos')), ['a', 'b', 'c', 'd', 'x'])
  assert.deepEqual(ids(filtrarFilas(todas, 'luis', 'todos')), ['b'])
  assert.deepEqual(ids(filtrarFilas(todas, 'marta', 'todos')), ['b'])
  assert.deepEqual(ids(filtrarFilas(todas, '', 'locales')), ['x'])
  assert.deepEqual(ids(filtrarFilas(todas, '', 'borradores')), ['a', 'b', 'c', 'd'])
  assert.deepEqual(ids(filtrarFilas(todas, '', 'porvalidar')), ['a', 'b'])
})

test('pendientes de validar: una oferta con varias variantes cuenta una vez y solo lo ve quien valida', () => {
  const todas = filas([
    remoto('a', { status: 'enviado', offer_id: 'o1' }), remoto('b', { status: 'enviado', offer_id: 'o1' }),
    remoto('c', { status: 'enviado' }), remoto('d', { status: 'validado', proposal_status: 'enviada' })
  ])
  assert.equal(contarPendientes(todas, true), 3)
  assert.equal(contarPendientes(todas, false), 0)
})

test('la tabla recoge las variantes de una oferta en una fila que se despliega, con «Versión N» o su nombre', () => {
  const todas = filas([
    remoto('a', { offer_id: 'o1', created_at: '2026-11-01T10:00:00.000000+00:00', updated_at: '2026-11-04T10:00:00.000000+00:00' }),
    remoto('b', { offer_id: 'o1', created_at: '2026-11-02T10:00:00.000000+00:00', variant_name: 'Con batería' }),
    remoto('c', { updated_at: '2026-11-01T10:00:00.000000+00:00' })
  ])
  const cerrada = armarTabla(todas, null, new Set())
  assert.deepEqual(cerrada.items.map((i) => i.tipo), ['grupo', 'fila'])
  assert.equal(cerrada.items[0].count, 2)
  const abierta = armarTabla(todas, null, new Set(['o1']))
  assert.deepEqual(abierta.items.map((i) => (i.tipo === 'grupo' ? 'G' : i.row.id)), ['G', 'a', 'b', 'c'])
  assert.equal(abierta.items[1].hija, true)
  assert.equal(abierta.etiquetas.get('a'), 'v1')
  assert.equal(abierta.etiquetas.get('b'), 'v2 · Con batería')
})

test('el mismo cliente y el mismo proyecto son un grupo aunque no compartan oferta (los locales no la tienen); el v2 del nombre no cuenta', () => {
  const estado = (client, reference) => ({ ...EMPTY_COSTS, client, reference, customer: { kind: 'existente', id: 5, name: client } })
  const todas = filas(
    [remoto('r1', { name: 'Pepe · Nave 2', offer_id: 'o9', created_at: '2026-11-01T10:00:00.000000+00:00' })],
    [
      local('l1', { state: estado('Pepe', 'nave  2 v2'), createdAt: '2026-11-02T10:00:00.000Z' }),
      local('l2', { state: estado('Pepe', 'Nave 3') }),
      local('l3', { state: estado('Ana', 'Nave 2') })
    ]
  )
  const por = (id) => todas.find((f) => f.id === id)
  assert.equal(por('l1').grupo, 'o9', 'el local entra en la oferta del compartido')
  assert.equal(por('r1').grupo, 'o9')
  assert.equal(por('l2').grupo, '', 'otro proyecto: suelto')
  assert.equal(por('l3').grupo, '', 'otro cliente: suelto')
  const tabla = armarTabla(todas, null, new Set(['o9']))
  assert.equal(tabla.items[0].tipo, 'grupo')
  assert.equal(tabla.items[0].count, 2)
  assert.equal(tabla.etiquetas.get('r1'), 'v1')
  assert.equal(tabla.etiquetas.get('l1'), 'v2', 'el orden lo da la fecha de creación')
  // Dos locales del mismo proyecto, sin ninguna oferta del servidor
  const dos = filas([], [local('a', { state: estado('Pepe', 'Nave 2') }), local('b', { state: estado('Pepe', 'Nave 2') })])
  assert.equal(dos[0].grupo, dos[1].grupo)
  assert.ok(dos[0].grupo.startsWith('proyecto:'))
})

test('filtros de cliente y de proyecto: los proyectos son los del cliente elegido y un mismo cliente escrito distinto cuenta como uno', () => {
  const estado = (client, reference) => ({ ...EMPTY_COSTS, client, reference, customer: { kind: 'existente', id: 5, name: client } })
  const todas = filas([], [
    local('a', { state: estado('Pepe', 'Nave 2') }), local('b', { state: estado('PEPE', 'Nave 3') }), local('c', { state: estado('Ana', 'Casa') })
  ])
  const o = opcionesFiltro(todas, '')
  assert.equal(o.clientes.length, 2, 'Pepe y PEPE son un solo cliente')
  assert.ok(o.clientes.some((c) => c.etiqueta === 'Ana'))
  const clientePepe = todas.find((f) => f.id === 'a').clienteClave
  assert.equal(opcionesFiltro(todas, clientePepe).proyectos.length, 2)
  assert.deepEqual(filtrarFilas(todas, '', 'todos', clientePepe).map((f) => f.id).sort(), ['a', 'b'])
  const nave3 = todas.find((f) => f.id === 'b').proyectoClave
  assert.deepEqual(filtrarFilas(todas, '', 'todos', clientePepe, nave3).map((f) => f.id), ['b'])
})

test('ordenar por una columna no separa nunca una oferta (cuenta su fila principal); sin importe, al final en cualquier sentido', () => {
  const todas = filas([
    remoto('a', { offer_id: 'o1', budget_total: 3000, updated_at: '2026-11-04T10:00:00.000000+00:00' }),
    remoto('b', { offer_id: 'o1', budget_total: 100, updated_at: '2026-11-03T10:00:00.000000+00:00' }),
    remoto('c', { budget_total: 2000, updated_at: '2026-11-02T10:00:00.000000+00:00' }),
    remoto('d', { budget_total: 0, updated_at: '2026-11-01T10:00:00.000000+00:00' })
  ])
  const asc = armarTabla(todas, { key: 'total', dir: 'asc' }, new Set(['o1']))
  assert.deepEqual(asc.items.map((i) => (i.tipo === 'grupo' ? 'G' : i.row.id)), ['c', 'G', 'a', 'b', 'd'])
  const desc = armarTabla(todas, { key: 'total', dir: 'desc' }, new Set())
  assert.deepEqual(desc.items.map((i) => (i.tipo === 'grupo' ? 'G' : i.row.id)), ['G', 'c', 'd'])
})

test('el ciclo del orden: ascendente → descendente → sin ordenar, y números antes que texto «2» < «10»', () => {
  assert.deepEqual(nextSort(null, 'x'), { key: 'x', dir: 'asc' })
  assert.deepEqual(nextSort({ key: 'x', dir: 'asc' }, 'x'), { key: 'x', dir: 'desc' })
  assert.equal(nextSort({ key: 'x', dir: 'desc' }, 'x'), null)
  assert.deepEqual(nextSort({ key: 'x', dir: 'desc' }, 'y'), { key: 'y', dir: 'asc' })
  assert.deepEqual(sortRows(['10', '2', null, 'b'], { key: 'k', dir: 'asc' }, (r) => r), ['2', '10', 'b', null])
})

test('variantLabels: «vN» por orden de creación y, si tiene nombre, «vN · nombre»', () => {
  const m = variantLabels([
    { id: 'b', created_at: '2026-11-02', variant_name: '  ' }, { id: 'a', created_at: '2026-11-01', variant_name: '' }, { id: 'c', created_at: '2026-11-03', variant_name: 'Plus' }
  ])
  assert.equal(m.get('a'), 'v1')
  assert.equal(m.get('b'), 'v2')
  assert.equal(m.get('c'), 'v3 · Plus')
})

test('esVariantable: un compartido se duplica como variante; un local o descartado, como copia local', () => {
  assert.equal(esVariantable({ kind: 'borrador', orphan: false }), true)
  assert.equal(esVariantable({ kind: 'local', orphan: false }), false)
  assert.equal(esVariantable({ kind: 'descartado', orphan: false }), false)
})

test('accionesDeEstado: qué botones tocan en cada estado (igual que el recuadro de estado del Planificador actual)', () => {
  assert.deepEqual(accionesDeEstado({ estado: 'borrador', esValidador: false, estadoPropuesta: '', sinGuardar: false }), { tipo: 'enviar', habilitado: true })
  assert.deepEqual(accionesDeEstado({ estado: 'borrador', esValidador: false, estadoPropuesta: '', sinGuardar: true }), { tipo: 'enviar', habilitado: false })
  assert.equal(accionesDeEstado({ estado: 'enviado', esValidador: true, estadoPropuesta: '' }).tipo, 'validar')
  assert.equal(accionesDeEstado({ estado: 'enviado', esValidador: false, estadoPropuesta: '' }).tipo, 'esperar')
  assert.equal(accionesDeEstado({ estado: 'validado', esValidador: false, estadoPropuesta: '' }).tipo, 'elegido')
  assert.equal(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: '' }).tipo, 'desvalidar')
  assert.deepEqual(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: 'aprobada' }), { tipo: 'bloqueado', propuesta: 'aprobada' })
  assert.deepEqual(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: 'enviada' }), { tipo: 'bloqueado', propuesta: 'enviada' })
  assert.equal(accionesDeEstado({ estado: 'descartado', esValidador: true, estadoPropuesta: '' }).tipo, 'ninguna')
})
