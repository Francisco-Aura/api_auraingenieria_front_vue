// Erratas de textos visibles detectadas al capturar el manual v2.0 (22/10/2026).
const assert = require('node:assert/strict');
const test = require('node:test');
const { plantilla, leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN_MCAS = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const ADMINISTRACION = 'src/components/CRM_Module/Administracion/AdministracionComponent.vue';

test('«déla de alta» lleva tilde (imperativo de usted de «dar» con pronombre)', () => {
  const fuente = leer(ADMIN_MCAS);
  assert.doesNotMatch(fuente, /\b[Dd]ela de alta\b/);
  assert.match(fuente, /¿No aparece\? Déla de alta en Administración/);
});

test('el título de alta en Administración concuerda: «Nuevo registro», «Nueva subcategoría»', () => {
  assert.match(plantilla(ADMINISTRACION), /\{\{ tituloFormulario \}\}/);
  const componente = cargarComponente(ADMINISTRACION, { axios: {} });
  const titulo = (nombreTabla, editando) => crearContexto(componente, { tablaSeleccionada: { nombre: nombreTabla }, editando }).tituloFormulario;
  assert.equal(titulo('Comercializadoras', false), 'Nuevo registro');
  assert.equal(titulo('Tareas - Subcategorías', false), 'Nueva subcategoría');
  assert.equal(titulo('Comercializadoras', true), 'Editar registro');
  assert.equal(titulo('Tareas - Subcategorías', true), 'Editar subcategoría');
});
