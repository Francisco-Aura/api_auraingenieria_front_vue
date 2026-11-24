import test from 'node:test'
import assert from 'node:assert/strict'
import { calcDe, canonical, conCoste, conPresupuesto, copyOf, cuerpoDe, estadoDe, estadoInicial, fromServer, isDirty, newLocal, nombreEstudio, usaElCoste } from '../../src/utils/planificador/almacenEstudios.js'

const clonar = (o) => JSON.parse(JSON.stringify(o))

// Un estudio como lo devuelve el servidor tras guardarlo
const delServidor = (extra = {}) => ({
  id: 'e-1', version: 3, creadoPor: 'Ana', actualizadoPor: 'Luis', actualizadoEl: '2026-11-16T10:00:00.000000+00:00', creadoEl: '2026-11-15T10:00:00.000000+00:00',
  customer: { kind: 'potencial', name: 'Curtidos SA', cif: '', phone: '', email: '' }, proyecto: 'Nave 2', observaciones: 'Nota',
  datos: {
    cups: 'ES001', tarifa: '6.1TD', localidad: 'Lorca', provincia: 'Murcia', cnae: '',
    potencias: [150, 150, 150, 150, 150, 150], sips: { potencias: [150], kwhAnual: 96000, lecturas: [] },
    instalacion: { kwp: 100, bateriaKwh: 0, orientacion: 'sur', produccionEspecifica: null },
    economia: { precioWp: 0.85, precioEnergia: 0.1 }, horario: { ini: 7, fin: 19, fraccionFuera: 0.15, fraccionFinde: 0.1 }
  },
  curva: { presente: true, estimada: false, origen: 'curva.csv', texto: '1,2,3' },
  resultado: { simulacion: { kwp: 100 }, finanzas: { retorno: 8 } },
  ...extra
})

test('un estudio nuevo parte de valores razonables y sin potencia puesta', () => {
  const e = estadoInicial()
  assert.equal(e.customer, null)
  assert.equal(e.instalacion.kwp, '')
  assert.equal(e.horario.fuera, 15)
  // Sin potencia se manda 0: el servidor propone la que produce la mitad del consumo
  assert.equal(cuerpoDe(e).datos.instalacion.kwp, 0)
  assert.equal(cuerpoDe(e).curva, null)
})

test('el estudio del servidor vuelve a ser los mismos parámetros al mandarlo', () => {
  const e = estadoDe(delServidor())
  assert.equal(e.instalacion.kwp, 100)
  assert.equal(e.horario.fuera, 15, 'el servidor guarda fracciones y la pantalla porcentajes')
  assert.deepEqual(e.curva, { texto: '1,2,3', origen: 'curva.csv' })
  const cuerpo = cuerpoDe(e)
  assert.equal(cuerpo.datos.horario.fraccionFuera, 0.15)
  assert.equal(cuerpo.datos.cups, 'ES001')
  assert.deepEqual(cuerpo.curva, { texto: '1,2,3', origen: 'curva.csv', estimada: false })
})

test('sin curva real no se manda curva: con SIPS la estima el servidor', () => {
  const e = estadoDe(delServidor({ curva: { presente: true, estimada: true, origen: 'estimada' } }))
  assert.equal(e.curva, null)
  assert.equal(cuerpoDe(e).curva, null)
})

test('un estudio compartido recién guardado o abierto no tiene cambios sin guardar', () => {
  const t = fromServer(delServidor())
  assert.equal(t.remote.version, 3)
  assert.equal(t.remote.owner, 'Ana')
  assert.equal(isDirty(t), false)
  assert.equal(isDirty(newLocal(estadoInicial(), calcDe({}))), false, 'uno local nunca tiene cambios: no hay con qué compararlo')
})

test('cambiar un parámetro marca los cambios y volver a ponerlo los quita', () => {
  const t = fromServer(delServidor())
  const cambiado = { ...t, state: { ...clonar(t.state), instalacion: { ...t.state.instalacion, kwp: 250 } } }
  assert.equal(isDirty(cambiado), true)
  const igual = { ...cambiado, state: { ...clonar(cambiado.state), instalacion: { ...cambiado.state.instalacion, kwp: 100 } } }
  assert.equal(isDirty(igual), false)
  // La curva pesa: se compara resumida, pero una distinta sí cuenta
  const otraCurva = { ...t, state: { ...clonar(t.state), curva: { texto: '1,2,4', origen: 'curva.csv' } } }
  assert.equal(isDirty(otraCurva), true)
})

test('un estudio guardado antes de añadirse un campo no aparece como modificado', () => {
  const t = fromServer(delServidor())
  // Lo sincronizado por una versión anterior del programa: sin los campos de ubicación, inclinación y azimut
  const antiguo = JSON.parse(t.remote.syncedJson)
  for (const k of ['latitud', 'longitud', 'inclinacion', 'azimut']) delete antiguo.datos.instalacion[k]
  const vieja = { ...t, remote: { ...t.remote, syncedJson: JSON.stringify(antiguo) } }
  assert.equal(isDirty(vieja), false)
  // Y si de verdad se cambia el campo nuevo, sí cuenta
  const cambiado = { ...vieja, state: { ...clonar(vieja.state), instalacion: { ...vieja.state.instalacion, azimut: 45 } } }
  assert.equal(isDirty(cambiado), true)
})

test('un estudio de antes, que elegía un año de BOE, no aparece como modificado; elegir un BOE sí cuenta', () => {
  const t = fromServer(delServidor())
  const antiguo = JSON.parse(t.remote.syncedJson)
  delete antiguo.datos.economia.boeId
  antiguo.datos.economia.anioPrecios = 2026 // lo que guardaba la versión anterior
  const vieja = { ...t, remote: { ...t.remote, syncedJson: JSON.stringify(antiguo) } }
  assert.equal(isDirty(vieja), false)
  const elegido = { ...vieja, state: { ...clonar(vieja.state), economia: { ...vieja.state.economia, boeId: 7 } } }
  assert.equal(isDirty(elegido), true)
  assert.equal(cuerpoDe(elegido.state).datos.economia.boeId, 7)
  assert.equal(cuerpoDe(vieja.state).datos.economia.boeId, '', 'sin elegir se manda vacío: el vigente hoy')
})

test('lo sincronizado lleva la curva resumida, no entera (pesa mucho y se guarda en el navegador)', () => {
  const a = estadoDe(delServidor())
  const texto = JSON.parse(canonical(a)).curva.texto
  assert.notEqual(texto, '1,2,3')
  assert.match(texto, /^\d+:[0-9a-z]+$/)
  assert.equal(canonical(a), canonical(clonar(a)), 'el mismo estudio da siempre lo mismo')
})

test('una copia local lleva otro id y no comparte el servidor', () => {
  const t = fromServer(delServidor())
  const c = copyOf(t)
  assert.notEqual(c.id, t.id)
  assert.equal(c.remote, null)
  assert.deepEqual(c.state, t.state)
  assert.notEqual(c.state, t.state)
})

test('el nombre del estudio lleva el cliente y el proyecto', () => {
  assert.equal(nombreEstudio(estadoDe(delServidor())), 'Curtidos SA · Nave 2')
  assert.equal(nombreEstudio(estadoInicial()), 'Sin cliente')
})

// ---- El coste de la instalación: el de un presupuesto o, sin él, el precio provisional -----------------------------------------------

const presupuesto = { id: 'p-1', total: 11500, kwp: 10 }

test('un estudio nuevo no parte de ningún presupuesto', () => {
  const e = estadoInicial()
  assert.equal(conPresupuesto(e), false)
  assert.equal(cuerpoDe(e).datos.economia.presupuestoId, '')
  assert.equal(cuerpoDe(e).datos.economia.presupuestoTotal, '')
})

test('con un presupuesto el estudio guarda su id, su importe y sus kWp, y los manda al servidor', () => {
  const e = conCoste(estadoInicial(), presupuesto)
  assert.equal(conPresupuesto(e), true)
  const eco = cuerpoDe(e).datos.economia
  assert.deepEqual([eco.presupuestoId, eco.presupuestoTotal, eco.presupuestoKwp], ['p-1', 11500, 10])
})

test('un presupuesto sin importe o sin kWp no cuenta: queda el precio provisional', () => {
  assert.equal(conPresupuesto(conCoste(estadoInicial(), { id: 'p-2', total: 0, kwp: 10 })), false)
  assert.equal(conPresupuesto(conCoste(estadoInicial(), { id: 'p-2', total: 5000, kwp: 0 })), false)
  assert.equal(conPresupuesto(conCoste(estadoInicial(), null)), false)
})

test('poner un coste provisional quita el presupuesto sin tocar el original', () => {
  const con = conCoste(estadoInicial(), presupuesto)
  const sin = conCoste(con, null)
  assert.equal(conPresupuesto(sin), false)
  assert.equal(conPresupuesto(con), true)
})

test('usaElCoste: solo es el mismo si coinciden el presupuesto, su importe y sus kWp', () => {
  const e = conCoste(estadoInicial(), presupuesto)
  assert.equal(usaElCoste(e, presupuesto), true)
  assert.equal(usaElCoste(e, { ...presupuesto, total: 12000 }), false, 'el presupuesto ha cambiado de importe')
  assert.equal(usaElCoste(e, { ...presupuesto, id: 'p-9' }), false, 'es otro presupuesto')
  assert.equal(usaElCoste(estadoInicial(), presupuesto), false)
  assert.equal(usaElCoste(estadoInicial(), null), true, 'sin presupuesto y ya provisional: nada que cambiar')
  assert.equal(usaElCoste(e, null), false, 'pasar de presupuesto a provisional sí cambia')
})

test('un estudio guardado antes de esto se abre sin presupuesto', () => {
  const e = estadoDe(delServidor())
  assert.equal(conPresupuesto(e), false)
  assert.equal(e.economia.presupuestoId, '')
})
