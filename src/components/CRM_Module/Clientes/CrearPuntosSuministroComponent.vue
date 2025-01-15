<template>
  <div v-if="ShowModalPS" class="modal-overlay">
    <div class="modal-content">
      <h1>Nuevo Punto de Suministro</h1>
      <br />
      <h2>{{ cliente?.nombre || 'Desconocido' }}</h2>

      <form @submit.prevent="guardarPuntoSuministro">
        <div class="form-grid">
          <!-- Primera Columna -->
          <div class="form-column">
            <div class="form-group">
              <label for="direccion">Dirección</label>
              <input type="text" id="direccion" v-model="puntoLocal.direccion" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="codigoPostal">Código Postal</label>
              <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="poblacion">Población</label>
              <input type="text" id="poblacion" v-model="puntoLocal.poblacion" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="provincia">Provincia</label>
              <input type="text" id="provincia" v-model="puntoLocal.provincia" class="form-control" required />
            </div>
          </div>

          <!-- Segunda Columna -->
          <div class="form-column">
            <div class="form-group">
              <label for="cupsluz">CUPS Luz</label>
              <input type="text" id="cupsluz" v-model="puntoLocal.cupsluz" class="form-control" />
            </div>
            <div class="form-group">
              <label for="cupsgas">CUPS Gas</label>
              <input type="text" id="cupsgas" v-model="puntoLocal.cupsgas" class="form-control" />
            </div>
            <div class="form-group">
              <label for="contador">Contador</label>
              <input
                type="text"
                id="contador"
                v-model="puntoLocal.contador"
                class="form-control"
                @input="puntoLocal.propiedadContador = !!puntoLocal.contador"
              />
            </div>
            <div class="form-group">
              <label for="modem">Modem</label>
              <input
                type="text"
                id="modem"
                v-model="puntoLocal.modem"
                class="form-control"
                @input="puntoLocal.propiedadModem = !!puntoLocal.modem"
              />
            </div>
          </div>

          <!-- Campos que ocupan dos columnas -->
          <div class="form-group full-width">
            <label for="observaciones">Observaciones</label>
            <textarea id="observaciones" v-model="puntoLocal.observaciones" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group full-width">
            <label for="fechaInstalacion">Fecha de Instalación</label>
            <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" class="form-control" />
          </div>
        </div>

        <!-- Botones -->
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="cancelarFormulario">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "CrearPuntosSuministroComponent",
  props: {
    cliente: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    ShowModalPS: {
      type: Boolean,
      required: true,
    },
    nuevoPunto: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      puntoLocal: { ...this.nuevoPunto }, // Hacemos una copia local inicial
    };
  },
  watch: {
    // Sincronizamos las propiedades al modificar `puntoLocal`
    puntoLocal: {
      deep: true,
      handler(newVal) {
        Object.assign(this.nuevoPunto, newVal);
      },
    },
  },
  methods: {
    guardarPuntoSuministro() {
      this.$emit("guardar-punto-suministro", this.nuevoPunto);
    },
    cancelarFormulario() {
      this.$emit("cerrar-formulario");
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; /* Asegura que esté alineado con la parte superior de la página */
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alineación en la parte superior */
  z-index: 1000; /* Asegura que el modal esté por encima de otros elementos */
  padding-top: 20px; /* Espacio entre el top de la pantalla y el modal */
}
.modal-content {
  width: 90%; /* Ocupa el 90% del ancho disponible */
  max-width: 1200px; /* Limita el ancho máximo */
  max-height: 80%; /* Limita la altura máxima */
  overflow-y: auto; /* Permite hacer scroll si el contenido excede la altura */
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); /* Sombra para dar un efecto elevado */
  box-sizing: border-box;
}
</style>