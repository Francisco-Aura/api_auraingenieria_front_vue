<template>
  <div v-if="ShowModalPS" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <div class="header-content">
          <h1 class="modal-title">Nuevo Punto de Suministro - {{ cliente?.nombre || 'Desconocido' }}</h1>
        </div>
        <button type="button" class="close-button" @click="cerrarModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulario compacto para punto de suministro -->
      <form @submit.prevent="guardarPS" class="compact-form">
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
                  <input type="text" id="direccion" v-model="puntoLocal.direccion" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="codigoPostal">CP <span class="required">*</span></label>
                  <input type="text" id="codigoPostal" v-model="puntoLocal.codigoPostal" required />
                </div>
                <div class="form-compact-group half">
                  <label for="poblacion">Población <span class="required">*</span></label>
                  <input type="text" id="poblacion" v-model="puntoLocal.poblacion" required />
                </div>
              </div>
              <div class="form-compact-group">
                <label for="provincia">Provincia <span class="required">*</span></label>
                <input type="text" id="provincia" v-model="puntoLocal.provincia" required />
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
                    <input type="text" id="cupsluz" v-model="puntoLocal.cupsluz" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="cupsgas">CUPS Gas</label>
                  <div class="input-with-icon">
                    <i class="fas fa-fire icon-prefix"></i>
                    <input type="text" id="cupsgas" v-model="puntoLocal.cupsgas" />
                  </div>
                </div>
              </div>
              <div class="form-compact-group">
                <label for="distribuidora">Distribuidora <span class="required">*</span></label>
                <div class="input-with-icon">
                  <i class="fas fa-building icon-prefix"></i>
                  <select id="distribuidora" v-model="puntoLocal.distribuidora" required>
                    <option value="">Seleccione una distribuidora</option>
                    <option value="IDE">IDE</option>
                    <option value="EDISTRIBUCION">EDISTRIBUCION</option>
                    <option value="NATURGY">NATURGY</option>
                    <option value="OTRO">OTRO</option>
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
                  <input type="date" id="fechaInstalacion" v-model="puntoLocal.fechaInstalacion" />
                </div>
                <div class="form-compact-group half">
                  <label for="exencionImpuestoElectrico">Exención Imp. Eléctrico</label>
                  <select id="exencionImpuestoElectrico" v-model="puntoLocal.exencionImpuestoElectrico">
                    <option value="">Seleccione</option>
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="porcentajeConcesion">% Concesión</label>
                  <input type="number" id="porcentajeConcesion" v-model="puntoLocal.porcentajeConcesion" />
                </div>
                <div class="form-compact-group half">
                  <label for="fechaConcesion">F. Concesión</label>
                  <input type="date" id="fechaConcesion" v-model="puntoLocal.fechaConcesion" />
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
                    <input type="number" id="potenciaBIE" v-model="puntoLocal.potenciaBIE" />
                  </div>
                </div>
                <div class="form-compact-group half">
                  <label for="potenciaTecnicaRed">Potencia Técnica Red</label>
                  <input type="number" id="potenciaTecnicaRed" v-model="puntoLocal.potenciaTecnicaRed" />
                </div>
              </div>
              <div class="form-compact-group">
                <label for="apmCentroTransformacion">APM Centro Transformación</label>
                <input type="text" id="apmCentroTransformacion" v-model="puntoLocal.apmCentroTransformacion" />
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="tipoContador">Tipo Contador</label>
                  <select id="tipoContador" v-model="puntoLocal.tipoContador">
                    <option value="">Seleccione</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div class="form-compact-group half">
                  <label for="tipoComunicacion">Tipo Comunicación</label>
                  <select id="tipoComunicacion" v-model="puntoLocal.tipoComunicacion">
                    <option value="">Seleccione</option>
                    <option value="Datadis">Datadis</option>
                    <option value="GSM">GSM</option>
                    <option value="IP">IP</option>
                    <option value="Distribuidora">Distribuidora</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="numeroContador">Nº Contador</label>
                  <input type="text" id="numeroContador" v-model="puntoLocal.numeroContador" />
                </div>
                <div class="form-compact-group half">
                  <label for="numeroTelefono">Nº Teléfono</label>
                  <input type="tel" id="numeroTelefono" v-model="puntoLocal.numeroTelefono" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="direccionEnlace">Dir. Enlace</label>
                  <input type="text" id="direccionEnlace" v-model="puntoLocal.direccionEnlace" />
                </div>
                <div class="form-compact-group half">
                  <label for="puntoMedida">Punto Medida</label>
                  <input type="text" id="puntoMedida" v-model="puntoLocal.puntoMedida" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-compact-group half">
                  <label for="clave">Clave</label>
                  <input type="text" id="clave" v-model="puntoLocal.clave" />
                </div>
                <div class="form-compact-group half">
                  <label for="propiedad">Propiedad</label>
                  <select id="propiedad" v-model="puntoLocal.propiedad">
                    <option value="">Seleccione</option>
                    <option value="Distribuidora">Distribuidora</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Aura">Aura</option>
                  </select>
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
                <textarea id="observaciones" v-model="puntoLocal.observaciones" rows="3" placeholder="Observaciones relevantes..."></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="modal-footer">
          <div class="required-note"><span class="required">*</span> Campos obligatorios</div>
          <div class="action-buttons">
            <button type="button" @click="cerrarModal" class="btn btn-secondary">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CrearPuntosSuministroComponent',
  props: {
    cliente: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    ShowModalPS: {
      type: Boolean,
      required: true,
    },
    nuevoPunto: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      puntoLocal: { ...this.nuevoPunto }
    };
  },
  watch: {
    nuevoPunto: {
      immediate: true,
      deep: true,
      handler(newVal) {
        this.puntoLocal = { ...newVal };
      },
    },
  },
  methods: {
    cerrarModal() {
      this.$emit('cerrar-formulario');
    },
    guardarPS() {
      this.$emit('guardar-punto-suministro', { ...this.puntoLocal });
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