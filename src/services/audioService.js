// Servicio de reproducción de sonidos para notificaciones

class AudioService {
  constructor() {
    this.sonidosPermitidos = localStorage.getItem('sonidos_notificaciones_enabled') !== 'false'
    this.volumen = parseFloat(localStorage.getItem('sonidos_notificaciones_volumen') || '0.3')
    this.contextoAudio = null
  }

  // Un único contexto de audio para toda la sesión: el navegador limita cuántos
  // puede haber abiertos y cada uno reserva recursos de sonido hasta que se cierra.
  obtenerContexto() {
    if (!this.contextoAudio) {
      const Contexto = window.AudioContext || window.webkitAudioContext
      this.contextoAudio = new Contexto()
    }
    if (this.contextoAudio.state === 'suspended') {
      this.contextoAudio.resume().catch(() => {})
    }
    return this.contextoAudio
  }

  // Reproducir sonido de notificación
  reproducirNotificacion() {
    if (!this.sonidosPermitidos) {

      return
    }

    try {
      // Crear elemento de audio dinámico con sonido Web Audio API
      this.crearYReproducirSonidoNotificacion()
    } catch (error) {
      console.error('Error reproduciendo sonido:', error)
    }
  }

  // Crear sonido de notificación usando Web Audio API
  crearYReproducirSonidoNotificacion() {
    try {
      const audioContext = this.obtenerContexto()
      
      // Crear un sonido muy discreto y suave (como un "ding" suave)
      const ahora = audioContext.currentTime
      
      // Un solo tono corto y suave
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(audioContext.destination)
      
      // Frecuencia más baja y agradable
      osc.frequency.value = 520 // Hz (nota musical más suave)
      
      // Volumen muy bajo (20% del volumen configurado)
      gain.gain.setValueAtTime(0.08 * this.volumen, ahora)
      // Fade out muy rápido (suave desvanecimiento)
      gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.15)
      
      osc.start(ahora)
      osc.stop(ahora + 0.15)
      

    } catch (error) {
      console.error('Error creando sonido:', error)
    }
  }

  // Alternar sonidos activados/desactivados
  alternarSonidos(estado) {
    this.sonidosPermitidos = estado
    localStorage.setItem('sonidos_notificaciones_enabled', estado ? 'true' : 'false')

  }

  // Cambiar volumen
  cambiarVolumen(valor) {
    this.volumen = Math.max(0, Math.min(1, valor))
    localStorage.setItem('sonidos_notificaciones_volumen', this.volumen.toString())
  }

  // Sonido de error
  reproducirError() {
    try {
      const audioContext = this.obtenerContexto()
      const ahora = audioContext.currentTime
      
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(audioContext.destination)
      
      osc.frequency.value = 300 // Hz más bajo
      gain.gain.setValueAtTime(0.2, ahora)
      gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.2)
      
      osc.start(ahora)
      osc.stop(ahora + 0.2)
    } catch (error) {
      console.error('Error reproduciendo sonido de error:', error)
    }
  }

  // Sonido de éxito
  reproducirExito() {
    try {
      const audioContext = this.obtenerContexto()
      const ahora = audioContext.currentTime
      
      // Tono ascendente
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      
      osc.connect(gain)
      gain.connect(audioContext.destination)
      
      osc.frequency.setValueAtTime(600, ahora)
      osc.frequency.linearRampToValueAtTime(800, ahora + 0.15)
      
      gain.gain.setValueAtTime(0.3, ahora)
      gain.gain.exponentialRampToValueAtTime(0.01, ahora + 0.15)
      
      osc.start(ahora)
      osc.stop(ahora + 0.15)
    } catch (error) {
      console.error('Error reproduciendo sonido de éxito:', error)
    }
  }
}

// Crear instancia global
export const audioService = new AudioService()
