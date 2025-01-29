<template>
    <div v-if="formularioVisible" class="modal-overlay">
      <div class="modal-content">
        <!-- Título dinámico según el modo del formulario -->
        <h2>{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>

        <!-- Formulario para crear o actualizar clientes -->
        <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()">
          <div class="form-container">
            <!-- Columna 1 -->
            <div class="form-column">              
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" v-model="clienteLocal.nombre" required />

              <label for="direccionFiscal">Dirección Fiscal</label>
              <input type="text" id="direccionFiscal" v-model="clienteLocal.direccion" required />              

              <label for="iban">IBAN</label>
              <input type="text" id="iban" v-model="clienteLocal.iban" required />

              <label for="nombreAutorizado">Nombre de AUTORIZADO</label>
              <input type="text" id="nombreAutorizado" v-model="clienteLocal.nombreAutorizado" required />                     

              <label for="nombreContacto1">Nombre Contacto 1</label>
              <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" />
             
              <label for="nombreContacto2">Nombre Contacto 2</label>
              <input type="text" id="nombreContacto2" v-model="clienteLocal.nombreContacto2" />             

              <label for="nombreContacto3">Nombre Contacto 3</label>
              <input type="text" id="nombreContacto3" v-model="clienteLocal.nombreContacto3" />
            </div>

            <!-- Columna 2 -->
            <div class="form-column">              
              <label for="nombreComercial">Nombre Comercial</label>
              <input type="text" id="nombreComercial" v-model="clienteLocal.nombreComercial" required />

              <label for="codigoPostal">Código Postal</label>
              <input type="text" id="codigoPostal" v-model="clienteLocal.codigoPostal" required />
        
              <label for="actividad">Actividad</label>
              <input type="text" id="actividad" v-model="clienteLocal.actividad" />

              <label for="dniAutorizado">DNI AUTORIZADO</label>
              <input type="text" id="dniAutorizado" v-model="clienteLocal.dniAutorizado" required />

              <label for="cargoContacto1">Cargo Contacto 1</label>
              <input type="text" id="cargoContacto1" v-model="clienteLocal.cargoContacto1" />

              <label for="cargoContacto2">Cargo Contacto 2</label>
              <input type="text" id="cargoContacto2" v-model="clienteLocal.cargoContacto2" />          

              <label for="cargoContacto3">Cargo Contacto 3</label>
              <input type="text" id="cargoContacto3" v-model="clienteLocal.cargoContacto3" />
         
            </div>   
            <!-- Columna 3 -->
            <div class="form-column">              
              <label for="cif">CIF</label>
              <input type="text" id="cif" v-model="clienteLocal.cif" required />

              <label for="poblacion">Población</label>
              <input type="text" id="poblacion" v-model="clienteLocal.poblacion" required />

              <label for="codigoSector">Código Sector</label>
              <select id="codigoSector" v-model="clienteLocal.codigoSector" required>
                <option value="">Seleccione un código sector</option>
                <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                  {{ sector.nombre }}
                </option>
              </select>                

              <label for="telefonoContacto">Teléfono de AUTORIZADO</label>
              <input type="text" id="telefonoAutorizado" v-model="clienteLocal.telefonoAutorizado" required />             

              <label for="telefonoContacto1">Telefono Contacto 1</label>
              <input type="text" id="telefonoContacto1" v-model="clienteLocal.telefonoContacto1" />            

              <label for="telefonoContacto2">Telefono Contacto 2</label>
              <input type="text" id="telefonoContacto2" v-model="clienteLocal.telefonoContacto2" />             

              <label for="telefonoContacto3">Telefono Contacto 3</label>
              <input type="text" id="telefonoContacto3" v-model="clienteLocal.telefonoContacto3" />

              <label for="userTelemedida">Usuario Telemedida</label>
              <input type="text" id="userTelemedida" v-model="clienteLocal.userTelemedida" />
                        
            </div> 

            <!-- Columna 4 -->
            <div class="form-column">
              <label for="usuario">Usuario asignado</label>
              <select id="usuario" v-model="clienteLocal.idUsuario" required>
                <option value="">Seleccione un Usuario</option>
                <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
            
              <label for="provincia">Provincia</label>
              <input type="text" id="provincia" v-model="clienteLocal.provincia" required />

              <label for="codigoSubtipologia">Código Subtipología</label>
              <select id="codigoSubtipologia" v-model="clienteLocal.codigoSubtipologia" required>
                <option value="">Seleccione un código subtipología</option>
                <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                  {{ subtipologia.nombre }}
                </option>
              </select>              

              <label for="emailAutorizado">Email de AUTORIZADO</label>
              <input type="email" id="emailAutorizado" v-model="clienteLocal.emailAutorizado" required />

              <label for="emailContacto1">Email Contacto 1</label>
              <input type="email" id="emailContacto1" v-model="clienteLocal.emailContacto1" />
             
              <label for="emailContacto2">Email Contacto 2</label>
              <input type="email" id="emailContacto2" v-model="clienteLocal.emailContacto2" />
            
              <label for="emailContacto3">Email Contacto 3</label>
              <input type="email" id="emailContacto3" v-model="clienteLocal.emailContacto3" />    
              
              <label for="passTelemedida">Contraseña Telemedida</label>
              <input type="text" id="passTelemedida" v-model="clienteLocal.passTelemedida" />
            </div>
          </div>

          <!-- Campo "Notas" ocupa el ancho completo al final -->
          <div class="form-notas full-width">
            <label for="notas">Notas</label>
            <textarea id="notas" v-model="clienteLocal.notas"></textarea>
          </div>

          <!-- Botones de acción -->
          <div class="form-buttons">            
            <button type="button" class="btn btn-cancelarUsuario" @click="cancelarFormulario">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="btn" >
              {{ modoActualizar ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
</template>

<script>
export default {
  name: "CreaActualizaClienteComponent",
  props: {
    formularioVisible: Boolean,
    modoActualizar: Boolean,
    nuevoCliente: {
      type: Object,
      required: true,
    },
    sectores: Array,
    usuarios: Array,
    subtipologias: Array,
    isSubmitting: Boolean,
  },
  data() {
    return {
      clienteLocal: this.modoActualizar
        ? { ...this.nuevoCliente } // Copia profunda para actualizar
        : this.crearClienteVacio(), // Objeto vacío para nuevo cliente
    };
  },
  watch: {
    formularioVisible(newVal) {
      // Cuando se abre el modal, sincroniza los datos del cliente.
      if (newVal) {
        this.clienteLocal = this.modoActualizar
          ? { ...this.nuevoCliente }
          : this.crearClienteVacio();
      }
    },
    nuevoCliente: {
      immediate: true, // Sincroniza al cargar el componente
      deep: true, // Detecta cambios en propiedades anidadas
      handler(newVal) {
        this.clienteLocal = { ...newVal };
      },
    },
    usuarios(newVal) {
      // Verifica y sincroniza usuario asignado si está definido.
      if (newVal.length && this.clienteLocal.idUsuario) {
        const usuario = newVal.find(
          (usuario) => usuario.id === this.clienteLocal.idUsuario
        );
        this.clienteLocal.usuario = usuario || null;
      }
    },
  },
  methods: {
    crearClienteVacio() {
      return {
        nombre: "",
        cif: "",
        direccion: "",
        poblacion: "",
        provincia: "",
        codigoPostal: "",
        telefonoAutorizado: "",
        emailAutorizado: "",
        nombreComercial: "",
        fechaAlta: "",
        actividad: "",
        codigoSector: "",
        codigoSubtipologia: "",
        idUsuario: "",
        dniAutorizado: "",
        nombreAutorizado: "",
        notas: "",
        nombreContacto1: "",
        cargoContacto1: "",
        telefonoContacto1: "",
        emailContacto1: "",
        nombreContacto2: "",
        cargoContacto2: "",
        telefonoContacto2: "",
        emailContacto2: "",
        nombreContacto3: "",
        cargoContacto3: "",
        telefonoContacto3: "",
        emailContacto3: "",
        iban: "",
        userTelemedida: "",
        passTelemedida: "",
        usuario: null, // Agregado para evitar problemas de reactividad
      };
    },
    cancelarFormulario() {
      this.$emit("cancelar-formulario");
    },
    crearCliente() {
      console.log("Creando nuevo cliente:", this.clienteLocal);
      this.$emit("crear-cliente", this.clienteLocal);
    },
    actualizarCliente() {
      if (!this.clienteLocal.id) {
        console.error("El cliente no tiene un ID para actualizar.");
        return;
      }
      if (!this.clienteLocal.idUsuario) {
        console.error("El cliente no tiene un usuario asignado.");
        return;
      }
      console.log("Actualizando cliente con ID:", this.clienteLocal.id, "Usuario:", this.clienteLocal.idUsuario);
      this.$emit("actualizar-cliente", this.clienteLocal);
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
