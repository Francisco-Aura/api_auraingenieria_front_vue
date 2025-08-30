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
            <button class="btn-view" :class="{ active: vista === 'tabla' }" @click="vista = 'tabla'">
              <i class="fas fa-table"></i>
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

        <!-- Vista de tabla -->
        <div v-else-if="vista === 'tabla'" class="tareas-tabla">
          <div class="tabla-wrapper">
            <table class="tabla-tareas">
              <thead>
                <tr>
                  <th class="th-checkbox">
                    <input type="checkbox" v-model="todasSeleccionadasComputed" />
                  </th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Asignado a</th>
                  <th>Estado</th>
                  <th>Prioridad</th>
                  <th>Fecha inicio</th>
                  <th>Fecha vencimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tarea in tareasPaginadas" :key="tarea.id" 
                    :class="{ 'tarea-vencida': tarea.vencida, 'tarea-completada': tarea.estadoFinal }"
                    @click="handleVerDetalle(tarea)">
                  <td class="td-checkbox" @click.stop>
                    <input type="checkbox" v-model="tareasSeleccionadas" :value="tarea.id" />
                  </td>
                  <td class="td-titulo">
                    <div class="tarea-titulo">{{ tarea.titulo }}</div>
                    <div class="tarea-descripcion" v-if="tarea.descripcion">
                      {{ tarea.descripcion.length > 50 ? tarea.descripcion.substring(0, 50) + '...' : tarea.descripcion }}
                    </div>
                  </td>
                  <td>
                    <span class="tipo-badge">{{ tarea.tipo || 'Por hacer' }}</span>
                  </td>
                  <td>
                    <span v-if="tarea.clienteRelacionadoNombre" class="cliente-info">
                      <i class="fas fa-user"></i>
                      {{ tarea.clienteRelacionadoNombre }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span class="usuario-asignado">
                      <i class="fas fa-user-circle"></i>
                      {{ tarea.usuarioAsignadoNombre }}
                    </span>
                  </td>
                  <td>
                    <span class="estado-badge" :style="{ backgroundColor: tarea.estadoColor }">
                      {{ formatearEstadoNombre(tarea.estadoNombre) }}
                    </span>
                  </td>
                  <td>
                    <span class="prioridad-badge" :class="`prioridad-${tarea.prioridad}`">
                      {{ getPrioridadTexto(tarea.prioridad) }}
                    </span>
                  </td>
                  <td>{{ formatearFecha(tarea.fechaInicio) || '-' }}</td>
                  <td>
                    <span :class="{ 'fecha-vencida': tarea.vencida }">
                      {{ formatearFecha(tarea.fechaVencimiento) || '-' }}
                    </span>
                  </td>
                  <td class="td-acciones">
                    <div class="action-buttons">
                      <button class="btn-icon btn-view" @click.stop="handleVerDetalle(tarea)" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-icon btn-edit" @click.stop="handleActualizarTarea(tarea)" title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-delete" @click.stop="handleEliminarTarea(tarea.id)" title="Eliminar">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="paginacion" v-if="totalPaginas > 1">
            <button class="btn-pagina" :disabled="paginaActual === 1" @click="cambiarPagina(paginaActual - 1)">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="pagina-info">Página {{ paginaActual }} de {{ totalPaginas }}</span>
            <button class="btn-pagina" :disabled="paginaActual === totalPaginas" @click="cambiarPagina(paginaActual + 1)">
              <i class="fas fa-chevron-right"></i>
            </button>
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
      vista: 'tabla',
      
      // Paginación
      paginaActual: 1,
      tareasPorPagina: 10,
      tareasSeleccionadas: [],
      totalPaginas: 0,
      
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
    },
    tareasPaginadas() {
      const inicio = (this.paginaActual - 1) * this.tareasPorPagina;
      const fin = inicio + this.tareasPorPagina;
      return this.tareasFiltradas.slice(inicio, fin);
    },
    
    todasSeleccionadasComputed: {
      get() {
        return this.tareasPaginadas.length > 0 && 
               this.tareasPaginadas.every(tarea => this.tareasSeleccionadas.includes(tarea.id));
      },
      set(value) {
        if (value) {
          // Seleccionar todas las tareas de la página actual
          const idsPaginaActual = this.tareasPaginadas.map(t => t.id);
          this.tareasSeleccionadas = [...new Set([...this.tareasSeleccionadas, ...idsPaginaActual])];
        } else {
          // Deseleccionar todas las tareas de la página actual
          this.tareasSeleccionadas = this.tareasSeleccionadas.filter(id => 
            !this.tareasPaginadas.some(t => t.id === id)
          );
        }
      }
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
      this.totalPaginas = Math.ceil(this.tareasFiltradas.length / this.tareasPorPagina)
      this.paginaActual = 1 // Resetear a la primera página al aplicar filtros
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

    getPrioridadTexto(prioridad) {
      switch (prioridad) {
        case 1: return 'Baja'
        case 2: return 'Media'
        case 3: return 'Alta'
        default: return 'Normal'
      }
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
    },

    cambiarPagina(nuevaPagina) {
      this.paginaActual = nuevaPagina;
    }
  }
}
</script>

<style scoped>
/* Contenedor principal */
.tareas-container {
  background: #f7f9fc;
  min-height: 100vh;
  padding: 16px;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header principal */
.tareas-header {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tareas-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tareas-title i {
  color: rgb(252, 215, 0);
  font-size: 1.3rem;
}

.btn-crear {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.btn-crear:hover {
  background: #e6c200;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

/* Panel de filtros */
.filtros-panel {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.filtros-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filtro-group label {
  font-weight: 600;
  color: #495057;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.form-control {
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-range span {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.7rem;
}

.search-container {
  display: flex;
  gap: 4px;
}

.search-input {
  flex: 1;
}

.btn-search {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  min-width: 32px;
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
  font-size: 0.8rem;
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 4px;
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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.panel-header {
  background: #f8f9fa;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info h3 {
  margin: 0 0 3px 0;
  font-size: 0.95rem;
  color: #495057;
  font-weight: 600;
}

.task-count {
  font-size: 0.8rem;
  color: #6c757d;
}

.panel-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-incluir {
  display: flex;
  align-items: center;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #495057;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 32px;
  height: 16px;
  background: #dee2e6;
  border-radius: 8px;
  position: relative;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.2s ease;
}

.toggle-input:checked + .toggle-slider {
  background: rgb(252, 215, 0);
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(16px);
}

.view-buttons {
  display: flex;
  gap: 3px;
}

.btn-view {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
  font-size: 0.8rem;
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
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
  font-size: 0.8rem;
}

.btn-refresh:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

/* Contenido de tareas */
.tareas-content {
  padding: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
}

.spinner-small {
  width: 32px;
  height: 32px;
  border: 3px solid #e9ecef;
  border-top: 3px solid rgb(252, 215, 0);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: #6c757d;
}

.empty-icon {
  font-size: 3rem;
  color: #dee2e6;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #495057;
  font-size: 1.1rem;
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Lista de tareas */
.tareas-lista {
  width: 100%;
}

.tareas-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tarea-item {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tarea-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.tarea-item.tarea-vencida {
  border-left: 3px solid #dc3545;
  background: #fff5f5;
}

.tarea-item.tarea-completada {
  opacity: 0.7;
  background: #f8f9fa;
}

.tarea-checkbox {
  margin-top: 2px;
}

.tarea-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: rgb(252, 215, 0);
}

.tarea-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.tarea-titulo {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
}

.tipo-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
  white-space: nowrap;
}

.tarea-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tarea-asociacion,
.tarea-asignacion {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6c757d;
}

.tarea-asociacion i,
.tarea-asignacion i {
  color: rgb(252, 215, 0);
  width: 14px;
}

.tarea-descripcion {
  color: #495057;
  font-size: 0.8rem;
  line-height: 1.4;
  margin-top: 6px;
}

.tarea-fechas {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fecha-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6c757d;
}

.fecha-item i {
  color: rgb(252, 215, 0);
  width: 12px;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.estado-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  color: white;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
}

.tarea-creador {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #6c757d;
}

.tarea-creador i {
  color: rgb(252, 215, 0);
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  padding: 12px 16px;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: slideInUp 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  min-width: 280px;
  font-size: 0.85rem;
}

.snackbar-content {
  display: flex;
  align-items: center;
  gap: 6px;
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
  font-size: 0.9rem;
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
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }
}

@media (max-width: 768px) {
  .tareas-container {
    padding: 12px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .tareas-title {
    font-size: 1.3rem;
  }
  
  .filtros-row {
    grid-template-columns: 1fr;
  }
  
  .panel-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .panel-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .tarea-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .tarea-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .tarea-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .snackbar {
    left: 12px;
    right: 12px;
    bottom: 12px;
    min-width: auto;
  }
}

/* Vista de tabla */
.tareas-tabla {
  width: 100%;
}

.tabla-wrapper {
  overflow-x: auto;
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.tabla-tareas {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.tabla-tareas thead {
  background: #f8f9fa;
}

.tabla-tareas th {
  padding: 8px 6px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.7rem;
  white-space: nowrap;
}

.tabla-tareas tbody tr {
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabla-tareas tbody tr:hover {
  background: rgba(252, 215, 0, 0.05);
}

.tabla-tareas td {
  padding: 6px 6px;
  color: #495057;
  font-size: 0.7rem;
  vertical-align: middle;
}

.th-checkbox,
.td-checkbox {
  width: 24px;
  text-align: center;
}

.td-titulo {
  max-width: 200px;
}

.tarea-titulo {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
  font-size: 0.75rem;
}

.tarea-descripcion {
  font-size: 0.65rem;
  color: #6c757d;
  line-height: 1.2;
}

.tipo-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
  white-space: nowrap;
}

.cliente-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.usuario-asignado {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.estado-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  color: white;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
}

.prioridad-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 500;
  white-space: nowrap;
}

.prioridad-1 { background: #28a745; color: white; }
.prioridad-2 { background: #ffc107; color: #212529; }
.prioridad-3 { background: #dc3545; color: white; }

.fecha-vencida {
  color: #dc3545;
  font-weight: 600;
}

.td-acciones {
  width: 80px;
}

.action-buttons {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon.btn-view {
  color: #2196f3;
}
.btn-icon.btn-view:hover {
  background-color: rgba(33,150,243,0.1);
}

.btn-icon.btn-edit {
  color: #ff9800;
}
.btn-icon.btn-edit:hover {
  background-color: rgba(255,152,0,0.1);
}

.btn-icon.btn-delete {
  color: #f44336;
}
.btn-icon.btn-delete:hover {
  background-color: rgba(244,67,54,0.1);
}

.tarea-vencida {
  background: #fff5f5 !important;
}

.tarea-completada {
  opacity: 0.7;
}

/* Paginación */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.btn-pagina {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  color: #495057;
}

.btn-pagina:hover:not(:disabled) {
  background: rgb(252, 215, 0);
  border-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-pagina:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagina-info {
  font-size: 0.7rem;
  color: #6c757d;
  font-weight: 500;
}

.text-muted {
  color: #adb5bd;
  font-style: italic;
}

</style>