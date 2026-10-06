const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const postcss = require('postcss');
const { parse } = require('@vue/compiler-sfc');

const projectRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

function loadTemplate(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  const { descriptor, errors } = parse(read(relativePath), { filename });
  assert.deepEqual(errors, []);
  return descriptor.template.content;
}

function loadCss(relativePath) {
  return postcss.parse(read(relativePath), { from: relativePath });
}

function loadComponent(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  const { descriptor, errors } = parse(read(relativePath), { filename });
  assert.deepEqual(errors, []);
  const executable = descriptor.script.content
    .replace(/^import\s+.*;\s*$/gm, '')
    .replace('export default', 'return');
  return Function('axios', 'Spinner', 'jsPDF', executable)({}, {}, class {});
}

function createContext(component, overrides = {}) {
  const context = {
    ...component.data(),
    $refs: {},
    $swal: { fire() {} },
    ...overrides,
  };
  for (const [name, method] of Object.entries(component.methods)) {
    if (!(name in overrides)) context[name] = method.bind(context);
  }
  return context;
}

function declarations(css, selector, property) {
  const values = [];
  css.walkRules((rule) => {
    if (rule.selectors.includes(selector)) {
      rule.walkDecls(property, (declaration) => values.push(declaration.value));
    }
  });
  return values;
}

function hasDeclaration(css, selector, property, value) {
  return declarations(css, selector, property).includes(value);
}

test('No-Switching conserva la celda de tabla y centra mediante un contenedor interior', () => {
  const template = loadTemplate(
    'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
  );
  const css = loadCss(
    'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.css',
  );

  assert.doesNotMatch(template, /<td class="td-noswitching">\s*<(?:div|span) v-if=/);
  assert.match(
    template,
    /<td class="td-noswitching">\s*<div class="noswitching-cell-content">/,
  );
  assert.ok(!declarations(css, '.td-noswitching', 'display').includes('flex'));
  assert.ok(declarations(css, '.noswitching-cell-content', 'display').includes('flex'));
  assert.ok(declarations(css, '.noswitching-cell-content', 'align-items').includes('center'));
  assert.ok(declarations(css, '.noswitching-cell-content', 'justify-content').includes('center'));
});

test('las acciones de tarea comparten tamaño y alineación visual', () => {
  const template = loadTemplate(
    'src/components/CRM_Module/Tareas/TareaDetalleModal.vue',
  );
  const css = loadCss(
    'src/components/CRM_Module/Tareas/TareaDetalleModal.css',
  );

  assert.match(template, /estado-selector-container task-action-control/);
  assert.equal(
    (template.match(/btn-action-compact task-action-control/g) || []).length,
    2,
  );
  assert.ok(hasDeclaration(css, '.task-action-control', 'min-height', '40px'));
  assert.ok(hasDeclaration(css, '.task-action-control', 'border-radius', '9px'));
});

test('el cambio de estado es explícito y respeta movimiento reducido', () => {
  const template = loadTemplate(
    'src/components/CRM_Module/Tareas/TareaDetalleModal.vue',
  );
  const cssSource = read(
    'src/components/CRM_Module/Tareas/TareaDetalleModal.css',
  );

  assert.match(template, /class="motivo-cambio-container estado-cambio-panel"/);
  assert.match(template, /for="comentarioCambioEstado"/);
  assert.match(template, />\s*Aplicar cambio\s*</);
  assert.doesNotMatch(cssSource, /animation:\s*exchange(?:Rotate|Pulse)[^;]*infinite/);
  assert.match(cssSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('procesarArchivoContrato acepta un PDF válido y expone sus datos', () => {
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  );
  const context = createContext(component);
  const file = { name: 'contrato-2026.pdf', type: 'application/pdf', size: 2048 };

  const accepted = component.methods.procesarArchivoContrato.call(context, file);

  assert.equal(accepted, true);
  assert.equal(context.selectedFile, file);
  assert.equal(context.errorArchivoContrato, '');
});

test('procesarArchivoContrato rechaza archivos no PDF con feedback inline', () => {
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  );
  const context = createContext(component);
  const file = { name: 'contrato.docx', type: 'application/octet-stream', size: 2048 };

  const accepted = component.methods.procesarArchivoContrato.call(context, file);

  assert.equal(accepted, false);
  assert.equal(context.selectedFile, null);
  assert.equal(context.errorArchivoContrato, 'El archivo seleccionado debe ser un PDF.');
});

test('soltar un PDF procesa el archivo y limpia el estado de arrastre', () => {
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  );
  const context = createContext(component);
  const file = { name: 'contrato.pdf', type: 'application/pdf', size: 4096 };
  context.arrastrandoPdf = true;

  component.methods.onPdfDrop.call(context, { dataTransfer: { files: [file] } });

  assert.equal(context.arrastrandoPdf, false);
  assert.equal(context.selectedFile, file);
});

test('contratos y servicios desplazan solo el cuerpo y mantienen visible el pie', () => {
  const stylesheets = [
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.css',
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.css',
  ];

  for (const stylesheet of stylesheets) {
    const css = loadCss(stylesheet);
    assert.ok(hasDeclaration(css, '.main-content-container', 'min-height', '0'));
    assert.ok(hasDeclaration(css, '.form-content', 'display', 'flex'));
    assert.ok(hasDeclaration(css, '.form-content', 'flex-direction', 'column'));
    assert.ok(hasDeclaration(css, '.form-content', 'overflow', 'hidden'));
    assert.ok(hasDeclaration(css, '.form-content', 'min-height', '0'));
    assert.ok(hasDeclaration(css, '.modern-form', 'overflow', 'hidden'));
    assert.ok(hasDeclaration(css, '.modern-form', 'min-height', '0'));
    assert.ok(hasDeclaration(css, '.form-grid-modern', 'overflow-y', 'auto'));
    assert.ok(hasDeclaration(css, '.form-grid-modern', 'min-height', '0'));
    assert.ok(hasDeclaration(css, '.modal-footer-modern', 'flex-shrink', '0'));
  }
});

test('los formularios de contratos y servicios usan grid responsive 3 2 1', () => {
  const stylesheets = [
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.css',
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.css',
  ];

  for (const stylesheet of stylesheets) {
    const css = loadCss(stylesheet);
    const columns = declarations(css, '.form-grid-modern', 'grid-template-columns');
    assert.ok(columns.includes('repeat(3, 1fr)'));
    assert.ok(columns.includes('repeat(2, minmax(0, 1fr))'));
    assert.ok(columns.includes('minmax(0, 1fr)'));
  }
});

test('las zonas de adjuntos de tareas tienen semántica accesible y control de selección por teclado', () => {
  const template = loadTemplate(
    'src/components/CRM_Module/Tareas/TareaModalCorporativo.vue',
  );

  assert.match(template, /class="adjuntos-drop-zone"[\s\S]*role="region"/);
  assert.match(template, /aria-describedby="adjuntos-drop-zone-hint"/);
  assert.match(template, /id="adjuntos-drop-zone-hint"/);
  assert.match(template, /<button type="button" class="btn-adjuntar-crear"/);
});

test('las animaciones de drag and drop respetan prefers-reduced-motion', () => {
  const cssSource = read(
    'src/components/CRM_Module/Tareas/TareaModalCorporativo.css',
  );

  assert.match(cssSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(cssSource, /\.drag-activo \.drop-zone-icon[\s\S]*animation:\s*none\s*!important/);
});

test('soltar sin dataTransfer no rompe los adjuntos de tareas', () => {
  const corporativo = read(
    'src/components/CRM_Module/Tareas/TareaModalCorporativo.vue',
  );
  const detalle = read(
    'src/components/CRM_Module/Tareas/TareaDetalleModal.vue',
  );

  assert.match(corporativo, /Array\.from\(event\?\.dataTransfer\?\.files \|\| \[\]\)/);
  assert.match(detalle, /Array\.from\(event\?\.dataTransfer\?\.files \|\| \[\]\)/);
});

test('los informes muestran fechas dd/mm/aaaa, cabeceras con tilde y el mismo título que su tarjeta', () => {
  const source = read('src/components/CRM_Module/Informes/InformesComponent.vue');
  assert.match(source, /return `\$\{dia\}\/\$\{mes\}\/\$\{anio\}`/);
  assert.match(source, /direccion: 'Dirección'/);
  assert.match(source, /codigoPostal: 'Código Postal'/);
  assert.match(source, /'puntos-suministro-sin-contrato': 'Puntos de Suministro sin Contrato'/);
  assert.match(source, /this\.tituloInforme = this\.tituloVisible\(tipo\)/);
});
