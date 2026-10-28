// Columna de acciones, rueda del ratón en los modales y botón Cancelar (revisión en local).
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer } = require('./helpers/sfc');

const UI_CSS = 'src/styles/shared-ui.css';
const BOTONES_CSS = 'src/styles/shared-buttons.css';
const PS = 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
const TAREAS = 'src/components/CRM_Module/Tareas/TareasComponent.vue';
const CON_TABLA_ANCHA = [
  PS,
  TAREAS,
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  'src/components/CRM_Module/MCAS/McasComponent.vue',
  'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
  'src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue',
];

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function regla(css, selector) {
  const bloque = sinComentarios(css).split('}').find(b => b.split('{')[0].trim().endsWith(selector));
  assert.ok(bloque, `falta la regla ${selector}`);
  return bloque.split('{')[1];
}

const directiva = async () => (await import(pathToFileURL(path.join(raiz, 'src/directives/desbordeTabla.js')).href)).default;

/** Contenedor de tabla de mentira: solo lo que mira la directiva. */
function contenedor({ ancho, anchoTabla, desplazado = 0 }) {
  const clases = new Set();
  const oyentes = {};
  return {
    clientWidth: ancho,
    scrollWidth: anchoTabla,
    scrollLeft: desplazado,
    classList: { toggle: (c, si) => (si ? clases.add(c) : clases.delete(c)), contains: (c) => clases.has(c) },
    querySelector: () => null,
    addEventListener: (tipo, fn) => { oyentes[tipo] = fn; },
    removeEventListener: (tipo) => { delete oyentes[tipo]; },
    oyentes,
  };
}

test('si la tabla cabe, la columna de acciones es una más (sin fijar)', async () => {
  const d = await directiva();
  const el = contenedor({ ancho: 1000, anchoTabla: 1000 });
  d.mounted(el);
  assert.equal(el.classList.contains('tabla-desborda'), false);
  assert.equal(el.classList.contains('tabla-al-final'), true);
  d.unmounted(el);
});

test('si no cabe, se marca para fijar las acciones y la sombra se quita al llegar al final', async () => {
  const d = await directiva();
  const el = contenedor({ ancho: 900, anchoTabla: 1200 });
  d.mounted(el);
  assert.equal(el.classList.contains('tabla-desborda'), true);
  assert.equal(el.classList.contains('tabla-al-final'), false);

  el.scrollLeft = 300;
  el.oyentes.scroll();
  assert.equal(el.classList.contains('tabla-al-final'), true);

  d.unmounted(el);
  assert.equal(el.oyentes.scroll, undefined);
});

test('la columna de acciones solo se fija cuando la tabla no cabe, y sin raya', () => {
  const css = leer(UI_CSS);
  const celda = regla(css, '.tabla-desborda .data-table--acciones-fijas :is(th, td):last-child:not(#aura-tabla)');
  assert.match(celda, /position: *sticky/);
  assert.doesNotMatch(sinComentarios(css), /inset 1px 0 0/);
  // Ninguna regla fija la columna fuera de .tabla-desborda
  const fijas = sinComentarios(css).split('}').filter(b => /position: *sticky !important/.test(b));
  for (const bloque of fijas) assert.match(bloque.split('{')[0], /tabla-desborda|modal/, bloque.split('{')[0]);
  for (const ruta of CON_TABLA_ANCHA) assert.match(leer(ruta), /<div class="table-responsive" v-desborde-tabla>/, ruta);
  assert.match(leer('src/main.js'), /app\.directive\('desborde-tabla', desbordeTabla\)/);
});

test('Puntos de Suministro y Tareas se compactan por debajo de 1500 px para caber enteras', () => {
  for (const ruta of [PS, TAREAS]) assert.match(leer(ruta), /class="data-table data-table--acciones-fijas data-table--compacta"/, ruta);
  assert.match(sinComentarios(leer(UI_CSS)), /@media \(max-width: 1499px\) \{\s*\.data-table--compacta thead/);
});

test('con un modal abierto la pantalla de detrás no se desplaza (los toasts no bloquean)', async () => {
  const css = sinComentarios(leer(UI_CSS));
  assert.match(css, /body\.aura-modal-abierto \{\s*overflow: hidden !important;/);
  // Ya no hay un bloqueo por CSS que también saltaba con los toasts ni que corte la rueda en las tablas
  assert.doesNotMatch(css, /html:has\(/);
  assert.doesNotMatch(css, /overscroll-behavior: contain/);
  const { SELECTOR_MODAL } = await import(pathToFileURL(path.join(raiz, 'src/services/capasModales.js')).href);
  assert.match(SELECTOR_MODAL, /\.modal-overlay/);
  assert.match(SELECTOR_MODAL, /:not\(\.swal2-popup\)/);
  assert.doesNotMatch(SELECTOR_MODAL, /swal2-container/);
  assert.match(leer('src/main.js'), /instalarCapasModales\(\);/);
});

test('Esc cierra el modal de encima pulsando su botón de cerrar, salvo que la pantalla ya lo atienda', async () => {
  const modulo = await import(pathToFileURL(path.join(raiz, 'src/services/capasModales.js')).href);
  let cerrado = 0;
  const boton = { disabled: false, click: () => { cerrado++; }, closest: () => capa };
  const capa = { getClientRects: () => [1], querySelectorAll: () => [boton] };
  global.document = { querySelectorAll: () => [capa], querySelector: () => null, body: { querySelector: () => null } };
  const evento = (extra = {}) => ({ key: 'Escape', defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra });
  try {
    const e1 = evento();
    modulo.alPulsarEscape(e1);
    assert.equal(cerrado, 1);
    assert.equal(e1.defaultPrevented, true);
    modulo.alPulsarEscape(evento({ defaultPrevented: true }));
    modulo.alPulsarEscape(evento({ key: 'Enter' }));
    assert.equal(cerrado, 1);
  } finally {
    delete global.document;
  }
  for (const ruta of ['src/components/CRM_Module/MCAS/McasAdminComponent.vue', 'src/components/CRM_Module/MCAS/McasComponent.vue', 'src/components/CRM_Module/MCAS/McasMatrizEditor.vue']) {
    assert.match(leer(ruta), /e\.preventDefault\(\)/, ruta);
  }
});

test('los diálogos dicen Aceptar/Cancelar, Cancelar a la izquierda y el foco en Cancelar si la acción es peligrosa', async () => {
  const { conValoresAura } = await import(pathToFileURL(path.join(raiz, 'src/services/dialogos.js')).href);
  assert.deepEqual(conValoresAura([{ title: 'Hecho', icon: 'success' }]), { title: 'Hecho', icon: 'success', confirmButtonText: 'Aceptar' });
  const borrar = conValoresAura([{ title: '¿Eliminar?', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar' }]);
  assert.equal(borrar.confirmButtonText, 'Sí, eliminar');
  assert.equal(borrar.cancelButtonText, 'Cancelar');
  assert.equal(borrar.reverseButtons, true);
  assert.equal(borrar.focusCancel, true);
  // Lo que el diálogo dice a mano se respeta
  assert.equal(conValoresAura([{ showCancelButton: true, reverseButtons: false }]).reverseButtons, false);
  // Forma corta y toasts
  assert.deepEqual(conValoresAura(['Error', 'No se pudo', 'error']), { title: 'Error', html: 'No se pudo', icon: 'error', confirmButtonText: 'Aceptar' });
  assert.deepEqual(conValoresAura([{ toast: true, title: 'Copiado' }]), { toast: true, title: 'Copiado' });
});

test('Cancelar y Cerrar en los modales y avisos van en gris visible, no en blanco', () => {
  const css = leer(BOTONES_CSS);
  assert.match(css, /--aura-btn-cancelar-fondo: #[0-9a-f]{6};/);
  assert.match(regla(css, ':is(.btn, .btn-modern, .btn-compact):is(.btn-cancel, .btn-cancelar, .btn-secondary):not(#aura-boton)'), /var\(--aura-btn-cancelar-fondo\)/);
  assert.match(regla(css, '.swal2-styled:is(.swal2-cancel, .swal2-deny)', 'background:'), /var\(--aura-btn-cancelar-fondo\)/);
});

test('los puntos del cliente caben en el modal a 1280 px sin fijar Acciones', () => {
  const css = sinComentarios(leer('src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.css'));
  assert.match(css, /@media \(max-width: 1300px\) \{[\s\S]*\.cups-cell,\s*\.cups-cell \.btn-cups-link \{\s*font-size: 0\.72rem;/);
  assert.match(leer('src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue'), /data-table data-table--acciones-fijas/);
});

test('el panel de notas del cliente conserva un histórico útil con poca altura', () => {
  const css = sinComentarios(leer('src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.css'));
  assert.match(css, /@media \(max-height: 900px\) \{\s*\.tp-notas-layout \{\s*overflow-y: auto;/);
  assert.match(css, /\.tp-notas-history \{\s*flex: none;\s*min-height: 360px;/);
  assert.match(css, /\.tp-prioridad-4 \{/);
});

