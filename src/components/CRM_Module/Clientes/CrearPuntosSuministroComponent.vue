<template>
  <div v-if="ShowModalPS" class="modal-overlay">
    <div class="modal-content">
      <h1>Nuevo Punto de Suministro</h1>
      <br />
      <h2>{{ cliente?.nombre || 'Desconocido' }}</h2>

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
  position: fixed; /* Posiciona el elemento en relación a la ventana del navegador */
  top: 0; /* Alinea con la parte superior de la página */
  left: 0; /* Alinea con la parte izquierda de la página */
  width: 100%; /* Ocupa todo el ancho de la página */
  height: 100%; /* Ocupa toda la altura de la página */
  background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
  display: flex; /* Utiliza Flexbox para la disposición del contenido */
  justify-content: center; /* Centra horizontalmente el contenido */
  align-items: flex-start; /* Alinea el contenido en la parte superior */
  z-index: 1000; /* Asegura que el modal esté por encima de otros elementos */
  padding-top: 20px; /* Espacio entre la parte superior de la pantalla y el modal */
}
.modal-content {
  width: 90%; /* Ocupa el 90% del ancho disponible */
  max-width: 1200px; /* Limita el ancho máximo */
  max-height: 80%; /* Limita la altura máxima */
  overflow-y: auto; /* Permite desplazamiento vertical si el contenido excede la altura */
  background-color: white; /* Fondo blanco */
  padding: 20px; /* Espaciado interno */
  border-radius: 10px; /* Bordes redondeados */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25); /* Sombra para dar un efecto elevado */
  box-sizing: border-box; /* Incluye padding y border en el cálculo del ancho y alto */
}

.form-column {
  flex: 1; /* Se expande para ocupar el espacio disponible */
}

form div {
  margin-bottom: 15px; /* Espacio inferior entre los elementos del formulario */
}

.form-container {
  display: flex; /* Utiliza Flexbox para la disposición de columnas */
  justify-content: space-between; /* Distribuye el espacio entre columnas */
  gap: 20px; /* Espacio entre columnas */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); /* Columnas flexibles */
}

.form-notas {
  margin-top: 1rem; /* Margen superior para el campo "Notas" */
}

.form-buttons {
  display: flex; /* Utiliza Flexbox para la disposición de botones */
  justify-content: flex-end; /* Alinea los botones a la derecha */
  gap: 1rem; /* Espacio entre botones */
  margin-top: 1.5rem; /* Margen superior para los botones */
}

.form-column input,
.form-column select {
  width: 100%; /* Ancho completo del contenedor padre */
  padding: 10px; /* Espaciado interno */
  margin: 5px 0; /* Margen vertical */
  border-radius: 5px; /* Bordes redondeados */
  border: 1px solid #ccc; /* Borde de los campos */
  font-size: 14px; /* Tamaño de la fuente */
  box-sizing: border-box; /* Incluye padding y border en el cálculo del ancho y alto */
}

button {
  padding: 10px 20px; /* Espaciado interno */
  margin-right: 10px; /* Margen derecho */
  border: none; /* Sin borde */
  background-color: #333; /* Color de fondo */
  color: #f5c600; /* Color del texto */
  border-radius: 5px; /* Bordes redondeados */
}

button:hover {
  background-color: #f5c600; /* Color de fondo al pasar el cursor */
  color: #333; /* Color del texto al pasar el cursor */
}

.btn-cancelar:hover {
  background-color: #5a6268; /* Color de fondo al pasar el cursor para el botón cancelar */
}

.form-grid {
  display: grid; /* Utiliza grid para la disposición del formulario */
  grid-template-columns: repeat(2, 1fr); /* Dos columnas iguales */
  gap: 1rem; /* Espaciado entre columnas y filas */
}

.full-width {
  grid-column: span 2; /* Ocupa ambas columnas */
  display: flex; /* Utiliza Flexbox para la disposición interna */
  flex-direction: column; /* Disposición en columna */
  gap: 0.5rem; /* Espaciado entre elementos internos */
}

.input-with-checkbox {
  display: flex; /* Utiliza Flexbox para la disposición del checkbox y el input */
  align-items: center; /* Alinea verticalmente los elementos */
  gap: 0.5rem; /* Espaciado entre checkbox e input */
}

.form-group {
  display: flex; /* Utiliza Flexbox para la disposición del grupo */
  flex-direction: column; /* Disposición en columna */
  gap: 0.5rem; /* Espaciado entre label y campo */
}

.form-group input,
.form-group textarea {
  width: 100%; /* Ancho completo del contenedor padre */
  box-sizing: border-box; /* Incluye padding y border en el cálculo del ancho y alto */
  padding: 8px; /* Espaciado interno */
  resize: none; /* Evita redimensionar el campo manualmente */
}

input, textarea, select {
  width: 98%; /* Ancho del campo, con un pequeño margen */
  padding: 0.5rem; /* Espaciado interno */
  margin-top: 0.5rem; /* Margen superior */
  border-radius: 4px; /* Bordes redondeados */
  border: 1px solid #ddd; /* Borde del campo */
}

textarea {
  width: 200%; /* Ancho del textarea */
  height: 100px; /* Altura del textarea */
  padding: 10px; /* Espaciado interno */
  font-size: 14px; /* Tamaño de la fuente */
  border: 1px solid #ccc; /* Borde del textarea */
  border-radius: 5px; /* Bordes redondeados */
  resize: vertical; /* Permite redimensionar solo verticalmente */
}

textarea#notas {
  width: 100%; /* Ancho del campo "Notas" */
  height: 120px; /* Altura del campo "Notas" */
  padding: 10px; /* Espaciado interno */
  border: 1px solid #ccc; /* Borde del campo */
  border-radius: 5px; /* Bordes redondeados */
  font-size: 14px; /* Tamaño de la fuente */
  resize: vertical; /* Permite redimensionar solo verticalmente */
}
</style>
