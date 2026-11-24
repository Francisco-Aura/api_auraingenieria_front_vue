// El aviso de error debe decir lo que responde el servidor, no una frase genérica.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, raiz } = require('./helpers/sfc');
const fs = require('node:fs');
const path = require('node:path');

const UTIL = 'src/utils/errores.js';

/** Carga un módulo ES sencillo (solo export function) evaluándolo en Node. */
function cargarUtil() {
  const codigo = leer(UTIL).replace(/export (function|const)/g, '$1');
  const exportar = 'return { detalleApi, textoError };';
  return Function(codigo + '\n' + exportar)();
}

test('el detalle del servidor se extrae de las formas en que lo devuelve el backend', () => {
  const { detalleApi } = cargarUtil();
  assert.equal(detalleApi({ response: { data: { error: 'El CIF ya existe' } } }), 'El CIF ya existe');
  assert.equal(detalleApi({ response: { data: 'Texto plano' } }), 'Texto plano');
  assert.equal(detalleApi({ response: { data: { error: 'Faltan datos', detalles: ['CIF', 'IBAN'] } } }),
    'Faltan datos: CIF · IBAN');
  assert.equal(detalleApi({}), '');
  assert.equal(detalleApi(null), '');
});

test('sin detalle del servidor se queda la frase de siempre', () => {
  const { textoError } = cargarUtil();
  assert.equal(textoError({}, 'No se pudo guardar.'), 'No se pudo guardar.');
  assert.equal(textoError({ response: { data: { error: 'Nota no encontrada' } } }, 'No se pudo guardar.'),
    'No se pudo guardar. Nota no encontrada');
});

test('los diálogos de MCAS siguen usando el mismo ayudante', () => {
  const mcas = leer('src/components/CRM_Module/MCAS/mcasDialogs.js');
  assert.match(mcas, /from ['"]@\/utils\/errores['"]/);
  assert.doesNotMatch(mcas, /export function detalleApi/, 'la copia debe vivir solo en utils/errores.js');
});

test('guardar, actualizar y borrar avisan con el motivo que da el servidor', () => {
  const ESCRITURAS = [
    ['src/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue', 4],
    ['src/components/CRM_Module/Tareas/TareaDetalleModal.vue', 4],
    ['src/components/CRM_Module/Tareas/TareaModalCorporativo.vue', 1],
  ];
  for (const [ruta, minimo] of ESCRITURAS) {
    const usos = (leer(ruta).match(/textoError\(/g) || []).length;
    assert.ok(usos >= minimo, `${ruta}: ${usos} usos de textoError, esperaba al menos ${minimo}`);
    assert.match(leer(ruta), /from ['"]@\/utils\/errores['"]/, ruta);
  }
});

test('nadie vuelve a copiar el ayudante en otro sitio', () => {
  const fuentes = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(completa);
      else if (/\.(vue|js)$/.test(e.name)) fuentes.push(completa);
    }
  };
  recorrer(path.join(raiz, 'src'));
  const copias = fuentes.filter(f => !f.endsWith(path.join('utils', 'errores.js')))
    .filter(f => /function detalleApi|const detalleApi *=/.test(fs.readFileSync(f, 'utf8')))
    .map(f => path.relative(raiz, f));
  assert.deepEqual(copias, []);
});
