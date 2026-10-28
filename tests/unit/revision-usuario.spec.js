// Revisión del 15/09/2026: renovación, tareas (autor del cambio) y MCAS en el contrato.
process.env.TZ = process.env.TZ || 'Europe/Madrid';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
let mcasEstados;
let camposContrato;
test.before(async () => {
  mcasEstados = await importar('src/components/CRM_Module/MCAS/mcasEstados.js');
  camposContrato = await importar('src/components/CRM_Module/PuntosSuministro/mcasCamposContrato.js');
});

let USUARIO = { id: 7, nombre: 'María Gestora', nivelAcceso: 2 };
global.localStorage = { getItem: (clave) => (clave === 'usuario' ? JSON.stringify(USUARIO) : null), setItem() {}, removeItem() {} };

const MODAL_CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';

/** Lo que el formulario importa de mcasCamposContrato.js (en una sola línea). */
function importadoDeCampos() {
  const linea = leer(MODAL_CONTRATOS).match(/^import \{([^}]+)\} from ['"]\.\/mcasCamposContrato['"];?$/m);
  assert.ok(linea, 'el import de mcasCamposContrato debe ocupar una sola línea');
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, camposContrato[n]]));
}

function modalContratos({ posts = [], puntoSuministro = { id: 9, cupsluz: 'ES0021000011111111AB0F' }, respuestasGet = {} } = {}) {
  const componente = cargarComponente(MODAL_CONTRATOS, {
    ...importadoDeCampos(),
    axios: {
      get: async (url) => ({ data: respuestasGet[url] ?? [] }),
      post: async (url, datos) => { posts.push({ url, datos }); return { data: { id: 500 } }; },
      put: async (url, datos) => { posts.push({ url, datos }); return { data: { id: 500 } }; },
    },
    fechaLocalISO: () => '2026-09-15',
  });
  return crearContexto(componente, {
    cliente: { id: 3, nombre: 'Cliente Demo', cif: 'B12345678' },
    puntoSuministro,
    comercializadoras: [{ id: 14, nombre: 'IRIS ENERGIA, S.L.' }],
    tarifasGas: [{ id: 1, nombre: 'Sin Tarifa' }],
    tarifasLuz: [{ id: 2, nombre: 'Sin Tarifa' }, { id: 10, nombre: '3.0TD' }],
    contratos: [],
    contratoActual: null,
    contratosHistoricos: [],
  });
}

const CONTRATO_VENCIDO = {
  id: 77, contrato: 'CT-2025-0077', fechaEnvio: '2025-01-01', fechaInicio: '2025-01-15', fechaFin: '2026-01-14',
  idComercializadoraActual: 14, idTarifaLuz: 10, idTarifaGas: 1, consumoAnual: 7000,
};

// ---------------------------------------------------------------------------
// Renovación
// ---------------------------------------------------------------------------

test('renovar desde la fila de un contrato usa la renovación, igual que «Renovar actual»', async () => {
  const posts = [];
  const ctx = modalContratos({ posts });

  await ctx.renovarContratoGenerico(CONTRATO_VENCIDO);
  ctx.nuevoContrato.contrato = 'CT-2026-0078';
  await ctx.guardarContrato();

  assert.equal(posts.length, 1);
  assert.match(posts[0].url, /\/contratos\/renovar\/77$/);
});

// ---------------------------------------------------------------------------
// MCAS en el contrato
// ---------------------------------------------------------------------------

test('un contrato nuevo trae MCAS listo: precio FIJO y el suministro del CUPS', async () => {
  const luz = modalContratos();
  await luz.crearNuevoContrato();
  assert.equal(luz.nuevoContrato.mcasTipoPrecio, 'FIJO');
  assert.equal(luz.nuevoContrato.mcasTipoSuministro, 'LUZ');

  const gas = modalContratos({ puntoSuministro: { id: 9, cupsgas: 'ES0217000033333333GS0F' } });
  await gas.crearNuevoContrato();
  assert.equal(gas.nuevoContrato.mcasTipoSuministro, 'GAS');
});

test('al renovar se completan los datos MCAS que falten sin pisar los que ya tenía', async () => {
  const vacio = modalContratos();
  await vacio.renovarContratoGenerico(CONTRATO_VENCIDO);
  assert.equal(vacio.nuevoContrato.mcasTipoPrecio, 'FIJO');
  assert.equal(vacio.nuevoContrato.mcasTipoSuministro, 'LUZ');
  assert.equal(vacio.nuevoContrato.mcasEsRenovacion, true);

  const conDatos = modalContratos();
  await conDatos.renovarContratoGenerico({ ...CONTRATO_VENCIDO, mcasTipoPrecio: 'INDEXADO', mcasTipoSuministro: 'GAS' });
  assert.equal(conDatos.nuevoContrato.mcasTipoPrecio, 'INDEXADO');
  assert.equal(conDatos.nuevoContrato.mcasTipoSuministro, 'GAS');
});

test('el contrato dice qué le falta para calcular la comisión MCAS', async () => {
  const ctx = modalContratos();
  await ctx.crearNuevoContrato();

  assert.deepEqual(ctx.mcasFaltan, ['Número de contrato', 'Fecha de inicio', 'Comercializadora actual']);
  assert.equal(ctx.mcasListo, false);

  Object.assign(ctx.nuevoContrato, { contrato: 'CT-1', fechaInicio: '2026-09-15', idComercializadoraActual: 14 });
  assert.deepEqual(ctx.mcasFaltan, []);
  assert.equal(ctx.mcasListo, true);

  // «Sin comisión automática» es una elección: no falta nada y la cabecera no sale en naranja.
  ctx.nuevoContrato.mcasTipoPrecio = '';
  assert.deepEqual(ctx.mcasFaltan, []);
  assert.equal(ctx.cabeceraMcas.tono, 'neutro');
  assert.equal(ctx.marcaMcas, 'neutro');
});

// ---------------------------------------------------------------------------
// Tareas: quién hace el cambio
// ---------------------------------------------------------------------------

function tareasApiCon(axiosFalso) {
  const fuente = leer('src/services/tareasApi.js')
    .replace(/^import\s+.*$/gm, '')
    .replace('export const tareasApi', 'const tareasApi')
    .replace(/^export default .*$/m, '');
  return Function('axios', `${fuente}\nreturn tareasApi;`)(axiosFalso);
}

test('cambiar el estado de una tarea envía quién hace el cambio', async () => {
  const peticiones = [];
  const api = tareasApiCon({
    interceptors: { response: { use() {} } },
    patch: async (url, cuerpo) => { peticiones.push({ url, cuerpo }); return { data: {} }; },
  });

  await api.cambiarEstadoTarea(40, 2);
  await api.cambiarEstadoTarea(40, 3, 'Falta el permiso de la distribuidora');

  assert.deepEqual(peticiones, [
    { url: '/tareas/40/estado', cuerpo: { estadoId: 2, motivoBloqueo: null, usuarioAccionId: 7 } },
    { url: '/tareas/40/estado', cuerpo: { estadoId: 3, motivoBloqueo: 'Falta el permiso de la distribuidora', usuarioAccionId: 7 } },
  ]);
});

test('al guardar una tarea se indica quién la crea o edita', () => {
  const componente = cargarComponente('src/components/CRM_Module/Tareas/TareaModalCorporativo.vue', {
    tareasApi: {}, fechaLocalISO: () => '2026-09-15',
  });
  const ctx = crearContexto(componente, { tarea: { id: 40, titulo: 'Visita', usuarioCreadorId: 1 }, estados: [], usuarios: [], categorias: [] });
  ctx.formulario = { ...ctx.formulario, id: 40, titulo: 'Visita reprogramada', usuarioCreadorId: 1 };

  ctx.guardar();

  const [evento, dto] = ctx.emitidos.at(-1);
  assert.equal(evento, 'guardar');
  assert.equal(dto.usuarioAccionId, 7);
  assert.equal(dto.usuarioCreadorId, 1);
});

// ---------------------------------------------------------------------------
// Resultado MCAS al guardar un contrato
// ---------------------------------------------------------------------------

test('el texto del resultado MCAS lo redacta el servidor: el catálogo de estados ya no lo inventa', async () => {
  // textoResultadoMcas (30/09/2026) decía «Se ha calculado…» aunque no fuera verdad; el
  // formulario usa ahora el resumen del servidor y la función se ha retirado.
  const { etiquetaEstadoMcas } = mcasEstados;
  assert.equal(etiquetaEstadoMcas('PENDIENTE_VALIDACION'), 'Pendiente de validación');
  assert.equal(etiquetaEstadoMcas('REQUIERE_DATOS'), 'Faltan datos');
  assert.equal('textoResultadoMcas' in mcasEstados, false);
});

async function guardarNuevoContratoMcas(opciones) {
  const ctx = modalContratos(opciones);
  await ctx.crearNuevoContrato();
  Object.assign(ctx.nuevoContrato, { contrato: 'CT-1', fechaEnvio: '2026-09-10', fechaInicio: '2026-09-15',
    fechaFin: '2027-09-14', idComercializadoraActual: 14, idTarifaLuz: 10 });
  await ctx.guardarContrato();
  return ctx.avisos.at(-1);
}

test('tras guardar un contrato, el aviso cuenta lo que dice el servidor de su comisión, sea quien sea el usuario', async () => {
  // Antes, a quien no era administrador se le decía siempre «Se ha calculado la propuesta…
  // la validará un administrador», aunque el módulo estuviera apagado o faltaran datos.
  const RESUMEN = '/mcas/propuestas/contrato/500/resumen';
  const pendiente = {
    moduloActivo: true, hayPropuesta: true, idPropuesta: 12, estado: 'PENDIENTE_VALIDACION', importe: 411.84, numeroPagos: 1,
    queFalta: [], mensaje: 'Comisión pendiente de aprobar: 411,84 € en 1 pago.',
  };
  const desactivado = {
    moduloActivo: false, hayPropuesta: false, queFalta: [],
    mensaje: 'Las comisiones automáticas están desactivadas: la comisión se completará a mano.',
  };
  for (const usuario of [{ id: 1, nombre: 'Ana Comercial', nivelAcceso: 1 }, { id: 7, nombre: 'María Gestora', nivelAcceso: 2 }]) {
    USUARIO = usuario;
    try {
      const aviso = await guardarNuevoContratoMcas({ respuestasGet: { [RESUMEN]: pendiente } });
      assert.match(aviso.html, /Comisión pendiente de aprobar: 411,84/, usuario.nombre);
      assert.doesNotMatch(aviso.html, /Se ha calculado|la validará un administrador/, usuario.nombre);

      const apagado = await guardarNuevoContratoMcas({ respuestasGet: { [RESUMEN]: desactivado } });
      assert.match(apagado.html, /Las comisiones automáticas están desactivadas/, usuario.nombre);
    } finally {
      USUARIO = { id: 7, nombre: 'María Gestora', nivelAcceso: 2 };
    }
  }

  // Sin respuesta útil del servidor no se inventa nada: queda solo el aviso de guardado.
  const sinResumen = await guardarNuevoContratoMcas({ respuestasGet: { [RESUMEN]: {} } });
  assert.equal(sinResumen.html, undefined);
  assert.match(sinResumen.text, /creado correctamente/);
});

test('guardar un contrato muestra un solo aviso de éxito (la pantalla de puntos no repite otro)', async () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue', {
    axios: { get: async () => ({ data: [] }) }, cargarExcelJS: async () => ({}), descargarLibroExcel: async () => {},
  });
  const ctx = crearContexto(componente, { modalPuntoSuministro: { id: 9 } });

  await ctx.handleContratoCreado();
  await ctx.handleContratoActualizado();
  await ctx.handleContratoRenovado();

  assert.deepEqual(ctx.avisos, []);
});

test('Configuración MCAS dice si el módulo está listo para calcular y qué falta', () => {
  const { comprobacionesModulo } = mcasEstados;
  const base = {
    hoy: '2026-09-15',
    flags: [{ codigo: 'MCAS_ENABLED', activo: true }, { codigo: 'MCAS_FIXED_ENABLED', activo: true }],
    conjuntos: [{ id: 1, estado: 'PUBLICADO', fasePrecio: 'FIJO', idComercializadora: 14, vigenciaDesde: '2026-03-04', vigenciaHasta: null }],
    productosServicio: [{ id: 1, nombre: 'SWITCHING' }],
    pagosPlazos: [{ id: 1, numeroCuotas: 1 }, { id: 2, numeroCuotas: 3 }],
    nombreComercializadora: (id) => (id === 14 ? 'IRIS ENERGIA, S.L.' : `#${id}`),
  };

  const listo = comprobacionesModulo(base);
  assert.ok(listo.every((c) => c.ok), JSON.stringify(listo));
  assert.match(listo.find((c) => c.id === 'conjuntos').detalle, /IRIS ENERGIA/);

  const pendiente = comprobacionesModulo({
    ...base,
    flags: [{ codigo: 'MCAS_ENABLED', activo: false }, { codigo: 'MCAS_FIXED_ENABLED', activo: true }],
    conjuntos: [{ id: 1, estado: 'BORRADOR', fasePrecio: 'FIJO', idComercializadora: 14, vigenciaDesde: '2026-03-04' }],
    productosServicio: [{ id: 3, nombre: 'GESTIÓN ENERGÉTICA' }],
    pagosPlazos: [],
  });
  const fallos = pendiente.filter((c) => !c.ok).map((c) => c.id);
  assert.deepEqual(fallos, ['modulo', 'conjuntos', 'switching', 'plazos']);
  assert.match(pendiente.find((c) => c.id === 'conjuntos').detalle, /1 en borrador/);
});
