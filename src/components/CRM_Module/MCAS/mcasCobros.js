// Condiciones de cobro de las comisiones (pestaña «Cobros y cuotas» de Configuración MCAS).
// Respuestas del cliente del 05/11/2026 (dudas 8 y 9): cada comercializadora cobra la
// comisión en un número de pagos, y el primero llega un tiempo después de la fecha de
// inicio del contrato (a final de mes, el día 1 del siguiente; con Nexo, meses después).
// El cálculo de verdad lo hace el servidor (McasCondicionesCobroService); aquí solo los
// textos, el ejemplo del formulario y la validación, con la misma regla de fechas.

export const PAGOS_MAX = 12
export const MESES_MAX = 24

export const DIAS_COBRO = [
  { value: 'MISMO_DIA', label: 'El mismo día que el inicio del contrato' },
  { value: 'ULTIMO_DIA_MES', label: 'El último día del mes' },
  { value: 'DIA_1', label: 'El día 1 del mes' },
]

/** Contrato de ejemplo para enseñar en el formulario cuándo se cobraría. */
export const INICIO_EJEMPLO = '2026-11-10'

export function condicionCobroVacia() {
  return { idComercializadora: '', idGestora: null, numeroPagos: 1, mesesHastaPrimerCobro: 0, diaPrimerCobro: 'MISMO_DIA', observaciones: '' }
}

/** «1 pago», «3 pagos». Sin número (filas antiguas) se cobra en 1 pago, igual que en el servidor. */
export function textoPagosCobro(numeroPagos) {
  const n = Number(numeroPagos)
  if (numeroPagos === null || numeroPagos === undefined || numeroPagos === '' || !Number.isInteger(n) || n < 1) return '1 pago'
  return n === 1 ? '1 pago' : `${n} pagos`
}

/** «El día de inicio del contrato», «El último día del mes siguiente al de inicio»… */
export function textoPrimerCobro(condicion) {
  const meses = Number(condicion?.mesesHastaPrimerCobro) || 0
  const dia = condicion?.diaPrimerCobro || 'MISMO_DIA'
  const mes = meses === 0 ? 'del mes de inicio' : meses === 1 ? 'del mes siguiente al de inicio' : `${meses} meses después del de inicio`
  if (dia === 'ULTIMO_DIA_MES') return `El último día ${mes}`
  if (dia === 'DIA_1') return `El día 1 ${mes}`
  if (meses === 0) return 'El día de inicio del contrato'
  return meses === 1 ? 'Un mes después del inicio, el mismo día' : `${meses} meses después del inicio, el mismo día`
}

const ddmmaaaa = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

/**
 * Fechas de las cuotas de un contrato que empieza el día `inicio` ('AAAA-MM-DD'), igual que
 * el servidor: cada cuota desde la fecha de inicio (no desde la anterior), + los meses y el
 * día pedidos. Con inicio el 31/01 y el mismo día: 31/01, 28/02, 31/03.
 */
export function fechasCobro(condicion, inicio = INICIO_EJEMPLO, cuotas = 1) {
  const [a, m, d] = String(inicio).split('-').map(Number)
  if (!a || !m || !d) return []
  const meses = Number(condicion?.mesesHastaPrimerCobro) || 0
  const dia = condicion?.diaPrimerCobro || 'MISMO_DIA'
  const fechas = []
  for (let i = 0; i < Math.max(1, cuotas); i++) {
    const mes = m - 1 + meses + i
    const ultimo = new Date(a, mes + 1, 0).getDate()
    const diaMes = dia === 'ULTIMO_DIA_MES' ? ultimo : dia === 'DIA_1' ? 1 : Math.min(d, ultimo)
    fechas.push(ddmmaaaa(new Date(a, mes, diaMes)))
  }
  return fechas
}

/** «Un contrato que empiece el 10/11/2026 se cobraría el 30/11/2026 y el 31/12/2026». */
export function ejemploCobro(condicion, inicio = INICIO_EJEMPLO) {
  const n = Number(condicion?.numeroPagos)
  const cuotas = Number.isInteger(n) && n >= 1 ? Math.min(n, 3) : 1
  const fechas = fechasCobro(condicion, inicio, cuotas)
  if (!fechas.length) return ''
  const lista = fechas.length === 1 ? fechas[0] : `${fechas.slice(0, -1).join(', ')} y ${fechas[fechas.length - 1]}`
  const resto = Number.isInteger(n) && n > 3 ? ` (y así hasta ${n} pagos)` : ''
  return `Un contrato que empiece el ${fechasCobro({}, inicio)[0]} se cobraría el ${lista}${resto}.`
}

/** Errores del formulario por campo (vacío si está bien). */
export function validarCondicionCobro(form, existentes = []) {
  const errores = {}
  if (form.idComercializadora === '' || form.idComercializadora === null || form.idComercializadora === undefined) {
    errores.idComercializadora = 'Seleccione una comercializadora'
  }
  const pagos = form.numeroPagos
  if (pagos !== null && pagos !== '' && pagos !== undefined
    && (!Number.isInteger(Number(pagos)) || Number(pagos) < 1 || Number(pagos) > PAGOS_MAX)) {
    errores.numeroPagos = `Entre 1 y ${PAGOS_MAX} pagos`
  }
  const meses = Number(form.mesesHastaPrimerCobro)
  if (!Number.isInteger(meses) || meses < 0 || meses > MESES_MAX) errores.mesesHastaPrimerCobro = `Entre 0 y ${MESES_MAX} meses`
  const repetida = !errores.idComercializadora && existentes.some(c => c.id !== form.id
    && String(c.idComercializadora) === String(form.idComercializadora)
    && String(c.idGestora ?? '') === String(form.idGestora ?? ''))
  if (repetida) {
    errores.idGestora = form.idGestora
      ? 'Esa comercializadora ya tiene condiciones para esta gestora: edítelas'
      : 'Esa comercializadora ya tiene sus condiciones generales: edítelas'
  }
  return errores
}
