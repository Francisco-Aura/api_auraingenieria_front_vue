import test from 'node:test'
import assert from 'node:assert/strict'
import { colocarMarcas } from '../../src/utils/planificador/colocarMarcas.js'

const W = 760
const H = 300
const limites = { x0: 60, x1: W - 18, y0: 20, y1: H - 32 }
const px = (x, max) => 58 + (x / max) * (W - 58 - 16)

// Puntos de una polilínea cada 4 px, como los reúne la gráfica
function curva(puntos) {
  const r = []
  for (let i = 0; i < puntos.length - 1; i++) {
    const [a, b] = [puntos[i], puntos[i + 1]]
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4))
    for (let k = 0; k <= n; k++) r.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
  }
  return r
}

function cajaDe(m) {
  const ancho = m.texto.length * 6.6
  const x0 = m.ancla === 'start' ? m.tx : m.ancla === 'end' ? m.tx - ancho : m.tx - ancho / 2
  return { x0, x1: x0 + ancho, y0: m.ty - 12, y1: m.ty + 4 }
}

const toca = (caja, pts) => pts.some((q) => q[0] >= caja.x0 && q[0] <= caja.x1 && q[1] >= caja.y0 && q[1] <= caja.y1)

test('«Recupera la inversión» no se escribe encima de la curva que cruza el cero', () => {
  // Balance acumulado: de −276 a +520 mil € en 25 años, cruza el cero en el año 10,6
  const py = (v) => 266 - ((v + 400) / 1000) * 242
  const pts = []
  for (let a = 0; a <= 25; a += 1) pts.push([px(a, 25), py(-276 + (a / 25) * 796 + 0.4 * a * (a - 12))])
  const obst = curva(pts)
  const [m] = colocarMarcas({ marcas: [{ x: 10.6, y: 0, texto: 'Recupera la inversión en 10,6 años', pos: 'der' }], px: (x) => px(x, 25), py, obstaculos: obst, limites })
  assert.equal(toca(cajaDe(m), obst), false, 'el texto no toca la curva')
  assert.ok(m.nota < 1000, 'cabe dentro del dibujo')
})

test('una marca en el borde izquierdo no se sale del dibujo ni tapa la línea', () => {
  const py = (v) => 266 - ((v - 20) / 15) * 240
  const pts = []
  for (let k = 0; k <= 60; k++) pts.push([px(k * 5, 300), py(27.6 + (k / 60) * 4.4)])
  const obst = curva(pts)
  const [m] = colocarMarcas({ marcas: [{ x: 0, y: 27.6, texto: '0 kWh · 27,6 %', pos: 'arr' }], px: (x) => px(x, 300), py, obstaculos: obst, limites })
  const caja = cajaDe(m)
  assert.ok(caja.x0 >= limites.x0, 'no pasa por encima de los números del eje')
  assert.equal(toca(caja, obst), false)
})

test('dos marcas cercanas no se pisan', () => {
  const py = () => 150
  const marcas = [{ x: 10, y: 0, texto: 'Primera etiqueta larga', pos: 'arr' }, { x: 11, y: 0, texto: 'Segunda etiqueta larga', pos: 'arr' }]
  const [a, b] = colocarMarcas({ marcas, px: (x) => px(x, 25), py, obstaculos: [], limites })
  const [ca, cb] = [cajaDe(a), cajaDe(b)]
  const separadas = ca.x1 < cb.x0 || cb.x1 < ca.x0 || ca.y1 < cb.y0 || cb.y1 < ca.y0
  assert.ok(separadas)
})

test('sin nada que esquivar respeta la posición pedida', () => {
  const [m] = colocarMarcas({ marcas: [{ x: 10, y: 5, texto: 'Hola', pos: 'arr' }], px: (x) => px(x, 25), py: () => 150, obstaculos: [], limites })
  assert.equal(m.ancla, 'middle')
  assert.equal(m.ty, 138)
})
