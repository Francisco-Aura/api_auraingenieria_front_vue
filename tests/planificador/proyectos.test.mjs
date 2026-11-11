import test from 'node:test'
import assert from 'node:assert/strict'
import { partesDeNombre, claveGrupo, proyectosDeCliente } from '../../src/utils/planificador/proyectos.js'

test('el nombre se parte en cliente y proyecto, sin el «v2» ni el «(copia)» del final', () => {
  assert.deepEqual(partesDeNombre('Pepe · Nave 2'), { cliente: 'Pepe', proyecto: 'Nave 2' })
  assert.deepEqual(partesDeNombre('Pepe · Nave 2 v3'), { cliente: 'Pepe', proyecto: 'Nave 2' })
  assert.deepEqual(partesDeNombre('Pepe · Nave 2 (copia)'), { cliente: 'Pepe', proyecto: 'Nave 2' })
  assert.deepEqual(partesDeNombre('Pepe'), { cliente: 'Pepe', proyecto: '' })
  assert.deepEqual(partesDeNombre(''), { cliente: '', proyecto: '' })
})

test('mismo cliente y mismo proyecto = misma clave, sin mirar mayúsculas, tildes ni espacios; sin proyecto no hay clave', () => {
  const a = claveGrupo('Pepe · Nave 2', 'existente')
  assert.equal(claveGrupo('  PEPE ·   nave  2 v2', 'existente'), a)
  assert.equal(claveGrupo('Pepe · Cámara frigorífica'), claveGrupo('Pepe · camara frigorifica'))
  assert.notEqual(claveGrupo('Pepe · Nave 3', 'existente'), a)
  assert.notEqual(claveGrupo('Ana · Nave 2', 'existente'), a)
  assert.notEqual(claveGrupo('Pepe · Nave 2', 'potencial'), a, 'un cliente potencial y uno existente no son el mismo')
  assert.equal(claveGrupo('Pepe'), '')
})

test('los proyectos que ya tiene un cliente, sin repetir y ordenados, para sugerirlos', () => {
  const nombres = ['Pepe · Nave 2', 'pepe · nave 2 v2', 'Pepe · Casa', 'Ana · Otra', 'Pepe']
  assert.deepEqual(proyectosDeCliente('Pepe', nombres), ['Casa', 'Nave 2'])
  assert.deepEqual(proyectosDeCliente('Nadie', nombres), [])
  assert.deepEqual(proyectosDeCliente('', nombres), [])
})
