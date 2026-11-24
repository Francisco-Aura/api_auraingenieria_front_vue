import test from 'node:test'
import assert from 'node:assert/strict'
import { cuerpoGenerar, mensajeDeError, nombreDeDescarga } from '../../src/utils/registroHorario/peticion.js'

test('el cuerpo de «Generar» lleva los nombres de campo del servicio', () => {
  const cuerpo = cuerpoGenerar({
    anio: 2026, mes: 10, trabajador: 'Ana', nif: 'X', num_afiliacion: '1', empresa: 'E',
    horario: { manana: ['08:00', '15:00'], tarde: ['16:00', '19:00'] },
    estado_dias: { '2026-10-01': 'MANANA' },
    horas_dia: { '2026-10-06': { manana: ['09:00', '14:30'] }, '2026-10-07': { tarde: ['15:30', '18:00'] } },
    firma_png_base64: 'AAAA', fecha_firma: 'ultimo_dia', formato: 'pdf'
  })
  assert.deepEqual(cuerpo, {
    anio: 2026, mes: 10, trabajador: 'Ana', nif: 'X', num_afiliacion: '1', empresa: 'E',
    horario_base: { manana: { ini: '08:00', fin: '15:00' }, tarde: { ini: '16:00', fin: '19:00' } },
    estado_dias: { '2026-10-01': 'MANANA' },
    horas_dia: { '2026-10-06': { manana: { ini: '09:00', fin: '14:30' } }, '2026-10-07': { tarde: { ini: '15:30', fin: '18:00' } } },
    firma_png_base64: 'AAAA', fecha_firma: 'ultimo_dia', formato: 'pdf'
  })
  assert.equal('horario' in cuerpo, false)
})

test('el nombre de la descarga sale de la cabecera, con tildes, o es el de reserva', () => {
  const cab = "attachment; filename=\"documento.pdf\"; filename*=UTF-8''Reg_horas_Ana_P%C3%A9rez_2026-10.pdf"
  assert.equal(nombreDeDescarga(cab, 'x.pdf'), 'Reg_horas_Ana_Pérez_2026-10.pdf')
  assert.equal(nombreDeDescarga(undefined, 'x.pdf'), 'x.pdf')
  assert.equal(nombreDeDescarga("filename*=UTF-8''%E0%A4%A", 'x.pdf'), 'x.pdf', 'codificación rota')
})

test('mensajes de error comprensibles', () => {
  assert.equal(mensajeDeError('La empresa elegida no está en la lista. Vuelve a elegirla.', 422), 'La empresa elegida no está en la lista. Vuelve a elegirla.')
  assert.match(mensajeDeError(undefined, 500), /servidor no pudo/)
  assert.equal(mensajeDeError(undefined, 400), 'No se pudo completar la operación.')
})
