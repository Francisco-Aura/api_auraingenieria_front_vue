// B4 (30/09/2026): contador de comisiones pendientes junto a «Comisiones MCAS» en el menú.
// Sondeo cada 60 s de GET /mcas/propuestas/recuento, en pausa con la pestaña oculta y
// refresco inmediato al recibir el evento de ventana «mcas:propuestas-cambiadas».
const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const SERVICIO = 'src/services/mcasPendientes.js';
const DASHBOARD = 'src/components/DashboardComponent.vue';
const DASHBOARD_CSS = 'src/components/DashboardComponent.css';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

let modulo;
test.before(async () => { modulo = await importar(SERVICIO); });

const esperar = () => new Promise((resolver) => setImmediate(resolver));

/** Ventana, documento, temporizadores y servidor falsos para el sondeo. */
function entorno({ oculto = false, responder } = {}) {
  const ventana = new EventTarget();
  const documento = new EventTarget();
  documento.hidden = oculto;
  const temporizadores = new Map();
  let siguiente = 1;
  const programar = (fn, ms) => { const id = siguiente++; temporizadores.set(id, { fn, ms }); return id; };
  const cancelar = (id) => { temporizadores.delete(id); };
  const peticiones = [];
  const http = {
    get: async (url) => {
      peticiones.push(url);
      const n = peticiones.length;
      if (responder) return responder(n);
      return { data: { porValidar: n, porRevisar: 2, enCorreccion: 1, total: n + 3 } };
    },
  };
  const sondeo = modulo.crearSondeoPendientes({ http, ventana, documento, programar, cancelar });
  const recibidos = [];
  sondeo.suscribir((recuento) => recibidos.push(recuento));
  const tic = async () => { for (const { fn } of [...temporizadores.values()]) fn(); await esperar(); };
  const cambiarVisibilidad = async (ocultar) => {
    documento.hidden = ocultar;
    documento.dispatchEvent(new Event('visibilitychange'));
    await esperar();
  };
  return { ventana, documento, temporizadores, peticiones, sondeo, recibidos, tic, cambiarVisibilidad };
}

test('el evento y el intervalo son los del contrato de API', () => {
  assert.equal(modulo.EVENTO_PROPUESTAS_CAMBIADAS, 'mcas:propuestas-cambiadas');
  assert.equal(modulo.INTERVALO_PENDIENTES_MS, 60000);
});

test('al iniciar pide el recuento y después lo repite cada 60 s', async () => {
  const e = entorno();
  e.sondeo.iniciar();
  await esperar();
  assert.deepEqual(e.peticiones, ['/mcas/propuestas/recuento']);
  assert.deepEqual(e.recibidos, [{ porValidar: 1, porRevisar: 2, enCorreccion: 1, total: 4 }]);
  assert.deepEqual([...e.temporizadores.values()].map((t) => t.ms), [60000]);
  assert.deepEqual(e.sondeo.recuento, { porValidar: 1, porRevisar: 2, enCorreccion: 1, total: 4 });

  await e.tic();
  assert.equal(e.peticiones.length, 2);
  assert.equal(e.recibidos.at(-1).porValidar, 2);

  // Iniciar dos veces no duplica el sondeo
  e.sondeo.iniciar();
  assert.equal(e.temporizadores.size, 1);
});

test('con la pestaña oculta el sondeo se pausa y al volver se actualiza enseguida', async () => {
  const e = entorno();
  e.sondeo.iniciar();
  await esperar();

  await e.cambiarVisibilidad(true);
  assert.equal(e.temporizadores.size, 0, 'oculta: sin temporizador');
  assert.equal(e.peticiones.length, 1);

  await e.cambiarVisibilidad(false);
  assert.equal(e.peticiones.length, 2, 'al volver pide el recuento');
  assert.equal(e.temporizadores.size, 1, 'y reanuda el sondeo');
});

test('si arranca con la pestaña oculta espera a que se vea', async () => {
  const e = entorno({ oculto: true });
  e.sondeo.iniciar();
  await esperar();
  assert.equal(e.peticiones.length, 0);
  assert.equal(e.temporizadores.size, 0);

  await e.cambiarVisibilidad(false);
  assert.equal(e.peticiones.length, 1);
  assert.equal(e.temporizadores.size, 1);
});

test('el evento «mcas:propuestas-cambiadas» refresca el recuento al momento', async () => {
  const e = entorno();
  e.sondeo.iniciar();
  await esperar();
  e.ventana.dispatchEvent(new Event('mcas:propuestas-cambiadas'));
  await esperar();
  assert.equal(e.peticiones.length, 2);

  // avisarPropuestasCambiadas lanza ese mismo evento
  modulo.avisarPropuestasCambiadas(e.ventana);
  await esperar();
  assert.equal(e.peticiones.length, 3);
  assert.doesNotThrow(() => modulo.avisarPropuestasCambiadas(null));
});

test('detener quita el temporizador y deja de escuchar', async () => {
  const e = entorno();
  e.sondeo.iniciar();
  await esperar();
  e.sondeo.detener();
  assert.equal(e.temporizadores.size, 0);
  e.ventana.dispatchEvent(new Event('mcas:propuestas-cambiadas'));
  await e.cambiarVisibilidad(false);
  assert.equal(e.peticiones.length, 1);
});

test('una respuesta vieja no pisa a una más reciente', async () => {
  const pendientes = [];
  const e = entorno({ responder: () => new Promise((resolver) => pendientes.push(resolver)) });
  e.sondeo.iniciar();
  e.ventana.dispatchEvent(new Event('mcas:propuestas-cambiadas'));
  assert.equal(pendientes.length, 2);
  pendientes[1]({ data: { porValidar: 7, porRevisar: 0, enCorreccion: 0, total: 7 } });
  await esperar();
  pendientes[0]({ data: { porValidar: 3, porRevisar: 0, enCorreccion: 0, total: 3 } });
  await esperar();
  assert.equal(e.sondeo.recuento.porValidar, 7);
  assert.deepEqual(e.recibidos.map((r) => r.porValidar), [7]);
});

test('un fallo del servidor no molesta al usuario; sin permiso se deja de preguntar', async () => {
  const avisos = [];
  const avisar = console.warn;
  console.warn = (...args) => avisos.push(args);
  try {
    const caido = entorno({ responder: () => Promise.reject(new Error('Network Error')) });
    caido.sondeo.iniciar();
    await esperar();
    assert.deepEqual(caido.recibidos, []);
    assert.equal(caido.temporizadores.size, 1, 'sigue intentándolo');

    const sinPermiso = entorno({ responder: () => Promise.reject(Object.assign(new Error('403'), { response: { status: 403 } })) });
    sinPermiso.sondeo.iniciar();
    await esperar();
    assert.equal(sinPermiso.temporizadores.size, 0, 'con 403 se detiene');
  } finally {
    console.warn = avisar;
  }
  assert.ok(avisos.length >= 1);
});

test('los datos que faltan en la respuesta cuentan como cero', async () => {
  const e = entorno({ responder: () => ({ data: { porValidar: '4' } }) });
  e.sondeo.iniciar();
  await esperar();
  assert.deepEqual(e.sondeo.recuento, { porValidar: 4, porRevisar: 0, enCorreccion: 0, total: 4 });
});

test('el desglose se lee en español, en singular o plural', () => {
  const { textoPendientesMcas } = modulo;
  assert.equal(textoPendientesMcas({ porValidar: 3, porRevisar: 5, enCorreccion: 1 }),
    '3 por aprobar · 5 necesitan atención · 1 en corrección');
  assert.equal(textoPendientesMcas({ porValidar: 1, porRevisar: 1, enCorreccion: 0 }),
    '1 por aprobar · 1 necesita atención · 0 en corrección');
  assert.equal(textoPendientesMcas(null), '');
});

// ---------------------------------------------------------------------------
// Menú lateral
// ---------------------------------------------------------------------------

test('el menú enseña junto a «Comisiones MCAS» cuántas hay por aprobar, también con el menú plegado', () => {
  const tpl = plantilla(DASHBOARD);
  const enlace = tpl.match(/<router-link v-if="nivelAcceso === 1" to="\/dashboard\/mcas-propuestas"[\s\S]*?<\/router-link>/);
  assert.ok(enlace, 'falta el enlace a Comisiones MCAS');
  const insignia = enlace[0].match(/<span v-if="pendientesPorValidar" class="menu-insignia"[^>]*>\{\{ insigniaPendientesMcas \}\}<\/span>/);
  assert.ok(insignia, 'falta la insignia con las pendientes de aprobar');
  assert.doesNotMatch(insignia[0], /sidebarCollapsed/, 'la insignia se ve con el menú abierto y plegado');
  assert.match(insignia[0], /:title="tituloPendientesMcas"/);
  assert.match(enlace[0], /:title="sidebarCollapsed \? null : \(tituloPendientesMcas \|\| null\)"/);
  // Plegado, el globo del menú también da el desglose
  assert.match(enlace[0], /<div v-if="sidebarCollapsed" class="tooltip">Comisiones MCAS[\s\S]*?tituloPendientesMcas[\s\S]*?<\/div>/);

  const css = leer(DASHBOARD_CSS).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /\.menu-insignia \{[^}]*border-radius/);
  assert.match(css, /\.sidebar-collapsed \.menu-insignia \{[^}]*position:\s*absolute/);
});

function dashboard({ nivelAcceso, sondeos }) {
  global.window = { innerWidth: 1366, addEventListener() {}, removeEventListener() {} };
  global.localStorage = {
    getItem: (clave) => (clave === 'usuario' ? JSON.stringify({ id: 1, nombre: 'Ana', nivelAcceso }) : null),
    setItem() {}, removeItem() {},
  };
  const componente = cargarComponente(DASHBOARD, {
    NotificacionesComponent: {},
    tareasApi: { verificarModuloActivo: async () => false },
    textoPendientesMcas: modulo.textoPendientesMcas,
    crearSondeoPendientes: () => {
      const sondeo = { iniciado: 0, detenido: 0, oyentes: [] };
      Object.assign(sondeo, {
        iniciar() { sondeo.iniciado += 1; },
        detener() { sondeo.detenido += 1; },
        suscribir(fn) { sondeo.oyentes.push(fn); return () => {}; },
      });
      sondeos.push(sondeo);
      return sondeo;
    },
  });
  const ctx = crearContexto(componente, { $route: { path: '/dashboard/clientes' } });
  return { componente, ctx };
}

test('solo el administrador consulta el recuento y se deja de consultar al salir', async () => {
  const sondeos = [];
  const { componente, ctx } = dashboard({ nivelAcceso: 1, sondeos });
  await componente.created.call(ctx);
  assert.equal(sondeos.length, 1);
  assert.equal(sondeos[0].iniciado, 1);
  assert.equal(ctx.pendientesPorValidar, 0);
  assert.equal(ctx.tituloPendientesMcas, '');

  sondeos[0].oyentes.forEach((fn) => fn({ porValidar: 3, porRevisar: 5, enCorreccion: 1, total: 9 }));
  assert.equal(ctx.pendientesPorValidar, 3);
  assert.equal(ctx.insigniaPendientesMcas, '3');
  assert.equal(ctx.tituloPendientesMcas, '3 por aprobar · 5 necesitan atención · 1 en corrección');
  sondeos[0].oyentes.forEach((fn) => fn({ porValidar: 150, porRevisar: 0, enCorreccion: 0, total: 150 }));
  assert.equal(ctx.insigniaPendientesMcas, '99+');

  componente.beforeUnmount.call(ctx);
  assert.equal(sondeos[0].detenido, 1);

  const otros = [];
  const usuario = dashboard({ nivelAcceso: 2, sondeos: otros });
  await usuario.componente.created.call(usuario.ctx);
  assert.equal(otros.length, 0, 'un usuario sin acceso a MCAS no consulta nada');
  assert.doesNotThrow(() => usuario.componente.beforeUnmount.call(usuario.ctx));
});
