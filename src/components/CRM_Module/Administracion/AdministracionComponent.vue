<template>
  <div class="admin-container fade-in">

    <!-- Panel superior con stats - mantenemos el diseño original -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-database"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">
              <span v-if="cargandoContadores" class="skeleton-line skeleton-stat-loader"></span>
              <template v-else>{{ totalRegistros }}</template>
            </div>
            <div class="stat-label">Total Registros</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-table"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ tablas.length }}</div>
            <div class="stat-label">Tablas Activas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-cogs"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ tablaSeleccionada ? filteredDatos.length : 0 }}</div>
            <div class="stat-label">Registros Filtrados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista principal adaptativa -->
    <div class="main-view" :class="{ 'table-selected': tablaSeleccionada }">
      
      <!-- Panel de selección de tablas (se oculta cuando hay tabla seleccionada) -->
      <div v-if="!tablaSeleccionada" class="tables-selection-panel">
        <div class="selection-header">
          <div class="header-content">
            <h2><i class="fas fa-database"></i> Gestión de Tablas del Sistema</h2>
            <p>Selecciona una tabla para comenzar a administrar sus datos</p>
          </div>
        </div>

        <div class="tables-grid">
          <div 
            v-for="tabla in tablasFiltradas" 
            :key="tabla.nombre"
            class="table-card"
            @click="seleccionarTabla(tabla)"
          >
            <div class="table-card-header">
              <div class="table-icon-wrapper">
                <i :class="tabla.icono"></i>
              </div>
              <div class="table-info">
                <h3>{{ tabla.nombre }}</h3>
                <p>{{ getDescripcionTabla(tabla.nombre) }}</p>
              </div>
            </div>
            <div class="table-card-footer">
              <span class="records-count">
                <span v-if="cargandoContadores" class="skeleton-line skeleton-count-loader"></span>
                <template v-else>{{ getRegistrosCount(tabla.nombre) }} registros</template>
              </span>
              <div class="action-indicator">
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>

          <div v-if="tablasFiltradas.length === 0" class="no-tables-found">
            <i class="fas fa-search fa-3x"></i>
            <h3>No se encontraron tablas</h3>
            <p>Intenta con un término de búsqueda diferente</p>
          </div>
        </div>
      </div>

      <!-- Panel de gestión de tabla seleccionada -->
      <div v-else class="table-management-panel">
        <!-- Header de la tabla con botón volver -->
        <div class="management-header">
          <div class="table-info-header">
            <button class="btn btn-back" @click="volverASeleccion" title="Volver a la selección">
              <i class="fas fa-arrow-left"></i>
              <span>Volver</span>
            </button>
            <div class="table-icon-large">
              <i :class="tablaSeleccionada.icono"></i>
            </div>
            <div class="table-details">
              <h2>{{ tablaSeleccionada.nombre }}</h2>
              <p>{{ getDescripcionTabla(tablaSeleccionada.nombre) }}</p>
            </div>
          </div>
          <div class="management-actions table-actions">
            <button class="btn btn-refresh" @click="refreshData" title="Actualizar datos">
              <i class="fas fa-sync-alt"></i>
              <span>Actualizar</span>
            </button>
            <button class="btn btn-export btn-excel" @click="exportarExcel" title="Exportar a Excel">
              <i class="fas fa-file-excel"></i>
              <span>Excel</span>
            </button>
            <button class="btn btn-primary" @click="nuevoRegistro">
              <i class="fas fa-plus"></i>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        <!-- Tabla de datos con altura calculada -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="col in columnasVisibles" :key="col" class="sortable">
                    <div class="column-header">
                      <div class="column-title" @click="sortBy(col)">
                        {{ formatColumnName(col) }}
                        <i :class="getSortIcon(col)"></i>
                      </div>
                      <div class="column-filter-container">
                        <input
                          type="text"
                          class="column-filter"
                          v-model="columnFilters[col]"
                          placeholder="Filtrar..."
                          @click.stop
                        >
                      </div>
                    </div>
                  </th>
                  <th class="actions-header">
                    <div class="column-header">
                      <div class="column-title column-title--sin-orden">
                        <i class="fas fa-cogs mr-2"></i>Acciones
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <template v-if="loading">
                  <tr v-for="n in 8" :key="'skeleton-' + n" class="skeleton-row">
                    <td v-for="col in columnasVisibles.length + 1" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
                  </tr>
                </template>
                <tr v-for="fila in paginatedDatos" v-show="!loading" :key="fila.id" class="table-row">
                  <td v-for="col in columnasVisibles" :key="col" class="data-cell" :title="formatCellValue(fila[col])">
                    <span class="cell-content">{{ formatCellValue(fila[col]) }}</span>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" @click="editarRegistro(fila)" title="Editar" aria-label="Editar registro">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-delete" @click="eliminarRegistro(fila.id)" title="Eliminar" aria-label="Eliminar registro">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && paginatedDatos.length === 0">
                  <td :colspan="columnasVisibles.length + 1" class="empty-state-cell">
                    <div class="empty-state">
                      <i class="fas fa-inbox fa-3x"></i>
                      <h3>No hay registros</h3>
                      <p>No se encontraron registros que coincidan con los filtros</p>
                      <button class="btn btn-primary" @click="nuevoRegistro">
                        <i class="fas fa-plus"></i>
                        <span>Crear Primer Registro</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Paginación unificada con el resto de tablas CRM -->
        <div class="pagination-controls">
          <div class="records-per-page">
            <label for="adminRecordsPerPage">Registros por página:</label>
            <select v-model="recordsPerPage" id="adminRecordsPerPage">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div class="pagination-info">
            Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filteredDatos.length }} registros
          </div>
          <div class="pagination-buttons">
            <button class="btn-outline" :disabled="currentPage === 1" @click="currentPage = 1" title="Primera página">
              <i class="fas fa-angle-double-left"></i>
            </button>
            <button class="btn-outline" :disabled="currentPage === 1" @click="currentPage--" title="Página anterior">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
            <button class="btn-outline" :disabled="currentPage === totalPages" @click="currentPage++" title="Página siguiente">
              <i class="fas fa-chevron-right"></i>
            </button>
            <button class="btn-outline" :disabled="currentPage === totalPages" @click="currentPage = totalPages" title="Última página">
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal CORREGIDO para formularios -->
    <div v-if="mostrarFormulario" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-form-title">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-icon">
              <i :class="editando ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            </div>
            <div class="title-text">
              <h2 id="admin-form-title">{{ editando ? 'Editar' : 'Nueva' }} {{ esTablaSubcategorias ? 'Subcategoría' : 'Registro' }}</h2>
              <p>{{ tablaSeleccionada?.nombre }}</p>
            </div>
          </div>
          <button class="close-button" @click="cerrarFormulario" type="button" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="guardarRegistro" class="modal-body" novalidate>
          <div class="form-grid">
            <div v-for="col in columnasFiltradas" :key="col" class="form-group">
              <label :for="col" class="form-label">
                {{ formatColumnName(col) }}
                <span v-if="col === 'nombre'" class="required-asterisk">*</span>
              </label>
              <!-- Campo especial para activo: checkbox -->
              <template v-if="col === 'activo'">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="registro[col]" />
                  <span class="toggle-slider"></span>
                  <span class="toggle-label">{{ registro[col] ? 'Activo' : 'Inactivo' }}</span>
                </label>
              </template>
              <!-- Campos normales -->
              <template v-else>
                <input 
                  :id="col" 
                  v-model="registro[col]" 
                  class="form-input"
                  :class="{ 'input-error': col === 'nombre' && errorNombre }"
                  @input="col === 'nombre' && (errorNombre = '')"
                  :placeholder="`Ingresa ${formatColumnName(col).toLowerCase()}`"
                  :required="col === 'nombre'"
                  type="text"
                />
                <small v-if="col === 'nombre' && errorNombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errorNombre }}</small>
              </template>
            </div>
          </div>
          
          <!-- Selector de categorías para subcategorías -->
          <div v-if="esTablaSubcategorias" class="categorias-selector">
            <label class="form-label">
              Categorías asociadas
              <span class="required-asterisk">*</span>
            </label>
            <p class="selector-help">Selecciona las categorías a las que pertenece esta subcategoría</p>
            <div class="categorias-grid">
              <div 
                v-for="cat in categoriasDisponibles" 
                :key="cat.id"
                class="categoria-chip"
                :class="{ 'selected': isCategoriaSelected(cat.id) }"
                @click="toggleCategoria(cat.id)"
              >
                <i :class="isCategoriaSelected(cat.id) ? 'fas fa-check-circle' : 'far fa-circle'"></i>
                <span>{{ cat.nombre }}</span>
                <span class="categoria-codigo">({{ cat.codigo }})</span>
              </div>
            </div>
            <p v-if="selectedCategoriaIds.length === 0" class="validation-warning">
              <i class="fas fa-exclamation-triangle"></i>
              Debes seleccionar al menos una categoría
            </p>
          </div>
          
          <div class="modal-footer">
            <button type="button" class="btn btn-cancel" @click="cerrarFormulario">
              <i class="fas fa-times"></i>
              <span>Cancelar</span>
            </button>
            <button 
              type="submit" 
              class="btn btn-save" 
              :disabled="loading || (esTablaSubcategorias && selectedCategoriaIds.length === 0)"
            >
              <i class="fas fa-save"></i>
              <span>{{ editando ? 'Actualizar' : 'Guardar' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
import ExcelJS from 'exceljs';

export default {
  name: 'AdministracionComponent',
  data() {
    return {
      tablas: [
        { nombre: "Comercializadoras", url: `${process.env.VUE_APP_API_URL}/comercializadoras`, icono: "fas fa-building" },
        { nombre: "Gestoras", url: `${process.env.VUE_APP_API_URL}/gestoras`, icono: "fas fa-briefcase" },
        { nombre: "Métodos de Pago", url: `${process.env.VUE_APP_API_URL}/metodos-pago`, icono: "fas fa-credit-card" },
        { nombre: "Niveles de Acceso", url: `${process.env.VUE_APP_API_URL}/niveles-acceso`, icono: "fas fa-user-shield" },
        { nombre: "Pago Plazos", url: `${process.env.VUE_APP_API_URL}/pagos-plazos`, icono: "fas fa-calendar-check" },
        { nombre: "Productos", url: `${process.env.VUE_APP_API_URL}/productos`, icono: "fas fa-box-open" },
        { nombre: "Sectores", url: `${process.env.VUE_APP_API_URL}/sectores`, icono: "fas fa-industry" },
        { nombre: "Subtipologías", url: `${process.env.VUE_APP_API_URL}/subtipologias`, icono: "fas fa-tags" },
        { nombre: "Tarifas Gas", url: `${process.env.VUE_APP_API_URL}/tarifas-gas`, icono: "fas fa-fire" },
        { nombre: "Tarifas Luz", url: `${process.env.VUE_APP_API_URL}/tarifas-luz`, icono: "fas fa-bolt" },        { nombre: "Usuarios", url: `${process.env.VUE_APP_API_URL}/usuarios`, icono: "fas fa-users" },
        { nombre: "Distribuidoras", url: `${process.env.VUE_APP_API_URL}/distribuidoras`, icono: "fas fa-truck-moving" },
        { nombre: "Tipos de Contador", url: `${process.env.VUE_APP_API_URL}/tipos-contador`, icono: "fas fa-tachometer-alt" },
        { nombre: "Tipos de Comunicación", url: `${process.env.VUE_APP_API_URL}/tipos-comunicacion`, icono: "fas fa-wifi" },
        { nombre: "Propiedades", url: `${process.env.VUE_APP_API_URL}/propiedades`, icono: "fas fa-building" },
        { nombre: "APP Monitorización", url: `${process.env.VUE_APP_API_URL}/app-monitorizacion`, icono: "fas fa-chart-line" },
        { nombre: "Integración Sistemas FV", url: `${process.env.VUE_APP_API_URL}/integracion-sistemas-fv`, icono: "fas fa-solar-panel" },
        // Tablas del Módulo de Tareas
        { nombre: "Tareas - Categorías", url: `${process.env.VUE_APP_API_URL}/tarea-categorias`, icono: "fas fa-folder" },
        { nombre: "Tareas - Subcategorías", url: `${process.env.VUE_APP_API_URL}/tarea-subcategorias`, icono: "fas fa-folder-open" },
        // Clientes
        { nombre: "Cargos de Contacto", url: `${process.env.VUE_APP_API_URL}/cargos-contacto`, icono: "fas fa-id-badge" }
      ],
      tablaSeleccionada: null,
      datos: [],
      columnas: [],
      mostrarFormulario: false,
      registro: {},
      editando: false,
      globalFilter: "",
      columnFilters: {},
      loading: false,
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
      // Para gestión de subcategorías
      categoriasDisponibles: [],
      selectedCategoriaIds: [],
      errorNombre: '',
      registrosCount: {},
      cargandoContadores: false,
    };
  },
  mounted() {
    this.cargarContadores();
  },
  computed: {
    // Columnas para el formulario (sin id)
    columnasFiltradas() {
      // Excluir id, categoriaIds (interno) y categorias (se muestra aparte en subcategorías)
      const excluidas = ['id', 'categoriaIds', 'categorias'];
      return this.columnas.filter(col => !excluidas.includes(col));
    },
    
    // Columnas visibles en la tabla (sin id ni categoriaIds)
    columnasVisibles() {
      const excluidas = ['id', 'categoriaIds'];
      return this.columnas.filter(col => !excluidas.includes(col));
    },
    
    // Detectar si estamos en la tabla de subcategorías
    esTablaSubcategorias() {
      return this.tablaSeleccionada?.nombre === 'Tareas - Subcategorías';
    },
    
    tablasFiltradas() {
      if (!this.globalFilter) return this.tablas;
      const filtro = this.globalFilter.toLowerCase();
      return this.tablas.filter(tabla => 
        tabla.nombre.toLowerCase().includes(filtro) ||
        this.getDescripcionTabla(tabla.nombre).toLowerCase().includes(filtro)
      );
    },
    
    filteredDatos() {
      const columnasActivas = Object.keys(this.columnFilters).filter(col => (this.columnFilters[col] || '').trim() !== '');
      if (columnasActivas.length === 0) return this.datos;
      return this.datos.filter(fila => {
        return columnasActivas.every(col => {
          const filtro = this.columnFilters[col].toLowerCase().trim();
          const valor = this.formatCellValue(fila[col]);
          return String(valor).toLowerCase().includes(filtro);
        });
      });
    },
    
    sortedDatos() {
      if (!this.sortKey) return this.filteredDatos;
      
      return [...this.filteredDatos].sort((a, b) => {
        let aValue = a[this.sortKey] ?? '';
        let bValue = b[this.sortKey] ?? '';
        
        if (this.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    },
    
    paginatedDatos() {
      const start = (this.currentPage - 1) * this.recordsPerPage;
      const end = start + this.recordsPerPage;
      return this.sortedDatos.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredDatos.length / this.recordsPerPage);
    },
    
    paginationStart() {
      if (this.filteredDatos.length === 0) return 0;
      return (this.currentPage - 1) * this.recordsPerPage + 1;
    },
    
    paginationEnd() {
      const end = this.currentPage * this.recordsPerPage;
      return end > this.filteredDatos.length ? this.filteredDatos.length : end;
    },
    
    totalRegistros() {
      return Object.values(this.registrosCount).reduce((total, n) => total + n, 0);
    }
  },
  methods: {
    async seleccionarTabla(tabla) {
      this.loading = true;
      try {
        const respuesta = await axios.get(tabla.url);
        this.datos = respuesta.data;
        this.columnas = Object.keys(this.datos[0] || {});
        this.tablaSeleccionada = tabla;
        this.registrosCount = { ...this.registrosCount, [tabla.nombre]: this.datos.length };
        this.currentPage = 1;
        this.columnFilters = {};
        this.sortKey = null;
        this.sortOrder = null;
        
        // Si es tabla de subcategorías, cargar las categorías disponibles
        if (tabla.nombre === 'Tareas - Subcategorías') {
          await this.cargarCategoriasDisponibles();
        }
      } catch (error) {
        console.error("Error al cargar datos", error);
        this.datos = [];
        this.columnas = [];
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos de la tabla'
        })
      } finally {
        this.loading = false;
      }
    },

    volverASeleccion() {
      this.tablaSeleccionada = null;
      this.datos = [];
      this.columnas = [];
      this.columnFilters = {};
      this.globalFilter = "";
    },

    getDescripcionTabla(nombre) {
      const descripciones = {
        "Comercializadoras": "Empresas comercializadoras de energía",
        "Gestoras": "Empresas gestoras de servicios",
        "Métodos de Pago": "Formas de pago disponibles",
        "Niveles de Acceso": "Niveles de permisos del sistema",
        "Pago Plazos": "Opciones de pago a plazos",
        "Productos": "Productos y servicios ofertados",
        "Sectores": "Sectores de actividad",
        "Subtipologías": "Clasificaciones de clientes",
        "Tarifas Gas": "Tarifas de gas natural",
        "Tarifas Luz": "Tarifas de energía eléctrica",
        "Usuarios": "Usuarios del sistema",        "Distribuidoras": "Empresas distribuidoras de energía",
        "Tipos de Contador": "Clasificación de tipos de contador",
        "Tipos de Comunicación": "Tipos de comunicación de contadores",
        "Propiedades": "Propiedad de equipos (Distribuidora, Cliente, Aura)",
        "APP Monitorización": "Aplicaciones de monitorización de instalaciones",
        "Integración Sistemas FV": "Sistemas de integración fotovoltaica",
        // Módulo de Tareas
        "Tareas - Categorías": "Categorías para clasificar tareas",
        "Tareas - Subcategorías": "Subcategorías de tareas",
        // Clientes
        "Cargos de Contacto": "Cargos o puestos de los contactos de clientes"
      };
      return descripciones[nombre] || "Tabla del sistema";
    },
    
    async cargarContadores() {
      this.cargandoContadores = true;
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/tablas/contadores`);
        this.registrosCount = { ...resp.data };
      } catch (error) {
        console.error('Error al cargar contadores:', error);
        this.registrosCount = {};
      } finally {
        this.cargandoContadores = false;
      }
    },

    getRegistrosCount(nombreTabla) {
      return this.registrosCount[nombreTabla] ?? 0;
    },
    
    formatColumnName(col) {
      return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    
    formatCellValue(value) {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 50) + '...';
      }
      return value;
    },
    
    nuevoRegistro() {
      this.registro = {};
      this.selectedCategoriaIds = [];
      this.editando = false;
      this.mostrarFormulario = true;
    },
    
    editarRegistro(fila) {
      this.registro = { ...fila };
      // Si es subcategoría, cargar las categorías seleccionadas
      if (this.esTablaSubcategorias && fila.categoriaIds) {
        this.selectedCategoriaIds = [...fila.categoriaIds];
      } else {
        this.selectedCategoriaIds = [];
      }
      this.editando = true;
      this.mostrarFormulario = true;
    },
    
    // Cargar categorías disponibles para el selector
    async cargarCategoriasDisponibles() {
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/tarea-categorias`);
        this.categoriasDisponibles = resp.data.filter(c => c.activo !== false);
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        this.categoriasDisponibles = [];
      }
    },
    
    // Toggle selección de categoría
    toggleCategoria(categoriaId) {
      const index = this.selectedCategoriaIds.indexOf(categoriaId);
      if (index === -1) {
        this.selectedCategoriaIds.push(categoriaId);
      } else {
        this.selectedCategoriaIds.splice(index, 1);
      }
    },
    
    // Verificar si una categoría está seleccionada
    isCategoriaSelected(categoriaId) {
      return this.selectedCategoriaIds.includes(categoriaId);
    },
    
    cerrarModalClick(event) {
      // Solo cerrar si se hace click en el overlay, no en el contenido del modal
      if (event.target === event.currentTarget) {
        this.cerrarFormulario();
      }
    },
    
    async guardarRegistro() {
      this.errorNombre = '';
      if (!this.registro.nombre || !String(this.registro.nombre).trim()) {
        this.errorNombre = 'El nombre es obligatorio';
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo obligatorio',
          text: 'El campo Nombre es obligatorio'
        });
        return;
      }
      this.loading = true;
      try {
        // Preparar datos a enviar
        const datosEnviar = { ...this.registro };
        
        // Si es subcategoría, incluir las categorías seleccionadas
        if (this.esTablaSubcategorias) {
          datosEnviar.categoriaIds = this.selectedCategoriaIds;
        }
        
        if (this.editando) {
          await axios.put(`${this.tablaSeleccionada.url}/${this.registro.id}`, datosEnviar);
          this.$swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Registro actualizado correctamente'
          })
        } else {
          await axios.post(this.tablaSeleccionada.url, datosEnviar);
          this.$swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Registro creado correctamente'
          })
        }
        this.mostrarFormulario = false;
        if (this.tablaSeleccionada) {
          this.seleccionarTabla(this.tablaSeleccionada);
        }
      } catch (error) {
        console.error("Error al guardar registro", error);
        const mensajeError = error.response?.data?.message
          || error.response?.data?.error
          || error.response?.data
          || error.message
          || 'Error desconocido al guardar';
        this.$swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: `No se pudo guardar el registro: ${mensajeError}`
        })
      } finally {
        this.loading = false;
      }
    },
    
    async eliminarRegistro(id) {
      const confirmacion = await this.$swal.fire({
        icon: 'warning',
        title: '¿Eliminar registro?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });

      if (!confirmacion.isConfirmed) return;

      this.loading = true;
      try {
        await axios.delete(`${this.tablaSeleccionada.url}/${id}`);
        await this.$swal.fire({
          icon: 'success',
          title: 'Registro eliminado',
          timer: 1400,
          showConfirmButton: false,
        });
        if (this.tablaSeleccionada) {
          this.seleccionarTabla(this.tablaSeleccionada);
        }
      } catch (error) {
        console.error("Error al eliminar registro", error);
        await this.$swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se pudo eliminar el registro.',
        });
      } finally {
        this.loading = false;
      }
    },
    
    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.registro = {};
      this.editando = false;
    },
    
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    
    getSortIcon(key) {
      if (this.sortKey !== key) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },
    
    refreshData() {
      if (this.tablaSeleccionada) {
        this.seleccionarTabla(this.tablaSeleccionada);
      }
    },
    
    async exportarExcel() {
      try {
          const data = this.filteredDatos.map(fila => {
          const row = {};
          this.columnas.forEach(col => {
            row[this.formatColumnName(col)] = this.formatCellValue(fila[col]);
          });
          return row;
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(this.tablaSeleccionada.nombre);

        // Obtener las columnas de los datos
        const columnas = data.length > 0 ? Object.keys(data[0]) : [];
        
        // Configurar columnas con anchos
        worksheet.columns = columnas.map(col => ({
          header: col,
          key: col,
          width: 20
        }));

        // Añadir datos
        worksheet.addRows(data);

        // Estilizar encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.tablaSeleccionada.nombre}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al exportar',
          text: 'No se pudo exportar a Excel.',
        });
      }
    }
  },
  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    },
    columnFilters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    }
  }
};
</script>

<style scoped src="./AdministracionComponent.css"></style>