<template>
  <div class="modal-overlay fade-in">
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-bolt"></i> Puntos de Suministro</h2>
        <div class="cliente-info">
          <span class="cliente-nombre">{{ cliente?.nombre || "Desconocido" }}</span>
        </div>
        <button class="btn btn-refresh" @click="refreshPuntosSuministro" title="Actualizar puntos de suministro" style="margin-left: 1rem;">
          <i class="fas fa-sync-alt"></i>
          <span style="margin-left: 0.3rem;">Actualizar</span>
        </button>
      </div>

      <div class="modal-body">
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
                <th><i class="fas fa-bolt"></i> CUPS Luz</th>
                <th><i class="fas fa-fire"></i> CUPS Gas</th>
                <th class="actions-header"><i class="fas fa-cogs"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="punto in filteredPuntosSuministro" :key="punto.idPunto">
                <td class="text-truncate" :title="`${punto.direccion}, ${punto.codigoPostal}, ${punto.poblacion}, ${punto.provincia}`">
                  {{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}
                </td>
                <td class="text-truncate" :title="punto.identificacion">{{ punto.identificacion || '-' }}</td>
                <td class="text-truncate" :title="punto.cupsluz">{{ punto.cupsluz }}</td>
                <td class="text-truncate" :title="punto.cupsgas">{{ punto.cupsgas }}</td>
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
      </div>

      <div class="modal-footer">
        <button @click="$emit('cerrar-modal')" class="btn btn-primary">
          <i class="fas fa-times"></i>
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Modal de Detalles -->
  <ModalActualizarPuntoSuministro
    v-if="formularioVisible"
    :modificarPunto="modificarPunto"
    :modoConsulta="modoConsulta"
    @cerrar-modal="cerrarModalActualizarPunto"
    @actualizar-punto-suministro="onPuntoSuministroActualizado"
  />
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
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${this.cliente.idCliente}`);
        this.puntosSuministroLocal = response.data.map(punto => {
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
    async verDetallePunto(punto) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${punto.id}`);
        this.modificarPunto = { ...response.data };
        this.modoConsulta = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        alert("Error al cargar los detalles del punto de suministro.");
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
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.modal-content {
  background: white;
  border-radius: 0.7rem;
  width: 100%;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h2 i {
  color: var(--primary-color);
}

.cliente-info {
  background-color: var(--primary-light);
  padding: 0.4rem 0.8rem;
  border-radius: 0.4rem;
  color: var(--text-primary);
  font-weight: 500;
}

.cliente-nombre {
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.modal-body {
  padding: 1.2rem;
  overflow-y: auto;
  flex: 1;
}

.search-container {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.6rem 0.6rem 2.2rem;
  border: 1px solid var(--border-color);
  border-radius: 0.4rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.table-responsive {
  background: white;
  border-radius: 0.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
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
  padding: 0.8rem;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.data-table th i {
  margin-right: 0.4rem;
  color: var(--primary-color);
}

.actions-header {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.data-table td {
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
}

.actions-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
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

.btn-icon.btn-view {
  color: #43a047;
}

.btn-icon.btn-view:hover {
  background-color: rgba(67, 160, 71, 0.1);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--text-secondary);
}

.empty-state i {
  margin-bottom: 0.8rem;
  opacity: 0.5;
}

.modal-footer {
  padding: 0.8rem 1.2rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--surface-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn {
  padding: 0.4rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--primary-color);
  color: black;
  border: none;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .data-table th,
  .data-table td {
    padding: 10px;
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
  color: black;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.detail-item:not(strong) {
  color: var(--text-primary);
  font-size: 1rem;
}
</style>