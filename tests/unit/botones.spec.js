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

test('los iconos de acción son cuadrados con contorno: fondo blanco, borde e icono del color de la acción', () => {
  const css = leer(CSS_BOTONES);
  const base = regla(css, '.btn-icon:is(');
  assert.match(base, /width:\s*32px\s*!important/);
  assert.match(base, /border-radius:\s*8px\s*!important/);
  assert.match(base, /background:\s*#fff\s*!important/);
  assert.match(base, /border:\s*1\.5px solid currentColor\s*!important/);
  assert.match(base, /font-size:\s*1\.05rem\s*!important/, 'icono de 15 px (antes 13 px)');
});

test('cada acción lleva su color original de PRO, igual en tablas y modales', () => {
  const css = leer(CSS_BOTONES);
  const color = (trozo) => regla(css, trozo, 'color:').match(/(?:^|[;\s])color:\s*(#[0-9a-f]{6})/i)[1].toLowerCase();
  assert.equal(color('.btn-icon.btn-edit:not'), '#2196f3');
  assert.equal(color('.btn-icon.btn-view-details:not'), '#0062cc', 'más oscuro que editar: en Puntos van juntos');
  assert.equal(color('.btn-icon:is(.btn-view, .btn-approve):not'), '#43a047');
  assert.equal(color('.btn-icon.btn-contracts:not'), '#43a047');
  assert.equal(color('.btn-icon:is(.btn-add, .btn-renew, .btn-services):not'), '#ff9800');
  assert.equal(color('.btn-icon:is(.btn-delete, .btn-reject):not'), '#dc3545');
  assert.equal(color('.btn-icon:is(.btn-download, .btn-payment):not'), '#0f766e');
  assert.equal(color('.btn-icon.btn-archive:not'), '#495057');
  // Ni rastro de los cuadrados pastel ni de colores propios dentro de los modales
  assert.doesNotMatch(reglas(css, '.btn-icon').join('\n'), /#e6f1fb|#eaf3de|#faeeda|#fcebeb|#e1f5ee|#eeedfe|#fdf0dd/);
  assert.doesNotMatch(css, /\.modal[\w-]*\s+\.btn-icon/);
});

test('al pasar el ratón el botón se rellena de su tono suave, sin moverse', () => {
  const css = leer(CSS_BOTONES);
  const hover = (trozo) => regla(css, trozo + ':not(#aura-boton):hover', 'background');
  assert.match(hover('.btn-icon.btn-edit'), /background:\s*#e9f4fe\s*!important/);
  assert.match(hover('.btn-icon:is(.btn-delete, .btn-reject)'), /background:\s*#fcebec\s*!important/);
  for (const b of reglas(css, '.btn-icon:is(.btn-edit').filter(r => r.includes('transform'))) {
    assert.match(b, /transform:\s*none/);
  }
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
