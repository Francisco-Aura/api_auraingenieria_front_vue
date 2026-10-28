// Revisión visual del 15/09/2026 (3): detalles que separan una aplicación profesional de una amateur.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const CLIENTES = 'src/components/CRM_Module/Clientes/ClientesComponent.vue';
const FORM_CLIENTE = 'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue';
const PS_LISTA = 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
const PS_FORM = 'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';
const PS_FORM_CSS = 'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.css';
const SERVICIOS = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';
const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const CABECERA_CSS = 'src/styles/shared-modal-header.css';
const BOTONES_CSS = 'src/styles/shared-buttons.css';
const DASHBOARD = 'src/components/DashboardComponent.vue';
const DASHBOARD_CSS = 'src/components/DashboardComponent.css';
const MCAS = 'src/components/CRM_Module/MCAS/McasComponent.vue';

const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Primera regla cuyo selector contiene `trozo` (acabado en " {": cuyo selector termina así) y declara `propiedad`. */
function regla(css, trozo, propiedad = '') {
  const coincide = (selector) => (trozo.endsWith(' {') ? selector.trim().endsWith(trozo.slice(0, -2)) : selector.includes(trozo));
  const bloque = sinComentarios(css).split('}').find(b => coincide(b.split('{')[0]) && b.includes(propiedad));
  assert.ok(bloque, `falta la regla con ${trozo}`);
  return bloque.split('{')[1];
}

test('al abrir el formulario de cliente no quedan marcados los errores de la vez anterior', () => {
  const componente = cargarComponente(FORM_CLIENTE);
  const ctx = crearContexto(componente, { modoActualizar: true, nuevoCliente: { id: 5, nombre: 'Cliente Demo' } });
  ctx.errores = { nombre: 'Nombre es obligatorio', cif: 'CIF es obligatorio' };

  componente.watch.formularioVisible.call(ctx, true);

  assert.deepEqual(ctx.errores, {});
});

test('el lápiz de un cliente dice lo que hace: modificar', () => {
  const lapiz = leer(CLIENTES).match(/<button class="btn-icon btn-edit"[^>]*>/);
  assert.ok(lapiz);
  assert.match(lapiz[0], /title="Modificar cliente"/);
  assert.match(lapiz[0], /aria-label="Modificar cliente"/);
});

test('en Puntos de Suministro cada acción tiene su color: consultar, modificar, contratos, servicios y eliminar', () => {
  const plantilla = leer(PS_LISTA);
  assert.match(plantilla, /class="btn-icon btn-contracts"[^>]*title="Gestión de contratos"/);
  assert.match(plantilla, /class="btn-icon btn-services"[^>]*title="Gestión de servicios"/);
  const css = leer(BOTONES_CSS);
  const color = (clase) => {
    const bloque = sinComentarios(css).split('}').find((b) => {
      const selector = b.split('{')[0];
      // Con el contorno el fondo es blanco en todos: la acción la distingue el color del icono y del borde
      return new RegExp(`\\.${clase}(?![\\w-])`).test(selector) && !selector.includes(':hover') && /(?:^|[;{\s])color:\s*#/.test(b);
    });
    assert.ok(bloque, `sin color para ${clase}`);
    return bloque.match(/(?:^|[;{\s])color:\s*(#[0-9a-f]{6})/i)[1];
  };
  const colores = ['btn-view-details', 'btn-edit', 'btn-contracts', 'btn-services', 'btn-delete'].map(color);
  assert.equal(new Set(colores).size, colores.length, `colores repetidos: ${colores}`);
});

test('«Dar de baja» lleva el mismo icono en las dos pestañas del punto de suministro', () => {
  const plantilla = leer(PS_FORM);
  assert.doesNotMatch(plantilla, /fa-map-marker-times/, 'fa-map-marker-times no existe en Font Awesome 6');
  const iconos = [...plantilla.matchAll(/<i class="fas ([\w-]+)"><\/i> Dar de baja/g)].map(m => m[1]);
  assert.equal(iconos.length, 2);
  assert.equal(iconos[0], iconos[1]);
});

test('la casilla «Ejecutado por Aura» queda alineada con su texto', () => {
  const casilla = regla(leer(PS_FORM_CSS), '.checkbox-label-fv input[type="checkbox"]');
  assert.match(casilla, /margin:\s*0/);
  assert.match(regla(leer(PS_FORM_CSS), '.checkbox-label-fv {', 'display'), /margin-top:\s*0/);
});

test('los datos de la cabecera (DNI/CIF, CUPS) se leen como etiquetas destacadas', () => {
  const css = leer(CABECERA_CSS);
  assert.match(regla(css, '.aura-dato {'), /background:/);
  assert.match(regla(css, '.aura-dato__etiqueta'), /text-transform:\s*uppercase/);
  for (const ruta of [CONTRATOS, SERVICIOS, PS_FORM]) {
    assert.match(leer(ruta), /<span[^>]*class="aura-dato"><span class="aura-dato__etiqueta">CUPS<\/span>/, ruta);
  }
});

test('la cabecera de las ventanas no se pierde al desplazar el contenido', () => {
  const cabecera = regla(leer(CABECERA_CSS), 'div.aura-modal-header.aura-modal-header {', 'display');
  assert.match(cabecera, /position:\s*sticky\s*!important/);
  assert.match(cabecera, /top:\s*0/);
});

test('el detalle del servicio separa etiqueta y valor y muestra los importes en euros', () => {
  const css = leer(CABECERA_CSS);
  const valor = regla(css, '.detalle-contrato-content .info-value');
  assert.match(valor, /justify-content:\s*flex-end/);
  assert.match(regla(css, '.detalle-contrato-content .info-label'), /text-transform:\s*none/);
  assert.doesNotMatch(leer(SERVICIOS), /\}\}€<\/span>/, 'importes sin formato (92.5€)');

  const componente = cargarComponente(SERVICIOS, { axios: { get: async () => ({ data: [] }) } });
  const ctx = crearContexto(componente);
  assert.equal(ctx.formatearEuros(92.5).replace(/\s/g, ' '), '92,50 €');
  assert.equal(ctx.formatearEuros(null).replace(/\s/g, ' '), '0,00 €');
});

test('los diálogos no muestran el azul por defecto: confirmar en amarillo y el resto neutro', () => {
  const css = leer(BOTONES_CSS);
  assert.match(regla(css, '.swal2-confirm[style*="48, 133, 214"]'), /var\(--aura-btn-principal-fondo\)/);
  assert.match(regla(css, '.swal2-styled:is(.swal2-cancel, .swal2-deny)', 'background:'), /var\(--aura-btn-cancelar-fondo\)/);
});

test('el menú lateral plegado centra su botón, usa iconos claros y deja ver los nombres', () => {
  const plantilla = leer(DASHBOARD);
  assert.match(plantilla, /sidebarCollapsed \? 'fa-bars' : 'fa-angles-left'/);
  assert.match(plantilla, /:aria-label="sidebarCollapsed \? 'Expandir menú' : 'Contraer menú'"/);
  const css = leer(DASHBOARD_CSS);
  assert.doesNotMatch(regla(css, '.sidebar-collapsed .toggle-sidebar {'), /position:\s*absolute/);
  assert.match(regla(css, '.sidebar-collapsed .sidebar-header'), /justify-content:\s*center/);
  assert.match(regla(css, '.sidebar-collapsed .sidebar-menu'), /overflow:\s*visible/);
});

test('Comisiones MCAS filtra también por tipo e importe, alineados como el resto de columnas', () => {
  const plantilla = leer(MCAS);
  // Sin columna «Tipo» (30/09/2026): el tipo se filtra con el selector de la barra superior
  assert.match(plantilla, /@click="filtroEvento = op\.value"/);
  assert.match(plantilla, /<input v-model="columnFilters.importe" type="text" class="column-filter"/);
  assert.doesNotMatch(plantilla, /column-title--derecha/);

  const componente = cargarComponente(MCAS);
  const ctx = crearContexto(componente);
  ctx.propuestas = [
    { id: 1, idContrato: 10, estado: 'PENDIENTE_VALIDACION', tipoEvento: 'NUEVO_CONTRATO', importeAutomatico: 411.84 },
    { id: 2, idContrato: 11, estado: 'PENDIENTE_VALIDACION', tipoEvento: 'RENOVACION', importeAutomatico: 256.3 },
  ];
  ctx.columnFilters.importe = '411';
  assert.deepEqual(ctx.propuestasFiltradas.map(p => p.id), [1]);
});
