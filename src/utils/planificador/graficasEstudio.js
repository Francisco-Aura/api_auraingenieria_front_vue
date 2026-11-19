// Las gráficas del resultado de un estudio como datos: qué se dibuja en cada categoría y en cada módulo. Lo usan la pantalla (pestañas)
// y la descarga del informe (módulos elegibles, cuyo SVG se manda al servidor). Los identificadores de los módulos son los del servidor.

// El lienzo en que se dibuja cada gráfica (el SVG se estira al ancho de la pantalla). Cuanto más ancho el lienzo, más pequeños salen la letra,
// los trazos y los puntos. Las sueltas ocupan el ancho entero y las pareadas la mitad: con estas medidas quedan a la misma escala (~×1,15).
export const ANCHO_SUELTA = 1070
export const ANCHO_PAREJA = 530

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const OSCURO = 'var(--text-h)'
const GRIS = 'rgb(150, 155, 166)'
const GRIS_CLARO = 'rgb(96, 103, 116)'
const AMARILLO = 'var(--brand)'
const AMARILLO_OSCURO = 'rgb(214, 158, 0)'
const VERDE = 'rgb(46, 160, 67)'
const NARANJA = 'rgb(240, 140, 60)'
const AZUL = 'rgb(93, 156, 236)'
// Del periodo más caro (P1) al más barato (P6)
const PERIODOS = ['rgb(232, 98, 82)', 'rgb(240, 158, 90)', 'rgb(240, 208, 96)', 'rgb(125, 196, 161)', 'rgb(93, 156, 236)', 'rgb(140, 140, 160)']

const f = (v, d = 0) => (v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: d }))
const horas = (n, cada) => Array.from({ length: Math.floor(n / cada) + 1 }, (_, i) => ({ x: i * cada, texto: String(i * cada) }))

// ---- Consumo ------------------------------------------------------------------------------------------------------------------

function consumoPorPeriodo(g) {
  const m = g.consumoPeriodoMes
  const totales = (m || []).map((r) => r.reduce((a, b) => a + b, 0) / 1000)
  const series = m && m.length
    ? m[0].map((_, p) => ({ nombre: 'P' + (p + 1), color: PERIODOS[p], tipo: 'barra', pila: 'c', datos: m.map((r) => r[p] / 1000), fmt: (v) => f(v, 1) + ' MWh' }))
    : [{ nombre: 'Consumo', color: GRIS, tipo: 'barra', datos: (g.consumoMes || []).map((v) => v / 1000), fmt: (v) => f(v, 1) + ' MWh' }]
  if (!series[0].datos.length) return null
  return {
    titulo: 'Consumo mensual por periodo tarifario', unidad: 'MWh/mes', categorias: MESES, series,
    tituloGlobo: (i) => NOMBRES_MES[i].charAt(0).toUpperCase() + NOMBRES_MES[i].slice(1),
    etiquetas: m && m.length ? totales.map((t) => f(t, 0)) : null,
    extra: m && m.length ? (i) => ['Total ' + f(totales[i], 1) + ' MWh'] : null
  }
}

function perfilHorario(g) {
  if (!g.perfilLaborable) return null
  const kw = (v) => f(v, 1) + ' kW'
  const series = [{ nombre: 'Lunes a viernes', color: OSCURO, tipo: 'linea', datos: g.perfilLaborable, fmt: kw }]
  if (g.perfilSabado) {
    series.push({ nombre: 'Sábado', color: AZUL, tipo: 'linea', datos: g.perfilSabado, fmt: kw }, { nombre: 'Domingo y festivos', color: GRIS, tipo: 'linea', datos: g.perfilDomingo, fmt: kw })
  } else series.push({ nombre: 'Fin de semana', color: GRIS, tipo: 'linea', datos: g.perfilFinde, fmt: kw })
  return { titulo: 'Potencia media por hora del día', unidad: 'kW', xs: g.perfilLaborable.map((_, i) => i), xTicks: horas(23, 2), etiquetaX: 'Hora', series, tituloGlobo: (i) => i + ':00 h' }
}

// ---- Producción solar ---------------------------------------------------------------------------------------------------------

function diasTipo(g) {
  const d = g.diaTipo
  if (!d || d.length < 8) return []
  return [0, 1].map((k) => {
    const o = k * 4
    const directa = d[o + 2].map((v, i) => Math.max(0, v - d[o + 3][i]))
    const kw = (v) => f(v, 1) + ' kW'
    const series = [{ nombre: 'Sol directo', color: AMARILLO, tipo: 'area', pila: 'sol', escalon: true, datos: directa, opacidad: 0.9, fmt: kw }]
    if (d[o + 3].some((v) => v > 0)) series.push({ nombre: 'Desde la batería', color: VERDE, tipo: 'area', pila: 'sol', escalon: true, datos: d[o + 3], opacidad: 0.9, fmt: kw })
    series.push({ nombre: 'Producción FV', color: GRIS, tipo: 'linea', discontinua: true, escalon: true, datos: d[o + 1], grosor: 1.6, fmt: kw }, { nombre: 'Consumo', color: OSCURO, tipo: 'linea', escalon: true, datos: d[o], fmt: kw })
    return { titulo: (k ? 'Diciembre' : 'Junio') + ' (laborable medio)', unidad: 'kW', xs: d[o].map((_, i) => i), xTicks: horas(24, 4), etiquetaX: 'Hora', series, tituloGlobo: (i) => i + ':00 a ' + (i + 1) + ':00 h' }
  })
}

function aprovechamiento(g) {
  if (!g.solarMes) return null
  const mwh = (a) => (a || []).map((v) => v / 1000)
  const bat = mwh(g.bateriaMes)
  const directa = mwh(g.solarMes).map((v, i) => Math.max(0, v - (bat[i] || 0)))
  const fm = (v) => f(v, 1) + ' MWh'
  const series = [
    { nombre: 'Consumo actual', color: GRIS, tipo: 'barra', pila: 'c', datos: mwh(g.consumoMes), fmt: fm },
    { nombre: 'Sol directo', color: AMARILLO, tipo: 'barra', pila: 's', datos: directa, fmt: fm }
  ]
  if (bat.some((v) => v > 0)) series.push({ nombre: 'Desde la batería', color: VERDE, tipo: 'barra', pila: 's', datos: bat, fmt: fm })
  series.push({ nombre: 'Se recorta', color: GRIS, tipo: 'barra', pila: 's', rayado: true, datos: mwh(g.recortadaMes), fmt: fm })
  const aprov = g.solarMes.map((v, i) => (g.produccionMes[i] > 0 ? Math.round((100 * v) / g.produccionMes[i]) + ' %' : ''))
  return {
    titulo: 'Aportación solar mensual frente al consumo', unidad: 'MWh/mes', categorias: MESES, series, etiquetas: aprov,
    extra: (i) => ['Producción ' + f(g.produccionMes[i] / 1000, 1) + ' MWh', 'Aprovechado ' + aprov[i]], tituloGlobo: (i) => NOMBRES_MES[i].charAt(0).toUpperCase() + NOMBRES_MES[i].slice(1)
  }
}

// ---- Dimensionado -------------------------------------------------------------------------------------------------------------

function barridoPotencia(g) {
  const b = g.barridoPotencia
  if (!b || !b.length) return null
  const fm = (v) => f(v, 1) + ' MWh'
  const series = [{ nombre: 'Sol directo', color: AMARILLO, colorResaltado: AMARILLO_OSCURO, tipo: 'barra', pila: 's', datos: b.map((x) => (x.directa) / 1000), fmt: fm }]
  if (b.some((x) => x.bateria > 0)) series.push({ nombre: 'Desde la batería', color: VERDE, tipo: 'barra', pila: 's', datos: b.map((x) => x.bateria / 1000), fmt: fm })
  series.push({ nombre: 'Sobra (se recorta)', color: GRIS, tipo: 'barra', pila: 's', rayado: true, datos: b.map((x) => x.recortada / 1000), fmt: fm })
  return {
    titulo: 'Energía solar según la potencia de paneles', unidad: 'MWh/año', etiquetaX: 'kWp', categorias: b.map((x) => f(x.kwp, 0)), series,
    etiquetas: b.map((x) => Math.round(x.cobertura * 100) + ' %'), resaltar: b.findIndex((x) => x.actual),
    lineaH: g.consumoAnual ? { valor: g.consumoAnual / 1000, texto: 'Consumo del año · ' + f(g.consumoAnual / 1000, 0) + ' MWh' } : null,
    extra: (i) => ['Cubre el ' + Math.round(b[i].cobertura * 100) + ' % del consumo'].concat(b[i].bateria > 0 ? ['Batería ≈ ' + f(b[i].ciclos, 0) + ' ciclos al año'] : []),
    tituloGlobo: (i) => f(b[i].kwp, 0) + ' kWp' + (b[i].actual ? ' (actual)' : '')
  }
}

function coberturaPotencia(g) {
  const b = g.barridoPotencia
  if (!b || b.length < 2) return null
  const a = b.find((x) => x.actual)
  return {
    titulo: 'Consumo cubierto y producción aprovechada', unidad: '%', etiquetaX: 'kWp', xs: b.map((x) => x.kwp), xTicks: b.map((x) => ({ x: x.kwp, texto: f(x.kwp, 0) })), yMin: 0,
    series: [
      { nombre: 'Consumo cubierto', color: VERDE, tipo: 'linea', datos: b.map((x) => x.cobertura * 100), fmt: (v) => f(v, 1) + ' %' },
      { nombre: 'Producción aprovechada', color: NARANJA, tipo: 'linea', datos: b.map((x) => x.aprovechamiento * 100), fmt: (v) => f(v, 1) + ' %' }
    ],
    marcas: a ? [{ x: a.kwp, y: a.cobertura * 100, texto: f(a.kwp, 0) + ' kWp · ' + f(a.cobertura * 100, 0) + ' %', pos: 'arr' }] : [], tituloGlobo: (i) => f(b[i].kwp, 0) + ' kWp'
  }
}

function graficasBateria(g) {
  const b = g.barridoBateria
  if (!b || b.length < 2) return null
  const act = b.findIndex((x) => x.actual)
  const cat = b.map((x) => (x.kwh === 0 ? ['Sin batería'] : [f(x.kwh, 0) + ' kWh', f(x.ciclos, 0) + ' ciclos/año']))
  const fm = (v) => f(v, 1) + ' MWh'
  const reparto = {
    titulo: 'Energía solar según la capacidad de batería', unidad: 'MWh/año', categorias: cat, resaltar: act,
    series: [
      { nombre: 'Sol directo', color: AMARILLO, colorResaltado: AMARILLO_OSCURO, tipo: 'barra', pila: 's', datos: b.map((x) => x.directa / 1000), fmt: fm },
      { nombre: 'Desde la batería', color: VERDE, tipo: 'barra', pila: 's', datos: b.map((x) => x.bateria / 1000), fmt: fm },
      { nombre: 'Sobra (se recorta)', color: GRIS, tipo: 'barra', pila: 's', rayado: true, datos: b.map((x) => x.recortada / 1000), fmt: fm }
    ],
    etiquetas: b.map((x) => Math.round(x.cobertura * 100) + ' %'), lineaH: g.consumoAnual ? { valor: g.consumoAnual / 1000, texto: 'Consumo del año · ' + f(g.consumoAnual / 1000, 0) + ' MWh' } : null,
    tituloGlobo: (i) => (b[i].kwh === 0 ? 'Sin batería' : f(b[i].kwh, 0) + ' kWh') + (b[i].actual ? ' (actual)' : ''), extra: (i) => ['Cubre el ' + Math.round(b[i].cobertura * 100) + ' % del consumo']
  }
  const tir = {
    titulo: 'Rentabilidad (TIR) según la capacidad de batería', unidad: '%', categorias: cat.map((c) => c[0]), resaltar: act,
    series: [{ nombre: 'TIR', color: GRIS_CLARO, colorResaltado: AMARILLO, tipo: 'barra', datos: b.map((x) => (x.tir === null ? 0 : x.tir * 100)), fmt: (v) => f(v, 1) + ' %', valores: (v) => f(v, 1) + ' %' }],
    tituloGlobo: (i) => (b[i].kwh === 0 ? 'Sin batería' : f(b[i].kwh, 0) + ' kWh') + (b[i].actual ? ' (actual)' : ''),
    extra: (i) => ['Inversión ' + f(b[i].inversion, 0) + ' €', 'Retorno ' + (b[i].retorno ? f(b[i].retorno, 1) + ' años' : '—'), 'VAN ' + f(b[i].van, 0) + ' €']
  }
  const a = b[act]
  const curva = {
    titulo: 'Consumo cubierto según la capacidad de batería', unidad: '%', etiquetaX: 'kWh', xs: b.map((x) => x.kwh), xTicks: b.map((x) => ({ x: x.kwh, texto: f(x.kwh, 0) })),
    series: [
      { nombre: 'Consumo cubierto', tipo: 'area', color: VERDE, opacidad: 0.15, datos: b.map((x) => x.cobertura * 100), leyenda: false },
      { nombre: 'Consumo cubierto', tipo: 'linea', color: VERDE, datos: b.map((x) => x.cobertura * 100), fmt: (v) => f(v, 1) + ' %' }
    ],
    marcas: a ? [{ x: a.kwh, y: a.cobertura * 100, texto: f(a.kwh, 0) + ' kWh · ' + f(a.cobertura * 100, 1) + ' %', pos: 'arr' }] : [], tituloGlobo: (i) => f(b[i].kwh, 0) + ' kWh'
  }
  return { reparto, tir, curva }
}

// ---- Potencia contratada ------------------------------------------------------------------------------------------------------

function potencia(g) {
  const p = g.potencia
  if (!p) return null
  const kw = (v) => f(v, 1) + ' kW'
  const cat = (p.hoy || []).map((_, i) => ['P' + (i + 1)].concat(p.conPrecios ? [f(p.precio[i], 2) + ' €/kW·año'] : []))
  const hayContratada = (p.contratada || []).some((v) => v > 0)
  const series = []
  if (hayContratada) series.push({ nombre: 'Punta registrada', color: GRIS_CLARO, tipo: 'barra', pila: 'p', datos: p.punta, fmt: kw })
  series.push({ nombre: hayContratada ? 'Contratada hoy' : 'Punta registrada hoy', color: GRIS, tipo: 'barra', pila: 'h', datos: p.hoy, fmt: kw, valores: (v) => f(v, 0) })
  series.push({ nombre: 'A contratar', color: VERDE, tipo: 'barra', pila: 'c', datos: p.aContratar, fmt: kw, valores: (v) => f(v, 0) })
  return {
    titulo: 'Potencia contratada por periodo', unidad: 'kW', categorias: cat, series,
    extra: (i) => (p.conPrecios && p.ahorro[i] > 0 ? ['Ahorro ' + f(p.ahorro[i], 0) + ' €/año'] : []), tituloGlobo: (i) => 'Periodo P' + (i + 1)
  }
}

function kpisPotencia(g) {
  const p = g.potencia
  if (!p || !p.conPrecios) return []
  const total = p.ahorro.reduce((a, b) => a + b, 0)
  return total > 0 ? [{ valor: f(total, 0) + ' €', texto: 'ahorro al año en potencia' }] : []
}

// ---- Rentabilidad -------------------------------------------------------------------------------------------------------------

function acumulado(g, fin) {
  const a = fin.acumulado
  if (!a || !a.length) return null
  const miles = a.map((v) => v / 1000)
  const r = fin.retorno
  const rep = g.reposicionAno
  return {
    titulo: 'Dinero acumulado año a año', unidad: 'miles €', etiquetaX: 'Año', xs: a.map((_, i) => i), xTicks: a.map((_, i) => ({ x: i, texto: String(i) })).filter((t) => t.x % 5 === 0),
    series: [
      { nombre: 'Balance acumulado', tipo: 'area', color: VERDE, opacidad: 0.15, datos: miles, leyenda: false },
      { nombre: 'Balance acumulado', tipo: 'linea', color: OSCURO, datos: miles, fmt: (v) => f(v, 1) + ' mil €' }
    ],
    marcas: r ? [{ x: r, y: 0, texto: 'Recupera la inversión en ' + f(r, 1) + ' años', pos: 'der', color: AMARILLO }] : [],
    vlineas: rep ? [{ x: rep, texto: 'Cambio de equipos' }] : [], tituloGlobo: (i) => (i === 0 ? 'Inversión inicial' : 'Año ' + i)
  }
}

function van(g) {
  const v = g.escenariosVan
  if (!v || !v.items || !v.items.length) return null
  const precio = (x) => Number(x).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
  const p1 = precio(v.precio)
  const p2 = precio(v.precioAlto)
  const act = v.items.findIndex((x) => x.actual)
  return {
    titulo: 'VAN a 25 años según la potencia de paneles', unidad: 'miles €', categorias: v.items.map((x) => f(x.kwp, 0) + ' kWp'), resaltar: act,
    series: [
      { nombre: 'Energía a ' + p1 + ' €/kWh', color: GRIS_CLARO, colorResaltado: AMARILLO, tipo: 'barra', pila: 'a', datos: v.items.map((x) => x.van / 1000), fmt: (x) => f(x, 1) + ' mil €', valores: (x) => f(x, 0) },
      { nombre: 'Energía a ' + p2 + ' €/kWh', color: GRIS, tipo: 'barra', pila: 'b', datos: v.items.map((x) => x.vanAlto / 1000), fmt: (x) => f(x, 1) + ' mil €', valores: (x) => f(x, 0) }
    ],
    tituloGlobo: (i) => f(v.items[i].kwp, 0) + ' kWp' + (v.items[i].actual ? ' (actual)' : '')
  }
}

// ---- Financiación -------------------------------------------------------------------------------------------------------------

function financiacion(g) {
  const x = g.financiacion
  if (!x) return null
  const c = x.balanceConstante.map((v) => v / 1000)
  const s = x.balanceSubida.map((v) => v / 1000)
  const bajo = c.indexOf(Math.min(...c))
  const marcas = []
  if (c[bajo] < 0) marcas.push({ x: bajo, y: c[bajo], texto: 'Mes ' + bajo + ': ' + f(-c[bajo], 1) + ' mil € puestos', pos: 'der', color: GRIS })
  if (x.recuperaConstante) marcas.push({ x: x.recuperaConstante, y: 0, texto: 'Recuperado en el mes ' + x.recuperaConstante, pos: 'arr', color: AMARILLO })
  return {
    titulo: 'Balance del cliente: ahorro menos cuotas', unidad: 'miles €', etiquetaX: 'Mes', xs: c.map((_, i) => i), xTicks: c.map((_, i) => ({ x: i, texto: String(i) })).filter((t) => t.x % 12 === 0),
    series: [
      { nombre: 'Precio de la energía constante', tipo: 'linea', color: OSCURO, datos: c, fmt: (v) => f(v, 1) + ' mil €' },
      { nombre: 'Energía +' + f(x.subida * 100, 0) + ' % al año', tipo: 'linea', color: GRIS, datos: s, fmt: (v) => f(v, 1) + ' mil €' }
    ],
    banda: { x0: 0, x1: x.meses, texto: x.meses + ' cuotas de ' + f(x.cuota, 0) + ' €' }, marcas, tituloGlobo: (i) => 'Mes ' + i
  }
}

function kpisFinanciacion(g) {
  const x = g.financiacion
  if (!x) return []
  return [
    { valor: f(x.cuota, 0) + ' €', texto: 'cuota mensual durante ' + x.meses + ' meses' },
    { valor: f(x.totalCuotas, 0) + ' €', texto: 'total de las cuotas (TAE ' + f(x.tae, 1) + ' %)' },
    { valor: f(x.puestoConstante, 0) + ' €', texto: 'lo que pone el cliente de su bolsillo' },
    { valor: x.recuperaConstante === null ? 'No en 25 años' : 'Mes ' + x.recuperaConstante, texto: 'lo recupera' + (x.recuperaSubida ? ' (mes ' + x.recuperaSubida + ' si la energía sube)' : '') }
  ]
}

const KPIS_VACIOS = []

/** Las categorías del resultado, cada una con sus módulos (gráficas con su explicación y tablas que escribe el servidor), en su orden por defecto. */
export function construirCategorias(r) {
  const g = r.graficas || {}
  const fin = r.finanzas || {}
  const bat = graficasBateria(g)
  const dia = diasTipo(g)
  const grafica = (id, nombre, specs, extra = {}) => (specs && specs.length && specs[0] ? { id, nombre, tipo: 'grafica', specs, ...extra } : null)
  const tabla = (id, nombre) => ({ id, nombre, tipo: 'tabla', specs: [] })
  const categorias = [
    {
      id: 'consumo', nombre: 'Consumo', kpis: KPIS_VACIOS,
      modulos: [grafica('consumo-periodos', 'Consumo mensual por periodo tarifario', [consumoPorPeriodo(g)]), grafica('consumo-perfil', 'Perfil horario del consumo', [perfilHorario(g)])]
    },
    {
      id: 'solar', nombre: 'Producción solar', kpis: KPIS_VACIOS,
      modulos: [grafica('solar-dia', 'Día tipo de junio y de diciembre', dia), grafica('solar-mensual', 'Aportación solar mensual frente al consumo', [aprovechamiento(g)]),
        tabla('tabla-instalacion', 'Tabla: instalación propuesta')]
    },
    {
      id: 'dimension', nombre: 'Dimensionado', kpis: KPIS_VACIOS,
      modulos: [grafica('dim-potencia', 'Energía solar según la potencia de paneles', [barridoPotencia(g)]), grafica('dim-cobertura', 'Consumo cubierto y producción aprovechada', [coberturaPotencia(g)]),
        bat && grafica('dim-bateria', 'Energía solar según la capacidad de batería', [bat.reparto]), bat && grafica('dim-tir-bateria', 'Rentabilidad (TIR) según la batería', [bat.tir], { par: true }),
        bat && grafica('dim-cobertura-bateria', 'Consumo cubierto según la batería', [bat.curva], { par: true }), tabla('tabla-escenarios', 'Tabla: escenarios de potencia')]
    },
    { id: 'potencia', nombre: 'Potencia contratada', kpis: kpisPotencia(g), modulos: [grafica('potencia-contratada', 'Potencia contratada por periodo', [potencia(g)])] },
    {
      id: 'rentabilidad', nombre: 'Rentabilidad', kpis: KPIS_VACIOS,
      modulos: [grafica('rent-acumulado', 'Dinero acumulado año a año', [acumulado(g, fin)]), grafica('rent-van', 'VAN a 25 años según la potencia de paneles', [van(g)]),
        tabla('tabla-inversion', 'Tabla: inversión y ahorro'), tabla('tabla-indicadores', 'Tabla: indicadores y sensibilidad al precio')]
    },
    { id: 'financiacion', nombre: 'Financiación', kpis: kpisFinanciacion(g), modulos: [grafica('fin-balance', 'Balance de la financiación', [financiacion(g)])] }
  ]
  return categorias.map((c) => ({ ...c, modulos: c.modulos.filter(Boolean) })).filter((c) => c.modulos.length)
}
