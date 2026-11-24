// Dónde escribir el texto de cada marca de una gráfica (por ejemplo «Recupera la inversión en 10,6 años»): se prueban varias posiciones
// alrededor del punto y se elige la que no toca nada de lo dibujado, no se sale del área y no pisa otra etiqueta. Si ninguna queda limpia,
// la menos mala; a igualdad, la que pidió la gráfica (`pos`).

const PX_POR_CARACTER = 6.6

/** Las posiciones posibles de un texto alrededor del punto (px, py): [nombre, x, y de la línea base, ancla]. */
function posiciones(px, py) {
  return [['der', px + 10, py + 4, 'start'], ['izq', px - 10, py + 4, 'end'], ['arr', px, py - 12, 'middle'], ['aba', px, py + 21, 'middle'],
    ['arr-der', px + 6, py - 12, 'start'], ['arr-izq', px - 6, py - 12, 'end'], ['aba-der', px + 6, py + 22, 'start'], ['aba-izq', px - 6, py + 22, 'end']]
}

/**
 * @param marcas     [{ x, y, texto, pos }] en las unidades de la gráfica
 * @param px, py     convierten x e y de la gráfica a píxeles
 * @param obstaculos puntos [x, y] por los que pasa algo dibujado
 * @param limites    { x0, x1, y0, y1 } área donde cabe el texto
 * @returns las marcas con `tx`, `ty` y `ancla` (text-anchor) para pintarlas
 */
export function colocarMarcas({ marcas, px, py, obstaculos, limites }) {
  const puestas = []
  return marcas.map((m) => {
    const x0 = px(m.x)
    const y0 = py(m.y)
    const ancho = String(m.texto).length * PX_POR_CARACTER
    const base = posiciones(x0, y0)
    const pedida = base.findIndex((c) => c[0] === (m.pos || 'der'))
    let mejor = null
    base.forEach(([, x, y, ancla], i) => {
      const caja = { x0: ancla === 'start' ? x : ancla === 'end' ? x - ancho : x - ancho / 2, y0: y - 12, y1: y + 4 }
      caja.x1 = caja.x0 + ancho
      let nota = i === pedida ? 0 : i + 1
      if (caja.x0 < limites.x0 || caja.x1 > limites.x1 || caja.y0 < limites.y0 || caja.y1 > limites.y1) nota += 1000
      for (const q of obstaculos) if (q[0] >= caja.x0 - 3 && q[0] <= caja.x1 + 3 && q[1] >= caja.y0 - 2 && q[1] <= caja.y1 + 2) nota += 10
      for (const o of puestas) if (caja.x0 < o.x1 + 4 && caja.x1 > o.x0 - 4 && caja.y0 < o.y1 + 2 && caja.y1 > o.y0 - 2) nota += 60
      if (!mejor || nota < mejor.nota) mejor = { nota, caja, x, y, ancla }
    })
    puestas.push(mejor.caja)
    return { ...m, tx: mejor.x, ty: mejor.y, ancla: mejor.ancla, nota: mejor.nota }
  })
}
