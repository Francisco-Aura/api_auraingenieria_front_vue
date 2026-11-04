<template>
  <!-- Contenedor principal del módulo de gestión de clientes -->
  <div class="clientes-container fade-in">
    <!-- Panel superior con stats y botón de crear cliente -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card stat-card--clientes">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedClientes }}</div>
            <div class="stat-label">Total Clientes</div>
          </div>
        </div>
        <div class="stat-card stat-card--puntos">
          <div class="stat-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedPuntos }}</div>
            <div class="stat-label">Puntos Suministro</div>
          </div>
        </div>
        <div class="stat-card stat-card--sectores">
          <div class="stat-icon">
            <i class="fas fa-industry"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedSectores }}</div>
            <div class="stat-label">Sectores</div>
          </div>
        </div>
      </div>
      <div class="action-card">
        <button class="btn btn-primary" @click="abrirFormularioCrearCliente">
          <i class="fas fa-plus"></i>
          <span>Crear cliente</span>
        </button>
      </div>
    </div>
    
    <!-- Tabla de clientes con nuevo diseño -->
    <div class="card table-panel">
      <div class="table-header">
        <div class="table-actions-horizontal">
          <button class="btn btn-refresh" @click="fetchClientes" title="Actualizar datos">
            <i class="fas fa-sync-alt"></i>
            <span>Actualizar</span>
          </button>
          <button class="btn btn-export btn-excel" v-if="nivelAcceso == 1" @click="exportarExcel" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
            <span>Excel</span>
          </button>
          <button 
            class="btn btn-toggle-baja" 
            :class="{ 'active': mostrarClientesDadosDeBaja }"
            @click="toggleMostrarClientesDadosDeBaja" 
            :title="mostrarClientesDadosDeBaja ? 'Ocultar clientes dados de baja' : 'Mostrar clientes dados de baja'"
          >
            <i class="fas fa-ban"></i>
            <span>{{ mostrarClientesDadosDeBaja ? 'Ocultar dados de baja' : 'Mostrar dados de baja' }}</span>
          </button>
        </div>
      </div>
      <div class="table-responsive" v-desborde-tabla>
        <table class="data-table data-table--acciones-fijas data-table--compacta">
          <thead>
            <tr>
              <th class="sortable th-col-nombre">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombre')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('nombre')" @keydown.space.prevent="sortBy('nombre')">
                    <i class="fas fa-user mr-2"></i>Nombre Cliente
                    <i :class="getSortIcon('nombre')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.nombre" 
                      @input="filterByColumn('nombre', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-cif">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cif')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('cif')" @keydown.space.prevent="sortBy('cif')">
                    <i class="fas fa-id-card mr-2"></i>CIF
                    <i :class="getSortIcon('cif')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cif" 
                      @input="filterByColumn('cif', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-grupo">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreComercial')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('nombreComercial')" @keydown.space.prevent="sortBy('nombreComercial')">
                    <i class="fas fa-building mr-2"></i>Grupo Empresarial
                    <i :class="getSortIcon('nombreComercial')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.nombreComercial" 
                      @input="filterByColumn('nombreComercial', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-sector">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreSector')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('nombreSector')" @keydown.space.prevent="sortBy('nombreSector')">
                    <i class="fas fa-industry mr-2"></i>Sector
                    <i :class="getSortIcon('nombreSector')"></i>
                  </div>
                  <div class="column-filter-container">
                    <div class="sector-filter-dropdown">
                      <button 
                        class="dropdown-button" 
                        @click.stop="showSectorDropdown = !showSectorDropdown"
                        :class="{ 'active': selectedSectores.length > 0 }"
                      >
                        <!-- Texto recortado con «…»: un sector largo ya no ensancha la columna -->
                        <span v-if="selectedSectores.length === 0" class="dropdown-button-texto">TODOS</span>
                        <span v-else-if="selectedSectores.length === 1" class="dropdown-button-texto" :title="selectedSectores[0]">{{ selectedSectores[0] }}</span>
                        <span v-else class="dropdown-button-texto" :title="selectedSectores.join(', ')">{{ selectedSectores.length }} sectores</span>
                        <i class="fas fa-chevron-down"></i>
                      </button>
                      <div 
                        v-if="showSectorDropdown" 
                        class="dropdown-menu"
                        @click.stop
                      >
                        <div class="dropdown-item dropdown-item--todos">
                          <label class="checkbox-label">
                            <input 
                              type="checkbox" 
                              :checked="selectedSectores.length === 0"
                              @change="clearSectorFilter"
                            >
                            <span class="checkmark"></span>
                            TODOS
                          </label>
                        </div>
                        <div 
                          v-for="sector in sectoresUnicos" 
                          :key="sector"
                          class="dropdown-item"
                          :title="sector || 'Sin sector'"
                        >
                          <label class="checkbox-label">
                            <input 
                              type="checkbox" 
                              :value="sector"
                              v-model="selectedSectores"
                            >
                            <span class="checkmark"></span>
                            {{ sector || 'Sin sector' }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </th>
              <th class="sortable th-col-dirfiscal">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('direccionFiscal')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('direccionFiscal')" @keydown.space.prevent="sortBy('direccionFiscal')">
                    <i class="fas fa-map-marker-alt mr-2"></i>Dirección Fiscal
                    <i :class="getSortIcon('direccionFiscal')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.direccionFiscal" 
                      @input="filterByColumn('direccionFiscal', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-ps">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('numeroPuntosSuministro')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('numeroPuntosSuministro')" @keydown.space.prevent="sortBy('numeroPuntosSuministro')">
                    <i class="fas fa-bolt mr-2"></i>PS
                    <i :class="getSortIcon('numeroPuntosSuministro')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.numeroPuntosSuministro" 
                      @input="filterByColumn('numeroPuntosSuministro', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-usuario">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('usuarioAsignado')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('usuarioAsignado')" @keydown.space.prevent="sortBy('usuarioAsignado')">
                    <i class="fas fa-user-tie mr-2"></i>Usuario
                    <i :class="getSortIcon('usuarioAsignado')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.usuarioAsignado" 
                      @input="filterByColumn('usuarioAsignado', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-acciones-cli">
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
                <td v-for="col in 8" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>
            <tr v-for="cliente in paginatedClientes" v-show="!loading" :key="cliente.idCliente" 
                :class="{ 'cliente-dado-baja': estaClienteDadoDeBaja(cliente) }">
              <td class="text-truncate" :title="cliente.nombre">
                <div class="cliente-cell">
                  <span v-if="estaClienteDadoDeBaja(cliente)" class="baja-indicator" title="Cliente dado de baja">
                    <i class="fas fa-ban"></i>
                  </span>
                  <span class="cliente-nombre">{{ cliente.nombre }}</span>
                </div>
              </td>
              <td class="text-truncate" :title="cliente.cif">{{ cliente.cif }}</td>
              <td class="text-truncate" :title="cliente.nombreComercial">{{ cliente.nombreComercial }}</td>
              <td class="text-truncate" :title="cliente.nombreSector || 'Sin sector'">{{ cliente.nombreSector || 'Sin sector' }}</td>
              <td class="text-truncate" :title="cliente.direccionFiscal">{{ cliente.direccionFiscal }}</td>
              <td>
                <div class="ps-cell">
                  <span class="ps-badge">{{ cliente.numeroPuntosSuministro }}</span>
                  <button class="btn-icon btn-view" @click="verPuntosSuministro(cliente)" title="Ver puntos de suministro" aria-label="Ver puntos de suministro">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
              <td class="text-truncate" :title="cliente.usuarioAsignado">{{ cliente.usuarioAsignado }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-edit" @click="cargarDatosCliente(cliente.idCliente)" title="Modificar cliente" aria-label="Modificar cliente">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-add" 
                    @click="abrirFormularioNuevoPunto(cliente)" 
                    :disabled="estaClienteDadoDeBaja(cliente)"
                    :title="estaClienteDadoDeBaja(cliente) ? 'No se pueden crear puntos de suministro en un cliente dado de baja' : 'Crear punto de suministro'"
                    aria-label="Crear punto de suministro">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Sin filas: se distingue un fallo de carga, una cartera vacía y unos filtros sin resultados -->
            <tr v-if="!loading && paginatedClientes.length === 0" class="fila-estado-vacio">
              <td colspan="8" class="text-center py-4">
                <div v-if="errorCargaClientes" class="empty-state empty-state--error">
                  <i class="fas fa-exclamation-triangle fa-3x"></i>
                  <p class="mt-3">No se pudo cargar la cartera de clientes</p>
                  <button type="button" class="btn btn-refresh btn-reintentar" @click="fetchClientes">
                    <i class="fas fa-sync-alt"></i>
                    <span>Reintentar</span>
                  </button>
                </div>
                <div v-else-if="hayFiltrosActivos" class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron clientes que coincidan con la búsqueda</p>
                </div>
                <div v-else class="empty-state">
                  <i class="fas fa-users fa-3x text-muted"></i>
                  <p class="mt-3">{{ mostrarClientesDadosDeBaja ? 'No hay clientes dados de baja' : 'Todavía no hay clientes en la cartera' }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-controls">
        <div class="records-per-page">
          <label for="recordsPerPage">Registros por página:</label>
          <select v-model.number="recordsPerPage" id="recordsPerPage" class="form-control">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ filteredClientes.length ? paginationStart : 0 }} - {{ paginationEnd }} de {{ filteredClientes.length }} registros
        </div>
        <div class="pagination-buttons">
          <button 
            class="btn btn-outline" 
            :disabled="currentPage === 1"
            @click="currentPage = 1"
            title="Primera página"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage === 1"
            @click="currentPage--"
            title="Página anterior"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages || 1 }}</span>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            title="Página siguiente"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage >= totalPages"
            @click="currentPage = totalPages"
            title="Última página"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <PuntosSuministroClienteComponent
      v-if="isModalPuntosOpen"
      :cliente="clienteSeleccionado"
      :puntosSuministro="puntosSuministro"
      :cargando="loading"
      @cerrar-modal="cerrarModalPuntos"
    />

    <CreaActualizaClienteComponent
      :formularioVisible="formularioVisible"
      :modoActualizar="modoActualizar"
      :nuevoCliente="nuevoCliente"
      :sectores="sectores"
      :usuarios="usuarios"
      :subtipologias="subtipologias"
      :cargosContacto="cargosContacto"
      :appMonitorizacion="appMonitorizacion"
      :integracionSistemasFV="integracionSistemasFV"
      :isSubmitting="guardandoCliente"
      @cancelar-formulario="cancelarFormulario"
      @crear-cliente="crearCliente"
      @actualizar-cliente="actualizarCliente"
      @cliente-reactivado="onClienteReactivado"
    />

    <ModalActualizarPuntoSuministro
      v-if="showModalPS"
      :modificarPunto="modificarPunto"
      :modoConsulta="modoConsulta"
      :isCreating="isCreating"
      :isSubmitting="guardandoPunto"
      @cerrar-modal="cerrarFormularioNuevoPuntoSuministro"
      @actualizar-punto-suministro="handleUpdateOrCreate"
    />
  </div>
</template>

<script>
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden';
import axios from "axios";
import PuntosSuministroClienteComponent from "@/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue";
import CreaActualizaClienteComponent from "@/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue";
import ModalActualizarPuntoSuministro from "@/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue";
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel';

export default {
  name: "ClientesComponent",
  mixins: [ordenTabla],
  components: {
    PuntosSuministroClienteComponent,
    CreaActualizaClienteComponent,
    ModalActualizarPuntoSuministro
  },
  data() {
    return {
      clientes: [], // Lista de clientes
      errorCargaClientes: false, // Falló la última carga de la cartera (la tabla vacía no es «sin resultados»)
      guardandoCliente: false, // Petición de alta/modificación en curso (evita el doble clic)
      guardandoPunto: false, // Igual para el alta/modificación de un punto de suministro
      filter: "", // Texto del filtro
      columnFilters: {
        nombre: '',
        cif: '',
        nombreComercial: '',
        nombreSector: '',
        direccionFiscal: '',
        numeroPuntosSuministro: '',
        usuarioAsignado: ''
      },
      selectedSectores: [], // Array para sectores seleccionados
      showSectorDropdown: false, // Control del dropdown de sectores
      puntosSuministro: [],        // Lista de puntos de suministro
      clienteSeleccionado: this.resetFormularioCliente(),  // Inicializar con un objeto válido
      isModalPuntosOpen: false,    // Estado para controlar la visibilidad del modal
      loading: false,              // Estado para mostrar un spinner de carga
      formularioVisible: false,     // Control de visibilidad del formulario de actualización
      modoActualizar: false,       // Indica si el formulario está en modo actualizar
      nuevoCliente: this.resetFormularioCliente(), // Inicializar con un objeto válido
      sectores: [], // Opciones de sectores
      usuarios: [], // Opciones de usuarios
      subtipologias: [], // Opciones de subtipologías
      cargosContacto: [], // Opciones de cargos de contacto
      appMonitorizacion: [], // Opciones de aplicaciones de monitorización
      integracionSistemasFV: [], // Opciones de integración sistemas FV
      showModalPS: false,           // Control de visibilidad para el modal de crear/actualizar Punto de Suministro
      modificarPunto: null,         // Datos del formulario para modificar/crear un punto de suministro
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
      modoConsulta: false,          // Flag para indicar si el ModalActualizarPuntoSuministro está en modo consulta
      isCreating: false,            // Flag para indicar si el ModalActualizarPuntoSuministro está en modo creación
      mostrarClientesDadosDeBaja: false,
      // Contadores animados
      animatedClientes: 0,
      animatedPuntos: 0,
      animatedSectores: 0, // Control para mostrar/ocultar clientes dados de baja
      nivelAcceso: null,            // Nivel de acceso del usuario
    };
  },  
  computed: {
    // Lista de clientes filtrados según el texto de búsqueda
    filteredClientes() {
      // El término y los filtros de columna se preparan una vez, no por cada fila:
      // con la caja de búsqueda vacía ni siquiera se recorren los campos del cliente
      // (antes se convertía a texto cada campo de cada fila en cada pulsación).
      const termino = this.filter.toLowerCase();
      const filtrosColumna = Object.entries(this.columnFilters)
        .filter(([clave, valor]) => valor && clave !== 'nombreSector')
        .map(([clave, valor]) => [clave, valor.toLowerCase()]);
      const sectores = this.selectedSectores;

      return this.clientes.filter((cliente) => {
        const dadoDeBaja = this.estaClienteDadoDeBaja(cliente);
        if (this.mostrarClientesDadosDeBaja ? !dadoDeBaja : dadoDeBaja) return false;

        if (termino && !Object.values(cliente).some(
          (valor) => String(valor).toLowerCase().includes(termino))) return false;

        for (const [clave, valor] of filtrosColumna) {
          if (!String(cliente[clave] ?? '').toLowerCase().includes(valor)) return false;
        }

        // Filtro específico para sectores múltiples
        return sectores.length === 0
          || sectores.includes(cliente.nombreSector)
          || (sectores.includes('Sin sector') && !cliente.nombreSector);
      });
    },
    // Hay algún filtro puesto (texto, columnas o sectores): el aviso de tabla vacía habla de «búsqueda»
    hayFiltrosActivos() {
      return !!this.filter
        || this.selectedSectores.length > 0
        || Object.values(this.columnFilters).some((valor) => !!valor);
    },
    // Total de puntos de suministro de todos los clientes
    totalPuntosSuministro() {
      return this.clientes.reduce((total, cliente) => {
        return total + (cliente.numeroPuntosSuministro || 0);
      }, 0);
    },
    sortedClientes() {
      if (!this.sortKey || !this.sortOrder) return this.filteredClientes;
      
      const signo = this.sortOrder === 'asc' ? 1 : -1;
      return [...this.filteredClientes]
        .sort((a, b) => compararValores(a[this.sortKey], b[this.sortKey]) * signo);
    },
    
    paginatedClientes() {
      const start = (this.currentPage - 1) * this.recordsPerPage;
      const end = start + this.recordsPerPage;
      return this.sortedClientes.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredClientes.length / this.recordsPerPage);
    },
    
    paginationStart() {
      return (this.currentPage - 1) * this.recordsPerPage + 1;
    },
    
    paginationEnd() {
      const end = this.currentPage * this.recordsPerPage;
      return end > this.filteredClientes.length ? this.filteredClientes.length : end;
    },
    sectoresUnicos() {
      const sectores = this.clientes.map(cliente => cliente.nombreSector || 'Sin sector');
      return [...new Set(sectores)].sort();
    }
  },
  methods: {
    // Carga la lista de clientes desde el backend
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/clientes/cartera`);
        this.clientes = response.data;
        this.errorCargaClientes = false;
        // Eliminada la alerta de éxito, solo loading
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        this.errorCargaClientes = true;
        await this.$swal.fire({
          title: 'Error',
          text: `No se pudieron actualizar los clientes: ${error.message}`,
          icon: 'error',
          confirmButtonColor: '#fcd700'
        });
      } finally {
        this.loading = false;
      }
    },
    // Carga los puntos de suministro asociados a un cliente
    async fetchPuntosSuministro(idCliente) {
      // Al cerrar la ficha y abrir otra enseguida, la respuesta del primer cliente
      // podía llegar después y mostrar sus puntos en la ficha del segundo
      const peticion = this.peticionPuntosCliente = (this.peticionPuntosCliente || 0) + 1;
      const vigente = () => peticion === this.peticionPuntosCliente;
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/cliente/${idCliente}/cartera`);
        if (vigente() && this.isModalPuntosOpen) this.puntosSuministro = response.data;
      } catch (error) {
        if (!vigente()) return;
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los puntos de suministro.'
        })
      } finally {
        if (vigente()) this.loading = false;
      }
    },
    // Reinicia el formulario de cliente
    resetFormularioCliente() {
      return {
        nombre: '',
        grupoEmpresarial: '',
        cif: '',
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        iban: '',
        nombreAutorizado: '',
        dniAutorizado: '',
        telefonoAutorizado: '',
        emailAutorizado: '',
        idUsuario: null,
        actividad: '',
        codigoSector: null,
        codigoSubtipologia: null,
        notas: '',
        userTelemedida: '',
        passTelemedida: '',
        // Autorizados
        nombreContacto1: '',
        cargoContacto1: '',
        emailContacto1: '',
        telefonoContacto1: '',
        nombreContacto2: '',
        cargoContacto2: '',
        emailContacto2: '',
        telefonoContacto2: '',
        nombreContacto3: '',
        cargoContacto3: '',
        emailContacto3: '',
        telefonoContacto3: '', 
      };
    },
    // Reinicia el formulario de punto de suministro
    resetFormularioPuntoSuministro() {
      return {
        id: null,
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        cupsluz: '',
        cupsgas: '',
        distribuidora: null,
        tipoContador: null,
        tipoComunicacion: null,
        propiedad: null,
        propiedadModem: 0,
        observaciones: '',
        fechaInstalacion: '',
        potenciaBIE: 0.0,
        potenciaTecnicaRed: 0.0,
        apmCentroTransformacion: '',
        numeroContador: '',
        numeroTelefono: '',
        direccionEnlace: '',
        puntoMedida: '',
        clave: '',
        exencionImpuestoElectrico: false,
        porcentajeConcesion: 0.0,
        fechaConcesion: '',
        // Cliente se asigna al abrir el modal, no en el reset general
      };
    },    
    // Muestra el modal de puntos de suministro para el cliente seleccionado
    verPuntosSuministro(cliente) {
      try {
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true; // Abre el modal primero
        this.fetchPuntosSuministro(cliente.idCliente); // Luego carga los puntos
      } catch (error) {
        console.error('Error al mostrar puntos de suministro:', error);
      }
    },
    // Cierra el modal de puntos de suministro
    cerrarModalPuntos() {
        this.isModalPuntosOpen = false; // Cierra el modal
        this.clienteSeleccionado = null; // Limpia el cliente seleccionado
        this.puntosSuministro = []; // Limpia los puntos de suministro cargados
    },       
    // Muestra el modal de creación de cliente
    abrirFormularioCrearCliente() {
      this.modoActualizar = false;
      this.nuevoCliente = this.resetFormularioCliente();
      this.formularioVisible = true;
    },
    // Método para cancelar el formulario
    cancelarFormulario() {
      this.formularioVisible = false;
      this.nuevoCliente = this.resetFormularioCliente();
      this.modoActualizar = false;
    },
    // Método para cargar los datos de un cliente para actualización
    async cargarDatosCliente(idCliente) {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/clientes/${idCliente}`);
        this.nuevoCliente = response.data;
        this.modoActualizar = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al cargar datos del cliente:", error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los datos del cliente.'
        })
      } finally {
        this.loading = false;
      }
    },
    // Lógica para actualizar cliente
    async actualizarCliente(clienteActualizado) {
      if (!clienteActualizado.id) {
        console.error("El cliente recibido no tiene un ID.");
        return;
      }
      if (this.guardandoCliente) return;
      this.guardandoCliente = true;
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/clientes/${clienteActualizado.id}`, clienteActualizado);
        this.$swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cliente actualizado.'
        })
        this.fetchClientes(); // Actualiza la lista de clientes
        this.cancelarFormulario();
      } catch (error) {
        console.error("Error al actualizar cliente:", error);
        const errData = error.response?.data;
        const detalle = errData?.message || errData?.error || errData?.mensaje || (typeof errData === 'string' ? errData : '') || error.message || '';
        this.$swal.fire({
          icon: 'error',
          title: 'Error al actualizar cliente',
          text: detalle ? `No se pudo actualizar el cliente: ${detalle}` : 'No se pudo actualizar el cliente. Por favor, inténtelo de nuevo.',
          confirmButtonColor: '#fcd700'
        });
      } finally {
        this.guardandoCliente = false;
      }
    },    
    // Handler para cuando se completa la reactivación de un cliente (y opcionalmente sus PS)
    onClienteReactivado() {
      this.fetchClientes();
      this.cancelarFormulario();
    },
    // Lógica para crear cliente
    async crearCliente(clienteRecibido) {
      if (this.modoActualizar) return; // Evita llamadas erróneas en modo actualización
      if (this.guardandoCliente) return; // Un doble clic no crea el cliente dos veces
      this.guardandoCliente = true;
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/clientes`, clienteRecibido);
        this.$swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Cliente creado con éxito.'
        })
        this.fetchClientes(); // Actualiza la lista
        this.cancelarFormulario(); // Limpia y cierra el formulario
      } catch (error) {
        console.error("Error al crear cliente:", error);
        const errData = error.response?.data;
        const detalle = errData?.message || errData?.error || errData?.mensaje || (typeof errData === 'string' ? errData : '') || error.message || '';
        this.$swal.fire({
          icon: 'error',
          title: 'Error al crear cliente',
          text: detalle ? `No se pudo crear el cliente: ${detalle}` : 'No se pudo crear el cliente. Por favor, inténtelo de nuevo.',
          confirmButtonColor: '#fcd700'
        });
      } finally {
        this.guardandoCliente = false;
      }
    },
    // Muestra el modal para crear un punto de suministro (reutilizando ModalActualizarPuntoSuministro)
    abrirFormularioNuevoPunto(cliente) {
      this.clienteSeleccionado = cliente;
      this.modificarPunto = {
        ...this.resetFormularioPuntoSuministro(),
        cliente: { id: cliente.idCliente, nombre: cliente.nombre }, // Asegura que el cliente esté bien enlazado
      };
      this.modoConsulta = false; // Esto es una creación/edición, no solo consulta
      this.isCreating = true;   // Indicar que es un formulario de creación
      this.showModalPS = true;
    },
    // Cierra el modal de creación/actualización de puntos de suministro
    cerrarFormularioNuevoPuntoSuministro() {
      this.showModalPS = false;
      this.modificarPunto = null; // Limpiar datos al cerrar
      this.modoConsulta = false;
      this.isCreating = false;  // Resetear el flag de creación
    },
    // Maneja la creación o actualización de un punto de suministro (ahora centralizado)
    async handleUpdateOrCreate(datosAdaptados) {
      if (this.guardandoPunto) return; // Un doble clic no crea el punto dos veces
      this.guardandoPunto = true;
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/puntos-suministro`, datosAdaptados);
        await this.$swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Punto de suministro ${datosAdaptados.id ? 'actualizado' : 'creado'} correctamente`,
        });
        this.cerrarFormularioNuevoPuntoSuministro(); // Cierra el modal
        this.fetchClientes(); // Refresca la lista principal de clientes (para el contador de PS)
        // Si el modal de puntos de suministro del cliente está abierto, también refresca sus puntos
        if (this.isModalPuntosOpen && this.clienteSeleccionado) {
          this.fetchPuntosSuministro(this.clienteSeleccionado.idCliente);
        }
      } catch (error) {
        console.error("Error al guardar/actualizar punto de suministro:", error);
        await this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar el punto de suministro: ' + (error.response?.data?.mensaje || error.response?.data?.error || error.message)
        });
      } finally {
        this.guardandoPunto = false;
      }
    },

    async exportarExcel() {
      try {
        // En el orden en que se ven en pantalla
        const data = this.sortedClientes.map(cliente => ({
          'Nombre Cliente': cliente.nombre,
          'CIF': cliente.cif,
          'Grupo Empresarial': cliente.nombreComercial,
          'Sector': cliente.nombreSector || 'Sin sector',
          'Dirección Fiscal': cliente.direccionFiscal,
          'Puntos Suministro': cliente.numeroPuntosSuministro,
          'Usuario Asignado': cliente.usuarioAsignado
        }));

        const ExcelJS = await cargarExcelJS();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Clientes');

        // Añadir encabezados
        worksheet.columns = [
          { header: 'Nombre Cliente', key: 'Nombre Cliente', width: 30 },
          { header: 'CIF', key: 'CIF', width: 15 },
          { header: 'Grupo Empresarial', key: 'Grupo Empresarial', width: 25 },
          { header: 'Sector', key: 'Sector', width: 20 },
          { header: 'Dirección Fiscal', key: 'Dirección Fiscal', width: 40 },
          { header: 'Puntos Suministro', key: 'Puntos Suministro', width: 15 },
          { header: 'Usuario Asignado', key: 'Usuario Asignado', width: 20 }
        ];

        // Añadir datos
        worksheet.addRows(data);

        // Estilizar encabezados
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };

        await descargarLibroExcel(workbook, 'Cartera_Clientes.xlsx');
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al exportar',
          text: 'No se pudo exportar la cartera de clientes a Excel. Por favor, inténtelo de nuevo.'
        });
      }
    },

    filterByColumn(column, value) {
      this.columnFilters[column] = value;
    },
    clearSectorFilter() {
      this.selectedSectores = [];
      this.columnFilters.nombreSector = ''; // Limpiar el filtro de texto
    },
    handleClickOutside(event) {
      // Si el dropdown no está abierto, no hacer nada
      if (!this.showSectorDropdown) return;
      
      // Verificar si el click fue dentro del dropdown
      const dropdownContainer = event.target.closest('.sector-filter-dropdown');
      
      // Si el click no fue dentro del dropdown, cerrarlo
      if (!dropdownContainer) {
        this.showSectorDropdown = false;
      }
    },

    // Verifica si un cliente está dado de baja
    estaClienteDadoDeBaja(cliente) {
      // Un cliente está dado de baja si tiene fechaBaja y no es null
      return cliente.fechaBaja && cliente.fechaBaja !== null && cliente.fechaBaja !== '';
    },

    // Alterna la visualización de clientes dados de baja
    toggleMostrarClientesDadosDeBaja() {
      this.mostrarClientesDadosDeBaja = !this.mostrarClientesDadosDeBaja;
      this.currentPage = 1; // Resetear a la primera página cuando cambie el filtro
    },
    animateCounter(prop, target) {
      const duration = 600;
      const start = this[prop];
      const diff = target - start;
      if (diff === 0) return;
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        this[prop] = Math.round(start + diff * ease);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  },
  async mounted() {
    this.loading = true;
    // Agregar event listener para cerrar dropdown al hacer clic fuera
    document.addEventListener('click', this.handleClickOutside);
    
    try {
      // Cada lista se asigna si llega: antes, si fallaba un solo desplegable, la tabla de
      // clientes se quedaba vacía aunque la cartera hubiera cargado bien
      const api = process.env.VUE_APP_API_URL;
      const resultados = await Promise.allSettled([
        axios.get(`${api}/clientes/cartera`),
        axios.get(`${api}/usuarios`),
        axios.get(`${api}/sectores`),
        axios.get(`${api}/subtipologias`),
        axios.get(`${api}/cargos-contacto`),
        axios.get(`${api}/app-monitorizacion`),
        axios.get(`${api}/integracion-sistemas-fv`),
      ]);
      const destinos = ['clientes', 'usuarios', 'sectores', 'subtipologias', 'cargosContacto', 'appMonitorizacion', 'integracionSistemasFV'];
      resultados.forEach((resultado, i) => {
        if (resultado.status === 'fulfilled') this[destinos[i]] = resultado.value.data;
      });
      // La cartera es la primera petición: si falla, la tabla lo dice en vez de «sin resultados»
      this.errorCargaClientes = resultados[0].status === 'rejected';
      const fallo = resultados.find((resultado) => resultado.status === 'rejected');
      if (fallo) throw fallo.reason;
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      // Sin esperar al aviso: detrás ya se ve la tabla en su estado real (el error de la
      // cartera o los datos que sí llegaron), no las filas de «cargando»
      this.$swal.fire({
        title: 'Error de carga',
        text: 'No se pudieron cargar todos los datos iniciales. Algunas funcionalidades podrían no estar disponibles.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    } finally {
      this.loading = false;
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    }
  },
  beforeUnmount() {
    // Limpiar event listener
    document.removeEventListener('click', this.handleClickOutside);
  },
  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    },
    columnFilters: {
      handler() {
        this.currentPage = 1;
      },
      deep: true
    },
    selectedSectores() {
      this.currentPage = 1;
    },
    filter() {
      this.currentPage = 1;
    },
    totalPages(newVal) {
      // Tras un refresco (guardar/editar), si la página actual queda fuera de
      // rango llevamos al usuario a la última página válida en vez de dejarlo
      // viendo una página vacía.
      if (newVal > 0 && this.currentPage > newVal) {
        this.currentPage = newVal;
      }
    },
    formularioVisible(newVal) {
      if (!newVal) {
        // Cuando el formulario se cierra, asegurarnos de que nuevoCliente tenga un valor válido
        this.nuevoCliente = this.resetFormularioCliente();
      }
    },
    'clientes.length'(val) {
      this.animateCounter('animatedClientes', val);
    },
    totalPuntosSuministro(val) {
      this.animateCounter('animatedPuntos', val);
    },
    'sectores.length'(val) {
      this.animateCounter('animatedSectores', val);
    }
  },
  // Cargar nivel de acceso al crear el componente
  created() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      this.nivelAcceso = usuario.nivelAcceso;
    }
  }
};
</script>

<style scoped src="./ClientesComponent.css"></style>

 