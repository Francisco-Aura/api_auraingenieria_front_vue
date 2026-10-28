// Fallos de la última revisión del módulo de tareas, la campana y Administración.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const MODAL = 'src/components/CRM_Module/Tareas/TareaModalCorporativo.vue';
const TAREAS = 'src/components/CRM_Module/Tareas/TareasComponent.vue';
const DETALLE = 'src/components/CRM_Module/Tareas/TareaDetalleModal.vue';
const ESTADISTICAS = 'src/components/CRM_Module/Tareas/EstadisticasTareasComponent.vue';
const ADMINISTRACION = 'src/components/CRM_Module/Administracion/AdministracionComponent.vue';
const DASHBOARD = 'src/components/DashboardComponent.vue';

const fechas = () => import(pathToFileURL(path.join(raiz, 'src/utils/fechas.js')).href);

// Usuario con sesión (cada fichero de tests corre en su propio proceso)
global.localStorage = { getItem: () => JSON.stringify({ id: 7, nombre: 'Ana', nivelAcceso: 1 }) };

async function modal() {
  const { fechaLocalISO } = await fechas();
  const componente = cargarComponente(MODAL, {
    tareasApi: { obtenerAdjuntosTarea: async () => [], obtenerCarteraCupsCliente: async () => [] },
    fechaLocalISO,
  });
  return crearContexto(componente, { estados: [], value: true });
}

test('editar una tarea sin fechas no arrastra las de la tarea abierta antes', async () => {
  const ctx = await modal();
  ctx.tarea = { id: 1, titulo: 'Con fechas', fechaInicio: '2026-10-15T09:30:00', fechaVencimiento: '2026-10-15T18:00:00',
    clienteRelacionadoId: 4, clienteRelacionadoNombre: 'ACME' };
  ctx.inicializarFormulario();
  ctx.errores = { titulo: 'El título es obligatorio' };

  ctx.tarea = { id: 2, titulo: 'Sin fechas' };
  ctx.inicializarFormulario();

  assert.equal(ctx.fechaInicio, '');
  assert.equal(ctx.fechaVencimiento, '');
  assert.equal(ctx.horaVencimiento, '18:00');
  assert.equal(ctx.busquedaCliente, '', 'tampoco el cliente de la anterior');
  assert.deepEqual(ctx.errores, {});

  let enviada;
  ctx.$emit = (evento, dto) => { if (evento === 'guardar') enviada = dto; };
  ctx.guardar();
  assert.equal(enviada.fechaInicio, null);
  assert.equal(enviada.fechaVencimiento, null);
});

test('vaciar «Dirigido a» desliga la tarea del cliente que tenía', async () => {
  const ctx = await modal();
  ctx.tarea = { id: 1, titulo: 'T', clienteRelacionadoId: 4, clienteRelacionadoNombre: 'ACME', cups: 'ES01' };
  ctx.inicializarFormulario();

  ctx.busquedaCliente = '';
  await ctx.buscarClientes();

  assert.equal(ctx.formulario.clienteRelacionadoId, null);
  assert.equal(ctx.formulario.cups, null);
});

test('escribir en «Dirigido a» sin vaciarlo no quita el cliente ni el CUPS (como antes)', async () => {
  const ctx = await modal();
  ctx.tarea = { id: 1, titulo: 'T', clienteRelacionadoId: 4, clienteRelacionadoNombre: 'ACME', cups: 'ES01' };
  ctx.inicializarFormulario();

  // Una tecla de más y su borrado: el texto vuelve a ser el del cliente
  ctx.busquedaCliente = 'ACMEx';
  await ctx.buscarClientes();
  ctx.busquedaCliente = 'ACME';
  await ctx.buscarClientes();

  assert.equal(ctx.formulario.clienteRelacionadoId, 4);
  assert.equal(ctx.formulario.cups, 'ES01');
});

test('las estadísticas de eficiencia, retraso y bloqueadas ya no salen siempre a 0', () => {
  const c = cargarComponente(ESTADISTICAS, {});
  const ctx = crearContexto(c);
  const dia = 86400000;
  const ahora = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const tareas = [
    { estadoFinal: true, fechaFinalizacion: iso(ahora - 3 * dia), fechaVencimiento: iso(ahora - 2 * dia) }, // a tiempo
    { estadoFinal: true, fechaFinalizacion: iso(ahora - 1 * dia), fechaVencimiento: iso(ahora - 2 * dia) }, // tarde
    { estadoFinal: false, fechaVencimiento: iso(ahora - 2.5 * dia) }, // 2 días de retraso
    { estadoFinal: false, fechaVencimiento: iso(ahora - 4.2 * dia), estadoBloqueo: true }, // 4 días, bloqueada
  ];
  ctx.calcularEstadisticasDesdeArray(tareas, tareas);
  assert.equal(ctx.estadisticas.eficiencia, 50);
  assert.equal(ctx.estadisticas.delayPromedioDias, 3);
  assert.equal(ctx.estadisticas.tareasBloqueadasPeriodo, 1);
});

test('cambiar de estado con comentario: primero el estado y, si sale bien, el comentario', async () => {
  const llamadas = [];
  const tareasApi = {
    cambiarEstadoTarea: async () => { llamadas.push('estado'); throw new Error('500'); },
    crearComentario: async () => { llamadas.push('comentario'); },
  };
  const c = cargarComponente(TAREAS, { tareasApi });
  const ctx = crearContexto(c);
  await ctx.handleCambiarEstado(5, 2, null, 'Pasa a revisión');
  assert.deepEqual(llamadas, ['estado'], 'si el cambio falla no queda un comentario suelto');

  llamadas.length = 0;
  tareasApi.cambiarEstadoTarea = async () => { llamadas.push('estado'); };
  ctx.cargarTareas = async () => {};
  ctx.cerrarModalDetalle = () => {};
  await ctx.handleCambiarEstado(5, 2, null, 'Pasa a revisión');
  assert.deepEqual(llamadas, ['estado', 'comentario']);
});

test('el detalle manda el cambio de estado y su comentario en un solo aviso', () => {
  const c = cargarComponente(DETALLE, {});
  const ctx = crearContexto(c, { tarea: { id: 5, estadoId: 1 }, estadoSeleccionado: 2, comentarioCambioEstado: ' Bloqueada por proveedor ', esEstadoBloqueado: true, guardando: false });
  ctx.aplicarCambioEstado();
  assert.deepEqual(ctx.emitidos, [['cambiar-estado', 5, 2, 'Bloqueada por proveedor', 'Bloqueada por proveedor']]);
});

test('si fallan los adjuntos, ese aviso no lo tapa el de «guardada correctamente»', async () => {
  const tareasApi = {
    actualizarTarea: async () => ({}),
    subirAdjuntosTarea: async () => { throw new Error('413'); },
  };
  const c = cargarComponente(TAREAS, { tareasApi });
  const ctx = crearContexto(c, { $refs: {} });
  ctx.cargarTareas = async () => {};
  ctx.cerrarModal = () => {};
  const mensajes = [];
  ctx.mostrarMensaje = (texto, color) => mensajes.push([texto, color]);
  await ctx.handleGuardarTarea({ id: 3, titulo: 'T' }, [{ name: 'grande.pdf' }]);
  assert.deepEqual(mensajes, [['Tarea actualizada, pero hubo un error al subir algunos adjuntos', 'warning']]);
});

test('tras editar desde el detalle, el detalle enseña los datos nuevos', async () => {
  const tareasApi = { actualizarTarea: async () => ({}) };
  const c = cargarComponente(TAREAS, { tareasApi });
  const ctx = crearContexto(c, { $refs: {}, mostrarModalDetalle: true, tareaDetalle: { id: 3, titulo: 'Antes' } });
  ctx.cargarTareas = async () => { ctx.tareas = [{ id: 3, titulo: 'Después' }]; };
  ctx.cerrarModal = () => {};
  ctx.mostrarMensaje = () => {};
  await ctx.handleGuardarTarea({ id: 3, titulo: 'Después' }, []);
  assert.equal(ctx.tareaDetalle.titulo, 'Después');
});

test('una notificación de una tarea borrada avisa y se quita de la URL', async () => {
  const tareasApi = { obtenerTareaPorId: async () => { throw { response: { status: 404 } }; } };
  const c = cargarComponente(TAREAS, { tareasApi });
  let reemplazo;
  const ctx = crearContexto(c, {
    tareas: [],
    $route: { query: { abrirDetalle: '9' } },
    $router: { replace: (destino) => { reemplazo = destino; return Promise.resolve(); } },
  });
  const mensajes = [];
  ctx.mostrarMensaje = (texto) => mensajes.push(texto);
  await ctx.abrirDetalleDesdeRuta('9');
  assert.match(mensajes[0], /ya no existe/);
  assert.deepEqual(reemplazo, { query: {} });
});

test('Administración solo es para administradores también por URL', () => {
  const router = leer('src/router/index.js');
  assert.match(router, /path: 'administracion',[\s\S]*?meta: \{ requiresAuth: true, requiresAdmin: true \}/);
});

test('una categoría nueva se enseña activa, que es como la crea el servidor', () => {
  const c = cargarComponente(ADMINISTRACION, {});
  const ctx = crearContexto(c, { tablaSeleccionada: { campos: ['nombre', 'codigo', 'descripcion', 'activo'] } });
  ctx.nuevoRegistro();
  assert.deepEqual(ctx.registro, { activo: true });
  ctx.tablaSeleccionada = { campos: ['nombre'] };
  ctx.nuevoRegistro();
  assert.deepEqual(ctx.registro, {});
});

test('si en otra pestaña se entra con otro usuario o se sale, esta se pone al día', () => {
  const c = cargarComponente(DASHBOARD, {});
  const ctx = crearContexto(c);
  const destinos = [];
  const original = global.window;
  global.window = { location: { assign: (url) => destinos.push(url) } };
  try {
    const usuario = (id) => JSON.stringify({ id, nombre: `U${id}` });
    ctx.alCambiarUsuarioEnOtraPestana({ key: 'otra-clave', oldValue: null, newValue: 'x' });
    ctx.alCambiarUsuarioEnOtraPestana({ key: 'usuario', oldValue: usuario(1), newValue: usuario(1) });
    assert.deepEqual(destinos, [], 'el mismo usuario o claves ajenas no recargan');
    ctx.alCambiarUsuarioEnOtraPestana({ key: 'usuario', oldValue: usuario(1), newValue: usuario(2) });
    ctx.alCambiarUsuarioEnOtraPestana({ key: 'usuario', oldValue: usuario(1), newValue: null });
    assert.deepEqual(destinos, ['/dashboard/clientes', '/']);
  } finally {
    global.window = original;
  }
});

test('al reconectar el WebSocket se piden las notificaciones perdidas (no en la primera conexión)', async () => {
  const fuente = leer('src/services/notificacionesPolling.js')
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export const notificacionesPolling = .*$/m, '')
    .replace(/^export default .*$/m, '');
  let config;
  class ClienteStomp {
    constructor(opciones) { config = opciones; }
    activate() {}
    deactivate() {}
    subscribe() {}
  }
  let peticiones = 0;
  const tareasApi = { obtenerNotificacionesNoLeidas: async () => { peticiones += 1; return []; } };
  const Servicio = Function('tareasApi', 'setInterval', 'clearInterval', `${fuente}\nreturn NotificacionesService;`)(
    tareasApi, () => 1, () => {});
  const servicio = new Servicio(async () => ({ Client: ClienteStomp, SockJS: class {} }));

  servicio.iniciar(1);
  await new Promise((r) => setImmediate(r));
  const trasCargaInicial = peticiones;
  config.onConnect();
  await new Promise((r) => setImmediate(r));
  assert.equal(peticiones, trasCargaInicial, 'la primera conexión ya la cubre la carga inicial');
  config.onConnect();
  await new Promise((r) => setImmediate(r));
  assert.equal(peticiones, trasCargaInicial + 1);
});

test('un número de tarea de la URL que no es un número no se pide al servidor', async () => {
  const pedidas = [];
  const tareasApi = { obtenerTareaPorId: async (id) => { pedidas.push(id); return { id }; } };
  const c = cargarComponente(TAREAS, { tareasApi });
  const ctx = crearContexto(c, { tareas: [], $route: { query: { abrirDetalle: '../usuarios' } } });
  await ctx.abrirDetalleDesdeRuta('../usuarios');
  await ctx.abrirDetalleDesdeRuta('1 OR 1');
  assert.deepEqual(pedidas, []);
});
