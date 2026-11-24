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

  // Obligatorios de la política; el código y la versión ya no se piden (se generan o se conservan).
  Object.assign(ctx.formRetrocesion, { codigo: '', version: '', idComercializadora: '', vigenciaDesde: '' });
  const obligatorios = ctx.validarRetrocesion();
  for (const campo of ['idComercializadora', 'vigenciaDesde']) assert.ok(obligatorios[campo], campo);
  assert.equal(obligatorios.codigo, undefined);
  assert.equal(obligatorios.version, undefined);
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

test('el interruptor de retrocesión se enseña y se puede encender aunque no tenga fila', () => {
  const ctx = configuracion();
  ctx.featureFlags = [];
  const sinFila = ctx.flagsVista.find((f) => f.codigo === 'MCAS_RETROCESSION_ENABLED');
  assert.equal(sinFila.disponible, true);
  assert.equal(sinFila.activo, false);
  ctx.featureFlags = [{ codigo: 'MCAS_RETROCESSION_ENABLED', activo: true, descripcion: 'Aplicación de políticas de retrocesión' }];
  assert.equal(ctx.flagsVista.find((f) => f.codigo === 'MCAS_RETROCESSION_ENABLED').activo, true);

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

test('la zona de comisión ya no se escribe en el contrato: se enseña la que sale de la provincia del punto', () => {
  const html = plantilla(CONTRATOS);
  assert.doesNotMatch(html, /id="mcasZonaComision"|id="mcasAmbito"|v-model="nuevoContrato\.mcasZonaComision"|v-model="nuevoContrato\.mcasAmbito"/);
  assert.match(html, /v-if="fila\.calculado" class="mcas-solo-lectura__nota">Sale de la provincia del punto de suministro</);
  assert.doesNotMatch(html, /Excel Iberdrola|ZAR si el CUPS/);

  // La zona la trae la vista previa (la calcula el servidor): aquí solo se enseña
  const zona = { clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión (provincia del punto de suministro)', falta: false, valores: ['ZAR', 'ZBR'] };
  const ctx = modalContratos({ vistaPrevia: { estado: 'CALCULADO', zonaComision: 'ZAR', campos: [zona] } });
  assert.deepEqual(ctx.filasSoloLecturaMcas,
    [{ clave: 'ZONA_COMISION', campo: 'zonaComision', etiqueta: 'Zona de comisión', falta: false, calculado: true, valor: 'ZAR' }]);
  const sinZona = modalContratos({ vistaPrevia: { estado: 'CALCULADO', zonaComision: null, campos: [zona] } });
  assert.equal(sinZona.filasSoloLecturaMcas[0].valor, 'Sin determinar');
});

test('la potencia de cálculo ya no se escribe a mano: siempre la mayor contratada', () => {
  const html = plantilla(CONTRATOS);
  assert.doesNotMatch(html, /nuevoContrato\.mcasPotenciaCalculo/);
  assert.doesNotMatch(html, /Mayor potencia/);
  assert.equal(modalContratos({ nuevoContrato: { pot1: 10, pot2: 45 } }).mayorPotenciaMcas, 45);
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

test('si no se puede saber la zona, se dice el motivo del servidor y el contrato no se guarda', async () => {
  const motivo = 'No se reconoce la provincia del punto de suministro (Mursia): elíjala de la lista en el punto para saber su zona de comisión.';
  const sinZona = {
    estado: 'REQUIERE_DATOS', mensaje: motivo, zonaComision: null,
    campos: [{ clave: 'ZONA_COMISION', etiqueta: 'Zona de comisión (provincia del punto de suministro)', falta: true, valores: ['ZAR', 'ZBR'] }],
  };
  const cabecera = camposContrato.cabeceraVistaPrevia(sinZona, {});
  assert.equal(cabecera.tono, 'aviso');
  assert.equal(cabecera.titulo, motivo);
  assert.deepEqual(cabecera.faltan, [], 'no es un campo del formulario: no hay enlace a ningún campo');
  assert.equal(cabecera.detalle, camposContrato.TEXTO_ZONA_SIN_SABER);

  // Con otro dato que sí se rellena aquí, la lista sale como siempre y la zona va sin enlace
  const conFee = { ...sinZona, campos: [...sinZona.campos, { clave: 'FEE', etiqueta: 'FEE del contrato', falta: true }] };
  assert.deepEqual(camposContrato.cabeceraVistaPrevia(conFee, {}).faltan.map((f) => [f.campo, !!f.calculado]),
    [['zonaComision', true], ['mcasFeeEurMwh', false]]);
  assert.match(plantilla(CONTRATOS), /<span v-if="f\.calculado">\{\{ f\.etiqueta \}\}<\/span>\s*<button v-else type="button" class="mcas-enlace" @click="irACampoMcas\(f\.campo\)"/);

  // Al guardar: no deja, y el aviso es el motivo (no una lista de campos que no existen)
  const ctx = modalContratos({ vistaPrevia: sinZona });
  ctx.pedirVistaPrevia = async () => {};
  Object.defineProperty(ctx, 'sinComisionMcas', { get: () => false, configurable: true });
  Object.defineProperty(ctx, 'vistaPreviaMcasValida', { get: () => true, configurable: true });
  assert.equal(await ctx.datosMcasCompletos(), false);
  assert.equal(ctx.pestanaContrato, 'mcas');
  const aviso = ctx.avisos[ctx.avisos.length - 1];
  assert.equal(aviso.title, 'Faltan datos de la comisión');
  assert.match(aviso.html, /No se reconoce la provincia del punto de suministro \(Mursia\)/);
  assert.doesNotMatch(aviso.html, /Complete estos datos/);
});
