// Reunión del 04/11/2026 y respuesta del cliente a la duda 5: la provincia del punto es un
// desplegable y de ella sale la zona de comisión, con las zonas que cada comercializadora
// tiene en Configuración MCAS (pestaña «Zonas»).
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const PUNTO = 'src/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';
const CLIENTE = 'src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

let provincias;
let zonas;
let reglas;
let activacion;
let cobros;
test.before(async () => {
  provincias = await importar('src/utils/provincias.js');
  zonas = await importar('src/components/CRM_Module/MCAS/mcasZonas.js');
  reglas = await importar('src/components/CRM_Module/MCAS/mcasReglas.js');
  activacion = await importar('src/components/CRM_Module/MCAS/mcasActivacion.js');
  cobros = await importar('src/components/CRM_Module/MCAS/mcasCobros.js');
});

// ---------------------------------------------------------------------------
// src/utils/provincias.js
// ---------------------------------------------------------------------------

test('son las 52 provincias, con el código de su código postal y por orden alfabético', () => {
  assert.equal(provincias.PROVINCIAS.length, 52);
  assert.deepEqual([...provincias.PROVINCIAS.map((p) => p.codigo)].sort(),
    Array.from({ length: 52 }, (_, i) => String(i + 1).padStart(2, '0')));
  assert.equal(new Set(provincias.PROVINCIAS.map((p) => p.nombre)).size, 52);
  assert.deepEqual(provincias.PROVINCIAS.slice(0, 7).map((p) => p.nombre),
    ['A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila']);
  assert.equal(provincias.nombreProvincia('30'), 'Murcia');
  assert.equal(provincias.nombreProvincia('04'), 'Almería');
  assert.equal(provincias.nombreProvincia('99'), '99');
});

test('lo escrito a mano se reconoce sin mirar mayúsculas, tildes ni signos', () => {
  const casos = {
    MURCIA: 'Murcia', '  murcia ': 'Murcia', 'Región de Murcia': 'Murcia', almeria: 'Almería', 'ALMERÍA.': 'Almería',
    'Alicante/Alacant': 'Alicante', Vizcaya: 'Bizkaia', 'Guipúzcoa': 'Gipuzkoa', 'La Coruña': 'A Coruña',
    'Illes Balears': 'Baleares', 'S.C. Tenerife': 'Santa Cruz de Tenerife', 'ciudad  real': 'Ciudad Real',
  };
  for (const [escrito, lista] of Object.entries(casos)) assert.equal(provincias.provinciaDeLista(escrito), lista, escrito);
  for (const raro of [null, '', '   ', 'Mursia', 'Cuevas del Almanzora', '30']) {
    assert.equal(provincias.provinciaDeLista(raro), null, String(raro));
  }
  assert.equal(provincias.codigoProvincia('valència'), '46');
});

test('el desplegable ofrece las 52 y conserva, marcado, lo guardado que no se reconoce', () => {
  assert.equal(provincias.opcionesProvincia('Murcia').length, 52);
  assert.equal(provincias.opcionesProvincia('MURCIA').length, 52, 'lo que se reconoce no añade opción');
  assert.equal(provincias.opcionesProvincia('').length, 52);
  const conRara = provincias.opcionesProvincia(' Mursia ');
  assert.equal(conRara.length, 53);
  assert.deepEqual(conRara[0], { valor: 'Mursia', etiqueta: 'Mursia (no está en la lista)', fueraDeLista: true });
});

// ---------------------------------------------------------------------------
// Punto de suministro y cliente: la provincia se elige
// ---------------------------------------------------------------------------

test('la provincia del punto y la del cliente son un desplegable, no un texto libre', () => {
  for (const [ruta, modelo] of [[PUNTO, 'puntoLocal'], [CLIENTE, 'clienteLocal']]) {
    const html = plantilla(ruta);
    assert.match(html, new RegExp(`<select id="provincia" v-model="${modelo}\\.provincia"[\\s\\S]{0,260}<option value="">Seleccionar\\.\\.\\.</option>\\s*<option v-for="p in opcionesProvincia" :key="p\\.valor" :value="p\\.valor">`), ruta);
    assert.doesNotMatch(html, /<input[^>]*id="provincia"/, ruta);
  }
});

test('punto: al abrirlo, lo que se reconoce sale ya con el nombre de la lista, y lo que no, hay que elegirlo', async () => {
  const componente = cargarComponente(PUNTO, { axios: {} });
  const ctx = crearContexto(componente);
  const fuente = leer(PUNTO);
  assert.match(fuente, /provincia: provinciaDeLista\(newVal\.provincia\) \|\| String\(newVal\.provincia \|\| ''\)\.trim\(\),/);
  assert.match(fuente, /else if \(!provinciaDeLista\(this\.puntoLocal\.provincia\)\) \{\s*this\.errores\.provincia = 'Elija la provincia de la lista';/);

  ctx.puntoLocal = { provincia: 'Mursia' };
  assert.equal(ctx.opcionesProvincia.length, 53);
  assert.equal(ctx.opcionesProvincia[0].etiqueta, 'Mursia (no está en la lista)');
  ctx.puntoLocal = { provincia: 'Murcia' };
  assert.equal(ctx.opcionesProvincia.length, 52);
});

test('cliente: lo que se reconoce se normaliza al abrir y una provincia que no es de la lista no deja guardar', () => {
  const componente = cargarComponente(CLIENTE, {});
  const cliente = {
    id: 9, nombre: 'ACME', grupoEmpresarial: 'G', cif: 'B1', direccion: 'C', poblacion: 'P', provincia: 'MURCIA',
    codigoPostal: '30001', iban: 'ES', codigoSector: 1, codigoSubtipologia: 1, idUsuario: 4,
  };
  const ctx = crearContexto(componente, { clienteLocal: { ...cliente } });
  Object.defineProperty(ctx, 'isAdvancedUser', { get: () => false });
  assert.equal(ctx.conProvinciaDeLista({ provincia: 'MURCIA' }).provincia, 'Murcia');
  assert.equal(ctx.conProvinciaDeLista({ provincia: ' Mursia ' }).provincia, 'Mursia');
  assert.equal(ctx.validarFormulario(), true, 'MURCIA es Murcia');

  const rara = crearContexto(componente, { clienteLocal: { ...cliente, provincia: 'Mursia' } });
  Object.defineProperty(rara, 'isAdvancedUser', { get: () => false });
  assert.equal(rara.validarFormulario(), false);
  assert.equal(rara.errores.provincia, 'Elija la provincia de la lista');
});

// ---------------------------------------------------------------------------
// mcasZonas.js
// ---------------------------------------------------------------------------

const ZAR = { id: 1, idComercializadora: 5, zona: 'ZAR', esResto: false, provincias: ['30', '03', '46'] };
const ZBR = { id: 2, idComercializadora: 5, zona: 'ZBR', esResto: true, provincias: [] };

test('las provincias de una zona se leen en palabras', () => {
  const nombre = provincias.nombreProvincia;
  assert.equal(zonas.textoProvinciasZona(ZAR, nombre), 'Alicante, Murcia y Valencia');
  assert.equal(zonas.textoProvinciasZona(ZBR, nombre), 'Todas las demás provincias');
  assert.equal(zonas.textoProvinciasZona({ provincias: ['30'] }, nombre), 'Murcia');
  assert.equal(zonas.textoProvinciasZona({ provincias: [] }, nombre), 'Sin provincias');
  const muchas = { provincias: ['01', '02', '03', '04', '05', '06', '08', '09'] };
  assert.equal(zonas.textoProvinciasZona(muchas, nombre), 'Álava, Albacete, Alicante, Almería, Ávila y 3 más');
});

test('el formulario de zonas se valida con sus palabras: sin repetir zona, provincia ni zona del resto', () => {
  const existentes = [ZAR, ZBR];
  assert.deepEqual(zonas.validarZona(zonas.zonaVacia(), existentes), {
    idComercializadora: 'Elija la comercializadora.',
    zona: 'Escriba el nombre de la zona (por ejemplo, ZAR).',
    provincias: 'Marque las provincias de la zona, o «Son todas las demás provincias».',
  });
  assert.deepEqual(zonas.validarZona({ idComercializadora: 5, zona: 'zar', provincias: ['04'] }, existentes),
    { zona: 'Esa comercializadora ya tiene la zona ZAR: edítela en vez de crear otra.' });
  assert.deepEqual(zonas.validarZona({ idComercializadora: 5, zona: 'OTRA', esResto: true, provincias: [] }, existentes),
    { provincias: 'Las demás provincias ya son la zona ZBR: solo una zona puede tenerlas.' });
  assert.deepEqual(zonas.validarZona({ idComercializadora: 5, zona: 'UNA ZONA CON NOMBRE LARGO', provincias: ['04'] }, existentes),
    { zona: 'Como mucho 20 caracteres.' });
  // Editar la propia zona, u otra comercializadora, no choca
  assert.deepEqual(zonas.validarZona({ ...ZAR, provincias: ['30'] }, existentes), {});
  assert.deepEqual(zonas.validarZona({ idComercializadora: 6, zona: 'ZAR', provincias: ['30'] }, existentes), {});

  // Las provincias de las otras zonas de la comercializadora salen ocupadas (no se pueden marcar dos veces)
  assert.deepEqual(zonas.provinciasOcupadas({ idComercializadora: 5, zona: 'ZCR' }, existentes), { 30: 'ZAR', '03': 'ZAR', 46: 'ZAR' });
  assert.deepEqual(zonas.provinciasOcupadas(ZAR, existentes), {});
  assert.deepEqual(zonas.provinciasOcupadas({ idComercializadora: 6 }, existentes), {});
});

test('lo que se guarda va en mayúsculas, ordenado y sin provincias si es la zona del resto', () => {
  assert.deepEqual(zonas.zonaAPayload({ idComercializadora: '5', zona: ' zar ', esResto: false, provincias: ['46', '03', '46'] }),
    { idComercializadora: 5, zona: 'ZAR', esResto: false, provincias: ['03', '46'] });
  assert.deepEqual(zonas.zonaAPayload({ idComercializadora: 5, zona: 'zbr', esResto: true, provincias: ['30'] }),
    { idComercializadora: 5, zona: 'ZBR', esResto: true, provincias: [] });
});

test('las reglas eligen entre las zonas de su comercializadora, o las del CUPS si no tiene', () => {
  assert.deepEqual(zonas.zonasDeComercializadora([ZAR, ZBR], 5), ['ZAR', 'ZBR']);
  assert.deepEqual(zonas.zonasDeComercializadora([{ ...ZAR, zona: 'NORTE' }], 5), ['NORTE']);
  assert.deepEqual(zonas.zonasDeComercializadora([ZAR, ZBR], 6), ['ZAR', 'ZBR'], 'sin zonas: las del CUPS de la hoja de Iberdrola');
  assert.deepEqual(zonas.comercializadorasSinResto([ZAR, ZBR]), []);
  assert.deepEqual(zonas.comercializadorasSinResto([ZAR, { ...ZAR, id: 3, idComercializadora: 6 }]), [5, 6]);
});

// ---------------------------------------------------------------------------
// Pestaña «Zonas» de Configuración MCAS
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
    ...importadoDe('mcasZonas', zonas),
    axios: { get: responder('get'), post: responder('post'), put: responder('put'), delete: responder('delete') },
    confirmar: async () => true,
    mostrarError: (swal, title, text) => swal.fire({ icon: 'error', title, text }),
    mostrarExito: (swal, title, text) => swal.fire({ icon: 'success', title, text }),
    mostrarAviso: (swal, title, text) => swal.fire({ icon: 'warning', title, text }),
    textoError: (e, base) => base,
  });
  const ctx = crearContexto(componente);
  ctx.comercializadoras = [{ id: 5, nombre: 'IBERDROLA' }, { id: 6, nombre: 'ENDESA' }];
  ctx.gestoras = [];
  return ctx;
}

test('la pestaña «Zonas» va detrás de Cobros con su tabla, su botón y su modal', () => {
  const ctx = configuracion();
  assert.deepEqual(ctx.tabs.map((t) => t.id), ['conjuntos', 'reglas', 'productos', 'cobros', 'zonas', 'retrocesiones']);
  ctx.tabActivo = 'zonas';
  assert.deepEqual(ctx.columnasActivas.map((c) => c.label), ['Comercializadora', 'Zona', 'Provincias']);
  assert.equal(ctx.estadoVacio.texto, 'Todavía no hay zonas de comisión');
  assert.match(ctx.estadoVacio.detalle, /^Solo para Iberdrola\. Cree la ZAR marcando sus provincias, y la ZBR con «Son todas las demás provincias»\.$/);
  const html = plantilla(ADMIN);
  assert.match(html, /v-if="tabActivo === 'zonas'" class="btn btn-primary" @click="abrirModalZona\(\)"/);
  assert.match(html, /<div v-if="modalZona" class="mcas-modal-overlay"/);
  assert.match(html, /<strong>Solo para Iberdrola\.<\/strong> Marque qué provincias son de cada zona \(ZAR y ZBR\):/);
  assert.doesNotMatch(html, /ES0021 es ZAR/);
  // Las 52 provincias a marcar y la casilla de la zona del resto
  assert.match(html, /<label v-for="p in provinciasFormZona" :key="p\.codigo" class="zona-provincia"/);
  assert.match(html, /<input id="mcas-zona-resto" v-model="formZona\.esResto" type="checkbox">/);
});

test('crear una zona: se marcan provincias, las de otra zona no se dejan y se guarda lo justo', async () => {
  const peticiones = [];
  const ctx = configuracion(peticiones, { 'get /mcas/zonas': [ZAR], 'post /mcas/zonas': { zona: { id: 9 }, pendientes: 0 } });
  await ctx.cargarZonas();
  assert.equal(ctx.contadorTab('zonas'), 1);

  ctx.abrirModalZona();
  assert.equal(ctx.modalZona, true);
  Object.assign(ctx.formZona, { idComercializadora: 5, zona: 'zcr' });
  assert.equal(ctx.provinciasFormZona.length, 52);
  assert.equal(ctx.provinciasFormZona.find((p) => p.codigo === '30').ocupadaPor, 'ZAR');
  assert.equal(ctx.provinciasFormZona.find((p) => p.codigo === '04').ocupadaPor, null);
  assert.equal(ctx.resumenFormZona, 'Ninguna provincia marcada.');
  ctx.alternarProvinciaZona('18');
  ctx.alternarProvinciaZona('04');
  ctx.alternarProvinciaZona('23');
  ctx.alternarProvinciaZona('23');
  assert.deepEqual(ctx.formZona.provincias, ['04', '18']);
  assert.equal(ctx.resumenFormZona, '2 provincias marcadas: Almería y Granada.');

  await ctx.guardarZona();
  const post = peticiones.find((p) => p.metodo === 'post');
  assert.equal(post.url, '/mcas/zonas');
  assert.deepEqual(post.datos, { idComercializadora: 5, zona: 'ZCR', esResto: false, provincias: ['04', '18'] });
  assert.equal(ctx.modalZona, false);
  assert.equal(ctx.avisos[ctx.avisos.length - 1].icon, 'success');
});

test('sin zona del resto se avisa, y cambiar zonas con comisiones pendientes dice que se recalculen', async () => {
  const peticiones = [];
  const ctx = configuracion(peticiones, { 'put /mcas/zonas/1': { zona: ZAR, pendientes: 2 }, 'delete /mcas/zonas/2': { ok: true, pendientes: 1 } });
  ctx.zonas = [ZAR];
  assert.equal(ctx.avisoZonasSinResto, 'IBERDROLA: hay provincias sin zona. Marque «Son todas las demás provincias» en una de sus zonas, '
    + 'o los contratos de esas provincias no se podrán calcular.');
  ctx.zonas = [ZAR, ZBR];
  assert.equal(ctx.avisoZonasSinResto, '');

  ctx.abrirModalZona(ZAR);
  assert.deepEqual(ctx.formZona.provincias, ['30', '03', '46']);
  await ctx.guardarZona();
  const aviso = ctx.avisos[ctx.avisos.length - 1];
  assert.equal(aviso.icon, 'warning');
  assert.match(aviso.text, /Hay 2 comisiones pendientes de aprobar calculadas antes del cambio: recalcúlelas en Comisiones MCAS si les afecta la zona\./);

  await ctx.eliminarZona(ZBR);
  assert.ok(peticiones.some((p) => p.metodo === 'delete' && p.url === '/mcas/zonas/2'));
  assert.match(ctx.avisos[ctx.avisos.length - 1].text, /Hay 1 comisión pendiente de aprobar calculada antes del cambio: recalcúlela en Comisiones MCAS si le afecta la zona\./);
});

test('en una regla, la zona se elige entre las de la comercializadora de su tabla', () => {
  const ctx = configuracion();
  ctx.zonas = [ZAR, ZBR, { id: 7, idComercializadora: 6, zona: 'NORTE', esResto: true, provincias: [] }];
  Object.defineProperty(ctx, 'conjuntoParaReglas', { get: () => ({ id: 1, idComercializadora: 5 }), configurable: true });
  assert.deepEqual(ctx.opcionesZonaRegla, ['ZAR', 'ZBR']);
  ctx.editorRegla.condiciones.zona_comision = 'ANTIGUA';
  assert.deepEqual(ctx.opcionesZonaRegla, ['ZAR', 'ZBR', 'ANTIGUA'], 'la que ya tuviera la regla no se pierde');

  const html = plantilla(ADMIN);
  assert.match(html, /<select id="mcas-cond-zona" v-model="editorRegla\.condiciones\.zona_comision" class="mcas-input">\s*<option value="">Cualquiera<\/option>\s*<option v-for="z in opcionesZonaRegla"/);
  // El ámbito (dentro/fuera) era lo mismo que la zona: fuera de las reglas
  assert.equal(reglas.OPCIONES_CONDICION.ambito, undefined);
  assert.ok(!('ambito' in reglas.condicionesVacias()));
});

// ---------------------------------------------------------------------------
// El Planificador (página aparte) guarda con la cabecera que exige el backend de la intranet
// ---------------------------------------------------------------------------

test('la página del Planificador envía X-Requested-With en todas sus peticiones', () => {
  const principal = leer('src/planificador/main.js');
  assert.match(principal, /axios\.interceptors\.request\.use\(config => \{[\s\S]{0,400}config\.headers\['X-Requested-With'\] = 'XMLHttpRequest'/);
});
