<template>
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-bolt"></i></span>
        <div class="aura-modal-header__titulos">
          <h1 id="modal-title" class="modal-title">
            {{ isCreating ? 'Nuevo punto de suministro' : (modoConsulta ? 'Consultar punto de suministro' : 'Modificar punto de suministro') }}
          </h1>
          <span class="aura-modal-header__subtitulo">
            <span v-if="puntoLocal.cliente && puntoLocal.cliente.nombre"><strong>{{ puntoLocal.cliente.nombre }}</strong></span>
            <span v-if="puntoLocal.cupsluz || puntoLocal.cupsgas" class="aura-dato"><span class="aura-dato__etiqueta">CUPS</span>{{ puntoLocal.cupsluz || puntoLocal.cupsgas }}</span>
          </span>
        </div>
        <button type="button" class="close-button" @click="cerrarModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulario compacto para punto de suministro -->
      <form @submit.prevent="actualizarPS" class="compact-form-content" novalidate>
        <!-- Pestañas para organizar el contenido -->        
        <div class="aura-pestanas" role="tablist" aria-label="Secciones del punto de suministro">
          <button type="button" role="tab" class="aura-pestana" :class="{ 'aura-pestana--activa': activeTab === 'principal' }"
                  :aria-selected="activeTab === 'principal' ? 'true' : 'false'" @click="activeTab = 'principal'">
            <span class="aura-pestana__numero">1</span> <span>Punto de suministro</span>
          </button>
          <button type="button" role="tab" class="aura-pestana" :class="{ 'aura-pestana--activa': activeTab === 'instalaciones' }"
                  :aria-selected="activeTab === 'instalaciones' ? 'true' : 'false'" @click="activeTab = 'instalaciones'">
            <span class="aura-pestana__numero">2</span> <span>Instalaciones</span>
          </button>
        </div>

        <div class="tab-container">
          <!-- Contenido de la pestaña principal (formulario original completo) -->
          <div v-show="activeTab === 'principal'" class="tab-content" data-active-tab="principal">
            <div class="form-sections-container">
          <!-- Panel izquierdo - Ubicación, Suministros, Información adicional -->
          <div class="panel-left">
            <!-- Sección de Ubicación -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-map-marker-alt"></i>
                <h3>Ubicación</h3>
              </div>
              <div class="form-compact-group">
                <label for="direccion">Dirección <span v-if="!modoConsulta" class="required">*</span></label>
                <div class="input-with-icon">
                  <i class="fas fa-home icon-prefix"></i>
                  <input type="text" id="direccion" v-model="puntoLocal.direccion" :readonly="modoConsulta" :class="{ 'input-error': errores.direccion }" @input="errores.direccion = ''" maxlength="100" required />
                </div>
                <small v-if="errores.direccion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.direccion }}</small>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="codigoPostal">CP <span v-if="!modoConsulta" class="required">*</span></label>
                  <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" :readonly="modoConsulta" :class="{ 'input-error': errores.codigoPostal }" @input="errores.codigoPostal = ''" maxlength="10" required />
                  <small v-if="errores.codigoPostal" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.codigoPostal }}</small>
                </div>
                <div class="form-compact-group">
                  <label for="poblacion">Población <span v-if="!modoConsulta" class="required">*</span></label>
                  <input type="text" id="poblacion" v-model="puntoLocal.poblacion" :readonly="modoConsulta" :class="{ 'input-error': errores.poblacion }" @input="errores.poblacion = ''" maxlength="100" required />
                  <small v-if="errores.poblacion" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.poblacion }}</small>
                </div>
                <div class="form-compact-group">
                  <label for="provincia">Provincia <span v-if="!modoConsulta" class="required">*</span></label>
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
                  <label for="cupsluz">CUPS luz</label>
                  <div class="input-with-icon">
                    <i class="fas fa-lightbulb icon-prefix"></i>
                    <input type="text" id="cupsluz" v-model="puntoLocal.cupsluz" :readonly="modoConsulta" :class="{ 'input-error': errores.cups }" @input="errores.cups = ''" maxlength="100" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="cupsgas">CUPS gas</label>
                  <div class="input-with-icon">
                    <i class="fas fa-fire icon-prefix"></i>
                    <input type="text" id="cupsgas" v-model="puntoLocal.cupsgas" :readonly="modoConsulta" :class="{ 'input-error': errores.cups }" @input="errores.cups = ''" maxlength="100" />
                  </div>
                </div>
              </div>
              <small v-if="errores.cups" class="error-text error-text--bloque"><i class="fas fa-exclamation-circle"></i> {{ errores.cups }}</small>
              <div class="form-compact-group">
                <label for="distribuidora">Distribuidora</label>
                <div class="input-with-icon">
                  <i class="fas fa-building icon-prefix"></i>
                  <select id="distribuidora" v-model="puntoLocal.distribuidora" :disabled="modoConsulta">
                    <option :value="null">Seleccione...</option>
                    <option v-for="d in distribuidoras" :key="d.id" :value="d">{{ d.nombre }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Sección de Información adicional -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-info-circle"></i>
                <h3>Información adicional</h3>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="exencionImpuestoElectrico">Exención imp. eléctrico</label>
                  <select id="exencionImpuestoElectrico" v-model="puntoLocal.exencionImpuestoElectrico" :disabled="modoConsulta">
                    <option :value="null">Seleccione...</option>
                    <option :value="true">SI</option>
                    <option :value="false">NO</option>
                  </select>
                </div>
                <div class="form-compact-group">
                  <label for="porcentajeConcesion">% concesión</label>
                  <input type="number" id="porcentajeConcesion" v-model="puntoLocal.porcentajeConcesion" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="fechaConcesion">F. concesión</label>
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
                  <label for="fechaActivacionVertido">Fecha activación vertido</label>
                  <input type="date" id="fechaActivacionVertido" v-model="puntoLocal.fechaActivacionVertido" :readonly="modoConsulta" />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Panel derecho - Equipos de medida, Monitorización y Potencias -->
          <div class="panel-right">
            <!-- F. Instalación -->
            <div class="form-section">
              <div class="form-compact-group">
                <label for="fechaInstalacion">F. instalación</label>
                <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" :readonly="modoConsulta" />
              </div>
            </div>

            <!-- Sección de Equipos de medida -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-tachometer-alt"></i>
                <h3>Equipos de medida</h3>
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
                  <label for="potenciaTecnicaRed">Potencia técnica red</label>
                  <div class="input-with-suffix">
                    <input type="number" id="potenciaTecnicaRed" v-model="puntoLocal.potenciaTecnicaRed" :readonly="modoConsulta" step="0.0001"/>
                    <span class="input-suffix">kW</span>
                  </div>
                </div>
              </div>
              <div class="form-compact-group">
                <label for="apmCentroTransformacion">APM centro transformación</label>
                <input type="text" id="apmCentroTransformacion" v-model="puntoLocal.apmCentroTransformacion" :readonly="modoConsulta" maxlength="255" />
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="tipoContador">Tipo de contador</label>
                  <div class="input-with-icon">
                    <i class="fas fa-tachometer-alt icon-prefix"></i>
                    <select id="tipoContador" v-model="puntoLocal.tipoContador" :disabled="modoConsulta">
                      <option :value="null">Seleccione...</option>
                      <option v-for="tc in tiposContador" :key="tc.id" :value="tc">{{ tc.nombre || tc.descripcion }}</option>
                    </select>
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="tipoComunicacion">Tipo de comunicación</label>
                  <div class="input-with-icon">
                    <i class="fas fa-broadcast-tower icon-prefix"></i>
                    <select id="tipoComunicacion" v-model="puntoLocal.tipoComunicacion" :disabled="modoConsulta">
                      <option :value="null">Seleccione...</option>
                      <option v-for="tcom in tiposComunicacion" :key="tcom.id" :value="tcom">{{ tcom.nombre || tcom.descripcion }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="numeroContador">Nº contador</label>
                  <input type="text" id="numeroContador" v-model="puntoLocal.numeroContador" :readonly="modoConsulta" maxlength="255" />
                </div>
                <div class="form-compact-group">
                  <label for="numeroTelefono">Nº teléfono/IP</label>
                  <input type="tel" id="numeroTelefono" v-model="puntoLocal.numeroTelefono" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="direccionEnlace">Dir. enlace</label>
                  <input type="text" id="direccionEnlace" v-model="puntoLocal.direccionEnlace" :readonly="modoConsulta" maxlength="255" />
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="puntoMedida">Punto medida</label>
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
                      <option :value="null">Seleccione...</option>
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
                  <label for="usuarioMonitorizacion">Usuario monitorización</label>
                  <div class="input-with-icon">
                    <i class="fas fa-user icon-prefix"></i>
                    <input type="text" id="usuarioMonitorizacion" v-model="puntoLocal.usuarioMonitorizacion" :readonly="modoConsulta" maxlength="255" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="passMonitorizacion">Contraseña monitorización</label>
                  <div class="input-with-icon">
                    <i class="fas fa-lock icon-prefix"></i>
                    <input type="text" id="passMonitorizacion" v-model="puntoLocal.passMonitorizacion" :readonly="modoConsulta" maxlength="255" />
                  </div>
                </div>
              </div>
            </div>
          </div>
            </div>

            <!-- Potencias contratadas - ancho completo -->
            <div v-if="modoConsulta && tienePotenciasContratadas" class="form-section potencias-fullwidth">
              <div class="section-header">
                <i class="fas fa-battery-three-quarters"></i>
                <h3>Potencias contratadas</h3>
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
              <div class="form-compact-group form-compact-group--sin-margen">
                <textarea id="observaciones" v-model="puntoLocal.observaciones" :readonly="modoConsulta" rows="1" maxlength="10000" placeholder="Observaciones relevantes..."></textarea>
              </div>
            </div>

            <!-- Botones de acción de la pestaña principal -->
            <div class="modal-footer">
              <div class="required-note" v-if="!modoConsulta"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
                <!-- Botón Dar de baja (solo si está activo y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && !puntoLocal.fechaBaja" type="button" @click="confirmarBajaPunto" class="btn-compact btn-danger">
                  <i class="fas fa-ban"></i> Dar de baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" type="button" @click="confirmarReactivarPunto" class="btn-compact btn-success">
                  <i class="fas fa-map-marker-alt"></i> Reactivar punto
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
                <button v-if="!modoConsulta" type="submit" :disabled="isSubmitting" class="btn btn-primary">
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
                <!-- Batería de condensadores -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-battery-full"></i>
                    <h3>Batería de condensadores</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="bateriaCondensadores">Batería de condensadores</label>
                    <div class="select-container-compact">
                      <select id="bateriaCondensadores" v-model="puntoLocal.bateriaCondensadores" class="form-select-compact" :disabled="modoConsulta">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="potenciaBateria">Potencia batería</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-bolt icon-prefix"></i>
                      <input type="text" id="potenciaBateria" v-model="puntoLocal.potenciaBateria" class="form-control-compact" maxlength="100" :readonly="modoConsulta" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="modeloBateria">Modelo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-tag icon-prefix"></i>
                      <input type="text" id="modeloBateria" v-model="puntoLocal.modeloBateria" class="form-control-compact" maxlength="100" :readonly="modoConsulta" />
                    </div>
                  </div>
                </div>

                <!-- Instalación fotovoltaica -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-solar-panel"></i>
                    <h3>Instalación fotovoltaica</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="instalacionFV">Instalación FV</label>
                    <div class="select-container-compact">
                      <select id="instalacionFV" v-model="puntoLocal.instalacionFV" class="form-select-compact" :disabled="modoConsulta">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwInversor">KW inversor</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-microchip icon-prefix"></i>
                      <input type="text" id="kwInversor" v-model="puntoLocal.kwInversor" class="form-control-compact" maxlength="100" :readonly="modoConsulta" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwPanelesSolares">KW paneles solares</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-sun icon-prefix"></i>
                      <input type="text" id="kwPanelesSolares" v-model="puntoLocal.kwPanelesSolares" class="form-control-compact" maxlength="100" :readonly="modoConsulta" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="appMonitorizacion">APP monitorización</label>
                    <div class="select-container-compact">
                      <select id="appMonitorizacion" v-model="puntoLocal.appMonitorizacionId" class="form-select-compact" :disabled="modoConsulta">
                        <option :value="null">Seleccione...</option>
                        <option v-for="app in appMonitorizacion" :key="app.id" :value="app.id">
                          {{ app.nombre }}
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label class="checkbox-label-fv" for="ejecutadoPorAuraFv">
                      <input
                        id="ejecutadoPorAuraFv"
                        type="checkbox"
                        v-model="puntoLocal.ejecutadoPorAuraFv"
                        :disabled="modoConsulta"
                      />
                      Ejecutado por Aura
                    </label>
                  </div>
                  <div class="form-group-compact">
                    <label for="usuarioInstalacionFv">Usuario</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-user icon-prefix"></i>
                      <input
                        type="text"
                        id="usuarioInstalacionFv"
                        v-model="puntoLocal.usuarioInstalacionFv"
                        class="form-control-compact"
                        maxlength="150"
                        :readonly="modoConsulta"
                      />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="contrasenaInstalacionFv">Contraseña</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-lock icon-prefix"></i>
                      <input
                        type="text"
                        id="contrasenaInstalacionFv"
                        v-model="puntoLocal.contrasenaInstalacionFv"
                        class="form-control-compact"
                        maxlength="150"
                        :readonly="modoConsulta"
                      />
                    </div>
                  </div>
                </div>

                <!-- Almacenamiento energético -->
                <div class="installation-card">
                  <div class="section-header-compact">
                    <i class="fas fa-warehouse"></i>
                    <h3>Almacenamiento energético</h3>
                  </div>
                  <div class="form-group-compact">
                    <label for="bateriaAlmacenamiento">Batería</label>
                    <div class="select-container-compact">
                      <select id="bateriaAlmacenamiento" v-model="puntoLocal.bateriaAlmacenamiento" class="form-select-compact" :disabled="modoConsulta">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="potenciaBateriaAlmacenamiento">Potencia batería</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-bolt icon-prefix"></i>
                      <input type="text" id="potenciaBateriaAlmacenamiento" v-model="puntoLocal.potenciaBateriaAlmacenamiento" class="form-control-compact" maxlength="100" :readonly="modoConsulta" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="backup">Backup</label>
                    <div class="select-container-compact">
                      <select id="backup" v-model="puntoLocal.backup" class="form-select-compact" :disabled="modoConsulta">
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
                      <select id="peaksaving" v-model="puntoLocal.peaksaving" class="form-select-compact" :disabled="modoConsulta">
                        <option value="">Seleccione...</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                      <i class="fas fa-chevron-down select-icon"></i>
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="integracionSistemasFV">Integración con sistemas fotovoltaicos</label>
                    <div class="select-container-compact">
                      <select id="integracionSistemasFV" v-model="puntoLocal.integracionSistemasFVId" class="form-select-compact" :disabled="modoConsulta">
                        <option :value="null">Seleccione...</option>
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
              <button type="button" class="btn-compact btn-back" @click="activeTab = 'principal'">
                <i class="fas fa-arrow-left"></i> Anterior
              </button>
              <div class="action-buttons">
                <!-- Botón Dar de baja (solo si está activo y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && !puntoLocal.fechaBaja" type="button" @click="confirmarBajaPunto" class="btn-compact btn-danger">
                  <i class="fas fa-ban"></i> Dar de baja
                </button>
                <!-- Botón Reactivar (solo si está dado de baja y en modo actualizar) -->
                <button v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" type="button" @click="confirmarReactivarPunto" class="btn-compact btn-success">
                  <i class="fas fa-map-marker-alt"></i> Reactivar punto
                </button>
                <!-- Mensaje de estado si está dado de baja -->
                <div v-if="!modoConsulta && !isCreating && puntoLocal.id && puntoLocal.fechaBaja" class="status-message status-inactive">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Punto dado de baja el {{ formatFecha(puntoLocal.fechaBaja) }}</span>
                </div>
                <button type="button" class="btn-compact btn-secondary" @click="cerrarModal">
                  <i class="fas fa-times"></i> {{ modoConsulta ? 'Cerrar' : 'Cancelar' }}
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
import { fechaES } from '@/utils/fechas';

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
    },
    // El padre lo activa mientras guarda: evita crear el mismo punto dos veces con un doble clic
    isSubmitting: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeTab: 'principal',
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
        ejecutadoPorAuraFv: false,
        usuarioInstalacionFv: '',
        contrasenaInstalacionFv: '',
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
      integracionSistemasFV: [],
      // Petición de datos maestros en curso, para que el watcher y created() la compartan.
      cargaMaestros: null
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
      await this.loadMasterData();

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

      this.$swal.fire({
        icon: 'error',
        title: titulo,
        text: mensaje,
        confirmButtonColor: '#fcd700',
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
    },

    // Lleva a la vista el primer campo en rojo: si el formulario estaba desplazado hacia
    // abajo (o se guardó desde «Instalaciones»), el aviso pedía revisar campos que no se veían
    irAlPrimerError() {
      this.$nextTick(() => {
        const campo = this.$el?.querySelector?.('.tab-content[data-active-tab="principal"] .input-error');
        if (campo && campo.scrollIntoView) campo.scrollIntoView({ block: 'center' });
      });
    },

        // Método para normalizar valores CUPS antes del envío
    normalizarCups(cups) {
      
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
      
      return cupsStr;
    },

    /**
     * Carga las seis listas de los desplegables. El watcher `immediate` y `created`
     * se llaman los dos nada más abrir el modal, así que comparten la misma petición
     * en lugar de duplicarla. Si falla, se olvida para poder reintentar.
     */
    loadMasterData() {
      if (this.cargaMaestros) return this.cargaMaestros;

      this.cargaMaestros = Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/distribuidoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/tipos-contador`),
        axios.get(`${process.env.VUE_APP_API_URL}/tipos-comunicacion`),
        axios.get(`${process.env.VUE_APP_API_URL}/propiedades`),
        axios.get(`${process.env.VUE_APP_API_URL}/app-monitorizacion`),
        axios.get(`${process.env.VUE_APP_API_URL}/integracion-sistemas-fv`)
      ]).then(([distribuidorasRes, tiposContadorRes, tiposComunicacionRes, propiedadesRes,
        appMonitorizacionRes, integracionSistemasFVRes]) => {
        this.distribuidoras = distribuidorasRes.data;
        this.tiposContador = tiposContadorRes.data;
        this.tiposComunicacion = tiposComunicacionRes.data;
        this.propiedades = propiedadesRes.data;
        this.appMonitorizacion = appMonitorizacionRes.data;
        this.integracionSistemasFV = integracionSistemasFVRes.data;
      }).catch((error) => {
        this.cargaMaestros = null;
        throw error;
      });

      return this.cargaMaestros;
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
        ejecutadoPorAuraFv: newVal.ejecutadoPorAuraFv === true || newVal.ejecutadoPorAuraFv === 1,
        usuarioInstalacionFv: newVal.usuarioInstalacionFv || '',
        contrasenaInstalacionFv: newVal.contrasenaInstalacionFv || '',
        bateriaAlmacenamiento: newVal.bateriaAlmacenamiento || '',
        potenciaBateriaAlmacenamiento: newVal.potenciaBateriaAlmacenamiento || '',
        backup: newVal.backup || '',
        peaksaving: newVal.peaksaving || '',
        fechaBaja: newVal.fechaBaja || null,
        appMonitorizacionId: newVal.appMonitorizacion ? newVal.appMonitorizacion.id : null,
        integracionSistemasFVId: newVal.integracionSistemasFV ? newVal.integracionSistemasFV.id : null
      };

      if (this.distribuidoras.length === 0) {
        try {
          await this.loadMasterData();
        } catch (error) {
          console.error('Error al recargar datos maestros:', error);
        }
      }

      // Mapear objetos relacionados. Si una lista no se pudo cargar (vacía) se conserva el
      // valor que ya tenía el punto: con null, al guardar se borraba en la base de datos
      const enLista = (lista, actual, coincide) =>
        lista.length ? (lista.find(coincide) || null) : actual;

      if (typeof newVal.distribuidora === 'string') {
        this.puntoLocal.distribuidora = this.distribuidoras.find(d => d.nombre === newVal.distribuidora) || null;
      } else if (newVal.distribuidora && newVal.distribuidora.id) {
        this.puntoLocal.distribuidora = enLista(this.distribuidoras, newVal.distribuidora, d => d.id === newVal.distribuidora.id);
      }

      if (newVal.tipoContador && newVal.tipoContador.id) {
        this.puntoLocal.tipoContador = enLista(this.tiposContador, newVal.tipoContador, tc => tc.id === newVal.tipoContador.id);
      }

      if (newVal.tipoComunicacion && newVal.tipoComunicacion.id) {
        this.puntoLocal.tipoComunicacion = enLista(this.tiposComunicacion, newVal.tipoComunicacion, tcom => tcom.id === newVal.tipoComunicacion.id);
      }

      if (newVal.propiedad && newVal.propiedad.id) {
        this.puntoLocal.propiedad = enLista(this.propiedades, newVal.propiedad, p => p.id === newVal.propiedad.id);
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
        this.irAlPrimerError();
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
        ejecutadoPorAuraFv: this.puntoLocal.ejecutadoPorAuraFv === true,
        usuarioInstalacionFv: this.puntoLocal.usuarioInstalacionFv?.trim() || null,
        contrasenaInstalacionFv: this.puntoLocal.contrasenaInstalacionFv?.trim() || null,
        bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
        potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
        backup: this.puntoLocal.backup?.trim() || null,
        peaksaving: this.puntoLocal.peaksaving?.trim() || null,
        appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
        integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
        fechaBaja: this.puntoLocal.fechaBaja || null,
      };
      
      this.$emit('actualizar-punto-suministro', datosAdaptados);
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
            <div class="swal-accion-contenedor">
              <div class="swal-accion-caja swal-accion-caja--danger">
                <div class="swal-accion-caja-header swal-accion-caja-header--danger">
                  <i class="fas fa-exclamation-triangle"></i>
                  <span>Acci\u00f3n de baja de punto de suministro</span>
                </div>
                <p class="swal-accion-caja-texto swal-accion-caja-texto--danger">Esta acci\u00f3n marcar\u00e1 el punto de suministro como dado de baja en el sistema.</p>
              </div>
              <label for="swal-fecha-baja-punto" class="swal-accion-label">
                <i class="fas fa-calendar-alt"></i>
                Fecha de baja *
              </label>
              <input 
                type="date" 
                id="swal-fecha-baja-punto" 
                class="swal2-input swal-accion-input" 
                required
              />
            </div>
          `,
          icon: 'warning',
          iconColor: '#b56767',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-ban"></i> Confirmar baja',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#d33',
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
          // La fecha va en el envío; el formulario no se marca como dado de baja hasta que
          // el servidor lo confirme (si fallaba, quedaba «de baja» y un Guardar posterior
          // lo daba de baja sin querer)

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
            ejecutadoPorAuraFv: this.puntoLocal.ejecutadoPorAuraFv === true,
            usuarioInstalacionFv: this.puntoLocal.usuarioInstalacionFv?.trim() || null,
            contrasenaInstalacionFv: this.puntoLocal.contrasenaInstalacionFv?.trim() || null,
            bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
            potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
            backup: this.puntoLocal.backup?.trim() || null,
            peaksaving: this.puntoLocal.peaksaving?.trim() || null,
            appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
            integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
            fechaBaja: fechaBaja,
          };
          
          this.$emit('actualizar-punto-suministro', datosAdaptados);
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
            confirmButtonColor: '#fcd700'
          });
          return;
        }

        const { isConfirmed } = await this.$swal.fire({
          title: '¿Reactivar punto de suministro?',
          html: `
            <div class="swal-accion-contenedor">
              <div class="swal-accion-caja swal-accion-caja--success">
                <div class="swal-accion-caja-header swal-accion-caja-header--success">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Reactivación de punto de suministro</span>
                </div>
                <p class="swal-accion-caja-texto swal-accion-caja-texto--success">Esta acción reactivará el punto de suministro en el sistema, eliminando la fecha de baja.</p>
              </div>
            </div>
          `,
          icon: 'success',
          iconColor: '#16a34a',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-map-marker-alt"></i> Confirmar reactivación',
          cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
          confirmButtonColor: '#fcd700',
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
            ejecutadoPorAuraFv: this.puntoLocal.ejecutadoPorAuraFv === true,
            usuarioInstalacionFv: this.puntoLocal.usuarioInstalacionFv?.trim() || null,
            contrasenaInstalacionFv: this.puntoLocal.contrasenaInstalacionFv?.trim() || null,
            bateriaAlmacenamiento: this.puntoLocal.bateriaAlmacenamiento?.trim() || null,
            potenciaBateriaAlmacenamiento: this.puntoLocal.potenciaBateriaAlmacenamiento?.trim() || null,
            backup: this.puntoLocal.backup?.trim() || null,
            peaksaving: this.puntoLocal.peaksaving?.trim() || null,
            appMonitorizacion: this.puntoLocal.appMonitorizacionId ? { id: this.puntoLocal.appMonitorizacionId } : null,
            integracionSistemasFV: this.puntoLocal.integracionSistemasFVId ? { id: this.puntoLocal.integracionSistemasFVId } : null,
            fechaBaja: null, // Eliminar la fecha de baja
          };
          
          this.$emit('actualizar-punto-suministro', datosAdaptados);
        }
      } catch (error) {
        console.error('Error en confirmación de reactivación:', error);
      }
    },

    formatFecha(fecha) {
      return fechaES(fecha, '');
    }
  }
};
</script>

<style scoped src="./ActualizarPuntoSuministro.css"></style>