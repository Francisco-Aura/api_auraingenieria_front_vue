// Respuestas del cliente del 05/11/2026: condiciones de cobro por comercializadora (dudas 8 y 9),
// porcentaje de lo calculado (duda 19), meses desde la última relación (duda 22) y la pestaña
// «Otros datos» del contrato (duda 8).
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

let cobros;
let reglas;
let activacion;
test.before(async () => {
  cobros = await importar('src/components/CRM_Module/MCAS/mcasCobros.js');
  reglas = await importar('src/components/CRM_Module/MCAS/mcasReglas.js');
  activacion = await importar('src/components/CRM_Module/MCAS/mcasActivacion.js');
});

// ---------------------------------------------------------------------------
// mcasCobros.js
// ---------------------------------------------------------------------------

test('el primer cobro se explica en palabras', () => {
  assert.equal(cobros.textoPrimerCobro({}), 'El día de inicio del contrato');
  assert.equal(cobros.textoPrimerCobro({ mesesHastaPrimerCobro: 0, diaPrimerCobro: 'ULTIMO_DIA_MES' }), 'El último día del mes de inicio');
  assert.equal(cobros.textoPrimerCobro({ mesesHastaPrimerCobro: 1, diaPrimerCobro: 'DIA_1' }), 'El día 1 del mes siguiente al de inicio');
  assert.equal(cobros.textoPrimerCobro({ mesesHastaPrimerCobro: 3, diaPrimerCobro: 'ULTIMO_DIA_MES' }), 'El último día 3 meses después del de inicio');
  assert.equal(cobros.textoPrimerCobro({ mesesHastaPrimerCobro: 2 }), '2 meses después del inicio, el mismo día');
  assert.equal(cobros.textoPagosCobro(null), '1 pago');
  assert.equal(cobros.textoPagosCobro(1), '1 pago');
  assert.equal(cobros.textoPagosCobro(3), '3 pagos');
});

test('las fechas de ejemplo salen igual que en el servidor', () => {
  // Ejemplo del cliente: tramitado el 10/11/2026, se cobra el 30/11 o el 01/12
  assert.deepEqual(cobros.fechasCobro({ mesesHastaPrimerCobro: 0, diaPrimerCobro: 'ULTIMO_DIA_MES' }, '2026-11-10', 2),
    ['30/11/2026', '31/12/2026']);
  assert.deepEqual(cobros.fechasCobro({ mesesHastaPrimerCobro: 1, diaPrimerCobro: 'DIA_1' }, '2026-11-10', 2),
    ['01/12/2026', '01/01/2027']);
  // El mismo día se cuenta desde el inicio: no se queda en el 28
  assert.deepEqual(cobros.fechasCobro({}, '2026-01-31', 3), ['31/01/2026', '28/02/2026', '31/03/2026']);
  assert.equal(cobros.ejemploCobro({ numeroPagos: 5, mesesHastaPrimerCobro: 0, diaPrimerCobro: 'ULTIMO_DIA_MES' }),
    'Un contrato que empiece el 10/11/2026 se cobraría el 30/11/2026, 31/12/2026 y 31/01/2027 (y así hasta 5 pagos).');
});

test('el formulario de cobros se valida con sus palabras y no deja repetir', () => {
  const existentes = [{ id: 1, idComercializadora: 5, idGestora: null }, { id: 2, idComercializadora: 5, idGestora: 3 }];
  assert.deepEqual(cobros.validarCondicionCobro({ ...cobros.condicionCobroVacia() }, existentes),
    { idComercializadora: 'Seleccione una comercializadora' });
  assert.deepEqual(cobros.validarCondicionCobro({ idComercializadora: 5, idGestora: null, mesesHastaPrimerCobro: 0 }, existentes),
    { idGestora: 'Esa comercializadora ya tiene sus condiciones generales: edítelas' });
  assert.deepEqual(cobros.validarCondicionCobro({ idComercializadora: 5, idGestora: 3, mesesHastaPrimerCobro: 0 }, existentes),
    { idGestora: 'Esa comercializadora ya tiene condiciones para esta gestora: edítelas' });
  // Editando la misma fila no cuenta como repetida
  assert.deepEqual(cobros.validarCondicionCobro({ id: 1, idComercializadora: 5, idGestora: null, mesesHastaPrimerCobro: 0 }, existentes), {});
  assert.deepEqual(cobros.validarCondicionCobro({ idComercializadora: 6, numeroPagos: 13, mesesHastaPrimerCobro: 30 }, existentes),
    { numeroPagos: 'Entre 1 y 12 pagos', mesesHastaPrimerCobro: 'Entre 0 y 24 meses' });
});

// ---------------------------------------------------------------------------
// Configuración MCAS › Cobros
// ---------------------------------------------------------------------------

function importadoDe(modulo, exportaciones) {
  const linea = leer(ADMIN).match(new RegExp(String.raw`^import \{([^}]+)\} from '\./` + modulo + "'", 'm'));
  assert.ok(linea, `el import de ${modulo} debe ocupar una sola línea`);
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, exportaciones[n]]));
}

function configuracion(peticiones = [], respuestas = {}) {
  const responder = (metodo) => async (url, datos) => {
    peticiones.push({ metodo, url, datos });
    return { data: respuestas[`${metodo} ${url}`] ?? {} };
  };
  const componente = cargarComponente(ADMIN, {
    ...importadoDe('mcasReglas', reglas),
    ...importadoDe('mcasActivacion', activacion),
    ...importadoDe('mcasCobros', cobros),
    axios: { get: responder('get'), post: responder('post'), put: responder('put'), delete: responder('delete') },
    confirmar: async () => true,
    mostrarError: (swal, title, text) => swal.fire({ icon: 'error', title, text }),
    mostrarExito: (swal, title, text) => swal.fire({ icon: 'success', title, text }),
    mostrarAviso: (swal, title, text) => swal.fire({ icon: 'warning', title, text }),
    textoError: (e, base) => base,
  });
  const ctx = crearContexto(componente);
  ctx.comercializadoras = [{ id: 5, nombre: 'IBERDROLA' }, { id: 6, nombre: 'ENDESA' }];
  ctx.gestoras = [{ id: 3, nombre: 'Nexo' }];
  return ctx;
}

test('la pestaña «Cobros» va detrás de Productos con su tabla, su botón y su modal', () => {
  const ctx = configuracion();
  assert.deepEqual(ctx.tabs.map((t) => t.id), ['conjuntos', 'reglas', 'productos', 'cobros', 'zonas', 'retrocesiones']);
  ctx.tabActivo = 'cobros';
  assert.deepEqual(ctx.columnasActivas.map((c) => c.label), ['Comercializadora', 'Gestora', 'Pagos', 'Primer cobro']);
  assert.equal(ctx.estadoVacio.texto, 'Todavía no hay condiciones de cobro');
  const html = plantilla(ADMIN);
  assert.match(html, /v-if="tabActivo === 'cobros'" class="btn btn-primary" @click="abrirModalCobro\(\)"/);
  assert.match(html, /<div v-if="modalCobro" class="mcas-modal-overlay"/);
  assert.match(html, /title="Editar condiciones de cobro" aria-label="Editar condiciones de cobro"/);
  assert.match(html, /title="Eliminar condiciones de cobro" aria-label="Eliminar condiciones de cobro"/);
});

test('se cargan, se guardan con números y se eliminan las condiciones de cobro', async () => {
  const peticiones = [];
  const lista = [{ id: 1, idComercializadora: 5, idGestora: null, numeroPagos: 3, mesesHastaPrimerCobro: 1, diaPrimerCobro: 'DIA_1' }];
  const ctx = configuracion(peticiones, { 'get /mcas/condiciones-cobro': lista });
  await ctx.cargarCobros();
  assert.deepEqual(ctx.condicionesCobro, lista);
  assert.equal(ctx.contadorTab('cobros'), 1);
  assert.equal(ctx.textoPrimerCobro(lista[0]), 'El día 1 del mes siguiente al de inicio');

  ctx.abrirModalCobro();
  Object.assign(ctx.formCobro, { idComercializadora: '6', idGestora: null, numeroPagos: '2', mesesHastaPrimerCobro: '0',
    diaPrimerCobro: 'ULTIMO_DIA_MES', observaciones: '  a final de mes  ' });
  await ctx.guardarCobro();
  const alta = peticiones.find((p) => p.metodo === 'post');
  assert.equal(alta.url, '/mcas/condiciones-cobro');
  assert.deepEqual(alta.datos, { idComercializadora: 6, idGestora: null, numeroPagos: 2, mesesHastaPrimerCobro: 0,
    diaPrimerCobro: 'ULTIMO_DIA_MES', observaciones: 'a final de mes' });

  // Repetir las generales de IBERDROLA no se envía
  ctx.abrirModalCobro();
  Object.assign(ctx.formCobro, { idComercializadora: 5 });
  await ctx.guardarCobro();
  assert.equal(peticiones.filter((p) => p.metodo === 'post').length, 1);
  assert.match(ctx.erroresForm.idGestora, /ya tiene sus condiciones generales/);

  await ctx.eliminarCobro(lista[0]);
  assert.ok(peticiones.some((p) => p.metodo === 'delete' && p.url === '/mcas/condiciones-cobro/1'));
});

test('si hay comisiones pendientes calculadas antes del cambio, se avisa de recalcularlas', async () => {
  const ctx = configuracion([], { 'post /mcas/condiciones-cobro': { condiciones: { id: 9 }, pendientes: 2 } });
  ctx.abrirModalCobro();
  Object.assign(ctx.formCobro, { idComercializadora: 6, numeroPagos: 3 });
  await ctx.guardarCobro();
  const aviso = ctx.avisos[ctx.avisos.length - 1];
  assert.equal(aviso.icon, 'warning');
  assert.match(aviso.text, /Hay 2 comisiones pendientes de aprobar calculadas antes del cambio: recalcúlelas en Comisiones MCAS/);
});

// ---------------------------------------------------------------------------
// Reglas: porcentaje de lo calculado y meses desde la última relación
// ---------------------------------------------------------------------------

test('la condición de meses desde la última relación se lee, se escribe y se resume', () => {
  const json = '{"segmento":"PYME","meses_ultima_relacion_max":12}';
  const { form, extras } = reglas.leerCondiciones(json);
  assert.equal(form.mesesRelacionMax, 12);
  assert.deepEqual(extras, {});
  assert.equal(reglas.escribirCondiciones(form), json);
  assert.deepEqual(reglas.describirCondiciones(form), ['PYME', 'Meses desde que dejó la comercializadora < 12 meses']);
  assert.deepEqual(reglas.validarCondiciones({ ...reglas.condicionesVacias(), mesesRelacionMin: 12, mesesRelacionMax: 6 }),
    { mesesRelacionMax: 'Debe ser mayor o igual que el mínimo' });
});

test('el % de lo calculado se valida y se guarda como número (vacío o en reglas manuales, nada)', async () => {
  const peticiones = [];
  const ctx = configuracion(peticiones);
  ctx.conjuntosReglas = [{ id: 20, estado: 'BORRADOR', idComercializadora: 5 }];
  ctx.conjuntoParaReglasId = 20;
  ctx.abrirModalRegla();
  assert.equal(ctx.formRegla.porcentajeResultado, null);
  Object.assign(ctx.formRegla, { nombre: 'Rock tácitas', metodoCalculo: 'FIXED_AMOUNT', porcentajeResultado: '250' });
  ctx.editorRegla.calculo.importe = 100;
  assert.equal(ctx.validarRegla().porcentajeResultado, 'Entre 1 y 200 (vacío: todo lo calculado)');
  ctx.formRegla.porcentajeResultado = '80';
  assert.equal(ctx.validarRegla().porcentajeResultado, undefined);
  await ctx.guardarRegla();
  const alta = peticiones.find((p) => p.metodo === 'post');
  assert.equal(alta.datos.porcentajeResultado, 80);

  const html = plantilla(ADMIN);
  assert.match(html, /<input id="mcas-regla-porcentaje" v-model="formRegla\.porcentajeResultado"/);
  assert.match(html, /<option value="">Los de la comercializadora<\/option>/);
  assert.match(html, /id="mcas-cond-meses-max" v-model="editorRegla\.condiciones\.mesesRelacionMax"/);
  assert.doesNotMatch(html, /Potencia de cálculo/);
});

// ---------------------------------------------------------------------------
// Contrato
// ---------------------------------------------------------------------------

test('la pestaña del contrato se llama «Otros datos» y ya no pide el nº de pagos', () => {
  const codigo = leer(CONTRATOS);
  assert.match(codigo, /\{ id: 'mcas', label: 'Otros datos', campos: \['mcasTipoSuministro', 'mcasFeeEurMwh'\] \}/);
  const html = plantilla(CONTRATOS);
  assert.doesNotMatch(html, /nuevoContrato\.mcasNumeroPagos/);
  assert.match(html, /Más datos \(\{\{ camposMcas\.otrosConValor \}\} con valor\)/);
});
