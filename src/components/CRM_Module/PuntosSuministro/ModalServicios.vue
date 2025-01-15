<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
      <h2>Gestión de Servicios</h2>
      <!-- Tabs para alternar entre las vistas de servicios -->
      <div class="tabs">
        <button :class="{ active: pestañaActiva === 'nuevo' }" @click="pestañaActiva = 'nuevo'">Nuevo Servicio</button>
        <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">Servicio Actual</button>
        <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">Servicios Históricos</button>
      </div>
      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content">
        <!-- Crear nuevo servicio -->
        <div v-if="pestañaActiva === 'nuevo'">
          <h3>Crear Nuevo Servicio</h3>
          <form @submit.prevent="crearNuevoServicio">
            <div class="form-group">
              <label for="fechaInicioServicio">Fecha Inicio:</label>
              <input type="date" id="fechaInicioServicio" v-model="nuevoServicio.fechaInicio" required />
            </div>
            <div class="form-group">
              <label for="fechaFinServicio">Fecha Fin:</label>
              <input type="date" id="fechaFinServicio" v-model="nuevoServicio.fechaFin" required />
            </div>
            <div class="form-group">
              <label for="descripcionServicio">Descripción:</label>
              <textarea id="descripcionServicio" v-model="nuevoServicio.descripcion" rows="3" required></textarea>
            </div>
            <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Servicio</button>
          </form>
        </div>
        <!-- Visualizar servicio actual -->
        <div v-if="pestañaActiva === 'actual'">
          <h3>Servicio Actual</h3>
          <div v-if="servicioActual">
            <p><strong>ID:</strong> {{ servicioActual.id }}</p>
            <p><strong>Descripción:</strong> {{ servicioActual.descripcion }}</p>
            <p><strong>Fecha Inicio:</strong> {{ servicioActual.fechaInicio }}</p>
            <p><strong>Fecha Fin:</strong> {{ servicioActual.fechaFin }}</p>
          </div>
          <div v-else>
            <p>No hay servicios actuales.</p>
          </div>
        </div>
        <!-- Listado de servicios históricos -->
        <div v-if="pestañaActiva === 'historico'">
          <h3>Servicios Históricos</h3>
          <ul>
            <li v-for="servicio in serviciosHistoricos" :key="servicio.id">
              <strong>ID:</strong> {{ servicio.id }} - 
              <strong>Fecha Fin:</strong> {{ servicio.fechaFin }}
              <button @click="verDetalleServicio(servicio)">Ver Detalle</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModalServicios",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    servicios: {
      type: Array,
      required: true,
    },
    servicioActual: {
      type: Object,
      required: false,
    },
    serviciosHistoricos: {
      type: Array,
      required: true,
    }
  },
  data() {
    return {
      pestañaActiva: "actual",
      nuevoServicio: {
        fechaInicio: "",
        fechaFin: "",
        descripcion: "",
      }
    };
  },
  methods: {
    cerrarModal() {
      this.$emit("cerrar-modal");
    },
    crearNuevoServicio() {
      this.$emit("crear-servicio", this.nuevoServicio);
    },
    verDetalleServicio(servicio) {
      alert(`Detalles del servicio ID: ${servicio.id}\n${JSON.stringify(servicio, null, 2)}`);
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