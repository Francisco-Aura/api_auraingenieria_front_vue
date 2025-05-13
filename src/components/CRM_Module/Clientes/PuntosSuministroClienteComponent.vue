<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Puntos de Suministro del Cliente: {{ cliente?.nombre || "Desconocido" }}</h2>
      <input
        type="text"
        placeholder="Buscar en puntos de suministro..."
        v-model="filterPuntos"
        class="filter-input full-width"
      />
      <table v-if="puntosSuministro.length > 0" class="puntos-suministro-table">
        <thead>
          <tr>
            <th>Dirección</th>
            <th>CUPS Luz</th>
            <th>CUPS Gas</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="punto in filteredPuntosSuministro" :key="punto.idPunto">
            <td>{{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}</td>
            <td>{{ punto.cupsluz }}</td>
            <td>{{ punto.cupsgas }}</td>
            <td>
              <button class="btn btn-detalle" @click="verDetallePunto(punto)">Detalle</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No hay puntos de suministro para mostrar.</p>
      <button @click="$emit('cerrar-modal')" class="btn btn-cancelar">Cerrar</button>
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
      alert(`Detalles del Punto de SUMINISTRO ID: ${punto.id}\n${JSON.stringify(punto, null, 2)}`);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1000;
}
.modal-content {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1100px;
  min-width: 600px;
  max-height: 90vh;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 32px 0 32px;
}
.modal-content h2 {
  margin: 0;
  padding: 24px 32px 0 32px;
  font-size: 1.5rem;
  font-weight: 700;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 2;
}
.filter-input {
  margin: 24px 32px 0 32px;
}
.puntos-suministro-table {
  margin: 24px 32px 0 32px;
  width: calc(100% - 64px);
}
.btn-cancelar {
  margin: 24px 32px 24px 32px;
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background 0.2s;
}
.btn-cancelar:hover {
  background: var(--primary-dark);
}
@media (max-width: 700px) {
  .modal-content {
    min-width: 0;
    width: 98vw;
    max-width: 98vw;
    padding: 0 8px;
  }
  .modal-content h2, .filter-input, .puntos-suministro-table, .btn-cancelar { margin-left: 10px; margin-right: 10px; }
}
</style>