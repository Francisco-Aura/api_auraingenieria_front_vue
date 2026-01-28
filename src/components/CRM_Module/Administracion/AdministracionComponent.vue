<template>
  <div class="admin-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="loading" />

    <!-- Panel superior con stats - mantenemos el diseño original -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-database"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalRegistros }}</div>
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
              <span class="records-count">{{ getRegistrosCount(tabla.nombre) }} registros</span>
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
            <button class="btn-back" @click="volverASeleccion" title="Volver a la selección">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="table-icon-large">
              <i :class="tablaSeleccionada.icono"></i>
            </div>
            <div class="table-details">
              <h2>{{ tablaSeleccionada.nombre }}</h2>
              <p>{{ getDescripcionTabla(tablaSeleccionada.nombre) }}</p>
            </div>
          </div>
          <div class="management-actions">
            <button class="btn btn-excel" @click="exportarExcel" title="Exportar a Excel">
              <i class="fas fa-file-excel"></i>
              <span>Excel</span>
            </button>
            <button class="btn btn-refresh" @click="refreshData" title="Actualizar datos">
              <i class="fas fa-sync-alt"></i>
              <span>Actualizar</span>
            </button>
            <button class="btn btn-primary" @click="nuevoRegistro">
              <i class="fas fa-plus"></i>
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        <!-- Controles de filtrado y paginación -->
        <div class="table-controls">
          <div class="controls-left">
            <div class="search-container-table">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                class="search-input-table"
                placeholder="Filtrar registros..."
                v-model="filterTabla"
              />
            </div>
          </div>
          <div class="controls-right">
            <div class="records-per-page">
              <label>Mostrar:</label>
              <select v-model="recordsPerPage">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>registros</span>
            </div>
          </div>
        </div>

        <!-- Tabla de datos con altura calculada -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="col in columnasVisibles" :key="col" @click="sortBy(col)" class="sortable">
                    {{ formatColumnName(col) }}
                    <i :class="getSortIcon(col)"></i>
                  </th>
                  <th class="actions-header">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fila in paginatedDatos" :key="fila.id" class="table-row">
                  <td v-for="col in columnasVisibles" :key="col" class="data-cell" :title="formatCellValue(fila[col])">
                    <span class="cell-content">{{ formatCellValue(fila[col]) }}</span>
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" @click="editarRegistro(fila)" title="Editar">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-delete" @click="eliminarRegistro(fila.id)" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="paginatedDatos.length === 0">
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

        <!-- Paginación fija en la parte inferior -->
        <div class="pagination-footer">
          <div class="pagination-info">
            Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filteredDatos.length }} registros
          </div>
          <div class="pagination-controls">
            <button 
              class="btn-pagination" 
              :disabled="currentPage === 1"
              @click="currentPage--"
              title="Página anterior"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              class="btn-pagination" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
              title="Página siguiente"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal CORREGIDO para formularios -->
    <div v-if="mostrarFormulario" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <div class="modal-icon">
              <i :class="editando ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            </div>
            <div class="title-text">
              <h2>{{ editando ? 'Editar' : 'Nueva' }} {{ esTablaSubcategorias ? 'Subcategoría' : 'Registro' }}</h2>
              <p>{{ tablaSeleccionada?.nombre }}</p>
            </div>
          </div>
          <button class="btn-close-modal" @click="cerrarFormulario" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="guardarRegistro" class="modal-body">
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
                  :placeholder="`Ingresa ${formatColumnName(col).toLowerCase()}`"
                  :required="col === 'nombre'"
                  type="text"
                />
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
import Spinner from "@/components/SpinnerComponent.vue";
import ExcelJS from 'exceljs';

export default {
  name: 'AdministracionComponent',
  components: {
    Spinner,
  },
  data() {
    return {
      tablas: [
        { nombre: "Comercializadoras", url: `${process.env.VUE_APP_API_URL}/api/comercializadoras`, icono: "fas fa-building" },
        { nombre: "Gestoras", url: `${process.env.VUE_APP_API_URL}/api/gestoras`, icono: "fas fa-briefcase" },
        { nombre: "Métodos de Pago", url: `${process.env.VUE_APP_API_URL}/api/metodos-pago`, icono: "fas fa-credit-card" },
        { nombre: "Niveles de Acceso", url: `${process.env.VUE_APP_API_URL}/api/niveles-acceso`, icono: "fas fa-user-shield" },
        { nombre: "Pago Plazos", url: `${process.env.VUE_APP_API_URL}/api/pagos-plazos`, icono: "fas fa-calendar-check" },
        { nombre: "Productos", url: `${process.env.VUE_APP_API_URL}/api/productos`, icono: "fas fa-box-open" },
        { nombre: "Sectores", url: `${process.env.VUE_APP_API_URL}/api/sectores`, icono: "fas fa-industry" },
        { nombre: "Subtipologías", url: `${process.env.VUE_APP_API_URL}/api/subtipologias`, icono: "fas fa-tags" },
        { nombre: "Tarifas Gas", url: `${process.env.VUE_APP_API_URL}/api/tarifas-gas`, icono: "fas fa-fire" },
        { nombre: "Tarifas Luz", url: `${process.env.VUE_APP_API_URL}/api/tarifas-luz`, icono: "fas fa-bolt" },        { nombre: "Usuarios", url: `${process.env.VUE_APP_API_URL}/api/usuarios`, icono: "fas fa-users" },
        { nombre: "Distribuidoras", url: `${process.env.VUE_APP_API_URL}/api/distribuidoras`, icono: "fas fa-truck-moving" },
        { nombre: "Tipos de Contador", url: `${process.env.VUE_APP_API_URL}/api/tipos-contador`, icono: "fas fa-tachometer-alt" },
        { nombre: "Tipos de Comunicación", url: `${process.env.VUE_APP_API_URL}/api/tipos-comunicacion`, icono: "fas fa-wifi" },
        { nombre: "Propiedades", url: `${process.env.VUE_APP_API_URL}/api/propiedades`, icono: "fas fa-building" },
        { nombre: "APP Monitorización", url: `${process.env.VUE_APP_API_URL}/api/app-monitorizacion`, icono: "fas fa-chart-line" },
        { nombre: "Integración Sistemas FV", url: `${process.env.VUE_APP_API_URL}/api/integracion-sistemas-fv`, icono: "fas fa-solar-panel" },
        // Tablas del Módulo de Tareas
        { nombre: "Tareas - Categorías", url: `${process.env.VUE_APP_API_URL}/api/tarea-categorias`, icono: "fas fa-folder" },
        { nombre: "Tareas - Subcategorías", url: `${process.env.VUE_APP_API_URL}/api/tarea-subcategorias`, icono: "fas fa-folder-open" }
      ],
      tablaSeleccionada: null,
      datos: [],
      columnas: [],
      mostrarFormulario: false,
      registro: {},
      editando: false,
      globalFilter: "",
      filterTabla: "",
      loading: false,
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
      // Para gestión de subcategorías
      categoriasDisponibles: [],
      selectedCategoriaIds: [],
    };
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
      if (!this.filterTabla) return this.datos;
      const filtro = this.filterTabla.toLowerCase();
      return this.datos.filter(fila => {
        return Object.values(fila).some(valor => 
          String(valor).toLowerCase().includes(filtro)
        );
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
      return this.datos.length;
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
        this.currentPage = 1;
        this.filterTabla = "";
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
        "Tareas - Subcategorías": "Subcategorías de tareas"
      };
      return descripciones[nombre] || "Tabla del sistema";
    },
    
    getRegistrosCount(nombreTabla) {
      const counts = {
        "Comercializadoras": 25,
        "Gestoras": 18,
        "Métodos de Pago": 12,
        "Niveles de Acceso": 5,
        "Pago Plazos": 8,
        "Productos": 45,
        "Sectores": 15,
        "Subtipologías": 22,
        "Tarifas Gas": 35,
        "Tarifas Luz": 42,
        "Usuarios": 28,        
        "Distribuidoras": 4,
        "Tipos de Contador": 5,
        "Tipos de Comunicación": 4,
        "Propiedades": 3,
        "APP Monitorización": 8,
        "Integración Sistemas FV": 8,
        // Módulo de Tareas
        "Tareas - Categorías": 4,
        "Tareas - Subcategorías": 36
      };
      return counts[nombreTabla] || 0;
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
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/api/tarea-categorias`);
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar el registro: ' + (error.response?.data?.message || error.message)
        })
      } finally {
        this.loading = false;
      }
    },
    
    async eliminarRegistro(id) {
      if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
        this.loading = true;
        try {
          await axios.delete(`${this.tablaSeleccionada.url}/${id}`);
          alert("Registro eliminado correctamente");
          if (this.tablaSeleccionada) {
            this.seleccionarTabla(this.tablaSeleccionada);
          }
        } catch (error) {
          console.error("Error al eliminar registro", error);
          alert("Error al eliminar el registro");
        } finally {
          this.loading = false;
        }
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
        alert('Error al exportar a Excel');
      }
    }
  },
  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
/* Variables CSS - mantenemos los colores originales */
:root {
  --primary-color: rgba(252, 215, 0);
  --primary-dark: rgba(252, 215, 0);
  --primary-light: rgba(252, 215, 0);
  --surface-color: #f8f9fa;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: #e0e0e0;
  --hover-color: #f5f5f5;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --border-radius: 12px;
  --white: #ffffff;
}

.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  background-color: var(--surface-color);
  gap: 20px;
  overflow: hidden;
}

/* Panel de estadísticas - mantiene el diseño original */
.stats-panel {
  flex-shrink: 0;
}

.stats-container {
  display: flex;
  gap: 20px;
}

.stat-card {
  background-color: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex: 1;
  border: 1px solid var(--border-color);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-right: 16px;
  box-shadow: 0 4px 8px rgba(255, 196, 12, 0.3);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Vista principal */
.main-view {
  flex: 1;
  background: var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Panel de selección de tablas */
.tables-selection-panel {
  padding: 30px;
  height: 100%;
  overflow-y: auto;
}

.selection-header {
  text-align: center;
  margin-bottom: 40px;
}

.header-content h2 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.header-content h2 i {
  color: var(--primary-color);
}

.header-content p {
  margin: 0 0 30px 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Grid de tablas */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.table-card {
  background: var(--white);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-height: 90px;
}

.table-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.table-card:hover::before {
  transform: translateX(0);
}

.table-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 8px 25px rgba(255, 196, 12, 0.2);
  transform: translateY(-5px);
}

.table-card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.table-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 2px 6px rgba(255, 196, 12, 0.2);
  flex-shrink: 0;
}

.table-info h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.table-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.2;
}

.table-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.records-count {
  background: var(--surface-color);
  color: var(--text-secondary);
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-color);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.table-card:hover .action-indicator {
  background: var(--primary-color);
  color: white;
  transform: translateX(3px);
}

.no-tables-found {
  grid-column: 1 / -1;
  text-align: center;
  padding: 30px 10px;
  color: var(--text-secondary);
}

.no-tables-found i {
  color: var(--border-color);
  margin-bottom: 10px;
}

.no-tables-found h3 {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
}

.no-tables-found p {
  margin: 0;
  font-size: 0.9rem;
}

/* Panel de gestión de tabla */
.table-management-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.management-header {
  background: var(--surface-color);
  padding: 25px 30px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.table-info-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-back {
  background: var(--white);
  border: 2px solid var(--border-color);
  color: var(--text-secondary);
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(255, 196, 12, 0.1);
  transform: translateX(-3px);
}

.table-icon-large {
  width: 60px;
  height: 60px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 0 6px 15px rgba(255, 196, 12, 0.3);
}

.table-details h2 {
  margin: 0 0 5px 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.table-details p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.management-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Botones de acción mejorados */
.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: black;
  font-weight: 600;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 196, 12, 0.3);
  
}

.btn-excel {
  background: linear-gradient(135deg, #217346, #1e6b3d);
  color: white;
}

.btn-excel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(33, 115, 70, 0.3);
}

.btn-refresh {
  background: linear-gradient(135deg, #6c757d, #5a6268);
  color: white;
}

.btn-refresh:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(108, 117, 125, 0.3);
}

/* Controles de tabla */
.table-controls {
  background: var(--white);
  padding: 20px 30px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.controls-left {
  flex: 1;
  max-width: 400px;
}

.search-container-table {
  position: relative;
}

.search-input-table {
  width: 100%;
  padding: 12px 20px 12px 45px;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: var(--surface-color);
}

.search-input-table:focus {
  border-color: var(--primary-color);
  background: var(--white);
  box-shadow: 0 0 0 4px rgba(255, 196, 12, 0.1);
  outline: none;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-color);
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.records-per-page label {
  color: var(--text-secondary);
  font-weight: 500;
}

.records-per-page select {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--white);
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  outline: none;
}

.records-per-page span {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Contenedor de tabla */
.table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-responsive {
  flex: 1;
  overflow: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  background: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 18px 20px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.sortable:hover {
  background: var(--border-color);
}

.actions-header {
  width: 120px;
  text-align: center;
}

.data-table td {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-row {
  transition: all 0.2s ease;
}

.table-row:hover {
  background: rgba(255, 196, 12, 0.05);
}

.data-cell {
  max-width: 200px;
}

.cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon.btn-edit {
  color: #2196f3;
}

.btn-icon.btn-edit:hover {
  background: rgba(33,150,243,0.15);
  transform: scale(1.1);
}

.btn-icon.btn-delete {
  color: #f44336;
}

.btn-icon.btn-delete:hover {
  background: rgba(244,67,54,0.15);
  transform: scale(1.1);
}

.empty-state-cell {
  text-align: center;
  padding: 60px 40px;
}

.empty-state {
  color: var(--text-secondary);
}

.empty-state i {
  color: var(--border-color);
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 1rem;
}

/* Paginación */
.pagination-footer {
  background: var(--surface-color);
  padding: 15px 30px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.pagination-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-pagination {
  background: var(--white);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-pagination:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 60px;
  text-align: center;
}

/* Modal CORREGIDO */
.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.75) !important;
  z-index: 9999 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 20px !important;
  box-sizing: border-box !important;
}

.modal-content {
  background-color: #ffffff !important;
  border-radius: 12px !important;
  width: 100% !important;
  max-width: 700px !important;
  max-height: 80vh !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
  overflow: hidden !important;
  border: 1px solid #e0e0e0 !important;
  position: relative !important;
  transform: none !important;
  display: flex !important;
  flex-direction: column !important;
}

.modal-header {
  background-color: #f8f9fa !important;
  padding: 20px 25px !important;
  border-bottom: 1px solid #e0e0e0 !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.modal-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 10px rgba(255, 196, 12, 0.3);
}

.title-text h2 {
  margin: 0 0 5px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-text p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.btn-close-modal {
  background: var(--white);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-modal:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.modal-body {
  padding: 25px !important;
  overflow-y: auto !important;
  max-height: calc(80vh - 140px) !important;
  background-color: #ffffff !important;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.required-asterisk {
  color: #f44336;
  margin-left: 4px;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: var(--white);
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(255, 196, 12, 0.15);
  outline: none;
}

.modal-footer {
  background-color: #f8f9fa !important;
  padding: 15px 25px !important;
  border-top: 1px solid #e0e0e0 !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 10px !important;
}

.btn-cancel {
  background: var(--white);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--border-color);
}

.btn-save {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: black;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 196, 12, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Animaciones */
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 1200px) {
  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 968px) {
  .admin-container {
    padding: 15px;
    gap: 15px;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .management-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .table-controls {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .controls-left {
    max-width: 100%;
  }
  
  .pagination-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .admin-container {
    padding: 10px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .management-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn span {
    display: none;
  }
  
  .modal-content {
    margin: 0;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-body {
    max-height: calc(100vh - 200px);
  }
}

@media (max-width: 900px) {
  .modal-content {
    max-height: 95vh !important;
  }
  .modal-body {
    max-height: 60vh !important;
  }
}

@media (max-width: 600px) {
  .modal-content {
    max-height: 100vh !important;
  }
  .modal-body {
    max-height: 70vh !important;
  }
}

/* Scrollbars personalizados */
.table-responsive::-webkit-scrollbar,
.tables-selection-panel::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-responsive::-webkit-scrollbar-track,
.tables-selection-panel::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track {
  background: var(--surface-color);
}

.table-responsive::-webkit-scrollbar-thumb,
.tables-selection-panel::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.table-responsive::-webkit-scrollbar-thumb:hover,
.tables-selection-panel::-webkit-scrollbar-thumb:hover,
.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Estilos de botones profesionales */
/* Botón Refresh/Actualizar */
.btn-refresh {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
}

.btn-refresh:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15);
}

/* Botón Excel */
.btn-excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
}

.btn-excel:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.15);
}

/* Botón PDF */
.btn-pdf {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
}

.btn-pdf:hover {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.15);
}

/* Botón Toggle Baja (Mostrar/Ocultar dados de baja) */
.btn-toggle-baja {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-toggle-baja:hover {
  background: #e5e7eb;
  color: #1f2937;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Estado Activo (Rojo) para Toggle Baja */
.btn-toggle-baja.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1);
}

.btn-toggle-baja.active:hover {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.15);
}

/* Botón Primary (Crear, Guardar, etc) */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15);
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
  background-color: rgba(33, 150, 243, 0.1);
}

.btn-icon.btn-view {
  color: #43a047;
}

.btn-icon.btn-view:hover {
  background-color: rgba(67, 160, 71, 0.1);
}

.btn-icon.btn-delete {
  color: #dc3545;
}

.btn-icon.btn-delete:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

/* Selector de categorías para subcategorías */
.categorias-selector {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.selector-help {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 5px 0 15px 0;
}

.categorias-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.categoria-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface-color);
  border: 2px solid var(--border-color);
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.categoria-chip:hover {
  border-color: var(--primary-color);
  background: rgba(255, 196, 12, 0.05);
}

.categoria-chip.selected {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  border-color: var(--primary-color);
  color: #000;
  font-weight: 600;
}

.categoria-chip.selected i {
  color: #000;
}

.categoria-chip i {
  font-size: 1rem;
  color: var(--text-secondary);
}

.categoria-codigo {
  font-size: 0.8rem;
  opacity: 0.7;
}

.validation-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 15px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  color: #e65100;
  font-size: 0.85rem;
}

.validation-warning i {
  color: #ff9800;
}

/* Toggle Switch para campo activo */
.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 26px;
  background: #ccc;
  border-radius: 26px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, #4caf50, #43a047);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(24px);
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}
</style>