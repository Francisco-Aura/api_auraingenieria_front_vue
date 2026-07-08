import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { tareasApi } from '@/services/tareasApi'

/**
 * Servicio de notificaciones en tiempo real via WebSocket/STOMP.
 * Mantiene la misma API pública que el antiguo servicio de polling:
 *   - onNotificacionesActualizadas(callback)
 *   - iniciar(usuarioId)
 *   - detener()
 */
class NotificacionesService {
  constructor() {
    this.stompClient = null
    this.callbacks = []
    this.usuarioId = null
    this.activo = false
    this._fallbackIntervalId = null
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

    // Carga inicial: obtener notificaciones no leídas actuales via HTTP
    this._fetchYNotificar()

    // Conexión STOMP sobre SockJS para recibir nuevas notificaciones en tiempo real
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        // Suscripción al topic personal del usuario (no requiere autenticación)
        this.stompClient.subscribe(
          `/topic/notificaciones/${this.usuarioId}`,
          () => {
            this._fetchYNotificar()
          }
        )
      },
      onStompError: (frame) => {
        console.error('[Notificaciones] Error STOMP:', frame.headers['message'], frame)
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
    if (this.stompClient) {
      this.stompClient.deactivate()
      this.stompClient = null
    }
    this._pararFallbackPolling()
    this.activo = false
    this.callbacks = []
  }

  // Fallback polling cuando el servidor no tiene WebSocket activo
  _activarFallbackPolling() {
    if (this._fallbackIntervalId) return
    console.warn('[Notificaciones] Activando fallback polling cada 15s')
    this._fallbackIntervalId = setInterval(() => this._fetchYNotificar(), 15000)
  }

  _pararFallbackPolling() {
    if (this._fallbackIntervalId) {
      clearInterval(this._fallbackIntervalId)
      this._fallbackIntervalId = null
    }
  }

  // Obtener la lista actualizada de notificaciones no leídas y notificar a los callbacks
  async _fetchYNotificar() {
    try {
      if (!this.usuarioId) return
      const notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(this.usuarioId)
      this.callbacks.forEach(cb => cb(notificaciones))
    } catch (e) {
      console.error('Error al obtener notificaciones no leídas:', e)
    }
  }
}

export const notificacionesPolling = new NotificacionesService()
export default notificacionesPolling
