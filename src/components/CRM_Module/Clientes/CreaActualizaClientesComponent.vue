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
            <span v-if="tareas.length > 0" class="tareas-count-badge">{{ tareas.length }}</span>
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
        <div v-if="cargandoTareas" class="tareas-loading">
          <i class="fas fa-spinner fa-spin"></i> Cargando tareas...
        </div>
        <div v-else-if="tareas.length === 0" class="tareas-empty-state">
          <i class="fas fa-clipboard-list fa-3x text-muted"></i>
          <p>No hay tareas para este cliente</p>
        </div>
        <template v-else>
          <!-- Toolbar: búsqueda + contador -->
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

          <!-- Tabla -->
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

          <!-- Paginación -->
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
  </div>
</template>

<script>
import axios from 'axios';
import TareaDetalleModal from '@/components/CRM_Module/Tareas/TareaDetalleModal.vue';
import tareasApi from '@/services/tareasApi.js';

export default {
  name: "CreaActualizaClienteComponent",
  components: { TareaDetalleModal },
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
      estadosTareas: [],
      tareasPanelBusqueda: '',
      tareasPanelPagina: 1,
      tareasPanelPorPagina: 10,
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
        this.tareasPanelBusqueda = '';
        this.tareasPanelPagina = 1;
      }
    },
    tareasPanelBusqueda() {
      this.tareasPanelPagina = 1;
    },
    tareasPanelPorPagina() {
      this.tareasPanelPagina = 1;
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
      if (this.tareas.length === 0 && !this.cargandoTareas) {
        await this.cargarTareas();
      }
    },
    cerrarPanelTareas() {
      this.mostrarPanelTareas = false;
    },
    async cargarTareas() {
      if (!this.clienteLocal?.id) return;
      this.cargandoTareas = true;
      try {
        const [tareasRes, estadosRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/api/tareas/cliente/${this.clienteLocal.id}`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/tareas/estados`)
        ]);
        this.tareas = tareasRes.data;
        this.estadosTareas = estadosRes.data;
      } catch (e) {
        console.error('Error cargando tareas del cliente:', e);
      } finally {
        this.cargandoTareas = false;
      }
    },
    abrirTarea(tarea) {
      this.tareaSeleccionada = tarea;
    },
    cerrarTarea() {
      this.tareaSeleccionada = null;
    },
    async handleActualizarTarea() {
      await this.cargarTareas();
    },
    async handleCambiarEstado(tareaId, estadoId, motivoBloqueo = null) {
      try {
        await tareasApi.cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo);
        await this.cargarTareas();
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
        await this.cargarTareas();
        this.cerrarTarea();
      } catch (e) {
        console.error('Error completando tarea:', e);
      }
    },
    async handleCrearComentarioEstado(data) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      try {
        await tareasApi.crearComentario({ tareaId: data.tareaId, usuarioId: usuario.id, comentario: data.contenido });
      } catch (e) {
        console.error('Error creando comentario:', e);
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
  max-width: 1800px;
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