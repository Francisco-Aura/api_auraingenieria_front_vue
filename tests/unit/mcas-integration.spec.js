const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('las llamadas MCAS respetan el baseURL global /api sin duplicarlo', () => {
  const sources = [
    'src/components/CRM_Module/MCAS/McasComponent.vue',
    'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
    'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue',
  ];

  for (const relativePath of sources) {
    const source = read(relativePath);
    const duplicated = [...source.matchAll(/axios\.(?:get|post|put|delete|patch)\(\s*([`'"])(\/api\/[^`'"]+)/g)]
      .map((match) => match[2]);
    assert.deepEqual(duplicated, [], `${relativePath} duplica /api en: ${duplicated.join(', ')}`);
  }
});

test('las tarjetas de resumen MCAS salen de los grupos de estado y cuentan por los value del catalogo', () => {
  const source = read('src/components/CRM_Module/MCAS/McasComponent.vue');
  assert.doesNotMatch(source, /kpi\.estado/);
  assert.match(source, /contarEstados\(tarjeta\.estados\)/);
  assert.match(source, /GRUPOS_ESTADO\.map\(/, 'las tarjetas deben construirse con los grupos compartidos');

  // Cada estado de un grupo debe existir en el catalogo de estados (mcasEstados.js).
  const estados = read('src/components/CRM_Module/MCAS/mcasEstados.js');
  const catalogo = new Set([...estados.matchAll(/\{ value: '([A-Z_]+)',\s+label:/g)].map((m) => m[1]));
  const bloqueGrupos = estados.slice(estados.indexOf('export const GRUPOS_ESTADO'), estados.indexOf('export function grupoEstadoMcas'));
  const agrupados = [...bloqueGrupos.matchAll(/'([A-Z][A-Z_]+)'/g)].map((m) => m[1]);
  assert.ok(agrupados.length > 0);
  for (const estado of agrupados) assert.ok(catalogo.has(estado), `${estado} no esta en el catalogo`);
});

test('las pantallas MCAS usan dialogos centrados del CRM, no toasts', () => {
  for (const relativePath of [
    'src/components/CRM_Module/MCAS/McasComponent.vue',
    'src/components/CRM_Module/MCAS/McasAdminComponent.vue',
    'src/components/CRM_Module/MCAS/mcasDialogs.js',
  ]) {
    assert.doesNotMatch(read(relativePath), /toast:\s*true/, `${relativePath} usa toasts`);
  }
});

test('el titulo de cabecera del dashboard cubre las dos rutas MCAS', () => {
  const dashboard = read('src/components/DashboardComponent.vue');
  assert.match(dashboard, /'\/dashboard\/mcas': 'Configuración MCAS'/);
  assert.match(dashboard, /'\/dashboard\/mcas-propuestas': 'Comisiones MCAS'/);
});

test('las dos pantallas MCAS quedan restringidas a administradores en menu y router', () => {
  const dashboard = read('src/components/DashboardComponent.vue');
  const router = read('src/router/index.js');
  assert.match(dashboard, /v-if="nivelAcceso === 1" to="\/dashboard\/mcas-propuestas"/);
  assert.match(router, /path: 'mcas'[\s\S]*?requiresAdmin: true/);
  assert.match(router, /path: 'mcas-propuestas'[\s\S]*?requiresAdmin: true/);
  assert.match(router, /to\.matched\.some\(record => record\.meta\.requiresAdmin\)/);
});

test('administracion solo ofrece publicar conjuntos ya validados', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /v-if="c\.estado === 'VALIDADO'"[^>]*title="Publicar tabla"/);
});

test('el configurador ofrece tablas de uno, dos o más datos y ya no la lista fila a fila', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /valor: 'MULTI_DIMENSION_LOOKUP', titulo: 'De más de dos'/);
  assert.match(source, /¿De cuántos datos del contrato depende el importe\?/);
  assert.doesNotMatch(source, /formRango|Vista avanzada|valores-rango/);
});

test('solo los borradores son editables en la administracion MCAS', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /:disabled="c\.estado !== 'BORRADOR'"[^>]*@click="abrirModalConjunto/);
  assert.match(source, /v-if="c\.estado === 'BORRADOR'"[^>]*title="Eliminar tabla"/);
  assert.match(source, /conjuntoParaReglas\.estado !== 'BORRADOR'/);
});

test('los productos se dan de baja (no se eliminan) y los inactivos se pueden reactivar', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /v-if="p\.activo"[^>]*title="Dar de baja"[^>]*@click="darDeBajaProducto\(p\)"/);
  assert.match(source, /:class="\{ 'fila-inactiva': !p\.activo \}"/);
  assert.match(source, /:title="p\.activo \? 'Editar producto' : 'Editar o reactivar producto'"/);
  assert.doesNotMatch(source, /eliminarProducto/);
});

test('las reglas se configuran solo con el formulario: sin JSON, sin código interno ni prioridad', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  for (const campo of ['tipo_suministro', 'segmento', 'es_renovacion', 'alta_nueva', 'codigo_producto', 'tarifa_acceso', 'zona_comision']) {
    assert.match(source, new RegExp(`v-model="editorRegla\\.condiciones\\.${campo}"`));
  }
  // El ámbito era lo mismo que la zona de comisión: ya no se elige en ningún sitio
  assert.doesNotMatch(source, /condiciones\.ambito|mcas-cond-ambito/);
  assert.match(source, /v-model="editorRegla\.calculo\.porcentaje"/);
  assert.match(source, /resumenReglaActual\.calcula/);
  assert.match(source, /class="metodo-opciones" role="radiogroup"/);
  assert.doesNotMatch(source, /Editar como JSON|Modo avanzado|condicionesJson" class|mcas-regla-prioridad|mcas-regla-codigo|Referencia en el documento/);
  assert.match(source, /async guardarRegla\(\) \{[\s\S]{0,200}\n {6}this\.volcarEditorEnJson\(\)/);
});

test('la vigencia de un conjunto validado o publicado se puede cerrar para publicar la version siguiente', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /v-if="c\.estado === 'VALIDADO' \|\| c\.estado === 'PUBLICADO'"[^>]*title="Cerrar vigencia/);
  assert.match(source, /axios\.post\(`\/mcas\/conjuntos-reglas\/\$\{c\.id\}\/cerrar-vigencia`, null, \{ params: \{ hasta \} \}\)/);
  assert.match(source, /escaparHtml\(c\.codigo\)/);
});

test('un conjunto se puede probar con un contrato real sin guardar nada', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /Probar con un contrato/);
  assert.match(source, /axios\.get\('\/mcas\/simulaciones', \{\s*params: \{ conjunto: this\.conjuntoParaReglas\.id, contrato: referencia \}/);
  assert.match(source, /No crea propuestas ni servicios/);
});

test('las reglas inactivas siguen visibles (atenuadas) en la administracion', () => {
  const source = read('src/components/CRM_Module/MCAS/McasAdminComponent.vue');
  assert.match(source, /'fila-inactiva': !r\.activo/);
  assert.match(source, /r\.activo \? 'Activa' : 'Inactiva'/);
});

test('productos MCAS se filtran con fecha del contrato y gestora (sin gestora elegida salen todos) y se revisan al cambiar dependencias', () => {
  const source = read('src/components/CRM_Module/PuntosSuministro/ModalContratos.vue');
  // Sin fecha de inicio se usa el día de hoy en hora local (no en UTC)
  assert.match(source, /const fechaContrato = this\.nuevoContrato\?\.fechaInicio \|\| fechaLocalISO\(\)/);
  assert.match(source, /p\.idGestora != null && idGestora !== null && idGestora !== undefined && idGestora !== ''\s*&& Number\(p\.idGestora\) !== Number\(idGestora\)/);
  for (const dependencia of ['mcasTipoPrecio', 'mcasTipoSuministro', 'mcasIdGestora', 'fechaInicio']) {
    assert.match(source, new RegExp(`'nuevoContrato\\.${dependencia}'`));
  }
});
