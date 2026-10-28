// Comisiones MCAS conforme a lo pedido por el cliente (29/09/2026) y ronda de
// usabilidad (30/09/2026): grupos de estado, siete columnas, advertencias en texto
// humano, calcular por número de contrato, «No procede», aprobación en lote y aviso
// al menú para el contador de pendientes.
process.env.TZ = process.env.TZ || 'Europe/Madrid';

const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { raiz, leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const MCAS = 'src/components/CRM_Module/MCAS/McasComponent.vue';
const importar = (ruta) => import(pathToFileURL(path.join(raiz, ruta)).href);

let compararValores;
let ESTADOS_PROPUESTA;
let GRUPOS_ESTADO;
let grupoEstadoMcas;
test.before(async () => {
  ({ compararValores } = await importar('src/utils/orden.js'));
  ({ ESTADOS_PROPUESTA, GRUPOS_ESTADO, grupoEstadoMcas } = await importar('src/components/CRM_Module/MCAS/mcasEstados.js'));
});

/** Texto visible de un trozo de plantilla (sin etiquetas ni espacios repetidos). */
const texto = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
/** Texto visible sin las interpolaciones {{ ... }} (nombres de métodos, variables...). */
const textoSinCodigo = (html) => texto(html.replace(/\{\{[\s\S]*?\}\}/g, ' '));
/** Etiquetas <button ...> completas, aunque los atributos lleven «>» dentro de las comillas. */
const botones = (html) => [...html.matchAll(/<button(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map((m) => m[0]);
const modalDetalle = () => {
  const tpl = plantilla(MCAS);
  return tpl.slice(tpl.indexOf('class="mcas-modal-overlay"'));
};
const filaListado = () => {
  const tpl = plantilla(MCAS);
  return tpl.slice(tpl.indexOf('v-for="p in propuestasPaginadas"'), tpl.indexOf('v-if="!propuestasPaginadas.length"'));
};
const piePlantilla = () => modalDetalle().slice(modalDetalle().indexOf('class="mcas-modal-footer"'));
/** Clase del primer icono que sigue a un texto de la plantilla (el del botón con ese título). */
const iconoTras = (html, marca) => {
  const m = html.match(new RegExp(`${marca}[\\s\\S]*?<i class="([^"]+)"`));
  assert.ok(m, `no se encuentra el icono tras ${marca}`);
  return m[1];
};

/**
 * Instancia de Comisiones MCAS con axios y SweetAlert falsos.
 * `guion`: respuestas de SweetAlert en orden (objeto o función que recibe las opciones);
 * sin guion, cada diálogo devuelve { isConfirmed: confirmado, value: motivo }.
 */
function comisiones({
  respuestas = {}, posts = [], gets = [], motivo = 'Importe pactado distinto', confirmado = true, guion = [], fallos = {},
} = {}) {
  const errores = [];
  const exitos = [];
  const confirmaciones = [];
  const avisosCambio = [];
  const consultas = [];
  const componente = cargarComponente(MCAS, {
    axios: {
      get: async (url, config) => {
        gets.push(url);
        consultas.push({ url, params: config?.params });
        if (fallos[url]) throw fallos[url];
        return { data: respuestas[url] ?? [] };
      },
      post: async (url, datos) => {
        posts.push({ url, datos });
        if (fallos[`POST ${url}`]) throw fallos[`POST ${url}`];
        const r = respuestas[`POST ${url}`];
        return { data: typeof r === 'function' ? r(datos) : (r ?? null) };
      },
    },
    compararValores,
    ESTADOS_PROPUESTA,
    GRUPOS_ESTADO,
    grupoEstadoMcas,
    NOMBRES_METODO: { FEE_PERCENTAGE: 'Porcentaje del FEE', FIXED_AMOUNT: 'Importe fijo' },
    COLORES_DIALOGO: { COLOR_CONFIRMAR: '#fcd700', COLOR_PELIGRO: '#d33' },
    confirmar: async (_swal, opciones) => { confirmaciones.push(opciones); return confirmado; },
    mostrarError: (_swal, _titulo, mensaje) => { errores.push(mensaje); },
    mostrarExito: (_swal, titulo, textoExito) => { exitos.push({ titulo, texto: textoExito }); },
    textoError: (_e, porDefecto) => porDefecto,
    avisarPropuestasCambiadas: () => { avisosCambio.push(true); },
  });
  const dialogos = [];
  const validaciones = [];
  const ctx = crearContexto(componente, {
    $swal: {
      fire: async (opciones) => {
        dialogos.push(opciones);
        const paso = guion.shift();
        if (typeof paso === 'function') return paso(opciones);
        return paso ?? { isConfirmed: confirmado, value: motivo };
      },
      isVisible: () => false,
      isLoading: () => false,
      showValidationMessage: (mensaje) => { validaciones.push(mensaje); },
      getPopup: () => null,
    },
  });
  return Object.assign(ctx, { dialogos, errores, exitos, confirmaciones, avisosCambio, consultas, validaciones, gets });
}

// ---------------------------------------------------------------------------
// Guía
// ---------------------------------------------------------------------------

test('la guía dice que rechazar abre la edición, que la revisión manual se completa a mano y cuándo usar «No procede»', () => {
  const guia = plantilla(MCAS).match(/<ol class="mcas-guia"[\s\S]*?<\/ol>/);
  assert.ok(guia, 'falta la guía de Comisiones MCAS');
  assert.doesNotMatch(guia[0], /no se crea nada/);
  const pasos = [...guia[0].matchAll(/<li class="mcas-guia-paso">([\s\S]*?)<\/li>/g)].map((m) => texto(m[1]));
  assert.equal(pasos.length, 3);
  assert.match(pasos[0], /Guarde el contrato con la pestaña «Comisión MCAS» completa/);
  assert.match(pasos[1], /Revise la propuesta/);
  assert.match(pasos[1], /regla publicada/);
  assert.match(pasos[1], /requiere revisión/);
  assert.match(pasos[2], /Si la rechaza, se abre la edición para corregir importe y pagos y crear el servicio/);
  assert.match(pasos[2], /revisión manual se completan igual/);
  assert.match(pasos[2], /«No procede»/);
});

// ---------------------------------------------------------------------------
// Estados agrupados (contrato de API: GRUPOS_ESTADO)
// ---------------------------------------------------------------------------

test('los estados se agrupan en los cinco grupos del contrato de API; «Superada» queda fuera', () => {
  assert.deepEqual(GRUPOS_ESTADO, [
    { id: 'aprobar', label: 'Por aprobar', estados: ['PENDIENTE_VALIDACION'] },
    { id: 'atencion', label: 'Necesita atención', estados: ['REQUIERE_DATOS', 'REQUIERE_REVISION_MANUAL', 'ERROR_CALCULO', 'DESACTUALIZADO', 'PENDIENTE_CALCULO'] },
    { id: 'correccion', label: 'En corrección', estados: ['RECHAZADO', 'EN_EDICION'] },
    { id: 'aprobada', label: 'Aprobada', estados: ['FINALIZADO_APROBADO', 'FINALIZADO_EDITADO'] },
    { id: 'cerrada', label: 'Cerrada sin comisión', estados: ['FINALIZADO_NO_COMISIONABLE', 'CANCELADO'] },
  ]);
  assert.equal(grupoEstadoMcas('PENDIENTE_VALIDACION').id, 'aprobar');
  assert.equal(grupoEstadoMcas('REQUIERE_DATOS').label, 'Necesita atención');
  assert.equal(grupoEstadoMcas('FINALIZADO_NO_COMISIONABLE').id, 'cerrada');
  assert.equal(grupoEstadoMcas('SUPERADO'), null);
  assert.equal(grupoEstadoMcas(undefined), null);
  assert.equal(grupoEstadoMcas('INVENTADO'), null);

  // Cada estado del catálogo está en un solo grupo, salvo «Superada», que no está en ninguno
  for (const { value } of ESTADOS_PROPUESTA) {
    const grupos = GRUPOS_ESTADO.filter((g) => g.estados.includes(value)).length;
    assert.equal(grupos, value === 'SUPERADO' ? 0 : 1, value);
  }
});

const DE_CADA_GRUPO = () => [
  { id: 1, estado: 'PENDIENTE_VALIDACION', nombreCliente: 'Panadería Núñez' },
  { id: 2, estado: 'REQUIERE_DATOS', nombreCliente: 'Bar Central' },
  { id: 3, estado: 'EN_EDICION', nombreCliente: 'Talleres Pérez' },
  { id: 4, estado: 'FINALIZADO_EDITADO', nombreCliente: 'Frutas Gómez' },
  { id: 5, estado: 'CANCELADO', nombreCliente: 'Ferretería Sol' },
  { id: 6, estado: 'SUPERADO', nombreCliente: 'Panadería Núñez' },
];

test('las tarjetas de resumen son los cinco grupos y cada una filtra la tabla', () => {
  const ctx = comisiones();
  assert.deepEqual(ctx.tarjetas.map((t) => t.label),
    ['Por aprobar', 'Necesita atención', 'En corrección', 'Aprobada', 'Cerrada sin comisión']);
  ctx.tarjetas.forEach((t, i) => {
    assert.equal(t.id, GRUPOS_ESTADO[i].id);
    assert.deepEqual(t.estados, GRUPOS_ESTADO[i].estados);
    assert.ok(t.icono && t.ayuda, `la tarjeta ${t.label} necesita icono y ayuda`);
  });

  ctx.propuestas = DE_CADA_GRUPO();
  assert.deepEqual(ctx.tarjetas.map((t) => ctx.contarEstados(t.estados)), [1, 1, 1, 1, 1]);

  ctx.seleccionarGrupo('atencion');
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [2]);
  ctx.seleccionarGrupo('atencion'); // segundo clic: quita el filtro
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [1, 2, 3, 4, 5]);

  const tpl = plantilla(MCAS);
  assert.match(tpl, /v-for="tarjeta in tarjetas"/);
  assert.match(tpl, /contarEstados\(tarjeta\.estados\)/);
});

test('las superadas solo se ven con el conmutador «Ver histórico»', () => {
  const ctx = comisiones();
  ctx.propuestas = DE_CADA_GRUPO();
  assert.equal(ctx.verHistorico, false);
  assert.ok(!ctx.propuestasFiltradas.some((p) => p.estado === 'SUPERADO'));
  assert.ok(!ctx.estadosDisponibles.some((e) => e.value === 'SUPERADO'), 'el filtro de estado tampoco la ofrece');

  ctx.verHistorico = true;
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [1, 2, 3, 4, 5, 6]);
  assert.ok(ctx.estadosDisponibles.some((e) => e.value === 'SUPERADO'));

  const cabecera = plantilla(MCAS).match(/<div class="table-header">[\s\S]*?<div class="table-responsive"/)[0];
  const conmutador = botones(cabecera).find((b) => /verHistorico = !verHistorico/.test(b));
  assert.ok(conmutador, 'falta el conmutador «Ver histórico»');
  assert.match(conmutador, /:aria-pressed="verHistorico \? 'true' : 'false'"/);
  assert.match(cabecera, /verHistorico \? 'Ocultar histórico' : 'Ver histórico'/);
});

test('el estado enseña el grupo y, debajo, el estado detallado', () => {
  const ctx = comisiones();
  assert.equal(ctx.etiquetaGrupo('REQUIERE_DATOS'), 'Necesita atención');
  assert.equal(ctx.tonoGrupo('REQUIERE_DATOS'), 'warning');
  assert.equal(ctx.tonoGrupo('PENDIENTE_VALIDACION'), 'primary');
  assert.equal(ctx.tonoGrupo('FINALIZADO_APROBADO'), 'success');
  assert.equal(ctx.detalleEstado({ estado: 'REQUIERE_DATOS' }), 'Faltan datos');
  assert.equal(ctx.detalleEstado({ estado: 'EN_EDICION' }), 'En edición');
  assert.equal(ctx.detalleEstado({ estado: 'FINALIZADO_EDITADO' }), 'Aprobada con edición');
  // Sin repetir lo que ya dice el grupo
  assert.equal(ctx.detalleEstado({ estado: 'PENDIENTE_VALIDACION' }), '');
  assert.equal(ctx.detalleEstado({ estado: 'FINALIZADO_APROBADO' }), '');
  // «Superada» no tiene grupo: se enseña tal cual
  assert.equal(ctx.etiquetaGrupo('SUPERADO'), 'Superada');
  assert.equal(ctx.tonoGrupo('SUPERADO'), 'neutral');
  assert.equal(ctx.detalleEstado({ estado: 'SUPERADO' }), '');

  const fila = filaListado();
  assert.match(fila, /<span class="badge" :class="'badge--' \+ tonoGrupo\(p\.estado\)">\{\{ etiquetaGrupo\(p\.estado\) \}\}<\/span>/);
  assert.match(fila, /<span v-if="detalleEstado\(p\)" class="celda-secundaria[^"]*">\{\{ detalleEstado\(p\) \}\}<\/span>/);
  const cabecera = modalDetalle().slice(0, modalDetalle().indexOf('mcas-modal-body'));
  assert.match(cabecera, /etiquetaGrupo\(propuestaDetalle\.estado\)/);
  assert.match(cabecera, /detalleEstado\(propuestaDetalle\)/);
});

// ---------------------------------------------------------------------------
// Listado (B6: siete columnas)
// ---------------------------------------------------------------------------

test('B6: la tabla tiene siete columnas con la de acciones fija; FEE, % y retrocesión pasan al detalle', () => {
  const tpl = plantilla(MCAS);
  assert.match(tpl, /<table class="data-table data-table--compacta data-table--acciones-fijas">/);
  const thead = tpl.slice(tpl.indexOf('<thead>'), tpl.indexOf('</thead>'));
  assert.equal((thead.match(/<th\b/g) || []).length, 7);
  const titulos = [...thead.matchAll(/<div class="column-title[^"]*"[^>]*>\s*<i[^>]*><\/i>([^<]+)/g)].map((m) => m[1].trim());
  assert.deepEqual(titulos, ['Cliente / CUPS', 'Contrato · Comercializadora', 'Importe', 'Estado', 'Fecha', 'Acciones']);
  // La primera columna es la casilla de «Seleccionar todas las visibles»
  const primera = thead.slice(thead.indexOf('<th'), thead.indexOf('</th>'));
  assert.match(primera, /type="checkbox"/);
  assert.match(primera, /aria-label="Seleccionar todas las visibles"/);
  assert.doesNotMatch(thead, /FEE|Retrocesión|Tipo</);
  // Filas de carga y de «sin resultados» con el mismo número de columnas
  assert.match(tpl, /<td v-for="col in 7" :key="col">/);
  assert.match(tpl, /<td colspan="7">/);

  const detalle = modalDetalle();
  for (const campo of ['feeEurMwh', 'porcentajeAplicacionFee', 'retrocesionPotencial']) {
    assert.match(detalle, new RegExp(`propuestaDetalle\\.${campo}`), `el detalle debe seguir enseñando ${campo}`);
  }
});

test('cada celda del listado tiene su dato principal y el secundario debajo', () => {
  const fila = filaListado();
  for (const campo of ['nombreCliente', 'cups', 'numeroContrato', 'nombreComercializadora', 'numeroPagos']) {
    assert.match(fila, new RegExp(`p\\.${campo}`), `la fila no muestra ${campo}`);
  }
  assert.match(fila, /formatImporte\(importeFila\(p\)\)/);
  // La renovación se marca con un icono junto al número de contrato
  assert.match(fila, /<i v-if="esRenovacion\(p\)" class="fas fa-sync-alt[^"]*"[^>]*title="Renovación"/);
  assert.match(fila, /:title="tituloContrato\(p\)"/);
  for (const campo of ['feeEurMwh', 'porcentajeAplicacionFee', 'retrocesionPotencial']) {
    assert.doesNotMatch(fila, new RegExp(`p\\.${campo}`), `${campo} ya no va en el listado`);
  }

  const ctx = comisiones();
  const titulo = ctx.tituloContrato({ id: 7, nombreComercializadora: 'IRIS ENERGIA, S.L.', nombreGestora: 'Gestora Norte', tipoEvento: 'RENOVACION' });
  assert.equal(titulo, 'IRIS ENERGIA, S.L. · Gestora: Gestora Norte · Renovación · Propuesta #7');
});

test('el porcentaje del FEE se enseña en % en el detalle', () => {
  const ctx = comisiones();
  assert.equal(ctx.formatPorcentaje(0.44), '44 %');
  assert.equal(ctx.formatPorcentaje(0.52), '52 %');
  assert.equal(ctx.formatPorcentaje(0.555), '55,5 %');
  assert.equal(ctx.formatFee(7), '7 €/MWh');
});

const LISTADO = () => [
  { id: 1, estado: 'PENDIENTE_VALIDACION', nombreCliente: 'Panadería Núñez', cups: 'ES0021000011111111AB0F',
    nombreComercializadora: 'IRIS ENERGIA, S.L.', feeEurMwh: 7, numeroContrato: 'CT-0003', importeAutomatico: 300 },
  { id: 2, estado: 'PENDIENTE_VALIDACION', nombreCliente: 'Talleres Pérez', cups: 'ES0031000022222222CD0F',
    nombreComercializadora: 'ENDESA ENERGIA S.A.U.', feeEurMwh: 12, numeroContrato: 'CT-0001', importeAutomatico: 100 },
  { id: 3, estado: 'REQUIERE_REVISION_MANUAL', nombreCliente: 'Bar Central', cups: null,
    nombreComercializadora: 'IRIS ENERGIA, S.L.', feeEurMwh: 4, numeroContrato: 'CT-0002', importeAutomatico: 200 },
  { id: 4, estado: 'REQUIERE_DATOS', idContrato: 99, nombreCliente: null, cups: null, nombreComercializadora: null, feeEurMwh: null },
];

test('el filtro de comercializadora está en la barra superior; en la tabla se filtra por cliente, CUPS o contrato', () => {
  const tpl = plantilla(MCAS);
  const cabecera = tpl.match(/<div class="table-header">[\s\S]*?<div class="table-responsive"/)[0];
  assert.match(cabecera, /<select v-model="filtroComercializadora" class="toolbar-select"/);
  assert.match(cabecera, /v-for="c in comercializadorasDisponibles"/);
  assert.match(cabecera, /Todas las comercializadoras/);
  const thead = tpl.slice(tpl.indexOf('<thead>'), tpl.indexOf('</thead>'));
  assert.doesNotMatch(thead, /comercializadora" class="column-filter"|columnFilters\.comercializadora/);
  assert.match(thead, /<input v-model="columnFilters\.cliente" type="text" class="column-filter" placeholder="Filtrar\.\.\."/);
  assert.match(thead, /<input v-model="columnFilters\.contrato" type="text" class="column-filter" placeholder="Filtrar\.\.\."/);

  const ctx = comisiones();
  ctx.propuestas = LISTADO();
  assert.deepEqual(ctx.comercializadorasDisponibles, ['ENDESA ENERGIA S.A.U.', 'IRIS ENERGIA, S.L.']);

  ctx.filtroComercializadora = 'IRIS ENERGIA, S.L.';
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [1, 3]);
  assert.equal(ctx.hayFiltros, true);
  ctx.filtroComercializadora = '';

  ctx.columnFilters.cliente = 'nunez';            // sin tildes ni mayúsculas
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [1]);
  ctx.columnFilters.cliente = '22222222';         // parte del CUPS
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [2]);
  ctx.columnFilters.cliente = '';

  ctx.columnFilters.contrato = 'ct-0002';          // número de contrato
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [3]);
  ctx.columnFilters.contrato = '99';               // id del contrato sin número
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [4]);
  ctx.columnFilters.contrato = 'endesa';           // la columna también enseña la comercializadora
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [2]);
});

test('las columnas se ordenan con el comparador común', () => {
  const ctx = comisiones();
  ctx.propuestas = LISTADO();
  ctx.sortOrder = 'asc';

  ctx.sortKey = 'nombreCliente';
  assert.deepEqual(ctx.propuestasOrdenadas.map((p) => p.id), [3, 1, 2, 4]);
  ctx.sortKey = 'numeroContrato';
  assert.deepEqual(ctx.propuestasOrdenadas.map((p) => p.id).slice(0, 3), [2, 3, 1]);
  ctx.sortKey = 'importe';
  assert.deepEqual(ctx.propuestasOrdenadas.map((p) => p.id), [2, 3, 1, 4]);
  // Por estado: en el orden de los grupos (Por aprobar, Necesita atención...)
  ctx.sortKey = 'estado';
  assert.deepEqual(ctx.propuestasOrdenadas.map((p) => p.id).slice(0, 2), [1, 2]);

  const tpl = plantilla(MCAS);
  for (const clave of ['nombreCliente', 'numeroContrato', 'importe', 'estado', 'creadoEn']) {
    assert.match(tpl, new RegExp(`@click="sortBy\\('${clave}'\\)"`), `no se ordena por ${clave}`);
  }
});

// ---------------------------------------------------------------------------
// A2 · Advertencias en texto humano
// ---------------------------------------------------------------------------

test('A2: las observaciones y el detalle usan las advertencias ya traducidas, no el JSON técnico', () => {
  const ctx = comisiones();
  assert.equal(ctx.observacion({ estado: 'REQUIERE_DATOS', advertencias: ['Falta el FEE del contrato', 'Otra'],
    advertenciasJson: '["tipo_precio_FIJO_o_INDEXADO"]' }), 'Falta el FEE del contrato');
  assert.equal(ctx.observacion({ estado: 'REQUIERE_DATOS', advertenciasJson: '["crudo"]' }), '');
  assert.equal(ctx.observacion({ estado: 'PENDIENTE_VALIDACION', advertencias: ['Aviso'] }), '');
  assert.equal(ctx.observacion({ estado: 'EN_EDICION', motivoRechazo: 'Importe pactado', advertencias: ['x'] }), 'Importe pactado');
  assert.equal(ctx.observacion({ estado: 'FINALIZADO_NO_COMISIONABLE', motivoRechazo: 'Menos de un año con Endesa' }),
    'Menos de un año con Endesa');

  ctx.propuestaDetalle = { advertencias: ['Falta el FEE del contrato'] };
  assert.deepEqual(ctx.advertenciasDetalle, ['Falta el FEE del contrato']);
  ctx.propuestaDetalle = { advertenciasJson: '["crudo"]' };
  assert.deepEqual(ctx.advertenciasDetalle, []);

  assert.doesNotMatch(leer(MCAS), /advertenciasJson/);
});

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

test('las propuestas en revisión manual se completan a mano y las rechazadas o en edición se editan, con iconos distintos', () => {
  const deFila = botones(filaListado());

  const completar = deFila.find((b) => /title="Completar manualmente"/.test(b));
  assert.ok(completar, 'falta el botón «Completar manualmente»');
  assert.match(completar, /v-if="admiteCompletar\(p\)"/);
  assert.match(completar, /class="btn-icon btn-edit"/);
  assert.match(completar, /aria-label="Completar manualmente"/);
  assert.match(completar, /@click="abrirEdicion\(p\)"/);

  const editar = deFila.find((b) => /title="Editar propuesta"/.test(b));
  assert.ok(editar, 'falta el botón «Editar propuesta»');
  assert.match(editar, /v-if="p\.estado === 'EN_EDICION' \|\| p\.estado === 'RECHAZADO'"/);
  assert.match(editar, /@click="editar\(p\)"/);

  // fa-edit y fa-pen-to-square son el mismo dibujo en Font Awesome 6
  const MISMO_DIBUJO = ['fas fa-edit', 'fas fa-pen-to-square'];
  const iconoCompletar = iconoTras(filaListado(), 'title="Completar manualmente"');
  const iconoEditar = iconoTras(filaListado(), 'title="Editar propuesta"');
  assert.notEqual(iconoCompletar, iconoEditar);
  assert.ok(!(MISMO_DIBUJO.includes(iconoCompletar) && MISMO_DIBUJO.includes(iconoEditar)), `${iconoCompletar} / ${iconoEditar}`);

  // El pie del detalle ofrece lo mismo, con los mismos iconos
  const pie = piePlantilla();
  assert.match(pie, /v-if="admiteCompletar\(propuestaDetalle\)"[\s\S]*?Completar manualmente/);
  assert.equal(iconoTras(pie, 'v-if="admiteCompletar\\(propuestaDetalle\\)"'), iconoCompletar);
  assert.equal(iconoTras(pie, `v-if="propuestaDetalle\\.estado === 'RECHAZADO'"`), iconoEditar);
});

test('aprobar y «No procede» dicen claramente lo que hacen', () => {
  const deFila = botones(filaListado());
  const aprobar = deFila.find((b) => /@click="aprobar\(p\)"/.test(b));
  assert.match(aprobar, /title="Aprobar y crear el servicio"/);
  assert.match(aprobar, /aria-label="Aprobar y crear el servicio"/);

  const noProcede = deFila.find((b) => /@click="descartar\(p\)"/.test(b));
  assert.ok(noProcede, 'falta «No procede» en la fila');
  assert.match(noProcede, /v-if="admiteNoProcede\(p\)"/);
  assert.match(noProcede, /title="No procede: cerrar sin comisión"/);
  assert.match(noProcede, /aria-label="No procede: cerrar sin comisión"/);
  assert.notEqual(iconoTras(filaListado(), '@click="descartar\\(p\\)"'), iconoTras(filaListado(), '@click="rechazar\\(p\\)"'));

  const pie = piePlantilla();
  const enPie = botones(pie).find((b) => /@click="descartar\(propuestaDetalle\)"/.test(b));
  assert.ok(enPie, 'falta «No procede» en el pie del detalle');
  assert.match(enPie, /v-if="admiteNoProcede\(propuestaDetalle\)"/);
  assert.match(pie, /<span>No procede<\/span>/);
});

test('rechazar pide el motivo, deja la propuesta en edición y la abre con el foco en el importe', async () => {
  const pendiente = {
    id: 5, idContrato: 40, numeroContrato: 'CT-2026-040', estado: 'PENDIENTE_VALIDACION', tipoEvento: 'NUEVO_CONTRATO',
    importeAutomatico: 120, importeDefinitivo: 120, numeroPagos: 2, admiteEdicionManual: false,
  };
  const enEdicion = { ...pendiente, estado: 'EN_EDICION', motivoRechazo: 'Importe pactado distinto' };
  const posts = [];
  const ctx = comisiones({
    posts,
    respuestas: { 'POST /mcas/propuestas/5/rechazar': enEdicion, '/mcas/propuestas/5': enEdicion, '/mcas/propuestas': [enEdicion] },
  });
  let enfocado = false;
  ctx.$refs.importeEdicion = { focus() { enfocado = true; } };
  const aperturas = [];
  const abrirDetalle = ctx.abrirDetalle;
  ctx.abrirDetalle = (p, opciones) => { aperturas.push(opciones); return abrirDetalle(p, opciones); };

  await ctx.rechazar(pendiente);

  const dialogo = ctx.dialogos[0];
  assert.match(dialogo.html, /La propuesta pasará a edición para que corrija el importe y los pagos y cree el servicio\./);
  assert.doesNotMatch(dialogo.html, /no generará servicio/);
  assert.deepEqual(posts, [{ url: '/mcas/propuestas/5/rechazar', datos: { motivo: 'Importe pactado distinto' } }]);
  assert.equal(aperturas[0]?.editar, true, 'el detalle debe abrirse en modo edición');
  assert.equal(ctx.propuestaDetalle.estado, 'EN_EDICION');
  assert.equal(ctx.editForm.importeDefinitivo, '120');
  assert.equal(ctx.editForm.numeroPagos, 2);
  assert.ok(enfocado, 'el foco debe ir al importe');
  assert.equal(ctx.avisoEdicion, 'Propuesta rechazada: corrija los valores y guarde para crear el servicio');
  assert.equal(ctx.dialogos.length, 1, 'no debe abrir otro diálogo encima del detalle');
  assert.equal(ctx.avisosCambio.length, 1, 'el menú debe actualizar el contador');
});

test('sin motivo o cancelando no se rechaza nada', async () => {
  const posts = [];
  const ctx = comisiones({ posts, confirmado: false });
  await ctx.rechazar({ id: 5, estado: 'PENDIENTE_VALIDACION' });
  assert.deepEqual(posts, []);
  assert.equal(ctx.propuestaDetalle, null);
  assert.equal(ctx.avisosCambio.length, 0);
});

test('completar manualmente abre la edición con el importe vacío y lo exige antes de crear el servicio', async () => {
  const manual = {
    id: 8, idContrato: 41, estado: 'REQUIERE_REVISION_MANUAL', admiteEdicionManual: true,
    importeAutomatico: null, importeDefinitivo: null, numeroPagos: null,
    advertencias: ['Renovación: importe manual'],
  };
  const edicion = { ...manual, estado: 'EN_EDICION', admiteEdicionManual: false };
  const posts = [];
  const ctx = comisiones({ posts, respuestas: { 'POST /mcas/propuestas/8/editar': edicion, '/mcas/propuestas/8': edicion } });
  let enfocado = false;
  ctx.$refs.importeEdicion = { focus() { enfocado = true; } };

  assert.equal(ctx.admiteCompletar(manual), true);
  assert.equal(ctx.admiteCompletar({ ...manual, estado: 'RECHAZADO' }), false);
  assert.equal(ctx.admiteCompletar({ ...manual, admiteEdicionManual: false }), false);

  await ctx.abrirEdicion(manual);
  assert.equal(posts[0].url, '/mcas/propuestas/8/editar');
  assert.equal(ctx.propuestaDetalle.estado, 'EN_EDICION');
  assert.equal(ctx.editForm.importeDefinitivo, '');
  assert.equal(ctx.editForm.numeroPagos, 1);
  assert.equal(ctx.sinImporteCalculado, true);
  assert.ok(enfocado);
  assert.equal(ctx.avisosCambio.length, 1, 'pasar a edición cambia los recuentos del menú');

  ctx.editForm.motivo = 'Importe de la comercializadora';
  await ctx.finalizarEdicion();
  assert.equal(posts.length, 1, 'no se envía sin importe');
  assert.equal(ctx.erroresEdicion.importeDefinitivo, 'Indique el importe definitivo de la comisión');

  ctx.editForm.importeDefinitivo = '-3';
  await ctx.finalizarEdicion();
  assert.equal(ctx.erroresEdicion.importeDefinitivo, 'Introduzca un importe válido (0 o superior)');

  ctx.editForm.importeDefinitivo = '95,50';
  await ctx.finalizarEdicion();
  assert.deepEqual(posts[1], {
    url: '/mcas/propuestas/8/finalizar-editado',
    datos: { importeDefinitivo: 95.5, numeroPagos: 1, motivo: 'Importe de la comercializadora' },
  });
  assert.equal(ctx.avisosCambio.length, 2);
});

test('«Editar» de una propuesta ya en edición abre el detalle sin volver a pedir la edición', async () => {
  const enEdicion = { id: 9, idContrato: 42, estado: 'EN_EDICION', importeAutomatico: 50, importeDefinitivo: 50, numeroPagos: 1 };
  const posts = [];
  const gets = [];
  const ctx = comisiones({ posts, gets, respuestas: { '/mcas/propuestas/9': enEdicion } });
  let enfocado = false;
  ctx.$refs.importeEdicion = { focus() { enfocado = true; } };

  await ctx.editar(enEdicion);
  assert.deepEqual(posts, []);
  assert.equal(ctx.propuestaDetalle.id, 9);
  assert.ok(enfocado);

  // Una rechazada de antes del cambio (sin pasar a edición) sí la pide
  const rechazada = { ...enEdicion, id: 10, estado: 'RECHAZADO' };
  const ctx2 = comisiones({ posts, respuestas: { '/mcas/propuestas/10': { ...rechazada, estado: 'EN_EDICION' } } });
  await ctx2.editar(rechazada);
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/10/editar']);
});

test('aprobar una propuesta crea el servicio y avisa al menú', async () => {
  const posts = [];
  const ctx = comisiones({ posts, respuestas: { 'POST /mcas/propuestas/3/aprobar': { id: 3, idServicioCreado: 55 } } });
  await ctx.aprobar({ id: 3, estado: 'PENDIENTE_VALIDACION' });
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/3/aprobar']);
  assert.equal(ctx.avisosCambio.length, 1);
  assert.match(ctx.exitos[0].texto, /servicio #55/);

  // Si falla no se avisa de ningún cambio
  const fallido = comisiones({ fallos: { 'POST /mcas/propuestas/3/aprobar': new Error('409') } });
  await fallido.aprobar({ id: 3, estado: 'PENDIENTE_VALIDACION' });
  assert.equal(fallido.avisosCambio.length, 0);
  assert.equal(fallido.errores.length, 1);
});

// ---------------------------------------------------------------------------
// A5 · Calcular propuesta por número de contrato
// ---------------------------------------------------------------------------

const CONTRATO_ENDESA = {
  id: 5001, numero: 'CT-2026-0412', cliente: 'Talleres Ejemplo, S.L.', cups: 'ES0031000022222222CD0F',
  comercializadora: 'ENDESA ENERGIA S.A.U.', fechaInicio: '2026-09-01',
};
const CONTRATO_IRIS = {
  id: 5002, numero: 'CT-2026-0413', cliente: 'Bar <Central>', cups: 'ES0021000011111111AB0F',
  comercializadora: 'IRIS ENERGIA, S.L.', fechaInicio: '2026-09-15',
};
/** Diálogo que ejecuta su preConfirm con lo que «escribe» el usuario, como hace SweetAlert. */
const escribir = (valor) => async (opciones) => {
  const resultado = await opciones.preConfirm(valor);
  return { isConfirmed: resultado !== false, value: resultado === false ? undefined : resultado };
};

test('A5: «Calcular propuesta» pide el número de contrato, lo busca y calcula el único que encuentra tras confirmarlo', async () => {
  const posts = [];
  const ctx = comisiones({
    posts,
    respuestas: {
      '/mcas/propuestas/buscar-contrato': [CONTRATO_ENDESA],
      'POST /mcas/propuestas/calcular-forzado/5001': { id: 77, idContrato: 5001, estado: 'PENDIENTE_VALIDACION' },
    },
    guion: [escribir(' CT-2026-0412 ')],
  });

  await ctx.calcularManual();

  const pedir = ctx.dialogos[0];
  assert.equal(pedir.input, 'text');
  assert.match(pedir.inputLabel, /Número de contrato/);
  assert.doesNotMatch(JSON.stringify(pedir), /ID del contrato|Introduce/);
  assert.ok(pedir.inputValidator('   '), 'el número es obligatorio');
  assert.equal(pedir.inputValidator('CT-1'), undefined);
  assert.deepEqual(ctx.consultas.find((c) => c.url === '/mcas/propuestas/buscar-contrato').params, { ref: 'CT-2026-0412' });

  assert.equal(ctx.confirmaciones.length, 1, 'con un único contrato se confirma');
  for (const dato of ['CT-2026-0412', 'Talleres Ejemplo, S.L.', 'ES0031000022222222CD0F', 'ENDESA ENERGIA S.A.U.']) {
    assert.ok(ctx.confirmaciones[0].texto.includes(dato), `la confirmación debe decir ${dato}`);
  }
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/calcular-forzado/5001']);
  assert.equal(ctx.avisosCambio.length, 1);
  assert.ok(ctx.gets.includes('/mcas/propuestas'), 'recarga la lista');
  assert.match(ctx.exitos[0].texto, /CT-2026-0412/);
});

test('A5: con varios contratos se elige de una lista con cliente, CUPS y comercializadora', async () => {
  const posts = [];
  const ctx = comisiones({
    posts,
    respuestas: { '/mcas/propuestas/buscar-contrato': [CONTRATO_ENDESA, CONTRATO_IRIS] },
    guion: [escribir('CT-2026'), { isConfirmed: true, value: 1 }],
  });

  await ctx.calcularManual();

  const eleccion = ctx.dialogos[1];
  assert.equal((eleccion.html.match(/type="radio"/g) || []).length, 2);
  for (const dato of ['CT-2026-0412', 'CT-2026-0413', 'Talleres Ejemplo, S.L.', 'ES0021000011111111AB0F', 'IRIS ENERGIA, S.L.']) {
    assert.ok(eleccion.html.includes(dato), `la lista debe enseñar ${dato}`);
  }
  assert.ok(eleccion.html.includes('Bar &lt;Central&gt;'), 'los nombres se escapan');
  assert.ok(!eleccion.html.includes('<Central>'));
  assert.equal(ctx.confirmaciones.length, 0, 'elegir de la lista ya es la confirmación');
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/calcular-forzado/5002']);

  // Sin marcar ninguno, la lista no se cierra
  ctx.$swal.getPopup = () => ({ querySelector: () => null });
  assert.equal(eleccion.preConfirm(), false);
  assert.match(ctx.validaciones.at(-1), /Elija un contrato/);
  ctx.$swal.getPopup = () => ({ querySelector: () => ({ value: '0' }) });
  assert.equal(eleccion.preConfirm(), 0);
});

test('A5: si no hay ningún contrato con ese número se dice sin cerrar el diálogo', async () => {
  const posts = [];
  const ctx = comisiones({ posts, respuestas: { '/mcas/propuestas/buscar-contrato': [] }, guion: [escribir('XX-1')] });
  await ctx.calcularManual();
  assert.match(ctx.validaciones[0], /No hay ningún contrato con ese número/);
  assert.deepEqual(posts, []);
  assert.equal(ctx.dialogos.length, 1);
});

// ---------------------------------------------------------------------------
// A6 · No procede
// ---------------------------------------------------------------------------

test('A6: «No procede» pide el motivo, avisa de que no se crea servicio y cierra la propuesta', async () => {
  const posts = [];
  const ctx = comisiones({
    posts,
    motivo: '  Estuvo menos de un año con Endesa  ',
    respuestas: { 'POST /mcas/propuestas/7/descartar': { id: 7, estado: 'FINALIZADO_NO_COMISIONABLE' } },
  });
  await ctx.descartar({ id: 7, estado: 'PENDIENTE_VALIDACION' });

  const dialogo = ctx.dialogos[0];
  assert.match(texto(dialogo.html), /La comisión se cerrará sin crear ningún servicio\. Podrá reabrirla con Recalcular\./);
  assert.equal(dialogo.input, 'textarea');
  assert.ok(dialogo.inputValidator('  '), 'el motivo es obligatorio');
  assert.equal(dialogo.inputValidator('Motivo'), undefined);
  assert.deepEqual(posts, [{ url: '/mcas/propuestas/7/descartar', datos: { motivo: 'Estuvo menos de un año con Endesa' } }]);
  assert.equal(ctx.avisosCambio.length, 1);
  assert.ok(ctx.gets.includes('/mcas/propuestas'), 'recarga la lista');
  assert.match(ctx.exitos[0].texto, /Recalcular/);
});

test('A6: cancelar «No procede» no cierra nada', async () => {
  const posts = [];
  const ctx = comisiones({ posts, confirmado: false });
  await ctx.descartar({ id: 7, estado: 'REQUIERE_DATOS' });
  assert.deepEqual(posts, []);
  assert.equal(ctx.avisosCambio.length, 0);
});

test('A6: «No procede» solo en Por aprobar, Necesita atención y En corrección', () => {
  const ctx = comisiones();
  const admite = (estado) => ctx.admiteNoProcede({ estado });
  for (const estado of ['PENDIENTE_VALIDACION', 'REQUIERE_DATOS', 'REQUIERE_REVISION_MANUAL', 'ERROR_CALCULO',
    'PENDIENTE_CALCULO', 'RECHAZADO', 'EN_EDICION']) {
    assert.equal(admite(estado), true, estado);
  }
  for (const estado of ['FINALIZADO_APROBADO', 'FINALIZADO_EDITADO', 'FINALIZADO_NO_COMISIONABLE', 'CANCELADO', 'SUPERADO']) {
    assert.equal(admite(estado), false, estado);
  }
  assert.equal(ctx.admiteNoProcede(null), false);
});

test('H2: una desactualizada no ofrece «No procede» (el servidor lo rechaza): se recalcula', () => {
  const ctx = comisiones();
  const desactualizada = { id: 9, estado: 'DESACTUALIZADO', ultimaDelContrato: true };
  assert.equal(ctx.admiteNoProcede(desactualizada), false);
  assert.equal(ctx.esRecalculable(desactualizada.estado), true);
  // Fila y pie del detalle deciden con la misma función
  assert.ok(botones(filaListado()).some((b) => /v-if="admiteNoProcede\(p\)"/.test(b) && /@click="descartar\(p\)"/.test(b)));
  assert.ok(botones(piePlantilla()).some((b) => /v-if="admiteNoProcede\(propuestaDetalle\)"/.test(b)));
});

test('H3: las desactualizadas que ya no son la última de su contrato se tratan como histórico', () => {
  const ctx = comisiones();
  ctx.propuestas = [
    { id: 1, estado: 'DESACTUALIZADO', ultimaDelContrato: false, tipoEvento: 'NUEVO_CONTRATO' },
    { id: 2, estado: 'DESACTUALIZADO', ultimaDelContrato: true, tipoEvento: 'NUEVO_CONTRATO' },
    { id: 3, estado: 'DESACTUALIZADO', tipoEvento: 'NUEVO_CONTRATO' },               // sin el campo: visible
    { id: 4, estado: 'REQUIERE_DATOS', ultimaDelContrato: false, tipoEvento: 'RENOVACION' }, // solo afecta a DESACTUALIZADO
    { id: 5, estado: 'SUPERADO', ultimaDelContrato: false, tipoEvento: 'NUEVO_CONTRATO' },
  ];
  const atencion = GRUPOS_ESTADO.find((g) => g.id === 'atencion').estados;

  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [2, 3, 4]);
  assert.equal(ctx.contarEstados(atencion), 3, 'la tarjeta «Necesita atención» no las cuenta');
  assert.equal(ctx.contarEvento(''), 3);
  assert.equal(ctx.contarEvento('NUEVO_CONTRATO'), 2);
  ctx.seleccionarGrupo('atencion');
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [2, 3, 4]);
  ctx.seleccionarGrupo('atencion');

  ctx.verHistorico = true;
  assert.deepEqual(ctx.propuestasFiltradas.map((p) => p.id), [1, 2, 3, 4, 5]);
  assert.equal(ctx.contarEstados(atencion), 4);
  assert.equal(ctx.contarEvento(''), 5);
});

test('A6: una cerrada sin comisión se reabre con «Recalcular», previa confirmación', async () => {
  const ctx = comisiones();
  assert.equal(ctx.esRecalculable('FINALIZADO_NO_COMISIONABLE'), true);
  assert.equal(ctx.esRecalculable('CANCELADO'), false);
  assert.equal(ctx.esRecalculable('FINALIZADO_APROBADO'), false);

  const posts = [];
  const cancelado = comisiones({ posts, confirmado: false });
  await cancelado.recalcular({ id: 7, estado: 'FINALIZADO_NO_COMISIONABLE' });
  assert.deepEqual(posts, []);
  assert.match(cancelado.confirmaciones[0].titulo, /Reabrir/);

  const confirmado = comisiones({ posts, respuestas: { 'POST /mcas/propuestas/7/recalcular': { id: 7, estado: 'PENDIENTE_VALIDACION' } } });
  await confirmado.recalcular({ id: 7, estado: 'FINALIZADO_NO_COMISIONABLE' });
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/7/recalcular']);
  assert.equal(confirmado.avisosCambio.length, 1);
});

// ---------------------------------------------------------------------------
// B5 · Aprobar en lote
// ---------------------------------------------------------------------------

const POR_APROBAR = () => [
  { id: 1, estado: 'PENDIENTE_VALIDACION', importeAutomatico: 411.84, nombreCliente: 'Panadería Núñez', numeroContrato: 'CT-1' },
  { id: 2, estado: 'PENDIENTE_VALIDACION', importeAutomatico: 120, importeDefinitivo: null, nombreCliente: 'Talleres Pérez', numeroContrato: 'CT-2' },
  { id: 3, estado: 'REQUIERE_DATOS', importeAutomatico: null, nombreCliente: 'Bar Central', numeroContrato: 'CT-3' },
];

test('B5: solo las filas por aprobar llevan casilla y se pueden marcar todas las visibles', () => {
  const fila = filaListado();
  assert.match(fila, /<input v-if="p\.estado === 'PENDIENTE_VALIDACION'" v-model="seleccionadas" type="checkbox"/);
  const thead = plantilla(MCAS).slice(plantilla(MCAS).indexOf('<thead>'), plantilla(MCAS).indexOf('</thead>'));
  assert.match(thead, /@change="alternarSeleccionVisibles\(\$event\.target\.checked\)"/);
  assert.match(thead, /title="Seleccionar todas las visibles"/);

  const ctx = comisiones();
  ctx.propuestas = POR_APROBAR();
  assert.deepEqual(ctx.seleccionablesVisibles.map((p) => p.id), [1, 2]);
  assert.equal(ctx.todasVisiblesSeleccionadas, false);

  ctx.alternarSeleccionVisibles(true);
  assert.deepEqual([...ctx.seleccionadas].sort(), [1, 2]);
  assert.equal(ctx.todasVisiblesSeleccionadas, true);
  assert.equal(ctx.estaSeleccionada({ id: 1 }), true);

  ctx.alternarSeleccionVisibles(false);
  assert.deepEqual(ctx.seleccionadas, []);

  // Una que no está por aprobar no cuenta aunque se cuele en la selección
  ctx.seleccionadas = [1, 3];
  assert.deepEqual(ctx.propuestasSeleccionadas.map((p) => p.id), [1]);
  // Ni una que los filtros han ocultado
  ctx.seleccionadas = [1, 2];
  ctx.columnFilters.cliente = 'nunez';
  assert.deepEqual(ctx.propuestasSeleccionadas.map((p) => p.id), [1]);
});

test('B5: «Aprobar seleccionadas» dice cuántas y el total, confirma, aprueba en lote y enseña el resultado de cada una', async () => {
  const posts = [];
  const ctx = comisiones({
    posts,
    respuestas: {
      'POST /mcas/propuestas/aprobar-lote': [
        { id: 1, ok: true, estado: 'FINALIZADO_APROBADO', mensaje: 'Servicio #55 creado' },
        { id: 2, ok: false, estado: 'DESACTUALIZADO', mensaje: 'El contrato ha cambiado <desde el cálculo>' },
      ],
      '/mcas/propuestas': [{ id: 1, estado: 'FINALIZADO_APROBADO' }, { id: 2, estado: 'DESACTUALIZADO' }],
    },
  });
  ctx.propuestas = POR_APROBAR();
  assert.equal(ctx.textoAprobarSeleccionadas, 'Aprobar seleccionadas');
  ctx.seleccionadas = [1, 2];
  assert.equal(ctx.textoAprobarSeleccionadas, 'Aprobar seleccionadas (2 · 531,84 €)');

  const cabecera = plantilla(MCAS).match(/<div class="table-header">[\s\S]*?<div class="table-responsive"/)[0];
  const boton = botones(cabecera).find((b) => /@click="aprobarSeleccionadas"/.test(b));
  assert.ok(boton, 'falta el botón «Aprobar seleccionadas»');
  assert.match(boton, /:disabled="accionando \|\| !propuestasSeleccionadas\.length"/);
  assert.match(cabecera, /\{\{ textoAprobarSeleccionadas \}\}/);

  await ctx.aprobarSeleccionadas();

  assert.match(ctx.confirmaciones[0].titulo, /2 propuestas/);
  assert.match(ctx.confirmaciones[0].texto, /531,84 €/);
  assert.deepEqual(posts, [{ url: '/mcas/propuestas/aprobar-lote', datos: { ids: [1, 2] } }]);
  const final = ctx.dialogos.at(-1);
  const visible = texto(final.html);
  assert.match(visible, /Aprobadas \(1\)/);
  assert.match(visible, /No aprobadas \(1\)/);
  assert.match(visible, /Panadería Núñez.*Servicio #55 creado/);
  assert.match(visible, /Talleres Pérez.*El contrato ha cambiado/);
  assert.ok(final.html.includes('&lt;desde el cálculo&gt;'), 'los mensajes del servidor se escapan');
  assert.equal(final.icon, 'warning');
  assert.ok(ctx.gets.includes('/mcas/propuestas'), 'recarga la lista');
  assert.deepEqual(ctx.seleccionadas, []);
  assert.equal(ctx.avisosCambio.length, 1);
});

test('B5: cancelar no aprueba nada y sin selección el botón no hace nada', async () => {
  const posts = [];
  const cancelado = comisiones({ posts, confirmado: false });
  cancelado.propuestas = POR_APROBAR();
  cancelado.seleccionadas = [1];
  await cancelado.aprobarSeleccionadas();
  assert.deepEqual(posts, []);

  const vacio = comisiones({ posts });
  vacio.propuestas = POR_APROBAR();
  await vacio.aprobarSeleccionadas();
  assert.deepEqual(posts, []);
  assert.equal(vacio.confirmaciones.length, 0);
});

test('B5: más de 200 seleccionadas se envían en varios lotes', async () => {
  const posts = [];
  const ctx = comisiones({
    posts,
    respuestas: { 'POST /mcas/propuestas/aprobar-lote': (datos) => datos.ids.map((id) => ({ id, ok: true, estado: 'FINALIZADO_APROBADO', mensaje: 'Servicio creado' })) },
  });
  ctx.propuestas = Array.from({ length: 250 }, (_, i) => ({ id: i + 1, estado: 'PENDIENTE_VALIDACION', importeAutomatico: 10 }));
  ctx.seleccionadas = ctx.propuestas.map((p) => p.id);
  await ctx.aprobarSeleccionadas();
  assert.deepEqual(posts.map((p) => p.datos.ids.length), [200, 50]);
  assert.equal(ctx.dialogos.at(-1).icon, 'success');
  assert.match(texto(ctx.dialogos.at(-1).html), /Aprobadas \(250\)/);
});

test('B5: al recargar se olvidan las seleccionadas que ya no están por aprobar', async () => {
  const ctx = comisiones({ respuestas: { '/mcas/propuestas': [{ id: 1, estado: 'FINALIZADO_APROBADO' }, { id: 2, estado: 'PENDIENTE_VALIDACION' }] } });
  ctx.seleccionadas = [1, 2, 9];
  await ctx.cargar();
  assert.deepEqual(ctx.seleccionadas, [2]);
});

// ---------------------------------------------------------------------------
// Detalle
// ---------------------------------------------------------------------------

test('el detalle sigue la maqueta del cliente: contrato, variables, regla, resultado, servicio, retrocesión e historial', () => {
  const titulos = [...modalDetalle().matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map((m) => m[1]);
  const esperados = ['Datos del contrato', 'Variables utilizadas', 'Regla aplicada', 'Resultado del cálculo',
    'Servicio a crear', 'Retrocesión potencial', 'Historial'];
  let anterior = -1;
  for (const esperado of esperados) {
    const i = titulos.findIndex((t, j) => j > anterior && t.includes(esperado));
    assert.ok(i > anterior, `«${esperado}» falta o está fuera de orden: ${titulos.join(' | ')}`);
    anterior = i;
  }
});

test('el detalle usa los datos del contrato que ya trae la propuesta, sin pedir el contrato aparte', async () => {
  const fuente = leer(MCAS);
  assert.doesNotMatch(fuente, /\/contratos\//);
  assert.doesNotMatch(fuente, /contratoDetalle/);

  const gets = [];
  const ctx = comisiones({ gets, respuestas: { '/mcas/propuestas/5': { id: 5, idContrato: 40, estado: 'PENDIENTE_VALIDACION' } } });
  await ctx.abrirDetalle({ id: 5, idContrato: 40, estado: 'PENDIENTE_VALIDACION' });
  assert.deepEqual(gets, ['/mcas/propuestas/5', '/mcas/propuestas/5/auditoria']);

  const detalle = modalDetalle();
  for (const campo of ['nombreCliente', 'cups', 'numeroContrato', 'nombreComercializadora', 'nombreGestora', 'tipoPrecio',
    'tipoSuministro', 'segmento', 'tarifaAcceso', 'productoComercial', 'codigoRegla', 'retrocesionPotencial']) {
    assert.match(detalle, new RegExp(`propuestaDetalle\\.${campo}`), `el detalle no muestra ${campo}`);
  }
  assert.match(detalle, /Tarifa de precios \(producto\)/);
});

test('las variables dicen de dónde sale la potencia y el consumo en kWh y MWh', () => {
  const ctx = comisiones();
  assert.equal(ctx.formatPotencia({ potenciaCalculoKw: 12.5, potenciaOrigen: 'MAYOR_CONTRATADA' }), '12,5 kW (mayor potencia contratada)');
  assert.equal(ctx.formatPotencia({ potenciaCalculoKw: 45, potenciaOrigen: 'CONTRATO' }), '45 kW (del contrato)');
  assert.equal(ctx.formatPotencia({ potenciaCalculoKw: null }), '—');
  assert.equal(ctx.formatConsumo(185475), '185.475 kWh (185,475 MWh)');
  assert.equal(ctx.formatConsumo(null), '—');
  assert.equal(ctx.formatFee(7), '7 €/MWh');
  assert.equal(ctx.conjuntoVersion({ codigoConjunto: 'IRIS-FIJO-20260304', versionConjunto: '2' }), 'IRIS-FIJO-20260304 · versión 2');
  assert.equal(ctx.conjuntoVersion({}), '—');
});

test('la regla aplicada enseña método y porcentaje, y si no hay regla el motivo en un aviso', () => {
  const detalle = modalDetalle();
  const regla = detalle.slice(detalle.indexOf('Regla aplicada'), detalle.indexOf('Resultado del cálculo'));
  assert.match(regla, /nombreMetodo\(propuestaDetalle\.metodoCalculo\)/);
  assert.match(regla, /formatPorcentaje\(propuestaDetalle\.porcentajeAplicacionFee\)/);
  assert.match(regla, /conjuntoVersion\(propuestaDetalle\)/);
  assert.match(regla, /v-for="\(a, i\) in advertenciasDetalle"/);
  assert.match(regla, /class="mcas-alert mcas-alert--warning"/);
});

test('sin jerga: «tabla de comisiones», regla con su nombre legible y los detalles técnicos plegados', () => {
  assert.doesNotMatch(textoSinCodigo(plantilla(MCAS)), /conjunto/i);
  for (const [, titulo] of plantilla(MCAS).matchAll(/\btitle="([^"]*)"/g)) assert.doesNotMatch(titulo, /conjunto/i);

  const detalle = modalDetalle();
  const regla = detalle.slice(detalle.indexOf('Regla aplicada'), detalle.indexOf('Resultado del cálculo'));
  assert.match(textoSinCodigo(regla), /Tabla de comisiones/);
  // El nombre legible delante; el código, debajo y solo si hay nombre
  assert.match(regla, /\{\{ nombreRegla\(propuestaDetalle\) \}\}/);
  assert.match(regla, /v-if="propuestaDetalle\.nombreRegla"[^>]*>\{\{ propuestaDetalle\.codigoRegla \}\}/);
  assert.match(regla, /v-if="propuestaDetalle\.nombreConjunto"[^>]*>\{\{ propuestaDetalle\.codigoConjunto \}\}/);

  const ctx = comisiones();
  assert.equal(ctx.nombreRegla({ nombreRegla: 'Iris · pyme luz', codigoRegla: 'IRIS-PYME-LUZ' }), 'Iris · pyme luz');
  assert.equal(ctx.nombreRegla({ codigoRegla: 'IRIS-PYME-LUZ' }), 'IRIS-PYME-LUZ');
  assert.equal(ctx.conjuntoVersion({ nombreConjunto: 'Iris 2026', codigoConjunto: 'IRIS-FIJO', versionConjunto: '2' }), 'Iris 2026 · versión 2');

  // La traza del motor solo se ve si se despliega
  assert.match(detalle, /<details class="detalle-traza">\s*<summary>[\s\S]*?Detalles técnicos \(para soporte\)\s*<\/summary>/);
  assert.doesNotMatch(detalle, /Traza técnica/);
});

test('el servicio a crear es un Switching con importe, pagos y calendario, o dice el servicio creado', () => {
  const detalle = modalDetalle();
  const servicio = detalle.slice(detalle.indexOf('Servicio a crear'), detalle.indexOf('Retrocesión potencial'));
  assert.match(servicio, /Switching/);
  assert.match(servicio, /Servicio #\{\{ propuestaDetalle\.idServicioCreado \}\} creado/);
  assert.match(servicio, /v-for="c in calendarioDetalle"/);

  const ctx = comisiones();
  ctx.propuestaDetalle = { estado: 'EN_EDICION', importeAutomatico: 120, importeDefinitivo: 120, numeroPagos: 1 };
  ctx.editForm = { importeDefinitivo: '150,5', numeroPagos: 3, motivo: '' };
  assert.equal(ctx.importeServicio, 150.5, 'en edición el servicio refleja el importe que se está escribiendo');
  assert.equal(ctx.pagosServicio, 3);
  ctx.propuestaDetalle = { estado: 'PENDIENTE_VALIDACION', importeAutomatico: 120, importeDefinitivo: null, numeroPagos: 2 };
  assert.equal(ctx.importeServicio, 120);
  assert.equal(ctx.pagosServicio, 2);
});

test('la retrocesión potencial siempre avisa de que no se descuenta en el alta', () => {
  const detalle = modalDetalle();
  const bloque = detalle.slice(detalle.indexOf('Retrocesión potencial'), detalle.indexOf('Historial'));
  assert.match(bloque, /propuestaDetalle\.retrocesionPotencial \|\| 'Sin política de retrocesión publicada'/);
  assert.match(texto(bloque), /No se descuenta en el alta: solo se aplicaría si el contrato causa baja anticipada/);
});

test('la edición explica qué hacer cuando no hay importe calculado', () => {
  const detalle = modalDetalle();
  assert.match(detalle, /ref="importeEdicion"/);
  assert.match(detalle, /Introduzca el importe que corresponde a esta comisión/);
  assert.match(detalle, /v-if="avisoEdicion"/);
});

test('el motivo de una cerrada con «No procede» se rotula como tal', () => {
  const ctx = comisiones();
  assert.equal(ctx.etiquetaMotivo({ estado: 'FINALIZADO_NO_COMISIONABLE' }), 'Motivo por el que no procede');
  assert.equal(ctx.etiquetaMotivo({ estado: 'EN_EDICION' }), 'Motivo de rechazo');
  assert.equal(ctx.etiquetaEvento('PROPUESTA_DESCARTADA'), 'No procede: cerrada sin comisión');
  assert.match(modalDetalle(), /\{\{ etiquetaMotivo\(propuestaDetalle\) \}\}/);
});

test('el componente solo usa campos de la propuesta que existen en el contrato de interfaz', () => {
  const PERMITIDOS = new Set([
    // McasPropuestaDTO de antes
    'id', 'idContrato', 'tipoEvento', 'estado', 'idConjuntoReglas', 'idPoliticaRetrocesion', 'hashContrato',
    'importeAutomatico', 'importeDefinitivo', 'numeroPagos', 'fechaPrimeraAplicacion', 'motivoRechazo',
    'advertenciasJson', 'trazaCalculoJson', 'instantaneaJson', 'datosNormalizadosJson', 'datosEditadosJson',
    'idServicioCreado', 'creadoPor', 'creadoEn', 'aprobadoPor', 'aprobadoEn', 'versionOptimista', 'lineas', 'calendario',
    // Campos nuevos (plan 2026-09-29, contrato de interfaz)
    'numeroContrato', 'idCliente', 'nombreCliente', 'cups', 'idComercializadora', 'nombreComercializadora',
    'idGestora', 'nombreGestora', 'tipoPrecio', 'tipoSuministro', 'segmento', 'esRenovacion', 'tarifaAcceso',
    'productoComercial', 'consumoAnualKwh', 'potenciaCalculoKw', 'potenciaOrigen', 'feeEurMwh',
    'porcentajeAplicacionFee', 'codigoRegla', 'metodoCalculo', 'codigoConjunto', 'versionConjunto',
    'retrocesionPotencial', 'actualizadoPor', 'actualizadoEn', 'admiteEdicionManual',
    // Ronda de usabilidad (contrato de API 2026-09-30): advertencias en texto humano y
    // nombres legibles de regla y tabla (texto o null; sin nombre se enseña el código)
    'advertencias', 'nombreRegla', 'nombreConjunto',
    // Revisión de código (H3): si es la propuesta más reciente de su contrato
    'ultimaDelContrato',
  ]);
  const fuente = leer(MCAS);
  const usados = new Set([...fuente.matchAll(/\b(?:p|propuestaDetalle)\??\.([A-Za-z]+)/g)].map((m) => m[1]));
  const desconocidos = [...usados].filter((c) => !PERMITIDOS.has(c));
  assert.deepEqual(desconocidos, []);
});

test('el desglose y el historial se leen en español, con tildes', () => {
  const ctx = comisiones();
  assert.equal(ctx.etiquetaLinea('ENERGIA'), 'Energía');
  assert.equal(ctx.etiquetaLinea('COMISION_BASE'), 'Comisión base');
  assert.equal(ctx.etiquetaLinea('AJUSTE'), 'Ajuste manual');
  assert.equal(ctx.etiquetaLinea('OTRO_CONCEPTO'), 'Otro concepto');
  assert.equal(ctx.etiquetaEvento('EDICION_ABIERTA'), 'Edición abierta');
  assert.equal(ctx.etiquetaEvento('PROPUESTA_FINALIZADA_EDITADA'), 'Servicio creado con edición');
  assert.equal(ctx.etiquetaEvento('PROPUESTA_APROBADA'), 'Aprobada y servicio creado');
  const detalle = modalDetalle();
  assert.match(detalle, /etiquetaLinea\(l\.tipoLinea\)/);
  assert.match(detalle, /etiquetaEvento\(a\.tipoEvento\)/);
});

test('los avisos de error de MCAS tienen el botón en español', () => {
  const dialogos = leer('src/components/CRM_Module/MCAS/mcasDialogs.js');
  const error = dialogos.match(/export function mostrarError[\s\S]*?\n\}/)[0];
  assert.match(error, /confirmButtonText: 'Aceptar'/);
});

test('los textos de la pantalla tratan de usted', () => {
  const fuente = leer(MCAS);
  for (const tuteo of [/\bcorrige\b/, /\bcorrijas\b/, /\bIntroduce\b/, /\bIndica\b/, /\bguarda para\b/, /\bcrees\b/]) {
    assert.doesNotMatch(fuente, tuteo);
  }
});

// ---------------------------------------------------------------------------
// Revisión de código (29/09/2026)
// ---------------------------------------------------------------------------

test('M1: una propuesta en edición que no se puede guardar se puede recalcular (queda superada y se calcula otra)', async () => {
  const ctx = comisiones();
  assert.equal(ctx.esRecalculable('EN_EDICION'), true);

  // Fila: el mismo botón «Recalcular» de siempre, que ahora también sale en edición
  assert.ok(botones(filaListado()).some((b) => /v-if="esRecalculable\(p\.estado\)"/.test(b) && /title="Recalcular"/.test(b)));

  // Pie: secundario y junto a «Guardar y crear servicio»
  const pie = piePlantilla();
  const recalcular = botones(pie).find((b) => /@click="recalcular\(propuestaDetalle\)"/.test(b));
  assert.match(recalcular, /v-if="esRecalculable\(propuestaDetalle\.estado\)"/);
  assert.match(recalcular, /:class="recalcularSecundario\(propuestaDetalle\) \? 'btn-info' : 'btn-save'"/);
  assert.ok(pie.indexOf('<span>Recalcular</span>') < pie.indexOf('<span>Guardar y crear servicio</span>'));
  assert.equal(ctx.recalcularSecundario({ estado: 'EN_EDICION' }), true);
  assert.equal(ctx.recalcularSecundario({ estado: 'REQUIERE_REVISION_MANUAL', admiteEdicionManual: true }), true);
  assert.equal(ctx.recalcularSecundario({ estado: 'DESACTUALIZADO' }), false);

  // En edición se descarta lo escrito: se pide confirmación antes
  const posts = [];
  const cancelado = comisiones({ posts, confirmado: false });
  await cancelado.recalcular({ id: 9, estado: 'EN_EDICION' });
  assert.deepEqual(posts, []);
  const confirmado = comisiones({ posts, respuestas: { 'POST /mcas/propuestas/9/recalcular': { id: 12, estado: 'PENDIENTE_VALIDACION' } } });
  await confirmado.recalcular({ id: 9, estado: 'EN_EDICION' });
  assert.deepEqual(posts.map((p) => p.url), ['/mcas/propuestas/9/recalcular']);
  assert.equal(confirmado.avisosCambio.length, 1);
});

test('M1: «Completar manualmente» solo sale si el servidor lo admite (no, si el contrato ya tiene comisión vigente)', () => {
  const ctx = comisiones();
  const conComisionVigente = { id: 3, estado: 'REQUIERE_REVISION_MANUAL', admiteEdicionManual: false };
  assert.equal(ctx.admiteCompletar(conComisionVigente), false);
  assert.equal(ctx.admiteCompletar({ ...conComisionVigente, admiteEdicionManual: true }), true);
  assert.equal(ctx.admiteCompletar({ id: 4, estado: 'ERROR_CALCULO' }), false, 'sin el campo no se ofrece');

  const completar = botones(piePlantilla()).find((b) => /@click="abrirEdicion\(propuestaDetalle\)"/.test(b) && /admiteCompletar/.test(b));
  assert.match(completar, /v-if="admiteCompletar\(propuestaDetalle\)"/);
});

test('B3: el desglose de una propuesta editada enseña el importe calculado y el definitivo (el ajuste manual no sale a 0,00 €)', () => {
  const ctx = comisiones();
  const base = { tipoLinea: 'COMISION_BASE', importeAutomatico: 120, importeDefinitivo: 150 };
  const ajuste = { tipoLinea: 'AJUSTE', importeAutomatico: 0, importeDefinitivo: 95.5 };

  ctx.propuestaDetalle = { estado: 'PENDIENTE_VALIDACION' };
  ctx.lineasDetalle = [{ ...base, importeDefinitivo: null }];
  assert.equal(ctx.desgloseEditado, false);

  ctx.propuestaDetalle = { estado: 'FINALIZADO_EDITADO' };
  ctx.lineasDetalle = [base];
  assert.equal(ctx.desgloseEditado, true);
  assert.equal(ctx.importeCalculadoLinea(base), 120);
  assert.equal(ctx.importeDefinitivoLinea(base), 150);

  ctx.lineasDetalle = [ajuste];
  assert.equal(ctx.desgloseEditado, true);
  assert.equal(ctx.importeCalculadoLinea(ajuste), null, 'el motor no calculó el ajuste manual');
  assert.equal(ctx.importeDefinitivoLinea(ajuste), 95.5);

  const detalle = modalDetalle();
  const resultado = detalle.slice(detalle.indexOf('Resultado del cálculo'), detalle.indexOf('Servicio a crear'));
  assert.match(resultado, /\{\{ desgloseEditado \? 'Calculado' : 'Importe' \}\}/);
  assert.match(resultado, /<th v-if="desgloseEditado" class="text-end">Definitivo<\/th>/);
  assert.match(resultado, /formatImporte\(importeCalculadoLinea\(l\)\)/);
  assert.match(resultado, /v-if="desgloseEditado"[^>]*>\{\{ formatImporte\(importeDefinitivoLinea\(l\)\) \}\}/);
  assert.doesNotMatch(resultado, /formatImporte\(l\.importeAutomatico\)/);
});
