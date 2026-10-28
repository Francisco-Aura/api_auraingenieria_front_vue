// Revisión visual del 15/09/2026 (2): botones comunes estilo Material limpio y pies de formulario fijos.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer } = require('./helpers/sfc');

const CSS_BOTONES = 'src/styles/shared-buttons.css';

/** Declaraciones (sin comentarios) de las reglas cuyo selector contiene `trozo`. */
function reglas(css, trozo) {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return limpio.split('}').filter(b => b.split('{')[0].includes(trozo)).map(b => b.split('{')[1]);
}

/** La primera regla cuyo selector contiene `trozo` (y, si se indica, que declara `propiedad`). */
function regla(css, trozo, propiedad = '') {
  const bloque = reglas(css, trozo).find(b => b.includes(propiedad));
  assert.ok(bloque, `falta la regla con ${trozo}`);
  return bloque;
}

test('la hoja de botones comunes se carga después del resto de estilos globales', () => {
  const main = leer('src/main.js');
  const posicion = (hoja) => main.indexOf(`import './styles/${hoja}'`);
  assert.ok(posicion('shared-buttons.css') > posicion('shared-modal-header.css'), 'shared-buttons.css debe importarse la última');
  assert.ok(posicion('shared-modal-header.css') > posicion('shared-ui.css'));
});

test('todos los botones de acción tienen la misma altura, letra y esquinas', () => {
  const base = regla(leer(CSS_BOTONES), '.btn-danger');
  assert.match(base, /height:\s*var\(--aura-btn-alto\)\s*!important/);
  assert.match(base, /font-size:\s*0\.875rem\s*!important/);
  assert.match(base, /border-radius:\s*var\(--aura-btn-radio\)\s*!important/);
  assert.match(base, /transform:\s*none\s*!important/);
});

test('Cancelar y Anterior son neutros; el rojo queda para dar de baja o eliminar', () => {
  const css = leer(CSS_BOTONES);
  const colores = regla(css, ':root');
  assert.match(colores, /--aura-btn-neutro-fondo:\s*#fff;/);
  assert.match(colores, /--aura-btn-peligro-texto:\s*#a32d2d;/);
  const neutro = regla(css, '.btn-cancel, .btn-cancelar, .btn-secondary, .btn-back', 'background:');
  assert.match(neutro, /background:\s*var\(--aura-btn-neutro-fondo\)\s*!important/);
  assert.doesNotMatch(neutro, /danger|#dc3545|#c82333/);
  assert.match(regla(css, '.btn-danger, .btn-danger-soft', 'background:'), /var\(--aura-btn-peligro-fondo\)/);

  for (const ruta of [
    'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue',
    'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue',
  ]) {
    const anterior = leer(ruta).match(/<button[^>]*class="([^"]*)"[^>]*>\s*<i class="fas fa-arrow-left"><\/i> Anterior/);
    assert.ok(anterior, `${ruta}: falta el botón Anterior`);
    assert.match(anterior[1], /\bbtn-back\b/, `${ruta}: Anterior debe ser btn-back`);
  }
});

test('los iconos de acción de las tablas son cuadrados en tono suave del mismo tamaño', () => {
  const css = leer(CSS_BOTONES);
  const base = regla(css, '.btn-icon:is(');
  assert.match(base, /width:\s*32px\s*!important/);
  assert.match(base, /border-radius:\s*8px\s*!important/);
  assert.match(regla(css, '.btn-icon.btn-edit'), /background:\s*#e6f1fb\s*!important/);
  assert.match(regla(css, '.btn-icon:is(.btn-delete'), /background:\s*#fcebeb\s*!important/);
});

test('los botones del pie de los formularios de cliente y punto de suministro siempre se ven', () => {
  for (const ruta of [
    'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.css',
    'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.css',
  ]) {
    const pie = regla(leer(ruta), '.tab-content > .tab-navigation');
    assert.match(pie, /position:\s*sticky/, ruta);
    assert.match(pie, /bottom:\s*0/, ruta);
  }
  // En el punto de suministro, el pie de la pestaña 1 es .modal-footer: también fijo
  const ps = regla(leer('src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.css'), '.tab-content > .modal-footer');
  assert.match(ps, /position:\s*sticky/);
});

test('los diálogos de confirmación usan la misma forma de botón y Cancelar neutro', () => {
  const css = leer(CSS_BOTONES);
  assert.match(regla(css, '.swal2-actions .swal2-styled', 'height'), /height:\s*var\(--aura-btn-alto\)/);
  assert.match(regla(css, '.swal2-confirm[style*="252, 215, 0"]'), /color:\s*var\(--aura-btn-principal-texto\)/);
  assert.match(regla(css, '.swal2-styled:is(.swal2-cancel, .swal2-deny)', 'background:'), /var\(--aura-btn-cancelar-fondo\)/);
});

test('los diálogos no fuerzan la visualización de botones ocultos ni usan el morado de SweetAlert', () => {
  const css = leer(CSS_BOTONES);
  assert.doesNotMatch(regla(css, '.swal2-actions .swal2-styled', 'height'), /display:/);
  assert.match(regla(css, '.swal2-confirm:not([style*="background-color"])'), /var\(--aura-btn-principal-fondo\)/);
  assert.match(leer('src/components/CRM_Module/Tareas/TareasComponent.vue'), /confirmButtonText: 'Sí, eliminar',\s*confirmButtonColor: '#d33'/);
});

test('el pie del formulario de Administración también queda fijo abajo', () => {
  const pie = regla(leer('src/components/CRM_Module/Administracion/AdministracionComponent.css'), 'form.modal-body > .modal-footer');
  assert.match(pie, /position:\s*sticky/);
  assert.match(pie, /bottom:\s*0/);
});
