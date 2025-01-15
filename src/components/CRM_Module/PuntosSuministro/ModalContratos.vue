<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
      <h2>Gestión de Contratos</h2>
      <!-- Tabs para alternar entre las vistas de contratos -->
      <div class="tabs">
        <button :class="{ active: pestañaActiva === 'nuevo' }" @click="pestañaActiva = 'nuevo'">Nuevo Contrato</button>
        <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">Contrato Actual</button>
        <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">Contratos Históricos</button>
      </div>
      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content">
        <!-- Crear nuevo contrato -->
        <div v-if="pestañaActiva === 'nuevo'">
          <h3>Crear Nuevo Contrato</h3>
          <form @submit.prevent="crearNuevoContrato">
            <div class="form-group">
              <label for="fechaInicioContrato">Fecha Inicio:</label>
              <input type="date" id="fechaInicioContrato" v-model="nuevoContrato.fechaInicio" required />
            </div>
            <div class="form-group">
              <label for="fechaFinContrato">Fecha Fin:</label>
              <input type="date" id="fechaFinContrato" v-model="nuevoContrato.fechaFin" required />
            </div>
            <div class="form-group">
              <label for="detallesContrato">Detalles:</label>
              <textarea id="detallesContrato" v-model="nuevoContrato.detalles" rows="3" required></textarea>
            </div>
            <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Contrato</button>
          </form>
        </div>
        <!-- Visualizar contrato actual -->
        <div v-if="pestañaActiva === 'actual'">
          <h3>Contrato Actual</h3>
          <div v-if="contratoActual">
            <p><strong>ID:</strong> {{ contratoActual.id }}</p>
            <p><strong>Fecha Inicio:</strong> {{ contratoActual.fechaInicio }}</p>
            <p><strong>Fecha Fin:</strong> {{ contratoActual.fechaFin }}</p>
            <p><strong>Detalles:</strong> {{ contratoActual.detalles }}</p>
          </div>
          <div v-else>
            <p>No hay contratos actuales.</p>
          </div>
        </div>
        <!-- Listado de contratos históricos -->
        <div v-if="pestañaActiva === 'historico'">
          <h3>Contratos Históricos</h3>
          <ul>
            <li v-for="contrato in contratosHistoricos" :key="contrato.id">
              <strong>ID:</strong> {{ contrato.id }} - 
              <strong>Fecha Fin:</strong> {{ contrato.fechaFin }}
              <button @click="verDetalleContrato(contrato)">Ver Detalle</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalContratos",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    contratos: {
      type: Array,
      required: true,
    },
    contratoActual: {
      type: Object,
      required: false,
    },
    contratosHistoricos: {
      type: Array,
      required: true,
    }
  },
  data() {
    return {
      pestañaActiva: "actual",
      nuevoContrato: {
        fechaInicio: "",
        fechaFin: "",
        detalles: "",
      }
    };
  },
  methods: {
    cerrarModal() {
      this.$emit("cerrar-modal");
    },
    crearNuevoContrato() {
      this.$emit("crear-contrato", this.nuevoContrato);
    },
    verDetalleContrato(contrato) {
      alert(`Detalles del contrato ID: ${contrato.id}\n${JSON.stringify(contrato, null, 2)}`);
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  padding-top: 20px;
}
.modal-content {
  width: 90%;
  max-width: 800px;
  max-height: 80%;
  overflow-y: auto;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}
</style>