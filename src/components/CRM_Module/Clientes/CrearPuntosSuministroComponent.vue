<template>
    <div class="modal-overlay" v-if="formularioVisible">
      <div class="modal-content" style="width: 80%; max-width: 900px; padding: 20px;">
        <h1>Nuevo Punto de Suministro</h1>
        <br />
        <h2>{{ clienteSeleccionado?.nombre || 'Desconocido' }}</h2>
  
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
      formularioVisible: Boolean,
      clienteSeleccionado: Object,
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
  /* Añade aquí los estilos del componente */
  </style>
  