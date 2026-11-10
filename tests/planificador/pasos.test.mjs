// Pruebas de la lógica de los pasos guiados: navegación, qué se oculta por incompatible, sugeridos y filtros por defecto
// (segunda tabla de «Reglas del presupuestador.html»: «Navegación entre pasos, filtros y avisos»).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pasoGuardado, guardarPaso, esDeSeccion, elegidos, contarPaso, pasoHecho, motivoBloqueo, contextoDelPaso, sugeridosDelPaso,
  conflictosDelPaso, filtroPorDefecto, insigniaBateria, lineaEspec, inversoresCompatibles, unidadesDeInversor
} from '../../src/utils/planificador/pasos.js'
import { STEPS } from '../../src/utils/planificador/motor/pasosConfig.js'

const IDX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]))

function producto(id, category, attrs = {}, extra = {}) {
  return {
    id, position: 0, category, group: 'electricidad', brand: '', model: id, supplier: '', unit: 'ud', unit_price: 100, per_module: false,
    default_qty: 1, attrs, notes: '', sample: false, stock: 0, stock_min: 0, datasheet: '', offers: [], price_reviewed_at: null, ...extra
  }
}
const linea = (p, qty = 1, extra = {}) => ({ id: 'l-' + p.id, itemId: p.id, group: p.group, equipment: p.category, model: p.model, supplier: '', unit: p.unit, qty, auto: false, price: 1, priceEdited: false, notes: '', ...extra })
const estado = (lines, survey = {}, extra = {}) => ({
  client: '', customer: null, reference: '', strings: null, moduleWp: 600, moduleCount: 12, saleRatio: 1.1, lines, order: 'insercion',
  survey: { roof: 'teja', targetKwp: 0, cableMeters: 0, acMeters: 0, futureBattery: false, supply: '', ...survey }, ...extra
})
const catalogo = (items) => ({ items, categories: [] })

const PANEL = producto('p1', 'modulos', { voc_v: 50, vmp_v: 42, isc_a: 13, imp_a: 12.5, grosor_mm: 30 }, { brand: 'AIKO' })
const INV = producto('i1', 'inversores', { tipo: 'String', potencia_kw: 6, fases: 'Trifásico', mppt_min_v: 200, mppt_max_v: 800, vmax_v: 1000, imax_mppt_a: 25, n_mppt: 2 }, { brand: 'HUAWEI' })
const MEDIDOR = producto('c1', 'contadores', { fases: 'Trifásico' }, { brand: 'HUAWEI' })
const CAB_CC = producto('cc1', 'cableado', { tipo: 'CC', color: 'Rojo', seccion_mm2: 6 })
const CONECTORES = producto('mc4', 'cableado', { tipo: 'Conectores' })

test('hay 10 pasos y se recuerda el paso de cada presupuesto por su clave (vale aunque cambie el orden)', () => {
  assert.equal(STEPS.length, 10)
  const memoria = new Map()
  const almacen = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) }
  assert.equal(pasoGuardado('a', almacen), 0, 'sin nada guardado, el primero')
  guardarPaso('a', IDX.alterna, almacen)
  guardarPaso('b', IDX.tierra, almacen)
  assert.equal(pasoGuardado('a', almacen), IDX.alterna)
  assert.equal(pasoGuardado('b', almacen), IDX.tierra)
  memoria.set('planificador.costes.paso.c', 'paso_que_ya_no_existe')
  assert.equal(pasoGuardado('c', almacen), 0)
  assert.equal(pasoGuardado('d', { getItem: () => { throw new Error('bloqueado') } }), 0, 'sin almacenamiento no falla')
})

test('un producto es de una sección por su categoría y por los valores fijos de sus características', () => {
  const cableCC = STEPS[IDX.cableado_cc].sections.find((s) => s.id === 'cable-cc')
  const conectores = STEPS[IDX.cableado_cc].sections.find((s) => s.id === 'conectores')
  assert.equal(esDeSeccion(CAB_CC, cableCC), true)
  assert.equal(esDeSeccion(CAB_CC, conectores), false)
  assert.equal(esDeSeccion(CONECTORES, conectores), true)
  assert.equal(esDeSeccion(PANEL, cableCC), false)
})

test('Navegación · Estructura e Inversor exigen haber elegido algo en Paneles', () => {
  const vacio = estado([])
  assert.match(motivoBloqueo(IDX.estructura, vacio, catalogo([PANEL])), /«Estructura de soporte» depende de «Paneles»/)
  assert.match(motivoBloqueo(IDX.inversor, vacio, catalogo([PANEL])), /«Inversor» depende de «Paneles»/)
  const conPanel = estado([linea(PANEL, 12)])
  assert.equal(motivoBloqueo(IDX.estructura, conPanel, catalogo([PANEL])), null)
  assert.equal(motivoBloqueo(IDX.inversor, conPanel, catalogo([PANEL])), null)
})

test('Navegación · Baterías exige haber elegido el inversor propiamente dicho (el medidor no basta)', () => {
  const soloMedidor = estado([linea(PANEL, 12), linea(MEDIDOR)])
  const cat = catalogo([PANEL, MEDIDOR, INV])
  assert.equal(pasoHecho(STEPS[IDX.inversor], soloMedidor, cat), false)
  assert.match(motivoBloqueo(IDX.baterias, soloMedidor, cat), /«Baterías» depende de «Inversor»/)
  const conInversor = estado([linea(PANEL, 12), linea(INV)])
  assert.equal(pasoHecho(STEPS[IDX.inversor], conInversor, cat), true)
  assert.equal(motivoBloqueo(IDX.baterias, conInversor, cat), null)
})

test('Navegación · solo se puede saltar un paso sin elegir', () => {
  const cat = catalogo([PANEL, INV])
  const conPanel = estado([linea(PANEL, 12)])
  // Paneles hecho, falta solo la estructura: se puede ir al inversor (salta uno)
  assert.equal(motivoBloqueo(IDX.inversor, conPanel, cat), null)
  // Faltan la estructura, el inversor y las baterías: no se puede ir a cableado DC
  const motivo = motivoBloqueo(IDX.cableado_cc, conPanel, cat)
  assert.match(motivo, /Solo se puede saltar un paso y faltan por elegir: «Estructura de soporte», «Inversor», «Baterías»/)
})

test('los pasos se cuentan y se marcan como hechos por lo elegido en sus secciones', () => {
  const cat = catalogo([PANEL, INV, CAB_CC, CONECTORES])
  const st = estado([linea(PANEL, 12), linea(CAB_CC, 100), linea(CONECTORES, 5)])
  assert.equal(contarPaso(STEPS[IDX.paneles], st, cat), 1)
  assert.equal(contarPaso(STEPS[IDX.cableado_cc], st, cat), 2)
  assert.equal(contarPaso(STEPS[IDX.inversor], st, cat), 0)
  assert.deepEqual(elegidos(st, cat, 'cableado').map((i) => i.id), ['cc1', 'mc4'])
})

test('Filtrado por pasos · el contexto de un paso solo incluye lo elegido hasta él; los pasos anteriores enseñan todo', () => {
  const cat = catalogo([PANEL, INV, CAB_CC])
  const st = estado([linea(PANEL, 12), linea(INV), linea(CAB_CC, 100)])
  assert.deepEqual(contextoDelPaso(st, cat, IDX.paneles).lines.map((l) => l.itemId), ['p1'])
  assert.deepEqual(contextoDelPaso(st, cat, IDX.inversor).lines.map((l) => l.itemId), ['p1', 'i1'])
  assert.deepEqual(contextoDelPaso(st, cat, IDX.cableado_cc).lines.map((l) => l.itemId), ['p1', 'i1', 'cc1'])
})

test('Filtrado por pasos · lo incompatible de fondo con lo elegido se oculta en este paso con su motivo', () => {
  const monofasico = producto('c2', 'contadores', { fases: 'Monofásico' }, { brand: 'X' })
  const trifasico = producto('c3', 'contadores', { fases: 'Trifásico' }, { brand: 'X' })
  const cat = catalogo([PANEL, INV, MEDIDOR, monofasico, trifasico])
  const st = estado([linea(PANEL, 12), linea(INV)])
  const conflictos = conflictosDelPaso(st, cat, IDX.inversor)
  assert.equal(conflictos.has('c2'), true)
  assert.match(conflictos.get('c2')[0], /monofásico/)
  assert.equal(conflictos.has('c3'), false)
  // Lo que ya está añadido no se oculta
  const conMono = estado([linea(PANEL, 12), linea(INV), linea(monofasico)])
  assert.equal(conflictosDelPaso(conMono, cat, IDX.inversor).has('c2'), false)
  // En un paso anterior al del inversor, el inversor aún no condiciona: no se oculta nada por él
  assert.equal(conflictosDelPaso(st, catalogo([PANEL, INV, monofasico]), IDX.paneles).size, 0)
})

test('Sugeridos · salen sin avisos y con razones; los de prueba y sin precio no', () => {
  const buenoSinStock = { ...INV, id: 'i-ok', unit_price: 800 }
  const buenoConStock = { ...INV, id: 'i-stock', unit_price: 900, stock: 3 }
  const deMuestra = { ...INV, id: 'i-prueba', sample: true }
  const sinPrecio = { ...INV, id: 'i-sin', unit_price: 0 }
  const cat = catalogo([PANEL, buenoSinStock, buenoConStock, deMuestra, sinPrecio])
  const st = estado([linea(PANEL, 12)])
  const sug = sugeridosDelPaso(st, cat, IDX.inversor).get('inversores').map((s) => s.item.id)
  assert.deepEqual(sug, ['i-stock', 'i-ok'], 'primero los que hay en stock')
  // El que ya está en el presupuesto no se sugiere
  const conUno = estado([linea(PANEL, 12), linea(buenoConStock)])
  assert.equal(sugeridosDelPaso(conUno, cat, IDX.inversor).get('inversores').some((s) => s.item.id === 'i-stock'), false)
})

test('Filtro por defecto · estructura por la cubierta elegida; inversores, híbridos si se prevén baterías', () => {
  const seccionEstructura = STEPS[IDX.estructura].sections[0]
  const f = filtroPorDefecto(seccionEstructura, { roof: 'chapa' })
  assert.equal(f.label, 'cubierta chapa')
  assert.equal(f.test(producto('x', 'estructura', { cubierta: 'Chapa' })), true)
  assert.equal(f.test(producto('x', 'estructura', { cubierta: 'Teja' })), false)
  assert.equal(f.test(producto('x', 'estructura', {})), true, 'sin dato vale para todas')
  const seccionInversores = STEPS[IDX.inversor].sections.find((s) => s.id === 'inversores')
  assert.equal(filtroPorDefecto(seccionInversores, { futureBattery: false }), null)
  const g = filtroPorDefecto(seccionInversores, { futureBattery: true })
  assert.equal(g.test(producto('h', 'inversores', { hibrido: 'Sí' })), true)
  assert.equal(g.test(producto('m', 'inversores', { tipo: 'Microinversor' })), true)
  assert.equal(g.test(producto('o', 'inversores', { tipo: 'Optimizador' })), true)
  assert.equal(g.test(producto('s', 'inversores', { tipo: 'String', hibrido: 'No' })), false)
  assert.equal(filtroPorDefecto(STEPS[IDX.tierra].sections[0], { roof: 'teja' }), null)
})

test('insignia de batería: Compatible o Revisar frente al inversor, y nada sin dato de compatibilidad', () => {
  const bat = producto('b1', 'baterias', { compatible: 'Huawei' }, { brand: 'HUAWEI' })
  assert.deepEqual(insigniaBateria(bat, INV), { text: 'Compatible', kind: 'ok', title: 'Compatible con el inversor elegido.' })
  const ajena = producto('b2', 'baterias', { compatible: 'Sungrow' }, { brand: 'PYLONTECH' })
  assert.equal(insigniaBateria(ajena, INV).text, 'Revisar')
  assert.equal(insigniaBateria(producto('b3', 'baterias', {}), INV), null)
  assert.equal(insigniaBateria(bat, undefined), null)
})

test('línea de datos técnicos del equipo con su unidad y sin los vacíos', () => {
  const specs = [{ key: 'voc_v', label: 'Voc (V)' }, { key: 'isc_a', label: 'Isc (A)' }, { key: 'x', label: 'Otro' }]
  assert.equal(lineaEspec(specs, producto('p', 'modulos', { voc_v: 56, isc_a: '—' })), 'Voc: 56 V')
  assert.equal(lineaEspec(specs, producto('p', 'modulos', { voc_v: 56, isc_a: 13.9 })), 'Voc: 56 V · Isc: 13.9 A')
})

test('inversores que admiten los strings diseñados, el que menos unidades necesita primero', () => {
  const pequeno = { ...INV, id: 'i-peq', unit_price: 500, attrs: { ...INV.attrs, n_mppt: 1, imax_mppt_a: 13 } }
  const cat = catalogo([PANEL, INV, pequeno])
  const st = estado([linea(PANEL, 12)], {}, { strings: [{ id: 's1', panels: 12, input: 1 }] })
  const r = inversoresCompatibles(st, PANEL, cat)
  assert.ok(r.length >= 1)
  assert.deepEqual(r.map((x) => x.units), [...r.map((x) => x.units)].sort((a, b) => a - b))
  assert.deepEqual(inversoresCompatibles(estado([]), PANEL, cat), [], 'sin strings no hay nada que comprobar')
  assert.deepEqual(inversoresCompatibles(st, undefined, cat), [])
})

test('cuántos inversores de este modelo hay en el presupuesto (al menos uno)', () => {
  assert.equal(unidadesDeInversor(estado([linea(INV, 2)]), INV), 2)
  assert.equal(unidadesDeInversor(estado([]), INV), 1)
  assert.equal(unidadesDeInversor(estado([]), undefined), 1)
})
