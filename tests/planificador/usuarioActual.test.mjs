import test from 'node:test'
import assert from 'node:assert/strict'
import { cabecerasUsuario, leerUsuario } from '../../src/services/usuarioActual.js'

const almacen = valor => ({ getItem: () => valor })

test('manda nombre, id y nivel como cabeceras', () => {
  const c = cabecerasUsuario(almacen(JSON.stringify({ id: 1, nombre: 'Ana Pérez', nivelAcceso: 0 })))
  assert.deepEqual(c, {
    'X-Aura-Usuario-Nombre': 'Ana Pérez',
    'X-Usuario-Id': '1',
    'X-Usuario-Nivel': '0'
  })
})

test('sin sesión o con datos rotos no manda nada y no falla', () => {
  assert.deepEqual(cabecerasUsuario(almacen(null)), {})
  assert.deepEqual(leerUsuario(almacen('{roto')), {})
})
