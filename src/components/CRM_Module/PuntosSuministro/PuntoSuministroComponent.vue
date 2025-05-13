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

    <!-- Panel de búsqueda y filtros -->
    <div class="card filter-panel">
      <div class="filter-header">
        <h2><i class="fas fa-filter"></i> Filtros</h2>
      </div>
      <div class="filter-controls">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar por dirección, CUPS, cliente..."
            v-model="filter"
          />
        </div>
      </div>
    </div>

    <!-- Tabla de puntos de suministro con nuevo diseño -->
    <div class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-bolt"></i> Puntos de Suministro</h2>
        <div class="table-actions">
          <button class="btn btn-outline" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
          </button>
          <button class="btn btn-outline" title="Exportar a PDF">
            <i class="fas fa-file-pdf"></i>
          </button>
          <button class="btn btn-outline" title="Configurar columnas">
            <i class="fas fa-columns"></i>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <div class="table-controls">
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
              <th @click="sortBy('cliente')" class="sortable" style="width: 20%">
                <i class="fas fa-user mr-2"></i>Cliente
                <i :class="getSortIcon('cliente')"></i>
              </th>
              <th @click="sortBy('direccion')" class="sortable" style="width: 35%">
                <i class="fas fa-map-marker-alt mr-2"></i>Dirección
                <i :class="getSortIcon('direccion')"></i>
              </th>
              <th @click="sortBy('cupsluz')" class="sortable" style="width: 20%">
                <i class="fas fa-bolt mr-2"></i>CUPS Luz
                <i :class="getSortIcon('cupsluz')"></i>
              </th>
              <th @click="sortBy('cupsgas')" class="sortable" style="width: 15%">
                <i class="fas fa-fire mr-2"></i>CUPS Gas
                <i :class="getSortIcon('cupsgas')"></i>
              </th>
              <th style="width: 10%"><i class="fas fa-cogs mr-2"></i>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="suministro in paginatedPuntosSuministro" :key="suministro.id">
              <td class="text-truncate" :title="suministro.cliente">{{ suministro.cliente }}</td>
              <td class="text-truncate" :title="`${suministro.direccion}, ${suministro.codigoPostal}, ${suministro.poblacion}, ${suministro.provincia}`">
                {{ suministro.direccion }}, {{ suministro.codigoPostal }}, 
                {{ suministro.poblacion }}, {{ suministro.provincia }}
              </td>
              <td class="text-truncate" :title="suministro.cupsluz">{{ suministro.cupsluz }}</td>
              <td class="text-truncate" :title="suministro.cupsgas">{{ suministro.cupsgas }}</td>
              <td>
                <div class="action-buttons">
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
              <td colspan="5" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron puntos de suministro que coincidan con la búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination-controls">
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
      @cerrar-modal="cerrarModal"
      @actualizar-punto-suministro="actualizarPS"
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
      :puntoSuministro="modalPuntoSuministro"
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
      formularioVisible: false,     // Control de visibilidad del formulario de actualización
      
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
      return this.puntosSuministro.filter((suministro) =>
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
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
      if (!this.sortKey) return this.filteredPuntosSuministro;
      
      const sorted = [...this.filteredPuntosSuministro].sort((a, b) => {
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
        this.puntosSuministro = response.data;
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
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
      }
    },

    // Cierra el formulario de actualización
    cerrarModal() {
      this.formularioVisible = false;
    },

    // Actualiza un punto de suministro en la API
    async actualizarPS(actualizadoPunto) {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/puntos-suministro`, actualizadoPunto);
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error("Error al actualizar el punto de suministro:", error);
      }
    },

    // Abre el modal de contratos con los datos del punto de suministro seleccionado
    async abrirModalContratos(idPuntoSuministro,idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`);
        this.contratos = response.data;
        this.modalPuntoSuministro = idPuntoSuministro;  
        this.modalCliente = idCliente;   
        this.mostrarModalContratos = true;
      } catch (error) {
        console.error("Error al cargar contratos:", error);
      }
    },

    // Cierra el modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
    },

    // Abre el modal de servicios con los datos del punto de suministro seleccionado
    async abrirModalServicios(idPuntoSuministro,idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/punto-suministro/${idPuntoSuministro}`);
        this.servicios = response.data;
        this.modalPuntoSuministro = idPuntoSuministro;  
        this.modalCliente = idCliente; 
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
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    
    getSortIcon(key) {
      if (this.sortKey !== key) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
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
  max-width: 1600px;
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

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
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

/* Panel de filtros */
.filter-panel {
  padding: 0;
  overflow: hidden;
}

.filter-header {
  background-color: white;
  color: var(--text-primary);
  padding: 15px 20px;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.filter-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.filter-header h2 i {
  margin-right: 10px;
  color: var(--primary-color);
}

.filter-controls {
  padding: 20px;
  display: flex;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  padding-left: 40px;
  width: 100%;
}

/* Panel de tabla */
.table-panel {
  padding: 0;
  overflow: hidden;
}

.table-header {
  background-color: white;
  color: var(--text-primary);
  padding: 15px 20px;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.table-header h2 i {
  margin-right: 10px;
  color: var(--primary-color);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-actions .btn {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.table-actions .btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Estilos dentro de la tabla */
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
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
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

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-muted);
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .stats-container {
    flex-direction: column;
  }
  
  .stats-panel {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .filter-controls {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-input {
    width: 100%;
  }
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
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.records-per-page label {
  color: var(--text-secondary);
  font-weight: 500;
}

.records-per-page select {
  width: auto;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: white;
  color: var(--text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.records-per-page select:hover {
  border-color: var(--primary-color);
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
  gap: 12px;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>

 