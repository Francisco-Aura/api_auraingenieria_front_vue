import { tareasApi } from '@/services/tareasApi'

class NotificacionesPolling {
  constructor() {
    this.intervaloId = null
    this.intervaloMs = 5000 // Cada 5 segundos
    this.callbacks = [] // Array de callbacks para actualizar componentes
    this.usuarioId = null
    this.activo = false
  }

  // Registrar un callback para cuando hay nuevas notificaciones
  onNotificacionesActualizadas(callback) {
    this.callbacks.push(callback)
  }

  // Iniciar el polling
  iniciar(usuarioId) {
    if (this.activo) {
      console.log('Polling de notificaciones ya está activo')
      return
    }

    if (!usuarioId) {
      console.error('Se requiere usuarioId para iniciar polling')
      return
    }

    this.usuarioId = usuarioId
    this.activo = true

    console.log('Iniciando polling de notificaciones cada', this.intervaloMs, 'ms para usuario', usuarioId)

    // Hacer la primera llamada inmediatamente
    this.verificarNotificaciones()

    // Después, establecer el intervalo
    this.intervaloId = setInterval(() => {
      this.verificarNotificaciones()
    }, this.intervaloMs)
  }

  // Detener el polling
  detener() {
    if (this.intervaloId) {
      clearInterval(this.intervaloId)
      this.intervaloId = null
      this.activo = false
      console.log('Polling de notificaciones detenido')
    }
  }

  // Verificar nuevas notificaciones
  async verificarNotificaciones() {
    try {
      if (!this.usuarioId) return

      const notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(this.usuarioId)
      
      // Llamar a todos los callbacks registrados
      this.callbacks.forEach(callback => {
        callback(notificaciones)
      })

    } catch (error) {
      console.error('Error verificando notificaciones:', error)
    }
  }

  // Cambiar intervalo de polling
  cambiarIntervalo(ms) {
    this.intervaloMs = ms
    if (this.activo) {
      this.detener()
      this.iniciar(this.usuarioId)
    }
  }
}

// Crear una instancia global
export const notificacionesPolling = new NotificacionesPolling()
