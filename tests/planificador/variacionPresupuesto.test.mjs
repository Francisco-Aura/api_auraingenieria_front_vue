import test from 'node:test'
import assert from 'node:assert/strict'
import { crearBorrador, cantidadDeBorrador, totalesDeBorrador, construirCambio, lineaNueva, baseDesdePresupuestador, gruposOrdenados } from '../../src/utils/planificador/contratos/variacionPresupuesto.js'

const vista = {
  configured: true, module_wp: 550, sale_ratio: 0.5,
  initial: { cost: 2125, budget: 5500, profit: 3375, margin: 0.61, module_count: 20 },
  current: { cost: 2125, budget: 5500, profit: 3375, margin: 0.61, module_count: 20 },
  lines: [
    { id: 'l1', group: 'modulos', auto: true, price: 100, current_qty: 20, initial_qty: 20, initial_total: 2000 },
    { id: 'l2', group: 'cableado', auto: false, price: 2.5, current_qty: 50, initial_qty: 50, initial_total: 125 }
  ]
}

test('el borrador parte de lo vigente y las líneas automáticas siguen a los módulos', () => {
  const b = crearBorrador(vista, '2030-01-01')
  assert.equal(b.modulos, 20)
  assert.deepEqual(b.cantidades, { l2: 50 })
  assert.equal(cantidadDeBorrador(vista.lines[0], { ...b, modulos: 24 }), 24)
  assert.equal(cantidadDeBorrador(vista.lines[1], b), 50)
  assert.equal(cantidadDeBorrador(vista.lines[1], null), 50)
})

test('los totales del borrador cuentan módulos, cantidades y productos nuevos', () => {
  const b = crearBorrador(vista, 'x')
  assert.deepEqual(totalesDeBorrador(vista, null), { coste: 2125, venta: 5500, dCoste: 0, dVenta: 0 })
  b.modulos = 24
  b.cantidades.l2 = 60
  b.nuevas.push({ id: 'n', qty: 3, data: { price: 10 } })
  const t = totalesDeBorrador(vista, b)
  assert.equal(t.coste, 24 * 100 + 60 * 2.5 + 30)
  assert.equal(t.venta, 0.5 * 550 * 24)
  assert.equal(t.dVenta, 1100)
  assert.equal(t.dCoste, 455)
})

test('el cambio recoge cuántas unidades se añaden o quitan y, si cambian los módulos, los datos del contrato', () => {
  const b = crearBorrador(vista, 'x')
  assert.equal(construirCambio(vista, b), null, 'sin tocar nada no hay cambio')
  b.cantidades.l2 = 40.5
  b.modulos = 24
  b.nuevas.push({ id: 'n1', qty: 2, data: { model: 'Caja' } }, { id: 'n2', qty: 0, data: {} })
  const c = construirCambio(vista, b)
  assert.deepEqual(c.budget, { module_delta: 4, lines: [{ id: 'l2', qty_delta: -9.5 }, { id: 'n1', qty_delta: 2, new: { model: 'Caja' } }] })
  assert.deepEqual(c.set, { paneles_uds: 24, potencia_kwp: 13.2 })
  const solo = crearBorrador(vista, 'x'); solo.cantidades.l2 = 51
  assert.deepEqual(construirCambio(vista, solo).set, {}, 'sin variar módulos no se tocan los datos del contrato')
})

test('una línea nueva parte de cero y la base del Presupuestador fija las cantidades que siguen a los paneles', () => {
  const n = lineaNueva({ itemId: 'i', group: 'g', equipment: 'E', model: 'M', supplier: 'S', unit: 'ud', price: 9, notes: '' })
  assert.equal(n.qty, 1); assert.equal(n.data.qty, 0); assert.equal(n.data.auto, false); assert.ok(n.id.startsWith('b'))
  const base = baseDesdePresupuestador({ client: 'c', moduleWp: 550, moduleCount: 10, saleRatio: 1, lines: [{ id: 'a', qty: 0, auto: true, price: 1, perPanel: undefined }, { id: 'b', qty: 3, price: 1 }] })
  assert.equal(base.lines[1].qty, 3); assert.equal(base.moduleCount, 10)
})

test('las partidas salen en el orden del catálogo y las desconocidas al final', () => {
  const filas = [{ group: 'z' }, { group: 'cableado' }, { group: 'modulos' }]
  assert.deepEqual(gruposOrdenados(filas, [{ key: 'modulos' }, { key: 'cableado' }]), ['modulos', 'cableado', 'z'])
  assert.deepEqual(gruposOrdenados(filas, null), ['z', 'cableado', 'modulos'])
})
