// Editor visual de reglas MCAS: traduce entre el formulario y el JSON que evalúa
// el motor (MotorMcas.evaluarCondicion, estrategias de cálculo y
// McasRuleSetValidator en el backend). Sin dependencias de Vue para poder
// probarlo con node --test.

// ---------------------------------------------------------------------------
// Catálogo de condiciones admitidas por el motor
// ---------------------------------------------------------------------------
export const OPCIONES_CONDICION = {
  tipo_suministro: [
    { value: 'LUZ', label: 'Luz' },
    { value: 'GAS', label: 'Gas' },
  ],
  segmento: [
    { value: 'PYME', label: 'PYME (empresas)' },
    { value: 'RESIDENCIAL', label: 'Residencial (particulares)' },
  ],
  es_renovacion: [
    { value: 'false', label: 'Solo contratos nuevos' },
    { value: 'true', label: 'Solo renovaciones' },
  ],
  tipo_renovacion: [
    { value: 'FIRMADA', label: 'Firmada' },
    { value: 'TACITA', label: 'Tácita' },
    { value: 'OTRA', label: 'Otra' },
  ],
  alta_nueva: [
    { value: 'true', label: 'Sí (primera alta en la comercializadora)' },
    { value: 'false', label: 'No' },
  ],
}

// El «ámbito» (dentro/fuera) era lo mismo que la zona de comisión y ya no existe: una regla
// antigua que lo tuviera lo pierde al guardarse.
const CONDICIONES_TEXTO = ['tipo_suministro', 'segmento', 'tipo_renovacion', 'codigo_producto', 'tarifa_acceso', 'zona_comision']
const CONDICIONES_BOOLEANAS = ['es_renovacion', 'alta_nueva']

// Claves JSON de cada rango; los límites por defecto del motor son "mínimo
// incluido" y "máximo excluido".
export const RANGOS_CONDICION = {
  consumo_kwh: { min: 'consumo_min_kwh', max: 'consumo_max_kwh', minInc: 'consumo_min_inclusivo', maxInc: 'consumo_max_inclusivo' },
  consumo_mwh: { min: 'consumo_min_mwh', max: 'consumo_max_mwh', minInc: 'consumo_min_mwh_inc', maxInc: 'consumo_max_mwh_inc' },
  potencia_kw: { min: 'potencia_min_kw', max: 'potencia_max_kw', minInc: 'potencia_min_inc', maxInc: 'potencia_max_inc' },
  // Meses desde que el punto dejó la comercializadora (duda 22): una regla con esto es una excepción
  meses_relacion: { min: 'meses_ultima_relacion_min', max: 'meses_ultima_relacion_max', minInc: 'meses_ultima_relacion_min_inc', maxInc: 'meses_ultima_relacion_max_inc' },
}

// Métodos de cálculo y líneas de una suma compuesta
/** Nombre corto de cada método (tablas, desgloses de propuestas y pruebas). */
export const NOMBRES_METODO = {
  FEE_PERCENTAGE: '% sobre el FEE',
  RATE_PER_MWH: '€ por MWh',
  FIXED_AMOUNT: 'Importe fijo',
  RANGE_LOOKUP: 'Tabla por tramos',
  MATRIX_LOOKUP: 'Tabla de dos datos',
  MULTI_DIMENSION_LOOKUP: 'Tabla de varios datos',
  COMPOSITE_SUM: 'Suma de varios cálculos',
  PERCENTAGE_OF_PREVIOUS: '% de lo anterior',
  MANUAL: 'A mano',
  NOT_COMMISSIONABLE: 'No comisionable',
  // Línea de ajuste de las reglas que cobran solo una parte (renovaciones tácitas al 80 %)
  PORCENTAJE_RESULTADO: '% de lo calculado',
}
export const METODOS_TABLA = ['RANGE_LOOKUP', 'MATRIX_LOOKUP', 'MULTI_DIMENSION_LOOKUP']
export const METODOS_CON_MOTIVO = ['MANUAL', 'NOT_COMMISSIONABLE']
export const TIPOS_LINEA = [
  { value: 'FIXED_AMOUNT', label: 'Importe fijo', unidad: '€' },
  { value: 'RATE_PER_MWH', label: '€ por MWh', unidad: '€/MWh' },
  { value: 'FEE_PERCENTAGE', label: '% sobre el FEE', unidad: '%' },
  { value: 'PERCENTAGE_OF_PREVIOUS', label: '% de lo anterior', unidad: '%' },
]

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function numero(v) {
  if (v === null || v === undefined || String(v).trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function texto(v) {
  return v === null || v === undefined ? '' : String(v).trim()
}

/** Porcentaje de pantalla (44) ⇄ factor del motor (0.44), sin arrastrar decimales binarios. */
export function aFactor(porcentaje) {
  const n = numero(porcentaje)
  return n === null ? null : Number((n / 100).toFixed(10))
}

export function aPorcentaje(factor) {
  const n = numero(factor)
  return n === null ? '' : Number((n * 100).toFixed(8))
}

function leerObjeto(json) {
  if (json === null || json === undefined || String(json).trim() === '') return { ok: true, valor: {} }
  try {
    const valor = JSON.parse(json)
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return { ok: false, valor: {} }
    return { ok: true, valor }
  } catch {
    return { ok: false, valor: {} }
  }
}

function aJson(obj) {
  return Object.keys(obj).length ? JSON.stringify(obj) : null
}

// ---------------------------------------------------------------------------
// Condiciones
// ---------------------------------------------------------------------------
export function condicionesVacias() {
  return {
    tipo_suministro: '', segmento: '', es_renovacion: '', tipo_renovacion: '', alta_nueva: '',
    codigo_producto: '', tarifa_acceso: '', zona_comision: '',
    consumoUnidad: 'kwh', consumoMin: '', consumoMax: '', consumoMinInc: true, consumoMaxInc: false,
    potenciaMin: '', potenciaMax: '', potenciaMinInc: true, potenciaMaxInc: false,
    mesesRelacionMin: '', mesesRelacionMax: '', mesesRelacionMinInc: true, mesesRelacionMaxInc: false,
  }
}

function leerRango(extras, claves) {
  const tieneMin = typeof extras[claves.min] === 'number'
  const tieneMax = typeof extras[claves.max] === 'number'
  if (!tieneMin && !tieneMax) return null
  const rango = {
    min: tieneMin ? extras[claves.min] : '',
    max: tieneMax ? extras[claves.max] : '',
    minInc: typeof extras[claves.minInc] === 'boolean' ? extras[claves.minInc] : true,
    maxInc: typeof extras[claves.maxInc] === 'boolean' ? extras[claves.maxInc] : false,
  }
  for (const k of Object.values(claves)) delete extras[k]
  return rango
}

/**
 * JSON de condiciones → formulario. Las claves que el formulario no representa
 * (o con un tipo inesperado) se devuelven en `extras` y se conservan al guardar.
 */
export function leerCondiciones(json) {
  const form = condicionesVacias()
  const { ok, valor } = leerObjeto(json)
  if (!ok) return { form, extras: {}, error: 'Las condiciones no son un objeto JSON válido' }
  const extras = { ...valor }
  for (const k of CONDICIONES_TEXTO) {
    if (typeof extras[k] === 'string') {
      // El motor compara sin distinguir mayúsculas: se ajusta al valor del desplegable.
      const valor = extras[k].trim()
      const opcion = OPCIONES_CONDICION[k]?.find(o => o.value === valor.toUpperCase())
      form[k] = opcion ? opcion.value : valor
      delete extras[k]
    } else if (extras[k] === null) delete extras[k]
  }
  for (const k of CONDICIONES_BOOLEANAS) {
    if (typeof extras[k] === 'boolean') { form[k] = String(extras[k]); delete extras[k] }
    else if (extras[k] === null) delete extras[k]
  }
  const kwh = leerRango(extras, RANGOS_CONDICION.consumo_kwh)
  const mwh = kwh ? null : leerRango(extras, RANGOS_CONDICION.consumo_mwh)
  const consumo = kwh || mwh
  if (consumo) {
    form.consumoUnidad = kwh ? 'kwh' : 'mwh'
    form.consumoMin = consumo.min; form.consumoMax = consumo.max
    form.consumoMinInc = consumo.minInc; form.consumoMaxInc = consumo.maxInc
  }
  const potencia = leerRango(extras, RANGOS_CONDICION.potencia_kw)
  if (potencia) {
    form.potenciaMin = potencia.min; form.potenciaMax = potencia.max
    form.potenciaMinInc = potencia.minInc; form.potenciaMaxInc = potencia.maxInc
  }
  const meses = leerRango(extras, RANGOS_CONDICION.meses_relacion)
  if (meses) {
    form.mesesRelacionMin = meses.min; form.mesesRelacionMax = meses.max
    form.mesesRelacionMinInc = meses.minInc; form.mesesRelacionMaxInc = meses.maxInc
  }
  return { form, extras, error: null }
}

function escribirRango(obj, claves, min, max, minInc, maxInc) {
  const nMin = numero(min)
  const nMax = numero(max)
  if (nMin !== null) {
    obj[claves.min] = nMin
    if (minInc === false) obj[claves.minInc] = false
  }
  if (nMax !== null) {
    obj[claves.max] = nMax
    if (maxInc === true) obj[claves.maxInc] = true
  }
}

/** Formulario → JSON de condiciones (null = aplica a todos los contratos de la tabla de comisiones). */
export function escribirCondiciones(form, extras = {}) {
  const obj = {}
  for (const k of CONDICIONES_TEXTO) {
    const v = texto(form[k])
    if (v) obj[k] = v
  }
  for (const k of CONDICIONES_BOOLEANAS) {
    if (form[k] === 'true' || form[k] === 'false') obj[k] = form[k] === 'true'
  }
  const consumo = form.consumoUnidad === 'mwh' ? RANGOS_CONDICION.consumo_mwh : RANGOS_CONDICION.consumo_kwh
  escribirRango(obj, consumo, form.consumoMin, form.consumoMax, form.consumoMinInc, form.consumoMaxInc)
  escribirRango(obj, RANGOS_CONDICION.potencia_kw, form.potenciaMin, form.potenciaMax, form.potenciaMinInc, form.potenciaMaxInc)
  escribirRango(obj, RANGOS_CONDICION.meses_relacion, form.mesesRelacionMin, form.mesesRelacionMax,
    form.mesesRelacionMinInc, form.mesesRelacionMaxInc)
  for (const [k, v] of Object.entries(extras || {})) if (!(k in obj)) obj[k] = v
  return aJson(obj)
}

/**
 * Coherencia entre renovación y tipo de renovación: un tipo de renovación solo
 * tiene sentido en renovaciones (en un contrato nuevo el motor lo trataría
 * como dato que falta).
 */
export function normalizarCondiciones(form, cambiado) {
  if (cambiado === 'tipo_renovacion' && form.tipo_renovacion && form.es_renovacion !== 'true') form.es_renovacion = 'true'
  if (cambiado === 'es_renovacion' && form.es_renovacion !== 'true') form.tipo_renovacion = ''
  return form
}

export function validarCondiciones(form) {
  const errores = {}
  const rangos = [
    ['consumoMax', form.consumoMin, form.consumoMax],
    ['potenciaMax', form.potenciaMin, form.potenciaMax],
    ['mesesRelacionMax', form.mesesRelacionMin, form.mesesRelacionMax],
  ]
  for (const [campo, min, max] of rangos) {
    const nMin = numero(min)
    const nMax = numero(max)
    if ((texto(min) && nMin === null) || (texto(max) && nMax === null)) errores[campo] = 'Introduzca un número'
    else if (nMin !== null && nMin < 0) errores[campo] = 'No puede ser negativo'
    else if (nMin !== null && nMax !== null && nMax < nMin) errores[campo] = 'Debe ser mayor o igual que el mínimo'
  }
  return errores
}

// ---------------------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------------------
export function calculoVacio() {
  return { importe: '', tasa: '', porcentaje: '', feeMinimo: '', lineas: [] }
}

export function lineaVacia(metodo = 'FIXED_AMOUNT') {
  return { metodo, valor: '', descripcion: '' }
}

function leerLinea(l) {
  const metodo = texto(l?.metodo) || 'FIXED_AMOUNT'
  const valor = {
    FIXED_AMOUNT: l?.importe,
    RATE_PER_MWH: l?.tasa_eur_mwh,
    FEE_PERCENTAGE: aPorcentaje(l?.porcentaje_aplicacion_fee),
    PERCENTAGE_OF_PREVIOUS: aPorcentaje(l?.porcentaje),
  }[metodo]
  return { metodo, valor: valor ?? '', descripcion: texto(l?.descripcion) }
}

/** JSON de parámetros de cálculo → formulario (según el método). */
export function leerCalculo(metodo, json) {
  const form = calculoVacio()
  const { ok, valor } = leerObjeto(json)
  if (!ok) return { form, extras: {}, error: 'Los parámetros de cálculo no son un objeto JSON válido' }
  const extras = { ...valor }
  const tomar = clave => {
    const v = extras[clave]
    delete extras[clave]
    return typeof v === 'number' ? v : ''
  }
  if (metodo === 'FIXED_AMOUNT') form.importe = tomar('importe')
  if (metodo === 'RATE_PER_MWH') form.tasa = tomar('tasa_eur_mwh')
  if (metodo === 'FEE_PERCENTAGE') {
    form.porcentaje = aPorcentaje(tomar('porcentaje_aplicacion_fee'))
    form.feeMinimo = tomar('fee_minimo_eur_mwh')
  }
  if (metodo === 'COMPOSITE_SUM' && Array.isArray(extras.lineas)) {
    form.lineas = extras.lineas.map(leerLinea)
    delete extras.lineas
  }
  return { form, extras, error: null }
}

function escribirLinea(l) {
  const salida = { metodo: l.metodo }
  if (texto(l.descripcion)) salida.descripcion = texto(l.descripcion)
  if (l.metodo === 'FIXED_AMOUNT') salida.importe = numero(l.valor)
  if (l.metodo === 'RATE_PER_MWH') salida.tasa_eur_mwh = numero(l.valor)
  if (l.metodo === 'FEE_PERCENTAGE') salida.porcentaje_aplicacion_fee = aFactor(l.valor)
  if (l.metodo === 'PERCENTAGE_OF_PREVIOUS') salida.porcentaje = aFactor(l.valor)
  return salida
}

/** Formulario → JSON de parámetros (null en métodos de tabla, manual o no comisiona). */
export function escribirCalculo(metodo, form, extras = {}) {
  const obj = {}
  if (metodo === 'FIXED_AMOUNT' && numero(form.importe) !== null) obj.importe = numero(form.importe)
  if (metodo === 'RATE_PER_MWH' && numero(form.tasa) !== null) obj.tasa_eur_mwh = numero(form.tasa)
  if (metodo === 'FEE_PERCENTAGE') {
    if (numero(form.porcentaje) !== null) obj.porcentaje_aplicacion_fee = aFactor(form.porcentaje)
    if (numero(form.feeMinimo) !== null) obj.fee_minimo_eur_mwh = numero(form.feeMinimo)
  }
  if (metodo === 'COMPOSITE_SUM' && form.lineas?.length) obj.lineas = form.lineas.map(escribirLinea)
  if (METODOS_TABLA.includes(metodo) || METODOS_CON_MOTIVO.includes(metodo)) return aJson({ ...extras })
  for (const [k, v] of Object.entries(extras || {})) if (!(k in obj)) obj[k] = v
  return aJson(obj)
}

export function validarCalculo(metodo, form) {
  const errores = {}
  const positivo = (campo, valor, obligatorio = true) => {
    const n = numero(valor)
    if (n === null) { if (obligatorio || texto(valor)) errores[campo] = obligatorio && !texto(valor) ? 'Campo obligatorio' : 'Introduzca un número'; return }
    if (n < 0) errores[campo] = 'No puede ser negativo'
  }
  if (metodo === 'FIXED_AMOUNT') positivo('calcImporte', form.importe)
  if (metodo === 'RATE_PER_MWH') positivo('calcTasa', form.tasa)
  if (metodo === 'FEE_PERCENTAGE') {
    positivo('calcPorcentaje', form.porcentaje)
    if (!errores.calcPorcentaje && numero(form.porcentaje) > 100) errores.calcPorcentaje = 'Debe estar entre 0 y 100'
    positivo('calcFeeMinimo', form.feeMinimo, false)
  }
  if (metodo === 'COMPOSITE_SUM') {
    if (!form.lineas?.length) errores.calcLineas = 'Añada al menos una línea'
    else {
      const mal = form.lineas.findIndex(l => {
        const n = numero(l.valor)
        const esPct = ['FEE_PERCENTAGE', 'PERCENTAGE_OF_PREVIOUS'].includes(l.metodo)
        return n === null || n < 0 || (esPct && n > 100)
      })
      if (mal >= 0) errores.calcLineas = `Revise el valor de la línea ${mal + 1} (número ≥ 0; los porcentajes, entre 0 y 100)`
    }
  }
  return errores
}

// ---------------------------------------------------------------------------
// Política de pago
// ---------------------------------------------------------------------------
export function leerPago(json) {
  const { ok, valor } = leerObjeto(json)
  if (!ok) return { numeroPagos: '', extras: {}, error: 'La política de pago no es un objeto JSON válido' }
  const extras = { ...valor }
  const n = extras.numero_pagos_sugerido
  delete extras.numero_pagos_sugerido
  return { numeroPagos: Number.isInteger(n) ? n : '', extras, error: null }
}

export function escribirPago(numeroPagos, extras = {}) {
  const obj = { ...extras }
  const n = numero(numeroPagos)
  if (n !== null) obj.numero_pagos_sugerido = n
  return aJson(obj)
}

// ---------------------------------------------------------------------------
// Resumen en lenguaje natural
// ---------------------------------------------------------------------------
const EUROS = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const DECIMAL = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 })
const euros = n => `${EUROS.format(n)} €`
const dec = n => DECIMAL.format(n)

function etiqueta(clave, valor) {
  return OPCIONES_CONDICION[clave]?.find(o => o.value === valor)?.label || valor
}

function textoRango(nombre, unidad, min, max, minInc, maxInc) {
  const nMin = numero(min)
  const nMax = numero(max)
  if (nMin === null && nMax === null) return null
  const partes = []
  if (nMin !== null) partes.push(`${minInc === false ? '>' : '≥'} ${dec(nMin)} ${unidad}`)
  if (nMax !== null) partes.push(`${maxInc === true ? '≤' : '<'} ${dec(nMax)} ${unidad}`)
  return `${nombre} ${partes.join(' y ')}`
}

/** Lista de condiciones legibles; vacía = todos los contratos de la tabla de comisiones. */
export function describirCondiciones(form, nombreProducto = null) {
  const partes = []
  if (form.tipo_suministro) partes.push(etiqueta('tipo_suministro', form.tipo_suministro))
  if (form.segmento) partes.push(form.segmento === 'PYME' ? 'PYME' : 'Residencial')
  if (form.es_renovacion) partes.push(etiqueta('es_renovacion', form.es_renovacion))
  if (form.tipo_renovacion) partes.push(`Renovación ${etiqueta('tipo_renovacion', form.tipo_renovacion).toLowerCase()}`)
  if (form.alta_nueva) partes.push(form.alta_nueva === 'true' ? 'Primera alta en la comercializadora' : 'Sin ser primera alta')
  if (texto(form.codigo_producto)) partes.push(`Producto ${nombreProducto ? `«${nombreProducto}» (${texto(form.codigo_producto)})` : texto(form.codigo_producto)}`)
  if (texto(form.tarifa_acceso)) partes.push(`Tarifa ${texto(form.tarifa_acceso)}`)
  if (texto(form.zona_comision)) partes.push(`Zona ${texto(form.zona_comision)}`)
  const consumo = textoRango('Consumo anual', form.consumoUnidad === 'mwh' ? 'MWh' : 'kWh',
    form.consumoMin, form.consumoMax, form.consumoMinInc, form.consumoMaxInc)
  if (consumo) partes.push(consumo)
  const potencia = textoRango('Potencia contratada', 'kW', form.potenciaMin, form.potenciaMax, form.potenciaMinInc, form.potenciaMaxInc)
  if (potencia) partes.push(potencia)
  const meses = textoRango('Meses desde que dejó la comercializadora', 'meses', form.mesesRelacionMin, form.mesesRelacionMax,
    form.mesesRelacionMinInc, form.mesesRelacionMaxInc)
  if (meses) partes.push(meses)
  return partes
}

// Contrato tipo para el ejemplo orientativo del resumen.
const EJEMPLO_MWH = 100
const EJEMPLO_FEE = 10

function describirLinea(l) {
  const v = numero(l.valor)
  const valor = v === null ? '…' : null
  switch (l.metodo) {
    case 'FIXED_AMOUNT': return valor || euros(v)
    case 'RATE_PER_MWH': return `consumo (MWh) × ${valor || dec(v)} €/MWh`
    case 'FEE_PERCENTAGE': return `consumo (MWh) × FEE × ${valor || dec(v)} %`
    case 'PERCENTAGE_OF_PREVIOUS': return `${valor || dec(v)} % de lo anterior`
    default: return l.metodo
  }
}

function importeEjemploLineas(lineas, fee) {
  let acumulado = 0
  for (const l of lineas) {
    const v = numero(l.valor)
    if (v === null) return null
    const importe = {
      FIXED_AMOUNT: v,
      RATE_PER_MWH: EJEMPLO_MWH * v,
      FEE_PERCENTAGE: EJEMPLO_MWH * fee * v / 100,
      PERCENTAGE_OF_PREVIOUS: acumulado * v / 100,
    }[l.metodo]
    if (importe === undefined) return null
    acumulado += importe
  }
  return acumulado
}

/**
 * Resumen de lo que hará la regla: a qué contratos se aplica, cómo calcula, un
 * ejemplo orientativo y el número de pagos sugerido.
 */
export function resumenRegla({ metodo, condiciones, calculo, motivo, numeroPagos, nombreProducto, porcentajeResultado = null }) {
  const partes = describirCondiciones(condiciones || condicionesVacias(), nombreProducto)
  const aplica = partes.length ? partes : ['Todos los contratos de la tabla']
  const c = calculo || calculoVacio()
  let calcula = ''
  let ejemplo = null
  const fee = Math.max(EJEMPLO_FEE, numero(c.feeMinimo) || 0)
  switch (metodo) {
    case 'FIXED_AMOUNT':
      calcula = numero(c.importe) === null ? 'Comisión fija (indique el importe).' : `Comisión fija de ${euros(numero(c.importe))}.`
      break
    case 'RATE_PER_MWH':
      calcula = `Comisión = consumo anual (MWh) × ${numero(c.tasa) === null ? '…' : dec(numero(c.tasa))} €/MWh.`
      if (numero(c.tasa) !== null) ejemplo = `Con ${dec(EJEMPLO_MWH)} MWh al año → ${euros(EJEMPLO_MWH * numero(c.tasa))}.`
      break
    case 'FEE_PERCENTAGE':
      calcula = `Comisión = consumo anual (MWh) × FEE del contrato (€/MWh) × ${numero(c.porcentaje) === null ? '…' : dec(numero(c.porcentaje))} %.`
      if (numero(c.feeMinimo) !== null)
        calcula += ` Si el FEE del contrato es inferior a ${dec(numero(c.feeMinimo))} €/MWh no se calcula y la propuesta queda en «Revisión manual».`
      if (numero(c.porcentaje) !== null)
        ejemplo = `Con ${dec(EJEMPLO_MWH)} MWh al año y FEE de ${dec(fee)} €/MWh → ${euros(EJEMPLO_MWH * fee * numero(c.porcentaje) / 100)}.`
      break
    case 'COMPOSITE_SUM': {
      const lineas = c.lineas || []
      calcula = lineas.length
        ? `Comisión = ${lineas.map(describirLinea).join(' + ')}.`
        : 'Comisión = suma de varias líneas (añada al menos una).'
      const total = lineas.length ? importeEjemploLineas(lineas, fee) : null
      if (total !== null) ejemplo = `Con ${dec(EJEMPLO_MWH)} MWh al año y FEE de ${dec(fee)} €/MWh → ${euros(total)}.`
      break
    }
    case 'RANGE_LOOKUP':
      calcula = 'El importe se busca en los tramos de la tabla de esta regla (botón «Ver tabla»): un solo dato, sin huecos ni solapes.'
      break
    case 'MATRIX_LOOKUP':
    case 'MULTI_DIMENSION_LOOKUP':
      calcula = 'El importe se busca en la tabla de esta regla (botón «Ver tabla»): cada celda combina dos o más datos del contrato.'
      break
    case 'MANUAL':
      calcula = `No calcula: la propuesta queda en «Revisión manual» con el mensaje «${texto(motivo) || '…'}».`
      break
    case 'NOT_COMMISSIONABLE':
      calcula = `No comisiona: la propuesta se cierra como «No comisionable» (0 €) con el mensaje «${texto(motivo) || '…'}».`
      break
    default:
      calcula = 'Elija un método de cálculo.'
  }
  // Regla que cobra solo una parte de lo calculado (renovaciones tácitas al 80 %)
  const pct = numero(porcentajeResultado)
  if (!METODOS_CON_MOTIVO.includes(metodo) && pct !== null && pct !== 100) {
    calcula = `${calcula} Se cobra el ${dec(pct)} % de lo calculado.`.trim()
  }
  const n = numero(numeroPagos)
  const pago = METODOS_CON_MOTIVO.includes(metodo) ? null
    : n !== null
      ? `${n === 1 ? 'Un pago' : `${n} pagos`}, solo en esta regla (en vez de los de la comercializadora).`
      : 'Los de la comercializadora (pestaña Cobros y cuotas).'
  return { aplica, calcula, ejemplo, pago }
}

// ---------------------------------------------------------------------------
// Resumen de una regla guardada (lista de reglas de Configuración MCAS)
// ---------------------------------------------------------------------------

/**
 * Resumen legible de una regla tal como la devuelve el servidor (con sus JSON):
 * a quién se aplica y cómo calcula. Los criterios que el formulario no
 * representa se cuentan («Otro criterio avanzado»), nunca se enseñan sus claves.
 */
export function resumenDeRegla(regla, { nombreProducto = null } = {}) {
  const r = regla || {}
  const cond = leerCondiciones(r.condicionesJson)
  const calc = leerCalculo(r.metodoCalculo, r.calculoJson)
  const pago = leerPago(r.politicaPagoJson)
  const resumen = resumenRegla({
    metodo: r.metodoCalculo,
    condiciones: cond.form,
    calculo: calc.form,
    motivo: r.motivoManual,
    numeroPagos: pago.numeroPagos,
    nombreProducto,
    porcentajeResultado: r.porcentajeResultado,
  })
  if (cond.error) return { ...resumen, aplica: ['Las condiciones no se pueden leer: revíselas con «Editar como JSON»'] }
  const extras = Object.keys(cond.extras).length
  if (extras) {
    const base = describirCondiciones(cond.form, nombreProducto)
    resumen.aplica = [...base, extras === 1 ? 'Otro criterio avanzado' : `Otros ${extras} criterios avanzados`]
  }
  return resumen
}
