// Campo de fecha con calendario (components/comun/CampoFecha.vue) y fechas del contrato (04/11/2026).
process.env.TZ = process.env.TZ || 'Europe/Madrid';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const F = require(path.join(raiz, 'src/utils/fechas.js'));
const MODAL_CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const CAMPO_FECHA = 'src/components/comun/CampoFecha.vue';
const HOY = new Date(2026, 9, 21);

let camposContrato;
test.before(async () => {
  camposContrato = await import(pathToFileURL(path.join(raiz, 'src/components/CRM_Module/PuntosSuministro/mcasCamposContrato.js')).href);
});
global.localStorage = { getItem: (clave) => (clave === 'usuario' ? JSON.stringify({ id: 1, nombre: 'Admin', nivelAcceso: 1 }) : null), setItem() {}, removeItem() {} };

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

test('lo que se escribe a mano se entiende con barras, guiones, puntos o solo números', () => {
  const casos = {
    '15/10/2026': '2026-10-15', '15-10-26': '2026-10-15', '15.10.2026': '2026-10-15', '15 10 2026': '2026-10-15',
    '15102026': '2026-10-15', '151026': '2026-10-15', '15/10': '2026-10-15', '1510': '2026-10-15',
    '2026-10-15': '2026-10-15', '1/5/26': '2026-05-01', ' 01/12/2026 ': '2026-12-01',
  };
  for (const [texto, esperado] of Object.entries(casos)) {
    assert.equal(F.fechaLocalISO(F.interpretarFechaEscrita(texto, HOY)), esperado, texto);
  }
  for (const texto of ['', '   ', 'abc', '31/02/2026', '32/13', '15/10/202', '29/02/2027', '1/2/3/4', '15/10/2026x']) {
    assert.equal(F.interpretarFechaEscrita(texto, HOY), null, texto);
  }
});

test('periodos: último día a N meses, duración en palabras y meses justos', () => {
  assert.equal(F.finDePeriodo('2026-11-01', 12), '2027-10-31');
  assert.equal(F.finDePeriodo('2028-02-29', 12), '2029-02-28');
  assert.equal(F.finDePeriodo('2026-10-15', 36), '2029-10-14');
  assert.equal(F.finDePeriodo('', 12), '');

  assert.equal(F.textoDuracion('2026-11-01', '2027-10-31'), '1 año');
  assert.equal(F.textoDuracion('2026-11-01', '2028-10-31'), '2 años');
  assert.equal(F.textoDuracion('2026-11-01', '2027-05-14'), '6 meses y 14 días');
  assert.equal(F.textoDuracion('2026-11-01', '2028-05-01'), '1 año, 6 meses y 1 día');
  assert.equal(F.textoDuracion('2026-11-01', '2026-11-01'), '1 día');
  assert.equal(F.textoDuracion('2026-11-01', '2026-10-31'), '');
  assert.equal(F.textoDuracion('', '2026-10-31'), '');

  assert.equal(F.mesesExactos('2026-11-01', '2027-10-31'), 12);
  assert.equal(F.mesesExactos('2026-10-01', '2027-10-31'), 13);
  assert.equal(F.mesesExactos('2026-11-01', '2027-05-14'), null);
  assert.equal(F.primeroDelMesSiguiente(HOY), '2026-11-01');
  assert.equal(F.primeroDelMesSiguiente(new Date(2026, 11, 5)), '2027-01-01');
  assert.equal(F.sumarDias('2027-10-31', 1), '2027-11-01');
});

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

function campoFecha(props = {}) {
  const componente = cargarComponente(CAMPO_FECHA, { VueDatePicker: {}, es: {} });
  const ctx = crearContexto(componente, { modelValue: '', min: '', max: '', atajos: [], hoy: true, required: false, ...props });
  componente.created.call(ctx);
  return ctx;
}

test('el campo devuelve AAAA-MM-DD y solo avisa de cambios de verdad', () => {
  const ctx = campoFecha({ modelValue: '2026-10-15' });
  ctx.cambiar('2026-10-15');
  assert.deepEqual(ctx.emitidos, []);
  ctx.cambiar('2026-11-01');
  assert.deepEqual(ctx.emitidos, [['update:modelValue', '2026-11-01'], ['change', '2026-11-01']]);
  ctx.modelValue = '2026-11-01';
  ctx.cambiar(null);
  assert.deepEqual(ctx.emitidos.slice(2), [['update:modelValue', ''], ['change', '']]);
});

test('lo que no es una fecha, o se sale de lo permitido, se avisa y se va solo', () => {
  const ctx = campoFecha({ modelValue: '2026-10-15', min: '2026-11-01' });
  ctx.alEscribir({ target: { value: '32/13' } });
  ctx.alSalir();
  assert.equal(ctx.aviso, '«32/13» no es una fecha; se queda el 15/10/2026.');
  clearTimeout(ctx.temporizadorAviso);

  const vacio = campoFecha();
  vacio.alEscribir('abc');
  vacio.alSalir();
  assert.equal(vacio.aviso, '«abc» no es una fecha. Escríbala así: 15/10/2026.');
  clearTimeout(vacio.temporizadorAviso);

  ctx.fueraDeRango(new Date(2026, 0, 1));
  assert.equal(ctx.aviso, 'No puede ser anterior al 01/11/2026.');
  clearTimeout(ctx.temporizadorAviso);

  // Una fecha buena escrita no deja aviso al salir
  ctx.aviso = '';
  ctx.alEscribir('01/12/2026');
  ctx.alSalir();
  assert.equal(ctx.aviso, '');
});

test('«Hoy» va primero en los atajos salvo que se quite, y Esc con el calendario abierto no cierra la ventana', () => {
  const ctx = campoFecha({ atajos: [{ etiqueta: '1 año', valor: '2027-10-31' }] });
  assert.deepEqual(ctx.atajosVisibles.map((a) => a.etiqueta), ['Hoy', '1 año']);
  assert.deepEqual(campoFecha({ hoy: false, atajos: [] }).atajosVisibles, []);
  // Fuera de lo permitido no se enseñan, y el calendario vacío abre en el primer mes elegible
  const futuro = campoFecha({ min: '2099-01-01', atajos: [{ etiqueta: '1 año', valor: '2098-12-31' }, { etiqueta: '2 años', valor: '2099-12-31' }] });
  assert.deepEqual(futuro.atajosVisibles.map((a) => a.etiqueta), ['2 años']);
  assert.equal(futuro.mesInicial, '2099-01-01');
  assert.equal(campoFecha({ abrirEn: '2027-10-31', min: '2099-01-01' }).mesInicial, '2027-10-31');
  assert.equal(campoFecha({ modelValue: '2026-10-15', min: '2099-01-01' }).mesInicial, undefined);

  const escuchas = [];
  global.window = { addEventListener: (...a) => escuchas.push(['+', ...a]), removeEventListener: (...a) => escuchas.push(['-', ...a]) };
  let cerrado = 0;
  ctx.$refs.selector = { closeMenu: () => { cerrado += 1; } };
  ctx.alAbrir();
  const evento = { key: 'Escape', prevenido: false, parado: false, preventDefault() { this.prevenido = true; }, stopPropagation() { this.parado = true; } };
  ctx.escapeSoloCierraCalendario(evento);
  // Se cierra el calendario y la tecla no sigue (ni al modal de debajo ni a un SweetAlert)
  assert.deepEqual([evento.prevenido, evento.parado, cerrado], [true, true, 1]);
  const otra = { key: 'Enter', preventDefault() { throw new Error('no'); }, stopPropagation() { throw new Error('no'); } };
  ctx.escapeSoloCierraCalendario(otra);
  assert.equal(cerrado, 1);
  ctx.alCerrar();
  assert.deepEqual(escuchas.map(([signo, tipo, , captura]) => [signo, tipo, captura]), [['+', 'keydown', true], ['-', 'keydown', true]]);
  delete global.window;
});

// ---------------------------------------------------------------------------
// Contrato
// ---------------------------------------------------------------------------

function modalContratos() {
  const linea = leer(MODAL_CONTRATOS).match(/^import \{([^}]+)\} from ['"]\.\/mcasCamposContrato['"];?$/m);
  const campos = Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, camposContrato[n]]));
  const componente = cargarComponente(MODAL_CONTRATOS, {
    ...campos,
    axios: { get: async () => ({ data: [] }), post: async () => ({ data: { id: 500 } }), put: async () => ({ data: { id: 500 } }) },
  });
  return crearContexto(componente, {
    cliente: { id: 3, nombre: 'Cliente Demo', cif: 'B12345678' },
    puntoSuministro: { id: 9, cupsluz: 'ES0021000011111111AB0F' },
    comercializadoras: [{ id: 14, nombre: 'IRIS ENERGIA, S.L.' }],
    tarifasGas: [{ id: 1, nombre: 'Sin Tarifa' }],
    tarifasLuz: [{ id: 2, nombre: 'Sin Tarifa' }],
    contratos: [], contratoActual: null, contratosHistoricos: [],
  });
}
/** Lo que hace la pantalla al cambiar una fecha: v-model y después @change. */
function ponerInicio(ctx, valor) { ctx.nuevoContrato.fechaInicio = valor; ctx.alCambiarInicioContrato(valor); }
function ponerFin(ctx, valor) { ctx.nuevoContrato.fechaFin = valor; ctx.alCambiarFinContrato(valor); }

const CONTRATO = {
  id: 77, contrato: 'CT-2025-0077', fechaEnvio: '2025-01-01', fechaInicio: '2025-01-15', fechaFin: '2026-01-14',
  idComercializadoraActual: 14, idTarifaLuz: 2, idTarifaGas: 1, consumoAnual: 7000, idCliente: 3, idPuntoSuministro: 9,
};

test('al poner el inicio, la fecha fin sale a un año y le sigue mientras nadie la cambie', async () => {
  const ctx = modalContratos();
  await ctx.crearNuevoContrato();
  ponerInicio(ctx, '2026-11-01');
  assert.equal(ctx.nuevoContrato.fechaFin, '2027-10-31');
  assert.equal(ctx.duracionContrato, '1 año');
  assert.deepEqual(ctx.atajosFinContrato.map((a) => [a.etiqueta, a.valor, a.detalle]),
    [['1 año', '2027-10-31', '31/10/2027'], ['2 años', '2028-10-31', '31/10/2028'], ['3 años', '2029-10-31', '31/10/2029']]);

  // Con el atajo «2 años», al mover el inicio se mantienen los dos años
  ponerFin(ctx, '2028-10-31');
  ponerInicio(ctx, '2026-12-01');
  assert.equal(ctx.nuevoContrato.fechaFin, '2028-11-30');

  // Puesta a mano, ya no se mueve
  ponerFin(ctx, '2027-06-15');
  ponerInicio(ctx, '2027-01-01');
  assert.equal(ctx.nuevoContrato.fechaFin, '2027-06-15');
  assert.equal(ctx.duracionContrato, '5 meses y 15 días');
});

test('si se borra el inicio, se borra la fecha fin que puso la aplicación', async () => {
  const ctx = modalContratos();
  await ctx.crearNuevoContrato();
  ponerInicio(ctx, '2026-11-01');
  ponerInicio(ctx, '');
  assert.equal(ctx.nuevoContrato.fechaFin, '');
  assert.deepEqual(ctx.atajosFinContrato, []);
});

test('la fecha fin de un contrato que se edita no se mueve sola, aunque coincida con una propuesta anterior', async () => {
  const ctx = modalContratos();
  await ctx.crearNuevoContrato();
  ponerInicio(ctx, '2026-11-01'); // propone 31/10/2027
  await ctx.editarContratoGenerico({ ...CONTRATO, fechaInicio: '2026-11-01', fechaFin: '2027-10-31' });
  ponerInicio(ctx, '2026-12-01');
  assert.equal(ctx.nuevoContrato.fechaFin, '2027-10-31');
});

test('fin anterior al inicio: se avisa en el momento, sin esperar a guardar', async () => {
  const ctx = modalContratos();
  await ctx.crearNuevoContrato();
  ponerFin(ctx, '2026-12-31');
  ponerInicio(ctx, '2027-03-01');
  assert.equal(ctx.errores.fechaFin, 'La fecha de fin no puede ser anterior a la fecha de inicio');
  ponerFin(ctx, '2028-02-29');
  assert.equal(ctx.errores.fechaFin, '');
});

test('al renovar, el nuevo contrato empieza al día siguiente de acabar el anterior y dura lo mismo', async () => {
  const ctx = modalContratos();
  await ctx.renovarContratoGenerico(CONTRATO);
  assert.equal(ctx.nuevoContrato.fechaInicio, '2026-01-15');
  assert.equal(ctx.nuevoContrato.fechaFin, '2027-01-14');
  // Y si se cambia el inicio, la fin le sigue
  ponerInicio(ctx, '2026-02-01');
  assert.equal(ctx.nuevoContrato.fechaFin, '2027-01-31');

  // Si el anterior no eran meses justos, un año
  const raro = modalContratos();
  await raro.renovarContratoGenerico({ ...CONTRATO, fechaInicio: '2025-01-15', fechaFin: '2025-12-20' });
  assert.equal(raro.nuevoContrato.fechaInicio, '2025-12-21');
  assert.equal(raro.nuevoContrato.fechaFin, '2026-12-20');
});

test('el contrato usa el campo de fecha nuevo en sus cuatro fechas (ya no el del navegador)', () => {
  const html = plantilla(MODAL_CONTRATOS);
  assert.doesNotMatch(html, /type="date"/);
  for (const id of ['fechaEnvioContrato', 'fechaInicioContrato', 'fechaFinContrato', 'fechaDenunciaContrato']) {
    assert.match(html, new RegExp(`<CampoFecha id="${id}"`), id);
  }
});

// ---------------------------------------------------------------------------
// Resto de pantallas (04/11/2026)
// ---------------------------------------------------------------------------

test('atajos comunes: los pone la persona y dicen qué fecha ponen', () => {
  assert.deepEqual(F.atajoPrimeroDelMes(HOY), { etiqueta: '1 del mes que viene', detalle: '01/11/2026', valor: '2026-11-01' });
  assert.deepEqual(F.atajoPrimeroDeEnero(HOY), { etiqueta: '1 de enero', detalle: '01/01/2027', valor: '2027-01-01' });
  assert.deepEqual(F.atajoFinDeAnio('2027-03-01'), { etiqueta: '31 de diciembre', detalle: '31/12/2027', valor: '2027-12-31' });
  assert.equal(F.atajoFinDeAnio(''), null);
  assert.deepEqual(F.atajoDentroDe(1, 'Mañana', HOY), { etiqueta: 'Mañana', detalle: '22/10/2026', valor: '2026-10-22' });
  assert.deepEqual(F.atajoDentroDe(7, 'En una semana', new Date(2026, 11, 28)).valor, '2027-01-04');
  assert.deepEqual(F.atajosDuracion('2026-11-01').map((a) => [a.etiqueta, a.valor]),
    [['1 año', '2027-10-31'], ['2 años', '2028-10-31'], ['3 años', '2029-10-31']]);
  assert.deepEqual(F.atajosDuracion(''), []);
});

test('ninguna pantalla usa ya el selector de fecha del navegador', () => {
  const fs = require('node:fs');
  const vues = [];
  const recorrer = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta);
    else if (e.name.endsWith('.vue')) vues.push(ruta);
  });
  recorrer(path.join(raiz, 'src'));
  const conNativo = vues.filter((ruta) => !ruta.endsWith('CampoFecha.vue') && /type="date"/.test(fs.readFileSync(ruta, 'utf8')))
    .map((ruta) => path.relative(raiz, ruta));
  assert.deepEqual(conNativo, []);
});

test('servicio: fin anterior al inicio se avisa al momento y el aviso se va al corregirlo', () => {
  const componente = cargarComponente('src/components/CRM_Module/PuntosSuministro/ModalServicios.vue', {
    axios: { get: async () => ({ data: [] }) },
  });
  const ctx = crearContexto(componente, { puntoSuministro: { id: 9 }, cliente: { id: 3 } });
  ctx.nuevoServicio = { fechaInicioServicio: '2026-11-01', fechaFinServicio: '2026-10-01' };
  ctx.errores = {};
  ctx.alCambiarFechaServicio('fechaFinServicio');
  assert.equal(ctx.errores.fechaFinServicio, 'La fecha de fin no puede ser anterior a la fecha de inicio');
  ctx.nuevoServicio.fechaInicioServicio = '2026-09-01';
  ctx.alCambiarFechaServicio('fechaInicioServicio');
  assert.equal(ctx.errores.fechaFinServicio, '');
  assert.deepEqual(ctx.atajosFinServicio.map((a) => a.valor), ['2027-08-31', '2028-08-31', '2029-08-31']);
  assert.deepEqual(ctx.marcasFinServicio, [{ fecha: '2026-09-01', texto: 'Inicio del servicio' }]);
});

test('MCAS: la nueva versión no deja elegir días hasta el inicio de la actual', async () => {
  const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
  const modulo = async (nombre) => {
    const exportaciones = await import(pathToFileURL(path.join(raiz, `src/components/CRM_Module/MCAS/${nombre}.js`)).href);
    const linea = leer(ADMIN).match(new RegExp(String.raw`^import \{([^}]+)\} from '\./` + nombre + "'", 'm'));
    return Object.fromEntries(linea[1].split(',').map((x) => x.trim()).filter(Boolean).map((x) => [x, exportaciones[x]]));
  };
  const componente = cargarComponente(ADMIN, { ...(await modulo('mcasReglas')), ...(await modulo('mcasActivacion')) });
  const ctx = crearContexto(componente, {});
  Object.defineProperty(ctx, 'conjuntoNuevaVersion', { value: { vigenciaDesde: '2026-03-09' }, configurable: true });
  assert.equal(ctx.minimoNuevaVersion, '2026-03-10');
  assert.deepEqual(ctx.atajosHastaMcas('2026-03-09').map((a) => a.valor), ['2026-12-31']);
  assert.deepEqual(ctx.marcaDesdeMcas('', 'x'), []);
});
