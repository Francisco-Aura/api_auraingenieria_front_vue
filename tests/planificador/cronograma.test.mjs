import test from 'node:test'
import assert from 'node:assert/strict'
import {
  rangoDelProyecto, mesesDelRango, celdasDelRango, rangosDe, agruparPorFase, filasVisibles, puntosDeRuta, rutaRedondeada, calcularFlechas,
  inicioMinimo, calcularArrastre, ROW_H, BAR_H, ZOOMS, FIT
} from '../../src/utils/planificador/tareas/cronograma.js'
import { parseDate, DAY } from '../../src/utils/planificador/tareas/fechas.js'

const tarea = (id, inicio, fin, extra = {}) => ({ id, name: id, phase: '', position: 0, start: inicio, end: fin, progress: 0, milestone: false, depends_on: [], ...extra })

test('el rango incluye «hoy» solo si cae cerca del proyecto (a menos de 30 días) y deja margen alrededor', () => {
  const ts = [tarea('a', '2030-01-10', '2030-01-20')]
  const cerca = rangoDelProyecto(ts, parseDate('2030-01-25'))
  assert.equal(cerca.origin, parseDate('2030-01-07'), '3 días antes del inicio')
  assert.ok(cerca.days >= 28)
  const lejos = rangoDelProyecto(ts, parseDate('2035-06-01'))
  assert.equal(lejos.origin, parseDate('2030-01-07'), 'un «hoy» lejano no estira el rango')
  assert.equal(lejos.days, 28, 'mínimo de 28 días')
  const incluido = rangoDelProyecto(ts, parseDate('2030-01-02'))
  assert.equal(incluido.origin, parseDate('2029-12-30'), 'un «hoy» cercano anterior al inicio sí cuenta')
  assert.deepEqual(rangoDelProyecto([], parseDate('2030-01-10')), { origin: parseDate('2030-01-10') - 7 * DAY, days: 42 })
})

test('los meses del rango y sus columnas, y las celdas de cada día con fines de semana y lunes', () => {
  const origin = parseDate('2030-01-29')
  const meses = mesesDelRango(origin, 6)
  assert.equal(meses.length, 2)
  assert.deepEqual([meses[0].month, meses[0].from, meses[0].to], ['Enero', 0, 2])
  assert.deepEqual([meses[1].month, meses[1].from, meses[1].to], ['Febrero', 3, 5])
  const celdas = celdasDelRango(origin, 6) // martes 29 ene 2030 … domingo 3 feb
  assert.deepEqual(celdas.map((c) => c.weekend), [false, false, false, false, true, true])
  assert.equal(celdas[0].date, 29)
  assert.equal(celdasDelRango(parseDate('2030-01-28'), 1)[0].monday, true)
})

test('rangos de las tareas en días desde el origen, con el borrador del arrastre aplicado', () => {
  const ts = [tarea('a', '2030-01-10', '2030-01-12'), tarea('b', '2030-01-13', '2030-01-15')]
  const origin = parseDate('2030-01-07')
  const r = rangosDe(ts, null, origin)
  assert.deepEqual(r.get('a'), { start: 3, end: 5 })
  assert.deepEqual(rangosDe(ts, { id: 'b', start: 9, end: 11 }, origin).get('b'), { start: 9, end: 11 })
  assert.deepEqual(rangosDe(ts, { id: 'b', start: 9, end: 11 }, origin).get('a'), { start: 3, end: 5 })
})

test('las tareas se agrupan por fase en el orden de la plantilla, las sueltas como «Sin fase» y las filas siguen al plegado', () => {
  const ts = [tarea('a', '2030-01-10', '2030-01-12', { phase: 'F2', position: 4, progress: 100 }), tarea('b', '2030-01-01', '2030-01-03', { phase: 'F1', position: 1 }),
    tarea('c', '2030-01-04', '2030-01-06', { phase: 'F2', position: 5, progress: 50 }), tarea('d', '2030-01-02', '2030-01-02', { position: 9 })]
  const origin = parseDate('2030-01-01')
  const rangos = rangosDe(ts, null, origin)
  const grupos = agruparPorFase(ts, rangos)
  assert.deepEqual(grupos.map((g) => g.name), ['F1', 'F2', 'Sin fase'])
  const f2 = grupos[1]
  assert.equal(f2.progress, 75)
  assert.deepEqual([f2.start, f2.end], [3, 11])
  assert.deepEqual(filasVisibles(grupos, new Set()).map((f) => (f.kind === 'phase' ? 'F:' + f.group.name : f.task.id)), ['F:F1', 'b', 'F:F2', 'a', 'c', 'F:Sin fase', 'd'])
  assert.deepEqual(filasVisibles(grupos, new Set(['F2'])).map((f) => (f.kind === 'phase' ? 'F:' + f.group.name : f.task.id)), ['F:F1', 'b', 'F:F2', 'F:Sin fase', 'd'])
  // Sin ninguna fase, no hay filas de fase
  const sinFases = [tarea('x', '2030-01-01', '2030-01-02')]
  assert.deepEqual(filasVisibles(agruparPorFase(sinFases, rangosDe(sinFases, null, origin)), new Set()).map((f) => f.kind), ['task'])
})

test('la flecha sale del borde de la predecesora, baja a la fila de la sucesora y entra por su izquierda', () => {
  const pts = puntosDeRuta({ xStart: 0, x1: 100, y1: 18, x2: 140, y2: 54, fromMilestone: false })
  assert.deepEqual(pts, [[91, 28], [91, 54], [140, 54]])
  // Hacia arriba sale por el borde superior
  assert.deepEqual(puntosDeRuta({ xStart: 0, x1: 100, y1: 54, x2: 140, y2: 18, fromMilestone: false }), [[91, 44], [91, 18], [140, 18]])
  // Una sucesora que empieza antes de ese punto se rodea por el borde entre filas
  const rodeo = puntosDeRuta({ xStart: 0, x1: 100, y1: 18, x2: 50, y2: 54, fromMilestone: false })
  assert.equal(rodeo.length, 6)
  assert.deepEqual(rodeo[0], [100, 18])
  assert.deepEqual(rodeo[rodeo.length - 1], [50, 54])
  // Desde un hito sale del centro del rombo
  assert.equal(puntosDeRuta({ xStart: 80, x1: 100, y1: 18, x2: 140, y2: 54, fromMilestone: true })[0][0], 90)
})

test('la ruta redondea las esquinas con curvas cuadráticas', () => {
  const d = rutaRedondeada([[0, 0], [0, 40], [40, 40]], 5)
  assert.equal(d, 'M0,0 L0,35 Q0,40 5,40 L40,40')
  assert.equal(rutaRedondeada([[0, 0], [10, 0]]), 'M0,0 L10,0')
})

test('solo se dibujan las flechas de la tarea con el foco (o todas), y ninguna si una de las dos está plegada', () => {
  const ts = [tarea('a', '2030-01-01', '2030-01-03'), tarea('b', '2030-01-04', '2030-01-05', { depends_on: ['a'] }), tarea('c', '2030-01-06', '2030-01-07', { depends_on: ['b'] })]
  const rangos = rangosDe(ts, null, parseDate('2030-01-01'))
  const filaDe = new Map([['a', 0], ['b', 1], ['c', 2]])
  const base = { tareas: ts, rangos, filaDe, anchoDia: 10 }
  assert.equal(calcularFlechas({ ...base, foco: null, verTodas: false }).length, 0)
  assert.deepEqual(calcularFlechas({ ...base, foco: 'b', verTodas: false }).map((f) => f.key), ['a>b', 'b>c'])
  assert.deepEqual(calcularFlechas({ ...base, foco: 'a', verTodas: false }).map((f) => f.key), ['a>b'])
  assert.equal(calcularFlechas({ ...base, foco: null, verTodas: true }).length, 2)
  assert.equal(calcularFlechas({ ...base, foco: null, verTodas: true }).every((f) => f.focused === false), true)
  const plegada = new Map([['a', 0], ['c', 1]])
  assert.equal(calcularFlechas({ ...base, filaDe: plegada, foco: null, verTodas: true }).length, 0)
  const f = calcularFlechas({ ...base, foco: 'a', verTodas: false })[0]
  assert.equal(f.focused, true)
  // La punta termina en el inicio de la sucesora (columna 3 de b × 10 px) y en el centro de su fila
  assert.equal(f.head.startsWith(`30,${ROW_H + ROW_H / 2} `), true)
})

test('una tarea no puede empezar antes del día siguiente a que acaben sus predecesoras', () => {
  const ts = [tarea('a', '2030-01-01', '2030-01-05'), tarea('c', '2030-01-02', '2030-01-09'), tarea('b', '2030-01-08', '2030-01-09', { depends_on: ['a', 'c'] })]
  const origin = parseDate('2030-01-01')
  assert.equal(inicioMinimo(ts[2], ts, origin), 9, 'después de «c», que acaba el día 8 (índice 8)')
  assert.equal(inicioMinimo(ts[0], ts, origin), 0)
})

test('arrastrar mueve la barra entera (conserva la duración), o cambia solo un extremo, sin salirse de sus límites', () => {
  const d = { modo: 'move', start: 10, end: 14, minStart: 8 }
  assert.deepEqual(calcularArrastre(d, 30, 10, 100), { start: 13, end: 17 })
  assert.deepEqual(calcularArrastre(d, -100, 10, 100), { start: 8, end: 12 }, 'no antes de que acaben las predecesoras')
  assert.deepEqual(calcularArrastre(d, 5000, 10, 100), { start: 95, end: 99 }, 'ni más allá del final del rango')
  assert.deepEqual(calcularArrastre({ ...d, modo: 'start' }, 20, 10, 100), { start: 12, end: 14 })
  assert.deepEqual(calcularArrastre({ ...d, modo: 'start' }, 900, 10, 100), { start: 14, end: 14 }, 'no pasa del fin')
  assert.deepEqual(calcularArrastre({ ...d, modo: 'end' }, 20, 10, 100), { start: 10, end: 16 })
  assert.deepEqual(calcularArrastre({ ...d, modo: 'end' }, -900, 10, 100), { start: 10, end: 10 }, 'no antes del inicio')
  assert.deepEqual(calcularArrastre(d, 4, 10, 100), { start: 10, end: 14 }, 'menos de medio día no mueve nada')
})

test('los zoom son Día, Semana, Mes y Ajustar (el último ocupa el ancho disponible)', () => {
  assert.deepEqual(ZOOMS.map((z) => z.label), ['Día', 'Semana', 'Mes', 'Ajustar'])
  assert.equal(ZOOMS[FIT].px, 0)
  assert.ok(BAR_H < ROW_H)
})
