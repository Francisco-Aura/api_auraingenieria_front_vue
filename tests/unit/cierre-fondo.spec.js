// Los modales se cerraban al seleccionar texto (o arrastrar la barra de desplazamiento) y soltar el
// ratón fuera: el navegador manda ese clic a la capa oscura, que es lo común a los dos sitios.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer } = require('./helpers/sfc');

const directiva = async () => (await import(pathToFileURL(path.join(raiz, 'src/directives/cierreFondo.js')).href)).default;

/** Capa oscura de mentira: solo lo que mira la directiva. */
function capa() {
  const oyentes = {};
  return {
    clientWidth: 1000,
    clientHeight: 700,
    addEventListener: (tipo, fn) => { oyentes[tipo] = fn; },
    removeEventListener: (tipo) => { delete oyentes[tipo]; },
    oyentes,
  };
}
const dentro = { nombre: 'contenido del modal' };

// El clic llega a la capa siempre que el gesto empieza o acaba en ella (es lo común a los dos sitios)
function pulsarYSoltar(el, { empieza, acaba, x = 10, y = 10 }) {
  el.oyentes.pointerdown({ target: empieza, offsetX: x, offsetY: y });
  el.oyentes.pointerup({ target: acaba });
  el.oyentes.click({ target: empieza === acaba ? acaba : el });
}

test('cierra al pulsar y soltar en el fondo', async () => {
  const v = await directiva();
  const el = capa();
  let cierres = 0;
  v.mounted(el, { value: () => cierres++ });
  pulsarYSoltar(el, { empieza: el, acaba: el });
  assert.equal(cierres, 1);
});

test('no cierra si se empieza dentro del modal y se suelta en el fondo (seleccionar texto)', async () => {
  const v = await directiva();
  const el = capa();
  let cierres = 0;
  v.mounted(el, { value: () => cierres++ });
  pulsarYSoltar(el, { empieza: dentro, acaba: el });
  assert.equal(cierres, 0);
  // Ni al revés: pulsar en el fondo y soltar dentro del modal
  pulsarYSoltar(el, { empieza: el, acaba: dentro });
  assert.equal(cierres, 0);
  // Un clic dentro del modal tampoco
  pulsarYSoltar(el, { empieza: dentro, acaba: dentro });
  assert.equal(cierres, 0);
});

test('no cierra al pulsar la barra de desplazamiento de la propia capa', async () => {
  const v = await directiva();
  const el = capa();
  let cierres = 0;
  v.mounted(el, { value: () => cierres++ });
  pulsarYSoltar(el, { empieza: el, acaba: el, x: 1005 });
  pulsarYSoltar(el, { empieza: el, acaba: el, y: 702 });
  assert.equal(cierres, 0);
});

test('usa siempre la función de cierre más reciente y deja de escuchar al desmontarse', async () => {
  const v = await directiva();
  const el = capa();
  const llamadas = [];
  v.mounted(el, { value: () => llamadas.push('primera') });
  v.updated(el, { value: () => llamadas.push('segunda') });
  pulsarYSoltar(el, { empieza: el, acaba: el });
  assert.deepEqual(llamadas, ['segunda']);
  v.unmounted(el);
  assert.deepEqual(Object.keys(el.oyentes), []);
});

test('ningún modal se cierra ya con un clic suelto en la capa', () => {
  const MODALES = {
    'src/components/CRM_Module/MCAS/McasAdminComponent.vue': 4,
    'src/components/CRM_Module/MCAS/McasComponent.vue': 1,
    'src/components/CRM_Module/MCAS/McasMatrizEditor.vue': 1,
    'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue': 1,
    'src/components/CRM_Module/Informes/InformesComponent.vue': 1,
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue': 1,
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue': 2,
    'src/components/CRM_Module/Tareas/NotificacionesComponent.vue': 1,
    'src/components/CRM_Module/Tareas/TareaAuditoriaModal.vue': 1,
    'src/components/CRM_Module/Tareas/TareaDetalleModal.vue': 2,
  };
  for (const [ruta, cuantos] of Object.entries(MODALES)) {
    const sfc = leer(ruta);
    assert.equal((sfc.match(/v-cierre-fondo=/g) || []).length, cuantos, ruta);
    // Ninguna capa (overlay/backdrop) con @click: ni .self ni suelto
    const capas = sfc.match(/<div\b[^>]*class="[^"]*(?:overlay|backdrop)[^"]*"[^>]*>/g) || [];
    for (const etiqueta of capas) assert.doesNotMatch(etiqueta, /@click/, `${ruta}: ${etiqueta.slice(0, 90)}`);
  }
  assert.match(leer('src/main.js'), /app\.directive\('cierre-fondo', cierreFondo\)/);
});
