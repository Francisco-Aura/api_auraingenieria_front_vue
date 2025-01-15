<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h1>Actualizar Punto de Suministro</h1>
      <h2>{{ puntoLocal.nombreCliente || 'Desconocido' }}</h2>

      <!-- Formulario para actualizar el punto de suministro -->
      <form @submit.prevent="actualizarPS">
        <div class="form-grid">
          <!-- Primera Columna del formulario -->
          <div class="form-column">
            <div class="form-group">
              <label for="direccion">Dirección</label>
              <input 
                type="text" 
                id="direccion" 
                v-model="puntoLocal.direccion" 
                class="form-control" 
                required
              />
            </div>
            <div class="form-group">
              <label for="codigoPostal">Código Postal</label>
              <input 
                type="text" 
                id="codigoPostal" 
                v-model="puntoLocal.codigoPostal" 
                class="form-control" 
                required
              />
            </div>
            <div class="form-group">
              <label for="poblacion">Población</label>
              <input 
                type="text" 
                id="poblacion" 
                v-model="puntoLocal.poblacion" 
                class="form-control" 
                required
              />
            </div>
            <div class="form-group">
              <label for="provincia">Provincia</label>
              <input 
                type="text" 
                id="provincia" 
                v-model="puntoLocal.provincia" 
                class="form-control" 
                required
              />
            </div>
          </div>

          <!-- Segunda Columna del formulario -->
          <div class="form-column">
            <div class="form-group">
              <label for="cupsluz">CUPS Luz</label>
              <input 
                type="text" 
                id="cupsluz" 
                v-model="puntoLocal.cupsluz" 
                class="form-control" 
              />
            </div>
            <div class="form-group">
              <label for="cupsgas">CUPS Gas</label>
              <input 
                type="text" 
                id="cupsgas" 
                v-model="puntoLocal.cupsgas" 
                class="form-control" 
              />
            </div>
            <div class="form-group">
              <label for="contador">Contador</label>
              <div class="input-with-checkbox">
                <input 
                  type="text" 
                  id="contador" 
                  v-model="puntoLocal.contador" 
                  class="form-control" 
                  @input="puntoLocal.propiedadContador = !!puntoLocal.contador"
                />
                <label>
                  <input 
                    type="checkbox" 
                    v-model="puntoLocal.propiedadContador"
                    disabled
                  />
                  Propiedad
                </label>
              </div>
            </div>
            <div class="form-group">
              <label for="modem">Modem</label>
              <div class="input-with-checkbox">
                <input 
                  type="text" 
                  id="modem" 
                  v-model="puntoLocal.modem" 
                  class="form-control" 
                  @input="puntoLocal.propiedadModem = !!puntoLocal.modem"
                />
                <label>
                  <input 
                    type="checkbox" 
                    v-model="puntoLocal.propiedadModem"
                    disabled
                  />
                  Propiedad
                </label>
              </div>
            </div>
          </div>

          <!-- Campos que ocupan toda el ancho -->
          <div class="form-group full-width">
            <label for="observaciones">Observaciones</label>
            <textarea 
              id="observaciones" 
              v-model="puntoLocal.observaciones" 
              class="form-control" 
              rows="3"
            ></textarea>
          </div>
          <div class="form-group full-width">
            <label for="fechaInstalacion">Fecha de Instalación</label>
            <input 
              type="date" 
              id="fechaInstalacion" 
              v-model="puntoLocal.fechaInstalacion" 
              class="form-control" 
            />
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="modal-footer">
          <button type="button" @click="cerrarModal" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary">Actualizar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalActualizarPunto',
  props: {
    modificarPunto: Object,
  },
  data() {
    return {
      puntoLocal: { ...this.modificarPunto }
    };
  },
  methods: {
    cerrarModal() {
      this.$emit('cerrar-modal');
    },
    actualizarPS() {
      this.$emit('actualizar-punto-suministro', this.puntoLocal);
    },
  },
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
  max-width: 1200px;
  max-height: 80%;
  overflow-y: auto;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
}
</style>