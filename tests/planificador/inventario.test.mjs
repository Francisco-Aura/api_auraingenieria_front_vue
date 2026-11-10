import test from 'node:test'
import assert from 'node:assert/strict'
import { cuerpoDe, formularioDe, principalDe, problemaDe, necesitaRevision, destacadas } from '../../src/utils/planificador/formularioEquipo.js'
import { esValorVacio, leerClaveExtra, claveExtra, grupoDeNombre, agruparFilas } from '../../src/utils/planificador/caracteristicas.js'
import { valoresDistintos, diasDesde, nombreProducto, fechaCorta } from '../../src/utils/planificador/formato.js'

const categoriaModulos = {
  key: 'modulos',
  filters: [{ key: 'potencia_wp', label: 'Potencia (Wp)' }, { key: 'tecnologia', label: 'Tecnología' }],
  specs: [{ key: 'voc_v', label: 'Voc (V)' }]
}

const producto = {
  id: 'a', category: 'modulos', brand: 'AIKO', model: 'AIKO 615', supplier: 'SUMEBA', unit: 'módulo', unit_price: 76.15,
  stock: 2.5, notes: '', offers: [{ supplier: 'SUMEBA', price: 76.15, ref: 'R1', note: '' }],
  attrs: { potencia_wp: 615, tecnologia: 'N-type', voc_v: 56, 'x:Otras::Peso': '20' }, price_reviewed_at: '2026-10-01'
}

test('el formulario separa las características de la categoría de las adicionales', () => {
  const f = formularioDe(producto, categoriaModulos)
  assert.equal(f.attrs.potencia_wp, '615')
  assert.equal(f.extras.length, 1)
  assert.deepEqual({ g: f.extras[0].grupo, n: f.extras[0].nombre }, { g: 'Otras', n: 'Peso' })
  assert.equal(f.offers[0].price, '76,15', 'el precio se enseña con coma')
  assert.equal(f.stock, '2,5')
})

test('el cuerpo vuelve a números, conserva las claves adicionales y toma el precio del principal', () => {
  const f = formularioDe(producto, categoriaModulos)
  f.offers[0].price = '80,5'
  f.attrs.potencia_wp = '620'
  f.extras.push({ clave: null, grupo: 'Compatibilidad', nombre: ' Batería ', valor: 'sí' })
  const c = cuerpoDe(f)
  assert.equal(c.unit_price, 80.5)
  assert.equal(c.supplier, 'SUMEBA')
  assert.equal(c.attrs.potencia_wp, 620)
  assert.equal(c.attrs['x:Otras::Peso'], 20)
  assert.equal(c.attrs['x:Compatibilidad::Batería'], 'sí')
  assert.equal(c.stock, 2.5)
})

test('si el principal ya no está en las ofertas, pasa a ser el primero', () => {
  const f = formularioDe(producto, categoriaModulos)
  f.principal = 'OTRO'
  assert.equal(principalDe(f), 'SUMEBA')
  f.offers = []
  assert.equal(principalDe(f), '')
  assert.equal(cuerpoDe(f).unit_price, 0)
})

test('problemaDe avisa de lo mismo que el Planificador actual', () => {
  const f = formularioDe(producto, categoriaModulos)
  assert.equal(problemaDe(f), null)
  assert.equal(problemaDe({ ...f, category: '' }), 'Elige una categoría.')
  assert.equal(problemaDe({ ...f, brand: '', model: ' ' }), 'Indica al menos la marca o el modelo.')
  assert.equal(problemaDe({ ...f, offers: [{ supplier: 'A', price: 'x', ref: '' }] }), 'Algún precio no es un número válido.')
  assert.equal(problemaDe({ ...f, offers: [{ supplier: '', price: '3', ref: '' }] }), 'Elige el proveedor de cada precio.')
  assert.equal(problemaDe({ ...f, offers: [{ supplier: 'A', price: '1', ref: '' }, { supplier: 'A', price: '2', ref: '' }] }), 'Un proveedor está repetido.')
  assert.equal(problemaDe({ ...f, stock: '-1' }), 'El stock tiene que ser un número igual o mayor que 0.')
})

test('un precio se da por revisar nunca o a los 15 días; sin precio no hay nada que revisar', () => {
  const hoy = new Date(2026, 10, 5)
  assert.equal(necesitaRevision({ unit_price: 1, price_reviewed_at: '2026-10-22' }, 15, hoy), false)
  assert.equal(necesitaRevision({ unit_price: 1, price_reviewed_at: '2026-10-21' }, 15, hoy), true)
  assert.equal(necesitaRevision({ unit_price: 1, price_reviewed_at: null }, 15, hoy), true)
  assert.equal(necesitaRevision({ unit_price: 0, price_reviewed_at: null }, 15, hoy), false)
})

test('la tarjeta enseña los filtros con su unidad y cuenta el resto', () => {
  const { datos, mas } = destacadas(producto, categoriaModulos, esValorVacio)
  assert.deepEqual(datos.map((d) => [d.label, d.value]), [['Potencia', '615 Wp'], ['Tecnología', 'N-type']])
  assert.equal(mas, 2)
})

test('grupos de características: por nombre, por clave guardada y agrupadas', () => {
  assert.equal(grupoDeNombre('Grado de protección IP65'), 'Entorno y refrigeración')
  assert.equal(grupoDeNombre('Eficiencia máxima'), 'Potencia y rendimiento')
  assert.equal(grupoDeNombre('Cosa rara'), 'Otras')
  assert.deepEqual(leerClaveExtra('x:Tensión de red'), { grupo: 'Entrada y salida eléctrica', nombre: 'Tensión de red' })
  assert.deepEqual(leerClaveExtra(claveExtra('Documentos', ' Guía ')), { grupo: 'Documentos', nombre: 'Guía' })
  assert.equal(esValorVacio('—'), true)
  assert.equal(esValorVacio(0), false)
  const g = agruparFilas([{ grupo: 'Otras' }, { grupo: 'Documentos' }, { grupo: 'Otras' }])
  assert.deepEqual(g.map((x) => [x.grupo, x.filas.length]), [['Documentos', 1], ['Otras', 2]])
})

test('utilidades de formato', () => {
  assert.deepEqual(valoresDistintos([{ a: '10' }, { a: '9' }, { a: '' }, { a: undefined }, { a: '9' }], (p) => p.a), ['9', '10'])
  assert.equal(diasDesde('2026-10-21', new Date(2026, 10, 5)), 15)
  assert.equal(nombreProducto({ brand: '', model: '' }), 'Producto sin nombre')
  assert.equal(fechaCorta('2026-11-05'), '05/11/2026')
})
