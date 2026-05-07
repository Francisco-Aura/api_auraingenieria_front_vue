<template>
  <div>
    <div class="modal-overlay fade-in">
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-building"></i> Detalle del Cliente</h2>
        <div class="cliente-info">
          <span class="cliente-nombre">{{ cliente?.nombre || "Desconocido" }}</span>
        </div>
      </div>

      <div class="modal-body">

        <!-- Barra de pestañas -->
        <div class="tab-bar-cliente">
          <button :class="['tab-btn-cliente', { active: activeTab === 'puntos' }]" @click="activeTab = 'puntos'">
            <i class="fas fa-bolt"></i> Puntos de Suministro
            <span class="tab-count">{{ puntosSuministroLocal.length }}</span>
          </button>
        </div>

        <!-- Tab: Puntos de Suministro -->
        <div v-if="activeTab === 'puntos'">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Buscar en puntos de suministro..."
            v-model="filterPuntos"
            class="search-input"
          />
        </div>

        <div class="table-responsive">
          <table v-if="puntosSuministro.length > 0" class="data-table">
            <thead>
              <tr>
                <th><i class="fas fa-map-marker-alt"></i> Direccion</th>
                <th><i class="fas fa-id-card"></i> Identificacion</th>
                <th><i class="fas fa-bolt"></i> CUPS</th>
                <th><i class="fas fa-tag"></i> Tipo</th>
                <th><i class="fas fa-bolt"></i> P1</th>
                <th><i class="fas fa-bolt"></i> P2</th>
                <th><i class="fas fa-bolt"></i> P3</th>
                <th><i class="fas fa-bolt"></i> P4</th>
                <th><i class="fas fa-bolt"></i> P5</th>
                <th><i class="fas fa-bolt"></i> P6</th>
                <th><i class="fas fa-calendar-alt"></i> Fin Contrato</th>
                <th><i class="fas fa-building"></i> Comercializadora</th>
                <th class="actions-header"><i class="fas fa-cogs"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="punto in filteredPuntosSuministro" :key="punto.id">
                <td class="text-truncate" :title="`${punto.direccion}, ${punto.codigoPostal}, ${punto.poblacion}, ${punto.provincia}`">
                  {{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}
                </td>
                <td class="text-truncate text-center" :title="punto.identificacion">{{ punto.identificacion || '-' }}</td>
                <td 
                  class="cups-cell text-center" 
                  :title="getCupsValue(punto)"
                >
                  <div class="cups-content">
                    <button
                      v-if="getCupsValue(punto) !== '-'"
                      class="btn-cups-link"
                      @click="navegarAPuntosSupministro(punto)"
                      :title="`Ver ${getCupsValue(punto)} en Puntos de Suministro`"
                    >{{ getCupsValue(punto) }}</button>
                    <span v-else>-</span>
                    <span v-if="getCupsValue(punto) !== '-'" class="cups-indicator" :class="getTipoCupsClass(punto)">
                      <i :class="getTipoCupsIcon(punto)"></i>
                    </span>
                  </div>
                </td>
                <td class="text-center">{{ getTipoCups(punto) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia1) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia2) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia3) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia4) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia5) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia6) }}</td>
                <td class="text-center">{{ formatDate(punto.fechaFinUltimoContrato) }}</td>
                <td class="text-center">{{ punto.comercializadoraActual || '-' }}</td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button class="btn-icon btn-view" @click="verDetallePunto(punto)" title="Ver Detalles">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="fas fa-bolt fa-3x text-muted"></i>
            <p>No hay puntos de suministro para mostrar</p>
          </div>
        </div>
        </div><!-- /tab puntos -->

      </div>

      <div class="modal-footer">
        <button @click="$emit('cerrar-modal')" class="btn btn-primary">
          <i class="fas fa-times"></i>
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </div>

    <!-- Modal de Detalles Punto de Suministro -->
    <ModalActualizarPuntoSuministro
      v-if="formularioVisible"
      :modificarPunto="modificarPunto"
      :modoConsulta="modoConsulta"
      @cerrar-modal="cerrarModalActualizarPunto"
      @actualizar-punto-suministro="onPuntoSuministroActualizado"
    />

    <!-- Modal detalle de tarea eliminado - ver desde edicion de cliente -->
  </div>
</template>

<script>
import ModalActualizarPuntoSuministro from '@/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';
import axios from 'axios';

export default {
  name: "PuntosSuministroClienteComponent",
  components: {
    ModalActualizarPuntoSuministro
  },
  emits: ['cerrar-modal'],
  props: {
    cliente: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    puntosSuministro: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      filterPuntos: "",
      formularioVisible: false,
      modificarPunto: null,
      modoConsulta: false,
      puntosSuministroLocal: [],
      loading: false,
      activeTab: 'puntos',
    };
  },
  computed: {
    filteredPuntosSuministro() {
      const filtro = this.normalizeText(this.filterPuntos);
      return this.puntosSuministroLocal.filter((punto) => {
        const concatenated = [
          punto.direccion || '',
          punto.codigoPostal || '',
          punto.poblacion || '',
          punto.provincia || '',
          punto.cupsluz || '',
          punto.cupsgas || ''
        ].join(' ').toLowerCase();
        return this.normalizeText(concatenated).includes(filtro);
      });
    },
  },
  watch: {
    puntosSuministro: {
      immediate: true,
      deep: true,
      handler(newVal) {
        // Si recibimos puntos de suministro del padre, usar el nuevo endpoint para obtener las potencias
        if (newVal && newVal.length > 0 && this.cliente && this.cliente.idCliente) {
          this.refreshPuntosSuministro();
        } else {
          this.puntosSuministroLocal = newVal.map(punto => {
            const newPunto = { ...punto };
            if (newPunto.CUPSluz !== undefined) {
              newPunto.cupsluz = newPunto.CUPSluz;
              delete newPunto.CUPSluz;
            }
            if (newPunto.CUPSgas !== undefined) {
              newPunto.cupsgas = newPunto.CUPSgas;
              delete newPunto.CUPSgas;
            }
            if (newPunto.cupsluz === undefined && newPunto.cups === undefined) {
              newPunto.cupsluz = '';
            }
            if (newPunto.cupsgas === undefined) {
              newPunto.cupsgas = '';
            }
            return newPunto;
          });
        }
      },
    },
  },
  methods: {
    normalizeText(text) {
      if (!text) return "";
      return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    async refreshPuntosSuministro() {
      if (!this.cliente || !this.cliente.idCliente) return;
      this.loading = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${this.cliente.idCliente}/cartera`);
        this.puntosSuministroLocal = response.data.map(punto => {
          const newPunto = { ...punto };
          // Normalizar nombres de propiedades si es necesario
          if (newPunto.CUPSluz !== undefined) {
            newPunto.cupsluz = newPunto.CUPSluz;
            delete newPunto.CUPSluz;
          }
          if (newPunto.CUPSgas !== undefined) {
            newPunto.cupsgas = newPunto.CUPSgas;
            delete newPunto.CUPSgas;
          }
          if (newPunto.cupsluz === undefined && newPunto.cups === undefined) {
            newPunto.cupsluz = '';
          }
          if (newPunto.cupsgas === undefined) {
            newPunto.cupsgas = '';
          }
          return newPunto;
        });
        // Eliminada la alerta de éxito, solo loading
      } catch (error) {
        console.error("Error al actualizar puntos de suministro:", error);
        await this.$swal.fire({
          title: 'Error',
          text: `No se pudieron actualizar los puntos de suministro: ${error.message}`,
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)'
        });
      } finally {
        this.loading = false;
      }
    },
    navegarAPuntosSupministro(punto) {
      const cups = this.getCupsValue(punto);
      this.$emit('cerrar-modal');
      this.$router.push({
        path: '/dashboard/puntos-suministro',
        query: { cupsluz: cups }
      });
    },

    async verDetallePunto(punto) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${punto.id}`);
        // Combinar datos del endpoint con las potencias del punto original
        this.modificarPunto = { 
          ...response.data,
          // Agregar las potencias desde el punto original que ya las tiene
          potencia1: punto.potencia1 || 0,
          potencia2: punto.potencia2 || 0,
          potencia3: punto.potencia3 || 0,
          potencia4: punto.potencia4 || 0,
          potencia5: punto.potencia5 || 0,
          potencia6: punto.potencia6 || 0
        };
        this.modoConsulta = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los detalles del punto de suministro.'
        })
      }
    },
    cerrarModalActualizarPunto() {
      this.formularioVisible = false;
      this.modificarPunto = null;
      this.modoConsulta = false;
    },
    async onPuntoSuministroActualizado() {
      await this.refreshPuntosSuministro();
    },

    // Métodos para manejar CUPS y potencias como en la tabla principal
    getCupsValue(punto) {
      // Si tiene CUPS de luz y no está vacío, lo mostramos
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return punto.cupsluz;
      }
      // Si tiene CUPS de gas y no está vacío, lo mostramos
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return punto.cupsgas;
      }
      return '-';
    },

    getTipoCups(punto) {
      // Primero verificamos si tiene CUPS de luz válido
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return 'Luz';
      }
      // Luego verificamos si tiene CUPS de gas válido
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return 'Gas';
      }
      return '-';
    },

    getTipoCupsClass(punto) {
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return 'cups-luz';
      }
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return 'cups-gas';
      }
      return '';
    },

    getTipoCupsIcon(punto) {
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return 'fas fa-bolt';
      }
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return 'fas fa-fire';
      }
      return '';
    },

    formatPotencia(potencia) {
      if (potencia === null || potencia === undefined || potencia === 0) {
        return '-';
      }
      return parseFloat(potencia).toFixed(2) + ' kW';
    },

    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('es-ES');
    },
  },
};
</script>

<style scoped>
:root {
  --primary-color: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #e0e7ff;
  --surface-color: #f8fafc;
  --background-color: #ffffff;
  --border-color: #e2e8f0;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 1rem;
}

.modal-content {
  background: var(--background-color);
  border-radius: 1rem;
  width: 100%;
  max-width: 98%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid var(--neutral-200);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--neutral-200);
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--background-color) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--neutral-800);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  letter-spacing: -0.025em;
}

.modal-header h2 i {
  color: black;
  font-size: 1.25rem;
}

.cliente-info {
  background: var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.cliente-nombre {
  font-size: 0.875rem;
  color: black;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.modal-body {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  background: var(--neutral-50);
}

.search-container {
  position: relative;
  margin-bottom: 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--neutral-400);
  font-size: 0.875rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--neutral-300);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: var(--background-color);
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.search-input::placeholder {
  color: var(--neutral-400);
}

.table-responsive {
  background: var(--background-color);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--neutral-200);
  max-width: 100%;
  scrollbar-width: thin;
  scrollbar-color: var(--neutral-400) var(--neutral-200);
}

.table-responsive::-webkit-scrollbar {
  height: 8px;
}

.table-responsive::-webkit-scrollbar-track {
  background: var(--neutral-200);
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: var(--neutral-400);
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-500);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  background: linear-gradient(135deg, var(--neutral-100) 0%, var(--neutral-50) 100%);
  color: var(--neutral-700);
  font-weight: 600;
  padding: 0.75rem 0.5rem;
  text-align: center;
  border-bottom: 2px solid var(--neutral-200);
  white-space: nowrap;
  font-size: 0.8rem;
  letter-spacing: 0.025em;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th:first-child {
  text-align: left;
  min-width: 200px;
  max-width: 250px;
}

.data-table th:nth-child(2) {
  min-width: 80px;
  max-width: 100px;
}

.data-table th:nth-child(3) {
  min-width: 120px;
  max-width: 140px;
}

.data-table th:nth-child(4) {
  min-width: 50px;
  max-width: 60px;
}

/* Encabezados de potencias más compactos */
.data-table th:nth-child(5),
.data-table th:nth-child(6),
.data-table th:nth-child(7),
.data-table th:nth-child(8),
.data-table th:nth-child(9),
.data-table th:nth-child(10) {
  padding: 0.75rem 0.3rem;
  min-width: 55px;
  max-width: 60px;
  font-size: 0.75rem;
}

/* Nuevas columnas: Fecha Fin Contrato y Comercializadora */
.data-table th:nth-child(11) {
  min-width: 100px;
  max-width: 120px;
  font-size: 0.75rem;
}

.data-table th:nth-child(12) {
  min-width: 120px;
  max-width: 150px;
  font-size: 0.75rem;
}

.data-table th i {
  margin-right: 0.5rem;
  color: black;
  font-size: 0.875rem;
}

.actions-header {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.data-table tbody tr {
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--neutral-200);
}

.data-table tbody tr:hover {
  background-color: var(--neutral-50);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.data-table tbody tr:last-child {
  border-bottom: none;
}

.data-table td {
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
  color: var(--neutral-600);
  font-size: 0.8rem;
  border-bottom: 1px solid var(--neutral-100);
}

.data-table td:first-child {
  min-width: 200px;
  max-width: 250px;
}

.data-table td:nth-child(3) {
  min-width: 120px;
  max-width: 140px;
}

.data-table td:nth-child(2) {
  min-width: 80px;
  max-width: 100px;
}

.data-table td:nth-child(4) {
  min-width: 50px;
  max-width: 60px;
}

/* Celdas de potencias más compactas */
.data-table td:nth-child(5),
.data-table td:nth-child(6),
.data-table td:nth-child(7),
.data-table td:nth-child(8),
.data-table td:nth-child(9),
.data-table td:nth-child(10) {
  padding: 0.75rem 0.3rem;
  min-width: 55px;
  max-width: 60px;
}

/* Nuevas celdas: Fecha Fin Contrato y Comercializadora */
.data-table td:nth-child(11) {
  min-width: 100px;
  max-width: 120px;
  font-size: 0.75rem;
}

.data-table td:nth-child(12) {
  min-width: 120px;
  max-width: 150px;
  font-size: 0.75rem;
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-center {
  text-align: center;
}

.potencia-cell {
  font-weight: 500;
  color: var(--neutral-700);
  min-width: 55px;
  max-width: 60px;
  font-size: 0.75rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-width: 50px;
  max-width: 55px;
}

.btn-icon {
  background: transparent;
  border: 1px solid var(--neutral-300);
  font-size: 0.75rem;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 0.3rem;
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

.btn-icon.btn-view {
  color: var(--success-color);
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.05);
}

.btn-icon.btn-view:hover {
  background: var(--success-color);
  color: black;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  border-color: var(--success-color);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--neutral-400);
}

.empty-state i {
  margin-bottom: 1rem;
  opacity: 0.5;
  color: var(--neutral-300);
}

.empty-state p {
  font-size: 1rem;
  color: var(--neutral-500);
  margin: 0;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--neutral-200);
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--background-color) 100%);
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.875rem;
  letter-spacing: 0.025em;
  border: none;
}

.btn-primary {
  background: var(--primary-color);
  color: black;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.4);
}

.fade-in {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Estilos para columnas CUPS */
.cups-cell {
  min-width: 140px;
  max-width: 150px;
  text-align: center;
}

.btn-cups-link {
  background: none;
  border: none;
  padding: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #4f46e5;
  font-weight: 600;
  letter-spacing: 0.025em;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}

.btn-cups-link:hover {
  color: #3730a3;
}

/* Pestañas del modal de cliente */
.tab-bar-cliente {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.tab-btn-cliente {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 4px 4px 0 0;
}

.tab-btn-cliente:hover {
  color: #4f46e5;
  background: #f0f0ff;
}

.tab-btn-cliente.active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
  font-weight: 600;
}

.tab-count {
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 99px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.cups-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cups-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem; /* Cambiado de 1rem a 0.875rem para mejor balance */
  color: var(--neutral-700);
  font-weight: 600; /* Cambiado de 500 a 600 para más peso */
  letter-spacing: 0.025em; /* Añadido para mejor legibilidad */
}

.cups-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.75rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cups-indicator.cups-luz {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.cups-indicator.cups-gas {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* Responsive design */
@media (max-width: 1200px) {
  .modal-content {
    max-width: 98%;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
  
  .potencia-cell {
    min-width: 55px;
    max-width: 60px;
    font-size: 0.75rem;
  }
  
  .actions-cell {
    min-width: 50px;
    max-width: 55px;
  }
  
  .btn-icon {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .cups-cell {
    min-width: 120px;
    max-width: 130px;
  }
  
  .cups-value {
    font-size: 0.8rem; /* Mantener tamaño legible en tablets */
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    width: 100%;
    max-height: 95%;
  }

  .modal-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .search-container {
    max-width: 100%;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .potencia-cell {
    min-width: 50px;
    max-width: 55px;
    font-size: 0.7rem;
  }
  
  .actions-cell {
    min-width: 45px;
    max-width: 50px;
  }
  
  .btn-icon {
    width: 26px;
    height: 26px;
  }

  .cups-value {
    font-size: 0.75rem; /* Reducir solo ligeramente en móviles */
    font-weight: 600; /* Mantener el peso para legibilidad */
  }

  .cups-cell {
    min-width: 120px; /* Ajustar ancho en móviles */
  }
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
}

.detail-item {
  background-color: var(--surface-color);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item strong {
  display: block;
  color: var(--neutral-700);
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.detail-item:not(strong) {
  color: var(--text-primary);
  font-size: 1rem;
}
</style>