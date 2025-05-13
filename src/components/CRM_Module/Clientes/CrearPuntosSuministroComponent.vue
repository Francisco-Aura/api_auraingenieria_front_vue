<template>
  <div v-if="ShowModalPS" class="modal-overlay">
    <div class="modal-content">
      <h2>Nuevo Punto de Suministro -  {{ cliente?.nombre || 'Desconocido' }}</h2>          
      <form @submit.prevent="guardarPuntoSuministro">
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
      required: true, // Esto causará el error si no se pasa desde el padre
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
form {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px 0 32px;
}
.modal-footer {
  background: #fff;
  padding: 18px 32px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  z-index: 2;
}
.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}
.input-with-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}
.input-with-checkbox input[type="text"] {
  flex: 1;
}
.input-with-checkbox label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-weight: 500;
  font-size: 0.95rem;
}
@media (max-width: 700px) {
  .modal-content {
    min-width: 0;
    width: 98vw;
    max-width: 98vw;
    padding: 0 8px;
  }
}
</style>
