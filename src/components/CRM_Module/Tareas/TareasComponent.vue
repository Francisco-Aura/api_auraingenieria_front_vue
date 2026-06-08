<template>
  <div class="tareas-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="cargando" />

    <!-- Estadísticas detalladas -->
    <EstadisticasTareasComponent ref="estadisticas" />

    <!-- Panel de tareas con tabla mejorada -->
    <div class="card table-panel">
      <div class="table-header">
        <h3 class="table-title">Gestión de Tareas</h3>
        <div class="vista-toggle">
          <button class="btn-view-toggle" :class="{ active: vistaActual === 'tabla' }" @click="vistaActual = 'tabla'" title="Vista tabla">
            <i class="fas fa-table"></i>
            <span>Tabla</span>
          </button>
          <button class="btn-view-toggle" :class="{ active: vistaActual === 'calendario' }" @click="vistaActual = 'calendario'" title="Vista calendario">
            <i class="fas fa-calendar-alt"></i>
            <span>Calendario</span>
          </button>
        </div>
        <div class="table-actions-horizontal">
          <button class="btn btn-refresh" @click="cargarTareas" :disabled="cargando" title="Actualizar datos">
            <i :class="cargando ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            <span>Actualizar</span>
          </button>
          <button v-if="vistaActual === 'tabla'" class="btn btn-export btn-excel" @click="exportarExcel" title="Exportar a Excel">
            <i class="fas fa-file-download"></i>
            <span>Excel</span>
          </button>
          <button class="btn btn-toggle-completed" :class="{ active: mostrarCompletadas }" @click="mostrarCompletadas = !mostrarCompletadas" title="Mostrar/ocultar tareas completadas">
            <i :class="mostrarCompletadas ? 'fas fa-check-circle' : 'fas fa-tasks'"></i>
            <span>{{ mostrarCompletadas ? 'Completadas' : 'Sin Completar' }}</span>
          </button>
          <button class="btn btn-create" @click="abrirModalCrearTarea" title="Crear nueva tarea">
            <i class="fas fa-plus-circle"></i>
            <span>Crear Tarea</span>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table v-if="vistaActual === 'tabla'" class="data-table">
          <thead>
            <tr>
              <th class="sortable" style="width: 22%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('titulo')">
                    <i class="fas fa-text-width mr-2"></i>Título
                    <i :class="getSortIcon('titulo')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.titulo" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 24%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('clienteRelacionadoNombre')">
                    <i class="fas fa-building mr-2"></i>Cliente
                    <i :class="getSortIcon('clienteRelacionadoNombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cliente" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 5%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('usuarioAsignadoNombre')">
                    <i class="fas fa-user-tie mr-2"></i>Asignado a
                    <i :class="getSortIcon('usuarioAsignadoNombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.usuario" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 12%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('estadoNombre')">
                    <i class="fas fa-tasks mr-2"></i>Estado
                    <i :class="getSortIcon('estadoNombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.estado" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 10%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('prioridad')">
                    <i class="fas fa-flag mr-2"></i>Prioridad
                    <i :class="getSortIcon('prioridad')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.prioridad" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 12%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('categoriaNombre')">
                    <i class="fas fa-folder mr-2"></i>Categoría
                    <i :class="getSortIcon('categoriaNombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.categoria" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 12%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('fechaVencimiento')">
                    <i class="fas fa-calendar-alt mr-2"></i>Fecha vto.
                    <i :class="getSortIcon('fechaVencimiento')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.fecha" 
                      @input="aplicarFiltrosDebounced"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th style="width: 8%">
                <div class="column-header">
                  <div class="column-title">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tarea in paginatedTareas" :key="tarea.id" 
                :class="{ 'tarea-vencida': tarea.vencida, 'tarea-completada': tarea.estadoFinal, 'tarea-fijada': tarea.fijada }">
              <td class="text-truncate" :title="tarea.titulo">
                <span class="titulo-container">
                  <button class="btn-pin" @click.stop="toggleFijada(tarea)" :title="tarea.fijada ? 'Quitar fijado' : 'Fijar tarea'">
                    <i class="fas fa-thumbtack" :class="{ 'pin-activo': tarea.fijada }"></i>
                  </button>
                  {{ tarea.titulo }}
                </span>
              </td>
              <td :title="tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre || '-'">
                <div v-if="tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre" class="cliente-cell">
                  <span class="cliente-nombre-truncate">
                    <i class="fas fa-user-circle"></i>
                    {{ tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre }}
                    <span v-if="tarea.clientePotencialNombre && !tarea.clienteRelacionadoNombre" class="potencial-badge" title="Cliente potencial (no registrado)">
                      <i class="fas fa-user-clock"></i>
                    </span>
                  </span>
                  <span v-if="tarea.cups" class="cups-badge" :title="tarea.cups">
                    <i class="fas fa-bolt"></i> {{ tarea.cups }}
                  </span>
                </div>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="text-truncate" :title="tarea.usuarioAsignadoNombre || '-'">
                <span v-if="tarea.usuarioAsignadoNombre">{{ tarea.usuarioAsignadoNombre }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="estado-badge" :style="{ backgroundColor: tarea.estadoColor }">
                  <i :class="getEstadoIcon(tarea.estadoNombre)"></i>
                  {{ tarea.estadoNombre }}
                </span>
              </td>
              <td>
                <span class="prioridad-badge" :class="`prioridad-${tarea.prioridad}`">
                  {{ getPrioridadTexto(tarea.prioridad) }}
                </span>
              </td>
              <td class="text-truncate" :title="tarea.categoriaNombre || '-'">
                <span v-if="tarea.categoriaNombre" class="categoria-badge">{{ tarea.categoriaNombre }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td :class="{ 'fecha-vencida': tarea.vencida }">
                {{ formatearFecha(tarea.fechaVencimiento) || '-' }}
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-view" @click="handleVerDetalle(tarea)" title="Ver detalle">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button v-if="puedeEditarTarea(tarea)" class="btn-icon btn-edit" @click="handleActualizarTarea(tarea)" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button v-if="puedeEliminarTarea(tarea)" class="btn-icon btn-delete" @click="handleEliminarTarea(tarea.id)" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedTareas.length === 0">
              <td colspan="8" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">{{ tareas.length === 0 ? 'No hay tareas. ¡Crea una nueva!' : 'No se encontraron tareas que coincidan con los filtros' }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Vista Calendario -->
        <TareasCalendarioView
          v-if="vistaActual === 'calendario'"
          :tareas="tareas"
          :estados="estados"
          @ver-detalle="handleVerDetalle"
          @nueva-tarea="crearTareaEnFecha"
        />
      </div>

      <!-- Paginación -->
      <div v-if="vistaActual === 'tabla'" class="pagination-controls">
        <div class="records-per-page">
          <label for="recordsPerPage">Registros por página:</label>
          <select v-model="tareasPorPagina" id="recordsPerPage" class="form-control">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ tareasFiltradas.length }} registros
        </div>
        <div class="pagination-buttons">
          <button 
            class="btn btn-outline" 
            :disabled="paginaActual === 1"
            @click="paginaActual = 1"
            title="Primera página"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="paginaActual === 1"
            @click="paginaActual--"
            title="Página anterior"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Página {{ paginaActual }} de {{ totalPages || 1 }}</span>
          <button 
            class="btn btn-outline" 
            :disabled="paginaActual >= totalPages"
            @click="paginaActual++"
            title="Página siguiente"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="paginaActual >= totalPages"
            @click="paginaActual = totalPages"
            title="Última página"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de detalle de tarea -->
    <TareaDetalleModal
      v-if="mostrarModalDetalle"
      :value="mostrarModalDetalle"
      :tarea="tareaDetalle"
      :estados="estados"
      @actualizar="handleActualizarTarea"
      @cambiar-estado="handleCambiarEstado"
      @completar-con-comentario="handleCompletarConComentario"
      @crear-comentario-estado="handleCrearComentarioEstado"
      @cerrar="cerrarModalDetalle"
    />

    <!-- Modal de creación/edición de tarea -->
    <TareaModalCorporativo
      :value="mostrarModalCrearTarea"
      @update:value="mostrarModalCrearTarea = $event"
      :tarea="tareaEnEdicion"
      :estados="estados"
      :usuarios="usuarios"
      :categorias="categorias"
      :guardando="guardandoTarea"
      @guardar="handleGuardarTarea"
      @cerrar="cerrarModal"
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
import TareaDetalleModal from './TareaDetalleModal.vue'
import EstadisticasTareasComponent from './EstadisticasTareasComponent.vue'
import TareaModalCorporativo from './TareaModalCorporativo.vue'
import TareasCalendarioView from './TareasCalendarioView.vue'
import Spinner from '@/components/SpinnerComponent.vue'

export default {
  name: 'TareasComponent',
  components: {
    TareaDetalleModal,
    EstadisticasTareasComponent,
    TareaModalCorporativo,
    TareasCalendarioView,
    Spinner
  },
  data() {
    return {
      tareas: [],
      tareasFiltradas: [],
      estados: [],
      usuarios: [],
      categorias: [],
      subcategorias: [],
      cargando: false,
      mostrarCompletadas: false,
      
      // Modales
      mostrarModalCrearTarea: false,
      mostrarModalDetalle: false,
      tareaEnEdicion: null,
      tareaDetalle: null,
      
      // Filtros por columna
      columnFilters: {
        titulo: '',
        categoria: '',
        estado: '',
        prioridad: '',
        cliente: '',
        usuario: '',
        fecha: ''
      },
      
      // Debounce para filtros
      filtroDebounceTimer: null,
      
      // Ordenamiento
      sortKey: null,
      sortOrder: null,
      
      // Paginación
      paginaActual: 1,
      tareasPorPagina: 10,
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },

      // Vistas
      vistaActual: 'tabla',

      // Estado de guardado
      guardandoTarea: false
    }
  },
  computed: {
    // Usuario actual logueado
    usuarioActual() {
      return JSON.parse(localStorage.getItem('usuario') || '{}')
    },
    
    esAdmin() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario && usuario.nivelAcceso === 1
    },

    tareasVencidas() {
      return this.tareas.filter(t => t.vencida && !t.estadoFinal)
    },

    tareasEnProgreso() {
      return this.tareas.filter(t => t.estadoNombre?.toLowerCase().includes('progreso'))
    },

    tareasCompletadas() {
      return this.tareas.filter(t => t.estadoFinal)
    },

    sortedTareas() {
      if (!this.sortKey || !this.sortOrder) return this.tareasFiltradas
      
      const sorted = [...this.tareasFiltradas].sort((a, b) => {
        let aValue = a[this.sortKey]
        let bValue = b[this.sortKey]
        
        aValue = aValue ?? ''
        bValue = bValue ?? ''
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return this.sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue).toLowerCase()
        const bStr = String(bValue).toLowerCase()
        
        if (this.sortOrder === 'asc') {
          return aStr > bStr ? 1 : -1
        } else {
          return aStr < bStr ? 1 : -1
        }
      })
      
      return sorted
    },
    
    paginatedTareas() {
      const start = (this.paginaActual - 1) * this.tareasPorPagina
      const end = start + this.tareasPorPagina
      return this.sortedTareas.slice(start, end)
    },
    
    totalPages() {
      return Math.ceil(this.tareasFiltradas.length / this.tareasPorPagina)
    },
    
    paginationStart() {
      return (this.paginaActual - 1) * this.tareasPorPagina + 1
    },
    
    paginationEnd() {
      const end = this.paginaActual * this.tareasPorPagina
      return end > this.tareasFiltradas.length ? this.tareasFiltradas.length : end
    },

    todasSeleccionadasComputed: {
      get() {
        return this.paginatedTareas.length > 0 && 
               this.paginatedTareas.every(tarea => this.tareaSeleccionadas?.includes(tarea.id))
      },
      set() {
        // No se usa en esta versión mejorada
      }
    }
  },
  watch: {
    mostrarCompletadas() {
      this.aplicarFiltros()
    },
    '$route.query.abrirDetalle': {
      immediate: true,
      async handler(tareaId) {
        if (!tareaId) return
        // Esperar a que las tareas estén cargadas
        if (this.tareas.length === 0) {
          await this.inicializar()
        }
        const tarea = this.tareas.find(t => String(t.id) === String(tareaId))
        if (tarea) {
          this.tareaDetalle = { ...tarea }
          this.mostrarModalDetalle = true
        }
      }
    }
  },
  async mounted() {
    await this.inicializar()
    // Abrir detalle si viene en query params (por si el watch no lo pilló antes de cargar)
    const tareaId = this.$route.query.abrirDetalle
    if (tareaId && !this.mostrarModalDetalle) {
      const tarea = this.tareas.find(t => String(t.id) === String(tareaId))
      if (tarea) {
        this.tareaDetalle = { ...tarea }
        this.mostrarModalDetalle = true
      }
    }
  },
  methods: {
    /**
     * Verifica si el usuario actual puede editar una tarea.
     * Las tareas creadas por un administrador (nivel 1) solo pueden ser editadas por administradores.
     * @param {Object} tarea - La tarea a verificar
     * @returns {Boolean} - true si puede editar, false si no
     */
    puedeEditarTarea(tarea) {
      if (!tarea) return false
      
      // Si el usuario actual es admin, puede editar cualquier tarea
      if (this.esAdmin) return true
      
      // Si la tarea fue creada por un admin (nivel 1), solo admin puede editarla
      if (tarea.nivelAccesoCreador === 1) return false
      
      // En cualquier otro caso, puede editar
      return true
    },
    
    /**
     * Verifica si el usuario actual puede eliminar una tarea.
     * Solo los administradores pueden eliminar tareas creadas por administradores.
     * @param {Object} tarea - La tarea a verificar
     * @returns {Boolean} - true si puede eliminar, false si no
     */
    puedeEliminarTarea(tarea) {
      if (!tarea) return false
      
      // Si el usuario actual es admin, puede eliminar cualquier tarea
      if (this.esAdmin) return true
      
      // Si la tarea fue creada por un admin (nivel 1), solo admin puede eliminarla
      if (tarea.nivelAccesoCreador === 1) return false
      
      // En cualquier otro caso, puede eliminar
      return true
    },
    
    abrirModalCrearTarea() {
      this.tareaEnEdicion = null // Asegurar que no hay tarea en edición
      this.mostrarModalCrearTarea = true
    },

    async inicializar() {
      try {
        this.cargando = true
        
        // Verificar si el módulo está activo
        const moduloActivo = await tareasApi.verificarModuloActivo()
        if (!moduloActivo) {
          this.mostrarMensaje('El módulo de tareas no está activo', 'warning')
          return
        }
        
        // Cargar datos en paralelo para mejor rendimiento
        const [tareasData, estadosData, usuariosData, categoriasData] = await Promise.all([
          this.fetchTareas(),
          tareasApi.obtenerEstados(),
          this.fetchUsuarios(),
          tareasApi.obtenerCategorias?.() || Promise.resolve([])
        ])
        
        this.tareas = tareasData
        this.estados = estadosData
        this.usuarios = usuariosData
        this.categorias = categoriasData
        
        this.aplicarFiltros()
        
        // Cargar estadísticas en segundo plano (no bloqueante)
        this.$nextTick(() => {
          if (this.$refs.estadisticas) {
            this.$refs.estadisticas.cargarEstadisticasConDatos(this.tareas)
          }
        })
      } catch (error) {
        console.error('Error inicializando:', error)
        this.mostrarMensaje('Error al cargar los datos', 'error')
      } finally {
        this.cargando = false
      }
    },
    
    async fetchTareas() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (usuario && usuario.nivelAcceso === 1) {
        return await tareasApi.obtenerTodasLasTareas()
      } else {
        if (!usuario.id) {
          throw new Error('No se encontró el usuario logueado')
        }
        return await tareasApi.obtenerTareasPorUsuario(parseInt(usuario.id))
      }
    },
    
    async fetchUsuarios() {
      try {
        const data = await tareasApi.obtenerUsuarios()
        if (data) {
          return data
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error)
      }
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (usuario.id && usuario.nombre) {
        return [{ id: parseInt(usuario.id), nombre: usuario.nombre }]
      }
      return []
    },
    
    async cargarTareas() {
      try {
        this.cargando = true
        this.tareas = await this.fetchTareas()
        this.aplicarFiltros()
        
        // Actualizar estadísticas con los datos ya cargados (sin llamada adicional al servidor)
        if (this.$refs.estadisticas) {
          this.$refs.estadisticas.cargarEstadisticasConDatos(this.tareas)
        }
      } catch (error) {
        console.error('Error cargando tareas:', error)
        this.mostrarMensaje('Error al cargar las tareas', 'error')
      } finally {
        this.cargando = false
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
      this.usuarios = await this.fetchUsuarios()
    },

    async cargarCategorias() {
      try {
        this.categorias = await tareasApi.obtenerCategorias?.() || []
      } catch (error) {
        console.error('Error cargando categorías:', error)
        this.categorias = []
      }
    },
    
    // Aplicar filtros con debounce para mejor rendimiento (llamado desde @input)
    aplicarFiltrosDebounced() {
      // Limpiar timer anterior
      if (this.filtroDebounceTimer) {
        clearTimeout(this.filtroDebounceTimer)
      }
      // Ejecutar filtros después de 150ms sin escribir
      this.filtroDebounceTimer = setTimeout(() => {
        this.aplicarFiltrosInmediato()
      }, 150)
    },
    
    // Aplicar filtros inmediatamente (sin debounce)
    aplicarFiltros() {
      this.aplicarFiltrosInmediato()
    },
    
    aplicarFiltrosInmediato() {
      let resultado = this.tareas
      
      // Solo filtrar si hay filtros activos
      const hayFiltros = this.columnFilters.titulo || 
                         this.columnFilters.categoria || 
                         this.columnFilters.estado || 
                         this.columnFilters.prioridad || 
                         this.columnFilters.cliente || 
                         this.columnFilters.usuario || 
                         this.columnFilters.fecha

      if (hayFiltros) {
        resultado = resultado.filter(t => {
          // Filtrar título
          if (this.columnFilters.titulo) {
            if (!t.titulo?.toLowerCase().includes(this.columnFilters.titulo.toLowerCase())) return false
          }
          
          // Filtrar categoría
          if (this.columnFilters.categoria) {
            if (!t.categoriaNombre?.toLowerCase().includes(this.columnFilters.categoria.toLowerCase())) return false
          }
          
          // Filtrar estado
          if (this.columnFilters.estado) {
            if (!t.estadoNombre?.toLowerCase().includes(this.columnFilters.estado.toLowerCase())) return false
          }
          
          // Filtrar prioridad
          if (this.columnFilters.prioridad) {
            if (!this.getPrioridadTexto(t.prioridad).toLowerCase().includes(this.columnFilters.prioridad.toLowerCase())) return false
          }
          
          // Filtrar cliente
          if (this.columnFilters.cliente) {
            const nombreCliente = (t.clienteRelacionadoNombre || t.clientePotencialNombre || '').toLowerCase()
            if (!nombreCliente.includes(this.columnFilters.cliente.toLowerCase())) return false
          }
          
          // Filtrar usuario
          if (this.columnFilters.usuario) {
            if (!t.usuarioAsignadoNombre?.toLowerCase().includes(this.columnFilters.usuario.toLowerCase())) return false
          }
          
          // Filtrar fecha
          if (this.columnFilters.fecha) {
            const fecha = this.formatearFecha(t.fechaVencimiento).toLowerCase()
            if (!fecha.includes(this.columnFilters.fecha.toLowerCase())) return false
          }
          
          return true
        })
      }
      
      // Filtrar completadas según la selección
      if (this.mostrarCompletadas) {
        resultado = resultado.filter(t => t.estadoNombre?.toLowerCase() === 'completada')
      } else {
        resultado = resultado.filter(t => t.estadoNombre?.toLowerCase() !== 'completada')
      }
      
      // Ordenar: tareas fijadas primero
      if (resultado.some(t => t.fijada)) {
        resultado = [...resultado].sort((a, b) => (b.fijada ? 1 : 0) - (a.fijada ? 1 : 0))
      }
      
      this.tareasFiltradas = resultado
      this.paginaActual = 1
    },

    sortBy(campo) {
      if (this.sortKey === campo) {
        // Cambiar dirección si se hace clic en el mismo campo
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        // Nuevo campo, ordenar ascendente
        this.sortKey = campo
        this.sortOrder = 'asc'
      }
    },

    getSortIcon(campo) {
      if (this.sortKey !== campo) {
        return 'fas fa-sort'
      }
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    },
    
    async exportarExcel() {
      try {
        const ExcelJS = require('exceljs')
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Tareas')
        
        // Configurar columnas con anchos
        worksheet.columns = [
          { header: 'Título', key: 'titulo', width: 30 },
          { header: 'Categoría', key: 'categoria', width: 15 },
          { header: 'Estado', key: 'estado', width: 15 },
          { header: 'Prioridad', key: 'prioridad', width: 12 },
          { header: 'Cliente', key: 'cliente', width: 25 },
          { header: 'Asignado a', key: 'asignado', width: 20 },
          { header: 'Vencimiento', key: 'vencimiento', width: 15 },
          { header: 'Estado Final', key: 'estadoFinal', width: 12 }
        ]
        
        // Añadir datos
        this.tareasFiltradas.forEach(tarea => {
          worksheet.addRow({
            titulo: tarea.titulo,
            categoria: tarea.categoriaNombre || '-',
            estado: tarea.estadoNombre,
            prioridad: this.getPrioridadTexto(tarea.prioridad),
            cliente: tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre || '-',
            asignado: tarea.usuarioAsignadoNombre || '-',
            vencimiento: this.formatearFecha(tarea.fechaVencimiento) || '-',
            estadoFinal: tarea.estadoFinal ? 'Completada' : 'Activa'
          })
        })
        
        // Estilizar encabezados
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        
        // Generar buffer y descargar (funciona en navegador)
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Tareas_${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
        
        this.mostrarMensaje('Archivo exportado exitosamente', 'success')
      } catch (error) {
        console.error('Error exportando a Excel:', error)
        this.mostrarMensaje('Error al exportar', 'error')
      }
    },
    
    async handleGuardarTarea(tarea, archivos = []) {
      this.guardandoTarea = true
      try {
        if (tarea.id) {
          await tareasApi.actualizarTarea(tarea.id, tarea)

          // En edición también permitir adjuntar nuevos archivos directos
          if (archivos && archivos.length > 0) {
            try {
              await tareasApi.subirAdjuntosTarea(tarea.id, archivos)
            } catch (e) {
              console.error('Error subiendo adjuntos en edición:', e)
              this.mostrarMensaje('Tarea actualizada, pero hubo un error al subir algunos adjuntos', 'warning')
            }
          }

          this.mostrarMensaje('Tarea actualizada correctamente', 'success')
        } else {
          const nueva = await tareasApi.crearTarea(tarea)
          
          // Subir adjuntos directos si los hay
          if (archivos && archivos.length > 0) {
            try {
              await tareasApi.subirAdjuntosTarea(nueva.id, archivos)
            } catch (e) {
              console.error('Error subiendo adjuntos:', e)
              this.mostrarMensaje('Tarea creada, pero hubo un error al subir algunos adjuntos', 'warning')
            }
          }

          this.mostrarMensaje('Tarea creada correctamente', 'success')

          // Si llegaron comentarios desde el modal, crearlos
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
        const errData = error.response?.data;
        const detalle = errData?.message || errData?.error || errData?.mensaje || (typeof errData === 'string' ? errData : '') || error.message || '';
        this.mostrarMensaje(detalle ? `Error al guardar la tarea: ${detalle}` : 'Error al guardar la tarea', 'error')
      } finally {
        this.guardandoTarea = false
      }
    },
    
    async handleActualizarTarea(tarea) {
      // Verificar permisos antes de permitir la edición
      if (!this.puedeEditarTarea(tarea)) {
        this.mostrarMensaje('No tienes permisos para editar esta tarea. Solo los administradores pueden editar tareas creadas por administradores.', 'warning')
        return
      }
      
      try {
        // Obtener la tarea completa para edición
        const tareaCompleta = await tareasApi.obtenerTareaPorId(tarea.id)
        this.tareaEnEdicion = tareaCompleta
        this.mostrarModalCrearTarea = true
      } catch (error) {
        console.error('Error obteniendo tarea para editar:', error)
        this.mostrarMensaje('Error al cargar la tarea para editar', 'error')
      }
    },
    
    async handleCambiarEstado(tareaId, estadoId, motivoBloqueo = null) {
      try {
        await tareasApi.cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo)
        this.mostrarMensaje('Estado actualizado correctamente', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.cerrarModalDetalle()
      } catch (error) {
        console.error('Error cambiando estado:', error)
        this.mostrarMensaje('Error al cambiar el estado', 'error')
      }
    },

    async handleCompletarConComentario(data) {
      try {
        // Obtener usuario actual
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        
        // Primero crear el comentario
        await tareasApi.crearComentario({
          tareaId: data.tareaId,
          usuarioId: usuario.id,
          comentario: data.comentario.contenido
        })
        
        // Luego cambiar el estado a completado
        await tareasApi.cambiarEstadoTarea(data.tareaId, data.estadoId)
        
        this.mostrarMensaje('Tarea marcada como completada', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.cerrarModalDetalle()
      } catch (error) {
        console.error('Error completando tarea:', error)
        this.mostrarMensaje('Error al completar la tarea', 'error')
      }
    },

    async handleCrearComentarioEstado(data) {
      try {
        // Obtener usuario actual
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        
        await tareasApi.crearComentario({
          tareaId: data.tareaId,
          usuarioId: usuario.id,
          comentario: data.contenido
        })
      } catch (error) {
        console.error('Error creando comentario de estado:', error)
        this.mostrarMensaje('Error al guardar el comentario', 'error')
      }
    },
    
    async toggleFijada(tarea) {
      try {
        const nuevoEstadoFijada = !tarea.fijada
        // Usar nuevo endpoint PATCH optimizado
        await tareasApi.toggleFijada(tarea.id, nuevoEstadoFijada)
        
        // Actualizar localmente
        tarea.fijada = nuevoEstadoFijada
        
        // Reordenar la lista
        this.aplicarFiltros()
        
        this.mostrarMensaje(
          nuevoEstadoFijada ? 'Tarea fijada correctamente' : 'Tarea desfijada',
          'success'
        )
      } catch (error) {
        console.error('Error al fijar/desfijar tarea:', error)
        this.mostrarMensaje('Error al actualizar el estado de fijado', 'error')
      }
    },
    
    async handleEliminarTarea(tareaId) {
      const confirmacion = await this.$swal.fire({
        icon: 'warning',
        title: '¿Eliminar tarea?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      })

      if (!confirmacion.isConfirmed) return

      try {
        await tareasApi.eliminarTarea(tareaId)
        this.mostrarMensaje('Tarea eliminada correctamente', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
      } catch (error) {
        console.error('Error eliminando tarea:', error)
        this.mostrarMensaje('Error al eliminar la tarea', 'error')
      }
    },
    
    async handleVerDetalle(tarea) {
      // Crear una copia de la tarea para forzar reactividad
      this.tareaDetalle = { ...tarea }
      this.mostrarModalDetalle = true
    },

    cerrarModalDetalle() {
      this.mostrarModalDetalle = false
      // Limpiar la tarea detalle después de cerrar
      this.$nextTick(() => {
        this.tareaDetalle = null
      })
    },
    
    cerrarModal() {
      this.mostrarModalCrearTarea = false
      // Usar nextTick para limpiar después de que el modal se cierre
      this.$nextTick(() => {
        this.tareaEnEdicion = null
      })
    },

    crearTareaEnFecha(fecha) {
      // Crear una tarea con la fecha preseleccionada
      this.tareaEnEdicion = {
        fechaVencimiento: fecha,
        titulo: '',
        descripcion: '',
        estadoId: 1
      }
      this.mostrarModalCrearTarea = true
    },
    
    formatearFecha(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

    getPrioridadTexto(prioridad) {
      switch (prioridad) {
        case 0: return 'Urgente'
        case 1: return 'Alta'
        case 2: return 'Media'
        case 3: return 'Baja'
        default: return 'Normal'
      }
    },
    
    getEstadoIcon(estadoNombre) {
      const estado = estadoNombre ? estadoNombre.toLowerCase() : ''
      switch (estado) {
        case 'pendiente':
        case 'pending':
          return 'far fa-clock'
        case 'en progreso':
        case 'in progress':
        case 'progreso':
          return 'far fa-play-circle'
        case 'completada':
        case 'completed':
        case 'finalizada':
          return 'far fa-check-circle'
        case 'cancelada':
        case 'cancelled':
          return 'far fa-times-circle'
        case 'pausada':
        case 'paused':
          return 'far fa-pause-circle'
        case 'bloqueada':
        case 'blocked':
          return 'fas fa-lock'
        default:
          return 'fas fa-circle'
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
    }
  }
}
</script>

<style scoped>
/* Grid layout para el contenedor principal */
.tareas-container {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 90%;
  margin: 0 auto;
}

/* Panel de la tabla */
.table-panel {
  background: white;
  border-radius: 0.7rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  position: relative;
}

.table-header {
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--surface-color);
  gap: 15px;
}

.table-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.vista-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 6px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.btn-view-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background-color: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.btn-view-toggle:hover {
  background-color: rgba(252, 215, 0, 0.1);
  color: var(--text-primary);
}

.btn-view-toggle.active {
  background-color: rgb(252, 215, 0);
  color: black;
  font-weight: 600;
}

.table-actions-horizontal {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

/* Estilos Generales de Botones - Actualizados */
.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
  cursor: pointer !important;
  letter-spacing: 0.3px !important;
}

.btn i {
  font-size: 1.1em !important;
}

/* Botón Refresh/Actualizar */
.btn-refresh {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1) !important;
}

.btn-refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15) !important;
}

.btn-refresh:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
  background: #9ca3af !important;
}

/* Botón Excel */
.btn-excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1) !important;
}

.btn-excel:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.15) !important;
}

/* Botón Primary (Crear, Guardar, etc) */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1) !important;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15) !important;
}

.btn-primary i {
  font-size: 1.1em !important;
}

/* Botón Toggle Completed (Mostrar/Ocultar completadas) */
.btn-toggle-completed {
  background: #f3f4f6 !important;
  color: #4b5563 !important;
  border: 1px solid #e5e7eb !important;
  font-weight: 600 !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}

.btn-toggle-completed:hover {
  background: #e5e7eb !important;
  color: #1f2937 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

/* Estado Activo (Rojo) para Toggle Completed */
.btn-toggle-completed.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1) !important;
}

.btn-toggle-completed.active:hover {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.15) !important;
}

/* Botón Create (Crear Tarea) */
.btn-create {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1) !important;
}

.btn-create:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15) !important;
}

.btn-create i {
  font-size: 1.1em !important;
}

.btn-export i {
  font-size: 1.2em;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  margin: 0;
}

.btn-icon i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.btn-icon.btn-edit {
  color: #2196f3;
}
.btn-icon.btn-edit:hover {
  background-color: rgba(33,150,243,0.1);
}

.btn-icon.btn-view {
  color: #43a047;
}
.btn-icon.btn-view:hover {
  background-color: rgba(67,160,71,0.1);
}

.btn-icon.btn-complete {
  color: #28a745;
}
.btn-icon.btn-complete:hover {
  background-color: rgba(40,167,69,0.1);
}

.btn-icon.btn-delete {
  color: #dc3545;
}
.btn-icon.btn-delete:hover {
  background-color: rgba(220,53,69,0.1);
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-per-page label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px;
}

.records-per-page select {
  width: auto;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-primary);
  cursor: pointer;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--hover-color);
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-info {
  color: var(--text-primary);
  font-weight: 500;
  padding: 0 10px;
}

.btn-outline {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 40px;
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: black;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 12px 15px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  vertical-align: top;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: 52px;
}

.data-table th i {
  margin-left: 4px;
  font-size: 0.9em;
  color: var(--text-secondary);
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-responsive {
  overflow-x: auto;
  background-color: white;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  min-width: 120px;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-title {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.column-title:hover {
  background-color: var(--hover-color);
}

.sortable .column-title {
  color: var(--text-primary);
  font-weight: 600;
}

.sortable .column-title:hover {
  color: var(--primary-color);
}

.column-filter-container {
  position: relative;
}

.column-filter {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.column-filter:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.column-filter::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Badges */
.cliente-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.cliente-nombre-truncate {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.potencial-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: #f39c12;
  font-size: 0.75rem;
  opacity: 0.85;
}

.cups-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0369a1;
  background: #e0f2fe;
  border-radius: 5px;
  padding: 1px 6px;
  white-space: nowrap;
  width: fit-content;
}

.categoria-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e7f1f8;
  color: #0c5460;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 0.5px;
}

.estado-badge i {
  font-size: 0.65rem;
}

.prioridad-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.3px;
  border: 2px solid transparent;
}

.prioridad-0 { 
  background: #8b0000; 
  color: white;
  border-color: #5c0000;
  animation: pulse-urgente 2s infinite;
}

.prioridad-0::before {
  content: '\f071';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

@keyframes pulse-urgente {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 0, 0, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(139, 0, 0, 0); }
}

.prioridad-1 { 
  background: #dc3545; 
  color: white;
  border-color: #bd2130;
}

.prioridad-1::before {
  content: '\f062';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.prioridad-2 { 
  background: #fff3cd; 
  color: #856404;
  border-color: #ffc107;
}

.prioridad-2::before {
  content: '\f068';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.prioridad-3 { 
  background: #d4edda; 
  color: #155724;
  border-color: #28a745;
}

.prioridad-3::before {
  content: '\f063';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.fecha-vencida {
  color: #dc3545;
  font-weight: 600;
}

/* Estados de filas */
.tarea-vencida {
  background-color: rgba(220, 53, 69, 0.05) !important;
}

.tarea-vencida:hover {
  background-color: rgba(220, 53, 69, 0.1) !important;
}

.tarea-fijada {
  background-color: rgba(255, 193, 7, 0.08) !important;
  border-left: 3px solid #ffc107 !important;
}

.tarea-fijada:hover {
  background-color: rgba(255, 193, 7, 0.15) !important;
}

.titulo-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-pin {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  color: #adb5bd;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-pin:hover {
  background-color: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.btn-pin .pin-activo {
  color: #ffc107;
  transform: rotate(-45deg);
}

.tarea-completada {
  opacity: 0.6;
}

.tarea-completada td {
  text-decoration: line-through;
}

.text-muted {
  color: var(--text-secondary);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-secondary);
}

.empty-state i {
  color: var(--border-color);
}

/* Card base */
.card {
  background: white;
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
}

/* Fade-in animation */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal overlay */
/* Modal overlay */
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

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--primary-color);
  color: black;
}

.btn-primary:hover {
  background: #e6c200;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

/* Snackbar */
.snackbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 14px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1100;
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
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.snackbar-close:hover {
  opacity: 1;
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 992px) {
  .tareas-container {
    max-width: 100%;
    padding: 15px;
  }
  
  .stats-panel {
    flex-direction: column;
  }
  
  .stats-container {
    flex-wrap: wrap;
  }
  
  .stat-card {
    min-width: calc(50% - 10px);
  }
  
  .action-card {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .tareas-container {
    padding: 10px;
    gap: 15px;
  }
  
  .stats-container {
    gap: 10px;
  }
  
  .stat-card {
    min-width: 100%;
    padding: 0.5rem 0.8rem;
  }
  
  .table-header {
    padding: 10px 15px;
  }
  
  .table-actions-horizontal {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .btn-refresh,
  .btn-export,
  .btn-toggle-baja {
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .records-per-page {
    width: 100%;
    justify-content: space-between;
  }
  
  .pagination-info {
    width: 100%;
    text-align: center;
  }
  
  .pagination-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .data-table th,
  .data-table td {
    padding: 8px 10px;
    font-size: 0.85rem;
  }
  
  .column-filter {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
}

/* Form control */
.form-control {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.15);
}
</style>
