import test from 'node:test'
import assert from 'node:assert/strict'
import { valoresDe, cuantosPaneles, aplicarValores, problemasDe, cuerpoParaServidor, sincronizado, propuestaDelPresupuesto, conEmpresaDePropuesta } from '../../src/utils/planificador/datosPresupuesto.js'
import { EMPTY_COSTS, EMPTY_SURVEY, MAX_OBSERVACIONES_LINEA, parseCosts } from '../../src/utils/planificador/motor/costes.js'
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
    roofs: ['chapa'], supply: 'trifasico', futureBattery: true, cableMeters: 40, acMeters: 15, saleRatio: 1.2 }
  const r = aplicarValores(base, v)
  assert.equal(r.client, 'Pedro Ingaser')
  assert.equal(r.reference, 'Nave 2')
  assert.equal(r.moduleCount, 20)
  assert.equal(r.moduleWp, 500)
  assert.equal(r.saleRatio, 1.2)
  assert.deepEqual(r.lines, [{ id: 'l1' }])
  assert.equal(r.order, 'fijo')
  assert.deepEqual(r.survey, { ...base.survey, roof: 'chapa', roofs: ['chapa'], supply: 'trifasico', targetKwp: 10, futureBattery: true, cableMeters: 40, acMeters: 15 })
})

test('sin cliente se conserva el nombre que ya tenía el presupuesto', () => {
  const base = { ...vacio(), client: 'Antiguo SL' }
  assert.equal(aplicarValores(base, { ...valoresDe(base), customer: null }).client, 'Antiguo SL')
})

test('problemas para crear: cliente, nombre del proyecto, CIF, potencia a instalar, potencia del panel y al menos un panel', () => {
  const v = valoresDe(vacio())
  const empresa = { cif: 'B12345678', clientLogo: 'data:image/png;base64,AAAA' }
  assert.deepEqual(problemasDe({ ...v, customer: null, reference: '', targetKwp: 0, moduleWp: 0 }, 0), [
    'Elige el cliente del presupuesto: uno existente o un cliente potencial nuevo.',
    'Escribe el nombre del proyecto (por ejemplo «Nave 2»): con el cliente identifica a qué proyecto pertenece el presupuesto.',
    'Escribe el CIF de la empresa del cliente: sale en la propuesta.',
    'Indica la potencia que se quiere instalar (kWp).',
    'Indica la potencia de cada panel (Wp).',
    'El presupuesto necesita al menos un panel.'
  ])
  assert.equal(problemasDe({ ...v, ...empresa, customer: potencial, reference: '   ', targetKwp: 10, moduleWp: 600 }, 17).length, 1, 'un nombre en blanco no vale')
  assert.deepEqual(problemasDe({ ...v, ...empresa, customer: potencial, reference: 'Nave 2', targetKwp: 10, moduleWp: 600 }, 17), [])
  // El CIF es obligatorio; el logo no (solo se exige al descargar la propuesta)
  assert.equal(problemasDe({ ...v, ...empresa, cif: '   ', customer: potencial, reference: 'Nave 2', targetKwp: 10, moduleWp: 600 }, 17).length, 1)
  assert.deepEqual(problemasDe({ ...v, ...empresa, clientLogo: '', customer: potencial, reference: 'Nave 2', targetKwp: 10, moduleWp: 600 }, 17), [])
})

test('el CIF y el logo de la empresa van y vuelven con el presupuesto, y el CIF pasa al cliente potencial que no lo tenga', () => {
  const base = vacio()
  const v = { ...valoresDe(base), customer: { kind: 'potencial', name: 'Acme', phone: '', email: '', cif: '' }, reference: 'Nave', cif: ' B12345678 ', clientLogo: 'data:image/png;base64,AAAA', targetKwp: 10, moduleWp: 500, manualPanels: false }
  const s = aplicarValores(base, v)
  assert.equal(s.cif, 'B12345678')
  assert.equal(s.clientLogo, 'data:image/png;base64,AAAA')
  assert.equal(s.customer.cif, 'B12345678')
  assert.equal(valoresDe(s).cif, 'B12345678')
  assert.equal(valoresDe(s).clientLogo, 'data:image/png;base64,AAAA')
})

test('el encaje de los paneles es opcional, va y vuelve con el presupuesto y el motor solo conserva una imagen válida', () => {
  const base = vacio()
  assert.equal(base.encaje, '')
  assert.equal(valoresDe(base).encaje, '')
  const v = { ...valoresDe(base), customer: potencial, reference: 'Nave', cif: 'B12345678', clientLogo: 'data:image/png;base64,AAAA', encaje: 'data:image/jpeg;base64,BBBB', targetKwp: 10, moduleWp: 500, manualPanels: false }
  assert.deepEqual(problemasDe(valoresDe(base), 1).filter((p) => /encaje/i.test(p)), [], 'sin encaje no falta nada')
  const s = aplicarValores(base, v)
  assert.equal(s.encaje, 'data:image/jpeg;base64,BBBB')
  assert.equal(valoresDe(s).encaje, 'data:image/jpeg;base64,BBBB')
  // Al cargar el presupuesto (parseCosts) el encaje no se pierde, y lo que no es una imagen se descarta
  assert.equal(parseCosts({ encaje: 'data:image/jpeg;base64,BBBB' }).encaje, 'data:image/jpeg;base64,BBBB')
  assert.equal(parseCosts({ encaje: '<script>alert(1)</script>' }).encaje, '')
  assert.equal(parseCosts({}).encaje, '')
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

test('las observaciones internas de un producto se conservan al leer el presupuesto, recortadas; sin texto no existen', () => {
  const base = { group: 'modulos', equipment: 'Panel', model: 'X', qty: 1, price: 10 }
  const leido = parseCosts({ lines: [
    { ...base, id: 'a', observaciones: '  Pedir a Juan  ' },
    { ...base, id: 'b', observaciones: '   ' },
    { ...base, id: 'c' },
    { ...base, id: 'd', observaciones: 'x'.repeat(MAX_OBSERVACIONES_LINEA + 50) }
  ] })
  const por = (id) => leido.lines.find((l) => l.id === id)
  assert.equal(por('a').observaciones, 'Pedir a Juan')
  assert.ok(!('observaciones' in por('b')), 'solo espacios = sin observaciones')
  assert.ok(!('observaciones' in por('c')), 'un producto sin ellas queda como antes (el presupuesto no cambia)')
  assert.equal(por('d').observaciones.length, MAX_OBSERVACIONES_LINEA)
  // No se confunden con la nota del producto del inventario
  assert.equal(parseCosts({ lines: [{ ...base, id: 'e', notes: 'Del inventario' }] }).lines[0].notes, 'Del inventario')
})

test('varias cubiertas: roofs manda, roof es la primera y un presupuesto anterior (solo roof) sigue valiendo', () => {
  assert.deepEqual(parseCosts({ survey: { roof: 'plana' } }).survey.roofs, ['plana'], 'solo roof: una cubierta')
  const varias = parseCosts({ survey: { roof: 'teja', roofs: ['plana', 'teja', 'plana', 'inventada'] } }).survey
  assert.deepEqual(varias.roofs, ['plana', 'teja'], 'sin repetidas ni desconocidas, en el orden dado')
  assert.equal(varias.roof, 'plana', 'roof = la primera (lo lee la propuesta del servidor)')
  assert.deepEqual(parseCosts({ survey: { roofs: [] } }).survey.roofs, ['teja'], 'sin ninguna, la de por defecto')
  assert.deepEqual(parseCosts({}).survey.roofs, ['teja'])
})

test('varias cubiertas en el formulario: se leen, se aplican y hace falta al menos una', () => {
  const base = { ...vacio(), survey: { ...EMPTY_SURVEY, roof: 'suelo', roofs: ['suelo', 'parking'] } }
  const v = valoresDe(base)
  assert.deepEqual(v.roofs, ['suelo', 'parking'])
  const r = aplicarValores(base, { ...v, roofs: ['plana', 'teja'] })
  assert.deepEqual(r.survey.roofs, ['plana', 'teja'])
  assert.equal(r.survey.roof, 'plana')
  assert.ok(problemasDe({ ...v, roofs: [] }, 12).some((p) => /cubierta/i.test(p)))
  assert.ok(!problemasDe(v, 12).some((p) => /cubierta/i.test(p)))
})

test('un presupuesto toma de su propuesta el CIF, el logo y el encaje que le faltan, sin pisar lo que ya tiene', () => {
  const base = { ...vacio(), client: 'Solaria', reference: 'Nave 2', customer: { kind: 'existente', id: 5, name: 'Solaria' }, cif: '', clientLogo: '', encaje: '' }
  const registros = [
    { id: 'p0', customer: { kind: 'existente', id: 6, name: 'Otro' }, project: 'Nave 2' },
    { id: 'p1', customer: { kind: 'existente', id: 5, name: 'Solaria', cif: 'B123' }, project: 'Nave 2' }
  ]
  assert.equal(propuestaDelPresupuesto(base, registros).id, 'p1')
  assert.equal(propuestaDelPresupuesto({ ...base, reference: 'Otra' }, registros), null)
  assert.equal(propuestaDelPresupuesto({ ...base, reference: '' }, registros), null)
  const propuesta = { customer: { cif: 'B123' }, logo: 'L', encaje: 'E' }
  const completo = conEmpresaDePropuesta(base, propuesta)
  assert.deepEqual([completo.cif, completo.clientLogo, completo.encaje], ['B123', 'L', 'E'])
  const propio = { ...base, cif: 'X1234', clientLogo: 'mio', encaje: 'mio' }
  assert.equal(conEmpresaDePropuesta(propio, propuesta), propio, 'lo que ya tiene no se pisa y no hay cambio')
  assert.equal(conEmpresaDePropuesta(base, null), base)
})

test('con la empresa de la propuesta, los parámetros no piden el CIF', () => {
  const v = { ...valoresDe(vacio()), customer: potencial, reference: 'Nave 2', targetKwp: 10, moduleWp: 600, cif: '' }
  assert.equal(problemasDe(v, 17).length, 1)
  assert.deepEqual(problemasDe(v, 17, { empresaDeLaPropuesta: true }), [])
})

test('cada cubierta guarda su disposición (coplanar o inclinada) y el reparto de paneles; con una sola no hay reparto', () => {
  const base = vacio()
  const v = { ...valoresDe(base), customer: potencial, reference: 'Nave', targetKwp: 12.3, moduleWp: 615, manualPanels: false }
  assert.deepEqual(v.roofLayouts, { teja: 'coplanar' })
  const dos = { ...v, roofs: ['teja', 'chapa_minionda'], roofLayouts: { teja: 'coplanar', chapa_minionda: 'inclinada' }, roofPanels: { teja: 12, chapa_minionda: 8 }, moduleCount: 20, manualPanels: true }
  const r = aplicarValores(base, dos)
  assert.deepEqual(r.survey.roofLayouts, { teja: 'coplanar', chapa_minionda: 'inclinada' })
  assert.deepEqual(r.survey.roofPanels, { teja: 12, chapa_minionda: 8 })
  assert.deepEqual(aplicarValores(base, v).survey.roofPanels, {})
  assert.deepEqual(parseCosts(JSON.parse(JSON.stringify(r))).survey.roofLayouts, { teja: 'coplanar', chapa_minionda: 'inclinada' })
})

test('con varias cubiertas el reparto tiene que sumar los paneles del presupuesto', () => {
  const v = { ...valoresDe(vacio()), customer: potencial, reference: 'Nave', targetKwp: 10, moduleWp: 500, roofs: ['teja', 'plana'] }
  assert.ok(problemasDe({ ...v, roofPanels: { teja: 12, plana: 6 } }, 20).some((p) => p.includes('Reparte los 20 paneles')))
  assert.ok(!problemasDe({ ...v, roofPanels: { teja: 12, plana: 8 } }, 20).some((p) => p.includes('Reparte')))
})
