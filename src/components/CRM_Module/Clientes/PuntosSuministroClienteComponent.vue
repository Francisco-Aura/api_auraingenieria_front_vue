<template>
  <div class="modal-overlay fade-in">
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-bolt"></i> Puntos de Suministro</h2>
        <div class="cliente-info">
          <span class="cliente-nombre">{{ cliente?.nombre || "Desconocido" }}</span>
        </div>
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
                <th><i class="fas fa-map-marker-alt"></i> Dirección</th>
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
  <div v-if="showDetalleModal" class="modal-overlay fade-in">
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-info-circle"></i> Detalles del Punto de Suministro</h2>
        <button class="btn-icon" @click="showDetalleModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="puntoSeleccionado" class="details-grid">
          <div class="detail-item">
            <strong>ID:</strong> {{ puntoSeleccionado.id }}
          </div>
          <div class="detail-item">
            <strong>Cliente:</strong> {{ puntoSeleccionado.nombreCliente }}
          </div>
          <div class="detail-item full-width">
            <strong>Dirección:</strong> {{ puntoSeleccionado.direccion }}, {{ puntoSeleccionado.codigoPostal }}, {{ puntoSeleccionado.poblacion }}, {{ puntoSeleccionado.provincia }}
          </div>
          <div class="detail-item">
            <strong>CUPS Luz:</strong> {{ puntoSeleccionado.cupsluz || '-' }}
          </div>
          <div class="detail-item">
            <strong>CUPS Gas:</strong> {{ puntoSeleccionado.cupsgas || '-' }}
          </div>
          <div class="detail-item">
            <strong>Contador:</strong> {{ puntoSeleccionado.contador || '-' }}
          </div>
          <div class="detail-item">
            <strong>Propiedad Contador:</strong> {{ puntoSeleccionado.propiedadContador == 1 ? 'Sí' : 'No' }}
          </div>
          <div class="detail-item">
            <strong>Modem:</strong> {{ puntoSeleccionado.modem || '-' }}
          </div>
          <div class="detail-item">
            <strong>Propiedad Modem:</strong> {{ puntoSeleccionado.propiedadModem == 1 ? 'Sí' : 'No' }}
          </div>
          <div class="detail-item full-width">
            <strong>Observaciones:</strong> {{ puntoSeleccionado.observaciones || '-' }}
          </div>
          <div class="detail-item">
            <strong>Fecha Instalación:</strong> {{ puntoSeleccionado.fechaInstalacion || '-' }}
          </div>
          <div class="detail-item" v-if="puntoSeleccionado.fechaBaja">
            <strong>Fecha Baja:</strong> {{ puntoSeleccionado.fechaBaja }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="showDetalleModal = false" class="btn btn-primary">
          <i class="fas fa-times"></i>
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PuntosSuministroClienteComponent",
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
      showDetalleModal: false,
      puntoSeleccionado: null
    };
  },
  computed: {
    filteredPuntosSuministro() {
      const filtro = this.normalizeText(this.filterPuntos);
      return this.puntosSuministro.filter((punto) => {
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
  methods: {
    normalizeText(text) {
      if (!text) return "";
      return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    verDetallePunto(punto) {
      this.puntoSeleccionado = punto;
      this.showDetalleModal = true;
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
  border-radius: 12px;
  width: 100%;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h2 i {
  color: var(--primary-color);
}

.cliente-info {
  background-color: var(--primary-light);
  padding: 8px 16px;
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 500;
}

.cliente-nombre {
  font-size: 1.1rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.table-responsive {
  background: white;
  border-radius: 8px;
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
  padding: 15px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
}

.data-table th i {
  margin-right: 8px;
  color: var(--primary-color);
}

.actions-header {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.data-table td {
  padding: 12px 15px;
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
  gap: 8px;
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

.btn-icon.btn-view {
  color: #43a047;
}

.btn-icon.btn-view:hover {
  background-color: rgba(67, 160, 71, 0.1);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-state i {
  margin-bottom: 16px;
  opacity: 0.5;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background-color: var(--surface-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
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