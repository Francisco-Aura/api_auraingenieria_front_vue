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
      <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()" novalidate>
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
          <div v-show="activeTab === 'principal'" class="tab-content" data-active-tab="principal">
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
                    <input type="text" id="nombre" v-model="clienteLocal.nombre" class="form-control-compact" :class="{ 'input-error': errores.nombre }" @input="errores.nombre = ''" maxlength="250" required />
                    <small v-if="errores.nombre" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.nombre }}</small>
                  </div>
                  <div class="form-group-compact">
                    <label for="grupoEmpresarial">Grupo Empresarial <span class="required">*</span></label>
                    <input type="text" id="grupoEmpresarial" v-model="clienteLocal.grupoEmpresarial" class="form-control-compact" :class="{ 'input-error': errores.grupoEmpresarial }" @input="errores.grupoEmpresarial = ''" maxlength="100" required />
                    <small v-if="errores.grupoEmpresarial" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.grupoEmpresarial }}</small>
                  </div>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="cif">CIF <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-fingerprint icon-prefix"></i>
                      <input type="text" id="cif" v-model="clienteLocal.cif" class="form-control-compact" :class="{ 'input-error': errores.cif }" @input="errores.cif = ''" maxlength="50" required />
                    </div>
                    <small v-if="errores.cif" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.cif }}</small>
                  </div>
                  <div class="form-group-compact">
                    <label for="actividad">Actividad</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-briefcase icon-prefix"></i>
                      <input type="text" id="actividad" v-model="clienteLocal.actividad" class="form-control-compact" maxlength="100" />
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
                    <input type="text" id="direccionFiscal" v-model="clienteLocal.direccion" class="form-control-compact" :class="{ 'input-error': errores.direccion }" @input="errores.direccion = ''" maxlength="200" required />
                  </div>
                  <small v-if="errores.direccion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.direccion }}</small>
                </div>
                <div class="form-row-compact">
                  <div class="form-group-compact">
                    <label for="poblacion">Población <span class="required">*</span></label>
                    <input type="text" id="poblacion" v-model="clienteLocal.poblacion" class="form-control-compact" :class="{ 'input-error': errores.poblacion }" @input="errores.poblacion = ''" maxlength="100" required />
                    <small v-if="errores.poblacion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.poblacion }}</small>
                  </div>
                  <div class="form-group-compact">
                    <label for="provincia">Provincia <span class="required">*</span></label>
                    <input type="text" id="provincia" v-model="clienteLocal.provincia" class="form-control-compact" :class="{ 'input-error': errores.provincia }" @input="errores.provincia = ''" maxlength="100" required />
                    <small v-if="errores.provincia" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.provincia }}</small>
                  </div>
                  <div class="form-group-compact">
                    <label for="codigoPostal">C.P. <span class="required">*</span></label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-mail-bulk icon-prefix"></i>
                      <input type="text" id="codigoPostal" v-model="clienteLocal.codigoPostal" class="form-control-compact" :class="{ 'input-error': errores.codigoPostal }" @input="errores.codigoPostal = ''" maxlength="10" required />
                    </div>
                    <small v-if="errores.codigoPostal" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.codigoPostal }}</small>
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
                    <input type="text" id="iban" v-model="clienteLocal.iban" class="form-control-compact" :class="{ 'input-error': errores.iban }" @input="errores.iban = ''" maxlength="100" required />
                  </div>
                  <small v-if="errores.iban" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.iban }}</small>
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
                    <div class="select-container-compact" :class="{ 'select-error': errores.codigoSector }">
                      <select id="codigoSector" v-model="clienteLocal.codigoSector" class="form-select-compact" @change="errores.codigoSector = ''" required>
                        <option value="">Seleccione...</option>
                        <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                          {{ sector.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                    <small v-if="errores.codigoSector" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.codigoSector }}</small>
                  </div>
                  <div class="form-group-compact">
                    <label for="codigoSubtipologia">Subtipología <span class="required">*</span></label>
                    <div class="select-container-compact" :class="{ 'select-error': errores.codigoSubtipologia }">
                      <select id="codigoSubtipologia" v-model="clienteLocal.codigoSubtipologia" class="form-select-compact" @change="errores.codigoSubtipologia = ''" required>
                        <option value="">Seleccione...</option>
                        <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                          {{ subtipologia.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                    <small v-if="errores.codigoSubtipologia" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.codigoSubtipologia }}</small>
                  </div>
                </div>                
                <div class="form-group-compact">
                  <label for="usuario">Usuario Asignado <span class="required">*</span></label>
                  <div class="select-container-compact" :class="{ 'select-error': errores.idUsuario }">
                    <select 
                      id="usuario" 
                      v-model="clienteLocal.idUsuario" 
                      class="form-select-compact" 
                      :disabled="!isAdvancedUser"
                      @change="errores.idUsuario = ''"
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                        {{ usuario.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                  <small v-if="errores.idUsuario" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idUsuario }}</small>
                  <div v-if="!isAdvancedUser" class="field-restriction-note">
                    <i class="fas fa-info-circle"></i> Solo usuarios avanzados pueden modificar este campo
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
                    <label for="nombreAutorizado">Nombre</label>
                    <input type="text" id="nombreAutorizado" v-model="clienteLocal.nombreAutorizado" class="form-control-compact" maxlength="100"/>
                  </div>
                  <div class="form-group-compact">
                    <label for="dniAutorizado">DNI</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-id-badge icon-prefix"></i>
                      <input type="text" id="dniAutorizado" v-model="clienteLocal.dniAutorizado" class="form-control-compact" maxlength="100"/>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoAutorizado">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoAutorizado" v-model="clienteLocal.telefonoAutorizado" class="form-control-compact" maxlength="100"/>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailAutorizado">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailAutorizado" v-model="clienteLocal.emailAutorizado" class="form-control-compact" :class="{ 'input-error': errores.emailAutorizado }" @input="errores.emailAutorizado = ''" maxlength="100" />
                    </div>
                    <small v-if="errores.emailAutorizado" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.emailAutorizado }}</small>
                  </div>
                </div>
              </div>
            </div>

            <!-- Servicios del Cliente -->
            <div class="services-section">
              <div class="services-header">
                <h3><i class="fas fa-cog"></i> Servicios del Cliente</h3>
              </div>
              <div class="services-checkboxes">
                <label class="service-checkbox">
                  <input type="checkbox" v-model="clienteLocal.gestionEnergetica" />
                  <span class="checkmark"></span>
                  <span class="service-label">GESTIÓN ENERGÉTICA</span>
                </label>
                <label class="service-checkbox">
                  <input type="checkbox" v-model="clienteLocal.telemedida" />
                  <span class="checkmark"></span>
                  <span class="service-label">TELEMEDIDA</span>
                </label>
                <label class="service-checkbox">
                  <input type="checkbox" v-model="clienteLocal.monitorizacionEnergetica" />
                  <span class="checkmark"></span>
                  <span class="service-label">MONITORIZACIÓN ENERGÉTICA</span>
                </label>
              </div>
            </div>
            
            <!-- Observaciones del Cliente -->
            <div class="form-section-compact notes-section full-width">
              <div class="section-header-compact">
                <i class="fas fa-sticky-note"></i>
                <h3>Notas y observaciones</h3>
              </div>
              <div class="form-group-compact">
                <textarea id="notas" v-model="clienteLocal.notas" class="form-control-compact notes-textarea" 
                  placeholder="Notas y observaciones..."></textarea>
              </div>
            </div>
            
            <!-- Navegación de pestañas (nuevo) -->
            <div class="tab-navigation">
              <div></div> <!-- Espacio vacío para alinear -->
              <div class="action-buttons">
                <!-- Botón Dar de Baja (solo si está activo y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && !clienteLocal.fechaBaja" type="button" @click="confirmarBajaCliente" class="btn-compact btn-danger">
                  <i class="fas fa-user-times"></i> Dar de Baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" type="button" @click="confirmarReactivarCliente" class="btn-compact btn-success">
                  <i class="fas fa-user-check"></i> Reactivar Cliente
                </button>
                <!-- Mensaje de estado si está dado de baja -->
                <div v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" class="status-message status-inactive">
                  <i class="fas fa-user-times"></i>
                  <span>Cliente dado de baja el {{ formatFecha(clienteLocal.fechaBaja) }}</span>
                </div>
                <button type="button" class="btn-compact btn-primary" @click="activeTab = 'contactos'">
                  <i class="fas fa-arrow-right"></i> Siguiente
                </button>
              </div>
            </div>
          </div>

          <!-- Contenido de la pestaña Contactos y Datos Adicionales -->
          <div v-show="activeTab === 'contactos'" class="tab-content" data-active-tab="contactos">
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
                    <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" class="form-control-compact" maxlength="100" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto1">Cargo</label>
                    <div class="select-container-compact">
                      <select id="cargoContacto1" v-model="clienteLocal.cargoContacto1" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option v-for="cargo in cargosContacto" :key="cargo.id" :value="cargo.nombre">{{ cargo.nombre }}</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto1">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto1" v-model="clienteLocal.telefonoContacto1" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto1">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto1" v-model="clienteLocal.emailContacto1" class="form-control-compact" :class="{ 'input-error': errores.emailContacto1 }" @input="errores.emailContacto1 = ''" maxlength="100" />
                    </div>
                    <small v-if="errores.emailContacto1" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.emailContacto1 }}</small>
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
                    <input type="text" id="nombreContacto2" v-model="clienteLocal.nombreContacto2" class="form-control-compact" maxlength="100" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto2">Cargo</label>
                    <div class="select-container-compact">
                      <select id="cargoContacto2" v-model="clienteLocal.cargoContacto2" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option v-for="cargo in cargosContacto" :key="cargo.id" :value="cargo.nombre">{{ cargo.nombre }}</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto2">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto2" v-model="clienteLocal.telefonoContacto2" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto2">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto2" v-model="clienteLocal.emailContacto2" class="form-control-compact" :class="{ 'input-error': errores.emailContacto2 }" @input="errores.emailContacto2 = ''" maxlength="100" />
                    </div>
                    <small v-if="errores.emailContacto2" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.emailContacto2 }}</small>
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
                    <input type="text" id="nombreContacto3" v-model="clienteLocal.nombreContacto3" class="form-control-compact" maxlength="100" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto3">Cargo</label>
                    <div class="select-container-compact">
                      <select id="cargoContacto3" v-model="clienteLocal.cargoContacto3" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option v-for="cargo in cargosContacto" :key="cargo.id" :value="cargo.nombre">{{ cargo.nombre }}</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="telefonoContacto3">Teléfono</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-phone icon-prefix"></i>
                      <input type="text" id="telefonoContacto3" v-model="clienteLocal.telefonoContacto3" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="emailContacto3">Email</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-envelope icon-prefix"></i>
                      <input type="email" id="emailContacto3" v-model="clienteLocal.emailContacto3" class="form-control-compact" :class="{ 'input-error': errores.emailContacto3 }" @input="errores.emailContacto3 = ''" maxlength="100" />
                    </div>
                    <small v-if="errores.emailContacto3" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.emailContacto3 }}</small>
                  </div>
                </div>
              </div>

              <!-- Datos Adicionales en la parte inferior -->
              <div class="additional-data-row">
                <div class="form-section-compact">
                  <div class="section-header-compact">
                    <i class="fas fa-tachometer-alt"></i>
                    <h3>Distribuidora</h3>
                  </div>
                  <div class="form-row-compact">
                    <div class="form-group-compact">
                      <label for="userTelemedida">Usuario</label>
                      <div class="input-with-icon-compact">
                        <i class="fas fa-user-cog icon-prefix"></i>
                        <input type="text" id="userTelemedida" v-model="clienteLocal.userTelemedida" class="form-control-compact" maxlength="100" />
                      </div>
                    </div>
                    <div class="form-group-compact">
                      <label for="passTelemedida">Contraseña</label>
                      <div class="input-with-icon-compact">
                        <i class="fas fa-key icon-prefix"></i>
                        <input type="text" id="passTelemedida" v-model="clienteLocal.passTelemedida" class="form-control-compact" maxlength="100" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Notas en ancho completo -->
              </div>
            </div>

            <!-- Navegación de pestañas (nuevo) -->
            <div class="tab-navigation">
              <button type="button" class="btn-compact btn-secondary" @click="activeTab = 'principal'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <div class="action-buttons">
                <!-- Botón Dar de Baja (solo si está activo y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && !clienteLocal.fechaBaja" type="button" @click="confirmarBajaCliente" class="btn-compact btn-danger">
                  <i class="fas fa-user-times"></i> Dar de Baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" type="button" @click="confirmarReactivarCliente" class="btn-compact btn-success">
                  <i class="fas fa-user-check"></i> Reactivar Cliente
                </button>
                <!-- Mensaje de estado si está dado de baja -->
                <div v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" class="status-message status-inactive">
                  <i class="fas fa-user-times"></i>
                  <span>Cliente dado de baja el {{ formatFecha(clienteLocal.fechaBaja) }}</span>
                </div>
                <button type="button" class="btn-compact btn-secondary" @click="cancelarFormulario">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" :disabled="isSubmitting" class="btn-compact btn-primary">
                  <i class="fas" :class="modoActualizar ? 'fa-save' : 'fa-plus-circle'"></i>
                  {{ modoActualizar ? 'Actualizar' : 'Crear' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
      
      <!-- Botón Cancelar flotante siempre visible -->
      <button type="button" class="btn-compact btn-secondary btn-cancel" @click="cancelarFormulario">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: "CreaActualizaClienteComponent",
  props: {
    formularioVisible: Boolean,
    modoActualizar: Boolean,
    nuevoCliente: {
      type: Object,
      required: true,
      default: () => ({
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
        // Servicios del cliente
        gestionEnergetica: false,
        telemedida: false,
        monitorizacionEnergetica: false,
      })
    },
    sectores: Array,
    usuarios: Array,
    subtipologias: Array,
    cargosContacto: Array,
    isSubmitting: Boolean,
  },
  data() {
    return {
      activeTab: 'principal',
      showPassword: false,
      darDeBaja: false,
      clienteLocal: this.crearClienteVacio(),
      errores: {},
    };
  },
  computed: {
    isAdvancedUser() {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      return usuario && usuario.nivelAcceso === 1;
    }
  },
  watch: {
    formularioVisible(newVal) {
      if (newVal) {
        this.clienteLocal = this.modoActualizar && this.nuevoCliente
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
          this.darDeBaja = !!newVal.fechaBaja;
        } else {
          this.clienteLocal = this.crearClienteVacio();
          this.darDeBaja = false;
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
        // Servicios del cliente
        gestionEnergetica: false,
        telemedida: false,
        monitorizacionEnergetica: false,
        fechaBaja: null,
      };
    },
    cancelarFormulario() {
      this.$emit("cancelar-formulario");
    },
    validarFormulario() {
      this.errores = {};
      const campos = [
        { campo: 'nombre', label: 'Nombre', tab: 'principal' },
        { campo: 'grupoEmpresarial', label: 'Grupo Empresarial', tab: 'principal' },
        { campo: 'cif', label: 'CIF', tab: 'principal' },
        { campo: 'direccion', label: 'Dirección Fiscal', tab: 'principal' },
        { campo: 'poblacion', label: 'Población', tab: 'principal' },
        { campo: 'provincia', label: 'Provincia', tab: 'principal' },
        { campo: 'codigoPostal', label: 'Código Postal', tab: 'principal' },
        { campo: 'iban', label: 'IBAN', tab: 'principal' },
        { campo: 'codigoSector', label: 'Sector', tab: 'principal' },
        { campo: 'codigoSubtipologia', label: 'Subtipología', tab: 'principal' },
        { campo: 'idUsuario', label: 'Usuario Asignado', tab: 'principal' },
      ];
      let primerTabError = null;
      for (const { campo, label, tab } of campos) {
        const val = this.clienteLocal[campo];
        if (!val || (typeof val === 'string' && !val.trim())) {
          this.errores[campo] = `${label} es obligatorio`;
          if (!primerTabError) primerTabError = tab;
        }
      }
      if (primerTabError) {
        this.activeTab = primerTabError;
        this.$swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Por favor, revise los campos marcados en rojo'
        });
        return false;
      }

      // Validación de formato de email
      const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const camposEmail = [
        { campo: 'emailAutorizado', label: 'Email (Persona Autorizada)', tab: 'contactos' },
        { campo: 'emailContacto1', label: 'Email (Contacto 1)', tab: 'contactos' },
        { campo: 'emailContacto2', label: 'Email (Contacto 2)', tab: 'contactos' },
        { campo: 'emailContacto3', label: 'Email (Contacto 3)', tab: 'contactos' },
      ];
      let emailTabError = null;
      for (const { campo, label, tab } of camposEmail) {
        const val = this.clienteLocal[campo];
        if (val && val.trim() && !regexEmail.test(val.trim())) {
          this.errores[campo] = `${label}: formato de email no válido`;
          if (!emailTabError) emailTabError = tab;
        }
      }
      if (emailTabError) {
        this.activeTab = emailTabError;
        this.$swal.fire({
          icon: 'warning',
          title: 'Email no válido',
          text: 'Por favor, revise los campos de email marcados en rojo'
        });
        return false;
      }

      return true;
    },
    crearCliente() {
      if (!this.validarFormulario()) return;
      if (this.darDeBaja && !this.clienteLocal.fechaBaja) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'Debe proporcionar una fecha de baja cuando se marca la opción de dar de baja.'
        })
        return;
      }
      const clienteParaEnviar = {
        ...this.clienteLocal,
        nombreComercial: this.clienteLocal.grupoEmpresarial,
        fechaBaja: this.darDeBaja ? this.clienteLocal.fechaBaja : null
      };
      this.$emit("crear-cliente", clienteParaEnviar);
    },
    actualizarCliente() {
      if (!this.validarFormulario()) return;
      if (!this.clienteLocal.id) {
        console.error("El cliente no tiene un ID para actualizar.");
        return;
      }
      if (!this.clienteLocal.idUsuario) {
        console.error("El cliente no tiene un usuario asignado.");
        return;
      }
      if (this.darDeBaja && !this.clienteLocal.fechaBaja) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'Debe proporcionar una fecha de baja cuando se marca la opción de dar de baja.'
        })
        return;
      }
      const clienteParaEnviar = {
        ...this.clienteLocal,
        nombreComercial: this.clienteLocal.grupoEmpresarial,
        fechaBaja: this.darDeBaja ? this.clienteLocal.fechaBaja : null
      };
      this.$emit("actualizar-cliente", clienteParaEnviar);
    },
    async confirmarBajaCliente() {
      try {
        const { value: fechaBaja, isConfirmed } = await this.$swal.fire({
          title: '¿Dar de baja al cliente?',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              <div style="background: #fef7f7; border: 1px solid #f5d5d5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #b56767; font-weight: 500; margin-bottom: 8px;">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>Acción de baja de cliente</span>
                </div>
                <p style="margin: 0; color: #8b4545; font-size: 14px;">Esta acción marcará al cliente como dado de baja en el sistema.</p>
                <p style="margin: 8px 0 0; color: #8b4545; font-size: 14px;">
                  <i class="fas fa-exclamation-circle" style="margin-right:4px;"></i>
                  Se darán de baja automáticamente <strong>todos sus puntos de suministro, contratos y servicios activos</strong>.
                </p>
              </div>
              <label for="swal-fecha-baja" style="display: block; font-weight: 500; color: #374151; margin-bottom: 8px;">
                <i class="fas fa-calendar-alt" style="margin-right: 8px; color: #b56767;"></i>
                Fecha de baja *
              </label>
              <input 
                type="date" 
                id="swal-fecha-baja" 
                class="swal2-input" 
                style="margin: 0; border: 2px solid #f5b2b2; border-radius: 6px; color: #8b4545;" 
                required
              />
            </div>
          `,
          icon: 'warning',
          iconColor: '#b56767',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-user-times"></i> Confirmar Baja',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#f5b2b2',
          cancelButtonColor: '#6b7280',
          focusCancel: false,
          customClass: {
            popup: 'swal-baja-cliente'
          },
          preConfirm: () => {
            const fechaBaja = document.getElementById('swal-fecha-baja').value;
            if (!fechaBaja) {
              this.$swal.showValidationMessage('Por favor, seleccione una fecha de baja');
              return false;
            }
            return fechaBaja;
          }
        });

        if (isConfirmed && fechaBaja) {
          this.clienteLocal.fechaBaja = fechaBaja;
          const clienteParaEnviar = {
            ...this.clienteLocal,
            nombreComercial: this.clienteLocal.grupoEmpresarial,
            fechaBaja: fechaBaja
          };
          
          this.$emit("actualizar-cliente", clienteParaEnviar);
        }
      } catch (error) {
        console.error('Error en confirmación de baja:', error);
      }
    },
    async confirmarReactivarCliente() {
      try {
        // Paso 1: confirmar reactivación del cliente
        const { isConfirmed } = await this.$swal.fire({
          title: '¿Reactivar cliente?',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #16a34a; font-weight: 500; margin-bottom: 8px;">
                  <i class="fas fa-user-check"></i>
                  <span>Reactivación de cliente</span>
                </div>
                <p style="margin: 0; color: #15803d; font-size: 14px;">Esta acción reactivará al cliente en el sistema, eliminando la fecha de baja.</p>
              </div>
            </div>
          `,
          icon: 'success',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-user-check"></i> Confirmar Reactivación',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#16a34a',
          cancelButtonColor: '#6b7280',
          focusCancel: false,
          customClass: {
            popup: 'swal-reactivar-cliente'
          }
        });

        if (!isConfirmed) return;

        // Reactivar cliente directamente via API (sin emitir al padre, para no interrumpir el flujo async)
        const clienteParaEnviar = {
          ...this.clienteLocal,
          nombreComercial: this.clienteLocal.grupoEmpresarial,
          fechaBaja: null
        };
        await axios.put(`${process.env.VUE_APP_API_URL}/api/clientes/${clienteParaEnviar.id}`, clienteParaEnviar);
        this.clienteLocal.fechaBaja = null;

        // Paso 2: obtener PS dados de baja de este cliente
        const clienteId = this.clienteLocal.id;
        if (!clienteId) {
          this.$emit("cliente-reactivado");
          return;
        }

        const { data: psDadosDeBaja } = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${clienteId}/dados-de-baja`
        );

        if (!psDadosDeBaja || psDadosDeBaja.length === 0) {
          this.$emit("cliente-reactivado");
          return;
        }

        // Paso 3: mostrar diálogo de selección de PS a reactivar
        const checkboxesHtml = psDadosDeBaja.map(ps => {
          const cups = ps.CUPSluz || ps.CUPSgas || '';
          const etiqueta = [ps.direccion, cups].filter(Boolean).join(' — ');
          return `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;">
            <input type="checkbox" value="${ps.id}" checked
              style="width:16px;height:16px;cursor:pointer;accent-color:#16a34a;">
            <span style="font-size:14px;color:#374151;">${etiqueta || 'PS #' + ps.id}</span>
          </label>`;
        }).join('');

        const { isConfirmed: confirmarPS, value: idsSeleccionados } = await this.$swal.fire({
          title: 'Reactivar puntos de suministro',
          html: `
            <div style="text-align:left;margin-top:12px;">
              <p style="margin:0 0 12px;color:#374151;font-size:14px;">Selecciona los puntos de suministro que deseas reactivar:</p>
              <div id="ps-checkboxes" style="max-height:240px;overflow-y:auto;padding:8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                ${checkboxesHtml}
              </div>
            </div>
          `,
          icon: 'question',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-bolt"></i> Reactivar seleccionados',
          cancelButtonText: '<i class="fas fa-times"></i> No reactivar ninguno',
          confirmButtonColor: '#16a34a',
          cancelButtonColor: '#6b7280',
          focusCancel: false,
          preConfirm: () => {
            const checked = document.querySelectorAll('#ps-checkboxes input[type=checkbox]:checked');
            return Array.from(checked).map(cb => parseInt(cb.value));
          }
        });

        if (!confirmarPS || !idsSeleccionados || idsSeleccionados.length === 0) {
          this.$emit("cliente-reactivado");
          return;
        }

        // Paso 4: reactivar cada PS seleccionado
        await Promise.all(
          idsSeleccionados.map(psId =>
            axios.put(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${psId}/reactivar`)
          )
        );

        await this.$swal.fire({
          title: 'Puntos de suministro reactivados',
          text: `Se han reactivado ${idsSeleccionados.length} punto(s) de suministro correctamente.`,
          icon: 'success',
          iconColor: '#16a34a',
          confirmButtonColor: '#16a34a',
          timer: 3000,
          timerProgressBar: true
        });

        this.$emit("cliente-reactivado");

      } catch (error) {
        console.error('Error en confirmación de reactivación:', error);
        this.$swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error durante la reactivación. Por favor, recarga la página.',
          icon: 'error',
          confirmButtonColor: '#dc2626'
        });
      }
    },
    formatFecha(fecha) {
      if (!fecha) return '';
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
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
  padding: 0.5rem;
}

.modal-content {
  width: 95%;
  max-width: 95%;
  height: 95vh;
  max-height: 95vh;
  background: #fff;
  border-radius: 0.4rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 0.7rem 0 0.7rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: rgba(252, 215, 0);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-button {
  align-self: stretch;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #c0392b;
  border: none;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  font-size: 0.9rem;
  cursor: pointer;
  color: white;
  border-radius: 0 0.4rem 0 0;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: #96281b;
  color: white;
  border-left-color: transparent;
}

/* Sistema de pestañas */
.form-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.3rem;
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
  font-size: 1rem;
}

/* Contenedor de pestañas optimizado */
.tab-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* CORRECCIÓN: Asegurar que el contenido tenga scroll */
.tab-content {
  flex: 1;
  overflow-y: auto !important;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
}

/* Grid optimizado */
.form-grid-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  flex: 1;
}

/* CORRECCIÓN: Reducir padding para optimizar espacio */
.form-section-compact {
  background: #fff;
  border-radius: 0.3rem;
  border: 1px solid #e9ecef;
  padding: 0.4rem !important;
  display: flex;
  flex-direction: column;
  margin-bottom: 0.3rem;
}

.form-section-compact.full-width {
  grid-column: 1 / -1;
}

/* Secciones específicas para contactos */
.contacts-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.contact-card {
  background: #fff;
  border-radius: 0.3rem;
  border: 1px solid #e9ecef;
  padding: 0.4rem !important;
  display: flex;
  flex-direction: column;
}

.additional-data-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem;
}

.notes-section {
  grid-column: 2;
}

/* CORRECCIÓN: Reducir espacios en encabezados */
.section-header-compact {
  display: flex;
  align-items: center;
  margin-bottom: 0.2rem !important;
  gap: 0.3rem;
  padding-bottom: 0.2rem !important;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-compact i {
  font-size: 0.9rem;
  color:black;
  width: 0.9rem;
}

.section-header-compact h3 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* CORRECCIÓN: Reducir espacios entre elementos */
.form-group-compact {
  margin-bottom: 0.3rem !important;
}

.form-group-compact label {
  display: block;
  margin-bottom: 0.1rem;
  font-size: 1rem;
  font-weight: 500;
  color: black;
}

.form-row-compact {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0;
}

.form-row-compact .form-group-compact {
  flex: 1;
  margin-bottom: 0.3rem !important;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}

/* Validación de errores */
.input-error,
.input-error:focus {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15) !important;
}
.select-error select,
.select-error select:focus {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15) !important;
}
.error-text {
  display: block;
  color: #e74c3c;
  font-size: 0.72rem;
  margin-top: 2px;
  line-height: 1.2;
}

/* Inputs con iconos */
.input-with-icon-compact {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.8rem;
  width: 0.8rem;
}

.input-with-icon-compact .form-control-compact {
  padding-left: 1.8rem;
}

.icon-suffix {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  font-size: 0.8rem;
}

/* CORRECCIÓN: Optimizar tamaños de controles */
.form-control-compact {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  height: 26px !important;
}

.form-control-compact:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.notes-textarea {
  height: 60px !important;
  resize: vertical;
  min-height: 50px;
}

/* Selectores */
.select-container-compact {
  position: relative;
  width: 100%;
}

.form-select-compact {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
  height: 26px !important;
}

.form-select-compact:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.select-icon {
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
  font-size: 0.7rem;
}

/* Botones */
.btn-compact {
  padding: 0.5rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 700;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height:fit-content;
  font-size: 1rem;
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

/* CORRECCIÓN: Botón cancelar flotante siempre visible */
.btn-secondary.btn-cancel {
  display: flex !important;
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
  opacity: 0.9;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

/* CORRECCIÓN: Reducir espacios en footer */
.modal-footer-compact {
  padding: 0.3rem 0.8rem !important;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-top: 0.2rem !important;
}

.required-legend {
  font-size: 0.8rem;
  color: #777;
  font-weight: bold;
}

/* NUEVO: Navegación entre pestañas */
.tab-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.action-buttons {
  display: flex;
  gap: 0.4rem;
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

  .installations-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .modal-content {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    padding: 0;
  }
  
  .modal-overlay {
    padding: 0;
  }
  
  .form-grid-compact {
    grid-template-columns: 1fr;
  }
  
  .contacts-row {
    grid-template-columns: 1fr;
  }
  
  .installations-row {
    grid-template-columns: 1fr;
  }
  
  .form-row-compact {
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .tab-text {
    display: none;
  }

  .tab-btn {
    padding: 0.4rem 0.6rem;
  }

  .services-checkboxes {
    grid-template-columns: 1fr;
  }
  
  /* CORRECCIÓN: Asegurar scroll en vista móvil */
  .tab-content {
    overflow-y: auto !important;
    max-height: calc(100vh - 150px);
  }
}

@media (max-width: 600px) {
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-overlay {
    padding: 0;
  }
}

/* Estilos específicos para la sección de instalaciones */
.installations-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.installation-card {
  background: #fff;
  border-radius: 0.3rem;
  border: 1px solid #e9ecef;
  padding: 0.4rem !important;
  display: flex;
  flex-direction: column;
}

/* Iconos específicos para instalaciones */
.installation-card .section-header-compact i {
  color: #28a745; /* Verde para instalaciones */
}

/* Responsive para instalaciones */
@media (max-width: 1200px) {
  .installations-row {
    grid-template-columns: repeat(2, 1fr);  }
}

/* Sección de servicios */
.services-section {
  margin: 0.4rem 0;
  padding: 0.4rem;
  background: #f8f9fa;
  border-radius: 0.3rem;
  border: 1px solid #e9ecef;
}

.services-header h3 {
  color: #495057;
  font-size: 1rem;
  margin: 0 0 0.4rem 0;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.services-checkboxes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.service-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding: 0.2rem;
  border-radius: 0.25rem;
  transition: background-color 0.3s ease;
}

.service-checkbox:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.service-checkbox input[type="checkbox"] {
  display: none;
}

.checkmark {
  height: 14px;
  width: 14px;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 0.2rem;
  margin-right: 0.4rem;
  position: relative;
  transition: all 0.3s ease;
}

.service-checkbox input[type="checkbox"]:checked + .checkmark {
  background-color: #28a745;
  border-color: #28a745;
}

.service-checkbox input[type="checkbox"]:checked + .checkmark:after {
  content: "";
  position: absolute;
  left: 3px;
  top: 0px;
  width: 3px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.service-label {
  font-weight: 600;
  color: #495057;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* Nota de restricción de campo */
.field-restriction-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  padding: 4px 8px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
  font-size: 0.7rem;
}

.field-restriction-note i {
  color: #f39c12;
}

@media (max-width: 900px) {
  .installations-row {
    grid-template-columns: 1fr;
  }
  
  .services-checkboxes {
    grid-template-columns: 1fr;
  }
}

/* Estilo para el botón de baja rojo pastel */
.btn-danger {
  background-color: #f5b2b2;
  color: black;
  border: 1px solid #f5b2b2;
  font-weight: 600;
}

.btn-danger:hover:not(:disabled) {
  background-color: #f19999;
  border-color: #f19999;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 178, 178, 0.4);
  color: black;
}

.btn-danger:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(245, 178, 178, 0.3);
}

/* Estilo para el botón de reactivación verde */
.btn-success {
  background-color: #86efac;
  color: black;
  border: 1px solid #86efac;
  font-weight: 600;
}

.btn-success:hover:not(:disabled) {
  background-color: #4ade80;
  border-color: #4ade80;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(134, 239, 172, 0.4);
  color: black;
}

.btn-success:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(134, 239, 172, 0.3);
}

/* Estilos para mensajes de estado */
.status-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 500;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.status-inactive {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.status-inactive i {
  color: #dc2626;
}

/* Estilos personalizados para SweetAlert de baja */
:global(.swal-baja-cliente .swal2-popup) {
  border-radius: 12px;
  padding: 20px;
}

:global(.swal-baja-cliente .swal2-title) {
  color: #b56767;
  font-weight: 600;
}

:global(.swal-baja-cliente .swal2-icon.swal2-warning) {
  border-color: #f5b2b2;
  color: #b56767;
}

/* Estilos personalizados para SweetAlert de reactivación */
:global(.swal-reactivar-cliente .swal2-popup) {
  border-radius: 12px;
  padding: 20px;
}

:global(.swal-reactivar-cliente .swal2-title) {
  color: #16a34a;
  font-weight: 600;
}

:global(.swal-reactivar-cliente .swal2-icon.swal2-success) {
  border-color: #86efac;
  color: #16a34a;
}
</style>