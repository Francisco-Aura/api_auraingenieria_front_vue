import axios from 'axios'

/**
 * Contador de comisiones MCAS pendientes para el menú lateral (solo administradores).
 *
 * - Pregunta GET /mcas/propuestas/recuento al empezar y después cada 60 s.
 * - Con la pestaña del navegador oculta no pregunta: al volver a verse actualiza enseguida.
 * - Al recibir el evento de ventana «mcas:propuestas-cambiadas» (aprobar, rechazar,
 *   descartar, editar o guardar un contrato) actualiza al momento.
 */
export const EVENTO_PROPUESTAS_CAMBIADAS = 'mcas:propuestas-cambiadas'
export const INTERVALO_PENDIENTES_MS = 60 * 1000

const URL_RECUENTO = '/mcas/propuestas/recuento'
const ventanaGlobal = () => (typeof window !== 'undefined' ? window : null)
const documentoGlobal = () => (typeof document !== 'undefined' ? document : null)

/** Avisa a quien escuche (el contador del menú) de que alguna propuesta ha cambiado. */
export function avisarPropuestasCambiadas(ventana = ventanaGlobal()) {
  if (!ventana || typeof ventana.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') return
  ventana.dispatchEvent(new CustomEvent(EVENTO_PROPUESTAS_CAMBIADAS))
}

const numero = (valor) => {
  const n = Number(valor)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function normalizarRecuento(datos) {
  const porValidar = numero(datos?.porValidar)
  const porRevisar = numero(datos?.porRevisar)
  const enCorreccion = numero(datos?.enCorreccion)
  const total = datos?.total != null ? numero(datos.total) : porValidar + porRevisar + enCorreccion
  return { porValidar, porRevisar, enCorreccion, total }
}

const cantidad = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`

/** «3 por aprobar · 5 necesitan atención · 1 en corrección» (título de la insignia del menú). */
export function textoPendientesMcas(recuento) {
  if (!recuento) return ''
  return [
    cantidad(numero(recuento.porValidar), 'por aprobar', 'por aprobar'),
    cantidad(numero(recuento.porRevisar), 'necesita atención', 'necesitan atención'),
    cantidad(numero(recuento.enCorreccion), 'en corrección', 'en corrección'),
  ].join(' · ')
}

/**
 * Crea el sondeo. Las dependencias se pueden cambiar (pruebas); por defecto usa axios,
 * window, document, setInterval y clearInterval.
 */
export function crearSondeoPendientes({
  http = axios,
  ventana = ventanaGlobal(),
  documento = documentoGlobal(),
  intervalo = INTERVALO_PENDIENTES_MS,
  programar = (fn, ms) => setInterval(fn, ms),
  cancelar = (id) => clearInterval(id),
} = {}) {
  const oyentes = new Set()
  let recuento = null
  let activo = false
  let temporizador = null
  let ultimaPeticion = 0

  const oculto = () => !!documento?.hidden

  function arrancarTemporizador() {
    if (temporizador == null) temporizador = programar(() => refrescar(), intervalo)
  }

  function pararTemporizador() {
    if (temporizador != null) {
      cancelar(temporizador)
      temporizador = null
    }
  }

  async function refrescar() {
    if (!activo) return recuento
    const peticion = ++ultimaPeticion
    try {
      const { data } = await http.get(URL_RECUENTO)
      // Solo vale la respuesta a la última pregunta: una más lenta no pisa a otra más reciente
      if (!activo || peticion !== ultimaPeticion) return recuento
      recuento = normalizarRecuento(data)
      oyentes.forEach((oyente) => oyente(recuento))
    } catch (e) {
      // En segundo plano: sin diálogos. Se reintenta en la siguiente vuelta,
      // salvo si el servidor dice que este usuario no puede consultarlo.
      const estado = e?.response?.status
      console.warn('[MCAS] No se pudo consultar el recuento de comisiones pendientes:', e?.message || e)
      if (estado === 401 || estado === 403) detener()
    }
    return recuento
  }

  function alCambiarVisibilidad() {
    if (!activo) return
    if (oculto()) {
      pararTemporizador()
    } else {
      refrescar()
      arrancarTemporizador()
    }
  }

  function alCambiarPropuestas() {
    if (activo && !oculto()) refrescar()
  }

  function iniciar() {
    if (activo) return
    activo = true
    ventana?.addEventListener?.(EVENTO_PROPUESTAS_CAMBIADAS, alCambiarPropuestas)
    documento?.addEventListener?.('visibilitychange', alCambiarVisibilidad)
    if (!oculto()) {
      refrescar()
      arrancarTemporizador()
    }
  }

  function detener() {
    activo = false
    ultimaPeticion++
    pararTemporizador()
    ventana?.removeEventListener?.(EVENTO_PROPUESTAS_CAMBIADAS, alCambiarPropuestas)
    documento?.removeEventListener?.('visibilitychange', alCambiarVisibilidad)
  }

  /** Recibe cada recuento nuevo (y el último, si ya lo hay). Devuelve la función para dejar de escuchar. */
  function suscribir(oyente) {
    oyentes.add(oyente)
    if (recuento) oyente(recuento)
    return () => oyentes.delete(oyente)
  }

  return {
    iniciar,
    detener,
    refrescar,
    suscribir,
    get recuento() { return recuento },
  }
}
