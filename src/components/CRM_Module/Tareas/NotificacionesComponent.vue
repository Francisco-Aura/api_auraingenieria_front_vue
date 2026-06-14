<template>
  <div class="notificaciones-container">
    <!-- Indicador de notificaciones -->
    <div class="notificaciones-trigger" @click="toggleMenu">
      <button class="btn-icon notification-btn" :class="{ 'campana-urgente': tareasVenciendoHoyLista.length > 0 }">
        <i class="fas fa-bell"></i>
        <span v-if="contadorNoLeidas > 0" class="notification-badge">{{ contadorNoLeidas }}</span>
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
            <div style="display:flex;align-items:center;gap:6px">
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
                :class="getTipoIcon(notificacion.tipo)"
                :style="{ color: getTipoColor(notificacion.tipo) }"
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
    <div v-if="modalTodasNotificaciones" class="modal-overlay" @click="modalTodasNotificaciones = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Todas las Notificaciones</h3>
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
                  :class="getTipoIcon(notificacion.tipo)"
                  :style="{ color: getTipoColor(notificacion.tipo) }"
                ></i>
              </div>

              <div class="notificacion-contenido">
                <p class="notificacion-mensaje">{{ notificacion.mensaje }}</p>
                <div class="notificacion-meta">
                  <small class="notificacion-tiempo">
                    {{ formatearFecha(notificacion.fechaCreacion) }}
                  </small>
                  <small class="notificacion-tarea">
                    Tarea: {{ notificacion.tareaTitulo }}
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
        default: return 'fa-bell'
      }
    },
    
    getTipoColor(tipo) {
      switch (tipo) {
        case 'ASIGNADA': return '#4CAF50' // Verde - nueva asignación
        case 'CAMBIO_ESTADO': return '#2196F3' // Azul - cambio de estado
        case 'VENCIMIENTO': return '#FF5722' // Rojo/naranja - urgente
        case 'COMENTARIO': return '#9C27B0' // Púrpura - comentario
        case 'COMPLETADA': return '#00897B' // Verde teal - completada
        case 'MENCION': return '#1565C0' // Azul oscuro - mención
        default: return '#FF9800' // Naranja - general
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

<style scoped>
.notificaciones-container {
  position: relative;
}

/* Trigger de notificaciones */
.notificaciones-trigger {
  position: relative;
}

.notification-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
}

.notification-btn:hover {
  background-color: rgba(255, 107, 53, 0.1);
  color: #FF6B35;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
  border: 2px solid white;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes pulse-urgente {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
  50% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.campana-urgente {
  animation: pulse-urgente 1.5s infinite !important;
  color: #ef4444 !important;
}

.vencimiento-badge-urgente {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.65rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.vencimiento-hoy-banner {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fca5a5;
  border-radius: 8px;
  margin: 6px 8px;
  overflow: hidden;
}

.vencimiento-banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.82rem;
  gap: 8px;
}

.vencimiento-banner-header:hover {
  background: rgba(220, 38, 38, 0.06);
}

.vencimiento-banner-dismiss {
  background: none;
  border: none;
  cursor: pointer;
  color: #dc2626;
  opacity: 0.6;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.78rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.vencimiento-banner-dismiss:hover {
  opacity: 1;
  background: rgba(220, 38, 38, 0.1);
}

.vencimiento-tareas-lista {
  list-style: none;
  padding: 0 12px 8px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 140px;
  overflow-y: auto;
}

.vencimiento-tareas-lista li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #991b1b;
  padding: 3px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.vencimiento-tareas-lista li:hover {
  background: rgba(220, 38, 38, 0.08);
}

/* Menú de notificaciones */
.notificaciones-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 360px;
  max-width: 90vw;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 0.8rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notificaciones-header {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  color: white;
  padding: 1rem 1.2rem;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
  flex-wrap: wrap;
  gap: 0.8rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.filtro-tipo {
  position: relative;
}

.filtro-select {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 100px;
  backdrop-filter: blur(10px);
}

.filtro-select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.filtro-select:hover {
  background: rgba(255, 255, 255, 0.25);
}

.filtro-select option {
  color: #333;
  background: white;
  padding: 0.5rem;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  backdrop-filter: blur(10px);
}

.btn-icon:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.1);
}

.loading {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.notificaciones-contenido {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.cargando,
.sin-notificaciones {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
  text-align: center;
}

.cargando p,
.sin-notificaciones p {
  font-size: 0.9rem;
  margin-top: 0.8rem;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--border-color);
  border-top: 2.5px solid #FF6B35;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.sin-notificaciones i {
  margin-bottom: 0.6rem;
  opacity: 0.6;
  font-size: 2rem;
  color: #FF6B35;
}

.lista-notificaciones {
  padding: 0;
}

.notificacion-item {
  display: flex;
  align-items: flex-start;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: white;
}

.notificacion-item:last-child {
  border-bottom: none;
}

.notificacion-item:hover {
  background-color: rgba(255, 107, 53, 0.04);
  border-left: 3px solid #FF6B35;
  padding-left: calc(1rem - 3px);
}

.notificacion-item.no-leida {
  background-color: rgba(255, 107, 53, 0.08);
  border-left: 3px solid #FF6B35;
  padding-left: calc(1rem - 3px);
  font-weight: 500;
}

.notificacion-item.tipo-completada {
  background-color: rgba(0, 137, 123, 0.07);
  border-left: 3px solid #00897B;
  padding-left: calc(1rem - 3px);
}

.notificacion-item.tipo-completada.no-leida {
  background-color: rgba(0, 137, 123, 0.15);
  font-weight: 600;
}

.notificacion-item.tipo-mencion {
  background-color: rgba(21, 101, 192, 0.07);
  border-left: 3px solid #1565C0;
  padding-left: calc(1rem - 3px);
}

.notificacion-item.tipo-mencion.no-leida {
  background-color: rgba(21, 101, 192, 0.15);
  font-weight: 600;
}

.notificacion-icono {
  margin-right: 0.8rem;
  margin-top: 0.2rem;
  width: 20px;
  text-align: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.notificacion-contenido {
  flex: 1;
  min-width: 0;
}

.notificacion-mensaje {
  margin: 0 0 0.3rem 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-primary);
}

.notificacion-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-secondary);
  gap: 0.4rem;
}

.notificacion-tiempo {
  font-weight: 500;
}

.notificacion-tarea {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notificacion-acciones {
  margin-left: 0.6rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 0.2rem;
  flex-shrink: 0;
}

.notificacion-item:hover .notificacion-acciones {
  opacity: 1;
}

.notificaciones-footer {
  padding: 0.8rem 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 0 0 12px 12px;
}

.btn-link {
  background: none;
  border: none;
  color: #FF6B35;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.btn-link:hover {
  background-color: rgba(255, 107, 53, 0.1);
}

/* Modal de todas las notificaciones */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 600px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-header {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  color: white;
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.close-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.lista-notificaciones-completa {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notificacion-item-completa {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.notificacion-item-completa:hover {
  border-color: #FF6B35;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.1);
  background: linear-gradient(to right, rgba(255, 107, 53, 0.02), transparent);
}

.notificacion-item-completa.no-leida {
  background-color: rgba(255, 107, 53, 0.08);
  border-left: 3px solid #FF6B35;
  padding-left: calc(1rem - 3px);
}

.notificacion-item-completa.tipo-completada {
  background-color: rgba(0, 137, 123, 0.07);
  border-left: 3px solid #00897B;
  padding-left: calc(1rem - 3px);
}

.notificacion-item-completa.tipo-completada.no-leida {
  background-color: rgba(0, 137, 123, 0.15);
  font-weight: 600;
}

.notificacion-item-completa.tipo-mencion {
  background-color: rgba(21, 101, 192, 0.07);
  border-left: 3px solid #1565C0;
  padding-left: calc(1rem - 3px);
}

.notificacion-item-completa.tipo-mencion.no-leida {
  background-color: rgba(21, 101, 192, 0.15);
  font-weight: 600;
}

.notificacion-item-completa .notificacion-icono {
  margin-right: 1rem;
  width: 24px;
  font-size: 1rem;
}

.notificacion-item-completa .notificacion-contenido {
  flex: 1;
}

.notificacion-item-completa .notificacion-mensaje {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
}

.notificacion-item-completa .notificacion-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
  flex-direction: column;
  gap: 0.2rem;
}

.notificacion-item-completa .notificacion-acciones {
  opacity: 1;
  display: flex;
  gap: 0.4rem;
  margin-left: 1rem;
}

.notification-btn i {
  font-size: 1.3rem;
}

.notification-badge {
  top: -3px; 
  right: -3px; 
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  outline: 2px solid white;
}

/* Estilos para botón de sonido */
.sonido-activo {
  color: white;
  transition: all 0.3s ease;
}

.sonido-activo:hover {
  color: #ffcfb1;
  transform: scale(1.1);
}

.sonido-inactivo {
  color: #999;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.sonido-inactivo:hover {
  color: #FF6B35;
  opacity: 1;
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 1.4rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-size: 0.9rem;
}

.snackbar.success {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.snackbar.error {
  background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
}

.snackbar.warning {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.snackbar-close:hover {
  transform: scale(1.1);
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .notificaciones-menu {
    width: 100vw;
    max-width: 100vw;
    margin: 0;
    right: 0;
    left: 0;
    border-radius: 12px 12px 0 0;
    max-height: 60vh;
  }
  
  .notificaciones-header {
    border-radius: 0;
    padding: 0.8rem 1rem;
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
  }
  
  .header-actions {
    justify-content: space-between;
    width: 100%;
  }
  
  .filtro-select {
    min-width: 80px;
    flex: 1;
    max-width: 120px;
  }
  
  .notificacion-meta {
    flex-direction: column;
    gap: 0.1rem;
  }
  
  .notificacion-tarea {
    max-width: none;
  }
  
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
