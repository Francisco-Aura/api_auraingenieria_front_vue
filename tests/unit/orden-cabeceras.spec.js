// Pulsar una cabecera hace lo mismo en todas las tablas: asc → desc → sin ordenar.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer } = require('./helpers/sfc');

const MIXIN = 'src/mixins/ordenTabla.js';
const LISTADOS = [
  'src/components/CRM_Module/Clientes/ClientesComponent.vue',
  'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
  'src/components/CRM_Module/Tareas/TareasComponent.vue',
  'src/components/CRM_Module/MCAS/McasComponent.vue',
];

function cargarMixin() {
  const codigo = leer(MIXIN)
    .replace(/export default [^;]+;/g, '')
    .replace(/export (const|function)/g, '$1');
  return Function(codigo + '\nreturn ordenTabla;')();
}

const instancia = () => {
  const ctx = { sortKey: null, sortOrder: null };
  const { sortBy, getSortIcon } = cargarMixin().methods;
  return { ctx, sortBy: (k) => sortBy.call(ctx, k), icono: (k) => getSortIcon.call(ctx, k) };
};

test('el tercer clic deja la tabla sin ordenar', () => {
  const { ctx, sortBy } = instancia();
  sortBy('nombre');
  assert.deepEqual([ctx.sortKey, ctx.sortOrder], ['nombre', 'asc']);
  sortBy('nombre');
  assert.deepEqual([ctx.sortKey, ctx.sortOrder], ['nombre', 'desc']);
  sortBy('nombre');
  assert.deepEqual([ctx.sortKey, ctx.sortOrder], [null, null]);
});

test('cambiar de columna empieza de nuevo en ascendente', () => {
  const { ctx, sortBy } = instancia();
  sortBy('nombre');
  sortBy('nombre');
  sortBy('cif');
  assert.deepEqual([ctx.sortKey, ctx.sortOrder], ['cif', 'asc']);
});

test('la flecha refleja el estado de cada columna', () => {
  const { sortBy, icono } = instancia();
  assert.equal(icono('nombre'), 'fas fa-sort');
  sortBy('nombre');
  assert.equal(icono('nombre'), 'fas fa-sort-up');
  assert.equal(icono('cif'), 'fas fa-sort');
  sortBy('nombre');
  assert.equal(icono('nombre'), 'fas fa-sort-down');
  sortBy('nombre');
  assert.equal(icono('nombre'), 'fas fa-sort');
});

test('ningún listado guarda ya su propia copia', () => {
  for (const ruta of LISTADOS) {
    const texto = leer(ruta);
    assert.match(texto, /from ['"]@\/mixins\/ordenTabla['"]/, `${ruta} no usa el mixin`);
    assert.doesNotMatch(texto, /\n\s*sortBy\(\w+\) \{/, `${ruta} conserva su propio sortBy`);
    assert.doesNotMatch(texto, /\n\s*getSortIcon\(\w+\) \{/, `${ruta} conserva su propio getSortIcon`);
  }
});
