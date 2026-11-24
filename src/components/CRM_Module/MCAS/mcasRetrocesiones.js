/*
 * Retrocesiones automáticas de Comisiones MCAS: textos y cuentas de la tabla y de los
 * diálogos de aprobar y descartar. Sin Vue ni peticiones, para probarlo aparte.
 */
/** «120,50», «120.50» o «1.234,56» a número; null si no lo es. (Sin imports: se prueba aparte.) */
function leerDecimal(texto) {
  const limpio = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null
}

export const RETROCESION_PENDIENTE = 'PENDIENTE'

const MOTIVOS = {
  BAJA_CONTRATO: 'Baja del contrato',
  BAJA_PUNTO: 'Baja del punto de suministro',
  CAMBIO_COMERCIALIZADORA: 'Cambio de comercializadora',
}

const ESTADOS = {
  PENDIENTE: { label: 'Por aprobar', tono: 'warning' },
  APROBADA: { label: 'Aprobada', tono: 'success' },
  DESCARTADA: { label: 'No procede', tono: 'neutral' },
}

export const motivoRetrocesion = (motivo) => MOTIVOS[motivo] || 'Baja anticipada'
export const estadoRetrocesion = (estado) => ESTADOS[estado] || { label: estado || '—', tono: 'neutral' }

/** Pasa la fila del servidor ({ retrocesion, cliente, ... }) a un objeto plano para la tabla. */
export function filaRetrocesion(vista) {
  const r = vista?.retrocesion || {}
  return {
    ...r,
    cliente: vista?.cliente || '—',
    numeroContrato: vista?.numeroContrato || (r.idContrato ? `Contrato #${r.idContrato}` : '—'),
    cups: vista?.cups || '',
    comercializadora: vista?.comercializadora || '—',
    politica: vista?.politica || '',
  }
}

export const retrocesionesPendientes = (filas) => (filas || []).filter(r => r.estado === RETROCESION_PENDIENTE)

/** Importe que se enseña: el aprobado si lo hay; si no, el calculado (null = hay que escribirlo). */
export const importeRetrocesion = (r) => r?.importeDefinitivo ?? r?.importeCalculado ?? null

/** «96 días (16/03/2026 a 20/06/2026)» con el formateador de fechas que se le pase. */
export function tiempoActivo(r, formatFecha) {
  const dias = `${r.diasActivo} día${r.diasActivo === 1 ? '' : 's'}`
  return `${dias} (${formatFecha(r.fechaInicio)} a ${formatFecha(r.fechaFin)})`
}

/**
 * Lo escrito en «Importe a devolver» al aprobar: { importe } o { error }. Vacío vale si la
 * retrocesión ya tiene importe calculado (se usa ese); 0 vale (solo se anulan cuotas).
 */
export function leerImporteRetrocesion(texto, r) {
  const limpio = String(texto ?? '').trim()
  if (!limpio) {
    return r?.importeCalculado != null
      ? { importe: null }
      : { error: 'Escriba el importe que se devuelve: no se ha podido calcular solo' }
  }
  const valor = leerDecimal(limpio)
  if (valor == null || Number.isNaN(valor)) return { error: 'Escriba un importe válido, por ejemplo 120,50' }
  if (valor < 0) return { error: 'Escriba el importe en positivo: es lo que se devuelve' }
  return { importe: Math.round(valor * 100) / 100 }
}
