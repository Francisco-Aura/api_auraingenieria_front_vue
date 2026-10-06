// MCAS · usabilidad (30/09/2026), pestaña «2 · Comisión MCAS» del contrato:
// A1 mensaje real al guardar, A3 errores en su campo, A4 «Mayor potencia» y
// B3 pestaña dinámica con vista previa de la comisión.
const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const CAMPOS = 'src/components/CRM_Module/PuntosSuministro/mcasCamposContrato.js';

const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
let campos;
test.before(async () => { campos = await importar(CAMPOS); });

const vaciar = () => new Promise(setImmediate);
const normalizar = (texto) => String(texto).replace(/\s/g, ' ');

function diferido() {
  let resolve;
  let reject;
  const promise = new Promise((ok, ko) => { resolve = ok; reject = ko; });
  return { promise, resolve, reject };
}

/** Lo que el formulario importa de mcasCamposContrato.js (en una sola línea). */
function importadoDeCampos() {
  const linea = leer(CONTRATOS).match(/^import \{([^}]+)\} from ['"]\.\/mcasCamposContrato['"];?$/m);
  assert.ok(linea, 'el import de mcasCamposContrato debe ocupar una sola línea');
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, campos[n]]));
}

function formulario({ axios = {}, extras = {} } = {}) {
  const componente = cargarComponente(CONTRATOS, { ...importadoDeCampos(), axios, fechaLocalISO: () => '2026-09-30' });
  const ctx = crearContexto(componente, {
    visible: true,
    mostrandoFormulario: true,
    cliente: { id: 3, nombre: 'Cliente Demo', cif: 'B12345678' },
    puntoSuministro: { id: 9, cupsluz: 'ES0021000011111111AB0F' },
    comercializadoras: [{ id: 14, nombre: 'IRIS ENERGIA, S.L.' }],
    tarifasGas: [{ id: 1, nombre: 'Sin Tarifa' }],
    tarifasLuz: [{ id: 2, nombre: 'Sin Tarifa' }, { id: 10, nombre: '3.0TD' }],
    contratos: [],
    contratoActual: null,
    contratosHistoricos: [],
    ...extras,
  });
  return { componente, ctx };
}

const IRIS = {
  idCliente: 3, idPuntoSuministro: 9, contrato: 'CT-2026-0412', fechaEnvio: '2026-09-25', fechaInicio: '2026-10-01',
  fechaFin: '2027-09-30', idComercializadoraActual: 14, idComercializadoraAnterior: '', idTarifaLuz: 10, idTarifaGas: 1,
  consumoAnual: 60000, observaciones: 'Llamar por la tarde', comentarioRenovacion: '', userFO: 'cliente', passwordFO: 'secreto',
  mcasTipoPrecio: 'FIJO', mcasTipoSuministro: 'LUZ', mcasSegmento: 'PYME', mcasEsRenovacion: false, mcasTipoRenovacion: null,
  mcasAmbito: null, mcasIdGestora: null, mcasIdProductoComercial: null, mcasZonaComision: null, mcasFeeEurMwh: '7,5',
  mcasFeeUnidad: 'EUR_MWH', mcasPotenciaCalculo: null, mcasNumeroPagos: 1, mcasFechaPrimeraAplicacion: null,
  mcasAltaNueva: false, mcasFechaUltimaRelacionComercializadora: null,
  pot1: 30, pot2: 45, pot3: 0, pot4: '', pot5: null, pot6: 12,
  potencia1: 0, potencia2: 0, potencia3: 0, potencia4: 0, potencia5: 0, potencia6: 0,
};

const VISTA_IRIS = {
  estado: 'CALCULADO', mensaje: 'Comisión estimada: 571,26 € en 1 pago.', importe: 571.26, numeroPagos: 1,
  calendario: [{ numero: 1, fecha: '2026-10-01', importe: 571.26 }], regla: 'Iris · pyme luz · 44 % del FEE', avisos: [],
  campos: [
    { clave: 'SEGMENTO', etiqueta: 'Segmento', falta: false, valores: ['PYME', 'RESIDENCIAL'], usadoPor: ['Iris · pyme luz'] },
    { clave: 'FEE', etiqueta: 'FEE del contrato', falta: false, valores: [], usadoPor: ['Iris · pyme luz'] },
    { clave: 'CONSUMO', etiqueta: 'Consumo anual', falta: false, valores: [], usadoPor: ['Iris · pyme luz'] },
  ],
};

const RESUMEN = {
  moduloActivo: true, hayPropuesta: true, idPropuesta: 12, estado: 'PENDIENTE_VALIDACION', importe: 571.26, numeroPagos: 1,
  queFalta: [], mensaje: 'Comisión pendiente de aprobar: 571,26 € en 1 pago.', actualizadoEn: '2026-09-30T10:15:00', servicioCreado: false,
};

// ---------------------------------------------------------------------------
// mcasCamposContrato.js: mapeo McasCampo → formulario
// ---------------------------------------------------------------------------

test('cada dato que piden las tablas de comisiones tiene su campo en el formulario', () => {
  const esperado = {
    TIPO_PRECIO: 'mcasTipoPrecio', TIPO_SUMINISTRO: 'mcasTipoSuministro', SEGMENTO: 'mcasSegmento',
    ES_RENOVACION: 'mcasEsRenovacion', TIPO_RENOVACION: 'mcasTipoRenovacion', ALTA_NUEVA: 'mcasAltaNueva',
    AMBITO: 'mcasAmbito', ZONA_COMISION: 'mcasZonaComision', TARIFA_ACCESO: 'idTarifaLuz',
    PRODUCTO: 'mcasIdProductoComercial', CONSUMO: 'consumoAnual', POTENCIA: 'mcasPotenciaCalculo',
    FEE: 'mcasFeeEurMwh', GESTORA: 'mcasIdGestora',
  };
  for (const [clave, campo] of Object.entries(esperado)) {
    assert.equal(campos.campoDeClave(clave, { mcasTipoSuministro: 'LUZ' }), campo, clave);
  }
  // La tarifa de acceso de un contrato de gas es la tarifa de gas.
  assert.equal(campos.campoDeClave('TARIFA_ACCESO', { mcasTipoSuministro: 'GAS' }), 'idTarifaGas');
  assert.equal(campos.campoDeClave('DESCONOCIDO', {}), null);
});

test('sin vista previa se enseñan todos los campos, como antes', () => {
  const todos = campos.organizarCamposMcas({ vistaPrevia: null, contrato: IRIS, esRenovacion: false });
  assert.equal(todos.respaldo, true);
  assert.deepEqual(todos.otros, []);
  assert.deepEqual(todos.soloLectura, []);
  for (const campo of ['mcasTipoPrecio', 'mcasTipoSuministro', 'mcasSegmento', 'mcasEsRenovacion', 'mcasAmbito',
    'mcasZonaComision', 'mcasIdGestora', 'mcasIdProductoComercial', 'mcasFeeEurMwh', 'mcasPotenciaCalculo',
    'mcasNumeroPagos', 'mcasAltaNueva', 'mcasFechaPrimeraAplicacion', 'mcasFechaUltimaRelacionComercializadora']) {
    assert.ok(todos.principales.includes(campo), campo);
  }
  assert.ok(!todos.principales.includes('mcasTipoRenovacion'), 'el tipo de renovación solo en renovaciones');
  const renovacion = campos.organizarCamposMcas({ vistaPrevia: null, contrato: IRIS, esRenovacion: true });
  assert.ok(renovacion.principales.includes('mcasTipoRenovacion'));

  // Una respuesta sin lista de campos tampoco sirve para decidir: se enseña todo.
  assert.equal(campos.organizarCamposMcas({ vistaPrevia: { estado: 'DESACTIVADO' }, contrato: IRIS }).respaldo, true);
});

test('con vista previa se enseña lo básico y lo que pide la comercializadora; el resto, plegado', () => {
  const contrato = { ...IRIS, mcasIdGestora: 4, mcasAmbito: '' };
  const copia = JSON.parse(JSON.stringify(contrato));
  const organizado = campos.organizarCamposMcas({ vistaPrevia: VISTA_IRIS, contrato, esRenovacion: false });

  assert.equal(organizado.respaldo, false);
  assert.deepEqual(organizado.principales,
    ['mcasTipoPrecio', 'mcasTipoSuministro', 'mcasEsRenovacion', 'mcasNumeroPagos', 'mcasSegmento', 'mcasFeeEurMwh']);
  assert.deepEqual(organizado.otros, ['mcasAltaNueva', 'mcasAmbito', 'mcasZonaComision', 'mcasIdGestora',
    'mcasIdProductoComercial', 'mcasPotenciaCalculo', 'mcasFechaPrimeraAplicacion', 'mcasFechaUltimaRelacionComercializadora']);
  // Con valor entre los plegados: alta nueva (false también es un valor) y la gestora.
  assert.equal(organizado.otrosConValor, 2);
  // El consumo se rellena en la pestaña Contrato: aquí solo se enseña.
  assert.deepEqual(organizado.soloLectura, [{ clave: 'CONSUMO', campo: 'consumoAnual', etiqueta: 'Consumo anual', falta: false }]);
  assert.deepEqual(contrato, copia, 'decidir qué se ve nunca borra valores');

  // En una renovación, el tipo de renovación también está siempre a la vista.
  const renovacion = campos.organizarCamposMcas({ vistaPrevia: VISTA_IRIS, contrato, esRenovacion: true });
  assert.ok(renovacion.principales.includes('mcasTipoRenovacion'));
});

test('un campo con error nunca se queda plegado', () => {
  const vista = { ...VISTA_IRIS, campos: [] };
  const organizado = campos.organizarCamposMcas({
    vistaPrevia: vista, contrato: IRIS, esRenovacion: false, errores: { mcasFeeEurMwh: 'El FEE debe ser un número no negativo' },
  });
  assert.ok(organizado.principales.includes('mcasFeeEurMwh'));
  assert.ok(!organizado.otros.includes('mcasFeeEurMwh'));
});

test('las opciones de zona y ámbito salen de la vista previa y conservan el valor guardado', () => {
  assert.deepEqual(campos.opcionesCampoMcas(null, 'ZONA_COMISION', ['ZBR', 'ZAR']), ['ZBR', 'ZAR']);
  const vista = { ...VISTA_IRIS, campos: [{ clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión', falta: true, valores: ['ZAR', 'ZBR', 'ZCR'] }] };
  assert.deepEqual(campos.opcionesCampoMcas(vista, 'ZONA_COMISION', ['ZBR', 'ZAR']), ['ZAR', 'ZBR', 'ZCR']);
  assert.deepEqual(campos.opcionesCampoMcas(vista, 'ZONA_COMISION', ['ZBR', 'ZAR'], 'Z9'), ['ZAR', 'ZBR', 'ZCR', 'Z9']);
  assert.deepEqual(campos.opcionesCampoMcas(vista, 'AMBITO', ['DENTRO', 'FUERA', 'NA']), ['DENTRO', 'FUERA', 'NA']);
});

test('la cabecera dice la comisión estimada, y deja claro que es una estimación', () => {
  const calculado = campos.cabeceraVistaPrevia(VISTA_IRIS, IRIS);
  assert.equal(calculado.tono, 'ok');
  assert.equal(calculado.estimacion, true);
  assert.equal(normalizar(calculado.titulo), 'Comisión estimada: 571,26 € en 1 pago · regla Iris · pyme luz · 44 % del FEE');
  assert.match(calculado.detalle, /Es una estimación/);
  assert.deepEqual(calculado.faltan, []);

  const tresPagos = campos.cabeceraVistaPrevia({ ...VISTA_IRIS, importe: 12000, numeroPagos: 3, regla: null }, IRIS);
  assert.equal(normalizar(tresPagos.titulo), 'Comisión estimada: 12.000,00 € en 3 pagos');

  const conAviso = campos.cabeceraVistaPrevia({ ...VISTA_IRIS, avisos: ['El FEE está por debajo del mínimo'] }, IRIS);
  assert.deepEqual(conAviso.avisos, ['El FEE está por debajo del mínimo']);
});

test('si faltan datos, la cabecera los enumera con el campo al que llevar el foco', () => {
  const vista = {
    estado: 'REQUIERE_DATOS', mensaje: 'Faltan datos para calcular la comisión.', importe: null, numeroPagos: null, avisos: [],
    campos: [
      { clave: 'SEGMENTO', etiqueta: 'Segmento', falta: false, valores: [] },
      { clave: 'FEE', etiqueta: 'FEE del contrato', falta: true, valores: [] },
      { clave: 'TARIFA_ACCESO', etiqueta: 'Tarifa de acceso', falta: true, valores: [] },
    ],
  };
  const cabecera = campos.cabeceraVistaPrevia(vista, IRIS);
  assert.equal(cabecera.tono, 'aviso');
  assert.equal(cabecera.estimacion, false);
  assert.equal(cabecera.titulo, 'Para estimar la comisión falta:');
  assert.deepEqual(cabecera.faltan.map((f) => [f.campo, f.etiqueta]),
    [['mcasFeeEurMwh', 'FEE del contrato'], ['idTarifaLuz', 'Tarifa de acceso']]);
});

test('sin tabla de comisiones, la cabecera explica que se completará a mano', () => {
  // Sin explicación del servidor, el texto de siempre.
  const cabecera = campos.cabeceraVistaPrevia({ estado: 'SIN_REGLAS', mensaje: '', campos: [], avisos: [] }, IRIS);
  assert.match(cabecera.titulo,
    /^Esta comercializadora todavía no tiene tabla de comisiones: la comisión se completará a mano en Comisiones/);
  assert.equal(cabecera.estimacion, false);
  assert.equal(cabecera.tono, 'neutro');

  const desactivado = campos.cabeceraVistaPrevia({ estado: 'DESACTIVADO', mensaje: 'Las comisiones automáticas están desactivadas.', campos: [] }, IRIS);
  assert.equal(desactivado.titulo, 'Las comisiones automáticas están desactivadas.');
});

test('H4 · si no encaja ninguna tabla, la cabecera dice el motivo del servidor y lo que falta, gestora incluida', () => {
  // «Sin reglas» no siempre es «no hay tabla»: puede faltar la gestora, quedar fuera de
  // vigencia o ser indexado con solo tabla fija. El servidor lo explica en el mensaje.
  const porGestora = {
    estado: 'SIN_REGLAS', mensaje: 'Las tablas de esta comercializadora dependen de la gestora: elija la gestora.', regla: null, avisos: [],
    campos: [{ clave: 'GESTORA', etiqueta: 'Gestora', falta: true, valores: [], usadoPor: ['Iberdrola · Nexo'] }],
  };
  const cabecera = campos.cabeceraVistaPrevia(porGestora, IRIS);
  assert.equal(cabecera.titulo, porGestora.mensaje);
  assert.equal(cabecera.tono, 'aviso');
  assert.deepEqual(cabecera.faltan.map((f) => [f.campo, f.etiqueta]), [['mcasIdGestora', 'Gestora']]);

  const fueraDeVigencia = { estado: 'SIN_REGLAS', mensaje: 'Ninguna tabla de comisiones está vigente el 01/10/2026.', campos: [], avisos: [] };
  assert.equal(campos.cabeceraVistaPrevia(fueraDeVigencia, IRIS).titulo, fueraDeVigencia.mensaje);
  assert.deepEqual(campos.cabeceraVistaPrevia(fueraDeVigencia, IRIS).faltan, []);
});

test('H4 · si la vista previa no trae ninguna regla, o no hay comercializadora, no se pliega nada', () => {
  const todos = campos.organizarCamposMcas({ vistaPrevia: null, contrato: IRIS }).principales;

  // Sin reglas que encajen: todo a la vista y la gestora que falta, también.
  const sinReglas = campos.organizarCamposMcas({
    vistaPrevia: { estado: 'SIN_REGLAS', mensaje: 'x', regla: null, campos: [{ clave: 'GESTORA', etiqueta: 'Gestora', falta: true, valores: [], usadoPor: [] }] },
    contrato: IRIS,
  });
  assert.equal(sinReglas.respaldo, false);
  assert.deepEqual(sinReglas.principales, todos);
  assert.deepEqual(sinReglas.otros, []);
  assert.ok(sinReglas.principales.includes('mcasIdGestora'));

  // Ninguna regla citada (ni la aplicada ni las que usan cada dato), sea cual sea el estado.
  for (const estado of ['DESACTIVADO', 'REQUIERE_REVISION_MANUAL', 'NO_COMISIONABLE']) {
    const sinNada = campos.organizarCamposMcas({ vistaPrevia: { estado, mensaje: 'x', regla: null, campos: [] }, contrato: IRIS });
    assert.deepEqual(sinNada.otros, [], estado);
    assert.deepEqual(sinNada.principales, todos, estado);
  }

  // Contrato nuevo sin comercializadora elegida: nada que decidir todavía.
  const sinComercializadora = campos.organizarCamposMcas({ vistaPrevia: VISTA_IRIS, contrato: { ...IRIS, idComercializadoraActual: '' } });
  assert.deepEqual(sinComercializadora.otros, []);
  assert.deepEqual(sinComercializadora.principales, todos);

  // Con reglas que piden datos (aunque aún no haya regla aplicada), sí se pliega el resto.
  const conCandidatas = campos.organizarCamposMcas({
    vistaPrevia: { estado: 'REQUIERE_DATOS', regla: null, campos: [{ clave: 'FEE', etiqueta: 'FEE del contrato', falta: true, valores: [], usadoPor: ['Iris · pyme luz'] }] },
    contrato: IRIS,
  });
  assert.ok(conCandidatas.otros.length > 0);
  assert.ok(conCandidatas.principales.includes('mcasFeeEurMwh'));
});

test('H4 · en el formulario: «Sin reglas» enseña el motivo, todos los campos y marca la gestora', () => {
  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS };
  ctx.vistaPrevia = {
    estado: 'SIN_REGLAS', mensaje: 'Las tablas de esta comercializadora dependen de la gestora: elija la gestora.', regla: null, avisos: [],
    campos: [{ clave: 'GESTORA', etiqueta: 'Gestora', falta: true, valores: [], usadoPor: [] }],
  };
  assert.deepEqual(ctx.gruposCamposMcas.map((g) => g.id), ['principal']);
  assert.equal(ctx.cabeceraMcas.titulo, 'Las tablas de esta comercializadora dependen de la gestora: elija la gestora.');
  assert.deepEqual(ctx.camposFaltanMcas, ['mcasIdGestora']);
  assert.equal(ctx.mcasListo, false);
  assert.match(ctx.tituloMarcaMcas, /elija la gestora\. Gestora$/);

  // Sin comercializadora, tampoco se pliega nada.
  ctx.vistaPrevia = VISTA_IRIS;
  ctx.nuevoContrato = { ...IRIS, idComercializadoraActual: '' };
  assert.deepEqual(ctx.gruposCamposMcas.map((g) => g.id), ['principal']);

  // El texto de «Otros datos» ya no afirma lo que no sabe.
  assert.doesNotMatch(plantilla(CONTRATOS), /La tabla de comisiones de esta comercializadora no los usa/);
});

test('H6 · al renovar, la vista previa se calcula siempre como renovación y el desplegable no se puede cambiar', () => {
  const { ctx } = formulario({ extras: { modoRenovacion: true } });
  ctx.nuevoContrato = { ...IRIS, mcasEsRenovacion: null };
  assert.equal(ctx.cuerpoVistaPrevia().mcasEsRenovacion, true);
  assert.equal(ctx.nuevoContrato.mcasEsRenovacion, null, 'el formulario no se toca');

  const { ctx: nuevo } = formulario();
  nuevo.nuevoContrato = { ...IRIS, mcasEsRenovacion: false };
  assert.equal(nuevo.cuerpoVistaPrevia().mcasEsRenovacion, false);

  const html = plantilla(CONTRATOS);
  assert.match(html, /<select id="mcasEsRenovacion" v-model="nuevoContrato\.mcasEsRenovacion" class="form-select-modern"\s*:disabled="modoRenovacion"/);
  assert.match(html, /modoRenovacion \? 'Las renovaciones siempre se calculan como renovación\.' : 'Las renovaciones pueden tener otra comisión\.'/);
});

test('el resumen de la comisión del contrato se lee en una frase, con lo que falte', () => {
  assert.equal(campos.textoResumenMcas(null), null);
  assert.equal(campos.textoResumenMcas(RESUMEN), 'Comisión pendiente de aprobar: 571,26 € en 1 pago.');
  assert.equal(campos.textoResumenMcas({ ...RESUMEN, estado: 'REQUIERE_DATOS', mensaje: 'La comisión está pendiente de datos.', queFalta: ['FEE del contrato', 'Segmento'] }),
    'La comisión está pendiente de datos. Falta: FEE del contrato, Segmento.');
  // Lo que el mensaje ya nombra no se repite.
  assert.equal(campos.textoResumenMcas({ ...RESUMEN, mensaje: 'Falta el FEE del contrato.', queFalta: ['FEE del contrato'] }),
    'Falta el FEE del contrato.');
});

// ---------------------------------------------------------------------------
// A1 · Mensaje real al guardar
// ---------------------------------------------------------------------------

test('tras guardar, cualquier usuario ve lo que el servidor dice de la comisión', async () => {
  const previo = global.localStorage;
  global.localStorage = { getItem: () => JSON.stringify({ id: 7, nombre: 'María Gestora', nivelAcceso: 2 }) };
  try {
    const gets = [];
    const { ctx } = formulario({ axios: {
      get: async (url) => { gets.push(url); return { data: { ...RESUMEN, estado: 'REQUIERE_DATOS', mensaje: 'La comisión está pendiente de datos.', queFalta: ['FEE del contrato'] } }; },
    } });
    const texto = await ctx.consultarResultadoMcas(500);
    assert.deepEqual(gets, ['/mcas/propuestas/contrato/500/resumen']);
    assert.equal(texto, 'La comisión está pendiente de datos. Falta: FEE del contrato.');
  } finally {
    if (previo === undefined) delete global.localStorage; else global.localStorage = previo;
  }

  const { ctx: caido } = formulario({ axios: { get: async () => { throw new Error('500'); } } });
  assert.equal(await caido.consultarResultadoMcas(500), null, 'sin respuesta no se inventa nada');

  const fuente = leer(CONTRATOS);
  assert.doesNotMatch(fuente, /textoResultadoMcas/);
  assert.doesNotMatch(fuente, /axios\.get\('\/mcas\/propuestas'\)/);
  assert.doesNotMatch(fuente, /configuracion-modulos\/mcas/);
});

test('guardar envía el contrato normalizado, muestra el resumen y avisa a Comisiones', async () => {
  const posts = [];
  const gets = [];
  const eventos = [];
  const previo = global.window;
  global.window = { dispatchEvent: (evento) => { eventos.push(evento.type); return true; } };
  try {
    const { ctx } = formulario({ axios: {
      post: async (url, datos) => { posts.push({ url, datos }); return { data: { id: 500 } }; },
      get: async (url) => { gets.push(url); return { data: url.endsWith('/resumen') ? RESUMEN : [] }; },
    } });
    ctx.nuevoContrato = { ...IRIS, mcasPotenciaCalculo: '12,5' };
    await ctx.guardarContrato();

    const enviado = posts.find((p) => /\/contratos$/.test(p.url));
    assert.ok(enviado, 'no se ha guardado el contrato');
    assert.equal(enviado.datos.mcasFeeEurMwh, 7.5);
    assert.equal(enviado.datos.mcasPotenciaCalculo, 12.5);
    assert.deepEqual([1, 2, 3, 4, 5, 6].map((n) => enviado.datos['potencia' + n]), [30, 45, 0, '', null, 12]);
    assert.deepEqual(gets.filter((u) => u.startsWith('/mcas')), ['/mcas/propuestas/contrato/500/resumen']);
    assert.match(normalizar(ctx.avisos.at(-1).html), /Comisión pendiente de aprobar: 571,26 € en 1 pago\./);
    assert.deepEqual(eventos, ['mcas:propuestas-cambiadas']);
  } finally {
    if (previo === undefined) delete global.window; else global.window = previo;
  }
});

test('al modificar un contrato guardado, la pestaña enseña su comisión actual', async () => {
  const gets = [];
  const { ctx } = formulario({ axios: {
    get: async (url) => { gets.push(url); return { data: url.endsWith('/resumen') ? { ...RESUMEN, queFalta: [] } : [] }; },
  } });
  await ctx.editarContratoGenerico({ ...IRIS, id: 77, potencia1: 30 });
  await vaciar();

  assert.ok(gets.includes('/mcas/propuestas/contrato/77/resumen'));
  assert.equal(ctx.textoComisionActual, 'Comisión pendiente de aprobar: 571,26 € en 1 pago.');
  assert.match(plantilla(CONTRATOS), /v-if="modoEdicion && textoComisionActual"[\s\S]{0,300}Comisión actual:[\s\S]{0,80}\{\{ textoComisionActual \}\}/);

  // Un contrato nuevo no arrastra la comisión del anterior.
  await ctx.crearNuevoContrato();
  assert.equal(ctx.resumenMcas, null);
});

// ---------------------------------------------------------------------------
// A3 · Errores en su campo
// ---------------------------------------------------------------------------

test('los errores de la pestaña de comisión se pintan en su campo', () => {
  const html = plantilla(CONTRATOS);
  for (const campo of ['mcasTipoSuministro', 'mcasFeeEurMwh', 'mcasNumeroPagos']) {
    assert.match(html, new RegExp(`<(?:select|input)[^>]*v-model(?:\\.number)?="nuevoContrato\\.${campo}"[^>]*:class="\\{ 'input-error': errores\\.${campo} \\}"`), campo);
    assert.match(html, new RegExp(`<small v-if="errores\\.${campo}" class="error-text"><i class="fas fa-exclamation-circle"></i> \\{\\{ errores\\.${campo} \\}\\}</small>`), campo);
  }

  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS, mcasTipoSuministro: '', mcasFeeEurMwh: '-3', mcasNumeroPagos: 20 };
  assert.equal(ctx.validarContrato(), false);
  assert.ok(ctx.errores.mcasTipoSuministro && ctx.errores.mcasFeeEurMwh && ctx.errores.mcasNumeroPagos);
  assert.equal(ctx.pestanaConErrores('mcas'), true);
});

// ---------------------------------------------------------------------------
// A4 · «Mayor potencia»
// ---------------------------------------------------------------------------

test('«Mayor potencia» usa la mayor de P1 a P6 y el hueco vacío dice cuál será', () => {
  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS };
  assert.equal(ctx.mayorPotenciaMcas, 45);
  assert.equal(ctx.placeholderPotenciaMcas, 'Vacío = 45 kW (mayor contratada)');
  ctx.usarMayorPotenciaMcas();
  assert.equal(ctx.nuevoContrato.mcasPotenciaCalculo, 45);

  ctx.nuevoContrato = { ...IRIS, pot1: '15.5', pot2: 0, pot6: 0 };
  assert.equal(ctx.placeholderPotenciaMcas, 'Vacío = 15,5 kW (mayor contratada)');

  // P6 ya no manda: si P6 es la menor, se usa la mayor.
  ctx.nuevoContrato = { ...IRIS, pot1: 50, pot2: 0, pot6: 10 };
  assert.equal(ctx.mayorPotenciaMcas, 50);

  // Contrato recién leído, antes de copiar las potencias a los huecos del formulario.
  ctx.nuevoContrato = { potencia1: 8, potencia3: 9.9 };
  assert.equal(ctx.mayorPotenciaMcas, 9.9);

  ctx.nuevoContrato = { ...IRIS, pot1: 0, pot2: 0, pot6: 0 };
  assert.equal(ctx.mayorPotenciaMcas, null);
  assert.equal(ctx.placeholderPotenciaMcas, 'Vacío = mayor potencia contratada');
  ctx.nuevoContrato.mcasPotenciaCalculo = 7;
  ctx.usarMayorPotenciaMcas();
  assert.equal(ctx.nuevoContrato.mcasPotenciaCalculo, 7, 'sin potencias no se toca lo escrito');

  const html = plantilla(CONTRATOS);
  assert.match(html, /v-model="nuevoContrato\.mcasPotenciaCalculo"[\s\S]{0,200}:placeholder="placeholderPotenciaMcas"/);
  assert.match(html, /@click="usarMayorPotenciaMcas"[\s\S]{0,120}Mayor potencia/);
  assert.doesNotMatch(html, /> P6\s*</);
  assert.doesNotMatch(html, /pot6 \|\| nuevoContrato\.pot1/);
});

// ---------------------------------------------------------------------------
// B3 · payloadContrato compartido y vista previa
// ---------------------------------------------------------------------------

test('la vista previa usa una copia del contrato, sin tocar lo que el usuario escribe', () => {
  const { ctx } = formulario({ extras: { modoEdicion: true, contratoEditandoId: 77 } });
  ctx.nuevoContrato = { ...IRIS };
  const cuerpo = ctx.cuerpoVistaPrevia();

  assert.equal(cuerpo.mcasFeeEurMwh, 7.5);
  assert.equal(cuerpo.potencia2, 45);
  assert.equal(cuerpo.id, 77, 'en una modificación viaja el contrato existente');
  for (const privado of ['userFO', 'passwordFO', 'observaciones', 'comentarioRenovacion']) {
    assert.equal(privado in cuerpo, false, `${privado} no hace falta para la comisión`);
  }
  assert.equal(ctx.nuevoContrato.mcasFeeEurMwh, '7,5', 'el hueco del FEE conserva lo escrito');
  assert.equal(ctx.nuevoContrato.potencia2, 0);

  assert.match(leer(CONTRATOS), /this\.payloadContrato\(this\.nuevoContrato\)/);
});

test('la vista previa solo se pide con el formulario abierto y un tipo de precio elegido', () => {
  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS };
  assert.equal(typeof ctx.firmaVistaPrevia, 'string');

  const firma = ctx.firmaVistaPrevia;
  ctx.nuevoContrato.observaciones = 'Otra observación';
  assert.equal(ctx.firmaVistaPrevia, firma, 'escribir observaciones no pide otra vista previa');
  ctx.nuevoContrato.mcasSegmento = 'RESIDENCIAL';
  assert.notEqual(ctx.firmaVistaPrevia, firma);

  ctx.nuevoContrato.mcasTipoPrecio = '';
  assert.equal(ctx.firmaVistaPrevia, null);
  ctx.nuevoContrato.mcasTipoPrecio = 'FIJO';
  ctx.mostrandoFormulario = false;
  assert.equal(ctx.firmaVistaPrevia, null);
  ctx.mostrandoFormulario = true;
  ctx.visible = false;
  assert.equal(ctx.firmaVistaPrevia, null);
});

test('la vista previa espera 600 ms sin cambios y hace una sola petición', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const posts = [];
  const { componente, ctx } = formulario({ axios: {
    post: async (url, datos, opciones) => { posts.push({ url, datos, opciones }); return { data: VISTA_IRIS }; },
  } });
  assert.equal(typeof componente.watch.firmaVistaPrevia, 'function');
  const cambiar = () => componente.watch.firmaVistaPrevia.call(ctx, ctx.firmaVistaPrevia);

  ctx.nuevoContrato = { ...IRIS };
  cambiar();
  t.mock.timers.tick(300);
  ctx.nuevoContrato.mcasSegmento = 'RESIDENCIAL';
  cambiar();
  t.mock.timers.tick(599);
  assert.equal(posts.length, 0);
  assert.equal(ctx.cargandoVistaPrevia, true);

  t.mock.timers.tick(1);
  await vaciar();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, '/mcas/vista-previa');
  assert.equal(posts[0].datos.mcasSegmento, 'RESIDENCIAL');
  assert.equal(posts[0].opciones.headers['Content-Type'], 'application/json');
  assert.deepEqual(ctx.vistaPrevia, VISTA_IRIS);
  assert.equal(ctx.cargandoVistaPrevia, false);

  // Al quitar el tipo de precio se olvida la vista previa y no se pide nada.
  ctx.nuevoContrato.mcasTipoPrecio = '';
  cambiar();
  t.mock.timers.tick(600);
  await vaciar();
  assert.equal(posts.length, 1);
  assert.equal(ctx.vistaPrevia, null);
});

test('una respuesta vieja nunca pisa a una más reciente', async () => {
  const pendientes = [];
  const { ctx } = formulario({ axios: { post: () => { const d = diferido(); pendientes.push(d); return d.promise; } } });
  ctx.nuevoContrato = { ...IRIS };

  const primera = ctx.pedirVistaPrevia();
  const segunda = ctx.pedirVistaPrevia();
  pendientes[1].resolve({ data: { ...VISTA_IRIS, importe: 200 } });
  pendientes[0].resolve({ data: { ...VISTA_IRIS, importe: 100 } });
  await Promise.all([primera, segunda]);
  assert.equal(ctx.vistaPrevia.importe, 200);

  // Si el formulario cambia mientras la petición viaja, su respuesta ya no vale.
  const tercera = ctx.pedirVistaPrevia();
  ctx.programarVistaPrevia(null);
  pendientes[2].resolve({ data: { ...VISTA_IRIS, importe: 300 } });
  await tercera;
  assert.equal(ctx.vistaPrevia, null);
});

test('al cerrar el formulario no queda ninguna vista previa pendiente', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const posts = [];
  const { componente, ctx } = formulario({ axios: { post: async (url) => { posts.push(url); return { data: VISTA_IRIS }; } } });
  ctx.nuevoContrato = { ...IRIS };
  ctx.programarVistaPrevia(ctx.firmaVistaPrevia);

  assert.equal(typeof componente.beforeUnmount, 'function');
  componente.beforeUnmount.call(ctx);
  t.mock.timers.tick(1000);
  assert.deepEqual(posts, []);
});

test('sin respuesta de la vista previa se enseña todo, como antes', async () => {
  const { ctx } = formulario({ axios: { post: async () => { throw new Error('Network Error'); } } });
  ctx.nuevoContrato = { ...IRIS };
  ctx.vistaPrevia = VISTA_IRIS;
  await ctx.pedirVistaPrevia();

  assert.equal(ctx.vistaPrevia, null);
  assert.equal(ctx.errorVistaPrevia, true);
  assert.equal(ctx.camposMcas.respaldo, true);
  assert.deepEqual(ctx.gruposCamposMcas.map((g) => g.id), ['principal']);
  assert.match(ctx.cabeceraMcas.detalle, /No se ha podido calcular la estimación/);
});

test('la marca de la pestaña sigue a la vista previa; lo que falta queda de respaldo', () => {
  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS };
  assert.deepEqual(ctx.mcasFaltan, []);
  assert.equal(ctx.mcasListo, true, 'sin vista previa manda el respaldo');

  ctx.vistaPrevia = { ...VISTA_IRIS, estado: 'REQUIERE_DATOS', campos: [{ clave: 'FEE', etiqueta: 'FEE del contrato', falta: true }] };
  assert.equal(ctx.mcasListo, false);
  assert.equal(ctx.tituloMarcaMcas, 'Para estimar la comisión falta: FEE del contrato');
  assert.deepEqual(ctx.camposFaltanMcas, ['mcasFeeEurMwh']);

  ctx.vistaPrevia = VISTA_IRIS;
  assert.equal(ctx.mcasListo, true);
  assert.match(normalizar(ctx.tituloMarcaMcas), /^Comisión estimada: 571,26 € en 1 pago/);
  assert.deepEqual(ctx.gruposCamposMcas.map((g) => [g.id, g.plegado]), [['principal', false], ['otros', true]]);
  assert.deepEqual(ctx.filasSoloLecturaMcas.map((f) => [f.etiqueta, normalizar(f.valor), f.campo]),
    [['Consumo anual', '60.000 kWh', 'consumoAnual']]);

  // Sin vista previa ni datos básicos, la cabecera de respaldo enlaza cada campo.
  ctx.vistaPrevia = null;
  ctx.nuevoContrato = { ...IRIS, mcasTipoPrecio: '', fechaInicio: '' };
  assert.deepEqual(ctx.cabeceraMcas.faltan.map((f) => f.campo), ['mcasTipoPrecio', 'fechaInicio']);
  assert.equal(ctx.mcasListo, false);
});

test('los enlaces llevan a la pestaña y al campo que hay que rellenar', async () => {
  const enfocados = [];
  const previo = global.document;
  global.document = { getElementById: (id) => ({ focus: () => enfocados.push(id), closest: () => null }) };
  try {
    const { ctx } = formulario();
    ctx.pestanaContrato = 'mcas';
    await ctx.irACampoMcas('consumoAnual');
    assert.equal(ctx.pestanaContrato, 'contrato');
    await ctx.irACampoMcas('mcasFeeEurMwh');
    assert.equal(ctx.pestanaContrato, 'mcas');
    await ctx.irACampoMcas('fechaInicio');
    assert.equal(ctx.pestanaContrato, 'contrato');
    await ctx.irACampoMcas('idTarifaLuz');
    assert.deepEqual(enfocados, ['consumoAnual', 'mcasFeeEurMwh', 'fechaInicioContrato', 'tarifaLuz']);
  } finally {
    if (previo === undefined) delete global.document; else global.document = previo;
  }
});

test('la zona se propone por el CUPS cuando la tabla de comisiones la usa, no por el nombre', async () => {
  const conZona = (valores = ['ZBR', 'ZAR']) => ({ ...VISTA_IRIS, campos: [{ clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión', falta: true, valores }] });

  const endesa = formulario({ extras: { comercializadoras: [{ id: 14, nombre: 'ENDESA ENERGIA S.A.U.' }] } }).ctx;
  endesa.nuevoContrato = { ...IRIS };
  endesa.vistaPrevia = conZona();
  endesa.sugerirZonaMcas();
  assert.equal(endesa.nuevoContrato.mcasZonaComision, 'ZAR');

  const zbr = formulario({ extras: { puntoSuministro: { id: 9, CUPSluz: 'ES0031405555555555XY0F' } } }).ctx;
  zbr.nuevoContrato = { ...IRIS };
  zbr.vistaPrevia = conZona();
  zbr.sugerirZonaMcas();
  assert.equal(zbr.nuevoContrato.mcasZonaComision, 'ZBR');

  const iberdrolaSinZona = formulario({ extras: { comercializadoras: [{ id: 14, nombre: 'IBERDROLA CLIENTES, S.A.U.' }] } }).ctx;
  iberdrolaSinZona.nuevoContrato = { ...IRIS };
  iberdrolaSinZona.vistaPrevia = VISTA_IRIS;
  iberdrolaSinZona.sugerirZonaMcas();
  assert.equal(iberdrolaSinZona.nuevoContrato.mcasZonaComision, null, 'si la tabla no usa la zona, no se rellena');

  const noPermitida = formulario().ctx;
  noPermitida.nuevoContrato = { ...IRIS };
  noPermitida.vistaPrevia = conZona(['ZBR']);
  noPermitida.sugerirZonaMcas();
  assert.equal(noPermitida.nuevoContrato.mcasZonaComision, null, 'solo se propone una zona que la tabla admite');

  const guardado = formulario({ extras: { modoEdicion: true } }).ctx;
  guardado.nuevoContrato = { ...IRIS };
  guardado.vistaPrevia = conZona();
  guardado.sugerirZonaMcas();
  assert.equal(guardado.nuevoContrato.mcasZonaComision, null, 'no se toca un contrato ya guardado');

  // La propuesta llega con la vista previa.
  const alLlegar = formulario({ axios: { post: async () => ({ data: conZona() }) } }).ctx;
  alLlegar.nuevoContrato = { ...IRIS };
  await alLlegar.pedirVistaPrevia();
  assert.equal(alLlegar.nuevoContrato.mcasZonaComision, 'ZAR');
});

test('las opciones de zona y ámbito del formulario salen de la vista previa', () => {
  const { ctx } = formulario();
  ctx.nuevoContrato = { ...IRIS };
  assert.deepEqual(ctx.opcionesZonaMcas, ['ZBR', 'ZAR']);
  assert.deepEqual(ctx.opcionesAmbitoMcas.map((o) => o.valor), ['DENTRO', 'FUERA', 'NA']);

  ctx.vistaPrevia = { ...VISTA_IRIS, campos: [
    { clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión', falta: false, valores: ['ZAR'] },
    { clave: 'AMBITO', etiqueta: 'Ámbito', falta: false, valores: ['DENTRO', 'FUERA'] },
  ] };
  ctx.nuevoContrato.mcasZonaComision = 'ZBR';
  assert.deepEqual(ctx.opcionesZonaMcas, ['ZAR', 'ZBR'], 'la zona guardada sigue siendo elegible');
  assert.deepEqual(ctx.opcionesAmbitoMcas.map((o) => o.valor), ['DENTRO', 'FUERA']);

  const html = plantilla(CONTRATOS);
  assert.match(html, /<select id="mcasZonaComision" v-model="nuevoContrato\.mcasZonaComision"[\s\S]*?<option :value="null">Sin especificar<\/option>\s*<option v-for="zona in opcionesZonaMcas"/);
  assert.match(html, /<option v-for="opcion in opcionesAmbitoMcas" :key="opcion\.valor" :value="opcion\.valor">\{\{ opcion\.etiqueta \}\}<\/option>/);
});

test('la pestaña se dibuja una vez por campo: a la vista, en solo lectura o en «Otros datos»', () => {
  const html = plantilla(CONTRATOS);
  const panel = html.split(`v-show="pestanaContrato === 'mcas'"`)[1];
  assert.ok(panel);
  assert.match(panel, /<template v-for="grupo in gruposCamposMcas" :key="grupo\.id">\s*<component :is="grupo\.plegado \? 'details' : 'div'"/);
  assert.match(panel, /<summary v-if="grupo\.plegado"[^>]*>[\s\S]{0,80}Otros datos \(\{\{ camposMcas\.otrosConValor \}\} con valor\)/);
  assert.match(panel, /v-for="fila in filasSoloLecturaMcas"[\s\S]{0,700}@click="irACampoMcas\(fila\.campo\)"[^>]*>\s*Cambiar en pestaña «Contrato»/);
  assert.match(panel, /v-for="f in cabeceraMcas\.faltan"[\s\S]{0,200}@click="irACampoMcas\(f\.campo\)"/);
  assert.match(panel, /v-if="cabeceraMcas\.estimacion"[^>]*>\s*Estimación\s*</);
  // Cada campo editable aparece una sola vez en la plantilla.
  for (const campo of ['mcasTipoPrecio', 'mcasTipoSuministro', 'mcasSegmento', 'mcasFeeEurMwh', 'mcasZonaComision', 'mcasNumeroPagos']) {
    assert.equal((panel.match(new RegExp(`v-model(?:\\.number)?="nuevoContrato\\.${campo}"`, 'g')) || []).length, 1, campo);
  }
  // La caja fija de antes ya no está.
  assert.doesNotMatch(html, /Al guardar se calculará la comisión automática de este contrato/);

  const marca = html.match(/<span\s+v-if="p\.id === 'mcas'"[\s\S]*?><\/span>/);
  assert.ok(marca);
  assert.match(marca[0], /:title="tituloMarcaMcas"/);
});

test('la pestaña habla en lenguaje llano, sin jerga ni tooltips técnicos', () => {
  const html = plantilla(CONTRATOS);
  const panel = html.split(`v-show="pestanaContrato === 'mcas'"`)[1];
  assert.doesNotMatch(panel, /Gestora MCAS/);
  assert.doesNotMatch(panel, /Excel/);
  assert.doesNotMatch(panel, /Configuración MCAS › Productos/);
  assert.doesNotMatch(panel, /operador/i);
  assert.doesNotMatch(panel, /mcas-help/);
  assert.match(panel, /<i class="fas fa-building"><\/i> Gestora\s*<\/label>/);
  assert.match(panel, /placeholder="ej\.: 7,5"/);
  assert.match(panel, /class="mcas-campo-ayuda"/);
  assert.doesNotMatch(leer('src/components/CRM_Module/PuntosSuministro/ModalContratos.css'), /\.mcas-help|\.mcas-p6-btn/);
});
