// Descargar un archivo no debe dejar el blob en memoria del navegador.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { leer, raiz } = require('./helpers/sfc');
const { esDelPlanificador } = require('./helpers/modulos-aparte');

const UTIL = 'src/utils/descargas.js';

function cargarUtil() {
  const codigo = leer(UTIL)
    .replace(/export default [^;]+;/g, '')
    .replace(/export (function|const)/g, '$1');
  return Function(codigo + '\nreturn { descargarBlob };')();
}

function navegadorFalso() {
  const registro = { creadas: 0, liberadas: 0, clics: 0, enlaces: 0, descarga: null, enDom: 0 };
  const enlace = {
    set href(v) { registro.url = v; },
    set download(v) { registro.descarga = v; },
    setAttribute(k, v) { if (k === 'download') registro.descarga = v; },
    click() { registro.clics++; },
    remove() { registro.enDom--; },
  };
  global.window = { URL: {
    createObjectURL: () => { registro.creadas++; return 'blob:x'; },
    revokeObjectURL: () => { registro.liberadas++; },
  } };
  global.Blob = class { constructor(partes) { this.partes = partes; } };
  global.document = {
    createElement: () => { registro.enlaces++; return enlace; },
    body: { appendChild: () => { registro.enDom++; }, removeChild: () => { registro.enDom--; } },
  };
  return registro;
}

test('el enlace temporal se quita y el blob se libera', () => {
  const registro = navegadorFalso();
  const { descargarBlob } = cargarUtil();

  descargarBlob(new global.Blob(['contenido']), 'informe.pdf');

  assert.equal(registro.creadas, 1);
  assert.equal(registro.liberadas, 1, 'el blob queda en memoria si no se libera');
  assert.equal(registro.clics, 1);
  assert.equal(registro.descarga, 'informe.pdf');
  assert.equal(registro.enDom, 0, 'el enlace temporal se queda en el documento');
});

test('el nombre puede venir de la cabecera Content-Disposition', () => {
  navegadorFalso();
  const { descargarBlob } = cargarUtil();
  const util = cargarUtil();
  assert.equal(typeof util.descargarBlob, 'function');
  assert.match(leer(UTIL), /content-disposition/i);
  assert.doesNotThrow(() => descargarBlob(new global.Blob(['x']), 'sin-cabecera.txt'));
});

test('ninguna pantalla crea ya el enlace de descarga a mano', () => {
  const fuentes = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, e.name);
      if (esDelPlanificador(path.relative(raiz, completa))) continue;
      if (e.isDirectory()) recorrer(completa);
      else if (/\.(vue|js)$/.test(e.name)) fuentes.push(completa);
    }
  };
  recorrer(path.join(raiz, 'src'));
  const propias = fuentes
    .filter(f => !f.endsWith(path.join('utils', 'descargas.js')))
    .filter(f => /createObjectURL/.test(fs.readFileSync(f, 'utf8')))
    .map(f => path.relative(raiz, f));
  assert.deepEqual(propias, []);
});
