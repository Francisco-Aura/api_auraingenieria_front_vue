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
              <label for="empleado">Empleado</label>
              <select id="empleado" v-model="clienteLocal.idEmpleado" required>
                <option value="">Seleccione un empleado</option>
                <option v-for="empleado in empleados" :key="empleado.idUsuario" :value="empleado.idUsuario">
                  {{ empleado.nombre }}
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
        empleados: Array,
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
        nuevoCliente: {
            immediate: true, // Se ejecuta al inicio para sincronizar
            deep: true,
            handler(newVal) {
            this.clienteLocal = { ...newVal }; // Copia profunda para evitar referencias compartidas
            },
        },
        modoActualizar(newVal) {
            if (!newVal) this.resetFormulario(); // Reinicia datos si no es actualización
        },
    },
    methods: {
        crearClienteVacio() {
            return {
            nombre: '',
            nombreComercial: '',
            cif: '',
            direccion: '',
            codigoPostal: '',
            poblacion: '',
            provincia: '',
            iban: '',
            nombreAutorizado: '',
            dniAutorizado: '',
            telefonoAutorizado: '',
            emailAutorizado: '',
            idEmpleado: null,
            actividad: '',
            codigoSector: null,
            codigoSubtipologia: null,
            notas: '',
            userTelemedida: '',
            passTelemedida: '',
            nombreContacto1: '',
            cargoContacto1: '',
            emailContacto1: '',
            telefonoContacto1: '',
            nombreContacto2: '',
            cargoContacto2: '',
            emailContacto2: '',
            telefonoContacto2: '',
            nombreContacto3: '',
            cargoContacto3: '',
            emailContacto3: '',
            telefonoContacto3: '',
            };
        },
        resetFormulario() {
            this.clienteLocal = this.crearClienteVacio(); // Restablece cliente
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
            console.log("Actualizando cliente con ID:", this.clienteLocal.id);
            this.$emit("actualizar-cliente", this.clienteLocal);
        }
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

.form-column {
  flex: 1;
}

form div {
  margin-bottom: 15px;
}

.form-container {
  display: flex;
  justify-content: space-between;
  gap: 20px; /* Espacio entre columnas */
}

/* Ajusta el ancho completo para el campo "Notas" */
.form-notas {
  margin-top: 1rem;
}

/* Aplica estilos a los botones */
.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* Estilos para los inputs, selects y textarea */
.form-column input,
.form-column select {
  width: 100%;
  padding: 10px;
  margin: 5px 0;
  border-radius: 5px;
  border: 1px solid #ccc; 
  font-size: 14px;
  box-sizing: border-box;
}

textarea {
  width: 200%; /* Asegura que el textarea ocupe todo el ancho disponible */
  height: 100px; /* Ajusta la altura por defecto */
  padding: 10px; /* Espaciado interior */
  font-size: 14px; /* Fuente legible */
  border: 1px solid #ccc; /* Estilo del borde */
  border-radius: 5px; /* Bordes redondeados */
  resize: vertical; /* Permite redimensionar solo verticalmente */
}

/* Área de texto "Notas" ajustada al ancho */
textarea#notas {
  width: 100%;
  height: 120px; /* Ajusta según sea necesario */
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
  resize: vertical;
}
</style>