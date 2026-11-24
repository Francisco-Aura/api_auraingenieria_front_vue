/* Retrocesiones automáticas en Comisiones MCAS (duda 20 del cliente). */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, plantilla, leer } = require('./helpers/sfc');
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

const COMISIONES = 'src/components/CRM_Module/MCAS/McasComponent.vue';
const ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';

let retro;
test.before(async () => {
  retro = await importar('src/components/CRM_Module/MCAS/mcasRetrocesiones.js');
});

const VISTA = {
  retrocesion: {
    id: 7, idContrato: 31, estado: 'PENDIENTE', motivo: 'BAJA_PUNTO', diasActivo: 96,
    fechaInicio: '2026-03-16', fechaFin: '2026-06-20', importeComision: 100, importeCalculado: 100,
  },
  cliente: 'Talleres Ruiz', numeroContrato: 'C-100', cups: 'ES0031', comercializadora: 'Iberdrola', politica: '0–12 meses: 100 %',
};

test('la fila del servidor se aplana y lo que falta sale con un texto, nunca vacío', () => {
  const fila = retro.filaRetrocesion(VISTA);
  assert.equal(fila.id, 7);
  assert.equal(fila.cliente, 'Talleres Ruiz');
  assert.equal(fila.comercializadora, 'Iberdrola');
  const sinNombres = retro.filaRetrocesion({ retrocesion: { id: 8, idContrato: 44 } });
  assert.equal(sinNombres.cliente, '—');
  assert.equal(sinNombres.numeroContrato, 'Contrato #44');
});

test('motivo y estado se leen en castellano', () => {
  assert.equal(retro.motivoRetrocesion('BAJA_CONTRATO'), 'Baja del contrato');
  assert.equal(retro.motivoRetrocesion('BAJA_PUNTO'), 'Baja del punto de suministro');
  assert.equal(retro.motivoRetrocesion('CAMBIO_COMERCIALIZADORA'), 'Cambio de comercializadora');
  assert.deepEqual(retro.estadoRetrocesion('PENDIENTE'), { label: 'Por aprobar', tono: 'warning' });
  assert.equal(retro.estadoRetrocesion('DESCARTADA').label, 'No procede');
});

test('solo las pendientes cuentan como por aprobar', () => {
  const filas = [{ id: 1, estado: 'PENDIENTE' }, { id: 2, estado: 'APROBADA' }, { id: 3, estado: 'DESCARTADA' }];
  assert.deepEqual(retro.retrocesionesPendientes(filas).map((r) => r.id), [1]);
  assert.deepEqual(retro.retrocesionesPendientes(null), []);
});

test('el tiempo activo dice los días y entre qué fechas', () => {
  const texto = retro.tiempoActivo(VISTA.retrocesion, (f) => f.split('-').reverse().join('/'));
  assert.equal(texto, '96 días (16/03/2026 a 20/06/2026)');
  assert.match(retro.tiempoActivo({ ...VISTA.retrocesion, diasActivo: 1 }, (f) => f), /^1 día \(/);
});

test('el importe al aprobar: vacío usa el calculado, se puede corregir y nunca va en negativo', () => {
  const r = VISTA.retrocesion;
  assert.deepEqual(retro.leerImporteRetrocesion('', r), { importe: null });
  assert.deepEqual(retro.leerImporteRetrocesion('30,5', r), { importe: 30.5 });
  assert.deepEqual(retro.leerImporteRetrocesion('0', r), { importe: 0 });
  assert.match(retro.leerImporteRetrocesion('-5', r).error, /en positivo/);
  assert.match(retro.leerImporteRetrocesion('abc', r).error, /importe válido/);
  assert.match(retro.leerImporteRetrocesion('', { importeCalculado: null }).error, /no se ha podido calcular solo/);
  assert.equal(retro.importeRetrocesion({ importeCalculado: 100, importeDefinitivo: 30 }), 30);
  assert.equal(retro.importeRetrocesion({ importeCalculado: null }), null);
});

test('Comisiones MCAS enseña el panel de retrocesiones solo si hay alguna, con aprobar y no procede', () => {
  const html = plantilla(COMISIONES);
  assert.match(html, /<div v-if="retrocesiones\.length" id="mcas-retrocesiones" ref="panelRetrocesiones" class="card table-panel retro-panel">/);
  assert.match(html, /<div v-if="retrocesionesPorAprobar\.length" class="mcas-alert mcas-alert--warning retro-aviso"/);
  assert.match(html, /Retrocesiones por aprobar: \{\{ retrocesionesPorAprobar\.length \}\}/);
  assert.match(html, /No se devuelve nada hasta que la apruebe/);
  assert.match(html, /@click="aprobarRetrocesion\(r\)"/);
  assert.match(html, /@click="descartarRetrocesion\(r\)"/);
  const codigo = leer(COMISIONES);
  assert.match(codigo, /axios\.get\('\/mcas\/retrocesiones'\)/);
  assert.match(codigo, /\/mcas\/retrocesiones\/\$\{r\.id\}\/aprobar/);
  assert.match(codigo, /\/mcas\/retrocesiones\/\$\{r\.id\}\/descartar/);
});

test('Configuración MCAS deja claro para quién es cada pestaña: cuotas para todas, zonas solo Iberdrola', () => {
  const codigo = leer(ADMIN);
  assert.match(codigo, /id: 'cobros', label: 'Cobros y cuotas'/);
  assert.match(codigo, /<strong>Vale para todas las comercializadoras\.<\/strong>/);
  assert.match(codigo, /<strong>Solo para Iberdrola\.<\/strong>/);
  // Sin «quién gana a quién»: la comisión coge sola los pagos de su comercializadora
  assert.doesNotMatch(codigo, /ganan? a|gana la regla|Los de la regla \(o 1 pago\)/);
  assert.match(codigo, /codigo: 'MCAS_RETROCESSION_ENABLED', label: 'Retrocesión'/);
});
