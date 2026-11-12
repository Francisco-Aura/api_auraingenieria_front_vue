// Reunión con el cliente del 04/11/2026: Configuración MCAS se abre desde
// Administración (ya no tiene entrada propia en el menú lateral).
const assert = require('node:assert/strict');
const test = require('node:test');
const { plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const MENU = 'src/components/DashboardComponent.vue';
const ADMINISTRACION = 'src/components/CRM_Module/Administracion/AdministracionComponent.vue';

test('el menú lateral ya no lleva a Configuración MCAS; Administración queda marcada estando en ella', () => {
  const html = plantilla(MENU);
  assert.doesNotMatch(html, /to="\/dashboard\/mcas"/);
  assert.match(html, /to="\/dashboard\/mcas-propuestas"/, 'Comisiones MCAS sigue en el menú');
  assert.match(html, /to="\/dashboard\/administracion"[^>]*:class="\{ active: enConfiguracionMcas \}"/);
});

test('Administración tiene una tarjeta que abre Configuración MCAS', () => {
  const html = plantilla(ADMINISTRACION);
  assert.match(html, /v-if="mostrarTarjetaMcas"[\s\S]{0,400}@click="abrirConfiguracionMcas"[\s\S]{0,600}<h3>Configuración MCAS<\/h3>/);

  const rutas = [];
  const ctx = crearContexto(cargarComponente(ADMINISTRACION, { axios: {} }), {});
  ctx.$router = { push: (ruta) => rutas.push(ruta) };
  ctx.abrirConfiguracionMcas();
  assert.deepEqual(rutas, ['/dashboard/mcas']);

  // Con búsqueda, solo si coincide
  ctx.globalFilter = '';
  assert.equal(ctx.mostrarTarjetaMcas, true);
  ctx.globalFilter = 'comisiones';
  assert.equal(ctx.mostrarTarjetaMcas, true);
  ctx.globalFilter = 'gestoras';
  assert.equal(ctx.mostrarTarjetaMcas, false);
});
