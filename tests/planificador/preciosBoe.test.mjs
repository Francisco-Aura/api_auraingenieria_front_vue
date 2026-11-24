import test from 'node:test'
import assert from 'node:assert/strict'
import { borradorDe, celdasMalas, clave, cuerpoDe, faltas, fechaCorta, firma, leerNumero, nPeriodos, total, vigenteEn } from '../../src/utils/planificador/preciosBoe.js'

const TARIFAS = ['2.0TD', '3.0TD']
const fila = (boeId, tarifa, termino, concepto, v, referencia) => ({
  boeId, tarifa, termino, concepto, referencia,
  periodos: Array.from({ length: 6 }, (_, i) => (i < nPeriodos(tarifa, termino) ? v : null))
})
// Del más reciente al más antiguo, como los devuelve el servidor: dos BOE en 2025 y uno en 2027 (ninguno en 2026)
const datos = {
  boes: [
    { id: 3, nombre: 'Peajes y cargos 2027', vigenteDesde: '2027-01-01' },
    { id: 2, nombre: 'Cargos julio 2025', vigenteDesde: '2025-07-01' },
    { id: 1, nombre: 'Peajes y cargos 2025', vigenteDesde: '2025-01-01' }
  ],
  tarifas: TARIFAS,
  precios: [1, 2, 3].flatMap((id) => TARIFAS.flatMap((t) => ['energia', 'potencia'].flatMap((term) => [
    fila(id, t, term, 'peaje', Number((0.012 * id).toFixed(6)), 'BOE-A-P' + id),
    fila(id, t, term, 'cargo', Number((0.003 * id).toFixed(6)), 'BOE-A-C' + id)
  ])))
}

test('la 2.0TD tiene 3 periodos de energía y 2 de potencia; las demás, 6', () => {
  assert.equal(nPeriodos('2.0TD', 'energia'), 3)
  assert.equal(nPeriodos('2.0TD', 'potencia'), 2)
  assert.equal(nPeriodos('6.1TD', 'potencia'), 6)
})

test('un BOE guardado se edita con su nombre, su fecha, sus referencias y coma decimal; el total es peaje + cargo', () => {
  const b = borradorDe(datos, 2)
  assert.equal(b.guardado, true)
  assert.equal(b.id, 2)
  assert.equal(b.nombre, 'Cargos julio 2025')
  assert.equal(b.vigenteDesde, '2025-07-01')
  assert.deepEqual(b.refs, { peaje: 'BOE-A-P2', cargo: 'BOE-A-C2' })
  assert.deepEqual(b.celdas[clave('2.0TD', 'energia', 'peaje')], ['0,024', '0,024', '0,024'])
  assert.equal(total(b, '3.0TD', 'energia', 5), 0.03)
  assert.equal(celdasMalas(b).size, 0)
  assert.deepEqual(faltas(b), [])
})

test('un BOE nuevo parte de los precios de otro sin su nombre, fecha ni referencias, o vacío', () => {
  const copia = borradorDe(datos, null, 3)
  assert.equal(copia.guardado, false)
  assert.equal(copia.id, null)
  assert.equal(copia.nombre, '')
  assert.equal(copia.vigenteDesde, '')
  assert.deepEqual(copia.refs, { peaje: '', cargo: '' })
  assert.equal(copia.celdas[clave('3.0TD', 'potencia', 'cargo')][0], '0,009')
  const vacio = borradorDe(datos, null)
  assert.equal(vacio.celdas[clave('3.0TD', 'potencia', 'cargo')][0], '')
  assert.equal(celdasMalas(vacio).size, 2 * (3 + 2) + 2 * 2 * 6)
  assert.equal(total(vacio, '3.0TD', 'energia', 0), null)
  // Un id que no existe también es un BOE nuevo
  assert.equal(borradorDe(datos, 99).guardado, false)
})

test('para guardar hacen falta nombre y fecha', () => {
  const b = borradorDe(datos, null, 3)
  assert.deepEqual(faltas(b), ['Pon el nombre del BOE.', 'Pon la fecha desde la que vale.'])
  b.nombre = '  '
  b.vigenteDesde = '2027-02-30x'
  assert.equal(faltas(b).length, 2)
  b.nombre = 'Cargos 2028'
  b.vigenteDesde = '2028-04-01'
  assert.deepEqual(faltas(b), [])
})

test('se manda el nombre, la fecha y cada fila con sus periodos como números y la referencia de su concepto', () => {
  const b = borradorDe(datos, 1)
  const antes = firma(b)
  b.celdas[clave('3.0TD', 'energia', 'cargo')][1] = ' 0,5 '
  b.refs.cargo = ' BOE-A-NUEVO '
  b.nombre = ' Peajes y cargos 2025 revisados '
  assert.notEqual(firma(b), antes)
  const cuerpo = cuerpoDe(b)
  assert.equal(cuerpo.nombre, 'Peajes y cargos 2025 revisados')
  assert.equal(cuerpo.vigenteDesde, '2025-01-01')
  assert.equal(cuerpo.precios.length, 8)
  const f = cuerpo.precios.find((x) => x.tarifa === '3.0TD' && x.termino === 'energia' && x.concepto === 'cargo')
  assert.deepEqual(f.periodos, [0.003, 0.5, 0.003, 0.003, 0.003, 0.003])
  assert.equal(f.referencia, 'BOE-A-NUEVO')
  assert.equal(leerNumero('abc'), null)
  b.celdas[clave('3.0TD', 'energia', 'cargo')][2] = '-1'
  assert.ok(celdasMalas(b).has(clave('3.0TD', 'energia', 'cargo') + '|2'))
})

test('cambiar solo la fecha de un BOE también cuenta como cambio', () => {
  const b = borradorDe(datos, 1)
  const antes = firma(b)
  b.vigenteDesde = '2025-02-01'
  assert.notEqual(firma(b), antes)
})

test('el BOE vigente es el que empezó más recientemente, aunque haya varios en un año o años sin ninguno', () => {
  assert.equal(vigenteEn(datos.boes, '2026-06-15').id, 2, 'en 2026 manda el último que empezó (julio de 2025)')
  assert.equal(vigenteEn(datos.boes, '2025-06-30').id, 1)
  assert.equal(vigenteEn(datos.boes, '2025-07-01').id, 2, 'el día que empieza ya vale')
  assert.equal(vigenteEn(datos.boes, '2027-01-01').id, 3)
  assert.equal(vigenteEn(datos.boes, '2024-12-31'), null, 'ninguno ha empezado todavía')
})

test('las fechas se enseñan como día/mes/año', () => {
  assert.equal(fechaCorta('2026-01-05'), '05/01/2026')
  assert.equal(fechaCorta(''), '')
})
