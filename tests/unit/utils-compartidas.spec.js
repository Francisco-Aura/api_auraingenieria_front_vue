// Las funciones que estaban copiadas en varias pantallas viven ahora en src/utils. Aquí se
// comparan con las copias originales (pegadas tal cual) para asegurar que cada pantalla
// sigue enseñando exactamente el mismo texto.
const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { raiz } = require('./helpers/sfc');

const util = (nombre) => require(path.join(raiz, 'src/utils', nombre));
const { fechaES, fechaHoraES, fechaCortaES } = util('fechas.js');
const { cupsVisible, tipoCups, cupsRecortado } = util('cups.js');
const { textoPrioridad, nombreEstado, iconoEstadoTarea } = util('tareas.js');

const FECHAS = [null, undefined, '', 0, '2026-03-05', '2026-03-05T08:07:00', '2026-03-05T23:59:59Z',
  '2026-12-31T00:30:00', '2026-01-01T00:00:00.000+01:00', 1700000000000, new Date(2026, 0, 1, 9, 5),
  new Date('x'), 'texto', '2026-02-30', '31/12/2026', '2026-03-05 10:15:00', 'Invalid Date'];

function igualQue(original, nueva, valores) {
  for (const v of valores) assert.equal(nueva(v), original(v), `distinto para ${String(v)}`);
}

// ---- Copias originales de las pantallas ----
const OPCIONES_FECHA_HORA = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const original = {
  // TareaAuditoriaModal / TareaDetalleModal (formatearFecha y formatDate)
  fechaHoraGuion(fecha) { if (!fecha) return '-'; return new Date(fecha).toLocaleDateString('es-ES', OPCIONES_FECHA_HORA); },
  // CreaActualizaClientes.formatDateTime
  fechaHoraClientes(date) { if (!date) return '-'; return new Date(date).toLocaleString('es-ES', OPCIONES_FECHA_HORA); },
  // NotificacionesComponent.formatearFecha
  fechaHoraNotificaciones(fecha) { if (!fecha) return ''; return new Date(fecha).toLocaleString('es-ES', OPCIONES_FECHA_HORA); },
  // McasComponent.formatFechaHora
  fechaHoraMcas(v) { return v ? new Date(v).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; },
  // TareasComponent.formatearFecha / PuntoSuministro.getFechaFinUltimoContrato
  fechaTareas(fecha) { if (!fecha) return '-'; const valor = new Date(fecha); return Number.isNaN(valor.getTime()) ? String(valor) : FORMATO_FECHA.format(valor); },
  // McasComponent.formatFecha
  fechaMcas(v) { if (!v) return '—'; const fecha = new Date(v); return Number.isNaN(fecha.getTime()) ? String(fecha) : FORMATO_FECHA.format(fecha); },
  // ActualizarPuntoSuministro.formatFecha / CreaActualizaClientes.formatFecha
  fechaPunto(fecha) { if (!fecha) return ''; const fechaObj = new Date(fecha); return fechaObj.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }); },
  // ModalServicios / ModalContratos formatDate, Informes.formatearFecha
  fechaCorta(date) { if (!date) return ''; return new Date(date).toLocaleDateString('es-ES'); },
  // CreaActualizaClientes / PuntosSuministroCliente formatDate
  fechaCortaGuion(date) { if (!date) return '-'; return new Date(date).toLocaleDateString('es-ES'); },
  cupsValue(s, vacio) { if (s.cupsluz && s.cupsluz.trim() !== '') return s.cupsluz; if (s.cupsgas && s.cupsgas.trim() !== '') return s.cupsgas; return vacio; },
  tipoCups(s, vacio) { if (s.cupsluz && s.cupsluz.trim() !== '') return 'Luz'; if (s.cupsgas && s.cupsgas.trim() !== '') return 'Gas'; return vacio; },
  cupsDelPunto(p) { const cupsluz = p?.cupsluz?.trim() || ''; const cupsgas = p?.cupsgas?.trim() || ''; return cupsluz || cupsgas || ''; },
  prioridad(p) { switch (p) { case 0: return 'Urgente'; case 1: return 'Alta'; case 2: return 'Media'; case 3: return 'Baja'; default: return 'Normal'; } },
  estado(n) { if (!n) return ''; return n.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase()); },
  iconoTareas(estadoNombre) {
    const estado = estadoNombre ? estadoNombre.toLowerCase() : '';
    switch (estado) {
      case 'pendiente': case 'pending': return 'far fa-clock';
      case 'en progreso': case 'in progress': case 'progreso': return 'far fa-play-circle';
      case 'completada': case 'completed': case 'finalizada': return 'far fa-check-circle';
      case 'cancelada': case 'cancelled': return 'far fa-times-circle';
      case 'pausada': case 'paused': return 'far fa-pause-circle';
      case 'bloqueada': case 'blocked': return 'fas fa-lock';
      default: return 'fas fa-circle';
    }
  },
  iconoClientes(estadoNombre) {
    const estado = estadoNombre ? estadoNombre.toLowerCase() : '';
    switch (estado) {
      case 'pendiente': return 'far fa-clock';
      case 'en progreso': case 'progreso': return 'far fa-play-circle';
      case 'completada': case 'finalizada': return 'far fa-check-circle';
      case 'cancelada': return 'far fa-times-circle';
      case 'pausada': return 'far fa-pause-circle';
      case 'bloqueada': return 'fas fa-lock';
      default: return 'fas fa-circle';
    }
  },
};

test('fecha y hora: el mismo texto que las cinco copias anteriores', () => {
  igualQue(original.fechaHoraGuion, (v) => fechaHoraES(v), FECHAS);
  igualQue(original.fechaHoraClientes, (v) => fechaHoraES(v), FECHAS);
  igualQue(original.fechaHoraNotificaciones, (v) => fechaHoraES(v, ''), FECHAS);
  igualQue(original.fechaHoraMcas, (v) => fechaHoraES(v, '—'), FECHAS);
  assert.equal(fechaHoraES('2026-03-05T08:07:00'), '05/03/2026, 08:07');
});

test('fecha dd/mm/aaaa: el mismo texto que las copias anteriores', () => {
  igualQue(original.fechaTareas, (v) => fechaES(v), FECHAS);
  igualQue(original.fechaMcas, (v) => fechaES(v, '—'), FECHAS);
  igualQue(original.fechaPunto, (v) => fechaES(v, ''), FECHAS);
  assert.equal(fechaES('2026-03-05T08:07:00'), '05/03/2026');
});

test('fecha sin ceros delante: el mismo texto que las copias anteriores', () => {
  igualQue(original.fechaCorta, (v) => fechaCortaES(v), FECHAS);
  igualQue(original.fechaCortaGuion, (v) => fechaCortaES(v, '-'), FECHAS);
  assert.equal(fechaCortaES('2026-03-05T08:07:00'), '5/3/2026');
});

test('CUPS: el que se enseña, su tipo y el recortado, igual que antes', () => {
  const puntos = [{}, { cupsluz: null, cupsgas: null }, { cupsluz: '', cupsgas: '' }, { cupsluz: '   ', cupsgas: ' ES02 ' },
    { cupsluz: ' ES01 ', cupsgas: 'ES02' }, { cupsluz: 'ES01' }, { cupsgas: 'ES02' }, { cupsluz: '  ', cupsgas: '  ' }];
  for (const p of puntos) {
    for (const vacio of ['', '-']) {
      assert.equal(cupsVisible(p.cupsluz, p.cupsgas, vacio), original.cupsValue(p, vacio));
      assert.equal(tipoCups(p.cupsluz, p.cupsgas, vacio), original.tipoCups(p, vacio));
    }
    assert.equal(cupsRecortado(p), original.cupsDelPunto(p));
  }
  assert.equal(cupsRecortado(null), original.cupsDelPunto(null));
  assert.equal(cupsRecortado(undefined), original.cupsDelPunto(undefined));
});

test('tareas: prioridad, nombre e icono del estado, igual que antes', () => {
  for (const p of [0, 1, 2, 3, 4, -1, null, undefined, '0', '1', 'Alta', 1.5]) assert.equal(textoPrioridad(p), original.prioridad(p));
  const estados = [null, undefined, '', 'PENDIENTE', 'EN_PROGRESO', 'en progreso', 'Progreso', 'COMPLETADA', 'Finalizada',
    'CANCELADA', 'PAUSADA', 'BLOQUEADA', 'pending', 'In Progress', 'COMPLETED', 'cancelled', 'paused', 'blocked',
    'en_revision', 'constructor', 'toString', '__proto__', '  pendiente', 'ÁREA_ÚTIL'];
  for (const e of estados) {
    assert.equal(nombreEstado(e), original.estado(e));
    assert.equal(iconoEstadoTarea(e), original.iconoTareas(e), `icono lista ${e}`);
    assert.equal(iconoEstadoTarea(e, false), original.iconoClientes(e), `icono cliente ${e}`);
  }
  assert.equal(nombreEstado(7), original.estado(7));
});

const { leerDecimal } = util('numeros.js');
const { nombreComercializadora } = util('maestros.js');

test('números escritos a mano: igual que las dos copias anteriores (MCAS y contratos)', () => {
  const mcas = (v) => {
    if (v === null || v === undefined || String(v).trim() === '') return null;
    let texto = String(v).trim().replace(/\s/g, '');
    const ultimaComa = texto.lastIndexOf(',');
    const ultimoPunto = texto.lastIndexOf('.');
    if (ultimaComa >= 0 && ultimoPunto >= 0) {
      texto = ultimaComa > ultimoPunto ? texto.replace(/\./g, '').replace(',', '.') : texto.replace(/,/g, '');
    } else {
      texto = texto.replace(',', '.');
    }
    const n = Number(texto);
    return Number.isFinite(n) ? n : null;
  };
  const contratos = (v) => { const n = mcas(v); return n !== null && n >= 0 ? n : null; };
  const nuevaContratos = (v) => { const n = leerDecimal(v); return n !== null && n >= 0 ? n : null; };
  const valores = [null, undefined, '', '  ', 0, '0', '-0', '7,25', '7.25', '1.234,56', '1,234.56', '1.500', ' 12 ', '1 234,5',
    '-1', '-3,5', 'abc', '1,2,3', '1.2.3', 'Infinity', '1e3', 12.5, '0x10', ',5', '.5'];
  for (const v of valores) {
    assert.ok(Object.is(leerDecimal(v), mcas(v)), `MCAS ${String(v)}`);
    assert.ok(Object.is(nuevaContratos(v), contratos(v)), `contratos ${String(v)}`);
  }
});

test('nombre de la comercializadora: igual que antes en contratos y servicios', () => {
  const antes = (id, deProp, cargadas) => {
    if (!id || id === '') return 'Sin Comercializadora';
    let lista = deProp;
    if (!lista || !lista.length) lista = cargadas;
    if (!lista || !lista.length) return 'Comercializadora Desconocida';
    const c = lista.find((x) => x.id == id);
    return c ? c.nombre : 'Comercializadora Desconocida';
  };
  const a = [{ id: 1, nombre: 'Iberdrola' }, { id: 2, nombre: 'Endesa' }];
  const b = [{ id: 3, nombre: 'Naturgy' }];
  for (const listas of [[a, b], [[], b], [null, b], [undefined, undefined], [[], []], [a, null]]) {
    for (const id of [null, undefined, '', 0, 1, '2', 3, 9]) {
      assert.equal(nombreComercializadora(id, ...listas), antes(id, ...listas), `id ${id}`);
    }
  }
});
