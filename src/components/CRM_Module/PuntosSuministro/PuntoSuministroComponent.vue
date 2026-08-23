<template>
  <div class="suministro-container fade-in">
    <!-- Panel superior con stats y botón de crear-->
    <div class="stats-panel">
      <div class="stats-container">
<div class="stat-card stat-card--puntos">
          <div class="stat-icon">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedPuntos }}</div>
            <div class="stat-label">Total Puntos</div>
          </div>
        </div>
<div class="stat-card stat-card--contratos">
          <div class="stat-icon">
            <i class="fas fa-file-contract"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedContratos }}</div>
            <div class="stat-label">Contratos Activos</div>
          </div>
        </div>
<div class="stat-card stat-card--servicios">
          <div class="stat-icon">
            <i class="fas fa-tools"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ animatedServicios }}</div>
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
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable th-col-cliente">
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
                      @input="filterByColumnDebounced('cliente', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-direccion">
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
                      @input="filterByColumnDebounced('direccion', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-identificacion">
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
                      @input="filterByColumnDebounced('identificacion', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="sortable th-col-cups">
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
                      @input="filterByColumnDebounced('cupsluz', $event.target.value)"
                      placeholder="Filtrar CUPS..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-tipo">
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
                      @input="filterByColumnDebounced('tipo', $event.target.value)"
                      placeholder="Filtrar tipo..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-tarifa">
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
                      @input="filterByColumnDebounced('tarifa', $event.target.value)"
                      placeholder="Filtrar tarifa..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-fincontrato">
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
                      @input="filterByColumnDebounced('fechaFinUltimoContrato', $event.target.value)"
                      placeholder="Filtrar fecha..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-noswitching">
                <div class="column-header minimal-header">
                  <div class="column-title" @click="sortBy('noSwitching')" title="No-Switching - Haz clic para ordenar">
                    <i class="fas fa-network-wired"></i>
                    <i :class="getSortIcon('noSwitching')"></i>
                  </div>
                </div>
              </th>
              <th class="th-col-acciones-ps">
                <div class="column-header">
                  <div class="column-title">
                    <i class="fas fa-cogs mr-2"></i>Acciones
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="n in 8" :key="'skeleton-' + n" class="skeleton-row">
                <td v-for="col in 9" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>
            <tr v-for="suministro in paginatedPuntosSuministro" v-show="!loading" :key="suministro.id"
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
              <td class="td-tipo-cups">
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
              <td class="td-noswitching">
                <div class="noswitching-cell-content">
                  <div v-if="tieneServiciosNoSwitching(suministro.id)" class="no-switching-indicator" title="Este punto de suministro contiene servicios que no son Switching">
                    <i class="fas fa-exclamation-circle"></i>
                  </div>
                  <div v-else class="no-switching-empty">-</div>
                </div>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon btn-view-details" @click="abrirModalPSConsulta(suministro)" title="Consultar punto de suministro" aria-label="Consultar punto de suministro">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon btn-edit" @click="abrirFormularioPSActualizar(suministro)" title="Modificar punto de suministro" aria-label="Modificar punto de suministro">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-view" @click="abrirModalContratos(suministro.id,suministro.idCliente)" title="Ver contratos">
                    <i class="fas fa-file-contract"></i>
                  </button>
                  <button class="btn-icon btn-add" v-if="nivelAcceso === 1" @click="abrirModalServicios(suministro.id,suministro.idCliente)" title="Ver servicios">
                    <i class="fas fa-tools"></i>
                  </button>
                  <button class="btn-icon btn-delete" v-if="nivelAcceso === 1" @click="eliminarPuntoSuministro(suministro)" title="Eliminar punto de suministro">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && paginatedPuntosSuministro.length === 0">
              <td colspan="9" class="text-center py-4">
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
      :tarifasGas="tarifasGas"
      :tarifasLuz="tarifasLuz"
      :contratoActual="contratoActual"
      :contratosHistoricos="contratosHistoricos"
      @cerrar-modal="cerrarModalContratos"
      @contrato-creado="handleContratoCreado"
      @contrato-actualizado="handleContratoActualizado"
      @contrato-renovado="handleContratoRenovado"
      @recargar-contratos="recargarContratosDelPuntoSuministro"
      @update:tarifasGas="tarifasGas = $event"
      @update:tarifasLuz="tarifasLuz = $event"
    />

    <!-- Modal de Servicios -->
    <ModalServicios v-if="modalCliente && modalPuntoSuministro" 
      :visible="mostrarModalServicios" 
      :cargando="cargandoServicios"
      :cliente="modalCliente"
      :puntoSuministroSeleccionado="getPuntoSuministroById(modalPuntoSuministro) || {}"
      :servicios="servicios"
      :gestoras="gestoras"
      :productos="productos"
      :comercializadoras="comercializadoras"
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
import ExcelJS from 'exceljs';


export default {
  name: "PuntosSuministro", // Nombre del componente
  components: {
    ModalActualizarPuntoSuministro,
    ModalContratos,
    ModalServicios
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
        fechaFinUltimoContrato: '',
        noSwitching: ''
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
      // Contadores animados
      animatedPuntos: 0,
      animatedContratos: 0,
      animatedServicios: 0,
      filtrosTimer: null, // Timer para debounce de filtros
      currentContratosRequestId: null, // ID de la solicitud actual para evitar race conditions
      puntosConServiciosNoSwitching: new Set(), // Cachea puntos con servicios no-switching
      totalServiciosActivosReal: 0, // Conteo real de servicios activos obtenido del backend
    };
  },

  computed: {
    // Filtra los puntos de suministro según el término ingresado en "filter"
    filteredPuntosSuministro() {
      // Pre-calcular valores de filtro en minúsculas una sola vez
      const filterLower = this.filter.toLowerCase();
      const hasGeneralFilter = filterLower.length > 0;
      
      // Pre-calcular filtros de columna activos
      const activeColumnFilters = Object.entries(this.columnFilters)
        .filter(([, value]) => value && value.trim().length > 0)
        .map(([key, value]) => ({ key, value: value.toLowerCase(), originalValue: value.trim() }));
      const hasColumnFilters = activeColumnFilters.length > 0;

      const filtered = this.puntosSuministro.filter((suministro) => {
        // Primero aplicamos el filtro de estado de baja (rápido)
        const estadoBajaFilter = this.mostrarDadosDeBaja ? this.estaDadoDeBaja(suministro) : !this.estaDadoDeBaja(suministro);
        if (!estadoBajaFilter) return false;

        // Luego aplicamos el filtro general (si existe)
        if (hasGeneralFilter) {
          const generalFilter = Object.values(suministro).some((value) =>
            String(value).toLowerCase().includes(filterLower)
          );
          if (!generalFilter) return false;
        }

        // Luego aplicamos los filtros por columna (si existen)
        if (hasColumnFilters) {
          for (const { key, value, originalValue } of activeColumnFilters) {
            let fieldValue;
            
            // Caso especial para el filtro de no-switching
            if (key === 'noSwitching') {
              const tieneNoSwitching = this.tieneServiciosNoSwitching(suministro.id);
              if (originalValue === 'si' && !tieneNoSwitching) return false;
              if (originalValue === 'no' && tieneNoSwitching) return false;
              continue;
            }
            // Caso especial para el filtro de CUPS
            else if (key === 'cupsluz') {
              fieldValue = this.getCupsParaMostrar(suministro).toLowerCase();
            }
            // Caso especial para el filtro de tipo
            else if (key === 'tipo') {
              fieldValue = this.getTipoCups(suministro).toLowerCase();
            }
            // Caso especial para el filtro de tarifa
            else if (key === 'tarifa') {
              fieldValue = (this.getTarifa(suministro) || '-').toLowerCase();
              if (originalValue === '-') {
                if (fieldValue !== '-') return false;
                continue;
              }
            }
            // Caso especial para el filtro de fecha fin
            else if (key === 'fechaFinUltimoContrato') {
              fieldValue = this.getFechaFinUltimoContrato(suministro).toLowerCase();
              if (originalValue === '-') {
                if (fieldValue !== '-') return false;
                continue;
              }
            }
            // Para el resto de columnas
            else {
              fieldValue = String(suministro[key] || '').toLowerCase();
            }
            
            if (!fieldValue.includes(value)) return false;
          }
        }

        return true;
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
      return this.totalServiciosActivosReal;
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
        } else if (this.sortKey === 'noSwitching') {
          // Ordenar por si tienen servicios no-switching
          const aHasNoSwitching = this.tieneServiciosNoSwitching(a.id) ? 1 : 0;
          const bHasNoSwitching = this.tieneServiciosNoSwitching(b.id) ? 1 : 0;
          
          if (this.sortOrder === 'asc') {
            return aHasNoSwitching - bHasNoSwitching;
          } else {
            return bHasNoSwitching - aHasNoSwitching;
          }
        } else {
          aValue = a[this.sortKey];
          bValue = b[this.sortKey];
        }
        
        if (this.sortKey !== 'noSwitching') {
          aValue = aValue ?? '';
          bValue = bValue ?? '';
          
          if (this.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
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
      // Los puntos de suministro se cargan en mounted() después de cargar los datos de configuración
      const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (usuario) {
          this.nivelAcceso = usuario.nivelAcceso;
        }
    },

  methods: {
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
    },
    // Carga todos los puntos de suministro desde la API
    async fetchPuntosSuministro() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/all`);
        
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los puntos de suministro'
        });
      }
    },

    // Abre el formulario de actualización de un punto de suministro
    async abrirFormularioPSActualizar(ps) {
      if (!ps.id) {
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Punto de suministro no válido'
        })
        return
      }
      try {
        // Cargar datos detallados del punto de suministro
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/${ps.id}`);
        
        // Intentar cargar las potencias desde el endpoint de cartera
        let puntoConPotencias = { ...response.data };
        
        // Si tenemos idCliente, intentar cargar desde cartera
        if (ps.idCliente) {
          try {
            const responseCartera = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/cliente/${ps.idCliente}/cartera`);
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
            } else {// Establecer potencias en 0
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
          } catch (carteraError) {// Si falla la carga de cartera, usar valores por defecto
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
        } else {// Si no tenemos ID de cliente, establecer potencias en 0
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
        await axios.post(`${process.env.VUE_APP_API_URL}/puntos-suministro`, datosAdaptados);
        const esReactivacion = datosAdaptados.fechaBaja === null && this.modificarPunto.fechaBaja;
        await this.$swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: esReactivacion ? 'Punto de suministro reactivado correctamente' : 'Punto de suministro actualizado correctamente'
        });
        this.cerrarModal();
        if (esReactivacion && this.mostrarDadosDeBaja) {
          this.mostrarDadosDeBaja = false;
        }
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error('Error al actualizar punto de suministro:', error);
        await this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar el punto de suministro: ' + (error.response?.data?.mensaje || error.response?.data?.error || error.message)
        });
      }
    },

    // Abre el modal de contratos con los datos del punto de suministro seleccionado
    async abrirModalContratos(idPuntoSuministro, idCliente) {
      // Generar un ID único para esta solicitud para evitar race conditions
      const requestId = Date.now() + '_' + idPuntoSuministro;
      this.currentContratosRequestId = requestId;
      
      this.loading = true;
      
      // LIMPIAR COMPLETAMENTE todos los datos previos del modal ANTES de cualquier otra cosa
      this.contratos = [];
      this.contratoActualData = null;
      this.contratosHistoricosData = null;
      this.todosLosContratos = [];
      this.modalCliente = null;
      this.modalPuntoSuministro = null;
      
      // NO mostrar el modal hasta que tengamos los datos básicos cargados
      // Esto evita el mensaje "No hay contratos disponibles" mientras carga
      this.mostrarModalContratos = false;
      
      try {
        // Cargar TODOS los datos necesarios ANTES de mostrar el modal
        const [responseCliente, responsePuntoSuministro, tarifasGasResponse, tarifasLuzResponse, responseContratos] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/clientes/${idCliente}`),
          axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/${idPuntoSuministro}`),
          axios.get(`${process.env.VUE_APP_API_URL}/tarifas-gas`),
          axios.get(`${process.env.VUE_APP_API_URL}/tarifas-luz`),
          axios.get(`${process.env.VUE_APP_API_URL}/contratos/punto-suministro/${idPuntoSuministro}`)
        ]);
        
        // VERIFICAR que esta solicitud sigue siendo la actual (evita race conditions)
        // Si el usuario hizo clic en otro punto mientras cargaba, ignoramos esta respuesta
        if (this.currentContratosRequestId !== requestId) {
          return;
        }
        
        // Asignar datos del cliente
        this.modalCliente = responseCliente.data;
        this.modalCliente.id = idCliente;
        
        // Asignar datos del punto de suministro
        this.modalPuntoSuministro = responsePuntoSuministro.data;
        
        // Asignar tarifas
        this.tarifasGas = tarifasGasResponse.data;
        this.tarifasLuz = tarifasLuzResponse.data;
        
        // Asignar contratos específicos del punto de suministro
        this.contratos = responseContratos.data || [];
        
        // Calcular el contrato actual y los históricos
        const ahora = new Date();
        this.contratoActualData = this.contratos.find(contrato => 
          new Date(contrato.fechaInicio) <= ahora && new Date(contrato.fechaFin) > ahora
        ) || {};
        this.contratosHistoricosData = this.contratos.filter(contrato => 
          new Date(contrato.fechaFin) <= ahora
        );
        
        // VERIFICAR una vez más antes de mostrar el modal
        if (this.currentContratosRequestId !== requestId) {
          return;
        }
        
        // AHORA sí mostrar el modal con todos los datos cargados
        this.mostrarModalContratos = true;
        
      } catch (error) {
        console.error("Error al abrir el modal de contratos:", error);
        
        // Solo mostrar error si esta solicitud sigue siendo la actual
        if (this.currentContratosRequestId === requestId) {
          // Asegurar que tenemos arrays vacíos en lugar de null
          this.tarifasGas = this.tarifasGas || [];
          this.tarifasLuz = this.tarifasLuz || [];
          this.contratos = [];
          this.todosLosContratos = [];
          this.contratoActualData = null;
          this.contratosHistoricosData = [];
          
          // Mostrar el modal vacío con mensaje de error si es necesario
          this.mostrarModalContratos = true;
        }
      } finally {
        // Solo desactivar loading si esta solicitud sigue siendo la actual
        if (this.currentContratosRequestId === requestId) {
          this.loading = false;
        }
      }
    },

    // Cierra el modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
      // Invalidar cualquier solicitud pendiente para evitar race conditions
      this.currentContratosRequestId = null;
      // Limpiar datos del modal para evitar mostrar información del punto anterior
      this.contratos = [];
      this.contratoActualData = null;
      this.contratosHistoricosData = null;
      this.todosLosContratos = [];
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
          await axios.delete(`${process.env.VUE_APP_API_URL}/puntos-suministro/${puntoSuministro.id}`);
          
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
      this.loading = true;
      try {
        await this.fetchPuntosSuministro();
      } finally {
        this.loading = false;
      }
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
        return;
      }

      try {
        
        // Recargar contratos del punto de suministro actual
        const responseContratos = await axios.get(
          `${process.env.VUE_APP_API_URL}/contratos/punto-suministro/${this.modalPuntoSuministro.id}`
        );
        this.contratos = responseContratos.data;

        // Recalcular el contrato actual
        const ahora = new Date();
        this.contratoActualData = this.contratos.find(contrato => {
          const fechaFin = new Date(contrato.fechaFin);
          const fechaInicio = new Date(contrato.fechaInicio);
          return fechaInicio <= ahora && fechaFin > ahora;
        }) || null;

        // Separar contratos históricos (los que no están vigentes)
        // Nota: contratoActual y contratosHistoricos son computed con caché
        // sobre contratoActualData / contratosHistoricosData, por lo que hay
        // que actualizar esos campos, no los computed.
        this.contratosHistoricosData = this.contratos.filter(contrato => {
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
          const productosResp = await axios.get(`${process.env.VUE_APP_API_URL}/productos`);
          this.productos = productosResp.data;
        }
        if (!this.gestoras.length) {
          const gestorasResp = await axios.get(`${process.env.VUE_APP_API_URL}/gestoras`);
          this.gestoras = gestorasResp.data;
        }
        
        // Cargar datos básicos del cliente primero
        const responseCliente = await axios.get(`${process.env.VUE_APP_API_URL}/clientes/${idCliente}`);
        this.modalCliente = responseCliente.data;
        this.modalCliente.id = idCliente;
        this.modalPuntoSuministro = idPuntoSuministro;
        
        // Ahora cargar servicios (la parte más lenta)
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios/punto-suministro/${idPuntoSuministro}`);
        
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
          const responsePagos = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicio.id}`);
          
          // Crear una copia del servicio con los datos de pagos
          return {
            ...servicio,
            pagos: responsePagos.data
          };
        } catch (error) {
          // Si no hay datos de pagos para este servicio, mantenerlo sin pagos
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
        
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios/punto-suministro/${this.modalPuntoSuministro}`);
        
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

    // Método con debounce para filtrar por columna
    filterByColumnDebounced(column, value) {
      // Cancelar el timer anterior si existe
      if (this.filtrosTimer) {
        clearTimeout(this.filtrosTimer);
      }
      // Crear nuevo timer con delay de 150ms
      this.filtrosTimer = setTimeout(() => {
        this.currentPage = 1;
        this.columnFilters[column] = value;
      }, 150);
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
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/contratos/punto-suministro/${suministro.id}`);
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
      if (!ps.id) {
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Punto de suministro no válido'
        })
        return
      }
      try {
        // Cargar datos detallados del punto de suministro
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/${ps.id}`);
        
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
          this.$swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay datos para exportar'
          })
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
          'No-Switching': this.tieneServiciosNoSwitching(punto.id) ? 'Sí' : 'No',
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
          { header: 'No-Switching', key: 'No-Switching', width: 12 },
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al exportar a Excel. Por favor, intente nuevamente.'
        })
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

    // Verifica si un punto de suministro tiene servicios con productos no-switching
    tieneServiciosNoSwitching(idPuntoSuministro) {
      return this.puntosConServiciosNoSwitching.has(Number(idPuntoSuministro));
    },

    // Carga los puntos de suministro que tienen servicios no-switching
    async cargarPuntosConServiciosNoSwitching() {
      try {
        if (!this.productos || this.productos.length === 0) {
          return; // No podemos determinar sin los productos
        }

        // Calcular IDs de productos no-switching en el frontend
        const idsNoSwitching = this.productos
          .filter(p => p.nombre && !p.nombre.toLowerCase().includes('switching'))
          .map(p => p.id);

        if (idsNoSwitching.length === 0) {
          this.puntosConServiciosNoSwitching.clear();
          return;
        }

        // Llamar al endpoint eficiente — devuelve solo los IDs de puntos afectados
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/servicios/puntos-con-servicio-activo`,
          { params: { idProductos: idsNoSwitching }, paramsSerializer: params => {
              return Object.entries(params)
                .flatMap(([k, v]) => Array.isArray(v) ? v.map(i => `${k}=${i}`) : [`${k}=${v}`])
                .join('&');
            }
          }
        );

        this.puntosConServiciosNoSwitching.clear();
        (response.data || []).forEach(id => this.puntosConServiciosNoSwitching.add(Number(id)));
      } catch (error) {
        console.error('Error al cargar puntos con servicios no-switching:', error);
      }
    },

    // Carga el conteo real de servicios activos (KPI del dashboard)
    async cargarTotalServiciosActivos() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/servicios/estadisticas/activos`
        );
        this.totalServiciosActivosReal = response.data?.total ?? 0;
      } catch (error) {
        console.error('Error al cargar el total de servicios activos:', error);
      }
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
    this.loading = true;
    
    // Precargamos los arrays de los combos y datos necesarios
    try {
      // Cargar datos de configuración en paralelo
      const [comercializadoras, tarifasGas, tarifasLuz, gestoras, productos] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/comercializadoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/tarifas-gas`),
        axios.get(`${process.env.VUE_APP_API_URL}/tarifas-luz`),
        axios.get(`${process.env.VUE_APP_API_URL}/gestoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/productos`),
      ]);
      
      this.comercializadoras = comercializadoras.data;
      this.tarifasGas = tarifasGas.data;
      this.tarifasLuz = tarifasLuz.data;
      this.gestoras = gestoras.data;
      this.productos = productos.data;
      
      // Ya no necesitamos cargar todos los contratos aquí
      // La información de contratos activos viene en el campo tarifaActual de los puntos de suministro
      this.todosLosContratos = [];
      
      // Esperar a que se carguen los puntos de suministro antes de desactivar el loading
      await this.fetchPuntosSuministro();

      // Aplicar filtro CUPS si viene de navegación desde ficha de cliente
      if (this.$route.query.cupsluz) {
        this.columnFilters.cupsluz = this.$route.query.cupsluz;
      }
      
      // Detectar si hay una renovación pendiente desde Informes
      const pendingRenovacion = sessionStorage.getItem('pendingRenovacion');
      if (pendingRenovacion) {
        sessionStorage.removeItem('pendingRenovacion');
        try {
          const renovData = JSON.parse(pendingRenovacion);
          if (renovData.idPuntoSuministro && renovData.idCliente) {
            await this.abrirModalContratos(renovData.idPuntoSuministro, renovData.idCliente);
          }
        } catch (e) {
          console.warn('Error al procesar renovación pendiente', e);
        }
      }
      
      // Cargar información de puntos con servicios no-switching
      await this.cargarPuntosConServiciosNoSwitching();

      // Cargar el conteo real de servicios activos (sustituye la estimación anterior)
      await this.cargarTotalServiciosActivos();
      
      // Forzar una actualización de la vista para que se apliquen bien los datos de tarifa
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      // En caso de error, inicializar arrays vacíos para evitar errores
      this.todosLosContratos = [];
    } finally {
      this.loading = false;
    }
  },

  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    },
    filter() {
      this.currentPage = 1;
    },
    'puntosSuministro.length'(val) {
      this.animateCounter('animatedPuntos', val);
    },
    totalContratos(val) {
      this.animateCounter('animatedContratos', val);
    },
    totalServicios(val) {
      this.animateCounter('animatedServicios', val);
    }
  }
};
</script>

<style scoped src="./PuntoSuministroComponent.css"></style>
