// Campana de notificaciones: un solo contador (rojo si algo vence hoy) que no tapa la campana,
// campana hueca sin nada pendiente, sin halos ni latidos, el foco de los demás botones y
// marcada mientras el panel está abierto.
const assert = require('node:assert/strict');
const test = require('node:test');
const { leer, plantilla, cargarComponente, crearContexto } = require('./helpers/sfc');

const COMPONENTE = 'src/components/CRM_Module/Tareas/NotificacionesComponent.vue';
const CSS = 'src/components/CRM_Module/Tareas/NotificacionesComponent.css';

function campana(noLeidas, vencenHoy) {
  const componente = cargarComponente(COMPONENTE, {
    tareasApi: {}, notificacionesPolling: {}, audioService: {}, fechaHoraES: () => '',
  });
  return crearContexto(componente, {
    contadorNoLeidas: noLeidas,
    tareasVenciendoHoyLista: Array.from({ length: vencenHoy }, (_, i) => ({ id: i + 1, titulo: 'Tarea ' + (i + 1) })),
  });
}

/** Reglas CSS cuyo selector contiene `selector` (texto de cada bloque). */
function reglas(css, selector) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, sel]) => sel.includes(selector))
    .map(([, sel, cuerpo]) => sel.trim() + ' {' + cuerpo + '}');
}

test('la campana lleva un solo contador: ya no hay un «!» aparte', () => {
  const html = plantilla(COMPONENTE);
  const inicio = html.indexOf('ref="botonCampana"');
  const boton = html.slice(inicio, html.indexOf('</button>', inicio));
  assert.doesNotMatch(html, /vencimiento-badge-urgente/);
  assert.equal((boton.match(/<span/g) || []).length, 1, 'un único <span> de contador dentro del botón');
  assert.match(boton, /notification-badge--urgente/);
});

test('el contador dice cuántas sin leer, «99+» como mucho, y «!» si solo hay vencimientos de hoy', () => {
  assert.equal(campana(4, 0).textoContadorCampana, '4');
  assert.equal(campana(4, 2).textoContadorCampana, '4');
  assert.equal(campana(120, 0).textoContadorCampana, '99+');
  assert.equal(campana(0, 2).textoContadorCampana, '!');
  assert.equal(campana(0, 0).textoContadorCampana, '');
  assert.equal(campana(4, 2).hayVencimientosHoy, true);
  assert.equal(campana(4, 0).hayVencimientosHoy, false);
});

test('campana hueca sin nada pendiente y llena cuando hay algo', () => {
  assert.equal(campana(0, 0).iconoCampana, 'far fa-bell');
  assert.equal(campana(3, 0).iconoCampana, 'fas fa-bell');
  assert.equal(campana(0, 1).iconoCampana, 'fas fa-bell');
});

test('el lector de pantalla y el título dicen lo que hay pendiente', () => {
  assert.equal(campana(0, 0).etiquetaCampana, 'Notificaciones');
  assert.equal(campana(4, 2).etiquetaCampana, 'Notificaciones: 4 sin leer · 2 tareas vencen hoy');
  assert.equal(campana(1, 1).etiquetaCampana, 'Notificaciones: 1 sin leer · 1 tarea vence hoy');
  assert.equal(campana(0, 3).etiquetaCampana, 'Notificaciones: 3 tareas vencen hoy');
  const html = plantilla(COMPONENTE);
  assert.match(html, /:aria-label="etiquetaCampana"/);
  assert.match(html, /:title="etiquetaCampana"/);
});

test('ni la campana ni el contador se mueven ni se ponen rojos con un halo', () => {
  const css = leer(CSS);
  assert.doesNotMatch(css, /campana-urgente/, 'la campana ya no se pinta de rojo ni late');
  assert.doesNotMatch(css, /@keyframes (pulse-urgente|pulse-scale-bell)/);
  for (const regla of reglas(css, '.notification-badge')) {
    assert.doesNotMatch(regla, /transform|scale\(/, regla);
    assert.doesNotMatch(regla, /box-shadow:\s*0 2px 8px/, 'sin el halo borroso: ' + regla);
  }
  const urgente = reglas(css, '.notification-badge--urgente').join('\n');
  assert.match(urgente, /background:\s*#dc2626/);
  const latido = css.match(/@keyframes aviso-urgente\s*\{([\s\S]*?)\n\}/);
  assert.ok(latido, 'el aviso urgente es un aro que se expande');
  assert.doesNotMatch(latido[1], /transform|scale/);
  assert.match(css, /prefers-reduced-motion: reduce\)\s*\{[^}]*notification-badge--urgente[^}]*animation:\s*none/);
});

test('el contador va por fuera, arriba a la derecha («99+» no tapa la campana)', () => {
  const css = leer(CSS);
  const base = reglas(css, '.notification-badge').filter(r => /^\.notificaciones-container \.notification-badge \{|^\.notification-badge \{/.test(r));
  assert.equal(base.length, 1, 'una sola regla base del contador (antes había dos que se pisaban)');
  assert.match(base[0], /left:\s*52%/);
  assert.match(base[0], /right:\s*auto/);
});

test('foco como el resto de botones y campana marcada con el panel abierto', () => {
  const css = leer(CSS);
  assert.match(reglas(css, '.notification-btn').join('\n'), /focus-visible[^{]*\{[^}]*var\(--aura-btn-foco/);
  assert.ok(reglas(css, '.notification-btn').some(r => r.includes('[aria-expanded="true"]')));
  const hover = reglas(css, '.notification-btn').filter(r => r.includes(':hover')).join('\n');
  assert.doesNotMatch(hover, /notification-orange/, 'al pasar el ratón ya no se pone naranja');
});
