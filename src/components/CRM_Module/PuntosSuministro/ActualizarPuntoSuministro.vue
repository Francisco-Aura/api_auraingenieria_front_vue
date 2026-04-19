<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <div class="header-content">
          <h1 id="modal-title" class="modal-title">
            {{ isCreating ? 'Crear nuevo' : (modoConsulta ? 'Consultar' : 'Actualizar') }} Punto de Suministro
            {{ puntoLocal.cliente && puntoLocal.cliente.nombre ? ' - ' + puntoLocal.cliente.nombre : '' }}
          </h1>
        </div>
        <button type="button" class="close-button" @click="cerrarModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulario compacto para punto de suministro -->
      <form @submit.prevent="actualizarPS" class="compact-form-content" novalidate>
        <!-- Pestañas para organizar el contenido -->        
        <div class="form-tabs">
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'principal' }" @click="activeTab = 'principal'">
            <i class="fas fa-map-marker-alt"></i> <span class="tab-text">Punto de Suministro</span>
          </button>
          <button type="button" class="tab-btn" :class="{ active: activeTab === 'instalaciones' }" @click="activeTab = 'instalaciones'">
            <i class="fas fa-tools"></i> <span class="tab-text">Instalaciones</span>
          </button>
        </div>

        <div class="tab-container">
          <!-- Contenido de la pestaña principal (formulario original completo) -->
          <div v-show="activeTab === 'principal'" class="tab-content" data-active-tab="principal">
            <div class="form-sections-container">
          <!-- Panel izquierdo - Ubicación, Suministros, Información Adicional -->
          <div class="panel-left">
            <!-- Sección de Ubicación -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Ubicación</h3>
              </div>
              <div class="form-compact-group">
                <label for="direccion">Dirección <span class="required">*</span></label>
                <div class="input-with-icon">
                  <i class="fas fa-home icon-prefix"></i>
                  <input type="text" id="direccion" v-model="puntoLocal.direccion" :readonly="modoConsulta" :class="{ 'input-error': errores.direccion }" @input="errores.direccion = ''" maxlength="100" required />
                </div>
                <small v-if="errores.direccion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.direccion }}</small>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="codigoPostal">CP <span class="required">*</span></label>
                  <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" :readonly="modoConsulta" :class="{ 'input-error': errores.codigoPostal }" @input="errores.codigoPostal = ''" maxlength="10" required />
                  <small v-if="errores.codigoPostal" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.codigoPostal }}</small>
                </div>
                <div class="form-compact-group">
                  <label for="poblacion">Población <span class="required">*</span></label>
                  <input type="text" id="poblacion" v-model="puntoLocal.poblacion" :readonly="modoConsulta" :class="{ 'input-error': errores.poblacion }" @input="errores.poblacion = ''" maxlength="100" required />
                  <small v-if="errores.poblacion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.poblacion }}</small>
                </div>
                <div class="form-compact-group">
                  <label for="provincia">Provincia <span class="required">*</span></label>
                  <input type="text" id="provincia" v-model="puntoLocal.provincia" :readonly="modoConsulta" :class="{ 'input-error': errores.provincia }" @input="errores.provincia = ''" maxlength="100" required />
                  <small v-if="errores.provincia" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.provincia }}</small>
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="identificacion">Identificación</label>
                  <div class="input-with-icon">
                    <i class="fas fa-id-card icon-prefix"></i>
                    <input type="text" id="identificacion" v-model="puntoLocal.identificacion" :readonly="modoConsulta" maxlength="255" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="ubicacion">Ubicación Maps</label>
                  <div class="input-with-icon">
                    <i class="fas fa-map-marker-alt icon-prefix"></i>
                    <input type="text" id="ubicacion" v-model="puntoLocal.ubicacion" :readonly="modoConsulta" maxlength="1000" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de Suministros -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-bolt"></i>
                <h3>Suministros</h3>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="cupsluz">CUPS Luz</label>
                  <div class="input-with-icon">
                    <i class="fas fa-lightbulb icon-prefix"></i>
                    <input type="text" id="cupsluz" v-model="puntoLocal.cupsluz" :readonly="modoConsulta" :class="{ 'input-error': errores.cups }" @input="errores.cups = ''" maxlength="100" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="cupsgas">CUPS Gas</label>
                  <div class="input-with-icon">
                    <i class="fas fa-fire icon-prefix"></i>
                    <input type="text" id="cupsgas" v-model="puntoLocal.cupsgas" :readonly="modoConsulta" :class="{ 'input-error': errores.cups }" @input="errores.cups = ''" maxlength="100" />
                  </div>
                </div>
              </div>
              <small v-if="errores.cups" class="error-text" style="display:block;margin-top:2px"><i class="fas fa-exclamation-circle"></i> {{ errores.cups }}</small>
              <div class="form-compact-group">
                <label for="distribuidora">Distribuidora</label>
                <div class="input-with-icon">
                  <i class="fas fa-building icon-prefix"></i>
                  <select id="distribuidora" v-model="puntoLocal.distribuidora" :disabled="modoConsulta">
                    <option :value="null">Seleccione una distribuidora</option>
                    <option v-for="d in distribuidoras" :key="d.id" :value="d">{{ d.nombre }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Sección de Información Adicional -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-info-circle"></i>
                <h3>Información Adicional</h3>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="exencionImpuestoElectrico">Exención Imp. Eléctrico</label>
                  <select id="exencionImpuestoElectrico" v-model="puntoLocal.exencionImpuestoElectrico" :disabled="modoConsulta">
                    <option :value="null">Seleccione</option>
                    <option :value="true">SI</option>
                    <option :value="false">NO</option>
                  </select>
                </div>
                <div class="form-compact-group">
                  <label for="porcentajeConcesion">% Concesión</label>
                  <input type="number" id="porcentajeConcesion" v-model="puntoLocal.porcentajeConcesion" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="fechaConcesion">F. Concesión</label>
                  <input type="date" id="fechaConcesion" v-model="puntoLocal.fechaConcesion" :readonly="modoConsulta" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="autoconsumo">Autoconsumo</label>
                  <select id="autoconsumo" v-model="puntoLocal.autoconsumo" :disabled="modoConsulta">
                    <option :value="null">NO</option>
                    <option value="Compensación de excedentes simplificada">Compensación de excedentes simplificada</option>
                    <option value="Compensación de excedentes colectiva">Compensación de excedentes colectiva</option>
                    <option value="Autoconsumo sin excedentes">Autoconsumo sin excedentes</option>
                  </select>
                </div>
                <div class="form-compact-group half">
                  <label for="fechaActivacionVertido">Fecha Activación Vertido</label>
                  <input type="date" id="fechaActivacionVertido" v-model="puntoLocal.fechaActivacionVertido" :readonly="modoConsulta" />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Panel derecho - Equipos de Medida, Monitorización y Potencias -->
          <div class="panel-right">
            <!-- F. Instalación -->
            <div class="form-section">
              <div class="form-compact-group">
                <label for="fechaInstalacion">F. Instalación</label>
                <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" :readonly="modoConsulta" />
              </div>
            </div>

            <!-- Sección de Equipos de Medida -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-tachometer-alt"></i>
                <h3>Equipos de Medida</h3>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="potenciaBIE">Potencia BIE</label>
                  <div class="input-with-icon input-with-suffix">
                    <i class="fas fa-bolt icon-prefix"></i>
                    <input type="number" id="potenciaBIE" v-model="puntoLocal.potenciaBIE" :readonly="modoConsulta" step="0.0001"/>
                    <span class="input-suffix">kW</span>
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="potenciaTecnicaRed">Potencia Técnica Red</label>
                  <div class="input-with-suffix">
                    <input type="number" id="potenciaTecnicaRed" v-model="puntoLocal.potenciaTecnicaRed" :readonly="modoConsulta" step="0.0001"/>
                    <span class="input-suffix">kW</span>
                  </div>
                </div>
              </div>
              <div class="form-compact-group">
                <label for="apmCentroTransformacion">APM Centro Transformación</label>
                <input type="text" id="apmCentroTransformacion" v-model="puntoLocal.apmCentroTransformacion" :readonly="modoConsulta" maxlength="255" />
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="tipoContador">Tipo de Contador</label>
                  <div class="input-with-icon">
                    <i class="fas fa-tachometer-alt icon-prefix"></i>
                    <select id="tipoContador" v-model="puntoLocal.tipoContador" :disabled="modoConsulta">
                      <option :value="null">Seleccione</option>
                      <option v-for="tc in tiposContador" :key="tc.id" :value="tc">{{ tc.nombre || tc.descripcion }}</option>
                    </select>
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="tipoComunicacion">Tipo de Comunicación</label>
                  <div class="input-with-icon">
                    <i class="fas fa-broadcast-tower icon-prefix"></i>
                    <select id="tipoComunicacion" v-model="puntoLocal.tipoComunicacion" :disabled="modoConsulta">
                      <option :value="null">Seleccione</option>
                      <option v-for="tcom in tiposComunicacion" :key="tcom.id" :value="tcom">{{ tcom.nombre || tcom.descripcion }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="numeroContador">Nº Contador</label>
                  <input type="text" id="numeroContador" v-model="puntoLocal.numeroContador" :readonly="modoConsulta" maxlength="255" />
                </div>
                <div class="form-compact-group">
                  <label for="numeroTelefono">Nº Teléfono/IP</label>
                  <input type="tel" id="numeroTelefono" v-model="puntoLocal.numeroTelefono" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="direccionEnlace">Dir. Enlace</label>
                  <input type="text" id="direccionEnlace" v-model="puntoLocal.direccionEnlace" :readonly="modoConsulta" maxlength="255" />
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="puntoMedida">Punto Medida</label>
                  <input type="text" id="puntoMedida" v-model="puntoLocal.puntoMedida" :readonly="modoConsulta" maxlength="255" />
                </div>
                <div class="form-compact-group">
                  <label for="clave">Clave</label>
                  <input type="text" id="clave" v-model="puntoLocal.clave" :readonly="modoConsulta" maxlength="255" />
                </div>
                <div class="form-compact-group">
                  <label for="propiedad">Propiedad</label>
                  <div class="input-with-icon">
                    <i class="fas fa-key icon-prefix"></i>
                    <select id="propiedad" v-model="puntoLocal.propiedad" :disabled="modoConsulta">
                      <option :value="null">Seleccione</option>
                      <option v-for="p in propiedades" :key="p.id" :value="p">{{ p.nombre }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de Monitorización -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-desktop"></i>
                <h3>Monitorización</h3>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="usuarioMonitorizacion">Usuario Monitorización</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user icon-prefix"></i>
                    <input type="text" id="usuarioMonitorizacion" v-model="puntoLocal.usuarioMonitorizacion" :readonly="modoConsulta" maxlength="255" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="passMonitorizacion">Contraseña Monitorización</label>
                  <div class="input-with-icon">
                    <i class="fas fa-lock icon-prefix"></i>
                    <input type="text" id="passMonitorizacion" v-model="puntoLocal.passMonitorizacion" :readonly="modoConsulta" maxlength="255" />
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>

            <!-- Potencias Contratadas - ancho completo -->
            <div v-if="modoConsulta && tienePotenciasContratadas" class="form-section potencias-fullwidth">
              <div class="section-header">
                <i class="fas fa-battery-three-quarters"></i>
                <h3>Potencias Contratadas</h3>
              </div>
              <div class="potencias-grid">
                <div 
                  v-for="(potencia, index) in potenciasArray" 
                  :key="`P${index + 1}`"
                  class="potencia-item"
                  :class="{ 'potencia-active': potencia.valor && potencia.valor > 0 }"
                >
                  <div class="potencia-label">P{{ index + 1 }}</div>
                  <div class="potencia-valor">{{ formatPotenciaCompact(potencia.valor) }}</div>
                </div>
              </div>
            </div>

            <!-- Observaciones - ancho completo -->
            <div class="form-section observaciones-fullwidth">
              <div class="section-header">
                <i class="fas fa-comment-alt"></i>
                <h3>Observaciones</h3>
              </div>
              <div class="form-compact-group" style="margin-bottom:0">
                <textarea id="observaciones" v-model="puntoLocal.observaciones" :readonly="modoConsulta" rows="1" maxlength="10000" placeholder="Observaciones relevantes..."></textarea>
              </div>
            </div>

            <!-- Botones de acción de la pestaña principal -->
            <div class="modal-footer">
              <div class="required-note" v-if="!modoConsulta"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
                <!-- Botón Dar de Baja (solo si está activo y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && !puntoLocal.fechaBaja" type="button" @click="confirmarBajaPunto" class="btn-compact btn-danger">
                  <i class="fas fa-map-marker-alt"></i> Dar de Baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" type="button" @click="confirmarReactivarPunto" class="btn-compact btn-success">
                  <i class="fas fa-map-marker-alt"></i> Reactivar Punto
                </button>
                <!-- Mensaje de estado si está dado de baja -->
                <div v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" class="status-message status-inactive">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Punto dado de baja el {{ formatFecha(puntoLocal.fechaBaja) }}</span>
                </div>
                <button type="button" @click="cerrarModal" class="btn btn-secondary">
                  <i class="fas fa-times"></i> {{ modoConsulta ? 'Cerrar' : 'Cancelar' }}
                </button>
                <button type="button" class="btn btn-info" @click="activeTab = 'instalaciones'">
                  <i class="fas fa-tools"></i> Instalaciones
                </button>
                <button v-if="!modoConsulta" type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> {{ isCreating ? 'Crear' : 'Actualizar' }}
                </button>
              </div>
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
                    <label for="bateriaCondensadores">Batería de Condensadores</label>
                    <div class="select-container-compact">
                      <select id="bateriaCondensadores" v-model="puntoLocal.bateriaCondensadores" class="form-select-compact">
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
                      <input type="text" id="potenciaBateria" v-model="puntoLocal.potenciaBateria" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="modeloBateria">Modelo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-tag icon-prefix"></i>
                      <input type="text" id="modeloBateria" v-model="puntoLocal.modeloBateria" class="form-control-compact" maxlength="100" />
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
                    <label for="instalacionFV">Instalación FV</label>
                    <div class="select-container-compact">
                      <select id="instalacionFV" v-model="puntoLocal.instalacionFV" class="form-select-compact">
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
                      <input type="text" id="kwInversor" v-model="puntoLocal.kwInversor" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwPanelesSolares">KW Paneles Solares</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-sun icon-prefix"></i>
                      <input type="text" id="kwPanelesSolares" v-model="puntoLocal.kwPanelesSolares" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="appMonitorizacion">APP Monitorización</label>
                    <div class="select-container-compact">
                      <select id="appMonitorizacion" v-model="puntoLocal.appMonitorizacionId" class="form-select-compact">
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
                    <label for="bateriaAlmacenamiento">Batería</label>
                    <div class="select-container-compact">
                      <select id="bateriaAlmacenamiento" v-model="puntoLocal.bateriaAlmacenamiento" class="form-select-compact">
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
                      <input type="text" id="potenciaBateriaAlmacenamiento" v-model="puntoLocal.potenciaBateriaAlmacenamiento" class="form-control-compact" maxlength="100" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="backup">Backup</label>
                    <div class="select-container-compact">
                      <select id="backup" v-model="puntoLocal.backup" class="form-select-compact">
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
                      <select id="peaksaving" v-model="puntoLocal.peaksaving" class="form-select-compact">
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
                      <select id="integracionSistemasFV" v-model="puntoLocal.integracionSistemasFVId" class="form-select-compact">
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
              <button type="button" class="btn-compact btn-secondary" @click="activeTab = 'principal'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <div class="action-buttons">
                <!-- Botón Dar de Baja (solo si está activo y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && !puntoLocal.fechaBaja" type="button" @click="confirmarBajaPunto" class="btn-compact btn-danger">
                  <i class="fas fa-map-marker-times"></i> Dar de Baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" type="button" @click="confirmarReactivarPunto" class="btn-compact btn-success">
                  <i class="fas fa-map-marker-alt"></i> Reactivar Punto
                </button>
                <!-- Mensaje de estado si está dado de baja -->
                <div v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" class="status-message status-inactive">
                  <i class="fas fa-map-marker-times"></i>
                  <span>Punto dado de baja el {{ formatFecha(puntoLocal.fechaBaja) }}</span>
                </div>
                <button type="button" class="btn-compact btn-secondary" @click="cerrarModal">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button v-if="!modoConsulta" type="submit" :disabled="isSubmitting" class="btn-compact btn-primary">
                  <i class="fas fa-save"></i> {{ isCreating ? 'Crear' : 'Actualizar' }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ModalActualizarPunto',
  props: {
    modificarPunto: {
      type: Object,
      default: () => ({})
    },
    modoConsulta: {
      type: Boolean,
      default: false
    },
    isCreating: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'principal',
      darDeBaja: false,
      isSubmitting: false,
      errores: {},
      puntoLocal: { 
        autoconsumo: null,
        fechaActivacionVertido: null,
        usuarioMonitorizacion: '',
        passMonitorizacion: '',
        identificacion: '',
        ubicacion: '',
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
        fechaBaja: null,
        ...this.modificarPunto
      },
      distribuidoras: [],
      tiposContador: [],
      tiposComunicacion: [],
      propiedades: [],
      appMonitorizacion: [],
      integracionSistemasFV: []
    };
  },
  computed: {
    potenciasArray() {
      return Array(6).fill().map((_, index) => ({
        id: index + 1,
        valor: this.puntoLocal[`potencia${index + 1}`] || 0
      }));
    },
    tienePotenciasContratadas() {
      // Siempre mostrar la sección de potencias en modo consulta, aunque sean 0
      if (this.modoConsulta) {
        return true;
      }
      // En modo edición, solo mostrar si hay potencias > 0
      return this.potenciasArray.some(potencia => potencia.valor && potencia.valor > 0);
    }
  },
  async created() {
    try {
      const [distribuidorasRes, tiposContadorRes, tiposComunicacionRes, propiedadesRes, appMonitorizacionRes, integracionSistemasFVRes] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/distribuidoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tipos-contador`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tipos-comunicacion`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/propiedades`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/app-monitorizacion`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/integracion-sistemas-fv`)
      ]);

      this.distribuidoras = distribuidorasRes.data;
      this.tiposContador = tiposContadorRes.data;
      this.tiposComunicacion = tiposComunicacionRes.data;
      this.propiedades = propiedadesRes.data;
      this.appMonitorizacion = appMonitorizacionRes.data;
      this.integracionSistemasFV = integracionSistemasFVRes.data;

      if (this.modificarPunto && Object.keys(this.modificarPunto).length > 0) {
        this.initializePuntoLocal(this.modificarPunto);
      }
    } catch (error) {
      console.error('Error al cargar datos maestros:', error);
      this.mostrarError('Error al cargar los datos maestros necesarios');
    }
  },
  watch: {
    modificarPunto: {
      immediate: true,
      deep: true,
      async handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          await this.initializePuntoLocal(newVal);
        }
      },
    },
  },
  methods: {
    // Método mejorado para mostrar errores con z-index correcto
    mostrarError(mensaje, titulo = 'Error') {
      // Temporalmente reducir el z-index del modal
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay) {
        modalOverlay.style.zIndex = '1000';
      }

      if (this.$swal) {
        this.$swal.fire({
          icon: 'error',
          title: titulo,
          text: mensaje,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
          allowOutsideClick: false,
          allowEscapeKey: false,
          zIndex: 10000,
          backdrop: `
            rgba(0,0,0,0.8)
          `,
          customClass: {
            container: 'swal2-top-container'
          }
        }).then(() => {
          // Restaurar el z-index del modal después de cerrar el alert
          if (modalOverlay) {
            modalOverlay.style.zIndex = '9999';
          }
        });
      } else {
        // Fallback si no hay SweetAlert2
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje
        }).then(() => {
          if (modalOverlay) {
            modalOverlay.style.zIndex = '9999';
          }
        })
      }
    },

    // Método para normalizar valores CUPS antes del envío
    normalizarCups(cups) {
      console.log('Normalizando CUPS:', cups, 'tipo:', typeof cups);
      
      // Manejar todos los casos problemáticos
      if (cups === null || cups === undefined) {
        return null;
      }
      
      // Convertir a string si no lo es
      let cupsStr = String(cups);
      
      // Limpiar espacios
      cupsStr = cupsStr.trim();
      
      // Si es string vacío, "null", "undefined", devolver null
      if (cupsStr === '' || cupsStr === 'null' || cupsStr === 'undefined') {
        return null;
      }
      
      console.log('CUPS normalizado:', cupsStr);
      return cupsStr;
    },

    async loadMasterData() {
      try {
        const [distribuidorasRes, tiposContadorRes, tiposComunicacionRes, propiedadesRes] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/api/distribuidoras`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/tipos-contador`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/tipos-comunicacion`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/propiedades`)
        ]);
        this.distribuidoras = distribuidorasRes.data;
        this.tiposContador = tiposContadorRes.data;
        this.tiposComunicacion = tiposComunicacionRes.data;
        this.propiedades = propiedadesRes.data;
      } catch (error) {
        console.error('Error al recargar datos maestros:', error);
      }
    },
    async initializePuntoLocal(newVal) {

      this.puntoLocal = {
        ...newVal,
        exencionImpuestoElectrico: newVal.exencionImpuestoElectrico === true || newVal.exencionImpuestoElectrico === 1,
        propiedadModem: newVal.propiedadModem === true || newVal.propiedadModem === 1,
        potenciaBIE: newVal.potenciaBIE || 0.0,
        potenciaTecnicaRed: newVal.potenciaTecnicaRed || 0.0,
        porcentajeConcesion: newVal.porcentajeConcesion || 0.0,
        cupsluz: newVal.cupsluz || newVal.CUPSluz || '',
        cupsgas: newVal.cupsgas || newVal.CUPSgas || '',
        autoconsumo: newVal.autoconsumo || null,
        fechaActivacionVertido: newVal.fechaActivacionVertido || null,
        usuarioMonitorizacion: newVal.usuarioMonitorizacion || '',
        passMonitorizacion: newVal.passMonitorizacion || '',
        identificacion: newVal.identificacion || '',
        ubicacion: newVal.ubicacion || '',
        potencia1: newVal.potencia1 || 0,
        potencia2: newVal.potencia2 || 0,
        potencia3: newVal.potencia3 || 0,
        potencia4: newVal.potencia4 || 0,
        potencia5: newVal.potencia5 || 0,
        potencia6: newVal.potencia6 || 0,
        // *** CAMPOS DE INSTALACIONES ***
        bateriaCondensadores: newVal.bateriaCondensadores || '',
        potenciaBateria: newVal.potenciaBateria || '',
        modeloBateria: newVal.modeloBateria || '',
        instalacionFV: newVal.instalacionFV || '',
        kwInversor: newVal.kwInversor || '',
        kwPanelesSolares: newVal.kwPanelesSolares || '',
        bateriaAlmacenamiento: newVal.bateriaAlmacenamiento || '',
        potenciaBateriaAlmacenamiento: newVal.potenciaBateriaAlmacenamiento || '',
        backup: newVal.backup || '',
        peaksaving: newVal.peaksaving || '',
        fechaBaja: newVal.fechaBaja || null,
        appMonitorizacionId: newVal.appMonitorizacion ? newVal.appMonitorizacion.id : null,
        integracionSistemasFVId: newVal.integracionSistemasFV ? newVal.integracionSistemasFV.id : null
      };

      if (this.distribuidoras.length === 0) {
        await this.loadMasterData(); 
      }

      // Mapear objetos relacionados
      if (typeof newVal.distribuidora === 'string') {
        this.puntoLocal.distribuidora = this.distribuidoras.find(d => d.nombre === newVal.distribuidora) || null;
      } else if (newVal.distribuidora && newVal.distribuidora.id) {
        this.puntoLocal.distribuidora = this.distribuidoras.find(d => d.id === newVal.distribuidora.id) || null;
      }

      if (newVal.tipoContador && newVal.tipoContador.id) {
        this.puntoLocal.tipoContador = this.tiposContador.find(tc => tc.id === newVal.tipoContador.id) || null;
      }

      if (newVal.tipoComunicacion && newVal.tipoComunicacion.id) {
        this.puntoLocal.tipoComunicacion = this.tiposComunicacion.find(tcom => tcom.id === newVal.tipoComunicacion.id) || null;
      }

      if (newVal.propiedad && newVal.propiedad.id) {
        this.puntoLocal.propiedad = this.propiedades.find(p => p.id === newVal.propiedad.id) || null;
      }
    },
    cerrarModal() {
      this.$emit('cerrar-modal');
    },
    async actualizarPS() {
      if (this.modoConsulta) return;

      this.errores = {};
      let valido = true;

      if (!this.puntoLocal.direccion?.trim()) {
        this.errores.direccion = 'Dirección es obligatoria';
        valido = false;
      }
      if (!this.puntoLocal.codigoPostal?.trim()) {
        this.errores.codigoPostal = 'Código Postal es obligatorio';
        valido = false;
      }
      if (!this.puntoLocal.poblacion?.trim()) {
        this.errores.poblacion = 'Población es obligatoria';
        valido = false;
      }
      if (!this.puntoLocal.provincia?.trim()) {
        this.errores.provincia = 'Provincia es obligatoria';
        valido = false;
      }

      const cupsLuzNormalizado = this.normalizarCups(this.puntoLocal.cupsluz);
      const cupsGasNormalizado = this.normalizarCups(this.puntoLocal.cupsgas);

      if (!cupsLuzNormalizado && !cupsGasNormalizado) {
        this.errores.cups = 'Debe indicar al menos un CUPS (luz o gas)';
        valido = false;
      }

      if (!valido) {
        this.activeTab = 'principal';
        this.mostrarError('Revise los campos marcados en rojo.', 'Campos obligatorios');
        return;
      }

      const datosAdaptados = {
        id: this.puntoLocal.id,
        direccion: this.puntoLocal.direccion.trim(),
        codigoPostal: this.puntoLocal.codigoPostal.trim(),
        poblacion: this.puntoLocal.poblacion.trim(),
        provincia: this.puntoLocal.provincia.trim(),
        CUPSluz: cupsLuzNormalizado,
        CUPSgas: cupsGasNormalizado,
        observaciones: this.puntoLocal.observaciones?.trim() || null,
        fechaInstalacion: this.puntoLocal.fechaInstalacion || null,
        cliente: { id: this.puntoLocal.cliente.id },
        distribuidora: this.puntoLocal.distribuidora ? { id: this.puntoLocal.distribuidora.id } : null,
        potenciaBIE: this.puntoLocal.potenciaBIE || 0.0,
        potenciaTecnicaRed: this.puntoLocal.potenciaTecnicaRed || 0.0,
        apmCentroTransformacion: this.puntoLocal.apmCentroTransformacion?.trim() || null,
        tipoContador: this.puntoLocal.tipoContador ? { id: this.puntoLocal.tipoContador.id } : null,
        tipoComunicacion: this.puntoLocal.tipoComunicacion ? { id: this.puntoLocal.tipoComunicacion.id } : null,
        numeroContador: this.puntoLocal.numeroContador?.trim() || null,
        numeroTelefono: this.puntoLocal.numeroTelefono?.trim() || null,
        direccionEnlace: this.puntoLocal.direccionEnlace?.trim() || null,
        puntoMedida: this.puntoLocal.puntoMedida?.trim() || null,
        clave: this.puntoLocal.clave?.trim() || null,
        propiedad: this.puntoLocal.propiedad ? { id: this.puntoLocal.propiedad.id } : null,
        exencionImpuestoElectrico: this.puntoLocal.exencionImpuestoElectrico || false,
        porcentajeConcesion: this.puntoLocal.porcentajeConcesion || 0.0,
        fechaConcesion: this.puntoLocal.fechaConcesion || null,
        autoconsumo: this.puntoLocal.autoconsumo || null,
        fechaActivacionVertido: this.puntoLocal.autoconsumo ? (this.puntoLocal.fechaActivacionVertido || null) : null,
        usuarioMonitorizacion: this.puntoLocal.usuarioMonitorizacion?.trim() || null,
        passMonitorizacion: this.puntoLocal.passMonitorizacion?.trim() || null,
        identificacion: this.puntoLocal.identificacion?.trim() || null,
        ubicacion: this.puntoLocal.ubicacion?.trim() || null,
        // *** CAMPOS DE INSTALACIONES AGREGADOS ***
        bateriaCondensadores: this.puntoLocal.bateriaCondensadores?.trim() || null,
        potenciaBateria: this.puntoLocal.potenciaBateria?.trim() || null,
        modeloBateria: this.puntoLocal.modeloBateria?.trim() || null,
        instalacionFV: this.puntoLocal.instalacionFV?.trim() || null,
        kwInversor: this.puntoLocal.kwInversor?.trim() || null,
        kwPanelesSolares: this.puntoLocal.kwPanelesSolares?.trim() || null,
        bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
        potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
        backup: this.puntoLocal.backup?.trim() || null,
        peaksaving: this.puntoLocal.peaksaving?.trim() || null,
        appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
        integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
        fechaBaja: this.puntoLocal.fechaBaja || null,
      };
      
      console.log('=== DATOS NORMALIZADOS ANTES DEL ENVÍO ===');
      console.log('CUPSluz normalizado:', datosAdaptados.CUPSluz);
      console.log('CUPSgas normalizado:', datosAdaptados.CUPSgas);
      
      this.$emit('actualizar-punto-suministro', datosAdaptados);
      this.cerrarModal();
    },
    formatPotenciaCompact(valor) {
      if (valor === null || valor === undefined || valor === 0) {
        return '-';
      }
      const valorRedondeado = parseFloat(valor);
      if (valorRedondeado >= 1000) {
        return `${(valorRedondeado/1000).toFixed(1)}MW`;
      }
      return `${valorRedondeado.toFixed(2)}kW`;
    },
    async confirmarBajaPunto() {
      try {
        const { value: fechaBaja, isConfirmed } = await this.$swal.fire({
          title: '\u00bfDar de baja el punto de suministro?',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              <div style="background: #fef7f7; border: 1px solid #f5d5d5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #b56767; font-weight: 500; margin-bottom: 8px;">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>Acci\u00f3n de baja de punto de suministro</span>
                </div>
                <p style="margin: 0; color: #8b4545; font-size: 14px;">Esta acci\u00f3n marcar\u00e1 el punto de suministro como dado de baja en el sistema.</p>
              </div>
              <label for="swal-fecha-baja-punto" style="display: block; font-weight: 500; color: #374151; margin-bottom: 8px;">
                <i class="fas fa-calendar-alt" style="margin-right: 8px; color: #b56767;"></i>
                Fecha de baja *
              </label>
              <input 
                type="date" 
                id="swal-fecha-baja-punto" 
                class="swal2-input" 
                style="margin: 0; border: 2px solid #f5b2b2; border-radius: 6px; color: #8b4545;" 
                required
              />
            </div>
          `,
          icon: 'warning',
          iconColor: '#b56767',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-map-marker-times"></i> Confirmar Baja',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#f5b2b2',
          cancelButtonColor: '#6b7280',
          focusCancel: false,
          customClass: {
            popup: 'swal-baja-punto'
          },
          preConfirm: () => {
            const fechaBaja = document.getElementById('swal-fecha-baja-punto').value;
            if (!fechaBaja) {
              this.$swal.showValidationMessage('Por favor, seleccione una fecha de baja');
              return false;
            }
            return fechaBaja;
          }
        });

        if (isConfirmed && fechaBaja) {
          this.puntoLocal.fechaBaja = fechaBaja;
          
          console.log('=== DEBUG confirmarBajaPunto ===');
          console.log('puntoLocal.cupsluz:', this.puntoLocal.cupsluz);
          console.log('puntoLocal.cupsgas:', this.puntoLocal.cupsgas);
          console.log('puntoLocal:', this.puntoLocal);
          
          // Normalizar CUPS antes del envío
          const cupsLuzNormalizado = this.normalizarCups(this.puntoLocal.cupsluz);
          const cupsGasNormalizado = this.normalizarCups(this.puntoLocal.cupsgas);
          
          console.log('=== VALIDACIÓN EN confirmarBajaPunto ===');
          console.log('CUPS Luz original:', this.puntoLocal.cupsluz, 'normalizado:', cupsLuzNormalizado);
          console.log('CUPS Gas original:', this.puntoLocal.cupsgas, 'normalizado:', cupsGasNormalizado);
          
          const datosAdaptados = {
            id: this.puntoLocal.id,
            direccion: this.puntoLocal.direccion.trim(),
            codigoPostal: this.puntoLocal.codigoPostal.trim(),
            poblacion: this.puntoLocal.poblacion.trim(),
            provincia: this.puntoLocal.provincia.trim(),
            CUPSluz: cupsLuzNormalizado,
            CUPSgas: cupsGasNormalizado,
            observaciones: this.puntoLocal.observaciones?.trim() || null,
            fechaInstalacion: this.puntoLocal.fechaInstalacion || null,
            cliente: { id: this.puntoLocal.cliente.id },
            distribuidora: this.puntoLocal.distribuidora ? { id: this.puntoLocal.distribuidora.id } : null,
            potenciaBIE: this.puntoLocal.potenciaBIE || 0.0,
            potenciaTecnicaRed: this.puntoLocal.potenciaTecnicaRed || 0.0,
            apmCentroTransformacion: this.puntoLocal.apmCentroTransformacion?.trim() || null,
            tipoContador: this.puntoLocal.tipoContador ? { id: this.puntoLocal.tipoContador.id } : null,
            tipoComunicacion: this.puntoLocal.tipoComunicacion ? { id: this.puntoLocal.tipoComunicacion.id } : null,
            numeroContador: this.puntoLocal.numeroContador?.trim() || null,
            numeroTelefono: this.puntoLocal.numeroTelefono?.trim() || null,
            direccionEnlace: this.puntoLocal.direccionEnlace?.trim() || null,
            puntoMedida: this.puntoLocal.puntoMedida?.trim() || null,
            clave: this.puntoLocal.clave?.trim() || null,
            propiedad: this.puntoLocal.propiedad ? { id: this.puntoLocal.propiedad.id } : null,
            exencionImpuestoElectrico: this.puntoLocal.exencionImpuestoElectrico || false,
            porcentajeConcesion: this.puntoLocal.porcentajeConcesion || 0.0,
            fechaConcesion: this.puntoLocal.fechaConcesion || null,
            autoconsumo: this.puntoLocal.autoconsumo || null,
            fechaActivacionVertido: this.puntoLocal.autoconsumo ? (this.puntoLocal.fechaActivacionVertido || null) : null,
            usuarioMonitorizacion: this.puntoLocal.usuarioMonitorizacion?.trim() || null,
            passMonitorizacion: this.puntoLocal.passMonitorizacion?.trim() || null,
            identificacion: this.puntoLocal.identificacion?.trim() || null,
            ubicacion: this.puntoLocal.ubicacion?.trim() || null,
            bateriaCondensadores: this.puntoLocal.bateriaCondensadores?.trim() || null,
            potenciaBateria: this.puntoLocal.potenciaBateria?.trim() || null,
            modeloBateria: this.puntoLocal.modeloBateria?.trim() || null,
            instalacionFV: this.puntoLocal.instalacionFV?.trim() || null,
            kwInversor: this.puntoLocal.kwInversor?.trim() || null,
            kwPanelesSolares: this.puntoLocal.kwPanelesSolares?.trim() || null,
            bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
            potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
            backup: this.puntoLocal.backup?.trim() || null,
            peaksaving: this.puntoLocal.peaksaving?.trim() || null,
            appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
            integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
            fechaBaja: fechaBaja,
          };
          
          console.log('=== ENVIANDO DATOS AL BACKEND ===');
          console.log('fechaBaja:', fechaBaja);
          console.log('puntoLocal.cupsluz:', this.puntoLocal.cupsluz);
          console.log('puntoLocal.cupsgas:', this.puntoLocal.cupsgas);
          console.log('CUPSluz normalizado:', datosAdaptados.CUPSluz);
          console.log('CUPSgas normalizado:', datosAdaptados.CUPSgas);
          console.log('datosAdaptados completo:', datosAdaptados);
          
          this.$emit('actualizar-punto-suministro', datosAdaptados);
          this.cerrarModal();
        }
      } catch (error) {
        console.error('Error en confirmaci\u00f3n de baja:', error);
      }
    },
    
    async confirmarReactivarPunto() {
      try {
        // Validar que el cliente no esté dado de baja
        if (this.puntoLocal.cliente && this.puntoLocal.cliente.fechaBaja) {
          await this.$swal.fire({
            title: 'No se puede reactivar',
            text: 'El cliente asociado a este punto de suministro está dado de baja. Debe reactivar el cliente primero.',
            icon: 'error',
            confirmButtonColor: '#dc2626'
          });
          return;
        }

        const { isConfirmed } = await this.$swal.fire({
          title: '¿Reactivar punto de suministro?',
          html: `
            <div style="text-align: left; margin-top: 20px;">
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #16a34a; font-weight: 500; margin-bottom: 8px;">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Reactivación de punto de suministro</span>
                </div>
                <p style="margin: 0; color: #15803d; font-size: 14px;">Esta acción reactivará el punto de suministro en el sistema, eliminando la fecha de baja.</p>
              </div>
            </div>
          `,
          icon: 'success',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-map-marker-alt"></i> Confirmar Reactivación',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#16a34a',
          cancelButtonColor: '#6b7280',
          focusCancel: false,
          customClass: {
            popup: 'swal-reactivar-punto'
          }
        });

        if (isConfirmed) {
          // Normalizar CUPS antes del envío
          const cupsLuzNormalizado = this.normalizarCups(this.puntoLocal.cupsluz);
          const cupsGasNormalizado = this.normalizarCups(this.puntoLocal.cupsgas);
          
          const datosAdaptados = {
            id: this.puntoLocal.id,
            direccion: this.puntoLocal.direccion.trim(),
            codigoPostal: this.puntoLocal.codigoPostal.trim(),
            poblacion: this.puntoLocal.poblacion.trim(),
            provincia: this.puntoLocal.provincia.trim(),
            CUPSluz: cupsLuzNormalizado,
            CUPSgas: cupsGasNormalizado,
            observaciones: this.puntoLocal.observaciones?.trim() || null,
            fechaInstalacion: this.puntoLocal.fechaInstalacion || null,
            cliente: { id: this.puntoLocal.cliente.id },
            distribuidora: this.puntoLocal.distribuidora ? { id: this.puntoLocal.distribuidora.id } : null,
            potenciaBIE: this.puntoLocal.potenciaBIE || 0.0,
            potenciaTecnicaRed: this.puntoLocal.potenciaTecnicaRed || 0.0,
            apmCentroTransformacion: this.puntoLocal.apmCentroTransformacion?.trim() || null,
            tipoContador: this.puntoLocal.tipoContador ? { id: this.puntoLocal.tipoContador.id } : null,
            tipoComunicacion: this.puntoLocal.tipoComunicacion ? { id: this.puntoLocal.tipoComunicacion.id } : null,
            numeroContador: this.puntoLocal.numeroContador?.trim() || null,
            numeroTelefono: this.puntoLocal.numeroTelefono?.trim() || null,
            direccionEnlace: this.puntoLocal.direccionEnlace?.trim() || null,
            puntoMedida: this.puntoLocal.puntoMedida?.trim() || null,
            clave: this.puntoLocal.clave?.trim() || null,
            propiedad: this.puntoLocal.propiedad ? { id: this.puntoLocal.propiedad.id } : null,
            exencionImpuestoElectrico: this.puntoLocal.exencionImpuestoElectrico || false,
            porcentajeConcesion: this.puntoLocal.porcentajeConcesion || 0.0,
            fechaConcesion: this.puntoLocal.fechaConcesion || null,
            autoconsumo: this.puntoLocal.autoconsumo || null,
            fechaActivacionVertido: this.puntoLocal.autoconsumo ? (this.puntoLocal.fechaActivacionVertido || null) : null,
            usuarioMonitorizacion: this.puntoLocal.usuarioMonitorizacion?.trim() || null,
            passMonitorizacion: this.puntoLocal.passMonitorizacion?.trim() || null,
            identificacion: this.puntoLocal.identificacion?.trim() || null,
            ubicacion: this.puntoLocal.ubicacion?.trim() || null,
            bateriaCondensadores: this.puntoLocal.bateriaCondensadores?.trim() || null,
            potenciaBateria: this.puntoLocal.potenciaBateria?.trim() || null,
            modeloBateria: this.puntoLocal.modeloBateria?.trim() || null,
            instalacionFV: this.puntoLocal.instalacionFV?.trim() || null,
            kwInversor: this.puntoLocal.kwInversor?.trim() || null,
            kwPanelesSolares: this.puntoLocal.kwPanelesSolares?.trim() || null,
            bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
            potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
            backup: this.puntoLocal.backup?.trim() || null,
            peaksaving: this.puntoLocal.peaksaving?.trim() || null,
            appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
            integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
            fechaBaja: null, // Eliminar la fecha de baja
          };
          
          console.log('=== REACTIVANDO PUNTO DE SUMINISTRO ===');
          console.log('Eliminando fecha de baja');
          console.log('datosAdaptados completo:', datosAdaptados);
          
          this.$emit('actualizar-punto-suministro', datosAdaptados);
        }
      } catch (error) {
        console.error('Error en confirmación de reactivación:', error);
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
  }
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

:root {
  --primary-color: rgba(252, 215, 0);
  --surface-color: #ffffff;
  --border-color: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
}

.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999 !important; /* Reducido para permitir que SweetAlert2 aparezca encima */
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0;
  overflow: hidden;
  width: 100vw !important;
  height: 100vh !important;
}

/* Estilos específicos para SweetAlert2 con z-index superior */
:global(.swal2-container) {
  z-index: 20000 !important;
}

:global(.swal2-popup) {
  z-index: 20001 !important;
}

:global(.swal2-backdrop-show) {
  z-index: 19999 !important;
}

:global(.swal2-shown) {
  z-index: 20000 !important;
}

/* Clase personalizada para SweetAlert2 con z-index muy alto */
:global(.swal2-top-container) {
  z-index: 30000 !important;
}

:global(.swal2-top-container .swal2-popup) {
  z-index: 30001 !important;
}

.modal-content {
  background: white;
  border-radius: 0.4rem;
  width: 99% !important;
  max-width: 90% !important;
  height: auto !important;
  min-height: 60vh;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
  margin: 0 auto !important;
}

.modal-header {
  padding: 0.45rem 0 0.45rem 1.3rem;
  border-bottom: 1px solid #e0e0e0;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.modal-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: black;
  flex-grow: 1;
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

.compact-form-content {
  flex: 1;
  overflow-y: auto !important;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  max-height: calc(95vh - 120px);
  min-height: 0;
  gap: 0.4rem;
}

.form-sections-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.panel-left,
.panel-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-section {
  background: var(--surface-color);
  border-radius: 0.3rem;
  padding: 0.4rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.form-section.full-width-observaciones {
  width: 100%;
  margin-top: 0.3rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.observaciones-fullwidth {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  flex-shrink: 0;
}

.potencias-fullwidth {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  flex-shrink: 0;
}

.potencias-fullwidth .potencias-grid {
  grid-template-columns: repeat(6, 1fr);
}

.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.25rem;
  margin-bottom: 0.35rem;
  border-bottom: 1px solid var(--border-color);
}

.section-header i {
  color: black;
  margin-right: 0.4rem;
  font-size: 0.85rem;
}

.section-header h3 {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-primary);
  font-weight: 600;
}

.form-compact-group {
  margin-bottom: 0.3rem;
}

.form-compact-group label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.78rem;
  margin-bottom: 0.1rem;
}

.form-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
}

.form-row .half {
  flex: 1;
}

.form-row.triple {
  display: flex;
  gap: 0.3rem;
}

.form-row.triple .form-compact-group {
  flex: 1;
  margin-bottom: 0.3rem;
}

.form-compact-group input,
.form-compact-group select,
.form-compact-group textarea {
  width: 100%;
  padding: 0.2rem 0.4rem;
  font-size: 0.82rem;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  height: 25px;
  background-color: white;
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-compact-group input:focus,
.form-compact-group select:focus,
.form-compact-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-compact-group textarea {
  resize: vertical;
  min-height: 42px;
  height: auto;
  padding-top: 0.4rem;
}

.input-with-icon {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.8rem;
  z-index: 1;
}

.input-with-icon input,
.input-with-icon select {
  padding-left: 1.3rem;
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-suffix {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.75rem;
  pointer-events: none;
}

.input-with-suffix input {
  padding-right: 2.5rem;
}

.input-with-icon.input-with-suffix input {
  padding-left: 1.3rem;
  padding-right: 2.5rem;
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
.error-text {
  display: block;
  color: #e74c3c;
  font-size: 0.72rem;
  margin-top: 2px;
  line-height: 1.2;
}

/* Estilos elegantes para las potencias en el panel derecho */
.potencias-section {
  border-radius: 0.4rem;
  overflow: hidden;
}

.potencias-section .section-header {
  border-radius: 0;
  border-bottom: none;
}

.potencias-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.potencia-item {
  background: #ffffff;
  border: 2px solid #e1ecf7;
  border-radius: 0.3rem;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.potencia-item.potencia-active {
  background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
  border-color: #28a745;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
  transform: translateY(-2px);
}

.potencia-label {
  font-weight: 700;
  font-size: 0.8rem;
  color: #495057;
  letter-spacing: 0.5px;
}

.potencia-active .potencia-label {
  color: #155724;
}

.potencia-valor {
  font-size: 0.85rem;
  font-weight: 600;
  color: black;
  line-height: 1.2;
}

.potencia-active .potencia-valor {
  font-weight: 700;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 0.45rem 0.8rem;
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.required-note {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.6rem;
}

.btn {
  padding: 0.35rem 0.85rem;
  border-radius: 0.3rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  border: none;
  outline: none;
}

.btn-primary {
  background-color: var(--primary-color);
  color: black;
}

.btn-primary:hover {
  background-color: rgb(222, 189, 0);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1200px) {
  .form-sections-container {
    flex-direction: column;
    gap: 0.6rem;
  }
  
  .panel-left,
  .panel-right {
    width: 100%;
  }

  .form-row.triple {
    flex-direction: column;
    gap: 0.4rem;
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 98%;
    max-width: 98%;
    height: 98vh;
    max-height: 98vh;
  }
  
  .compact-form-content {
    padding: 0.6rem;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0.4rem;
  }
  
  .potencias-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .modal-title {
    font-size: 1rem;
  }
  
  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
}

/* Estilos para el sistema de pestañas */
.form-tabs {
  display: flex;
  background-color: #e4e6ea;
  border-bottom: 2px solid #d0d3d8;
  flex-shrink: 0;
  gap: 3px;
  padding: 0 0.5rem;
  padding-top: 4px;
}

.tab-btn {
  padding: 0.35rem 1.2rem;
  background: #d0d3d8;
  border: 1px solid #bfc2c8;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  flex: 1;
  justify-content: center;
  position: relative;
  top: 2px;
}

.tab-btn:hover:not(.active) {
  background: #c0c3c8;
  color: #333;
}

.tab-btn.active {
  background: #ffffff;
  border-color: #d0d3d8;
  border-bottom: 2px solid #ffffff;
  color: #222;
  font-weight: 600;
  box-shadow: 0 -2px 0 0 #f5c900;
  z-index: 1;
}

.tab-text {
  font-size: 0.9rem;
}

.tab-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 140px);
}

/* Estilos compactos para las instalaciones */
.form-grid-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  flex: 1;
}

.form-section-compact {
  background: #fff;
  border-radius: 0.3rem;
  border: 1px solid #e9ecef;
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
  margin-bottom: 0.3rem;
}

.section-header-compact {
  display: flex;
  align-items: center;
  margin-bottom: 0.2rem;
  gap: 0.3rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-compact i {
  font-size: 0.9rem;
  color: black;
  width: 0.9rem;
}

.section-header-compact h3 {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.form-group-compact {
  margin-bottom: 0.3rem;
}

.form-group-compact label {
  display: block;
  margin-bottom: 0.1rem;
  font-size: 1rem;
  font-weight: 500;
  color: black;
}

.form-control-compact {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0.25rem;
  font-size: 1rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  height: 26px;
}

.form-control-compact:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

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
  height: 26px;
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
  padding: 0.4rem;
  display: flex;
  flex-direction: column;
}

.installation-card .section-header-compact i {
  color: #28a745;
}

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
  height: fit-content;
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

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background-color: #138496;
  transform: translateY(-1px);
}

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

/* Estilos personalizados para SweetAlert de baja */
:global(.swal-baja-punto .swal2-popup) {
  border-radius: 12px;
  padding: 20px;
}

:global(.swal-baja-punto .swal2-title) {
  color: #b56767;
  font-weight: 600;
}

:global(.swal-baja-punto .swal2-icon.swal2-warning) {
  border-color: #f5b2b2;
  color: #b56767;
}

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

@media (max-width: 1200px) {
  .installations-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .tab-text {
    display: none;
  }

  .tab-btn {
    padding: 0.4rem 0.6rem;
  }

  .installations-row {
    grid-template-columns: 1fr;
  }

  .tab-content {
    overflow-y: auto;
    max-height: calc(100vh - 150px);
  }
}

/* Estilos para el checkbox de baja */
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
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

/* Estilos elegantes para la sección de baja con tonos rojos */
.baja-compacta {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.3rem;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.baja-compacta:hover {
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.15);
  border-color: #fca5a5;
}

.baja-checkbox-compacta {
  display: flex;
  align-items: center;
}

.baja-label-compacta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #dc2626;
  user-select: none;
  transition: all 0.2s ease;
}

.baja-label-compacta:hover {
  color: #b91c1c;
}

.baja-input {
  display: none;
}

.baja-checkmark {
  height: 18px;
  width: 18px;
  background-color: white;
  border: 2px solid #dc2626;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: inline-block;
  cursor: pointer;
}

.baja-label-compacta:hover .baja-checkmark {
  border-color: #b91c1c;
  box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.1);
}

.baja-input:checked ~ .baja-checkmark {
  background-color: #dc2626;
  border-color: #dc2626;
  transform: scale(1.1);
}

.baja-checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.baja-input:checked ~ .baja-checkmark:after {
  display: block;
}

.baja-checkmark:after {
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.baja-text {
  color: #dc2626;
  font-weight: 500;
  padding: 5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.baja-text i {
  font-size: 0.9rem;
}

.fecha-baja-inline {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid #fecaca;
  margin-top: 0.3rem;
  animation: slideInBaja 0.3s ease-out;
}

.fecha-label-compacta {
  font-size: 0.8rem;
  font-weight: 600;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.2rem;
}

.fecha-input-compacta {
  width: 100%;
  padding: 0.25rem 0.4rem;
  border: 1px solid #dc2626;
  border-radius: 0.2rem;
  font-size: 0.8rem;
  background-color: white;
  color: #991b1b;
  height: 28px;
  transition: all 0.2s ease;
}

.fecha-input-compacta:focus {
  outline: none;
  border-color: #b91c1c;
  box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.1);
}

.fecha-input-compacta:hover {
  border-color: #b91c1c;
}

@keyframes slideInBaja {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Estilos personalizados para SweetAlert de reactivación */
:global(.swal-reactivar-punto .swal2-popup) {
  border-radius: 12px;
  padding: 20px;
}

:global(.swal-reactivar-punto .swal2-title) {
  color: #16a34a;
  font-weight: 600;
}

:global(.swal-reactivar-punto .swal2-icon.swal2-success) {
  border-color: #86efac;
  color: #16a34a;
}
</style>