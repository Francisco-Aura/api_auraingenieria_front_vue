// Auditoría final de la interfaz: contraste, movimiento, estados y teclado.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer } = require('./helpers/sfc');

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

test('las etiquetas de estado eligen letra blanca u oscura según su color', async () => {
  const { colorTextoSobre } = await import(pathToFileURL(path.join(raiz, 'src/utils/colores.js')).href);
  // Colores de los estados de la base de datos
  assert.equal(colorTextoSobre('#F39C12'), '#1f2a36'); // Pendiente
  assert.equal(colorTextoSobre('#27AE60'), '#1f2a36'); // Completada
  assert.equal(colorTextoSobre('#2980B9'), '#fff'); // En Progreso
  assert.equal(colorTextoSobre('#C0392B'), '#fff'); // Bloqueada
  assert.equal(colorTextoSobre('rgb(252, 215, 0)'), '#1f2a36');
  // Sin color o con uno que no se entiende, blanco como antes
  assert.equal(colorTextoSobre(null), '#fff');
  assert.equal(colorTextoSobre('rojo'), '#fff');
  for (const ruta of ['src/components/CRM_Module/Tareas/TareasComponent.vue', 'src/components/CRM_Module/Tareas/TareaDetalleModal.vue',
    'src/components/CRM_Module/Tareas/TareaAuditoriaModal.vue', 'src/components/CRM_Module/Tareas/TareasCalendarioView.vue',
    'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue']) {
    assert.match(leer(ruta), /color: colorTextoSobre\(/, ruta);
  }
});

test('los paneles y las tarjetas que no se pulsan no se elevan al pasar el ratón', () => {
  assert.doesNotMatch(sinComentarios(leer('src/App.css')), /\.card:hover/);
  assert.doesNotMatch(sinComentarios(leer('src/assets/styles.css')), /\.btn:hover\s*\{[^}]*translateY/);
  for (const ruta of ['src/components/CRM_Module/Clientes/ClientesComponent.css', 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.css',
    'src/components/CRM_Module/Administracion/AdministracionComponent.css']) {
    assert.doesNotMatch(sinComentarios(leer(ruta)), /\.stat-card:hover/, ruta);
  }
  // Las de Comisiones MCAS sí filtran
  assert.match(sinComentarios(leer('src/components/CRM_Module/MCAS/McasShared.css')), /\.stat-card--filtro:hover \{\s*transform: translateY\(-2px\)/);
});

test('los iconos del detalle de tarea no crecen al pasar el ratón ni reaccionan desactivados', () => {
  const css = sinComentarios(leer('src/components/CRM_Module/Tareas/TareaDetalleModal.css'));
  assert.doesNotMatch(css, /scale\(1\.1[58]\)/);
  assert.doesNotMatch(css, /rotate\(180deg\)/);
  assert.match(css, /\.btn-eliminar-comentario:hover:not\(:disabled\) \{/);
  assert.doesNotMatch(css, /font-family: 'Segoe UI'/);
});

test('todos los modales tienen las mismas esquinas y la misma entrada', () => {
  const cabecera = sinComentarios(leer('src/styles/shared-modal-header.css'));
  assert.match(cabecera, /\.modal-comentario-renovacion\):not\(#aura-esquinas\) \{\s*border-radius: 12px;/);
  for (const ruta of ['src/components/CRM_Module/PuntosSuministro/ModalContratos.css', 'src/components/CRM_Module/PuntosSuministro/ModalServicios.css',
    'src/components/CRM_Module/Tareas/TareaAuditoriaModal.css']) {
    assert.doesNotMatch(sinComentarios(leer(ruta)), /animation: (modalFadeIn|slideIn) 0\.3s/, ruta);
  }
  // Los dos avisos propios (Tareas y Notificaciones) entran igual
  assert.match(sinComentarios(leer('src/styles/shared-motion.css')), /\.snackbar:not\(#aura-mov\) \{\s*animation: auraAvisoEntra/);
  // «Confirmar» al completar una tarea es el botón principal común
  assert.match(leer('src/components/CRM_Module/Tareas/TareaDetalleModal.vue'), /class="btn btn-confirm btn-confirmar-completar"/);
});

test('el indicador de carga no anima el desenfoque ni la sombra y no parpadea en cargas rápidas', () => {
  const css = sinComentarios(leer('src/components/SpinnerComponent.css'));
  assert.match(css, /animation: auraFundido 0\.2s ease-out 0\.15s backwards;/);
  assert.doesNotMatch(css, /@keyframes overlayFadeIn/);
  const pulso = css.match(/@keyframes corePulse \{([\s\S]*?)\n\}/)[1];
  assert.doesNotMatch(pulso, /box-shadow/);
});

test('los campos desactivados se ven en gris en todos los formularios', () => {
  assert.match(sinComentarios(leer('src/styles/shared-modern-forms.css')), /\.form-select-modern:disabled \{\s*background-color: #f3f4f6;/);
  assert.match(sinComentarios(leer('src/components/CRM_Module/Tareas/TareaModalCorporativo.css')), /\.form-control:disabled:hover \{\s*background: #f3f4f6;/);
});

test('cabeceras ordenables y tarjetas que se pulsan funcionan también con el teclado', () => {
  for (const ruta of ['src/components/CRM_Module/Clientes/ClientesComponent.vue', 'src/components/CRM_Module/Tareas/TareasComponent.vue',
    'src/components/CRM_Module/MCAS/McasComponent.vue', 'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
    'src/components/CRM_Module/Informes/InformesComponent.vue', 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue']) {
    const vue = leer(ruta);
    const titulos = vue.match(/<div class="column-title"[^>]*@click="[^"]*sortBy[^>]*>/g) || [];
    assert.ok(titulos.length > 0, ruta);
    for (const t of titulos) assert.match(t, /tabindex=/, `${ruta}: ${t.slice(0, 80)}`);
  }
  assert.match(leer('src/components/CRM_Module/Administracion/AdministracionComponent.vue'), /class="table-card"[\s\S]{0,200}role="button"\s+tabindex="0"/);
  assert.equal((leer('src/components/CRM_Module/Informes/InformesComponent.vue').match(/class="card informe-card"[^>]*role="button" tabindex="0"/g) || []).length, 7);
  assert.match(sinComentarios(leer('src/styles/shared-ui.css')), /\.column-title\[role="button"\]:focus-visible/);
});

test('Clientes cabe a 1280 px como Puntos y Tareas, con la fila vacía sin resaltar', () => {
  assert.match(leer('src/components/CRM_Module/Clientes/ClientesComponent.vue'), /<div class="table-responsive" v-desborde-tabla>\s*<table class="data-table data-table--acciones-fijas data-table--compacta">/);
  const ui = sinComentarios(leer('src/styles/shared-ui.css'));
  assert.match(ui, /\.data-table--compacta:not\(#aura-tabla\) thead \.column-title \{[^}]*min-height: 3\.7em;/);
  assert.match(ui, /\.data-table tbody tr:has\(> td > \.empty-state\):hover/);
  assert.match(ui, /\.data-table thead select\.column-filter:not\(#aura-tabla\) \{\s*padding: 0 2px 0 8px !important;/);
});

test('la columna fija de Acciones tiene el mismo color que su fila en todos los estados', () => {
  const ui = sinComentarios(leer('src/styles/shared-ui.css'));
  const fija = (estado) => {
    const re = new RegExp(`\\.tabla-desborda \\.data-table--acciones-fijas tbody ${estado} td:last-child:not\\(#aura-tabla\\) \\{\\s*background-color: (#[0-9a-f]{6});`);
    const m = ui.match(re);
    assert.ok(m, estado);
    return m[1];
  };
  // Equivalentes opacos, sobre blanco, de los colores rgba de cada fila
  assert.equal(fija('tr:hover'), '#fffdf2');
  assert.equal(fija('tr:is\\(\\.cliente-dado-baja, \\.punto-dado-baja, \\.tarea-vencida\\)'), '#fdf5f6');
  assert.equal(fija('tr:is\\(\\.cliente-dado-baja, \\.punto-dado-baja, \\.tarea-vencida\\):hover'), '#fcebec');
  assert.equal(fija('tr\\.tarea-fijada'), '#fffaeb');
  assert.equal(fija('tr\\.tarea-fijada:hover'), '#fff6da');
  // Las completadas no tienen tinte: sin color propio en la celda fija
  assert.doesNotMatch(ui, /tr\.tarea-completada td:last-child/);
  // Las bajas atenúan los datos, no la fila entera (la celda fija se volvía transparente)
  const estados = sinComentarios(leer('src/styles/shared-row-states.css'));
  assert.match(estados, /\.punto-dado-baja td:not\(:last-child\) \{\s*opacity: 0\.7;/);
  assert.doesNotMatch(estados, /\.punto-dado-baja \{\s*opacity/);
  // La mano solo sobre el título que ordena
  assert.match(ui, /\.data-table thead th\.sortable:not\(#aura-tabla\) \{\s*cursor: default;/);
});

test('detalles del calendario, las estadísticas y los comentarios editados', () => {
  const cal = sinComentarios(leer('src/components/CRM_Module/Tareas/TareasCalendarioView.css'));
  assert.match(cal, /\.dia-hoy \.dia-numero \{[^}]*margin-bottom: 3px;/);
  assert.match(leer('src/components/CRM_Module/Tareas/EstadisticasTareasComponent.vue'), /delayPromedioDias \|\| 0\)\.toLocaleString\('es-ES'/);
  assert.match(leer('src/components/CRM_Module/Tareas/TareaDetalleModal.vue'), /v-if="comentario\.editado && !comentario\.fechaEdicion" class="editado-badge"/);
});

test('nada se mueve al pasar el ratón salvo las tarjetas que se pulsan', () => {
  const fs = require('node:fs');
  // Botones con la apariencia común (shared-buttons.css la fija sin movimiento), tarjetas
  // pulsables, el indicador del menú y los fondos que aparecen (::before/::after)
  const permitido = /btn-(primary|create|save|confirm|cancel|cancelar|secondary|back|toggle-baja|toggle-completed|danger|danger-soft|success|warning|info|refresh|excel|outline|pagination)\b|informe-card|table-card|stat-card--filtro|menu-item|::before|::after|close-button/;
  const archivos = [];
  const recorrer = (dir) => fs.readdirSync(path.join(raiz, dir), { withFileTypes: true }).forEach((e) => {
    const ruta = `${dir}/${e.name}`;
    if (e.isDirectory()) recorrer(ruta); else if (ruta.endsWith('.css')) archivos.push(ruta);
  });
  recorrer('src');
  const malos = [];
  for (const ruta of archivos) {
    for (const [, selector, cuerpo] of sinComentarios(leer(ruta)).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const t = cuerpo.match(/transform:\s*([^;]*)/);
      if (!selector.includes(':hover') || !t || /none/.test(t[1]) || !/translate|scale|rotate/.test(t[1])) continue;
      if (!permitido.test(selector)) malos.push(`${ruta}: ${selector.trim()}`);
    }
  }
  assert.deepEqual(malos, []);
});
