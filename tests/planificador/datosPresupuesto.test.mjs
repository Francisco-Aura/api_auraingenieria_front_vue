import test from 'node:test'
import assert from 'node:assert/strict'
import { valoresDe, cuantosPaneles, aplicarValores, problemasDe, cuerpoParaServidor, sincronizado } from '../../src/utils/planificador/datosPresupuesto.js'
import { EMPTY_COSTS, EMPTY_SURVEY } from '../../src/utils/planificador/motor/costes.js'
import { canonical } from '../../src/utils/planificador/almacenPresupuestos.js'

const vacio = () => ({ ...EMPTY_COSTS, survey: { ...EMPTY_SURVEY } })
const potencial = { kind: 'potencial', name: 'Pedro Ingaser', phone: '', email: '', cif: 'B1' }

test('los paneles salen de la potencia a instalar ÷ la del panel, redondeando hacia arriba', () => {
  const v = { ...valoresDe(vacio()), targetKwp: 10, moduleWp: 600, manualPanels: false }
  assert.equal(cuantosPaneles(v), 17) // 10000 / 600 = 16,67
  assert.equal(cuantosPaneles({ ...v, manualPanels: true, moduleCount: 20 }), 20)
  assert.equal(cuantosPaneles({ ...v, targetKwp: 0, moduleCount: 12 }), 12, 'sin potencia se queda con lo que había')
})

test('el nº de paneles puesto a mano se detecta al abrir los parámetros de un presupuesto', () => {
  const est = { ...vacio(), moduleWp: 600, moduleCount: 20, survey: { ...EMPTY_SURVEY, targetKwp: 10 } }
  assert.equal(valoresDe(est).manualPanels, true)
  const auto = { ...est, moduleCount: 17 }
  assert.equal(valoresDe(auto).manualPanels, false)
})

test('aplicar los valores conserva lo demás y pone cliente, paneles, cubierta y suministro', () => {
  const base = { ...vacio(), lines: [{ id: 'l1' }], order: 'fijo', client: 'viejo' }
  const v = { ...valoresDe(base), customer: potencial, reference: '  Nave 2  ', targetKwp: 10, moduleWp: 500, manualPanels: false,
    roof: 'chapa', supply: 'trifasico', futureBattery: true, cableMeters: 40, acMeters: 15, saleRatio: 1.2 }
  const r = aplicarValores(base, v)
  assert.equal(r.client, 'Pedro Ingaser')
  assert.equal(r.reference, 'Nave 2')
  assert.equal(r.moduleCount, 20)
  assert.equal(r.moduleWp, 500)
  assert.equal(r.saleRatio, 1.2)
  assert.deepEqual(r.lines, [{ id: 'l1' }])
  assert.equal(r.order, 'fijo')
  assert.deepEqual(r.survey, { ...base.survey, roof: 'chapa', supply: 'trifasico', targetKwp: 10, futureBattery: true, cableMeters: 40, acMeters: 15 })
})

test('sin cliente se conserva el nombre que ya tenía el presupuesto', () => {
  const base = { ...vacio(), client: 'Antiguo SL' }
  assert.equal(aplicarValores(base, { ...valoresDe(base), customer: null }).client, 'Antiguo SL')
})

test('problemas para crear: cliente, nombre del proyecto, potencia a instalar, potencia del panel y al menos un panel', () => {
  const v = valoresDe(vacio())
  assert.deepEqual(problemasDe({ ...v, customer: null, reference: '', targetKwp: 0, moduleWp: 0 }, 0), [
    'Elige el cliente del presupuesto: uno existente o un cliente potencial nuevo.',
    'Escribe el nombre del proyecto (por ejemplo «Nave 2»): con el cliente identifica a qué proyecto pertenece el presupuesto.',
    'Indica la potencia que se quiere instalar (kWp).',
    'Indica la potencia de cada panel (Wp).',
    'El presupuesto necesita al menos un panel.'
  ])
  assert.equal(problemasDe({ ...v, customer: potencial, reference: '   ', targetKwp: 10, moduleWp: 600 }, 17).length, 1, 'un nombre en blanco no vale')
  assert.deepEqual(problemasDe({ ...v, customer: potencial, reference: 'Nave 2', targetKwp: 10, moduleWp: 600 }, 17), [])
})

test('el cuerpo para el servidor lleva el cliente y los números del listado; solo el existente manda su id', () => {
  const trabajo = { id: 'a', state: { x: 1 }, numbers: { kwp: 7.2, panels: 12, total: 9000 } }
  assert.deepEqual(cuerpoParaServidor(trabajo, 'Casa', { kind: 'existente', id: 5 }), {
    name: 'Casa', data: { x: 1 }, customer_kind: 'existente', customer_id: 5, kwp: 7.2, panels: 12, budget_total: 9000
  })
  assert.equal(cuerpoParaServidor(trabajo, 'Casa', potencial).customer_id, undefined)
})

test('tras guardar, la copia de trabajo recuerda la versión del servidor y lo sincronizado', () => {
  const trabajo = { id: 'a', state: vacio(), remote: null }
  const completo = { id: 'a', version: 3, owner: 'Ana', owner_id: '7', updated_by: 'Ana', updated_at: 'hoy', status: 'borrador' }
  const r = sincronizado(trabajo, completo, trabajo.state, canonical)
  assert.equal(r.remote.version, 3)
  assert.equal(r.remote.syncedJson, canonical(trabajo.state))
  assert.equal(r.remote.ownerId, '7')
  assert.equal(sincronizado({ id: 'otro' }, completo, {}, canonical).remote, undefined, 'otro presupuesto: no se toca')
  assert.equal(sincronizado(null, completo, {}, canonical), null)
})
