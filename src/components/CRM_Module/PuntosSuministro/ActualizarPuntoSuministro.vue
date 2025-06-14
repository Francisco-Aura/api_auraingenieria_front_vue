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
      <form @submit.prevent="actualizarPS" class="compact-form">
        <div class="form-sections-container">
          <!-- Panel izquierdo - Ubicación y Suministros -->
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
            
            <!-- Sección de Información Adicional -->
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
          
          <!-- Panel derecho - Equipos de Medida -->
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
                  <div class="input-with-icon">
                    <i class="fas fa-bolt icon-prefix"></i>
                    <input type="number" id="potenciaBIE" v-model="puntoLocal.potenciaBIE" :readonly="modoConsulta" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="potenciaTecnicaRed">Potencia Técnica Red</label>
                  <input type="number" id="potenciaTecnicaRed" v-model="puntoLocal.potenciaTecnicaRed" :readonly="modoConsulta" />
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
                  <label for="numeroTelefono">Nº Teléfono</label>
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

            <!-- Observaciones -->
            <div class="form-section">
              <div class="section-header">
                <i class="fas fa-comment-alt"></i>
                <h3>Observaciones</h3>
              </div>
              <div class="form-compact-group">
                <textarea id="observaciones" v-model="puntoLocal.observaciones" :readonly="modoConsulta" rows="3" placeholder="Observaciones relevantes..."></textarea>
              </div>
            </div>
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
              <i class="fas fa-save"></i> Actualizar
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
      puntoLocal: { ...this.modificarPunto },
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
        cupsluz: newVal.cupsluz || '',
        cupsgas: newVal.cupsgas || '',
      };

      console.log('puntoLocal después de la inicialización:', this.puntoLocal);

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
        console.log('Iniciando actualización de punto de suministro');

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
        if (!this.puntoLocal.cupsluz && !this.puntoLocal.cupsgas) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Debe proporcionar al menos un CUPS (luz o gas)'
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
          fechaConcesion: this.puntoLocal.fechaConcesion || null
        };
        
        console.log('Datos a enviar:', datosAdaptados);
        this.$emit('actualizar-punto-suministro', datosAdaptados);
        console.log('Evento emitido');
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
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;    
  width: 100%;
  height: 100%;
  padding: 15px;
}

.modal-content {
  width: 90%;
  max-width: 90%;
  height: 90%;
  max-height: 90%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 18px 25px;
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
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #e74c3c;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
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

/* Formulario compacto */
.compact-form {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.form-sections-container {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
  gap: 10px;
  max-height: calc(90vh - 100px); /* Ajusta según el tamaño del header y footer */
  overflow-y: auto;
}

.panel-left, .panel-right {
  flex: 1;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Secciones de formulario */
.form-section {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header i {
  font-size: 0.9rem;
  color: #666;
}

.section-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Elementos de formulario */
.form-compact-group {
  margin-bottom: 8px;
}

.form-compact-group label {
  display: block;
  margin-bottom: 2px;
  font-size: 1rem;
  font-weight: 500;
  color: #555;
}

.form-row {
  display: flex;
  gap: 8px;
  margin-bottom: 0;
}

.form-compact-group.half {
  flex: 1;
}

.form-compact-group input,
.form-compact-group select,
.form-compact-group textarea {
  width: 100%;
  padding: 5px 8px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 35px;
}

.form-compact-group textarea {
  resize: none;
  height: 60px;
}

.input-with-icon {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 7px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 1rem;
}

.input-with-icon input,
.input-with-icon select {
  padding-left: 30px;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}

/* Pie del modal */
.modal-footer {
  padding: 10px 15px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.required-note {
  font-size: 0.95rem;
  color: #777;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 1rem;
  border: none;
  outline: none;
}

.btn-primary {
  background-color: rgba(252, 215, 0);
  color: black;
}

.btn-primary:hover {
  background-color: rgb(222, 189, 0);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

/* Responsive */
@media (max-width: 768px) {
  .form-sections-container {
    flex-direction: column;
  }
  
  .panel-left, .panel-right {
    width: 100%;
  }
  
  .form-row {
    flex-direction: column;
    gap: 5px;
  }
}
</style>