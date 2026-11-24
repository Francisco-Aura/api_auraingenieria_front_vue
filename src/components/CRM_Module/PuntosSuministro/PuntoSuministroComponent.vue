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
      <div class="table-responsive" v-desborde-tabla>
        <table class="data-table data-table--acciones-fijas data-table--compacta">
          <thead>
            <tr>
              <th class="sortable th-col-cliente">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('cliente')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('cliente')" @keydown.space.prevent="sortBy('cliente')">
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
                  <div class="column-title" @click="sortBy('direccion')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('direccion')" @keydown.space.prevent="sortBy('direccion')">
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
                  <div class="column-title" @click="sortBy('identificacion')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('identificacion')" @keydown.space.prevent="sortBy('identificacion')">
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
                  <div class="column-title" @click="sortBy('cupsluz')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('cupsluz')" @keydown.space.prevent="sortBy('cupsluz')">
                    <i class="fas fa-bolt mr-2"></i>CUPS
                    <i :class="getSortIcon('cupsluz')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.cupsluz" 
                      @input="filterByColumnDebounced('cupsluz', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-tipo">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('tipo')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('tipo')" @keydown.space.prevent="sortBy('tipo')">
                    <i class="fas fa-tag mr-2"></i>Tipo
                    <i :class="getSortIcon('tipo')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.tipo" 
                      @input="filterByColumnDebounced('tipo', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-tarifa">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('tarifa')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('tarifa')" @keydown.space.prevent="sortBy('tarifa')">
                    <i class="fas fa-tag mr-2"></i>Tarifa
                    <i :class="getSortIcon('tarifa')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.tarifa" 
                      @input="filterByColumnDebounced('tarifa', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-fincontrato">
                <div class="column-header">
                  <div class="column-title" @click="sortBy('fechaFinUltimoContrato')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('fechaFinUltimoContrato')" @keydown.space.prevent="sortBy('fechaFinUltimoContrato')">
                    <i class="fas fa-calendar-alt mr-2"></i>Fin Contrato
                    <i :class="getSortIcon('fechaFinUltimoContrato')"></i>
                  </div>
                  <div class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters.fechaFinUltimoContrato" 
                      @input="filterByColumnDebounced('fechaFinUltimoContrato', $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
              <th class="th-col-noswitching">
                <div class="column-header minimal-header">
                  <div class="column-title" @click="sortBy('noSwitching')" tabindex="0" role="button" @keydown.enter.prevent="sortBy('noSwitching')" @keydown.space.prevent="sortBy('noSwitching')" title="No-Switching - Haz clic para ordenar">
                    <i class="fas fa-network-wired"></i>
                    <i :class="getSortIcon('noSwitching')"></i>
                  </div>
                </div>
              </th>
              <th class="th-col-acciones-ps">
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
                  <button class="btn-icon btn-contracts" @click="abrirModalContratos(suministro.id,suministro.idCliente)" title="Gestión de contratos" aria-label="Gestión de contratos">
                    <i class="fas fa-file-contract"></i>
                  </button>
                  <button class="btn-icon btn-services" v-if="nivelAcceso === 1" @click="abrirModalServicios(suministro.id,suministro.idCliente)" title="Gestión de servicios" aria-label="Gestión de servicios">
                    <i class="fas fa-tools"></i>
                  </button>
                  <button class="btn-icon btn-delete" v-if="nivelAcceso === 1" @click="eliminarPuntoSuministro(suministro)" title="Eliminar punto de suministro" aria-label="Eliminar punto de suministro">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && paginatedPuntosSuministro.length === 0" class="fila-vacia">
              <td colspan="9" class="text-center py-4">
                <div class="empty-state" :class="{ 'empty-state--error': estadoVacio.error }">
                  <i :class="['fas', estadoVacio.icono, 'fa-3x', 'text-muted']"></i>
                  <p class="mt-3">{{ estadoVacio.texto }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- La paginación va fuera del contenedor que se desplaza en horizontal: si la
           tabla no cabe, «Registros por página» no se corta al moverla -->
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
          Mostrando {{ filteredPuntosSuministro.length ? paginationStart : 0 }} - {{ paginationEnd }} de {{ filteredPuntosSuministro.length }} registros
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
    <ModalActualizarPuntoSuministro 
      v-if="formularioVisible" 
      :modificarPunto="modificarPunto" 
      :modoConsulta="modoConsulta"
      :isSubmitting="guardandoPunto"
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
      @contrato-eliminado="fetchPuntosSuministro"
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
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden';
import ModalActualizarPuntoSuministro from './ActualizarPuntoSuministro.vue';
import ModalContratos from './ModalContratos.vue';
import ModalServicios from './ModalServicios.vue';
import axios from "axios"; // Librería para hacer peticiones HTTP
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel';
import { fechaLocalISO, enVigorHoy, terminadoHoy, fechaES } from '@/utils/fechas';
import { cupsVisible, tipoCups } from '@/utils/cups';


export default {
  name: "PuntosSuministro", // Nombre del componente
  mixins: [ordenTabla],
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
      guardandoPunto: false, // Guardado del punto en curso (evita el doble clic)
      contratos: [], // Lista de contratos asociados al punto de suministro
      comercializadoras: [],
      tarifasGas: [],
      tarifasLuz: [],

      // Datos SERVICIO
      mostrarModalServicios: false, // Control de visibilidad del modal de servicios
      servicios: [], // Lista de servicios asociados al punto de suministro
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
      errorCargaPuntos: false, // La última carga de la tabla falló (el aviso de tabla vacía lo explica)
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
      return this.contratos.find(
        (contrato) => enVigorHoy(contrato.fechaInicio, contrato.fechaFin)
      ) || {};
    },

    // Obtiene los contratos históricos (los que ya finalizaron)
    contratosHistoricos() {
      // Si tenemos datos calculados previamente, los usamos
      if (this.contratosHistoricosData) {
        return this.contratosHistoricosData;
      }
      
      // Si no, calculamos como antes
      return this.contratos.filter(
        (contrato) => terminadoHoy(contrato.fechaFin)
      );
    },

    // Obtiene el servicio actual (vigente): el mismo que la tabla marca como VIGENTE.
    // Antes bastaba con que no hubiera terminado y «Modificar/Renovar actual» podían
    // abrir uno que empieza más adelante
    servicioActual() {
      return this.servicios.find(
        (servicio) => enVigorHoy(servicio.fechaInicioServicio, servicio.fechaFinServicio)
      );
    },

    // Obtiene los servicios históricos (finalizados)
    serviciosHistoricos() {
      return this.servicios.filter(
        (servicio) => terminadoHoy(servicio.fechaFinServicio)
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
      const signo = this.sortOrder === 'asc' ? 1 : -1;

      // Dos columnas no salen de un campo de la fila: el tipo se deduce del CUPS
      // (y, a igualdad de tipo, ordena por el propio CUPS) y «no switching» de si
      // el punto tiene servicios de ese tipo.
      // La tarifa y el CUPS, como se ven en la tabla (el CUPS de gas cuando no hay de luz)
      const valor = (fila) => {
        if (this.sortKey === 'tipo') return this.getTipoCups(fila);
        if (this.sortKey === 'noSwitching') return this.tieneServiciosNoSwitching(fila.id) ? 1 : 0;
        if (this.sortKey === 'tarifa') {
          const tarifa = this.getTarifa(fila);
          return tarifa === '-' ? null : tarifa;
        }
        if (this.sortKey === 'cupsluz') return this.getCupsValue(fila) || null;
        return fila[this.sortKey];
      };

      return [...this.filteredPuntosSuministro].sort((a, b) => {
        const comparacion = compararValores(valor(a), valor(b));
        if (comparacion !== 0) return comparacion * signo;
        if (this.sortKey === 'tipo') return compararValores(this.getCupsValue(a), this.getCupsValue(b)) * signo;
        return 0;
      });
    },
    // Texto de la tabla vacía: no es lo mismo que la carga falle, que no haya puntos
    // o que los filtros no dejen ninguno (antes siempre decía «que coincidan con la búsqueda»)
    estadoVacio() {
      if (this.errorCargaPuntos) {
        return { error: true, icono: 'fa-exclamation-triangle', texto: 'No se pudieron cargar los puntos de suministro. Pulse «Actualizar» para volver a intentarlo.' };
      }
      if (!this.puntosSuministro.length) {
        return { error: false, icono: 'fa-bolt', texto: 'Todavía no hay puntos de suministro.' };
      }
      const hayFiltros = Object.values(this.columnFilters).some(valor => valor && String(valor).trim()) || !!this.filter.trim();
      if (!hayFiltros) {
        return {
          error: false,
          icono: 'fa-ban',
          texto: this.mostrarDadosDeBaja ? 'No hay puntos de suministro dados de baja.' : 'Todos los puntos de suministro están dados de baja.'
        };
      }
      return { error: false, icono: 'fa-search', texto: 'Ningún punto de suministro coincide con los filtros.' };
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
      // Tras guardar se recarga la tabla sin esperar; si coincide con otro refresco,
      // la respuesta más antigua no pisa a la más reciente
      const peticion = this.peticionPuntos = (this.peticionPuntos || 0) + 1;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/all`);
        if (peticion !== this.peticionPuntos) return;
        this.errorCargaPuntos = false;

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
        if (peticion !== this.peticionPuntos) return;
        this.errorCargaPuntos = true;
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
        // Cargar datos detallados del punto de suministro. Las potencias del contrato
        // vigente ya vienen en la fila de la tabla (misma consulta de cartera).
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/${ps.id}`);
        this.modificarPunto = { ...response.data, ...this.potenciasDeFila(ps) };
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

    // Potencias P1-P6 del contrato vigente tal como vienen en la fila de la tabla
    potenciasDeFila(ps) {
      return {
        potencia1: ps.potencia1 || 0,
        potencia2: ps.potencia2 || 0,
        potencia3: ps.potencia3 || 0,
        potencia4: ps.potencia4 || 0,
        potencia5: ps.potencia5 || 0,
        potencia6: ps.potencia6 || 0
      };
    },

    // Cierra el formulario de actualización
    cerrarModal() {
      this.formularioVisible = false;
      this.modoConsulta = false;
    },

    // Actualiza un punto de suministro en la API
    async handleUpdate(datosAdaptados) {
      if (this.guardandoPunto) return;
      this.guardandoPunto = true;
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
      } finally {
        this.guardandoPunto = false;
      }
    },

    // Abre el modal de contratos con los datos del punto de suministro seleccionado
    async abrirModalContratos(idPuntoSuministro, idCliente) {
      // Generar un ID único para esta solicitud para evitar race conditions
      const requestId = Date.now() + '_' + idPuntoSuministro;
      this.currentContratosRequestId = requestId;
      // Una carga de servicios que siga en curso ya no puede pisar el cliente ni el punto
      this.nuevaPeticionServicios();
      this.cargandoServicios = false;
      
      this.loading = true;
      
      // LIMPIAR COMPLETAMENTE todos los datos previos del modal ANTES de cualquier otra cosa
      this.contratos = [];
      this.contratoActualData = null;
      this.contratosHistoricosData = null;
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
        
        // Asignar contratos específicos del punto de suministro (y el vigente/históricos)
        this.asignarContratosModal(responseContratos.data || []);

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
          this.contratoActualData = null;
          this.contratosHistoricosData = [];

          // El modal no se puede abrir sin el cliente (v-if): antes no pasaba nada
          // y el usuario no sabía por qué
          this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los contratos del punto de suministro'
          });
        }
      } finally {
        // Solo desactivar loading si esta solicitud sigue siendo la actual
        if (this.currentContratosRequestId === requestId) {
          this.loading = false;
        }
      }
    },

    // Contratos del modal: el vigente (inicio <= hoy < fin) y los históricos (fin <= hoy)
    asignarContratosModal(contratos) {
      this.contratos = contratos;
      this.contratoActualData = contratos.find(contrato =>
        enVigorHoy(contrato.fechaInicio, contrato.fechaFin)
      ) || {};
      this.contratosHistoricosData = contratos.filter(contrato =>
        terminadoHoy(contrato.fechaFin)
      );
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
      this.modalCliente = null;
      this.modalPuntoSuministro = null;
    },

    // Eliminar punto de suministro con confirmación
    async eliminarPuntoSuministro(puntoSuministro) {
      try {
        const result = await this.$swal.fire({
          title: '¿Estás seguro?',
          text: `¿Deseas eliminar el punto de suministro ${this.getCupsValue(puntoSuministro) || 'sin CUPS'}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
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
            confirmButtonColor: '#fcd700',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
          });

          // Recargar la lista
          await this.fetchPuntosSuministro();
        }
      } catch (error) {
        console.error('Error al eliminar punto de suministro:', error);
        // El servidor explica el motivo (p. ej. el punto tiene contratos o servicios)
        const motivo = error.response?.data?.error;
        this.$swal.fire({
          title: 'Error',
          text: motivo ? `No se pudo eliminar el punto de suministro: ${motivo}` : 'No se pudo eliminar el punto de suministro. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    // Método para refrescar todos los datos manualmente
    async refreshData() {
      this.loading = true;
      try {
        // También la columna/filtro «No-Switching» y el total de servicios activos, que
        // solo se cargaban al entrar en la pantalla
        await Promise.all([
          this.fetchPuntosSuministro(),
          this.cargarPuntosConServiciosNoSwitching(),
          this.cargarTotalServiciosActivos()
        ]);
      } finally {
        this.loading = false;
      }
    },

    // Tras crear, actualizar o renovar un contrato: el propio formulario ya ha
    // mostrado el aviso de éxito (con el resultado MCAS); aquí solo se refresca.
    // Maneja la creación de un nuevo contrato
    async handleContratoCreado() {
      // Recargar automáticamente los contratos del modal y la tabla principal
      // (tarifaActual/fechaFinUltimoContrato dependen del contrato recién creado)
      await this.recargarContratosDelPuntoSuministro();
      await this.fetchPuntosSuministro();
    },

    // Maneja la actualización de un contrato existente
    async handleContratoActualizado() {
      
      // Recargar automáticamente los contratos para reflejar los cambios
      await this.recargarContratosDelPuntoSuministro();
      await this.fetchPuntosSuministro();
    },

    // Maneja la renovación de un contrato
    async handleContratoRenovado() {
      // Recargar automáticamente los contratos para reflejar los cambios
      await this.recargarContratosDelPuntoSuministro();
      await this.fetchPuntosSuministro();
    },

    // Método para recargar específicamente los contratos del punto de suministro actual
    async recargarContratosDelPuntoSuministro() {
      if (!this.modalPuntoSuministro?.id) {
        return;
      }

      try {
        // Recargar contratos del punto de suministro actual. El vigente y los
        // históricos se recalculan: el modal edita/renueva siempre el vigente.
        const responseContratos = await axios.get(
          `${process.env.VUE_APP_API_URL}/contratos/punto-suministro/${this.modalPuntoSuministro.id}`
        );
        this.asignarContratosModal(responseContratos.data || []);
      } catch (error) {
        console.error('Error al recargar contratos:', error);
        this.$swal.fire({
          title: 'Error',
          text: 'No se pudieron recargar los contratos. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    // Número de la última carga de servicios: si el usuario abre otro punto antes de
    // que termine la anterior, la respuesta vieja no sustituye a la del punto abierto
    nuevaPeticionServicios() {
      this.peticionServicios = (this.peticionServicios || 0) + 1;
      const peticion = this.peticionServicios;
      return () => peticion === this.peticionServicios;
    },

    // Abre el modal de servicios con los datos del punto de suministro seleccionado
    async abrirModalServicios(idPuntoSuministro, idCliente) {
      const vigente = this.nuevaPeticionServicios();
      try {
        // Activar loading
        this.cargandoServicios = true;
        // Sin los servicios del punto abierto antes: si esta carga falla no pueden
        // quedarse a la vista (ni usarse para crear o renovar sobre el punto anterior)
        this.servicios = [];
        this.mostrarModalServicios = true; // Mostrar modal inmediatamente con loading

        // Las cuatro peticiones son independientes: salen a la vez (antes, una tras
        // otra) y sus respuestas se aplican en el mismo orden de siempre
        const api = process.env.VUE_APP_API_URL;
        const enParalelo = (peticion) => {
          if (peticion) peticion.catch(() => {}); // el error se trata al esperarla
          return peticion;
        };
        const productosPeticion = enParalelo(this.productos.length ? null : axios.get(`${api}/productos`));
        const gestorasPeticion = enParalelo(this.gestoras.length ? null : axios.get(`${api}/gestoras`));
        const clientePeticion = enParalelo(axios.get(`${api}/clientes/${idCliente}`));
        const serviciosPeticion = enParalelo(axios.get(`${api}/servicios/punto-suministro/${idPuntoSuministro}`));

        // Esperar a que productos y gestoras estén cargados
        if (productosPeticion) {
          const productosResp = await productosPeticion;
          if (!vigente()) return;
          this.productos = productosResp.data;
        }
        if (gestorasPeticion) {
          const gestorasResp = await gestorasPeticion;
          if (!vigente()) return;
          this.gestoras = gestorasResp.data;
        }

        // Datos básicos del cliente
        const responseCliente = await clientePeticion;
        if (!vigente()) return;
        this.modalCliente = responseCliente.data;
        this.modalCliente.id = idCliente;
        this.modalPuntoSuministro = idPuntoSuministro;

        // Servicios (la parte más lenta)
        const response = await serviciosPeticion;
        if (!vigente()) return;

        // Cargar datos de pagos para cada servicio
        const serviciosConPagos = await this.cargarDatosDePagosParaServicios(response.data);
        if (!vigente()) return;
        this.servicios = serviciosConPagos;

        // Desactivar loading
        this.cargandoServicios = false;
      } catch (error) {
        if (!vigente()) return;
        console.error("Error al cargar servicios/productos/gestoras:", error);
        this.cargandoServicios = false; // Asegurar que se desactive en caso de error
        // Sin datos del punto no se deja el modal abierto (mostraría los del anterior)
        this.mostrarModalServicios = false;
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los servicios del punto de suministro'
        });
      }
    },

    // Cierra el modal de servicios
    cerrarModalServicios() {
      this.mostrarModalServicios = false;
      // Si aún estaba cargando, su respuesta ya no se aplica (ni al abrir otro modal)
      this.nuevaPeticionServicios();
      this.cargandoServicios = false;
    },

    // Carga los datos de pagos para una lista de servicios
    async cargarDatosDePagosParaServicios(servicios) {
      if (!servicios || servicios.length === 0) return [];
      // Todos los planes en una sola petición (antes, una por servicio: con 12 servicios,
      // 12 viajes al servidor al abrir la ventana y otros 12 tras cada guardado)
      try {
        const respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicios`, {
          params: { ids: servicios.map(servicio => servicio.id).join(',') }
        });
        const planPorServicio = new Map((respuesta.data || [])
          .filter(plan => plan?.id && plan.servicio?.id != null)
          .map(plan => [plan.servicio.id, plan]));
        return servicios.map(servicio => ({ ...servicio, pagos: planPorServicio.get(servicio.id) || null }));
      } catch (error) {
        // Servidor anterior sin esta ruta (durante el despliegue): uno por servicio, como antes
        console.warn('Planes de pagos de uno en uno:', error?.response?.status || error?.message);
      }

      // Crear promesas para cargar datos de pagos en paralelo
      const promesasPagos = servicios.map(async (servicio) => {
        try {
          // Intentar cargar los datos de pagos para este servicio
          const responsePagos = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicio.id}`);
          
          // Crear una copia del servicio con los datos de pagos
          return {
            ...servicio,
            // Sin plan de pagos el servidor devuelve un objeto vacío (sin id): eso no es un plan
            pagos: responsePagos.data?.id ? responsePagos.data : null
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
      
      // Se ha creado, cambiado o borrado un servicio: la columna «No-Switching» y el
      // total de servicios activos de la pantalla también pueden haber cambiado (se
      // refrescan aunque se cierre el modal antes de que llegue la lista)
      this.cargarPuntosConServiciosNoSwitching();
      this.cargarTotalServiciosActivos();

      const vigente = this.nuevaPeticionServicios();
      try {
        // Activar loading durante la recarga
        this.cargandoServicios = true;

        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios/punto-suministro/${this.modalPuntoSuministro}`);
        if (!vigente()) return;

        // Cargar datos de pagos para cada servicio
        const serviciosConPagos = await this.cargarDatosDePagosParaServicios(response.data);
        if (!vigente()) return;
        this.servicios = serviciosConPagos;

        // Desactivar loading
        this.cargandoServicios = false;
      } catch (error) {
        if (!vigente()) return;
        console.error('Error al recargar servicios:', error);
        this.cargandoServicios = false; // Asegurar que se desactive en caso de error
      }
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
      return cupsVisible(suministro.cupsluz, suministro.cupsgas);
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
      return cupsVisible(suministro.cupsluz, suministro.cupsgas);
    },

    getTipoCups(suministro) {
      return tipoCups(suministro.cupsluz, suministro.cupsgas);
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
      // dd/mm/aaaa; sin fecha, un guion
      return fechaES(suministro.fechaFinUltimoContrato);
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
        this.modificarPunto = { ...response.data, ...this.potenciasDeFila(ps) };
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
        if (!this.sortedPuntosSuministro || this.sortedPuntosSuministro.length === 0) {
          this.$swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay datos para exportar'
          })
          return;
        }

        // Las columnas visibles, en el orden en que se ven en pantalla
        const data = this.sortedPuntosSuministro.map(punto => ({
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
        const ExcelJS = await cargarExcelJS();
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

        // Descargar con la fecha del día en el nombre
        await descargarLibroExcel(workbook, `Puntos_Suministro_${fechaLocalISO()}.xlsx`);

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
    // La tabla y el total de servicios no dependen de los datos de configuración:
    // se piden ya, a la vez que ellos (antes esperaban uno detrás de otro). Ninguna
    // de las dos rechaza: cada una trata su propio error.
    const cargaPuntos = this.fetchPuntosSuministro();
    const cargaTotalServicios = this.cargarTotalServiciosActivos();
    let cargaNoSwitching = null;
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

      // «No switching» necesita los productos; sale ya, sin esperar a la tabla
      cargaNoSwitching = this.cargarPuntosConServiciosNoSwitching();
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      this.$swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las listas de comercializadoras, tarifas, gestoras o productos. Recargue la página antes de crear o editar.'
      });
    }

    // La tabla, el filtro que llega desde la ficha del cliente y la renovación pendiente
    // desde Informes no dependen de esas listas: antes, si una fallaba, se perdían
    try {
      // Esperar a que se carguen los puntos de suministro antes de desactivar el loading
      await cargaPuntos;

      // Aplicar filtro CUPS si viene de navegación desde ficha de cliente (con los dados
      // de baja a la vista si el punto lo está)
      if (this.$route.query.cupsluz) {
        this.columnFilters.cupsluz = this.$route.query.cupsluz;
        if (this.$route.query.bajas === '1') {
          this.mostrarDadosDeBaja = true;
        }
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
      
      // Información de puntos con servicios no-switching
      await cargaNoSwitching;

      // Conteo real de servicios activos (sustituye la estimación anterior)
      await cargaTotalServicios;
      
      // Forzar una actualización de la vista para que se apliquen bien los datos de tarifa
      this.$nextTick(() => {
        this.$forceUpdate();
      });
    } finally {
      this.loading = false;
    }
  },

  beforeUnmount() {
    clearTimeout(this.filtrosTimer);
  },

  watch: {
    recordsPerPage() {
      this.currentPage = 1;
    },
    filter() {
      this.currentPage = 1;
    },
    totalPages(newVal) {
      // Si tras un refresco (guardar/editar) el nuevo total de páginas es menor
      // que la página en la que estaba el usuario, lo llevamos a la última
      // página válida en vez de dejarlo viendo una página vacía.
      if (newVal > 0 && this.currentPage > newVal) {
        this.currentPage = newVal;
      }
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
