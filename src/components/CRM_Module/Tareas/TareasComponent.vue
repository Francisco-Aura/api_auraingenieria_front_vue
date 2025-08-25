<template>
  <div class="tareas-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="cargando" />

    <!-- Header principal con título y botón de crear -->
    <div class="tareas-header">
      <div class="header-content">
        <h1 class="tareas-title">
          <i class="fas fa-tasks"></i>
          Tareas
        </h1>
        <div class="header-actions">
          <button class="btn btn-primary btn-crear" @click="mostrarModalCrearTarea = true">
            <i class="fas fa-plus"></i>
            Crear +
          </button>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <EstadisticasTareasComponent ref="estadisticas" />

    <!-- Filtros avanzados -->
    <FiltroAvanzadoTareas 
      :estados="estados" 
      @filtros-aplicados="aplicarFiltrosAvanzados"
    />

    <!-- Panel de filtros y controles -->
    <div class="filtros-panel">
      <div class="filtros-row">
        <div class="filtro-group">
          <label>Tipos</label>
          <select v-model="filtroTipo" @change="aplicarFiltros" class="form-control">
            <option value="">Todos los tipos</option>
            <option value="Seguimiento">Seguimiento</option>
            <option value="Llamada">Llamada</option>
            <option value="Correo">Correo</option>
            <option value="Reunión">Reunión</option>
            <option value="Visita">Visita</option>
            <option value="Por hacer">Por hacer</option>
            <option value="Por facturar">Por facturar</option>
          </select>
        </div>
        
        <div class="filtro-group">
          <label>Asignada a</label>
          <select v-model="filtroAsignada" @change="aplicarFiltros" class="form-control">
            <option value="">Todos los usuarios</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }}
            </option>
          </select>
        </div>
        
        <div class="filtro-group">
          <label>Usuario</label>
          <select v-model="filtroUsuario" @change="aplicarFiltros" class="form-control">
            <option value="">Todos los usuarios</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }}
            </option>
          </select>
        </div>
        
        <div class="filtro-group">
          <label>Rango de fechas</label>
          <div class="date-range">
            <input 
              type="date" 
              v-model="filtroFechaDesde" 
              @change="aplicarFiltros" 
              class="form-control"
            />
            <span>-</span>
            <input 
              type="date" 
              v-model="filtroFechaHasta" 
              @change="aplicarFiltros" 
              class="form-control"
            />
          </div>
        </div>
        
        <div class="filtro-group">
          <label>Buscar</label>
          <div class="search-container">
            <input 
              type="text" 
              v-model="filtroBusqueda"
              @input="aplicarFiltros"
              class="form-control search-input"
              placeholder="Buscar..."
            />
            <button class="btn btn-search" @click="aplicarFiltros">
              <i class="fas fa-search"></i>
              Buscar
            </button>
          </div>
        </div>
      </div>
      
    </div>

    <!-- Panel de tareas -->
    <div class="tareas-panel">
      <div class="panel-header">
        <div class="header-info">
          <h3>Lista gestión > Tareas</h3>
          <span class="task-count">{{ tareasFiltradas.length }} registros</span>
        </div>
        
        <div class="panel-controls">
          <div class="toggle-incluir">
            <label class="toggle-label">
              <input 
                type="checkbox" 
                v-model="incluirFinalizadas" 
                @change="aplicarFiltros"
                class="toggle-input"
              />
              <span class="toggle-slider"></span>
              Incluir finalizadas
            </label>
          </div>
          
          <div class="view-buttons">
            <button class="btn-view" :class="{ active: vista === 'lista' }" @click="vista = 'lista'">
              <i class="fas fa-list"></i>
            </button>
            <button class="btn-view" :class="{ active: vista === 'calendario' }" @click="vista = 'calendario'">
              <i class="fas fa-calendar-alt"></i>
            </button>
            <button class="btn-view" :class="{ active: vista === 'kanban' }" @click="vista = 'kanban'">
              <i class="fas fa-columns"></i>
            </button>
          </div>
          
          <button class="btn btn-refresh" @click="cargarTareas" title="Actualizar datos">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      
      <div class="tareas-content">
        <div v-if="cargando" class="loading-state">
          <div class="spinner-small"></div>
          <p>Cargando tareas...</p>
        </div>

        <div v-else-if="tareasFiltradas.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h3>{{ tareas.length === 0 ? '¡Bienvenido a tu gestor de tareas!' : 'No se encontraron tareas' }}</h3>
          <p>{{ tareas.length === 0 ? 'Comienza creando tu primera tarea para organizar tu trabajo' : 'Prueba ajustando los filtros para ver más resultados' }}</p>
          <button v-if="tareas.length === 0" class="btn btn-primary" @click="mostrarModalCrearTarea = true">
            <i class="fas fa-plus"></i>
            Crear mi primera tarea
          </button>
        </div>

        <!-- Vista de lista -->
        <div v-else-if="vista === 'lista'" class="tareas-lista">
          <div class="tareas-grid">
            <div 
              v-for="tarea in tareasFiltradas" 
              :key="tarea.id"
              class="tarea-item"
              :class="{ 'tarea-vencida': tarea.vencida, 'tarea-completada': tarea.estadoFinal }"
              @click="handleVerDetalle(tarea)"
            >
              <div class="tarea-checkbox">
                <input 
                  type="checkbox" 
                  :checked="tarea.estadoFinal"
                  @click.stop="toggleCompletada(tarea)"
                />
              </div>
              
              <div class="tarea-content">
                <div class="tarea-header">
                  <h4 class="tarea-titulo">{{ tarea.titulo }}</h4>
                  <div class="tarea-tipo">
                    <span class="tipo-badge">{{ tarea.tipo || 'Por hacer' }}</span>
                  </div>
                </div>
                
                <div class="tarea-info">
                  <div class="tarea-asociacion">
                    <i class="fas fa-link"></i>
                    {{ tarea.clienteRelacionadoNombre || 'Sin asociar' }}
                  </div>
                  
                  <div class="tarea-asignacion">
                    <i class="fas fa-user"></i>
                    Asignado a {{ tarea.usuarioAsignadoNombre }}
                  </div>
                  
                  <div class="tarea-descripcion" v-if="tarea.descripcion">
                    {{ tarea.descripcion }}
                  </div>
                </div>
                
                <div class="tarea-fechas">
                  <div class="fecha-item">
                    <i class="fas fa-calendar"></i>
                    <span>Fecha de inicio: {{ formatearFecha(tarea.fechaInicio) }}</span>
                  </div>
                  <div class="fecha-item">
                    <i class="fas fa-clock"></i>
                    <span>Fecha de vencimiento: {{ formatearFecha(tarea.fechaVencimiento) }}</span>
                  </div>
                </div>
                
                <div class="tarea-footer">
                  <div class="tarea-estado">
                    <span class="estado-badge" :style="{ backgroundColor: tarea.estadoColor }">
                      {{ formatearEstadoNombre(tarea.estadoNombre) }}
                    </span>
                  </div>
                  <div class="tarea-creador">
                    <i class="fas fa-user-plus"></i>
                    Creada por {{ tarea.usuarioCreadorNombre }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista calendario -->
        <TareasCalendarioView
          v-else-if="vista === 'calendario'"
          :tareas="tareasFiltradas"
          :estados="estados"
          @ver-detalle="handleVerDetalle"
          @actualizar="handleActualizarTarea"
        />
      </div>
    </div>

    <!-- Modal de crear/editar tarea -->
    <TareaModalCorporativo
      v-if="mostrarModalCrearTarea"
      :value="mostrarModalCrearTarea"
      :tarea="tareaEnEdicion"
      :estados="estados"
      :usuarios="usuarios"
      @guardar="handleGuardarTarea"
      @cerrar="cerrarModal"
    />

    <!-- Modal de detalle de tarea -->
    <TareaDetalleModal
      v-if="mostrarModalDetalle"
      :value="mostrarModalDetalle"
      :tarea="tareaDetalle"
      :estados="estados"
      @actualizar="handleActualizarTarea"
      @cambiar-estado="handleCambiarEstado"
      @cerrar="mostrarModalDetalle = false"
    />

    <!-- Notificaciones -->
    <div v-if="snackbar.show" class="snackbar" :class="snackbar.color">
      <div class="snackbar-content">
        <i :class="getSnackbarIcon(snackbar.color)"></i>
        <span>{{ snackbar.message }}</span>
      </div>
      <button @click="snackbar.show = false" class="snackbar-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'
import TareaModalCorporativo from './TareaModalCorporativo.vue'
import TareaDetalleModal from './TareaDetalleModal.vue'
import TareasCalendarioView from './TareasCalendarioView.vue'
import EstadisticasTareasComponent from './EstadisticasTareasComponent.vue'
import FiltroAvanzadoTareas from './FiltroAvanzadoTareas.vue'
import Spinner from '@/components/SpinnerComponent.vue'

export default {
  name: 'TareasComponent',
  components: {
    TareaModalCorporativo,
    TareaDetalleModal,
    TareasCalendarioView,
    EstadisticasTareasComponent,
    FiltroAvanzadoTareas,
    Spinner
  },
  data() {
    return {
      tareas: [],
      tareasFiltradas: [],
      estados: [],
      usuarios: [],
      cargando: false,
      
      // Modales
      mostrarModalCrearTarea: false,
      mostrarModalDetalle: false,
      tareaEnEdicion: null,
      tareaDetalle: null,
      
      // Filtros
      filtroTipo: '',
      filtroAsignada: '',
      filtroUsuario: '',
      filtroFechaDesde: '',
      filtroFechaHasta: '',
      filtroBusqueda: '',
      incluirFinalizadas: true,
      mostrarFiltrosAvanzados: false,
      filtrosAvanzados: {
        estadosSeleccionados: [],
        prioridadesSeleccionadas: [],
        fechaDesde: '',
        fechaHasta: '',
        etiquetas: ''
      },
      
      // Vista
      vista: 'lista',
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      }
    }
  },
  computed: {
    esAdmin() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario && usuario.nivelAcceso === 1
    }
  },
  async mounted() {
    await this.inicializar()
  },
  methods: {
    async inicializar() {
      try {
        this.cargando = true
        
        // Verificar si el módulo está activo
        const moduloActivo = await tareasApi.verificarModuloActivo()
        if (!moduloActivo) {
          this.mostrarMensaje('El módulo de tareas no está activo', 'warning')
          return
        }
        
        await Promise.all([
          this.cargarTareas(),
          this.cargarEstados(),
          this.cargarUsuarios()
        ])
        
        // Manejar parámetros de query de navegación
        this.manejarParametrosQuery()
      } catch (error) {
        console.error('Error inicializando:', error)
        this.mostrarMensaje('Error al cargar los datos', 'error')
      } finally {
        this.cargando = false
      }
    },
    
    async cargarTareas() {
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        if (usuario && usuario.nivelAcceso === 1) {
          // Admin: ver todas
          this.tareas = await tareasApi.obtenerTodasLasTareas()
        } else {
          if (!usuario.id) {
            this.mostrarMensaje('No se encontró el usuario logueado', 'error')
            return
          }
          this.tareas = await tareasApi.obtenerTareasPorUsuario(parseInt(usuario.id))
        }
        this.aplicarFiltros()
      } catch (error) {
        console.error('Error cargando tareas:', error)
        this.mostrarMensaje('Error al cargar las tareas', 'error')
      }
    },
    
    async cargarEstados() {
      try {
        this.estados = await tareasApi.obtenerEstados()
      } catch (error) {
        console.error('Error cargando estados:', error)
      }
    },
    
    async cargarUsuarios() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8986'}/api/usuarios`)
        if (response.ok) {
          this.usuarios = await response.json()
        } else {
          const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
          if (usuario.id && usuario.nombre) {
            this.usuarios = [{ id: parseInt(usuario.id), nombre: usuario.nombre }]
          }
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error)
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        if (usuario.id && usuario.nombre) {
          this.usuarios = [{ id: parseInt(usuario.id), nombre: usuario.nombre }]
        }
      }
    },
    
    aplicarFiltros() {
      let resultado = [...this.tareas]
      
      // Filtro por tipo
      if (this.filtroTipo) {
        resultado = resultado.filter(t => t.tipo === this.filtroTipo)
      }
      
      // Filtro por asignación
      if (this.filtroAsignada) {
        resultado = resultado.filter(t => t.usuarioAsignadoId === parseInt(this.filtroAsignada))
      }
      
      // Filtro por usuario
      if (this.filtroUsuario) {
        resultado = resultado.filter(t => t.usuarioCreadorId === parseInt(this.filtroUsuario))
      }
      
      // Filtro por fechas
      if (this.filtroFechaDesde) {
        resultado = resultado.filter(t => new Date(t.fechaCreacion) >= new Date(this.filtroFechaDesde))
      }
      
      if (this.filtroFechaHasta) {
        resultado = resultado.filter(t => new Date(t.fechaCreacion) <= new Date(this.filtroFechaHasta))
      }
      
      // Filtro por búsqueda
      if (this.filtroBusqueda) {
        const busqueda = this.filtroBusqueda.toLowerCase()
        resultado = resultado.filter(t => 
          t.titulo?.toLowerCase().includes(busqueda) ||
          t.descripcion?.toLowerCase().includes(busqueda) ||
          t.clienteRelacionadoNombre?.toLowerCase().includes(busqueda)
        )
      }
      
      // Filtro por finalizadas
      if (!this.incluirFinalizadas) {
        resultado = resultado.filter(t => !t.estadoFinal)
      }
      
      // Aplicar filtros avanzados
      if (this.filtrosAvanzados.estadosSeleccionados.length > 0) {
        resultado = resultado.filter(t => 
          this.filtrosAvanzados.estadosSeleccionados.includes(t.estadoId)
        )
      }
      
      if (this.filtrosAvanzados.prioridadesSeleccionadas.length > 0) {
        resultado = resultado.filter(t => 
          this.filtrosAvanzados.prioridadesSeleccionadas.includes(t.prioridad.toString())
        )
      }
      
      if (this.filtrosAvanzados.fechaDesde) {
        resultado = resultado.filter(t => 
          new Date(t.fechaCreacion) >= new Date(this.filtrosAvanzados.fechaDesde)
        )
      }
      
      if (this.filtrosAvanzados.fechaHasta) {
        resultado = resultado.filter(t => 
          new Date(t.fechaCreacion) <= new Date(this.filtrosAvanzados.fechaHasta)
        )
      }
      
      if (this.filtrosAvanzados.etiquetas) {
        const etiquetasBusqueda = this.filtrosAvanzados.etiquetas.toLowerCase()
        resultado = resultado.filter(t => 
          t.etiquetas && t.etiquetas.toLowerCase().includes(etiquetasBusqueda)
        )
      }
      
      this.tareasFiltradas = resultado
    },

    aplicarFiltrosAvanzados(filtros) {
      this.filtrosAvanzados = { ...filtros }
      this.aplicarFiltros()
    },
    
    async handleGuardarTarea(tarea) {
      try {
        // Si viene con ID hacemos update; si no, creamos
        if (tarea.id) {
          await tareasApi.actualizarTarea(tarea.id, tarea)
          this.mostrarMensaje('Tarea actualizada correctamente', 'success')
        } else {
          const nueva = await tareasApi.crearTarea(tarea)
          this.mostrarMensaje('Tarea creada correctamente', 'success')

          // Si llegaron comentarios desde el modal de creación, crearlos vinculados a la tarea
          if (tarea.comentarios && Array.isArray(tarea.comentarios) && tarea.comentarios.length > 0) {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
            for (const c of tarea.comentarios) {
              try {
                await tareasApi.crearComentario({
                  tareaId: nueva.id,
                  usuarioId: parseInt(usuario.id),
                  comentario: c.texto
                })
              } catch (e) {
                console.error('Error creando comentario inicial:', e)
              }
            }
          }
        }
        
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.cerrarModal()
      } catch (error) {
        console.error('Error guardando tarea:', error)
        this.mostrarMensaje('Error al guardar la tarea', 'error')
      }
    },
    
    async handleActualizarTarea(tarea) {
      // Abrir siempre el modal de edición con la tarea seleccionada
      this.mostrarModalDetalle = false
      this.$nextTick(() => {
        this.tareaEnEdicion = { ...tarea }
        this.mostrarModalCrearTarea = true
      })
    },
    
    async handleCambiarEstado(tareaId, estadoId) {
      try {
        await tareasApi.cambiarEstadoTarea(tareaId, estadoId)
        this.mostrarMensaje('Estado actualizado correctamente', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.mostrarModalDetalle = false
      } catch (error) {
        console.error('Error cambiando estado:', error)
        this.mostrarMensaje('Error al cambiar el estado', 'error')
      }
    },
    
    async handleEliminarTarea(tareaId) {
      if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        try {
          await tareasApi.eliminarTarea(tareaId)
          this.mostrarMensaje('Tarea eliminada correctamente', 'success')
          await this.cargarTareas()
        } catch (error) {
          console.error('Error eliminando tarea:', error)
          this.mostrarMensaje('Error al eliminar la tarea', 'error')
        }
      }
    },
    
    async handleVerDetalle(tarea) {
      this.tareaDetalle = tarea
      this.mostrarModalDetalle = true
    },
    
    async toggleCompletada(tarea) {
      try {
        const estadoCompletado = this.estados.find(e => e.estadoFinal)
        if (estadoCompletado) {
          await tareasApi.cambiarEstadoTarea(tarea.id, estadoCompletado.id)
          await this.cargarTareas()
        }
      } catch (error) {
        console.error('Error cambiando estado:', error)
        this.mostrarMensaje('Error al cambiar el estado', 'error')
      }
    },
    
    cerrarModal() {
      this.mostrarModalCrearTarea = false
      this.tareaEnEdicion = null
    },
    
    formatearFecha(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatearEstadoNombre(nombre) {
      if (!nombre) return ''
      return nombre.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase())
    },
    
    getSnackbarIcon(color) {
      switch (color) {
        case 'success': return 'fas fa-check-circle'
        case 'error': return 'fas fa-exclamation-circle'
        case 'warning': return 'fas fa-exclamation-triangle'
        default: return 'fas fa-info-circle'
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
    },

    manejarParametrosQuery() {
      const query = this.$route.query
      
      // Si viene acción 'nueva' y datos del cliente, abrir modal de crear tarea
      if (query.accion === 'nueva' && query.clienteId) {
        this.tareaEnEdicion = {
          clienteRelacionadoId: parseInt(query.clienteId),
          clienteRelacionadoNombre: query.clienteNombre
        }
        this.$nextTick(() => {
          this.mostrarModalCrearTarea = true
        })
      }
      
      // Si viene parámetro 'destacar', buscar y mostrar tarea específica
      if (query.destacar) {
        const tareaId = parseInt(query.destacar)
        const tarea = this.tareas.find(t => t.id === tareaId)
        if (tarea) {
          this.$nextTick(() => {
            this.handleVerDetalle(tarea)
          })
        }
      }
      
      // Limpiar query params después de procesarlos
      if (Object.keys(query).length > 0) {
        this.$router.replace({ query: {} })
      }
    }
  }
}
</script>

<style scoped>
/* Contenedor principal */
.tareas-container {
  background: #f7f9fc;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header principal */
.tareas-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tareas-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tareas-title i {
  color: rgb(252, 215, 0);
  font-size: 1.8rem;
}

.btn-crear {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-crear:hover {
  background: #e6c200;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Panel de filtros */
.filtros-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.filtros-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filtro-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.form-control {
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(252, 215, 0, 0.1);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range span {
  color: #6c757d;
  font-weight: 500;
}

.search-container {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
}

.btn-search {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-search:hover {
  background: #e6c200;
  transform: translateY(-1px);
}



.btn-link {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-link:hover {
  color: #0056b3;
}

.rotated {
  transform: rotate(180deg);
}

/* Panel de tareas */
.tareas-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.panel-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #495057;
  font-weight: 600;
}

.task-count {
  font-size: 0.9rem;
  color: #6c757d;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toggle-incluir {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 40px;
  height: 20px;
  background: #dee2e6;
  border-radius: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.toggle-input:checked + .toggle-slider {
  background: rgb(252, 215, 0);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.view-buttons {
  display: flex;
  gap: 4px;
}

.btn-view {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6c757d;
}

.btn-view:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-view.active {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border-color: rgb(252, 215, 0);
}

.btn-refresh {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6c757d;
}

.btn-refresh:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

/* Contenido de tareas */
.tareas-content {
  padding: 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6c757d;
}

.spinner-small {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid rgb(252, 215, 0);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  color: #dee2e6;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #495057;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
  line-height: 1.5;
}

/* Lista de tareas */
.tareas-lista {
  width: 100%;
}

.tareas-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tarea-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.tarea-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tarea-item.tarea-vencida {
  border-left: 4px solid #dc3545;
  background: #fff5f5;
}

.tarea-item.tarea-completada {
  opacity: 0.7;
  background: #f8f9fa;
}

.tarea-checkbox {
  margin-top: 4px;
}

.tarea-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: rgb(252, 215, 0);
}

.tarea-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.tarea-titulo {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
}

.tipo-badge {
  background: #e9ecef;
  color: #495057;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.tarea-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tarea-asociacion,
.tarea-asignacion {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #6c757d;
}

.tarea-asociacion i,
.tarea-asignacion i {
  color: rgb(252, 215, 0);
  width: 16px;
}

.tarea-descripcion {
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 8px;
}

.tarea-fechas {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fecha-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #6c757d;
}

.fecha-item i {
  color: rgb(252, 215, 0);
  width: 14px;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.estado-badge {
  padding: 4px 12px;
  border-radius: 20px;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
}

.tarea-creador {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6c757d;
}

.tarea-creador i {
  color: rgb(252, 215, 0);
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  animation: slideInUp 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
}

.snackbar-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.snackbar.success {
  background: #28a745;
}

.snackbar.error {
  background: #dc3545;
}

.snackbar.warning {
  background: #ffc107;
  color: #212529;
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin: 0;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.snackbar-close:hover {
  opacity: 1;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .filtros-row {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .tareas-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .tareas-title {
    font-size: 1.5rem;
  }
  
  .filtros-row {
    grid-template-columns: 1fr;
  }
  
  .panel-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .panel-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .tarea-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .tarea-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .tarea-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .snackbar {
    left: 16px;
    right: 16px;
    bottom: 16px;
    min-width: auto;
  }
}
</style>