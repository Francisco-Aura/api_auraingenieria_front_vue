import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cargarFirma, cargarMarcas, cargarPerfil, guardarFirma, guardarMarcas, guardarPerfil, PERFIL_BASE,
  CLAVE_PERFIL, CLAVE_MARCAS, CLAVE_FIRMA
} from '../../src/utils/registroHorario/almacen.js'
import { MARCAS_VACIAS } from '../../src/utils/registroHorario/jornada.js'

/** Un almacenamiento falso como el localStorage del navegador. */
function falso(inicial = {}, falla = false) {
  const d = new Map(Object.entries(inicial))
  return {
    getItem: (k) => { if (falla) throw new Error('bloqueado'); return d.has(k) ? d.get(k) : null },
    setItem: (k, v) => { if (falla) throw new Error('bloqueado'); d.set(k, String(v)) },
    removeItem: (k) => { if (falla) throw new Error('bloqueado'); d.delete(k) },
    mapa: d
  }
}

test('las claves son las del Registro horario anterior: así cada persona conserva sus datos', () => {
  assert.equal(CLAVE_PERFIL, 'registro-horario:perfil')
  assert.equal(CLAVE_MARCAS, 'registro-horario:dias')
  assert.equal(CLAVE_FIRMA, 'registro-horario:firma')
})

test('un perfil guardado por la versión anterior se lee entero', () => {
  const guardado = {
    trabajador: 'Ana Pérez', nif: '00000000T', num_afiliacion: '00 0000000 00', empresa: 'EMPRESA UNO, S.L.',
    fecha_alta: '2026-10-15', horario: { manana: ['08:30', '15:00'], tarde: ['16:00', '19:30'] }
  }
  const a = falso({ [CLAVE_PERFIL]: JSON.stringify(guardado) })
  assert.deepEqual(cargarPerfil(a), guardado)
})

test('un perfil corrupto o incompleto se aprovecha en lo válido y el resto vuelve a lo habitual', () => {
  assert.equal(cargarPerfil(falso()), PERFIL_BASE)
  assert.equal(cargarPerfil(falso({ [CLAVE_PERFIL]: '{no es json' })), PERFIL_BASE)
  assert.equal(cargarPerfil(falso({ [CLAVE_PERFIL]: '[1,2]' })), PERFIL_BASE)
  const p = cargarPerfil(falso({ [CLAVE_PERFIL]: JSON.stringify({
    trabajador: 5, nif: 'X'.repeat(50), fecha_alta: '2026-02-30', horario: { manana: ['15:00', '08:00'], tarde: ['8.30', '19:00'] }
  }) }))
  assert.equal(p.trabajador, '')
  assert.equal(p.nif.length, 30)
  assert.equal(p.fecha_alta, '')
  assert.deepEqual(p.horario.manana, ['08:00', '15:00'], 'tramo incoherente: vuelve al habitual')
  assert.deepEqual(p.horario.tarde, ['08:30', '19:00'], 'hora normalizada')
})

test('las marcas guardadas se limpian: solo fechas que existen, estados conocidos y tramos válidos', () => {
  const m = cargarMarcas(falso({ [CLAVE_MARCAS]: JSON.stringify({
    cambios: { '2026-10-05': 'TARDE', '2026-10-06': 'RARO', '2026-13-01': 'TARDE' },
    horas: { '2026-10-05': { manana: ['09:00', '14:00'], tarde: ['18:00', '17:00'] }, '2026-10-07': { tarde: ['x', 'y'] }, nada: {} }
  }) }))
  assert.deepEqual(m, { cambios: { '2026-10-05': 'TARDE' }, horas: { '2026-10-05': { manana: ['09:00', '14:00'] } } })
  assert.equal(cargarMarcas(falso()), MARCAS_VACIAS)
})

test('la firma solo se acepta si es un PNG en data URL', () => {
  const png = 'data:image/png;base64,AAAA'
  assert.equal(cargarFirma(falso({ [CLAVE_FIRMA]: png })), png)
  assert.equal(cargarFirma(falso({ [CLAVE_FIRMA]: 'data:image/jpeg;base64,AAAA' })), null)
  assert.equal(cargarFirma(falso()), null)
})

test('guardar y volver a leer, y quitar la firma la borra', () => {
  const a = falso()
  const perfil = { ...PERFIL_BASE, trabajador: 'Ana', nif: 'X' }
  guardarPerfil(perfil, a)
  guardarMarcas({ cambios: { '2026-10-05': 'TARDE' }, horas: {} }, a)
  guardarFirma('data:image/png;base64,AAAA', a)
  assert.equal(cargarPerfil(a).trabajador, 'Ana')
  assert.deepEqual(cargarMarcas(a).cambios, { '2026-10-05': 'TARDE' })
  assert.equal(cargarFirma(a), 'data:image/png;base64,AAAA')
  guardarFirma(null, a)
  assert.equal(cargarFirma(a), null)
  assert.equal(a.mapa.has(CLAVE_FIRMA), false)
})

test('con el almacenamiento bloqueado (ventana privada) nada falla', () => {
  const a = falso({}, true)
  assert.equal(cargarPerfil(a), PERFIL_BASE)
  assert.equal(cargarMarcas(a), MARCAS_VACIAS)
  assert.equal(cargarFirma(a), null)
  assert.doesNotThrow(() => { guardarPerfil(PERFIL_BASE, a); guardarMarcas(MARCAS_VACIAS, a); guardarFirma('x', a) })
})
