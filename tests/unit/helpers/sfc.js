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

/** Pares [nombre local, nombre exportado] de un import: 'default' para el por defecto y '*' para «* as X». */
function enlacesImportados(sentencia) {
  const clausula = sentencia.replace(/\r/g, '').replace(/^import\s+/, '').replace(/\s+from\s+['"][^'"]+['"][\s\S]*$/, '');
  const enlaces = [];
  const llaves = clausula.match(/\{([\s\S]*)\}/);
  if (llaves) {
    llaves[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
      const [exportado, local = exportado] = s.split(/\s+as\s+/).map((x) => x.trim());
      enlaces.push([local, exportado]);
    });
  }
  clausula.replace(/\{[\s\S]*\}/, '').split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => {
    const todo = s.match(/^\*\s+as\s+(\S+)$/);
    enlaces.push(todo ? [todo[1], '*'] : [s, 'default']);
  });
  return enlaces;
}

/**
 * El módulo real si el import es de src/utils (funciones puras, sin Vue ni red); null si
 * es otra cosa o no se puede cargar en Node (p. ej. excel.js, que importa con «@/»).
 */
function moduloDeUtils(especificador, rutaComponente) {
  const utils = path.join(raiz, 'src', 'utils') + path.sep;
  let ruta;
  if (especificador.startsWith('@/')) ruta = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) ruta = path.resolve(path.dirname(path.join(raiz, rutaComponente)), especificador);
  else return null;
  if (!ruta.endsWith('.js')) ruta += '.js';
  if (!ruta.startsWith(utils)) return null;
  try {
    return require(ruta);
  } catch {
    return null;
  }
}

/**
 * Evalúa el <script> de un .vue sin sus import, inyectando las dependencias indicadas.
 * Lo que se importa de src/utils se carga de verdad (salvo que el test lo sustituya); el
 * resto de imports no indicados quedan vacíos ({}).
 */
function cargarComponente(ruta, dependencias = {}) {
  const { descriptor, errors } = parse(leer(ruta), { filename: ruta });
  assert.deepEqual(errors, []);
  const reImport = /^import\s+[^\n]*?\s+from\s+['"][^'"]+['"];?[^\n]*$/gm;
  const inyectar = { ...dependencias };
  for (const sentencia of descriptor.script.content.match(reImport) || []) {
    const modulo = moduloDeUtils(sentencia.match(/from\s+['"]([^'"]+)['"]/)[1], ruta);
    for (const [nombre, exportado] of enlacesImportados(sentencia)) {
      if (nombre in inyectar) continue;
      const valor = modulo && (exportado === '*' ? modulo : modulo[exportado]);
      inyectar[nombre] = valor === undefined || valor === null ? {} : valor;
    }
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
    const set = typeof definicion === 'function' ? undefined : definicion.set;
    Object.defineProperty(ctx, nombre, { get: () => get.call(ctx), set: set && ((valor) => set.call(ctx, valor)), configurable: true });
  }
  return ctx;
}

module.exports = { raiz, leer, plantilla, nombresImportados, enlacesImportados, cargarComponente, crearContexto };
