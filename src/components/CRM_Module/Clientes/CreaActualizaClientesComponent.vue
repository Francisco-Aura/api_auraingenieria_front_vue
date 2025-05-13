<template>
    <div v-if="formularioVisible" class="modal-overlay">
      <div class="modal-content">
        <!-- Título dinámico según el modo del formulario -->
        <div class="modal-header">
          <h2 class="modal-title">{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
        </div>

        <!-- Formulario para crear o actualizar clientes -->
        <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()" class="scrollable-form">
          <div class="form-container">
            <!-- Columna 1 -->
            <div class="form-column">
              <div class="form-section-title">Datos principales</div>
              <div class="form-group">
                <label for="nombre">Nombre</label>
                <input type="text" id="nombre" v-model="clienteLocal.nombre" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="nombreComercial">Nombre Comercial</label>
                <input type="text" id="nombreComercial" v-model="clienteLocal.nombreComercial" class="form-control" required />
              </div>
              
              <div class="form-group">
                <label for="cif">CIF</label>
                <input type="text" id="cif" v-model="clienteLocal.cif" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="actividad">Actividad</label>
                <input type="text" id="actividad" v-model="clienteLocal.actividad" class="form-control" />
              </div>

              <div class="form-group">
                <label for="iban">IBAN</label>
                <input type="text" id="iban" v-model="clienteLocal.iban" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="usuario">Usuario asignado</label>
                <select id="usuario" v-model="clienteLocal.idUsuario" class="form-control" required>
                  <option value="">Seleccione un Usuario</option>
                  <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                    {{ usuario.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Columna 2 -->
            <div class="form-column">
              <div class="form-section-title">Dirección</div>
              <div class="form-group">
                <label for="direccionFiscal">Dirección Fiscal</label>
                <input type="text" id="direccionFiscal" v-model="clienteLocal.direccion" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="poblacion">Población</label>
                <input type="text" id="poblacion" v-model="clienteLocal.poblacion" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="provincia">Provincia</label>
                <input type="text" id="provincia" v-model="clienteLocal.provincia" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="codigoPostal">Código Postal</label>
                <input type="text" id="codigoPostal" v-model="clienteLocal.codigoPostal" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="codigoSector">Código Sector</label>
                <select id="codigoSector" v-model="clienteLocal.codigoSector" class="form-control" required>
                  <option value="">Seleccione un código sector</option>
                  <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                    {{ sector.nombre }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label for="codigoSubtipologia">Código Subtipología</label>
                <select id="codigoSubtipologia" v-model="clienteLocal.codigoSubtipologia" class="form-control" required>
                  <option value="">Seleccione un código subtipología</option>
                  <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                    {{ subtipologia.nombre }}
                  </option>
                </select>
              </div>
            </div>   
            
            <!-- Columna 3 -->
            <div class="form-column">
              <div class="form-section-title">Datos de autorizado</div>
              <div class="form-group">
                <label for="nombreAutorizado">Nombre AUTORIZADO</label>
                <input type="text" id="nombreAutorizado" v-model="clienteLocal.nombreAutorizado" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="dniAutorizado">DNI AUTORIZADO</label>
                <input type="text" id="dniAutorizado" v-model="clienteLocal.dniAutorizado" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="telefonoAutorizado">Teléfono AUTORIZADO</label>
                <input type="text" id="telefonoAutorizado" v-model="clienteLocal.telefonoAutorizado" class="form-control" required />
              </div>

              <div class="form-group">
                <label for="emailAutorizado">Email AUTORIZADO</label>
                <input type="email" id="emailAutorizado" v-model="clienteLocal.emailAutorizado" class="form-control" required />
              </div>

              <div class="form-section-title">Telemedida</div>
              <div class="form-group">
                <label for="userTelemedida">Usuario Telemedida</label>
                <input type="text" id="userTelemedida" v-model="clienteLocal.userTelemedida" class="form-control" />
              </div>
              
              <div class="form-group">
                <label for="passTelemedida">Contraseña Telemedida</label>
                <input type="text" id="passTelemedida" v-model="clienteLocal.passTelemedida" class="form-control" />
              </div>
            </div> 

            <!-- Columna 4 -->
            <div class="form-column">
              <div class="form-section-title">Contacto 1</div>
              <div class="form-group">
                <label for="nombreContacto1">Nombre Contacto 1</label>
                <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" class="form-control" />
              </div>

              <div class="form-group">
                <label for="cargoContacto1">Cargo Contacto 1</label>
                <input type="text" id="cargoContacto1" v-model="clienteLocal.cargoContacto1" class="form-control" />
              </div>

              <div class="form-group">
                <label for="telefonoContacto1">Teléfono Contacto 1</label>
                <input type="text" id="telefonoContacto1" v-model="clienteLocal.telefonoContacto1" class="form-control" />
              </div>

              <div class="form-group">
                <label for="emailContacto1">Email Contacto 1</label>
                <input type="email" id="emailContacto1" v-model="clienteLocal.emailContacto1" class="form-control" />
              </div>

              <div class="form-section-title">Contacto 2</div>
              <div class="form-group">
                <label for="nombreContacto2">Nombre Contacto 2</label>
                <input type="text" id="nombreContacto2" v-model="clienteLocal.nombreContacto2" class="form-control" />
              </div>

              <div class="form-group">
                <label for="cargoContacto2">Cargo Contacto 2</label>
                <input type="text" id="cargoContacto2" v-model="clienteLocal.cargoContacto2" class="form-control" />
              </div>

              <div class="form-group">
                <label for="telefonoContacto2">Teléfono Contacto 2</label>
                <input type="text" id="telefonoContacto2" v-model="clienteLocal.telefonoContacto2" class="form-control" />
              </div>

              <div class="form-group">
                <label for="emailContacto2">Email Contacto 2</label>
                <input type="email" id="emailContacto2" v-model="clienteLocal.emailContacto2" class="form-control" />
              </div>
            </div>
            
            <!-- Columna 5 -->
            <div class="form-column">
              <div class="form-section-title">Contacto 3</div>
              <div class="form-group">
                <label for="nombreContacto3">Nombre Contacto 3</label>
                <input type="text" id="nombreContacto3" v-model="clienteLocal.nombreContacto3" class="form-control" />
              </div>

              <div class="form-group">
                <label for="cargoContacto3">Cargo Contacto 3</label>
                <input type="text" id="cargoContacto3" v-model="clienteLocal.cargoContacto3" class="form-control" />
              </div>

              <div class="form-group">
                <label for="telefonoContacto3">Teléfono Contacto 3</label>
                <input type="text" id="telefonoContacto3" v-model="clienteLocal.telefonoContacto3" class="form-control" />
              </div>

              <div class="form-group">
                <label for="emailContacto3">Email Contacto 3</label>
                <input type="email" id="emailContacto3" v-model="clienteLocal.emailContacto3" class="form-control" />
              </div>
            </div>
          </div>

          <!-- Campo "Notas" ocupa el ancho completo al final -->
          <div class="form-group full-width">
            <label for="notas">Notas</label>
            <textarea id="notas" v-model="clienteLocal.notas" class="form-control" rows="3"></textarea>
          </div>

          <!-- Botones de acción -->
          <div class="modal-footer">            
            <button type="button" class="btn btn-secondary" @click="cancelarFormulario">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="btn btn-primary">
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
@media (max-width: 700px) {
  .modal-content {
    min-width: 0;
    width: 98vw;
    max-width: 98vw;
    padding: 0 8px;
  }
}
.scrollable-form {
  overflow-y: auto;
  flex: 1;
  padding: 20px;
  background-color: #f8f9fa;
}

.form-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.form-column {
  flex: 1;
  min-width: 250px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #f5c600;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ffc40c;
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
}

.full-width {
  width: 100%;
  margin-top: 20px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
  border: none;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-primary {
  background-color: #ffc40c;
  color: white;
}

.btn-primary:hover {
  background-color: #ffb400;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background-color: #f9f9f9;
}

.form-control:focus {
  border-color: #ffc40c;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.25);
  outline: none;
}

select.form-control {
  height: 42px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23495057' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding-right: 40px;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

/* Estilos para inputs requeridos */
.form-control:required {
  border-left: 3px solid #ffc40c;
}

/* Estilos para estados de validación */
.form-control:valid {
  border-color: #28a745;
}

.form-control:invalid:not(:placeholder-shown) {
  border-color: #dc3545;
}

/* Agregar iconos a los inputs */
input[type="email"] {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23495057' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'%3E%3C/path%3E%3Cpolyline points='22,6 12,13 2,6'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

/* Estilos para pantallas pequeñas */
@media (max-width: 992px) {
  .form-column {
    min-width: calc(50% - 20px);
  }
}

@media (max-width: 768px) {
  .form-container {
    flex-direction: column;
  }
  
  .form-column {
    width: 100%;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-title {
    font-size: 1.3rem;
  }
  
  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
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
</style>
