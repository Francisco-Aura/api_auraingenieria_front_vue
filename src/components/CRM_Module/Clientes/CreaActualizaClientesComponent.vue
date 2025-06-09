<template>
  <div v-if="formularioVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h2 class="modal-title">{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
        <button type="button" class="close-button" @click="cancelarFormulario">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulario principal -->
      <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()">
        <!-- Pestañas para organizar el contenido -->
        <div class="form-tabs">
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'principal' }" @click="activeTab = 'principal'">
            <i class="fas fa-user-tie"></i> <span class="tab-text">Datos Principales</span>
          </button>
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'contactos' }" @click="activeTab = 'contactos'">
            <i class="fas fa-address-book"></i> <span class="tab-text">Contactos & Adicionales</span>
          </button>
        </div>

        <div class="tab-container">
          <!-- Contenido de la pestaña Datos Principales -->
          <div v-show="activeTab === 'principal'" class="tab-content">
            <div class="form-grid-compact">
              <!-- Identificación y Dirección en una fila -->
              <div class="form-section-compact">
                <div class="section-header-compact">
                  <i class="fas fa-id-card"></i>
                  <h3>Identificación</h3>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="nombre">Nombre <span class="required">*</span></label>
                    <input type="text" id="nombre" v-model="clienteLocal.nombre" class="form-control-compact" required />
                  </div>
                  <div class="form-group-compact">
                    <label for="grupoEmpresarial">Grupo Empresarial <span class="required">*</span></label>
                    <input type="text" id="grupoEmpresarial" v-model="clienteLocal.grupoEmpresarial" class="form-control-compact" required />
                  </div>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="cif">CIF <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-fingerprint icon-prefix"></i>
                      <input type="text" id="cif" v-model="clienteLocal.cif" class="form-control-compact" required />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="actividad">Actividad</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-briefcase icon-prefix"></i>
                      <input type="text" id="actividad" v-model="clienteLocal.actividad" class="form-control-compact" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section-compact">
                <div class="section-header-compact">
                  <i class="fas fa-map-marker-alt"></i>
                  <h3>Dirección</h3>
                </div>
                <div class="form-group-compact">
                  <label for="direccionFiscal">Dirección Fiscal <span class="required">*</span></label>
                  <div class="input-with-icon-compact">
                    <i class="fas fa-home icon-prefix"></i>
                    <input type="text" id="direccionFiscal" v-model="clienteLocal.direccion" class="form-control-compact" required />
                  </div>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="poblacion">Población <span class="required">*</span></label>
                    <input type="text" id="poblacion" v-model="clienteLocal.poblacion" class="form-control-compact" required />
                  </div>
                  <div class="form-group-compact">
                    <label for="provincia">Provincia <span class="required">*</span></label>
                    <input type="text" id="provincia" v-model="clienteLocal.provincia" class="form-control-compact" required />
                  </div>
                  <div class="form-group-compact">
                    <label for="codigoPostal">C.P. <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-mail-bulk icon-prefix"></i>
                      <input type="text" id="codigoPostal" v-model="clienteLocal.codigoPostal" class="form-control-compact" required />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Datos Financieros y Clasificación -->
              <div class="form-section-compact">
                <div class="section-header-compact">
                  <i class="fas fa-university"></i>
                  <h3>Datos Financieros</h3>
                </div>
                <div class="form-group-compact">
                  <label for="iban">IBAN <span class="required">*</span></label>
                  <div class="input-with-icon-compact">
                    <i class="fas fa-credit-card icon-prefix"></i>
                    <input type="text" id="iban" v-model="clienteLocal.iban" class="form-control-compact" required />
                  </div>
                </div>
              </div>

              <div class="form-section-compact">
                <div class="section-header-compact">
                  <i class="fas fa-tags"></i>
                  <h3>Clasificación</h3>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="codigoSector">Sector <span class="required">*</span></label>
                    <div class="select-container-compact">
                      <select id="codigoSector" v-model="clienteLocal.codigoSector" class="form-select-compact" required>
                        <option value="">Seleccione...</option>
                        <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                          {{ sector.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="codigoSubtipologia">Subtipología <span class="required">*</span></label>
                    <div class="select-container-compact">
                      <select id="codigoSubtipologia" v-model="clienteLocal.codigoSubtipologia" class="form-select-compact" required>
                        <option value="">Seleccione...</option>
                        <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                          {{ subtipologia.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                </div>
                <div class="form-group-compact">
                  <label for="usuario">Usuario Asignado <span class="required">*</span></label>
                  <div class="select-container-compact">
                    <select id="usuario" v-model="clienteLocal.idUsuario" class="form-select-compact" required>
                      <option value="">Seleccione...</option>
                      <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                        {{ usuario.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>

              <!-- Persona Autorizada -->
              <div class="form-section-compact full-width">
                <div class="section-header-compact">
                  <i class="fas fa-user-check"></i>
                  <h3>Persona Autorizada</h3>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="nombreAutorizado">Nombre <span class="required">*</span></label>
                    <input type="text" id="nombreAutorizado" v-model="clienteLocal.nombreAutorizado" class="form-control-compact" required />
                  </div>
                  <div class="form-group-compact">
                    <label for="dniAutorizado">DNI <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-id-badge icon-prefix"></i>
                      <input type="text" id="dniAutorizado" v-model="clienteLocal.dniAutorizado" class="form-control-compact" required />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoAutorizado">Teléfono <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoAutorizado" v-model="clienteLocal.telefonoAutorizado" class="form-control-compact" required />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailAutorizado">Email <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailAutorizado" v-model="clienteLocal.emailAutorizado" class="form-control-compact" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contenido de la pestaña Contactos y Datos Adicionales -->
          <div v-show="activeTab === 'contactos'" class="tab-content">
            <div class="form-grid-compact">
              <!-- Tres contactos en fila -->
              <div class="contacts-row">
                <!-- Contacto 1 -->
                <div class="contact-card">
                  <div class="section-header-compact">
                    <i class="fas fa-user"></i>
                    <h3>Contacto Principal</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="nombreContacto1">Nombre</label>
                    <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" class="form-control-compact" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto1">Cargo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-user-tag icon-prefix"></i>
                      <input type="text" id="cargoContacto1" v-model="clienteLocal.cargoContacto1" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto1">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto1" v-model="clienteLocal.telefonoContacto1" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto1">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto1" v-model="clienteLocal.emailContacto1" class="form-control-compact" />
                    </div>
                  </div>
                </div>

                <!-- Contacto 2 -->
                <div class="contact-card">
                  <div class="section-header-compact">
                    <i class="fas fa-user"></i>
                    <h3>Contacto Secundario</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="nombreContacto2">Nombre</label>
                    <input type="text" id="nombreContacto2" v-model="clienteLocal.nombreContacto2" class="form-control-compact" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto2">Cargo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-user-tag icon-prefix"></i>
                      <input type="text" id="cargoContacto2" v-model="clienteLocal.cargoContacto2" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto2">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto2" v-model="clienteLocal.telefonoContacto2" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto2">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto2" v-model="clienteLocal.emailContacto2" class="form-control-compact" />
                    </div>
                  </div>
                </div>

                <!-- Contacto 3 -->
                <div class="contact-card">
                  <div class="section-header-compact">
                    <i class="fas fa-user"></i>
                    <h3>Contacto Adicional</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="nombreContacto3">Nombre</label>
                    <input type="text" id="nombreContacto3" v-model="clienteLocal.nombreContacto3" class="form-control-compact" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto3">Cargo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-user-tag icon-prefix"></i>
                      <input type="text" id="cargoContacto3" v-model="clienteLocal.cargoContacto3" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto3">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto3" v-model="clienteLocal.telefonoContacto3" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto3">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto3" v-model="clienteLocal.emailContacto3" class="form-control-compact" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Datos Adicionales en la parte inferior -->
              <div class="additional-data-row">
                <div class="form-section-compact">
                  <div class="section-header-compact">
                    <i class="fas fa-tachometer-alt"></i>
                    <h3>Telemedida</h3>
                  </div>
                  <div class="form-row-compact">
                    <div class="form-group-compact">
                      <label for="userTelemedida">Usuario</label>
                      <div class="input-with-icon-compact">
                        <i class="fas fa-user-cog icon-prefix"></i>
                        <input type="text" id="userTelemedida" v-model="clienteLocal.userTelemedida" class="form-control-compact" />
                      </div>
                    </div>
                    <div class="form-group-compact">
                      <label for="passTelemedida">Contraseña</label>
                      <div class="input-with-icon-compact">
                        <i class="fas fa-key icon-prefix"></i>
                        <input type="password" id="passTelemedida" v-model="clienteLocal.passTelemedida" class="form-control-compact" />
                        <button type="button" class="icon-suffix toggle-password" @click="togglePasswordVisibility">
                          <i class="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-section-compact notes-section">
                  <div class="section-header-compact">
                    <i class="fas fa-sticky-note"></i>
                    <h3>Notas</h3>
                  </div>
                  <div class="form-group-compact">
                    <textarea id="notas" v-model="clienteLocal.notas" class="form-control-compact notes-textarea" 
                      placeholder="Notas y observaciones..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="modal-footer-compact">
          <div class="required-legend"><span class="required">*</span> Campos obligatorios</div>            
          <div class="action-buttons">
            <button type="button" class="btn-compact btn-secondary" @click="cancelarFormulario">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="submit" :disabled="isSubmitting" class="btn-compact btn-primary">
              <i class="fas" :class="modoActualizar ? 'fa-save' : 'fa-plus-circle'"></i>
              {{ modoActualizar ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
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
      default: () => ({})
    },
    sectores: Array,
    usuarios: Array,
    subtipologias: Array,
    isSubmitting: Boolean,
  },
  data() {
    return {
      activeTab: 'principal',
      showPassword: false,
      clienteLocal: this.modoActualizar
        ? { ...this.nuevoCliente }
        : this.crearClienteVacio(),
    };
  },
  watch: {
    formularioVisible(newVal) {
      if (newVal) {
        this.clienteLocal = this.modoActualizar
          ? { ...this.nuevoCliente }
          : this.crearClienteVacio();
        this.activeTab = 'principal';
      }
    },
    nuevoCliente: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (newVal) {
          this.clienteLocal = { 
            ...newVal,
            grupoEmpresarial: newVal.nombreComercial || newVal.grupoEmpresarial || ''
          };
        }
      },
    },
    usuarios(newVal) {
      if (newVal.length && this.clienteLocal.idUsuario) {
        const usuario = newVal.find(
          (usuario) => usuario.id === this.clienteLocal.idUsuario
        );
        this.clienteLocal.usuario = usuario || null;
      }
    }
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
        grupoEmpresarial: "",
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
        usuario: null,
      };
    },
    cancelarFormulario() {
      this.$emit("cancelar-formulario");
    },
    crearCliente() {
      const clienteParaEnviar = {
        ...this.clienteLocal,
        nombreComercial: this.clienteLocal.grupoEmpresarial
      };
      this.$emit("crear-cliente", clienteParaEnviar);
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
      const clienteParaEnviar = {
        ...this.clienteLocal,
        nombreComercial: this.clienteLocal.grupoEmpresarial
      };
      this.$emit("actualizar-cliente", clienteParaEnviar);
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
      const passInput = document.getElementById('passTelemedida');
      const eyeIcon = document.querySelector('.toggle-password i');
      
      if (passInput) {
        passInput.type = this.showPassword ? 'text' : 'password';
        if (eyeIcon) {
          eyeIcon.className = this.showPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
      }
    }
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Estilos base del modal - tamaño optimizado */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;    
  width: 100%;
  height: 100%;
  padding: 15px;
}

.modal-content {
  width: 90%;
  max-width: 90%;
  height: 90%;
  max-height: 90%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 18px 25px;
  border-bottom: 1px solid #e0e0e0;
  background: rgba(252, 215, 0);
  color: white;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #e74c3c;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.close-button:hover {
  background-color: #c0392b;
  color: white;
  transform: rotate(90deg);
}

/* Sistema de pestañas */
.form-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.tab-btn {
  padding: 15px 25px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  flex: 1;
  justify-content: center;
}

.tab-btn:hover {
  background-color: #f8f9fa;
}

.tab-btn.active {
  border-bottom-color: rgba(252, 215, 0);
  background-color: #fcfbf9;
  color: #333;
}

.tab-text {
  font-size: 0.95rem;
}

/* Contenedor de pestañas optimizado */
.tab-container {
  flex: 1;
  min-height: 0;
}

.tab-content {
  height: 100%;
  overflow-y: auto; /* Mantenemos el scroll solo en el contenido de las pestañas */
  padding-right: 5px; /* Añadido para evitar que el scroll tape contenido */
}

/* Grid optimizado */
.form-grid-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  max-width: 100%;
}

.form-section-compact {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 18px;
}

.form-section-compact.full-width {
  grid-column: 1 / -1;
}

/* Secciones específicas para contactos */
.contacts-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}

.contact-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 18px;
}

.additional-data-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 18px;
}

.notes-section {
  grid-column: 2;
}

/* Encabezados */
.section-header-compact {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-compact i {
  font-size: 1.1rem;
  color:black;
  width: 18px;
}

.section-header-compact h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Grupos de formulario */
.form-group-compact {
  margin-bottom: 12px;
}

.form-group-compact label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  color: black;
}

.form-row-compact {
  display: flex;
  gap: 12px;
  margin-bottom: 0;
}

.form-row-compact .form-group-compact {
  flex: 1;
  margin-bottom: 12px;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}

/* Inputs con iconos */
.input-with-icon-compact {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.9rem;
  width: 14px;
}

.input-with-icon-compact .form-control-compact {
  padding-left: 32px;
}

.icon-suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  font-size: 0.9rem;
}

.toggle-password:hover {
  color: rgba(252, 215, 0);
}

/* Controles de formulario */
.form-control-compact {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  height: 38px;
}

.form-control-compact:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.notes-textarea {
  height: 100px !important;
  resize: vertical;
  min-height: 80px;
}

/* Selectores */
.select-container-compact {
  position: relative;
  width: 100%;
}

.form-select-compact {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
  height: 38px;
}

.form-select-compact:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
  font-size: 0.8rem;
}

/* Botones */
.btn-compact {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  border: none;
  outline: none;
}

.btn-compact:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: rgba(252, 215, 0);
  color: black;
}

.btn-primary:hover:not(:disabled) {
  background-color: rgb(222, 189, 0);
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-1px);
}

/* Pie del modal - fijo */
.modal-footer-compact {
  padding: 16px 25px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.required-legend {
  font-size: 1rem;
  color: #777;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* Responsive */
@media (max-width: 1200px) {
  .contacts-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .additional-data-row {
    grid-template-columns: 1fr;
  }
  
  .notes-section {
    grid-column: 1;
  }
}

@media (max-width: 900px) {
  .modal-content {
    width: 95%;
    height: 85vh;
  }
  
  .form-grid-compact {
    grid-template-columns: 1fr;
  }
  
  .contacts-row {
    grid-template-columns: 1fr;
  }
  
  .form-row-compact {
    flex-direction: column;
    gap: 8px;
  }
  
  .tab-text {
    display: none;
  }
  
  .tab-content {
    padding: 15px;
  }
}

@media (max-width: 600px) {
  .modal-footer-compact {
    flex-direction: column;
    gap: 10px;
    padding: 12px 20px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>