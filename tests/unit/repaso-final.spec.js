// Fallos encontrados en el último repaso (Informes, servicios y pagos).
const assert = require('node:assert/strict');
const test = require('node:test');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const SERVICIOS = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';
const INFORMES = 'src/components/CRM_Module/Informes/InformesComponent.vue';

test('un descuento de todo el importe es un importe final de 0 (antes se cobraba entero)', () => {
  const c = cargarComponente(SERVICIOS, {});
  const ctx = crearContexto(c, { nuevoServicio: { importe: 100, descuento: 100, importeFinal: 0 } });
  assert.equal(c.methods.esDescuentoTotal.call(ctx, 100, 100), true);
  assert.equal(c.methods.esDescuentoTotal.call(ctx, 100, 20), false);
  assert.equal(c.methods.esDescuentoTotal.call(ctx, 0, 0), false, 'sin importe, como antes');
  assert.equal(c.methods.descuentoTotalFormulario.call(ctx), true);
});

test('un servicio nuevo o renovado no arrastra lo pagado del vigente', () => {
  const c = cargarComponente(SERVICIOS, {});
  const ctx = crearContexto(c, { modoEdicion: false, pagosExistentes: null, cuotas: [{ pagado: true, importe: 50 }], totalPagado: 50 });
  assert.equal(c.computed.totalPagadoFormulario.call(ctx), 0);
});

test('con la gestión de pagos abierta solo valen las cuotas de su servicio', () => {
  const c = cargarComponente(SERVICIOS, {});
  const abierta = crearContexto(c, { mostrarModalGestionPagos: true, servicioGestionPagos: { id: 7 } });
  assert.equal(c.methods.cuotasDeOtroServicio.call(abierta, 9), true);
  assert.equal(c.methods.cuotasDeOtroServicio.call(abierta, 7), false);
  const cerrada = crearContexto(c, { mostrarModalGestionPagos: false, servicioGestionPagos: null });
  assert.equal(c.methods.cuotasDeOtroServicio.call(cerrada, 9), false);
});

test('Informes: al cambiar de informe se quitan los filtros de columnas que ya no existen', async () => {
  const datos = [{ cliente: 'ACME', tipo: 'Gas' }];
  const c = cargarComponente(INFORMES, { axios: { get: async () => ({ data: datos }) }, Swal: { fire() {} } });
  const ctx = crearContexto(c, {
    tipoSeleccionado: 'contratos-vigentes', mostrarTabla: true,
    columnFilters: { tarifaLuz: '2.0', cliente: 'ac' }, encabezados: [],
  });
  ctx.procesarDatosParaTabla = function () { this.encabezados = ['cliente', 'tipo']; this.datosInforme = datos; };
  ctx.tituloVisible = () => 'Servicios';
  await c.methods.mostrarInforme.call(ctx, 'servicios-vigentes');
  assert.deepEqual(ctx.columnFilters, { cliente: 'ac' });
});

test('Informes: si falla la carga, la tarjeta marcada vuelve a ser la del informe que se ve', async () => {
  const c = cargarComponente(INFORMES, { axios: { get: async () => { throw new Error('500'); } }, Swal: { fire() {} } });
  const ctx = crearContexto(c, { tipoSeleccionado: 'contratos-vigentes', mostrarTabla: true, columnFilters: {} });
  await c.methods.mostrarInforme.call(ctx, 'servicios-vigentes');
  assert.equal(ctx.tipoSeleccionado, 'contratos-vigentes');
});

test('las cuotas se reparten al céntimo y suman exactamente el importe', () => {
  const c = cargarComponente(SERVICIOS, {});
  const ctx = crearContexto(c, {});
  assert.deepEqual(c.methods.repartirEnCuotas.call(ctx, 100, 3), [33.33, 33.33, 33.34]);
  assert.deepEqual(c.methods.repartirEnCuotas.call(ctx, 1200, 12), Array(12).fill(100));
  assert.deepEqual(c.methods.repartirEnCuotas.call(ctx, 50, 0), []);
});

test('al cambiar de modalidad, lo que falta por pagar se reparte entre las cuotas pendientes', async () => {
  const c = cargarComponente(SERVICIOS, {});
  const prefijos = ['primer', 'segundo', 'tercer', 'cuarto', 'quinto', 'sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'decimoprimer', 'decimosegundo'];
  const existentes = { id: 5 };
  prefijos.forEach((p, i) => { existentes[`${p}PagoImporte`] = 100; existentes[`${p}PagoPagado`] = i < 3; existentes[`${p}PagoFecha`] = `2026-0${(i % 9) + 1}-01`; });
  const generados = {};
  prefijos.slice(0, 6).forEach((p) => { generados[`${p}PagoImporte`] = 200; generados[`${p}PagoFecha`] = '2026-01-01'; });
  const ctx = crearContexto(c, {
    nuevoServicio: { importe: 1200, descuento: 0, importeFinal: 1200, idPagoPlazos: 6 },
    pagosExistentes: existentes,
  });
  ctx.obtenerNumeroCuotasNuevaModalidad = () => 6;
  ctx.obtenerNumeroCuotasActual = () => 12;
  const plan = await c.methods.fusionarCuotasConNuevoPlan.call(ctx, 9, generados);
  const importes = prefijos.slice(0, 6).map((p) => plan[`${p}PagoImporte`]);
  assert.deepEqual(importes, [100, 100, 100, 300, 300, 300]);
  assert.equal(importes.reduce((a, b) => a + b, 0), 1200, 'el plan suma el importe del servicio');
});
