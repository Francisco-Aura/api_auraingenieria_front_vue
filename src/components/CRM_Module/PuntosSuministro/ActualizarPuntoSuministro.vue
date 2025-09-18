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
      <form @submit.prevent="actualizarPS" class="compact-form-content">
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
                  <input type="text" id="direccion" v-model="puntoLocal.direccion" :readonly="modoConsulta" required />
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="codigoPostal">CP <span class="required">*</span></label>
                  <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" :readonly="modoConsulta" required />
                </div>
                <div class="form-compact-group">
                  <label for="poblacion">Población <span class="required">*</span></label>
                  <input type="text" id="poblacion" v-model="puntoLocal.poblacion" :readonly="modoConsulta" required />
                </div>
                <div class="form-compact-group">
                  <label for="provincia">Provincia <span class="required">*</span></label>
                  <input type="text" id="provincia" v-model="puntoLocal.provincia" :readonly="modoConsulta" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="identificacion">Identificación</label>
                  <div class="input-with-icon">
                    <i class="fas fa-id-card icon-prefix"></i>
                    <input type="text" id="identificacion" v-model="puntoLocal.identificacion" :readonly="modoConsulta" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="ubicacion">Ubicación Maps</label>
                  <div class="input-with-icon">
                    <i class="fas fa-map-marker-alt icon-prefix"></i>
                    <input type="text" id="ubicacion" v-model="puntoLocal.ubicacion" :readonly="modoConsulta" />
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
                    <input type="text" id="cupsluz" v-model="puntoLocal.cupsluz" :readonly="modoConsulta" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="cupsgas">CUPS Gas</label>
                  <div class="input-with-icon">
                    <i class="fas fa-fire icon-prefix"></i>
                    <input type="text" id="cupsgas" v-model="puntoLocal.cupsgas" :readonly="modoConsulta" />
                  </div>
                </div>
              </div>
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
                  <label for="fechaInstalacion">F. Instalación</label>
                  <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" :readonly="modoConsulta" />
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
                  <label for="exencionImpuestoElectrico">Exención Imp. Eléctrico</label>
                  <select id="exencionImpuestoElectrico" v-model="puntoLocal.exencionImpuestoElectrico" :disabled="modoConsulta">
                    <option :value="null">Seleccione</option>
                    <option :value="true">SI</option>
                    <option :value="false">NO</option>
                  </select>
                </div>
                <div class="form-compact-group half">
                  <label for="autoconsumo">Autoconsumo</label>
                  <select id="autoconsumo" v-model="puntoLocal.autoconsumo" :disabled="modoConsulta">
                    <option :value="null">Seleccione</option>
                    <option value="Compensación de excedentes simplificada">Compensación de excedentes simplificada</option>
                    <option value="Compensación de excedentes colectiva">Compensación de excedentes colectiva</option>
                    <option value="Autoconsumo sin excedentes">Autoconsumo sin excedentes</option>
                  </select>
                </div>
              </div>
              <div class="form-compact-group" v-if="puntoLocal.autoconsumo">
                <label for="fechaActivacionVertido">Fecha Activación Vertido</label>
                <input type="date" id="fechaActivacionVertido" v-model="puntoLocal.fechaActivacionVertido" :readonly="modoConsulta" />
              </div>
            </div>
          </div>
          
          <!-- Panel derecho - Equipos de Medida, Monitorización y Potencias -->
          <div class="panel-right">
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
                <input type="text" id="apmCentroTransformacion" v-model="puntoLocal.apmCentroTransformacion" :readonly="modoConsulta" />
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
                  <input type="text" id="numeroContador" v-model="puntoLocal.numeroContador" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="numeroTelefono">Nº Teléfono/IP</label>
                  <input type="tel" id="numeroTelefono" v-model="puntoLocal.numeroTelefono" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="direccionEnlace">Dir. Enlace</label>
                  <input type="text" id="direccionEnlace" v-model="puntoLocal.direccionEnlace" :readonly="modoConsulta" />
                </div>
              </div>
              <div class="form-row triple">
                <div class="form-compact-group">
                  <label for="puntoMedida">Punto Medida</label>
                  <input type="text" id="puntoMedida" v-model="puntoLocal.puntoMedida" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group">
                  <label for="clave">Clave</label>
                  <input type="text" id="clave" v-model="puntoLocal.clave" :readonly="modoConsulta" />
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
                    <input type="text" id="usuarioMonitorizacion" v-model="puntoLocal.usuarioMonitorizacion" :readonly="modoConsulta" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="passMonitorizacion">Contraseña Monitorización</label>
                  <div class="input-with-icon">
                    <i class="fas fa-lock icon-prefix"></i>
                    <input type="password" id="passMonitorizacion" v-model="puntoLocal.passMonitorizacion" :readonly="modoConsulta" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección de Potencias Contratadas - REUBICADA EN EL PANEL DERECHO -->
            <div v-if="modoConsulta && tienePotenciasContratadas" class="form-section potencias-section">
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
          </div>
            </div>

            <!-- Observaciones (ANCHO COMPLETO EN LA PARTE INFERIOR) -->
            <div class="form-section full-width-observaciones">
              <div class="section-header">
                <i class="fas fa-comment-alt"></i>
                <h3>Observaciones</h3>
              </div>
              <div class="form-compact-group">
                <textarea id="observaciones" v-model="puntoLocal.observaciones" :readonly="modoConsulta" rows="2" placeholder="Observaciones relevantes..."></textarea>
              </div>
            </div>

            
            <!-- Botones de acción de la pestaña principal -->
            <div class="modal-footer">
              <div class="required-note" v-if="!modoConsulta"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
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
                      <input type="text" id="potenciaBateria" v-model="puntoLocal.potenciaBateria" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="modeloBateria">Modelo</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-tag icon-prefix"></i>
                      <input type="text" id="modeloBateria" v-model="puntoLocal.modeloBateria" class="form-control-compact" />
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
                      <input type="text" id="kwInversor" v-model="puntoLocal.kwInversor" class="form-control-compact" />
                    </div>
                  </div>
                  <div class="form-group-compact">
                    <label for="kwPanelesSolares">KW Paneles Solares</label>
                    <div class="input-with-icon-compact">
                      <i class="fas fa-sun icon-prefix"></i>
                      <input type="text" id="kwPanelesSolares" v-model="puntoLocal.kwPanelesSolares" class="form-control-compact" />
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
                      <input type="text" id="potenciaBateriaAlmacenamiento" v-model="puntoLocal.potenciaBateriaAlmacenamiento" class="form-control-compact" />
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
        alert(mensaje);
        if (modalOverlay) {
          modalOverlay.style.zIndex = '9999';
        }
      }
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
      console.log('=== FRONTEND DEBUG: INITIALIZING PUNTO LOCAL ===');
      console.log('newVal recibido:', newVal);
      console.log('Instalaciones en newVal:');
      console.log('  bateriaCondensadores:', newVal.bateriaCondensadores);
      console.log('  instalacionFV:', newVal.instalacionFV);
      console.log('  bateriaAlmacenamiento:', newVal.bateriaAlmacenamiento);
      console.log('  appMonitorizacion:', newVal.appMonitorizacion);
      console.log('  integracionSistemasFV:', newVal.integracionSistemasFV);
      console.log('=============================================');

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
        appMonitorizacionId: newVal.appMonitorizacion ? newVal.appMonitorizacion.id : null,
        integracionSistemasFVId: newVal.integracionSistemasFV ? newVal.integracionSistemasFV.id : null
      };

      console.log('=== PUNTO LOCAL DESPUÉS DE INICIALIZAR ===');
      console.log('puntoLocal.bateriaCondensadores:', this.puntoLocal.bateriaCondensadores);
      console.log('puntoLocal.instalacionFV:', this.puntoLocal.instalacionFV);
      console.log('puntoLocal.bateriaAlmacenamiento:', this.puntoLocal.bateriaAlmacenamiento);
      console.log('puntoLocal.appMonitorizacionId:', this.puntoLocal.appMonitorizacionId);
      console.log('puntoLocal.integracionSistemasFVId:', this.puntoLocal.integracionSistemasFVId);
      console.log('==========================================');

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

      console.log('=== FRONTEND DEBUG: INICIO ACTUALIZAR PS ===');
      console.log('puntoLocal completo:', this.puntoLocal);
      
      // DEBUG: Campos de instalaciones en frontend
      console.log('=== INSTALACIONES FRONTEND DEBUG ===');
      console.log('Batería Condensadores:', this.puntoLocal.bateriaCondensadores);
      console.log('Potencia Batería:', this.puntoLocal.potenciaBateria);
      console.log('Modelo Batería:', this.puntoLocal.modeloBateria);
      console.log('Instalación FV:', this.puntoLocal.instalacionFV);
      console.log('KW Inversor:', this.puntoLocal.kwInversor);
      console.log('KW Paneles Solares:', this.puntoLocal.kwPanelesSolares);
      console.log('Batería Almacenamiento:', this.puntoLocal.bateriaAlmacenamiento);
      console.log('Potencia Batería Almacenamiento:', this.puntoLocal.potenciaBateriaAlmacenamiento);
      console.log('Backup:', this.puntoLocal.backup);
      console.log('Peaksaving:', this.puntoLocal.peaksaving);
      console.log('AppMonitorizacion ID:', this.puntoLocal.appMonitorizacionId);
      console.log('IntegracionSistemasFV ID:', this.puntoLocal.integracionSistemasFVId);
      console.log('=======================================');

      if (!this.puntoLocal.direccion?.trim() || !this.puntoLocal.codigoPostal?.trim() || 
          !this.puntoLocal.poblacion?.trim() || !this.puntoLocal.provincia?.trim()) {
        this.mostrarError('Por favor, complete todos los campos obligatorios marcados con *', 'Campos obligatorios');
        return;
      }

      if (!this.puntoLocal.cupsluz?.trim() && !this.puntoLocal.cupsgas?.trim()) {
        this.mostrarError('Debe proporcionar al menos un CUPS (luz o gas)', 'CUPS requerido');
        return;
      }

      const datosAdaptados = {
        id: this.puntoLocal.id,
        direccion: this.puntoLocal.direccion.trim(),
        codigoPostal: this.puntoLocal.codigoPostal.trim(),
        poblacion: this.puntoLocal.poblacion.trim(),
        provincia: this.puntoLocal.provincia.trim(),
        CUPSluz: this.puntoLocal.cupsluz?.trim() || null,
        CUPSgas: this.puntoLocal.cupsgas?.trim() || null,
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
      };

      console.log('=== DATOS ADAPTADOS A ENVIAR ===');
      console.log('datosAdaptados:', datosAdaptados);
      console.log('Instalaciones en datosAdaptados:');
      console.log('  bateriaCondensadores:', datosAdaptados.bateriaCondensadores);
      console.log('  instalacionFV:', datosAdaptados.instalacionFV);
      console.log('  bateriaAlmacenamiento:', datosAdaptados.bateriaAlmacenamiento);
      console.log('  appMonitorizacion:', datosAdaptados.appMonitorizacion);
      console.log('  integracionSistemasFV:', datosAdaptados.integracionSistemasFV);
      console.log('===============================');
      
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
  padding: 0.8rem 1.3rem;
  border-bottom: 1px solid #e0e0e0;
  background: var(--primary-color);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: black;
  flex-grow: 1;
}

.close-button {
  position: absolute;
  top: 0.6rem;
  right: 0.8rem;
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
  transform: rotate(90deg);
}

.compact-form-content {
  flex: 1;
  overflow-y: auto !important;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  max-height: calc(95vh - 120px);
  min-height: 0;
  gap: 0.6rem;
}

.form-sections-container {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
}

.panel-left,
.panel-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-section {
  background: var(--surface-color);
  border-radius: 0.3rem;
  padding: 0.6rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
}

.form-section.full-width-observaciones {
  width: 100%;
  margin-top: 0.3rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.4rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid var(--border-color);
}

.section-header i {
  color: black;
  margin-right: 0.4rem;
  font-size: 1rem;
}

.section-header h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
}

.form-compact-group {
  margin-bottom: 0.5rem;
}

.form-compact-group label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8rem;
  margin-bottom: 0.2rem;
}

.form-row {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
}

.form-row .half {
  flex: 1;
}

.form-row.triple {
  display: flex;
  gap: 0.4rem;
}

.form-row.triple .form-compact-group {
  flex: 1;
  margin-bottom: 0.5rem;
}

.form-compact-group input,
.form-compact-group select,
.form-compact-group textarea {
  width: 100%;
  padding: 0.25rem 0.4rem;
  font-size: 0.85rem;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  height: 28px;
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
  padding: 0.8rem;
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
  padding: 0.5rem 1rem;
  border-radius: 0.3rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.9rem;
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
</style>