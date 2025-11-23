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
        <div class="table-actions">
          <button class="btn btn-refresh" @click="refreshData" title="Actualizar datos">
            <i class="fas fa-sync-alt"></i>
            <span>Actualizar</span>
          </button>
          <button class="btn btn-export btn-excel" v-if="nivelAcceso == 1" @click="exportarExcel" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
            <span>Excel</span>
          </button>
          <button 
            class="btn btn-toggle-baja" 
            :class="{ 'active': mostrarDadosDeBaja }"
            @click="toggleMostrarDadosDeBaja" 
            :title="mostrarDadosDeBaja ? 'Ocultar puntos dados de baja' : 'Mostrar puntos dados de baja'"
          >
            <i class="fas fa-ban"></i>
            <span>{{ mostrarDadosDeBaja ? 'Ocultar dados de baja' : 'Mostrar dados de baja' }}</span>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <div class="table-controls">
          <div class="filters-container">
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
              <th style="width: 12%">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('fechaFinUltimoContrato')">
                    <i class="fas fa-calendar-alt mr-2"></i>Fin Contrato
                    <i :class="getSortIcon('fechaFinUltimoContrato')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.fechaFinUltimoContrato" 
                      @input="filterByColumn('fechaFinUltimoContrato', $event.target.value)"
                      placeholder="Filtrar fecha..."
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
            <tr v-for="suministro in paginatedPuntosSuministro" :key="suministro.id" 
                :class="{ 'punto-dado-baja': estaDadoDeBaja(suministro) }">
              <td class="text-truncate" :title="suministro.cliente">
                <div class="cliente-cell">
                  <span v-if="estaDadoDeBaja(suministro)" class="baja-indicator" title="Dado de baja">
                    <i class="fas fa-ban"></i>
                  </span>
                  <span class="cliente-nombre">{{ suministro.cliente }}</span>
                </div>
              </td>
              <td class="text-truncate" :title="`${suministro.direccion}, ${suministro.codigoPostal}, ${suministro.poblacion}, ${suministro.provincia}`">
                {{ suministro.direccion }}, {{ suministro.codigoPostal }}, 
                {{ suministro.poblacion }}, {{ suministro.provincia }}
              </td>
              <td class="text-truncate" :title="suministro.identificacion">
                {{ suministro.identificacion}}
              </td>
              <td
                class="cups-cell"
                :title="getCupsParaMostrar(suministro)"
              >
                {{ getCupsParaMostrar(suministro) }}
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
                <div class="fecha-fin-contrato">
                  {{ getFechaFinUltimoContrato(suministro) }}
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
                  <button class="btn-icon btn-add" v-if="nivelAcceso !== 4" @click="abrirModalServicios(suministro.id,suministro.idCliente)" title="Ver servicios">
                    <i class="fas fa-tools"></i>
                  </button>
                  <button class="btn-icon btn-delete" v-if="nivelAcceso === 1" @click="eliminarPuntoSuministro(suministro)" title="Eliminar punto de suministro">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedPuntosSuministro.length === 0">
              <td colspan="8" class="text-center py-4">
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
      v-model:tarifasGas="tarifasGas"
      v-model:tarifasLuz="tarifasLuz"
      :contratoActual="contratoActual"
      :contratosHistoricos="contratosHistoricos"
      @cerrar-modal="cerrarModalContratos"
      @contrato-creado="handleContratoCreado"
      @contrato-actualizado="handleContratoActualizado"
      @contrato-renovado="handleContratoRenovado"
      @recargar-contratos="recargarContratosDelPuntoSuministro"
    />

    <!-- Modal de Servicios -->
    <ModalServicios v-if="modalCliente" 
      :visible="mostrarModalServicios" 
      :cargando="cargandoServicios"
      :cliente="modalCliente"
      :puntoSuministroSeleccionado="getPuntoSuministroById(modalPuntoSuministro)"
      :servicios="servicios"
      :gestoras="gestoras"
      :productos="productos"
      :servicioActual="servicioActual"
      :serviciosHistoricos="serviciosHistoricos"
      @cerrar-modal="cerrarModalServicios"
      @recargar-servicios="recargarServiciosDelPuntoSuministro"
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
import ExcelJS from 'exceljs';


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
      cargandoServicios: false,     // Estado para mostrar loading en modal de servicios
      nivelAcceso: null,               // Estado para mostrar el nivel de acceso del usuario
      puntosSuministro: [],         // Lista de puntos de suministro
      filter: "",                   // Filtro de búsqueda
      columnFilters: {
        cliente: '',
        direccion: '',
        identificacion: '',
        cupsluz: '',
        tipo: '',
        tarifa: '',
        fechaFinUltimoContrato: ''
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
      todosLosContratos: [], // Todos los contratos para calcular tarifas

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
      contratoActualData: null, // Almacena datos del contrato actual
      contratosHistoricosData: null, // Almacena datos de contratos históricos
      mostrarDadosDeBaja: false, // Control para mostrar/ocultar puntos dados de baja
    };
  },

  computed: {
    // Filtra los puntos de suministro según el término ingresado en "filter"
    filteredPuntosSuministro() {
      const filtered = this.puntosSuministro.filter((suministro) => {
        // Primero aplicamos el filtro de estado de baja
        const estadoBajaFilter = this.mostrarDadosDeBaja ? this.estaDadoDeBaja(suministro) : !this.estaDadoDeBaja(suministro);
        
        // Debug: mostrar información cuando se activa el filtro de dados de baja
        if (this.mostrarDadosDeBaja && Math.random() < 0.01) {
          // No hacer nada
        }

        // Luego aplicamos el filtro general
        const generalFilter = Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        );

        // Luego aplicamos los filtros por columna
        const columnFilters = Object.entries(this.columnFilters).every(([key, value]) => {
          if (!value) return true; // Si no hay filtro para esta columna, no filtra

          // Caso especial para el filtro de CUPS
          if (key === 'cupsluz') {
            const cupsValue = this.getCupsParaMostrar(suministro);
            return cupsValue.toLowerCase().includes(value.toLowerCase());
          }

          // Caso especial para el filtro de tipo
          if (key === 'tipo') {
            const tipo = this.getTipoCups(suministro);
            return tipo.toLowerCase().includes(value.toLowerCase());
          }

          // Caso especial para el filtro de tarifa (usa el valor mostrado en la tabla)
          if (key === 'tarifa') {
            const tarifa = this.getTarifa(suministro) || '-';
            // Permitir filtrar por '-', que representa sin contrato activo
            if (value.trim() === '-') {
              return tarifa === '-';
            }
            return tarifa.toLowerCase().includes(value.toLowerCase());
          }

          // Caso especial para el filtro de fecha fin del último contrato
          if (key === 'fechaFinUltimoContrato') {
            const fechaFin = this.getFechaFinUltimoContrato(suministro);
            // Permitir filtrar por '-', que representa sin fecha
            if (value.trim() === '-') {
              return fechaFin === '-';
            }
            return fechaFin.toLowerCase().includes(value.toLowerCase());
          }

          // Para el resto de columnas
          const fieldValue = String(suministro[key] || '').toLowerCase();
          return fieldValue.includes(value.toLowerCase());
        });

        return estadoBajaFilter && generalFilter && columnFilters;
      });
      
      return filtered;
    },

    // Obtiene el contrato actual (aquel cuya fecha de finalización es posterior a hoy)
    contratoActual() {
      // Si tenemos datos calculados previamente, los usamos
      if (this.contratoActualData) {
        return this.contratoActualData;
      }
      
      // Si no, calculamos como antes
      const ahora = new Date();
      return this.contratos.find(
        (contrato) => new Date(contrato.fechaFin) > ahora && 
                      new Date(contrato.fechaInicio) <= ahora
      ) || {};
    },

    // Obtiene los contratos históricos (los que ya finalizaron)
    contratosHistoricos() {
      // Si tenemos datos calculados previamente, los usamos
      if (this.contratosHistoricosData) {
        return this.contratosHistoricosData;
      }
      
      // Si no, calculamos como antes
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
      // Usar la información de tarifaActual que ya viene en los puntos de suministro
      // Esta información se calcula en el backend con contratos activos (fechaFin > CURRENT_DATE)
      const puntosConContratosActivos = this.puntosSuministro.filter(ps => 
        ps.tarifaActual && 
        ps.tarifaActual !== null && 
        ps.tarifaActual !== 'Sin Tarifa' && 
        ps.tarifaActual.trim() !== ''
      ).length;
      
      return puntosConContratosActivos;
    },

    // Total de servicios activos
    totalServicios() {
      // Por ahora mantenemos el cálculo estimado hasta implementar la carga de servicios
      // TODO: Implementar conteo real de servicios activos cuando esté disponible la API
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
      const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (usuario) {
          this.nivelAcceso = usuario.nivelAcceso;
        }
    },

  methods: {
    // Carga todos los puntos de suministro desde la API
    async fetchPuntosSuministro() {
      try {
        this.loading = true;
        
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`);
        
        
        this.puntosSuministro = response.data.map(punto => {
          const newPunto = { ...punto };
          
          // Normalizar nombres de campos CUPS
          if (newPunto.CUPSluz !== undefined) {
            newPunto.cupsluz = newPunto.CUPSluz;
            delete newPunto.CUPSluz;
          }
          if (newPunto.CUPSgas !== undefined) {
            newPunto.cupsgas = newPunto.CUPSgas;
            delete newPunto.CUPSgas;
          }
          
          // Asegurar que tarifaActual se mantiene y no es 'Sin Tarifa'
          if (newPunto.tarifaActual && newPunto.tarifaActual !== null) {
            if (newPunto.tarifaActual === 'Sin Tarifa') {
              newPunto.tarifaActual = null;
            } 
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
        // Cargar datos detallados del punto de suministro
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        
        // Intentar cargar las potencias desde el endpoint de cartera
        let puntoConPotencias = { ...response.data };
        
        // Si tenemos idCliente, intentar cargar desde cartera
        if (ps.idCliente) {
          try {
            const responseCartera = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${ps.idCliente}/cartera`);
            const puntoCartera = responseCartera.data.find(punto => punto.id === ps.id);
            
            if (puntoCartera) {
              
              // Combinar datos del endpoint detallado con las potencias del endpoint de cartera
              puntoConPotencias = {
                ...puntoConPotencias,
                potencia1: puntoCartera.potencia1 || 0,
                potencia2: puntoCartera.potencia2 || 0,
                potencia3: puntoCartera.potencia3 || 0,
                potencia4: puntoCartera.potencia4 || 0,
                potencia5: puntoCartera.potencia5 || 0,
                potencia6: puntoCartera.potencia6 || 0
              };
            } else {
              console.warn("No se encontró el punto en el endpoint de cartera");
              // Establecer potencias en 0
              puntoConPotencias = {
                ...puntoConPotencias,
                potencia1: 0,
                potencia2: 0,
                potencia3: 0,
                potencia4: 0,
                potencia5: 0,
                potencia6: 0
              };
            }
          } catch (carteraError) {
            console.warn("Error al cargar desde cartera:", carteraError);
            // Si falla la carga de cartera, usar valores por defecto
            puntoConPotencias = {
              ...puntoConPotencias,
              potencia1: 0,
              potencia2: 0,
              potencia3: 0,
              potencia4: 0,
              potencia5: 0,
              potencia6: 0
            };
          }
        } else {
          console.warn("No se encontró idCliente en el objeto ps");
          // Si no tenemos ID de cliente, establecer potencias en 0
          puntoConPotencias = {
            ...puntoConPotencias,
            potencia1: 0,
            potencia2: 0,
            potencia3: 0,
            potencia4: 0,
            potencia5: 0,
            potencia6: 0
          };
        }
        
        this.modificarPunto = puntoConPotencias;
        this.modoConsulta = false;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        if (this.$swal) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los detalles del punto de suministro'
          });
        }
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
    async abrirModalContratos(idPuntoSuministro, idCliente) {
      this.loading = true;
      
      // LIMPIAR COMPLETAMENTE todos los datos previos del modal
      this.contratos = [];
      this.contratoActualData = null;
      this.contratosHistoricosData = null;
      this.todosLosContratos = [];
      
      // Inicializar valores mínimos para que el modal se pueda abrir
      this.modalCliente = { id: idCliente, nombre: "Cargando..." };
      this.modalPuntoSuministro = { id: idPuntoSuministro };
      
      // Mostrar el modal inmediatamente para dar feedback
      this.mostrarModalContratos = true;
      
      // Establecer un límite máximo para el spinner de carga
      setTimeout(() => {
        if (this.loading) {
          this.loading = false;
        }
      }, 8000); // 8 segundos máximo
      
      try {
        // Cargar datos básicos primero - cliente y punto de suministro
        try {
          const [responseCliente, responsePuntoSuministro] = await Promise.all([
            axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`),
            axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${idPuntoSuministro}`)
          ]);
          
          this.modalCliente = responseCliente.data;
          // Asegurar que el ID se preserve
          this.modalCliente.id = idCliente;
          this.modalPuntoSuministro = responsePuntoSuministro.data;
          
        } catch (error) {
          console.error("Error al cargar datos del cliente o punto de suministro:", error);
        }
        
        // Cargar tarifas, contratos y demás datos en paralelo
        try {
          // Cargar tarifas primero - estas son rápidas y necesarias
          const [tarifasGasResponse, tarifasLuzResponse] = await Promise.all([
            axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-gas`),
            axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-luz`)
          ]);
          
          // Actualizar tarifas inmediatamente
          this.tarifasGas = tarifasGasResponse.data;
          this.tarifasLuz = tarifasLuzResponse.data;
          
          // Ahora cargar contratos específicos del punto - esto es rápido y lo necesitamos
          const responseContratos = await axios.get(
            `${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`
          );
          
          // Cargar solo los contratos necesarios
          this.contratos = responseContratos.data;
          
          // No cargar todos los contratos si son demasiados - esto puede ser muy lento
          // Podemos obtener la información mínima necesaria
          try {
            // Esta llamada podría ser lenta con 5000+ contratos, pero no bloqueamos la interfaz
            const responseTodosContratos = await axios.get(
              `${process.env.VUE_APP_API_URL}/api/contratos?limit=100`
            );
            
            // Actualizar sólo si recibimos datos
            if (responseTodosContratos.data && responseTodosContratos.data.length > 0) {
              this.todosLosContratos = responseTodosContratos.data;
            }
          } catch (error) {
            console.error("Error al cargar todos los contratos:", error);
            // No interrumpir el flujo si falla esta llamada
          }
          
          // Actualizar las tarifas y contratos - ya tenemos los datos específicos
          // No repetimos la asignación de tarifasGas y tarifasLuz aquí
          this.contratos = responseContratos.data;
          
          // Calcular el contrato actual y los históricos
          const ahora = new Date();
          // No asignamos directamente a las propiedades computadas
          const contratoActualTemp = this.contratos.find(contrato => 
            new Date(contrato.fechaInicio) <= ahora && new Date(contrato.fechaFin) > ahora
          ) || {};
          const contratosHistoricosTemp = this.contratos.filter(contrato => 
            new Date(contrato.fechaFin) <= ahora
          );
          
          // Guardamos las referencias para usarlas en la interfaz
          this.contratoActualData = contratoActualTemp;
          this.contratosHistoricosData = contratosHistoricosTemp;
        } catch (error) {
          console.error("Error al cargar tarifas o contratos:", error);
          // Asegurar que tenemos arrays vacíos en lugar de null
          if (!this.tarifasGas) this.tarifasGas = [];
          if (!this.tarifasLuz) this.tarifasLuz = [];
          if (!this.contratos) this.contratos = [];
          if (!this.todosLosContratos) this.todosLosContratos = [];
          if (!this.contratosHistoricos) this.contratosHistoricos = [];
        }
      } catch (error) {
        console.error("Error general al abrir el modal de contratos:", error);
      } finally {
        this.loading = false;
        
        // Forzar actualización para asegurar que el componente se renderiza correctamente
        this.$nextTick(() => {
          this.$forceUpdate();
        });
      }
    },

    // Cierra el modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
      // Limpiar datos del modal para evitar mostrar información del punto anterior
      this.contratos = [];
      this.contratoActualData = null;
      this.contratosHistoricosData = null;
      this.modalCliente = null;
      this.modalPuntoSuministro = null;
    },

    // Eliminar punto de suministro con confirmación
    async eliminarPuntoSuministro(puntoSuministro) {
      try {
        const result = await this.$swal.fire({
          title: '¿Estás seguro?',
          text: `¿Deseas eliminar el punto de suministro ${puntoSuministro.CUPSluz || puntoSuministro.CUPSgas || 'sin CUPS'}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          // Mostrar loading
          this.$swal.fire({
            title: 'Eliminando...',
            text: 'Por favor, espere mientras se elimina el punto de suministro.',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              this.$swal.showLoading();
            }
          });

          // Realizar la eliminación
          await axios.delete(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${puntoSuministro.id}`);
          
          // Mostrar mensaje de éxito
          await this.$swal.fire({
            title: 'Eliminado',
            text: 'El punto de suministro ha sido eliminado correctamente.',
            icon: 'success',
            confirmButtonColor: 'rgba(252, 215, 0)',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
          });

          // Recargar la lista
          await this.fetchPuntosSuministro();
        }
      } catch (error) {
        console.error('Error al eliminar punto de suministro:', error);
        this.$swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el punto de suministro. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    // Método para refrescar todos los datos manualmente
    async refreshData() {
      await this.fetchPuntosSuministro();
    },

    // Maneja la creación de un nuevo contrato (simplificado - sin recarga automática)
    async handleContratoCreado() {
      // Mostrar mensaje informativo al usuario
      this.$swal.fire({
        title: 'Contrato creado',
        text: 'El contrato se ha creado correctamente. Usa el botón "Actualizar" para ver los cambios en la tabla.',
        icon: 'success',
        confirmButtonColor: 'rgba(252, 215, 0)',
        confirmButtonText: 'Entendido',
        timer: 3000,
        timerProgressBar: true
      });
    },

    // Maneja la actualización de un contrato existente
    async handleContratoActualizado() {
      
      // Recargar automáticamente los contratos para reflejar los cambios
      await this.recargarContratosDelPuntoSuministro();
      
      // Mostrar mensaje de confirmación
      this.$swal.fire({
        title: 'Contrato actualizado',
        text: 'El contrato se ha actualizado correctamente y la lista se ha refrescado.',
        icon: 'success',
        confirmButtonColor: 'rgba(252, 215, 0)',
        confirmButtonText: 'Entendido',
        timer: 2000,
        timerProgressBar: true
      });
    },

    // Maneja la renovación de un contrato
    async handleContratoRenovado() {
      // Recargar automáticamente los contratos para reflejar los cambios
      await this.recargarContratosDelPuntoSuministro();
      
      // Mostrar mensaje de confirmación
      this.$swal.fire({
        title: 'Contrato renovado',
        text: 'El contrato se ha renovado correctamente y la lista se ha refrescado.',
        icon: 'success',
        confirmButtonColor: 'rgba(252, 215, 0)',
        confirmButtonText: 'Entendido',
        timer: 2000,
        timerProgressBar: true
      });
    },

    // Método para recargar específicamente los contratos del punto de suministro actual
    async recargarContratosDelPuntoSuministro() {
      if (!this.modalPuntoSuministro?.id) {
        console.warn('No hay punto de suministro seleccionado para recargar contratos');
        return;
      }

      try {
        
        // Recargar contratos del punto de suministro actual
        const responseContratos = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${this.modalPuntoSuministro.id}`
        );
        this.contratos = responseContratos.data;

        // Recalcular el contrato actual
        const ahora = new Date();
        this.contratoActual = this.contratos.find(contrato => {
          const fechaFin = new Date(contrato.fechaFin);
          const fechaInicio = new Date(contrato.fechaInicio);
          return fechaInicio <= ahora && fechaFin > ahora;
        }) || null;

        // Separar contratos históricos (los que no están vigentes)
        this.contratosHistoricos = this.contratos.filter(contrato => {
          const fechaFin = new Date(contrato.fechaFin);
          const fechaInicio = new Date(contrato.fechaInicio);
          return !(fechaInicio <= ahora && fechaFin > ahora);
        });

      } catch (error) {
        console.error('Error al recargar contratos:', error);
        this.$swal.fire({
          title: 'Error',
          text: 'No se pudieron recargar los contratos. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    // Abre el modal de servicios con los datos del punto de suministro seleccionado
    async abrirModalServicios(idPuntoSuministro, idCliente) {
      try {
        // Activar loading
        this.cargandoServicios = true;
        this.mostrarModalServicios = true; // Mostrar modal inmediatamente con loading
        
        // Esperar a que productos y gestoras estén cargados
        if (!this.productos.length) {
          const productosResp = await axios.get(`${process.env.VUE_APP_API_URL}/api/productos`);
          this.productos = productosResp.data;
        }
        if (!this.gestoras.length) {
          const gestorasResp = await axios.get(`${process.env.VUE_APP_API_URL}/api/gestoras`);
          this.gestoras = gestorasResp.data;
        }
        
        // Cargar datos básicos del cliente primero
        const responseCliente = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`);
        this.modalCliente = responseCliente.data;
        this.modalCliente.id = idCliente;
        this.modalPuntoSuministro = idPuntoSuministro;
        
        // Ahora cargar servicios (la parte más lenta)
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/punto-suministro/${idPuntoSuministro}`);
        
        // Cargar datos de pagos para cada servicio
        const serviciosConPagos = await this.cargarDatosDePagosParaServicios(response.data);
        this.servicios = serviciosConPagos;
        
        // Desactivar loading
        this.cargandoServicios = false;
      } catch (error) {
        console.error("Error al cargar servicios/productos/gestoras:", error);
        this.cargandoServicios = false; // Asegurar que se desactive en caso de error
      }
    },

    // Cierra el modal de contratos
    cerrarModalServicios() {
      this.mostrarModalServicios = false;
    },

    // Carga los datos de pagos para una lista de servicios
    async cargarDatosDePagosParaServicios(servicios) {
      // Crear promesas para cargar datos de pagos en paralelo
      const promesasPagos = servicios.map(async (servicio) => {
        try {
          // Intentar cargar los datos de pagos para este servicio
          const responsePagos = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicio.id}`);
          
          // Crear una copia del servicio con los datos de pagos
          return {
            ...servicio,
            pagos: responsePagos.data
          };
        } catch (error) {
          // Si no hay datos de pagos para este servicio, mantenerlo sin pagos
          console.warn(`No se encontraron datos de pagos para el servicio ${servicio.id}:`, error.message);
          return {
            ...servicio,
            pagos: null
          };
        }
      });
      
      // Esperar a que todas las llamadas se completen
      const serviciosConPagos = await Promise.all(promesasPagos);
      return serviciosConPagos;
    },

    // Recarga los servicios del punto de suministro actual
    async recargarServiciosDelPuntoSuministro() {
      if (!this.modalPuntoSuministro) {
        console.warn('No hay punto de suministro seleccionado para recargar servicios');
        return;
      }
      
      try {
        // Activar loading durante la recarga
        this.cargandoServicios = true;
        
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/punto-suministro/${this.modalPuntoSuministro}`);
        
        // Cargar datos de pagos para cada servicio
        const serviciosConPagos = await this.cargarDatosDePagosParaServicios(response.data);
        this.servicios = serviciosConPagos;
        
        // Desactivar loading
        this.cargandoServicios = false;
      } catch (error) {
        console.error('Error al recargar servicios:', error);
        this.cargandoServicios = false; // Asegurar que se desactive en caso de error
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

    // Método mejorado para obtener el CUPS que se debe mostrar en la tabla
    getCupsParaMostrar(suministro) {
      // Si tiene ambos CUPS, mostrar el que corresponda al tipo principal
      if (this.isLuz(suministro)) {
        return suministro.cupsluz || '';
      } else if (this.isGas(suministro)) {
        return suministro.cupsgas || '';
      }
      
      // Fallback: mostrar el que tenga valor
      if (suministro.cupsluz && suministro.cupsluz.trim() !== '') {
        return suministro.cupsluz;
      }
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
      // Usar la tarifa actual que ya viene calculada desde el backend
      if (suministro.tarifaActual && suministro.tarifaActual !== 'Sin Tarifa' && suministro.tarifaActual.trim() !== '') {
        return suministro.tarifaActual;
      }
      
      // Si no hay tarifa disponible, mostrar guión
      return '-';
    },

    getFechaFinUltimoContrato(suministro) {
      // Verificar si tiene fecha fin del último contrato
      if (suministro.fechaFinUltimoContrato && suministro.fechaFinUltimoContrato !== null) {
        // Formatear la fecha para mostrar
        const fecha = new Date(suministro.fechaFinUltimoContrato);
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      
      // Si no hay fecha disponible, mostrar guión
      return '-';
    },




    // Método inteligente para corregir solo las tarifas que realmente están incorrectas
    async corregirTarifasIncorrectasInteligente() {
      
      // Identificar puntos que necesitan corrección de tarifa
      const puntosSinTarifa = this.puntosSuministro.filter(punto => 
        punto.tarifaActual === null ||
        punto.tarifaActual === undefined ||
        !punto.tarifaActual || 
        punto.tarifaActual === 'Sin Tarifa' || 
        punto.tarifaActual.trim() === ''
      );
      if (puntosSinTarifa.length === 0) {
        return; // No hay puntos que corregir
      }
      
      // Priorizar el punto específico problemático (ID 44413)
      const puntoProblematico = puntosSinTarifa.find(p => p.id === 44413);
      let puntosACorregir;
      
      if (puntoProblematico) {
        // Si encontramos el punto problemático, procesarlo primero
        puntosACorregir = [puntoProblematico, ...puntosSinTarifa.filter(p => p.id !== 44413).slice(0, 4)];
      } else {
        // Procesar hasta 5 puntos sin tarifa para no sobrecargar
        puntosACorregir = puntosSinTarifa.slice(0, 5);
      }
      
      // Ejecutar correcciones en paralelo para mayor velocidad
      const promesasCorreccion = puntosACorregir.map(async (punto) => {
        try {
          const tarifaCorregida = await this.calcularTarifaActual(punto);
          if (tarifaCorregida) {
            return true;
          } else {
            // No hacer nada
          }
        } catch (error) {
          console.warn(`Error al corregir punto ${punto.id}:`, error.message);
        }
        return false;
      });
      
      // Esperar a que se completen todas las correcciones
      const resultados = await Promise.all(promesasCorreccion);
      const puntosCorregidos = resultados.filter(r => r).length;
      
      if (puntosCorregidos > 0) {
        this.$forceUpdate(); // Actualizar vista solo si hubo cambios
      } else {
        // No hacer nada
      }
    },

    // Función de fallback para calcular la tarifa actual cuando el backend no la proporciona correctamente
    async calcularTarifaActual(suministro) {
      try {
        // Hacer una consulta específica para obtener la tarifa del contrato vigente
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${suministro.id}`);
        const contratos = response.data;
        
        if (!contratos || contratos.length === 0) {
          return null;
        }
        
        // Encontrar el contrato vigente (fechaFin > hoy)
        const ahora = new Date();
        const contratosVigentes = contratos.filter(contrato => {
          const fechaFin = new Date(contrato.fechaFin);
          const fechaInicio = new Date(contrato.fechaInicio);
          return fechaInicio <= ahora && fechaFin > ahora;
        });
        
        if (contratosVigentes.length === 0) {
          return null;
        }
        
        // Si hay múltiples contratos vigentes, tomar el más reciente (mayor ID)
        const contratoVigente = contratosVigentes.reduce((masReciente, actual) => {
          return actual.id > masReciente.id ? actual : masReciente;
        });
        
        // Obtener la tarifa del contrato vigente
        let tarifa = null;
        
        // Buscar tarifa de luz primero, luego gas
        if (contratoVigente.idTarifaLuz && contratoVigente.tarifaLuz) {
          tarifa = contratoVigente.tarifaLuz.nombre;
        } else if (contratoVigente.idTarifaGas && contratoVigente.tarifaGas) {
          tarifa = contratoVigente.tarifaGas.nombre;
        }
        
        // Si encontramos una tarifa válida, actualizar el punto en memoria
        if (tarifa && tarifa !== 'Sin Tarifa' && tarifa.trim() !== '') {
          // Actualizar el punto en el array para futuras consultas
          const puntoIndex = this.puntosSuministro.findIndex(p => p.id === suministro.id);
          if (puntoIndex !== -1) {
            this.puntosSuministro[puntoIndex].tarifaActual = tarifa;
          }
          return tarifa;
        }
        
        return null;
      } catch (error) {
        console.warn('Error al calcular tarifa actual para punto', suministro.id, ':', error.message);
        return null;
      }
    },

    // Abre un modal para consultar los detalles de un punto de suministro
    async abrirModalPSConsulta(ps) {
      if (!ps.id) return alert("Punto de suministro no válido");
      try {
        // Cargar datos detallados del punto de suministro
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        
        // Combinar datos del endpoint con las potencias del punto original (igual que en PuntosSuministroClienteComponent)
        this.modificarPunto = { 
          ...response.data,
          // Agregar las potencias desde el punto original que ya las tiene
          potencia1: ps.potencia1 || 0,
          potencia2: ps.potencia2 || 0,
          potencia3: ps.potencia3 || 0,
          potencia4: ps.potencia4 || 0,
          potencia5: ps.potencia5 || 0,
          potencia6: ps.potencia6 || 0
        };
        
        this.modoConsulta = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        if (this.$swal) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar los detalles del punto de suministro'
          });
        }
      }
    },

    async exportarExcel() {
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
          'Identificación': punto.identificacion,
          'CUPS': punto.cupsluz || punto.cupsgas || '-',
          'Tipo': this.getTipoCups(punto) || '-',
          'Tarifa': this.getTarifa(punto) || '-',
          'Fin Contrato': this.getFechaFinUltimoContrato(punto) || '-',
          'Estado': this.estaDadoDeBaja(punto) ? 'Dado de baja' : 'Activo'
        }));

        // Crear el libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PuntosSuministro');

        // Configurar columnas con anchos
        worksheet.columns = [
          { header: 'Cliente', key: 'Cliente', width: 30 },
          { header: 'Dirección', key: 'Dirección', width: 50 },
          { header: 'Identificación', key: 'Identificación', width: 20 },
          { header: 'CUPS', key: 'CUPS', width: 25 },
          { header: 'Tipo', key: 'Tipo', width: 10 },
          { header: 'Tarifa', key: 'Tarifa', width: 10 },
          { header: 'Fin Contrato', key: 'Fin Contrato', width: 15 },
          { header: 'Estado', key: 'Estado', width: 15 }
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

        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Puntos_Suministro_${fecha}.xlsx`;

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.click();
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar a Excel. Por favor, intente nuevamente.');
      }
    },

    getPuntoSuministroById(id) {
      return this.puntosSuministro.find(p => p.id === id) || null;
    },

    // Verifica si un punto de suministro está dado de baja
    estaDadoDeBaja(suministro) {
      // Debug: mostrar información del punto para verificar los campos
      if (this.mostrarDadosDeBaja && Math.random() < 0.01) { // Solo 1% de las veces para no saturar
          // No hacer nada
      }
      
      // Un punto está dado de baja si tiene fechaBaja y no es null
      // También verificar si viene como fecha_baja (snake_case)
      return (suministro.fechaBaja && suministro.fechaBaja !== null && suministro.fechaBaja !== '') ||
             (suministro.fecha_baja && suministro.fecha_baja !== null && suministro.fecha_baja !== '');
    },

    // Maneja el cambio en el filtro de dados de baja
    handleFilterChange() {
      this.currentPage = 1; // Resetear a la primera página cuando cambie el filtro
    },

    // Alterna la visualización de puntos dados de baja
    toggleMostrarDadosDeBaja() {
      this.mostrarDadosDeBaja = !this.mostrarDadosDeBaja;
      this.currentPage = 1; // Resetear a la primera página cuando cambie el filtro
    },

  },

  // Se ejecuta cuando el componente es montado para cargar datos necesarios
  async mounted() {
    this.loading = true; // Forzar la visibilidad del spinner
    
    // Precargamos los arrays de los combos y datos necesarios
    try {
      
      const [comercializadoras, tarifasGas, tarifasLuz, gestoras, productos] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/comercializadoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-gas`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-luz`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/gestoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/productos`),
      ]);
      
      this.comercializadoras = comercializadoras.data;
      this.tarifasGas = tarifasGas.data;
      this.tarifasLuz = tarifasLuz.data;
      this.gestoras = gestoras.data;
      this.productos = productos.data;
      
      // Ya no necesitamos cargar todos los contratos aquí
      // La información de contratos activos viene en el campo tarifaActual de los puntos de suministro
      this.todosLosContratos = [];
      
      // Forzar una actualización de la vista para que se apliquen bien los datos de tarifa
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      // En caso de error, inicializar arrays vacíos para evitar errores
      this.todosLosContratos = [];
    } finally {
      setTimeout(() => { 
        this.loading = false; 
      }, 2500); // Dar tiempo para que se procesen los datos
    }
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
  gap: 1rem;
  padding: 1rem;
  max-width: 90%;
  margin: 0 auto;
}

/* Panel de estadísticas */
.stats-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.stats-container {
  display: flex;
  flex: 1;
  gap: 1rem;
}

.stat-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex: 1;
}

.stat-icon {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: var(--primary-color);
  color: white;
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

/* Tabla */
.table-panel {
  background: white;
  border-radius: 0.7rem;
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
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
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
  padding: 0.6rem;
  vertical-align: top;
  background-color: var(--surface-color);
  border-bottom: 2px solid var(--border-color);
}

.data-table th {
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 0.8rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: 46px; /* Altura fija para las filas */
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Mostrar CUPS completo, sin cortar ni puntos suspensivos */
.data-table td.cups-cell {
  white-space: nowrap !important; /* Cambia a nowrap para evitar saltos de línea */
  overflow: hidden !important; 
  text-overflow: ellipsis !important; /* Muestra puntos suspensivos si no cabe */
  max-width: 600px; 
}

.data-table td.text-truncate[title*="CUPS"] span,
.data-table td.text-truncate[title*="cupsluz"] span,
.data-table td.text-truncate[title*="cupsgas"] span {
  white-space: normal !important;
  word-break: break-all !important;
  text-overflow: ellipsis !important;
  overflow: visible !important;
}

.column-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.column-title {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 0.2rem;
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
  font-size:12px;
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

.btn-icon.btn-delete {
  color: #dc3545; /* Rojo para eliminar */
}
.btn-icon.btn-delete:hover {
  background-color: rgba(220,53,69,0.1);
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
  gap: 8px;
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

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  background-color: #17a2b8;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-refresh:hover {
  background-color: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.2);
}

.btn-refresh i {
  font-size: 14px;
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

.btn-toggle-baja {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  background-color: #6c757d;
  color: white;
  border: none;
  cursor: pointer;
}

.btn-toggle-baja:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.2);
}

.btn-toggle-baja.active {
  background-color: #dc3545;
}

.btn-toggle-baja.active:hover {
  background-color: #c82333;
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.btn-toggle-baja i {
  font-size: 14px;
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
  font-size: 1em;
  color: var(--text-secondary);
}

.sortable .column-title {
  color: var(--text-primary);
  font-weight: 600;
}

.sortable .column-title:hover {
  color: var(--primary-color);
}

/* Estilos para puntos dados de baja */
.punto-dado-baja {
  background-color: rgba(220, 53, 69, 0.05) !important;
  opacity: 0.7;
}

.punto-dado-baja:hover {
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

/* Estilos para los controles de filtro */
.table-controls {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Estilos para la columna de fecha fin del último contrato */
.fecha-fin-contrato {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: 500;
}

.fecha-fin-contrato:empty::before {
  content: '-';
  color: var(--text-secondary);
}
</style>

