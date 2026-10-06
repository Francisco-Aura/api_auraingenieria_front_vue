// Revisión visual del 15/09/2026: todos los modales comparten cabecera, pestañas y capa de fondo.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const MODALES = [
  'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue',
  'src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue',
  'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue',
  'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue',
  'src/components/CRM_Module/Tareas/TareaModalCorporativo.vue',
  'src/components/CRM_Module/Tareas/TareaDetalleModal.vue',
  'src/components/CRM_Module/Tareas/TareaAuditoriaModal.vue',
  'src/components/CRM_Module/Tareas/NotificacionesComponent.vue',
  'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
  'src/components/CRM_Module/MCAS/McasComponent.vue',
];

test('todas las cabeceras de modal usan la cabecera común de Aura', () => {
  for (const ruta of MODALES) {
    const plantilla = leer(ruta).split('<script')[0];
    const cabeceras = plantilla.match(/<div class="(?:modal-header|mcas-modal-header|tareas-panel-header)[^"]*"/g) || [];
    assert.ok(cabeceras.length > 0, `${ruta} no tiene cabecera de modal`);
    for (const cabecera of cabeceras) {
      assert.match(cabecera, /aura-modal-header/, `${ruta}: ${cabecera}`);
    }
  }
});

test('los formularios con varias pantallas usan pestañas numeradas', () => {
  for (const ruta of [
    'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue',
    'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue',
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  ]) {
    const plantilla = leer(ruta);
    assert.match(plantilla, /class="aura-pestanas"/, ruta);
    assert.doesNotMatch(plantilla, /class="form-tabs"/, ruta);
  }
});

test('«Tareas y actividad» del cliente es un botón de la cabecera, no una píldora naranja', () => {
  const plantilla = leer('src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue');
  assert.match(plantilla, /class="aura-modal-header__boton"[\s\S]{0,200}Tareas y actividad/);
  assert.doesNotMatch(plantilla, /btn-tareas-actividad/);
});

test('la capa oscura de los modales ocupa exactamente la pantalla y no dibuja un marco', () => {
  const css = leer('src/assets/styles.css');
  const regla = css.match(/\n\.modal-overlay \{([^}]*)\}/);
  assert.ok(regla, 'falta la regla global .modal-overlay');
  const declaraciones = regla[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(declaraciones, /inset:\s*0/);
  assert.doesNotMatch(declaraciones, /130vw|120vh|border/);
});

test('el modal de todas las notificaciones se pinta en <body>, fuera de la barra superior', () => {
  const plantilla = leer('src/components/CRM_Module/Tareas/NotificacionesComponent.vue');
  assert.match(plantilla, /<Teleport to="body">\s*<div v-if="modalTodasNotificaciones" class="modal-overlay"/);
});

test('los textarea usan la letra de la aplicación, no la monoespaciada del navegador', () => {
  assert.match(leer('src/styles/shared-ui.css'), /\ntextarea \{\s*font-family: inherit;/);
});

test('servicios titula el modal según lo que se hace y muestra primero el CIF del cliente', () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/ModalServicios.vue', {
    axios: { get: async () => ({ data: [] }) },
  });
  const ctx = crearContexto(componente, { cliente: { nombre: 'Cliente Demo', cif: ' B12345678 ', dniAutorizado: '12345678Z' } });
  const titulo = (estado) => componente.computed.tituloModal.call({ ...ctx, ...estado });

  assert.equal(titulo({ mostrandoFormulario: false }), 'Gestión de servicios');
  assert.equal(titulo({ mostrandoFormulario: true, modoEdicion: false, modoRenovacion: false }), 'Nuevo servicio');
  assert.equal(titulo({ mostrandoFormulario: true, modoEdicion: true }), 'Modificar servicio');
  assert.equal(titulo({ mostrandoFormulario: true, modoEdicion: false, modoRenovacion: true }), 'Renovar servicio');
  assert.equal(componente.computed.cifCliente.call(ctx), 'B12345678');
  assert.equal(componente.computed.cifCliente.call({ cliente: { dniAutorizado: '12345678Z' } }), '12345678Z');
});

test('el FEE del contrato no se marca obligatorio: solo lo piden las reglas sobre FEE', () => {
  const plantilla = leer('src/components/CRM_Module/PuntosSuministro/ModalContratos.vue');
  const etiqueta = plantilla.match(/FEE del contrato([\s\S]*?)<\/label>/);
  assert.ok(etiqueta, 'falta la etiqueta del FEE');
  assert.doesNotMatch(etiqueta[1], /class="required"/);
});

test('Comisiones MCAS explica en tres pasos qué crea cada acción', () => {
  const plantilla = leer('src/components/CRM_Module/MCAS/McasComponent.vue');
  const guia = plantilla.match(/<ol class="mcas-guia"[\s\S]*?<\/ol>/);
  assert.ok(guia, 'falta la guía de Comisiones MCAS');
  assert.equal((guia[0].match(/class="mcas-guia-paso"/g) || []).length, 3);
  assert.match(guia[0], /Guarde el contrato/);
  assert.match(guia[0], /se crea el servicio de comisión/);
  assert.match(guia[0], /Si la rechaza, se abre la edición/);
  assert.doesNotMatch(guia[0], /no se crea nada/);
});
