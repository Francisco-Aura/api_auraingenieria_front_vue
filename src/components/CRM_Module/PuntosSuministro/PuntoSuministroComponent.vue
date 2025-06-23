<template>
  <div class="suministro-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="loading" />

    <!-- Panel superior con stats y botón de crear-->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ puntosSuministro.length }}</div>
            <div class="stat-label">Total Puntos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalContratos }}</div>
            <div class="stat-label">Contratos Activos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-tools"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalServicios }}</div>
            <div class="stat-label">Servicios Activos</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de puntos de suministro con nuevo diseño -->
    <div class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-bolt"></i> Puntos de Suministro</h2>
        <div class="table-actions">
          <button class="btn btn-export btn-excel" @click="exportarExcel" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
            <span>Excel</span>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <div class="table-controls" hidden>
          <div class="records-per-page">
            <label for="recordsPerPage">Registros por página:</label>
            <select v-model="recordsPerPage" id="recordsPerPage" class="form-control">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" style="width: 20%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cliente')">
                    <i class="fas fa-user mr-2"></i>Cliente
                    <i :class="getSortIcon('cliente')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cliente" 
                      @input="filterByColumn('cliente', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 35%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('direccion')">
                    <i class="fas fa-map-marker-alt mr-2"></i>Dirección
                    <i :class="getSortIcon('direccion')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.direccion" 
                      @input="filterByColumn('direccion', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('identificacion')">
                    <i class="fas fa-id-card mr-2"></i>Identificación
                    <i :class="getSortIcon('identificacion')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.identificacion" 
                      @input="filterByColumn('identificacion', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable" style="width: 15%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cupsluz')">
                    <i class="fas fa-bolt mr-2"></i>CUPS
                    <i :class="getSortIcon('cupsluz')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cupsluz" 
                      @input="filterByColumn('cupsluz', $event.target.value)"
                      placeholder="Filtrar CUPS..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th style="width: 10%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('tipo')">
                    <i class="fas fa-tag mr-2"></i>Tipo
                    <i :class="getSortIcon('tipo')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.tipo" 
                      @input="filterByColumn('tipo', $event.target.value)"
                      placeholder="Filtrar tipo..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th style="width: 10%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('tarifa')">
                    <i class="fas fa-tag mr-2"></i>Tarifa
                    <i :class="getSortIcon('tarifa')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.tarifa" 
                      @input="filterByColumn('tarifa', $event.target.value)"
                      placeholder="Filtrar tarifa..."
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
            <tr v-for="suministro in paginatedPuntosSuministro" :key="suministro.id">
              <td class="text-truncate" :title="suministro.cliente">{{ suministro.cliente }}</td>
              <td class="text-truncate" :title="`${suministro.direccion}, ${suministro.codigoPostal}, ${suministro.poblacion}, ${suministro.provincia}`">
                {{ suministro.direccion }}, {{ suministro.codigoPostal }}, 
                {{ suministro.poblacion }}, {{ suministro.provincia }}
              </td>
              <td class="text-truncate" :title="suministro.identificacion">
                {{ suministro.identificacion || '-' }}
              </td>
              <td class="text-truncate" :title="suministro.cupsluz || suministro.cupsgas">
                {{ suministro.cupsluz || suministro.cupsgas }}
              </td>
              <td style="text-align: center;">
                <div class="tipo-indicator" :class="{ 'is-gas': isGas(suministro), 'is-luz': isLuz(suministro) }">
                  <i v-if="getTipoCups(suministro) !== ''" :class="isGas(suministro) ? 'fas fa-fire' : 'fas fa-bolt'"></i>
                  <span>{{ getTipoCups(suministro) !== '' ? getTipoCups(suministro) : '-' }}</span>
                </div>
              </td>
              <td>
                <div class="tipo-indicator" :class="{ 'is-gas': isGas(suministro), 'is-luz': isLuz(suministro) }">
                  <span>{{ getTarifa(suministro) }}</span>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-view-details" @click="abrirModalPSConsulta(suministro)" title="Consultar punto de suministro">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon btn-edit" @click="abrirFormularioPSActualizar(suministro)" title="Modificar punto de suministro">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-view" @click="abrirModalContratos(suministro.id,suministro.idCliente)" title="Ver contratos">
                    <i class="fas fa-file-contract"></i>
                  </button>
                  <button class="btn-icon btn-add" @click="abrirModalServicios(suministro.id,suministro.idCliente)" title="Ver servicios">
                    <i class="fas fa-tools"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedPuntosSuministro.length === 0">
              <td colspan="6" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron puntos de suministro que coincidan con la búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
            Mostrando {{ paginationStart }} - {{ paginationEnd }} de {{ filteredPuntosSuministro.length }} registros
          </div>
          <div class="pagination-buttons">
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <ModalActualizarPuntoSuministro 
      v-if="formularioVisible" 
      :modificarPunto="modificarPunto" 
      :modoConsulta="modoConsulta"
      @cerrar-modal="cerrarModal"
      @actualizar-punto-suministro="handleUpdate"
    />

    <!-- Modal de Contratos -->
    <ModalContratos v-if="modalCliente" 
      :visible="mostrarModalContratos"
      :cliente="modalCliente"
      :puntoSuministro="modalPuntoSuministro"
      :contratos="contratos"
      :comercializadoras="comercializadoras"
      :tarifasGas="tarifasGas"
      :tarifasLuz="tarifasLuz"
      :contratoActual="contratoActual"
      :contratosHistoricos="contratosHistoricos"
      @cerrar-modal="cerrarModalContratos"
    />

    <!-- Modal de Servicios -->
    <ModalServicios v-if="modalCliente" 
      :visible="mostrarModalServicios" 
      :cliente="modalCliente"
      :puntoSuministroSeleccionado="getPuntoSuministroById(modalPuntoSuministro)"
      :servicios="servicios"
      :gestoras="gestoras"
      :productos="productos"
      :servicioActual="servicioActual"
      :serviciosHistoricos="serviciosHistoricos"
      @cerrar-modal="cerrarModalServicios"
    />
  </div>
</template>

<script>
// Importamos los componentes y librerías necesarias
import ModalActualizarPuntoSuministro from './ActualizarPuntoSuministro.vue';
import ModalContratos from './ModalContratos.vue';
import ModalServicios from './ModalServicios.vue';
import axios from "axios"; // Librería para hacer peticiones HTTP
import Spinner from "@/components/SpinnerComponent.vue";
import * as XLSX from 'xlsx/xlsx.mjs';


export default {
  name: "PuntosSuministro", // Nombre del componente
  components: {
    ModalActualizarPuntoSuministro,
    ModalContratos,
    ModalServicios,
    Spinner
  },
  data() {
    return {
      loading: false,               // Estado para mostrar un spinner de carga
      puntosSuministro: [],         // Lista de puntos de suministro
      filter: "",                   // Filtro de búsqueda
      columnFilters: {
        cliente: '',
        direccion: '',
        identificacion: '',
        cupsluz: '',
        tipo: '',
        tarifa: ''
      },
      formularioVisible: false,     // Control de visibilidad del formulario de actualización
      modoConsulta: false,          // Nuevo flag para controlar el modo consulta
      
      // Datos del formulario para modificar un punto de suministro
      modificarPunto: {
        id: null,
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        cupsluz: "",
        cupsgas: "",
        contador: "",
        propiedadContador: 0, // 0: no es propietario, 1: es propietario
        modem: "",
        propiedadModem: 0, // 0: no es propietario, 1: es propietario
        observaciones: "",
        fechaInstalacion: "",
        fechaBaja: null, // Fecha de baja lógica
        idCliente: null, // ID del cliente asociado
        nombreCliente: "", // Nombre del cliente asociado
      },          

      // Datos CONTRATOS
      mostrarModalContratos: false, // Control de visibilidad del modal de contratos
      contratos: [], // Lista de contratos asociados al punto de suministro
      nuevoContrato: {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
      },
      comercializadoras: [],
      tarifasGas: [],
      tarifasLuz: [],

      // Datos SERVICIO
      mostrarModalServicios: false, // Control de visibilidad del modal de servicios
      servicios: [], // Lista de servicios asociados al punto de suministro
      nuevoServicio: {
        id: "",
        fecha: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora:0,
        idProducto:0,
      },
      modalCliente: null, // Cliente actual para el modal
      modalPuntoSuministro: null, // Punto de suministro actual para el modal
      gestoras: [],
      productos: [],
      currentPage: 1,
      recordsPerPage: 10,
      sortKey: null,
      sortOrder: null,
    };
  },

  computed: {
    // Filtra los puntos de suministro según el término ingresado en "filter"
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) => {
        // Primero aplicamos el filtro general
        const generalFilter = Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        );

        // Luego aplicamos los filtros por columna
        const columnFilters = Object.entries(this.columnFilters).every(([key, value]) => {
          if (!value) return true; // Si no hay filtro para esta columna, no filtra
          
          // Caso especial para el filtro de CUPS
          if (key === 'cupsluz') {
            const cupsValue = this.getCupsValue(suministro);
            return cupsValue.toLowerCase().includes(value.toLowerCase());
          }
          
          // Caso especial para el filtro de tipo
          if (key === 'tipo') {
            const tipo = this.getTipoCups(suministro);
            return tipo.toLowerCase().includes(value.toLowerCase());
          }
          
          // Para el resto de columnas
          const fieldValue = String(suministro[key] || '').toLowerCase();
          return fieldValue.includes(value.toLowerCase());
        });

        return generalFilter && columnFilters;
      });
    },

    // Obtiene el contrato actual (aquel cuya fecha de finalización es posterior a hoy)
    contratoActual() {
      const ahora = new Date();
      return this.contratos.find(
        (contrato) => new Date(contrato.fechaFin) > ahora
      );
    },

    // Obtiene los contratos históricos (los que ya finalizaron)
    contratosHistoricos() {
      const ahora = new Date();
      return this.contratos.filter(
        (contrato) => new Date(contrato.fechaFin) <= ahora
      );
    },

    // Obtiene el servicio actual (vigente)
    servicioActual() {
      const ahora = new Date();
      return this.servicios.find(
        (servicio) => new Date(servicio.fechaFinServicio) > ahora
      );
    },

    // Obtiene los servicios históricos (finalizados)
    serviciosHistoricos() {
      const ahora = new Date();
      return this.servicios.filter(
        (servicio) => new Date(servicio.fechaFinServicio) <= ahora
      );
    },

    // Total de contratos activos
    totalContratos() {
      return this.puntosSuministro.filter(ps => ps.cupsluz || ps.cupsgas).length;
    },

    // Total de servicios activos
    totalServicios() {
      return Math.floor(this.puntosSuministro.length * 0.7);
    },

    sortedPuntosSuministro() {
      if (!this.sortKey || !this.sortOrder) return this.filteredPuntosSuministro;
      
      const sorted = [...this.filteredPuntosSuministro].sort((a, b) => {
        let aValue, bValue;
        
        if (this.sortKey === 'tipo') {
          // Primero ordenamos por tipo (Gas o Luz)
          const aTipo = this.getTipoCups(a);
          const bTipo = this.getTipoCups(b);
          
          if (aTipo !== bTipo) {
            return this.sortOrder === 'asc' 
              ? aTipo.localeCompare(bTipo)
              : bTipo.localeCompare(aTipo);
          }
          
          // Si son del mismo tipo, ordenamos por el valor del CUPS
          aValue = this.getCupsValue(a);
          bValue = this.getCupsValue(b);
        } else {
          aValue = a[this.sortKey];
          bValue = b[this.sortKey];
        }
        
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
    
    paginatedPuntosSuministro() {
      const start = (this.currentPage - 1) * parseInt(this.recordsPerPage);
      const end = start + parseInt(this.recordsPerPage);
      return this.sortedPuntosSuministro.slice(start, end);
    },
    
    totalPages() {
      return Math.ceil(this.filteredPuntosSuministro.length / parseInt(this.recordsPerPage));
    },
    
    paginationStart() {
      return (this.currentPage - 1) * parseInt(this.recordsPerPage) + 1;
    },
    
    paginationEnd() {
      const end = this.currentPage * parseInt(this.recordsPerPage);
      return end > this.filteredPuntosSuministro.length ? this.filteredPuntosSuministro.length : end;
    }
  },

  // Se ejecuta cuando el componente es creado para cargar datos iniciales
  created() {
    this.fetchPuntosSuministro();
  },

  methods: {
    // Carga todos los puntos de suministro desde la API
    async fetchPuntosSuministro() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`);
        this.puntosSuministro = response.data.map(punto => {
          const newPunto = { ...punto };
          if (newPunto.CUPSluz !== undefined) {
            newPunto.cupsluz = newPunto.CUPSluz;
            delete newPunto.CUPSluz;
          }
          if (newPunto.CUPSgas !== undefined) {
            newPunto.cupsgas = newPunto.CUPSgas;
            delete newPunto.CUPSgas;
          }
          return newPunto;
        });
      } catch (error) {
          console.error("Error al cargar los puntos de suministro:", error);
      } finally {
          this.loading = false;
      }
    },

    // Abre el formulario de actualización de un punto de suministro
    async abrirFormularioPSActualizar(ps) {
      if (!ps.id) return alert("Punto de suministro no válido");
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        this.modificarPunto = { ...response.data };
        this.modoConsulta = false;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
      }
    },

    // Cierra el formulario de actualización
    cerrarModal() {
      this.formularioVisible = false;
      this.modoConsulta = false;
    },

    // Actualiza un punto de suministro en la API
    async handleUpdate(datosAdaptados) {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/puntos-suministro`, datosAdaptados);
        await this.$swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Punto de suministro actualizado correctamente'
        });
        this.cerrarModal();
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error('Error al actualizar punto de suministro:', error);
        await this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar el punto de suministro: ' + (error.response?.data?.mensaje || error.message)
        });
      }
    },

    // Abre el modal de contratos con los datos del punto de suministro seleccionado
    async abrirModalContratos(idPuntoSuministro,idCliente) {
      try {
        // Obtener los contratos
        const responseContratos = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`);
        this.contratos = responseContratos.data;
        
        // Obtener la información completa del cliente
        const responseCliente = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`);
        this.modalCliente = responseCliente.data;
        
        // Obtener la información completa del punto de suministro desde el backend
        const responsePuntoSuministro = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${idPuntoSuministro}`);
        this.modalPuntoSuministro = responsePuntoSuministro.data;
        
        this.mostrarModalContratos = true;
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    },

    // Cierra el modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
    },

    // Abre el modal de servicios con los datos del punto de suministro seleccionado
    async abrirModalServicios(idPuntoSuministro, idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/punto-suministro/${idPuntoSuministro}`);
        this.servicios = response.data;
        const responseCliente = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`);
        this.modalCliente = responseCliente.data;
        this.modalPuntoSuministro = idPuntoSuministro;
        this.mostrarModalServicios = true;
      } catch (error) {
        console.error("Error al cargar servicios:", error);
      }
    },

    // Cierra el modal de contratos
    cerrarModalServicios() {
      this.mostrarModalServicios = false;
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

    filterByColumn(column, value) {
      this.columnFilters[column] = value;
    },

    isGas(suministro) {
      return suministro.cupsgas && suministro.cupsgas.trim() !== '' && 
             (!suministro.cupsluz || suministro.cupsluz.trim() === '');
    },

    isLuz(suministro) {
      return suministro.cupsluz && suministro.cupsluz.trim() !== '' && 
             (!suministro.cupsgas || suministro.cupsgas.trim() === '');
    },

    getCupsValue(suministro) {
      // Si tiene CUPS de luz y no está vacío, lo mostramos
      if (suministro.cupsluz && suministro.cupsluz.trim() !== '') {
        return suministro.cupsluz;
      }
      // Si tiene CUPS de gas y no está vacío, lo mostramos
      if (suministro.cupsgas && suministro.cupsgas.trim() !== '') {
        return suministro.cupsgas;
      }
      return '';
    },

    getTipoCups(suministro) {
      // Primero verificamos si tiene CUPS de luz válido
      if (suministro.cupsluz && suministro.cupsluz.trim() !== '') {
        return 'Luz';
      }
      // Luego verificamos si tiene CUPS de gas válido
      if (suministro.cupsgas && suministro.cupsgas.trim() !== '') {
        return 'Gas';
      }
      return '';
    },

    getTarifa(suministro) {
      if (this.isGas(suministro)) {
        return '3.1';
      } else if (this.isLuz(suministro)) {
        return '2.0TD';
      }
      return '-';
    },

    // Abre un modal para consultar los detalles de un punto de suministro
    async abrirModalPSConsulta(ps) {
      if (!ps.id) return alert("Punto de suministro no válido");
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        this.modificarPunto = { ...response.data };
        this.modoConsulta = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        alert("Error al cargar los detalles del punto de suministro.");
      }
    },

    exportarExcel() {
      try {
        // Verificar si hay datos para exportar
        if (!this.filteredPuntosSuministro || this.filteredPuntosSuministro.length === 0) {
          alert('No hay datos para exportar');
          return;
        }

        // Preparar los datos para la exportación con solo las columnas visibles
        const data = this.filteredPuntosSuministro.map(punto => ({
          'Cliente': punto.cliente || '-',
          'Dirección': `${punto.direccion}, ${punto.codigoPostal}, ${punto.poblacion}, ${punto.provincia}`,
          'Identificación': punto.identificacion || '-',
          'CUPS': punto.cupsluz || punto.cupsgas || '-',
          'Tipo': this.getTipoCups(punto) || '-',
          'Tarifa': this.getTarifa(punto) || '-'
        }));

        // Crear la hoja de cálculo
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajustar el ancho de las columnas
        const wscols = [
          {wch: 30}, // Cliente
          {wch: 50}, // Dirección
          {wch: 20}, // Identificación
          {wch: 25}, // CUPS
          {wch: 10}, // Tipo
          {wch: 10}  // Tarifa
        ];
        ws['!cols'] = wscols;

        // Crear el libro de Excel
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PuntosSuministro');

        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Puntos_Suministro_${fecha}.xlsx`;

        // Exportar el archivo
        XLSX.writeFile(wb, nombreArchivo);

      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar a Excel. Por favor, intente nuevamente.');
      }
    },

    getPuntoSuministroById(id) {
      return this.puntosSuministro.find(p => p.id === id) || null;
    },
  },

  // Se ejecuta cuando el componente es montado para cargar datos necesarios
  async mounted() {
    this.loading = true; // Forzar la visibilidad del spinner
    setTimeout(() => { 
      this.loading = false; 
    }, 2000); // Simular carga por 2 segundos
    //Precargamos los arrays de los combos
    try {
      const [comercializadoras, tarifasGas, tarifasLuz,gestoras,productos] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/comercializadoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-gas`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifasLuz`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/gestoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/productos`),
      ]);
      this.comercializadoras = comercializadoras.data;
      this.tarifasGas = tarifasGas.data;
      this.tarifasLuz = tarifasLuz.data;
      this.gestoras = gestoras.data;
      this.productos = productos.data;
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }
  },

  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    },
    // Añadir watchers para los filtros
    'columnFilters.cliente'() {
      this.currentPage = 1;
    },
    'columnFilters.direccion'() {
      this.currentPage = 1;
    },
    'columnFilters.cupsluz'() {
      this.currentPage = 1;
    },
    'columnFilters.tipo'() {
      this.currentPage = 1;
    },
    'columnFilters.tarifa'() {
      this.currentPage = 1;
    },
    filter() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
/* Grid layout para el contenedor principal */
.suministro-container {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 90%;
  margin: 0 auto;
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
  padding: 16px 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex: 1;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: var(--primary-color);
  color: white;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-right: 16px;
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

/* Tabla */
.table-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h2 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.table-responsive {
  overflow-x: auto;
  background-color: white;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  padding: 12px;
  vertical-align: top;
  background-color: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
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

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.tipo-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  justify-content: center;
}

.tipo-indicator.is-gas {
  background-color: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.tipo-indicator.is-luz {
  background-color: rgba(255, 235, 59, 0.2);
  color: #fbc02d;
}

/* Estilo para el texto dentro de los indicadores, forzando color negro */
.tipo-indicator span {
  color: #000; /* Negro */
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  min-width: 120px; /* Ancho mínimo para los botones de acción */
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  width: 35px;
  height: 35px;
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
  color: #43a047; /* Verde para ver contratos */
}
.btn-icon.btn-view:hover {
  background-color: rgba(67,160,71,0.1);
}

.btn-icon.btn-add {
  color: #ff9800; /* Naranja para ver servicios */
}
.btn-icon.btn-add:hover {
  background-color: rgba(255,152,0,0.1);
}

.btn-icon.btn-view-details {
  color: #007bff; /* Azul para ver detalles */
}
.btn-icon.btn-view-details:hover {
  background-color: rgba(0,123,255,0.1);
}

/* Paginación */
.pagination-controls {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-color);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-state i {
  margin-bottom: 16px;
}

/* Animaciones */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-excel {
  background-color: #217346;
  color: white;
  border: none;
}

.btn-excel:hover {
  background-color: #1e6b3d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 115, 70, 0.2);
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

/* Responsive */
@media (max-width: 768px) {
  .suministro-container {
    padding: 15px;
  }

  .stats-container {
    flex-direction: column;
    gap: 15px;
  }

  .data-table th,
  .data-table td {
    padding: 10px;
  }

  .data-table th {
    font-size: 0.9rem;
  }

  .data-table td {
    font-size: 0.85rem;
    height: 48px;
  }
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--hover-color);
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
</style>

