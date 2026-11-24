// Rendimiento y carreras del frontend: peticiones repetidas, respuestas tardías y
// trabajo de más en los listados.
process.env.TZ = process.env.TZ || 'Europe/Madrid';

const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, cargarComponente, crearContexto } = require('./helpers/sfc');

global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const esperarTareas = () => new Promise((resolver) => setImmediate(resolver));

function diferida() {
  let resolver;
  let rechazar;
  const promesa = new Promise((ok, ko) => { resolver = ok; rechazar = ko; });
  return { promesa, resolver, rechazar };
}

// ---------------------------------------------------------------------------
// Orden de tablas
// ---------------------------------------------------------------------------

test('el comparador de tablas reutiliza un Intl.Collator y ordena igual que localeCompare', () => {
  const fuente = leer('src/utils/orden.js');
  assert.match(fuente, /new Intl\.Collator\('es', \{ numeric: true, sensitivity: 'base' \}\)/);
  assert.match(fuente, /return comparadorTextos\.compare\(String\(a\), String\(b\)\);/);
  const { compararValores } = Function(fuente
    .replace(/export default [^;]+;/g, '')
    .replace(/export (function|const)/g, '$1') + '\nreturn { compararValores };')();
  const muestras = ['Álvarez', 'Zapata', 'ñu', 'Núñez', 'PS-10', 'PS-9', 'abc', 'ABC', 'á', 'a', '10', '9', 'x y'];
  for (const a of muestras) {
    for (const b of muestras) {
      const esperado = Math.sign(a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));
      assert.equal(Math.sign(compararValores(a, b)), esperado, `${a} / ${b}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Estado del módulo de tareas
// ---------------------------------------------------------------------------

function cargarTareasApi(axios) {
  const fuente = leer('src/services/tareasApi.js')
    .replace(/^import\s+.*$/gm, '')
    .replace('export const tareasApi', 'const tareasApi')
    .replace(/^export default .*$/m, '');
  return Function('axios', `${fuente}\nreturn tareasApi;`)(axios);
}

test('panel, campana y Tareas comparten una sola consulta del módulo de tareas', async () => {
  let llamadas = 0;
  const axios = {
    interceptors: { response: { use() {} } },
    get: async () => { llamadas += 1; return { data: { activo: true } }; },
  };
  const api = cargarTareasApi(axios);
  const resultados = await Promise.all([api.verificarModuloActivo(), api.verificarModuloActivo()]);
  assert.deepEqual(resultados, [true, true]);
  assert.equal(await api.verificarModuloActivo(), true);
  assert.equal(llamadas, 1);
});

test('si la consulta del módulo falla no se guarda: la siguiente vuelve a preguntar', async () => {
  let llamadas = 0;
  const axios = {
    interceptors: { response: { use() {} } },
    get: async () => {
      llamadas += 1;
      if (llamadas === 1) throw new Error('sin red');
      return { data: { activo: true } };
    },
  };
  const api = cargarTareasApi(axios);
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await api.verificarModuloActivo(), false);
  } finally {
    console.error = original;
  }
  assert.equal(await api.verificarModuloActivo(), true);
  assert.equal(llamadas, 2);
});

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

function cargarServicio(tareasApi, cargarLibrerias) {
  const fuente = leer('src/services/notificacionesPolling.js')
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export const notificacionesPolling = .*$/m, '')
    .replace(/^export default .*$/m, '');
  const Servicio = Function('tareasApi', 'setInterval', 'clearInterval', `${fuente}\nreturn NotificacionesService;`)(
    tareasApi, () => 1, () => {});
  return new Servicio(cargarLibrerias);
}

test('las librerías del WebSocket no van en el panel: se descargan al conectar', () => {
  const fuente = leer('src/services/notificacionesPolling.js');
  assert.doesNotMatch(fuente, /^import .*(stompjs|sockjs)/m);
  assert.match(fuente, /import\(\/\* webpackChunkName: "websocket" \*\/ '@stomp\/stompjs'\)/);
  assert.match(fuente, /import\(\/\* webpackChunkName: "websocket" \*\/ 'sockjs-client'\)/);
});

test('si se cierra sesión mientras se descargan las librerías no se abre el WebSocket', async () => {
  let conexiones = 0;
  const librerias = diferida();
  const servicio = cargarServicio({ obtenerNotificacionesNoLeidas: async () => [] }, () => librerias.promesa);
  servicio.iniciar(1);
  servicio.detener();
  librerias.resolver({ Client: class { constructor() { conexiones += 1; } activate() {} }, SockJS: class {} });
  await esperarTareas();
  assert.equal(conexiones, 0);
});

test('una respuesta de notificaciones que llega tarde no pisa a otra más reciente ni a la sesión siguiente', async () => {
  const pendientes = [];
  const tareasApi = { obtenerNotificacionesNoLeidas: () => { const d = diferida(); pendientes.push(d); return d.promesa; } };
  const servicio = cargarServicio(tareasApi, () => new Promise(() => {}));
  const recibidas = [];
  servicio.iniciar(1);
  servicio.onNotificacionesActualizadas((lista, origen) => recibidas.push([lista.length, origen]));

  servicio._fetchYNotificar('push');
  pendientes[1].resolver([1, 2]);
  await esperarTareas();
  pendientes[0].resolver([1]); // la inicial llega después que el aviso: se descarta
  await esperarTareas();
  assert.deepEqual(recibidas, [[2, 'push']]);

  servicio._fetchYNotificar('push');
  servicio.detener();
  servicio.iniciar(2);
  const deLaSesionNueva = [];
  servicio.onNotificacionesActualizadas((lista) => deLaSesionNueva.push(lista.length));
  pendientes[2].resolver([1, 2, 3]); // era del usuario anterior
  pendientes[3].resolver([]);
  await esperarTareas();
  assert.deepEqual(deLaSesionNueva, [0]);
});

test('la carga inicial de la campana no repite la petición de vencimientos de hoy', () => {
  const fuente = leer('src/components/CRM_Module/Tareas/NotificacionesComponent.vue');
  assert.match(fuente, /onNotificacionesActualizadas\(\(notificaciones, origen\) =>/);
  assert.match(fuente, /if \(origen !== 'inicial'\) this\.cargarTareasVenciendoHoy\(\)/);
});

// ---------------------------------------------------------------------------
// Informes
// ---------------------------------------------------------------------------

test('al pulsar otro informe antes de que llegue el primero, el primero no se pinta', async () => {
  const respuestas = {};
  const axios = { get: (url) => { const d = diferida(); respuestas[url.split('/').pop()] = d; return d.promesa; } };
  const avisos = [];
  const componente = cargarComponente('src/components/CRM_Module/Informes/InformesComponent.vue', {
    axios,
    Swal: { fire: (o) => avisos.push(o) },
  });
  const ctx = crearContexto(componente);

  const primero = ctx.mostrarInforme('contratos-vigentes');
  const segundo = ctx.mostrarInforme('servicios-vigentes');
  respuestas['servicios-vigentes'].resolver({ data: [{ idServicio: 7, cliente: 'Segundo', cups: 'ES2' }] });
  await segundo;
  respuestas['contratos-vigentes'].resolver({ data: [{ codigoContrato: 1, cliente: 'Primero', cupsLuz: 'ES1' }] });
  await primero;

  assert.equal(ctx.tipoSeleccionado, 'servicios-vigentes');
  assert.equal(ctx.tituloInforme, 'Servicios Vigentes');
  assert.deepEqual(ctx.datosInforme.map((f) => f.cliente), ['Segundo']);
  assert.equal(ctx.loading, false);
  assert.equal(avisos.length, 0);
});

test('los importes de Informes salen igual con el formateador reutilizado', () => {
  const componente = cargarComponente('src/components/CRM_Module/Informes/InformesComponent.vue');
  const ctx = crearContexto(componente);
  const esperado = (v) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  for (const v of [0, 1234.5, '99.999', -3]) assert.equal(ctx.formatearImporte(v), esperado(parseFloat(v)));
  assert.equal(ctx.formatearImporte('n/d'), 'n/d');
  assert.equal(ctx.formatearImporte(null), '');
});

// ---------------------------------------------------------------------------
// Puntos de suministro y Tareas
// ---------------------------------------------------------------------------

test('la fecha de fin de contrato y la de vencimiento se formatean igual que antes', () => {
  const ps = crearContexto(cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue'));
  const tareas = crearContexto(cargarComponente('src/components/CRM_Module/Tareas/TareasComponent.vue'));
  for (const valor of ['2026-03-29', '2026-10-25T23:30:00', '2027-01-01T00:00:00']) {
    const antes = new Date(valor).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
    assert.equal(ps.getFechaFinUltimoContrato({ fechaFinUltimoContrato: valor }), antes);
    assert.equal(tareas.formatearFecha(valor), antes);
  }
  assert.equal(ps.getFechaFinUltimoContrato({ fechaFinUltimoContrato: 'no es fecha' }), 'Invalid Date');
  assert.equal(ps.getFechaFinUltimoContrato({}), '-');
  assert.equal(tareas.formatearFecha(null), '-');
});

test('abrir los servicios de otro punto antes de que lleguen los del primero no los mezcla', async () => {
  const respuestas = {};
  const axios = { get: (url) => { const d = diferida(); respuestas[url] = d; return d.promesa; } };
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', { axios });
  const ctx = crearContexto(componente, { productos: [{ id: 1 }], gestoras: [{ id: 1 }] });
  ctx.cargarDatosDePagosParaServicios = async (servicios) => servicios;

  const primero = ctx.abrirModalServicios(10, 1);
  const segundo = ctx.abrirModalServicios(20, 2);
  // Las peticiones del cliente y de los servicios salen a la vez
  assert.ok(respuestas['undefined/clientes/2'] && respuestas['undefined/servicios/punto-suministro/20']);
  respuestas['undefined/clientes/2'].resolver({ data: { nombre: 'Dos' } });
  respuestas['undefined/servicios/punto-suministro/20'].resolver({ data: [{ id: 200 }] });
  await segundo;
  respuestas['undefined/clientes/1'].resolver({ data: { nombre: 'Uno' } });
  respuestas['undefined/servicios/punto-suministro/10'].resolver({ data: [{ id: 100 }] });
  await primero;

  assert.equal(ctx.modalCliente.nombre, 'Dos');
  assert.equal(ctx.modalPuntoSuministro, 20);
  assert.deepEqual(ctx.servicios.map((s) => s.id), [200]);
  assert.equal(ctx.cargandoServicios, false);
});

test('las estadísticas de tareas no se piden para quien no las ve', async () => {
  global.localStorage = { getItem: () => JSON.stringify({ id: 5, nivelAcceso: 2 }), setItem() {}, removeItem() {} };
  let pedidas = 0;
  try {
    const componente = cargarComponente('src/components/CRM_Module/Tareas/EstadisticasTareasComponent.vue', {
      tareasApi: { obtenerTareasPorUsuario: async () => { pedidas += 1; return []; }, obtenerTodasLasTareas: async () => { pedidas += 1; return []; } },
    });
    const ctx = crearContexto(componente);
    await ctx.cargarEstadisticas();
    assert.equal(pedidas, 0);
  } finally {
    global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
  }
});
