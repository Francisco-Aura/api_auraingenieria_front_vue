<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
      <h2>Gestión de Contratos</h2>
      
      <!-- Tabs para alternar entre las vistas de contratos -->
      <div class="tabs">
        <button :class="{ active: pestañaActiva === 'nuevo' }" @click="pestañaActiva = 'nuevo'">
          <i class="fas fa-plus"></i> Nuevo Contrato
        </button>
        <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">
          <i class="fas fa-file-contract"></i> Contrato Actual
        </button>
        <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">
          <i class="fas fa-history"></i> Histórico
        </button>
      </div>

      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content">
        <!-- Crear nuevo contrato -->
        <div v-if="pestañaActiva === 'nuevo'" class="form-container wide-form">
          <div class="cliente-banner compact-banner">
            <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'Desconocido' }}</h4>
            <span>DNI: {{ cliente?.dni || 'No disponible' }}</span>
          </div>
          <h3 class="form-title">
            {{ modoEdicion ? 'Editar Contrato' : 'Crear Nuevo Contrato' }}
          </h3>
          <form @submit.prevent="crearNuevoContrato" class="modern-form">
            <div class="form-grid grid-3-cols">
              <!-- Sección de Fechas -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas del Contrato</h3>
                </div>
                <div class="form-group">
                  <label for="fechaEnvioContrato">Fecha Envío</label>
                  <div class="input-with-icon">
                    <i class="fas fa-paper-plane icon-prefix"></i>
                    <input type="date" id="fechaEnvioContrato" v-model="nuevoContrato.fechaEnvio" required />
                  </div>
                </div>
                <div class="form-group">
                  <label for="fechaInicioContrato">Fecha Inicio</label>
                  <div class="input-with-icon">
                    <i class="fas fa-play icon-prefix"></i>
                    <input type="date" id="fechaInicioContrato" v-model="nuevoContrato.fechaInicio" required />
                  </div>
                </div>
                <div class="form-group">
                  <label for="fechaFinContrato">Fecha Fin</label>
                  <div class="input-with-icon">
                    <i class="fas fa-stop icon-prefix"></i>
                    <input type="date" id="fechaFinContrato" v-model="nuevoContrato.fechaFin" required />
                  </div>
                </div>
              </div>
              <!-- Sección de Información del Contrato -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-file-contract"></i>
                  <h3>Información del Contrato</h3>
                </div>
                <div class="form-group">
                  <label for="contrato">Número de Contrato</label>
                  <div class="input-with-icon">
                    <i class="fas fa-hashtag icon-prefix"></i>
                    <input type="text" id="contrato" v-model="nuevoContrato.contrato" required />
                  </div>
                </div>
                <div class="form-group">
                  <label for="tarifaGas">Tarifa Gas</label>
                  <div class="select-container">
                    <select id="tarifaGas" v-model="nuevoContrato.idTarifaGas" required>
                      <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
                <div class="form-group">
                  <label for="tarifaLuz">Tarifa Luz</label>
                  <div class="select-container">
                    <select id="tarifaLuz" v-model="nuevoContrato.idTarifaLuz" required>
                      <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>
              <!-- Sección de archivo PDF -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-file-pdf"></i>
                  <h3>Documento del Contrato</h3>
                </div>
                <div class="pdf-dropzone" @click="mostrarNotificacionSubidaPDF">
                  <div class="pdf-icon-circle">
                    <i class="fas fa-file-pdf"></i>
                  </div>
                  <div class="pdf-dropzone-text">
                    <span class="dropzone-title">Subir contrato PDF</span>
                    <span class="dropzone-desc">Arrastra el archivo aquí o haz clic para seleccionar</span>
                  </div>
                  <input type="file" ref="pdfInput" @change="handleFileUpload" accept=".pdf" style="display:none" />
                </div>
                <div v-if="selectedFile" class="file-name-selected">
                  <i class="fas fa-file-pdf"></i> {{ selectedFile.name }}
                </div>
              </div>
              <!-- Sección de Opciones y Observaciones -->
              <div class="form-section card">
                <div class="section-header">
                  <i class="fas fa-cog"></i>
                  <h3>Opciones y Observaciones</h3>
                </div>
                <div class="form-row">
                  <div class="checkbox-group">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="nuevoContrato.autoconsumo" />
                      <span>Autoconsumo</span>
                    </label>
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="nuevoContrato.denunciaContrato" />
                      <span>Denuncia Contrato</span>
                    </label>
                  </div>
                  <div class="form-group" v-if="nuevoContrato.denunciaContrato">
                    <label for="fechaDenunciaContrato">Fecha Denuncia</label>
                    <div class="input-with-icon">
                      <i class="fas fa-exclamation-triangle icon-prefix"></i>
                      <input type="date" id="fechaDenunciaContrato" v-model="nuevoContrato.fechaDenunciaContrato" />
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label for="observaciones">Observaciones</label>
                  <textarea id="observaciones" v-model="nuevoContrato.observaciones" rows="3" 
                    placeholder="Añada aquí cualquier observación relevante sobre el contrato..."></textarea>
                </div>
              </div>
            </div>
            <div class="form-actions sticky-actions">
              <button type="button" @click="cerrarModal" class="btn btn-secondary">
                <i class="fas fa-times"></i> Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Contrato' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Visualizar contrato actual -->
        <div v-if="pestañaActiva === 'actual'" class="current-contract">
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
        
        <!-- Histórico de contratos -->
        <div v-if="pestañaActiva === 'historico'" class="contract-history">
          <h3>Histórico de Contratos</h3>
          <div v-if="contratosHistoricos.length" class="history-timeline">
            <div v-for="contrato in contratosHistoricos" :key="contrato.id" class="history-item">
              <div class="history-date">
                <span class="date">{{ formatDate(contrato.fechaInicio) }}</span>
                <span class="year">{{ new Date(contrato.fechaInicio).getFullYear() }}</span>
              </div>
              <div class="history-content">
                <h4>Contrato #{{ contrato.contrato }}</h4>
                <div class="history-details">
                  <p><strong>Período:</strong> {{ formatDate(contrato.fechaInicio) }} - {{ formatDate(contrato.fechaFin) }}</p>
                  <p><strong>Tarifa Luz:</strong> {{ getTarifaLuzNombre(contrato.idTarifaLuz) }}</p>
                  <p><strong>Tarifa Gas:</strong> {{ getTarifaGasNombre(contrato.idTarifaGas) }}</p>
                </div>
                <div class="history-actions">
                  <button @click="verDetalleContrato(contrato)" class="btn btn-secondary">
                    <i class="fas fa-eye"></i> Ver Detalle
                  </button>
                  <button @click="descargarPDF(contrato)" class="btn btn-secondary" v-if="contrato.rutaArchivoContrato">
                    <i class="fas fa-download"></i> PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-history">
            <i class="fas fa-history"></i>
            <p>No hay contratos históricos disponibles</p>
          </div>
        </div>
      </div>
      <!-- MODAL DETALLE CONTRATO -->
      <div v-if="mostrarModalDetalleContrato" class="modal-overlay detalle-contrato-modal">
        <div class="modal-content detalle-contrato-content">
          <button type="button" @click="cerrarModalDetalleContrato" class="close-button" aria-label="Cerrar">&times;</button>
          <div class="detalle-contrato-pdf">
            <h2><i class="fas fa-file-contract"></i> Detalle del Contrato</h2>
            <div class="detalle-contrato-header">
              <div>
                <strong>Cliente:</strong> {{ cliente?.nombre || 'Desconocido' }}<br>
                <strong>DNI:</strong> {{ cliente?.dni || 'No disponible' }}
              </div>
              <div>
                <strong>Nº Contrato:</strong> {{ contratoDetalle?.contrato }}<br>
                <strong>Vigencia:</strong> {{ formatDate(contratoDetalle?.fechaInicio) }} - {{ formatDate(contratoDetalle?.fechaFin) }}
              </div>
            </div>
            <div class="detalle-contrato-section">
              <h4>Datos del Contrato</h4>
              <ul>
                <li><b>Tarifa Luz:</b> {{ getTarifaLuzNombre(contratoDetalle?.idTarifaLuz) }}</li>
                <li><b>Tarifa Gas:</b> {{ getTarifaGasNombre(contratoDetalle?.idTarifaGas) }}</li>
                <li><b>Comercializadora Actual:</b> {{ getComercializadoraNombre(contratoDetalle?.idComercializadoraActual) }}</li>
                <li><b>Comercializadora Anterior:</b> {{ getComercializadoraNombre(contratoDetalle?.idComercializadoraAnterior) }}</li>
                <li><b>Autoconsumo:</b> <span v-if="contratoDetalle?.autoconsumo">Sí</span><span v-else>No</span></li>
                <li><b>Denuncia Contrato:</b> <span v-if="contratoDetalle?.denunciaContrato">Sí ({{ formatDate(contratoDetalle?.fechaDenunciaContrato) }})</span><span v-else>No</span></li>
                <li><b>Observaciones:</b> {{ contratoDetalle?.observaciones || 'Ninguna' }}</li>
              </ul>
            </div>
            <div class="detalle-contrato-actions">
              <button v-if="contratoDetalle?.rutaArchivoContrato" @click="descargarPDF(contratoDetalle)" class="btn btn-primary">
                <i class="fas fa-download"></i> Descargar PDF
              </button>
              <button v-else @click="generarPDFContrato(contratoDetalle)" class="btn btn-primary">
                <i class="fas fa-file-pdf"></i> Generar PDF
              </button>
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
      type: Object,
      default: () => ({}),
    },
    puntoSuministro: {
      type: Object,
      default: () => ({}),
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
        headStyles: { fillColor: [255, 196, 12] },
      });
      doc.save(`contrato_${contrato.contrato || 'detalle'}.pdf`);
    },

    mostrarNotificacionSubidaPDF() {
      this.$swal.fire({
        title: 'Función en Desarrollo',
        text: 'La funcionalidad de subida de contratos PDF será implementada según las indicaciones del cliente.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#ffc107'
      });
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  width: 100%;
  height: 100%;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  width: 95%;
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease-out;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #ffe082;
  padding-bottom: 1rem;
}

.tabs button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: black;
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-weight: 600;
}

.tabs button:hover {
  background: #fffbe6;
  color: black;
}

.tabs button.active {
  background: #ffc40c;
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 196, 12, 0.15);
}

.tabs button i {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}

.form-container {
  max-width: 95%;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-section {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  padding: 20px;
  transition: box-shadow 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header i {
  font-size: 1.2rem;
  color: #ffc40c;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.input-with-icon {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.9rem;
}

.input-with-icon input {
  padding-left: 38px;
}

.form-control {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #333;
  background-color: #f9fafc;
}

.form-control:focus {
  border-color: #ffc40c;
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.15);
  outline: none;
  background-color: #fff;
}

.select-container {
  position: relative;
  width: 100%;
}

select {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  color: #333;
  background-color: #f9fafc;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
}

select:focus {
  border-color: #ffc40c;
  box-shadow: 0 0 0 3px rgba(255, 196, 12, 0.15);
  outline: none;
  background-color: #fff;
}

.select-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #555;
  pointer-events: none;
}

.file-upload-section {
  margin: 1rem 0;
  text-align: center;
}

.file-upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 2rem;
  background: #f8f9fa;
  border: 2px dashed #ffc40c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ffc40c;
  font-weight: 500;
}

.file-upload-label:hover {
  background: rgba(255, 196, 12, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 196, 12, 0.1);
}

.checkbox-group {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border: 2px solid #ffc40c;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
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

.btn-primary {
  background: #ffc40c;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 196, 12, 0.2);
}

.btn-secondary {
  background: #6c757d;
  color: white;
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.full-width {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}

.cliente-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #e0e0e0;
}

.cliente-info h4 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
}

.cliente-info p {
  color: #666;
  margin: 0;
}

.contract-details {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.contract-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.contract-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.contract-section h5 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.info-item .label {
  color: #666;
  font-weight: 500;
}

.info-item .value {
  color: #2c3e50;
  font-weight: 600;
  text-align: left;
}

.contract-status {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.status-item.active {
  background: #28a745;
  color: white;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
}

.contract-notes {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.history-item {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
}

.history-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.history-date .date {
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
}

.history-date .year {
  color: #666;
}

.history-content {
  flex: 1;
}

.history-details {
  margin: 1rem 0;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.history-actions {
  display: flex;
  gap: 1rem;
}

.no-contract,
.no-history {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

.no-contract i,
.no-history i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #007bff;
  opacity: 0.5;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
  transform: rotate(90deg);
}

/* Animaciones para las transiciones de pestañas */
.tab-content > div {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Estilos para los botones de acción */
.history-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.history-actions .btn i {
  font-size: 1rem;
}

/* Mejoras en los inputs de fecha */
input[type="date"] {
  font-family: inherit;
  cursor: pointer;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  padding: 0.5rem;
  margin-right: -0.5rem;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* Estilos para el scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.centered-form {
  max-width: 900px;
  margin: 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 32px rgba(0,0,0,0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cliente-banner {
  width: 100%;
  background: linear-gradient(90deg, #fffbe6 0%, #fff3cd 100%);
  border-radius: 10px;
  padding: 1rem 2rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(255,196,12,0.07);
  border: 1px solid #ffe082;
}
.cliente-banner h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cliente-banner span {
  color: #666;
  font-size: 1rem;
}

.form-title {
  width: 100%;
  text-align: left;
  margin-bottom: 1.5rem;
  color: #222;
  font-size: 1.3rem;
  font-weight: 700;
}

.horizontal-grid {
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  width: 100%;
  margin-bottom: 24px;
}

@media (max-width: 900px) {
  .horizontal-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .centered-form {
    padding: 1.2rem 0.5rem;
  }
}

.wide-form {
  max-width: 90%;
  width: 90vw;
  margin: 2.5rem auto 0 auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 32px rgba(0,0,0,0.08);
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.compact-banner {
  min-height: 48px;
  padding: 0.5rem 1.5rem;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.grid-3-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  width: 100%;
  margin-bottom: 18px;
}
.form-section.card {
  min-width: 0;
  padding: 16px 14px 10px 14px;
  margin-bottom: 0;
}
.form-title {
  margin-bottom: 1rem;
  font-size: 1.15rem;
}
.sticky-actions {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding: 1rem 0 0.5rem 0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  z-index: 10;
  border-top: 1px solid #ffe082;
}
@media (max-width: 1200px) {
  .grid-3-cols {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 900px) {
  .grid-3-cols {
    grid-template-columns: 1fr;
  }
  .wide-form {
    padding: 0.5rem 0.2rem;
  }
  .sticky-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
.modern-contract-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  padding: 2rem 2rem 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid #f3f3f3;
}
.modern-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
.section-header i {
  color: #ffc40c;
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
.contract-number {
  color: #ffc40c;
  font-weight: 800;
}
.contract-dates {
  color: #444;
  font-size: 1rem;
  margin-top: 0.2rem;
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
  background: #ffc40c;
  color: #fff;
  border-color: #ffc40c;
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
  color: #ffc40c;
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
@media (max-width: 900px) {
  .modern-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .modern-contract-card {
    padding: 1rem 0.5rem 1rem 0.5rem;
  }
}
.pdf-dropzone {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  background: #f7f8fa;
  border: 2px dashed #bbb;
  border-radius: 10px;
  padding: 1.2rem 1.5rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  margin-bottom: 0.5rem;
}
.pdf-dropzone:hover {
  border-color: #ffc40c;
  box-shadow: 0 2px 8px rgba(255,196,12,0.08);
}
.pdf-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  box-shadow: 0 2px 8px rgba(231,76,60,0.10);
}
.pdf-dropzone-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.dropzone-title {
  color: #222;
  font-weight: 700;
  font-size: 1.08rem;
}
.dropzone-desc {
  color: #888;
  font-size: 0.97rem;
}
.file-name-selected {
  margin-top: 0.5rem;
  color: #e74c3c;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 7px;
  background: #fff6f4;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  border: 1px solid #ffe0db;
}
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
  max-width: 600px;
  width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: 2.5rem 2rem 2rem 2rem;
  position: relative;
  animation: modalFadeIn 0.3s;
}
.detalle-contrato-pdf {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.detalle-contrato-header {
  display: flex;
  justify-content: space-between;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}
.detalle-contrato-section {
  background: #f9fafc;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 0.5rem;
}
.detalle-contrato-section h4 {
  color: #ffc40c;
  margin-bottom: 0.7rem;
}
.detalle-contrato-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.detalle-contrato-section li {
  margin-bottom: 0.4rem;
  font-size: 1.01rem;
}
.detalle-contrato-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
</style>
