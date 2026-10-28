// MCAS · conformidad con el cliente (29/09/2026), tarea T4:
// pestaña «Retrocesiones» de Configuración MCAS y pestaña «Comisión MCAS» del contrato.
const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';

const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
let reglas;
let activacion;
test.before(async () => {
  reglas = await importar('src/components/CRM_Module/MCAS/mcasReglas.js');
  activacion = await importar('src/components/CRM_Module/MCAS/mcasActivacion.js');
});

// ---------------------------------------------------------------------------
// Configuración MCAS › Retrocesiones
// ---------------------------------------------------------------------------

/** Lo que el componente importa de un módulo (el resto de exports chocaría con sus constantes). */
function importadoDe(modulo, exportaciones) {
  const linea = leer(ADMIN).match(new RegExp(`^import \\{([^}]+)\\} from '\\./${modulo}'`, 'm'));
  assert.ok(linea, `el import de ${modulo} debe ocupar una sola línea`);
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, exportaciones[n]]));
}
const importadoDeReglas = () => importadoDe('mcasReglas', reglas);

/** Configuración MCAS con un axios falso que anota cada petición. */
function configuracion({ peticiones = [], respuestas = {}, fallo = null } = {}) {
  const responder = (metodo) => async (url, datos) => {
    peticiones.push({ metodo, url, datos });
    if (fallo) throw fallo;
    return { data: respuestas[url] ?? {} };
  };
  const componente = cargarComponente(ADMIN, {
    ...importadoDeReglas(),
    ...importadoDe('mcasActivacion', activacion),
    axios: { get: responder('get'), post: responder('post'), put: responder('put'), delete: responder('delete') },
    compararValores: (a, b) => String(a ?? '').localeCompare(String(b ?? '')),
    confirmar: async () => true,
    mostrarError: (swal, title, text) => swal.fire({ icon: 'error', title, text }),
    mostrarExito: (swal, title, text) => swal.fire({ icon: 'success', title, text }),
    mostrarAviso: (swal, title, text) => swal.fire({ icon: 'warning', title, text }),
    textoError: (e, base) => base,
    fechaLocalISO: () => '2026-09-29',
    comprobacionesModulo: () => [],
  });
  return crearContexto(componente);
}

const POLITICA_PYME = {
  id: 7, codigo: 'RET-ENDESA-PYME-20260309', idComercializadora: 3, nombreComercializadora: 'ENDESA ENERGIA S.A.U.',
  idGestora: null, nombreGestora: null, version: '1', vigenciaDesde: '2026-03-09', vigenciaHasta: null,
  tipoSuministro: 'LUZ', segmento: 'PYME', tarifaAcceso: null, metodo: 'PORCENTAJE', limiteImportePagado: true,
  estado: 'BORRADOR', descripcion: 'Excel D81:G81', resumen: '0–3 meses: 100 %; 3–6 meses: 60 %',
  tramos: [
    { id: 11, unidad: 'MESES', desdeValor: 0, hastaValor: 3, desdeInclusivo: true, hastaInclusivo: false, valor: 1, tipoValor: 'PORCENTAJE', prioridad: 1 },
    { id: 12, unidad: 'MESES', desdeValor: 3, hastaValor: 6, desdeInclusivo: true, hastaInclusivo: false, valor: 0.6, tipoValor: 'PORCENTAJE', prioridad: 2 },
  ],
};

const CAMPOS_POLITICA = ['id', 'codigo', 'idComercializadora', 'idGestora', 'version', 'vigenciaDesde', 'vigenciaHasta',
  'tipoSuministro', 'segmento', 'tarifaAcceso', 'metodo', 'limiteImportePagado', 'descripcion', 'tramos'];
const CAMPOS_TRAMO = ['id', 'unidad', 'desdeValor', 'hastaValor', 'desdeInclusivo', 'hastaInclusivo', 'valor', 'tipoValor', 'prioridad'];

test('Configuración MCAS tiene una pestaña «Retrocesiones» que lista las políticas del servidor', async () => {
  const fuente = leer(ADMIN);
  assert.match(fuente, /id: 'retrocesiones', label: 'Retrocesiones'/);
  assert.match(fuente, /axios\.get\('\/mcas\/politicas-retrocesion'\)/);

  const bloque = fuente.match(/\n {2}retrocesiones: \[([\s\S]*?)\n {2}\],/);
  assert.ok(bloque, 'faltan las columnas de la pestaña Retrocesiones');
  const columnas = [...bloque[1].matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(columnas, ['Comercializadora', 'Segmento', 'Suministro', 'Tarifa', 'Método', 'Resumen', 'Estado']);

  const html = plantilla(ADMIN);
  assert.match(html, /<template v-if="tabActivo === 'retrocesiones'">/);
  assert.match(html, /v-if="tabActivo === 'retrocesiones'"[^>]*@click="abrirModalRetrocesion\(\)"[\s\S]{0,120}Nueva política/);

  const peticiones = [];
  const ctx = configuracion({ peticiones, respuestas: { '/mcas/politicas-retrocesion': [POLITICA_PYME] } });
  await ctx.cargarRetrocesiones();
  assert.deepEqual(peticiones.map((p) => p.url), ['/mcas/politicas-retrocesion']);
  assert.equal(ctx.politicasRetrocesion.length, 1);
  ctx.tabActivo = 'retrocesiones';
  assert.equal(ctx.contadorTab('retrocesiones'), 1);
  assert.deepEqual(ctx.filasTab, [POLITICA_PYME]);
});

test('cada política ofrece solo las acciones que admite su estado', () => {
  const html = plantilla(ADMIN);
  assert.match(html, /v-if="p\.estado === 'BORRADOR'"[^>]*title="Editar política"[^>]*@click="abrirModalRetrocesion\(p\)"/);
  assert.match(html, /v-else[^>]*title="Ver política"[^>]*@click="abrirModalRetrocesion\(p\)"/);
  assert.match(html, /v-if="p\.estado === 'BORRADOR'"[^>]*title="Publicar política"[^>]*@click="cambiarEstadoRetrocesion\(p, 'publicar'\)"/);
  assert.match(html, /v-if="p\.estado === 'BORRADOR' \|\| p\.estado === 'PUBLICADO'"[^>]*title="Archivar política"[^>]*@click="cambiarEstadoRetrocesion\(p, 'archivar'\)"/);
  assert.match(html, /v-if="p\.estado === 'BORRADOR'"[^>]*title="Eliminar política"[^>]*@click="eliminarRetrocesion\(p\)"/);

  const fuente = leer(ADMIN);
  assert.match(fuente, /axios\.post\(`\/mcas\/politicas-retrocesion\/\$\{p\.id\}\/\$\{accion\}`\)/);
  assert.match(fuente, /axios\.delete\(`\/mcas\/politicas-retrocesion\/\$\{p\.id\}`\)/);
});

test('los porcentajes de los tramos se muestran en % y se envían como factor', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones, respuestas: { '/mcas/politicas-retrocesion': [POLITICA_PYME] } });
  ctx.abrirModalRetrocesion(POLITICA_PYME);

  assert.equal(ctx.modalRetrocesion, true);
  assert.equal(ctx.soloLecturaRetrocesion, false);
  assert.deepEqual(ctx.formRetrocesion.tramos.map((t) => t.valor), [100, 60]);

  ctx.formRetrocesion.tramos[1].valor = 33.33;
  await ctx.guardarRetrocesion();

  const put = peticiones.find((p) => p.metodo === 'put');
  assert.ok(put, 'no se ha guardado la política');
  assert.equal(put.url, '/mcas/politicas-retrocesion/7');
  assert.deepEqual(put.datos.tramos.map((t) => t.valor), [1, 0.3333]);
  assert.deepEqual(put.datos.tramos.map((t) => [t.desdeValor, t.hastaValor]), [[0, 3], [3, 6]]);
  // Solo viajan los campos del contrato de interfaz (nada de resumen, nombres ni estado).
  for (const clave of Object.keys(put.datos)) assert.ok(CAMPOS_POLITICA.includes(clave), `campo inesperado: ${clave}`);
  for (const tramo of put.datos.tramos) {
    for (const clave of Object.keys(tramo)) assert.ok(CAMPOS_TRAMO.includes(clave), `campo de tramo inesperado: ${clave}`);
  }
  assert.equal(ctx.modalRetrocesion, false);
});

test('una política nueva se crea con POST y los importes fijos no se dividen entre 100', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.abrirModalRetrocesion();
  assert.equal(ctx.formRetrocesion.id, null);
  assert.equal(ctx.formRetrocesion.tramos.length, 1, 'una política nueva empieza con un tramo');

  Object.assign(ctx.formRetrocesion, {
    codigo: ' RET-PRUEBA ', idComercializadora: 3, vigenciaDesde: '2026-01-01', metodo: 'FIJO', segmento: '', tipoSuministro: '',
  });
  Object.assign(ctx.formRetrocesion.tramos[0], { unidad: 'DIAS', desde: 0, hasta: 90, valor: 50, tipoValor: 'IMPORTE_FIJO' });
  await ctx.guardarRetrocesion();

  const post = peticiones.find((p) => p.metodo === 'post');
  assert.ok(post, 'no se ha creado la política');
  assert.equal(post.url, '/mcas/politicas-retrocesion');
  assert.equal(post.datos.codigo, 'RET-PRUEBA');
  assert.equal(post.datos.segmento, null, 'un filtro sin elegir viaja como null');
  assert.deepEqual(post.datos.tramos, [{
    id: null, unidad: 'DIAS', desdeValor: 0, hastaValor: 90, desdeInclusivo: true, hastaInclusivo: false,
    valor: 50, tipoValor: 'IMPORTE_FIJO', prioridad: 1,
  }]);
});

test('el formulario valida los tramos antes de enviar nada', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.abrirModalRetrocesion({ ...POLITICA_PYME, tramos: [
    { unidad: 'MESES', desdeValor: 6, hastaValor: 3, valor: 0.5, tipoValor: 'PORCENTAJE' },
    { unidad: 'MESES', desdeValor: 0, hastaValor: 3, valor: 1.2, tipoValor: 'FACTOR' },
  ] });

  const errores = ctx.validarRetrocesion();
  assert.match(errores['tramos.0.hasta'], /mayor que «desde»/);
  assert.match(errores['tramos.1.valor'], /entre 0 y 100/);

  await ctx.guardarRetrocesion();
  assert.equal(peticiones.filter((p) => p.metodo !== 'get').length, 0, 'con errores no se envía nada');
  assert.ok(Object.keys(ctx.erroresForm).length > 0);

  // Al menos un tramo, salvo prorrateo o «No aplica».
  ctx.formRetrocesion.tramos = [];
  assert.match(ctx.validarRetrocesion().tramos, /al menos un tramo/i);
  ctx.formRetrocesion.metodo = 'PRORRATEO';
  assert.equal(ctx.validarRetrocesion().tramos, undefined);
  ctx.formRetrocesion.metodo = 'NO_APLICA';
  assert.equal(ctx.validarRetrocesion().tramos, undefined);

  // Obligatorios de la política (el código solo en una ya guardada: al crearla se genera).
  Object.assign(ctx.formRetrocesion, { codigo: '', idComercializadora: '', vigenciaDesde: '' });
  const obligatorios = ctx.validarRetrocesion();
  for (const campo of ['codigo', 'idComercializadora', 'vigenciaDesde']) assert.ok(obligatorios[campo], campo);
  ctx.formRetrocesion.id = null;
  assert.equal(ctx.validarRetrocesion().codigo, undefined);
});

test('los tramos sin tipo de valor (datos antiguos) se avisan y no se pueden publicar; los nuevos no ofrecen «Sin elegir»', async () => {
  const html = plantilla(ADMIN);
  assert.match(html, /v-if="t\.tipoValor === 'SIN_CONFIRMAR'"[\s\S]{0,200}Tipo de valor sin elegir/);
  assert.match(html, /<option v-for="tv in tiposValorDeTramo\(t\)"/);
  const opciones = configuracion();
  assert.deepEqual(opciones.tiposValorDeTramo({ tipoValor: 'PORCENTAJE' }).map((t) => t.value), ['PORCENTAJE', 'IMPORTE_FIJO']);
  assert.deepEqual(opciones.tiposValorDeTramo({ tipoValor: 'SIN_CONFIRMAR' }).map((t) => t.value), ['PORCENTAJE', 'IMPORTE_FIJO', 'SIN_CONFIRMAR']);
  assert.deepEqual(opciones.tiposValorDeTramo({ tipoValor: 'FACTOR' }).map((t) => t.value), ['PORCENTAJE', 'IMPORTE_FIJO', 'FACTOR']);

  const iberdrola = { ...POLITICA_PYME, id: 9, codigo: 'RET-IBERDROLA-2_0TD-20260101', tramos: [
    { unidad: 'DIAS', desdeValor: 0, hastaValor: 90, valor: 1, tipoValor: 'PORCENTAJE' },
    { unidad: 'DIAS', desdeValor: 90, hastaValor: 180, desdeInclusivo: false, hastaInclusivo: true, valor: 20, tipoValor: 'SIN_CONFIRMAR' },
  ] };
  const peticiones = [];
  const ctx = configuracion({ peticiones });

  // En el formulario el valor sin confirmar se enseña tal cual, sin convertirlo.
  ctx.abrirModalRetrocesion(iberdrola);
  assert.equal(ctx.formRetrocesion.tramos[1].valor, 20);
  assert.equal(ctx.formRetrocesion.tramos[1].desdeInclusivo, false);
  assert.equal(ctx.formRetrocesion.tramos[1].hastaInclusivo, true);
  ctx.cerrarModales();

  await ctx.cambiarEstadoRetrocesion(iberdrola, 'publicar');
  assert.equal(peticiones.length, 0, 'no debe pedir la publicación');
  assert.equal(ctx.avisos.at(-1).icon, 'error');
  assert.match(ctx.avisos.at(-1).text, /sin tipo de valor/);

  await ctx.cambiarEstadoRetrocesion(POLITICA_PYME, 'publicar');
  assert.deepEqual(peticiones.filter((p) => p.metodo === 'post').map((p) => p.url), ['/mcas/politicas-retrocesion/7/publicar']);
});

test('las políticas publicadas o archivadas se abren en modo consulta', () => {
  const ctx = configuracion();
  ctx.abrirModalRetrocesion({ ...POLITICA_PYME, estado: 'PUBLICADO' });
  assert.equal(ctx.soloLecturaRetrocesion, true);
  assert.match(plantilla(ADMIN), /<fieldset class="fieldset-limpio" :disabled="soloLecturaRetrocesion">/);
});

test('el formulario de política explica qué pasa si a un contrato le corresponden varias', () => {
  const html = plantilla(ADMIN);
  assert.match(html, /Si a un contrato le corresponden varias, se usa la más concreta; si dos empatan, la propuesta lo avisa y no asocia ninguna/);
  assert.doesNotMatch(html, /en lugar de elegir una/);
});

test('el interruptor de retrocesión aclara que hoy no tiene efecto', () => {
  const aclaracion = 'Por ahora no tiene efecto: la retrocesión potencial se enseña siempre en cada propuesta, como dato informativo';
  const ctx = configuracion();
  const retrocesion = () => ctx.flagsVista.find((f) => f.codigo === 'MCAS_RETROCESSION_ENABLED');

  ctx.featureFlags = [{ codigo: 'MCAS_RETROCESSION_ENABLED', activo: false }];
  assert.equal(retrocesion().descripcion, aclaracion);
  assert.equal(retrocesion().ayuda, aclaracion);

  // Con descripción propia del servidor, la aclaración queda como ayuda secundaria.
  ctx.featureFlags = [{ codigo: 'MCAS_RETROCESSION_ENABLED', activo: false, descripcion: 'Aplicación de políticas de retrocesión' }];
  assert.equal(retrocesion().descripcion, 'Aplicación de políticas de retrocesión');
  assert.equal(retrocesion().ayuda, `Aplicación de políticas de retrocesión\n${aclaracion}`);

  // El resto de interruptores no cambia.
  ctx.featureFlags = [{ codigo: 'MCAS_ENABLED', activo: true, descripcion: 'Cálculo automático' }];
  assert.equal(ctx.flagsVista.find((f) => f.codigo === 'MCAS_ENABLED').ayuda, 'Cálculo automático');

  assert.match(plantilla(ADMIN), /:title="f\.disponible \? f\.ayuda :/);
});

test('al pasar un tramo sin confirmar a porcentaje se avisa de cómo se lee el valor', async () => {
  const html = plantilla(ADMIN);
  assert.match(html, /:value="t\.tipoValor"[^>]*@change="cambiarTipoTramo\(t, \$event\.target\.value\)"/);
  assert.match(html, /v-if="t\.revisarValor"[\s\S]{0,250}Revise el valor: ahora se interpreta como porcentaje \(0,75 = 0,75 %; para 75 % escriba 75\)/);

  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.abrirModalRetrocesion({ ...POLITICA_PYME, tramos: [
    { unidad: 'DIAS', desdeValor: 90, hastaValor: 180, valor: 0.75, tipoValor: 'SIN_CONFIRMAR', prioridad: 1 },
    { unidad: 'DIAS', desdeValor: 180, hastaValor: 270, valor: 0.5, tipoValor: 'PORCENTAJE', prioridad: 2 },
  ] });
  const [sinConfirmar, porcentaje] = ctx.formRetrocesion.tramos;
  assert.equal(sinConfirmar.revisarValor, false);

  ctx.cambiarTipoTramo(sinConfirmar, 'PORCENTAJE');
  assert.equal(sinConfirmar.tipoValor, 'PORCENTAJE');
  assert.equal(sinConfirmar.revisarValor, true, 'debe avisar de que 0,75 pasa a ser 0,75 %');
  assert.equal(sinConfirmar.valor, 0.75, 'el valor no se toca: lo decide el usuario');
  ctx.cambiarTipoTramo(sinConfirmar, 'FACTOR');
  assert.equal(sinConfirmar.revisarValor, true, 'sigue leyéndose en %');
  ctx.cambiarTipoTramo(sinConfirmar, 'IMPORTE_FIJO');
  assert.equal(sinConfirmar.revisarValor, false);

  ctx.cambiarTipoTramo(porcentaje, 'FACTOR');
  assert.equal(porcentaje.revisarValor, false, 'solo se avisa al salir de «Sin confirmar»');

  // El aviso es del formulario: no viaja al servidor.
  await ctx.guardarRetrocesion();
  const put = peticiones.find((p) => p.metodo === 'put');
  assert.ok(put, 'no se ha guardado la política');
  for (const tramo of put.datos.tramos) assert.equal('revisarValor' in tramo, false);
});

test('el estado del módulo informa de las políticas de retrocesión publicadas', () => {
  assert.match(plantilla(ADMIN), /Políticas de retrocesión publicadas: \{\{/);
  const ctx = configuracion();
  ctx.politicasRetrocesion = [
    { ...POLITICA_PYME, estado: 'PUBLICADO' }, { ...POLITICA_PYME, id: 8, estado: 'BORRADOR' }, { ...POLITICA_PYME, id: 9, estado: 'PUBLICADO' },
  ];
  assert.equal(ctx.retrocesionesPublicadas, 2);
});

// ---------------------------------------------------------------------------
// Contrato › Comisión MCAS
// ---------------------------------------------------------------------------

let camposContrato;
test.before(async () => { camposContrato = await importar('src/components/CRM_Module/PuntosSuministro/mcasCamposContrato.js'); });

/** Lo que el formulario importa de mcasCamposContrato.js (en una sola línea). */
function importadoDeCampos() {
  const linea = leer(CONTRATOS).match(/^import \{([^}]+)\} from ['"]\.\/mcasCamposContrato['"];?$/m);
  assert.ok(linea, 'el import de mcasCamposContrato debe ocupar una sola línea');
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, camposContrato[n]]));
}

function modalContratos({ comercializadoras = [], puntoSuministro = {}, nuevoContrato = {}, modoEdicion = false, vistaPrevia = null } = {}) {
  const componente = cargarComponente(CONTRATOS, { ...importadoDeCampos(), axios: {}, fechaLocalISO: () => '2026-09-29' });
  return crearContexto(componente, {
    comercializadoras, comercializadorasList: comercializadoras, puntoSuministro, modoEdicion, vistaPrevia,
    tarifasGas: [], tarifasLuz: [], contratos: [],
    nuevoContrato: {
      mcasTipoPrecio: 'FIJO', mcasTipoSuministro: 'LUZ', mcasSegmento: 'PYME', contrato: 'CT-1',
      fechaInicio: '2026-09-01', idComercializadoraActual: 5, mcasZonaComision: null, ...nuevoContrato,
    },
  });
}

test('el producto del contrato se rotula como la «tarifa de precios» del cliente', () => {
  const html = plantilla(CONTRATOS);
  assert.match(html, /Tarifa de precios \(producto\)/);
  assert.doesNotMatch(html, /Producto comercial/);
});

test('la zona de comisión se elige en un desplegable: sin especificar, ZBR o ZAR', () => {
  const html = plantilla(CONTRATOS);
  const zona = html.match(/<select id="mcasZonaComision" v-model="nuevoContrato\.mcasZonaComision"[\s\S]*?<\/select>/);
  assert.ok(zona, 'la zona de comisión debe ser un <select>');
  // Las opciones salen de la vista previa; sin ella, las de siempre (mcas-vista-previa.spec.js).
  assert.match(zona[0], /<option :value="null">Sin especificar<\/option>\s*<option v-for="zona in opcionesZonaMcas"/);
  assert.deepEqual(modalContratos().opcionesZonaMcas, ['ZBR', 'ZAR']);
  assert.doesNotMatch(html, /<input[^>]*v-model="nuevoContrato\.mcasZonaComision"/);
  // Ayuda en lenguaje llano, sin remitir al Excel de la comercializadora.
  assert.match(html, /ZAR si el CUPS de luz empieza por ES0021; ZBR en el resto\./);
  assert.doesNotMatch(html, /Excel Iberdrola/);
});

test('la potencia de cálculo vacía usa la mayor potencia contratada', () => {
  const html = plantilla(CONTRATOS);
  assert.match(html, /v-model="nuevoContrato\.mcasPotenciaCalculo"[\s\S]{0,200}:placeholder="placeholderPotenciaMcas"/);
  assert.equal(modalContratos().placeholderPotenciaMcas, 'Vacío = mayor potencia contratada');
  // Con potencias, el hueco dice cuál se usará.
  assert.equal(modalContratos({ nuevoContrato: { pot1: 10, pot2: 45 } }).placeholderPotenciaMcas, 'Vacío = 45 kW (mayor contratada)');
});

test('el segmento se recomienda, pero no impide calcular ni consultar la comisión', () => {
  // El servidor calcula sin segmento (p. ej. TotalEnergies no lo usa): solo se avisa aparte.
  const sinSegmento = modalContratos({ nuevoContrato: { mcasSegmento: null } });
  assert.deepEqual(sinSegmento.mcasFaltan, []);
  assert.equal(sinSegmento.mcasListo, true);
  assert.deepEqual(sinSegmento.mcasRecomendados, ['Segmento']);
  assert.equal(sinSegmento.avisoRecomendadoMcas, 'Recomendado: Segmento (casi todas las reglas lo usan)');

  const conSegmento = modalContratos({ nuevoContrato: { mcasSegmento: 'RESIDENCIAL' } });
  assert.deepEqual(conSegmento.mcasRecomendados, []);
  assert.equal(conSegmento.avisoRecomendadoMcas, '');

  const sinComision = modalContratos({ nuevoContrato: { mcasTipoPrecio: '', mcasSegmento: null } });
  assert.equal(sinComision.avisoRecomendadoMcas, '', 'sin tipo de precio no hay comisión que recomendar');

  // Con vista previa sobra: ya dice qué datos usa la comercializadora.
  const conVista = modalContratos({ nuevoContrato: { mcasSegmento: null }, vistaPrevia: { estado: 'CALCULADO', campos: [] } });
  assert.equal(conVista.avisoRecomendadoMcas, '');

  const html = plantilla(CONTRATOS);
  assert.match(html, /v-if="avisoRecomendadoMcas"[\s\S]{0,300}\{\{ avisoRecomendadoMcas \}\}/);
  // Tras guardar se pregunta al servidor siempre que haya tipo de precio: su resumen
  // cuenta lo que ha pasado, falte lo que falte (el segmento no interviene).
  assert.match(leer(CONTRATOS), /const consultaMcas = Boolean\(this\.nuevoContrato\.mcasTipoPrecio\);/);
});

test('la zona se propone por el CUPS de luz cuando la tabla de comisiones la usa, sin pisar lo que eligió el usuario', () => {
  // Qué comercializadoras usan la zona lo dice la vista previa (antes: el nombre «IBERDROLA»).
  const usaZona = { estado: 'REQUIERE_DATOS', campos: [{ clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión', falta: true, valores: [] }] };
  const iberdrola = [{ id: 5, nombre: 'IBERDROLA CLIENTES, S.A.U.' }];

  const zar = modalContratos({ puntoSuministro: { CUPSluz: 'ES0021000011111111AB0F' }, vistaPrevia: usaZona });
  zar.sugerirZonaMcas();
  assert.equal(zar.nuevoContrato.mcasZonaComision, 'ZAR');

  const zbr = modalContratos({ puntoSuministro: { cupsluz: 'ES0031405555555555XY0F' }, vistaPrevia: usaZona });
  zbr.sugerirZonaMcas();
  assert.equal(zbr.nuevoContrato.mcasZonaComision, 'ZBR');

  const elegida = modalContratos({
    puntoSuministro: { CUPSluz: 'ES0021000011111111AB0F' }, vistaPrevia: usaZona, nuevoContrato: { mcasZonaComision: 'ZBR' },
  });
  elegida.sugerirZonaMcas();
  assert.equal(elegida.nuevoContrato.mcasZonaComision, 'ZBR', 'no se pisa la zona elegida');

  const noLaUsa = modalContratos({
    comercializadoras: iberdrola, puntoSuministro: { CUPSluz: 'ES0021000011111111AB0F' }, vistaPrevia: { estado: 'CALCULADO', campos: [] },
  });
  noLaUsa.sugerirZonaMcas();
  assert.equal(noLaUsa.nuevoContrato.mcasZonaComision, null, 'el nombre de la comercializadora ya no basta');

  const sinVista = modalContratos({ comercializadoras: iberdrola, puntoSuministro: { CUPSluz: 'ES0021000011111111AB0F' } });
  sinVista.sugerirZonaMcas();
  assert.equal(sinVista.nuevoContrato.mcasZonaComision, null, 'sin vista previa no se sabe si la usa');

  // Al modificar un contrato ya guardado no se rellena sola: cambiaría sus datos MCAS
  // y dejaría desactualizada una propuesta pendiente sin que el usuario lo decidiera.
  const guardado = modalContratos({
    puntoSuministro: { CUPSluz: 'ES0021000011111111AB0F' }, vistaPrevia: usaZona, modoEdicion: true,
  });
  guardado.sugerirZonaMcas();
  assert.equal(guardado.nuevoContrato.mcasZonaComision, null, 'no se toca un contrato ya guardado');

  // La sugerencia se lanza al llegar la vista previa, no al cambiar la comercializadora
  // (la vista previa anterior sería la de la comercializadora de antes).
  const pedir = leer(CONTRATOS).match(/async pedirVistaPrevia\(\) \{[\s\S]*?\n {4}\},/);
  assert.ok(pedir);
  assert.match(pedir[0], /this\.sugerirZonaMcas\(\)/);
  const watch = leer(CONTRATOS).match(/'nuevoContrato\.idComercializadoraActual'\(newVal, oldVal\) \{[\s\S]*?\n {4}\},/);
  assert.ok(watch);
  assert.doesNotMatch(watch[0], /sugerirZonaMcas/);
});
