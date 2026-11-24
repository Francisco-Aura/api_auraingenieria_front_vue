<template>
  <div class="tareas-container fade-in">
    <!-- Loading spinner (solo para vista calendario; la vista tabla usa skeleton) -->
    <Spinner :isLoading="cargando && vistaActual !== 'tabla'" />

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
          <!-- El botón dice lo que hace al pulsarlo (antes decía lo que se veía). Solo en la
               tabla: el calendario enseña todas las tareas y aquí no hacía nada -->
          <button v-if="vistaActual === 'tabla'" class="btn btn-toggle-completed" :class="{ active: mostrarCompletadas }" @click="mostrarCompletadas = !mostrarCompletadas" :aria-pressed="mostrarCompletadas ? 'true' : 'false'" :title="mostrarCompletadas ? 'Volver a las tareas sin completar' : 'Ver solo las tareas completadas'">
            <i :class="mostrarCompletadas ? 'fas fa-tasks' : 'fas fa-check-circle'"></i>
            <span>{{ mostrarCompletadas ? 'Ver pendientes' : 'Ver completadas' }}</span>
          </button>
          <button class="btn btn-create" @click="abrirModalCrearTarea" title="Crear nueva tarea">
            <i class="fas fa-plus-circle"></i>
            <span>Crear tarea</span>
          </button>
        </div>
      </div>

      <div class="table-responsive" v-desborde-tabla>
        <table v-if="vistaActual === 'tabla'" class="data-table data-table--acciones-fijas data-table--compacta">
          <thead>
            <tr>
              <th class="sortable th-col-titulo">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('titulo')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('titulo')" @keydown.space.prevent="sortBy('titulo')">
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
              <th class="sortable th-col-cliente">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('clienteRelacionadoNombre')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('clienteRelacionadoNombre')" @keydown.space.prevent="sortBy('clienteRelacionadoNombre')">
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
              <th class="sortable th-col-asignado">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('usuarioAsignadoNombre')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('usuarioAsignadoNombre')" @keydown.space.prevent="sortBy('usuarioAsignadoNombre')">
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
              <th class="sortable th-col-estado">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('estadoNombre')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('estadoNombre')" @keydown.space.prevent="sortBy('estadoNombre')">
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
              <th class="sortable th-col-prioridad">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('prioridad')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('prioridad')" @keydown.space.prevent="sortBy('prioridad')">
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
              <th class="sortable th-col-categoria">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('categoriaNombre')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('categoriaNombre')" @keydown.space.prevent="sortBy('categoriaNombre')">
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
              <th class="sortable th-col-fecha">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('fechaVencimiento')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('fechaVencimiento')" @keydown.space.prevent="sortBy('fechaVencimiento')">
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
              <th class="sortable th-col-tiempo">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('duracionActivaSegundos')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('duracionActivaSegundos')" @keydown.space.prevent="sortBy('duracionActivaSegundos')">
                    <i class="fas fa-stopwatch mr-2"></i>Tiempo
                    <i :class="getSortIcon('duracionActivaSegundos')"></i>
                  </div>
                </div>
              </th>
              <th class="th-col-acciones">
                <div class="column-header">
                  <div class="column-title column-title--sin-orden">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="cargando">
              <tr v-for="n in 8" :key="'skeleton-' + n" class="skeleton-row">
                <td v-for="col in 9" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>
            <tr v-for="tarea in paginatedTareas" v-show="!cargando" :key="tarea.id" 
                :class="{ 'tarea-vencida': tarea.vencida, 'tarea-completada': tarea.estadoFinal, 'tarea-fijada': tarea.fijada }">
              <td class="text-truncate" :title="tarea.titulo">
                <span class="titulo-container">
                  <button class="btn-pin" @click.stop="toggleFijada(tarea)" :title="tarea.fijada ? 'Quitar fijado' : 'Fijar tarea'">
                    <i class="fas fa-thumbtack" :class="{ 'pin-activo': tarea.fijada }"></i>
                  </button>
                  <span class="titulo-texto">{{ tarea.titulo }}</span>
                </span>
              </td>
              <td class="text-truncate" :title="tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre || '-'">
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
                <span class="estado-badge" :style="{ backgroundColor: tarea.estadoColor, color: colorTextoSobre(tarea.estadoColor) }">
                  <i :class="getEstadoIcon(formatearEstadoNombre(tarea.estadoNombre))"></i>
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
              <td class="celda-tiempo" :class="{ 'celda-tiempo--en-curso': tareaEnCurso(tarea) }"
                  :title="tareaEnCurso(tarea) ? 'Cronómetro en marcha' : 'Tiempo activo acumulado'">
                <span v-if="tareaEnCurso(tarea)" class="tiempo-punto" aria-hidden="true"></span>
                {{ formatearTiempo(segundosTarea(tarea)) }}
              </td>
              <td>
                <div class="action-buttons">
                  <button v-if="puedeCronometrar(tarea)" class="btn-icon btn-cronometro"
                          :class="{ 'btn-cronometro--en-curso': tareaEnCurso(tarea) }"
                          :disabled="cambiandoEstadoTarea"
                          @click="alternarCronometro(tarea)"
                          :title="tareaEnCurso(tarea) ? 'Pausar cronómetro' : 'Iniciar cronómetro'"
                          :aria-label="tareaEnCurso(tarea) ? 'Pausar cronómetro de la tarea' : 'Iniciar cronómetro de la tarea'">
                    <i :class="tareaEnCurso(tarea) ? 'fas fa-pause' : 'fas fa-play'"></i>
                  </button>
                  <button class="btn-icon btn-view" @click="handleVerDetalle(tarea)" title="Ver detalle" aria-label="Ver detalle de tarea">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button v-if="puedeEditarTarea(tarea)" class="btn-icon btn-edit" @click="handleActualizarTarea(tarea)" title="Editar" aria-label="Editar tarea">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button v-if="puedeEliminarTarea(tarea)" class="btn-icon btn-delete" @click="handleEliminarTarea(tarea.id)" title="Eliminar tarea" aria-label="Eliminar tarea">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!cargando && paginatedTareas.length === 0">
              <td colspan="9" class="text-center py-4">
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
          @ver-detalle="handleVerDetalle"
          @nueva-tarea="crearTareaEnFecha"
        />
      </div>

      <!-- Paginación -->
      <div v-if="vistaActual === 'tabla'" class="pagination-controls">
        <div class="records-per-page">
          <label for="recordsPerPage">Registros por página:</label>
          <select v-model.number="tareasPorPagina" id="recordsPerPage" class="form-control">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ tareasFiltradas.length ? paginationStart : 0 }} - {{ paginationEnd }} de {{ tareasFiltradas.length }} registros
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
      :guardando="cambiandoEstadoTarea"
      @actualizar="handleActualizarTarea"
      @cambiar-estado="handleCambiarEstado"
      @completar-con-comentario="handleCompletarConComentario"
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
    <div v-if="snackbar.show" class="snackbar" :class="snackbar.color" role="status">
      <div class="snackbar-content">
        <i :class="getSnackbarIcon(snackbar.color)"></i>
        <span>{{ snackbar.message }}</span>
      </div>
      <button type="button" @click="snackbar.show = false" class="snackbar-close" aria-label="Cerrar aviso">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden'
import { tareasApi } from '@/services/tareasApi'
import TareaDetalleModal from './TareaDetalleModal.vue'
import EstadisticasTareasComponent from './EstadisticasTareasComponent.vue'
import TareaModalCorporativo from './TareaModalCorporativo.vue'
import TareasCalendarioView from './TareasCalendarioView.vue'
import Spinner from '@/components/SpinnerComponent.vue'
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel'
import { fechaLocalISO, fechaES } from '@/utils/fechas'
import { iconoEstadoTarea, nombreEstado, textoPrioridad } from '@/utils/tareas'
import { colorTextoSobre } from '@/utils/colores'

export default {
  name: 'TareasComponent',
  mixins: [ordenTabla],
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
      cargando: false,
      mostrarCompletadas: false,
      
      // Modales
      mostrarModalCrearTarea: false,
      mostrarModalDetalle: false,
      tareaEnEdicion: null,
      tareaDetalle: null,
      // Tarea de la URL que se está pidiendo al servidor (el watch y mounted la piden a la vez)
      detalleEnCamino: null,
      
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

      // Cronómetro de la columna Tiempo: la duración que manda el servidor es la de ese instante;
      // lo que corre desde entonces se suma en pantalla (ahoraMs se actualiza cada segundo solo si hay tareas en curso)
      tareasRecibidasEn: Date.now(),
      ahoraMs: Date.now(),
      temporizadorTiempo: null,
      
      // Snackbar
      snackbar: {
        show: false,
        message: '',
        color: 'success'
      },

      // Vistas
      vistaActual: 'tabla',

      // Estado de guardado
      guardandoTarea: false,
      cambiandoEstadoTarea: false, // Cambio de estado/completado en curso (evita el doble clic)

      // Evita doble carga inicial cuando el watcher inmediato y mounted() coinciden
      promesaInicializacionEnCurso: null
    }
  },
  computed: {
    esAdmin() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario && usuario.nivelAcceso === 1
    },

    sortedTareas() {
      if (!this.sortKey || !this.sortOrder) return this.tareasFiltradas
      
      const signo = this.sortOrder === 'asc' ? 1 : -1
      return [...this.tareasFiltradas]
        .sort((a, b) => compararValores(a[this.sortKey], b[this.sortKey]) * signo)
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
    }
  },
  watch: {
    tareas() {
      this.tareasRecibidasEn = Date.now()
      this.ahoraMs = this.tareasRecibidasEn
    },
    mostrarCompletadas() {
      this.paginaActual = 1
      this.aplicarFiltros()
    },
    totalPages(newVal) {
      // Tras un refresco (guardar/editar/eliminar), si la página actual queda
      // fuera de rango llevamos al usuario a la última página válida en vez
      // de dejarlo viendo una página vacía.
      if (newVal > 0 && this.paginaActual > newVal) {
        this.paginaActual = newVal
      }
    },
    '$route.query.abrirDetalle': {
      immediate: true,
      async handler(tareaId) {
        if (!tareaId) return
        // Esperar a que las tareas estén cargadas
        if (this.tareas.length === 0) {
          await this.inicializar()
        }
        await this.abrirDetalleDesdeRuta(tareaId)
      }
    }
  },
  beforeUnmount() {
    if (this.filtroDebounceTimer) clearTimeout(this.filtroDebounceTimer)
    clearTimeout(this.temporizadorMensaje)
    clearInterval(this.temporizadorTiempo)
  },
  async mounted() {
    this.temporizadorTiempo = setInterval(() => {
      if (this.paginatedTareas.some(t => this.tareaEnCurso(t))) this.ahoraMs = Date.now()
    }, 1000)
    await this.inicializar()
    // Abrir detalle si viene en query params (por si el watch no lo pilló antes de cargar)
    const tareaId = this.$route.query.abrirDetalle
    if (tareaId && !this.mostrarModalDetalle) {
      await this.abrirDetalleDesdeRuta(tareaId)
    }
  },
  methods: {
    colorTextoSobre,

    // ---- Tiempo de las tareas (el estado que «cuenta tiempo» suma a duracionActivaSegundos) ----
    tareaEnCurso(tarea) {
      return this.estados.some(e => e.id === tarea.estadoId && e.cuentaTiempo)
    },

    segundosTarea(tarea) {
      const base = tarea.duracionActivaSegundos || 0
      if (!this.tareaEnCurso(tarea)) return base
      return base + Math.max(0, (this.ahoraMs - this.tareasRecibidasEn) / 1000)
    },

    formatearTiempo(segundos) {
      const s = Math.max(0, Math.floor(segundos))
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      if (s === 0) return '0 min'
      if (s < 60) return '< 1 min'
      return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`
    },

    // El cronómetro lo maneja quien tiene la tarea asignada (o un administrador)
    puedeCronometrar(tarea) {
      if (tarea.estadoFinal) return false
      if (this.esAdmin) return true
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return !!usuario && tarea.usuarioAsignadoId === usuario.id
    },

    // Iniciar pone la tarea «En Progreso» y pausa las demás que esa persona tuviera en marcha;
    // pausar la devuelve al estado de espera.
    async alternarCronometro(tarea) {
      if (this.cambiandoEstadoTarea) return
      const cuenta = this.estados.find(e => e.cuentaTiempo && !e.estadoFinal)
      const espera = this.estados.find(e => !e.cuentaTiempo && !e.estadoBloqueo && !e.estadoFinal)
      if (!cuenta || !espera) {
        this.mostrarMensaje('El módulo de tareas no tiene estados de «en progreso» y de espera', 'warning')
        return
      }
      this.cambiandoEstadoTarea = true
      try {
        if (this.tareaEnCurso(tarea)) {
          await tareasApi.cambiarEstadoTarea(tarea.id, espera.id)
        } else {
          const otras = this.tareas.filter(t => t.id !== tarea.id
            && t.usuarioAsignadoId === tarea.usuarioAsignadoId && this.tareaEnCurso(t))
          for (const otra of otras) await tareasApi.cambiarEstadoTarea(otra.id, espera.id)
          await tareasApi.cambiarEstadoTarea(tarea.id, cuenta.id)
        }
        await this.cargarTareas()
        if (this.$refs.estadisticas) await this.$refs.estadisticas.cargarEstadisticas()
      } catch (error) {
        console.error('Error con el cronómetro de la tarea:', error)
        this.mostrarMensaje('No se pudo cambiar el cronómetro de la tarea', 'error')
      } finally {
        this.cambiandoEstadoTarea = false
      }
    },

    /**
     * Abre el detalle de la tarea indicada en la URL (?abrirDetalle=ID, desde la campana
     * o el aviso de «vence hoy»). Si no está en la lista del usuario (p. ej. le han
     * mencionado en la tarea de otro), se pide aparte.
     */
    async abrirDetalleDesdeRuta(tareaId) {
      // Solo un número de tarea: el valor llega de la URL y va dentro de la ruta de la API
      if (!tareaId || !/^\d+$/.test(String(tareaId))) return
      let tarea = this.tareas.find(t => String(t.id) === String(tareaId))
      if (!tarea) {
        if (this.detalleEnCamino === String(tareaId)) return
        this.detalleEnCamino = String(tareaId)
        try {
          tarea = await tareasApi.obtenerTareaPorId(tareaId)
        } catch (error) {
          console.warn('No se pudo abrir la tarea de la notificación:', error)
          // Se avisa (antes no pasaba nada) y se quita de la URL, como al cerrar el detalle.
          // Una tarea que no existe llega como 400 («Tarea no encontrada») o 404
          this.mostrarMensaje([400, 404].includes(error?.response?.status)
            ? 'La tarea ya no existe: puede que se haya eliminado'
            : 'No se pudo abrir la tarea', 'warning')
          if (String(this.$route.query.abrirDetalle) === String(tareaId)) {
            const query = { ...this.$route.query }
            delete query.abrirDetalle
            this.$router.replace({ query }).catch(() => {})
          }
          return
        } finally {
          this.detalleEnCamino = null
        }
        // Si mientras llegaba se ha navegado a otra cosa, no se abre
        if (String(this.$route.query.abrirDetalle) !== String(tareaId)) return
      }
      if (tarea) {
        this.tareaDetalle = { ...tarea }
        this.mostrarModalDetalle = true
      }
    },

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
      if (this.promesaInicializacionEnCurso) {
        return this.promesaInicializacionEnCurso
      }
      this.promesaInicializacionEnCurso = this._inicializarInterno()
      try {
        return await this.promesaInicializacionEnCurso
      } finally {
        this.promesaInicializacionEnCurso = null
      }
    },

    async _inicializarInterno() {
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
    
    // Aplicar filtros con debounce para mejor rendimiento (llamado desde @input)
    aplicarFiltrosDebounced() {
      // Limpiar timer anterior
      if (this.filtroDebounceTimer) {
        clearTimeout(this.filtroDebounceTimer)
      }
      // Ejecutar filtros después de 150ms sin escribir
      this.filtroDebounceTimer = setTimeout(() => {
        this.paginaActual = 1
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
    },
    
    async exportarExcel() {
      try {
        const ExcelJS = await cargarExcelJS()
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
        
        // Añadir datos, en el orden en que se ven en pantalla
        this.sortedTareas.forEach(tarea => {
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
        
        await descargarLibroExcel(workbook, `Tareas_${fechaLocalISO()}.xlsx`)

        this.mostrarMensaje('Archivo exportado exitosamente', 'success')
      } catch (error) {
        console.error('Error exportando a Excel:', error)
        this.mostrarMensaje('Error al exportar', 'error')
      }
    },
    
    async handleGuardarTarea(tarea, archivos = []) {
      this.guardandoTarea = true
      // Si fallan los adjuntos, ese aviso es el que se queda (antes lo tapaba el de éxito)
      let avisoAdjuntos = null
      try {
        if (tarea.id) {
          await tareasApi.actualizarTarea(tarea.id, tarea)

          // En edición también permitir adjuntar nuevos archivos directos
          if (archivos && archivos.length > 0) {
            try {
              await tareasApi.subirAdjuntosTarea(tarea.id, archivos)
            } catch (e) {
              console.error('Error subiendo adjuntos en edición:', e)
              avisoAdjuntos = 'Tarea actualizada, pero hubo un error al subir algunos adjuntos'
            }
          }

          if (avisoAdjuntos) this.mostrarMensaje(avisoAdjuntos, 'warning')
          else this.mostrarMensaje('Tarea actualizada correctamente', 'success')
        } else {
          const nueva = await tareasApi.crearTarea(tarea)
          
          // Subir adjuntos directos si los hay
          if (archivos && archivos.length > 0) {
            try {
              await tareasApi.subirAdjuntosTarea(nueva.id, archivos)
            } catch (e) {
              console.error('Error subiendo adjuntos:', e)
              avisoAdjuntos = 'Tarea creada, pero hubo un error al subir algunos adjuntos'
            }
          }

          if (avisoAdjuntos) this.mostrarMensaje(avisoAdjuntos, 'warning')
          else this.mostrarMensaje('Tarea creada correctamente', 'success')

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

        // Editada desde su detalle: el detalle que sigue abierto debajo enseña ya los
        // datos nuevos (antes, los de antes de editar)
        if (tarea.id && this.mostrarModalDetalle && this.tareaDetalle?.id === tarea.id) {
          const recargada = this.tareas.find(t => t.id === tarea.id)
            || await tareasApi.obtenerTareaPorId(tarea.id).catch(() => null)
          if (recargada) this.tareaDetalle = { ...recargada }
        }
        
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
    
    async handleCambiarEstado(tareaId, estadoId, motivoBloqueo = null, comentario = null) {
      if (this.cambiandoEstadoTarea) return
      this.cambiandoEstadoTarea = true
      try {
        await tareasApi.cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo)
        // El comentario del cambio, solo si el cambio se ha hecho
        const comentarioGuardado = await this.guardarComentarioDeEstado(tareaId, comentario)
        if (comentarioGuardado) this.mostrarMensaje('Estado actualizado correctamente', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.cerrarModalDetalle()
      } catch (error) {
        console.error('Error cambiando estado:', error)
        this.mostrarMensaje('Error al cambiar el estado', 'error')
      } finally {
        this.cambiandoEstadoTarea = false
      }
    },

    async handleCompletarConComentario(data) {
      if (this.cambiandoEstadoTarea) return
      this.cambiandoEstadoTarea = true
      try {
        // Primero se completa y después se guarda el comentario: si falla el cambio no
        // queda un comentario suelto que se duplica al reintentar
        await tareasApi.cambiarEstadoTarea(data.tareaId, data.estadoId)
        const comentarioGuardado = await this.guardarComentarioDeEstado(data.tareaId, data.comentario?.contenido)
        
        if (comentarioGuardado) this.mostrarMensaje('Tarea marcada como completada', 'success')
        await this.cargarTareas()
        
        // Actualizar estadísticas
        if (this.$refs.estadisticas) {
          await this.$refs.estadisticas.cargarEstadisticas()
        }
        
        this.cerrarModalDetalle()
      } catch (error) {
        console.error('Error completando tarea:', error)
        this.mostrarMensaje('Error al completar la tarea', 'error')
      } finally {
        this.cambiandoEstadoTarea = false
      }
    },

    /** Guarda el comentario de un cambio de estado ya hecho; devuelve si se guardó (o no había). */
    async guardarComentarioDeEstado(tareaId, texto) {
      if (!texto || !texto.trim()) return true
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        await tareasApi.crearComentario({ tareaId, usuarioId: usuario.id, comentario: texto.trim() })
        return true
      } catch (error) {
        console.error('Error creando comentario de estado:', error)
        this.mostrarMensaje('El estado se ha cambiado, pero no se pudo guardar el comentario', 'warning')
        return false
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
        confirmButtonColor: '#d33',
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
      // Si se abrió desde la campana (?abrirDetalle=ID), se quita de la URL: si no,
      // volver a pulsar la misma tarea no hacía nada y F5 la reabría
      if (this.$route.query.abrirDetalle) {
        const query = { ...this.$route.query }
        delete query.abrirDetalle
        this.$router.replace({ query }).catch(() => {})
      }
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
      return fechaES(fecha)
    },

    getPrioridadTexto(prioridad) {
      return textoPrioridad(prioridad)
    },

    // Solo para mostrar: «EN_PROGRESO» -> «En Progreso» (igual que en el detalle de la tarea)
    formatearEstadoNombre(nombre) {
      return nombreEstado(nombre)
    },

    getEstadoIcon(estadoNombre) {
      return iconoEstadoTarea(estadoNombre)
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
      
      // El temporizador de un mensaje anterior no puede ocultar este antes de tiempo
      clearTimeout(this.temporizadorMensaje)
      this.temporizadorMensaje = setTimeout(() => {
        this.snackbar.show = false
      }, 3000)
    }
  }
}
</script>

<style scoped src="./TareasComponent.css"></style>
