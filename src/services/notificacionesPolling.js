import { tareasApi } from '@/services/tareasApi'

class NotificacionesPolling {
  constructor() {
    this.intervaloId = null
    this.intervaloMs = 10000 // Cada 10 segundos (aumentado de 5s para reducir carga)
    this.callbacks = [] // Array de callbacks para actualizar componentes
    this.usuarioId = null
    this.activo = false
    this.enProgreso = false // Flag para evitar llamadas concurrentes
    this.erroresConsecutivos = 0 // Contador de errores
    this.maxErrores = 3 // Máximo de errores antes de aumentar intervalo
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
    this.erroresConsecutivos = 0

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
      this.enProgreso = false
      this.erroresConsecutivos = 0
      console.log('Polling de notificaciones detenido')
    }
  }

  // Verificar nuevas notificaciones
  async verificarNotificaciones() {
    // Evitar llamadas concurrentes
    if (this.enProgreso) {
      console.log('Ya hay una verificación en progreso, saltando...')
      return
    }

    try {
      if (!this.usuarioId) return

      this.enProgreso = true

      const notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(this.usuarioId)
      
      // Si fue exitoso, resetear contador de errores
      this.erroresConsecutivos = 0
      
      // Si el intervalo se había aumentado por errores, restaurarlo
      if (this.intervaloMs > 10000) {
        this.cambiarIntervalo(10000)
      }
      
      // Llamar a todos los callbacks registrados
      this.callbacks.forEach(callback => {
        callback(notificaciones)
      })

    } catch (error) {
      this.erroresConsecutivos++
      
      console.error(`Error verificando notificaciones (${this.erroresConsecutivos}/${this.maxErrores}):`, error.message)
      
      // Si hay muchos errores consecutivos, aumentar el intervalo para reducir carga
      if (this.erroresConsecutivos >= this.maxErrores && this.intervaloMs < 30000) {
        console.warn('Demasiados errores consecutivos, aumentando intervalo de polling a 30 segundos')
        this.cambiarIntervalo(30000)
      }
    } finally {
      this.enProgreso = false
    }
  }

  // Cambiar intervalo de polling
  cambiarIntervalo(ms) {
    const cambio = this.intervaloMs !== ms
    this.intervaloMs = ms
    
    if (this.activo && cambio) {
      console.log('Cambiando intervalo de polling a', ms, 'ms')
      this.detener()
      this.iniciar(this.usuarioId)
    }
  }
}

// Crear una instancia global
export const notificacionesPolling = new NotificacionesPolling()
