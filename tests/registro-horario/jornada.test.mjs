import test from 'node:test'
import assert from 'node:assert/strict'
import { fechaValida, hoyISO, diasDelMes, diaSemana, corta, iso } from '../../src/utils/registroHorario/fechas.js'
import { aMinutos, errorHorario, fmtHoras, normalizarHora } from '../../src/utils/registroHorario/horas.js'
import {
  esFinDeSemana, estadoDe, estadoDefecto, estadoDiasDelMes, faltan, HORARIO_BASE, limiteDe, MARCAS_VACIAS, pintar, ponerHoras,
  quitarMarca, restablecerMes, resumenMes, hayMarcasEnMes, horasDelMes, unir
} from '../../src/utils/registroHorario/jornada.js'

// Octubre de 2026: el 12 es festivo nacional; el 1 es jueves; el 3-4 y 10-11 son fin de semana
const festivos = new Set(['2026-10-12'])
const ctx = (extra = {}) => ({ festivos, marcas: MARCAS_VACIAS, alta: null, ...extra })

test('horas: normaliza y valida', () => {
  assert.equal(normalizarHora('8:30'), '08:30')
  assert.equal(normalizarHora('08.05'), '08:05')
  assert.equal(normalizarHora('24:00'), null)
  assert.equal(normalizarHora('8'), null)
})

test('horas: formatea como el escritorio', () => {
  assert.equal(fmtHoras(145 * 60), '145 hrs.')
  assert.equal(fmtHoras(145 * 60 + 30), '145:30 hrs.')
  assert.equal(aMinutos('16:05'), 965)
})

test('horas: detecta horarios incoherentes', () => {
  assert.equal(errorHorario(['08:00', '15:00'], ['16:00', '19:00']), null)
  assert.match(errorHorario(['15:00', '08:00'], null), /posterior/)
  assert.match(errorHorario(['08:00', '15:00'], ['14:00', '19:00']), /tarde no puede empezar/)
  assert.match(errorHorario(['8', '15:00'], null), /HH:MM/)
})

test('fechas: valida AAAA-MM-DD y da el hoy local', () => {
  assert.equal(fechaValida('2026-02-28'), true)
  assert.equal(fechaValida('2026-02-30'), false)
  assert.equal(fechaValida('26-02-01'), false)
  assert.equal(fechaValida(5), false)
  assert.equal(hoyISO(new Date(2026, 9, 5, 23, 59)), '2026-10-05')
  assert.equal(diasDelMes(2028, 2), 29)
  assert.equal(diasDelMes(2027, 2), 28)
  assert.equal(diaSemana(2026, 10, 5), 0, 'lunes')
  assert.equal(diaSemana(2026, 10, 4), 6, 'domingo')
  assert.equal(corta('2026-10-05'), '5 oct 2026')
  assert.equal(iso(2026, 3, 7), '2026-03-07')
})

test('estado de los días: por defecto fin de semana libre, festivo y resto mañana', () => {
  assert.equal(estadoDefecto('2026-10-03', festivos), 'LIBRE')
  assert.equal(estadoDefecto('2026-10-12', festivos), 'FESTIVO')
  assert.equal(estadoDefecto('2026-10-13', festivos), 'MANANA')
})

test('antes del alta siempre en blanco, y no se puede marcar', () => {
  const c = ctx({ alta: '2026-10-15' })
  assert.equal(estadoDe('2026-10-14', c), 'LIBRE')
  assert.equal(estadoDe('2026-10-15', c), 'MANANA')
  assert.equal(pintar(MARCAS_VACIAS, '2026-10-14', 'TARDE', c), MARCAS_VACIAS)
})

test('pintar guarda solo lo que difiere del valor por defecto y es idempotente', () => {
  const a = pintar(MARCAS_VACIAS, '2026-10-05', 'TARDE', ctx())
  assert.deepEqual(a.cambios, { '2026-10-05': 'TARDE' })
  assert.equal(pintar(a, '2026-10-05', 'TARDE', ctx({ marcas: a })), a)
  const b = pintar(a, '2026-10-05', 'MANANA', ctx({ marcas: a })) // vuelve al valor por defecto
  assert.deepEqual(b.cambios, {})
})

test('sábados y domingos no se pueden marcar, y una marca antigua en un fin de semana se ignora', () => {
  assert.equal(esFinDeSemana('2026-10-03'), true) // sábado
  assert.equal(esFinDeSemana('2026-10-04'), true) // domingo
  assert.equal(esFinDeSemana('2026-10-05'), false) // lunes
  for (const f of ['2026-10-03', '2026-10-04']) {
    assert.equal(pintar(MARCAS_VACIAS, f, 'TARDE', ctx()), MARCAS_VACIAS)
    assert.equal(pintar(MARCAS_VACIAS, f, 'FESTIVO', ctx()), MARCAS_VACIAS)
  }
  // marcas guardadas antes de esta regla (o a mano): el día sigue saliendo en blanco y no cuenta
  const vieja = { cambios: { '2026-10-03': 'MANANA', '2026-10-04': 'TARDE' }, horas: {} }
  assert.equal(estadoDe('2026-10-03', ctx({ marcas: vieja })), 'LIBRE')
  assert.equal(resumenMes(2026, 10, ctx({ marcas: vieja }), HORARIO_BASE, null).dias, 21)
  assert.equal(estadoDiasDelMes(2026, 10, ctx({ marcas: vieja }), null)['2026-10-04'], 'LIBRE')
})

test('quitar marca borra estado y horas del día', () => {
  let m = pintar(MARCAS_VACIAS, '2026-10-05', 'TARDE', ctx())
  m = ponerHoras(m, '2026-10-05', { manana: ['09:00', '14:00'] }, HORARIO_BASE)
  assert.deepEqual(quitarMarca(m, '2026-10-05'), { cambios: {}, horas: {} })
  assert.equal(quitarMarca(MARCAS_VACIAS, '2026-10-05'), MARCAS_VACIAS)
})

test('las horas iguales a las habituales no se guardan', () => {
  const m = ponerHoras(MARCAS_VACIAS, '2026-10-05', { manana: ['08:00', '15:00'], tarde: ['15:30', '18:00'] }, HORARIO_BASE)
  assert.deepEqual(m.horas, { '2026-10-05': { tarde: ['15:30', '18:00'] } })
  assert.deepEqual(ponerHoras(m, '2026-10-05', { tarde: ['16:00', '19:00'] }, HORARIO_BASE).horas, {})
})

test('restablecer solo toca el mes indicado', () => {
  const m = { cambios: { '2026-10-05': 'TARDE', '2026-11-02': 'TARDE' }, horas: {} }
  assert.deepEqual(restablecerMes(m, 2026, 10).cambios, { '2026-11-02': 'TARDE' })
  assert.equal(hayMarcasEnMes(m, 2026, 10), true)
  assert.equal(hayMarcasEnMes(m, 2026, 12), false)
  const conHoras = { cambios: {}, horas: { '2026-10-05': { manana: ['09:00', '14:00'] }, '2026-11-05': { manana: ['09:00', '14:00'] } } }
  assert.deepEqual(horasDelMes(2026, 10, conHoras), { '2026-10-05': { manana: ['09:00', '14:00'] } })
})

test('resumen: octubre de 2026 sin marcas son 21 días de 7 horas', () => {
  // 22 días entre semana (1-2, 5-9, 12-16, 19-23, 26-30) menos el festivo del 12
  assert.deepEqual(resumenMes(2026, 10, ctx(), HORARIO_BASE, null), { dias: 21, tardes: 0, minutos: 21 * 7 * 60 })
})

test('resumen: con tardes y horas propias', () => {
  let m = pintar(MARCAS_VACIAS, '2026-10-05', 'TARDE', ctx())
  m = ponerHoras(m, '2026-10-05', { manana: ['09:00', '14:00'], tarde: ['15:00', '18:00'] }, HORARIO_BASE)
  const r = resumenMes(2026, 10, ctx({ marcas: m }), HORARIO_BASE, null)
  assert.equal(r.tardes, 1)
  assert.equal(r.minutos, 20 * 7 * 60 + 5 * 60 + 3 * 60)
})

test('«solo hasta hoy» limita el resumen y deja en blanco lo posterior', () => {
  assert.equal(limiteDe(2026, 10, true, '2026-10-08'), '2026-10-08')
  assert.equal(limiteDe(2026, 11, true, '2026-10-08'), null)
  assert.equal(limiteDe(2026, 10, false, '2026-10-08'), null)
  assert.equal(resumenMes(2026, 10, ctx(), HORARIO_BASE, '2026-10-08').dias, 6) // 1,2,5,6,7,8
  const e = estadoDiasDelMes(2026, 10, ctx(), '2026-10-08')
  assert.equal(Object.keys(e).length, 31)
  assert.equal(e['2026-10-08'], 'MANANA')
  assert.equal(e['2026-10-09'], 'LIBRE')
})

test('qué falta para generar', () => {
  const ok = { trabajador: 'Ana', nif: 'X', num_afiliacion: '1', empresa: 'E' }
  const res = { dias: 3, tardes: 0, minutos: 60 }
  assert.deepEqual(faltan(ok, true, true, true, HORARIO_BASE, res), [])
  const f = faltan({ ...ok, nif: ' ' }, false, true, false, HORARIO_BASE, { ...res, dias: 0 })
  assert.deepEqual(f, ['tu NIF', 'elegir tu empresa', 'la imagen de tu firma', 'al menos un día trabajado en el periodo'])
  assert.deepEqual(faltan(ok, false, false, true, HORARIO_BASE, res), ['la empresa (no hay ninguna configurada: avisa al administrador)'])
  assert.deepEqual(faltan(ok, true, true, true, { manana: ['15:00', '08:00'], tarde: ['16:00', '19:00'] }, res), ['un horario habitual válido (formato HH:MM)'])
  assert.equal(unir(['a', 'b', 'c']), 'a, b y c')
  assert.equal(unir(['a']), 'a')
  assert.equal(unir([]), '')
})
