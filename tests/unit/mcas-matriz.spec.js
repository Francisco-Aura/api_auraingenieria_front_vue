// MCAS · usabilidad (30/09/2026), C3: editor en rejilla de las tablas de importes.
// Módulo puro mcasMatriz.js (ida y vuelta sin pérdidas, intervalos «Excel», pegado TSV)
// y componente McasMatrizEditor.vue con axios simulado (GET/PUT /mcas/reglas/{id}/tabla).
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const MATRIZ = 'src/components/CRM_Module/MCAS/mcasMatriz.js';
const EDITOR = 'src/components/CRM_Module/MCAS/McasMatrizEditor.vue';
const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';

let m;
test.before(async () => { m = await import(pathToFileURL(path.join(raiz, MATRIZ)).href); });

/** Filas de mcas_valores_rango tal como las devuelve el servidor (con id). */
function valores(idRegla, tuplas) {
  return tuplas.map(([orden, dimension, valorMin, valorMax, minInclusivo, maxInclusivo, valorCategoria, valorResultado], i) => ({
    id: 1000 + i, idRegla, dimension, valorMin, valorMax, minInclusivo, maxInclusivo, valorCategoria,
    valorResultado, unidadResultado: 'EUR', orden,
  }));
}
const sinId = (filas) => filas.map(({ id, ...resto }) => resto); // eslint-disable-line no-unused-vars

// Copiado de V20260929_2_Seed_MCAS_Reglas_Hoja2.sql · ENDESA_PYME_LUZ_2_0TD (ENDESA B17:D28, 22 celdas)
const ENDESA_2_0TD = valores(11, [
  [1, 'consumo_kwh', 0, 5000, true, true, null, 46.8],
  [1, 'potencia_kw', 0, 10, true, true, null, 46.8],
  [2, 'consumo_kwh', 0, 5000, true, true, null, 115.44],
  [2, 'potencia_kw', 10, 15, false, true, null, 115.44],
  [3, 'consumo_kwh', 5000, 10000, false, true, null, 43.68],
  [3, 'potencia_kw', 0, 10, true, true, null, 43.68],
  [4, 'consumo_kwh', 5000, 10000, false, true, null, 115.44],
  [4, 'potencia_kw', 10, 15, false, true, null, 115.44],
  [5, 'consumo_kwh', 10000, 20000, false, true, null, 56.16],
  [5, 'potencia_kw', 0, 10, true, true, null, 56.16],
  [6, 'consumo_kwh', 10000, 20000, false, true, null, 159.12],
  [6, 'potencia_kw', 10, 15, false, true, null, 159.12],
  [7, 'consumo_kwh', 20000, 30000, false, true, null, 56.16],
  [7, 'potencia_kw', 0, 10, true, true, null, 56.16],
  [8, 'consumo_kwh', 20000, 30000, false, true, null, 190.32],
  [8, 'potencia_kw', 10, 15, false, true, null, 190.32],
  [9, 'consumo_kwh', 30000, 50000, false, true, null, 117],
  [9, 'potencia_kw', 0, 10, true, true, null, 117],
  [10, 'consumo_kwh', 30000, 50000, false, true, null, 249.6],
  [10, 'potencia_kw', 10, 15, false, true, null, 249.6],
  [11, 'consumo_kwh', 50000, 100000, false, true, null, 118.56],
  [11, 'potencia_kw', 0, 10, true, true, null, 118.56],
  [12, 'consumo_kwh', 50000, 100000, false, true, null, 343.2],
  [12, 'potencia_kw', 10, 15, false, true, null, 343.2],
  [13, 'consumo_kwh', 100000, 150000, false, true, null, 161.28],
  [13, 'potencia_kw', 0, 10, true, true, null, 161.28],
  [14, 'consumo_kwh', 100000, 150000, false, true, null, 403.2],
  [14, 'potencia_kw', 10, 15, false, true, null, 403.2],
  [15, 'consumo_kwh', 150000, 200000, false, true, null, 161.28],
  [15, 'potencia_kw', 0, 10, true, true, null, 161.28],
  [16, 'consumo_kwh', 150000, 200000, false, true, null, 403.2],
  [16, 'potencia_kw', 10, 15, false, true, null, 403.2],
  [17, 'consumo_kwh', 200000, 250000, false, true, null, 161.28],
  [17, 'potencia_kw', 0, 10, true, true, null, 161.28],
  [18, 'consumo_kwh', 200000, 250000, false, true, null, 403.2],
  [18, 'potencia_kw', 10, 15, false, true, null, 403.2],
  [19, 'consumo_kwh', 250000, 300000, false, true, null, 161.28],
  [19, 'potencia_kw', 0, 10, true, true, null, 161.28],
  [20, 'consumo_kwh', 250000, 300000, false, true, null, 615.44],
  [20, 'potencia_kw', 10, 15, false, true, null, 615.44],
  [21, 'consumo_kwh', 300000, null, false, false, null, 146.83],
  [21, 'potencia_kw', 0, 10, true, true, null, 146.83],
  [22, 'consumo_kwh', 300000, null, false, false, null, 534.52],
  [22, 'potencia_kw', 10, 15, false, true, null, 534.52],
]);

// Copiado de V20260929_2_Seed_MCAS_Reglas_Hoja2.sql · IBERDROLA_FUERA_HASTA_20KW (IBERDROLA A8:J13, 26 celdas;
// F10:F12 y J10:J12 = «N. Aplica», sin celda)
const IBERDROLA_20KW = valores(21, [
  [1, 'potencia_kw', 0, 5, true, true, null, 74.4], [1, 'zona_comision', null, null, true, false, 'ZBR', 74.4], [1, 'codigo_producto', null, null, true, false, 'OFERTA_0', 74.4],
  [2, 'potencia_kw', 0, 5, true, true, null, 57.6], [2, 'zona_comision', null, null, true, false, 'ZBR', 57.6], [2, 'codigo_producto', null, null, true, false, 'OFERTA_1', 57.6],
  [3, 'potencia_kw', 0, 5, true, true, null, 42.4], [3, 'zona_comision', null, null, true, false, 'ZBR', 42.4], [3, 'codigo_producto', null, null, true, false, 'OFERTA_2', 42.4],
  [4, 'potencia_kw', 0, 5, true, true, null, 48], [4, 'zona_comision', null, null, true, false, 'ZAR', 48], [4, 'codigo_producto', null, null, true, false, 'OFERTA_0', 48],
  [5, 'potencia_kw', 0, 5, true, true, null, 37.6], [5, 'zona_comision', null, null, true, false, 'ZAR', 37.6], [5, 'codigo_producto', null, null, true, false, 'OFERTA_1', 37.6],
  [6, 'potencia_kw', 0, 5, true, true, null, 28], [6, 'zona_comision', null, null, true, false, 'ZAR', 28], [6, 'codigo_producto', null, null, true, false, 'OFERTA_2', 28],
  [7, 'potencia_kw', 5, 10, false, true, null, 81.6], [7, 'zona_comision', null, null, true, false, 'ZBR', 81.6], [7, 'codigo_producto', null, null, true, false, 'OFERTA_0', 81.6],
  [8, 'potencia_kw', 5, 10, false, true, null, 64], [8, 'zona_comision', null, null, true, false, 'ZBR', 64], [8, 'codigo_producto', null, null, true, false, 'OFERTA_1', 64],
  [9, 'potencia_kw', 5, 10, false, true, null, 47.2], [9, 'zona_comision', null, null, true, false, 'ZBR', 47.2], [9, 'codigo_producto', null, null, true, false, 'OFERTA_2', 47.2],
  [10, 'potencia_kw', 5, 10, false, true, null, 52.8], [10, 'zona_comision', null, null, true, false, 'ZAR', 52.8], [10, 'codigo_producto', null, null, true, false, 'OFERTA_0', 52.8],
  [11, 'potencia_kw', 5, 10, false, true, null, 40], [11, 'zona_comision', null, null, true, false, 'ZAR', 40], [11, 'codigo_producto', null, null, true, false, 'OFERTA_1', 40],
  [12, 'potencia_kw', 5, 10, false, true, null, 30.4], [12, 'zona_comision', null, null, true, false, 'ZAR', 30.4], [12, 'codigo_producto', null, null, true, false, 'OFERTA_2', 30.4],
  [13, 'potencia_kw', 10, 15, false, true, null, 104.8], [13, 'zona_comision', null, null, true, false, 'ZBR', 104.8], [13, 'codigo_producto', null, null, true, false, 'OFERTA_0', 104.8],
  [14, 'potencia_kw', 10, 15, false, true, null, 88], [14, 'zona_comision', null, null, true, false, 'ZBR', 88], [14, 'codigo_producto', null, null, true, false, 'OFERTA_1', 88],
  [15, 'potencia_kw', 10, 15, false, true, null, 67.2], [15, 'zona_comision', null, null, true, false, 'ZBR', 67.2], [15, 'codigo_producto', null, null, true, false, 'OFERTA_2', 67.2],
  [16, 'potencia_kw', 10, 15, false, true, null, 88], [16, 'zona_comision', null, null, true, false, 'ZAR', 88], [16, 'codigo_producto', null, null, true, false, 'OFERTA_0', 88],
  [17, 'potencia_kw', 10, 15, false, true, null, 70.4], [17, 'zona_comision', null, null, true, false, 'ZAR', 70.4], [17, 'codigo_producto', null, null, true, false, 'OFERTA_1', 70.4],
  [18, 'potencia_kw', 10, 15, false, true, null, 57.6], [18, 'zona_comision', null, null, true, false, 'ZAR', 57.6], [18, 'codigo_producto', null, null, true, false, 'OFERTA_2', 57.6],
  [19, 'potencia_kw', 15, 20, false, true, null, 244], [19, 'zona_comision', null, null, true, false, 'ZBR', 244], [19, 'codigo_producto', null, null, true, false, 'OFERTA_0', 244],
  [20, 'potencia_kw', 15, 20, false, true, null, 189.6], [20, 'zona_comision', null, null, true, false, 'ZBR', 189.6], [20, 'codigo_producto', null, null, true, false, 'OFERTA_1', 189.6],
  [21, 'potencia_kw', 15, 20, false, true, null, 128.8], [21, 'zona_comision', null, null, true, false, 'ZBR', 128.8], [21, 'codigo_producto', null, null, true, false, 'OFERTA_2', 128.8],
  [22, 'potencia_kw', 15, 20, false, true, null, 91.2], [22, 'zona_comision', null, null, true, false, 'ZBR', 91.2], [22, 'codigo_producto', null, null, true, false, 'OFERTA_3', 91.2],
  [23, 'potencia_kw', 15, 20, false, true, null, 203.2], [23, 'zona_comision', null, null, true, false, 'ZAR', 203.2], [23, 'codigo_producto', null, null, true, false, 'OFERTA_0', 203.2],
  [24, 'potencia_kw', 15, 20, false, true, null, 156], [24, 'zona_comision', null, null, true, false, 'ZAR', 156], [24, 'codigo_producto', null, null, true, false, 'OFERTA_1', 156],
  [25, 'potencia_kw', 15, 20, false, true, null, 104.8], [25, 'zona_comision', null, null, true, false, 'ZAR', 104.8], [25, 'codigo_producto', null, null, true, false, 'OFERTA_2', 104.8],
  [26, 'potencia_kw', 15, 20, false, true, null, 77.6], [26, 'zona_comision', null, null, true, false, 'ZAR', 77.6], [26, 'codigo_producto', null, null, true, false, 'OFERTA_3', 77.6],
]);

const intervalo = (valorMin, valorMax, minInclusivo, maxInclusivo) => ({ valorMin, valorMax, minInclusivo, maxInclusivo });

// ---------------------------------------------------------------------------
// Intervalos con la notación del Excel
// ---------------------------------------------------------------------------

test('los tramos se leen con la notación del Excel de comisiones', () => {
  assert.deepEqual(m.leerIntervalo('5.001-10.000'), intervalo(5000, 10000, false, true));
  assert.deepEqual(m.leerIntervalo('0-5.000'), intervalo(0, 5000, true, true));
  assert.deepEqual(m.leerIntervalo('>800.001'), intervalo(800000, null, false, false));
  assert.deepEqual(m.leerIntervalo('10-15'), intervalo(10, 15, false, true), 'potencias: «10-15» sigue al tramo anterior');
  assert.deepEqual(m.leerIntervalo('>200'), intervalo(200, null, false, false));
  assert.deepEqual(m.leerIntervalo('≥5.000'), intervalo(5000, null, true, false));
  assert.deepEqual(m.leerIntervalo(' 0 - 5.000 kWh '), intervalo(0, 5000, true, true), 'admite espacios y la unidad');
  assert.equal(m.leerIntervalo('cinco mil'), null);
  assert.equal(m.leerIntervalo(''), null);
});

test('cada tramo se rotula como en el Excel y el rótulo se vuelve a leer igual', () => {
  assert.equal(m.etiquetaIntervalo(intervalo(5000, 10000, false, true)), '5.001-10.000');
  assert.equal(m.etiquetaIntervalo(intervalo(0, 5000, true, true)), '0-5.000');
  assert.equal(m.etiquetaIntervalo(intervalo(800000, null, false, false)), '>800.001');
  assert.equal(m.etiquetaIntervalo(intervalo(10, 15, false, true)), '10-15');
  assert.equal(m.etiquetaIntervalo(intervalo(null, null, true, false)), 'Cualquiera');
  // Lo que el Excel no sabe escribir se rotula con corchetes, sin perder nada.
  for (const i of [intervalo(5, 10, true, true), intervalo(0, 5000, true, false), intervalo(1001, 2000, false, true),
    intervalo(10.5, 20, false, true), intervalo(null, 10, true, true), intervalo(0, 10, false, true)]) {
    assert.deepEqual(m.leerIntervalo(m.etiquetaIntervalo(i)), i, m.etiquetaIntervalo(i));
  }
});

// ---------------------------------------------------------------------------
// Rejilla ⇄ filas
// ---------------------------------------------------------------------------

test('Endesa 2.0TD: consumo en filas, potencia en columnas y vuelta a filas sin pérdidas', () => {
  const r = m.aRejilla(ENDESA_2_0TD);
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.filas.dimension, 'consumo_kwh', 'la dimensión con más tramos va en filas');
  assert.equal(r.filas.valores.length, 11);
  assert.equal(r.columnas.dimension, 'potencia_kw');
  assert.deepEqual(r.columnas.valores.map(m.etiquetaIntervalo), ['0-10', '10-15']);
  assert.deepEqual(r.filas.valores.map(m.etiquetaIntervalo).slice(0, 3), ['0-5.000', '5.001-10.000', '10.001-20.000']);
  assert.equal(r.filas.valores.map(m.etiquetaIntervalo).at(-1), '>300.001');
  assert.equal(r.pestanas.valores.length, 1, 'sin dimensiones de categoría hay una sola pestaña');
  assert.equal(r.celdas[0][0][0].valor, 46.8);
  assert.equal(r.celdas[0][0][1].valor, 115.44);
  assert.equal(r.celdas[0][10][1].valor, 534.52);

  assert.deepEqual(m.aFilas(r), sinId(ENDESA_2_0TD));
});

test('Iberdrola ≤ 20 kW: potencia × oferta con una pestaña por zona y los «N. Aplica» vacíos', () => {
  const r = m.aRejilla(IBERDROLA_20KW);
  assert.equal(r.ok, true, r.motivo);
  assert.equal(r.filas.dimension, 'potencia_kw');
  assert.deepEqual(r.filas.valores.map(m.etiquetaIntervalo), ['0-5', '5-10', '10-15', '15-20']);
  assert.equal(r.columnas.dimension, 'codigo_producto', 'solo una numérica: la categoría con más valores es el segundo eje');
  assert.deepEqual(r.columnas.valores, ['OFERTA_0', 'OFERTA_1', 'OFERTA_2', 'OFERTA_3']);
  assert.deepEqual(r.pestanas.dimensiones, ['zona_comision']);
  assert.deepEqual(r.pestanas.valores, [{ zona_comision: 'ZBR' }, { zona_comision: 'ZAR' }]);
  // ZBR, potencia 0-5, OFERTA_3 = «N. Aplica» → celda vacía (revisión manual)
  assert.equal(r.celdas[0][0][3].valor, null);
  assert.equal(r.celdas[1][3][3].valor, 77.6);

  assert.deepEqual(m.aFilas(r), sinId(IBERDROLA_20KW));
});

test('una tabla por tramos de una sola dimensión es una rejilla de una columna', () => {
  const tramos = valores(31, [
    [1, 'consumo_kwh', 0, 5000, true, true, null, 40],
    [2, 'consumo_kwh', 5000, null, false, false, null, 64],
  ]);
  const r = m.aRejilla(tramos);
  assert.equal(r.ok, true);
  assert.equal(r.columnas, null);
  assert.equal(r.celdas[0].length, 2);
  assert.equal(r.celdas[0][1].length, 1);
  assert.deepEqual(m.aFilas(r), sinId(tramos));
});

test('una tabla que no es cartesiana no se puede mostrar en rejilla', () => {
  const faltaDimension = ENDESA_2_0TD.filter((v) => !(v.orden === 3 && v.dimension === 'potencia_kw'));
  assert.equal(m.aRejilla(faltaDimension).ok, false);
  assert.match(m.aRejilla(faltaDimension).motivo, /celda 3/);

  const repetida = [...ENDESA_2_0TD, ...ENDESA_2_0TD.slice(0, 2).map((v) => ({ ...v, orden: 99 }))];
  const r = m.aRejilla(repetida);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /misma posición/);

  const importesDistintos = ENDESA_2_0TD.map((v) => (v.orden === 1 && v.dimension === 'potencia_kw' ? { ...v, valorResultado: 1 } : v));
  assert.equal(m.aRejilla(importesDistintos).ok, false);
});

test('al editar se renumeran las celdas y las nuevas van al final', () => {
  const r = m.aRejilla(ENDESA_2_0TD);
  r.celdas[0][0][0].valor = null; // se vacía la celda 1
  r.celdas[0][0][1].valor = 120;
  const filas = m.aFilas(r);
  assert.equal(filas.length, 42);
  assert.deepEqual([...new Set(filas.map((f) => f.orden))], Array.from({ length: 21 }, (_, i) => i + 1));
  assert.equal(filas[0].valorResultado, 120);
  // numerarCeldas da la misma numeración que viajará al servidor (para marcar sus incidencias).
  assert.deepEqual(m.numerarCeldas(r)[0], { orden: 1, pestana: 0, fila: 0, columna: 1 });
  assert.deepEqual(m.posicionDeOrden(m.aRejilla(ENDESA_2_0TD), 4), { pestana: 0, fila: 1, columna: 1 });

  m.anadirFila(r, m.leerIntervalo('>400.001'));
  r.celdas[0][11][0].valor = 200;
  const conNueva = m.aFilas(r);
  assert.equal(conNueva.at(-1).orden, 22);
  assert.equal(conNueva.at(-2).valorMin, 400000);
});

test('la validación marca solapes, importes negativos, celdas vacías y tablas sin importes', () => {
  const r = m.aRejilla(ENDESA_2_0TD);
  assert.deepEqual(m.validarRejilla(r).errores, []);

  r.celdas[0][2][0].valor = -5;
  r.celdas[0][3][1].valor = null;
  const v = m.validarRejilla(r);
  assert.equal(v.ok, false);
  assert.ok(v.errores.some((e) => e.fila === 2 && e.columna === 0 && /negativ/.test(e.mensaje)));
  assert.ok(v.avisos.some((a) => /1 celda vacía/.test(a.mensaje) && /revisión manual/.test(a.mensaje)));

  const solape = m.aRejilla(ENDESA_2_0TD);
  solape.filas.valores[1] = intervalo(4000, 10000, false, true);
  assert.ok(m.validarRejilla(solape).errores.some((e) => e.eje === 'filas' && /se solapan/.test(e.mensaje)));

  const vacia = m.rejillaVacia({ filas: 'consumo_kwh' });
  m.anadirFila(vacia, m.leerIntervalo('0-5.000'));
  assert.ok(m.validarRejilla(vacia).errores.some((e) => /ningún importe/.test(e.mensaje)));
});

// ---------------------------------------------------------------------------
// Pegar desde Excel
// ---------------------------------------------------------------------------

test('el pegado desde Excel entiende números en formato español y «N. Aplica»/«Consultar» como vacías', () => {
  const p = m.pegarDesdeExcel('46,80\t115,44\r\nN. Aplica\t1.234,5\r\n\tConsultar\r\n');
  assert.deepEqual(p.errores, []);
  assert.deepEqual(p.filas, [[46.8, 115.44], [null, 1234.5], [null, null]]);

  const conError = m.pegarDesdeExcel('46,80\tabc');
  assert.deepEqual(conError.errores, [{ fila: 0, columna: 1, texto: 'abc' }]);

  assert.equal(m.leerImporte('5.000').valor, 5000);
  assert.equal(m.leerImporte('46.80').valor, 46.8, 'un punto que no agrupa miles es decimal');
  assert.equal(m.leerImporte('1.234,56 €').valor, 1234.56);
  assert.equal(m.leerImporte('n. aplica').vacia, true);
});

test('el punto solo separa miles con grupos de tres cifras y parte entera distinta de 0; si no, es el decimal', () => {
  assert.equal(m.leerImporte('0.125').valor, 0.125);
  assert.equal(m.leerImporte('0.500').valor, 0.5);
  assert.equal(m.leerImporte('4.05').valor, 4.05);
  assert.equal(m.leerImporte('1.234').valor, 1234);
  assert.equal(m.leerImporte('1.234,5').valor, 1234.5);
  assert.equal(m.leerImporte('12.000').valor, 12000);
  assert.equal(m.leerImporte('12.345.678').valor, 12345678);
  assert.ok(m.leerImporte('0.125,5').error, 'con coma, el punto solo puede separar miles');
  assert.deepEqual(m.leerIntervalo('0-0.5'), { valorMin: 0, valorMax: 0.5, minInclusivo: true, maxInclusivo: true });
});

test('lo pegado se coloca desde la celda elegida y avisa de lo que no cabe', () => {
  const r = m.aRejilla(ENDESA_2_0TD);
  const res = m.aplicarPegado(r, m.pegarDesdeExcel('1\t2\t3\n4\t5\t6'), { pestana: 0, fila: 9, columna: 0 });
  assert.deepEqual([r.celdas[0][9][0].valor, r.celdas[0][9][1].valor, r.celdas[0][10][0].valor], [1, 2, 4]);
  assert.equal(res.escritas, 4);
  assert.equal(res.fuera, 2);
});

test('una tabla nueva se construye pegando el bloque del Excel con sus cabeceras', () => {
  const texto = 'kWh\t0-10\t10-15\n0-5.000\t46,80\t115,44\n5.001-10.000\t43,68\tN. Aplica\n>10.000\t56,16\t159,12';
  const p = m.pegarDesdeExcel(texto);
  assert.deepEqual(p.cabeceraFilas, ['0-5.000', '5.001-10.000', '>10.000']);
  assert.deepEqual(p.cabeceraColumnas, ['0-10', '10-15']);
  const { ok, rejilla } = m.rejillaDesdePegado(p, { filas: 'consumo_kwh', columnas: 'potencia_kw', idRegla: 40 });
  assert.equal(ok, true);
  const filas = m.aFilas(rejilla);
  assert.equal(filas.length, 10, '5 celdas con importe × 2 dimensiones');
  assert.deepEqual(filas.slice(0, 2).map((f) => [f.dimension, f.valorMin, f.valorMax, f.valorResultado]),
    [['consumo_kwh', 0, 5000, 46.8], ['potencia_kw', 0, 10, 46.8]]);
  assert.equal(filas.every((f) => f.idRegla === 40 && f.unidadResultado === 'EUR'), true);
});

// ---------------------------------------------------------------------------
// McasMatrizEditor.vue
// ---------------------------------------------------------------------------

/** Lo que el editor importa de mcasMatriz.js (el resto de exports chocaría con sus constantes). */
function importadoDeMatriz() {
  const linea = leer(EDITOR).match(/^import \{([^}]+)\} from '\.\/mcasMatriz'/m);
  assert.ok(linea, 'el import de mcasMatriz debe ocupar una sola línea');
  return Object.fromEntries(linea[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => [n, m[n]]));
}

function editor({ peticiones = [], respuestas = {}, fallos = {}, editable = true, ordenResaltado = null } = {}) {
  const responder = (metodo) => async (url, datos) => {
    peticiones.push({ metodo, url, datos });
    if (fallos[metodo]) throw fallos[metodo];
    return { data: respuestas[`${metodo} ${url}`] ?? {} };
  };
  const componente = cargarComponente(EDITOR, {
    ...importadoDeMatriz(),
    axios: { get: responder('get'), put: responder('put') },
    confirmar: async () => true,
    mostrarError: (swal, title, text) => swal.fire({ icon: 'error', title, text }),
    mostrarExito: (swal, title, text) => swal.fire({ icon: 'success', title, text }),
    textoError: (e, base) => base,
  });
  return crearContexto(componente, {
    regla: { id: 11, codigo: 'ENDESA_PYME_LUZ_2_0TD', nombre: 'Endesa · pyme luz 2.0TD', metodoCalculo: 'MATRIX_LOOKUP' },
    editable, ordenResaltado,
  });
}

const TABLA = { firma: 'sha-1', metodo: 'MATRIX_LOOKUP', valores: ENDESA_2_0TD };

test('«Ver tabla» carga la rejilla de la regla desde el servidor', async () => {
  const peticiones = [];
  const ctx = editor({ peticiones, respuestas: { 'get /mcas/reglas/11/tabla': TABLA } });
  await ctx.cargar();
  assert.deepEqual(peticiones.map((p) => `${p.metodo} ${p.url}`), ['get /mcas/reglas/11/tabla']);
  assert.equal(ctx.firma, 'sha-1');
  assert.equal(ctx.rejilla.filas.valores.length, 11);
  assert.equal(ctx.textoCelda(ctx.rejilla.celdas[0][0][0]), '46,8');
});

test('guardar envía la firma y la tabla completa, y toma la firma nueva', async () => {
  const peticiones = [];
  const ctx = editor({ peticiones, respuestas: {
    'get /mcas/reglas/11/tabla': TABLA,
    'put /mcas/reglas/11/tabla': { firma: 'sha-2', valores: ENDESA_2_0TD },
  } });
  await ctx.cargar();
  ctx.cambiarCelda(0, 0, 0, '50,5');
  assert.equal(ctx.cambios, true);
  await ctx.guardar();
  const put = peticiones.find((p) => p.metodo === 'put');
  assert.ok(put, 'no se ha guardado');
  assert.equal(put.url, '/mcas/reglas/11/tabla');
  assert.equal(put.datos.firma, 'sha-1');
  assert.equal(put.datos.valores.length, 44);
  assert.equal(put.datos.valores[0].valorResultado, 50.5);
  assert.equal(ctx.firma, 'sha-2');
  assert.equal(ctx.cambios, false);
  assert.ok(ctx.emitidos.some(([evento]) => evento === 'guardado'));
});

test('si otra persona cambió la tabla (409) se pide recargar', async () => {
  const ctx = editor({
    respuestas: { 'get /mcas/reglas/11/tabla': TABLA },
    fallos: { put: { response: { status: 409, data: { error: 'La tabla ha cambiado' } } } },
  });
  await ctx.cargar();
  ctx.cambiarCelda(0, 0, 0, '50');
  await ctx.guardar();
  assert.equal(ctx.conflicto, true);
  assert.match(ctx.avisos.at(-1).text, /Otra persona cambió la tabla: recárguela/);
});

test('las incidencias del servidor (400) se marcan en su celda', async () => {
  const ctx = editor({
    respuestas: { 'get /mcas/reglas/11/tabla': TABLA },
    fallos: { put: { response: { status: 400, data: { error: 'La tabla no es válida', incidencias: [
      { idRegla: 11, regla: 'Endesa · pyme luz 2.0TD', orden: 4, mensaje: 'La celda 4 se solapa con la 2' },
    ] } } } },
  });
  await ctx.cargar();
  ctx.cambiarCelda(0, 0, 0, '47');
  await ctx.guardar();
  assert.equal(ctx.incidenciasServidor['0|1|1'], 'La celda 4 se solapa con la 2');
  assert.equal(ctx.claseCelda(0, 1, 1)['celda-con-error'], true);
  assert.equal(ctx.cambios, true, 'lo editado no se pierde');
});

test('fuera de borrador la tabla es de solo lectura', async () => {
  const peticiones = [];
  const ctx = editor({ peticiones, editable: false, ordenResaltado: 4, respuestas: { 'get /mcas/reglas/11/tabla': TABLA } });
  await ctx.cargar();
  ctx.cambiarCelda(0, 0, 0, '1');
  assert.equal(ctx.rejilla.celdas[0][0][0].valor, 46.8);
  await ctx.guardar();
  assert.equal(peticiones.filter((p) => p.metodo === 'put').length, 0);
  assert.equal(ctx.claseCelda(0, 1, 1)['celda-resaltada'], true, 'la celda de una incidencia se resalta');
  assert.match(plantilla(EDITOR), /:readonly="!editable"/);
});

test('la lista de reglas abre la rejilla con «Ver tabla»; ya no hay «Vista avanzada»', () => {
  const html = plantilla(ADMIN);
  assert.match(html, /title="Ver tabla"[^>]*@click="abrirMatriz\(r\)"/);
  assert.match(html, /<McasMatrizEditor/);
  assert.doesNotMatch(leer(ADMIN), /Vista avanzada|id: 'rangos'/);
  assert.doesNotMatch(plantilla(EDITOR), /Vista avanzada|vista-avanzada/);
  assert.doesNotMatch(html, /Valores de Rango/);
  assert.match(plantilla(EDITOR), /Pegar desde Excel/);
});
