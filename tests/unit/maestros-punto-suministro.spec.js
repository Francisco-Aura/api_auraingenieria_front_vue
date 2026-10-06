// Carga de los desplegables (datos maestros) del punto de suministro.
//
// El modal los pedía dos veces: el watcher `immediate` llamaba a `loadMasterData`
// antes de que `created` terminase su propio Promise.all, así que cada apertura
// lanzaba diez peticiones para seis listas. Y la lista de respaldo era incompleta:
// `loadMasterData` traía cuatro de las seis, dejando «App de monitorización» e
// «Integración sistemas FV» vacías si esa rama era la que ganaba la carrera.
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const RUTA = 'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';

const MAESTROS = [
  'distribuidoras',
  'tipos-contador',
  'tipos-comunicacion',
  'propiedades',
  'app-monitorizacion',
  'integracion-sistemas-fv',
];

/** axios de mentira: devuelve una fila por lista y anota cada URL pedida. */
function axiosFalso(peticiones) {
  return {
    get(url) {
      peticiones.push(url);
      return Promise.resolve({ data: [{ id: 1, nombre: 'Uno' }] });
    },
  };
}

function montar(peticiones) {
  const componente = cargarComponente(RUTA, { axios: axiosFalso(peticiones) });
  const ctx = crearContexto(componente, { modificarPunto: {} });
  ctx.mostrarError = () => {};
  return { componente, ctx };
}

test('la recarga de respaldo trae las seis listas, no cuatro', async () => {
  const peticiones = [];
  const { ctx } = montar(peticiones);

  await ctx.initializePuntoLocal({ id: 7 });

  for (const lista of ['distribuidoras', 'tiposContador', 'tiposComunicacion', 'propiedades',
    'appMonitorizacion', 'integracionSistemasFV']) {
    assert.equal(ctx[lista].length, 1, `la lista ${lista} quedó vacía`);
  }
});

test('abrir el modal no pide dos veces las mismas listas', async () => {
  const peticiones = [];
  const { componente, ctx } = montar(peticiones);

  // Orden real: el watcher `immediate` se dispara antes que `created`.
  const watcher = ctx.initializePuntoLocal({ id: 7 });
  await componente.created.call(ctx);
  await watcher;

  for (const maestro of MAESTROS) {
    const veces = peticiones.filter((url) => url.endsWith(`/${maestro}`)).length;
    assert.equal(veces, 1, `${maestro} se pidió ${veces} veces`);
  }
});
