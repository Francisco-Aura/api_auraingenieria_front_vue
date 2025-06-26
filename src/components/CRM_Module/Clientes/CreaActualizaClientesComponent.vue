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
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'instalaciones' }" @click="activeTab = 'instalaciones'">
            <i class="fas fa-tools"></i> <span class="tab-text">Instalaciones</span>
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
                    <select 
                      id="usuario" 
                      v-model="clienteLocal.idUsuario" 
                      class="form-select-compact" 
                      :disabled="!isAdvancedUser"
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                        {{ usuario.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
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
            
            <!-- Navegación de pestañas (nuevo) -->
            <div class="tab-navigation">
              <div></div> <!-- Espacio vacío para alinear -->
              <button type="button" class="btn-compact btn-primary" @click="activeTab = 'contactos'">
                <i class="fas fa-arrow-right"></i> Siguiente
              </button>
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
                    <input type="text" id="nombreContacto1" v-model="clienteLocal.nombreContacto1" class="form-control-compact" />
                  </div>
                  <div class="form-group-compact">
                    <label for="cargoContacto1">Cargo</label>
                    <div class="select-container-compact">
                      <select id="cargoContacto1" v-model="clienteLocal.cargoContacto1" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option value="REPRESENTANTE LEGAL">REPRESENTANTE LEGAL</option>
                        <option value="ADMINISTRACION">ADMINISTRACION</option>
                        <option value="GERENTE">GERENTE</option>
                        <option value="ASESORIA">ASESORIA</option>
                        <option value="FACTURAS">FACTURAS</option>
                        <option value="ENCARGADO SUM. ELECTRICO">ENCARGADO SUM. ELECTRICO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
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
                    <div class="select-container-compact">
                      <select id="cargoContacto2" v-model="clienteLocal.cargoContacto2" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option value="REPRESENTANTE LEGAL">REPRESENTANTE LEGAL</option>
                        <option value="ADMINISTRACION">ADMINISTRACION</option>
                        <option value="GERENTE">GERENTE</option>
                        <option value="ASESORIA">ASESORIA</option>
                        <option value="FACTURAS">FACTURAS</option>
                        <option value="ENCARGADO SUM. ELECTRICO">ENCARGADO SUM. ELECTRICO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
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
                    <div class="select-container-compact">
                      <select id="cargoContacto3" v-model="clienteLocal.cargoContacto3" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option value="REPRESENTANTE LEGAL">REPRESENTANTE LEGAL</option>
                        <option value="ADMINISTRACION">ADMINISTRACION</option>
                        <option value="GERENTE">GERENTE</option>
                        <option value="ASESORIA">ASESORIA</option>
                        <option value="FACTURAS">FACTURAS</option>
                        <option value="ENCARGADO SUM. ELECTRICO">ENCARGADO SUM. ELECTRICO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
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
                          <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Notas en ancho completo -->
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
              </div>
            </div>

            <!-- Navegación de pestañas (nuevo) -->
            <div class="tab-navigation">
              <button type="button" class="btn-compact btn-secondary" @click="activeTab = 'principal'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <button type="button" class="btn-compact btn-primary" @click="activeTab = 'instalaciones'">
                <i class="fas fa-arrow-right"></i> Siguiente
              </button>
            </div>
          </div>

          <!-- Contenido de la pestaña Instalaciones -->
          <div v-show="activeTab === 'instalaciones'" class="tab-content" data-active-tab="instalaciones">
            <div class="form-grid-compact">
              <!-- Tres secciones de instalaciones en una fila -->
              <div class="installations-row">
                <!-- Batería de Condensadores -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-battery-full"></i>
                    <h3>Batería de Condensadores</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="bateriaCondensadores">Batería de Condensadores <span class="required">*</span></label>
                    <div class="select-container-compact">
                      <select id="bateriaCondensadores" v-model="clienteLocal.bateriaCondensadores" class="form-select-compact" required>
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="potenciaBateria">Potencia Batería</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-bolt icon-prefix"></i>
                      <input type="text" id="potenciaBateria" v-model="clienteLocal.potenciaBateria" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="modeloBateria">Modelo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-tag icon-prefix"></i>
                      <input type="text" id="modeloBateria" v-model="clienteLocal.modeloBateria" class="form-control-compact" />
                    </div>
                  </div>
                </div>

                <!-- Instalación Fotovoltaica -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-solar-panel"></i>
                    <h3>Instalación Fotovoltaica</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="instalacionFV">Instalación FV <span class="required">*</span></label>
                    <div class="select-container-compact">
                      <select id="instalacionFV" v-model="clienteLocal.instalacionFV" class="form-select-compact" required>
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwInversor">KW Inversor</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-microchip icon-prefix"></i>
                      <input type="text" id="kwInversor" v-model="clienteLocal.kwInversor" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwPanelesSolares">KW Paneles Solares</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-sun icon-prefix"></i>
                      <input type="text" id="kwPanelesSolares" v-model="clienteLocal.kwPanelesSolares" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="appMonitorizacion">APP Monitorización</label>
                    <div class="select-container-compact">
                      <select id="appMonitorizacion" v-model="clienteLocal.appMonitorizacionId" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option v-for="app in appMonitorizacion" :key="app.id" :value="app.id">
                          {{ app.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                </div>

                <!-- Almacenamiento Energético -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-warehouse"></i>
                    <h3>Almacenamiento Energético</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="bateriaAlmacenamiento">Batería <span class="required">*</span></label>
                    <div class="select-container-compact">
                      <select id="bateriaAlmacenamiento" v-model="clienteLocal.bateriaAlmacenamiento" class="form-select-compact" required>
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="potenciaBateriaAlmacenamiento">Potencia Batería</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-bolt icon-prefix"></i>
                      <input type="text" id="potenciaBateriaAlmacenamiento" v-model="clienteLocal.potenciaBateriaAlmacenamiento" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="backup">Backup</label>
                    <div class="select-container-compact">
                      <select id="backup" v-model="clienteLocal.backup" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="peaksaving">Peaksaving</label>
                    <div class="select-container-compact">
                      <select id="peaksaving" v-model="clienteLocal.peaksaving" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="integracionSistemasFV">Integración con Sistemas Fotovoltaicos</label>
                    <div class="select-container-compact">
                      <select id="integracionSistemasFV" v-model="clienteLocal.integracionSistemasFVId" class="form-select-compact">
                        <option value="">Seleccione...</option>
                        <option v-for="sistema in integracionSistemasFV" :key="sistema.id" :value="sistema.id">
                          {{ sistema.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Navegación y botones de acción -->
            <div class="tab-navigation">
              <button type="button" class="btn-compact btn-secondary" @click="activeTab = 'contactos'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
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
        // Campos de instalaciones
        bateriaCondensadores: "",
        potenciaBateria: "",
        modeloBateria: "",
        instalacionFV: "",
        kwInversor: "",
        kwPanelesSolares: "",
        appMonitorizacionId: null,
        bateriaAlmacenamiento: "",
        potenciaBateriaAlmacenamiento: "",
        backup: "",
        peaksaving: "",
        integracionSistemasFVId: null,
        // Servicios del cliente
        gestionEnergetica: false,
        telemedida: false,
        monitorizacionEnergetica: false,
      })
    },
    sectores: Array,
    usuarios: Array,
    subtipologias: Array,
    appMonitorizacion: {
      type: Array,
      default: () => []
    },
    integracionSistemasFV: {
      type: Array,
      default: () => []
    },
    isSubmitting: Boolean,
  },
  data() {
    return {
      activeTab: 'principal',
      showPassword: false,
      clienteLocal: this.crearClienteVacio(),
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
        } else {
          this.clienteLocal = this.crearClienteVacio();
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
    },
    appMonitorizacion(newVal) {
      console.log('AppMonitorizacion props recibidas:', newVal);
    },
    integracionSistemasFV(newVal) {
      console.log('IntegracionSistemasFV props recibidas:', newVal);
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
        // Campos de instalaciones
        bateriaCondensadores: "",
        potenciaBateria: "",
        modeloBateria: "",
        instalacionFV: "",
        kwInversor: "",
        kwPanelesSolares: "",
        appMonitorizacionId: null,
        bateriaAlmacenamiento: "",
        potenciaBateriaAlmacenamiento: "",
        backup: "",
        peaksaving: "",
        integracionSistemasFVId: null,
        // Servicios del cliente
        gestionEnergetica: false,
        telemedida: false,
        monitorizacionEnergetica: false,
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
      
      if (passInput) {
        passInput.type = this.showPassword ? 'text' : 'password';
      }
    }
  },
  mounted() {
    console.log('CreaActualizaClienteComponent mounted');
    console.log('appMonitorizacion props:', this.appMonitorizacion);
    console.log('integracionSistemasFV props:', this.integracionSistemasFV);
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
  padding: 0.7rem 1rem;
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
  font-size: 1rem;
  font-weight: 600;
}

.close-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: #e74c3c;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  width: 28px;
  height: 28px;
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
  font-size: 0.8rem;
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
  font-size: 0.75rem;
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
  font-size: 0.75rem;
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

.toggle-password:hover {
  color: rgba(252, 215, 0);
}

/* CORRECCIÓN: Optimizar tamaños de controles */
.form-control-compact {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 0.8rem;
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
  font-size: 0.8rem;
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
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  height:fit-content;
  font-size: 0.85rem;
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
  font-size: 0.8rem;
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
  background-color: #007bff;
  border-color: #007bff;
}

.service-checkbox input[type="checkbox"]:checked + .checkmark:after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.service-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
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
</style>