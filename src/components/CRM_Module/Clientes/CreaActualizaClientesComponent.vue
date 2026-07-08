<template>
  <div>
    <div v-if="formularioVisible" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h2 class="modal-title">{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
        <div class="header-actions">
          <button
            v-if="modoActualizar && clienteLocal.id"
            type="button"
            class="btn-tareas-actividad"
            @click="abrirPanelTareas"
            title="Ver tareas y actividad del cliente"
          >
            <i class="fas fa-tasks"></i>
            <span>Tareas/actividad</span>
          </button>
          <button type="button" class="close-button" @click="cancelarFormulario">
            <i class="fas fa-times"></i>
          </button>
        </div>
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
                  <label for="usuario">Usuario Asignado <span v-if="clienteLocal.id" class="required">*</span></label>
                  <div class="select-container-compact" :class="{ 'select-error': errores.idUsuario }">
                    <select 
                      id="usuario" 
                      v-model="clienteLocal.idUsuario" 
                      class="form-select-compact" 
                      :disabled="!isAdvancedUser"
                      @change="errores.idUsuario = ''"
                      :required="!!clienteLocal.id"
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
              <div class="section-header-compact" style="display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <i class="fas fa-sticky-note"></i>
                  <h3>Notas y observaciones</h3>
                </div>
                <button type="button" class="btn-expand-notes" @click="abrirNotasCompletas" title="Ver / editar notas completas">
                  <i class="fas fa-expand-alt"></i>
                </button>
              </div>
              <div class="form-group-compact">
                <textarea id="notas" v-model="clienteLocal.notas" 
                  class="form-control-compact notes-textarea" 
                  placeholder="Notas y observaciones..."
                  ref="notasTextarea"
                  @input="autoResizeNotas"></textarea>
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
    </div>
  </div>

  <!-- Panel Tareas/actividad del cliente -->
  <div v-if="mostrarPanelTareas" class="tareas-panel-overlay" @click.self="cerrarPanelTareas">
    <div class="tareas-panel">
      <div class="tareas-panel-header">
        <div class="tareas-panel-title">
          <i class="fas fa-tasks"></i>
          <span>Tareas / Actividad</span>
          <span v-if="clienteLocal.nombre" class="tareas-panel-cliente-nombre">— {{ clienteLocal.nombre }}</span>
        </div>
        <button type="button" class="tareas-panel-close" @click="cerrarPanelTareas">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="tareas-panel-body">
        <div class="tp-tabs">
          <button type="button" class="tp-tab-btn tp-tab-btn-tareas" :class="{ active: tareasPanelTab === 'tareas' }" @click="tareasPanelTab = 'tareas'">
            <span class="tp-tab-icon"><i class="fas fa-list-ul"></i></span>
            <span class="tp-tab-label">Tareas</span>
            <span class="tp-tab-count">{{ tareas.length }}</span>
          </button>
          <button type="button" class="tp-tab-btn tp-tab-btn-actividad" :class="{ active: tareasPanelTab === 'actividad' }" @click="tareasPanelTab = 'actividad'">
            <span class="tp-tab-icon"><i class="fas fa-history"></i></span>
            <span class="tp-tab-label">Actividad</span>
            <span class="tp-tab-count">{{ actividadCliente.length }}</span>
          </button>
          <button type="button" class="tp-tab-btn tp-tab-btn-notas" :class="{ active: tareasPanelTab === 'notas' }" @click="tareasPanelTab = 'notas'">
            <span class="tp-tab-icon"><i class="fas fa-sticky-note"></i></span>
            <span class="tp-tab-label">Notas</span>
            <span class="tp-tab-count">{{ notasCliente.length }}</span>
          </button>
          <button type="button" class="tp-tab-btn tp-tab-btn-incidencias" :class="{ active: tareasPanelTab === 'incidencias' }" @click="tareasPanelTab = 'incidencias'">
            <span class="tp-tab-icon"><i class="fas fa-exclamation-triangle"></i></span>
            <span class="tp-tab-label">Incidencias</span>
            <span class="tp-tab-count">{{ incidenciasCliente.length }}</span>
          </button>
        </div>

        <div v-if="tareasPanelTab === 'tareas'" class="tp-tab-content tp-content-tareas">
          <div v-if="cargandoTareas" class="tareas-loading">
            <i class="fas fa-spinner fa-spin"></i> Cargando tareas...
          </div>
          <div v-else-if="tareas.length === 0" class="tareas-empty-state">
            <i class="fas fa-clipboard-list fa-3x text-muted"></i>
            <p>No hay tareas para este cliente</p>
          </div>
          <template v-else>
            <div class="tp-toolbar">
              <div class="tp-search-wrap">
                <i class="fas fa-search tp-search-icon"></i>
                <input
                  type="text"
                  v-model="tareasPanelBusqueda"
                  placeholder="Buscar..."
                  class="tp-search-input"
                />
                <button v-if="tareasPanelBusqueda" class="tp-search-clear" @click="tareasPanelBusqueda = ''">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <span class="tp-count">{{ tareasFiltradas.length }} registro{{ tareasFiltradas.length !== 1 ? 's' : '' }}</span>
            </div>

            <div class="tp-table-wrapper">
              <div v-if="tareasFiltradas.length === 0" class="tareas-empty-state">
                <i class="fas fa-search fa-2x text-muted"></i>
                <p>Sin resultados para "{{ tareasPanelBusqueda }}"</p>
              </div>
              <table v-else class="tp-table">
                <thead>
                  <tr>
                    <th style="width:26%">Título</th>
                    <th style="width:13%">Estado</th>
                    <th style="width:10%">Prioridad</th>
                    <th style="width:12%">Categoría</th>
                    <th style="width:12%">Asignado a</th>
                    <th style="width:18%">CUPS</th>
                    <th style="width:9%">Fecha vto.</th>
                    <th style="width:4%"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="tarea in tareasPaginadas" :key="tarea.id"
                      :class="{ 'tp-row-vencida': tarea.vencida, 'tp-row-completada': tarea.estadoFinal, 'tp-row-fijada': tarea.fijada }">
                    <td class="tp-td-truncate" :title="tarea.titulo">
                      <span class="tp-titulo-wrap">
                        <i v-if="tarea.fijada" class="fas fa-thumbtack tp-pin-icon"></i>
                        {{ tarea.titulo }}
                      </span>
                    </td>
                    <td>
                      <span class="tp-estado-badge" :style="{ backgroundColor: tarea.estadoColor }">
                        <i :class="getEstadoIcon(tarea.estadoNombre)"></i>
                        {{ tarea.estadoNombre }}
                      </span>
                    </td>
                    <td>
                      <span class="tp-prioridad-badge" :class="`tp-prioridad-${tarea.prioridad}`">
                        {{ getPrioridadTexto(tarea.prioridad) }}
                      </span>
                    </td>
                    <td class="tp-td-truncate">
                      <span v-if="tarea.categoriaNombre" class="tp-categoria-badge">{{ tarea.categoriaNombre }}</span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td class="tp-td-truncate">{{ tarea.usuarioAsignadoNombre || '-' }}</td>
                    <td class="tp-td-truncate" :title="tarea.cups || 'GENERAL'">
                      <span v-if="tarea.cups" class="tp-cups-badge">{{ tarea.cups }}</span>
                      <span v-else class="tp-cups-general">GENERAL</span>
                    </td>
                    <td :class="{ 'tp-fecha-vencida': tarea.vencida }">{{ formatDate(tarea.fechaVencimiento) }}</td>
                    <td>
                      <button class="tp-btn-view" @click="abrirTarea(tarea)" title="Ver tarea">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="tp-pagination">
              <div class="tp-pag-perpage">
                <label>Registros por página:</label>
                <select v-model="tareasPanelPorPagina" class="tp-pag-select">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
              <div class="tp-pag-info">
                Mostrando {{ tareasPagStart }} - {{ tareasPagEnd }} de {{ tareasFiltradas.length }} registros
              </div>
              <div class="tp-pag-buttons">
                <button class="tp-pag-btn" :disabled="tareasPanelPagina === 1" @click="tareasPanelPagina = 1" title="Primera página">
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="tp-pag-btn" :disabled="tareasPanelPagina === 1" @click="tareasPanelPagina--" title="Anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <span class="tp-pag-label">Página {{ tareasPanelPagina }} de {{ tareasTotalPaginas || 1 }}</span>
                <button class="tp-pag-btn" :disabled="tareasPanelPagina >= tareasTotalPaginas" @click="tareasPanelPagina++" title="Siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button class="tp-pag-btn" :disabled="tareasPanelPagina >= tareasTotalPaginas" @click="tareasPanelPagina = tareasTotalPaginas" title="Última página">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            </div>
          </template>
        </div>

        <div v-else-if="tareasPanelTab === 'actividad'" class="tp-tab-content tp-content-actividad">
          <div v-if="cargandoActividad" class="tareas-loading">
            <i class="fas fa-spinner fa-spin"></i> Cargando actividad...
          </div>
          <div v-else-if="actividadCliente.length === 0" class="tareas-empty-state">
            <i class="fas fa-stream fa-3x text-muted"></i>
            <p>No hay actividad registrada para este cliente</p>
          </div>
          <template v-else>
            <div class="tp-timeline-list">
              <article v-for="evento in actividadPaginada" :key="evento.id" class="tp-timeline-item">
                <div class="tp-timeline-main">
                  <span class="tp-timeline-icon"><i class="fas fa-history"></i></span>
                  <span class="tp-timeline-type">{{ (evento.tipoEvento || '').replaceAll('_', ' ') }}</span>
                  <span v-if="evento.cups" class="tp-cups-badge">{{ evento.cups }}</span>
                </div>
                <p class="tp-timeline-desc">{{ evento.descripcion }}</p>
                <div class="tp-timeline-meta">
                  <span v-if="evento.usuarioNombre" class="tp-meta-inline"><i class="fas fa-user-circle"></i> {{ evento.usuarioNombre }}</span>
                  <span class="tp-timeline-date">{{ formatDateTime(evento.fechaEvento) }}</span>
                </div>
              </article>
            </div>
            <div class="tp-pagination tp-pagination-compact">
              <div class="tp-pag-perpage">
                <label>Registros por página:</label>
                <select v-model="actividadPanelPorPagina" class="tp-pag-select">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
              <div class="tp-pag-info">
                Mostrando {{ actividadPagStart }} - {{ actividadPagEnd }} de {{ actividadCliente.length }} registros
              </div>
              <div class="tp-pag-buttons">
                <button class="tp-pag-btn" :disabled="actividadPanelPagina === 1" @click="actividadPanelPagina = 1" title="Primera página">
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="tp-pag-btn" :disabled="actividadPanelPagina === 1" @click="actividadPanelPagina--" title="Anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <span class="tp-pag-label">Página {{ actividadPanelPagina }} de {{ actividadTotalPaginas || 1 }}</span>
                <button class="tp-pag-btn" :disabled="actividadPanelPagina >= actividadTotalPaginas" @click="actividadPanelPagina++" title="Siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button class="tp-pag-btn" :disabled="actividadPanelPagina >= actividadTotalPaginas" @click="actividadPanelPagina = actividadTotalPaginas" title="Última página">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            </div>
          </template>
        </div>

        <div v-else-if="tareasPanelTab === 'notas'" class="tp-tab-content tp-content-notas">
          <div class="tp-notas-layout">
            <div class="tp-notas-topbar">
              <section class="tp-notas-card tp-notas-card-fijadas">
                <div class="tp-notas-card-head">
                  <div class="tp-notas-head-left">
                    <span class="tp-section-icon"><i class="fas fa-thumbtack"></i></span>
                    <span>Tareas fijadas</span>
                    <span class="tp-mini-count">{{ tareasFijadas.length }}</span>
                  </div>
                  <button
                    type="button"
                    class="tp-fijadas-toggle"
                    :disabled="tareasFijadas.length === 0"
                    @click="mostrarTareasFijadas = !mostrarTareasFijadas"
                  >
                    <i class="fas" :class="mostrarTareasFijadas ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                    {{ mostrarTareasFijadas ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>

                <div v-if="tareasFijadas.length === 0" class="tp-notas-empty-small tp-notas-empty-inline">
                  No hay tareas fijadas para este cliente.
                </div>
                <div v-else-if="mostrarTareasFijadas" class="tp-notas-fijadas-list">
                  <article
                    v-for="t in tareasFijadas"
                    :key="'fij-' + t.id"
                    class="tp-nota-fijada-item"
                    @click="abrirTarea(t)"
                    title="Ver tarea"
                  >
                    <div class="tp-note-meta tp-note-meta-compact">
                      <span v-if="t.cups" class="tp-cups-chip" :title="t.cups"><i class="fas fa-bolt"></i> {{ t.cups }}</span>
                      <span class="tp-nota-estado" :style="{ color: t.estadoColor || '#888' }"><i class="fas fa-circle"></i> {{ t.estadoNombre }}</span>
                    </div>
                    <p class="tp-nota-fijada-title" :title="t.titulo">{{ t.titulo }}</p>
                  </article>
                </div>
              </section>

              <section class="tp-notas-card tp-notas-card-crear">
                <div class="tp-notas-card-head">
                  <div class="tp-notas-head-left">
                    <span class="tp-section-icon"><i class="fas fa-edit"></i></span>
                    <span>Nueva nota</span>
                  </div>
                </div>
                <div class="tp-notas-create">
                  <div class="tp-notas-row">
                    <div class="tp-notas-field">
                      <label>CUPS</label>
                      <select v-model="nuevaNota.cups" class="tp-pag-select">
                        <option value="">GENERAL</option>
                        <option v-for="cups in cupsOpcionesNotas" :key="cups" :value="cups">{{ cups }}</option>
                      </select>
                    </div>
                    <div class="tp-notas-field tp-notas-field-grow">
                      <label>Nota</label>
                      <textarea
                        v-model="nuevaNota.comentario"
                        class="tp-notas-textarea"
                        placeholder="Escriba una nota..."
                        maxlength="2000"
                      ></textarea>
                    </div>
                    <div class="tp-nota-create-actions">
                      <button
                        type="button"
                        :class="['tp-btn-pin-note', { 'pinned': nuevaNota.fijada }]"
                        @click="nuevaNota.fijada = !nuevaNota.fijada"
                        :title="nuevaNota.fijada ? 'La nota se creará fijada (clic para desfijar)' : 'Fijar nota al crearla'"
                      >
                        <i class="fas fa-thumbtack"></i>
                        {{ nuevaNota.fijada ? 'Fijada' : 'Fijar' }}
                      </button>
                      <button type="button" class="tp-btn-create-note" :disabled="creandoNota" @click="crearNotaCliente">
                        <i class="fas" :class="creandoNota ? 'fa-spinner fa-spin' : 'fa-plus-circle'"></i>
                        {{ creandoNota ? 'Guardando...' : 'Crear nota' }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section class="tp-notas-history">
              <div class="tp-notas-history-head">
                <div class="tp-notas-head-left">
                  <span class="tp-section-icon"><i class="fas fa-notes-medical"></i></span>
                  <span>Histórico de notas</span>
                </div>
                <span class="tp-count">{{ notasCliente.length }} nota{{ notasCliente.length !== 1 ? 's' : '' }}</span>
              </div>

              <div v-if="cargandoNotas" class="tareas-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando notas...
              </div>
              <div v-else-if="notasCliente.length === 0" class="tareas-empty-state">
                <i class="fas fa-sticky-note fa-3x text-muted"></i>
                <p>No hay notas para este cliente</p>
              </div>
              <div v-else class="tp-notas-list">
                <article v-for="nota in notasPaginadas" :key="nota.comentarioId" class="tp-nota-item" :class="{ 'tp-nota-fijada-highlight': nota.fijado }">
                  <div class="tp-note-meta tp-note-meta-compact">
                    <span class="tp-cups-chip" :title="nota.cups || 'GENERAL'"><i class="fas fa-bolt"></i> {{ nota.cups || 'GENERAL' }}</span>
                    <span class="tp-meta-inline"><i class="fas fa-user-circle"></i> {{ nota.usuarioNombre || 'Sin autor' }}</span>
                    <span class="tp-meta-inline">
                      <i class="fas" :class="nota.editado ? 'fa-edit' : 'fa-calendar-alt'"></i>
                      {{ nota.editado && nota.fechaEdicion ? `Editada: ${formatDateTime(nota.fechaEdicion)}` : formatDateTime(nota.fechaCreacion) }}
                    </span>
                    <span v-if="nota.editado" class="tp-note-edited-badge" title="Nota editada">
                      <i class="fas fa-pencil-alt"></i> Editada
                    </span>
                    <div v-if="editandoNotaId !== nota.comentarioId" class="tp-note-actions">
                      <button
                        type="button"
                        :class="['tp-note-pin-comment', { 'pinned': nota.fijado }]"
                        @click="toggleFijadaNota(nota)"
                        :title="nota.fijado ? 'Desfijar nota' : 'Fijar nota'"
                      >
                        <i class="fas fa-thumbtack"></i>
                      </button>
                      <button
                        type="button"
                        class="tp-note-edit-comment"
                        :disabled="eliminandoNotaId === nota.comentarioId"
                        @click="iniciarEdicionNota(nota)"
                        title="Editar nota"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        class="tp-note-delete-comment"
                        :disabled="eliminandoNotaId === nota.comentarioId"
                        @click="eliminarNotaCliente(nota)"
                        title="Eliminar nota"
                      >
                        <i class="fas" :class="eliminandoNotaId === nota.comentarioId ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
                      </button>
                    </div>
                  </div>

                  <template v-if="editandoNotaId === nota.comentarioId">
                    <div class="tp-nota-edit-grid">
                      <div class="tp-notas-field">
                        <label>CUPS</label>
                        <select v-model="notaEdicion.cups" class="tp-pag-select">
                          <option value="">GENERAL</option>
                          <option v-for="cups in cupsOpcionesNotas" :key="cups" :value="cups">{{ cups }}</option>
                        </select>
                      </div>
                      <div class="tp-notas-field tp-notas-field-grow">
                        <label>Editar nota</label>
                        <textarea
                          v-model="notaEdicion.comentario"
                          class="tp-notas-textarea"
                          placeholder="Escriba una nota..."
                          maxlength="2000"
                        ></textarea>
                      </div>
                      <div class="tp-note-actions-edit">
                        <button type="button" class="tp-note-action-btn tp-note-save" :disabled="guardandoNota" @click="guardarEdicionNota(nota)">
                          <i class="fas" :class="guardandoNota ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                          {{ guardandoNota ? 'Guardando' : 'Guardar' }}
                        </button>
                        <button type="button" class="tp-note-action-btn tp-note-cancel" :disabled="guardandoNota" @click="cancelarEdicionNota">
                          <i class="fas fa-times"></i>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <p class="tp-note-text" :class="{ 'tp-note-text-clamped': !estaNotaExpandida(nota.comentarioId) }">{{ nota.comentario }}</p>
                    <button
                      v-if="debeMostrarToggleNota(nota.comentario)"
                      type="button"
                      class="tp-note-expand-btn"
                      @click="toggleNotaExpandida(nota.comentarioId)"
                    >
                      <i class="fas" :class="estaNotaExpandida(nota.comentarioId) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                      {{ estaNotaExpandida(nota.comentarioId) ? 'Ver menos' : 'Ver completa' }}
                    </button>
                  </template>
                </article>
              </div>

              <div v-if="!cargandoNotas && notasCliente.length > 0" class="tp-pagination tp-pagination-compact tp-pagination-notas">
                <div class="tp-pag-perpage">
                  <label>Registros por página:</label>
                  <select v-model="notasPanelPorPagina" class="tp-pag-select">
                    <option :value="5">5</option>
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                  </select>
                </div>
                <div class="tp-pag-info">
                  Mostrando {{ notasPagStart }} - {{ notasPagEnd }} de {{ notasCliente.length }} registros
                </div>
                <div class="tp-pag-buttons">
                  <button class="tp-pag-btn" :disabled="notasPanelPagina === 1" @click="notasPanelPagina = 1" title="Primera página">
                    <i class="fas fa-angle-double-left"></i>
                  </button>
                  <button class="tp-pag-btn" :disabled="notasPanelPagina === 1" @click="notasPanelPagina--" title="Anterior">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <span class="tp-pag-label">Página {{ notasPanelPagina }} de {{ notasTotalPaginas || 1 }}</span>
                  <button class="tp-pag-btn" :disabled="notasPanelPagina >= notasTotalPaginas" @click="notasPanelPagina++" title="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                  <button class="tp-pag-btn" :disabled="notasPanelPagina >= notasTotalPaginas" @click="notasPanelPagina = notasTotalPaginas" title="Última página">
                    <i class="fas fa-angle-double-right"></i>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div v-else class="tp-tab-content tp-content-incidencias">
          <div class="tp-toolbar">
            <div class="tp-search-wrap">
              <i class="fas fa-search tp-search-icon"></i>
              <input
                type="text"
                v-model="incidenciasBusqueda"
                placeholder="Buscar incidencias..."
                class="tp-search-input"
              />
              <button v-if="incidenciasBusqueda" class="tp-search-clear" @click="incidenciasBusqueda = ''">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <span class="tp-count">{{ incidenciasFiltradas.length }} incidencia{{ incidenciasFiltradas.length !== 1 ? 's' : '' }}</span>
          </div>

          <div v-if="cargandoIncidencias" class="tareas-loading">
            <i class="fas fa-spinner fa-spin"></i> Cargando incidencias...
          </div>
          <div v-else-if="incidenciasFiltradas.length === 0" class="tareas-empty-state">
            <i class="fas fa-exclamation-circle fa-3x text-muted"></i>
            <p>No hay incidencias para este cliente</p>
          </div>
          <template v-else>
            <div class="tp-table-wrapper">
              <table class="tp-table">
                <thead>
                  <tr>
                    <th style="width:29%">Título</th>
                    <th style="width:16%">Estado</th>
                    <th style="width:11%">Prioridad</th>
                    <th style="width:18%">Categoría/Subcategoría</th>
                    <th style="width:14%">CUPS</th>
                    <th style="width:9%">Fecha vto.</th>
                    <th style="width:3%"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="incidencia in incidenciasPaginadas" :key="incidencia.id" :class="{ 'tp-row-vencida': incidencia.vencida, 'tp-row-fijada': incidencia.fijada }">
                    <td class="tp-td-truncate" :title="incidencia.titulo">{{ incidencia.titulo }}</td>
                    <td>
                      <span class="tp-estado-badge" :style="{ backgroundColor: incidencia.estadoColor }">
                        <i :class="getEstadoIcon(incidencia.estadoNombre)"></i>
                        {{ incidencia.estadoNombre }}
                      </span>
                    </td>
                    <td>
                      <span class="tp-prioridad-badge" :class="`tp-prioridad-${incidencia.prioridad}`">
                        {{ getPrioridadTexto(incidencia.prioridad) }}
                      </span>
                    </td>
                    <td class="tp-td-truncate" :title="`${incidencia.categoriaNombre || '-'} / ${incidencia.subcategoriaNombre || '-'}`">
                      {{ incidencia.categoriaNombre || '-' }} / {{ incidencia.subcategoriaNombre || '-' }}
                    </td>
                    <td class="tp-td-truncate" :title="incidencia.cups || 'GENERAL'">
                      <span v-if="incidencia.cups" class="tp-cups-badge">{{ incidencia.cups }}</span>
                      <span v-else class="tp-cups-general">GENERAL</span>
                    </td>
                    <td>{{ formatDate(incidencia.fechaVencimiento) }}</td>
                    <td>
                      <button class="tp-btn-view" @click="abrirTarea(incidencia)" title="Ver tarea">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="tp-pagination tp-pagination-compact">
              <div class="tp-pag-perpage">
                <label>Registros por página:</label>
                <select v-model="incidenciasPanelPorPagina" class="tp-pag-select">
                  <option :value="10">10</option>
                  <option :value="25">25</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                </select>
              </div>
              <div class="tp-pag-info">
                Mostrando {{ incidenciasPagStart }} - {{ incidenciasPagEnd }} de {{ incidenciasFiltradas.length }} registros
              </div>
              <div class="tp-pag-buttons">
                <button class="tp-pag-btn" :disabled="incidenciasPanelPagina === 1" @click="incidenciasPanelPagina = 1" title="Primera página">
                  <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="tp-pag-btn" :disabled="incidenciasPanelPagina === 1" @click="incidenciasPanelPagina--" title="Anterior">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <span class="tp-pag-label">Página {{ incidenciasPanelPagina }} de {{ incidenciasTotalPaginas || 1 }}</span>
                <button class="tp-pag-btn" :disabled="incidenciasPanelPagina >= incidenciasTotalPaginas" @click="incidenciasPanelPagina++" title="Siguiente">
                  <i class="fas fa-chevron-right"></i>
                </button>
                <button class="tp-pag-btn" :disabled="incidenciasPanelPagina >= incidenciasTotalPaginas" @click="incidenciasPanelPagina = incidenciasTotalPaginas" title="Última página">
                  <i class="fas fa-angle-double-right"></i>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal detalle de tarea -->
  <TareaDetalleModal
    v-if="tareaSeleccionada"
    :value="true"
    :tarea="tareaSeleccionada"
    :estados="estadosTareas"
    @cerrar="cerrarTarea"
    @actualizar="handleActualizarTarea"
    @cambiar-estado="handleCambiarEstado"
    @completar-con-comentario="handleCompletarConComentario"
    @crear-comentario-estado="handleCrearComentarioEstado"
  />

  <TareaModalCorporativo
    :value="mostrarModalEditarTarea"
    @update:value="mostrarModalEditarTarea = $event"
    :tarea="tareaEnEdicion"
    :estados="estadosTareas"
    :usuarios="usuarios"
    :categorias="categoriasTareas"
    :guardando="guardandoTareaEdicion"
    @guardar="handleGuardarEdicionTarea"
    @cerrar="cerrarModalEditarTarea"
  />
  </div>
</template>

<script>
import axios from 'axios';
import TareaDetalleModal from '@/components/CRM_Module/Tareas/TareaDetalleModal.vue';
import TareaModalCorporativo from '@/components/CRM_Module/Tareas/TareaModalCorporativo.vue';
import tareasApi from '@/services/tareasApi.js';

export default {
  name: "CreaActualizaClienteComponent",
  components: { TareaDetalleModal, TareaModalCorporativo },
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
      expandirNotas: false,
      clienteLocal: this.crearClienteVacio(),
      errores: {},
      // Tareas/actividad
      mostrarPanelTareas: false,
      tareas: [],
      cargandoTareas: false,
      tareaSeleccionada: null,
      mostrarModalEditarTarea: false,
      tareaEnEdicion: null,
      categoriasTareas: [],
      guardandoTareaEdicion: false,
      estadosTareas: [],
      tareasPanelBusqueda: '',
      tareasPanelPagina: 1,
      tareasPanelPorPagina: 10,
      actividadPanelPagina: 1,
      actividadPanelPorPagina: 10,
      notasPanelPagina: 1,
      notasPanelPorPagina: 5,
      incidenciasPanelPagina: 1,
      incidenciasPanelPorPagina: 10,
      tareasPanelTab: 'tareas',
      actividadCliente: [],
      notasCliente: [],
      incidenciasCliente: [],
      cargandoActividad: false,
      cargandoNotas: false,
      cargandoIncidencias: false,
      cupsOpcionesNotas: [],
      nuevaNota: {
        cups: '',
        comentario: '',
        fijada: false,
      },
      creandoNota: false,
      editandoNotaId: null,
      notaEdicion: {
        cups: '',
        comentario: '',
      },
      guardandoNota: false,
      eliminandoNotaId: null,
      notasExpandidas: {},
      mostrarTareasFijadas: false,
      incidenciasBusqueda: '',
    };
  },
  computed: {
    isAdvancedUser() {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      return usuario && usuario.nivelAcceso === 1;
    },
    tareasFiltradas() {
      const q = (this.tareasPanelBusqueda || '').toLowerCase().trim();
      if (!q) return this.tareas;
      return this.tareas.filter(t =>
        (t.titulo || '').toLowerCase().includes(q) ||
        (t.estadoNombre || '').toLowerCase().includes(q) ||
        (t.categoriaNombre || '').toLowerCase().includes(q) ||
        (t.usuarioAsignadoNombre || '').toLowerCase().includes(q)
      );
    },
    tareasTotalPaginas() {
      return Math.ceil(this.tareasFiltradas.length / this.tareasPanelPorPagina) || 1;
    },
    tareasPaginadas() {
      const start = (this.tareasPanelPagina - 1) * this.tareasPanelPorPagina;
      return this.tareasFiltradas.slice(start, start + this.tareasPanelPorPagina);
    },
    tareasPagStart() {
      return this.tareasFiltradas.length === 0 ? 0 : (this.tareasPanelPagina - 1) * this.tareasPanelPorPagina + 1;
    },
    tareasPagEnd() {
      return Math.min(this.tareasPanelPagina * this.tareasPanelPorPagina, this.tareasFiltradas.length);
    },
    actividadTotalPaginas() {
      return Math.ceil(this.actividadCliente.length / this.actividadPanelPorPagina) || 1;
    },
    actividadPaginada() {
      const start = (this.actividadPanelPagina - 1) * this.actividadPanelPorPagina;
      return this.actividadCliente.slice(start, start + this.actividadPanelPorPagina);
    },
    actividadPagStart() {
      return this.actividadCliente.length === 0 ? 0 : (this.actividadPanelPagina - 1) * this.actividadPanelPorPagina + 1;
    },
    actividadPagEnd() {
      return Math.min(this.actividadPanelPagina * this.actividadPanelPorPagina, this.actividadCliente.length);
    },
    notasTotalPaginas() {
      return Math.ceil(this.notasCliente.length / this.notasPanelPorPagina) || 1;
    },
    notasPaginadas() {
      const start = (this.notasPanelPagina - 1) * this.notasPanelPorPagina;
      return this.notasCliente.slice(start, start + this.notasPanelPorPagina);
    },
    notasPagStart() {
      return this.notasCliente.length === 0 ? 0 : (this.notasPanelPagina - 1) * this.notasPanelPorPagina + 1;
    },
    notasPagEnd() {
      return Math.min(this.notasPanelPagina * this.notasPanelPorPagina, this.notasCliente.length);
    },
    incidenciasFiltradas() {
      const q = (this.incidenciasBusqueda || '').toLowerCase().trim();
      if (!q) return this.incidenciasCliente;
      return this.incidenciasCliente.filter(t =>
        (t.titulo || '').toLowerCase().includes(q) ||
        (t.estadoNombre || '').toLowerCase().includes(q) ||
        (t.categoriaNombre || '').toLowerCase().includes(q) ||
        (t.subcategoriaNombre || '').toLowerCase().includes(q) ||
        (t.cups || 'GENERAL').toLowerCase().includes(q)
      );
    },
    incidenciasTotalPaginas() {
      return Math.ceil(this.incidenciasFiltradas.length / this.incidenciasPanelPorPagina) || 1;
    },
    incidenciasPaginadas() {
      const start = (this.incidenciasPanelPagina - 1) * this.incidenciasPanelPorPagina;
      return this.incidenciasFiltradas.slice(start, start + this.incidenciasPanelPorPagina);
    },
    incidenciasPagStart() {
      return this.incidenciasFiltradas.length === 0 ? 0 : (this.incidenciasPanelPagina - 1) * this.incidenciasPanelPorPagina + 1;
    },
    incidenciasPagEnd() {
      return Math.min(this.incidenciasPanelPagina * this.incidenciasPanelPorPagina, this.incidenciasFiltradas.length);
    },
    tareasFijadas() {
      return this.tareas.filter(t => t.fijada && t.titulo !== 'NOTAS CLIENTE');
    },
  },
  watch: {
    formularioVisible(newVal) {
      if (newVal) {
        this.clienteLocal = this.modoActualizar && this.nuevoCliente
          ? { ...this.nuevoCliente }
          : this.crearClienteVacio();
        this.activeTab = 'principal';
        // Reset tareas panel state when modal reopens
        this.tareas = [];
        this.actividadCliente = [];
        this.notasCliente = [];
        this.incidenciasCliente = [];
        this.cupsOpcionesNotas = [];
        this.nuevaNota = { cups: '', comentario: '' };
        this.editandoNotaId = null;
        this.notaEdicion = { cups: '', comentario: '' };
        this.guardandoNota = false;
        this.eliminandoNotaId = null;
        this.cerrarModalEditarTarea();
        this.notasExpandidas = {};
        this.mostrarTareasFijadas = false;
        this.tareasPanelBusqueda = '';
        this.incidenciasBusqueda = '';
        this.tareasPanelPagina = 1;
        this.actividadPanelPagina = 1;
        this.notasPanelPagina = 1;
        this.incidenciasPanelPagina = 1;
        this.tareasPanelTab = 'tareas';
      }
    },
    tareasPanelBusqueda() {
      this.tareasPanelPagina = 1;
    },
    tareasPanelPorPagina() {
      this.tareasPanelPagina = 1;
    },
    actividadPanelPorPagina() {
      this.actividadPanelPagina = 1;
    },
    notasPanelPorPagina() {
      this.notasPanelPagina = 1;
    },
    incidenciasBusqueda() {
      this.incidenciasPanelPagina = 1;
    },
    incidenciasPanelPorPagina() {
      this.incidenciasPanelPagina = 1;
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
      ];

      if (this.clienteLocal.id && !this.clienteLocal.idUsuario) {
        this.errores.idUsuario = 'Usuario Asignado es obligatorio';
      }

      let primerTabError = null;
      for (const { campo, label, tab } of campos) {
        const val = this.clienteLocal[campo];
        if (!val || (typeof val === 'string' && !val.trim())) {
          this.errores[campo] = `${label} es obligatorio`;
          if (!primerTabError) primerTabError = tab;
        }
      }
      if (!primerTabError && this.errores.idUsuario) {
        primerTabError = 'principal';
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
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: 'El cliente no tiene un ID válido para actualizar.'
        });
        return;
      }
      if (!this.clienteLocal.idUsuario) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Usuario asignado requerido',
          text: 'Debe seleccionar un usuario asignado para actualizar el cliente.'
        });
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
        await axios.put(`${process.env.VUE_APP_API_URL}/clientes/${clienteParaEnviar.id}`, clienteParaEnviar);
        this.clienteLocal.fechaBaja = null;

        // Paso 2: obtener PS dados de baja de este cliente
        const clienteId = this.clienteLocal.id;
        if (!clienteId) {
          this.$emit("cliente-reactivado");
          return;
        }

        const { data: psDadosDeBaja } = await axios.get(
          `${process.env.VUE_APP_API_URL}/puntos-suministro/cliente/${clienteId}/dados-de-baja`
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
            axios.put(`${process.env.VUE_APP_API_URL}/puntos-suministro/${psId}/reactivar`)
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
    },
    autoResizeNotas() {
      const textarea = this.$refs.notasTextarea;
      if (!textarea) return;
      textarea.style.height = '50px';
      const maxH = 200;
      textarea.style.height = Math.min(textarea.scrollHeight, maxH) + 'px';
    },
    async abrirNotasCompletas() {
      const { value: nuevasNotas } = await this.$swal.fire({
        title: 'Notas y observaciones',
        input: 'textarea',
        inputValue: this.clienteLocal.notas || '',
        inputPlaceholder: 'Escribe las notas y observaciones...',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-save"></i> Guardar',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#6b7280',
        inputAttributes: {
          style: 'height: 300px; font-size: 14px; line-height: 1.5; resize: none;'
        },
        width: '700px',
        customClass: {
          input: 'swal-notas-textarea'
        }
      });
      if (nuevasNotas !== undefined) {
        this.clienteLocal.notas = nuevasNotas;
      }
    },

    // ── Tareas / Actividad ───────────────────────────────────────────────────
    async abrirPanelTareas() {
      this.mostrarPanelTareas = true;
      this.tareasPanelTab = 'tareas';
      await Promise.all([
        this.cargarTareas(),
        this.cargarActividadCliente(),
        this.cargarNotasCliente(),
        this.cargarIncidenciasCliente(),
        this.cargarCupsClienteParaNotas(),
      ]);
    },
    cerrarPanelTareas() {
      this.mostrarPanelTareas = false;
      this.cerrarModalEditarTarea();
      this.cerrarTarea();
    },
    async cargarTareas() {
      if (!this.clienteLocal?.id) return;
      this.cargandoTareas = true;
      try {
        const [tareasRes, estadosRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/tareas/cliente/${this.clienteLocal.id}`),
          axios.get(`${process.env.VUE_APP_API_URL}/tareas/estados`)
        ]);
        this.tareas = tareasRes.data;
        this.estadosTareas = estadosRes.data;
        const totalFijadas = this.tareas.filter(t => t.fijada && t.titulo !== 'NOTAS CLIENTE').length;
        this.mostrarTareasFijadas = totalFijadas > 0 && totalFijadas <= 3;
      } catch (e) {
        console.error('Error cargando tareas del cliente:', e);
        this.mostrarTareasFijadas = false;
      } finally {
        this.cargandoTareas = false;
      }
    },
    async abrirTarea(tarea) {
      if (!tarea?.id) return;
      try {
        this.tareaSeleccionada = await tareasApi.obtenerTareaPorId(tarea.id);
      } catch (e) {
        console.error('Error cargando detalle de tarea:', e);
        this.tareaSeleccionada = tarea;
      }
    },
    cerrarTarea() {
      this.tareaSeleccionada = null;
    },
    async handleActualizarTarea(tarea) {
      if (!tarea?.id) {
        await Promise.all([
          this.cargarTareas(),
          this.cargarNotasCliente(),
          this.cargarIncidenciasCliente(),
        ]);
        return;
      }

      try {
        if (!this.categoriasTareas.length) {
          this.categoriasTareas = await tareasApi.obtenerCategorias();
        }

        this.tareaEnEdicion = await tareasApi.obtenerTareaPorId(tarea.id);
        this.cerrarTarea();
        this.mostrarModalEditarTarea = true;
      } catch (e) {
        console.error('Error preparando edición de tarea:', e);
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo abrir la edición',
          text: 'Error al cargar los datos de la tarea.'
        });
      }
    },
    cerrarModalEditarTarea() {
      this.mostrarModalEditarTarea = false;
      this.tareaEnEdicion = null;
      this.guardandoTareaEdicion = false;
    },
    async handleGuardarEdicionTarea(tareaDTO, archivos = []) {
      this.guardandoTareaEdicion = true;
      try {
        await tareasApi.actualizarTarea(tareaDTO.id, tareaDTO);

        if (archivos && archivos.length > 0) {
          try {
            await tareasApi.subirAdjuntosTarea(tareaDTO.id, archivos);
          } catch (errorAdjuntos) {
            console.error('Error subiendo adjuntos en edición:', errorAdjuntos);
            this.$swal.fire({
              icon: 'warning',
              title: 'Tarea actualizada',
              text: 'La tarea se guardó, pero hubo un error subiendo algún adjunto.'
            });
          }
        }

        this.cerrarModalEditarTarea();

        await Promise.all([
          this.cargarTareas(),
          this.cargarActividadCliente(),
          this.cargarNotasCliente(),
          this.cargarIncidenciasCliente(),
        ]);

        this.$swal.fire({
          icon: 'success',
          title: 'Tarea actualizada',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (e) {
        console.error('Error guardando tarea desde panel cliente:', e);
        const detalle = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'No se pudo guardar la tarea.';
        this.$swal.fire({
          icon: 'error',
          title: 'Error al guardar',
          text: detalle,
        });
      } finally {
        this.guardandoTareaEdicion = false;
      }
    },
    async handleCambiarEstado(tareaId, estadoId, motivoBloqueo = null) {
      try {
        await tareasApi.cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo);
        await Promise.all([
          this.cargarTareas(),
          this.cargarActividadCliente(),
          this.cargarIncidenciasCliente(),
        ]);
        this.cerrarTarea();
      } catch (e) {
        console.error('Error cambiando estado:', e);
      }
    },
    async handleCompletarConComentario(data) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      try {
        await tareasApi.crearComentario({ tareaId: data.tareaId, usuarioId: usuario.id, comentario: data.comentario.contenido });
        await tareasApi.cambiarEstadoTarea(data.tareaId, data.estadoId);
        await Promise.all([
          this.cargarTareas(),
          this.cargarNotasCliente(),
          this.cargarIncidenciasCliente(),
        ]);
        this.cerrarTarea();
      } catch (e) {
        console.error('Error completando tarea:', e);
      }
    },
    async handleCrearComentarioEstado(data) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      try {
        await tareasApi.crearComentario({ tareaId: data.tareaId, usuarioId: usuario.id, comentario: data.contenido });
        await this.cargarNotasCliente();
      } catch (e) {
        console.error('Error creando comentario:', e);
      }
    },
    async cargarActividadCliente() {
      if (!this.clienteLocal?.id) return;
      this.cargandoActividad = true;
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        const nivelAcceso = typeof usuario?.nivelAcceso === 'number' ? usuario.nivelAcceso : 0;
        this.actividadCliente = await tareasApi.obtenerActividadCliente(this.clienteLocal.id, nivelAcceso);
        this.actividadPanelPagina = 1;
      } catch (e) {
        console.error('Error cargando actividad del cliente:', e);
        this.actividadCliente = [];
        this.actividadPanelPagina = 1;
      } finally {
        this.cargandoActividad = false;
      }
    },
    async cargarNotasCliente() {
      if (!this.clienteLocal?.id) return;
      this.cargandoNotas = true;
      try {
        this.notasCliente = await tareasApi.obtenerNotasCliente(this.clienteLocal.id);
        this.notasPanelPagina = 1;
        this.notasExpandidas = {};
      } catch (e) {
        console.error('Error cargando notas del cliente:', e);
        this.notasCliente = [];
        this.notasPanelPagina = 1;
        this.notasExpandidas = {};
      } finally {
        this.cargandoNotas = false;
      }
    },
    async cargarIncidenciasCliente() {
      if (!this.clienteLocal?.id) return;
      this.cargandoIncidencias = true;
      try {
        this.incidenciasCliente = await tareasApi.obtenerIncidenciasCliente(this.clienteLocal.id);
        this.incidenciasPanelPagina = 1;
      } catch (e) {
        console.error('Error cargando incidencias del cliente:', e);
        this.incidenciasCliente = [];
        this.incidenciasPanelPagina = 1;
      } finally {
        this.cargandoIncidencias = false;
      }
    },
    async cargarCupsClienteParaNotas() {
      if (!this.clienteLocal?.id) return;
      try {
        const data = await tareasApi.obtenerCarteraCupsCliente(this.clienteLocal.id);
        const cupsSet = new Set();
        (data || []).forEach(ps => {
          const luz = (ps.cupsluz || '').trim();
          const gas = (ps.cupsgas || '').trim();
          if (luz) cupsSet.add(luz);
          if (gas) cupsSet.add(gas);
        });
        this.cupsOpcionesNotas = Array.from(cupsSet).sort((a, b) => a.localeCompare(b));
      } catch (e) {
        console.error('Error cargando CUPS para notas:', e);
        this.cupsOpcionesNotas = [];
      }
    },
    async crearNotaCliente() {
      const comentario = (this.nuevaNota.comentario || '').trim();
      if (!comentario) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Comentario obligatorio',
          text: 'Debe escribir un comentario para crear la nota.'
        });
        return;
      }

      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      if (!usuario?.id || !this.clienteLocal?.id) {
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo crear la nota',
          text: 'No hay un usuario o cliente válido para registrar la nota.'
        });
        return;
      }

      this.creandoNota = true;
      try {
        await tareasApi.crearNotaCliente(this.clienteLocal.id, {
          usuarioId: usuario.id,
          comentario,
          cups: this.nuevaNota.cups || null,
          fijado: this.nuevaNota.fijada || false,
        });

        this.nuevaNota.comentario = '';
        this.nuevaNota.cups = '';
        this.nuevaNota.fijada = false;

        await this.cargarNotasCliente();

        this.$swal.fire({
          icon: 'success',
          title: 'Nota creada',
          text: 'La nota se ha registrado correctamente.',
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (e) {
        console.error('Error creando nota del cliente:', e);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al crear la nota',
          text: 'No se pudo guardar la nota. Inténtelo de nuevo.'
        });
      } finally {
        this.creandoNota = false;
      }
    },
    iniciarEdicionNota(nota) {
      this.editandoNotaId = nota.comentarioId;
      this.notaEdicion = {
        cups: nota.cups || '',
        comentario: nota.comentario || '',
      };
    },
    cancelarEdicionNota() {
      this.editandoNotaId = null;
      this.notaEdicion = { cups: '', comentario: '' };
      this.guardandoNota = false;
    },
    async guardarEdicionNota(nota) {
      const comentario = (this.notaEdicion.comentario || '').trim();
      if (!comentario) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Comentario obligatorio',
          text: 'Debe escribir un comentario para guardar los cambios.'
        });
        return;
      }

      if (!this.clienteLocal?.id || !nota?.comentarioId) {
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo actualizar',
          text: 'Faltan datos para actualizar la nota.'
        });
        return;
      }

      this.guardandoNota = true;
      try {
        await tareasApi.actualizarNotaCliente(this.clienteLocal.id, nota.comentarioId, {
          comentario,
          cups: this.notaEdicion.cups || null,
        });

        await this.cargarNotasCliente();
        this.cancelarEdicionNota();

        this.$swal.fire({
          icon: 'success',
          title: 'Nota actualizada',
          text: 'Los cambios se han guardado correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });
      } catch (e) {
        console.error('Error actualizando nota del cliente:', e);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al actualizar',
          text: 'No se pudo guardar la nota. Inténtelo de nuevo.'
        });
      } finally {
        this.guardandoNota = false;
      }
    },
    async eliminarNotaCliente(nota) {
      if (!this.clienteLocal?.id || !nota?.comentarioId) {
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo eliminar',
          text: 'Faltan datos para eliminar la nota.'
        });
        return;
      }

      const confirmacion = await this.$swal.fire({
        icon: 'warning',
        title: '¿Eliminar nota?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });

      if (!confirmacion.isConfirmed) return;

      this.eliminandoNotaId = nota.comentarioId;
      try {
        await tareasApi.eliminarNotaCliente(this.clienteLocal.id, nota.comentarioId);

        if (this.editandoNotaId === nota.comentarioId) {
          this.cancelarEdicionNota();
        }

        await this.cargarNotasCliente();

        this.$swal.fire({
          icon: 'success',
          title: 'Nota eliminada',
          timer: 1400,
          showConfirmButton: false,
        });
      } catch (e) {
        console.error('Error eliminando nota del cliente:', e);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se pudo eliminar la nota. Inténtelo de nuevo.'
        });
      } finally {
        this.eliminandoNotaId = null;
      }
    },
    async toggleFijadaNota(nota) {
      if (!this.clienteLocal?.id || !nota?.comentarioId) return;
      try {
        const notaActualizada = await tareasApi.toggleFijadaNota(this.clienteLocal.id, nota.comentarioId);
        // Reemplazar la nota actualizada y reasignar el array completo (fuerza reactividad)
        const notas = this.notasCliente.map(n => n.comentarioId === nota.comentarioId ? notaActualizada : n);
        // Reordenar: fijadas primero, luego por fecha descendente (editada o creada)
        notas.sort((a, b) => {
          if (a.fijado !== b.fijado) return a.fijado ? -1 : 1;
          const fechaA = a.fechaEdicion || a.fechaCreacion || '';
          const fechaB = b.fechaEdicion || b.fechaCreacion || '';
          return fechaB.localeCompare(fechaA);
        });
        this.notasCliente = notas;
      } catch (e) {
        console.error('Error al cambiar estado fijado de nota:', e);
      }
    },
    getColorPrioridad(prioridad) {
      const mapa = { 0: '#ef4444', 1: '#f97316', 2: '#eab308', 3: '#22c55e' };
      return mapa[prioridad] || '#94a3b8';
    },
    getPrioridadTexto(prioridad) {
      switch (prioridad) {
        case 0: return 'Urgente';
        case 1: return 'Alta';
        case 2: return 'Media';
        case 3: return 'Baja';
        default: return 'Normal';
      }
    },
    getEstadoIcon(estadoNombre) {
      const estado = estadoNombre ? estadoNombre.toLowerCase() : '';
      switch (estado) {
        case 'pendiente': return 'far fa-clock';
        case 'en progreso': case 'progreso': return 'far fa-play-circle';
        case 'completada': case 'finalizada': return 'far fa-check-circle';
        case 'cancelada': return 'far fa-times-circle';
        case 'pausada': return 'far fa-pause-circle';
        case 'bloqueada': return 'fas fa-lock';
        default: return 'fas fa-circle';
      }
    },
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString('es-ES');
    },
    formatDateTime(date) {
      if (!date) return '-';
      return new Date(date).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    },
    debeMostrarToggleNota(texto) {
      if (!texto) return false;
      return texto.length > 180 || texto.includes('\n');
    },
    estaNotaExpandida(notaId) {
      return !!this.notasExpandidas[notaId];
    },
    toggleNotaExpandida(notaId) {
      this.notasExpandidas = {
        ...this.notasExpandidas,
        [notaId]: !this.estaNotaExpandida(notaId),
      };
    },
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

/* Header actions group */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  align-self: stretch;
  margin-left: auto;
  padding-right: 0.5rem;
}

/* Tareas/actividad button */
.btn-tareas-actividad {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.15s ease;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.35);
}

.btn-tareas-actividad:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  box-shadow: 0 3px 10px rgba(234, 88, 12, 0.45);
}

.btn-tareas-actividad i {
  font-size: 0.95rem;
}

.tareas-count-badge {
  background: #fff;
  color: #ea580c;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.05rem 0.45rem;
  min-width: 20px;
  text-align: center;
  line-height: 1.5;
}

/* ═══════════════════════════════════════════════
   PANEL TAREAS / ACTIVIDAD  (clon de TareasComponent)
   ═══════════════════════════════════════════════ */

/* Overlay */
.tareas-panel-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.tareas-panel {
  width: 100%;
  max-width: 90%nic;
  height: 90vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  animation: slideInPanel 0.22s ease-out;
  overflow: hidden;
  border-radius: 12px;
}

@keyframes slideInPanel {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to   { 
    opacity: 1;
    transform: scale(1);
  }
}

/* Header */
.tareas-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.25rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff;
  flex-shrink: 0;
}

.tareas-panel-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.tareas-panel-cliente-nombre {
  font-weight: 400;
  opacity: 0.9;
  font-size: 0.9rem;
}

.tareas-panel-close {
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.15s;
}

.tareas-panel-close:hover { background: rgba(255,255,255,0.3); }

/* Body */
.tareas-panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tp-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #dbe6f2;
  background: linear-gradient(180deg, #f8fbff 0%, #f4f8fd 100%);
  flex-wrap: wrap;
}

.tp-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d7e3ef;
  background: #f8fbff;
  color: #334155;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.tp-tab-btn:hover {
  background: #f2f7fd;
  border-color: #bfd3e7;
}

.tp-tab-btn-tareas {
  background: #edf9f7;
  border-color: #c8e9e4;
  color: #0f766e;
}

.tp-tab-btn-tareas:hover {
  background: #e2f4f1;
  border-color: #9fd6ce;
}

.tp-tab-btn-actividad {
  background: #edf3ff;
  border-color: #cddcfb;
  color: #1d4ed8;
}

.tp-tab-btn-actividad:hover {
  background: #e3ecff;
  border-color: #adc4f7;
}

.tp-tab-btn-notas {
  background: #f4efff;
  border-color: #ddd1fb;
  color: #6d28d9;
}

.tp-tab-btn-notas:hover {
  background: #ece4ff;
  border-color: #c8b1f8;
}

.tp-tab-btn-incidencias {
  background: #fff6e9;
  border-color: #f7dfbd;
  color: #b45309;
}

.tp-tab-btn-incidencias:hover {
  background: #ffefd8;
  border-color: #f3cc92;
}

.tp-tab-btn.active {
  background: #1d4ed8;
  color: #fff;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(29, 78, 216, 0.25);
}

.tp-tab-btn-tareas.active {
  background: #0f766e;
  box-shadow: 0 8px 18px rgba(15, 118, 110, 0.25);
}

.tp-tab-btn-actividad.active {
  background: #2563eb;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
}

.tp-tab-btn-notas.active {
  background: #7c3aed;
  box-shadow: 0 8px 18px rgba(124, 58, 237, 0.25);
}

.tp-tab-btn-incidencias.active {
  background: #d97706;
  box-shadow: 0 8px 18px rgba(217, 119, 6, 0.25);
}

.tp-tab-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef5fb;
  color: #3b82f6;
  flex-shrink: 0;
}

.tp-tab-btn-tareas .tp-tab-icon { color: #0f766e; background: #e8f7f5; }
.tp-tab-btn-actividad .tp-tab-icon { color: #2563eb; background: #eaf1ff; }
.tp-tab-btn-notas .tp-tab-icon { color: #7c3aed; background: #f3edff; }
.tp-tab-btn-incidencias .tp-tab-icon { color: #d97706; background: #fff4e8; }

.tp-tab-btn.active .tp-tab-icon {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.tp-tab-label {
  line-height: 1;
}

.tp-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 0.75rem;
  padding: 0 6px;
}

.tp-tab-btn.active .tp-tab-count {
  background: rgba(255, 255, 255, 0.22);
}

.tp-tab-btn-tareas .tp-tab-count {
  background: #d8f1ec;
  color: #0f766e;
}

.tp-tab-btn-actividad .tp-tab-count {
  background: #dbe7ff;
  color: #1d4ed8;
}

.tp-tab-btn-notas .tp-tab-count {
  background: #e9dcff;
  color: #6d28d9;
}

.tp-tab-btn-incidencias .tp-tab-count {
  background: #fde7cb;
  color: #b45309;
}

.tp-tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tp-content-tareas,
.tp-content-actividad,
.tp-content-notas,
.tp-content-incidencias {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 18%);
}

/* Loading / empty */
.tareas-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  padding: 3rem;
  justify-content: center;
}

.tareas-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #94a3b8;
  text-align: center;
}

/* ── Toolbar ── */
.tp-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.tp-search-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.tp-search-icon {
  position: absolute;
  left: 0.7rem;
  color: #94a3b8;
  font-size: 0.8rem;
  pointer-events: none;
}

.tp-search-input {
  width: 100%;
  padding: 0.45rem 2rem 0.45rem 2rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.tp-search-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249,115,22,0.12);
}

.tp-search-clear {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.2rem;
  display: flex;
  align-items: center;
}

.tp-search-clear:hover { color: #475569; }

.tp-count {
  flex-shrink: 0;
  font-size: 0.85rem;
  color: #64748b;
  white-space: nowrap;
  background: #fff;
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.tp-timeline-list {
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tp-timeline-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
}

.tp-timeline-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tp-timeline-icon {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  background: #eaf1ff;
  flex-shrink: 0;
}

.tp-timeline-type {
  font-size: 0.78rem;
  font-weight: 800;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-right: auto;
}

.tp-timeline-desc {
  margin: 0;
  color: #334155;
  font-size: 0.9rem;
}

.tp-timeline-date {
  margin-top: 6px;
  color: #64748b;
  font-size: 0.78rem;
}

.tp-timeline-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.tp-content-notas {
  overflow: hidden;
}

.tp-notas-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  gap: 10px;
  padding: 10px 12px 12px;
}

.tp-notas-topbar {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(360px, 1.4fr);
  gap: 10px;
  flex-shrink: 0;
}

.tp-notas-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 8px 10px;
  min-width: 0;
}

.tp-notas-card-head,
.tp-notas-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.tp-notas-head-left {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  min-width: 0;
}

.tp-mini-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0 6px;
}

.tp-section-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.tp-notas-card-fijadas .tp-section-icon {
  background: #fff1e5;
  color: #c2410c;
}

.tp-notas-card-crear .tp-section-icon {
  background: #ede9fe;
  color: #6d28d9;
}

.tp-notas-history .tp-section-icon {
  background: #e0f2fe;
  color: #0369a1;
}

.tp-fijadas-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #f4d0b4;
  border-radius: 8px;
  padding: 5px 9px;
  background: #fff8f1;
  color: #9a3412;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.tp-fijadas-toggle:hover:not(:disabled) {
  background: #ffefdf;
  border-color: #efb58a;
}

.tp-fijadas-toggle:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tp-notas-empty-small {
  color: #94a3b8;
  font-size: 0.8rem;
  font-style: italic;
}

.tp-notas-empty-inline {
  padding: 4px 2px 6px;
}

.tp-notas-fijadas-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.tp-nota-fijada-item {
  background: linear-gradient(145deg, #fff8f1 0%, #ffffff 100%);
  border: 1px solid #fde0c2;
  border-left: 3px solid #ea6f38;
  border-radius: 9px;
  padding: 7px 9px;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
  min-width: 0;
}

.tp-nota-fijada-item:hover {
  background: #fff3e4;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(234, 111, 56, 0.11);
}

.tp-nota-fijada-title {
  margin: 4px 0 0;
  color: #1f2937;
  font-size: 0.83rem;
  line-height: 1.25;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tp-nota-estado {
  font-size: 0.72rem;
  font-weight: 700;
}

.tp-nota-estado i {
  font-size: 0.52rem;
  margin-right: 4px;
}

.tp-notas-create {
  padding: 8px 10px;
  border: 1px solid #e6dbff;
  border-radius: 10px;
  margin: 0;
  background: linear-gradient(180deg, #faf7ff 0%, #ffffff 100%);
  overflow-x: hidden;
}

.tp-btn-create-note {
  display: inline-flex;
  align-items: center;
  align-self: flex-end;
  gap: 8px;
  border: none;
  border-radius: 10px;
  padding: 9px 12px;
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(91, 33, 182, 0.24);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  min-height: 38px;
}

.tp-btn-create-note:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(91, 33, 182, 0.3);
}

.tp-btn-create-note:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.tp-nota-create-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-self: flex-end;
}

.tp-btn-pin-note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 10px;
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 32px;
}

.tp-btn-pin-note:hover {
  border-color: #f59e0b;
  color: #f59e0b;
}

.tp-btn-pin-note.pinned {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #f59e0b;
}

.tp-btn-pin-note.pinned .fa-thumbtack {
  transform: rotate(-45deg);
}

.tp-note-pin-comment {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  position: relative;
  color: #f59e0b;
}

.tp-note-pin-comment:hover {
  color: #f59e0b;
  opacity: 1;
  transform: scale(1.15);
}

.tp-note-pin-comment.pinned {
  color: #f59e0b;
  opacity: 1;
}

.tp-note-pin-comment.pinned .fa-thumbtack {
  transform: rotate(-45deg);
}

.tp-nota-fijada-highlight {
  border-left: 3px solid #f97316 !important;
  background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%) !important;
}

.tp-notas-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.tp-notas-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.tp-notas-field label {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 700;
}

.tp-notas-field-grow {
  flex: 1;
  min-width: 220px;
}

.tp-notas-textarea {
  width: 100%;
  min-height: 62px;
  resize: vertical;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.88rem;
  color: #1e293b;
  font-family: inherit;
}

.tp-notas-textarea:focus {
  outline: none;
  border-color: #f97316;
  box-shadow: 0 0 0 2px rgba(249,115,22,0.12);
}

.tp-notas-history {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #dbe6f2;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  overflow: hidden;
}

.tp-notas-history-head {
  margin-bottom: 0;
  padding: 9px 10px;
  border-bottom: 1px solid #e6edf5;
  flex-shrink: 0;
}

.tp-notas-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tp-nota-item {
  border: 1px solid #dbe8f3;
  border-left: 3px solid #0ea5e9;
  border-radius: 9px;
  background: linear-gradient(160deg, #f7fcff 0%, #ffffff 100%);
  padding: 8px 10px;
  position: relative;
  min-width: 0;
}

.tp-note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 0.75rem;
}

.tp-note-meta-compact {
  margin-bottom: 4px;
}

.tp-cups-chip {
  background: #eef9ff;
  color: #0f5f86;
  border: 1px solid #b6e7ff;
  border-radius: 999px;
  padding: 2px 8px;
  font-family: monospace;
  font-weight: 700;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tp-cups-chip i {
  margin-right: 4px;
  font-size: 0.7rem;
}

.tp-meta-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tp-meta-inline i {
  color: #3b82f6;
}

.tp-note-edited-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff4d8;
  border: 1px solid #f6d38a;
  color: #9a5b00;
  font-weight: 700;
  font-size: 0.7rem;
}

.tp-note-text {
  margin: 0;
  color: #1f2937;
  line-height: 1.35;
  font-size: 0.86rem;
  white-space: pre-wrap;
}

.tp-note-text-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tp-note-expand-btn {
  margin-top: 3px;
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tp-note-expand-btn:hover {
  color: #1d4ed8;
}

.tp-note-actions {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  background: rgba(102, 126, 234, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-top: 0;
  margin-left: auto;
  justify-content: flex-end;
  flex-shrink: 0;
}

.tp-nota-item:hover .tp-note-actions {
  background: rgba(102, 126, 234, 0.15);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.tp-note-edit-comment,
.tp-note-delete-comment {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  position: relative;
}

.tp-note-edit-comment:disabled,
.tp-note-delete-comment:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tp-note-edit-comment::before,
.tp-note-delete-comment::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: -1;
}

.tp-note-edit-comment {
  color: #3182ce;
}

.tp-note-edit-comment::before {
  background: rgba(49, 130, 206, 0.1);
  transform: scale(0);
}

.tp-note-edit-comment:hover {
  color: #3182ce;
  opacity: 1;
  transform: scale(1.15);
}

.tp-note-edit-comment:hover::before {
  transform: scale(1);
}

.tp-note-delete-comment {
  color: #e53e3e;
}

.tp-note-delete-comment::before {
  background: rgba(229, 62, 62, 0.1);
  transform: scale(0);
}

.tp-note-delete-comment:hover {
  color: #e53e3e;
  opacity: 1;
  transform: scale(1.15);
}

.tp-note-delete-comment:hover::before {
  transform: scale(1);
}

.tp-nota-item:hover .tp-note-edit-comment,
.tp-nota-item:hover .tp-note-delete-comment {
  opacity: 0.8;
}

.tp-nota-edit-grid {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.tp-note-actions-edit {
  display: flex;
  gap: 6px;
}

.tp-note-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tp-note-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.tp-pagination-notas {
  border-top: 1px solid #e6edf5;
  border-radius: 0;
}

.tp-note-save {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.tp-note-save:hover:not(:disabled) {
  background: #dbeafe;
}

.tp-note-cancel {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.tp-note-cancel:hover:not(:disabled) {
  background: #f1f5f9;
}

.tp-doc-pendiente {
  margin: 10px 12px 12px;
  padding: 8px 10px;
  background: #fff7ed;
  border: 1px dashed #fb923c;
  border-radius: 8px;
  color: #9a3412;
  font-size: 0.82rem;
}

@media (max-width: 1250px) {
  .tp-notas-topbar {
    grid-template-columns: 1fr;
  }

  .tp-notas-fijadas-list {
    max-height: 96px;
  }
}

@media (max-width: 900px) {
  .tp-tab-btn {
    flex: 1;
    justify-content: center;
  }

  .tp-notas-layout {
    padding: 8px;
    gap: 8px;
  }

  .tp-notas-card,
  .tp-notas-history {
    border-radius: 10px;
  }

  .tp-notas-card-head,
  .tp-notas-history-head {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .tp-cups-chip {
    max-width: 145px;
  }

  .tp-notas-row {
    flex-direction: column;
    align-items: stretch;
  }

  .tp-notas-field-grow {
    min-width: 100%;
  }

  .tp-btn-create-note {
    width: 100%;
    justify-content: center;
  }

  .tp-note-actions-edit {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .tp-note-actions {
    width: auto;
    justify-content: flex-end;
    margin-left: auto;
  }

  .tp-note-action-btn {
    flex: 1;
    justify-content: center;
    min-width: 120px;
  }

  .tp-timeline-main {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ── Table ── */
.tp-table-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  background: #fff;
}

.tp-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
}

.tp-table th {
  background: #f8fafc;
  color: #374151;
  font-weight: 600;
  padding: 12px 15px;
  text-align: left;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tp-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  height: 52px;
}

.tp-table tbody tr {
  transition: background 0.1s;
}

.tp-table tbody tr:hover {
  background: #f8fafc;
}

/* Row states */
.tp-row-vencida { background: rgba(220,53,69,0.05) !important; }
.tp-row-vencida:hover { background: rgba(220,53,69,0.1) !important; }
.tp-row-completada { opacity: 0.6; }
.tp-row-completada td { text-decoration: line-through; }
.tp-row-fijada { background: rgba(255,193,7,0.08) !important; border-left: 3px solid #ffc107 !important; }
.tp-row-fijada:hover { background: rgba(255,193,7,0.15) !important; }

/* Cell helpers */
.tp-td-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tp-titulo-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tp-pin-icon {
  color: #ffc107;
  transform: rotate(-45deg);
  font-size: 0.75rem;
  flex-shrink: 0;
}

/* Estado badge — exacto a TareasComponent */
.tp-estado-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 6px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  letter-spacing: 0.5px;
}

.tp-estado-badge i { font-size: 0.65rem; }

/* Prioridad badge — exacto a TareasComponent */
.tp-prioridad-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.3px;
  border: 2px solid transparent;
}

.tp-prioridad-0 {
  background: #8b0000;
  color: #fff;
  border-color: #5c0000;
  animation: pulse-urgente 2s infinite;
}
.tp-prioridad-0::before { content: '\f071'; font-family: 'Font Awesome 5 Free'; font-weight: 900; }

@keyframes pulse-urgente {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139,0,0,0.4); }
  50%       { box-shadow: 0 0 0 4px rgba(139,0,0,0); }
}

.tp-prioridad-1 { background: #dc3545; color: #fff; border-color: #bd2130; }
.tp-prioridad-1::before { content: '\f062'; font-family: 'Font Awesome 5 Free'; font-weight: 900; }

.tp-prioridad-2 { background: #fff3cd; color: #856404; border-color: #ffc107; }
.tp-prioridad-2::before { content: '\f068'; font-family: 'Font Awesome 5 Free'; font-weight: 900; }

.tp-prioridad-3 { background: #d4edda; color: #155724; border-color: #28a745; }
.tp-prioridad-3::before { content: '\f063'; font-family: 'Font Awesome 5 Free'; font-weight: 900; }

/* Categoría badge */
.tp-categoria-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e7f1f8;
  color: #0c5460;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* CUPS badges */
.tp-cups-badge {
  display: inline-block;
  font-family: monospace;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1a56db;
  background: #ebf2ff;
  border-radius: 6px;
  padding: 2px 7px;
}

.tp-cups-general {
  font-size: 0.82rem;
  color: #6c757d;
  font-style: italic;
}

/* Fecha vencida */
.tp-fecha-vencida { color: #dc3545; font-weight: 600; }

/* View button */
.tp-btn-view {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #43a047;
  transition: background 0.2s;
  margin: 0 auto;
}

.tp-btn-view:hover { background: rgba(67,160,71,0.1); }

/* ── Pagination ── */
.tp-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}

.tp-pagination-compact {
  padding: 10px 12px;
}

.tp-pag-perpage {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #64748b;
  font-weight: 500;
}

.tp-pag-select {
  width: auto;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  font-size: 0.88rem;
}

.tp-pag-info {
  color: #64748b;
  font-size: 0.9rem;
  background: #fff;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  white-space: nowrap;
}

.tp-pag-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.tp-pag-label {
  color: #374151;
  font-weight: 500;
  padding: 0 10px;
  white-space: nowrap;
  font-size: 0.9rem;
}

.tp-pag-btn {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #374151;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tp-pag-btn:hover:not(:disabled) {
  background: #fcd700;
  color: #000;
  border-color: #fcd700;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tp-pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.text-muted { color: #94a3b8; }

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
  resize: none;
  min-height: 50px;
  max-height: 200px;
  overflow-y: auto;
  transition: height 0.2s ease;
}

.btn-expand-notes {
  background: rgba(0,0,0,0.05);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  color: #666;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-expand-notes:hover {
  background: rgba(0,0,0,0.1);
  color: #333;
  transform: none;
  box-shadow: none;
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

/* CORRECCIÓN: Botón cancelar flotante eliminado */

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