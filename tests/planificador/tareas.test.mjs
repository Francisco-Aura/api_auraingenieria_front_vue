import test from 'node:test'
import assert from 'node:assert/strict'
import { delayOf, projectSlip, levelOf, levelName } from '../../src/utils/planificador/tareas/retraso.js'
import { moveBlockedReason, canMove, pendingDeliverables } from '../../src/utils/planificador/tareas/flujo.js'
import { orderedPhases, phaseColors, departmentColor, STATUS_ORDER, STATUS_META, BLOCK_REASONS } from '../../src/utils/planificador/tareas/colores.js'
import { parseDate, formatDate, addDays, diffDays, durationDays, shortDate } from '../../src/utils/planificador/tareas/fechas.js'

const tarea = (extra = {}) => ({
  id: 't', name: 'T', phase: '', department: '', position: 0, start: '2030-01-01', end: '2030-01-05', planned_end: '2030-01-05',
  status: 'doing', deliverables: [], attachments: [], checklist: [], depends_on: [], ...extra
})

test('fechas: se manejan como milisegundos UTC y los días son naturales con ambos extremos', () => {
  assert.equal(formatDate(parseDate('2030-03-01')), '2030-03-01')
  assert.equal(formatDate(addDays(parseDate('2030-02-28'), 2)), '2030-03-02')
  assert.equal(diffDays(parseDate('2030-01-01'), parseDate('2030-01-11')), 10)
  assert.equal(durationDays('2030-01-01', '2030-01-05'), 5)
  assert.equal(shortDate('2030-10-15'), '15 oct')
})

test('gravedad del retraso: leve de 1 a 2 días, media de 3 a 6 y grave de 7 o más', () => {
  assert.deepEqual([1, 2, 3, 6, 7, 30].map(levelOf), [1, 1, 2, 2, 3, 3])
  assert.deepEqual([1, 2, 3].map(levelName), ['leve', 'media', 'grave'])
})

test('retraso de una tarea: respecto a su plazo de referencia; propio si ya venció, desplazado si no', () => {
  assert.equal(delayOf(tarea(), '2030-01-03'), null, 'va en fecha')
  assert.equal(delayOf(tarea({ status: 'done', end: '2030-02-01' }), '2030-03-01'), null, 'una hecha no se retrasa')
  const propio = delayOf(tarea({ end: '2030-01-09' }), '2030-01-20')
  assert.equal(propio.days, 4)
  assert.equal(propio.level, 2)
  assert.equal(propio.own, true)
  assert.equal(propio.label, 'Retrasada 4 d')
  const desplazada = delayOf(tarea({ end: '2030-01-07' }), '2030-01-02')
  assert.equal(desplazada.own, false, 'su plazo aún no ha vencido: la empujaron sus predecesoras')
  assert.equal(desplazada.label, 'Desplazada 2 d')
  assert.equal(delayOf(tarea({ planned_end: null, end: '2030-01-05' }), '2030-01-01'), null, 'sin plazo de referencia usa su fin')
})

test('cuánto se ha corrido la entrega del proyecto entero y cuántas tareas llevan retraso', () => {
  assert.deepEqual(projectSlip([]), { days: 0, late: 0 })
  const ts = [tarea({ id: 'a', end: '2030-01-05' }), tarea({ id: 'b', end: '2030-01-12', planned_end: '2030-01-08' })]
  assert.deepEqual(projectSlip(ts), { days: 4, late: 1 })
})

test('cambios de estado: una iniciada no vuelve a Pendiente y solo se pausa o bloquea lo que está en marcha', () => {
  assert.match(moveBlockedReason(tarea({ status: 'doing' }), 'todo'), /no puede volver a Pendiente/)
  assert.match(moveBlockedReason(tarea({ status: 'todo' }), 'blocked'), /Primero hay que iniciar la tarea/)
  assert.match(moveBlockedReason(tarea({ status: 'todo' }), 'paused'), /Primero hay que iniciar la tarea/)
  assert.equal(moveBlockedReason(tarea({ status: 'todo' }), 'doing'), null)
  assert.equal(moveBlockedReason(tarea({ status: 'todo' }), 'done'), null)
  assert.equal(moveBlockedReason(tarea({ status: 'done' }), 'doing'), null, 'reabrir la deja En curso')
  assert.equal(moveBlockedReason(tarea({ status: 'doing' }), 'doing'), null)
  assert.equal(canMove(tarea({ status: 'doing' }), 'todo'), false)
})

test('documentos pendientes: los requeridos que no se han aportado ni marcado «No aplica»', () => {
  const t = tarea({
    deliverables: [{ key: 'a', label: 'A', na: false }, { key: 'b', label: 'B', na: true }, { key: 'c', label: 'C', na: false }],
    attachments: [{ requirement: 'c' }]
  })
  assert.deepEqual(pendingDeliverables(t).map((d) => d.label), ['A'])
})

test('colores: una fase por color en el orden de la plantilla, y un color estable por área', () => {
  const ts = [tarea({ id: '1', phase: 'FASE 2', position: 5 }), tarea({ id: '2', phase: 'FASE 1', position: 1 }), tarea({ id: '3', phase: 'FASE 2', position: 2 }), tarea({ id: '4', phase: '' })]
  assert.deepEqual(orderedPhases(ts), ['FASE 1', 'FASE 2'])
  const colores = phaseColors(ts)
  assert.equal(colores.size, 2)
  assert.notEqual(colores.get('FASE 1'), colores.get('FASE 2'))
  assert.equal(departmentColor('comercial'), '#f59e0b')
  assert.equal(departmentColor('Raro'), departmentColor('Raro'))
  assert.deepEqual(STATUS_ORDER, ['todo', 'doing', 'paused', 'blocked', 'done'])
  assert.equal(STATUS_META.blocked.label, 'Bloqueada')
  assert.equal(BLOCK_REASONS[BLOCK_REASONS.length - 1], 'Otro')
})
