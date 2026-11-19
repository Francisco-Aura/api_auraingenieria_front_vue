import test from 'node:test'
import assert from 'node:assert/strict'
import { estudiosCompatibles, etiquetaEstudio } from '../../src/utils/planificador/estudioAsociado.js'

const est = (id, cliente, kind, cid, proyecto, extra = {}) => ({ id, cliente, customer: { kind, id: cid }, proyecto, kwp: 10, estado: 'en_estudio', estadoNombre: 'En estudio', ...extra })
const estudios = [
  est('a', 'Pepe', 'existente', 5, 'Nave 2'),
  est('b', 'Pepe', 'existente', 5, 'Cubierta'),
  est('c', 'Otro', 'existente', 6, 'Nave 2'),
  est('d', 'Ana Díaz', 'potencial', null, 'Casa'),
  est('e', 'Pepe', 'existente', 5, '')
]

test('un cliente de la intranet se compara por id y el proyecto sin mirar mayúsculas ni espacios', () => {
  const p = { name: 'Pepe · nave  2 v2', customer_kind: 'existente', customer_id: 5 }
  assert.deepEqual(estudiosCompatibles(p, estudios).map((e) => e.id), ['a'])
})

test('un cliente potencial se compara por nombre sin tildes', () => {
  const p = { name: 'ana diaz · CASA', customer_kind: 'potencial', customer_id: null }
  assert.deepEqual(estudiosCompatibles(p, estudios).map((e) => e.id), ['d'])
})

test('sin proyecto solo encaja con estudios sin proyecto y sin lista no hay nada', () => {
  assert.deepEqual(estudiosCompatibles({ name: 'Pepe', customer_kind: 'existente', customer_id: 5 }, estudios).map((e) => e.id), ['e'])
  assert.deepEqual(estudiosCompatibles({ name: 'Pepe · Nave 2', customer_kind: 'existente', customer_id: 5 }, null), [])
})

test('la etiqueta enseña la potencia y el estado', () => {
  assert.equal(etiquetaEstudio(est('a', 'x', 'existente', 1, '', { kwp: 120.5 })), '120,5 kWp · En estudio')
  assert.equal(etiquetaEstudio(est('a', 'x', 'existente', 1, '', { kwp: null })), 'Sin calcular · En estudio')
})
