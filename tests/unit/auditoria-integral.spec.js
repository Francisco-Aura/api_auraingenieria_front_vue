// Auditoría integral del 16/09/2026: incoherencias, alineación y código muerto.
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { raiz, leer, cargarComponente, crearContexto } = require('./helpers/sfc');

const CONTRATOS = 'src/components/CRM_Module/PuntosSuministro/ModalContratos.vue';
const SERVICIOS = 'src/components/CRM_Module/PuntosSuministro/ModalServicios.vue';
const MCAS = 'src/components/CRM_Module/MCAS/McasComponent.vue';
const MCAS_ADMIN = 'src/components/CRM_Module/MCAS/McasAdminComponent.vue';
const FORMULARIOS_CSS = 'src/styles/shared-modern-forms.css';

const VISTAS = [
  'src/components/CRM_Module/Administracion/AdministracionComponent.vue',
  'src/components/CRM_Module/Clientes/ClientesComponent.vue',
  'src/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue',
  'src/components/CRM_Module/Informes/InformesComponent.vue',
  MCAS, MCAS_ADMIN, CONTRATOS, SERVICIOS,
  'src/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue',
  'src/components/CRM_Module/Tareas/TareasComponent.vue',
];

const contratoMinimo = (extra = {}) => ({
  mcasTipoPrecio: 'FIJO', mcasTipoSuministro: 'LUZ', contrato: 'CT-1',
  fechaInicio: '2026-01-01', idComercializadoraActual: 3, ...extra,
});

const contextoContratos = (extras) => crearContexto(
  cargarComponente(CONTRATOS, { axios: {}, fechaLocalISO: () => '2026-09-16' }), extras);

test('renovar un contrato exige el tipo de renovación antes de prometer la comisión', () => {
  const ctx = contextoContratos({ nuevoContrato: contratoMinimo({ mcasEsRenovacion: true }) });

  assert.deepEqual(ctx.mcasFaltan, ['Tipo de renovación']);
  assert.equal(ctx.mcasListo, false);

  ctx.nuevoContrato.mcasTipoRenovacion = 'FIRMADA';
  assert.deepEqual(ctx.mcasFaltan, []);
  assert.equal(ctx.mcasListo, true);
});

test('en el modo renovación la comisión es de renovación aunque el desplegable esté vacío', () => {
  // El servidor fuerza mcasEsRenovacion=true al renovar: el aviso debe contarlo igual.
  const ctx = contextoContratos({ modoRenovacion: true, nuevoContrato: contratoMinimo() });

  assert.deepEqual(ctx.mcasFaltan, ['Tipo de renovación']);
});

test('un contrato nuevo no pide el tipo de renovación', () => {
  const ctx = contextoContratos({ nuevoContrato: contratoMinimo({ mcasEsRenovacion: false }) });

  assert.deepEqual(ctx.mcasFaltan, []);
});

test('el tipo de renovación se puede rellenar siempre que la comisión sea de renovación', () => {
  const fuente = leer(CONTRATOS);
  const grupo = fuente.match(/<div v-else-if="campo === 'mcasTipoRenovacion'"[^>]*>\s*<label for="mcasTipoRenovacion"><i class="fas fa-file-signature">/);
  assert.ok(grupo, 'no se encuentra el campo «Tipo de renovación»');
  // Qué campos se ven lo decide organizarCamposMcas (mcas-vista-previa.spec.js): el tipo
  // de renovación, siempre que la comisión sea de renovación (también en el modo renovación).
  assert.match(fuente, /organizarCamposMcas\(\{[^}]*esRenovacion: this\.esRenovacionMcas/);
});

test('el efecto del ratón en las cabeceras de tabla se define en un solo sitio', () => {
  // Cada pantalla tenía su propia versión (celda amarilla, título amarillo...).
  // La unificada vive en shared-ui.css; las locales solo pueden volver a romperla.
  const sobrantes = [];
  const recorrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(completa);
      else if (entrada.name.endsWith('.css')) {
        const texto = fs.readFileSync(completa, 'utf8');
        for (const [regla] of texto.matchAll(/^[^{\n]*(\.sortable:hover|\.column-title[^{\n]*:hover|\.sortable \.column-title)[^{\n]*\{/gm)) {
          sobrantes.push(`${path.relative(raiz, completa)}: ${regla.trim()}`);
        }
      }
    }
  };
  recorrer(path.join(raiz, 'src', 'components'));
  assert.deepEqual(sobrantes, []);
});

test('los desplegables y las cajas de texto de los modales tienen el mismo borde redondeado', () => {
  const compartido = leer(FORMULARIOS_CSS);
  assert.match(compartido, /\.form-select-modern \{/, 'form-select-modern debe vivir en los estilos compartidos');
  const radios = [...compartido.matchAll(/\.form-(control|select)-modern \{[^}]*border-radius: *([^;]+);/g)]
    .map(m => m[2].trim());
  assert.equal(radios.length, 2);
  assert.equal(radios[0], radios[1]);
  for (const ruta of ['src/components/CRM_Module/PuntosSuministro/ModalContratos.css',
    'src/components/CRM_Module/PuntosSuministro/ModalServicios.css']) {
    assert.doesNotMatch(leer(ruta), /^\.form-select-modern \{/m, `${ruta} duplica form-select-modern`);
  }
});

/** Etiquetas <button ...> completas, aunque los atributos lleven «>» dentro de las comillas. */
const botones = (texto) => [...texto.matchAll(/<button(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map(m => m[0]);

test('todos los botones de icono dicen a los lectores de pantalla lo que hacen', () => {
  const sinEtiqueta = [];
  for (const ruta of VISTAS) {
    for (const etiqueta of botones(leer(ruta))) {
      if (/class="btn-icon/.test(etiqueta) && !/aria-label/.test(etiqueta)) {
        sinEtiqueta.push(`${ruta}: ${etiqueta.replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    }
  }
  assert.deepEqual(sinEtiqueta, []);
});

test('la misma acción se llama igual en todas las tablas', () => {
  const titulos = new Set();
  for (const ruta of VISTAS) {
    for (const [, titulo] of leer(ruta).matchAll(/class="btn-icon [a-z-]+"[^>]*title="([^"{]+)"/g)) {
      titulos.add(titulo.trim());
    }
  }
  const repetidos = [...titulos].filter(t => [...titulos].some(o => o !== t && o.toLowerCase() === t.toLowerCase()));
  assert.deepEqual(repetidos, [], 'mismos textos escritos con mayúsculas distintas');
  // Mayúscula solo en la primera palabra; las siglas (PDF, CUPS, MCAS) no cuentan.
  const enTitulo = (t) => /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+ [A-ZÁÉÍÓÚ][a-záéíóúñ]/.test(t);
  assert.deepEqual([...titulos].filter(enTitulo), []);
});

test('los botones se escriben igual en toda la aplicación: mayúscula solo en la primera palabra', () => {
  const titulados = [];
  for (const ruta of VISTAS) {
    const plantilla = leer(ruta).split('<script')[0];
    for (const [, cuerpo] of plantilla.matchAll(/<button\b[\s\S]*?>([\s\S]*?)<\/button>/g)) {
      const texto = cuerpo.replace(/<[^>]*>/g, ' ').replace(/\{\{[\s\S]*?\}\}/g, ' ').replace(/\s+/g, ' ').trim();
      const palabras = texto.split(' ').filter(p => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p));
      if (palabras.length < 2 || texto.length > 40) continue;
      // Siglas enteras (PDF, MCAS, CUPS) y los nombres propios de los módulos,
      // escritos igual que en el menú lateral, son correctos.
      const NOMBRES_DE_MODULO = ['Puntos de Suministro', 'Cartera de Clientes', 'Comisiones MCAS'];
      if (NOMBRES_DE_MODULO.some(n => texto.includes(n))) continue;
      const enTitulo = palabras.slice(1).some(p => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(p));
      if (enTitulo) titulados.push(`${ruta}: ${texto}`);
    }
  }
  assert.deepEqual(titulados, []);
});

test('los títulos de sección de los formularios se escriben como los de MCAS', () => {
  // Excepciones: los nombres de los informes (salen en el Excel y el PDF) y los
  // nombres de pantalla del menú lateral.
  const NOMBRES_PROPIOS = /Informes|Gestión de Tareas|Puntos de Suministro|Cartera de Clientes|MCAS/;
  const titulados = [];
  for (const ruta of VISTAS) {
    if (ruta.includes('InformesComponent')) continue;
    const plantilla = leer(ruta).split('<script')[0];
    for (const [, cuerpo] of plantilla.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)) {
      const texto = cuerpo.replace(/<[^>]*>/g, ' ').replace(/\{\{[\s\S]*?\}\}/g, ' ').replace(/\s+/g, ' ').trim();
      const palabras = texto.split(' ').filter(p => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p));
      if (palabras.length < 2 || texto.length > 45 || NOMBRES_PROPIOS.test(texto)) continue;
      if (palabras.slice(1).some(p => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(p))) titulados.push(`${ruta}: ${texto}`);
    }
  }
  assert.deepEqual(titulados, []);
});

test('el título de una tarea se recorta con puntos suspensivos, como el nombre de cliente', () => {
  // El <td class="text-truncate"> no recorta si dentro hay un flex: el texto se
  // cortaba a medias («Revisar fa») y sin los puntos suspensivos.
  const plantilla = leer('src/components/CRM_Module/Tareas/TareasComponent.vue');
  assert.match(plantilla, /<span class="titulo-texto">\{\{ tarea\.titulo \}\}<\/span>/);
  const css = leer('src/components/CRM_Module/Tareas/TareasComponent.css');
  const bloque = (selector) => {
    const b = css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').find(x => x.split('{')[0].trim().endsWith(selector));
    assert.ok(b, `falta ${selector}`);
    return b;
  };
  assert.match(bloque('.titulo-container'), /min-width: *0/);
  assert.match(bloque('.titulo-texto'), /text-overflow: *ellipsis/);
  assert.match(bloque('.titulo-texto'), /overflow: *hidden/);
});

test('los campos de los formularios se rotulan igual en todas las pantallas', () => {
  // Convención mayoritaria de la app: «Tipo de precio», no «Tipo de Precio».
  const SIGLAS_Y_NOMBRES = /^(Maps|Aura|CUPS|APM|APP|KW|IP|PDF|MCAS|GO|OC|BIE|FV|P\d)$/;
  const titulados = [];
  for (const ruta of VISTAS) {
    const plantilla = leer(ruta).split('<script')[0];
    for (const [, cuerpo] of plantilla.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/g)) {
      // Cada trozo de texto suelto es un rótulo: un <label> puede llevar varios.
      for (const trozo of cuerpo.split(/<[^>]*>|\{\{[\s\S]*?\}\}/)) {
        const texto = trozo.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim();
        const palabras = texto.split(' ').filter(p => /^[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(p));
        if (palabras.length < 2 || texto.length > 45) continue;
        const malo = palabras.slice(1).find(p => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(p)
          && !SIGLAS_Y_NOMBRES.test(p.replace(/[^\wÁÉÍÓÚÑáéíóúñ]/g, '')));
        if (malo) titulados.push(`${ruta}: ${texto}`);
      }
    }
  }
  assert.deepEqual(titulados, []);
});

test('los diálogos no llevan colores sueltos: el estilo lo pone la hoja compartida', () => {
  const fuentes = [];
  const recorrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(completa);
      else if (/\.(vue|js)$/.test(entrada.name)) fuentes.push(completa);
    }
  };
  recorrer(path.join(raiz, 'src'));

  const colores = new Map();
  for (const archivo of fuentes) {
    const texto = fs.readFileSync(archivo, 'utf8');
    for (const [, prop, valor] of texto.matchAll(/(confirmButtonColor|cancelButtonColor|denyButtonColor): *'([^']+)'/g)) {
      colores.set(`${prop}:${valor}`, (colores.get(`${prop}:${valor}`) || 0) + 1);
    }
  }
  const cancelaciones = [...colores.keys()].filter(k => k.startsWith('cancelButtonColor'));
  assert.deepEqual(cancelaciones, [], 'cancelButtonColor no pinta nada: lo sobreescribe shared-buttons.css');
  const confirmaciones = [...colores.keys()].filter(k => k.startsWith('confirmButtonColor'));
  assert.ok(confirmaciones.length <= 2,
    `la confirmación debe usar un solo color (y el rojo de borrar): ${confirmaciones.join(' | ')}`);
});

test('no quedan hojas de estilo sueltas que nadie importa', () => {
  const huerfanas = [];
  const fuentes = [];
  const recorrer = (dir) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      if (entrada.isDirectory()) recorrer(completa);
      else fuentes.push(completa);
    }
  };
  recorrer(path.join(raiz, 'src'));
  // También cuenta el @import desde otra hoja (el modo oscuro se carga así desde App.css)
  const codigo = fuentes.filter(f => /\.(vue|js)$/.test(f)).map(f => fs.readFileSync(f, 'utf8'))
    .concat(fuentes.filter(f => f.endsWith('.css')).map(f => (fs.readFileSync(f, 'utf8').match(/@import[^;]+;/g) || []).join('\n')))
    .join('\n');
  for (const hoja of fuentes.filter(f => f.endsWith('.css'))) {
    if (!codigo.includes(path.basename(hoja))) huerfanas.push(path.relative(raiz, hoja));
  }
  assert.deepEqual(huerfanas, []);
});

test('los botones del detalle de tarea usan el mismo estilo que el resto de la aplicación', () => {
  // Eran los únicos que quedaban con relleno saturado, texto blanco y salto al
  // pasar el ratón: el estilo que se sustituyó por el Material limpio.
  const css = leer('src/styles/shared-buttons.css');
  assert.match(css, /\.btn-action-compact:not\(#aura-boton\)/,
    'shared-buttons.css debe cubrir también .btn-action-compact');
  const bloque = css.replace(/\/\*[\s\S]*?\*\//g, '').split('}')
    .find(b => b.split('{')[0].includes('.btn-action-compact:not(#aura-boton)') && b.includes('height'));
  assert.ok(bloque, 'falta la base de .btn-action-compact');
  assert.match(bloque, /height: *var\(--aura-btn-alto\)/);
  assert.match(bloque, /border-radius: *var\(--aura-btn-radio\)/);
  assert.match(bloque, /transform: *none/);

  const modal = leer('src/components/CRM_Module/Tareas/TareaDetalleModal.css');
  assert.doesNotMatch(modal, /\.btn-completar-compact \{[^}]*background: *var\(--color-success\)/,
    'el color lo pone la hoja compartida');
});

test('Comisiones MCAS lee los importes con separador de miles igual que el FEE del contrato', () => {
  const mcas = cargarComponente(MCAS, {});
  const contratos = cargarComponente(CONTRATOS, {});
  const leer = (v) => mcas.methods.normalizarDecimal.call({}, v);
  const fee = (v) => contratos.methods.normalizarDecimalMcas.call({}, v);
  for (const [entrada, esperado] of [['1.234,56', 1234.56], ['1,234.56', 1234.56], ['7,25', 7.25], ['1.500', 1.5], [' 12 ', 12]]) {
    assert.equal(leer(entrada), esperado, entrada);
    assert.equal(fee(entrada), esperado, entrada);
  }
  assert.equal(leer(''), null);
  assert.equal(leer('abc'), null);
  assert.equal(leer('-3,5'), -3.5, 'el signo lo valida quien llama, como antes');
});
