// MCAS · usabilidad (30/09/2026): Configuración MCAS para un administrador no técnico.
// A7 volver a borrador · A8 fase indexada · A9/E estado por comercializadora y pendientes ·
// C1 nombres legibles · C2 lista de reglas legible · C4 nueva versión · C5 activar.
// Axios simulado según docs/superpowers/plans/2026-09-30-mcas-usabilidad-contrato-api.md.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

let activacion;
let reglas;
test.before(async () => {
  activacion = await importar('src/components/CRM_Module/MCAS/mcasActivacion.js');
  reglas = await importar('src/components/CRM_Module/MCAS/mcasReglas.js');
});

const HOY = '2026-09-30';
const COMERCIALIZADORAS = [
  { id: 1, nombre: 'ENDESA ENERGIA S.A.U.' }, { id: 2, nombre: 'IBERDROLA CLIENTES, S.A.U.' },
  { id: 3, nombre: 'IRIS ENERGIA' }, { id: 4, nombre: 'VISALIA ENERGIA' }, { id: 5, nombre: 'GANA ENERGIA' },
];
const ENDESA_BORRADOR = { id: 10, codigo: 'ENDESA-FIJO-20260309', nombre: 'Endesa 2026-03', idComercializadora: 1, fasePrecio: 'FIJO',
  vigenciaDesde: '2026-03-09', vigenciaHasta: null, estado: 'BORRADOR' };
const IRIS_PUBLICADO = { id: 20, codigo: 'IRIS-FIJO-20260304', nombre: 'Iris 2026-03', idComercializadora: 3, fasePrecio: 'FIJO',
  vigenciaDesde: '2026-03-04', vigenciaHasta: null, estado: 'PUBLICADO' };
const IBERDROLA_VALIDADO = { id: 30, codigo: 'IBERDROLA-FIJO-20260101', nombre: null, idComercializadora: 2, fasePrecio: 'FIJO',
  vigenciaDesde: '2026-01-01', vigenciaHasta: null, estado: 'VALIDADO' };
const VISALIA_FIJO = { id: 40, codigo: 'VISALIA-FIJO-20250612', nombre: 'Visalia fijo', idComercializadora: 4, fasePrecio: 'FIJO',
  vigenciaDesde: '2025-06-12', vigenciaHasta: null, estado: 'BORRADOR' };
const VISALIA_INDEX = { id: 41, codigo: 'VISALIA-INDEX-20250612', nombre: 'Visalia indexado', idComercializadora: 4, fasePrecio: 'INDEXADO',
  vigenciaDesde: '2025-06-12', vigenciaHasta: null, estado: 'BORRADOR' };
const CONJUNTOS = [ENDESA_BORRADOR, IRIS_PUBLICADO, IBERDROLA_VALIDADO, VISALIA_FIJO, VISALIA_INDEX];

// Reglas de dos tablas: una inactiva no se marca como pendiente (la desactiva el administrador).
const REGLAS = {
  20: [{ id: 201, codigo: 'IRIS_PLAN_PERSONALIZADO_PYME', activo: false, metodoCalculo: 'FEE_PERCENTAGE' }],
  40: [
    { id: 401, codigo: 'VISALIA_ESMERALDA_PYME', nombre: 'Visalia · Esmeralda pyme', activo: false, metodoCalculo: 'RATE_PER_MWH' },
    { id: 402, codigo: 'VISALIA_BASE_PYME', activo: true, metodoCalculo: 'FEE_PERCENTAGE' },
  ],
};
const POLITICAS = [
  { id: 7, codigo: 'RET-IBERDROLA-2_0TD-20260101', idComercializadora: 2, estado: 'BORRADOR',
    tramos: [{ tipoValor: 'PORCENTAJE' }, { tipoValor: 'SIN_CONFIRMAR' }] },
  { id: 8, codigo: 'RET-ENDESA-PYME-20260309', idComercializadora: 1, estado: 'BORRADOR', tramos: [{ tipoValor: 'PORCENTAJE' }] },
];

const estado = (extra = {}) => activacion.estadoPorComercializadora({
  conjuntos: CONJUNTOS, comercializadoras: COMERCIALIZADORAS, politicas: POLITICAS, reglasPorConjunto: REGLAS,
  hoy: HOY, indexadoActivo: false, ...extra,
});
const fila = (filas, id) => filas.find((f) => f.idComercializadora === id);

// ---------------------------------------------------------------------------
// mcasActivacion.js
// ---------------------------------------------------------------------------

test('cada comercializadora sale una vez con su estado: activa, borrador, validada o sin tabla', () => {
  const filas = estado();
  assert.equal(filas.length, 5);
  assert.equal(fila(filas, 3).estado, 'ACTIVA');
  assert.match(fila(filas, 3).texto, /Activa desde 04\/03\/2026.*Iris 2026-03/);
  assert.equal(fila(filas, 1).estado, 'BORRADOR');
  assert.match(fila(filas, 1).texto, /Borrador pendiente de activar.*Endesa 2026-03/);
  assert.equal(fila(filas, 2).estado, 'VALIDADA');
  assert.match(fila(filas, 2).texto, /Validada sin publicar.*IBERDROLA-FIJO-20260101/, 'sin nombre se usa el código');
  assert.equal(fila(filas, 5).estado, 'SIN_TABLA');
  assert.match(fila(filas, 5).texto, /se completan a mano/);
  assert.equal(fila(filas, 1).pendienteActivar, true);
  assert.equal(fila(filas, 3).pendienteActivar, false);
  assert.equal(fila(filas, 5).pendienteActivar, false, 'sin tabla no bloquea «listo»: se completa a mano');
});

test('una tabla publicada fuera de vigencia no cuenta como activa', () => {
  const caducada = { ...IRIS_PUBLICADO, vigenciaHasta: '2026-06-30' };
  const filas = estado({ conjuntos: [caducada], comercializadoras: [{ id: 3, nombre: 'IRIS ENERGIA' }] });
  assert.equal(filas[0].estado, 'SIN_TABLA');
});

test('se marcan como «Pendiente» borradores, políticas con tramos sin tipo de valor y comercializadoras sin tabla (nunca una regla inactiva)', () => {
  const filas = estado();
  const endesa = fila(filas, 1).pendientes;
  assert.ok(endesa.some((p) => p.tipo === 'tabla' && /Endesa 2026-03/.test(p.texto) && p.enlace.tipo === 'tabla' && p.enlace.id === 10));
  assert.ok(!endesa.some((p) => p.tipo === 'politica'), 'la política de Endesa no tiene tramos sin tipo de valor');

  const iberdrola = fila(filas, 2).pendientes;
  assert.ok(iberdrola.some((p) => p.tipo === 'politica' && /RET-IBERDROLA-2_0TD-20260101/.test(p.texto) && p.enlace.id === 7));

  const visalia = fila(filas, 4).pendientes;
  assert.ok(!visalia.some((p) => p.tipo === 'regla'), 'una regla inactiva es una decisión del administrador, no algo pendiente');
  assert.ok(visalia.some((p) => p.tipo === 'tabla' && /Indexado/.test(p.texto)), 'avisa de que el indexado no se puede activar');

  assert.ok(!fila(filas, 3).pendientes.some((p) => p.tipo === 'regla'));

  const gana = fila(filas, 5).pendientes;
  assert.deepEqual(gana.map((p) => p.enlace), [{ tipo: 'nueva-tabla', idComercializadora: 5 }]);
  for (const f of filas) for (const p of f.pendientes) assert.ok(p.etiquetaEnlace, `${p.texto} sin enlace`);
});

test('«listo» exige que ninguna comercializadora tenga un borrador sin versión vigente, y dice cuáles faltan', () => {
  const pendiente = activacion.comprobacionActivacion(estado());
  assert.equal(pendiente.ok, false);
  assert.match(pendiente.detalle, /ENDESA ENERGIA S\.A\.U\./);
  assert.match(pendiente.detalle, /IBERDROLA/);
  assert.match(pendiente.detalle, /VISALIA/);
  assert.doesNotMatch(pendiente.detalle, /GANA|IRIS/);

  const todo = activacion.comprobacionActivacion(estado({ conjuntos: [IRIS_PUBLICADO, { ...VISALIA_FIJO, estado: 'PUBLICADO' }, VISALIA_INDEX] }));
  assert.equal(todo.ok, true, 'Visalia ya tiene una versión vigente aunque el indexado siga en borrador');
});

test('la nueva versión propone empezar mañana y un nombre con el mes', () => {
  assert.equal(activacion.sumarDias('2026-09-30', 1), '2026-10-01');
  assert.equal(activacion.sumarDias('2026-12-31', 1), '2027-01-01');
  assert.deepEqual(activacion.propuestaNuevaVersion(IRIS_PUBLICADO, { hoy: HOY }), { vigenciaDesde: '2026-10-01', nombre: 'Iris 2026-10' });
  assert.equal(activacion.propuestaNuevaVersion(IBERDROLA_VALIDADO, { hoy: HOY, nombreComercializadora: 'Iberdrola' }).nombre, 'Iberdrola 2026-10');
});

test('las incidencias de la comprobación se agrupan por regla', () => {
  const grupos = activacion.agruparIncidencias([
    { idRegla: 7, regla: 'Endesa · pyme luz 3.0TD', orden: 12, mensaje: 'La celda 12 no tiene importe' },
    { idRegla: 8, regla: 'Endesa · residencial', mensaje: 'Falta el importe' },
    { idRegla: 7, regla: 'Endesa · pyme luz 3.0TD', orden: 13, mensaje: 'La celda 13 no tiene importe' },
    { mensaje: 'La tabla no tiene reglas activas' },
  ]);
  assert.deepEqual(grupos.map((g) => [g.regla, g.incidencias.length]),
    [['Endesa · pyme luz 3.0TD', 2], ['Endesa · residencial', 1], ['Tabla de comisiones', 1]]);
});

// ---------------------------------------------------------------------------
// McasAdminComponent.vue
// ---------------------------------------------------------------------------

/** Lo que el componente importa de un módulo (el resto de exports chocaría con sus constantes). */
function importadoDe(modulo, exportaciones) {
  const linea = leer(ADMIN).match(new RegExp(`^import \\{([^}]+)\\} from '\\./${modulo}'`, 'm'));
  assert.ok(linea, `el import de ${modulo} debe ocupar una sola línea`);
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, exportaciones[n]]));
}

function configuracion({ peticiones = [], respuestas = {}, fallos = {}, comprobaciones = [] } = {}) {
  const responder = (metodo) => async (url, datos) => {
    peticiones.push({ metodo, url, datos });
    if (fallos[`${metodo} ${url}`]) throw fallos[`${metodo} ${url}`];
    return { data: respuestas[`${metodo} ${url}`] ?? respuestas[url] ?? {} };
  };
  const componente = cargarComponente(ADMIN, {
    ...importadoDe('mcasReglas', reglas),
    ...importadoDe('mcasActivacion', activacion),
    axios: { get: responder('get'), post: responder('post'), put: responder('put'), delete: responder('delete') },
    compararValores: (a, b) => String(a ?? '').localeCompare(String(b ?? '')),
    confirmar: async () => true,
    mostrarError: (swal, title, text) => swal.fire({ icon: 'error', title, text }),
    mostrarExito: (swal, title, text) => swal.fire({ icon: 'success', title, text }),
    mostrarAviso: (swal, title, text) => swal.fire({ icon: 'warning', title, text }),
    textoError: (e, base) => base,
    fechaLocalISO: () => HOY,
    comprobacionesModulo: () => comprobaciones,
  });
  return crearContexto(componente);
}

test('C1 · tablas y reglas se crean con nombre; el código interno es opcional', async () => {
  const html = plantilla(ADMIN);
  assert.match(html, /id="mcas-conj-nombre"[^>]*v-model="formConjunto\.nombre"/);
  assert.match(html, /id="mcas-conj-descripcion"/);
  assert.match(html, /Código interno \(opcional; se genera solo\)/);
  assert.match(html, /id="mcas-regla-nombre"[^>]*v-model="formRegla\.nombre"/);

  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.abrirModalConjunto();
  Object.assign(ctx.formConjunto, { nombre: ' Gana 2026-10 ', descripcion: '', idComercializadora: 5, vigenciaDesde: '2026-10-01' });
  assert.deepEqual(Object.keys(ctx.validarConjunto()), []);
  await ctx.guardarConjunto();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/conjuntos-reglas');
  assert.equal(post.datos.nombre, 'Gana 2026-10');
  assert.equal(post.datos.codigo, null, 'sin código lo genera el servidor');
  assert.equal(post.datos.descripcion, null);

  ctx.abrirModalConjunto();
  assert.ok(ctx.validarConjunto().nombre, 'el nombre es obligatorio');

  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  ctx.conjuntoParaReglasId = 10;
  ctx.abrirModalRegla();
  Object.assign(ctx.formRegla, { nombre: 'Endesa · residencial menos de 10 kW', metodoCalculo: 'FIXED_AMOUNT' });
  ctx.editorRegla.calculo.importe = 110;
  assert.equal(ctx.validarRegla().codigo, undefined);
  await ctx.guardarRegla();
  const regla = peticiones.filter((p) => p.metodo === 'post').at(-1);
  assert.equal(regla.url, '/mcas/conjuntos-reglas/10/reglas');
  assert.equal(regla.datos.nombre, 'Endesa · residencial menos de 10 kW');
  assert.equal(regla.datos.codigo, null);
});

test('C1 · en pantalla se habla de «tabla de comisiones» e «interruptores»', () => {
  const html = plantilla(ADMIN);
  assert.doesNotMatch(html, /[Cc]onjuntos? de [Rr]eglas/);
  assert.doesNotMatch(html, /Nuevo conjunto/);
  assert.doesNotMatch(html, /[Ii]ndicadores/);
  assert.match(html, /<span class="flags-titulo">Interruptores del módulo<\/span>/);
  assert.match(html, /Nueva tabla/);

  const ctx = configuracion();
  ctx.conjuntosReglas = [ENDESA_BORRADOR, IBERDROLA_VALIDADO];
  assert.equal(ctx.nombreConjunto(ENDESA_BORRADOR), 'Endesa 2026-03');
  assert.equal(ctx.nombreConjunto(IBERDROLA_VALIDADO), 'IBERDROLA-FIJO-20260101');
});

test('C2 · cada regla se lee en lenguaje llano, sin claves JSON', () => {
  const html = plantilla(ADMIN);
  assert.doesNotMatch(html, /chip-clave/);
  assert.match(html, /resumenesReglas\[r\.id\]\.aplica/);
  assert.match(html, /resumenesReglas\[r\.id\]\.calcula/);

  const ctx = configuracion();
  const resumen = ctx.resumenFilaRegla({ codigo: 'ENDESA_RESIDENCIAL_MENOS_10KW', metodoCalculo: 'FIXED_AMOUNT',
    condicionesJson: '{"tipo_suministro":"LUZ","segmento":"RESIDENCIAL","es_renovacion":false,"potencia_max_kw":10,"potencia_max_inc":false}',
    calculoJson: '{"importe":110}', politicaPagoJson: '{"numero_pagos_sugerido":1}' });
  assert.equal(resumen.aplica, 'Luz · Residencial · Solo contratos nuevos · Potencia de cálculo < 10 kW');
  assert.equal(resumen.calcula, 'Comisión fija de 110,00 €.');
});

test('C2 · en una tabla que no está en borrador cada regla se abre con «Ver», en solo lectura', async () => {
  const html = plantilla(ADMIN);
  assert.match(html, /v-if="conjuntoEditable"[^>]*title="Editar regla"[^>]*@click="abrirModalRegla\(r\)"/);
  assert.match(html, /v-else[^>]*title="Ver regla"[^>]*@click="abrirModalRegla\(r\)"/);
  assert.match(html, /<fieldset class="fieldset-limpio" :disabled="soloLecturaRegla">/);

  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.conjuntosReglas = [IRIS_PUBLICADO];
  ctx.conjuntoParaReglasId = 20;
  ctx.abrirModalRegla({ id: 5, codigo: 'IRIS_PYME_LUZ', metodoCalculo: 'FEE_PERCENTAGE', calculoJson: '{"porcentaje_aplicacion_fee":0.44}' });
  assert.equal(ctx.modalRegla, true);
  assert.equal(ctx.soloLecturaRegla, true);
  await ctx.guardarRegla();
  assert.equal(peticiones.length, 0, 'en solo lectura no se envía nada');
});

test('C3 · «Ver tabla» abre la rejilla, editable solo en borrador y con la celda de la incidencia resaltada', () => {
  const ctx = configuracion();
  ctx.conjuntosReglas = [IRIS_PUBLICADO];
  ctx.conjuntoParaReglasId = 20;
  const r = { id: 7, codigo: 'X', metodoCalculo: 'MATRIX_LOOKUP' };
  ctx.abrirMatriz(r, 12);
  assert.equal(ctx.modalMatriz, true);
  assert.equal(ctx.reglaMatriz, r);
  assert.equal(ctx.ordenMatriz, 12);
  assert.match(plantilla(ADMIN), /<McasMatrizEditor[\s\S]*?:editable="conjuntoEditable"[\s\S]*?:orden-resaltado="ordenMatriz"/);
});

test('C4 · «Nueva versión» pide fecha (mañana) y nombre, y deja seleccionada la nueva en borrador', async () => {
  const peticiones = [];
  const nueva = { ...IRIS_PUBLICADO, id: 21, estado: 'BORRADOR', nombre: 'Iris 2026-10', vigenciaDesde: '2026-10-01', idConjuntoOrigen: 20 };
  const ctx = configuracion({ peticiones, respuestas: {
    'post /mcas/conjuntos-reglas/20/nueva-version': nueva,
    'get /mcas/conjuntos-reglas': [IRIS_PUBLICADO, nueva],
  } });
  ctx.comercializadoras = COMERCIALIZADORAS;
  ctx.conjuntosReglas = [IRIS_PUBLICADO];
  ctx.abrirNuevaVersion(IRIS_PUBLICADO);
  assert.equal(ctx.modalNuevaVersion, true);
  assert.deepEqual({ ...ctx.formNuevaVersion }, { idOrigen: 20, vigenciaDesde: '2026-10-01', nombre: 'Iris 2026-10' });
  await ctx.guardarNuevaVersion();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/conjuntos-reglas/20/nueva-version');
  assert.deepEqual(post.datos, { vigenciaDesde: '2026-10-01', nombre: 'Iris 2026-10' });
  assert.equal(ctx.conjuntoParaReglasId, 21);
  assert.equal(ctx.modalNuevaVersion, false);
  assert.match(ctx.avisos.at(-1).text, /borrador/);
  assert.match(plantilla(ADMIN), /title="Nueva versión"[^>]*@click="abrirNuevaVersion\(c\)"/);
});

test('C5 · «Activar» comprueba, muestra errores por regla, cambios y avisos, y activa en un paso', async () => {
  const peticiones = [];
  const comprobacion = {
    puedeActivar: false,
    incidencias: [{ idRegla: 7, regla: 'Endesa · pyme luz 3.0TD', orden: 12, mensaje: 'La celda 12 no tiene importe' }],
    cambios: ['Se cerrará «Endesa 2025» el 30/09/2026'],
    avisos: ['Hay 3 propuestas pendientes calculadas con la versión anterior; no se recalculan solas'],
  };
  const ctx = configuracion({ peticiones, respuestas: {
    'get /mcas/conjuntos-reglas/10/comprobacion': comprobacion,
    'post /mcas/conjuntos-reglas/10/activar': { ...ENDESA_BORRADOR, estado: 'PUBLICADO' },
    'get /mcas/conjuntos-reglas': [ENDESA_BORRADOR],
  } });
  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  const carga = ctx.abrirActivacion(ENDESA_BORRADOR);
  assert.equal(ctx.modalActivacion, true);
  assert.equal(ctx.activacion.cargando, true, 'muestra «Comprobando…» mientras llega la respuesta');
  await carga;
  assert.equal(peticiones[0].url, '/mcas/conjuntos-reglas/10/comprobacion');
  assert.deepEqual(ctx.incidenciasActivacion.map((g) => [g.regla, g.incidencias.length]), [['Endesa · pyme luz 3.0TD', 1]]);
  assert.equal(ctx.puedeActivarAhora, false);

  const html = plantilla(ADMIN);
  assert.match(html, /Comprobando…/);
  assert.match(html, /activacion\.resultado\.cambios/);
  assert.match(html, /activacion\.resultado\.avisos/);
  assert.match(html, /@click="irAIncidencia\(inc\)"/);
  assert.match(html, /Activar ahora/);

  await ctx.activarAhora();
  assert.equal(peticiones.filter((p) => p.metodo === 'post').length, 0, 'con errores no se activa');

  ctx.activacion.resultado = { ...comprobacion, puedeActivar: true, incidencias: [] };
  await ctx.activarAhora();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/conjuntos-reglas/10/activar');
  assert.deepEqual(post.datos, { cerrarVigenciaAnterior: true });
  assert.equal(ctx.modalActivacion, false);
});

test('C5 · un error al activar (400 con incidencias) se queda en el modal', async () => {
  const ctx = configuracion({
    respuestas: { 'get /mcas/conjuntos-reglas/10/comprobacion': { puedeActivar: true, incidencias: [], cambios: [], avisos: [] } },
    fallos: { 'post /mcas/conjuntos-reglas/10/activar': { response: { status: 400, data: {
      error: 'La tabla no es válida', incidencias: [{ idRegla: 9, regla: 'Endesa · gas', mensaje: 'Falta el mensaje' }] } } } },
  });
  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  await ctx.abrirActivacion(ENDESA_BORRADOR);
  await ctx.activarAhora();
  assert.equal(ctx.modalActivacion, true);
  assert.deepEqual(ctx.incidenciasActivacion.map((g) => g.regla), ['Endesa · gas']);
});

test('C5 · una incidencia lleva a su regla o a su celda', async () => {
  const regla = { id: 7, codigo: 'ENDESA_PYME_LUZ_3_0TD', metodoCalculo: 'MATRIX_LOOKUP' };
  const manual = { id: 9, codigo: 'ENDESA_GAS_MANUAL', metodoCalculo: 'MANUAL', motivoManual: 'Manual' };
  const ctx = configuracion({ respuestas: { 'get /mcas/conjuntos-reglas/10/reglas': [regla, manual] } });
  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  ctx.activacion = { conjunto: ENDESA_BORRADOR, cargando: false, resultado: null, error: '', activando: false };
  ctx.modalActivacion = true;
  await ctx.irAIncidencia({ idRegla: 7, orden: 12, mensaje: 'La celda 12 no tiene importe' });
  assert.equal(ctx.tabActivo, 'reglas');
  assert.equal(ctx.modalActivacion, false);
  assert.equal(ctx.modalMatriz, true);
  assert.equal(ctx.ordenMatriz, 12);

  ctx.cerrarMatriz();
  await ctx.irAIncidencia({ idRegla: 9, mensaje: 'Falta el mensaje' });
  assert.equal(ctx.modalRegla, true);
  assert.equal(ctx.formRegla.id, 9);
});

test('C5 · «Activar seleccionadas» activa en lote y explica el resultado parcial', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones, respuestas: {
    'post /mcas/conjuntos-reglas/activar-lote': [
      { id: 10, ok: true, estado: 'PUBLICADO', mensaje: 'Activada' },
      { id: 30, ok: false, estado: 'VALIDADO', mensaje: 'La celda 3 no tiene importe' },
    ],
  } });
  ctx.conjuntosReglas = [ENDESA_BORRADOR, IBERDROLA_VALIDADO, IRIS_PUBLICADO];
  ctx.alternarSeleccion(ENDESA_BORRADOR);
  ctx.alternarSeleccion(IBERDROLA_VALIDADO);
  ctx.alternarSeleccion(IRIS_PUBLICADO);
  assert.deepEqual(ctx.seleccionActivar, [10, 30], 'solo se seleccionan tablas en borrador o validadas');
  await ctx.activarSeleccionadas();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/conjuntos-reglas/activar-lote');
  assert.deepEqual(post.datos, { ids: [10, 30] });
  const aviso = ctx.avisos.at(-1);
  assert.match(aviso.html, /1 de 2/);
  assert.match(aviso.html, /IBERDROLA-FIJO-20260101/);
  assert.match(aviso.html, /La celda 3 no tiene importe/);
  assert.deepEqual(ctx.seleccionActivar, [30], 'la que falló sigue seleccionada');
  assert.match(plantilla(ADMIN), /Activar seleccionadas/);
});

test('C5 · Validar y Publicar pasan a «Más acciones»', () => {
  const html = plantilla(ADMIN);
  const menu = html.match(/<div v-if="menuConjunto === c\.id"[\s\S]*?<\/div>/);
  assert.ok(menu, 'falta el menú «Más acciones»');
  assert.match(menu[0], /cambiarEstadoConjunto\(c, 'validar'\)/);
  assert.match(menu[0], /cambiarEstadoConjunto\(c, 'publicar'\)/);
  assert.match(menu[0], /cambiarEstadoConjunto\(c, 'volver-borrador'\)/);
  assert.match(html, /title="Más acciones"/);
  assert.match(html, /v-if="c\.estado === 'BORRADOR' \|\| c\.estado === 'VALIDADO'"[^>]*title="Activar tabla"[^>]*@click="abrirActivacion\(c\)"/);
});

test('A7 · una tabla validada vuelve a borrador', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones });
  await ctx.cambiarEstadoConjunto(IBERDROLA_VALIDADO, 'volver-borrador');
  assert.deepEqual(peticiones.filter((p) => p.metodo === 'post').map((p) => p.url), ['/mcas/conjuntos-reglas/30/volver-borrador']);
  assert.match(plantilla(ADMIN), /v-if="c\.estado === 'VALIDADO'"[^>]*@click="cambiarEstadoConjunto\(c, 'volver-borrador'\)"/);
});

test('A8 · crear una tabla indexada avisa de que no se podrá activar con el interruptor apagado', () => {
  const ctx = configuracion();
  ctx.featureFlags = [{ codigo: 'MCAS_INDEXED_ENABLED', activo: false }];
  ctx.abrirModalConjunto();
  assert.equal(ctx.avisoFaseIndexada, false);
  ctx.formConjunto.fasePrecio = 'INDEXADO';
  assert.equal(ctx.avisoFaseIndexada, true);
  ctx.formConjunto.fasePrecio = 'AMBOS';
  assert.equal(ctx.avisoFaseIndexada, true);
  ctx.featureFlags = [{ codigo: 'MCAS_INDEXED_ENABLED', activo: true }];
  assert.equal(ctx.avisoFaseIndexada, false);
  assert.match(plantilla(ADMIN), /v-if="avisoFaseIndexada"[\s\S]{0,200}No se podrá activar mientras el interruptor Indexado esté apagado/);
});

test('A9 · el panel solo está «listo» sin borradores pendientes de activar, y enlaza a lo que falta', async () => {
  const ok = [{ id: 'modulo', ok: true, titulo: 'Módulo activado', detalle: '' }];
  const ctx = configuracion({ comprobaciones: ok, respuestas: { 'get /mcas/conjuntos-reglas/10/reglas': [] } });
  ctx.comercializadoras = COMERCIALIZADORAS;
  ctx.conjuntosReglas = [IRIS_PUBLICADO];
  assert.equal(ctx.moduloListo, true);
  ctx.conjuntosReglas = [IRIS_PUBLICADO, ENDESA_BORRADOR];
  assert.equal(ctx.moduloListo, false);
  const item = ctx.estadoModulo.find((c) => c.id === 'activacion');
  assert.match(item.detalle, /ENDESA/);

  const html = plantilla(ADMIN);
  assert.match(html, /Estado por comercializadora/);
  assert.match(html, /<span class="badge badge--warning">Pendiente<\/span>/);
  assert.match(html, /@click="abrirPendiente\(p\)"/);
  assert.match(html, /to="\/dashboard\/administracion"/);

  ctx.politicasRetrocesion = POLITICAS;
  await ctx.abrirPendiente({ enlace: { tipo: 'politica', id: 7 } });
  assert.equal(ctx.tabActivo, 'retrocesiones');
  assert.equal(ctx.modalRetrocesion, true);
  ctx.cerrarModales();

  await ctx.abrirPendiente({ enlace: { tipo: 'nueva-tabla', idComercializadora: 5 } });
  assert.equal(ctx.modalConjunto, true);
  assert.equal(ctx.formConjunto.idComercializadora, 5);
  ctx.cerrarModales();

  await ctx.abrirPendiente({ enlace: { tipo: 'tabla', id: 10 } });
  assert.equal(ctx.tabActivo, 'reglas');
  assert.equal(ctx.conjuntoParaReglasId, 10);
});

// ---------------------------------------------------------------------------
// H16 · el panel no pisa datos nuevos con respuestas viejas ni repite peticiones
// ---------------------------------------------------------------------------

/** Configuración MCAS con un GET controlable: cada petición queda pendiente hasta resolverla a mano. */
function configuracionDiferida() {
  const pendientes = [];
  const peticiones = [];
  const componente = cargarComponente(ADMIN, {
    ...importadoDe('mcasReglas', reglas),
    ...importadoDe('mcasActivacion', activacion),
    axios: { get: (url) => {
      peticiones.push(url);
      return new Promise((resolve) => pendientes.push({ url, resolver: (data) => resolve({ data }) }));
    } },
    compararValores: (a, b) => String(a ?? '').localeCompare(String(b ?? '')),
    textoError: (e, base) => base,
    fechaLocalISO: () => HOY,
    comprobacionesModulo: () => [],
  });
  const ctx = crearContexto(componente);
  const resolver = (url, data, cual = 0) => {
    const i = pendientes.findIndex((p, k) => p.url === url && pendientes.slice(0, k).filter((x) => x.url === url).length === cual);
    pendientes.splice(i, 1)[0].resolver(data);
  };
  return { ctx, peticiones, resolver };
}
const espera = () => new Promise((r) => setImmediate(r));
const REGLA = (id, codigo) => ({ id, codigo, metodoCalculo: 'MANUAL', activo: true });

test('H16 · una recarga lenta del panel no pisa la respuesta de otra más reciente', { timeout: 3000 }, async () => {
  const { ctx, resolver } = configuracionDiferida();
  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  const vieja = ctx.cargarReglasPanel({ forzar: true });
  const nueva = ctx.cargarReglasPanel({ forzar: true });
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(2, 'NUEVA')], 1);
  await nueva;
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(1, 'VIEJA')], 0);
  await vieja;
  assert.deepEqual(ctx.reglasPorConjunto[10].map((r) => r.codigo), ['NUEVA']);
});

test('H16 · lo que trae «Reglas» mientras el panel carga no se sobrescribe con lo anterior', { timeout: 3000 }, async () => {
  const { ctx, resolver } = configuracionDiferida();
  ctx.conjuntosReglas = [ENDESA_BORRADOR];
  const panel = ctx.cargarReglasPanel({ forzar: true });
  ctx.conjuntoParaReglasId = 10;
  const lista = ctx.cargarReglas();
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(2, 'RECIEN_GUARDADA')], 1);
  await lista;
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(1, 'ANTERIOR')], 0);
  await panel;
  assert.deepEqual(ctx.reglasPorConjunto[10].map((r) => r.codigo), ['RECIEN_GUARDADA']);
});

test('H16 · el panel solo vuelve a pedir las reglas de las tablas que han cambiado (salvo «Actualizar»)', { timeout: 3000 }, async () => {
  const { ctx, peticiones, resolver } = configuracionDiferida();
  ctx.conjuntosReglas = [ENDESA_BORRADOR, IRIS_PUBLICADO, { ...IBERDROLA_VALIDADO, estado: 'ARCHIVADO' }];
  const primera = ctx.cargarReglasPanel();
  assert.deepEqual(peticiones, ['/mcas/conjuntos-reglas/10/reglas', '/mcas/conjuntos-reglas/20/reglas'], 'las archivadas no se piden');
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(1, 'A')]);
  resolver('/mcas/conjuntos-reglas/20/reglas', [REGLA(2, 'B')]);
  await primera;

  peticiones.length = 0;
  await ctx.cargarReglasPanel();
  assert.deepEqual(peticiones, [], 'sin cambios no se repite ninguna petición');
  assert.deepEqual(Object.keys(ctx.reglasPorConjunto).sort(), ['10', '20']);

  ctx.conjuntosReglas = [{ ...ENDESA_BORRADOR, estado: 'PUBLICADO' }, IRIS_PUBLICADO];
  const cambio = ctx.cargarReglasPanel();
  assert.deepEqual(peticiones, ['/mcas/conjuntos-reglas/10/reglas'], 'solo la tabla que cambió de estado');
  resolver('/mcas/conjuntos-reglas/10/reglas', [REGLA(1, 'A2')]);
  await cambio;
  assert.deepEqual(ctx.reglasPorConjunto[20].map((r) => r.codigo), ['B'], 'la que no cambió se conserva');

  peticiones.length = 0;
  ctx.conjuntosReglas = [IRIS_PUBLICADO];
  const forzada = ctx.cargarReglasPanel({ forzar: true });
  assert.deepEqual(peticiones, ['/mcas/conjuntos-reglas/20/reglas'], '«Actualizar» lo vuelve a pedir todo');
  resolver('/mcas/conjuntos-reglas/20/reglas', [REGLA(2, 'B2')]);
  await forzada;
  assert.deepEqual(Object.keys(ctx.reglasPorConjunto), ['20'], 'las tablas que ya no están se quitan');
  await espera();

  assert.match(leer(ADMIN), /case 'conjuntos': return this\.cargarConjuntos\(\{ forzarPanel: true \}\)/);
});
