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
      default: () => ({})  // 🔹 Si es null, usa un objeto vacío
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
      this.$emit("actualizar-cliente", this.clienteLocal);
        },
    },
};
</script>


<style scoped>
.modal-content {
  height: 95%; 
}
</style>
