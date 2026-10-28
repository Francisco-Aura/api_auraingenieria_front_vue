// MCAS · arranque vacío (21/10/2026): el módulo sube sin ninguna tabla, regla, producto
// ni política precargada y el administrador del cliente lo configura todo desde la pantalla.
// Plan: docs/superpowers/plans/2026-10-21-mcas-arranque-vacio.md (agente FE).
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const ACTIVACION = 'src/components/CRM_Module/MCAS/mcasActivacion.js';
const REGLAS = 'src/components/CRM_Module/MCAS/mcasReglas.js';
const ESTADOS = 'src/components/CRM_Module/MCAS/mcasEstados.js';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);
/** Plantilla con saltos de línea LF (los .vue del repositorio usan CRLF). */
const tpl = (ruta) => plantilla(ruta).split(String.fromCharCode(13)).join('');

let activacion;
let reglas;
test.before(async () => {
  activacion = await importar(ACTIVACION);
  reglas = await importar(REGLAS);
});

const HOY = '2026-10-21';
const COMERCIALIZADORAS = [
  { id: 1, nombre: 'IRIS ENERGIA, S.L.' }, { id: 2, nombre: 'ENDESA ENERGIA S.A.U.' }, { id: 3, nombre: 'TOTALENERGIES CLIENTES' },
];
const IRIS_BORRADOR = { id: 10, codigo: 'IRIS-FIJO-20260101', nombre: 'Iris 2026', idComercializadora: 1, fasePrecio: 'FIJO',
  vigenciaDesde: '2026-01-01', vigenciaHasta: null, estado: 'BORRADOR' };
const IRIS_ACTIVA = { ...IRIS_BORRADOR, estado: 'PUBLICADO' };

/** Lo que el componente importa de un módulo (el resto de exports chocaría con sus constantes). */
function importadoDe(modulo, exportaciones) {
  const linea = leer(ADMIN).match(new RegExp(`^import \\{([^}]+)\\} from '\\./${modulo}'`, 'm'));
  assert.ok(linea, `el import de ${modulo} debe ocupar una sola línea`);
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, exportaciones[n]]));
}

function configuracion({ peticiones = [], respuestas = {}, comprobaciones = [] } = {}) {
  const responder = (metodo) => async (url, datos) => {
    peticiones.push({ metodo, url, datos });
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

// ---------------------------------------------------------------------------
// 1 · Sin lógica ni textos de la precarga
// ---------------------------------------------------------------------------

test('no queda lógica de la precarga: la Hoja2 del cliente ya no marca reglas pendientes', () => {
  assert.equal(activacion.reglaPendienteHoja2, undefined);
  assert.doesNotMatch(leer(ACTIVACION), /hoja\s*2/i);
  const filas = activacion.estadoPorComercializadora({
    conjuntos: [IRIS_BORRADOR], comercializadoras: COMERCIALIZADORAS, politicas: [], hoy: HOY,
    reglasPorConjunto: { 10: [{ id: 5, codigo: 'X', activo: false, descripcion: 'Hoja2: manual. Activar si el cliente lo confirma' }] },
  });
  assert.ok(!filas.some((f) => f.pendientes.some((p) => p.tipo === 'regla')), 'una regla inactiva es una decisión del usuario');
});

const PALABRAS_PRECARGA = [/hoja ?2/i, /precargad/i, /fase 3/i, /confírmelo/i, /confirmelo/i, /\bcon el cliente\b/i, /\bconjuntos?\b/i, /\bindicador(es)?\b/i];

/** Textos que ve el usuario: la plantilla y las cadenas del script (sin comentarios ni identificadores). */
function textosVisibles(ruta) {
  const fuente = leer(ruta);
  const script = (fuente.match(/<script>([\s\S]*?)<\/script>/) || [fuente, fuente])[1]
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const cadenas = [...script.matchAll(/'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2])
    .filter((t) => /\s/.test(t) && !/^[\w./-]+$/.test(t)); // frases, no claves ni rutas
  const html = ruta.endsWith('.vue') ? plantilla(ruta).replace(/<!--[\s\S]*?-->/g, '') : '';
  const sinAtributosTecnicos = html.replace(/\s(?:v-[\w:.-]+|:[\w.-]+|@[\w.-]+|class|id|for|key|ref|list|aria-labelledby)="[^"]*"/g, ' ')
    // De las interpolaciones solo cuentan sus textos entre comillas (no las variables).
    .replace(/\{\{([\s\S]*?)\}\}/g, (m, expr) => [...expr.matchAll(/'([^']*)'/g)].map((x) => x[1]).join(' '));
  return [sinAtributosTecnicos, ...cadenas].join('\n');
}

for (const ruta of [ADMIN, ACTIVACION, REGLAS, ESTADOS,
  'src/components/CRM_Module/MCAS/McasComponent.vue', 'src/components/CRM_Module/MCAS/McasMatrizEditor.vue',
  'src/components/CRM_Module/PuntosSuministro/mcasCamposContrato.js']) {
  test(`sin textos de la precarga en ${path.basename(ruta)}`, () => {
    const textos = textosVisibles(ruta);
    for (const palabra of PALABRAS_PRECARGA) {
      const encontrado = textos.match(new RegExp(`.{0,60}${palabra.source}.{0,60}`, palabra.flags));
      assert.equal(encontrado, null, `${ruta}: «${encontrado?.[0]}»`);
    }
    // «Excel» solo en lo de pegar desde Excel (botón, panel y sus mensajes).
    for (const linea of textos.split('\n').filter((l) => /excel/i.test(l))) {
      assert.match(linea, /[Pp]egar desde Excel|[Pp]egue|[Cc]opie|péguelas|copiadas|primera (fila|columna) del Excel|desde Excel/,
        `${ruta}: «${linea.trim().slice(0, 160)}»`);
    }
  });
}

test('el interruptor de retrocesión ya no habla de la «fase 3»', () => {
  const ctx = configuracion();
  ctx.featureFlags = [{ codigo: 'MCAS_RETROCESSION_ENABLED', activo: false }];
  const f = ctx.flagsVista.find((x) => x.codigo === 'MCAS_RETROCESSION_ENABLED');
  assert.equal(f.descripcion, 'Por ahora no tiene efecto: la retrocesión potencial se enseña siempre en cada propuesta, como dato informativo');
  assert.doesNotMatch(f.efecto, /fase/);
});

// ---------------------------------------------------------------------------
// 2 · Estado por comercializadora con todo vacío
// ---------------------------------------------------------------------------

test('con todo vacío cada comercializadora sale «sin tabla» con la acción de crear su tabla', () => {
  const filas = activacion.estadoPorComercializadora({ comercializadoras: COMERCIALIZADORAS, hoy: HOY });
  assert.equal(filas.length, 3);
  for (const f of filas) {
    assert.equal(f.estado, 'SIN_TABLA');
    assert.equal(f.texto, 'Sin tabla: las comisiones se completan a mano');
    assert.deepEqual(f.pendientes.map((p) => [p.tipo, p.etiquetaEnlace, p.enlace.tipo]), [['sin-tabla', 'Crear su tabla', 'nueva-tabla']]);
    assert.equal(f.pendientes[0].enlace.idComercializadora, f.idComercializadora);
  }
});

test('«Tablas de comisiones activadas» no sale en verde si no hay ninguna tabla activa', () => {
  const vacio = activacion.comprobacionActivacion(activacion.estadoPorComercializadora({ comercializadoras: COMERCIALIZADORAS, hoy: HOY }));
  assert.equal(vacio.ok, false);
  assert.equal(vacio.detalle, 'Todavía no hay ninguna tabla de comisiones activa: hasta que active una, las comisiones se completan a mano.');
  assert.equal(activacion.comprobacionActivacion([]).ok, false, 'ni sin comercializadoras');

  const conBorrador = activacion.comprobacionActivacion(activacion.estadoPorComercializadora({
    conjuntos: [IRIS_BORRADOR], comercializadoras: COMERCIALIZADORAS, hoy: HOY }));
  assert.equal(conBorrador.ok, false);
  assert.match(conBorrador.detalle, /Falta activar la tabla de: IRIS ENERGIA, S\.L\./);

  const activa = activacion.comprobacionActivacion(activacion.estadoPorComercializadora({
    conjuntos: [IRIS_ACTIVA], comercializadoras: COMERCIALIZADORAS, hoy: HOY }));
  assert.equal(activa.ok, true, 'las que siguen sin tabla se completan a mano: no impiden «listo»');
});

test('una política con tramos sin tipo de valor se avisa sin hablar de confirmar con nadie', () => {
  const filas = activacion.estadoPorComercializadora({
    comercializadoras: COMERCIALIZADORAS, hoy: HOY, conjuntos: [IRIS_ACTIVA],
    politicas: [{ id: 7, codigo: 'RET-IRIS', idComercializadora: 1, estado: 'BORRADOR', tramos: [{ tipoValor: 'SIN_CONFIRMAR' }] }],
  });
  const p = filas.find((f) => f.idComercializadora === 1).pendientes.find((x) => x.tipo === 'politica');
  assert.equal(p.texto, 'Retrocesión «RET-IRIS»: hay tramos sin tipo de valor; elija «Porcentaje» o «Importe (€)» para poder publicarla');
  assert.equal(p.etiquetaEnlace, 'Abrir la política');
});

test('el panel pinta una fila por comercializadora sin tabla con «Crear su tabla», y el resumen no habla de confirmar', async () => {
  const html = tpl(ADMIN);
  const bloque = html.match(/<div v-if="comercializadorasSinTabla\.length" class="estado-com-sin-tabla">[\s\S]*?\n {8}<\/div>/);
  assert.ok(bloque, 'falta el bloque de comercializadoras sin tabla');
  assert.match(bloque[0], /v-for="f in comercializadorasSinTabla"/);
  assert.match(bloque[0], /\{\{ f\.nombre \}\}/);
  assert.match(bloque[0], /\{\{ f\.texto \}\}/);
  assert.match(bloque[0], /@click="abrirPendiente\(f\.pendientes\[0\]\)"[^>]*>\s*<i class="fas fa-plus"><\/i>\s*<span>Crear su tabla<\/span>/);
  assert.doesNotMatch(html, /Pendiente de confirmar/);
  assert.match(html, /<span class="badge badge--warning">Pendiente<\/span>/);

  const ctx = configuracion();
  ctx.comercializadoras = COMERCIALIZADORAS;
  assert.equal(ctx.comercializadorasSinTabla.length, 3);
  assert.equal(ctx.comercializadorasConTabla.length, 0);
  assert.equal(ctx.resumenComercializadoras, 'Ninguna activa · 3 sin tabla');
  ctx.conjuntosReglas = [IRIS_BORRADOR];
  assert.equal(ctx.resumenComercializadoras, 'Ninguna activa · 1 pendiente de activar · 2 sin tabla · 1 aviso');
  ctx.conjuntosReglas = [IRIS_ACTIVA];
  assert.equal(ctx.resumenComercializadoras, '1 activa · 2 sin tabla');

  await ctx.abrirPendiente(ctx.comercializadorasSinTabla[0].pendientes[0]);
  assert.equal(ctx.modalConjunto, true);
  assert.equal(ctx.formConjunto.idComercializadora, ctx.comercializadorasSinTabla[0].idComercializadora,
    'el formulario de nueva tabla sale con esa comercializadora ya elegida');
});

test('sin comercializadoras, el panel manda a darlas de alta en Administración', () => {
  const html = tpl(ADMIN);
  assert.match(html, /<p v-if="!estadoComercializadoras\.length" class="estado-com-vacio">\s*Todavía no hay ninguna comercializadora: déla de alta en\s*<router-link to="\/dashboard\/administracion">Administración › Comercializadoras<\/router-link>\.\s*<\/p>/);
});

// ---------------------------------------------------------------------------
// 3 · Primeros pasos (Configuración MCAS sin ninguna tabla)
// ---------------------------------------------------------------------------

test('sin ninguna tabla se enseñan los primeros pasos con el botón para empezar', async () => {
  const html = tpl(ADMIN);
  const bloque = html.match(/<section v-if="mostrarPrimerosPasos" class="mcas-primeros-pasos"[\s\S]*?<\/section>/);
  assert.ok(bloque, 'falta el bloque de primeros pasos');
  assert.match(bloque[0], /<h3[^>]*>[\s\S]*Primeros pasos para calcular las comisiones[\s\S]*<\/h3>/);
  assert.match(bloque[0], /v-for="\(paso, i\) in primerosPasos"/);
  assert.match(bloque[0], /@click="abrirModalConjunto\(\)"[^>]*>\s*<i class="fas fa-plus"><\/i>\s*<span>Crear la primera tabla<\/span>/);
  assert.match(bloque[0], /to="\/dashboard\/administracion"/);

  const ctx = configuracion({ respuestas: { 'get /mcas/conjuntos-reglas': [] } });
  assert.equal(ctx.mostrarPrimerosPasos, false, 'antes de cargar no se sabe si hay tablas (sin parpadeo al entrar)');
  await ctx.cargarConjuntos();
  assert.deepEqual(ctx.primerosPasos.map((p) => p.titulo), [
    'Compruebe la comercializadora', 'Cree sus productos (si hacen falta)', 'Cree la tabla', 'Añada las reglas',
    'Pruébela con un contrato', 'Actívela', 'Encienda los interruptores',
  ]);
  for (const p of ctx.primerosPasos) assert.ok(p.texto.length > 20, p.titulo);
  assert.match(ctx.primerosPasos[0].texto, /Administración › Comercializadoras/);
  assert.match(ctx.primerosPasos[2].texto, /«Nueva tabla»/);
  assert.match(ctx.primerosPasos[4].texto, /«Probar con un contrato»/);
  assert.match(ctx.primerosPasos[5].texto, /«Activar»/);
  assert.match(ctx.primerosPasos[6].texto, /«Módulo» y «Precio fijo»/);

  assert.equal(ctx.mostrarPrimerosPasos, true);
  ctx.cargandoConjuntos = true;
  assert.equal(ctx.mostrarPrimerosPasos, false, 'mientras carga no se enseña');
  ctx.cargandoConjuntos = false;
  ctx.errorConjuntos = true;
  assert.equal(ctx.mostrarPrimerosPasos, false, 'si no se pudieron cargar, no se sabe si hay tablas');
  ctx.errorConjuntos = false;
  ctx.conjuntosReglas = [IRIS_BORRADOR];
  assert.equal(ctx.mostrarPrimerosPasos, false);
});

// ---------------------------------------------------------------------------
// 4 · Estados vacíos de las pestañas
// ---------------------------------------------------------------------------

test('cada pestaña vacía explica qué es y ofrece crear el primero', () => {
  const html = tpl(ADMIN);
  assert.match(html, /<p v-if="estadoVacio\.detalle" class="empty-state-detalle">\{\{ estadoVacio\.detalle \}\}<\/p>/);
  const ctx = configuracion();

  ctx.tabActivo = 'conjuntos';
  assert.deepEqual([ctx.estadoVacio.texto, ctx.estadoVacio.crear], ['Todavía no hay tablas de comisiones', 'Crear la primera tabla']);
  assert.match(ctx.estadoVacio.detalle, /reúne las reglas/);

  ctx.tabActivo = 'reglas';
  assert.deepEqual([ctx.estadoVacio.texto, ctx.estadoVacio.crear], ['Todavía no hay tablas de comisiones', 'Crear la primera tabla']);
  ctx.conjuntosReglas = [IRIS_BORRADOR];
  assert.equal(ctx.estadoVacio.texto, 'Seleccione una tabla de comisiones');
  ctx.conjuntoParaReglasId = 10;
  assert.deepEqual([ctx.estadoVacio.texto, ctx.estadoVacio.crear], ['Esta tabla todavía no tiene reglas', 'Crear la primera regla']);
  assert.match(ctx.estadoVacio.detalle, /A cada contrato le debe corresponder una sola regla/);
  ctx.conjuntosReglas = [IRIS_ACTIVA];
  assert.equal(ctx.estadoVacio.crear, null);
  assert.match(ctx.estadoVacio.detalle, /«Nueva versión»/);

  ctx.tabActivo = 'productos';
  assert.deepEqual([ctx.estadoVacio.texto, ctx.estadoVacio.crear], ['Todavía no hay productos', 'Crear el primer producto']);
  assert.match(ctx.estadoVacio.detalle, /Solo hacen falta si la comisión depende del producto/);

  ctx.tabActivo = 'retrocesiones';
  assert.deepEqual([ctx.estadoVacio.texto, ctx.estadoVacio.crear], ['Todavía no hay políticas de retrocesión', 'Crear la primera política']);
  assert.match(ctx.estadoVacio.detalle, /nunca se descuenta/);
});

test('el botón del estado vacío de Reglas sin tablas abre «Nueva tabla»', () => {
  const ctx = configuracion();
  ctx.tabActivo = 'reglas';
  ctx.crearEnTab();
  assert.equal(ctx.modalConjunto, true);
  assert.equal(ctx.modalRegla, false);
});

// ---------------------------------------------------------------------------
// 5 · Métodos de cálculo con nombres que entiende cualquiera
// ---------------------------------------------------------------------------

test('los métodos de cálculo se llaman como los entiende el administrador', () => {
  assert.deepEqual(reglas.NOMBRES_METODO, {
    FEE_PERCENTAGE: '% sobre el FEE', RATE_PER_MWH: '€ por MWh', FIXED_AMOUNT: 'Importe fijo',
    RANGE_LOOKUP: 'Tabla por tramos', MATRIX_LOOKUP: 'Tabla de dos datos', MULTI_DIMENSION_LOOKUP: 'Tabla de varios datos',
    COMPOSITE_SUM: 'Suma de varios cálculos', PERCENTAGE_OF_PREVIOUS: '% de lo anterior', MANUAL: 'A mano',
    NOT_COMMISSIONABLE: 'No comisionable',
  });
  const ctx = configuracion();
  for (const [metodo, nombre] of Object.entries(reglas.NOMBRES_METODO)) {
    if (metodo !== 'PERCENTAGE_OF_PREVIOUS') assert.equal(ctx.etiquetaMetodo(metodo), nombre);
  }
  const etiquetas = ctx.metodosCalculo.map((m) => m.label);
  assert.ok(etiquetas.every((l) => !/matriz|multidimensional|dimensi|líneas/i.test(l)), etiquetas.join(' | '));
  assert.equal(ctx.metodosCalculo[0].value, 'FIXED_AMOUNT', 'el más sencillo, primero');
});

test('la ayuda del FEE mínimo dice lo que hace el motor (revisión manual)', () => {
  const html = tpl(ADMIN);
  const ayuda = html.match(/FEE mínimo \(€\/MWh\)\s*<i class="fas fa-info-circle help-icon" title="([^"]+)"/);
  assert.ok(ayuda);
  assert.match(ayuda[1], /«Revisión manual»/);
  assert.doesNotMatch(ayuda[1], /Error de cálculo/);
});

// ---------------------------------------------------------------------------
// 6 · Crear desde cero sin escribir códigos internos
// ---------------------------------------------------------------------------

test('un producto nuevo no pide código: se genera a partir del nombre sin repetir otro', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.productos = [{ id: 1, idComercializadora: 1, codigo: 'PLAN_PERSONALIZADO', nombre: 'Plan Personalizado' }];
  ctx.abrirModalProducto();
  Object.assign(ctx.formProducto, { idComercializadora: 1, nombre: ' Plan Personalizado ' });
  assert.equal(ctx.codigoProductoPropuesto, 'PLAN_PERSONALIZADO_2');
  ctx.formProducto.idComercializadora = 2;
  assert.equal(ctx.codigoProductoPropuesto, 'PLAN_PERSONALIZADO', 'otra comercializadora puede usar el mismo');
  ctx.formProducto.nombre = 'Plan Ónline 15 %';
  assert.deepEqual(Object.keys(ctx.validarProducto()), []);
  await ctx.guardarProducto();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/productos-comerciales');
  assert.equal(post.datos.codigo, 'PLAN_ONLINE_15');
  assert.equal(post.datos.nombre, 'Plan Ónline 15 %');
  assert.match(tpl(ADMIN), /Código interno \(opcional; se genera solo\)[\s\S]{0,400}id="mcas-prod-codigo"/);
});

test('una política nueva no pide código: se genera con comercializadora, segmento, suministro y fecha', async () => {
  const peticiones = [];
  const ctx = configuracion({ peticiones });
  ctx.comercializadoras = [{ id: 5, nombre: 'IBERDROLA CLIENTES S.A.U.' }];
  ctx.politicasRetrocesion = [{ id: 1, codigo: 'RET-IBERDROLA-PYME-LUZ-20260101' }];
  ctx.abrirModalRetrocesion();
  Object.assign(ctx.formRetrocesion, { idComercializadora: 5, segmento: 'PYME', tipoSuministro: 'LUZ', vigenciaDesde: '2026-01-01' });
  Object.assign(ctx.formRetrocesion.tramos[0], { desde: 0, hasta: 90, valor: 100 });
  assert.equal(ctx.codigoPoliticaPropuesto, 'RET-IBERDROLA-PYME-LUZ-20260101-2');
  await ctx.guardarRetrocesion();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.ok(post, 'no se ha guardado');
  assert.equal(post.datos.codigo, 'RET-IBERDROLA-PYME-LUZ-20260101-2');
});

test('al crear una regla que busca el importe en una tabla se abre su rejilla', async () => {
  const nueva = { id: 77, codigo: 'R77', nombre: 'Endesa · pymes 3.0TD', metodoCalculo: 'MATRIX_LOOKUP' };
  const ctx = configuracion({ respuestas: {
    'post /mcas/conjuntos-reglas/10/reglas': nueva, 'get /mcas/conjuntos-reglas/10/reglas': [nueva],
  } });
  ctx.conjuntosReglas = [IRIS_BORRADOR];
  ctx.conjuntoParaReglasId = 10;
  ctx.abrirModalRegla();
  Object.assign(ctx.formRegla, { nombre: 'Endesa · pymes 3.0TD', metodoCalculo: 'MATRIX_LOOKUP' });
  await ctx.guardarRegla();
  assert.equal(ctx.modalMatriz, true);
  assert.equal(ctx.reglaMatriz.id, 77);
  assert.match(ctx.avisos.at(-1).text, /elija qué datos van en su tabla/);
});

test('«Probar con un contrato» enseña el nombre de la regla, no su código, y los datos en palabras', () => {
  const html = tpl(ADMIN);
  assert.match(html, /<span class="resumen-label">Regla aplicada<\/span>\s*<span class="resumen-valor"[^>]*>\{\{ nombreReglaSimulacion \}\}<\/span>/);
  const ctx = configuracion();
  ctx.reglasConjunto = [{ id: 3, codigo: 'IRIS_PYMES', nombre: 'Iris · pymes luz' }];
  ctx.simulacion.resultado = { resultado: 'CALCULADO', reglaAplicada: 'IRIS_PYMES', datosContrato: { tipoPrecio: 'FIJO', tipoSuministro: 'LUZ', segmento: 'PYME', ambito: 'FUERA' } };
  assert.equal(ctx.nombreReglaSimulacion, 'Iris · pymes luz');
  ctx.simulacion.resultado = { ...ctx.simulacion.resultado, nombreRegla: 'Nombre del servidor' };
  assert.equal(ctx.nombreReglaSimulacion, 'Nombre del servidor');
  const datos = Object.fromEntries(ctx.datosSimulacion.map((d) => [d.etiqueta, d.valor]));
  assert.equal(datos['Tipo de precio'], 'Fijo');
  assert.equal(datos['Tipo de suministro'], 'Luz');
  assert.equal(datos.Segmento, 'PYME');
  assert.equal(datos['Ámbito'], 'Fuera de ámbito');
});

// ---------------------------------------------------------------------------
// 7 · Rejilla: los productos se ven y se escriben por su nombre (nunca OFERTA_0)
// ---------------------------------------------------------------------------

const EDITOR = 'src/components/CRM_Module/MCAS/McasMatrizEditor.vue';
const PRODUCTOS = [{ codigo: 'PLAN_ESTABLE', nombre: 'Plan Estable' }, { codigo: 'PLAN_ONLINE', nombre: 'Plan Online' }];

async function editorConProductos(productos = PRODUCTOS) {
  const matriz = await importar('src/components/CRM_Module/MCAS/mcasMatriz.js');
  const linea = leer(EDITOR).match(/^import \{([^}]+)\} from '\.\/mcasMatriz'/m);
  const deps = Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, matriz[n]]));
  const componente = cargarComponente(EDITOR, {
    ...deps, axios: { get: async () => ({ data: {} }), put: async () => ({ data: {} }) },
    confirmar: async () => true, mostrarError: () => {}, mostrarExito: () => {}, textoError: (e, b) => b,
  });
  const ctx = crearContexto(componente, {
    regla: { id: 9, nombre: 'Iberdrola · fuera de ámbito', metodoCalculo: 'MULTI_DIMENSION_LOOKUP' }, editable: true, ordenResaltado: null, productos,
  });
  ctx.estructura = { filas: 'potencia_kw', columnas: 'codigo_producto', pestanas: 'zona_comision' };
  ctx.crearEstructura();
  return ctx;
}

test('en una tabla nueva las columnas de producto guardan el código y enseñan el nombre que se escribió', async () => {
  const ctx = await editorConProductos();
  ctx.nuevaColumnaTexto = 'plan online';
  ctx.nuevaColumnaTabla();
  assert.equal(ctx.errorCabecera, '');
  assert.deepEqual(ctx.rejilla.columnas.valores, ['PLAN_ONLINE'], 'el motor compara el código del producto del contrato');
  assert.equal(ctx.etiqueta(ctx.rejilla.columnas, 'PLAN_ONLINE'), 'Plan Online');
  ctx.nuevaPestana = 'ZBR';
  ctx.nuevaPestanaTabla();
  assert.equal(ctx.etiquetaDePestana(0), 'ZBR');

  ctx.nuevaColumnaTexto = 'Oferta 0';
  ctx.nuevaColumnaTabla();
  assert.match(ctx.errorCabecera, /No hay ningún producto «Oferta 0» en esta comercializadora/);
  assert.equal(ctx.listaDatos('codigo_producto'), 'mcas-matriz-productos');
  assert.equal(ctx.listaDatos('potencia_kw'), null);
  const html = tpl(EDITOR);
  assert.match(html, /<datalist id="mcas-matriz-productos">/);
  assert.match(html, /:value="etiqueta\(rejilla\.columnas, valor\)"/);

  const sinProductos = await editorConProductos([]);
  sinProductos.nuevaColumnaTexto = 'Plan Online';
  sinProductos.nuevaColumnaTabla();
  assert.match(sinProductos.errorCabecera, /créelos antes en la pestaña «Productos»/);
});

test('la rejilla en solo lectura se lee: cabeceras de fila y columna con color de texto propio', () => {
  const estilos = leer(EDITOR).split('<style scoped>')[1];
  assert.match(estilos, /\.matriz-tabla tbody th \{[^}]*color: var\(--text-primary\)/);
  assert.match(estilos, /\.matriz-tabla thead th \{[^}]*color: var\(--text-primary\)/);
  assert.match(tpl(ADMIN), /<McasMatrizEditor[\s\S]*?:productos="productosDelConjunto"/);
});

// ---------------------------------------------------------------------------
// 8 · Comisiones MCAS sin propuestas
// ---------------------------------------------------------------------------

test('Comisiones MCAS sin ninguna propuesta explica cuándo aparecerán', () => {
  const html = tpl('src/components/CRM_Module/MCAS/McasComponent.vue');
  const vacio = html.match(/<template v-else-if="!propuestas\.length">([\s\S]*?)<\/template>/);
  assert.ok(vacio, 'falta el estado vacío sin propuestas');
  assert.match(vacio[1], /<p>Todavía no hay propuestas de comisión<\/p>/);
  assert.match(vacio[1].replace(/\s+/g, ' '), /Aparecerán aquí al guardar un contrato con la pestaña «Comisión MCAS» rellena, cuando el interruptor «Módulo» esté encendido en Configuración MCAS\./);
  assert.match(vacio[1].replace(/\s+/g, ' '), /«Necesita atención» para completarla a mano/);
  // Sin ninguna propuesta manda este mensaje aunque haya un filtro puesto.
  assert.ok(html.indexOf('v-else-if="!propuestas.length"') < html.indexOf('v-else-if="hayFiltros"'));
});

// ---------------------------------------------------------------------------
// 9 · Sesión por cookie: el contador del menú se para al cerrar sesión
// ---------------------------------------------------------------------------

test('al cerrar sesión el contador de Comisiones MCAS deja de preguntar en el momento', async () => {
  const DASHBOARD = 'src/components/DashboardComponent.vue';
  const modulo = await importar('src/services/mcasPendientes.js');
  const sondeos = [];
  const peticiones = [];
  global.window = { innerWidth: 1366, addEventListener() {}, removeEventListener() {} };
  global.document = { addEventListener() {}, removeEventListener() {} };
  global.localStorage = {
    getItem: (clave) => (clave === 'usuario' ? JSON.stringify({ id: 1, nombre: 'Admin Demo', nivelAcceso: 1 }) : null),
    setItem() {}, removeItem() {},
  };
  const componente = cargarComponente(DASHBOARD, {
    NotificacionesComponent: {},
    tareasApi: { verificarModuloActivo: async () => false },
    textoPendientesMcas: modulo.textoPendientesMcas,
    axios: { post: async (url) => { peticiones.push(url); return {}; } },
    crearSondeoPendientes: () => {
      const sondeo = { detenido: 0, iniciar() {}, detener() { sondeo.detenido += 1; }, suscribir() { return () => {}; } };
      sondeos.push(sondeo);
      return sondeo;
    },
  });
  const rutas = [];
  const ctx = crearContexto(componente, { $route: { path: '/dashboard/mcas' }, $router: { push: (r) => rutas.push(r) } });
  await componente.created.call(ctx);
  ctx.cerrarSesion();
  assert.equal(sondeos[0].detenido, 1);
  assert.deepEqual(rutas, ['/']);
  assert.ok(peticiones.some((u) => /\/usuarios\/logout$/.test(u)));
  assert.doesNotThrow(() => componente.beforeUnmount.call(ctx), 'al desmontarse después no falla');
  // Las pantallas MCAS usan el axios global: cookie de sesión, X-Requested-With y 401 → login (main.js).
  const main = leer('src/main.js');
  assert.match(main, /config\.headers\['X-Requested-With'\] = 'XMLHttpRequest'/);
  assert.match(main, /error\?\.response\?\.status === 401[\s\S]{0,300}router\.push\('\/'\)/);
  for (const ruta of [ADMIN, 'src/components/CRM_Module/MCAS/McasComponent.vue', EDITOR]) {
    assert.doesNotMatch(leer(ruta), /fetch\(|XMLHttpRequest|withCredentials|X-Aura-Usuario/, ruta);
  }
});
