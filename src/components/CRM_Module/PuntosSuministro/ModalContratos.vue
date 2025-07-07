<template>
  <div v-if="visible" class="modal-overlay">
    <!-- Loading spinner -->
    <Spinner :isLoading="cargandoDatos" />
    
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
          :disabled="!tieneContratoVigente"
          :title="!tieneContratoVigente ? 'No hay contrato vigente' : ''"
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
      <div v-if="cargandoDatos" class="modal-loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Cargando datos del contrato...</p>
        </div>
      </div>
      
      <div v-else class="tab-content-container">
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
                  <label for="tarifaGas">
                    <i class="fas fa-fire" :class="{ 'text-active': esGas, 'text-disabled': !esGas }"></i>
                    Tarifa Gas <span v-if="esGas" class="required">*</span>
                  </label>
                  <div class="select-container-modern">
                    <select 
                      id="tarifaGas" 
                      v-model="nuevoContrato.idTarifaGas" 
                      class="form-select-modern" 
                      :disabled="!esGas"
                      :required="esGas"
                    >
                      <option v-if="esGas" value="">Seleccione...</option>
                      <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="tarifaLuz">
                    <i class="fas fa-bolt" :class="{ 'text-active': esLuz, 'text-disabled': !esLuz }"></i>
                    Tarifa Luz <span v-if="esLuz" class="required">*</span>
                  </label>
                  <div class="select-container-modern">
                    <select 
                      id="tarifaLuz" 
                      v-model="nuevoContrato.idTarifaLuz" 
                      class="form-select-modern" 
                      :disabled="!esLuz"
                      :required="esLuz"
                    >
                      <option v-if="esLuz" value="">Seleccione...</option>
                      <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>
              
              <!-- Nueva Sección de Potencias Contratadas -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-bolt"></i>
                  <h3>Potencias Contratadas</h3>
                </div>
                
                <div class="potencias-contratadas">
                  <div class="potencias-grid">
                    <div class="potencia-item" v-for="n in 6" :key="n">
                      <label :for="'pot' + n">Potencia P{{ n }} (kw)</label>
                      <div class="input-icon-group">
                        <i class="fas fa-bolt"></i>
                        <input :id="'pot' + n" v-model="nuevoContrato['pot' + n]" type="number" step="0.01" min="0" />
                      </div>
                    </div>
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

              <!-- Sección de Autoconsumo -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-solar-panel"></i>
                  <h3>Autoconsumo</h3>
                </div>
                
                <div class="form-group-modern">
                  <div v-if="tieneAutoconsumo" class="info-badge-modern success">
                    <i class="fas fa-info-circle"></i>
                    Este punto de suministro tiene autoconsumo configurado: <strong>{{ puntoSuministroData?.autoconsumo }}</strong>
                  </div>
                  <div v-else class="info-badge-modern neutral">
                    <i class="fas fa-info-circle"></i>
                    Este punto de suministro no tiene autoconsumo configurado
                  </div>
                </div>
              </div>

              <!-- Sección de Observaciones -->
              <div class="form-section-modern full-width">
                <div class="section-header-modern">
                  <i class="fas fa-comment-alt"></i>
                  <h3>Observaciones</h3>
                </div>
                
                <div class="form-group-modern">
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

            <!-- Botones de acción dentro del formulario -->
            <div class="modal-footer-modern">
              <div class="required-legend"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
                <button type="button" @click="cerrarModal" class="btn-modern btn-secondary">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button v-if="!modoRenovacion" type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-save"></i> {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Contrato' }}
                </button>
                <button v-if="modoRenovacion" type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-sync-alt"></i> Guardar y Renovar
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Visualizar contrato actual -->
        <div v-if="pestañaActiva === 'actual'" class="tab-content">
          <h3>Contrato Actual</h3>
          <div v-if="contratoVigente" class="contract-details modern-contract-card">
            <div class="contract-header">
              <div class="contract-info">
                <h4>Contrato <span class="contract-number">#{{ contratoVigente.contrato }}</span></h4>
                <p class="contract-dates"><i class="fas fa-calendar-alt"></i> Vigente desde <b>{{ formatDate(contratoVigente.fechaInicio) }}</b> hasta <b>{{ formatDate(contratoVigente.fechaFin) }}</b></p>
              </div>
              <div class="contract-actions">
                <button @click="descargarPDF(contratoVigente)" class="btn btn-secondary" v-if="contratoVigente.rutaArchivoContrato">
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
                  <span class="info-value"><i class="fas fa-paper-plane"></i> {{ formatDate(contratoVigente.fechaEnvio) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarifa Luz</span>
                  <span class="info-value"><i class="fas fa-bolt"></i> {{ getTarifaLuzNombre(contratoVigente.idTarifaLuz) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tarifa Gas</span>
                  <span class="info-value"><i class="fas fa-fire"></i> {{ getTarifaGasNombre(contratoVigente.idTarifaGas) }}</span>
                </div>
              </div>
              <div class="contract-section modern-section">
                <div class="section-header">
                  <i class="fas fa-industry"></i>
                  <h5>Comercializadoras</h5>
                </div>
                <div class="info-row">
                  <span class="info-label">Actual</span>
                  <span class="info-value"><i class="fas fa-building"></i> {{ getComercializadoraNombre(contratoVigente.idComercializadoraActual) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Anterior</span>
                  <span class="info-value"><i class="fas fa-history"></i> {{ getComercializadoraNombre(contratoVigente.idComercializadoraAnterior) }}</span>
                </div>
              </div>
            </div>
            
            <!-- Sección de Autoconsumo y Denuncia mejorada -->
            <div class="features-section">
              <div class="features-header">
                <i class="fas fa-cog"></i>
                <h5>Características Especiales</h5>
              </div>
              
              <div class="feature-cards">
                <!-- Tarjeta de autoconsumo -->
                <div class="feature-card" :class="{'feature-active': tieneAutoconsumo}">
                  <div class="feature-icon">
                    <i class="fas fa-solar-panel"></i>
                  </div>
                  <div class="feature-details">
                    <h6 class="feature-title">Autoconsumo</h6>
                    <p class="feature-status">
                      {{ tieneAutoconsumo ? puntoSuministroData?.autoconsumo || 'Activado' : 'No activado' }}
                    </p>
                  </div>
                </div>
                
                <!-- Tarjeta de denuncia -->
                <div class="feature-card denuncia" :class="{'feature-active': contratoVigente.denunciaContrato}">
                  <div class="feature-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                  </div>
                  <div class="feature-details">
                    <h6 class="feature-title">Denuncia de Contrato</h6>
                    <p class="feature-status">
                      {{ contratoVigente.denunciaContrato ? `Denunciado el ${formatDate(contratoVigente.fechaDenunciaContrato)}` : 'Sin denuncia' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="potencia-section">
              <div class="section-header">
                <i class="fas fa-bolt"></i>
                <h5>Potencias Contratadas</h5>
              </div>
              <div class="potencia-grid">
                <div class="potencia-item">
                  <span class="potencia-label">P1:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia1 }} kW</span>
                </div>
                <div class="potencia-item">
                  <span class="potencia-label">P2:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia2 }} kW</span>
                </div>
                <div class="potencia-item">
                  <span class="potencia-label">P3:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia3 }} kW</span>
                </div>
                <div class="potencia-item">
                  <span class="potencia-label">P4:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia4 }} kW</span>
                </div>
                <div class="potencia-item">
                  <span class="potencia-label">P5:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia5 }} kW</span>
                </div>
                <div class="potencia-item">
                  <span class="potencia-label">P6:</span>
                  <span class="potencia-value">{{ contratoVigente.potencia6 }} kW</span>
                </div>
              </div>
            </div>
            
            <div class="contract-notes modern-notes" v-if="contratoVigente.observaciones">
              <h5><i class="fas fa-sticky-note"></i> Observaciones</h5>
              <p>{{ contratoVigente.observaciones }}</p>
            </div>
          </div>
          <div v-else class="no-contract">
            <i class="fas fa-file-contract"></i>
            <p>No hay contrato actual activo</p>
          </div>
        </div>
        
        <!-- Histórico de contratos -->
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
                    <button @click="editarContratoHistorico(contrato)" class="btn-icon btn-edit" title="Editar contrato histórico">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button @click="renovarContratoHistorico(contrato)" class="btn-icon btn-renew" title="Renovar contrato histórico" :disabled="tieneContratoVigente">
                      <i class="fas fa-sync-alt"></i>
                    </button>
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
          
          <!-- Nueva sección de potencias contratadas en la vista de detalle -->
          <div class="detalle-contrato-section">
            <h4><i class="fas fa-bolt"></i> Potencias Contratadas</h4>
            <div class="potencia-grid-detalle">
              <div class="potencia-item-detalle">
                <span class="potencia-label">P1:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia1 || 0 }} kW</span>
              </div>
              <div class="potencia-item-detalle">
                <span class="potencia-label">P2:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia2 || 0 }} kW</span>
              </div>
              <div class="potencia-item-detalle">
                <span class="potencia-label">P3:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia3 || 0 }} kW</span>
              </div>
              <div class="potencia-item-detalle">
                <span class="potencia-label">P4:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia4 || 0 }} kW</span>
              </div>
              <div class="potencia-item-detalle">
                <span class="potencia-label">P5:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia5 || 0 }} kW</span>
              </div>
              <div class="potencia-item-detalle">
                <span class="potencia-label">P6:</span>
                <span class="potencia-value">{{ contratoDetalle?.potencia6 || 0 }} kW</span>
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
import Spinner from "@/components/SpinnerComponent.vue";

export default {
  name: "ModalContratos",
  components: {
    Spinner
  },
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
    contratos: {
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
      pestañaActiva: "actual", // Se determinará automáticamente en el watcher
      modoEdicion: false,
      contratoEditandoId: null,
      cargandoDatos: true, // Nuevo estado de loading
      nuevoContrato: {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas: "", // Se inicializará en mounted/inicializarNuevoContrato
        idTarifaLuz: "", // Se inicializará en mounted/inicializarNuevoContrato
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
      modoRenovacion: false,
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
      if (!id || id === '') return 'Sin Tarifa';
      
      // Si las tarifas no están cargadas aún
      if (!this.tarifasLuz || !this.tarifasLuz.length) {
        console.warn("No se han cargado las tarifas de luz aún");
        return 'Cargando...';
      }
      
      const tarifa = this.tarifasLuz.find(t => t.id == id); // Usar == en lugar de ===
      
      if (!tarifa) {
        console.warn(`No se encontró la tarifa de luz con ID: ${id}`, this.tarifasLuz);
        return 'Tarifa Desconocida';
      }
      
      return tarifa.nombre;
    },

    getTarifaGasNombre(id) {
      if (!id || id === '') return 'Sin Tarifa';
      
      // Si las tarifas no están cargadas aún
      if (!this.tarifasGas || !this.tarifasGas.length) {
        console.warn("No se han cargado las tarifas de gas aún");
        return 'Cargando...';
      }
      
      const tarifa = this.tarifasGas.find(t => t.id == id); // Usar == en lugar de ===
      
      if (!tarifa) {
        console.warn(`No se encontró la tarifa de gas con ID: ${id}`, this.tarifasGas);
        return 'Tarifa Desconocida';
      }
      
      return tarifa.nombre;
    },

    getComercializadoraNombre(id) {
      const comercializadora = this.comercializadoras.find(c => c.id === id);
      return comercializadora ? comercializadora.nombre : 'No especificada';
    },

    editarContrato() {
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = true;
      this.contratoEditandoId = this.contratoVigente.id;
      this.nuevoContrato = { ...this.contratoVigente };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = this.contratoVigente['potencia' + i] || 0;
      }
      this.selectedFile = null;
    },

    editarContratoHistorico(contrato) {
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = true;
      this.contratoEditandoId = contrato.id;
      this.nuevoContrato = { ...contrato };
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = contrato['potencia' + i] || 0;
      }
      this.selectedFile = null;
      this.modoRenovacion = false;
    },

    renovarContratoHistorico(contrato) {
      if (this.tieneContratoVigente) return; // Seguridad extra
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.nuevoContrato = {
        ...contrato,
        id: undefined,
        fecha: '',
        fechaEnvio: '',
        fechaInicio: '',
        fechaFin: '',
        fechaDenunciaContrato: '',
        denunciaContrato: 0,
        rutaArchivoContrato: '',
      };
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = contrato['potencia' + i] || 0;
      }
      this.selectedFile = null;
    },

    async crearNuevoContrato() {
      try {
        // Copiar los valores de los inputs pot1...pot6 a potencia1...potencia6 antes de enviar
        for (let i = 1; i <= 6; i++) {
          this.nuevoContrato['potencia' + i] = this.nuevoContrato['pot' + i];
        }
        this.$swal.fire({
          title: 'Guardando contrato...',
          text: 'Por favor, espere mientras se procesa la información.',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            this.$swal.showLoading();
          }
        });

        let response;
        // Si tenemos un archivo seleccionado, enviamos como multipart/form-data
        if (this.selectedFile) {
          const formData = new FormData();
          formData.append('contrato', JSON.stringify(this.nuevoContrato));
          formData.append('archivo', this.selectedFile);
          
          if (this.cliente.dni) {
            formData.append('dniCliente', this.cliente.dni);
          }

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
        } 
        // Si no hay archivo, enviamos como JSON directamente
        else {
          if (this.modoEdicion && this.contratoEditandoId) {
            response = await axios.put(
              `${process.env.VUE_APP_API_URL}/api/contratos/${this.contratoEditandoId}`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          } else {
            response = await axios.post(
              `${process.env.VUE_APP_API_URL}/api/contratos`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
        
        console.log('Contrato guardado exitosamente:', response.data);
        
        // Mostrar mensaje de éxito
        await this.$swal.fire({
          title: this.modoEdicion ? 'Contrato actualizado' : 'Contrato creado',
          text: this.modoEdicion 
            ? 'El contrato ha sido actualizado correctamente.' 
            : 'El nuevo contrato ha sido creado correctamente.',
          icon: 'success',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Notificar al componente padre de forma simple
        this.$emit("contrato-creado", response.data);
        
        // Cerrar el modal
        this.cerrarModal();
        
      } catch (error) {
        console.error("Error al guardar el contrato:", error);
        this.$swal.fire({
          title: 'Error',
          text: `No se pudo ${this.modoEdicion ? 'actualizar' : 'crear'} el contrato. Por favor, verifica los datos e inténtalo de nuevo.`,
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
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

    // Determinar qué pestaña mostrar inicialmente basándose en si hay contrato vigente
    determinarPestañaInicial() {
      if (this.tieneContratoVigente) {
        // Si hay contrato vigente, mostrar la pestaña "actual" para visualizar/editar
        this.pestañaActiva = 'actual';
        console.log('→ Mostrando pestaña ACTUAL (hay contrato vigente)');
      } else {
        // Si no hay contrato vigente, mostrar la pestaña "nuevo" para crear uno
        this.pestañaActiva = 'nuevo';
        console.log('→ Mostrando pestaña NUEVO (no hay contrato vigente)');
      }
    },

    // Inicializar el formulario de nuevo contrato basado en el punto de suministro
    inicializarNuevoContrato() {
      // Obtener IDs de "Sin Tarifa" de manera segura
      const idSinTarifaGas = this.tarifasGas?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
      const idSinTarifaLuz = this.tarifasLuz?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
      
      // Determinar el tipo de punto de suministro
      const tieneGas = this.puntoSuministroData?.cupsgas && this.puntoSuministroData.cupsgas.trim() !== '';
      const tieneLuz = this.puntoSuministroData?.cupsluz && this.puntoSuministroData.cupsluz.trim() !== '';
      
      console.log('Inicializando nuevo contrato con:', {
        tieneGas,
        tieneLuz,
        idSinTarifaGas,
        idSinTarifaLuz,
        tieneAutoconsumo: this.tieneAutoconsumo,
        cupsgas: this.puntoSuministroData?.cupsgas,
        cupsluz: this.puntoSuministroData?.cupsluz
      });
      
      this.nuevoContrato = {
        idCliente: this.cliente?.id || "",
        idPuntoSuministro: this.puntoSuministroData?.id || "",        
        fecha: "",
        fechaEnvio: "",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        // Lógica simplificada para las tarifas
        idTarifaGas: tieneGas ? "" : idSinTarifaGas,
        idTarifaLuz: tieneLuz ? "" : idSinTarifaLuz,
        potencia1: 0,        
        potencia2: 0,
        potencia3: 0,
        potencia4: 0,
        potencia5: 0,
        potencia6: 0,
        consumoAnual: 0,
        exencionImpuestoElectricidad: 0,
        idComercializadoraActual: 0,
        idComercializadoraAnterior: 0,
        autoconsumo: this.tieneAutoconsumo ? 1 : 0,
        denunciaContrato: 0,
        fechaDenunciaContrato: "",
        observaciones: "",
      };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = 0;
      }
      this.selectedFile = null;
    },

    cerrarModal() {
      this.$emit('cerrar-modal');
      // Resetear el modo edición al cerrar
      this.modoEdicion = false;
      this.contratoEditandoId = null;
      // No resetear pestañaActiva aquí, se determinará automáticamente la próxima vez que se abra
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
    },
    
    // Obtener los datos del punto de suministro
    puntoSuministroData() {
      // El puntoSuministro ahora siempre será un objeto completo
      return this.puntoSuministro;
    },
    
    // Verificar si el punto de suministro tiene autoconsumo configurado
    tieneAutoconsumo() {
      return this.puntoSuministroData && 
             this.puntoSuministroData.autoconsumo && 
             this.puntoSuministroData.autoconsumo.trim() !== '' &&
             this.puntoSuministroData.autoconsumo !== null;
    },
    
    // Determinar si el punto de suministro es de Gas
    esGas() {
      return this.puntoSuministroData?.cupsgas && 
             this.puntoSuministroData.cupsgas.trim() !== '';
    },
    
    // Determinar si el punto de suministro es de Luz
    esLuz() {
      return this.puntoSuministroData?.cupsluz && 
             this.puntoSuministroData.cupsluz.trim() !== '';
    },
    
    // Obtener el tipo de punto de suministro
    tipoPuntoSuministro() {
      if (this.esLuz) return 'Luz';
      if (this.esGas) return 'Gas';
      return '';
    },
    
    // Obtener el ID de "Sin Tarifa" para gas
    idSinTarifaGas() {
      const sinTarifa = this.tarifasGas.find(t => t.nombre === 'Sin Tarifa');
      return sinTarifa ? sinTarifa.id : '';
    },
    
    // Obtener el ID de "Sin Tarifa" para luz
    idSinTarifaLuz() {
      const sinTarifa = this.tarifasLuz.find(t => t.nombre === 'Sin Tarifa');
      return sinTarifa ? sinTarifa.id : '';
    },
    

    
    // Calcular el contrato actual internamente basándose en los contratos recibidos
    contratoActualCalculado() {
      if (!this.contratos || this.contratos.length === 0) {
        return null;
      }
      
      const ahora = new Date();
      const contratoVigente = this.contratos.find(
        (contrato) => {
          const fechaFin = new Date(contrato.fechaFin);
          const fechaInicio = new Date(contrato.fechaInicio);
          return fechaInicio <= ahora && fechaFin > ahora;
        }
      );
      
      return contratoVigente || null;
    },
    
    // Verificar si hay un contrato vigente basándose en el cálculo interno
    tieneContratoVigente() {
      const contrato = this.contratoActualCalculado;
      return contrato && 
             contrato.id && 
             contrato.contrato &&
             contrato.contrato.toString().trim() !== '';
    },
    
    // Contrato vigente unificado (usa contratoActual del padre o calcula internamente)
    contratoVigente() {
      return this.contratoActual || this.contratoActualCalculado;
    }
  },
  watch: {
    // Cuando se abre el modal, determinar la pestaña inicial y configurar el formulario
    visible: {
      handler(newVal) {
        if (newVal) {
          this.cargandoDatos = true; // Iniciar loading
          
          console.log('Modal abierto, datos disponibles:', {
            contratos: this.contratos?.length || 0,
            contratoActual: this.contratoActual,
            contratoCalculado: this.contratoActualCalculado,
            tieneContrato: this.tieneContratoVigente
          });
          
          // Establecer un timeout máximo para asegurar que el spinner no se quede para siempre
          setTimeout(() => {
            if (this.cargandoDatos) {
              console.log('Forzando fin de carga después del tiempo máximo');
              this.cargandoDatos = false;
            }
          }, 5000); // 5 segundos máximo de espera
          
          // Usar nextTick para asegurar que todas las props estén cargadas
          this.$nextTick(() => {
            try {
              this.determinarPestañaInicial();
              
              // Si no hay contrato vigente, inicializar el formulario de nuevo contrato
              if (!this.tieneContratoVigente && !this.modoEdicion) {
                console.log('Inicializando formulario de nuevo contrato...');
                this.inicializarNuevoContrato();
              }
            } catch (error) {
              console.error("Error al inicializar el modal:", error);
            } finally {
              // Finalizar loading en cualquier caso para evitar que se quede cargando infinitamente
              this.cargandoDatos = false;
            }
          });
        } else {
          // Resetear estado cuando se cierra el modal
          this.cargandoDatos = false;
          this.modoEdicion = false;
        }
      },
      immediate: true
    },
    
    // Cuando cambia el contrato actual, redeterminar la pestaña
    contratoActual: {
      handler(newVal, oldVal) {
        if (this.visible && newVal !== oldVal) {
          console.log('contratoActual cambió, redeterminando pestaña...');
          this.$nextTick(() => {
            this.determinarPestañaInicial();
          });
        }
      },
      deep: true
    },
    
    // Cuando cambian los contratos, redeterminar la pestaña
    contratos: {
      handler(newVal, oldVal) {
        if (this.visible && newVal !== oldVal) {
          console.log('contratos cambió, redeterminando pestaña...');
          this.$nextTick(() => {
            this.determinarPestañaInicial();
          });
        }
      },
      deep: true
    },
    
    // Cuando cambia el punto de suministro, reinicializar si estamos en modo crear
    puntoSuministro: {
      handler() {
        if (this.visible && !this.tieneContratoVigente && !this.modoEdicion) {
          this.$nextTick(() => {
            this.inicializarNuevoContrato();
          });
        }
      },
      deep: true
    },
    
    // Cuando cambian las tarifas, actualizar el formulario si es necesario
    tarifasGas: {
      handler() {
        if (this.visible && !this.tieneContratoVigente && !this.modoEdicion && this.nuevoContrato) {
          this.$nextTick(() => {
            // Solo actualizar si no es un punto de gas (para asignar "Sin Tarifa")
            if (!this.esGas) {
              const idSinTarifaGas = this.tarifasGas?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
              this.nuevoContrato.idTarifaGas = idSinTarifaGas;
            }
          });
        }
      },
      deep: true
    },
    
    tarifasLuz: {
      handler() {
        if (this.visible && !this.tieneContratoVigente && !this.modoEdicion && this.nuevoContrato) {
          this.$nextTick(() => {
            // Solo actualizar si no es un punto de luz (para asignar "Sin Tarifa")
            if (!this.esLuz) {
              const idSinTarifaLuz = this.tarifasLuz?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
              this.nuevoContrato.idTarifaLuz = idSinTarifaLuz;
            }
          });
        }
      },
      deep: true
    }
  },
  async mounted() {
    // Debug: verificar datos principales
    console.log('ModalContratos mounted:', {
      puntoSuministroId: this.puntoSuministro?.id,
      tieneContratoVigente: this.tieneContratoVigente,
      esGas: this.esGas,
      esLuz: this.esLuz,
      tarifasGasCount: this.tarifasGas?.length || 0,
      tarifasLuzCount: this.tarifasLuz?.length || 0
    });
    
    // Agregar un timeout para asegurar que el spinner se detenga
    setTimeout(() => {
      if (this.cargandoDatos) {
        console.log('Forzando fin de carga en mounted después del tiempo máximo');
        this.cargandoDatos = false;
      }
    }, 3000);
    
    // Si está visible y faltan tarifas, intentar cargarlas de forma simple
    if (this.visible) {
      const needsGasTarifas = !this.tarifasGas || this.tarifasGas.length === 0;
      const needsLuzTarifas = !this.tarifasLuz || this.tarifasLuz.length === 0;
      
      if (needsGasTarifas) {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-gas`);
          this.$emit('update:tarifasGas', response.data);
          console.log(`Tarifas de gas cargadas: ${response.data.length}`);
        } catch (error) {
          console.error("Error al cargar tarifas de gas:", error);
        }
      }
      
      if (needsLuzTarifas) {
        try {
          const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/tarifasLuz`);
          this.$emit('update:tarifasLuz', response.data);
          console.log(`Tarifas de luz cargadas: ${response.data.length}`);
        } catch (error) {
          console.error("Error al cargar tarifas de luz:", error);
        }
      }
      
      // Forzar actualización para asegurar que los datos se muestran
      this.$nextTick(() => {
        this.$forceUpdate();
        this.cargandoDatos = false;
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
  height: 100%;
  max-height: 100%;
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

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #999;
}

.tab-btn:disabled:hover {
  background-color: transparent;
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
  gap: 10px;
  max-width: 100%;
  flex: 1;
}

.form-section-modern {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 18px;
  margin-bottom: 20px;
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
  padding: 20px 0;
  flex-shrink: 0;
}

.required-legend {
  font-size: 1rem;
  color: #777;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
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
  gap: 20px;
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

/* Nueva sección de características (autoconsumo y denuncia) */
.features-section {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 1.2rem 1.5rem 1rem 1.5rem;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(255,196,12,0.04);
  border: 1px solid #f3f3f3;
}

.features-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.features-header i {
  font-size: 1.2rem;
  color: #333;
}

.features-header h5 {
  color: #333;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s ease;
}

.feature-card.feature-active {
  border-color: rgba(252, 215, 0);
  background-color: rgba(252, 215, 0, 0.05);
}

.feature-card.denuncia.feature-active {
  border-color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.05);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #aaa;
  font-size: 1.5rem;
}

.feature-card.feature-active .feature-icon {
  background-color: rgba(252, 215, 0, 0.2);
  color: rgba(252, 215, 0);
}

.feature-card.denuncia.feature-active .feature-icon {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.feature-details {
  flex: 1;
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #333;
}

.feature-status {
  font-size: 0.9rem;
  color: #777;
  margin: 0;
}

.feature-card.feature-active .feature-status {
  color: black;
  font-weight: 500;
}

.feature-card.denuncia.feature-active .feature-status {
  color: #e74c3c;
  font-weight: 500;
}

/* Sección de potencias */
.potencia-section {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 1.2rem 1.5rem 1rem 1.5rem;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(255,196,12,0.04);
  border: 1px solid #f3f3f3;
}

.potencia-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

/* Potencias grid en el detalle */
.potencia-grid-detalle {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 10px;
}

.potencia-item-detalle {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e9e9e9;
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

/* Estilos para histórico */
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
  gap: 8px;
  justify-content: center;
}

.btn-icon {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #495057;
  transition: all 0.2s;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.btn-icon:not(:disabled):hover {
  background: #f8f9fa;
  border-color: #ffd600;
  color: #ffd600;
  transform: scale(1.12);
}
.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-edit:hover::after {
  content: 'Editar';
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
}
.btn-renew:hover::after {
  content: 'Renovar';
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
}
.btn-view:hover::after {
  content: 'Ver detalle';
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
}
.btn-download:hover::after {
  content: 'Descargar PDF';
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: #fff;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
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

.detalle-contrato-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.detalle-contrato-section h4 {
  color: #2c3e50;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detalle-contrato-section h4 i {
  color: rgba(252, 215, 0);
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

.status-chip.active {
  background: rgba(252, 215, 0);
  color: black;
  border-color: rgba(252, 215, 0);
}

.status-chip.denuncia.active {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
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

/* Media queries para responsividad */
@media (max-width: 1200px) {
  .form-grid-modern {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .modern-grid {
    grid-template-columns: 1fr;
  }
  
  .potencia-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detalle-contrato-content {
    width: 80%;
    max-width: 80%;
  }
}

@media (max-width: 768px) {
  .form-grid-modern {
    grid-template-columns: 1fr;
  }
  
  .contract-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .contract-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .detalle-contrato-header {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .detalle-contrato-content {
    width: 95%;
    max-width: 95%;
  }
  
  .potencia-grid {
    grid-template-columns: 1fr;
  }
  
  .tab-btn {
    padding: 10px 15px;
  }
  
  .tab-text {
    display: none;
  }
  
  .tab-btn i {
    font-size: 1.2rem;
  }
}

.checkbox-input-modern {
  display: none;
}

.checkbox-custom-modern {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  margin-right: 12px;
  position: relative;
  transition: all 0.3s ease;
  background-color: white;
}

.checkbox-input-modern:checked + .checkbox-custom-modern {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.checkbox-input-modern:checked + .checkbox-custom-modern::after {
  content: '\f00c';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
}

.checkbox-label-modern {
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-badge-modern {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.info-badge-modern.success {
  background-color: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #059669;
}

.info-badge-modern.neutral {
  background-color: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
  color: #374151;
}

.potencias-contratadas {
  margin-bottom: 0;
  padding: 0;
}
.potencias-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.potencia-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
}
.potencia-item label {
  font-size: 0.97rem;
  font-weight: 500;
  color: #222;
  margin-bottom: 2px;
}
.potencia-item input {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background: #fff;
  padding: 4px 8px;
  font-size: 0.97rem;
  height: 32px;
  box-sizing: border-box;
  width: 100%;
  transition: border 0.2s;
}
.potencia-item input:focus {
  border: 1.5px solid #ffd600;
  outline: none;
}
.input-icon-group {
  display: block;
  background: none;
  border: none;
  padding: 0;
}
.input-icon-group i {
  display: none;
}
/* Tooltips mejorados para que no se corten */
.btn-icon:hover::after {
  z-index: 9999 !important;
  pointer-events: none;
}
</style>