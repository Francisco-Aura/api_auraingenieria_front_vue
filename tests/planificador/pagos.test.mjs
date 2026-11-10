import test from 'node:test'
import assert from 'node:assert/strict'
import {
  STANDARD_STAGES, STANDARD_PLAN, suggestedTexts, withSuggestedTexts, applyPercentEdit, settleOnLast, planProblem, planPayload, planTotal, planPercents, MAX_STAGES
} from '../../src/utils/planificador/contratos/pagos.js'
import { dinero, conSigno, formatoValor, etiquetaTarea, formularioDeContrato, entradaDeCambio } from '../../src/utils/planificador/contratos/formatoContrato.js'

const personalizada = (...porcentajes) => ({ mode: 'custom', stages: porcentajes.map((p, i) => ({ label: 'Pago ' + (i + 1), percent: String(p) })) })

test('la forma de pago habitual son cuatro pagos que suman 100 %', () => {
  assert.equal(STANDARD_STAGES.length, 4)
  assert.equal(planTotal(STANDARD_PLAN), 100)
  assert.equal(planProblem(STANDARD_PLAN), null)
  assert.deepEqual(planPayload(STANDARD_PLAN), { mode: 'standard' })
})

test('los textos sugeridos dependen de cuántos pagos hay y no pisan lo escrito a mano', () => {
  assert.deepEqual(suggestedTexts(1), ['Pago único'])
  assert.deepEqual(suggestedTexts(2), ['Avance de obra', 'Al acabar la instalación'])
  assert.equal(suggestedTexts(5), null)
  const dos = withSuggestedTexts([{ label: 'A la firma del contrato', percent: 50 }, { label: 'Mi concepto', percent: 50 }])
  assert.equal(dos[0].label, 'Avance de obra', 'el texto sin tocar pasa al sugerido')
  assert.equal(dos[1].label, 'Mi concepto', 'el escrito a mano se respeta')
  assert.equal(dos[0].note, '')
})

test('al cambiar un porcentaje la diferencia la absorbe el pago anterior (o el último si es el primero)', () => {
  const plan = personalizada(30, 40, 20, 10)
  const a = applyPercentEdit(plan.stages, 2, '25')
  assert.deepEqual(a.map((s) => String(s.percent)), ['30', '35', '25', '10'])
  const b = applyPercentEdit(plan.stages, 0, '40')
  assert.deepEqual(b.map((s) => String(s.percent)), ['40', '40', '20', '0'], 'el último cede lo que tiene y el resto sigue hacia atrás')
  assert.equal(planTotal({ mode: 'custom', stages: b }), 100)
  // Con un solo pago no hay a quién pasar la diferencia
  assert.deepEqual(applyPercentEdit([{ label: 'x', percent: '100' }], 0, '50').map((s) => String(s.percent)), ['50'])
})

test('quitar un pago pasa su porcentaje al último para seguir sumando 100', () => {
  const quedan = settleOnLast(personalizada(30, 40, 20, 10).stages.filter((_, i) => i !== 1))
  assert.deepEqual(quedan.map((s) => String(s.percent)), ['30', '20', '50'])
  assert.deepEqual(settleOnLast([]), [])
})

test('el problema de una forma de pago personalizada se explica en una frase', () => {
  assert.equal(planProblem({ mode: 'custom', stages: [] }), 'Añade al menos un pago.')
  assert.equal(planProblem({ mode: 'custom', stages: [{ label: '', percent: '100' }] }), 'Indica a qué corresponde cada pago.')
  assert.equal(planProblem({ mode: 'custom', stages: [{ label: 'A', percent: '0' }, { label: 'B', percent: '100' }] }), 'El porcentaje de «A» debe estar entre 0 y 100.')
  assert.equal(planProblem(personalizada(60, 30)), 'Los porcentajes suman 90 %: deben sumar exactamente 100 %.')
  assert.equal(planProblem(personalizada(60, 50)), 'Los porcentajes fijados suman 110 %: pasan de 100 %.')
  assert.equal(planProblem(personalizada('40,5', '59,5')), null, 'acepta la coma decimal')
  assert.deepEqual(planPercents(personalizada(10, 'x')), [10])
})

test('lo que se envía al servidor lleva los textos recortados y los porcentajes como número', () => {
  const plan = { mode: 'custom', stages: [{ label: '  A  ', percent: '40,5' }, { label: 'B', percent: '59.5' }] }
  assert.deepEqual(planPayload(plan), { mode: 'custom', stages: [{ label: 'A', note: '', percent: 40.5 }, { label: 'B', note: '', percent: 59.5 }] })
  assert.ok(MAX_STAGES >= 4)
})

test('los importes se escriben en euros con separador de miles y los cambios con su signo', () => {
  const normal = (t) => t.replace(/\s/g, ' ') // el separador antes del € es un espacio duro
  assert.equal(normal(dinero(1200)), '1.200,00 €')
  assert.equal(normal(conSigno(1200)), '+1.200,00 €')
  assert.equal(normal(conSigno(-150)), '−150,00 €')
  assert.equal(normal(conSigno(0)), '0,00 €')
})

test('un dato del contrato sin valor se enseña como «—» y los importes como euros', () => {
  assert.equal(formatoValor({ type: 'money' }, undefined), '—')
  assert.equal(formatoValor({ type: 'money' }, ''), '—')
  assert.equal(formatoValor({ type: 'int' }, 20), '20')
  assert.equal(formatoValor({ type: 'money' }, 5000), dinero(5000))
  assert.equal(etiquetaTarea('Batería (si aplica)'), 'Batería')
})

test('el formulario del contrato es todo texto y un cambio conserva su presupuesto y su forma de cobro al reenviarse', () => {
  const campos = [{ key: 'importe_total' }, { key: 'paneles_uds' }, { key: 'estructura' }]
  assert.deepEqual(formularioDeContrato(campos, { importe_total: 1000, paneles_uds: null }), { importe_total: '1000', paneles_uds: '', estructura: '' })
  const c = { id: 'c1', date: '2030-01-01', reason: 'x', impact: 5, set: {}, budget: undefined, payment_mode: 'new', number: 1, new_total: 1005 }
  assert.deepEqual(entradaDeCambio(c), { id: 'c1', date: '2030-01-01', reason: 'x', impact: 5, set: {}, budget: null, payment_mode: 'new' })
})
