// Pruebas del motor de reglas del presupuestador. Reproducen las filas de «Reglas del presupuestador.html»
// (la especificación): cada regla de compatibilidad, qué reglas ocultan el producto («hard»), las constantes y tablas
// de intensidad, los criterios de «Sugeridos» y la regla de strings iguales.
import test from 'node:test'
import { splitMissing, spreadPanels, createStrings, fixedCount, releaseFixed, canSpreadRest } from '../../src/utils/planificador/motor/strings.js'
import { parseCosts } from '../../src/utils/planificador/motor/costes.js'
import assert from 'node:assert/strict'
import { checkCompatibility, hardConflicts, issuesByLine, fitReasons, suggestions, sizeInverters } from '../../src/utils/planificador/motor/compatibilidad.js'
import { stringPlan, stringLimits, COLD_VOC, HOT_VMP, MIN_STRING_PANELS, MAX_STRING_PANELS } from '../../src/utils/planificador/motor/pasosConfig.js'

// ------------------------------------------------------------------------------------------------ ayudas

function producto(id, category, attrs = {}, extra = {}) {
  return {
    id, position: 0, category, group: 'electricidad', brand: '', model: id, supplier: '', unit: 'ud', unit_price: 100,
    per_module: false, default_qty: 1, attrs, notes: '', sample: false, stock: 0, stock_min: 0, datasheet: '', offers: [],
    price_reviewed_at: null, ...extra
  }
}

const linea = (p, qty, extra = {}) => ({
  id: 'l-' + p.id, itemId: p.id, group: p.group, equipment: p.category, model: [p.brand, p.model].filter(Boolean).join(' '),
  supplier: '', unit: p.unit, qty, auto: false, price: p.unit_price, priceEdited: false, notes: '', ...extra
})

function estado(lines, { n = 12, wp = 600, survey = {}, strings = null } = {}) {
  return {
    client: '', customer: null, reference: '', strings, moduleWp: wp, moduleCount: n, saleRatio: 1.1, lines,
    survey: { roof: 'teja', targetKwp: 0, cableMeters: 0, acMeters: 0, futureBattery: false, supply: '', ...survey },
    order: 'insercion'
  }
}

const catalogo = (items) => ({ items, categories: [] })

// Panel y inversor de partida: con 12 paneles dan un solo string de 12 y la relación paneles/inversor es 0,72 (sin avisos).
const PANEL = producto('p1', 'modulos', { voc_v: 50, vmp_v: 42, isc_a: 13, imp_a: 12.5, grosor_mm: 30 }, { brand: 'AIKO', model: 'P600' })
const INVERSOR = producto('i1', 'inversores', {
  tipo: 'String', potencia_kw: 10, fases: 'Trifásico', mppt_min_v: 200, mppt_max_v: 800, vmax_v: 1000, imax_mppt_a: 25, n_mppt: 2
}, { brand: 'HUAWEI', model: 'SUN2000-10K' })
const inversor = (attrs, extra = {}) => ({ ...INVERSOR, attrs: { ...INVERSOR.attrs, ...attrs }, ...extra })
const panel = (attrs, extra = {}) => ({ ...PANEL, attrs: { ...PANEL.attrs, ...attrs }, ...extra })

/** Comprueba un presupuesto con el panel y el inversor de partida más lo que se añada. `extras` van al catálogo y al presupuesto. */
function revisar(extras = [], { opciones = {}, panelo = PANEL, inv = INVERSOR, catalogoExtra = [], sinInversor = false } = {}) {
  const lineas = [linea(panelo, 12, { auto: true })]
  if (!sinInversor) lineas.push(linea(inv, 1))
  const items = [panelo, ...(sinInversor ? [] : [inv])]
  for (const e of extras) {
    items.push(e.item)
    lineas.push(linea(e.item, e.qty ?? 1, e.linea))
  }
  return checkCompatibility(estado(lineas, opciones), catalogo([...items, ...catalogoExtra]))
}

const extra = (item, qty = 1, lineaExtra) => ({ item, qty, linea: lineaExtra })
const codigo = (i) => i.id.split('|')[0]
const claves = (issues) => issues.map((i) => `${i.level}:${codigo(i)}`)
const tiene = (issues, nivel, cod) => issues.some((i) => i.level === nivel && codigo(i) === cod)
const buscar = (issues, nivel, cod) => issues.find((i) => i.level === nivel && codigo(i) === cod)

// ------------------------------------------------------------------------------------- punto de partida

test('el presupuesto de partida (12 paneles, un inversor de 10 kW) no tiene ningún aviso', () => {
  assert.deepEqual(claves(revisar()), [])
})

test('una regla solo se comprueba si el inventario tiene el dato: sin datos no avisa nada', () => {
  const vacio = producto('p0', 'modulos', {}, { brand: 'X' })
  const inv = producto('i0', 'inversores', {}, { brand: 'Y' })
  const cable = producto('c0', 'cableado', { tipo: 'CC' })
  const mag = producto('m0', 'protecciones', { tipo: 'AC', elemento: 'Magnetotérmico' })
  assert.deepEqual(claves(revisar([extra(cable, 10), extra(mag)], { panelo: vacio, inv })), [])
})

test('los errores salen antes que los avisos', () => {
  const issues = revisar([extra(producto('m1', 'contadores', { fases: 'Monofásico' }), 2)])
  const niveles = issues.map((i) => i.level)
  assert.ok(niveles.includes('error') && niveles.includes('warn'))
  assert.equal(niveles.indexOf('warn') > niveles.lastIndexOf('error'), true)
})

// ----------------------------------------------------------------------------------------- 1 · Paneles

test('paneles-mezclados: más de un modelo de panel en el presupuesto (aviso, no oculta)', () => {
  const otro = panel({}, { id: 'p2', model: 'P610' })
  const issues = revisar([extra(otro, 6)])
  const i = buscar(issues, 'warn', 'paneles-mezclados')
  assert.ok(i)
  assert.equal(i.hard, false)
})

test('paneles-cantidad: fila de panel que no sigue al nº de paneles y tiene unidades distintas', () => {
  const lineas = [linea(PANEL, 10), linea(INVERSOR, 1)]
  const issues = checkCompatibility(estado(lineas), catalogo([PANEL, INVERSOR]))
  assert.ok(tiene(issues, 'warn', 'paneles-cantidad'))
  // Si la fila sigue al nº de paneles (auto), no avisa
  const auto = checkCompatibility(estado([linea(PANEL, 10, { auto: true }), linea(INVERSOR, 1)]), catalogo([PANEL, INVERSOR]))
  assert.equal(tiene(auto, 'warn', 'paneles-cantidad'), false)
})

test('strings-nota: el nº de paneles no se reparte en strings iguales dentro del rango válido', () => {
  const plan = stringPlan(PANEL, INVERSOR, 19)
  assert.equal(plan.length, 17, 'sin reparto igual se usa el string más largo posible')
  assert.equal(plan.notes.length, 1)
  assert.match(plan.notes[0], /no se reparten por igual/)
  assert.equal(stringPlan(PANEL, INVERSOR, 12).notes.length, 0)
})

test('strings iguales: se prefiere el largo más grande que reparte los paneles por igual', () => {
  assert.equal(stringPlan(PANEL, INVERSOR, 12).length, 12)
  assert.equal(stringPlan(PANEL, INVERSOR, 24).length, 12)
  assert.equal(stringPlan(PANEL, INVERSOR, 14).length, 14)
})

// --------------------------------------------------------------------------------------- 2 · Estructura

const estructura = (attrs, extraItem = {}) => producto('e1', 'estructura', attrs, { group: 'modulos', ...extraItem })

test('cubierta: cubierta del producto distinta de la elegida (error, no oculta)', () => {
  const issues = revisar([extra(estructura({ cubierta: 'Chapa' }))])
  const i = buscar(issues, 'error', 'cubierta')
  assert.ok(i)
  assert.equal(i.hard, false)
  // «Todas» y sin dato valen para cualquier cubierta; la elegida también
  assert.equal(tiene(revisar([extra(estructura({ cubierta: 'Todas' }))]), 'error', 'cubierta'), false)
  assert.equal(tiene(revisar([extra(estructura({}))]), 'error', 'cubierta'), false)
  assert.equal(tiene(revisar([extra(estructura({ cubierta: 'Chapa' }))], { opciones: { survey: { roof: 'chapa' } } }), 'error', 'cubierta'), false)
})

test('estructura-kits: kits que cubren menos paneles de los que hay (error) y sobra un kit entero (aviso)', () => {
  const kit = estructura({ modulos_por_kit: 3 })
  const falta = revisar([extra(kit, 3)]) // cubre 9 paneles, hay 12
  assert.equal(buscar(falta, 'error', 'estructura-kits').hard, false)
  assert.equal(tiene(revisar([extra(kit, 4)]), 'error', 'estructura-kits'), false) // cubre 12 justos
  assert.equal(tiene(revisar([extra(kit, 4)]), 'warn', 'estructura-kits'), false)
  assert.ok(tiene(revisar([extra(kit, 5)]), 'warn', 'estructura-kits')) // cubre 15: 15 - 12 = 3 ≥ 3
  assert.ok(tiene(revisar([extra(estructura({ modulos_por_kit: 4 }), 4)]), 'warn', 'estructura-kits')) // 16 - 12 = 4 ≥ 4: sobra un kit entero
})

test('estructura-modulos: partida «por módulo» con unidades distintas del nº de paneles (fila no automática)', () => {
  const porModulo = estructura({}, { unit: 'módulo' })
  assert.ok(tiene(revisar([extra(porModulo, 10)]), 'warn', 'estructura-modulos'))
  assert.equal(tiene(revisar([extra(porModulo, 12)]), 'warn', 'estructura-modulos'), false)
  assert.equal(tiene(revisar([extra(porModulo, 0, { auto: true })]), 'warn', 'estructura-modulos'), false)
})

test('estructura-modulos: varias filas por módulo que se reparten los paneles y suman el total no avisan (247 + 24 = 271)', () => {
  const coplanar = estructura({}, { unit: 'módulo' })
  const inclinada = estructura({}, { id: 'e2', model: 'Inclinada', unit: 'módulo' })
  // El presupuesto de las pruebas lleva 12 paneles: 10 + 2 = 12
  assert.equal(tiene(revisar([extra(coplanar, 10), extra(inclinada, 2)]), 'warn', 'estructura-modulos'), false)
  // Dos repartos completos (12 + 12) tampoco; si no suman un total exacto, sigue avisando
  assert.equal(tiene(revisar([extra(coplanar, 10), extra(inclinada, 14)]), 'warn', 'estructura-modulos'), false)
  assert.ok(tiene(revisar([extra(coplanar, 10), extra(inclinada, 3)]), 'warn', 'estructura-modulos'), '10 + 3 = 13: no suman 12')
  assert.ok(tiene(revisar([extra(coplanar, 10)]), 'warn', 'estructura-modulos'), 'una sola fila que no llega sigue avisando')
  // Una fila que ya lleva todos los paneles no se mezcla con el reparto de otras
  assert.equal(tiene(revisar([extra(coplanar, 12), extra(inclinada, 12)]), 'warn', 'estructura-modulos'), false)
})

test('estructura-uds: faltan unidades por panel (< ceil(nº de paneles × unidades por panel))', () => {
  const grapas = estructura({ uds_por_panel: 2 })
  assert.ok(tiene(revisar([extra(grapas, 23)]), 'warn', 'estructura-uds'))
  assert.equal(tiene(revisar([extra(grapas, 24)]), 'warn', 'estructura-uds'), false)
})

test('estructura-marco: grosor del marco fuera del rango del producto (error que oculta)', () => {
  const issues = revisar([extra(estructura({ grosor_min_mm: 35 }))])
  assert.equal(buscar(issues, 'error', 'estructura-marco').hard, true)
  assert.ok(tiene(revisar([extra(estructura({ grosor_max_mm: 25 }))]), 'error', 'estructura-marco'))
  assert.equal(tiene(revisar([extra(estructura({ grosor_min_mm: 30, grosor_max_mm: 35 }))]), 'error', 'estructura-marco'), false)
})

test('grapas: los strings piden más grapas finales o intermedias de las que hay (aviso)', () => {
  const final = estructura({ componente: 'Grapas' }, { model: 'Grapa final' })
  const lineas = [linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1), linea(final, 2)]
  const st = estado(lineas, { strings: [{ id: 's1', panels: 12, input: 1 }] })
  const issues = checkCompatibility(st, catalogo([PANEL, INVERSOR, final]))
  assert.ok(tiene(issues, 'warn', 'grapas-final')) // un string = una fila = 4 finales y hay 2
})

// ----------------------------------------------------------------------------------------- 3 · Inversor

test('strings-imposible: el mínimo de paneles por string supera el máximo (error que oculta)', () => {
  const imposible = inversor({ mppt_min_v: 600, vmax_v: 700 })
  const limites = stringLimits(PANEL, imposible)
  assert.deepEqual(limites, { min: 17, max: 12 })
  const issues = revisar([], { inv: imposible })
  const i = buscar(issues, 'error', 'strings-imposible')
  assert.ok(i)
  assert.equal(i.hard, true)
})

test('límites de string: mínimo = MPPT mín ÷ (Vmp × 0,88) y máximo = el menor de Vmáx ÷ (Voc × 1,12) y MPPT máx ÷ Vmp', () => {
  assert.equal(COLD_VOC, 1.12)
  assert.equal(HOT_VMP, 0.88)
  assert.deepEqual(stringLimits(PANEL, INVERSOR), { min: 6, max: 17 })
  assert.equal(stringLimits(PANEL, producto('x', 'inversores', {})), null, 'sin datos no hay límites')
  assert.equal(MIN_STRING_PANELS, 4)
  assert.equal(MAX_STRING_PANELS, 20)
})

test('strings (más strings de los que admite el inversor y cortocircuito por entrada) dentro del diseño de strings', () => {
  const lineas = [linea(PANEL, 18, { auto: true }), linea(INVERSOR, 1)]
  const cat = catalogo([PANEL, INVERSOR])
  // 3 strings de 6 en una misma entrada: 3 × 12,5 A = 37,5 A y la entrada admite 25 A
  const paralelo = checkCompatibility(estado(lineas, { n: 18, strings: [1, 2, 3].map((k) => ({ id: 's' + k, panels: 6, input: 1 })) }), cat)
  const e = paralelo.find((i) => codigo(i) === 'strings-diseno' && /entrada 1 recibe 3 strings/.test(i.message))
  assert.ok(e)
  assert.equal(e.level, 'error')
  // Cortocircuito: 2 strings en paralelo dan 26 A y la entrada admite 20 A
  const conIsc = inversor({ 'x:Corriente de cortocircuito máx. (A)': 20 })
  const corto = checkCompatibility(estado([linea(PANEL, 12, { auto: true }), linea(conIsc, 1)], {
    strings: [{ id: 'a', panels: 6, input: 1 }, { id: 'b', panels: 6, input: 1 }]
  }), catalogo([PANEL, conIsc]))
  assert.ok(corto.some((i) => codigo(i) === 'strings-diseno' && /cortocircuito/.test(i.message)))
  // Strings distintos en la misma entrada y una entrada que no existe
  const mezcla = checkCompatibility(estado(lineas, { n: 18, strings: [{ id: 'a', panels: 12, input: 1 }, { id: 'b', panels: 6, input: 1 }, { id: 'c', panels: 0, input: 9 }] }), cat)
  assert.ok(mezcla.some((i) => /mezcla strings de 12 y 6/.test(i.message)))
  assert.ok(mezcla.some((i) => /van a entradas que no existen/.test(i.message)))
})

test('con inversores de sobra, los strings que siguen en las entradas de cuando había menos se reasignan solos (una por entrada)', () => {
  // HUAWEI SUN2000-100KTL-M2 (10 MPPT, 30 A por entrada) y JA SOLAR 670 W (Imp 15,98 A): dos strings en una entrada dan 32 A, no valen
  const ja = producto('ja', 'modulos', { voc_v: 50.41, vmp_v: 41.93, isc_a: 16.78, imp_a: 15.98, grosor_mm: 30 }, { brand: 'JA SOLAR', model: 'JAM66D50-670/GB' })
  const huawei = producto('hw', 'inversores', {
    tipo: 'String', potencia_kw: 100, mppt_min_v: 200, mppt_max_v: 1000, vmax_v: 1100, imax_mppt_a: 30, n_mppt: 10, 'x:Corriente de cortocircuito máx. (A)': 40
  }, { brand: 'HUAWEI', model: 'SUN2000-100KTL-M2' })
  // 271 paneles en 15 strings (uno de 19 y 14 de 18; con este panel un string admite 19 como mucho), repartidos como cuando solo había
  // un inversor: 10 entradas y vuelta a empezar, así que las 5 primeras llevan dos strings
  const strings = Array.from({ length: 15 }, (_, i) => ({ id: 's' + i, panels: i === 0 ? 19 : 18, input: (i % 10) + 1 }))
  const state = estado([linea(ja, 271, { auto: true }), linea(huawei, 2)], { n: 271, wp: 670, strings })
  const cat = catalogo([ja, huawei])
  const antes = checkCompatibility(state, cat).filter((i) => codigo(i) === 'strings-diseno')
  assert.equal(antes.filter((i) => /reciben 2 strings/.test(i.message)).length, 1, 'los avisos de entradas iguales salen en uno solo')
  assert.ok(antes.some((i) => /Las entradas 1 a 5 reciben 2 strings en paralelo: 32 A y admiten 30 A/.test(i.message)))
  const ajustado = sizeInverters(state, cat)
  assert.ok(ajustado, 'se reasignan las entradas')
  assert.equal(new Set(ajustado.strings.map((s) => s.input)).size, 15, 'cada string en su propia entrada')
  assert.ok(ajustado.strings.every((s) => s.input >= 1 && s.input <= 20))
  assert.equal(ajustado.lines.find((l) => l.itemId === 'hw').qty, 2, 'las unidades no cambian')
  assert.equal(checkCompatibility(ajustado, cat).some((i) => codigo(i) === 'strings-diseno'), false)
  // Un diseño que ya vale no se toca
  assert.equal(sizeInverters(ajustado, cat), null)
})

test('el diseño de strings: sin strings no hay nada que comprobar y los que no suman los paneles dan error', () => {
  assert.equal(revisar().some((i) => codigo(i) === 'strings-diseno'), false)
  const issues = checkCompatibility(estado([linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1)], { strings: [{ id: 'a', panels: 6, input: 1 }] }), catalogo([PANEL, INVERSOR]))
  assert.ok(issues.some((i) => codigo(i) === 'strings-diseno' && /faltan 6/.test(i.message)))
})

test('dcac: paneles/inversor > 1,5 error; entre 1,35 y 1,5 aviso; < 0,7 aviso (ninguno oculta)', () => {
  const error = buscar(revisar([], { inv: inversor({ potencia_kw: 4 }) }), 'error', 'dcac') // 7,2 / 4 = 1,8
  assert.ok(error)
  assert.equal(error.hard, false)
  assert.ok(tiene(revisar([], { inv: inversor({ potencia_kw: 5 }) }), 'warn', 'dcac')) // 1,44
  assert.ok(tiene(revisar([], { inv: inversor({ potencia_kw: 12 }) }), 'warn', 'dcac')) // 0,6
  assert.equal(revisar([], { inv: inversor({ potencia_kw: 6 }) }).some((i) => codigo(i) === 'dcac'), false) // 1,2
  assert.equal(revisar([], { inv: inversor({ potencia_kw: 7.2 / 1.5 }) }).some((i) => i.level === 'error' && codigo(i) === 'dcac'), false) // justo 1,5: no es error
})

test('dc-max: supera la potencia DC máxima (error) o la recomendada de la ficha si no hay dato propio (aviso)', () => {
  assert.ok(tiene(revisar([], { inv: inversor({ potencia_dc_max_kw: 6 }) }), 'error', 'dc-max'))
  assert.equal(tiene(revisar([], { inv: inversor({ potencia_dc_max_kw: 7.2 }) }), 'error', 'dc-max'), false)
  assert.ok(tiene(revisar([], { inv: inversor({ 'x:Potencia FV máx. recomendada (Wp)': 6000 }) }), 'warn', 'dc-max'))
  // Con dato propio, la recomendada ya no cuenta
  const conAmbos = revisar([], { inv: inversor({ potencia_dc_max_kw: 8, 'x:Potencia FV máx. recomendada (Wp)': 6000 }) })
  assert.equal(conAmbos.some((i) => codigo(i) === 'dc-max'), false)
})

test('micro-cantidad: microinversor u optimizador con menos unidades que ceil(nº de paneles ÷ paneles por unidad) (error)', () => {
  const micro = producto('mi1', 'inversores', { tipo: 'Microinversor', paneles_por_unidad: 2 }, { brand: 'ENPHASE' })
  assert.ok(tiene(revisar([extra(micro, 5)], { sinInversor: true }), 'error', 'micro-cantidad'))
  assert.equal(tiene(revisar([extra(micro, 6)], { sinInversor: true }), 'error', 'micro-cantidad'), false)
})

test('optimizador-marca: optimizadores con un inversor de otra marca (error que oculta)', () => {
  const opt = producto('o1', 'inversores', { tipo: 'Optimizador', paneles_por_unidad: 1 }, { brand: 'SOLAREDGE' })
  const i = buscar(revisar([extra(opt, 12)]), 'error', 'optimizador-marca')
  assert.ok(i)
  assert.equal(i.hard, true)
  const mismaMarca = producto('o2', 'inversores', { tipo: 'Optimizador', paneles_por_unidad: 1 }, { brand: 'HUAWEI' })
  assert.equal(tiene(revisar([extra(mismaMarca, 12)]), 'error', 'optimizador-marca'), false)
})

test('suministro: inversor trifásico con suministro monofásico (error que oculta)', () => {
  const i = buscar(revisar([], { opciones: { survey: { supply: 'monofasico' } } }), 'error', 'suministro')
  assert.ok(i)
  assert.equal(i.hard, true)
  assert.equal(tiene(revisar([], { opciones: { survey: { supply: 'trifasico' } } }), 'error', 'suministro'), false)
})

test('mono-5kw: inversor monofásico de más de 5 kW (aviso)', () => {
  const mono = inversor({ fases: 'Monofásico', potencia_kw: 8 })
  const i = buscar(revisar([], { inv: mono }), 'warn', 'mono-5kw')
  assert.ok(i)
  assert.equal(i.hard, false)
  assert.equal(tiene(revisar([], { inv: inversor({ fases: 'Monofásico', potencia_kw: 5 }) }), 'warn', 'mono-5kw'), false)
})

test('medidor-fases: medidor de distinta fase que el inversor (error que oculta)', () => {
  const medidor = producto('c1', 'contadores', { fases: 'Monofásico' })
  const i = buscar(revisar([extra(medidor)]), 'error', 'medidor-fases')
  assert.ok(i)
  assert.equal(i.hard, true)
  assert.equal(tiene(revisar([extra(producto('c2', 'contadores', { fases: 'Trifásico' }))]), 'error', 'medidor-fases'), false)
})

test('medidor-suministro: medidor trifásico con suministro monofásico (aviso)', () => {
  const medidor = producto('c1', 'contadores', { fases: 'Trifásico' })
  assert.ok(tiene(revisar([extra(medidor)], { opciones: { survey: { supply: 'monofasico' } } }), 'warn', 'medidor-suministro'))
})

test('medidor-cantidad: más de un medidor (suma de unidades)', () => {
  const medidor = producto('c1', 'contadores', { fases: 'Trifásico' })
  assert.ok(tiene(revisar([extra(medidor, 2)]), 'warn', 'medidor-cantidad'))
  assert.equal(tiene(revisar([extra(medidor, 1)]), 'warn', 'medidor-cantidad'), false)
})

test('marca-comunicacion: medidor o monitorización de otra marca de inversores que no nombra al inversor (aviso)', () => {
  const sma = producto('i-sma', 'inversores', {}, { brand: 'SMA' }) // solo está en el catálogo: hace que SMA sea «marca de inversores»
  const monitor = producto('mo1', 'monitorizacion', {}, { brand: 'SMA' })
  assert.ok(tiene(revisar([extra(monitor)], { catalogoExtra: [sma] }), 'warn', 'marca-comunicacion'))
  const compatible = producto('mo2', 'monitorizacion', { compatible: 'Huawei, Fronius' }, { brand: 'SMA' })
  assert.equal(tiene(revisar([extra(compatible)], { catalogoExtra: [sma] }), 'warn', 'marca-comunicacion'), false)
  // Una marca que no es de inversores (p. ej. Shelly) no avisa
  const shelly = producto('mo3', 'monitorizacion', {}, { brand: 'SHELLY' })
  assert.equal(tiene(revisar([extra(shelly)], { catalogoExtra: [sma] }), 'warn', 'marca-comunicacion'), false)
})

test('futuro-bateria: se prevén baterías, no hay baterías elegidas y el inversor no es híbrido (aviso)', () => {
  const opciones = { survey: { futureBattery: true } }
  assert.ok(tiene(revisar([], { opciones }), 'warn', 'futuro-bateria'))
  assert.equal(tiene(revisar([], { opciones, inv: inversor({ hibrido: 'Sí' }) }), 'warn', 'futuro-bateria'), false)
  assert.equal(tiene(revisar([], { opciones, inv: inversor({ tipo: 'Híbrido' }) }), 'warn', 'futuro-bateria'), false)
  const bateria = producto('b1', 'baterias', { compatible: 'Huawei', componente: 'Módulo' }, { brand: 'HUAWEI' })
  assert.equal(tiene(revisar([extra(bateria)], { opciones }), 'warn', 'futuro-bateria'), false)
})

// ---------------------------------------------------------------------------------------- 4 · Baterías

const BATERIA = producto('b1', 'baterias', { compatible: 'Huawei', componente: 'Módulo', tension: 'Alta', capacidad_kwh: 5 }, { brand: 'HUAWEI' })
const bateria = (attrs, extraItem = {}) => ({ ...BATERIA, attrs: { ...BATERIA.attrs, ...attrs }, ...extraItem })

test('bateria: marca o protocolo que no coincide con el inversor (error que oculta)', () => {
  const ajena = bateria({ compatible: 'Sungrow' }, { id: 'b2', brand: 'PYLONTECH' })
  const i = buscar(revisar([extra(ajena)]), 'error', 'bateria')
  assert.ok(i)
  assert.equal(i.hard, true)
  assert.equal(tiene(revisar([extra(BATERIA)]), 'error', 'bateria'), false)
  // Sin dato de compatibilidad no se acusa a la batería
  const sinDato = { ...ajena, attrs: { componente: 'Módulo' } }
  assert.equal(tiene(revisar([extra(sinDato)]), 'error', 'bateria'), false)
})

test('bateria: el inversor no admite baterías', () => {
  const i = buscar(revisar([extra(BATERIA)], { inv: inversor({ bateria_tension: '—' }) }), 'error', 'bateria')
  assert.ok(i)
  assert.match(i.message, /no admite baterías/)
})

test('bateria: la serie del inversor no está en las que admite la batería', () => {
  const serie = bateria({ compatible: 'Huawei SUN2000 L1, M1' })
  const i = buscar(revisar([extra(serie)], { inv: inversor({}, { model: 'SUN2000-10KTL-M2' }) }), 'error', 'bateria')
  assert.ok(i)
  assert.match(i.message, /series L1, M1/)
  assert.equal(tiene(revisar([extra(serie)], { inv: inversor({}, { model: 'SUN2000-5KTL-L1' }) }), 'error', 'bateria'), false)
})

test('bateria: la tensión (alta/baja) no coincide con la que admite el inversor', () => {
  const i = buscar(revisar([extra(BATERIA)], { inv: inversor({ bateria_tension: 'Baja' }) }), 'error', 'bateria')
  assert.ok(i)
  assert.match(i.message, /tensión baja/)
  assert.equal(tiene(revisar([extra(BATERIA)], { inv: inversor({ bateria_tension: 'Ambas' }) }), 'error', 'bateria'), false)
})

test('baterias-mezcla: más de un modelo de módulo de batería (aviso)', () => {
  const otra = bateria({}, { id: 'b9', model: 'B9' })
  assert.ok(tiene(revisar([extra(BATERIA), extra(otra)]), 'warn', 'baterias-mezcla'))
  assert.equal(tiene(revisar([extra(BATERIA, 2)]), 'warn', 'baterias-mezcla'), false)
})

test('bateria-controlador: módulo de batería sin su controlador, si existe uno de esa marca en el inventario (aviso)', () => {
  const controlador = producto('ct1', 'baterias', { componente: 'Controlador' }, { brand: 'HUAWEI' })
  assert.ok(tiene(revisar([extra(BATERIA)], { catalogoExtra: [controlador] }), 'warn', 'bateria-controlador'))
  assert.equal(tiene(revisar([extra(BATERIA), extra(controlador)], { catalogoExtra: [] }), 'warn', 'bateria-controlador'), false)
  assert.equal(tiene(revisar([extra(BATERIA)]), 'warn', 'bateria-controlador'), false, 'sin controlador en el inventario no avisa')
})

test('bateria-modulos: más módulos de los que admite el controlador (error)', () => {
  const controlador = producto('ct1', 'baterias', { componente: 'Controlador', modulos_max: 2 }, { brand: 'HUAWEI' })
  assert.ok(tiene(revisar([extra(BATERIA, 3), extra(controlador, 1)]), 'error', 'bateria-modulos'))
  assert.equal(tiene(revisar([extra(BATERIA, 2), extra(controlador, 1)]), 'error', 'bateria-modulos'), false)
  assert.equal(tiene(revisar([extra(BATERIA, 4), extra(controlador, 2)]), 'error', 'bateria-modulos'), false) // el máximo se multiplica por los controladores
})

test('bateria-kwh: más kWh de baterías de los que admite el inversor (error)', () => {
  assert.ok(tiene(revisar([extra(BATERIA, 3)], { inv: inversor({ bat_kwh_max: 10 }) }), 'error', 'bateria-kwh')) // 15 > 10
  assert.equal(tiene(revisar([extra(BATERIA, 2)], { inv: inversor({ bat_kwh_max: 10 }) }), 'error', 'bateria-kwh'), false)
})

// ------------------------------------------------------------------------------------ 5 · Cableado CC

const cable = (tipo, color, seccion, id) => producto(id, 'cableado', { tipo, color, seccion_mm2: seccion })

test('cable-polaridad: falta una polaridad o no coinciden los metros (aviso)', () => {
  assert.ok(tiene(revisar([extra(cable('CC', 'Rojo', 6, 'cr'), 100)]), 'warn', 'cable-polaridad'))
  assert.ok(tiene(revisar([extra(cable('CC', 'Rojo', 6, 'cr'), 100), extra(cable('CC', 'Negro', 6, 'cn'), 50)]), 'warn', 'cable-polaridad'))
  assert.equal(tiene(revisar([extra(cable('CC', 'Rojo', 6, 'cr'), 100), extra(cable('CC', 'Negro', 6, 'cn'), 100)]), 'warn', 'cable-polaridad'), false)
})

test('cable-metros: metros menores que los previstos por polaridad en el paso 1 (aviso)', () => {
  const rojo = extra(cable('CC', 'Rojo', 6, 'cr'), 50)
  const negro = extra(cable('CC', 'Negro', 6, 'cn'), 50)
  assert.ok(tiene(revisar([rojo, negro], { opciones: { survey: { cableMeters: 100 } } }), 'warn', 'cable-metros'))
  assert.equal(tiene(revisar([rojo, negro], { opciones: { survey: { cableMeters: 50 } } }), 'warn', 'cable-metros'), false)
})

test('cable-dc-seccion: la sección no aguanta 1,25 × Isc (recomendación: no oculta ni bloquea)', () => {
  const potente = panel({ isc_a: 25 }) // 31,25 A > 30 A (2,5 mm²)
  const i = buscar(revisar([extra(cable('CC', 'Rojo', 2.5, 'cr'), 100), extra(cable('CC', 'Negro', 2.5, 'cn'), 100)], { panelo: potente }), 'warn', 'cable-dc-seccion')
  assert.ok(i)
  assert.equal(i.hard, false)
  assert.match(i.message, /^Recomendación/)
  assert.equal(tiene(revisar([extra(cable('CC', 'Rojo', 2.5, 'cr'), 100), extra(cable('CC', 'Negro', 2.5, 'cn'), 100)], { panelo: potente }), 'error', 'cable-dc-seccion'), false)
})

test('tabla de intensidad admisible del cable de continua: cada sección aguanta justo su intensidad', () => {
  const tabla = [[2.5, 30], [4, 44], [6, 57], [10, 79], [16, 107], [25, 142], [35, 175]]
  for (const [seccion, amperios] of tabla) {
    const justo = panel({ isc_a: amperios / 1.25 })
    const pasa = revisar([extra(cable('CC', 'Rojo', seccion, 'cr'), 10), extra(cable('CC', 'Negro', seccion, 'cn'), 10)], { panelo: justo })
    assert.equal(tiene(pasa, 'warn', 'cable-dc-seccion'), false, `${seccion} mm² debe aguantar ${amperios} A`)
    const se_pasa = panel({ isc_a: amperios / 1.25 + 0.1 })
    const falla = revisar([extra(cable('CC', 'Rojo', seccion, 'cr'), 10), extra(cable('CC', 'Negro', seccion, 'cn'), 10)], { panelo: se_pasa })
    assert.ok(tiene(falla, 'warn', 'cable-dc-seccion'), `${seccion} mm² no debe aguantar más de ${amperios} A`)
  }
})

// -------------------------------------------------------------------------------------- 6 · Protecciones CC

const protCC = (elemento, attrs, id) => producto(id, 'protecciones', { tipo: 'CC', elemento, ...attrs })

test('prot-tension: fusible, seccionador o DPS con tensión menor que Voc × paneles por string × 1,12 (error que oculta)', () => {
  // Voc 50 × 12 paneles × 1,12 = 672 V
  for (const elemento of ['Fusible', 'Seccionador', 'DPS']) {
    const i = buscar(revisar([extra(protCC(elemento, { tension_v: 600 }, 'pc-' + elemento))]), 'error', 'prot-tension')
    assert.ok(i, elemento)
    assert.equal(i.hard, true)
  }
  assert.equal(tiene(revisar([extra(protCC('Fusible', { tension_v: 1000 }, 'pc1'))]), 'error', 'prot-tension'), false)
  assert.equal(tiene(revisar([extra(protCC('Cuadro', { tension_v: 100 }, 'pc2'))]), 'error', 'prot-tension'), false, 'otros elementos no se miden por tensión')
})

test('prot-corriente: fusible o seccionador por debajo de 1,25 × Isc (error que oculta)', () => {
  // Isc 13 × 1,25 = 16,25 A
  const i = buscar(revisar([extra(protCC('Fusible', { corriente_a: 10 }, 'pc1'))]), 'error', 'prot-corriente')
  assert.ok(i)
  assert.equal(i.hard, true)
  assert.ok(tiene(revisar([extra(protCC('Seccionador', { corriente_a: 16 }, 'pc2'))]), 'error', 'prot-corriente'))
  assert.equal(tiene(revisar([extra(protCC('Seccionador', { corriente_a: 16.25 }, 'pc3'))]), 'error', 'prot-corriente'), false)
})

test('prot-corriente: fusible fuera de 1,5 a 2,4 × Isc, siempre que supere 1,25 × Isc (aviso)', () => {
  assert.ok(tiene(revisar([extra(protCC('Fusible', { corriente_a: 17 }, 'pc1'))]), 'warn', 'prot-corriente')) // 17 < 19,5
  assert.ok(tiene(revisar([extra(protCC('Fusible', { corriente_a: 32 }, 'pc2'))]), 'warn', 'prot-corriente')) // 32 > 31,2
  assert.equal(tiene(revisar([extra(protCC('Fusible', { corriente_a: 25 }, 'pc3'))]), 'warn', 'prot-corriente'), false)
  assert.equal(tiene(revisar([extra(protCC('Seccionador', { corriente_a: 40 }, 'pc4'))]), 'warn', 'prot-corriente'), false, 'el seccionador no tiene tope')
})

// ----------------------------------------------------------------------------------------- 7 · Alterna

test('cable-ac-metros: metros de cable de alterna menores que los previstos (aviso)', () => {
  const ac = extra(cable('AC', '', 10, 'ca'), 20)
  assert.ok(tiene(revisar([ac], { opciones: { survey: { acMeters: 50 } } }), 'warn', 'cable-ac-metros'))
  assert.equal(tiene(revisar([ac], { opciones: { survey: { acMeters: 20 } } }), 'warn', 'cable-ac-metros'), false)
})

test('cable-ac-seccion: la sección no aguanta 1,25 × la corriente del inversor (recomendación: no oculta ni bloquea)', () => {
  // 10 kW trifásico: 10000 ÷ (√3 × 400) = 14,43 A; × 1,25 = 18,04 A > 15 A (1,5 mm²)
  const i = buscar(revisar([extra(cable('AC', '', 1.5, 'ca'), 20)]), 'warn', 'cable-ac-seccion')
  assert.ok(i)
  assert.equal(i.hard, false)
  assert.match(i.message, /^Recomendación/)
  assert.equal(tiene(revisar([extra(cable('AC', '', 1.5, 'ca'), 20)]), 'error', 'cable-ac-seccion'), false)
  assert.equal(tiene(revisar([extra(cable('AC', '', 2.5, 'ca'), 20)]), 'warn', 'cable-ac-seccion'), false)
})

test('cable-ac-seccion: con varios inversores también avisa por cada inversor, no solo por el total', () => {
  const salida = { 'x:Corriente máx. de salida (A)': 40 }
  // 3 inversores de 40 A: 50 A con margen cada uno (> 36 A de 6 mm²) y 150 A en total
  const issues = revisar([extra(cable('AC', '', 6, 'ca'), 20), extra(inversor(salida, { id: 'inv-2' }), 2)], { inv: inversor(salida) })
  const avisos = issues.filter((i) => i.level === 'warn' && codigo(i) === 'cable-ac-seccion')
  assert.ok(avisos.some((i) => /en total/.test(i.message)), 'por la instalación')
  const porInversor = avisos.filter((i) => /cada /.test(i.message))
  assert.ok(porInversor.length > 0, 'por inversor')
  assert.ok(porInversor.every((i) => i.lineIds.length === 2), 'marca el cable y el inversor')
  // Con un solo inversor no se repite el mismo aviso
  const uno = revisar([extra(cable('AC', '', 6, 'ca'), 20)], { inv: inversor({ 'x:Corriente máx. de salida (A)': 40 }) })
  assert.equal(uno.filter((i) => codigo(i) === 'cable-ac-seccion').length, 1)
})

test('tabla de intensidad admisible del cable de alterna: cada sección aguanta justo su intensidad', () => {
  const tabla = [[1.5, 15], [2.5, 21], [4, 27], [6, 36], [10, 50], [16, 66], [25, 84], [35, 104], [50, 125], [70, 160], [95, 194]]
  for (const [seccion, amperios] of tabla) {
    const salida = (a) => inversor({ 'x:Corriente máx. de salida (A)': a })
    const pasa = revisar([extra(cable('AC', '', seccion, 'ca'), 10)], { inv: salida(amperios / 1.25) })
    assert.equal(tiene(pasa, 'warn', 'cable-ac-seccion'), false, `${seccion} mm² debe aguantar ${amperios} A`)
    const falla = revisar([extra(cable('AC', '', seccion, 'ca'), 10)], { inv: salida(amperios / 1.25 + 0.1) })
    assert.ok(tiene(falla, 'warn', 'cable-ac-seccion'), `${seccion} mm² no debe aguantar más de ${amperios} A`)
  }
})

const protAC = (elemento, attrs, id) => producto(id, 'protecciones', { tipo: 'AC', elemento, ...attrs })

test('ac-calibre: magnetotérmico por debajo de la corriente del inversor (error) o sin margen del 25 % (aviso)', () => {
  // Corriente del inversor 14,43 A; con margen 18,04 A
  const error = buscar(revisar([extra(protAC('Magnetotérmico', { corriente_a: 10 }, 'mg1'))]), 'error', 'ac-calibre')
  assert.ok(error)
  assert.equal(error.hard, true)
  const aviso = buscar(revisar([extra(protAC('Magnetotérmico', { corriente_a: 16 }, 'mg2'))]), 'warn', 'ac-calibre')
  assert.ok(aviso)
  assert.equal(aviso.hard, false)
  assert.equal(revisar([extra(protAC('Magnetotérmico', { corriente_a: 20 }, 'mg3'))]).some((i) => codigo(i) === 'ac-calibre'), false)
})

test('la corriente del inversor sale de la ficha si el inventario la tiene (x:Corriente máx. de salida)', () => {
  const inv = inversor({ 'x:Corriente máx. de salida (A)': 20 })
  assert.ok(tiene(revisar([extra(protAC('Magnetotérmico', { corriente_a: 16 }, 'mg1'))], { inv }), 'error', 'ac-calibre'))
  assert.equal(revisar([extra(protAC('Magnetotérmico', { corriente_a: 25 }, 'mg2'))], { inv }).some((i) => codigo(i) === 'ac-calibre'), false)
})

test('ac-polos: trifásica con menos de 3 polos o monofásica con menos de 2 (error que oculta); monofásica con más de 2 (aviso)', () => {
  const tri = buscar(revisar([extra(protAC('Magnetotérmico', { corriente_a: 20, polos: 2 }, 'mg1'))]), 'error', 'ac-polos')
  assert.ok(tri)
  assert.equal(tri.hard, true)
  assert.equal(tiene(revisar([extra(protAC('Magnetotérmico', { corriente_a: 20, polos: 4 }, 'mg2'))]), 'error', 'ac-polos'), false)
  const mono = inversor({ fases: 'Monofásico', potencia_kw: 5 })
  assert.ok(tiene(revisar([extra(protAC('Magnetotérmico', { corriente_a: 40, polos: 1 }, 'mg3'))], { inv: mono }), 'error', 'ac-polos'))
  const sobra = buscar(revisar([extra(protAC('Magnetotérmico', { corriente_a: 40, polos: 4 }, 'mg4'))], { inv: mono }), 'warn', 'ac-polos')
  assert.ok(sobra)
  assert.equal(sobra.hard, false)
})

test('ac-polos: sin inversor se usa el suministro del cliente para saber las fases', () => {
  const mg = protAC('Magnetotérmico', { corriente_a: 40, polos: 2 }, 'mg1')
  const issues = revisar([extra(mg)], { sinInversor: true, opciones: { survey: { supply: 'trifasico' } } })
  assert.ok(tiene(issues, 'error', 'ac-polos'))
})

test('ac-diferencial: diferencial de más de 30 mA (aviso)', () => {
  assert.ok(tiene(revisar([extra(protAC('Diferencial', { sensibilidad_ma: 300 }, 'df1'))]), 'warn', 'ac-diferencial'))
  assert.equal(tiene(revisar([extra(protAC('Diferencial', { sensibilidad_ma: 30 }, 'df2'))]), 'warn', 'ac-diferencial'), false)
})

// ------------------------------------------------------------------------------------------- 8 · Tierra

test('tierra-seccion: cable de tierra de menos de 6 mm² (aviso)', () => {
  const tierra = (s, id) => producto(id, 'tierra', { componente: 'Cable', seccion_mm2: s })
  assert.ok(tiene(revisar([extra(tierra(4, 't1'))]), 'warn', 'tierra-seccion'))
  assert.equal(tiene(revisar([extra(tierra(6, 't2'))]), 'warn', 'tierra-seccion'), false)
  const pica = producto('t3', 'tierra', { componente: 'Pica', seccion_mm2: 2 })
  assert.equal(tiene(revisar([extra(pica)]), 'warn', 'tierra-seccion'), false, 'solo se mide el cable')
})

test('Auxiliar, Trámites y Obra no tienen reglas de compatibilidad', () => {
  const otros = [producto('a1', 'auxiliar', { componente: 'Bridas' }), producto('l1', 'logistica', { tipo: 'Envío' }), producto('pr1', 'proyecto', { tramite: 'Legalización' }), producto('ad1', 'administrativos', { tipo: 'Gestión' })]
  assert.deepEqual(claves(revisar(otros.map((o) => extra(o, 99)))), [])
})

// ----------------------------------------------------------------------- cuáles ocultan (columna «¿Oculta?»)

test('solo las 10 reglas de incompatibilidad de fondo ocultan el producto; el resto no, aunque sea error (los cables solo recomiendan)', () => {
  const OCULTAN = ['strings-imposible', 'optimizador-marca', 'medidor-fases', 'suministro', 'bateria', 'estructura-marco',
    'prot-tension', 'prot-corriente', 'ac-calibre', 'ac-polos']
  assert.equal(OCULTAN.length, 10, 'las reglas de fondo que ocultan son 10: los cables recomiendan, no ocultan')
  const potente = panel({ isc_a: 25 })
  const escenarios = [
    revisar([], { inv: inversor({ mppt_min_v: 600, vmax_v: 700 }) }),
    revisar([extra(producto('o1', 'inversores', { tipo: 'Optimizador', paneles_por_unidad: 1 }, { brand: 'SOLAREDGE' }), 12)]),
    revisar([extra(producto('c1', 'contadores', { fases: 'Monofásico' }))]),
    revisar([], { opciones: { survey: { supply: 'monofasico' } } }),
    revisar([extra(BATERIA)], { inv: inversor({ bateria_tension: '—' }) }),
    revisar([extra(estructura({ grosor_min_mm: 35 }))]),
    revisar([extra(protCC('Fusible', { tension_v: 600 }, 'pc1'))]),
    revisar([extra(protCC('Fusible', { corriente_a: 10 }, 'pc2'))]),
    revisar([extra(protAC('Magnetotérmico', { corriente_a: 10 }, 'mg1'))]),
    revisar([extra(protAC('Magnetotérmico', { corriente_a: 20, polos: 2 }, 'mg2'))])
  ]
  const vistas = new Set()
  for (const issues of escenarios) {
    for (const i of issues.filter((x) => x.level === 'error')) {
      if (OCULTAN.includes(codigo(i))) {
        assert.equal(i.hard, true, codigo(i))
        vistas.add(codigo(i))
      }
    }
  }
  assert.deepEqual([...vistas].sort(), [...OCULTAN].sort())
  // Un error de cantidad no oculta, y un aviso nunca oculta
  const cantidad = revisar([extra(estructura({ modulos_por_kit: 3 }), 3)]).find((i) => codigo(i) === 'estructura-kits')
  assert.equal(cantidad.hard, false)
  for (const i of escenarios.flat().filter((x) => x.level === 'warn')) assert.equal(i.hard, false, codigo(i))
})

test('hardConflicts: lo que oculta un candidato en un paso es el motivo de fondo que saldría al añadirlo', () => {
  const contexto = estado([linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1)])
  const monofasico = producto('c9', 'contadores', { fases: 'Monofásico' })
  const motivos = hardConflicts(monofasico, contexto, catalogo([PANEL, INVERSOR, monofasico]))
  assert.equal(motivos.length, 1)
  assert.match(motivos[0], /monofásico/)
  const bueno = producto('c10', 'contadores', { fases: 'Trifásico' })
  assert.deepEqual(hardConflicts(bueno, contexto, catalogo([PANEL, INVERSOR, bueno])), [])
})

test('issuesByLine: cada aviso se enseña en las filas afectadas', () => {
  const issues = revisar([extra(producto('c1', 'contadores', { fases: 'Monofásico' }))])
  const porFila = issuesByLine(issues)
  assert.ok((porFila.get('l-c1') ?? []).length > 0)
})

// ------------------------------------------------------------------------------------- Criterios de «Sugeridos»

const contextoInversor = () => estado([linea(PANEL, 12, { auto: true })]) // 7,2 kWp
const invCand = (id, kw, extraItem = {}) => producto(id, 'inversores', {
  tipo: 'String', potencia_kw: kw, fases: 'Trifásico', mppt_min_v: 200, mppt_max_v: 800, vmax_v: 1000, imax_mppt_a: 25, n_mppt: 2
}, { brand: 'HUAWEI', ...extraItem })

test('Sugeridos · inversores: confirman el encaje los strings iguales y la relación paneles/inversor entre 0,9 y 1,3', () => {
  const razones = fitReasons(invCand('c1', 6), contextoInversor(), catalogo([PANEL]))
  assert.ok(razones.some((r) => /12 paneles en/.test(r)))
  assert.ok(razones.some((r) => /relación paneles\/inversor de 1,2/.test(r)))
  assert.equal(fitReasons(invCand('c2', 10), contextoInversor(), catalogo([PANEL])).some((r) => /relación/.test(r)), false) // 0,72
})

test('Sugeridos · inversores: fases del suministro, misma marca que el medidor y híbrido si se prevén baterías', () => {
  const medidor = producto('c1', 'contadores', {}, { brand: 'HUAWEI' })
  const ctx = estado([linea(PANEL, 12, { auto: true }), linea(medidor, 1)], { survey: { supply: 'trifasico', futureBattery: true } })
  const razones = fitReasons(invCand('c1', 6, { attrs: { ...invCand('c1', 6).attrs, hibrido: 'Sí' } }), ctx, catalogo([PANEL, medidor]))
  assert.ok(razones.some((r) => /fases del suministro \(trifásico\)/.test(r)))
  assert.ok(razones.some((r) => /misma marca que HUAWEI/.test(r)))
  assert.ok(razones.some((r) => /híbrido, listo para baterías/.test(r)))
})

test('Sugeridos · un producto sin datos que confirmen el encaje no se sugiere, aunque no tenga avisos', () => {
  const vacio = producto('v1', 'contadores', {}, { brand: 'X' })
  assert.deepEqual(fitReasons(vacio, contextoInversor(), catalogo([PANEL])), [])
  assert.deepEqual(suggestions([vacio], contextoInversor(), catalogo([PANEL])), [])
})

test('Sugeridos · COMPORTAMIENTO ORIGINAL a revisar: un inversor sin ningún dato eléctrico recibe la razón «strings iguales»', () => {
  // Sin los límites de tensión del inversor no se puede saber si los strings valen, y aun así el reparto automático los da por buenos.
  // Se mantiene igual que en el Planificador actual (migración sin cambios de comportamiento); se anota como diferencia a decidir.
  const vacio = producto('v1', 'inversores', {}, { brand: 'X' })
  assert.deepEqual(fitReasons(vacio, contextoInversor(), catalogo([PANEL])), ['12 paneles en 1 string de 12'])
})

test('Sugeridos · exclusiones, orden (stock, razones, precio) y límite de 4', () => {
  const ctx = contextoInversor()
  const candidatos = [
    invCand('barato-sin-stock', 6, { unit_price: 300 }),
    invCand('caro-sin-stock', 6, { unit_price: 900 }),
    invCand('con-stock-caro', 6, { unit_price: 800, stock: 2 }),
    invCand('con-stock-barato', 6, { unit_price: 500, stock: 1 }),
    invCand('quinto', 6, { unit_price: 1000 }),
    invCand('de-prueba', 6, { sample: true }),
    invCand('sin-precio', 6, { unit_price: 0 }),
    invCand('con-aviso', 4) // 7,2 / 4 = 1,8: error de dcac
  ]
  const sugeridos = suggestions(candidatos, ctx, catalogo([PANEL])).map((s) => s.item.id)
  assert.deepEqual(sugeridos, ['con-stock-barato', 'con-stock-caro', 'barato-sin-stock', 'caro-sin-stock'])
  assert.equal(sugeridos.length, 4, 'hasta 4 por sección')
  assert.equal(sugeridos.includes('de-prueba'), false)
  assert.equal(sugeridos.includes('sin-precio'), false)
  assert.equal(sugeridos.includes('con-aviso'), false)
  assert.equal(suggestions(candidatos, ctx, catalogo([PANEL]), 2).length, 2)
  assert.equal(suggestions(candidatos, ctx, catalogo([PANEL])).find((s) => s.item.id === 'con-stock-barato').inStock, true)
})

test('Sugeridos · baterías: compatibles con el inversor y con la tensión que admite', () => {
  const ctx = estado([linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1)])
  const razones = fitReasons(BATERIA, ctx, catalogo([PANEL, INVERSOR]))
  assert.ok(razones.some((r) => /compatible con HUAWEI SUN2000-10K/.test(r)))
})

test('Sugeridos · medidores y monitorización: misma marca y mismas fases que el inversor', () => {
  const ctx = estado([linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1)])
  const medidor = producto('c1', 'contadores', { fases: 'Trifásico' }, { brand: 'HUAWEI' })
  const razones = fitReasons(medidor, ctx, catalogo([PANEL, INVERSOR]))
  assert.ok(razones.some((r) => /misma marca/.test(r)))
  assert.ok(razones.some((r) => /trifásico, como el inversor/.test(r)))
})

test('Sugeridos · estructura: cubierta elegida, kits exactos y marco admitido', () => {
  const ctx = estado([linea(PANEL, 12, { auto: true })])
  const razones = fitReasons(estructura({ cubierta: 'Teja', modulos_por_kit: 3, grosor_min_mm: 25, grosor_max_mm: 40 }), ctx, catalogo([PANEL]))
  assert.ok(razones.some((r) => /cubierta teja/.test(r)))
  assert.ok(razones.some((r) => /4 kits cubren exactamente los 12 paneles/.test(r)))
  assert.ok(razones.some((r) => /admite el marco de 30 mm/.test(r)))
})

test('Sugeridos · protecciones CC y AC, cableado y tierra', () => {
  const ctx = estado([linea(PANEL, 12, { auto: true }), linea(INVERSOR, 1)])
  const cat = catalogo([PANEL, INVERSOR])
  assert.ok(fitReasons(protCC('Fusible', { tension_v: 1000, corriente_a: 25 }, 'f1'), ctx, cat).some((r) => /soporta 1\.?000 V/.test(r)))
  assert.ok(fitReasons(protCC('Seccionador', { corriente_a: 20 }, 'f2'), ctx, cat).some((r) => /por encima de 1,25 × Isc/.test(r)))
  assert.ok(fitReasons(protAC('Magnetotérmico', { corriente_a: 20, polos: 4 }, 'f3'), ctx, cat).some((r) => /para 14,4 A del inversor/.test(r)))
  assert.ok(fitReasons(protAC('Magnetotérmico', { corriente_a: 20, polos: 4 }, 'f4'), ctx, cat).some((r) => /4 polos/.test(r)))
  assert.ok(fitReasons(cable('CC', 'Rojo', 6, 'f5'), ctx, cat).some((r) => /6 mm²: aguanta 57 A/.test(r)))
  assert.ok(fitReasons(cable('AC', '', 4, 'f6'), ctx, cat).some((r) => /aguanta 27 A/.test(r)))
  assert.ok(fitReasons(producto('f7', 'tierra', { componente: 'Cable', seccion_mm2: 16 }), ctx, cat).some((r) => /suficiente para la estructura/.test(r)))
})

test('splitMissing reparte lo que falta en los menos strings posibles y lo más iguales', () => {
    const limites = { min: 6, max: 19 };
    assert.deepEqual(splitMissing(24, limites), [12, 12]);
    assert.deepEqual(splitMissing(19, limites), [19]);
    assert.deepEqual(splitMissing(25, limites), [13, 12]);
    assert.equal(splitMissing(4, limites), null);
    assert.equal(splitMissing(0, limites), null);
});

test('strings fijados a mano: «repartir» no los toca y los demás se reparten lo que queda', () => {
  // 271 paneles en 15 strings con los dos últimos fijados en 12: los otros 13 llevan (271 − 24) ÷ 13 = 19
  const diseno = Array.from({ length: 15 }, (_, i) => ({ id: 's' + i, panels: i >= 13 ? 12 : 18, input: 0, ...(i >= 13 ? { fixed: true } : {}) }))
  const repartido = spreadPanels(diseno, 271)
  assert.deepEqual(repartido.map((s) => s.panels), [...Array(13).fill(19), 12, 12])
  assert.equal(fixedCount(repartido), 2, 'siguen fijados')
  // Con paneles que no se dividen, los que sobran van a los primeros sin fijar
  assert.deepEqual(spreadPanels(diseno, 272).map((s) => s.panels), [20, ...Array(12).fill(19), 12, 12])
  // Cambiar cuántos strings hay también respeta los fijados
  const mas = createStrings(16, diseno, 271, null)
  assert.equal(mas.length, 16)
  assert.equal(mas.reduce((sum, s) => sum + s.panels, 0), 271)
  assert.equal(mas[13].panels, 12)
  assert.equal(mas[14].panels, 12)
})

test('strings fijados: si no queda para el resto, se reparte por igual y se sueltan los fijados', () => {
  const diseno = [{ id: 'a', panels: 30, input: 0, fixed: true }, { id: 'b', panels: 5, input: 0 }, { id: 'c', panels: 5, input: 0 }]
  const r = spreadPanels(diseno, 31) // sobran 1 panel para dos strings
  assert.deepEqual(r.map((s) => s.panels), [11, 10, 10])
  assert.equal(fixedCount(r), 0)
  // Soltar los fijados los deja entrar de nuevo en el reparto
  assert.equal(fixedCount(releaseFixed([{ id: 'a', panels: 12, input: 0, fixed: true }])), 0)
})

test('strings fijados: el presupuesto guardado conserva la marca', () => {
  const guardado = parseCosts({ strings: [{ id: 'a', panels: 12, input: 1, fixed: true }, { id: 'b', panels: 19, input: 2 }] })
  assert.equal(guardado.strings[0].fixed, true)
  assert.equal('fixed' in guardado.strings[1], false)
})

test('strings fijados: se reparte el resto al momento solo si queda para los demás, y «por igual» empieza de nuevo', () => {
  const diseno = Array.from({ length: 15 }, (_, i) => ({ id: 's' + i, panels: 18, input: 0, ...(i >= 13 ? { fixed: true } : {}) }))
  assert.equal(canSpreadRest(diseno, 271), true)
  assert.equal(canSpreadRest(diseno.map((s) => ({ ...s, fixed: false })), 271), false, 'sin fijados no hay nada que repartir aparte')
  // Si lo escrito se lleva todo (p. ej. un «300» a medio teclear), no se reparte: los demás se quedan como están
  assert.equal(canSpreadRest([{ id: 'a', panels: 300, input: 0, fixed: true }, { id: 'b', panels: 5, input: 0 }], 271), false)
  // Volver a repartir por igual: se sueltan los fijados y todos quedan parejos
  const parejo = spreadPanels(releaseFixed(diseno), 271)
  assert.equal(fixedCount(parejo), 0)
  assert.equal(Math.max(...parejo.map((s) => s.panels)) - Math.min(...parejo.map((s) => s.panels)), 1)
})
