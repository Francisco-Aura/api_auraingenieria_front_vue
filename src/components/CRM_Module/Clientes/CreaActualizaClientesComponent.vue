<template>
  <div>
    <div v-if="formularioVisible" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cliente-form-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-user-tie"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="cliente-form-title" class="modal-title">{{ modoActualizar ? 'Modificar cliente' : 'Alta de cliente' }}</h2>
          <span class="aura-modal-header__subtitulo">
            <template v-if="modoActualizar">
              <span v-if="clienteLocal.nombre"><strong>{{ clienteLocal.nombre }}</strong></span>
              <span v-if="clienteLocal.cif" class="aura-dato"><span class="aura-dato__etiqueta">CIF</span>{{ clienteLocal.cif }}</span>
            </template>
            <span v-else>Rellene los datos principales y, si quiere, los contactos</span>
          </span>
        </div>
        <div class="aura-modal-header__acciones">
          <button
            v-if="modoActualizar && clienteLocal.id"
            type="button"
            class="aura-modal-header__boton"
            @click="abrirPanelTareas"
            title="Ver tareas, actividad, notas e incidencias del cliente"
          >
            <i class="fas fa-tasks"></i>
            <span>Tareas y actividad</span>
          </button>
          <button type="button" class="close-button" @click="cancelarFormulario" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Formulario principal -->
      <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()" novalidate>
        <!-- Pestañas para organizar el contenido -->        
        <div class="aura-pestanas" role="tablist" aria-label="Secciones del cliente">
          <button type="button" role="tab" class="aura-pestana" :class="{ 'aura-pestana--activa': activeTab === 'principal' }"
                  :aria-selected="activeTab === 'principal' ? 'true' : 'false'" @click="activeTab = 'principal'">
            <span class="aura-pestana__numero">1</span> <span>Datos principales</span>
          </button>
          <button type="button" role="tab" class="aura-pestana" :class="{ 'aura-pestana--activa': activeTab === 'contactos' }"
                  :aria-selected="activeTab === 'contactos' ? 'true' : 'false'" @click="activeTab = 'contactos'">
            <span class="aura-pestana__numero">2</span> <span>Contactos y adicionales</span>
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
                    <label for="grupoEmpresarial">Grupo empresarial <span class="required">*</span></label>
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
                  <label for="direccionFiscal">Dirección fiscal <span class="required">*</span></label>
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

              <!-- Datos financieros y Clasificación -->
              <div class="form-section-compact">
                <div class="section-header-compact">
                  <i class="fas fa-university"></i>
                  <h3>Datos financieros</h3>
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
                  <label for="usuario">Usuario asignado <span v-if="clienteLocal.id" class="required">*</span></label>
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

              <!-- Persona autorizada -->
              <div class="form-section-compact full-width">
                <div class="section-header-compact">
                  <i class="fas fa-user-check"></i>
                  <h3>Persona autorizada</h3>
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

            <!-- Servicios del cliente -->
            <div class="services-section">
              <div class="services-header">
                <h3><i class="fas fa-cog"></i> Servicios del cliente</h3>
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
              <div class="section-header-compact section-header-compact--con-accion">
                <div class="section-header-compact-titulo">
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
                <!-- Botón Dar de baja (solo si está activo y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && !clienteLocal.fechaBaja" type="button" @click="confirmarBajaCliente" class="btn-compact btn-danger">
                  <i class="fas fa-user-times"></i> Dar de baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" type="button" @click="confirmarReactivarCliente" class="btn-compact btn-success">
                  <i class="fas fa-user-check"></i> Reactivar cliente
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
                    <h3>Contacto principal</h3>
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
                    <h3>Contacto secundario</h3>
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
                    <h3>Contacto adicional</h3>
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
              <button type="button" class="btn-compact btn-back" @click="activeTab = 'principal'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <div class="action-buttons">
                <!-- Botón Dar de baja (solo si está activo y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && !clienteLocal.fechaBaja" type="button" @click="confirmarBajaCliente" class="btn-compact btn-danger">
                  <i class="fas fa-user-times"></i> Dar de baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="modoActualizar && clienteLocal.id && clienteLocal.fechaBaja" type="button" @click="confirmarReactivarCliente" class="btn-compact btn-success">
                  <i class="fas fa-user-check"></i> Reactivar cliente
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
      <div class="tareas-panel-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-tasks"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 class="tareas-panel-title">Tareas y actividad</h2>
          <span v-if="clienteLocal.nombre" class="aura-modal-header__subtitulo"><span><strong>{{ clienteLocal.nombre }}</strong></span></span>
        </div>
        <button type="button" class="close-button" @click="cerrarPanelTareas" aria-label="Cerrar">
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
                    <th class="tp-th-tarea-titulo">Título</th>
                    <th class="tp-th-tarea-estado">Estado</th>
                    <th class="tp-th-tarea-prioridad">Prioridad</th>
                    <th class="tp-th-tarea-categoria">Categoría</th>
                    <th class="tp-th-tarea-asignado">Asignado a</th>
                    <th class="tp-th-tarea-cups">CUPS</th>
                    <th class="tp-th-tarea-fecha">Fecha vto.</th>
                    <th class="tp-th-tarea-acciones"></th>
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
                  </div>
                  <div
                    class="tp-attach-drop-zone"
                    :class="{ 'drag-activo': dragActivoNotaCrear }"
                    @dragover.prevent="dragActivoNotaCrear = true"
                    @dragleave="dragActivoNotaCrear = false"
                    @drop.prevent="onDropArchivoNuevaNota"
                  >
                    <input ref="inputArchivoNuevaNota" type="file" class="input-file-oculto" multiple @change="seleccionarArchivoNuevaNota($event)" accept="*/*">
                    <div class="tp-attach-hint">
                      <i class="fas fa-cloud-upload-alt tp-attach-icon"></i>
                      <span class="tp-attach-text">Arrastra archivos aquí o</span>
                      <button type="button" class="tp-attach-select-btn" @click="$refs.inputArchivoNuevaNota.click()">
                        <i class="fas fa-folder-open"></i> Seleccionar
                      </button>
                    </div>
                    <ul v-if="nuevaNota.archivos.length > 0" class="tp-attach-list">
                      <li v-for="(archivo, idx) in nuevaNota.archivos" :key="idx">
                        <i class="fas fa-paperclip"></i>
                        <span class="tp-attach-name">{{ archivo.name }}</span>
                        <span class="tp-attach-size">{{ formatFileSize(archivo.size) }}</span>
                        <button type="button" class="tp-attach-remove" @click.stop="quitarArchivoNuevaNota(idx)" title="Quitar archivo">
                          <i class="fas fa-times"></i>
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div class="tp-nota-create-actions">
                    <button type="button" class="tp-btn-create-note" :disabled="creandoNota" @click="crearNotaCliente">
                      <i class="fas" :class="creandoNota ? 'fa-spinner fa-spin' : 'fa-plus-circle'"></i>
                      {{ creandoNota ? 'Guardando...' : 'Crear nota' }}
                    </button>
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
                    <template v-if="(nota.adjuntos && nota.adjuntos.length) || nota.nombreArchivo">
                      <span
                        v-for="adjunto in (nota.adjuntos && nota.adjuntos.length ? nota.adjuntos : [{ id: -nota.comentarioId, nombreArchivo: nota.nombreArchivo }])"
                        :key="'file-' + adjunto.id"
                        class="tp-note-file-badge tp-note-file-link"
                        :title="`Descargar: ${adjunto.nombreArchivo}`"
                        @click="descargarAdjuntoNota(nota, adjunto.id, adjunto.nombreArchivo)"
                      >
                        <i class="fas fa-paperclip"></i> {{ adjunto.nombreArchivo }}
                      </span>
                    </template>
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
                      <div
                        class="tp-attach-drop-zone tp-attach-drop-zone-compact"
                        :class="{ 'drag-activo': dragActivoNotaEditar }"
                        @dragover.prevent="dragActivoNotaEditar = true"
                        @dragleave="dragActivoNotaEditar = false"
                        @drop.prevent="onDropArchivoEdicionNota"
                      >
                        <input ref="inputArchivoNotaEdicion" type="file" class="input-file-oculto" multiple @change="seleccionarArchivoEdicionNota($event)" accept="*/*">
                        <div class="tp-attach-hint">
                          <i class="fas fa-cloud-upload-alt tp-attach-icon"></i>
                          <span class="tp-attach-text">Arrastra archivos para añadirlos o</span>
                          <button type="button" class="tp-attach-select-btn" @click="$refs.inputArchivoNotaEdicion.click()">
                            <i class="fas fa-folder-open"></i> Seleccionar
                          </button>
                        </div>
                        <ul
                          v-if="(nota.adjuntos && nota.adjuntos.length) || notaEdicion.archivosNuevos.length > 0 || (!nota.adjuntos?.length && nota.nombreArchivo)"
                          class="tp-attach-list"
                        >
                          <li v-for="adjunto in (nota.adjuntos || (nota.nombreArchivo ? [{ id: -nota.comentarioId, nombreArchivo: nota.nombreArchivo }] : []))" :key="'adj-' + adjunto.id">
                            <button type="button" class="tp-adjunto-link" @click.stop="descargarAdjuntoNota(nota, adjunto.id, adjunto.nombreArchivo)" :title="'Descargar ' + adjunto.nombreArchivo">
                              <i class="fas fa-paperclip"></i>
                              {{ adjunto.nombreArchivo }}
                            </button>
                            <button type="button" class="tp-attach-remove" @click.stop="eliminarAdjuntoNota(nota, adjunto.id)" title="Eliminar adjunto">
                              <i class="fas fa-trash"></i>
                            </button>
                          </li>
                          <li v-for="(archivo, idx) in notaEdicion.archivosNuevos" :key="'nuevo-' + idx" class="tp-adjunto-nuevo">
                            <i class="fas fa-plus"></i>
                            <span class="tp-attach-name">{{ archivo.name }}</span>
                            <span class="tp-attach-size">{{ formatFileSize(archivo.size) }}</span>
                            <button type="button" class="tp-attach-remove" @click.stop="quitarArchivoEdicionNota(idx)" title="Quitar archivo nuevo">
                              <i class="fas fa-times"></i>
                            </button>
                          </li>
                        </ul>
                      </div>
                      <div class="tp-note-actions-edit tp-note-actions-edit-bottom">
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
                    <th class="tp-th-incidencia-titulo">Título</th>
                    <th class="tp-th-incidencia-estado">Estado</th>
                    <th class="tp-th-incidencia-prioridad">Prioridad</th>
                    <th class="tp-th-incidencia-categoria">Categoría/Subcategoría</th>
                    <th class="tp-th-incidencia-cups">CUPS</th>
                    <th class="tp-th-incidencia-fecha">Fecha vto.</th>
                    <th class="tp-th-incidencia-acciones"></th>
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
import { descargarRespuesta } from '@/utils/descargas';
import { textoError } from '@/utils/errores';
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
      darDeBaja: false,
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
        archivos: [],
      },
      creandoNota: false,
      dragActivoNotaCrear: false,
      dragActivoNotaEditar: false,
      editandoNotaId: null,
      notaEdicion: {
        cups: '',
        comentario: '',
        archivosNuevos: [],
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
        // Sin esto, los avisos de «obligatorio» de un alta cancelada seguían
        // marcados al abrir después un cliente con todos sus datos
        this.errores = {};
        // Reset tareas panel state when modal reopens
        this.tareas = [];
        this.actividadCliente = [];
        this.notasCliente = [];
        this.incidenciasCliente = [];
        this.cupsOpcionesNotas = [];
        this.nuevaNota = { cups: '', comentario: '', fijada: false, archivos: [] };
        this.editandoNotaId = null;
        this.notaEdicion = { cups: '', comentario: '', archivosNuevos: [] };
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
        { campo: 'emailAutorizado', label: 'Email (Persona autorizada)', tab: 'contactos' },
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
            <div class="swal-accion-contenedor">
              <div class="swal-accion-caja swal-accion-caja--danger">
                <div class="swal-accion-caja-header swal-accion-caja-header--danger">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>Acción de baja de cliente</span>
                </div>
                <p class="swal-accion-caja-texto swal-accion-caja-texto--danger">Esta acción marcará al cliente como dado de baja en el sistema.</p>
                <p class="swal-accion-caja-texto swal-accion-caja-texto--danger swal-accion-caja-texto--secundario">
                  <i class="fas fa-exclamation-circle"></i>
                  Se darán de baja automáticamente <strong>todos sus puntos de suministro, contratos y servicios activos</strong>.
                </p>
              </div>
              <label for="swal-fecha-baja" class="swal-accion-label">
                <i class="fas fa-calendar-alt"></i>
                Fecha de baja *
              </label>
              <input 
                type="date" 
                id="swal-fecha-baja" 
                class="swal2-input swal-accion-input" 
                required
              />
            </div>
          `,
          icon: 'warning',
          iconColor: '#b56767',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-user-times"></i> Confirmar baja',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#d33',
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
            <div class="swal-accion-contenedor">
              <div class="swal-accion-caja swal-accion-caja--success">
                <div class="swal-accion-caja-header swal-accion-caja-header--success">
                  <i class="fas fa-user-check"></i>
                  <span>Reactivación de cliente</span>
                </div>
                <p class="swal-accion-caja-texto swal-accion-caja-texto--success">Esta acción reactivará al cliente en el sistema, eliminando la fecha de baja.</p>
              </div>
            </div>
          `,
          icon: 'success',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-user-check"></i> Confirmar reactivación',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#fcd700',
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
          return `<label class="swal-reactivar-ps-item">
            <input type="checkbox" value="${ps.id}" checked>
            <span>${etiqueta || 'PS #' + ps.id}</span>
          </label>`;
        }).join('');

        const { isConfirmed: confirmarPS, value: idsSeleccionados } = await this.$swal.fire({
          title: 'Reactivar puntos de suministro',
          html: `
            <div class="swal-reactivar-ps-contenedor">
              <p class="swal-reactivar-ps-descripcion">Selecciona los puntos de suministro que deseas reactivar:</p>
              <div id="ps-checkboxes" class="swal-reactivar-ps-lista">
                ${checkboxesHtml}
              </div>
            </div>
          `,
          icon: 'question',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-bolt"></i> Reactivar seleccionados',
          cancelButtonText: '<i class="fas fa-times"></i> No reactivar ninguno',
          confirmButtonColor: '#fcd700',
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
          confirmButtonColor: '#fcd700',
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
          confirmButtonColor: '#fcd700'
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
        confirmButtonColor: '#fcd700',
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
        }, this.nuevaNota.archivos);

        this.nuevaNota.comentario = '';
        this.nuevaNota.cups = '';
        this.nuevaNota.fijada = false;
        this.nuevaNota.archivos = [];
        if (this.$refs.inputArchivoNuevaNota) this.$refs.inputArchivoNuevaNota.value = '';

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
          text: textoError(e, 'No se pudo guardar la nota. Inténtelo de nuevo.')
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
        archivosNuevos: [],
      };
    },
    cancelarEdicionNota() {
      this.editandoNotaId = null;
      this.notaEdicion = { cups: '', comentario: '', archivosNuevos: [] };
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
        }, this.notaEdicion.archivosNuevos);

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
          text: textoError(e, 'No se pudo guardar la nota. Inténtelo de nuevo.')
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
          text: textoError(e, 'No se pudo eliminar la nota. Inténtelo de nuevo.')
        });
      } finally {
        this.eliminandoNotaId = null;
      }
    },
    seleccionarArchivoNuevaNota(event) {
      const nuevos = Array.from(event.target.files || []);
      this.nuevaNota.archivos = [...this.nuevaNota.archivos, ...nuevos];
    },
    onDropArchivoNuevaNota(event) {
      this.dragActivoNotaCrear = false;
      const nuevos = Array.from(event.dataTransfer?.files || []);
      this.nuevaNota.archivos = [...this.nuevaNota.archivos, ...nuevos];
    },
    quitarArchivoNuevaNota(idx) {
      this.nuevaNota.archivos.splice(idx, 1);
    },
    formatFileSize(bytes) {
      if (bytes == null) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    seleccionarArchivoEdicionNota(event) {
      const nuevos = Array.from(event.target.files || []);
      this.notaEdicion.archivosNuevos = [...this.notaEdicion.archivosNuevos, ...nuevos];
    },
    onDropArchivoEdicionNota(event) {
      this.dragActivoNotaEditar = false;
      const nuevos = Array.from(event.dataTransfer?.files || []);
      this.notaEdicion.archivosNuevos = [...this.notaEdicion.archivosNuevos, ...nuevos];
    },
    quitarArchivoEdicionNota(idx) {
      this.notaEdicion.archivosNuevos.splice(idx, 1);
    },
    async descargarArchivoNota(nota) {
      try {
        const response = await tareasApi.descargarArchivoNota(this.clienteLocal.id, nota.comentarioId);
        this.descargarBlob(response, nota.nombreArchivo || 'archivo');
      } catch (e) {
        console.error('Error descargando archivo de nota:', e);
        this.$swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo descargar el archivo.' });
      }
    },
    async descargarAdjuntoNota(nota, adjuntoId, nombreArchivo) {
      try {
        const response = await tareasApi.descargarAdjuntoNota(this.clienteLocal.id, nota.comentarioId, adjuntoId);
        this.descargarBlob(response, nombreArchivo || 'archivo');
      } catch (e) {
        console.error('Error descargando adjunto de nota:', e);
        this.$swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo descargar el archivo.' });
      }
    },
    descargarBlob(response, nombreFallback) {
      descargarRespuesta(response, nombreFallback);
    },
    async eliminarAdjuntoNota(nota, adjuntoId) {
      const confirmacion = await this.$swal.fire({
        icon: 'warning',
        title: '¿Eliminar adjunto?',
        text: 'El archivo se eliminará permanentemente.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });
      if (!confirmacion.isConfirmed) return;
      try {
        const notaActualizada = await tareasApi.eliminarAdjuntoNotaCliente(this.clienteLocal.id, nota.comentarioId, adjuntoId);
        this.notasCliente = this.notasCliente.map(n => n.comentarioId === nota.comentarioId ? notaActualizada : n);
      } catch (e) {
        console.error('Error eliminando adjunto de nota:', e);
        this.$swal.fire({ icon: 'error', title: 'Error', text: textoError(e, 'No se pudo eliminar el archivo.') });
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

<style scoped src="./CreaActualizaClientesComponent.css"></style>