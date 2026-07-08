<template>
  <!-- Contenedor principal del módulo de gestión de clientes -->
  <div class="clientes-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="loading" />

    <!-- Panel superior con stats y botón de crear cliente -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card" style="animation-delay: 0s">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedClientes }}</div>
            <div class="stat-label">Total Clientes</div>
          </div>
        </div>
        <div class="stat-card" style="animation-delay: 0.1s">
          <div class="stat-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedPuntos }}</div>
            <div class="stat-label">Puntos Suministro</div>
          </div>
        </div>
        <div class="stat-card" style="animation-delay: 0.2s">
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
          <span>Crear Cliente</span>
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
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" style="width: 20%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombre')">
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
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cif')">
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
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreComercial')">
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
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('nombreSector')">
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
                        <span v-if="selectedSectores.length === 0">TODOS</span>
                        <span v-else-if="selectedSectores.length === 1">{{ selectedSectores[0] }}</span>
                        <span v-else>{{ selectedSectores.length }} sectores</span>
                        <i class="fas fa-chevron-down"></i>
                      </button>
                      <div 
                        v-if="showSectorDropdown" 
                        class="dropdown-menu"
                        @click.stop
                      >
                        <div class="dropdown-item">
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
              <th class="sortable" style="width: 25%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('direccionFiscal')">
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
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('numeroPuntosSuministro')">
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
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('usuarioAsignado')">
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
              <th style="width: 10%">
                <div class="column-header">
                  <div class="column-title">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in paginatedClientes" :key="cliente.idCliente" 
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
                  <button class="btn-icon btn-view" @click="verPuntosSuministro(cliente)" title="Ver puntos de suministro">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
              <td class="text-truncate" :title="cliente.usuarioAsignado">{{ cliente.usuarioAsignado }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-edit" @click="cargarDatosCliente(cliente.idCliente)" title="Consultar Cliente">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-add" 
                    @click="abrirFormularioNuevoPunto(cliente)" 
                    :disabled="estaClienteDadoDeBaja(cliente)"
                    :title="estaClienteDadoDeBaja(cliente) ? 'No se pueden crear puntos de suministro en un cliente dado de baja' : 'Crear Punto de Suministro'"
                    :style="estaClienteDadoDeBaja(cliente) ? 'opacity: 0.4; cursor: not-allowed;' : ''">
                    <i class="fas fa-plus-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedClientes.length === 0">
              <td colspan="7" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron clientes que coincidan con la búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination-controls">
        <div class="records-per-page">
          <label for="recordsPerPage">Registros por página:</label>
          <select v-model="recordsPerPage" id="recordsPerPage" class="form-control">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="pagination-info">
          Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filteredClientes.length }} registros
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
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            title="Página siguiente"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage === totalPages"
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
      @cerrar-modal="cerrarFormularioNuevoPuntoSuministro"
      @actualizar-punto-suministro="handleUpdateOrCreate"
    />
  </div>
</template>

<script>
import axios from "axios";
import Spinner from "@/components/SpinnerComponent.vue";
import PuntosSuministroClienteComponent from "@/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue";
import CreaActualizaClienteComponent from "@/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue";
import ModalActualizarPuntoSuministro from "@/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue";
import ExcelJS from 'exceljs';

export default {
  name: "ClientesComponent",
  components: {
    Spinner,
    PuntosSuministroClienteComponent,
    CreaActualizaClienteComponent,
    ModalActualizarPuntoSuministro
  },
  data() {
    return {
      clientes: [], // Lista de clientes
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
      isSubmitting: false, // Evita múltiples envíos del formulario
      showModalPS: false,           // Control de visibilidad para el modal de crear/actualizar Punto de Suministro
      modificarPunto: null,         // Datos del formulario para modificar/crear un punto de suministro
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
      modoConsulta: false,          // Flag para indicar si el ModalActualizarPuntoSuministro está en modo consulta
      isCreating: false,            // Flag para indicar si el ModalActualizarPuntoSuministro está en modo creación
      mostrarModalContratos: false, // Control de visibilidad del modal de contratos
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
      return this.clientes.filter((cliente) => {
        // Primero aplicamos el filtro de estado de baja
        const estadoBajaFilter = this.mostrarClientesDadosDeBaja ? this.estaClienteDadoDeBaja(cliente) : !this.estaClienteDadoDeBaja(cliente);
        
        // Luego aplicamos el filtro general
        const generalFilter = Object.values(cliente).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        );

        // Luego aplicamos los filtros por columna (excepto sector que se maneja por separado)
        const columnFilters = Object.entries(this.columnFilters).every(([key, value]) => {
          if (!value || key === 'nombreSector') return true; // Excluir sector del filtro de texto
          const fieldValue = String(cliente[key] || '').toLowerCase();
          return fieldValue.includes(value.toLowerCase());
        });

        // Filtro específico para sectores múltiples
        const sectorFilter = this.selectedSectores.length === 0 || 
          this.selectedSectores.includes(cliente.nombreSector) ||
          (this.selectedSectores.includes('Sin sector') && !cliente.nombreSector);

        return estadoBajaFilter && generalFilter && columnFilters && sectorFilter;
      });
    },
    // Total de puntos de suministro de todos los clientes
    totalPuntosSuministro() {
      return this.clientes.reduce((total, cliente) => {
        return total + (cliente.numeroPuntosSuministro || 0);
      }, 0);
    },
    sortedClientes() {
      if (!this.sortKey || !this.sortOrder) return this.filteredClientes;
      
      const sorted = [...this.filteredClientes].sort((a, b) => {
        let aValue = a[this.sortKey];
        let bValue = b[this.sortKey];
        
        aValue = aValue ?? '';
        bValue = bValue ?? '';
        
        if (this.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      return sorted;
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
        const response = await axios.get(`/clientes/cartera`);
        this.clientes = response.data;
        // Eliminada la alerta de éxito, solo loading
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        await this.$swal.fire({
          title: 'Error',
          text: `No se pudieron actualizar los clientes: ${error.message}`,
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)'
        });
      } finally {
        this.loading = false;
      }
    },
    // Carga los puntos de suministro asociados a un cliente
    async fetchPuntosSuministro(idCliente) {
      try {
        this.loading = true;
        const response = await axios.get(`/puntos-suministro/cliente/${idCliente}/cartera`);
        this.puntosSuministro = response.data;
      } catch (error) {
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los puntos de suministro.'
        })
      } finally {
        this.loading = false;
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
        const response = await axios.get(`/clientes/${idCliente}`);
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
      try {
        await axios.put(/clientes/${clienteActualizado.id}`, clienteActualizado);
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
          confirmButtonColor: 'rgba(252, 215, 0)'
        });
      }
    },    
    // Handler para cuando se completa la reactivación de un cliente (y opcionalmente sus PS)
    onClienteReactivado() {
      this.fetchClientes();
      this.cancelarFormulario();
    },
    // Lógica para crear cliente
    async crearCliente(clienteRecibido) {
      try {
        if (this.modoActualizar) return; // Evita llamadas erróneas en modo actualización
        await axios.post(/clientes`, clienteRecibido);
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
          confirmButtonColor: 'rgba(252, 215, 0)'
        });
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
      try {
        await axios.post(/puntos-suministro`, datosAdaptados);
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
      }
    },
    sortBy(key) {
      if (this.sortKey === key) {
        // Ciclo: asc -> desc -> null
        if (this.sortOrder === 'asc') {
          this.sortOrder = 'desc';
        } else if (this.sortOrder === 'desc') {
          this.sortKey = null;
          this.sortOrder = null;
        }
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    
    getSortIcon(key) {
      if (this.sortKey !== key) return 'fas fa-sort';
      if (!this.sortOrder) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },

    async exportarExcel() {
      try {
        const data = this.filteredClientes.map(cliente => ({
          'Nombre Cliente': cliente.nombre,
          'CIF': cliente.cif,
          'Grupo Empresarial': cliente.nombreComercial,
          'Sector': cliente.nombreSector || 'Sin sector',
          'Dirección Fiscal': cliente.direccionFiscal,
          'Puntos Suministro': cliente.numeroPuntosSuministro,
          'Usuario Asignado': cliente.usuarioAsignado
        }));

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

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Cartera_Clientes.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        this.$toast.error('Error al exportar a Excel');
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
      const [clientes, usuarios, sectores, subtipologias, cargosContacto, appMonitorizacion, integracionSistemasFV] = await Promise.all([
        axios.get(/clientes/cartera`),
        axios.get(/usuarios`),
        axios.get(/sectores`),
        axios.get(/subtipologias`),
        axios.get(/cargos-contacto`),
        axios.get(/app-monitorizacion`),
        axios.get(/integracion-sistemas-fv`),
      ]);
      this.clientes = clientes.data;
      this.usuarios = usuarios.data;
      this.sectores = sectores.data;
      this.subtipologias = subtipologias.data;
      this.cargosContacto = cargosContacto.data;
      this.appMonitorizacion = appMonitorizacion.data;
      this.integracionSistemasFV = integracionSistemasFV.data;
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      await this.$swal.fire({
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

<style scoped>
/* Grid layout para el contenedor principal */
.clientes-container {
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
}

/* Panel de estadísticas */
.stats-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.stats-container {
  display: flex;
  flex: 1;
  gap: 20px;
}

.stat-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 0.7rem 1rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex: 1;
  animation: statCardEntrance 0.5s ease both;
}

@keyframes statCardEntrance {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.7rem;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-right: 0.8rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.action-card {
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  min-width: auto;
}

.action-card .btn {
  /* Los estilos de .btn-primary tienen prioridad */
}

.action-card .btn:hover {
  /* Los estilos de hover de .btn-primary tienen prioridad */
}


.table-header {
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  color: #2196f3; /* Azul para editar */
}
.btn-icon.btn-edit:hover {
  background-color: rgba(33,150,243,0.1);
}

.btn-icon.btn-view {
  color: #43a047; /* Verde para ver */
}
.btn-icon.btn-view:hover {
  background-color: rgba(67,160,71,0.1);
}

.btn-icon.btn-add {
  color: #ff9800; /* Naranja para agregar */
}
.btn-icon.btn-add:hover {
  background-color: rgba(255,152,0,0.1);
}

.ps-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.ps-badge {
  background-color: var(--primary-light);
  color: black;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-per-page label {
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 14px; /* Reducir tamaño de fuente */
}

.records-per-page select {
  width: auto; /* Ajustar ancho */
  padding: 6px 8px; /* Ajustar padding */
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
  color: white;
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
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: 52px; /* Altura fija para las filas */
}

/* Row fade-in animation */
.data-table tbody tr {
  animation: rowFadeIn 0.3s ease both;
}
.data-table tbody tr:nth-child(1) { animation-delay: 0s; }
.data-table tbody tr:nth-child(2) { animation-delay: 0.03s; }
.data-table tbody tr:nth-child(3) { animation-delay: 0.06s; }
.data-table tbody tr:nth-child(4) { animation-delay: 0.09s; }
.data-table tbody tr:nth-child(5) { animation-delay: 0.12s; }
.data-table tbody tr:nth-child(n+6) { animation-delay: 0.15s; }

@keyframes rowFadeIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Highlight flash for recently updated rows */
.row-highlight {
  animation: highlightFlash 1.5s ease;
}
@keyframes highlightFlash {
  0% { background-color: rgba(76, 175, 80, 0.3); }
  100% { background-color: transparent; }
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
  min-width: 120px; /* Ancho mínimo para los botones de acción */
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

.data-table th {
  padding: 12px;
  vertical-align: top;
  background-color: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
}

.data-table th i {
  margin-left: 4px;
  font-size: 0.9em;
  color: var(--text-secondary);
}

.sortable .column-title {
  color: var(--text-primary);
  font-weight: 600;
}

.sortable .column-title:hover {
  color: var(--primary-color);
}

/* Estilos para el dropdown de sectores */
.sector-filter-dropdown {
  position: relative;
}

.dropdown-button {
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.dropdown-button:hover {
  background-color: var(--hover-color);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.dropdown-button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.dropdown-button i {
  transition: transform 0.3s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 5px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: var(--hover-color);
  color: var(--primary-color);
}

.dropdown-item.checked {
  background-color: var(--primary-light);
  color: black;
}

.dropdown-item.checked:hover {
  background-color: var(--primary-light);
  color: black;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 10px;
}

.checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 18px;
  width: 18px;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.checkbox-label input:checked ~ .checkmark {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-label input:checked ~ .checkmark:after {
  content: "";
  display: block;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg);
  margin-top: -1px;
}

.checkmark:after {
  content: "";
  display: none;
}

/* Estilos para clientes dados de baja */
.cliente-dado-baja {
  background-color: rgba(220, 53, 69, 0.05) !important;
  opacity: 0.7;
}

.cliente-dado-baja:hover {
  background-color: rgba(220, 53, 69, 0.1) !important;
  opacity: 0.8;
}

.cliente-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.cliente-nombre {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.baja-indicator {
  color: #dc3545;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(220, 53, 69, 0.1);
  flex-shrink: 0;
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

/* Estilos de botones profesionales */
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

/* Botón Create (Alias para Primary) */
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

/* Botón Toggle Baja (Mostrar/Ocultar dados de baja) */
.btn-toggle-baja {
  background: #f3f4f6 !important;
  color: #4b5563 !important;
  border: 1px solid #e5e7eb !important;
  font-weight: 600 !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}

.btn-toggle-baja:hover {
  background: #e5e7eb !important;
  color: #1f2937 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

/* Estado Activo (Rojo) para Toggle Baja */
.btn-toggle-baja.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1) !important;
}

.btn-export {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  border: none !important;
  cursor: pointer !important;
}

.btn-export i {
  font-size: 1.2em !important;
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
</style>

 