<template>
  <div class="notificaciones-container">
    <!-- Indicador de notificaciones -->
    <div class="notificaciones-trigger" @click="toggleMenu">
      <button class="btn-icon notification-btn" :class="{ 'campana-urgente': tareasVenciendoHoyLista.length > 0 }" aria-label="Notificaciones">
        <i class="fas fa-bell"></i>
        <span v-if="contadorNoLeidas > 0" class="notification-badge">{{ contadorNoLeidas > 99 ? '99+' : contadorNoLeidas }}</span>
        <span v-if="tareasVenciendoHoyLista.length > 0" class="vencimiento-badge-urgente" :title="`${tareasVenciendoHoyLista.length} tarea(s) vence(n) hoy`">!</span>
      </button>
    </div>

    <!-- Menú de notificaciones -->
    <div v-if="menuAbierto" class="notificaciones-menu">
      <div class="notificaciones-header">
        <span>Notificaciones {{ mostrarSoloNoLeidas ? '(No leídas)' : '(Leídas)' }}</span>
        <div class="header-actions">
          <div class="filtro-tipo">
            <select v-model="filtroTipoSeleccionado" @change="aplicarFiltroTipo" class="filtro-select">
              <option value="">Todos</option>
              <option value="ASIGNADA">Asignadas</option>
              <option value="CAMBIO_ESTADO">Cambios</option>
              <option value="VENCIMIENTO">Vencimientos</option>
              <option value="COMENTARIO">Comentarios</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="MENCION">Menciones</option>
              <option value="PLANIFICADOR">Planificador</option>
            </select>
          </div>
          <button 
            class="btn-icon"
            @click="alternarSonidos"
            :title="sonidosActivados ? 'Desactivar sonidos' : 'Activar sonidos'"
            :class="{ 'sonido-activo': sonidosActivados, 'sonido-inactivo': !sonidosActivados }"
          >
            <i :class="sonidosActivados ? 'fas fa-volume-up' : 'fas fa-volume-mute'"></i>
          </button>
          <button 
            class="btn-icon"
            @click="alternarVistaNotificaciones"
            :title="mostrarSoloNoLeidas ? 'Ver todas las notificaciones' : 'Ver solo no leídas'"
          >
            <i :class="mostrarSoloNoLeidas ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
          </button>
          <button 
            class="btn-icon" 
            @click="marcarTodasComoLeidas"
            :disabled="contadorNoLeidas === 0"
            title="Marcar todas como leídas"
          >
            <i class="fas fa-check-double"></i>
          </button>
          <button 
            class="btn-icon" 
            @click="cargarNotificaciones"
            :class="{ 'loading': cargando }"
            title="Actualizar"
          >
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div class="notificaciones-contenido">
        <!-- Banner vencimientos hoy -->
        <div v-if="tareasVenciendoHoyLista.length > 0" class="vencimiento-hoy-banner">
          <div class="vencimiento-banner-header" @click="verDetalleBanner = !verDetalleBanner">
            <span><i class="fas fa-exclamation-triangle"></i> {{ tareasVenciendoHoyLista.length }} tarea{{ tareasVenciendoHoyLista.length !== 1 ? 's' : '' }} vence{{ tareasVenciendoHoyLista.length !== 1 ? 'n' : '' }} hoy</span>
            <div class="vencimiento-banner-toggle">
              <i class="fas" :class="verDetalleBanner ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
              <button
                class="vencimiento-banner-dismiss"
                @click.stop="tareasVenciendoHoyLista = []"
                title="Descartar aviso"
              ><i class="fas fa-times"></i></button>
            </div>
          </div>
          <ul v-if="verDetalleBanner" class="vencimiento-tareas-lista">
            <li v-for="tarea in tareasVenciendoHoyLista" :key="tarea.id" @click="irATarea(tarea.id)">
              <i class="fas fa-clock"></i> {{ tarea.titulo }}
            </li>
          </ul>
        </div>
        <div v-if="cargando && notificaciones.length === 0" class="cargando">
          <div class="spinner-small"></div>
          <p>Cargando notificaciones...</p>
        </div>

        <div v-else-if="notificaciones.length === 0" class="sin-notificaciones">
          <i class="fas fa-bell fa-2x"></i>
          <p>No hay notificaciones</p>
        </div>

        <div v-else class="lista-notificaciones">
          <div
            v-for="notificacion in notificacionesFiltradas"
            :key="notificacion.id"
            class="notificacion-item"
            :class="{ 'no-leida': !notificacion.leida, 'tipo-completada': notificacion.tipo === 'COMPLETADA', 'tipo-mencion': notificacion.tipo === 'MENCION' }"
            @click="handleClickNotificacion(notificacion)"
          >
            <div class="notificacion-icono">
              <i 
                class="fas"
                :class="[getTipoIcon(notificacion.tipo), getTipoColor(notificacion.tipo)]"
              ></i>
            </div>

            <div class="notificacion-contenido">
              <p class="notificacion-mensaje">{{ notificacion.mensaje }}</p>
              <div class="notificacion-meta">
                <small class="notificacion-tiempo">
                  {{ formatearTiempoRelativo(notificacion.fechaCreacion) }}
                </small>
                <small class="notificacion-tarea">
                  {{ notificacion.tareaTitulo }}
                </small>
              </div>
            </div>

            <div class="notificacion-acciones">
              <button 
                v-if="!notificacion.leida"
                class="btn-icon"
                @click.stop="marcarComoLeida(notificacion.id)"
                title="Marcar como leída"
              >
                <i class="fas fa-check"></i>
              </button>
              <button 
                class="btn-icon"
                @click.stop="eliminarNotificacion(notificacion.id)"
                title="Eliminar notificación"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="notificaciones.length > 0" class="notificaciones-footer">
        <button class="btn btn-link" @click="verTodasLasNotificaciones">
          Ver todas las notificaciones
        </button>
      </div>
    </div>

    <!-- Modal de todas las notificaciones -->
    <div v-if="modalTodasNotificaciones" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-modal-title" @click="modalTodasNotificaciones = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 id="notif-modal-title">Todas las Notificaciones</h3>
          <button class="close-button" @click="modalTodasNotificaciones = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="cargandoTodas" class="cargando">
            <div class="spinner-small"></div>
            <p>Cargando todas las notificaciones...</p>
          </div>

          <div v-else-if="todasLasNotificaciones.length === 0" class="sin-notificaciones">
            <i class="fas fa-bell fa-3x"></i>
            <h3>No hay notificaciones</h3>
          </div>

          <div v-else class="lista-notificaciones-completa">
            <div
              v-for="notificacion in todasLasNotificaciones"
              :key="notificacion.id"
              class="notificacion-item-completa"
              :class="{ 'no-leida': !notificacion.leida, 'tipo-completada': notificacion.tipo === 'COMPLETADA', 'tipo-mencion': notificacion.tipo === 'MENCION' }"
            >
              <div class="notificacion-icono">
                <i 
                  class="fas"
                  :class="[getTipoIcon(notificacion.tipo), getTipoColor(notificacion.tipo)]"
                ></i>
              </div>

              <div class="notificacion-contenido">
                <p class="notificacion-mensaje">{{ notificacion.mensaje }}</p>
                <div class="notificacion-meta">
                  <small class="notificacion-tiempo">
                    {{ formatearFecha(notificacion.fechaCreacion) }}
                  </small>
                  <small class="notificacion-tarea">
                    {{ notificacion.tipo === 'PLANIFICADOR' ? '' : 'Tarea: ' }}{{ notificacion.tareaTitulo }}
                  </small>
                </div>
              </div>

              <div class="notificacion-acciones">
                <button 
                  v-if="!notificacion.leida"
                  class="btn-icon"
                  @click="marcarComoLeida(notificacion.id)"
                  title="Marcar como leída"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button 
                  class="btn-icon"
                  @click="eliminarNotificacion(notificacion.id)"
                  title="Eliminar"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Snackbar para mensajes -->
    <div v-if="snackbar.show" class="snackbar" :class="snackbar.color">
      <span>{{ snackbar.message }}</span>
      <button @click="snackbar.show = false" class="snackbar-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'
import { notificacionesPolling } from '@/services/notificacionesPolling'
import { audioService } from '@/services/audioService'

export default {
  name: 'NotificacionesComponent',
  data() {
    return {
      menuAbierto: false,
      modalTodasNotificaciones: false,
      vencimientosIntervalId: null,
      notificaciones: [],
      notificacionesFiltradas: [],
      todasLasNotificaciones: [],
      contadorNoLeidas: 0,
      cargando: false,
      cargandoTodas: false,
      filtroTipoSeleccionado: '',
      sonidosActivados: true,
      mostrarSoloNoLeidas: true,
      
      // Vencimientos hoy
      tareasVenciendoHoyLista: [],
      verDetalleBanner: false,
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  computed: {
  },
  mounted() {
    this.inicializar()
    this.cargarTareasVenciendoHoy()
    // Refrescar vencimientos cada 5 minutos
    this.vencimientosIntervalId = setInterval(() => this.cargarTareasVenciendoHoy(), 300000)
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    // Detener polling si se desmonta
    notificacionesPolling.detener()
    if (this.vencimientosIntervalId) clearInterval(this.vencimientosIntervalId)
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    async inicializar() {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        if (!usuario.id) {
          console.warn('No se encontró usuario en localStorage')
          return
        }
        
        // Cargar estado de sonidos
        this.sonidosActivados = localStorage.getItem('sonidos_notificaciones_enabled') !== 'false'
        
        const moduloActivo = await tareasApi.verificarModuloActivo()
        if (moduloActivo) {
          // Iniciar polling automático
          notificacionesPolling.iniciar(usuario.id)
          
          // Registrar callback para actualizar el componente cuando hay nuevas notificaciones
          notificacionesPolling.onNotificacionesActualizadas((notificaciones) => {
            // Solo actualizar el contador y aplicar filtros
            // No reemplazar la lista completa para evitar desaparición cuando se ven leídas
            const notificacionesAnteriores = this.contadorNoLeidas
            this.contadorNoLeidas = notificaciones.length
            
            // Solo actualizar la lista si estamos viendo notificaciones no leídas
            if (this.mostrarSoloNoLeidas && this.menuAbierto) {
              this.notificaciones = notificaciones
              this.aplicarFiltroTipo()
            }
            
            // Reproducir sonido si hay nuevas notificaciones no leídas
            if (notificaciones.length > notificacionesAnteriores && this.sonidosActivados) {
              audioService.reproducirNotificacion()
            }

            // Refrescar vencimientos de hoy al recibir push
            this.cargarTareasVenciendoHoy()
          })
          
          // Cargar notificaciones iniciales
          await this.actualizarContador()
        }
      } catch (error) {
        console.error('Error inicializando notificaciones:', error)
      }
    },
    
    toggleMenu() {
      this.menuAbierto = !this.menuAbierto
      if (this.menuAbierto) {
        this.cargarNotificaciones()
      }
    },
    
    alternarSonidos() {
      this.sonidosActivados = !this.sonidosActivados
      audioService.alternarSonidos(this.sonidosActivados)
      this.mostrarMensaje(
        this.sonidosActivados ? 'Sonidos de notificación activados' : 'Sonidos de notificación desactivados',
        'success'
      )
      if (this.sonidosActivados) {
        audioService.reproducirNotificacion()
      }
    },
    
    async cargarTareasVenciendoHoy() {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        if (!usuario.id) return
        this.tareasVenciendoHoyLista = await tareasApi.obtenerTareasVencenHoy(parseInt(usuario.id), parseInt(usuario.nivelAcceso))
      } catch (e) {
        console.error('Error cargando tareas vencen hoy:', e)
      }
    },

    irATarea(tareaId) {
      this.$router.push({ path: '/dashboard/tareas', query: { destacar: tareaId, abrirDetalle: tareaId } })
      this.menuAbierto = false
    },
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.menuAbierto = false
      }
    },
    
    async cargarNotificaciones() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (!usuario.id) {
        console.warn('No se encontró usuario en localStorage')
        return
      }
      
      try {
        this.cargando = true
        
        if (this.mostrarSoloNoLeidas) {
          // Cargar solo no leídas
          this.notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(parseInt(usuario.id))
        } else {
          // Cargar todas (leídas + no leídas)
          this.notificaciones = await tareasApi.obtenerNotificacionesPorUsuario(parseInt(usuario.id))
          // Filtrar para mostrar solo las leídas
          this.notificaciones = this.notificaciones.filter(n => n.leida === true)
        }
        
        this.aplicarFiltroTipo()
        await this.actualizarContador()
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
        this.mostrarMensaje('Error al cargar las notificaciones', 'error')
      } finally {
        this.cargando = false
      }
    },
    
    async alternarVistaNotificaciones() {
      this.mostrarSoloNoLeidas = !this.mostrarSoloNoLeidas
      await this.cargarNotificaciones()
    },
    
    async cargarTodasLasNotificaciones() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (!usuario.id) {
        console.warn('No se encontró usuario para cargar todas las notificaciones')
        return
      }
      
      try {
        this.cargandoTodas = true
        this.todasLasNotificaciones = await tareasApi.obtenerNotificacionesPorUsuario(parseInt(usuario.id))
      } catch (error) {
        console.error('Error cargando todas las notificaciones:', error)
        this.mostrarMensaje('Error al cargar el historial de notificaciones', 'error')
      } finally {
        this.cargandoTodas = false
      }
    },
    
    async actualizarContador() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (!usuario.id) return
      
      try {
        this.contadorNoLeidas = await tareasApi.contarNotificacionesNoLeidas(parseInt(usuario.id))
      } catch (error) {
        console.error('Error actualizando contador:', error)
      }
    },
    
    async marcarComoLeida(notificacionId) {
      try {
        await tareasApi.marcarNotificacionComoLeida(notificacionId)
        
        // Actualizar listas locales
        const notif = this.notificaciones.find(n => n.id === notificacionId)
        if (notif) {
          notif.leida = true
        }
        
        const notifTodas = this.todasLasNotificaciones.find(n => n.id === notificacionId)
        if (notifTodas) {
          notifTodas.leida = true
        }
        
        await this.actualizarContador()
      } catch (error) {
        console.error('Error marcando como leída:', error)
        this.mostrarMensaje('Error al marcar la notificación como leída', 'error')
      }
    },
    
    async marcarTodasComoLeidas() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (!usuario.id) return
      
      try {
        await tareasApi.marcarTodasNotificacionesComoLeidas(parseInt(usuario.id))
        
        // Actualizar listas locales
        this.notificaciones.forEach(n => n.leida = true)
        this.todasLasNotificaciones.forEach(n => n.leida = true)
        
        this.contadorNoLeidas = 0
        this.mostrarMensaje('Todas las notificaciones marcadas como leídas', 'success')
      } catch (error) {
        console.error('Error marcando todas como leídas:', error)
        this.mostrarMensaje('Error al marcar las notificaciones como leídas', 'error')
      }
    },
    
    async eliminarNotificacion(notificacionId) {
      try {
        await tareasApi.eliminarNotificacion(notificacionId)
        
        // Remover de listas locales
        this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId)
        this.todasLasNotificaciones = this.todasLasNotificaciones.filter(n => n.id !== notificacionId)
        
        await this.actualizarContador()
        this.mostrarMensaje('Notificación eliminada', 'success')
      } catch (error) {
        console.error('Error eliminando notificación:', error)
        this.mostrarMensaje('Error al eliminar la notificación', 'error')
      }
    },
    
    handleClickNotificacion(notificacion) {
      if (!notificacion.leida) {
        this.marcarComoLeida(notificacion.id)
      }
      
      // Avisos del planificador: abrir el planificador en su proyecto y su tarea ("proyecto=ID&tarea=ID")
      if (notificacion.tipo === 'PLANIFICADOR') {
        const enlace = new URLSearchParams(notificacion.enlace || '')
        const query = {}
        if (enlace.get('proyecto')) query.proyecto = enlace.get('proyecto')
        if (enlace.get('tarea')) query.tarea = enlace.get('tarea')
        this.$router.push({ path: '/dashboard/planificador', query })
        this.menuAbierto = false
        return
      }

      // Navegar a la tarea si es posible
      if (notificacion.tareaId) {
        this.$router.push({
          path: '/dashboard/tareas',
          query: { destacar: notificacion.tareaId }
        })
        this.menuAbierto = false
      }
    },
    
    verTodasLasNotificaciones() {
      this.modalTodasNotificaciones = true
      this.menuAbierto = false
      this.cargarTodasLasNotificaciones()
    },
    
    getTipoIcon(tipo) {
      switch (tipo) {
        case 'ASIGNADA': return 'fa-user-plus'
        case 'CAMBIO_ESTADO': return 'fa-exchange-alt'
        case 'VENCIMIENTO': return 'fa-exclamation-triangle'
        case 'COMENTARIO': return 'fa-comment-dots'
        case 'COMPLETADA': return 'fa-check-double'
        case 'MENCION': return 'fa-at'
        case 'PLANIFICADOR': return 'fa-solar-panel'
        default: return 'fa-bell'
      }
    },
    
    getTipoColor(tipo) {
      switch (tipo) {
        case 'ASIGNADA': return 'tipo-color-asignada' // Verde - nueva asignación
        case 'CAMBIO_ESTADO': return 'tipo-color-cambio-estado' // Azul - cambio de estado
        case 'VENCIMIENTO': return 'tipo-color-vencimiento' // Rojo/naranja - urgente
        case 'COMENTARIO': return 'tipo-color-comentario' // Púrpura - comentario
        case 'COMPLETADA': return 'tipo-color-completada' // Verde teal - completada
        case 'MENCION': return 'tipo-color-mencion' // Azul oscuro - mención
        case 'PLANIFICADOR': return 'tipo-color-planificador' // Azul oscuro - planificador
        default: return 'tipo-color-general' // Naranja - general
      }
    },
    
    formatearTiempoRelativo(fecha) {
      if (!fecha) return ''
      
      const ahora = new Date()
      const fechaNotif = new Date(fecha)
      const diferencia = ahora - fechaNotif
      
      const minutos = Math.floor(diferencia / (1000 * 60))
      const horas = Math.floor(diferencia / (1000 * 60 * 60))
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
      
      if (minutos < 1) return 'Ahora'
      if (minutos < 60) return `Hace ${minutos}min`
      if (horas < 24) return `Hace ${horas}h`
      if (dias < 7) return `Hace ${dias}d`
      
      return fechaNotif.toLocaleDateString('es-ES')
    },
    
    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    aplicarFiltroTipo() {
      if (!this.filtroTipoSeleccionado) {
        this.notificacionesFiltradas = [...this.notificaciones]
      } else {
        this.notificacionesFiltradas = this.notificaciones.filter(n => n.tipo === this.filtroTipoSeleccionado)
      }
    },

    mostrarMensaje(message, color = 'success') {
      this.snackbar = {
        show: true,
        message,
        color
      }
      
      setTimeout(() => {
        this.snackbar.show = false
      }, 3000)
    }
  }
}
</script>

<style scoped src="./NotificacionesComponent.css"></style>
