// Revisión visual del 15/09/2026 (4): cabeceras de tabla iguales en toda la aplicación.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer } = require('./helpers/sfc');

const CSS = 'src/styles/shared-ui.css';
const TABLAS = [
  'src/components/CRM_Module/Clientes/ClientesComponent.vue',
  'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
  'src/components/CRM_Module/Tareas/TareasComponent.vue',
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
  'src/components/CRM_Module/MCAS/McasComponent.vue',
  'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
];

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function regla(css, selector) {
  const bloque = sinComentarios(css).split('}').find(b => b.split('{')[0].trim().endsWith(selector));
  assert.ok(bloque, `falta la regla ${selector}`);
  return bloque.split('{')[1];
}

test('al pasar el ratón por una cabecera la celda no cambia de color', () => {
  const celda = regla(leer(CSS), '.data-table thead th.sortable:not(#aura-tabla):hover');
  assert.match(celda, /background-color:\s*var\(--surface-color\)\s*!important/);
});

test('solo el título que ordena reacciona, con un fondo gris suave y sin volverse amarillo', () => {
  const css = leer(CSS);
  const titulo = regla(css, '.data-table thead .column-title:not(#aura-tabla)');
  assert.match(titulo, /padding:\s*4px 6px\s*!important/);
  assert.match(titulo, /border-radius:\s*6px\s*!important/);
  const hover = regla(css, '.data-table thead .column-title:not(.column-title--sin-orden):not(#aura-tabla):hover');
  assert.match(hover, /background:\s*rgba\(44, 62, 80, 0\.07\)\s*!important/);
  assert.doesNotMatch(hover, /primary-color|#fcd700|brand-yellow/);
  assert.match(regla(css, '.data-table thead .column-title.column-title--sin-orden:not(#aura-tabla)'), /cursor:\s*default/);
});

test('los títulos que no ordenan (Acciones, Observaciones...) están marcados como tales', () => {
  for (const ruta of TABLAS) {
    const plantilla = leer(ruta).split('<script')[0];
    for (const [etiqueta] of plantilla.matchAll(/<div[^>]*class="column-title[^"]*"[^>]*>/g)) {
      const ordena = /@click/.test(etiqueta);
      const marcado = /column-title--sin-orden/.test(etiqueta);
      assert.ok(ordena || marcado, `${ruta}: ${etiqueta}`);
    }
  }
});

test('todos los filtros de columna dicen lo mismo: «Filtrar...»', () => {
  for (const ruta of TABLAS) {
    for (const [, texto] of leer(ruta).matchAll(/placeholder="(Filtrar[^"]*)"/g)) {
      assert.equal(texto, 'Filtrar...', ruta);
    }
  }
});

test('los filtros de columna miden lo mismo y quedan a la misma altura, sean texto, lista o botón', () => {
  const css = leer(CSS);
  const filtro = regla(css, '.data-table thead :is(.column-filter, .dropdown-button):not(#aura-tabla)');
  assert.match(filtro, /height:\s*34px\s*!important/);
  assert.match(filtro, /margin:\s*0\s*!important/);
  assert.match(regla(css, '.data-table thead th:not(#aura-tabla)'), /vertical-align:\s*top\s*!important/);
});

test('el filtro desplegable de Sector no se vuelve amarillo al pasar el ratón ni al estar activo', () => {
  const css = leer(CSS);
  const hover = regla(css, '.data-table thead .dropdown-button:not(#aura-tabla):hover');
  assert.doesNotMatch(hover, /primary-color|#fcd700/);
  assert.match(regla(css, '.data-table thead .dropdown-button.active:not(#aura-tabla)'), /color:\s*var\(--color-text-dark/);
});

test('en Informes «Acciones» y «Pagos» también arrancan arriba, como el resto de títulos', () => {
  assert.match(regla(leer(CSS), '.data-table thead .column-header:not(#aura-tabla)'), /justify-content:\s*flex-start\s*!important/);
});
