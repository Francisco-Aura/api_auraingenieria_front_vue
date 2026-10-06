// La vista «semana» del calendario de tareas debe contener siempre el día actual.
const assert = require('node:assert/strict');
const test = require('node:test');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const VISTA = 'src/components/CRM_Module/Tareas/TareasCalendarioView.vue';

const contexto = (fecha, vista = 'semana') => crearContexto(
  cargarComponente(VISTA, { axios: {} }),
  { fechaActual: fecha, vista, tareas: [] });

const aIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('la semana empieza en lunes y termina en domingo', () => {
  // Miércoles 16/09/2026
  const dias = contexto(new Date(2026, 8, 16)).diasVista.map(d => aIso(d.fecha));
  assert.deepEqual(dias, ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17',
    '2026-09-18', '2026-09-19', '2026-09-20']);
});

test('un domingo se ve SU semana, no la siguiente', () => {
  // Domingo 20/09/2026: getDay() es 0 y la cuenta saltaba a la semana de después.
  const dias = contexto(new Date(2026, 8, 20)).diasVista.map(d => aIso(d.fecha));
  assert.equal(dias[0], '2026-09-14');
  assert.equal(dias[6], '2026-09-20');
  assert.ok(dias.includes('2026-09-20'), 'el día actual tiene que estar en su propia semana');
});

test('un lunes empieza en ese mismo lunes', () => {
  const dias = contexto(new Date(2026, 8, 14)).diasVista.map(d => aIso(d.fecha));
  assert.equal(dias[0], '2026-09-14');
});

test('el cambio de hora no duplica ni se salta ningún día', () => {
  // Última semana de octubre de 2026: el domingo 25 España atrasa el reloj una hora.
  const dias = contexto(new Date(2026, 9, 21)).diasVista.map(d => aIso(d.fecha));
  assert.deepEqual(dias, ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22',
    '2026-10-23', '2026-10-24', '2026-10-25']);
  assert.equal(new Set(dias).size, 7);
});
