<template>
  <div v-if="formularioVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h2 class="modal-title">{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
      </div>

      <!-- Formulario principal -->
      <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()" class="scrollable-form">
        <!-- Pestañas para organizar el contenido -->
        <div class="form-tabs">
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'principal' }" @click="activeTab = 'principal'">
            <i class="fas fa-user-tie"></i> Datos Principales
          </button>
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'contactos' }" @click="activeTab = 'contactos'">
            <i class="fas fa-address-book"></i> Contactos
          </button>
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'adicional' }" @click="activeTab = 'adicional'">
            <i class="fas fa-cog"></i> Datos Adicionales
          </button>
        </div>

        <div class="tab-container" :style="{ minHeight: tabMinHeight + 'px' }">
          <!-- Contenido de la pestaña Datos Principales -->
          <div v-show="activeTab === 'principal'" class="tab-content" ref="principalTab">
            <div class="form-grid">
              <!-- Sección de identificación del cliente -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-id-card"></i>
                  <h3>Identificación del Cliente</h3>
                </div>
                <div class="form-group">
                  <label for="nombre">Nombre <span class="required">*</span></label>
                  <input type="text" id="nombre" v-model="clienteLocal.nombre" class="form-control" required />
                </div>

                <div class="form-group">
                  <label for="nombreComercial">Nombre Comercial <span class="required">*</span></label>
                  <input type="text" id="nombreComercial" v-model="clienteLocal.nombreComercial" class="form-control" required />
                </div>
                
                <div class="form-group">
                  <label for="cif">CIF <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fas fa-fingerprint icon-prefix"></i>
                    <input type="text" id="cif" v-model="clienteLocal.cif" class="form-control" required />
                  </div>
                </div>

                <div class="form-group">
                  <label for="actividad">Actividad</label>
                  <div class="input-with-icon">
                    <i class="fas fa-briefcase icon-prefix"></i>
                    <input type="text" id="actividad" v-model="clienteLocal.actividad" class="form-control" />
                  </div>
                </div>
              </div>

              <!-- Sección de dirección -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-map-marker-alt"></i>
                  <h3>Dirección</h3>
                </div>
                <div class="form-group">
                  <label for="direccionFiscal">Dirección Fiscal <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fas fa-home icon-prefix"></i>
                    <input type="text" id="direccionFiscal" v-model="clienteLocal.direccion" class="form-control" required />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group half">
                    <label for="poblacion">Población <span class="required">*</span></label>
                    <input type="text" id="poblacion" v-model="clienteLocal.poblacion" class="form-control" required />
                  </div>

                  <div class="form-group half">
                    <label for="provincia">Provincia <span class="required">*</span></label>
                    <input type="text" id="provincia" v-model="clienteLocal.provincia" class="form-control" required />
                  </div>
                </div>

                <div class="form-group">
                  <label for="codigoPostal">Código Postal <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fas fa-mail-bulk icon-prefix"></i>
                    <input type="text" id="codigoPostal" v-model="clienteLocal.codigoPostal" class="form-control" required />
                  </div>
                </div>
              </div>

              <!-- Sección de datos financieros -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-university"></i>
                  <h3>Datos Financieros</h3>
                </div>
                <div class="form-group">
                  <label for="iban">IBAN <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fas fa-credit-card icon-prefix"></i>
                    <input type="text" id="iban" v-model="clienteLocal.iban" class="form-control" required />
                  </div>
                </div>
              </div>

              <!-- Sección del autorizado -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-user-check"></i>
                  <h3>Persona Autorizada</h3>
                </div>
                <div class="form-group">
                  <label for="nombreAutorizado">Nombre Autorizado <span class="required">*</span></label>
                  <input type="text" id="nombreAutorizado" v-model="clienteLocal.nombreAutorizado" class="form-control" required />
                </div>

                <div class="form-row">
                  <div class="form-group half">
                    <label for="dniAutorizado">DNI Autorizado <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <i class="fas fa-id-badge icon-prefix"></i>
                      <input type="text" id="dniAutorizado" v-model="clienteLocal.dniAutorizado" class="form-control" required />
                    </div>
                  </div>

                  <div class="form-group half">
                    <label for="telefonoAutorizado">Teléfono Autorizado <span class="required">*</span></label>
                    <div class="input-with-icon">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoAutorizado" v-model="clienteLocal.telefonoAutorizado" class="form-control" required />
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="emailAutorizado">Email Autorizado <span class="required">*</span></label>
                  <div class="input-with-icon">
                    <i class="fas fa-envelope icon-prefix"></i>
                    <input type="email" id="emailAutorizado" v-model="clienteLocal.emailAutorizado" class="form-control" required />
                  </div>
                </div>
              </div>

              <!-- Sección de clasificación -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-tags"></i>
                  <h3>Clasificación</h3>
                </div>
                <div class="form-group">
                  <label for="codigoSector">Sector <span class="required">*</span></label>
                  <div class="select-container">
                    <select id="codigoSector" v-model="clienteLocal.codigoSector" class="form-select" required>
                      <option value="">Seleccione un sector</option>
                      <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                        {{ sector.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>

                <div class="form-group">
                  <label for="codigoSubtipologia">Subtipología <span class="required">*</span></label>
                  <div class="select-container">
                    <select id="codigoSubtipologia" v-model="clienteLocal.codigoSubtipologia" class="form-select" required>
                      <option value="">Seleccione una subtipología</option>
                      <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                        {{ subtipologia.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>

                <div class="form-group">
                  <label for="usuario">Usuario Asignado <span class="required">*</span></label>
                  <div class="select-container">
                    <select id="usuario" v-model="clienteLocal.idUsuario" class="form-select" required>
                      <option value="">Seleccione un usuario</option>
                      <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                        {{ usuario.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contenido de la pestaña Contactos -->
          <div v-show="activeTab === 'contactos'" class="tab-content" ref="contactosTab">
            <div class="form-grid">
              <!-- Contacto 1 -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-user"></i>
                  <h3>Contacto Principal</h3>
                </div>
                <div class="form-group">
                  <label for="nombreContacto1">Nombre</label>
                  <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" class="form-control" />
                </div>

                <div class="form-group">
                  <label for="cargoContacto1">Cargo</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user-tag icon-prefix"></i>
                    <input type="text" id="cargoContacto1" v-model="clienteLocal.cargoContacto1" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="telefonoContacto1">Teléfono</label>
                  <div class="input-with-icon">
                    <i class="fas fa-phone icon-prefix"></i>
                    <input type="text" id="telefonoContacto1" v-model="clienteLocal.telefonoContacto1" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="emailContacto1">Email</label>
                  <div class="input-with-icon">
                    <i class="fas fa-envelope icon-prefix"></i>
                    <input type="email" id="emailContacto1" v-model="clienteLocal.emailContacto1" class="form-control" />
                  </div>
                </div>
              </div>

              <!-- Contacto 2 -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-user"></i>
                  <h3>Contacto Secundario</h3>
                </div>
                <div class="form-group">
                  <label for="nombreContacto2">Nombre</label>
                  <input type="text" id="nombreContacto2" v-model="clienteLocal.nombreContacto2" class="form-control" />
                </div>

                <div class="form-group">
                  <label for="cargoContacto2">Cargo</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user-tag icon-prefix"></i>
                    <input type="text" id="cargoContacto2" v-model="clienteLocal.cargoContacto2" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="telefonoContacto2">Teléfono</label>
                  <div class="input-with-icon">
                    <i class="fas fa-phone icon-prefix"></i>
                    <input type="text" id="telefonoContacto2" v-model="clienteLocal.telefonoContacto2" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="emailContacto2">Email</label>
                  <div class="input-with-icon">
                    <i class="fas fa-envelope icon-prefix"></i>
                    <input type="email" id="emailContacto2" v-model="clienteLocal.emailContacto2" class="form-control" />
                  </div>
                </div>
              </div>

              <!-- Contacto 3 -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-user"></i>
                  <h3>Contacto Adicional</h3>
                </div>
                <div class="form-group">
                  <label for="nombreContacto3">Nombre</label>
                  <input type="text" id="nombreContacto3" v-model="clienteLocal.nombreContacto3" class="form-control" />
                </div>

                <div class="form-group">
                  <label for="cargoContacto3">Cargo</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user-tag icon-prefix"></i>
                    <input type="text" id="cargoContacto3" v-model="clienteLocal.cargoContacto3" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="telefonoContacto3">Teléfono</label>
                  <div class="input-with-icon">
                    <i class="fas fa-phone icon-prefix"></i>
                    <input type="text" id="telefonoContacto3" v-model="clienteLocal.telefonoContacto3" class="form-control" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="emailContacto3">Email</label>
                  <div class="input-with-icon">
                    <i class="fas fa-envelope icon-prefix"></i>
                    <input type="email" id="emailContacto3" v-model="clienteLocal.emailContacto3" class="form-control" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contenido de la pestaña Datos Adicionales -->
          <div v-show="activeTab === 'adicional'" class="tab-content" ref="adicionalTab">
            <div class="form-grid">
              <!-- Datos Telemedida -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-tachometer-alt"></i>
                  <h3>Telemedida</h3>
                </div>
                <div class="form-group">
                  <label for="userTelemedida">Usuario Telemedida</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user-cog icon-prefix"></i>
                    <input type="text" id="userTelemedida" v-model="clienteLocal.userTelemedida" class="form-control" />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="passTelemedida">Contraseña Telemedida</label>
                  <div class="input-with-icon">
                    <i class="fas fa-key icon-prefix"></i>
                    <input type="password" id="passTelemedida" v-model="clienteLocal.passTelemedida" class="form-control" />
                    <button type="button" class="icon-suffix toggle-password" @click="togglePasswordVisibility">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Notas -->
              <div class="form-section card full-width">
                <div class="section-header">
                  <i class="fas fa-sticky-note"></i>
                  <h3>Notas y Observaciones</h3>
                </div>
                <div class="form-group">
                  <textarea id="notas" v-model="clienteLocal.notas" class="form-control" rows="8" 
                    placeholder="Añada aquí cualquier nota o comentario relevante sobre el cliente..."></textarea>
                </div>
              </div>
              
              <!-- Espacio extra para mantener el tamaño del modal -->
              <div class="form-section card invisible-spacer">
                <div class="section-header">
                  <i class="fas fa-info-circle"></i>
                  <h3>Información Adicional</h3>
                </div>
                <div class="spacer-content"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de progreso y botones de navegación -->
        <div class="form-progress">
          <div class="progress-indicator">
            <div class="progress-step" :class="{ active: activeTab === 'principal', done: visitedTabs.includes('principal') }"></div>
            <div class="progress-step" :class="{ active: activeTab === 'contactos', done: visitedTabs.includes('contactos') }"></div>
            <div class="progress-step" :class="{ active: activeTab === 'adicional', done: visitedTabs.includes('adicional') }"></div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="modal-footer">
          <div class="required-legend"><span class="required">*</span> Campos obligatorios</div>            
          <div class="action-buttons">
            <button type="button" class="btn btn-secondary" @click="cancelarFormulario">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="submit" :disabled="isSubmitting" class="btn btn-primary">
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
      visitedTabs: ['principal'],
      showPassword: false,
      tabMinHeight: 600, // Altura mínima inicial para el contenedor de pestañas
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
        this.visitedTabs = ['principal'];
        // Actualizar altura después de mostrar
        this.$nextTick(() => this.updateTabHeight());
      }
    },
    nuevoCliente: {
      immediate: true,
      deep: true,
      handler(newVal) {
        this.clienteLocal = { ...newVal };
      },
    },
    usuarios(newVal) {
      if (newVal.length && this.clienteLocal.idUsuario) {
        const usuario = newVal.find(
          (usuario) => usuario.id === this.clienteLocal.idUsuario
        );
        this.clienteLocal.usuario = usuario || null;
      }
    },
    activeTab(newVal) {
      if (!this.visitedTabs.includes(newVal)) {
        this.visitedTabs.push(newVal);
      }
      // Actualizar la altura cuando cambia la pestaña
      this.$nextTick(() => this.updateTabHeight());
    }
  },
  mounted() {
    // Calcular la altura inicial después de montar el componente
    this.$nextTick(() => this.updateTabHeight());
    
    // Agregar listener para resize
    window.addEventListener('resize', this.updateTabHeight);
  },
  beforeUnmount() {
    // Eliminar el listener cuando el componente se destruye
    window.removeEventListener('resize', this.updateTabHeight);
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
        usuario: null,
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
    },
    updateTabHeight() {
      // Obtener referencias a todas las pestañas
      if (!this.$refs.principalTab) return;
      
      // Calcular la altura máxima entre todas las pestañas
      const heights = [
        this.$refs.principalTab.scrollHeight,
        this.$refs.contactosTab ? this.$refs.contactosTab.scrollHeight : 0,
        this.$refs.adicionalTab ? this.$refs.adicionalTab.scrollHeight : 0
      ];
      
      // Filtrar las alturas válidas (mayores que cero)
      const validHeights = heights.filter(h => h > 0);
      
      // Establecer la altura mínima al máximo de las alturas o al valor predeterminado
      const maxHeight = Math.max(...validHeights, 600);
      this.tabMinHeight = maxHeight;
    }
  },
};
</script>

<style scoped>

@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Estilos base del modal */
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
}

.modal-content {
  width: 95%;
  max-width: 100%;
  max-height: 100%;
  min-height: 700px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid #f0f0f0;
  background: #ffc40c;
  color: white;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Estilos del contenido del formulario */
.scrollable-form {
  overflow-y: auto;
  flex: 1;
  padding: 0;
  background-color: #f9fafc;
  display: flex;
  flex-direction: column;
}

/* Contenedor para mantener altura constante entre pestañas */
.tab-container {
  flex: 1;
  position: relative;
}

/* Sistema de pestañas */
.form-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 5;
}

.tab-btn {
  padding: 15px 25px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn:hover {
  color: #ffc40c;
  background-color: #f9fafc;
}

.tab-btn.active {
  color: #ffc40c;
  border-bottom-color: #ffc40c;
  background-color: #f9fafc;
}

.tab-btn i {
  font-size: 1rem;
}

.tab-content {
  padding: 30px;
  height: 100%;
}

/* Sistema de cuadrícula para los campos */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

/* Tarjetas para agrupar campos relacionados */
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  padding: 20px;
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

/* Tarjeta espaciadora invisible para mantener tamaño */
.invisible-spacer {
  visibility: visible; /* Cambiado a visible para que ocupe espacio real */
  opacity: 0.5; /* Semi-transparente para indicar que es un espacio de relleno */
}

.spacer-content {
  height: 220px; /* Altura para compensar y mantener tamaño constante */
}

/* Encabezados de sección */
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header i {
  font-size: 1.2rem;
  color: #ffc40c;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Estilos de campo de formulario */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 0;
}

.form-group.half {
  width: 50%;
  margin-bottom: 18px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.required {
  color: #e74c3c;
  margin-left: 3px;
}

/* Estilos para inputs con iconos */
.input-with-icon {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.9rem;
}

.input-with-icon input {
  padding-left: 38px;
}

.icon-suffix {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  padding: 0;
}

.toggle-password:hover {
  color: #ffc40c;
}

/* Nuevo estilo para selectores para evitar flechas duplicadas */
.select-container {
  position: relative;
  width: 100%;
}

.form-select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #333;
  background-color: #f9fafc;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
}

.form-select:focus {
  border-color: #ffc40c;
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.15);
  outline: none;
  background-color: #fff;
}

.select-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
}

/* Estilo para las opciones del select */
.form-select option {
  padding: 12px;
  font-size: 0.95rem;
  background-color: white;
  color: #333;
}

/* Controles de formulario */
.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #333;
  background-color: #f9fafc;
}

.form-control:focus {
  border-color: #ffc40c;
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.15);
  outline: none;
  background-color: #fff;
}

textarea.form-control {
  resize: vertical;
  min-height: 120px;
}

/* Indicador de progreso */
.form-progress {
  padding: 20px 30px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  bottom: 0;
}

.progress-indicator {
  display: flex;
  gap: 5px;
}

.progress-step {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: all 0.3s;
}

.progress-step.active {
  background-color: #ffc40c;
  transform: scale(1.2);
}

.progress-step.done {
  background-color: #2ecc71;
}

.tab-navigation {
  display: flex;
  gap: 10px;
}

/* Botones */
.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  border: none;
  outline: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #ffc40c;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #ffb400;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 196, 12, 0.3);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #e0e0e0;
  color: #666;
}

.btn-outline:hover:not(:disabled) {
  border-color: #ffc40c;
  color: #ffc40c;
  background-color: rgba(255, 196, 12, 0.05);
}

/* Pie del modal */
.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.required-legend {
  font-size: 0.85rem;
  color: #777;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

/* Responsive */
@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95vw;
    max-height: 95vh;
  }
  
  .form-tabs {
    overflow-x: auto;
    padding-bottom: 5px;
  }
  
  .tab-btn {
    padding: 12px 15px;
    white-space: nowrap;
    font-size: 0.9rem;
  }
  
  .tab-content {
    padding: 20px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-group.half {
    width: 100%;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .required-legend {
    order: 2;
  }
  
  .action-buttons {
    order: 1;
    width: 100%;
    justify-content: space-between;
  }
}
</style>