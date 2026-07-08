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

      <!-- Contenido principal sin pestañas -->
      <div v-if="cargandoDatos" class="modal-loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Cargando datos del contrato...</p>
        </div>
      </div>
      
      <div v-else class="main-content-container">
        <!-- Debug info (invisible pero ejecuta el computed) -->
        <span style="display: none;">{{ debugEstadoCarga }}</span>
        
        <!-- Vista principal: Histórico de contratos con formulario de edición/creación cuando sea necesario -->
        <div v-if="!mostrandoFormulario" class="main-content">
          <!-- Banner del cliente -->
          <div class="client-banner">
            <div class="client-info">
              <div class="client-header">
                <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'No disponible' }}</h4>
                <div class="client-details">
                  <span><strong>DNI/CIF:</strong> {{ dniClienteActual || 'No disponible' }}</span>
                  <span><strong>CUPS:</strong> {{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de acción principales -->
          <div class="action-buttons-main">
            <button @click="crearNuevoContrato" class="btn-modern btn-primary">
              <i class="fas fa-plus"></i> Crear Contrato
            </button>
            <button @click="modificarContratoActual" class="btn-modern btn-warning" v-if="tieneContratoVigente">
              <i class="fas fa-edit"></i> Modificar Actual
            </button>
            <button @click="renovarContratoActual" class="btn-modern btn-success" v-if="tieneContratoVigente">
              <i class="fas fa-sync-alt"></i> Renovar Actual
            </button>
          </div>

          <!-- Histórico de contratos -->
          <div class="contracts-history">
            <h3><i class="fas fa-history"></i> Histórico de Contratos</h3>
            <div v-if="todosLosContratosOrdenados.length" class="history-table-container">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Contrato</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Tarifa Luz</th>
                    <th>Tarifa Gas</th>
                    <th>Comercializadora Actual</th>
                    <th>Comercializadora Anterior</th>
                    <th>Consumo Anual</th>
                    <th>Características</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contrato in todosLosContratosOrdenados" :key="contrato.id" class="history-row"
                      :class="{ 'contrato-vigente': esContratoVigente(contrato) }">
                    <td>
                      <span v-if="esContratoVigente(contrato)" class="status-vigente">
                        <i class="fas fa-circle"></i> VIGENTE
                      </span>
                      <span v-else class="status-historico">
                        <i class="fas fa-circle"></i> HISTÓRICO
                      </span>
                    </td>
                    <td class="contract-number">#{{ contrato.contrato }}</td>
                    <td>{{ formatDate(contrato.fechaInicio) }}</td>
                    <td>{{ formatDate(contrato.fechaFin) }}</td>
                    <td>{{ getTarifaLuzNombre(contrato.idTarifaLuz) }}</td>
                    <td>{{ getTarifaGasNombre(contrato.idTarifaGas) }}</td>
                    <td>{{ getComercializadoraNombre(contrato.idComercializadoraActual) }}</td>
                    <td>{{ getComercializadoraNombre(contrato.idComercializadoraAnterior) }}</td>
                    <td>{{ contrato.consumoAnual || 0 }} kW</td>
                    <td>
                      <div class="status-indicators">
                        <span v-if="contrato.autoconsumo" class="status-badge autoconsumo">
                          <i class="fas fa-solar-panel"></i> Autoconsumo
                        </span>
                        <span v-if="contrato.denunciaContrato" class="status-badge denuncia">
                          <i class="fas fa-exclamation-triangle"></i> Denunciado
                        </span>
                        <span v-if="contrato.exencionImpuestoElectricidad === 1" class="status-badge exencion">
                          <i class="fas fa-bolt"></i> Exención Impuesto
                        </span>
                        <span v-if="!contrato.autoconsumo && !contrato.denunciaContrato && contrato.exencionImpuestoElectricidad !== 1" class="status-badge normal">
                          <i class="fas fa-check-circle"></i> Normal
                        </span>
                      </div>
                    </td>
                    <td class="action-buttons">
                      <button @click="editarContratoGenerico(contrato)" class="btn-icon btn-edit" title="Editar contrato">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="renovarContratoGenerico(contrato)" class="btn-icon btn-renew" title="Renovar contrato">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button @click="verDetalleContrato(contrato)" class="btn-icon btn-view" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button @click="descargarPDF(contrato)" class="btn-icon btn-download" title="Descargar PDF" v-if="contrato.rutaArchivoContrato">
                        <i class="fas fa-download"></i>
                      </button>
                      <button @click="eliminarContrato(contrato)" class="btn-icon btn-delete" title="Eliminar contrato" v-if="nivelAcceso === 1">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="no-history">
              <i class="fas fa-history"></i>
              <p v-if="cargandoDatos">Cargando contratos...</p>
              <p v-else>No hay contratos disponibles</p>
            </div>
          </div>
        </div>

        <!-- Formulario de creación/edición de contratos -->
        <div v-if="mostrandoFormulario" class="form-content">
          <!-- Banner del cliente -->
          <div class="client-banner">
            <div class="client-info">
              <div class="client-header">
                <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'No disponible' }}</h4>
                <div class="client-details">
                  <span><strong>DNI/CIF:</strong> {{ dniClienteActual || 'No disponible' }}</span>
                  <span><strong>CUPS:</strong> {{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
                </div>
              </div>
            </div>
          </div>

          <form @submit.prevent="guardarContrato" class="modern-form" novalidate>
            <div class="form-grid-modern">
              <!-- Sección de Fechas -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas del Contrato / Informacion de la Comercializadora</h3>
                </div>
                
                <div class="form-group-modern">
                  <label for="fechaEnvioContrato">Fecha Envío <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-paper-plane icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaEnvioContrato" 
                      v-model="nuevoContrato.fechaEnvio" 
                      class="form-control-modern" :class="{ 'input-error': errores.fechaEnvio }"
                      @change="errores.fechaEnvio = ''"
                      required 
                    />
                  </div>
                  <small v-if="errores.fechaEnvio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaEnvio }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="fechaInicioContrato">Fecha Inicio <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-play icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaInicioContrato" 
                      v-model="nuevoContrato.fechaInicio" 
                      class="form-control-modern" :class="{ 'input-error': errores.fechaInicio }"
                      @change="errores.fechaInicio = ''"
                      required 
                    />
                  </div>
                  <small v-if="errores.fechaInicio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaInicio }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="fechaFinContrato">Fecha Fin <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-stop icon-prefix"></i>
                    <input 
                      type="date" 
                      id="fechaFinContrato" 
                      v-model="nuevoContrato.fechaFin" 
                      class="form-control-modern" :class="{ 'input-error': errores.fechaFin }"
                      @change="errores.fechaFin = ''"
                      required 
                    />
                  </div>
                  <small v-if="errores.fechaFin" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaFin }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="comercializadoraActual">
                    <i class="fas fa-building"></i>
                    Comercializadora Actual <span class="required">*</span>
                  </label>
                  <div class="select-container-modern" :class="{ 'select-error': errores.idComercializadoraActual }">
                    <select 
                      id="comercializadoraActual" 
                      v-model="nuevoContrato.idComercializadoraActual" 
                      class="form-select-modern" 
                      @change="errores.idComercializadoraActual = ''"
                      required
                    >
                      <option value="">Seleccione una comercializadora...</option>
                      <option v-for="comercializadora in comercializadorasList" :value="comercializadora.id" :key="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                  </div>
                  <small v-if="errores.idComercializadoraActual" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idComercializadoraActual }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="comercializadoraAnterior">
                    <i class="fas fa-history"></i>
                    Comercializadora Anterior
                  </label>
                  <div class="select-container-modern">
                    <select 
                      id="comercializadoraAnterior" 
                      v-model="nuevoContrato.idComercializadoraAnterior" 
                      class="form-select-modern"
                    >
                      <option value="">Seleccione una comercializadora...</option>
                      <option v-for="comercializadora in comercializadorasList" :value="comercializadora.id" :key="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
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
                      class="form-control-modern" :class="{ 'input-error': errores.contrato }"
                      @input="errores.contrato = ''"
                      maxlength="100"
                      required 
                    />
                  </div>
                  <small v-if="errores.contrato" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.contrato }}</small>
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
                  </div>
                </div>

                <!-- Consumo Anual -->
                <div class="form-group-modern">
                  <label for="consumoAnual">
                    <i class="fas fa-chart-line"></i>
                    Consumo Anual (kW) <span class="required">*</span>
                  </label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-bolt icon-prefix"></i>
                    <input 
                      type="number" 
                      id="consumoAnual" 
                      v-model="nuevoContrato.consumoAnual" 
                      class="form-control-modern" 
                      step="0.0001" 
                      min="0" 
                      required 
                      placeholder="0.0000"
                    />
                  </div>
                </div>

                <!-- Usuario para Facturación Online -->
                <div class="form-group-modern">
                  <label for="userFO">
                    <i class="fas fa-user"></i>
                    Usuario Facturación Online
                  </label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-user icon-prefix"></i>
                    <input 
                      type="text" 
                      id="userFO" 
                      v-model="nuevoContrato.userFO" 
                      class="form-control-modern" 
                      maxlength="200"
                      placeholder="Usuario para facturación online"
                    />
                  </div>
                </div>

                <!-- Contraseña para Facturación Online -->
                <div class="form-group-modern">
                  <label for="passwordFO">
                    <i class="fas fa-lock"></i>
                    Contraseña Facturación Online
                  </label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-lock icon-prefix"></i>
                    <input 
                      type="text" 
                      id="passwordFO" 
                      v-model="nuevoContrato.passwordFO" 
                      class="form-control-modern" 
                      maxlength="200"
                      placeholder="Contraseña para facturación online"
                    />
                  </div>
                </div>

                <!-- Potencias Contratadas (compactas) -->
                <div class="form-group-modern">
                  <label class="potencias-label">
                    <i class="fas fa-bolt"></i>
                    Potencias Contratadas (kW)
                  </label>
                  <div class="potencias-contratadas-compactas">
                    <div class="potencias-grid-compacta">
                      <div class="potencia-item-compacta" v-for="n in 6" :key="n">
                        <label :for="'pot' + n" class="potencia-label-compacta">P{{ n }}</label>
                        <input 
                          :id="'pot' + n" 
                          v-model="nuevoContrato['pot' + n]" 
                          type="number" 
                          step="0.0001" 
                          min="0" 
                          class="potencia-input-compacta"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Sección de Observaciones -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-comment-alt"></i>
                  <h3>Observaciones</h3>
                </div>
                
                <div class="form-group-modern">
                  <textarea 
                    id="observaciones" 
                    v-model="nuevoContrato.observaciones" 
                    class="form-control-modern textarea-modern" 
                    rows="100"
                    maxlength="10000"
                    placeholder="Añada aquí cualquier observación relevante sobre el contrato..."
                  ></textarea>
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

              <!-- Sección de Autoconsumo y Exenciones -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-solar-panel"></i>
                  <h3>Autoconsumo y Exenciones</h3>
                </div>
                
                <div class="form-group-modern">
                  <!-- Indicador de Autoconsumo -->
                  <div v-if="tieneAutoconsumo" class="info-badge-modern success">
                    <i class="fas fa-solar-panel"></i>
                    <div class="badge-content">
                      <span class="badge-title">Autoconsumo:</span>
                      <strong>{{ puntoSuministroData?.autoconsumo }}</strong>
                    </div>
                  </div>
                  <div v-else class="info-badge-modern neutral">
                    <i class="fas fa-solar-panel"></i>
                    <div class="badge-content">
                      <span class="badge-title">Autoconsumo:</span>
                      <span>No configurado</span>
                    </div>
                  </div>
                  
                  <!-- Indicador de Exención Impuesto Eléctrico -->
                  <div v-if="tieneExencionImpuestoElectrico" class="info-badge-modern success" style="margin-top: 0.4rem;">
                    <i class="fas fa-bolt"></i>
                    <div class="badge-content">
                      <span class="badge-title">Exención Impuesto Eléctrico:</span>
                      <strong>Sí</strong>
                    </div>
                  </div>
                  <div v-else class="info-badge-modern neutral" style="margin-top: 0.4rem;">
                    <i class="fas fa-bolt"></i>
                    <div class="badge-content">
                      <span class="badge-title">Exención Impuesto Eléctrico:</span>
                      <span>No</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Sección de Gestión de Denuncia -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-exclamation-triangle"></i>
                  <h3>Gestión de Denuncia</h3>
                </div>
                
                <div class="form-group-modern">
                  <!-- Contenedor compacto para denuncia -->
                  <div class="denuncia-compacta">
                    <div class="denuncia-checkbox-compacta">
                      <label class="denuncia-label-compacta">
                        <input 
                          type="checkbox" 
                          v-model="denunciaRealizada"
                          class="denuncia-input"
                          @change="actualizarDenuncia"
                        />
                        <span class="denuncia-checkmark"></span>
                        <span class="denuncia-text">Denuncia realizada</span>
                      </label>
                    </div>

                    <!-- Selector de fecha inline -->
                    <div v-if="denunciaRealizada" class="fecha-denuncia-inline">
                      <label for="fechaDenunciaContrato" class="fecha-label-compacta">
                        <i class="fas fa-calendar-alt"></i>
                        Fecha de gestión <span class="required">*</span>
                      </label>
                      <input 
                        type="date" 
                        id="fechaDenunciaContrato" 
                        v-model="nuevoContrato.fechaDenunciaContrato" 
                        class="fecha-input-compacta" 
                        :required="denunciaRealizada"
                      />
                    </div>
                  </div>
                </div>
              </div>


            </div>

            <!-- Botones de acción dentro del formulario -->
            <div class="modal-footer-modern">
              <div class="required-legend"><span class="required">*</span> Campos obligatorios</div>
              <div class="action-buttons">
                <button type="button" @click="cancelarFormulario" class="btn-modern btn-secondary">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-save"></i> {{ textoBotonGuardar }}
                </button>
              </div>
            </div>
          </form>
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
                <span class="info-value">{{ clienteDetalle?.dni?.trim() || clienteDetalle?.cif?.trim() || 'No disponible' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CUPS:</span>
                <span class="info-value">{{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
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
                <span class="info-label">Exención Impuesto Eléctrico:</span>
                <span class="info-value">
                  <span class="status-chip exencion" :class="{ active: contratoDetalle?.exencionImpuestoElectricidad === 1 }">
                    <i class="fas fa-bolt"></i> 
                    {{ contratoDetalle?.exencionImpuestoElectricidad === 1 ? 'Sí' : 'No' }}
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
              <div class="info-row" v-if="contratoDetalle?.userFO">
                <span class="info-label">Usuario Facturación Online:</span>
                <span class="info-value">
                  <i class="fas fa-user"></i> {{ contratoDetalle?.userFO }}
                </span>
              </div>
              <div class="info-row" v-if="contratoDetalle?.passwordFO">
                <span class="info-label">Contraseña Facturación Online:</span>
                <span class="info-value">
                  <i class="fas fa-lock"></i> {{ contratoDetalle?.passwordFO }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Sección de Consumo Anual en la vista de detalle -->
          <div class="detalle-contrato-section">
            <h4><i class="fas fa-chart-line"></i> Consumo Anual</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Consumo Anual:</span>
                <span class="info-value">
                  <i class="fas fa-bolt"></i> {{ contratoDetalle?.consumoAnual || 0 }} kW
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
        idComercializadoraActual:"",
        idComercializadoraAnterior:"",
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
      mostrandoFormulario: false, // Controla si se muestra el formulario o la vista principal
      modoEdicion: false,
      modoRenovacion: false,
      contratoEditandoId: null,
      cargandoDatos: false, // Inicializar en false para evitar spinner innecesario
      nuevoContrato: {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas: "",
        idTarifaLuz: "",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:"",
        idComercializadoraAnterior:"",
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
        userFO: "",
        passwordFO: "",
      },
      selectedFile: null,
      mostrarModalDetalleContrato: false,
      contratoDetalle: null,
      clienteDetalle: null,
      comercializadorasList: [],
      nivelAcceso: null,
      errores: {},
    };
  },

  methods: {
    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
    },
    validarContrato() {
      this.errores = {};
      let valido = true;
      if (!this.nuevoContrato.fechaEnvio) {
        this.errores.fechaEnvio = 'Fecha de envío es obligatoria';
        valido = false;
      }
      if (!this.nuevoContrato.fechaInicio) {
        this.errores.fechaInicio = 'Fecha de inicio es obligatoria';
        valido = false;
      }
      if (!this.nuevoContrato.fechaFin) {
        this.errores.fechaFin = 'Fecha de fin es obligatoria';
        valido = false;
      }
      if (this.nuevoContrato.fechaInicio && this.nuevoContrato.fechaFin &&
          this.nuevoContrato.fechaFin < this.nuevoContrato.fechaInicio) {
        this.errores.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
        valido = false;
      }
      if (!this.nuevoContrato.idComercializadoraActual) {
        this.errores.idComercializadoraActual = 'Comercializadora actual es obligatoria';
        valido = false;
      }
      if (!this.nuevoContrato.contrato || !String(this.nuevoContrato.contrato).trim()) {
        this.errores.contrato = 'Número de contrato es obligatorio';
        valido = false;
      }
      return valido;
    },

    // Método para actualizar el estado de denuncia
    actualizarDenuncia() {
      if (this.denunciaRealizada && !this.nuevoContrato.fechaDenunciaContrato) {
        // Si se marca la denuncia pero no hay fecha, usar la fecha actual
        this.nuevoContrato.fechaDenunciaContrato = this.formatDateForInput(new Date());
      } else if (!this.denunciaRealizada) {
        // Si se desmarca la denuncia, limpiar la fecha
        this.nuevoContrato.fechaDenunciaContrato = '';
      }
    },

    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('es-ES');
    },

    // Helper para obtener el CUPS correcto del punto de suministro
    obtenerCupsDelPuntoSuministro() {
      const cupsluz = this.puntoSuministroData?.cupsluz?.trim() || "";
      const cupsgas = this.puntoSuministroData?.cupsgas?.trim() || "";
      return cupsluz || cupsgas || "";
    },

    // Método auxiliar para formatear fechas para inputs tipo date
    formatDateForInput(dateString) {
      if (!dateString) return '';
      
      try {
        // Si es un string en formato ISO (YYYY-MM-DD) directamente lo devolvemos
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        
        // Si es un timestamp o string de fecha, convertir a Date
        const date = new Date(dateString);
        
        // Verificar que es una fecha válida
        if (isNaN(date.getTime())) {
          console.warn('Fecha inválida:', dateString);
          return '';
        }
        
        // Formatear a YYYY-MM-DD para input date
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return '';
      }
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
      if (!id || id === '') return 'Sin Comercializadora';
      
      // Priorizar las comercializadoras del prop, luego las cargadas internamente
      let lista = this.comercializadoras;
      if (!lista || !lista.length) {
        lista = this.comercializadorasList;
      }
      
      if (!lista || !lista.length) {
        console.warn("No se han cargado las comercializadoras aún");
        return 'Comercializadora Desconocida';
      }
      
      const comercializadora = lista.find(c => c.id == id);
      
      if (!comercializadora) {
        console.warn(`No se encontró la comercializadora con ID: ${id}`, {id, lista});
        return 'Comercializadora Desconocida';
      }
      
      return comercializadora.nombre;
    },

    // Nuevos métodos para manejar la nueva interfaz
    crearNuevoContrato() {
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.inicializarNuevoContrato();
      this.selectedFile = null;
    },

    async modificarContratoActual() {
      if (!this.contratoVigente) return;
      
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = true;
      this.modoRenovacion = false;
      this.contratoEditandoId = this.contratoVigente.id;
      
      // Usar $nextTick para asegurar que el DOM está listo
      await this.$nextTick();
      
      this.nuevoContrato = { ...this.contratoVigente };
      // Asegurar que los campos de facturación online estén presentes y preserven valores nulos/vacíos
      this.nuevoContrato.userFO = this.contratoVigente.userFO !== undefined ? this.contratoVigente.userFO : "";
      this.nuevoContrato.passwordFO = this.contratoVigente.passwordFO !== undefined ? this.contratoVigente.passwordFO : "";
      
      // SINCRONIZAR con el punto de suministro actual
      this.nuevoContrato.exencionImpuestoElectricidad = this.tieneExencionImpuestoElectrico ? 1 : 0;
      this.nuevoContrato.autoconsumo = this.tieneAutoconsumo ? 1 : 0;
      
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = this.contratoVigente['potencia' + i] || 0;
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = this.contratoVigente.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = this.contratoVigente.idComercializadoraAnterior || "";
      
      this.selectedFile = null;
    },

    async renovarContratoActual() {
      if (!this.contratoVigente) return;
      
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.contratoEditandoId = null;
      
      // Usar $nextTick para asegurar que el DOM está listo
      await this.$nextTick();
      
      // Precargar TODOS los valores incluyendo las fechas
      this.nuevoContrato = {
        ...this.contratoVigente,
        id: undefined, // Remover el ID para que sea un contrato nuevo
        idCliente: this.contratoVigente.idCliente || this.contratoVigente.cliente?.id || this.cliente?.id,
        idPuntoSuministro: this.contratoVigente.idPuntoSuministro || this.contratoVigente.puntoSuministro?.id || this.puntoSuministroData?.id,
        fechaEnvio: this.formatDateForInput(this.contratoVigente.fechaEnvio) || '', // INCLUIR fechas formateadas
        fechaInicio: this.formatDateForInput(this.contratoVigente.fechaInicio) || '', // INCLUIR fechas formateadas
        fechaFin: this.formatDateForInput(this.contratoVigente.fechaFin) || '', // INCLUIR fechas formateadas
        fechaDenunciaContrato: '', // Limpiar denuncia al renovar
        denunciaContrato: 0, // Limpiar denuncia al renovar
        rutaArchivoContrato: '', // Limpiar archivo
        userFO: this.contratoVigente.userFO !== undefined ? this.contratoVigente.userFO : '', // Mantener usuario FO
        passwordFO: this.contratoVigente.passwordFO !== undefined ? this.contratoVigente.passwordFO : '', // Mantener contraseña FO
        // SINCRONIZAR con el punto de suministro actual
        exencionImpuestoElectricidad: this.tieneExencionImpuestoElectrico ? 1 : 0,
        autoconsumo: this.tieneAutoconsumo ? 1 : 0,
      };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = this.contratoVigente['potencia' + i] || 0;
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = this.contratoVigente.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = this.contratoVigente.idComercializadoraAnterior || "";
      
      this.selectedFile = null;
    },

    async editarContratoGenerico(contrato) {
      
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = true;
      this.modoRenovacion = false;
      this.contratoEditandoId = contrato.id;
      
      // Usar $nextTick para asegurar que el DOM está listo
      await this.$nextTick();
      
      // Hacer una copia profunda del contrato
      this.nuevoContrato = JSON.parse(JSON.stringify(contrato));
      
      // Asegurar que se incluyan todos los campos necesarios
      this.nuevoContrato.id = contrato.id; // IMPORTANTE: Incluir el ID
      this.nuevoContrato.idCliente = contrato.idCliente || contrato.cliente?.id || this.cliente?.id;
      this.nuevoContrato.idPuntoSuministro = contrato.idPuntoSuministro || contrato.puntoSuministro?.id || this.puntoSuministroData?.id;
      
      // Asegurar que los campos de facturación online estén presentes y preserven valores nulos/vacíos
      this.nuevoContrato.userFO = contrato.userFO !== undefined ? contrato.userFO : "";
      this.nuevoContrato.passwordFO = contrato.passwordFO !== undefined ? contrato.passwordFO : "";
      
      // SINCRONIZAR con el punto de suministro actual
      this.nuevoContrato.exencionImpuestoElectricidad = this.tieneExencionImpuestoElectrico ? 1 : 0;
      this.nuevoContrato.autoconsumo = this.tieneAutoconsumo ? 1 : 0;
      
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = contrato['potencia' + i] || 0;
      }
      
      // Formatear fechas correctamente para inputs tipo date
      this.nuevoContrato.fechaEnvio = this.formatDateForInput(contrato.fechaEnvio);
      this.nuevoContrato.fechaInicio = this.formatDateForInput(contrato.fechaInicio);
      this.nuevoContrato.fechaFin = this.formatDateForInput(contrato.fechaFin);
      if (contrato.fechaDenunciaContrato) {
        this.nuevoContrato.fechaDenunciaContrato = this.formatDateForInput(contrato.fechaDenunciaContrato);
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = contrato.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = contrato.idComercializadoraAnterior || "";
      
      this.selectedFile = null;
    },

    async renovarContratoGenerico(contrato) {
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.contratoEditandoId = null;
      
      // Usar $nextTick para asegurar que el DOM está listo
      await this.$nextTick();
      
      // Precargar TODOS los valores incluyendo las fechas
      this.nuevoContrato = {
        ...contrato,
        id: undefined, // Remover el ID para que sea un contrato nuevo
        idCliente: contrato.idCliente || contrato.cliente?.id || this.cliente?.id,
        idPuntoSuministro: contrato.idPuntoSuministro || contrato.puntoSuministro?.id || this.puntoSuministroData?.id,
        fechaEnvio: this.formatDateForInput(contrato.fechaEnvio) || '', // INCLUIR fechas formateadas
        fechaInicio: this.formatDateForInput(contrato.fechaInicio) || '', // INCLUIR fechas formateadas
        fechaFin: this.formatDateForInput(contrato.fechaFin) || '', // INCLUIR fechas formateadas
        fechaDenunciaContrato: '', // Limpiar denuncia al renovar
        denunciaContrato: 0, // Limpiar denuncia al renovar
        rutaArchivoContrato: '', // Limpiar archivo
        userFO: contrato.userFO !== undefined ? contrato.userFO : '', // Mantener usuario FO
        passwordFO: contrato.passwordFO !== undefined ? contrato.passwordFO : '', // Mantener contraseña FO
        // SINCRONIZAR con el punto de suministro actual
        exencionImpuestoElectricidad: this.tieneExencionImpuestoElectrico ? 1 : 0,
        autoconsumo: this.tieneAutoconsumo ? 1 : 0,
      };
      
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = contrato['potencia' + i] || 0;
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = contrato.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = contrato.idComercializadoraAnterior || "";
      
      this.selectedFile = null;
    },

    cancelarFormulario() {
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.selectedFile = null;
    },

    async guardarContrato() {
      if (!this.validarContrato()) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Revise los campos marcados en rojo antes de guardar.',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Entendido'
        });
        return;
      }
      try {
        // Copiar los valores de los inputs pot1...pot6 a potencia1...potencia6 antes de enviar
        for (let i = 1; i <= 6; i++) {
          this.nuevoContrato['potencia' + i] = this.nuevoContrato['pot' + i];
        }
        
        // Asegurar que el ID está presente en modo edición
        if (this.modoEdicion && this.contratoEditandoId) {
          this.nuevoContrato.id = this.contratoEditandoId;
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
          
          if (this.dniClienteActual) {
            formData.append('dniCliente', this.dniClienteActual);
          }

          if (this.modoEdicion && this.contratoEditandoId) {
            response = await axios.put(`
              /contratos/${this.contratoEditandoId}`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } else {
            response = await axios.post(
              /contratos`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          }
        } 
        // Si no hay archivo, enviamos como JSON directamente
        else {
          if (this.modoEdicion && this.contratoEditandoId) {
            response = await axios.put(`
              /contratos/${this.contratoEditandoId}`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          } else {
            response = await axios.post(
              /contratos`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          }
        }

        // Mostrar mensaje de éxito
        await this.$swal.fire({
          title: this.modoEdicion ? 'Contrato actualizado' : (this.modoRenovacion ? 'Contrato renovado' : 'Contrato creado'),
          text: this.modoEdicion 
            ? 'El contrato ha sido actualizado correctamente.' 
            : (this.modoRenovacion ? 'El contrato ha sido renovado correctamente.' : 'El nuevo contrato ha sido creado correctamente.'),
          icon: 'success',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar',
          timer: 2000,
          timerProgressBar: true
        });
        
        // Emitir eventos específicos según el tipo de operación
        if (this.modoEdicion) {
          this.$emit("contrato-actualizado", response.data);
        } else if (this.modoRenovacion) {
          this.$emit("contrato-renovado", response.data);
        } else {
          this.$emit("contrato-creado", response.data);
        }
        
        // Emitir evento para forzar recarga de datos
        this.$emit("recargar-contratos");
        
        // Volver a la vista principal
        this.cancelarFormulario();
        
      } catch (error) {
        console.error("Error al guardar el contrato:", error);
        const errData = error.response?.data;
        const detalle = errData?.message || errData?.error || errData?.mensaje || (typeof errData === 'string' ? errData : '') || error.message || '';
        this.$swal.fire({
          title: 'Error',
          text: `No se pudo ${this.modoEdicion ? 'actualizar' : (this.modoRenovacion ? 'renovar' : 'crear')} el contrato.${detalle ? ' ' + detalle : ' Por favor, verifica los datos e inténtalo de nuevo.'}`,
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    esContratoVigente(contrato) {
      const ahora = new Date();
      const fechaFin = new Date(contrato.fechaFin);
      const fechaInicio = new Date(contrato.fechaInicio);
      return fechaInicio <= ahora && fechaFin > ahora;
    },

    async descargarPDF(contrato) {
      if (!contrato.rutaArchivoContrato) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Archivo no disponible',
          text: 'No hay archivo PDF disponible para este contrato'
        })
        return;
      }

      try {
        const response = await axios.get(
          /contratos/${contrato.id}/pdf`,
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al descargar el PDF del contrato'
        })
      }
    },

    verDetalleContrato(contrato) {
      // Crear copia profunda para evitar mutaciones
      // Esto previene que cambios en el modal de detalle afecten a otros contratos
      this.contratoDetalle = JSON.parse(JSON.stringify(contrato));
      this.clienteDetalle = contrato.cliente 
        ? JSON.parse(JSON.stringify(contrato.cliente)) 
        : this.cliente;
      this.mostrarModalDetalleContrato = true;
    },

    // Determinar qué pestaña mostrar inicialmente basándose en si hay contrato vigente
    inicializarNuevoContrato() {
      // Obtener IDs de "Sin Tarifa" de manera segura
      const idSinTarifaGas = this.tarifasGas?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
      const idSinTarifaLuz = this.tarifasLuz?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
      
      // Determinar el tipo de punto de suministro (verificar ambas formas por compatibilidad)
      const cupsGas = this.puntoSuministroData?.CUPSgas || this.puntoSuministroData?.cupsgas;
      const cupsLuz = this.puntoSuministroData?.CUPSluz || this.puntoSuministroData?.cupsluz;
      const tieneGas = cupsGas && cupsGas.trim() !== '';
      const tieneLuz = cupsLuz && cupsLuz.trim() !== '';
      
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
        exencionImpuestoElectricidad: this.tieneExencionImpuestoElectrico ? 1 : 0,
        idComercializadoraActual: "",
        idComercializadoraAnterior: "",
        autoconsumo: this.tieneAutoconsumo ? 1 : 0,
        denunciaContrato: 0,
        fechaDenunciaContrato: "",
        observaciones: "",
        userFO: "",
        passwordFO: "",
      };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = 0;
      }
      this.selectedFile = null;
    },

    cerrarModal() {
      this.$emit('cerrar-modal');
      // Resetear TODOS los estados y limpiar datos
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.selectedFile = null;
      this.mostrarModalDetalleContrato = false;
      this.contratoDetalle = null;
      this.clienteDetalle = null;
      this.cargandoDatos = false;
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
      doc.text(`DNI: ${this.dniClienteActual || ''}`, 14, 38);
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
          ["Exención Impuesto Eléctrico", contrato.exencionImpuestoElectricidad === 1 ? "Sí" : "No"],
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

    async cargarComercializadoras() {
      try {
        const response = await axios.get(`/comercializadoras`);
        this.comercializadorasList = response.data;
      } catch (error) {
        console.error('Error al cargar comercializadoras:', error);
        this.comercializadorasList = [];
      }
    },

    // Método auxiliar para asegurar que las comercializadoras estén cargadas
    async asegurarComercializadorasCargadas() {
      // Si ya están cargadas, no hacer nada
      if (this.comercializadorasList && this.comercializadorasList.length > 0) {
        return;
      }
      
      // Si están en el prop, copiarlas al data interno
      if (this.comercializadoras && this.comercializadoras.length > 0) {
        this.comercializadorasList = [...this.comercializadoras];
        return;
      }
      
      // Si no están ni cargadas ni en props, cargarlas
      await this.cargarComercializadoras();
      
      // Esperar un tick adicional para asegurar reactividad
      await this.$nextTick();
    },

    // Eliminar contrato con confirmación
    async eliminarContrato(contrato) {
      try {
        const result = await this.$swal.fire({
          title: '¿Estás seguro?',
          text: `¿Deseas eliminar el contrato #${contrato.contrato}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
          // Mostrar loading
          this.$swal.fire({
            title: 'Eliminando...',
            text: 'Por favor, espere mientras se elimina el contrato.',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              this.$swal.showLoading();
            }
          });

          // Realizar la eliminación
          await axios.delete(`/contratos/${contrato.id}`);
          
          // Mostrar mensaje de éxito
          await this.$swal.fire({
            title: 'Eliminado',
            text: 'El contrato ha sido eliminado correctamente.',
            icon: 'success',
            confirmButtonColor: 'rgba(252, 215, 0)',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
          });

          // Emitir evento para recargar contratos
          this.$emit("recargar-contratos");
        }
      } catch (error) {
        console.error('Error al eliminar contrato:', error);
        this.$swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el contrato. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
      }
    },
  },

  computed: {
    // Obtener el DNI/CIF del cliente de forma consistente
    // Siempre prioriza el campo DNI (que es el CIF de BBDD)
    dniClienteActual() {
      // Prioridad: dni > cif (ignorar dniAutorizado)
      if (this.cliente?.dni?.trim()) {
        return this.cliente.dni.trim();
      }
      if (this.cliente?.cif?.trim()) {
        return this.cliente.cif.trim();
      }
      return '';
    },

    // Computed para manejar el estado del checkbox de denuncia
    denunciaRealizada: {
      get() {
        return this.nuevoContrato.denunciaContrato === 1;
      },
      set(value) {
        this.nuevoContrato.denunciaContrato = value ? 1 : 0;
        if (!value) {
          this.nuevoContrato.fechaDenunciaContrato = '';
        }
      }
    },

    // Combinar todos los contratos y ordenarlos de más actual a menos actual
    todosLosContratosOrdenados() {
      const todosLosContratos = [...this.contratos, ...this.contratosHistoricos];
      // Eliminar duplicados por ID
      const contratosUnicos = todosLosContratos.filter((contrato, index, array) => 
        array.findIndex(c => c.id === contrato.id) === index
      );
      
      // Crear copias profundas para NO MUTAR los datos originales
      // Esto evita que al ver el detalle de un contrato se modifiquen los valores
      // de otros contratos en la lista (bug de consumoAnual compartido)
      const contratosConDatosSincronizados = contratosUnicos.map(contrato => {
        // Copia profunda para evitar referencias compartidas
        const copiaContrato = JSON.parse(JSON.stringify(contrato));
        // Sincronizar con el punto de suministro actual
        copiaContrato.exencionImpuestoElectricidad = this.tieneExencionImpuestoElectrico ? 1 : 0;
        copiaContrato.autoconsumo = this.tieneAutoconsumo ? 1 : 0;
        return copiaContrato;
      });
      
      // Ordenar por fecha de inicio descendente (más actual primero)
      return contratosConDatosSincronizados.sort((a, b) => {
        return new Date(b.fechaInicio) - new Date(a.fechaInicio);
      });
    },

    // Texto dinámico para el botón de guardar
    textoBotonGuardar() {
      if (this.modoEdicion) return 'Guardar Cambios';
      if (this.modoRenovacion) return 'Guardar y Renovar';
      return 'Guardar Contrato';
    },

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
    
    // Verificar si el punto de suministro tiene exención del impuesto eléctrico
    tieneExencionImpuestoElectrico() {
      return this.puntoSuministroData && 
             this.puntoSuministroData.exencionImpuestoElectrico === true;
    },
    
    // Determinar si el punto de suministro es de Gas
    esGas() {
      // Verificar ambas formas por compatibilidad
      const cupsGas = this.puntoSuministroData?.CUPSgas || this.puntoSuministroData?.cupsgas;
      return cupsGas && cupsGas.trim() !== '';
    },
    
    // Determinar si el punto de suministro es de Luz
    esLuz() {
      // Verificar ambas formas por compatibilidad
      const cupsLuz = this.puntoSuministroData?.CUPSluz || this.puntoSuministroData?.cupsluz;
      return cupsLuz && cupsLuz.trim() !== '';
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
    },
    
    // Debug computed para entender el estado de carga
    debugEstadoCarga() {
      const info = {
        cargandoDatos: this.cargandoDatos,
        mostrandoFormulario: this.mostrandoFormulario,
        visible: this.visible,
        tieneContratos: this.contratos?.length || 0,
        tieneHistoricos: this.contratosHistoricos?.length || 0,
        tarifasGas: this.tarifasGas?.length || 0,
        tarifasLuz: this.tarifasLuz?.length || 0,
        shouldShowSpinner: this.cargandoDatos,
        shouldShowMain: !this.cargandoDatos && !this.mostrandoFormulario,
        shouldShowForm: !this.cargandoDatos && this.mostrandoFormulario
      };
      return info;
    }
  },
  watch: {
    // Cuando se abre el modal, configurar el estado inicial
    visible: {
      immediate: true, // Ejecutar inmediatamente cuando se crea el componente
      handler(newVal) {
        if (newVal) {
          
          // PRIMER PASO: Resetear TODOS los estados y limpiar datos
          this.cargandoDatos = false;
          this.mostrandoFormulario = false;
          this.modoEdicion = false;
          this.modoRenovacion = false;
          this.contratoEditandoId = null;
          this.selectedFile = null;
          this.mostrarModalDetalleContrato = false;
          this.contratoDetalle = null;
          this.clienteDetalle = null;
          
          // SEGUNDO PASO: Verificar si necesitamos cargar tarifas y comercializadoras
          const needsGasTarifas = !this.tarifasGas || this.tarifasGas.length === 0;
          const needsLuzTarifas = !this.tarifasLuz || this.tarifasLuz.length === 0;
          const needsComercializadoras = !this.comercializadorasList || this.comercializadorasList.length === 0;

          // TERCER PASO: Solo activar carga si realmente necesitamos datos
          if (needsGasTarifas || needsLuzTarifas || needsComercializadoras) {
            this.cargandoDatos = true;
            
            // Timeout de seguridad
            setTimeout(() => {
              if (this.cargandoDatos) {
                this.cargandoDatos = false;
              }
            }, 2000);
          } 
          
          // CUARTO PASO: Configurar vista inicial
          this.$nextTick(() => {
            try {
              // SIEMPRE mostrar la vista principal (histórico) primero
              // El usuario puede hacer clic en "Crear Contrato" si quiere añadir uno
              // No hacer nada aquí, dejar que la vista principal se muestre por defecto
            } catch (error) {
              console.error("Error al inicializar vista del modal:", error);
              this.cargandoDatos = false;
            }
          });
        } else {
          // Resetear estado cuando se cierra el modal
          this.cargandoDatos = false;
          this.mostrandoFormulario = false;
          this.modoEdicion = false;
          this.modoRenovacion = false;
          this.mostrarModalDetalleContrato = false;
        }
      }
    },
    
    // Cuando cambia el punto de suministro, limpiar datos y reinicializar
    puntoSuministro: {
      handler(newPunto, oldPunto) {
        // Obtener IDs de forma segura (puede venir como objeto o como valor directo)
        const newId = newPunto?.id || newPunto;
        const oldId = oldPunto?.id || oldPunto;
        
        // Si el modal está visible y cambió el punto de suministro
        if (this.visible && newId !== oldId) {
          
          // LIMPIAR COMPLETAMENTE todos los estados del modal
          this.mostrandoFormulario = false;
          this.modoEdicion = false;
          this.modoRenovacion = false;
          this.contratoEditandoId = null;
          this.selectedFile = null;
          this.mostrarModalDetalleContrato = false;
          this.contratoDetalle = null;
          this.clienteDetalle = null;
          
          // Limpiar el formulario completamente
          this.nuevoContrato = {
            idCliente: "",
            idPuntoSuministro: "",        
            fecha: "",
            fechaEnvio: "",
            fechaInicio: "",
            fechaFin: "",
            contrato: "",
            idTarifaGas: "",
            idTarifaLuz: "",
            potencia1: 0,        
            potencia2: 0,
            potencia3: 0,
            potencia4: 0,
            potencia5: 0,
            potencia6: 0,
            consumoAnual: 0,
            exencionImpuestoElectricidad: 0,
            idComercializadoraActual: "",
            idComercializadoraAnterior: "",
            autoconsumo: 0,
            denunciaContrato: 0,
            fechaDenunciaContrato: "",
            observaciones: "",
            userFO: "",
            passwordFO: "",
          };
          
          // Forzar actualización del componente para reflejar los nuevos datos
          this.$nextTick(() => {
            this.$forceUpdate();
          });
        }
      },
      deep: true
    },
    
    // Cuando cambian los contratos, forzar actualización de la vista
    contratos: {
      handler(newContratos, oldContratos) {
        // Solo actuar si el modal está visible y los contratos realmente cambiaron
        if (this.visible) {
          const newIds = (newContratos || []).map(c => c.id).sort().join(',');
          const oldIds = (oldContratos || []).map(c => c.id).sort().join(',');
          
          if (newIds !== oldIds) {// Limpiar formulario si estaba en modo edición de un contrato que ya no existe
            if (this.modoEdicion && this.contratoEditandoId) {
              const contratoExiste = (newContratos || []).some(c => c.id === this.contratoEditandoId);
              if (!contratoExiste) {
                this.cancelarFormulario();
              }
            }
            
            // Forzar actualización de la vista
            this.$nextTick(() => {
              this.$forceUpdate();
            });
          }
        }
      }
    },
    
    // Cuando cambian las tarifas, actualizar el formulario si es necesario
    tarifasGas: {
      handler() {
        if (this.visible && this.mostrandoFormulario && !this.modoEdicion && this.nuevoContrato) {
          this.$nextTick(() => {
            // Solo actualizar si no es un punto de gas (para asignar "Sin Tarifa")
            if (!this.esGas) {
              const idSinTarifaGas = this.tarifasGas?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
              this.nuevoContrato.idTarifaGas = idSinTarifaGas;
            }
          });
        }
      }
    },
    
    tarifasLuz: {
      handler() {
        if (this.visible && this.mostrandoFormulario && !this.modoEdicion && this.nuevoContrato) {
          this.$nextTick(() => {
            // Solo actualizar si no es un punto de luz (para asignar "Sin Tarifa")
            if (!this.esLuz) {
              const idSinTarifaLuz = this.tarifasLuz?.find(t => t.nombre === 'Sin Tarifa')?.id || '';
              this.nuevoContrato.idTarifaLuz = idSinTarifaLuz;
            }
          });
        }
      }
    },
    
    // Sincronizar comercializadoras del prop con el data interno
    comercializadoras: {
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          // Actualizar la lista interna si el prop cambia
          this.comercializadorasList = [...newVal];
        }
      },
      immediate: true
    }
  },
  async mounted() {
    // Inicializar como NO cargando
    this.cargandoDatos = false;
    
    // Obtener el nivel de acceso del usuario
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      this.nivelAcceso = usuario.nivelAcceso;
    }
    
    // Solo cargar datos si el modal está visible Y faltan datos
    if (this.visible) {
      const needsGasTarifas = !this.tarifasGas || this.tarifasGas.length === 0;
      const needsLuzTarifas = !this.tarifasLuz || this.tarifasLuz.length === 0;
      const needsComercializadoras = !this.comercializadorasList || this.comercializadorasList.length === 0;
      
      if (needsGasTarifas || needsLuzTarifas || needsComercializadoras) {
        this.cargandoDatos = true;
        
        const promises = [];
        
        if (needsGasTarifas) {
          promises.push(
            axios.get(`/tarifas-gas`)
              .then(response => {
                this.$emit('update:tarifasGas', response.data);
                return response.data;
              })
              .catch(error => {
                console.error("Error al cargar tarifas de gas:", error);
                return [];
              })
          );
        }
        
        if (needsLuzTarifas) {
          promises.push(
            axios.get(`/tarifas-luz`)
              .then(response => {
                this.$emit('update:tarifasLuz', response.data);
                return response.data;
              })
              .catch(error => {
                console.error("Error al cargar tarifas de luz:", error);
                return [];
              })
          );
        }
        
        // Cargar comercializadoras
        promises.push(this.cargarComercializadoras());
        
        // Esperar a que se carguen todas las tarifas necesarias
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error('Error al cargar algunas tarifas en mounted:', error);
        } finally {
          // Siempre detener el spinner después de intentar cargar
          this.cargandoDatos = false;
        }
        
        // Timeout de seguridad
        setTimeout(() => {
          this.cargandoDatos = false;
        }, 1500);
      }
    }
  }
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Variables CSS para consistencia */
:root {
  --primary-color: rgba(252, 215, 0);
  --surface-color: #ffffff;
  --border-color: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: #666666;
}

/* Contenedor principal sin pestañas */
.main-content-container {
  flex: 1;
  background-color: #f8f9fa;
  min-height: 0;
  overflow: hidden;
}

.main-content, .form-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

/* Botones de acción principales */
.action-buttons-main {
  display: flex;
  gap: 12px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e0a800;
  transform: translateY(-1px);
}

.btn-success {
  background-color: #198754;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #157347;
  transform: translateY(-1px);
}

/* Histórico de contratos */
.contracts-history {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.contracts-history h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Tabla del histórico */
.history-table-container {
  overflow: visible;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-top: 1rem;
  position: relative;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.history-table th {
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  font-size: 0.85rem;
  white-space: nowrap;
}

.history-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.history-row:hover {
  background-color: #f8f9fa;
}

.contract-number {
  font-weight: 600;
  color: #495057;
}

/* Indicadores de estado */
.status-indicators {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.status-badge.autoconsumo {
  background: #d4edda;
  color: #155724;
}

.status-badge.denuncia {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.normal {
  background: #e2e3e5;
  color: #383d41;
}

.status-badge.exencion {
  background: #fff3cd;
  color: #856404;
}

/* Botones de acción en la tabla */
.action-buttons {
  display: flex;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  position: relative;
  background: #fff;
  border: 1px solid #e0e0e0;
  color: #495057;
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

.btn-icon.btn-delete {
  color: #dc3545; /* Rojo para eliminar */
}
.btn-icon.btn-delete:hover {
  background-color: rgba(220,53,69,0.1);
  border-color: #dc3545;
  color: #dc3545;
}

/* Tooltips mejorados */
.btn-icon:hover::after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10000;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.btn-icon:hover::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, 0.9);
  z-index: 10000;
  pointer-events: none;
}

/* No history message */
.no-history {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 12px;
}

.no-history i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #dee2e6;
}

.no-history p {
  font-size: 1.1rem;
  margin-bottom: 20px;
}

/* Estados de contrato en la tabla */
.contrato-vigente {
  background-color: rgba(252, 215, 0, 0.1) !important;
  border-left: 4px solid rgba(252, 215, 0) !important;
}

.status-vigente {
  color: #198754;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-vigente i {
  color: #198754;
  animation: pulse 2s infinite;
}

.status-historico {
  color: #6c757d;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ===== MODALES COMPACTADOS ===== */

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
  border-radius: 0.4rem;
  width: 95%;
  max-width: 95%;
  height: 95vh;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 0.8rem 0 0.8rem 1.3rem;
  border-bottom: 1px solid #e0e0e0;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
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

/* Banner del cliente compacto */
.client-banner {
  background: linear-gradient(135deg, #fff3cd 0%, #fffbe6 100%);
  border-radius: 0.3rem;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.8rem;
  border: 1px solid #ffe082;
}

.client-info h4 {
  margin: 0 0 2px 0;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.client-header {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.client-info span {
  color: #666;
  font-size: 0.85rem;
}

.client-details {
  display: flex;
  flex-direction: row;
  gap: 12px;
  flex-wrap: wrap;
}

.client-details span {
  color: #666;
  font-size: 0.85rem;
}

/* Formulario compacto */
.modern-form {
  flex: 1;
  overflow-y: auto;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0.6rem;
}

/* Grid compacto */
.form-grid-modern {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.form-section-modern {
  background: var(--surface-color);
  border-radius: 0.3rem;
  border: 1px solid var(--border-color);
  padding: 0.6rem;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.form-section-modern.full-width {
  grid-column: 1 / -1;
}

/* Encabezados compactos */
.section-header-modern {
  display: flex;
  align-items: center;
  margin-bottom: 0.6rem;
  gap: 0.4rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-modern i {
  font-size: 1rem;
  color: black;
  width: 16px;
}

.section-header-modern h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Grupos de formulario compactos */
.form-group-modern {
  margin-bottom: 0.5rem;
}

.form-group-modern label {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
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
.select-error select {
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

/* Inputs compactos */
.input-with-icon-modern {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.8rem;
  width: 14px;
  z-index: 1;
}

.input-with-icon-modern .form-control-modern {
  padding-left: 1.3rem;
}

.form-control-modern {
  width: 100%;
  padding: 0.25rem 0.4rem;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--text-primary);
  background-color: white;
  height: 28px;
}

.form-control-modern:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
  outline: none;
}

.textarea-modern {
  height: auto !important;
  resize: vertical;
  min-height: 80px;
  max-height: 400px;
  padding-top: 0.4rem;
  line-height: 1.4;
  overflow-y: auto;
}

/* Selectores compactos */
.form-select-modern {
  width: 100%;
  padding: 0.25rem 0.4rem;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  font-size: 0.85rem;
  transition: all 0.2s;
  color: var(--text-primary);
  background-color: white;
  height: 28px;
  cursor: pointer;
}

.form-select-modern:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
  outline: none;
}

/* Potencias contratadas compactas */
.potencias-contratadas {
  margin-bottom: 0;
  padding: 0;
}

.potencias-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
}

.potencia-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.potencia-item label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.1rem;
}

.potencia-item input {
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  background: white;
  padding: 0.25rem 0.4rem;
  font-size: 0.85rem;
  height: 28px;
  width: 100%;
  transition: border-color 0.2s;
}

.potencia-item input:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

/* Potencias contratadas compactas integradas */
.potencias-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.potencias-contratadas-compactas {
  background: #f8f9fa;
  border-radius: 0.3rem;
  padding: 0.6rem;
  border: 1px solid #e9ecef;
}

.potencias-grid-compacta {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.4rem;
}

.potencia-item-compacta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.potencia-label-compacta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.1rem;
  text-align: center;
}

.potencia-input-compacta {
  width: 100%;
  height: 26px;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  background: white;
  padding: 0.2rem 0.3rem;
  font-size: 0.75rem;
  text-align: center;
  transition: all 0.2s;
}

.potencia-input-compacta:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

.potencia-input-compacta::placeholder {
  color: #aaa;
  font-size: 0.7rem;
}

/* Área de subida de PDF compacta */
.pdf-upload-area {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 0.3rem;
  padding: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pdf-upload-area:hover {
  border-color: var(--primary-color);
  background: #fff9e6;
}

.pdf-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.pdf-text {
  flex: 1;
}

.pdf-title {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.1rem;
  font-size: 0.9rem;
}

.pdf-desc {
  display: block;
  font-size: 0.75rem;
  color: #666;
}

.file-selected {
  margin-top: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: #fff6f4;
  border: 1px solid #ffe0db;
  border-radius: 0.2rem;
  color: #e74c3c;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

/* Checkboxes compactos */
.checkbox-input-modern {
  display: none;
}

.checkbox-custom-modern {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color);
  border-radius: 0.2rem;
  margin-right: 0.4rem;
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
  font-size: 10px;
}

.checkbox-label-modern {
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

/* Estilos compactos para la gestión de denuncia */
.denuncia-compacta {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.3rem;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.denuncia-checkbox-compacta {
  display: flex;
  align-items: center;
}

.denuncia-label-compacta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #dc2626;
  user-select: none;
}

.denuncia-input {
  display: none;
}

.denuncia-checkmark {
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

.denuncia-input:checked ~ .denuncia-checkmark {
  background-color: #dc2626;
  border-color: #dc2626;
}

.denuncia-checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.denuncia-input:checked ~ .denuncia-checkmark:after {
  display: block;
}

.denuncia-checkmark:after {
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.denuncia-text {
  color: #dc2626;
  font-weight: 500;
  padding: 5px;
}

.fecha-denuncia-inline {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px solid #fecaca;
  margin-top: 0.3rem;
  animation: slideIn 0.3s ease-out;
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
}

.fecha-input-compacta:focus {
  outline: none;
  border-color: #b91c1c;
  box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Badges informativos compactos */
.info-badge-modern {
  margin-top: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
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

/* Contenido estructurado de los badges */
.badge-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
}

.badge-title {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
}

.badge-content strong {
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-content span:not(.badge-title) {
  font-size: 0.8rem;
}

/* Botones compactos */
.btn-modern {
  padding: 0.5rem 0.8rem;
  border-radius: 0.3rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  border: none;
  outline: none;
}

.btn-modern:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary-color);
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

/* Pie del modal compacto */
.modal-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  flex-shrink: 0;
  border-top: 1px solid var(--border-color);
  background: var(--surface-color);
}

.required-legend {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ===== ESTILOS ORIGINALES PARA CONTRATO ACTUAL ===== */

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

/* Sección de características */
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
  border-color: var(--primary-color);
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
  color: var(--primary-color);
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

/* Modal de detalle */
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
  color: var(--primary-color);
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
  color: var(--primary-color);
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
  color: var(--primary-color);
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
  background: var(--primary-color);
  color: black;
  border-color: var(--primary-color);
}

.status-chip.denuncia.active {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.status-chip.exencion.active {
  background: #ffc107;
  color: #212529;
  border-color: #ffc107;
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

/* Media queries para responsividad */
@media (max-width: 1200px) {
  .form-grid-modern {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .potencias-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .potencias-grid-compacta {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .modern-grid {
    grid-template-columns: 1fr;
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
  
  .potencias-grid {
    grid-template-columns: 1fr;
  }
  
  .potencias-grid-compacta {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-content {
    width: 98%;
    max-width: 98%;
    height: 98vh;
    max-height: 98vh;
  }
}

@media (max-width: 480px) {
  .modal-title {
    font-size: 1rem;
  }
  
  .btn-modern {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .potencias-grid-compacta {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.2rem;
  }
  
  .potencia-input-compacta {
    max-width: 50px;
    font-size: 0.7rem;
    height: 24px;
  }
  
  .potencia-label-compacta {
    font-size: 0.7rem;
  }
}
</style>
