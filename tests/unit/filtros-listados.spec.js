// El filtrado de la cartera: mismo resultado, sin recorrer todos los campos cuando
// la caja de búsqueda está vacía (que es lo normal).
const assert = require('node:assert/strict');
const test = require('node:test');
const { cargarComponente, crearContexto } = require('./helpers/sfc');

const CLIENTES = 'src/components/CRM_Module/Clientes/ClientesComponent.vue';

const CARTERA = [
  { idCliente: 1, nombre: 'BODEGAS MONTEALTO, S.A.', cif: 'B12345678', nombreComercial: 'MONTEALTO',
    nombreSector: 'INDUSTRIA', direccionFiscal: 'CAMINO DEL PUERTO, Nº 3', usuarioAsignado: 'LUIS TÉCNICO',
    numeroPuntosSuministro: 1, fechaBaja: null },
  { idCliente: 2, nombre: 'PANADERÍA SAN ROQUE, S.L.', cif: 'B87654321', nombreComercial: 'SAN ROQUE',
    nombreSector: 'ALIMENTACIÓN', direccionFiscal: 'CALLE MAYOR, Nº 12', usuarioAsignado: 'ANA COMERCIAL',
    numeroPuntosSuministro: 2, fechaBaja: null },
  { idCliente: 3, nombre: 'CLARA TORRES VIDAL', cif: '12345678Z', nombreComercial: '',
    nombreSector: null, direccionFiscal: 'AVDA. DEL MEDITERRÁNEO, Nº 7', usuarioAsignado: 'LUIS TÉCNICO',
    numeroPuntosSuministro: 1, fechaBaja: '2026-01-10' },
];

const contexto = (extras = {}) => crearContexto(
  cargarComponente(CLIENTES, { axios: {} }),
  { clientes: CARTERA, filter: '', selectedSectores: [], mostrarClientesDadosDeBaja: false, ...extras });

const ids = (ctx) => ctx.filteredClientes.map(c => c.idCliente);

test('sin filtros se ven los clientes activos', () => {
  assert.deepEqual(ids(contexto()), [1, 2]);
});

test('la caja de búsqueda mira todos los campos', () => {
  assert.deepEqual(ids(contexto({ filter: 'mayor' })), [2]);
  assert.deepEqual(ids(contexto({ filter: 'B123' })), [1]);
  assert.deepEqual(ids(contexto({ filter: 'no existe' })), []);
});

test('los filtros de columna se combinan entre sí', () => {
  const ctx = contexto();
  ctx.columnFilters.nombre = 'panader';
  assert.deepEqual(ids(ctx), [2]);
  ctx.columnFilters.cif = 'B1';
  assert.deepEqual(ids(ctx), []);
});

test('el filtro de sector admite «Sin sector» y no se pisa con el de texto', () => {
  assert.deepEqual(ids(contexto({ selectedSectores: ['INDUSTRIA'] })), [1]);
  assert.deepEqual(ids(contexto({ selectedSectores: ['Sin sector'],
    mostrarClientesDadosDeBaja: true })), [3]);
});

test('el interruptor de bajas cambia el conjunto, no lo amplía', () => {
  assert.deepEqual(ids(contexto({ mostrarClientesDadosDeBaja: true })), [3]);
});

test('con la búsqueda vacía no se convierte a texto ningún campo', () => {
  const ctx = contexto();
  let conversiones = 0;
  const vigilado = CARTERA.map(c => new Proxy(c, {
    ownKeys(destino) { conversiones++; return Reflect.ownKeys(destino); },
  }));
  ctx.clientes = vigilado;

  ctx.filteredClientes;

  assert.equal(conversiones, 0, 'se está recorriendo cada fila entera sin necesidad');
});
