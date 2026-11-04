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
          <!-- Configuración MCAS (comisiones automáticas): se abre desde aquí, ya no desde el menú -->
          <div
            v-if="mostrarTarjetaMcas"
            class="table-card table-card--modulo"
            role="button"
            tabindex="0"
            @click="abrirConfiguracionMcas"
            @keydown.enter.self.prevent="abrirConfiguracionMcas"
            @keydown.space.self.prevent="abrirConfiguracionMcas"
          >
            <div class="table-card-header">
              <div class="table-icon-wrapper">
                <i class="fas fa-sliders-h"></i>
              </div>
              <div class="table-info">
                <h3>Configuración MCAS</h3>
                <p>{{ descripcionMcas }}</p>
              </div>
            </div>
            <div class="table-card-footer">
              <span class="records-count">Comisiones automáticas</span>
              <div class="action-indicator">
                <i class="fas fa-arrow-right"></i>
              </div>
            </div>
          </div>

          <div 
            v-for="tabla in tablasFiltradas" 
            :key="tabla.nombre"
            class="table-card"
            :class="{ 'table-card--cargando': tablaPendiente === tabla.nombre }"
            role="button"
            tabindex="0"
            :aria-busy="tablaPendiente === tabla.nombre ? 'true' : 'false'"
            @click="seleccionarTabla(tabla)"
            @keydown.enter.self.prevent="seleccionarTabla(tabla)"
            @keydown.space.self.prevent="seleccionarTabla(tabla)"
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
                <!-- Mientras llegan sus datos (la tabla se abre al tenerlos) -->
                <i :class="tablaPendiente === tabla.nombre ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-right'"></i>
              </div>
            </div>
          </div>

          <div v-if="tablasFiltradas.length === 0 && !mostrarTarjetaMcas" class="no-tables-found">
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
            <button v-if="!tablaSoloLectura" class="btn btn-primary" @click="nuevoRegistro">
              <i class="fas fa-plus"></i>
              <span>Nuevo registro</span>
            </button>
          </div>
        </div>

        <p v-if="tablaSoloLectura" class="aviso-solo-lectura">
          <i class="fas fa-lock"></i>
          Tabla de solo consulta: sus valores son fijos y no se pueden crear, modificar ni eliminar desde aquí.
        </p>

        <!-- Tabla de datos con altura calculada -->
        <!-- Compacta (como Puntos de Suministro): cabe entera desde 1280 px; si aun así no
             cabe, v-desborde-tabla deja fija la columna de acciones (no hay en las de consulta) -->
        <div class="table-container">
          <div class="table-responsive" v-desborde-tabla>
            <table class="data-table data-table--compacta" :class="{ 'data-table--acciones-fijas': !tablaSoloLectura }">
              <thead>
                <tr>
                  <th v-for="col in columnasVisibles" :key="col" class="sortable">
                    <div class="column-header">
                      <div class="column-title" @click="sortBy(col)" tabindex="0" role="button" @keydown.enter.prevent="sortBy(col)" @keydown.space.prevent="sortBy(col)">
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
                  <th v-if="!tablaSoloLectura" class="actions-header">
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
                    <td v-for="col in columnasVisibles.length + (tablaSoloLectura ? 0 : 1)" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
                  </tr>
                </template>
                <tr v-for="fila in paginatedDatos" v-show="!loading" :key="fila.id" class="table-row">
                  <td v-for="col in columnasVisibles" :key="col" class="data-cell" :title="valorExportable(fila[col])">
                    <span class="cell-content">{{ formatCellValue(fila[col]) }}</span>
                  </td>
                  <td v-if="!tablaSoloLectura" class="actions-cell">
                    <div class="action-buttons">
                      <button class="btn-icon btn-edit" @click="editarRegistro(fila)" title="Editar" aria-label="Editar registro">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="btn-icon btn-delete" @click="eliminarRegistro(fila.id, fila)" title="Eliminar" aria-label="Eliminar registro">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loading && paginatedDatos.length === 0">
                  <td :colspan="columnasVisibles.length + (tablaSoloLectura ? 0 : 1)" class="empty-state-cell">
                    <div class="empty-state">
                      <i class="fas fa-inbox fa-3x"></i>
                      <h3>No hay registros</h3>
                      <p v-if="hayFiltrosColumna">No se encontraron registros que coincidan con los filtros</p>
                      <p v-else>Esta tabla todavía no tiene registros</p>
                      <button v-if="!tablaSoloLectura" class="btn btn-primary" @click="nuevoRegistro">
                        <i class="fas fa-plus"></i>
                        <span>Crear primer registro</span>
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
            <select v-model.number="recordsPerPage" id="adminRecordsPerPage">
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
      <div ref="modalFormulario" class="modal-content" @click.stop>
        <div class="modal-header aura-modal-header">
          <div class="modal-title">
            <div class="modal-icon">
              <i :class="editando ? 'fas fa-edit' : 'fas fa-plus-circle'"></i>
            </div>
            <div class="title-text">
              <h2 id="admin-form-title">{{ tituloFormulario }}</h2>
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
                <span v-if="col === campoObligatorio" class="required-asterisk">*</span>
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
                  :class="{ 'input-error': col === campoObligatorio && errorNombre }"
                  @input="col === campoObligatorio && (errorNombre = '')"
                  :placeholder="`Ingresa ${formatColumnName(col).toLowerCase()}`"
                  :required="col === campoObligatorio"
                  type="text"
                />
                <small v-if="col === campoObligatorio && errorNombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errorNombre }}</small>
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
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden';
import axios from 'axios';
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel';

// Contraseña de Usuarios: el servidor solo la devuelve a administradores (la guarda
// cifrada); al editar, dejarla en blanco significa «no cambiarla».
const CAMPO_PASS = 'pass';

// Cabeceras legibles de las columnas que vienen del JSON sin tilde o en camelCase
const NOMBRES_COLUMNAS = {
  telefono: 'Teléfono',
  nivelAcceso: 'Nivel de acceso',
  descripcion: 'Descripción',
  codigo: 'Código',
  pass: 'Contraseña',
  user: 'Usuario',
  numeroCuotas: 'Número de cuotas',
  categorias: 'Categorías',
};

const DESCRIPCION_MCAS = 'Tablas de comisiones, reglas, productos, retrocesiones e interruptores de las comisiones automáticas';

export default {
  name: 'AdministracionComponent',
  mixins: [ordenTabla],
  data() {
    return {
      // campos: los de la tabla en el servidor (para el formulario cuando la tabla está vacía).
      // soloLectura: el servidor solo permite consultarlas (catálogos fijos).
      tablas: [
        { nombre: "Comercializadoras", url: `${process.env.VUE_APP_API_URL}/comercializadoras`, icono: "fas fa-building", campos: ['nombre', 'descripcion'] },
        { nombre: "Gestoras", url: `${process.env.VUE_APP_API_URL}/gestoras`, icono: "fas fa-briefcase", campos: ['nombre', 'descripcion'] },
        { nombre: "Métodos de Pago", url: `${process.env.VUE_APP_API_URL}/metodos-pago`, icono: "fas fa-credit-card", campos: ['nombre'] },
        { nombre: "Niveles de Acceso", url: `${process.env.VUE_APP_API_URL}/niveles-acceso`, icono: "fas fa-user-shield", campos: ['nivel', 'descripcion'] },
        { nombre: "Pago Plazos", url: `${process.env.VUE_APP_API_URL}/pagos-plazos`, icono: "fas fa-calendar-check", campos: ['nombre', 'descripcion', 'numeroCuotas'] },
        { nombre: "Productos", url: `${process.env.VUE_APP_API_URL}/productos`, icono: "fas fa-box-open", campos: ['nombre', 'descripcion'] },
        { nombre: "Sectores", url: `${process.env.VUE_APP_API_URL}/sectores`, icono: "fas fa-industry", campos: ['nombre', 'descripcion'] },
        { nombre: "Subtipologías", url: `${process.env.VUE_APP_API_URL}/subtipologias`, icono: "fas fa-tags", campos: ['nombre', 'descripcion'] },
        { nombre: "Tarifas Gas", url: `${process.env.VUE_APP_API_URL}/tarifas-gas`, icono: "fas fa-fire", campos: ['nombre', 'descripcion'] },
        { nombre: "Tarifas Luz", url: `${process.env.VUE_APP_API_URL}/tarifas-luz`, icono: "fas fa-bolt", campos: ['nombre', 'descripcion'] },
        { nombre: "Usuarios", url: `${process.env.VUE_APP_API_URL}/usuarios`, icono: "fas fa-users", campos: ['nombre', 'email', 'telefono', 'user', 'pass', 'nivelAcceso'] },
        { nombre: "Distribuidoras", url: `${process.env.VUE_APP_API_URL}/distribuidoras`, icono: "fas fa-truck-moving", campos: ['nombre'], soloLectura: true },
        { nombre: "Tipos de Contador", url: `${process.env.VUE_APP_API_URL}/tipos-contador`, icono: "fas fa-tachometer-alt", campos: ['descripcion'], soloLectura: true },
        { nombre: "Tipos de Comunicación", url: `${process.env.VUE_APP_API_URL}/tipos-comunicacion`, icono: "fas fa-wifi", campos: ['nombre'], soloLectura: true },
        { nombre: "Propiedades", url: `${process.env.VUE_APP_API_URL}/propiedades`, icono: "fas fa-building", campos: ['nombre'], soloLectura: true },
        { nombre: "APP Monitorización", url: `${process.env.VUE_APP_API_URL}/app-monitorizacion`, icono: "fas fa-chart-line", campos: ['nombre', 'descripcion'] },
        { nombre: "Integración Sistemas FV", url: `${process.env.VUE_APP_API_URL}/integracion-sistemas-fv`, icono: "fas fa-solar-panel", campos: ['nombre', 'descripcion'] },
        // Tablas del Módulo de Tareas
        { nombre: "Tareas - Categorías", url: `${process.env.VUE_APP_API_URL}/tarea-categorias`, icono: "fas fa-folder", campos: ['nombre', 'codigo', 'descripcion', 'activo'] },
        { nombre: "Tareas - Subcategorías", url: `${process.env.VUE_APP_API_URL}/tarea-subcategorias`, icono: "fas fa-folder-open", campos: ['nombre', 'codigo', 'activo', 'categorias', 'categoriaIds'] },
        // Clientes
        { nombre: "Cargos de Contacto", url: `${process.env.VUE_APP_API_URL}/cargos-contacto`, icono: "fas fa-id-badge", campos: ['nombre'] }
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
      tablaPendiente: null, // Tarjeta pulsada cuyos datos aún no han llegado (su flecha gira)
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
      const campos = this.columnas.filter(col => !excluidas.includes(col));
      // Si ningún registro trae la contraseña, el campo se toma de la definición de la tabla
      if (this.tablaSeleccionada?.campos?.includes(CAMPO_PASS) && !campos.includes(CAMPO_PASS)) {
        campos.push(CAMPO_PASS);
      }
      return campos;
    },
    
    // Columnas visibles en la tabla (sin id ni categoriaIds)
    columnasVisibles() {
      const excluidas = ['id', 'categoriaIds'];
      return this.columnas.filter(col => !excluidas.includes(col));
    },
    
    // Título del formulario: «Nuevo registro», «Nueva subcategoría», «Editar registro»...
    tituloFormulario() {
      const objeto = this.esTablaSubcategorias ? 'subcategoría' : 'registro';
      if (this.editando) return `Editar ${objeto}`;
      return `${this.esTablaSubcategorias ? 'Nueva' : 'Nuevo'} ${objeto}`;
    },

    // Hay algún filtro de columna escrito (para el texto de la tabla vacía)
    hayFiltrosColumna() {
      return Object.values(this.columnFilters).some(v => String(v ?? '').trim() !== '');
    },

    // Detectar si estamos en la tabla de subcategorías
    esTablaSubcategorias() {
      return this.tablaSeleccionada?.nombre === 'Tareas - Subcategorías';
    },

    // Catálogos fijos: el servidor solo permite consultarlos
    tablaSoloLectura() {
      return this.tablaSeleccionada?.soloLectura === true;
    },

    // Campo que identifica el registro y es obligatorio (en Niveles de Acceso es «nivel»)
    campoObligatorio() {
      const campos = this.columnasFiltradas;
      if (campos.includes('nombre')) return 'nombre';
      if (campos.includes('nivel')) return 'nivel';
      return campos[0] || 'nombre';
    },
    
    descripcionMcas() {
      return DESCRIPCION_MCAS;
    },

    // Sin búsqueda, o si lo buscado está en su nombre o en su descripción
    mostrarTarjetaMcas() {
      if (!this.globalFilter) return true;
      const filtro = this.globalFilter.toLowerCase();
      return `configuración mcas ${DESCRIPCION_MCAS}`.toLowerCase().includes(filtro);
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
      
      const signo = this.sortOrder === 'asc' ? 1 : -1;
      return [...this.filteredDatos]
        .sort((a, b) => compararValores(a[this.sortKey], b[this.sortKey]) * signo);
    },
    
    paginatedDatos() {
      const start = (this.currentPage - 1) * this.recordsPerPage;
      const end = start + this.recordsPerPage;
      return this.sortedDatos.slice(start, end);
    },
    
    totalPages() {
      // Mínimo 1: con la tabla vacía se lee «Página 1 de 1», como en el resto de pantallas
      return Math.max(1, Math.ceil(this.filteredDatos.length / this.recordsPerPage));
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
    abrirConfiguracionMcas() {
      this.$router.push('/dashboard/mcas');
    },

    async seleccionarTabla(tabla) {
      // Si es la misma tabla que ya estaba seleccionada (p.ej. un refresco tras
      // guardar/eliminar un registro o pulsar "Actualizar"), no reseteamos la
      // página ni los filtros: solo se recargan los datos.
      const esMismaTabla = this.tablaSeleccionada && tabla &&
        this.tablaSeleccionada.nombre === tabla.nombre;
      // Si se pulsa otra tabla (o «Volver») antes de que llegue la respuesta, se descarta
      const peticion = this.peticionTablaId = (this.peticionTablaId || 0) + 1;
      this.loading = true;
      this.tablaPendiente = tabla.nombre;
      try {
        const respuesta = await axios.get(tabla.url);
        if (peticion !== this.peticionTablaId) return;
        this.datos = respuesta.data;
        // Sin registros no hay de dónde leer los campos: se usan los de la tabla
        this.columnas = this.datos.length ? Object.keys(this.datos[0]) : [...(tabla.campos || [])];
        this.tablaSeleccionada = tabla;
        this.registrosCount = { ...this.registrosCount, [tabla.nombre]: this.datos.length };
        if (!esMismaTabla) {
          this.currentPage = 1;
          this.columnFilters = {};
          this.sortKey = null;
          this.sortOrder = null;
        }
        
        // Si es tabla de subcategorías, cargar las categorías disponibles
        if (tabla.nombre === 'Tareas - Subcategorías') {
          await this.cargarCategoriasDisponibles();
        }
      } catch (error) {
        if (peticion !== this.peticionTablaId) return;
        console.error("Error al cargar datos", error);
        this.datos = [];
        this.columnas = [];
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los datos de la tabla'
        })
      } finally {
        if (peticion === this.peticionTablaId) {
          this.loading = false;
          this.tablaPendiente = null;
        }
      }
    },

    volverASeleccion() {
      this.peticionTablaId = (this.peticionTablaId || 0) + 1;
      this.loading = false;
      this.tablaPendiente = null;
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
      // Nombres con tilde o de varias palabras; el resto, como antes (primera letra en mayúscula)
      if (NOMBRES_COLUMNAS[col]) return NOMBRES_COLUMNAS[col];
      return this.nombreColumnaExcel(col);
    },

    // Cabeceras del Excel exactamente como antes («Telefono», «NivelAcceso», «Pass»...):
    // si alguien procesa esos ficheros por el nombre de la columna, sigue funcionando
    nombreColumnaExcel(col) {
      return col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    
    formatCellValue(value) {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      // Listas (p. ej. las categorías de una subcategoría): sus nombres, no el JSON
      if (Array.isArray(value)) value = this.textoLista(value) || '-';
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 50) + '...';
      }
      return value;
    },

    // Valor para el Excel: como en la tabla, pero sin recortar
    valorExportable(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (Array.isArray(value)) return this.textoLista(value);
      return value;
    },

    textoLista(lista) {
      return lista.map(v => (v && typeof v === 'object') ? (v.nombre ?? v.codigo ?? v.id) : v).join(', ');
    },
    
    nuevoRegistro() {
      // Las tablas con «activo» crean el registro activo (lo hace el servidor si no llega):
      // el interruptor tiene que enseñarlo así, no como «Inactivo»
      this.registro = this.tablaSeleccionada?.campos?.includes('activo') ? { activo: true } : {};
      this.selectedCategoriaIds = [];
      this.editando = false;
      this.abrirFormulario();
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
      this.abrirFormulario();
    },

    // Abre el modal sin el error del formulario anterior y con el cursor en el primer campo
    abrirFormulario() {
      this.errorNombre = '';
      this.mostrarFormulario = true;
      this.$nextTick(() => this.$refs.modalFormulario?.querySelector('.form-input, .toggle-switch input')?.focus());
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
    
    async guardarRegistro() {
      this.errorNombre = '';
      const campo = this.campoObligatorio;
      const valor = this.registro[campo];
      if (valor === undefined || valor === null || !String(valor).trim()) {
        // El error se ve bajo el campo (sin además un aviso emergente) y el cursor va a él
        this.errorNombre = `${this.formatColumnName(campo)} es obligatorio`;
        this.$nextTick(() => this.$refs.modalFormulario?.querySelector('.form-input.input-error')?.focus());
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

        // Contraseña en blanco al editar: el servidor conserva la actual
        if (this.editando && CAMPO_PASS in datosEnviar && !String(datosEnviar[CAMPO_PASS] ?? '').trim()) {
          delete datosEnviar[CAMPO_PASS];
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
        // Sin el error entero: lleva el cuerpo enviado (en Usuarios, la contraseña)
        console.error("Error al guardar registro", error?.response?.status, error?.message);
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
    
    async eliminarRegistro(id, fila = null) {
      // El aviso dice qué registro se borra y el botón es rojo, como el resto de borrados
      const nombre = this.nombreRegistro(fila);
      const confirmacion = await this.$swal.fire({
        icon: 'warning',
        title: '¿Eliminar registro?',
        text: nombre ? `Se eliminará «${nombre}». Esta acción no se puede deshacer.` : 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        confirmButtonColor: '#d33',
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
        // El servidor explica el motivo (p. ej. el registro se usa en clientes o contratos)
        const motivo = error.response?.data?.error;
        await this.$swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: motivo ? `No se pudo eliminar el registro: ${motivo}` : 'No se pudo eliminar el registro.',
        });
      } finally {
        this.loading = false;
      }
    },
    
    // Texto con el que se nombra un registro en los avisos (su nombre, descripción, código o nivel)
    nombreRegistro(fila) {
      if (!fila) return '';
      const valor = [fila.nombre, fila.descripcion, fila.codigo, fila.nivel].find(v => v !== null && v !== undefined && String(v).trim() !== '');
      return valor === undefined ? '' : String(valor).trim();
    },

    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.registro = {};
      this.editando = false;
      this.errorNombre = '';
    },
    
    refreshData() {
      if (this.tablaSeleccionada) {
        this.seleccionarTabla(this.tablaSeleccionada);
      }
    },
    
    async exportarExcel() {
      try {
        // Mismas columnas y orden que la tabla, con el texto completo (en pantalla se recorta a 50 caracteres)
        const data = this.sortedDatos.map(fila => {
          const row = {};
          this.columnasVisibles.forEach(col => {
            row[this.nombreColumnaExcel(col)] = this.valorExportable(fila[col]);
          });
          return row;
        });

        const ExcelJS = await cargarExcelJS();
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

        await descargarLibroExcel(workbook, `${this.tablaSeleccionada.nombre}.xlsx`);
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
    },
    totalPages(newVal) {
      // Tras un refresco (guardar/editar/eliminar), si la página actual queda
      // fuera de rango llevamos al usuario a la última página válida en vez
      // de dejarlo viendo una página vacía.
      if (newVal > 0 && this.currentPage > newVal) {
        this.currentPage = newVal;
      }
    }
  }
};
</script>

<style scoped src="./AdministracionComponent.css"></style>