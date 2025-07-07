<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <div class="header-content">
          <h1 class="modal-title">
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
        <div class="form-sections-container">
          <!-- Panel izquierdo - Ubicación, Suministros, Información Adicional y Observaciones -->
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
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="codigoPostal">CP <span class="required">*</span></label>
                  <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" :readonly="modoConsulta" required />
                </div>
                <div class="form-compact-group half">
                  <label for="poblacion">Población <span class="required">*</span></label>
                  <input type="text" id="poblacion" v-model="puntoLocal.poblacion" :readonly="modoConsulta" required />
                </div>
              </div>
              <div class="form-compact-group">
                <label for="provincia">Provincia <span class="required">*</span></label>
                <input type="text" id="provincia" v-model="puntoLocal.provincia" :readonly="modoConsulta" required />
              </div>
              <div class="form-compact-group">
                <label for="identificacion">Identificación</label>
                <div class="input-with-icon">
                  <i class="fas fa-id-card icon-prefix"></i>
                  <input type="text" id="identificacion" v-model="puntoLocal.identificacion" :readonly="modoConsulta" placeholder="Identificación del punto de suministro" />
                </div>
              </div>
              <div class="form-compact-group">
                <label for="ubicacion">Ubicación (Google Maps)</label>
                <div class="input-with-icon">
                  <i class="fas fa-map-marker-alt icon-prefix"></i>
                  <textarea id="ubicacion" v-model="puntoLocal.ubicacion" :readonly="modoConsulta" rows="2" placeholder="Enlace de Google Maps con la ubicación exacta"></textarea>
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
                  <select id="distribuidora" v-model="puntoLocal.distribuidora" :disabled="modoConsulta" class="form-control">
                    <option :value="null">Seleccione una distribuidora</option>
                    <option v-for="d in distribuidoras" :key="d.id" :value="d">{{ d.nombre }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Sección de Información Adicional (Parte 1) -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-info-circle"></i>
                <h3>Información Adicional</h3>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="fechaInstalacion">F. Instalación</label>
                  <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group half">
                  <label for="exencionImpuestoElectrico">Exención Imp. Eléctrico</label>
                  <select id="exencionImpuestoElectrico" v-model="puntoLocal.exencionImpuestoElectrico" :disabled="modoConsulta">
                    <option :value="null">Seleccione</option>
                    <option :value="true">SI</option>
                    <option :value="false">NO</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="porcentajeConcesion">% Concesión</label>
                  <input type="number" id="porcentajeConcesion" v-model="puntoLocal.porcentajeConcesion" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group half">
                  <label for="fechaConcesion">F. Concesión</label>
                  <input type="date" id="fechaConcesion" v-model="puntoLocal.fechaConcesion" :readonly="modoConsulta" />
                </div>
              </div>
            </div>

          </div>
          
          <!-- Panel derecho - Equipos de Medida y Monitorización -->
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
                    <select id="tipoContador" v-model="puntoLocal.tipoContador" :disabled="modoConsulta" class="form-control">
                      <option :value="null">Seleccione</option>
                      <option v-for="tc in tiposContador" :key="tc.id" :value="tc">{{ tc.nombre || tc.descripcion }}</option>
                    </select>
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="tipoComunicacion">Tipo de Comunicación</label>
                  <div class="input-with-icon">
                    <i class="fas fa-broadcast-tower icon-prefix"></i>
                    <select id="tipoComunicacion" v-model="puntoLocal.tipoComunicacion" :disabled="modoConsulta" class="form-control">
                      <option :value="null">Seleccione</option>
                      <option v-for="tcom in tiposComunicacion" :key="tcom.id" :value="tcom">{{ tcom.nombre || tcom.descripcion }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="numeroContador">Nº Contador</label>
                  <input type="text" id="numeroContador" v-model="puntoLocal.numeroContador" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group half">
                  <label for="numeroTelefono">Nº Teléfono/IP</label>
                  <input type="tel" id="numeroTelefono" v-model="puntoLocal.numeroTelefono" :readonly="modoConsulta" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="direccionEnlace">Dir. Enlace</label>
                  <input type="text" id="direccionEnlace" v-model="puntoLocal.direccionEnlace" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group half">
                  <label for="puntoMedida">Punto Medida</label>
                  <input type="text" id="puntoMedida" v-model="puntoLocal.puntoMedida" :readonly="modoConsulta" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="clave">Clave</label>
                  <input type="text" id="clave" v-model="puntoLocal.clave" :readonly="modoConsulta" />
                </div>
                <div class="form-compact-group half">
                  <label for="propiedad">Propiedad</label>
                  <div class="input-with-icon">
                    <i class="fas fa-key icon-prefix"></i>
                    <select id="propiedad" v-model="puntoLocal.propiedad" :disabled="modoConsulta" class="form-control">
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
              <div class="form-compact-group">
                <label for="usuarioMonitorizacion">Usuario Monitorización</label>
                <div class="input-with-icon">
                  <i class="fas fa-user icon-prefix"></i>
                  <input type="text" id="usuarioMonitorizacion" v-model="puntoLocal.usuarioMonitorizacion" :readonly="modoConsulta" />
                </div>
              </div>
              <div class="form-compact-group">
                <label for="passMonitorizacion">Contraseña Monitorización</label>
                <div class="input-with-icon">
                  <i class="fas fa-lock icon-prefix"></i>
                  <input type="password" id="passMonitorizacion" v-model="puntoLocal.passMonitorizacion" :readonly="modoConsulta" />
                </div>
              </div>
            </div>

            <!-- Sección de Información Adicional (Parte 2) -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-info-circle"></i>
                <h3>Información Adicional (Cont.)</h3>
              </div>
              <div class="form-compact-group">
                <label for="autoconsumo">Autoconsumo</label>
                <select id="autoconsumo" v-model="puntoLocal.autoconsumo" :disabled="modoConsulta">
                  <option :value="null">Seleccione</option>
                  <option value="Compensación de excedentes simplificada">Compensación de excedentes simplificada</option>
                  <option value="Compensación de excedentes colectiva">Compensación de excedentes colectiva</option>
                  <option value="Autoconsumo sin excedentes">Autoconsumo sin excedentes</option>
                </select>
              </div>
              <div class="form-compact-group" v-if="puntoLocal.autoconsumo">
                <label for="fechaActivacionVertido">Fecha Activación Vertido</label>
                <input type="date" id="fechaActivacionVertido" v-model="puntoLocal.fechaActivacionVertido" :readonly="modoConsulta" />
              </div>
            </div>
          </div>
        </div>

        <!-- Observaciones (MOVIDO AQUI PARA ANCHO COMPLETO) -->
        <div class="form-section full-width-observaciones">
          <div class="section-header">
            <i class="fas fa-comment-alt"></i>
            <h3>Observaciones</h3>
          </div>
          <div class="form-compact-group">
            <textarea id="observaciones" v-model="puntoLocal.observaciones" :readonly="modoConsulta" rows="3" placeholder="Observaciones relevantes..."></textarea>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="modal-footer">
          <div class="required-note" v-if="!modoConsulta"><span class="required">*</span> Campos obligatorios</div>
          <div class="action-buttons">
            <button type="button" @click="cerrarModal" class="btn btn-secondary">
              <i class="fas fa-times"></i> {{ modoConsulta ? 'Cerrar' : 'Cancelar' }}
            </button>
            <button v-if="!modoConsulta" type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> {{ isCreating ? 'Crear' : 'Actualizar' }}
            </button>
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
    modificarPunto: Object,
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
      puntoLocal: { 
        ...this.modificarPunto,
        autoconsumo: this.modificarPunto?.autoconsumo || null,
        fechaActivacionVertido: this.modificarPunto?.fechaActivacionVertido || null,
        usuarioMonitorizacion: this.modificarPunto?.usuarioMonitorizacion || '',
        passMonitorizacion: this.modificarPunto?.passMonitorizacion || '',
        identificacion: this.modificarPunto?.identificacion || '',
        ubicacion: this.modificarPunto?.ubicacion || ''
      },
      distribuidoras: [],
      tiposContador: [],
      tiposComunicacion: [],
      propiedades: []
    };
  },
  async created() {
    try {
      // Cargar datos maestros
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

      // Si modificarPunto ya está disponible, inicializar puntoLocal con los objetos completos
      if (this.modificarPunto && Object.keys(this.modificarPunto).length > 0) {
        this.initializePuntoLocal(this.modificarPunto);
      }

    } catch (error) {
      console.error('Error al cargar datos maestros en ActualizarPuntoSuministro:', error);
      this.$swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los datos maestros necesarios',
        confirmButtonColor: '#3085d6'
      });
    }
  },
  watch: {
    modificarPunto: {
      immediate: true,
      deep: true,
      async handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          await this.initializePuntoLocal(newVal);
        } else {
          // Si newVal es null o vacío, resetear puntoLocal a un estado inicial limpio
          this.puntoLocal = {
            id: null,
            direccion: '',
            codigoPostal: '',
            poblacion: '',
            provincia: '',
            cupsluz: '',
            cupsgas: '',
            distribuidora: null,
            tipoContador: null,
            tipoComunicacion: null,
            propiedad: null,
            propiedadModem: 0,
            observaciones: '',
            fechaInstalacion: '',
            potenciaBIE: 0.0,
            potenciaTecnicaRed: 0.0,
            apmCentroTransformacion: '',
            numeroContador: '',
            numeroTelefono: '',
            direccionEnlace: '',
            puntoMedida: '',
            clave: '',
            exencionImpuestoElectrico: false,
            porcentajeConcesion: 0.0,
            fechaConcesion: '',
            autoconsumo: null,
            fechaActivacionVertido: null,
            usuarioMonitorizacion: '',
            passMonitorizacion: '',
            identificacion: '',
            ubicacion: '',
            cliente: this.modificarPunto?.cliente || null, // Mantener el cliente si viene en modificarPunto
          };
        }
      },
    },
  },
  methods: {
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
      // Clonar newVal para evitar mutaciones directas y aplicar transformaciones necesarias
      this.puntoLocal = {
        ...newVal,
        // Asegurar que los booleanos y números se mapeen correctamente si vienen de diferentes tipos
        exencionImpuestoElectrico: newVal.exencionImpuestoElectrico === true || newVal.exencionImpuestoElectrico === 1,
        propiedadModem: newVal.propiedadModem === true || newVal.propiedadModem === 1,
        potenciaBIE: newVal.potenciaBIE || 0.0,
        potenciaTecnicaRed: newVal.potenciaTecnicaRed || 0.0,
        porcentajeConcesion: newVal.porcentajeConcesion || 0.0,
        // Asegurar que cupsluz y cupsgas se asignen como cadena vacía si son null o undefined
        // Manejar tanto el formato del backend (CUPSluz, CUPSgas) como el del frontend (cupsluz, cupsgas)
        cupsluz: newVal.cupsluz || newVal.CUPSluz || '',
        cupsgas: newVal.cupsgas || newVal.CUPSgas || '',
        // Nuevos campos
        autoconsumo: newVal.autoconsumo || null,
        fechaActivacionVertido: newVal.fechaActivacionVertido || null,
        usuarioMonitorizacion: newVal.usuarioMonitorizacion || '',
        passMonitorizacion: newVal.passMonitorizacion || '',
        identificacion: newVal.identificacion || '',
        ubicacion: newVal.ubicacion || ''
      };

      // Asegurarse de que los datos maestros estén cargados antes de intentar buscar entidades
      if (this.distribuidoras.length === 0 || this.tiposContador.length === 0 || 
          this.tiposComunicacion.length === 0 || this.propiedades.length === 0) {
        await this.loadMasterData(); 
      }

      // Manejar distribuidora: puede venir como string o como objeto
      if (typeof newVal.distribuidora === 'string') {
        this.puntoLocal.distribuidora = this.distribuidoras.find(d => d.nombre === newVal.distribuidora) || null;
      } else if (newVal.distribuidora && newVal.distribuidora.id) {
        this.puntoLocal.distribuidora = this.distribuidoras.find(d => d.id === newVal.distribuidora.id) || null;
      } else {
        this.puntoLocal.distribuidora = null;
      }

      if (newVal.tipoContador && newVal.tipoContador.id) {
        this.puntoLocal.tipoContador = this.tiposContador.find(tc => tc.id === newVal.tipoContador.id) || null;
      } else {
        this.puntoLocal.tipoContador = null;
      }

      if (newVal.tipoComunicacion && newVal.tipoComunicacion.id) {
        this.puntoLocal.tipoComunicacion = this.tiposComunicacion.find(tcom => tcom.id === newVal.tipoComunicacion.id) || null;
      } else {
        this.puntoLocal.tipoComunicacion = null;
      }

      if (newVal.propiedad && newVal.propiedad.id) {
        this.puntoLocal.propiedad = this.propiedades.find(p => p.id === newVal.propiedad.id) || null;
      } else {
        this.puntoLocal.propiedad = null;
      }
    },
    cerrarModal() {
      this.$emit('cerrar-modal');
    },
    async actualizarPS() {
      if (!this.modoConsulta) {

        // Validación mejorada de campos obligatorios
        if (!this.puntoLocal.direccion?.trim() || 
            !this.puntoLocal.codigoPostal?.trim() || 
            !this.puntoLocal.poblacion?.trim() || 
            !this.puntoLocal.provincia?.trim()) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Campos obligatorios',
            text: 'Por favor, complete todos los campos obligatorios marcados con *'
          });
          return;
        }

        // Validación de CUPS
        if (!this.puntoLocal.cupsluz?.trim() && !this.puntoLocal.cupsgas?.trim()) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Debe proporcionar al menos un CUPS (luz o gas)'
          });
          return;
        }

        // Si autoconsumo está seleccionado, fechaActivacionVertido es obligatoria
        if (this.puntoLocal.autoconsumo && !this.puntoLocal.fechaActivacionVertido) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Campo obligatorio',
            text: 'La Fecha de Activación de Vertido es obligatoria si el Autoconsumo está seleccionado.'
          });
          return;
        }

        // Adaptar los datos al formato esperado por el backend
        const datosAdaptados = {
          id: this.puntoLocal.id,
          direccion: this.puntoLocal.direccion.trim(),
          codigoPostal: this.puntoLocal.codigoPostal.trim(),
          poblacion: this.puntoLocal.poblacion.trim(),
          provincia: this.puntoLocal.provincia.trim(),
          CUPSluz: this.puntoLocal.cupsluz?.trim() || null,
          CUPSgas: this.puntoLocal.cupsgas?.trim() || null,
          propiedadModem: this.puntoLocal.propiedadModem ? 1 : 0,
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
          // Nuevos campos
          autoconsumo: this.puntoLocal.autoconsumo || null,
          fechaActivacionVertido: this.puntoLocal.autoconsumo ? (this.puntoLocal.fechaActivacionVertido || null) : null,
          usuarioMonitorizacion: this.puntoLocal.usuarioMonitorizacion?.trim() || null,
          passMonitorizacion: this.puntoLocal.passMonitorizacion?.trim() || null,
          identificacion: this.puntoLocal.identificacion?.trim() || null,
          ubicacion: this.puntoLocal.ubicacion?.trim() || null,
        };
        
        // Debug logs para verificar los valores CUPS
        console.log('Debug Frontend - CUPS values:');
        console.log('cupsluz from puntoLocal:', this.puntoLocal.cupsluz);
        console.log('cupsgas from puntoLocal:', this.puntoLocal.cupsgas);
        console.log('CUPSluz in datosAdaptados:', datosAdaptados.CUPSluz);
        console.log('CUPSgas in datosAdaptados:', datosAdaptados.CUPSgas);
        console.log('Full datosAdaptados:', datosAdaptados);
        
        this.$emit('actualizar-punto-suministro', datosAdaptados);
        // Cerrar el modal tras guardar/editar
        this.cerrarModal();
      }
    },
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Estilos base del modal compacto */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.modal-content {
  background: white;
  border-radius: 0.4rem; /* Ajustado para coincidir con el otro modal */
  width: 95%; /* Cambiado de 100% a 95% */
  max-width: 95%; /* Cambiado de 90% a 95% */
  height: 95vh; /* Añadido para controlar la altura */
  max-height: 95vh; /* Cambiado para usar la misma proporción que el otro modal */
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2); /* Ajustado para coincidir */
  overflow: hidden;
}

.modal-header {
  padding: 1rem 1.3rem;
  border-bottom: 1px solid #e0e0e0;
  background: rgba(252, 215, 0);
  color: white;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* Evita que el encabezado se encoja */
}

/* Nuevo estilo para el contenido del formulario que permitirá el scroll */
.compact-form-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* Eliminar el max-height de 65vh para permitir que ocupe el espacio disponible */
  max-height: none; /* Cambiado de 65vh a none */
}

.input-with-icon textarea + .icon-prefix {
  top: 1rem; /* Posicionar el ícono en la parte superior del textarea */
  transform: none; /* Eliminar la transformación vertical */
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: black; /* Cambiar a negro para mejor contraste sobre el fondo amarillo */
  flex-grow: 1; /* Permite que el título ocupe el espacio disponible */
}

.close-button {
  position: absolute;
  top: 0.8rem;
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
  color: white;
  transform: rotate(90deg);
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-suffix {
  position: absolute;
  right: 1.5rem; /* Movido más a la izquierda para evitar las flechas de control */
  top: 60%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.9rem;
  line-height: 1;
  pointer-events: none;
  display: flex;
  align-items: center;
}
/* Ajustar el padding derecho para evitar que el texto se superponga con el sufijo */
.input-with-suffix input {
  padding-right: 3rem;
}

/* Si el campo también tiene un ícono a la izquierda, ajustar ambos lados */
.input-with-icon.input-with-suffix input {
  padding-left: 1.5rem;
  padding-right: 3rem;
}

.form-sections-container {
  display: flex;
  gap: 1rem;
  /* Eliminar o ajustar margin-top/bottom si se aplica padding al .compact-form-content */
}

.panel-left,
.panel-right {
  flex: 1;
  min-width: 0; /* Permite que los paneles se encojan si no hay espacio */
}

.form-section {
  background: var(--surface-color);
  border-radius: 0.4rem;
  padding: 0.3rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.form-section.full-width-observaciones {
  width: 100%; /* Asegura que ocupe el 100% del espacio disponible */
}

.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.section-header i {
  color: black;
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.form-compact-group label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.form-row {
  display: flex;
  gap: 0.8rem;
}

.form-row .half {
  flex: 1;
}

.form-compact-group input,
.form-compact-group select,
.form-compact-group textarea {
  width: 100%;
  padding: 0.3rem 0.5rem;
  font-size: 0.9rem;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  height: 30px;
  background-color: white;
  color: var(--text-primary);
}

.form-compact-group textarea {
  resize: vertical; /* Cambiado a vertical para mejor usabilidad */
  min-height: 50px;
  height: auto; /* Permite que crezca con el contenido si resize es vertical */
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
  font-size: 0.9rem;
}

.input-with-icon .fa-map-marker-alt.icon-prefix {
  top: 0.8rem !important;
  transform: none !important;
}

.input-with-icon input,
.input-with-icon select,
.input-with-icon textarea {
  padding-left: 1.5rem;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}

/* Pie del modal - ahora dentro del formulario */
.modal-footer {
  padding: 15px 0; /* Cambiar padding para que no interfiera con el del form */
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Evita que el pie de página se encoja */
  margin-top: auto; /* Empuja el footer hacia abajo */
}

.required-note {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500; /* Añadido para mejor legibilidad */
}

.action-buttons {
  display: flex;
  gap: 10px; /* Ajustado gap */
}

.btn {
  padding: 8px 16px; /* Ajustado padding */
  border-radius: 6px; /* Ajustado border-radius */
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px; /* Ajustado gap */
  font-size: 1rem;
  border: none;
  outline: none;
}

.btn-primary {
  background-color: rgba(252, 215, 0); /* Usando la variable de color principal */
  color: black;
}

.btn-primary:hover {
  background-color: rgb(222, 189, 0); /* Un tono más oscuro para el hover */
  transform: translateY(-1px); /* Efecto sutil de levantamiento */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Sombra para el hover */
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

/* Responsive */
@media (max-width: 900px) {
  .modal-content {
    max-height: 95vh;
  }
  .compact-form-content {
    max-height: 60vh;
  }
}

@media (max-width: 600px) {
  .modal-content {
    max-height: 100vh;
  }
  .compact-form-content {
    max-height: 70vh;
  }
}
</style>