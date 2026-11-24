// La capa de API no debe acumular envoltorios que nadie llama.
//
// `tareasApi` tenía doce métodos sin un solo uso en toda la aplicación (el
// interruptor del módulo, listados de tareas vencidas, subcategorías sueltas...).
// Cada uno fija una URL de backend que parece viva y no lo está.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { raiz, leer } = require('./helpers/sfc');

const MODULO = 'src/services/tareasApi.js';

function archivosFuente(dir, salida = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivosFuente(completo, salida);
    else if (/\.(vue|js)$/.test(entrada.name)) salida.push(completo);
  }
  return salida;
}

test('tareasApi no expone métodos que no llama nadie', () => {
  const objetivo = path.join(raiz, MODULO);
  const fuente = leer(MODULO);
  const metodos = [...fuente.matchAll(/^ {2}(?:async )?([A-Za-z0-9_]+)\s*\(/gm)].map((m) => m[1]);
  assert.ok(metodos.length > 20, 'no se han detectado los métodos del módulo');

  const resto = archivosFuente(path.join(raiz, 'src'))
    .filter((f) => path.resolve(f) !== path.resolve(objetivo))
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');
  // Las llamadas internas (this.metodo(...)) también cuentan como uso.
  const propio = fuente.replace(/^ {2}(?:async )?[A-Za-z0-9_]+\s*\(/gm, '(');

  const llamado = (texto, nombre) => {
    for (let i = texto.indexOf(nombre + '('); i !== -1; i = texto.indexOf(nombre + '(', i + 1)) {
      const anterior = i === 0 ? ' ' : texto[i - 1];
      if (anterior === '.' || anterior === ' ' || anterior === '\n' || anterior === '\t') return true;
    }
    return false;
  };

  const sinUso = metodos.filter((nombre) => !llamado(resto, nombre) && !llamado(propio, nombre));

  assert.deepEqual(sinUso, []);
});
