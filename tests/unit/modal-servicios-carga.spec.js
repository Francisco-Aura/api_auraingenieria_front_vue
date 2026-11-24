// Qué pide el modal de servicios al abrirse.
//
// Traía por HTTP la lista de comercializadoras que el padre ya le pasa por prop, y
// además cargaba `puntosSuministro` del cliente en un campo que no lee ni la
// plantilla ni ningún método: una petición entera tirada en cada apertura.
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const RUTA = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';

function montar(peticiones, extras = {}) {
  const axios = {
    get(url) {
      peticiones.push(url);
      return Promise.resolve({ data: [{ id: 99, nombre: 'Del servidor' }] });
    },
  };
  const componente = cargarComponente(RUTA, { axios });
  const ctx = crearContexto(componente, {
    cliente: { id: 5 },
    comercializadoras: [],
    ...extras,
  });
  return { componente, ctx };
}

test('las comercializadoras que ya llegan por prop no se vuelven a pedir', async () => {
  const peticiones = [];
  const { ctx } = montar(peticiones, { comercializadoras: [{ id: 1, nombre: 'Iberdrola' }] });

  await ctx.cargarComercializadoras();

  assert.deepEqual(ctx.comercializadorasList, [{ id: 1, nombre: 'Iberdrola' }]);
  assert.deepEqual(peticiones, []);
});

test('si la prop llega vacía se piden al servidor', async () => {
  const peticiones = [];
  const { ctx } = montar(peticiones);

  await ctx.cargarComercializadoras();

  assert.deepEqual(ctx.comercializadorasList, [{ id: 99, nombre: 'Del servidor' }]);
  assert.equal(peticiones.length, 1);
  assert.ok(peticiones[0].endsWith('/comercializadoras'));
});

test('abrir el modal no pide la lista de puntos de suministro del cliente', async () => {
  const peticiones = [];
  const { componente, ctx } = montar(peticiones);
  const previo = global.localStorage;
  global.localStorage = { getItem: () => null };
  try {
    await componente.mounted.call(ctx);
  } finally {
    if (previo === undefined) delete global.localStorage; else global.localStorage = previo;
  }

  const sobra = peticiones.filter((url) => url.includes('/puntos-suministro/cliente'));
  assert.deepEqual(sobra, [], 'se pide una lista que nadie lee');
});
