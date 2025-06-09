<template>
  <div v-if="visible" class="modal-overlay fade-in">
    <div class="modal-content">
      <div class="modal-header">
        <h2><i class="fas fa-bolt"></i> Detalles del Punto de Suministro</h2>
      </div>

      <div class="modal-body">
        <div v-if="punto" class="details-grid">
          <div class="detail-item">
            <strong>ID:</strong> {{ punto.id }}
          </div>
          <div class="detail-item">
            <strong>Cliente:</strong> {{ punto.nombreCliente }}
          </div>
          <div class="detail-item full-width">
            <strong>Direcciónnn:</strong> {{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}
          </div>
          <div class="detail-item">
            <strong>CUPS Luz:</strong> {{ punto.cupsluz || '-' }}
          </div>
          <div class="detail-item">
            <strong>CUPS Gas:</strong> {{ punto.cupsgas || '-' }}
          </div>
          <div class="detail-item">
            <strong>Contador:</strong> {{ punto.contador || '-' }}
          </div>
           <div class="detail-item">
            <strong>Propiedad Contador:</strong> {{ punto.propiedadContador == 1 ? 'Sí' : 'No' }}
          </div>
           <div class="detail-item">
            <strong>Modem:</strong> {{ punto.modem || '-' }}
          </div>
           <div class="detail-item">
            <strong>Propiedad Modem:</strong> {{ punto.propiedadModem == 1 ? 'Sí' : 'No' }}
          </div>
          <div class="detail-item full-width">
            <strong>Observaciones:</strong> {{ punto.observaciones || '-' }}
          </div>
          <div class="detail-item">
            <strong>Fecha Instalación:</strong> {{ punto.fechaInstalacion || '-' }}
          </div>
          <div class="detail-item" v-if="punto.fechaBaja">
            <strong>Fecha Baja:</strong> {{ punto.fechaBaja }}
          </div>
        </div>
        <div v-else class="empty-state">
           <p>Cargando detalles o no hay datos disponibles.</p>
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
</template>

<script>
export default {
  name: "ModalConsultaPuntoSuministro",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    punto: {
      type: Object,
      required: false,
      default: null,
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
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90vw; /* Usar ancho relativo */
  max-width: 90%; /* Ancho máximo */
  min-width: 60%; /* Ancho mínimo */
  max-height: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface-color);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.modal-body {
  padding: 20px;
  overflow-y: auto; /* Permite scroll si el contenido es largo */
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Dos columnas */
  gap: 15px;
}

.detail-item {
  word-break: break-word; /* Evita que el texto largo desborde */
}

.detail-item strong {
  display: block; /* Pone el label en una línea separada */
  margin-bottom: 4px;
  color: black;
}

.full-width {
  grid-column: span 2; /* Ocupa ambas columnas */
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}

/* Estilos del botón (ejemplo - usar clases globales si existen) */
.btn-primary {
  background-color: var(--primary-color);
  color: black;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
}


.btn-primary:hover {
  background-color: var(--primary-dark);
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style> 