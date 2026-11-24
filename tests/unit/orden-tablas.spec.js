// Todas las tablas ordenan igual: MCAS ya lo hacía bien y el resto comparaba con > y <.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { leer, raiz } = require('./helpers/sfc');

const UTIL = 'src/utils/orden.js';
const LISTADOS = [
  'src/components/CRM_Module/Clientes/ClientesComponent.vue',
  'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
  'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  'src/components/CRM_Module/MCAS/McasComponent.vue',
  'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
  'src/components/CRM_Module/Tareas/TareasComponent.vue',
];

function cargarUtil() {
  const codigo = leer(UTIL)
    .replace(/export default [^;]+;/g, '')
    .replace(/export (function|const)/g, '$1');
  return Function(codigo + '\nreturn { compararValores };')();
}

test('los acentos y la eñe se ordenan como en español', () => {
  const { compararValores } = cargarUtil();
  const nombres = ['Zapata', 'Álvarez', 'Núñez', 'Ortega'];
  assert.deepEqual([...nombres].sort(compararValores), ['Álvarez', 'Núñez', 'Ortega', 'Zapata']);
});

test('los números escritos como texto no se ordenan como palabras', () => {
  const { compararValores } = cargarUtil();
  assert.deepEqual(['10', '9', '100'].sort(compararValores), ['9', '10', '100']);
  assert.deepEqual([10, 9, 100].sort(compararValores), [9, 10, 100]);
});

test('las celdas vacías van al final, no mezcladas', () => {
  const { compararValores } = cargarUtil();
  assert.deepEqual(['b', null, 'a', '', undefined].sort(compararValores).slice(0, 2), ['a', 'b']);
  assert.equal(compararValores(null, undefined), 0);
});

test('valores iguales no cambian de sitio', () => {
  const { compararValores } = cargarUtil();
  assert.equal(compararValores('igual', 'igual'), 0);
  assert.equal(compararValores(5, 5), 0);
});

test('ninguna pantalla ordena ya con > o < a mano', () => {
  for (const ruta of LISTADOS) {
    const texto = leer(ruta);
    assert.match(texto, /from ['"]@\/utils\/orden['"]/, `${ruta} no usa el comparador común`);
    assert.doesNotMatch(texto, /return aValue > bValue \? 1 : -1/, `${ruta} sigue comparando a mano`);
  }
});

test('el comparador vive en un solo archivo', () => {
  const fuentes = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(completa);
      else if (/\.(vue|js)$/.test(e.name)) fuentes.push(completa);
    }
  };
  recorrer(path.join(raiz, 'src'));
  const copias = fuentes.filter(f => !f.endsWith(path.join('utils', 'orden.js')))
    .filter(f => /function compararValores/.test(fs.readFileSync(f, 'utf8')))
    .map(f => path.relative(raiz, f));
  assert.deepEqual(copias, []);
});
