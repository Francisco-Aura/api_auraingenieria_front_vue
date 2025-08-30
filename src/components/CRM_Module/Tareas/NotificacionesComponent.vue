<template>
  <div class="notificaciones-container">
    <!-- Indicador de notificaciones -->
    <div class="notificaciones-trigger" @click="toggleMenu">
      <button class="btn-icon notification-btn">
        <i class="fas fa-bell"></i>
        <span v-if="contadorNoLeidas > 0" class="notification-badge">{{ contadorNoLeidas }}</span>
      </button>
    </div>

    <!-- Menú de notificaciones -->
    <div v-if="menuAbierto" class="notificaciones-menu">
      <div class="notificaciones-header">
        <span>Notificaciones</span>
        <div class="header-actions">
          <div class="filtro-tipo">
            <select v-model="filtroTipoSeleccionado" @change="aplicarFiltroTipo" class="filtro-select">
              <option value="">Todos</option>
              <option value="ASIGNADA">Asignadas</option>
              <option value="CAMBIO_ESTADO">Cambios</option>
              <option value="VENCIMIENTO">Vencimientos</option>
              <option value="COMENTARIO">Comentarios</option>
            </select>
          </div>
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
            :class="{ 'no-leida': !notificacion.leida }"
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
              :class="{ 'no-leida': !notificacion.leida }"
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

export default {
  name: 'NotificacionesComponent',
  data() {
    return {
      menuAbierto: false,
      modalTodasNotificaciones: false,
      notificaciones: [],
      notificacionesFiltradas: [],
      todasLasNotificaciones: [],
      contadorNoLeidas: 0,
      cargando: false,
      cargandoTodas: false,
      filtroTipoSeleccionado: '',
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  mounted() {
    this.inicializar()
    
    // Actualizar contador cada 30 segundos
    this.intervalo = setInterval(() => {
      this.actualizarContador()
    }, 30000)
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    if (this.intervalo) {
      clearInterval(this.intervalo)
    }
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    async inicializar() {
      try {
        const moduloActivo = await tareasApi.verificarModuloActivo()
        if (moduloActivo) {
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
        this.notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(parseInt(usuario.id))
        this.aplicarFiltroTipo()
        await this.actualizarContador()
      } catch (error) {
        console.error('Error cargando notificaciones:', error)
        this.mostrarMensaje('Error al cargar las notificaciones', 'error')
      } finally {
        this.cargando = false
      }
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
        default: return 'fa-bell'
      }
    },
    
    getTipoColor(tipo) {
      switch (tipo) {
        case 'ASIGNADA': return '#4CAF50' // Verde - nueva asignación
        case 'CAMBIO_ESTADO': return '#2196F3' // Azul - cambio de estado
        case 'VENCIMIENTO': return '#FF5722' // Rojo/naranja - urgente
        case 'COMENTARIO': return '#9C27B0' // Púrpura - comentario
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
  font-size: 1rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
}

.notification-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: var(--danger-color);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.65rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Menú de notificaciones */
.notificaciones-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  max-width: 90vw;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  margin-top: 0.4rem;
  border: 1px solid var(--border-color);
  max-height: 450px;
  display: flex;
  flex-direction: column;
}

.notificaciones-header {
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
  padding: 0.8rem;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.header-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.filtro-tipo {
  margin-right: 0.4rem;
}

.filtro-select {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #2c3e50;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
  cursor: pointer;
}

.filtro-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-icon {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.btn-icon:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.1);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  animation: spin 1s linear infinite;
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
  padding: 1.5rem 0.8rem;
  color: var(--text-secondary);
  text-align: center;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top: 2px solid rgb(252, 215, 0);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.4rem;
}

.sin-notificaciones i {
  margin-bottom: 0.4rem;
  opacity: 0.5;
  font-size: 1.5rem;
}

.lista-notificaciones {
  padding: 0.4rem 0;
}

.notificacion-item {
  display: flex;
  align-items: flex-start;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color);
}

.notificacion-item:last-child {
  border-bottom: none;
}

.notificacion-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.notificacion-item.no-leida {
  background-color: rgba(252, 215, 0, 0.05);
  border-left: 3px solid rgb(252, 215, 0);
}

.notificacion-icono {
  margin-right: 0.6rem;
  margin-top: 0.1rem;
  width: 16px;
  text-align: center;
  font-size: 0.8rem;
}

.notificacion-contenido {
  flex: 1;
  min-width: 0;
}

.notificacion-mensaje {
  margin: 0 0 0.2rem 0;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--text-primary);
}

.notificacion-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.notificacion-tarea {
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notificacion-acciones {
  margin-left: 0.4rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notificacion-item:hover .notificacion-acciones {
  opacity: 1;
}

.notificaciones-footer {
  padding: 0.6rem 0.8rem;
  background-color: #f8f9fa;
  border-top: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
}

.btn-link {
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  font-size: 0.8rem;
  text-decoration: underline;
  width: 100%;
  text-align: center;
  padding: 0.4rem;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.btn-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
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
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 550px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
  color: #2c3e50;
  padding: 0.8rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-button {
  background-color: rgba(255, 255, 255, 0.15);
  border: none;
  color: #2c3e50;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
}

.lista-notificaciones-completa {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.notificacion-item-completa {
  display: flex;
  align-items: flex-start;
  padding: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.notificacion-item-completa.no-leida {
  background-color: rgba(252, 215, 0, 0.05);
  border-left: 3px solid rgb(252, 215, 0);
}

.notificacion-item-completa .notificacion-acciones {
  opacity: 1;
  display: flex;
  gap: 0.2rem;
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

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  padding: 0.8rem 1.2rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  font-size: 0.85rem;
}

.snackbar.success {
  background-color: var(--success-color);
}

.snackbar.error {
  background-color: var(--danger-color);
}

.snackbar.warning {
  background-color: var(--warning-color);
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin: 0;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
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
    right: -1rem;
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