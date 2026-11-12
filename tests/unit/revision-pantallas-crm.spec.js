// Fallos de la última revisión de Clientes, Puntos de suministro, Servicios e Informes.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, cargarComponente, crearContexto } = require('./helpers/sfc');

const SERVICIOS = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';
const PUNTOS = 'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
const FICHA_PUNTO = 'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';
const CLIENTES = 'src/components/CRM_Module/Clientes/ClientesComponent.vue';
const FICHA_CLIENTE = 'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue';
const INFORMES = 'src/components/CRM_Module/Informes/InformesComponent.vue';

const fechas = () => import(pathToFileURL(path.join(raiz, 'src/utils/fechas.js')).href);
const PREFIJOS = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'decimoprimer', 'decimosegundo'];

test('editar un servicio: el formulario no se enseña hasta tener su plan de pagos', async () => {
  let soltarPagos;
  const axios = {
    get: (url) => {
      if (url.endsWith('/servicios/7')) return Promise.resolve({ data: { id: 7, importe: 100, descuento: 0 } });
      if (url.endsWith('/servicios-pagos/servicio/7')) return new Promise((resolver) => { soltarPagos = resolver; });
      return Promise.resolve({ data: [] });
    },
  };
  const c = cargarComponente(SERVICIOS, { axios });
  const ctx = crearContexto(c, { pagosExistentes: { id: 1, primerPagoPagado: true }, $forceUpdate() {} });
  const edicion = ctx.editarServicioGenerico({ id: 7 });
  await new Promise((r) => setImmediate(r));

  assert.equal(ctx.cargandoDatos, true, 'el esqueleto tapa el formulario');
  assert.equal(ctx.pagosExistentes, null, 'no se usan los pagos del servicio abierto antes');

  soltarPagos({ data: { id: 3, pagoPlazos: { id: 2 }, importe: 100, descuento: 0, importeFinal: 100 } });
  await edicion;
  assert.equal(ctx.cargandoDatos, false);
  assert.equal(ctx.pagosExistentes.id, 3);
  assert.equal(ctx.mostrandoFormulario, true);
});

test('editar un servicio: si no se puede leer su plan de pagos no se deja guardar', async () => {
  const axios = {
    get: async (url) => {
      if (url.endsWith('/servicios/7')) return { data: { id: 7 } };
      throw new Error('500');
    },
  };
  const c = cargarComponente(SERVICIOS, { axios });
  const ctx = crearContexto(c);
  await ctx.editarServicioGenerico({ id: 7 });

  assert.equal(ctx.mostrandoFormulario, false);
  assert.equal(ctx.cargandoDatos, false);
  assert.equal(ctx.avisos.at(-1).icon, 'error');
});

test('borrar un servicio es una sola petición: el servidor borra también su plan', async () => {
  const borrados = [];
  const axios = {
    get: async () => ({ data: { id: 3 } }),
    delete: async (url) => { borrados.push(url); },
  };
  const c = cargarComponente(SERVICIOS, { axios });
  const ctx = crearContexto(c);
  await ctx.eliminarServicio({ id: 7 });
  assert.deepEqual(borrados.map((u) => u.replace(/^.*\/api|^undefined/, '')), ['/servicios/7']);
});

test('las cuotas pagadas que se cuentan son solo las del plan', () => {
  const c = cargarComponente(SERVICIOS, {});
  const pagos = { pagoPlazos: { id: 2, numeroCuotas: 6 } };
  // 1 cuota pagada de verdad; las 6 que el plan no usa se guardan como pagadas
  PREFIJOS.forEach((p, i) => { pagos[`${p}PagoPagado`] = i === 0 || i >= 6; });
  const ctx = crearContexto(c, { pagosExistentes: pagos });
  assert.equal(ctx.contarCuotasPagadas(), 1);
});

test('guardar una cuota que el servidor rechaza enseña su motivo', async () => {
  const axios = { put: async () => { throw { response: { data: { message: 'Importe no válido' } } }; } };
  const c = cargarComponente(SERVICIOS, { axios });
  const ctx = crearContexto(c, { servicioGestionPagos: { id: 7 } });
  await ctx.guardarCuota({ id: 1, numeroPago: 1, pagado: true });
  assert.equal(ctx.avisos.at(-1).text, 'Importe no válido');
});

test('vigente se decide por días: el primer día cuenta y el último no, a cualquier hora', async () => {
  const { enVigorHoy, terminadoHoy } = await fechas();
  assert.equal(enVigorHoy('2026-10-13', '2027-10-13', '2026-10-13'), true);
  assert.equal(enVigorHoy('2025-10-13', '2026-10-13', '2026-10-13'), false);
  assert.equal(enVigorHoy('2026-10-14', '2027-10-14', '2026-10-13'), false, 'empieza mañana');
  assert.equal(enVigorHoy(null, '2027-01-01', '2026-10-13'), false);
  assert.equal(terminadoHoy('2026-10-13', '2026-10-13'), true);
  assert.equal(terminadoHoy('2026-10-14', '2026-10-13'), false);
  assert.equal(terminadoHoy(null, '2026-10-13'), false);
});

test('«Modificar actual» abre el servicio en vigor, no uno que empieza más adelante', async () => {
  const { fechaLocalISO, enVigorHoy, terminadoHoy } = await fechas();
  const c = cargarComponente(PUNTOS, { fechaLocalISO, enVigorHoy, terminadoHoy });
  const hoy = new Date();
  const dia = (d) => fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + d));
  const futuro = { id: 1, fechaInicioServicio: dia(30), fechaFinServicio: dia(400) };
  const vigente = { id: 2, fechaInicioServicio: dia(-30), fechaFinServicio: dia(300) };
  const ctx = crearContexto(c, { servicios: [futuro, vigente] });
  assert.equal(ctx.servicioActual.id, 2);
});

test('Puntos de suministro: ordenar por tarifa y por CUPS usa lo que se ve en la tabla', () => {
  const c = cargarComponente(PUNTOS, { compararValores: (a, b) => (a === b ? 0 : a == null ? 1 : b == null ? -1 : String(a).localeCompare(String(b))) });
  const filas = [
    { id: 1, cupsluz: 'ES0002', tarifaActual: '3.0TD' },
    { id: 2, cupsgas: 'ES0001', tarifaActual: '2.0TD' },
  ];
  const ctx = crearContexto(c, { sortOrder: 'asc' });
  Object.defineProperty(ctx, 'filteredPuntosSuministro', { get: () => filas });
  ctx.sortKey = 'tarifa';
  assert.deepEqual(c.computed.sortedPuntosSuministro.call(ctx).map((f) => f.id), [2, 1]);
  ctx.sortKey = 'cupsluz';
  assert.deepEqual(c.computed.sortedPuntosSuministro.call(ctx).map((f) => f.id), [2, 1], 'el CUPS de gas también ordena');
});

test('Puntos de suministro: cerrar Servicios descarta su carga pendiente', () => {
  const c = cargarComponente(PUNTOS, {});
  const ctx = crearContexto(c, { mostrarModalServicios: true, cargandoServicios: true });
  const vigente = ctx.nuevaPeticionServicios();
  ctx.cerrarModalServicios();
  assert.equal(vigente(), false);
  assert.equal(ctx.cargandoServicios, false);
});

test('ficha del punto: si las listas no cargan se conserva lo que tenía (antes se borraba al guardar)', async () => {
  const c = cargarComponente(FICHA_PUNTO, { axios: { get: async () => { throw new Error('500'); } } });
  const ctx = crearContexto(c, { distribuidoras: [], tiposContador: [], tiposComunicacion: [], propiedades: [] });
  const punto = { id: 4, distribuidora: { id: 3 }, tipoContador: { id: 2 }, tipoComunicacion: { id: 1 }, propiedad: { id: 5 } };
  await ctx.initializePuntoLocal(punto);
  assert.equal(ctx.puntoLocal.distribuidora.id, 3);
  assert.equal(ctx.puntoLocal.tipoContador.id, 2);
  assert.equal(ctx.puntoLocal.tipoComunicacion.id, 1);
  assert.equal(ctx.puntoLocal.propiedad.id, 5);
});

test('Clientes: si falla un desplegable la tabla de clientes se carga igual', async () => {
  const axios = {
    get: async (url) => {
      if (url.endsWith('/integracion-sistemas-fv')) throw new Error('500');
      if (url.endsWith('/clientes/cartera')) return { data: [{ id: 1, nombre: 'ACME' }] };
      return { data: [] };
    },
  };
  const c = cargarComponente(CLIENTES, { axios });
  const ctx = crearContexto(c, { $forceUpdate() {} });
  const original = global.document;
  global.document = { addEventListener() {}, removeEventListener() {} };
  try {
    await c.mounted.call(ctx);
  } finally {
    global.document = original;
  }
  assert.deepEqual(ctx.clientes.map((cl) => cl.id), [1]);
  assert.equal(ctx.avisos.length, 1, 'se avisa del fallo');
});

test('Clientes: el filtro de columna encuentra el 0', () => {
  const c = cargarComponente(CLIENTES, {});
  const ctx = crearContexto(c, {
    clientes: [{ id: 1, numeroPuntosSuministro: 0 }, { id: 2, numeroPuntosSuministro: 3 }],
    columnFilters: { numeroPuntosSuministro: '0' }, searchTerm: '', selectedSectores: [], mostrarClientesDadosDeBaja: false,
  });
  ctx.estaClienteDadoDeBaja = () => false;
  assert.deepEqual(c.computed.filteredClientes.call(ctx).map((cl) => cl.id), [1]);
});

test('ficha de cliente: quien no puede elegir el usuario asignado puede guardar sin él', () => {
  const c = cargarComponente(FICHA_CLIENTE, {});
  const cliente = {
    id: 9, nombre: 'ACME', grupoEmpresarial: 'G', cif: 'B1', direccion: 'C', poblacion: 'P', provincia: 'Valencia',
    codigoPostal: '1', iban: 'ES', codigoSector: 1, codigoSubtipologia: 1, idUsuario: '',
  };
  const normal = crearContexto(c, { clienteLocal: { ...cliente } });
  Object.defineProperty(normal, 'isAdvancedUser', { get: () => false });
  assert.equal(normal.validarFormulario(), true);

  const admin = crearContexto(c, { clienteLocal: { ...cliente } });
  Object.defineProperty(admin, 'isAdvancedUser', { get: () => true });
  assert.equal(admin.validarFormulario(), false, 'el administrador sigue teniendo que elegirlo');
});

test('ficha de cliente: al cargar, las notas fijadas van primero', () => {
  const c = cargarComponente(FICHA_CLIENTE, {});
  const ctx = crearContexto(c);
  const notas = ctx.ordenarNotas([
    { comentarioId: 1, fijado: false, fechaCreacion: '2026-10-10T10:00:00' },
    { comentarioId: 2, fijado: true, fechaCreacion: '2026-01-01T10:00:00' },
    { comentarioId: 3, fijado: false, fechaCreacion: '2026-10-12T10:00:00' },
  ]);
  assert.deepEqual(notas.map((n) => n.comentarioId), [2, 3, 1]);
});

test('ficha de cliente: una respuesta tardía de otro cliente no se pinta', async () => {
  let soltar;
  const tareasApi = { obtenerNotasCliente: () => new Promise((r) => { soltar = r; }) };
  const c = cargarComponente(FICHA_CLIENTE, { tareasApi });
  const ctx = crearContexto(c, { clienteLocal: { id: 1 }, notasCliente: [] });
  const carga = ctx.cargarNotasCliente();
  ctx.clienteLocal = { id: 2 };
  soltar([{ comentarioId: 99 }]);
  await carga;
  assert.deepEqual(ctx.notasCliente, []);
});

test('Informes: «Pagado» marca la cuota que se ve en la fila', async () => {
  const llamadas = [];
  const axios = { put: async (url, cuerpo, opciones) => { llamadas.push([url, opciones?.params]); }, get: async () => ({ data: [] }) };
  const c = cargarComponente(INFORMES, { axios, Swal: { fire() {} } });
  const ctx = crearContexto(c, { tipoSeleccionado: 'servicios-pendientes-pago' });
  ctx.mostrarInforme = async () => {};
  await ctx.marcarSiguientePago({ idServicio: 7, siguientePagoNumero: 3 });
  assert.match(llamadas[0][0], /\/informes\/servicios-pendientes-pago\/actualizar-pago\/7\/3$/);
  assert.deepEqual(llamadas[0][1], { pagado: true });
});

test('Informes: «Puntos sin contrato» enseña el CUPS', () => {
  const c = cargarComponente(INFORMES, {});
  const ctx = crearContexto(c, { tipoSeleccionado: 'puntos-suministro-sin-contrato' });
  ctx.procesarDatosParaTabla([{ idPS: '1', cliente: 'ACME', cupsLuz: '', cupsGas: 'ES0001GAS', direccion: 'C/ 1' }]);
  assert.ok(ctx.encabezados.includes('cups'));
  assert.equal(ctx.datosInforme[0].cups, 'ES0001GAS');
});

test('el nombre de una descarga con «;» llega entero', async () => {
  const { nombreDeCabecera } = await import(pathToFileURL(path.join(raiz, 'src/utils/descargas.js')).href);
  assert.equal(nombreDeCabecera({ 'content-disposition': 'attachment; filename="Acta; reunión.pdf"' }, 'x'), 'Acta; reunión.pdf');
  assert.equal(nombreDeCabecera({ 'Content-Disposition': 'attachment; filename=informe.xlsx' }, 'x'), 'informe.xlsx');
  assert.equal(nombreDeCabecera({}, 'alternativo.pdf'), 'alternativo.pdf');
});

test('los planes de pagos de los servicios de un punto se piden de una vez', async () => {
  const pedidas = [];
  const axios = {
    get: async (url, opciones) => {
      pedidas.push([url.replace(/^undefined/, ''), opciones?.params]);
      return { data: [{ id: 50, servicio: { id: 1 } }, { id: 52, servicio: { id: 3 } }] };
    },
  };
  const c = cargarComponente(PUNTOS, { axios });
  const ctx = crearContexto(c);
  const servicios = await ctx.cargarDatosDePagosParaServicios([{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(pedidas, [['/servicios-pagos/servicios', { ids: '1,2,3' }]]);
  assert.deepEqual(servicios.map((s) => s.pagos?.id ?? null), [50, null, 52]);
});

test('si el servidor aún no tiene esa ruta, se piden uno a uno como antes', async () => {
  const pedidas = [];
  const axios = {
    get: async (url) => {
      const ruta = url.replace(/^undefined/, '');
      pedidas.push(ruta);
      if (ruta === '/servicios-pagos/servicios') throw { response: { status: 404 } };
      return { data: ruta.endsWith('/1') ? { id: 50 } : {} };
    },
  };
  const c = cargarComponente(PUNTOS, { axios });
  const ctx = crearContexto(c);
  const servicios = await ctx.cargarDatosDePagosParaServicios([{ id: 1 }, { id: 2 }]);
  assert.deepEqual(pedidas, ['/servicios-pagos/servicios', '/servicios-pagos/servicio/1', '/servicios-pagos/servicio/2']);
  assert.deepEqual(servicios.map((s) => s.pagos?.id ?? null), [50, null]);
});

test('un servicio terminado sin plan de pagos sale HISTÓRICO, como en el informe de pendientes', () => {
  const c = cargarComponente(SERVICIOS, { axios: {} });
  const ctx = crearContexto(c);
  const terminado = { fechaInicioServicio: '2024-01-01', fechaFinServicio: '2025-01-01' };

  assert.equal(ctx.obtenerEstadoServicio({ ...terminado, pagos: null }), 'HISTÓRICO');
  const pagado = { pagoPlazos: { numeroCuotas: 1 }, primerPagoPagado: true };
  assert.equal(ctx.obtenerEstadoServicio({ ...terminado, pagos: pagado }), 'HISTÓRICO');
  const debe = { pagoPlazos: { numeroCuotas: 2 }, primerPagoPagado: true, segundoPagoPagado: false };
  assert.equal(ctx.obtenerEstadoServicio({ ...terminado, pagos: debe }), 'PENDIENTE');
});
