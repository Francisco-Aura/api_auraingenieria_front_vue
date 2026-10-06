// Auditoría general 14/09/2026: fallos corregidos fuera del módulo MCAS.
process.env.TZ = process.env.TZ || 'Europe/Madrid';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

// Las pantallas leen el usuario de localStorage (no existe en Node)
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

// ---------------------------------------------------------------------------
// Paginación
// ---------------------------------------------------------------------------

test('el selector de registros por página guarda un número (la página 2 no muestra todo el resto)', () => {
  const casos = [
    ['src/components/CRM_Module/Clientes/ClientesComponent.vue', 'recordsPerPage'],
    ['src/components/CRM_Module/Administracion/AdministracionComponent.vue', 'recordsPerPage'],
    ['src/components/CRM_Module/Tareas/TareasComponent.vue', 'tareasPorPagina'],
    ['src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', 'recordsPerPage'],
  ];
  for (const [ruta, campo] of casos) {
    assert.match(plantilla(ruta), new RegExp(`v-model\\.number="${campo}"`), `${ruta}: v-model.number="${campo}"`);
  }
});

test('con 25 por página, la página 2 de clientes muestra 25 registros', () => {
  const componente = cargarComponente('src/components/CRM_Module/Clientes/ClientesComponent.vue', { axios: {}, ExcelJS: {} });
  const ctx = crearContexto(componente);
  ctx.clientes = Array.from({ length: 80 }, (_, i) => ({ idCliente: i + 1, nombre: `Cliente ${i + 1}` }));
  ctx.recordsPerPage = 25;
  ctx.currentPage = 2;
  assert.equal(ctx.paginatedClientes.length, 25);
  assert.equal(ctx.paginatedClientes[0].idCliente, 26);
});

// ---------------------------------------------------------------------------
// Exportación a Excel
// ---------------------------------------------------------------------------

test('ExcelJS se descarga solo al exportar (no se incluye en las pantallas)', () => {
  const componentes = [
    'src/components/CRM_Module/Clientes/ClientesComponent.vue',
    'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
    'src/components/CRM_Module/Informes/InformesComponent.vue',
    'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
    'src/components/CRM_Module/Tareas/TareasComponent.vue',
    'src/components/CRM_Module/Tareas/TareaAuditoriaModal.vue',
  ];
  for (const ruta of componentes) {
    const fuente = leer(ruta);
    assert.doesNotMatch(fuente, /from ['"]exceljs['"]|require\(['"]exceljs['"]\)/, ruta);
    assert.match(fuente, /cargarExcelJS\(\)/, ruta);
  }
  assert.match(leer('src/utils/excel.js'), /import\(\s*(\/\*[^*]*\*\/\s*)?['"]exceljs['"]\s*\)/);
});

test('si la exportación de clientes falla se avisa con el diálogo del CRM', async () => {
  const componente = cargarComponente('src/components/CRM_Module/Clientes/ClientesComponent.vue', {
    axios: {},
    cargarExcelJS: async () => { throw new Error('sin conexión'); },
    descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente);
  ctx.clientes = [{ idCliente: 1, nombre: 'Cliente 1' }];

  await ctx.exportarExcel();

  assert.equal(ctx.avisos.length, 1);
  assert.equal(ctx.avisos[0].icon, 'error');
});

test('las fechas de los informes se exportan como fechas de Excel (dd/mm/aaaa)', () => {
  const componente = cargarComponente('src/components/CRM_Module/Informes/InformesComponent.vue', {
    axios: {}, Swal: {}, cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente);
  const fecha = ctx.valorFechaExcel('2026-09-14');
  assert.ok(fecha instanceof Date);
  assert.equal(fecha.toISOString().slice(0, 10), '2026-09-14');
  assert.equal(ctx.valorFechaExcel('texto'), 'texto');
  assert.equal(ctx.valorFechaExcel(null), null);
});

/** ExcelJS falso que guarda las columnas y filas escritas. */
function excelFalso() {
  const hojas = [];
  const ExcelJS = {
    Workbook: class {
      addWorksheet(nombre) {
        const hoja = { nombre, columns: [], filas: [], addRows(filas) { this.filas.push(...filas); }, addRow(fila) { this.filas.push(fila); }, getRow: () => ({}) };
        hojas.push(hoja);
        return hoja;
      }
    },
  };
  return { hojas, cargarExcelJS: async () => ExcelJS, descargarLibroExcel: async () => {} };
}

test('el Excel de Administración exporta las columnas visibles con el texto completo', async () => {
  const excel = excelFalso();
  const componente = cargarComponente('src/components/CRM_Module/Administracion/AdministracionComponent.vue', {
    axios: {}, cargarExcelJS: excel.cargarExcelJS, descargarLibroExcel: excel.descargarLibroExcel,
  });
  const descripcion = 'Subcategoría para incidencias de facturación que tardan más de un ciclo en resolverse';
  const ctx = crearContexto(componente, {
    tablaSeleccionada: { nombre: 'Tareas - Subcategorías', url: '/tarea-subcategorias' },
    columnas: ['id', 'nombre', 'categoriaIds', 'categorias', 'activo'],
    datos: [{ id: 3, nombre: descripcion, categoriaIds: [1, 2], categorias: 'Incidencias, Facturación', activo: true }],
  });

  await ctx.exportarExcel();

  const fila = excel.hojas[0].filas[0];
  assert.deepEqual(Object.keys(fila), ['Nombre', 'Categorias', 'Activo']);
  assert.equal(fila.Nombre, descripcion);
  assert.equal(fila.Activo, 'Sí');
});

test('el modal de contratos ya no incluye jsPDF (su generador de PDF no se usaba)', () => {
  assert.doesNotMatch(leer('src/components/CRM_Module/PuntosSuministro/ModalContratos.vue'), /jspdf/i);
});

// ---------------------------------------------------------------------------
// Iconos
// ---------------------------------------------------------------------------

test('la hoja de iconos se carga una sola vez y sin el componente SVG que no se usa', () => {
  assert.doesNotMatch(leer('src/App.css'), /font-awesome/);
  assert.match(leer('public/index.html'), /font-awesome\/6\.5\.1\/css\/all\.min\.css/);
  assert.doesNotMatch(leer('src/main.js'), /fontawesome/i);
});

// ---------------------------------------------------------------------------
// Fechas locales
// ---------------------------------------------------------------------------

test('fechaLocalISO usa el día local (sin desplazar al día anterior de madrugada)', async () => {
  const { fechaLocalISO } = await importar('src/utils/fechas.js');
  assert.ok(new Date('2026-09-15T00:30:00').getTimezoneOffset() < 0, 'la prueba se ejecuta en horario de España');
  assert.equal(fechaLocalISO(new Date(2026, 8, 15, 0, 30)), '2026-09-15');
  assert.equal(fechaLocalISO('2026-09-15T00:30:00'), '2026-09-15');
  assert.equal(fechaLocalISO('2026-09-15'), '2026-09-15');
  assert.equal(fechaLocalISO(null), '');
  assert.equal(fechaLocalISO('no es fecha'), '');
});

test('ninguna pantalla calcula «hoy» o una fecha de formulario pasando por UTC', () => {
  const pendientes = [];
  const recorrer = (carpeta) => {
    for (const nombre of fs.readdirSync(path.join(raiz, carpeta))) {
      const ruta = `${carpeta}/${nombre}`;
      if (fs.statSync(path.join(raiz, ruta)).isDirectory()) recorrer(ruta);
      else if (/\.(vue|js)$/.test(nombre) && ruta !== 'src/utils/fechas.js'
        && /toISOString\(\)\.(split|slice|substring)\(/.test(leer(ruta))) pendientes.push(ruta);
    }
  };
  recorrer('src');
  assert.deepEqual(pendientes, []);
});

function modalTareas(fechaLocalISO) {
  const componente = cargarComponente('src/components/CRM_Module/Tareas/TareaModalCorporativo.vue', {
    tareasApi: { obtenerAdjuntosTarea: async () => [], obtenerCarteraCupsCliente: async () => [] },
    fechaLocalISO,
  });
  return (tarea) => crearContexto(componente, { tarea, estados: [], value: true });
}

test('editar una tarea que vence de madrugada no la mueve al día anterior', async () => {
  const { fechaLocalISO } = await importar('src/utils/fechas.js');
  const ctx = modalTareas(fechaLocalISO)({ id: 7, titulo: 'Llamar', fechaInicio: '2026-09-15T00:00:00', fechaVencimiento: '2026-09-15T00:30:00' });

  ctx.inicializarFormulario();

  assert.equal(ctx.fechaInicio, '2026-09-15');
  assert.equal(ctx.fechaVencimiento, '2026-09-15');
  assert.equal(ctx.horaVencimiento, '00:30');
});

test('«Nueva tarea» desde un día del calendario propone ese día', async () => {
  const { fechaLocalISO } = await importar('src/utils/fechas.js');
  const ctx = modalTareas(fechaLocalISO)({ fechaVencimiento: new Date(2026, 9, 3), titulo: '' });

  ctx.inicializarFormulario();

  assert.equal(ctx.fechaVencimiento, '2026-10-03');
  assert.equal(ctx.fechaInicio, '2026-10-03');
});

// ---------------------------------------------------------------------------
// Calendario de tareas
// ---------------------------------------------------------------------------

test('el panel del día lista todas las tareas y la celda indica «+N más»', () => {
  const componente = cargarComponente('src/components/CRM_Module/Tareas/TareasCalendarioView.vue');
  const tareas = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, titulo: `T${i + 1}`, fechaVencimiento: `2026-09-15T1${i}:00:00` }));
  tareas.push({ id: 99, titulo: 'Otro día', fechaVencimiento: '2026-09-16T10:00:00' });
  const ctx = crearContexto(componente, { tareas, vista: 'mes' });
  const dia = new Date(2026, 8, 15);

  assert.equal(ctx.tareasDelDia(dia).length, 5);
  assert.equal(ctx.tareasVisiblesDia(dia).length, 3);
  const html = plantilla('src/components/CRM_Module/Tareas/TareasCalendarioView.vue');
  assert.match(html, /tareasDelDia\(dia\.fecha\)\.length > mostrarTareasMaximo/);
  assert.match(html, /v-for="tarea in tareasDelDia\(diaSeleccionado\.fecha\)"/);
});

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

test('eliminar una notificación la quita también de la lista filtrada que se ve', async () => {
  const componente = cargarComponente('src/components/CRM_Module/Tareas/NotificacionesComponent.vue', {
    tareasApi: { eliminarNotificacion: async () => {}, contarNotificacionesNoLeidas: async () => 0 },
    notificacionesPolling: {},
    audioService: {},
  });
  const ctx = crearContexto(componente);
  ctx.notificaciones = [{ id: 1, tipo: 'ASIGNADA' }, { id: 2, tipo: 'COMENTARIO' }];
  ctx.aplicarFiltroTipo();

  await ctx.eliminarNotificacion(1);

  assert.deepEqual(ctx.notificacionesFiltradas.map((n) => n.id), [2]);
});

test('los sonidos reutilizan un único contexto de audio', async () => {
  let contextos = 0;
  const nodo = () => ({
    connect() {},
    frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} },
    gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    start() {},
    stop() {},
  });
  global.localStorage = { getItem: () => null, setItem() {} };
  global.window = {
    AudioContext: class {
      constructor() { contextos += 1; this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return nodo(); }
      createGain() { return nodo(); }
      resume() { return Promise.resolve(); }
    },
  };
  const { audioService } = await importar('src/services/audioService.js');

  audioService.reproducirNotificacion();
  audioService.reproducirNotificacion();
  audioService.reproducirExito();
  audioService.reproducirError();

  assert.equal(contextos, 1);
});

function cargarServicioNotificaciones(temporizadores) {
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
  const Servicio = Function('Client', 'SockJS', 'tareasApi', 'setInterval', 'clearInterval', `${fuente}\nreturn NotificacionesService;`)(
    ClienteStomp, class {}, { obtenerNotificacionesNoLeidas: async () => [] }, temporizadores.setInterval, temporizadores.clearInterval);
  return { servicio: new Servicio(), config: () => config };
}

test('al reconectar el WebSocket se detiene el sondeo de respaldo', () => {
  const activos = new Set();
  let siguiente = 1;
  const temporizadores = {
    setInterval: () => { const id = siguiente++; activos.add(id); return id; },
    clearInterval: (id) => activos.delete(id),
  };
  const { servicio, config } = cargarServicioNotificaciones(temporizadores);

  servicio.iniciar(1);
  config().onWebSocketError(new Error('servidor reiniciado'));
  assert.equal(activos.size, 1);

  config().onConnect();
  assert.equal(activos.size, 0);
});

test('el reintento de peticiones no rompe con errores que no traen configuración', async () => {
  let alFallar;
  const axiosFalso = { interceptors: { response: { use: (_ok, error) => { alFallar = error; } } } };
  const fuente = leer('src/services/tareasApi.js')
    .replace(/^import\s+.*$/gm, '')
    .replace('export const tareasApi', 'const tareasApi')
    .replace(/^export default .*$/m, '');
  Function('axios', fuente)(axiosFalso);
  const original = new Error('petición cancelada');

  await assert.rejects(alFallar(original), (error) => error === original);
});

// ---------------------------------------------------------------------------
// Puntos de suministro y contratos
// ---------------------------------------------------------------------------

test('el detalle de un cliente no vuelve a pedir sus puntos de suministro', () => {
  const llamadas = [];
  const componente = cargarComponente('src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue', {
    axios: { get: async (url) => { llamadas.push(url); return { data: [] }; } },
  });
  const ctx = crearContexto(componente, { cliente: { idCliente: 3, nombre: 'Cliente' } });

  componente.watch.puntosSuministro.handler.call(ctx, [{ id: 1, CUPSluz: 'ES0001', direccion: 'Calle 1' }]);

  assert.deepEqual(llamadas, []);
  assert.equal(ctx.puntosSuministroLocal[0].cupsluz, 'ES0001');
});

const hoy = new Date();
const desplazar = (dias) => new Date(hoy.getTime() + dias * 86400000).toISOString().slice(0, 10);

test('tras guardar un contrato, el contrato vigente del modal se actualiza', async () => {
  const vigenteNuevo = { id: 2, contrato: 'NUEVO', fechaInicio: desplazar(-5), fechaFin: desplazar(360) };
  const anterior = { id: 1, contrato: 'ANTERIOR', fechaInicio: desplazar(-400), fechaFin: desplazar(-6) };
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', {
    axios: { get: async () => ({ data: [vigenteNuevo, anterior] }) },
    cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente, {
    modalPuntoSuministro: { id: 9 },
    contratoActualData: { id: 1, contrato: 'ANTERIOR (sin actualizar)' },
    contratosHistoricosData: [],
  });

  await ctx.recargarContratosDelPuntoSuministro();

  assert.equal(ctx.contratoActual.id, 2);
  assert.deepEqual(ctx.contratosHistoricos.map((c) => c.id), [1]);
});

test('modificar un punto de suministro usa las potencias de su fila (una sola petición)', async () => {
  const llamadas = [];
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', {
    axios: { get: async (url) => { llamadas.push(url); return { data: { id: 5, direccion: 'Calle 5' } }; } },
    cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente);

  await ctx.abrirFormularioPSActualizar({ id: 5, idCliente: 3, potencia1: 10, potencia2: 15 });

  assert.equal(llamadas.length, 1);
  assert.equal(ctx.modificarPunto.potencia1, 10);
  assert.equal(ctx.modificarPunto.potencia2, 15);
  assert.equal(ctx.modificarPunto.potencia3, 0);
  assert.equal(ctx.formularioVisible, true);
});

// ---------------------------------------------------------------------------
// Mensajes de error del servidor
// ---------------------------------------------------------------------------

const rechazo409 = () => Promise.reject({ response: { status: 409, data: { error: 'No se puede eliminar este registro porque está siendo utilizado por otros datos del sistema.' } } });

test('Administración explica por qué no se puede eliminar un registro', async () => {
  const componente = cargarComponente('src/components/CRM_Module/Administracion/AdministracionComponent.vue', {
    axios: { delete: rechazo409, get: async () => ({ data: [] }) },
    cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente, { tablaSeleccionada: { nombre: 'Gestoras', url: '/gestoras' } });

  await ctx.eliminarRegistro(4);

  assert.match(ctx.avisos.at(-1).text, /está siendo utilizado por otros datos/);
});

function administracion(axios) {
  const componente = cargarComponente('src/components/CRM_Module/Administracion/AdministracionComponent.vue', {
    axios, cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  return crearContexto(componente);
}

test('en Niveles de Acceso se puede guardar un registro (su campo obligatorio es «Nivel», no «Nombre»)', async () => {
  const enviados = [];
  const ctx = administracion({ post: async (url, datos) => { enviados.push(datos); return { data: {} }; }, get: async () => ({ data: [] }) });
  ctx.tablaSeleccionada = ctx.tablas.find((t) => t.nombre === 'Niveles de Acceso');
  ctx.columnas = ['id', 'nivel', 'descripcion'];
  ctx.registro = { nivel: '3', descripcion: 'Consulta' };

  await ctx.guardarRegistro();

  assert.deepEqual(enviados, [{ nivel: '3', descripcion: 'Consulta' }]);
  assert.equal(ctx.campoObligatorio, 'nivel');
});

test('las tablas que el servidor solo deja consultar no ofrecen crear, editar ni eliminar', () => {
  const ctx = administracion({});
  for (const nombre of ['Distribuidoras', 'Propiedades', 'Tipos de Contador', 'Tipos de Comunicación']) {
    ctx.tablaSeleccionada = ctx.tablas.find((t) => t.nombre === nombre);
    assert.equal(ctx.tablaSoloLectura, true, nombre);
  }
  ctx.tablaSeleccionada = ctx.tablas.find((t) => t.nombre === 'Comercializadoras');
  assert.equal(ctx.tablaSoloLectura, false);
  const html = plantilla('src/components/CRM_Module/Administracion/AdministracionComponent.vue');
  assert.match(html, /v-if="!tablaSoloLectura"[^>]*@click="nuevoRegistro"|@click="nuevoRegistro"[^>]*v-if="!tablaSoloLectura"/);
});

test('una tabla vacía muestra sus campos al crear el primer registro', async () => {
  const ctx = administracion({ get: async () => ({ data: [] }) });

  await ctx.seleccionarTabla(ctx.tablas.find((t) => t.nombre === 'Pago Plazos'));

  assert.deepEqual(ctx.columnasFiltradas, ['nombre', 'descripcion', 'numeroCuotas']);
});

test('Puntos de Suministro explica por qué no se puede eliminar un punto (p. ej. tiene contratos)', async () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', {
    axios: { delete: rechazo409, get: async () => ({ data: [] }) },
    cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente);

  await ctx.eliminarPuntoSuministro({ id: 5, CUPSluz: 'ES0001' });

  assert.match(ctx.avisos.at(-1).text, /está siendo utilizado por otros datos/);
});

test('Contratos explica por qué no se puede eliminar un contrato', async () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/ModalContratos.vue', {
    axios: { delete: rechazo409 }, fechaLocalISO: () => '2026-09-14',
  });
  const ctx = crearContexto(componente);

  await ctx.eliminarContrato({ id: 5, contrato: 'CT-1' });

  assert.match(ctx.avisos.at(-1).text, /está siendo utilizado por otros datos/);
});

test('Servicios explica por qué no se puede eliminar un servicio', async () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/ModalServicios.vue', {
    axios: { get: async () => ({ data: null }), delete: rechazo409 },
  });
  const ctx = crearContexto(componente);

  await ctx.eliminarServicio({ id: 8 });

  assert.match(ctx.avisos.at(-1).text, /está siendo utilizado por otros datos/);
});

test('el título de la auditoría de una tarea se lee sobre su cabecera oscura', () => {
  // styles.css pinta todos los h2 en oscuro; la cabecera común los fuerza a blanco
  const vue = leer('src/components/CRM_Module/Tareas/TareaAuditoriaModal.vue');
  assert.match(vue, /class="modal-header aura-modal-header"[\s\S]*?<h2 id="auditoria-modal-title">/);
  const css = leer('src/styles/shared-modal-header.css');
  const regla = css.match(/div\.aura-modal-header\.aura-modal-header :is\(h1, h2, h3, \.modal-title\) \{([^}]*)\}/);
  assert.ok(regla, 'falta la regla de títulos de la cabecera común');
  assert.match(regla[1], /color:\s*#fff !important/);
});
