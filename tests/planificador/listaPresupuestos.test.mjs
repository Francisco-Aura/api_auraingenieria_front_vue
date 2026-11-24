import test from 'node:test'
import assert from 'node:assert/strict'
import {
  etiquetaEstado, etiquetaPropuesta, filasDeEstudios, pendientesDeValidar, esMio, puedeBorrar, construirFilas, contarPendientes, filtrarFilas, armarProyectos, claveDeProyectoServidor, MAX_VERSIONES, esVariantable, accionesDeEstado, opcionesFiltro
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

test('etiquetaEstado: una sola etiqueta por fila, la del propio documento; la propuesta no se mezcla', () => {
  assert.equal(etiquetaEstado({ kind: 'borrador' }).label, 'Borrador')
  assert.equal(etiquetaEstado({ kind: 'local' }).label, 'Local')
  // Un presupuesto validado es «Validado» se haya hecho o no la propuesta, y ninguna etiqueta de estas columnas habla de «propuesta»
  for (const proposal of ['', 'borrador', 'enviada', 'aprobada', 'rechazada']) {
    const e = etiquetaEstado({ kind: 'validado', proposal })
    assert.equal(e.label, 'Validado')
    assert.equal(e.cls, 'validado')
  }
  for (const kind of ['local', 'borrador', 'enviado', 'validado', 'descartado']) {
    assert.doesNotMatch(etiquetaEstado({ kind, proposal: 'borrador' }).label, /propuesta/i)
  }
  for (const estado of ['en_estudio', 'pte_doc', 'entregado', 'pte_cliente', 'aceptado', 'rechazado', 'cancelado']) {
    assert.doesNotMatch(etiquetaEstado({ tipo: 'estudio', estado }).label, /propuesta/i)
  }
})

test('etiquetaPropuesta: cómo va la propuesta final, solo para su columna', () => {
  assert.equal(etiquetaPropuesta({ proposal: '' }).label, 'Falta propuesta')
  assert.equal(etiquetaPropuesta({ proposal: 'borrador' }).label, 'Propuesta en borrador')
  assert.equal(etiquetaPropuesta({ proposal: 'enviada' }).label, 'Propuesta entregada')
  assert.equal(etiquetaPropuesta({ proposal: 'enviada' }).cls, 'enviado')
  assert.equal(etiquetaPropuesta({ proposal: 'aprobada' }).label, 'Validada')
  assert.equal(etiquetaPropuesta({ proposal: 'aprobada' }).cls, 'validado')
  assert.equal(etiquetaPropuesta({ proposal: 'rechazada' }).cls, 'descartado')
})

test('la propuesta final aparece cuando hay un estudio terminado y un presupuesto validado', () => {
  const estudio = (id, estado) => ({ id, cliente: 'Ana SL', proyecto: 'Nave 1', estado, estadoNombre: estado, creadoPor: 'Ana', actualizadoEl: '2026-11-04T10:00:00.000000+00:00', kwp: 10, customer: { kind: 'existente' } })
  const final = (estudios, presupuestos) => {
    const est = filasDeEstudios({ remotos: estudios, locales: [], usuario: ANA })
    const todas = construirFilas({ remotos: presupuestos, locales: [], copiaLocal: () => null, usuario: ANA, estudios: est })
    return armarProyectos(todas, todas)[0].final
  }
  const validado = (extra = {}) => remoto('a', { name: 'Ana SL · Nave 1', status: 'validado', proposal_status: 'enviada', ...extra })
  const f = final([estudio('e1', 'entregado')], [validado()])
  assert.equal(f.presupuesto.id, 'a')
  assert.equal(f.estudio.id, 'e1')
  assert.equal(f.etiqueta.label, 'Propuesta entregada')
  assert.ok(final([estudio('e1', 'aceptado')], [validado({ proposal_status: '' })]))
  assert.equal(final([estudio('e1', 'en_estudio')], [validado()]), null) // el estudio sigue en marcha
  assert.equal(final([estudio('e1', 'entregado')], [validado({ status: 'enviado' })]), null) // el presupuesto no está validado
  assert.equal(final([], [validado()]), null) // sin estudio
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
  assert.deepEqual(ids(filtrarFilas(todas, '', 'porvalidar')), [], 'sin estudio aceptado no hay nada que validar')
})

test('pendientes de validar: propuesta entregada con presupuesto aprobado y estudio no rechazado ni cancelado, y solo lo ve quien valida', () => {
  const remotos = [
    remoto('a', { status: 'enviado' }),
    remoto('b', { status: 'validado', proposal_status: 'enviada', study_id: 'e1' }),
    remoto('c', { status: 'validado', proposal_status: 'enviada', study_id: 'e2' }),
    remoto('d', { status: 'validado', proposal_status: 'enviada' }),
    remoto('f', { status: 'validado', proposal_status: 'aprobada', study_id: 'e1' }),
    remoto('g', { status: 'validado', proposal_status: 'enviada', study_id: 'e3' })
  ]
  const estudios = filasDeEstudios({
    remotos: [estudioRemoto('e1', { estado: 'aceptado' }), estudioRemoto('e2', { estado: 'rechazado' }), estudioRemoto('e3', { estado: 'pte_cliente' })],
    locales: [], usuario: ANA
  })
  const todas = construirFilas({ remotos, locales: [], copiaLocal: () => null, usuario: ANA, estudios })
  assert.deepEqual(pendientesDeValidar(todas).map((r) => r.id).sort(), ['b', 'g'])
  assert.deepEqual(filtrarFilas(todas, '', 'porvalidar').map((r) => r.id).sort(), ['b', 'g'])
  assert.equal(contarPendientes(todas, true), 2)
  assert.equal(contarPendientes(todas, false), 0)
})

test('un proyecto recoge las variantes de una oferta: el más reciente a la vista, «vN» o su nombre y las líneas solo al abrirlo', () => {
  const todas = filas([
    remoto('a', { offer_id: 'o1', created_at: '2026-11-01T10:00:00.000000+00:00', updated_at: '2026-11-04T10:00:00.000000+00:00' }),
    remoto('b', { offer_id: 'o1', created_at: '2026-11-02T10:00:00.000000+00:00', variant_name: 'Con batería' }),
    remoto('c', { updated_at: '2026-11-01T10:00:00.000000+00:00' })
  ])
  const cerrada = armarProyectos(todas, todas)
  assert.deepEqual(cerrada.map((p) => p.clave), ['o1', 'solo:c'])
  const [o1, c] = cerrada
  assert.equal(o1.plegable, true)
  assert.equal(c.plegable, false)
  assert.equal(o1.resumen.presupuesto.id, 'a', 'el modificado más recientemente')
  assert.equal(o1.resumen.masPresupuestos, 1)
  assert.equal(o1.resumen.huecoEstudio, true)
  assert.equal(o1.resumen.origen.id, 'a', 'el estudio se crearía a partir de él')
  assert.deepEqual(o1.lineas, [], 'cerrado no lleva líneas')
  const abierta = armarProyectos(todas, todas, null, new Set(['o1']))[0]
  assert.deepEqual(abierta.lineas.map((l) => l.presupuesto.id), ['a', 'b'])
  assert.equal(abierta.etiquetas.get('a'), 'Versión 1')
  assert.equal(abierta.etiquetas.get('b'), 'Con batería')
  assert.equal(armarProyectos(todas, todas, null, new Set(['solo:c']))[1].abierto, false, 'con un solo presupuesto no hay nada que abrir')
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
  const proyectos = armarProyectos(todas, todas, null, new Set(['o9']))
  const o9 = proyectos.find((p) => p.clave === 'o9')
  assert.equal(o9.presupuestos.length, 2)
  assert.equal(proyectos.length, 3)
  assert.equal(o9.etiquetas.get('r1'), 'Versión 1')
  assert.equal(o9.etiquetas.get('l1'), 'Versión 2', 'el orden lo da la fecha de creación')
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

test('ordenar proyectos por nombre o por fecha no separa nunca sus presupuestos', () => {
  const todas = filas([
    remoto('a', { offer_id: 'o1', name: 'Zeta', updated_at: '2026-11-04T10:00:00.000000+00:00' }),
    remoto('b', { offer_id: 'o1', name: 'Zeta', updated_at: '2026-11-03T10:00:00.000000+00:00' }),
    remoto('c', { name: 'Beta', updated_at: '2026-11-02T10:00:00.000000+00:00' }),
    remoto('d', { name: 'Alfa', updated_at: '2026-11-01T10:00:00.000000+00:00' })
  ])
  const claves = (orden) => armarProyectos(todas, todas, orden).map((p) => p.clave)
  assert.deepEqual(claves({ key: 'name', dir: 'asc' }), ['solo:d', 'solo:c', 'o1'])
  assert.deepEqual(claves({ key: 'updated', dir: 'asc' }), ['solo:d', 'solo:c', 'o1'])
  assert.deepEqual(claves({ key: 'updated', dir: 'desc' }), ['o1', 'solo:c', 'solo:d'])
  assert.deepEqual(claves(null), ['o1', 'solo:c', 'solo:d'], 'sin ordenar, lo más reciente primero')
})

test('el ciclo del orden: ascendente → descendente → sin ordenar, y números antes que texto «2» < «10»', () => {
  assert.deepEqual(nextSort(null, 'x'), { key: 'x', dir: 'asc' })
  assert.deepEqual(nextSort({ key: 'x', dir: 'asc' }, 'x'), { key: 'x', dir: 'desc' })
  assert.equal(nextSort({ key: 'x', dir: 'desc' }, 'x'), null)
  assert.deepEqual(nextSort({ key: 'x', dir: 'desc' }, 'y'), { key: 'y', dir: 'asc' })
  assert.deepEqual(sortRows(['10', '2', null, 'b'], { key: 'k', dir: 'asc' }, (r) => r), ['2', '10', 'b', null])
})

test('variantLabels: «Versión N» por orden de creación y, si tiene nombre, el nombre', () => {
  const m = variantLabels([
    { id: 'b', created_at: '2026-11-02', variant_name: '  ' }, { id: 'a', created_at: '2026-11-01', variant_name: '' }, { id: 'c', created_at: '2026-11-03', variant_name: 'Plus' }
  ])
  assert.equal(m.get('a'), 'Versión 1')
  assert.equal(m.get('b'), 'Versión 2')
  assert.equal(m.get('c'), 'Plus')
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
  assert.equal(accionesDeEstado({ estado: 'enviado', esValidador: false, estadoPropuesta: '' }).tipo, 'validar', 'cualquiera aprueba el presupuesto')
  assert.equal(accionesDeEstado({ estado: 'validado', esValidador: false, estadoPropuesta: '' }).tipo, 'elegido')
  assert.equal(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: '' }).tipo, 'desvalidar')
  assert.deepEqual(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: 'aprobada' }), { tipo: 'bloqueado', propuesta: 'aprobada' })
  assert.deepEqual(accionesDeEstado({ estado: 'validado', esValidador: true, estadoPropuesta: 'enviada' }), { tipo: 'bloqueado', propuesta: 'enviada' })
  assert.equal(accionesDeEstado({ estado: 'descartado', esValidador: true, estadoPropuesta: '' }).tipo, 'ninguna')
})

// ---- Estudios en la misma lista ------------------------------------------------------------------------------------------------

const estudioRemoto = (id, extra = {}) => ({
  id, cliente: 'Pepe', customer: { kind: 'existente', id: 5 }, proyecto: 'Nave 2', estado: 'en_estudio', estadoNombre: 'En estudio', kwp: 48,
  actualizadoEl: '2026-11-03T10:00:00.000Z', actualizadoPor: 'Laura', creadoEl: '2026-11-01T10:00:00.000Z', ...extra
})

test('un estudio sale en la lista y cae en el grupo de los presupuestos de su mismo cliente y proyecto', () => {
  const estudios = filasDeEstudios({ remotos: [estudioRemoto('e1')], locales: [], usuario: ANA })
  const todas = construirFilas({
    remotos: [remoto('a', { name: 'Pepe · Nave 2' }), remoto('b', { name: 'Pepe · Nave 2' }), remoto('c', { name: 'Pepe · Otra' })],
    locales: [], copiaLocal: () => null, usuario: ANA, estudios
  })
  const grupo = (id) => todas.find((f) => f.id === id).grupo
  assert.ok(grupo('e1') !== '' && grupo('e1') === grupo('a') && grupo('a') === grupo('b'))
  assert.equal(grupo('c'), '', 'otro proyecto: suelto')
  const p = armarProyectos(todas, todas, null, new Set([grupo('e1')])).find((x) => x.clave === grupo('e1'))
  assert.equal(p.presupuestos.length, 2, 'dos presupuestos')
  assert.equal(p.estudios.length, 1)
  assert.equal(p.etiquetas.has('e1'), false, 'un estudio no es una versión')
  assert.equal(p.etiquetas.get('a'), 'Versión 1')
})

test('un estudio y un presupuesto del mismo proyecto son un proyecto; un estudio de otro proyecto, otro', () => {
  const estudios = filasDeEstudios({ remotos: [estudioRemoto('e1'), estudioRemoto('e2', { proyecto: 'Otro' })], locales: [], usuario: ANA })
  const todas = construirFilas({ remotos: [remoto('a', { name: 'Pepe · Nave 2' })], locales: [], copiaLocal: () => null, usuario: ANA, estudios })
  const proyectos = armarProyectos(todas, todas)
  assert.equal(proyectos.length, 2)
  const p = proyectos.find((x) => x.presupuestos.length === 1)
  assert.equal(p.estudios.length, 1)
  assert.equal(p.plegable, false)
  assert.equal(p.resumen.huecoEstudio || p.resumen.huecoPresupuesto, false)
  const solo = proyectos.find((x) => x.presupuestos.length === 0)
  assert.equal(solo.resumen.huecoPresupuesto, true)
  assert.equal(solo.resumen.origen.id, 'e2', 'el presupuesto se crearía a partir del estudio')
})

test('el estado de un estudio es el suyo, y el local se etiqueta como «Local»', () => {
  const [e] = filasDeEstudios({ remotos: [estudioRemoto('e1', { estado: 'pte_cliente' })], locales: [], usuario: ANA })
  assert.equal(etiquetaEstado(e).label, 'Pte. cliente')
  assert.equal(etiquetaEstado(e).cls, 'enviado')
  assert.equal(etiquetaEstado({ ...e, estado: 'aceptado' }).cls, 'validado')
  const [l] = filasDeEstudios({
    remotos: [], usuario: ANA,
    locales: [{ id: 'l1', state: { customer: { kind: 'potencial', name: 'Ana' }, proyecto: 'Casa' }, calc: { resultado: { simulacion: { kwp: 5 } } }, updatedAt: '2026-11-02T10:00:00.000Z' }]
  })
  assert.equal(l.name, 'Ana · Casa')
  assert.equal(etiquetaEstado(l).label, 'Local')
  assert.equal(l.kwp, 5)
  assert.equal(esVariantable(e), false)
})

test('un estudio local que ya está en el servidor no sale dos veces y el filtro de tipo separa estudios de presupuestos', () => {
  const estudios = filasDeEstudios({ remotos: [estudioRemoto('e1')], locales: [{ id: 'e1', state: { customer: null, proyecto: '' }, calc: {}, updatedAt: '' }], usuario: ANA })
  assert.equal(estudios.length, 1)
  const todas = construirFilas({ remotos: [remoto('a')], locales: [], copiaLocal: () => null, usuario: ANA, estudios })
  assert.deepEqual(filtrarFilas(todas, '', 'todos', '', '', 'estudio').map((f) => f.id), ['e1'])
  assert.deepEqual(filtrarFilas(todas, '', 'todos', '', '', 'presupuesto').map((f) => f.id), ['a'])
  assert.equal(filtrarFilas(todas, '', 'todos').length, 2)
  assert.equal(contarPendientes(todas, true), 0, 'un estudio no es una propuesta pendiente de validar')
})

test('un filtro elige proyectos enteros: salen todos sus estudios y presupuestos aunque solo uno cumpla', () => {
  const estudios = filasDeEstudios({ remotos: [estudioRemoto('e1')], locales: [], usuario: ANA })
  const todas = construirFilas({
    remotos: [remoto('a', { name: 'Pepe · Nave 2' }), remoto('b', { name: 'Ana · Casa' })], locales: [], copiaLocal: () => null, usuario: ANA, estudios
  })
  const soloEstudios = filtrarFilas(todas, '', 'todos', '', '', 'estudio')
  assert.deepEqual(soloEstudios.map((f) => f.id), ['e1'])
  const proyectos = armarProyectos(todas, soloEstudios)
  assert.equal(proyectos.length, 1)
  assert.equal(proyectos[0].presupuestos.length, 1, 'el presupuesto del proyecto sale aunque el filtro fuera de estudios')
  assert.equal(proyectos[0].resumen.huecoPresupuesto, false, 'y no se inventa un hueco')
})

test('abierto: una línea por presupuesto, con el estudio al que está enlazado; los demás, sin estudio', () => {
  const estudios = filasDeEstudios({
    remotos: [estudioRemoto('e1', { kwp: 120 }), estudioRemoto('e2', { kwp: 95, actualizadoEl: '2026-11-02T10:00:00.000Z' })], locales: [], usuario: ANA
  })
  const todas = construirFilas({
    remotos: [
      remoto('p3', { name: 'Pepe · Nave 2', study_id: 'e1', updated_at: '2026-11-05T10:00:00.000000+00:00' }),
      remoto('p2', { name: 'Pepe · Nave 2', study_id: 'e1', updated_at: '2026-11-04T10:00:00.000000+00:00' }),
      remoto('p1', { name: 'Pepe · Nave 2', updated_at: '2026-11-01T10:00:00.000000+00:00' })
    ],
    locales: [], copiaLocal: () => null, usuario: ANA, estudios
  })
  const p = armarProyectos(todas, todas, null, new Set([todas[0].grupo]))[0]
  assert.equal(p.plegable, true)
  assert.equal(p.resumen.masEstudios, 1)
  assert.equal(p.resumen.masPresupuestos, 2)
  const resumen = p.lineas.map((l) => [l.estudio && l.estudio.id, l.continuacion || false, l.presupuesto && l.presupuesto.id, l.huecoPresupuesto || l.huecoEstudio || false])
  assert.deepEqual(resumen, [
    ['e1', false, 'p3', false],
    [null, true, 'p2', false],
    ['e2', false, null, true], // un estudio sin presupuesto: hueco para crearlo desde él
    [null, false, 'p1', true] // sin enlace: se le puede crear su estudio aunque el proyecto ya tenga otros
  ])
  assert.equal(p.lineas[2].origen.id, 'e2')
})

test('muchos presupuestos de un estudio: se ven los últimos MAX_VERSIONES y «Ver todos» enseña el resto', () => {
  const estudios = filasDeEstudios({ remotos: [estudioRemoto('e1'), estudioRemoto('e2', { proyecto: 'Otro' })], locales: [], usuario: ANA })
  const pres = ['1', '2', '3', '4', '5'].map((n) => remoto('p' + n, { name: 'Pepe · Nave 2', study_id: 'e1', updated_at: '2026-11-0' + n + 'T10:00:00.000000+00:00' }))
  const todas = construirFilas({ remotos: pres, locales: [], copiaLocal: () => null, usuario: ANA, estudios })
  const clave = todas.find((f) => f.id === 'p1').grupo
  const ids = (p) => p.lineas.map((l) => (l.presupuesto ? l.presupuesto.id : l.mas ? 'mas:' + l.mas : l.menos ? 'menos' : '?'))
  const corto = armarProyectos(todas, todas, null, new Set([clave])).find((p) => p.clave === clave)
  assert.equal(MAX_VERSIONES, 3)
  assert.deepEqual(ids(corto), ['p5', 'p4', 'p3', 'mas:2'])
  const largo = armarProyectos(todas, todas, null, new Set([clave]), new Set([clave])).find((p) => p.clave === clave)
  assert.deepEqual(ids(largo), ['p5', 'p4', 'p3', 'p2', 'p1', 'menos'])
})

test('un proyecto del servidor sin estudios ni presupuestos sale vacío, con los dos huecos; con ellos, no se repite', () => {
  const todas = filas([remoto('a', { name: 'Pepe · Nave 2', updated_at: '2026-11-03T10:00:00.000000+00:00' })])
  const servidor = (id, proyecto, creado, cliente = { kind: 'existente', id: 5, name: 'Pepe' }) => ({ id, customer: cliente, project: proyecto, created_at: creado, created_by: 'Ana' })
  const vacios = [
    servidor('p1', 'Nave  2', '2026-11-01T10:00:00.000000+00:00'), // mismo cliente y proyecto que el presupuesto: no es un proyecto aparte
    servidor('p2', 'Nave nueva', '2026-11-05T10:00:00.000000+00:00'),
    servidor('p3', 'Nave 2', '2026-11-04T10:00:00.000000+00:00', { kind: 'potencial', name: 'Pepe' }) // otro tipo de cliente: otro proyecto
  ]
  const proyectos = armarProyectos(todas, todas, null, new Set(), new Set(), vacios)
  assert.deepEqual(proyectos.map((p) => p.clave), ['proyecto:p2', 'proyecto:p3', 'solo:a'], 'lo más reciente primero, con los vacíos entre medias')
  const p2 = proyectos[0]
  assert.equal(p2.vacio, true)
  assert.equal(p2.cliente, 'Pepe')
  assert.equal(p2.proyecto, 'Nave nueva')
  assert.deepEqual([p2.resumen.huecoEstudio, p2.resumen.huecoPresupuesto, p2.resumen.origen], [true, true, null])
  assert.equal(p2.customer.id, 5, 'lleva el cliente entero para precargar lo que se cree')
  assert.equal(proyectos[1].potencial, true)
  assert.equal(proyectos[2].vacio, undefined)
  assert.equal(claveDeProyectoServidor(vacios[0]), todas[0].proyectoClave)
  // La propuesta del servidor queda en el registro del proyecto, tenga o no documentos: con ella se editan sus datos
  const conRegistro = armarProyectos(todas, todas, null, new Set(), new Set(), [], vacios)
  assert.equal(conRegistro.find((p) => p.clave === 'solo:a').registro.id, 'p1', 'el proyecto con documentos encuentra su propuesta')
  assert.equal(proyectos.find((p) => p.vacio).registro.id, 'p2')
  // Un filtro que deja fuera al servidor (los pasa vacíos) no los inventa
  assert.deepEqual(armarProyectos(todas, todas).map((p) => p.clave), ['solo:a'])
})

test('con la propuesta que da el servidor (project_id) se agrupa aunque el nombre esté escrito distinto, y el registro sale por su id', () => {
  const estudios = filasDeEstudios({
    remotos: [{ id: 'e1', cliente: 'Solaria', proyecto: 'nave getafe', estado: 'en_estudio', estadoNombre: 'En estudio', customer: { kind: 'existente' }, actualizadoEl: '2026-11-03T10:00:00.000Z', project_id: 'pr1' }],
    locales: [], usuario: ANA
  })
  const todas = construirFilas({
    remotos: [
      remoto('a', { name: 'Solaria · Nave Getafe', project_id: 'pr1' }),
      remoto('b', { name: 'SOLARIA S.L. · Nave de Getafe', project_id: 'pr1' }),
      remoto('c', { name: 'Solaria · Nave Leganés', project_id: 'pr2' })
    ],
    locales: [], copiaLocal: () => null, usuario: ANA, estudios
  })
  const registros = [{ id: 'pr1', customer: { kind: 'existente', name: 'Solaria' }, project: 'Nave Getafe' }, { id: 'pr2', customer: { kind: 'existente', name: 'Solaria' }, project: 'Nave Leganés' }]
  const proyectos = armarProyectos(todas, todas, null, new Set(), new Set(), registros, registros)
  assert.equal(proyectos.length, 2, 'dos propuestas, no tres: los nombres distintos de la misma propuesta no la parten')
  const p1 = proyectos.find((p) => p.proyectoId === 'pr1')
  assert.equal(p1.presupuestos.length, 2)
  assert.equal(p1.estudios.length, 1)
  assert.equal(p1.registro.id, 'pr1')
  assert.equal(proyectos.find((p) => p.proyectoId === 'pr2').registro.id, 'pr2')
  assert.equal(proyectos.some((p) => p.vacio), false, 'una propuesta con documentos no sale además como vacía')
})

test('una copia local sin propuesta entra en la del servidor con su mismo cliente y proyecto', () => {
  const l = local('l1', { state: { ...EMPTY_COSTS, client: 'solaria', reference: 'nave getafe v2', customer: { kind: 'existente', name: 'Solaria' } } })
  const todas = construirFilas({
    remotos: [remoto('a', { name: 'Solaria · Nave Getafe', project_id: 'pr1' })], locales: [l], copiaLocal: () => null, usuario: ANA
  })
  const local1 = todas.find((r) => r.id === 'l1')
  assert.equal(local1.proyectoId, 'pr1')
  assert.equal(local1.grupo, todas.find((r) => r.id === 'a').grupo)
  assert.equal(armarProyectos(todas, todas).length, 1)
})
