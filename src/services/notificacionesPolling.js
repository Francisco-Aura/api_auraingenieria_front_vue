import { tareasApi } from '@/services/tareasApi'

/**
 * Las librerías del WebSocket (SockJS + STOMP) son más de la mitad del código del
 * panel principal. Se descargan aparte y solo cuando se abre la conexión: con el
 * módulo de tareas desactivado no se descargan nunca y, con él activo, no retrasan
 * la primera pintura del panel. Si la descarga falla, se reintenta en la siguiente
 * conexión (mientras tanto funciona el sondeo HTTP de respaldo).
 */
let libreriasWebSocket = null
function cargarLibreriasWebSocket() {
  if (!libreriasWebSocket) {
    libreriasWebSocket = Promise.all([
      import(/* webpackChunkName: "websocket" */ '@stomp/stompjs'),
      import(/* webpackChunkName: "websocket" */ 'sockjs-client')
    ])
      .then(([stomp, sockjs]) => ({ Client: stomp.Client, SockJS: sockjs.default || sockjs }))
      .catch((error) => {
        libreriasWebSocket = null
        throw error
      })
  }
  return libreriasWebSocket
}

/**
 * Servicio de notificaciones en tiempo real via WebSocket/STOMP.
 * Mantiene la misma API pública que el antiguo servicio de polling:
 *   - onNotificacionesActualizadas(callback)  → callback(notificaciones, origen)
 *     origen: 'inicial' (carga al iniciar), 'push' (aviso del servidor) o 'sondeo' (respaldo)
 *   - iniciar(usuarioId)
 *   - detener()
 */
class NotificacionesService {
  constructor(cargarLibrerias = cargarLibreriasWebSocket) {
    this._cargarLibrerias = cargarLibrerias
    this.stompClient = null
    this.callbacks = []
    this.usuarioId = null
    this.activo = false
    this._fallbackIntervalId = null
    // Cada iniciar()/detener() abre una sesión nueva: lo que llegue tarde de la
    // anterior (la conexión, una respuesta HTTP) se descarta en vez de mezclarse.
    this._sesion = 0
    this._ultimaPeticion = 0
    this._ultimaEntregada = 0
  }

  // Registrar un callback para cuando hay nuevas notificaciones
  onNotificacionesActualizadas(callback) {
    this.callbacks.push(callback)
  }

  // Iniciar la conexión WebSocket y cargar las notificaciones iniciales
  iniciar(usuarioId) {
    if (this.activo) return
    if (!usuarioId) return

    this.usuarioId = usuarioId
    this.activo = true
    const sesion = ++this._sesion

    // Carga inicial: obtener notificaciones no leídas actuales via HTTP
    this._fetchYNotificar('inicial')

    // Conexión STOMP sobre SockJS para recibir nuevas notificaciones en tiempo real
    this._cargarLibrerias()
      .then(({ Client, SockJS }) => {
        // Se detuvo (cierre de sesión) mientras se descargaban: no se conecta
        if (sesion !== this._sesion) return
        this._conectar(Client, SockJS)
      })
      .catch((error) => {
        if (sesion !== this._sesion) return
        console.warn('[Notificaciones] No se pudo cargar el cliente WebSocket, usando fallback polling:', error)
        this._activarFallbackPolling()
      })
  }

  _conectar(Client, SockJS) {
    let conexiones = 0
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        // Con el WebSocket (re)conectado ya no hace falta el sondeo de respaldo
        this._pararFallbackPolling()
        // Al reconectar (suspensión, corte de red, despliegue) se piden las no leídas: los
        // avisos de mientras tanto no llegaron a nadie. La primera vez ya lo hizo la carga inicial
        if (conexiones++ > 0) this._fetchYNotificar('sondeo')
        // Suscripción al topic personal del usuario (el servidor solo admite el propio)
        this.stompClient.subscribe(
          `/topic/notificaciones/${this.usuarioId}`,
          () => {
            this._fetchYNotificar('push')
          }
        )
      },
      onStompError: (frame) => {
        console.error('[Notificaciones] Error STOMP:', frame.headers['message'], frame)
        // El servidor rechazó la conexión o la suscripción (p. ej. la sesión del navegador
        // es ya de otro usuario): reintentar cada 5 s no lo arregla; se pasa al sondeo HTTP.
        if (this.stompClient) {
          this.stompClient.deactivate()
          this.stompClient = null
        }
        this._activarFallbackPolling()
      },
      onWebSocketError: (error) => {
        console.warn('[Notificaciones] Error WebSocket (el servidor puede no tener WS activo, usando fallback polling):', error)
        this._activarFallbackPolling()
      },
      onDisconnect: () => {
        console.warn('[Notificaciones] WebSocket desconectado')
      }
    })

    this.stompClient.activate()
  }

  // Detener la conexión WebSocket y limpiar estado
  detener() {
    this._sesion++
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.stompClient = null
    }
    this._pararFallbackPolling()
    this.activo = false
    this.usuarioId = null
    this.callbacks = []
  }

  // Fallback polling cuando el servidor no tiene WebSocket activo
  _activarFallbackPolling() {
    if (this._fallbackIntervalId) return
    console.warn('[Notificaciones] Activando fallback polling cada 15s')
    this._fallbackIntervalId = setInterval(() => this._fetchYNotificar('sondeo'), 15000)
  }

  _pararFallbackPolling() {
    if (this._fallbackIntervalId) {
      clearInterval(this._fallbackIntervalId)
      this._fallbackIntervalId = null
    }
  }

  // Obtener la lista actualizada de notificaciones no leídas y notificar a los callbacks
  async _fetchYNotificar(origen = 'push') {
    try {
      if (!this.usuarioId) return
      const sesion = this._sesion
      const peticion = ++this._ultimaPeticion
      const notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(this.usuarioId)
      // Una respuesta que llega tarde no pisa a otra más reciente ya entregada, ni
      // llega a la sesión siguiente (p. ej. tras cerrar sesión y entrar con otro usuario)
      if (sesion !== this._sesion || peticion < this._ultimaEntregada) return
      this._ultimaEntregada = peticion
      this.callbacks.forEach(cb => cb(notificaciones, origen))
    } catch (e) {
      console.error('Error al obtener notificaciones no leídas:', e)
    }
  }
}

export const notificacionesPolling = new NotificacionesService()
export default notificacionesPolling
