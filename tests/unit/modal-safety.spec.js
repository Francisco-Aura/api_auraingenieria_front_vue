const assert = require('node:assert/strict');
const test = require('node:test');
const { cargarComponente } = require('./helpers/sfc');


// Mismo cargador que el resto de tests: lo que el componente importa de src/utils es real
function loadComponent(relativePath, axios) {
  return cargarComponente(relativePath, { axios, Spinner: {}, jsPDF: class {} });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function createContext(component, overrides = {}) {
  const context = {
    ...component.data(),
    $emit() {},
    $nextTick: async () => {},
    $refs: {},
    $swal: {
      fire: async () => ({}),
      showLoading() {},
    },
    ...overrides,
  };

  for (const [name, method] of Object.entries(component.methods)) {
    if (!(name in overrides)) context[name] = method.bind(context);
  }
  return context;
}

test('watchers de servicio guardan importeFinal como numero', () => {
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue',
    {},
  );
  const context = createContext(component, {
    calcularImporteFinal: () => '87.50',
  });

  component.watch['nuevoServicio.importe'].call(context);
  assert.equal(context.nuevoServicio.importeFinal, 87.5);
  assert.equal(typeof context.nuevoServicio.importeFinal, 'number');

  context.nuevoServicio.importeFinal = 0;
  component.watch['nuevoServicio.descuento'].call(context);
  assert.equal(context.nuevoServicio.importeFinal, 87.5);
  assert.equal(typeof context.nuevoServicio.importeFinal, 'number');
});

test('guardarServicio ignora un segundo envio mientras el primero sigue pendiente', async () => {
  const request = deferred();
  let mutations = 0;
  const axios = {
    post: async () => {
      mutations += 1;
      return request.promise;
    },
    put: async () => {
      mutations += 1;
      return request.promise;
    },
  };
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue',
    axios,
  );
  const context = createContext(component, {
    validarServicio: () => true,
    confirmarCambioModalidadPagoSiAplica: async () => ({ proceder: true }),
  });
  Object.assign(context.nuevoServicio, {
    idPuntoSuministro: 1,
    importe: 10,
    descuento: 0,
    importeFinal: 10,
    idPagoPlazos: null,
  });

  const first = component.methods.guardarServicio.call(context);
  const second = component.methods.guardarServicio.call(context);
  await new Promise(setImmediate);

  assert.equal(mutations, 1);
  request.resolve({ data: { id: 1 } });
  await Promise.all([first, second]);
  assert.equal(context.guardando, false);
});

test('guardarContrato ignora un segundo envio mientras el primero sigue pendiente', async () => {
  const request = deferred();
  let mutations = 0;
  const axios = {
    post: async () => {
      mutations += 1;
      return request.promise;
    },
    put: async () => {
      mutations += 1;
      return request.promise;
    },
  };
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
    axios,
  );
  const context = createContext(component, {
    validarContrato: () => true,
  });

  const first = component.methods.guardarContrato.call(context);
  const second = component.methods.guardarContrato.call(context);
  await new Promise(setImmediate);

  assert.equal(mutations, 1);
  request.resolve({ data: { id: 1 } });
  await Promise.all([first, second]);
  assert.equal(context.guardando, false);
});

test('MCAS normaliza FEE con coma y rechaza valores negativos', () => {
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
    {},
  );
  const context = createContext(component);

  assert.equal(component.methods.normalizarDecimalMcas.call(context, '7,25'), 7.25);
  assert.equal(component.methods.normalizarDecimalMcas.call(context, '1.234,56'), 1234.56);
  assert.equal(component.methods.normalizarDecimalMcas.call(context, '-1'), null);
  assert.equal(component.methods.normalizarDecimalMcas.call(context, 'abc'), null);
});

test('guardarServicio con pagos usa una sola mutacion atomica', async () => {
  const calls = [];
  const axios = {
    post: async (url, payload) => {
      calls.push({ method: 'post', url, payload });
      if (url.endsWith('/servicios-pagos/generar-plan')) {
        return {
          data: {
            primerPagoFecha: '2026-08-11',
            primerPagoImporte: 100,
            primerPagoPagado: false,
          },
        };
      }
      return { data: { id: 73 } };
    },
    put: async (url, payload) => {
      calls.push({ method: 'put', url, payload });
      return { data: { id: 73 } };
    },
  };
  const component = loadComponent(
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue',
    axios,
  );
  const context = createContext(component, {
    validarServicio: () => true,
    confirmarCambioModalidadPagoSiAplica: async () => ({ proceder: true }),
  });
  Object.assign(context.nuevoServicio, {
    idPuntoSuministro: 1,
    idProducto: 2,
    idGestora: 3,
    idComercializadora: 4,
    idPagoPlazos: 5,
    fechaInicioServicio: '2026-08-11',
    fechaFinServicio: '2027-08-11',
    importe: 100,
    descuento: 0,
    importeFinal: 100,
  });

  await component.methods.guardarServicio.call(context);

  const mutationCalls = calls.filter(({ url }) => !url.endsWith('/servicios-pagos/generar-plan'));
  assert.equal(mutationCalls.length, 1);
  assert.match(mutationCalls[0].url, /\/servicios\/guardar-con-pagos$/);
  assert.equal(mutationCalls[0].payload.servicio.importeFinal, 100);
  assert.equal(mutationCalls[0].payload.pagos.pagoPlazos.id, 5);
  assert.equal(mutationCalls[0].payload.pagos.servicio, undefined);
});
