// Peticiones repetidas al abrir el formulario de contrato.
//
// `asegurarComercializadorasCargadas` —que se llama desde los cinco puntos de
// entrada del formulario— pedía siempre gestoras y productos comerciales MCAS,
// estuvieran ya cargados o no, y `cargarComercializadoras` volvía a lanzarlas.
// Y en `mounted` la lista de comercializadoras se pedía aunque el propio código
// acabara de comprobar que ya estaba.
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const RUTA = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';

function montar(peticiones, extras = {}, fallar = () => false) {
  const axios = {
    get(url) {
      peticiones.push(url);
      if (fallar(url)) return Promise.reject(new Error('500'));
      return Promise.resolve({ data: [{ id: 1, nombre: 'Uno' }] });
    },
  };
  const componente = cargarComponente(RUTA, { axios });
  const ctx = crearContexto(componente, { comercializadoras: [{ id: 1, nombre: 'Uno' }], ...extras });
  return { componente, ctx };
}

const cuenta = (peticiones, sufijo) => peticiones.filter((url) => url.endsWith(sufijo)).length;

test('gestoras y productos MCAS se piden una sola vez por modal', async () => {
  const peticiones = [];
  const { ctx } = montar(peticiones);

  await ctx.asegurarComercializadorasCargadas();
  await ctx.asegurarComercializadorasCargadas();
  await ctx.asegurarComercializadorasCargadas();

  assert.equal(cuenta(peticiones, '/gestoras'), 1);
  assert.equal(cuenta(peticiones, '/mcas/productos-comerciales'), 1);
});

test('si la carga falla se puede reintentar', async () => {
  const peticiones = [];
  let caido = true;
  const { ctx } = montar(peticiones, {}, (url) => caido && url.endsWith('/gestoras'));

  await ctx.cargarGestorasYProductos();
  assert.deepEqual(ctx.gestorasList, []);

  caido = false;
  await ctx.cargarGestorasYProductos();

  assert.deepEqual(ctx.gestorasList, [{ id: 1, nombre: 'Uno' }]);
});

test('mounted no pide las comercializadoras si ya están en la lista (aunque falten tarifas)', async () => {
  const peticiones = [];
  const { componente, ctx } = montar(peticiones, {
    visible: true,
    tarifasGas: [],
    tarifasLuz: [{ id: 1 }],
  });
  ctx.comercializadorasList = [{ id: 1, nombre: 'Uno' }];

  const previo = global.localStorage;
  global.localStorage = { getItem: () => null };
  try {
    await componente.mounted.call(ctx);
  } finally {
    if (previo === undefined) delete global.localStorage; else global.localStorage = previo;
  }

  assert.equal(cuenta(peticiones, '/comercializadoras'), 0);
});
