import test from 'node:test'
import assert from 'node:assert/strict'
import { partidasPorDefecto, conTramitesPorDefecto, potenciaKw } from '../../src/utils/planificador/motor/tramitesPorDefecto.js'
import { EMPTY_COSTS, parseCosts } from '../../src/utils/planificador/motor/costes.js'
import { motivoBloqueo } from '../../src/utils/planificador/pasos.js'

const TRAMITES = ['Proyecto técnico', 'Memoria técnica', 'Dirección de obra', 'Tramitación', 'Seguridad y salud', 'Legalización (boletín)', 'Registro de autoconsumo', 'Excedentes', 'Licencia municipal']
const catalogo = {
  categories: [{ key: 'proyecto', label: 'Proyecto' }],
  items: TRAMITES.map((t, i) => ({ id: 'p' + i, category: 'proyecto', group: 'proyecto', brand: '', model: t, supplier: '', unit: 'ud', unit_price: 100 + i, default_qty: 1, attrs: { tramite: t }, notes: '' }))
}
const nombres = (kw) => partidasPorDefecto(kw, catalogo).map((p) => p.item.attrs.tramite)

test('hasta 10 kW va la memoria técnica y sin plan de seguridad; por encima, proyecto técnico y plan de seguridad', () => {
  const memoria = nombres(8)
  assert.ok(memoria.includes('Memoria técnica') && !memoria.includes('Proyecto técnico') && !memoria.includes('Seguridad y salud'))
  assert.ok(nombres(10).includes('Memoria técnica')) // justo 10 kW: memoria
  const proyecto = nombres(10.5)
  assert.ok(proyecto.includes('Proyecto técnico') && proyecto.includes('Seguridad y salud') && !proyecto.includes('Memoria técnica'))
})

test('tramitación, legalización, autoconsumo, excedentes y licencia van siempre', () => {
  for (const kw of [3, 10, 40, 200]) {
    const n = nombres(kw)
    for (const t of ['Dirección de obra', 'Tramitación', 'Legalización (boletín)', 'Registro de autoconsumo', 'Excedentes', 'Licencia municipal']) assert.ok(n.includes(t), kw + ' kW: ' + t)
  }
})

test('la dirección de obra suma una unidad por cada 50 kW', () => {
  const dir = (kw) => partidasPorDefecto(kw, catalogo).find((p) => p.item.attrs.tramite === 'Dirección de obra').qty
  assert.deepEqual([5, 50, 50.1, 100, 101].map(dir), [1, 1, 2, 2, 3])
})

test('una partida que no está en el inventario se salta', () => {
  const sin = { ...catalogo, items: catalogo.items.filter((i) => i.attrs.tramite !== 'Excedentes') }
  assert.ok(!partidasPorDefecto(20, sin).some((p) => p.item.attrs.tramite === 'Excedentes'))
})

test('el presupuesto nuevo recibe las partidas, quita la marca y no repite las que ya tiene', () => {
  const nuevo = { ...parseCosts({ ...EMPTY_COSTS, moduleWp: 615, moduleCount: 17 }), tramitesPendientes: true }
  assert.ok(Math.abs(potenciaKw(nuevo) - 10.455) < 1e-9)
  const r = conTramitesPorDefecto(nuevo, catalogo)
  assert.equal('tramitesPendientes' in r, false)
  assert.deepEqual(r.lines.map((l) => l.itemId).sort(), ['p0', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].sort()) // proyecto, no memoria
  assert.ok(r.lines.every((l) => l.qty === 1 && l.equipment === 'Proyecto'))
  const otra = conTramitesPorDefecto({ ...nuevo, tramitesPendientes: true, lines: r.lines }, catalogo)
  assert.equal(otra.lines.length, r.lines.length)
})

test('la marca solo vive en un presupuesto recién creado y se conserva al leerlo', () => {
  assert.equal(parseCosts({ tramitesPendientes: true }).tramitesPendientes, true)
  assert.equal('tramitesPendientes' in parseCosts({}), false)
  assert.equal('tramitesPendientes' in parseCosts({ tramitesPendientes: 'sí' }), false)
})

test('el paso de trámites está siempre abierto y no desbloquea los anteriores', () => {
  const vacio = { ...EMPTY_COSTS, lines: [] }
  const catVacio = { items: [], categories: [] }
  const indice = (clave) => ['paneles', 'estructura', 'inversor', 'baterias', 'cableado_cc', 'alterna', 'tierra', 'auxiliar', 'tramites', 'obra'].indexOf(clave)
  assert.equal(motivoBloqueo(indice('tramites'), vacio, catVacio), null)
  // con partidas de trámites puestas, las baterías siguen dependiendo del inversor
  const conTramites = { ...vacio, lines: [{ id: 'x', itemId: 'p0', group: 'proyecto', qty: 1, unit: 'ud', price: 1, auto: false }] }
  const cat = { ...catalogo, categories: catalogo.categories }
  assert.ok(motivoBloqueo(indice('baterias'), conTramites, cat))
})
