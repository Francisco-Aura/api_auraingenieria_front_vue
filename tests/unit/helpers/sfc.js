// Carga el <script> de un componente .vue en Node, sin navegador ni Vue, para
// probar su lógica (data, métodos y computadas) con dependencias falsas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('@vue/compiler-sfc');

const raiz = path.resolve(__dirname, '..', '..', '..');
const leer = (ruta) => fs.readFileSync(path.join(raiz, ruta), 'utf8');

function plantilla(ruta) {
  return parse(leer(ruta), { filename: ruta }).descriptor.template.content;
}

/** Nombres locales que declara un bloque de import. */
function nombresImportados(sentencia) {
  const clausula = sentencia.replace(/\r/g, '').replace(/^import\s+/, '').replace(/\s+from\s+['"][^'"]+['"][\s\S]*$/, '');
  const nombres = [];
  const llaves = clausula.match(/\{([\s\S]*)\}/);
  if (llaves) {
    llaves[1].split(',').map((s) => s.trim()).filter(Boolean)
      .forEach((s) => nombres.push(s.split(/\s+as\s+/).pop().trim()));
  }
  const resto = clausula.replace(/\{[\s\S]*\}/, '').replace(/\*\s+as\s+/, '').split(',').map((s) => s.trim()).filter(Boolean);
  return nombres.concat(resto);
}

/** Evalúa el <script> de un .vue sin sus import, inyectando las dependencias indicadas (el resto, vacías). */
function cargarComponente(ruta, dependencias = {}) {
  const { descriptor, errors } = parse(leer(ruta), { filename: ruta });
  assert.deepEqual(errors, []);
  const reImport = /^import\s+[^\n]*?\s+from\s+['"][^'"]+['"];?[^\n]*$/gm;
  const inyectar = { ...dependencias };
  for (const sentencia of descriptor.script.content.match(reImport) || []) {
    for (const nombre of nombresImportados(sentencia)) if (!(nombre in inyectar)) inyectar[nombre] = {};
  }
  const codigo = descriptor.script.content
    .replace(reImport, '')
    .replace(/^import\s+['"][^'"]+['"];?[ \t]*$/gm, '')
    .replace('export default', 'return');
  return Function(...Object.keys(inyectar), codigo)(...Object.values(inyectar));
}

/** Contexto tipo instancia de Vue: data, métodos enlazados y computadas de solo lectura. */
function crearContexto(componente, extras = {}) {
  const avisos = [];
  const emitidos = [];
  const ctx = {
    $emit(evento, ...args) { emitidos.push([evento, ...args]); },
    $nextTick: async (fn) => { if (fn) fn(); },
    $refs: {},
    $route: { query: {} },
    $router: { push() {} },
    $swal: { fire: async (opciones) => { avisos.push(opciones); return { isConfirmed: true }; }, showLoading() {}, close() {} },
    avisos,
    emitidos,
  };
  for (const [nombre, metodo] of Object.entries(componente.methods || {})) ctx[nombre] = metodo.bind(ctx);
  Object.assign(ctx, componente.data ? componente.data.call(ctx) : {}, extras);
  for (const [nombre, definicion] of Object.entries(componente.computed || {})) {
    const get = typeof definicion === 'function' ? definicion : definicion.get;
    Object.defineProperty(ctx, nombre, { get: () => get.call(ctx), configurable: true });
  }
  return ctx;
}

module.exports = { raiz, leer, plantilla, nombresImportados, cargarComponente, crearContexto };
