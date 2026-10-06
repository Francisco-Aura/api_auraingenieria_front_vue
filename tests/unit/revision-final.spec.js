// Revisión final del 16/09/2026: peticiones del usuario tras la auditoría integral.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const TAREA_DETALLE = 'src/components/CRM_Module/Tareas/TareaDetalleModal.vue';
const TAREA_DETALLE_CSS = 'src/components/CRM_Module/Tareas/TareaDetalleModal.css';
const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const UI_CSS = 'src/styles/shared-ui.css';
const PS = 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
const TAREAS = 'src/components/CRM_Module/Tareas/TareasComponent.vue';

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function regla(css, selector) {
  const bloque = sinComentarios(css).split('}').find(b => b.split('{')[0].trim().endsWith(selector));
  assert.ok(bloque, `falta la regla ${selector}`);
  return bloque.split('{')[1];
}

// ---------------------------------------------------------------- cambiar estado

test('elegir un estado por error se puede deshacer sin cerrar la tarea', () => {
  const componente = cargarComponente(TAREA_DETALLE, { axios: {} });
  const ctx = crearContexto(componente, { tarea: { id: 7, estadoId: 2 } });
  ctx.estadoSeleccionado = 3;
  ctx.comentarioCambioEstado = 'me he equivocado';
  ctx.esEstadoBloqueado = true;

  ctx.cancelarCambioEstado();

  assert.equal(ctx.estadoSeleccionado, null);
  assert.equal(ctx.comentarioCambioEstado, '');
  assert.equal(ctx.esEstadoBloqueado, false);
});

test('el desplegable deja volver a «Cambiar estado» y el panel ofrece cancelar', () => {
  const plantilla = leer(TAREA_DETALLE);
  const opcion = plantilla.match(/<option :value="null"[^>]*>Cambiar estado<\/option>/);
  assert.ok(opcion, 'no se encuentra la opción «Cambiar estado»');
  assert.doesNotMatch(opcion[0], /disabled/, 'con «disabled» no se puede deshacer la elección');
  assert.match(plantilla, /@click="cancelarCambioEstado"/);
});

test('el control de cambiar estado mide y se dibuja como los botones de al lado', () => {
  const css = leer(TAREA_DETALLE_CSS);
  assert.doesNotMatch(css, /rgba\(black\)/, 'declaraciones rotas que el navegador descarta');
  const contenedor = regla(css, '.estado-selector-container');
  assert.match(contenedor, /height: *var\(--aura-btn-alto\)/);
  assert.match(contenedor, /border-radius: *var\(--aura-btn-radio\)/);
  assert.doesNotMatch(contenedor, /translateY/);
  assert.match(regla(css, '.select-cambiar-estado'), /text-align: *center/);
});

// ---------------------------------------------------------------- modal de contrato

test('el contrato se rellena en dos pantallas, no en tres', () => {
  const plantilla = leer(CONTRATOS);
  const pestanas = plantilla.match(/const PESTANAS_CONTRATO = \[([\s\S]*?)\];/);
  assert.ok(pestanas);
  const ids = [...pestanas[1].matchAll(/id: '([a-z]+)'/g)].map(m => m[1]);
  assert.deepEqual(ids, ['contrato', 'mcas']);
  assert.doesNotMatch(plantilla, /pestanaContrato === 'documento'/);
});

test('las observaciones y el PDF viven en la primera pantalla', () => {
  const plantilla = leer(CONTRATOS);
  const panel = plantilla.split(`v-show="pestanaContrato === 'contrato'"`)[1]
    .split(`v-show="pestanaContrato === 'mcas'"`)[0];
  assert.match(panel, /<h3>Observaciones y renovación<\/h3>/);
  assert.match(panel, /<h3>Documento del contrato<\/h3>/);
  assert.match(panel, /id="comentarioRenovacion"/);
  assert.match(panel, /id="contrato-pdf-input"/);
});

// ---------------------------------------------------------------- columna de acciones

test('en las tablas anchas la columna de acciones se queda fija a la derecha', () => {
  const css = leer(UI_CSS);
  const celda = regla(css, '.data-table--acciones-fijas :is(th, td):last-child:not(#aura-tabla)');
  assert.match(celda, /position: *sticky/);
  assert.match(celda, /right: *0/);
  for (const ruta of [PS, TAREAS]) {
    assert.match(leer(ruta), /class="data-table data-table--acciones-fijas"/, ruta);
  }
});

test('la columna fija tapa el contenido que pasa por debajo, no se transparenta', () => {
  const css = leer(UI_CSS);
  // Sin fondo propio, las filas rayadas y el hover se verían a través de la celda fija.
  assert.match(regla(css, '.data-table--acciones-fijas tbody tr td:last-child:not(#aura-tabla)'), /background/);
  assert.match(regla(css, '.data-table--acciones-fijas tbody tr:nth-child(even) td:last-child:not(#aura-tabla)'), /background/);
  assert.match(regla(css, '.data-table--acciones-fijas tbody tr:hover td:last-child:not(#aura-tabla)'), /background/);
});

test('nada deja un transform en las filas: anularía la columna fija', () => {
  const css = leer(UI_CSS);
  assert.match(regla(css, '.data-table--acciones-fijas tbody tr'), /animation-name: *auraFilaAparece/);
  const animacion = sinComentarios(css).split('@keyframes auraFilaAparece')[1].split('}')[1];
  assert.ok(animacion !== undefined);
  assert.doesNotMatch(sinComentarios(css).split('@keyframes auraFilaAparece')[1].slice(0, 120), /transform/);
});

test('la tabla no se recorta a sí misma: eso anularía la columna fija', () => {
  // «overflow: hidden» sobre <table> la convierte en contenedor de scroll y las
  // celdas sticky dejan de fijarse, sin ningún aviso.
  const bloque = regla(leer('src/App.css'), '.data-table');
  assert.doesNotMatch(bloque, /overflow/);
});
