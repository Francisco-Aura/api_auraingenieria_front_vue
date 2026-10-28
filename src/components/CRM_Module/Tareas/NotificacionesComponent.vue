<template>
  <div class="notificaciones-container">
    <!-- Indicador de notificaciones -->
    <div class="notificaciones-trigger" @click="toggleMenu">
      <button
        ref="botonCampana"
        type="button"
        class="btn-icon notification-btn"
        :class="{ 'campana-urgente': tareasVenciendoHoyLista.length > 0 }"
        aria-label="Notificaciones"
        title="Notificaciones"
        :aria-expanded="menuAbierto ? 'true' : 'false'"
      >
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
            :title="mostrarSoloNoLeidas ? 'Ver leídas' : 'Ver no leídas'"
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
            <li v-for="tarea in tareasVenciendoHoyLista" :key="tarea.id" :title="tarea.titulo" @click="irATarea(tarea.id)">
              <i class="fas fa-clock"></i> <span class="vencimiento-tarea-titulo">{{ tarea.titulo }}</span>
            </li>
          </ul>
        </div>
        <div v-if="cargando && notificaciones.length === 0" class="cargando">
          <div class="spinner-small"></div>
          <p>Cargando notificaciones...</p>
        </div>

        <!-- Si la carga falla no se dice «No hay notificaciones» (con el contador
             marcando pendientes): se avisa del fallo y se puede reintentar -->
        <div v-else-if="errorCarga && notificaciones.length === 0" class="sin-notificaciones error-carga">
          <i class="fas fa-exclamation-circle fa-2x"></i>
          <p>No se pudieron cargar las notificaciones</p>
          <button type="button" class="btn-reintentar" @click="cargarNotificaciones">Reintentar</button>
        </div>

        <div v-else-if="notificaciones.length === 0" class="sin-notificaciones">
          <i class="fas fa-bell fa-2x"></i>
          <p>No hay notificaciones</p>
        </div>

        <!-- Con un tipo elegido que no tiene ninguna: antes la lista quedaba en blanco -->
        <div v-else-if="notificacionesFiltradas.length === 0" class="sin-notificaciones">
          <i class="fas fa-filter fa-2x"></i>
          <p>No hay notificaciones de este tipo</p>
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
                <small class="notificacion-tarea" :title="notificacion.tareaTitulo">
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

      <!-- Siempre: sin no leídas también se puede consultar el historial -->
      <div class="notificaciones-footer">
        <button class="btn btn-link" @click="verTodasLasNotificaciones">
          Ver todas las notificaciones
        </button>
      </div>
    </div>

    <!-- Modal de todas las notificaciones: en <body> para cubrir toda la pantalla
         (dentro de la barra superior quedaba recortado y sin oscurecer el menú) -->
    <Teleport to="body">
    <div v-if="modalTodasNotificaciones" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-modal-title" @click="modalTodasNotificaciones = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header aura-modal-header">
          <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-bell"></i></span>
          <div class="aura-modal-header__titulos">
            <h3 id="notif-modal-title">Todas las notificaciones</h3>
            <span class="aura-modal-header__subtitulo">Historial completo: leídas y no leídas</span>
          </div>
          <button ref="cerrarModalTodas" type="button" class="close-button" aria-label="Cerrar" @click="modalTodasNotificaciones = false">
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
                  <small class="notificacion-tarea" :title="notificacion.tareaTitulo">
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
    </Teleport>

    <!-- Snackbar para mensajes: en <body>, como el modal. Dentro de la barra superior
         (que crea su propia capa) quedaba debajo del fondo oscuro del modal y no se leía -->
    <Teleport to="body">
    <div v-if="snackbar.show" class="snackbar" :class="snackbar.color" role="status">
      <span>{{ snackbar.message }}</span>
      <button type="button" @click="snackbar.show = false" class="snackbar-close" aria-label="Cerrar aviso">
        <i class="fas fa-times"></i>
      </button>
    </div>
    </Teleport>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'
import { notificacionesPolling } from '@/services/notificacionesPolling'
import { audioService } from '@/services/audioService'
import { fechaHoraES } from '@/utils/fechas'

export default {
  name: 'NotificacionesComponent',
  emits: ['menu-abierto'],
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
      errorCarga: false,
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
    
    // Cerrar menú al hacer clic fuera o con Esc
    document.addEventListener('click', this.handleClickOutside)
    document.addEventListener('keydown', this.cerrarMenuConEscape)
  },
  beforeUnmount() {
    // Detener polling si se desmonta
    this.desmontado = true
    notificacionesPolling.detener()
    if (this.vencimientosIntervalId) clearInterval(this.vencimientosIntervalId)
    clearTimeout(this.temporizadorMensaje)
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('keydown', this.cerrarMenuConEscape)
  },
  watch: {
    // Al abrir el historial el foco va a su botón de cerrar (con Tab se seguía
    // recorriendo la pantalla de detrás); al cerrarlo vuelve a la campana
    modalTodasNotificaciones(abierto) {
      this.$nextTick(() => {
        if (abierto) this.$refs.cerrarModalTodas?.focus()
        else this.$refs.botonCampana?.focus()
      })
    }
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
        // Si se desmontó mientras tanto (p. ej. cierre de sesión) no se abre el WebSocket:
        // quedaría conectado y con un callback hacia un componente que ya no existe
        if (this.desmontado) return
        if (moduloActivo) {
          // Iniciar polling automático
          notificacionesPolling.iniciar(usuario.id)
          
          // Registrar callback para actualizar el componente cuando hay nuevas notificaciones
          notificacionesPolling.onNotificacionesActualizadas((notificaciones, origen) => {
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

            // Refrescar vencimientos de hoy al recibir push. La primera entrega es la
            // carga inicial, no un aviso: mounted() acaba de pedir los vencimientos.
            if (origen !== 'inicial') this.cargarTareasVenciendoHoy()
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
        // El menú de usuario del lateral se cierra para no tener dos abiertos a la vez
        this.$emit('menu-abierto')
        this.cargarNotificaciones()
      }
    },

    // Esc cierra el desplegable y devuelve el foco a la campana (el modal del
    // historial lo cierra el Esc común de los modales)
    cerrarMenuConEscape(evento) {
      if (evento.key !== 'Escape' || !this.menuAbierto || this.modalTodasNotificaciones || evento.defaultPrevented) return
      evento.preventDefault()
      this.menuAbierto = false
      this.$refs.botonCampana?.focus()
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
        // El refresco cada 5 min y el de cada aviso pueden cruzarse: vale la última petición
        const peticion = this.peticionVencimientos = (this.peticionVencimientos || 0) + 1
        const lista = await tareasApi.obtenerTareasVencenHoy(parseInt(usuario.id), parseInt(usuario.nivelAcceso))
        if (peticion === this.peticionVencimientos) this.tareasVenciendoHoyLista = lista
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
      
      // Al alternar rápido «No leídas»/«Leídas» la respuesta anterior puede llegar
      // después: solo se aplica la de la última petición
      const peticion = this.peticionNotificaciones = (this.peticionNotificaciones || 0) + 1
      const vigente = () => peticion === this.peticionNotificaciones
      try {
        this.cargando = true
        this.errorCarga = false
        
        let notificaciones
        if (this.mostrarSoloNoLeidas) {
          // Cargar solo no leídas
          notificaciones = await tareasApi.obtenerNotificacionesNoLeidas(parseInt(usuario.id))
        } else {
          // Cargar todas (leídas + no leídas) y mostrar solo las leídas
          notificaciones = (await tareasApi.obtenerNotificacionesPorUsuario(parseInt(usuario.id)))
            .filter(n => n.leida === true)
        }
        if (!vigente()) return
        this.notificaciones = notificaciones
        
        this.aplicarFiltroTipo()
        await this.actualizarContador()
      } catch (error) {
        if (!vigente()) return
        console.error('Error cargando notificaciones:', error)
        this.errorCarga = true
        this.mostrarMensaje('Error al cargar las notificaciones', 'error')
      } finally {
        if (vigente()) this.cargando = false
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
        
        // Remover de listas locales (y de la lista filtrada que se muestra)
        this.notificaciones = this.notificaciones.filter(n => n.id !== notificacionId)
        this.todasLasNotificaciones = this.todasLasNotificaciones.filter(n => n.id !== notificacionId)
        this.aplicarFiltroTipo()

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
      
      // Abre el detalle de su tarea, igual que el aviso de «vence hoy» (antes solo
      // llevaba a la lista y había que buscarla)
      if (notificacion.tareaId) {
        this.irATarea(notificacion.tareaId)
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
        case 'ASIGNADA': return 'tipo-color-asignada' // Verde - nueva asignación
        case 'CAMBIO_ESTADO': return 'tipo-color-cambio-estado' // Azul - cambio de estado
        case 'VENCIMIENTO': return 'tipo-color-vencimiento' // Rojo/naranja - urgente
        case 'COMENTARIO': return 'tipo-color-comentario' // Púrpura - comentario
        case 'COMPLETADA': return 'tipo-color-completada' // Verde teal - completada
        case 'MENCION': return 'tipo-color-mencion' // Azul oscuro - mención
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
      return fechaHoraES(fecha, '')
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
      
      // El temporizador de un mensaje anterior no puede ocultar este antes de tiempo
      clearTimeout(this.temporizadorMensaje)
      this.temporizadorMensaje = setTimeout(() => {
        this.snackbar.show = false
      }, 3000)
    }
  }
}
</script>

<style scoped src="./NotificacionesComponent.css"></style>
