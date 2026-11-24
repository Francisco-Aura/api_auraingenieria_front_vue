// El plan de cuotas se pedía al servidor desde tres sitios del mismo método, con
// el bloque try/catch copiado tal cual en los tres. Ahora sale de un solo método.
const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarComponente, crearContexto, leer } = require('./helpers/sfc');

const RUTA = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';

function montar(respuesta) {
  const enviado = [];
  const axios = {
    post(url, cuerpo) {
      enviado.push({ url, cuerpo });
      return respuesta();
    },
    get() { return Promise.resolve({ data: [] }); },
  };
  const componente = cargarComponente(RUTA, { axios });
  const ctx = crearContexto(componente, { cliente: { id: 5 }, comercializadoras: [] });
  return { ctx, enviado };
}

test('el plan de cuotas se pide desde un solo sitio', () => {
  const veces = leer(RUTA).split('servicios-pagos/generar-plan').length - 1;
  assert.equal(veces, 1, 'la petición del plan sigue duplicada');
});

test('devuelve el plan tal cual lo manda el servidor', async () => {
  const plan = { primerPagoImporte: 120.5, primerPagoFecha: '2026-01-31' };
  const { ctx, enviado } = montar(() => Promise.resolve({ data: plan }));
  ctx.nuevoServicio.idPagoPlazos = 3;
  ctx.nuevoServicio.importeFinal = 241;
  ctx.nuevoServicio.fechaInicioServicio = '2026-01-31';

  assert.deepEqual(await ctx.generarPlanDePagos(), plan);
  assert.equal(enviado.length, 1);
  assert.ok(enviado[0].url.endsWith('/servicios-pagos/generar-plan'));
  assert.deepEqual(enviado[0].cuerpo, {
    idPagoPlazos: 3,
    importeTotal: 241,
    fechaInicio: '2026-01-31',
  });
});

test('si el servidor falla, el aviso sigue siendo el de siempre', async () => {
  const { ctx } = montar(() => Promise.reject(new Error('500')));

  await assert.rejects(() => ctx.generarPlanDePagos(),
    (e) => e.message === 'No se pudo generar el nuevo plan de pagos');
});
