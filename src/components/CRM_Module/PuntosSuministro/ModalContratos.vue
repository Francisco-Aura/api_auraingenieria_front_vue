<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h1 class="modal-title">Gestión de Contratos</h1>
        <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Pestañas para organizar el contenido -->
      <div class="form-tabs">
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: pestañaActiva === 'nuevo' }" 
          @click="pestañaActiva = 'nuevo'"
        >
          <i class="fas fa-plus"></i> 
          <span class="tab-text">{{ modoEdicion ? 'Editar' : 'Nuevo' }}</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: pestañaActiva === 'actual' }" 
          @click="pestañaActiva = 'actual'"
        >
          <i class="fas fa-file-contract"></i> 
          <span class="tab-text">Actual</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          :class="{ active: pestañaActiva === 'historico' }" 
          @click="pestañaActiva = 'historico'"
        >
          <i class="fas fa-history"></i> 
          <span class="tab-text">Histórico</span>
        </button>
      </div>

      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content-container">
        <!-- Crear/Editar contrato -->
        <div v-if="pestañaActiva === 'nuevo'" class="tab-content">
          <!-- Banner del cliente -->
          <div class="client-banner">
            <div class="client-info">
              <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'Desconocido' }}</h4>
              <span>DNI/CIF: {{ cliente?.dniAutorizado?.trim() || cliente?.cif?.trim() || 'No disponible' }}</span>
            </div>
          </div>

          <form @submit.prevent="crearNuevoContrato" class="modern-form">
            <div class="form-grid-modern">
              <!-- Sección de Fechas -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas del Contrato</h3>
                </div>
                
                <div class="form-group-modern">
                  <label for="fechaEnvioContrato">Fecha Envío <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-paper-plane icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaEnvioContrato" 
                      v-model="nuevoContrato.fechaEnvio" 
                      class="form-control-modern" 
                      required 
                    />
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="fechaInicioContrato">Fecha Inicio <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-play icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaInicioContrato" 
                      v-model="nuevoContrato.fechaInicio" 
                      class="form-control-modern" 
                      required 
                    />
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="fechaFinContrato">Fecha Fin <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-stop icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaFinContrato" 
                      v-model="nuevoContrato.fechaFin" 
                      class="form-control-modern" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <!-- Sección de Información del Contrato -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-file-contract"></i>
                  <h3>Información del Contrato</h3>
                </div>
                
                <div class="form-group-modern">
                  <label for="contrato">Número de Contrato <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-hashtag icon-prefix"></i>
                    <input 
                      type="text" 
                      id="contrato" 
                      v-model="nuevoContrato.contrato" 
                      class="form-control-modern" 
                      required 
                    />
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="tarifaGas">Tarifa Gas <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select 
                      id="tarifaGas" 
                      v-model="nuevoContrato.idTarifaGas" 
                      class="form-select-modern" 
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="tarifaLuz">Tarifa Luz <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select 
                      id="tarifaLuz" 
                      v-model="nuevoContrato.idTarifaLuz" 
                      class="form-select-modern" 
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>

              <!-- Sección de Documento PDF -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-file-pdf"></i>
                  <h3>Documento del Contrato</h3>
                </div>
                
                <div class="pdf-upload-area" @click="mostrarNotificacionSubidaPDF">
                  <div class="pdf-icon">
                    <i class="fas fa-file-pdf"></i>
                  </div>
                  <div class="pdf-text">
                    <span class="pdf-title">Subir contrato PDF</span>
                    <span class="pdf-desc">Clic para seleccionar archivo</span>
                  </div>
                  <input 
                    type="file" 
                    ref="pdfInput" 
                    @change="handleFileUpload" 
                    accept=".pdf" 
                    style="display:none" 
                  />
                </div>
                
                <div v-if="selectedFile" class="file-selected">
                  <i class="fas fa-file-pdf"></i> 
                  {{ selectedFile.name }}
                </div>
              </div>

              <!-- Sección de Opciones y Observaciones -->
              <div class="form-section-modern full-width">
                <div class="section-header-modern">
                  <i class="fas fa-cog"></i>
                  <h3>Opciones y Observaciones</h3>
                </div>
                
                <div class="form-row-modern">
                  <div class="checkbox-section">
                    <div class="checkbox-group-modern">
                      <label class="checkbox-modern">
                        <input type="checkbox" v-model="nuevoContrato.autoconsumo" />
                        <span class="checkmark"></span>
                        <span class="checkbox-text">Autoconsumo</span>
                      </label>
                      
                      <label class="checkbox-modern">
                        <input type="checkbox" v-model="nuevoContrato.denunciaContrato" />
                        <span class="checkmark"></span>
                        <span class="checkbox-text">Denuncia Contrato</span>
                      </label>
                    </div>
                    
                    <div v-if="nuevoContrato.denunciaContrato" class="form-group-modern">
                      <label for="fechaDenunciaContrato">Fecha Denuncia <span class="required">*</span></label>
                      <div class="input-with-icon-modern">
                        <i class="fas fa-exclamation-triangle icon-prefix"></i>
                        <input 
                          type="date" 
                          id="fechaDenunciaContrato" 
                          v-model="nuevoContrato.fechaDenunciaContrato" 
                          class="form-control-modern" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div class="observations-section">
                    <div class="form-group-modern">
                      <label for="observaciones">Observaciones</label>
                      <textarea 
                        id="observaciones" 
                        v-model="nuevoContrato.observaciones" 
                        class="form-control-modern textarea-modern" 
                        rows="4"
                        placeholder="Añada aquí cualquier observación relevante sobre el contrato..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de acción dentro del formulario -->
            <div class="modal-footer-modern">
              <div class="required-legend"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
                <button type="button" @click="cerrarModal" class="btn-modern btn-secondary">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-save"></i> {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Contrato' }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Visualizar contrato actual -->
        <div v-if="pestañaActiva === 'actual'" class="tab-content">
          <h3>Contrato Actual</h3>
          <div v-if="contratoActual" class="contract-details modern-contract-card">
            <div class="contract-header">
              <div class="contract-info">
                <h4>Contrato <span class="contract-number">#{{ contratoActual.contrato }}</span></h4>
                <p class="contract-dates"><i class="fas fa-calendar-alt"></i> Vigente desde <b>{{ formatDate(contratoActual.fechaInicio) }}</b> hasta <b>{{ formatDate(contratoActual.fechaFin) }}</b></p>
              </div>
              <div class="contract-actions">
                <button @click="descargarPDF(contratoActual)" class="btn btn-secondary" v-if="contratoActual.rutaArchivoContrato">
                  <i class="fas fa-download"></i> Descargar PDF
                </button>
                <button @click="editarContrato" class="btn btn-primary">
                  <i class="fas fa-edit"></i> Editar
                </button>
              </div>
            </div>
            <div class="contract-grid modern-grid">
              <div class="contract-section modern-section">
                <div class="section-header">
                  <i class="fas fa-info-circle"></i>
                  <h5>Información General</h5>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha Envío</span>
                  <span class="info-value"><i class="fas fa-paper-plane"></i> {{ formatDate(contratoActual.fechaEnvio) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarifa Luz</span>
                  <span class="info-value"><i class="fas fa-bolt"></i> {{ getTarifaLuzNombre(contratoActual.idTarifaLuz) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarifa Gas</span>
                  <span class="info-value"><i class="fas fa-fire"></i> {{ getTarifaGasNombre(contratoActual.idTarifaGas) }}</span>
                </div>
              </div>
              <div class="contract-section modern-section">
                <div class="section-header">
                  <i class="fas fa-industry"></i>
                  <h5>Comercializadoras</h5>
                </div>
                <div class="info-row">
                  <span class="info-label">Actual</span>
                  <span class="info-value"><i class="fas fa-building"></i> {{ getComercializadoraNombre(contratoActual.idComercializadoraActual) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Anterior</span>
                  <span class="info-value"><i class="fas fa-history"></i> {{ getComercializadoraNombre(contratoActual.idComercializadoraAnterior) }}</span>
                </div>
              </div>
              <div class="contract-section modern-section">
                <div class="section-header">
                  <i class="fas fa-bolt"></i>
                  <h5>Potencias Contratadas</h5>
                </div>
                <div class="potencia-grid">
                  <div class="potencia-item">
                    <span class="potencia-label">P1:</span>
                    <span class="potencia-value">{{ contratoActual.potencia1 }} kW</span>
                  </div>
                  <div class="potencia-item">
                    <span class="potencia-label">P2:</span>
                    <span class="potencia-value">{{ contratoActual.potencia2 }} kW</span>
                  </div>
                  <div class="potencia-item">
                    <span class="potencia-label">P3:</span>
                    <span class="potencia-value">{{ contratoActual.potencia3 }} kW</span>
                  </div>
                  <div class="potencia-item">
                    <span class="potencia-label">P4:</span>
                    <span class="potencia-value">{{ contratoActual.potencia4 }} kW</span>
                  </div>
                  <div class="potencia-item">
                    <span class="potencia-label">P5:</span>
                    <span class="potencia-value">{{ contratoActual.potencia5 }} kW</span>
                  </div>
                  <div class="potencia-item">
                    <span class="potencia-label">P6:</span>
                    <span class="potencia-value">{{ contratoActual.potencia6 }} kW</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="contract-status modern-status">
              <div class="status-chip" :class="{ active: contratoActual.autoconsumo }">
                <i class="fas fa-solar-panel"></i> Autoconsumo
              </div>
              <div class="status-chip denuncia" :class="{ active: contratoActual.denunciaContrato }">
                <i class="fas fa-exclamation-triangle"></i> Denuncia
              </div>
            </div>
            <div class="contract-notes modern-notes" v-if="contratoActual.observaciones">
              <h5><i class="fas fa-sticky-note"></i> Observaciones</h5>
              <p>{{ contratoActual.observaciones }}</p>
            </div>
          </div>
          <div v-else class="no-contract">
            <i class="fas fa-file-contract"></i>
            <p>No hay contrato actual activo</p>
          </div>
        </div>
        
        <!-- Histórico de contratos - ORIGINAL -->
        <div v-if="pestañaActiva === 'historico'" class="tab-content">
          <h3>Histórico de Contratos</h3>
          <div v-if="contratosHistoricosOrdenados.length" class="history-table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Tarifa Luz</th>
                  <th>Tarifa Gas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contrato in contratosHistoricosOrdenados" :key="contrato.id" class="history-row">
                  <td class="contract-number">#{{ contrato.contrato }}</td>
                  <td>{{ formatDate(contrato.fechaInicio) }}</td>
                  <td>{{ formatDate(contrato.fechaFin) }}</td>
                  <td>{{ getTarifaLuzNombre(contrato.idTarifaLuz) }}</td>
                  <td>{{ getTarifaGasNombre(contrato.idTarifaGas) }}</td>
                  <td>
                    <div class="status-indicators">
                      <span v-if="contrato.autoconsumo" class="status-badge autoconsumo">
                        <i class="fas fa-solar-panel"></i> Autoconsumo
                      </span>
                      <span v-if="contrato.denunciaContrato" class="status-badge denuncia">
                        <i class="fas fa-exclamation-triangle"></i> Denunciado
                      </span>
                      <span v-if="!contrato.autoconsumo && !contrato.denunciaContrato" class="status-badge normal">
                        <i class="fas fa-check-circle"></i> Normal
                      </span>
                    </div>
                  </td>
                  <td class="action-buttons">
                    <button @click="verDetalleContrato(contrato)" class="btn-icon btn-view" title="Ver Detalle">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button @click="descargarPDF(contrato)" class="btn-icon btn-download" title="Descargar PDF" v-if="contrato.rutaArchivoContrato">
                      <i class="fas fa-download"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-history">
            <i class="fas fa-history"></i>
            <p>No hay contratos históricos disponibles</p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE CONTRATO - FUERA DEL MODAL PRINCIPAL -->
    <div v-if="mostrarModalDetalleContrato" class="modal-overlay detalle-contrato-modal">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header">
          <h2><i class="fas fa-file-contract"></i> Detalle del Contrato</h2>
          <button type="button" @click="cerrarModalDetalleContrato" class="close-button" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="detalle-contrato-pdf">
          <div class="detalle-contrato-header">
            <div class="cliente-info">
              <h4><i class="fas fa-user"></i> Información del Cliente</h4>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">{{ clienteDetalle?.nombre || 'Desconocido' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">DNI/CIF:</span>
                <span class="info-value">{{ clienteDetalle?.dniAutorizado?.trim() || clienteDetalle?.cif?.trim() || 'No disponible' }}</span>
              </div>
            </div>
            <div class="contrato-info">
              <h4><i class="fas fa-file-alt"></i> Información del Contrato</h4>
              <div class="info-row">
                <span class="info-label">Nº Contrato:</span>
                <span class="info-value">#{{ contratoDetalle?.contrato }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vigencia:</span>
                <span class="info-value">{{ formatDate(contratoDetalle?.fechaInicio) }} - {{ formatDate(contratoDetalle?.fechaFin) }}</span>
              </div>
            </div>
          </div>
          <div class="detalle-contrato-section">
            <h4><i class="fas fa-info-circle"></i> Datos del Contrato</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Tarifa Luz:</span>
                <span class="info-value"><i class="fas fa-bolt"></i> {{ getTarifaLuzNombre(contratoDetalle?.idTarifaLuz) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tarifa Gas:</span>
                <span class="info-value"><i class="fas fa-fire"></i> {{ getTarifaGasNombre(contratoDetalle?.idTarifaGas) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Comercializadora Actual:</span>
                <span class="info-value"><i class="fas fa-building"></i> {{ getComercializadoraNombre(contratoDetalle?.idComercializadoraActual) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Comercializadora Anterior:</span>
                <span class="info-value"><i class="fas fa-history"></i> {{ getComercializadoraNombre(contratoDetalle?.idComercializadoraAnterior) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Autoconsumo:</span>
                <span class="info-value">
                  <span class="status-chip" :class="{ active: contratoDetalle?.autoconsumo }">
                    <i class="fas fa-solar-panel"></i> {{ contratoDetalle?.autoconsumo ? 'Sí' : 'No' }}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">Denuncia Contrato:</span>
                <span class="info-value">
                  <span class="status-chip denuncia" :class="{ active: contratoDetalle?.denunciaContrato }">
                    <i class="fas fa-exclamation-triangle"></i> 
                    {{ contratoDetalle?.denunciaContrato ? `Sí (${formatDate(contratoDetalle?.fechaDenunciaContrato)})` : 'No' }}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div class="detalle-contrato-section" v-if="contratoDetalle?.observaciones">
            <h4><i class="fas fa-sticky-note"></i> Observaciones</h4>
            <div class="observaciones-content">
              {{ contratoDetalle?.observaciones }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default {
  name: "ModalContratos",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    contratoActual: {
      type: Object,
      default: () => ({
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
        rutaArchivoContrato: "",
      }),
    },
    contratosHistoricos: {
      type: Array,
      required: false,
      default: () => [],
    },
    cliente: {
      type: [Object, Number],
      required: true
    },
    puntoSuministro: {
      type: [Object, Number],
      required: true
    },
    tarifasGas: {
      type: Array,
      required: true,
    },
    tarifasLuz: {
      type: Array,
      required: true,
    },
    comercializadoras: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      pestañaActiva: "actual",
      modoEdicion: false,
      contratoEditandoId: null,
      nuevoContrato: {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
      },
      selectedFile: null,
      mostrarModalDetalleContrato: false,
      contratoDetalle: null,
      clienteDetalle: null,
    };
  },

  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },

    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('es-ES');
    },

    getTarifaLuzNombre(id) {
      const tarifa = this.tarifasLuz.find(t => t.id === id);
      return tarifa ? tarifa.nombre : 'No especificada';
    },

    getTarifaGasNombre(id) {
      const tarifa = this.tarifasGas.find(t => t.id === id);
      return tarifa ? tarifa.nombre : 'No especificada';
    },

    getComercializadoraNombre(id) {
      const comercializadora = this.comercializadoras.find(c => c.id === id);
      return comercializadora ? comercializadora.nombre : 'No especificada';
    },

    editarContrato() {
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = true;
      this.contratoEditandoId = this.contratoActual.id;
      this.nuevoContrato = { ...this.contratoActual };
      this.selectedFile = null;
    },

    async crearNuevoContrato() {
      try {
        const formData = new FormData();
        formData.append('contrato', JSON.stringify(this.nuevoContrato));
        if (this.selectedFile) {
          formData.append('archivo', this.selectedFile);
        }
        formData.append('dniCliente', this.cliente.dni);

        let response;
        if (this.modoEdicion && this.contratoEditandoId) {
          response = await axios.put(
            `${process.env.VUE_APP_API_URL}/api/contratos/${this.contratoEditandoId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        } else {
          response = await axios.post(
            `${process.env.VUE_APP_API_URL}/api/contratos`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        }
        this.$emit("contrato-creado", response.data);
        this.cerrarModal();
      } catch (error) {
        console.error("Error al guardar el contrato:", error);
        alert("Error al guardar el contrato. Por favor, verifica los datos e inténtalo de nuevo.");
      }
    },

    async descargarPDF(contrato) {
      if (!contrato.rutaArchivoContrato) {
        alert('No hay archivo PDF disponible para este contrato');
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/contratos/${contrato.id}/pdf`,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `contrato_${contrato.contrato}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Error al descargar el PDF:", error);
        alert("Error al descargar el PDF del contrato");
      }
    },

    verDetalleContrato(contrato) {
      this.contratoDetalle = contrato;
      this.clienteDetalle = contrato.cliente || this.cliente;
      this.mostrarModalDetalleContrato = true;
    },

    cerrarModal() {
      this.$emit("cerrar-modal");
      this.modoEdicion = false;
      this.contratoEditandoId = null;
      this.nuevoContrato = {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
      };
      this.selectedFile = null;
    },

    cerrarModalDetalleContrato() {
      this.mostrarModalDetalleContrato = false;
      this.contratoDetalle = null;
      this.clienteDetalle = null;
    },

    generarPDFContrato(contrato) {
      // Genera un PDF visual con los datos del contrato
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Detalle del Contrato", 14, 18);
      doc.setFontSize(12);
      doc.text(`Cliente: ${this.cliente?.nombre || ''}`, 14, 30);
      doc.text(`DNI: ${this.cliente?.dni || ''}`, 14, 38);
      doc.text(`Nº Contrato: ${contrato.contrato || ''}`, 14, 46);
      doc.text(`Vigencia: ${this.formatDate(contrato.fechaInicio)} - ${this.formatDate(contrato.fechaFin)}`, 14, 54);
      doc.autoTable({
        startY: 62,
        head: [["Campo", "Valor"]],
        body: [
          ["Tarifa Luz", this.getTarifaLuzNombre(contrato.idTarifaLuz)],
          ["Tarifa Gas", this.getTarifaGasNombre(contrato.idTarifaGas)],
          ["Comercializadora Actual", this.getComercializadoraNombre(contrato.idComercializadoraActual)],
          ["Comercializadora Anterior", this.getComercializadoraNombre(contrato.idComercializadoraAnterior)],
          ["Autoconsumo", contrato.autoconsumo ? "Sí" : "No"],
          ["Denuncia Contrato", contrato.denunciaContrato ? `Sí (${this.formatDate(contrato.fechaDenunciaContrato)})` : "No"],
          ["Observaciones", contrato.observaciones || "Ninguna"],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [252, 215, 0] },
      });
      doc.save(`contrato_${contrato.contrato || 'detalle'}.pdf`);
    },

    mostrarNotificacionSubidaPDF() {
      this.$swal.fire({
        title: 'Función en Desarrollo',
        text: 'La funcionalidad de subida de contratos PDF será implementada según las indicaciones del cliente.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: 'rgba(252, 215, 0)'
      });
    },
  },

  computed: {
    contratosHistoricosOrdenados() {
      return [...this.contratosHistoricos].sort((a, b) => {
        return new Date(b.fechaInicio) - new Date(a.fechaInicio);
      });
    }
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Estilos base del modal modernizado */
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
  font-size: 1.4rem;
  font-weight: 600;
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

/* Sistema de pestañas moderno */
.form-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.tab-btn {
  padding: 15px 25px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 0.95rem;
}

/* Contenedor de pestañas */
.tab-content-container {
  flex: 1;
  background-color: #f8f9fa;
  min-height: 0;
  overflow: hidden;
}

.tab-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* Banner del cliente */
.client-banner {
  background: linear-gradient(135deg, #fff3cd 0%, #fffbe6 100%);
  border-radius: 8px;
  padding: 12px 18px;
  margin-bottom: 18px;
  border: 1px solid #ffe082;
}

.client-info h4 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.client-info span {
  color: #666;
  font-size: 0.9rem;
}

/* Formulario moderno */
.modern-form {
  display: flex;
  flex-direction: column;
  height: calc(100% - 70px);
}

/* Grid modernizado */
.form-grid-modern {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  max-width: 100%;
  flex: 1;
}

.form-section-modern {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 18px;
}

.form-section-modern.full-width {
  grid-column: 1 / -1;
}

/* Encabezados modernos */
.section-header-modern {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-modern i {
  font-size: 1.1rem;
  color: black;
  width: 18px;
}

.section-header-modern h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Grupos de formulario modernos */
.form-group-modern {
  margin-bottom: 12px;
}

.form-group-modern label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  color: black;
}

.form-row-modern {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 18px;
  margin-bottom: 0;
}

.required {
  color: #e74c3c;
  margin-left: 2px;
}

/* Inputs modernos */
.input-with-icon-modern {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.9rem;
  width: 14px;
}

.input-with-icon-modern .form-control-modern {
  padding-left: 32px;
}

.form-control-modern {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  height: 38px;
}

.form-control-modern:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.textarea-modern {
  height: auto !important;
  resize: vertical;
  min-height: 80px;
  line-height: 1.4;
}

/* Selectores modernos */
.select-container-modern {
  position: relative;
  width: 100%;
}

.form-select-modern {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
  height: 38px;
}

.form-select-modern:focus {
  border-color: rgba(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.1);
  outline: none;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
  font-size: 0.8rem;
}

/* Área de subida de PDF */
.pdf-upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.pdf-upload-area:hover {
  border-color: rgba(252, 215, 0);
  background: #fff9e6;
}

.pdf-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.pdf-text {
  flex: 1;
}

.pdf-title {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.pdf-desc {
  display: block;
  font-size: 0.8rem;
  color: #666;
}

.file-selected {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fff6f4;
  border: 1px solid #ffe0db;
  border-radius: 6px;
  color: #e74c3c;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Checkboxes modernos */
.checkbox-section {
  flex: 1;
}

.checkbox-group-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.checkbox-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  position: relative;
}

.checkbox-modern input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
  background: #fff;
}

.checkbox-modern input[type="checkbox"]:checked + .checkmark {
  background: rgba(252, 215, 0);
  border-color: rgba(252, 215, 0);
}

.checkbox-modern input[type="checkbox"]:checked + .checkmark::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
}

.checkbox-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: black;
}

.observations-section {
  flex: 2;
}

/* Botones modernos */
.btn-modern {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  border: none;
  outline: none;
}

.btn-modern:disabled {
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

/* Pie del modal */
.modal-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.required-legend {
  font-size: 1rem;
  color: #777;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* Estilos originales para contrato actual */
.modern-contract-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  padding: 2rem 2rem 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid #f3f3f3;
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.contract-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
}

.contract-number {
  color: black;
  font-weight: 800;
}

.contract-dates {
  color: #444;
  font-size: 1rem;
  margin-top: 0.2rem;
}

.contract-actions {
  display: flex;
  gap: 10px;
}

.modern-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 1.2rem;
}

.modern-section {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 1.2rem 1.5rem 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(255,196,12,0.04);
  border: 1px solid #f3f3f3;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.section-header h5 {
  color: #333;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  margin-bottom: 0.4rem;
  background: #fff;
  border: 1px solid #f0f0f0;
}

.info-label {
  color: #888;
  font-size: 0.97rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: #222;
  font-size: 1.08rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modern-status {
  display: flex;
  gap: 1rem;
  margin: 1.2rem 0 0.5rem 0;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  background: #f7f8fa;
  color: #888;
  font-weight: 600;
  border: 1.5px solid #f0f0f0;
  font-size: 1rem;
  transition: all 0.2s;
}

.status-chip.active {
  background: rgba(252, 215, 0);
  color:black;
  border-color: rgba(252, 215, 0);
}

.status-chip.denuncia.active {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.modern-notes {
  background: #f7f8fa;
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-top: 1.2rem;
  border: 1px solid #f3f3f3;
}

.modern-notes h5 {
  color: black;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 7px;
}

.modern-notes p {
  color: #444;
  font-size: 1rem;
  margin: 0;
}

.no-contract {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 12px;
  color: #6c757d;
}

.no-contract i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #adb5bd;
}

/* Estilos originales para histórico */
.history-table-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  margin-top: 1rem;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.history-table th {
  background: #f8f9fa;
  color: #495057;
  font-weight: 600;
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.history-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.history-row:hover {
  background-color: #f8f9fa;
}

.status-indicators {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.autoconsumo {
  background-color: rgba(252, 215, 0, 0.1);
  color: #856404;
}

.status-badge.denuncia {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.status-badge.normal {
  background-color: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-start;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
  color: #495057;
}

.btn-icon:hover {
  background: rgba(252, 215, 0, 0.1);
  color: rgba(252, 215, 0);
}

.btn-icon.btn-view:hover {
  background: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
}

.btn-icon.btn-download:hover {
  background: rgba(25, 135, 84, 0.1);
  color: #198754;
}

.no-history {
  text-align: center;
  padding: 3rem;
  background: #f8f9fa;
  border-radius: 12px;
  color: #6c757d;
}

.no-history i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #adb5bd;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

/* Modal de detalle - estilos originales */
.detalle-contrato-modal {
  z-index: 2000;
  background: rgba(0,0,0,0.35);
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detalle-contrato-content {
  background: #fff;
  border-radius: 16px;
  max-width: 60%;
  width: 60%;
  max-height: 80%;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
  animation: modalFadeIn 0.3s;
}

.detalle-contrato-content .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  border-radius: 16px 16px 0 0;
}

.detalle-contrato-content .modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.detalle-contrato-content .modal-header h2 i {
  color: rgba(252, 215, 0);
}

.detalle-contrato-pdf {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detalle-contrato-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.cliente-info, .contrato-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cliente-info h4, .contrato-info h4 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cliente-info h4 i, .contrato-info h4 i {
  color: rgba(252, 215, 0);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-label {
  color: #666;
  font-weight: 600;
  font-size: 0.95rem;
}

.info-value {
  color: #2c3e50;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.observaciones-content {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  color: #2c3e50;
  line-height: 1.5;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  background: #f8f9fa;
  color: #666;
  border: 1px solid #e0e0e0;
}

.status-chip.denuncia.active {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.potencia-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.potencia-item {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

.potencia-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.potencia-value {
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

@media (max-width: 768px) {
  .detalle-contrato-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .detalle-contrato-content {
    width: 95vw;
    margin: 10px;
  }
}
</style>