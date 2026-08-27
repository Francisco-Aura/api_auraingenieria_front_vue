<template>
  <div v-if="visible" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contratos-modal-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h1 id="contratos-modal-title" class="modal-title">Gestión de Contratos</h1>
        <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar gestión de contratos">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido principal sin pestañas -->
      <div v-if="cargandoDatos" class="main-content-container main-content-skeleton">
        <div class="client-banner">
          <div class="client-info">
            <div class="skeleton-line skeleton-line--lg"></div>
          </div>
        </div>
        <div class="contracts-history">
          <div class="history-table-container">
            <table class="history-table">
              <tbody>
                <tr v-for="n in 4" :key="'skeleton-' + n" class="skeleton-row">
                  <td v-for="col in 11" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-else class="main-content-container">
        
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
                      <button @click="editarContratoGenerico(contrato)" class="btn-icon btn-edit" title="Editar contrato" aria-label="Editar contrato">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="renovarContratoGenerico(contrato)" class="btn-icon btn-renew" title="Renovar contrato" aria-label="Renovar contrato">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button @click="verDetalleContrato(contrato)" class="btn-icon btn-view" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button
                        @click="descargarPDF(contrato)"
                        class="btn-icon btn-download"
                        title="Descargar PDF"
                        v-if="contrato.rutaArchivoContrato"
                        :disabled="descargandoPdfId === contrato.id"
                        :aria-busy="descargandoPdfId === contrato.id"
                        aria-label="Descargar PDF del contrato"
                      >
                        <i :class="descargandoPdfId === contrato.id ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
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
              
              <!-- Sección compartida de Observaciones y Comentario de Renovación -->
              <div class="form-section-modern section-observaciones-compartidas">
                <div class="section-header-modern">
                  <i class="fas fa-comment-alt"></i>
                  <h3>Observaciones y Renovación</h3>
                </div>

                <div class="observaciones-compartidas">
                  <div class="campo-compartido campo-observaciones">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea 
                      id="observaciones" 
                      v-model="nuevoContrato.observaciones" 
                      class="form-control-modern textarea-modern textarea-observaciones-compartida" 
                      rows="1"
                      maxlength="10000"
                      placeholder="Añada aquí cualquier observación relevante sobre el contrato..."
                    ></textarea>
                  </div>

                  <div class="campo-compartido campo-renovacion">
                    <label for="comentarioRenovacion">
                      <i class="fas fa-sync-alt"></i>
                      Comentario de Renovación
                    </label>
                    <textarea
                      id="comentarioRenovacion"
                      v-model="nuevoContrato.comentarioRenovacion"
                      class="form-control-modern textarea-modern textarea-comentario-renovacion"
                      rows="1"
                      maxlength="10000"
                      placeholder="Notas breves sobre la renovación..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Sección de Documento PDF -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-file-pdf"></i>
                  <h3>Documento del Contrato</h3>
                </div>
                
                <!-- La zona de arrastre/selección solo se muestra si no hay ningún
                     archivo activo (ni uno recién elegido, ni uno ya guardado en el
                     contrato). Evita poder seleccionar un archivo nuevo "encima" de
                     uno que ya existe sin haberlo quitado antes. -->
                <label
                  v-if="!selectedFile && !contratoTieneArchivo"
                  class="pdf-upload-area"
                  :class="{ 'is-dragging': arrastrandoPdf, 'has-error': errorArchivoContrato }"
                  for="contrato-pdf-input"
                  role="button"
                  tabindex="0"
                  :aria-describedby="errorArchivoContrato ? 'contrato-pdf-ayuda contrato-pdf-error' : 'contrato-pdf-ayuda'"
                  @keydown.enter.prevent="$refs.pdfInput.click()"
                  @keydown.space.prevent="$refs.pdfInput.click()"
                  @dragenter.prevent="onPdfDragEnter"
                  @dragover.prevent="onPdfDragEnter"
                  @dragleave.prevent="onPdfDragLeave"
                  @drop.prevent="onPdfDrop"
                >
                  <div class="pdf-icon">
                    <i :class="arrastrandoPdf ? 'fas fa-cloud-upload-alt' : 'fas fa-file-pdf'"></i>
                  </div>
                  <div class="pdf-text">
                    <span class="pdf-title">{{ arrastrandoPdf ? 'Suelta aquí el contrato' : 'Arrastra el contrato o selecciónalo' }}</span>
                    <span id="contrato-pdf-ayuda" class="pdf-desc">Solo PDF · máximo 10 MB</span>
                  </div>
                  <span class="pdf-select-button">Seleccionar PDF</span>
                </label>

                <!-- El input vive fuera del label de arriba para que los botones
                     "Sustituir" de las tarjetas de abajo puedan seguir abriendo el
                     selector de archivos aunque la zona de arrastre esté oculta. -->
                <input
                  id="contrato-pdf-input"
                  type="file"
                  ref="pdfInput"
                  @change="handleFileUpload"
                  accept="application/pdf,.pdf"
                  class="input-file-oculto"
                />

                <p v-if="errorArchivoContrato" id="contrato-pdf-error" class="pdf-upload-error" role="alert">
                  <i class="fas fa-exclamation-circle"></i>
                  {{ errorArchivoContrato }}
                </p>

                <!-- Archivo recién seleccionado por el usuario, pendiente de guardar -->
                <div v-if="selectedFile" class="file-selected">
                  <div class="file-selected-icon"><i class="fas fa-file-pdf"></i></div>
                  <div class="file-selected-info">
                    <strong>{{ selectedFile.name }}</strong>
                    <span>{{ formatearTamanoArchivo(selectedFile.size) }} · se guardará al pulsar "{{ textoBotonGuardar }}"</span>
                  </div>
                  <div class="file-selected-actions">
                    <button type="button" class="btn-file-action btn-file-replace" @click="$refs.pdfInput.click()">
                      <i class="fas fa-sync-alt"></i> Sustituir PDF
                    </button>
                    <button type="button" class="btn-file-action btn-file-remove" @click="limpiarArchivoSeleccionado" aria-label="Quitar PDF seleccionado">
                      <i class="fas fa-trash-alt"></i> Quitar
                    </button>
                  </div>
                </div>
                <!-- Archivo que el contrato ya tiene guardado en el backend -->
                <div v-else-if="contratoTieneArchivo" class="file-selected file-uploaded-from-backend">
                  <div class="file-selected-icon"><i class="fas fa-file-pdf"></i></div>
                  <div class="file-selected-info">
                    <strong>{{ nombreArchivoExistente || 'Documento del contrato' }}</strong>
                    <span>Ya guardado en el contrato</span>
                  </div>
                  <div class="file-selected-actions">
                    <button
                      type="button"
                      class="btn-file-action btn-download-existing"
                      @click="descargarPDFExistente(nuevoContrato)"
                      :disabled="descargandoPdfModal"
                      :aria-busy="descargandoPdfModal"
                    >
                      <i :class="descargandoPdfModal ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
                      {{ descargandoPdfModal ? 'Descargando...' : 'Descargar' }}
                    </button>
                    <button type="button" class="btn-file-action btn-file-replace" @click="$refs.pdfInput.click()">
                      <i class="fas fa-sync-alt"></i> Sustituir
                    </button>
                    <button type="button" class="btn-file-action btn-file-remove" @click="quitarArchivoBackend" aria-label="Quitar PDF del contrato">
                      <i class="fas fa-trash-alt"></i> Quitar
                    </button>
                  </div>
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
                  <div v-if="tieneExencionImpuestoElectrico" class="info-badge-modern success margen-reducido">
                    <i class="fas fa-bolt"></i>
                    <div class="badge-content">
                      <span class="badge-title">Exención Impuesto Eléctrico:</span>
                      <strong>Sí</strong>
                    </div>
                  </div>
                  <div v-else class="info-badge-modern neutral margen-reducido">
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
                <button type="submit" class="btn-modern btn-primary" :disabled="guardando" :aria-busy="guardando">
                  <i class="fas fa-save"></i> {{ textoBotonGuardar }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE CONTRATO - FUERA DEL MODAL PRINCIPAL -->
    <div v-if="mostrarModalDetalleContrato" class="modal-overlay detalle-contrato-modal" @click.self="cerrarModalDetalleContrato">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header">
          <h2><i class="fas fa-file-contract"></i> Detalle del Contrato</h2>
          <button type="button" @click="cerrarModalDetalleContrato" class="close-button" aria-label="Cerrar detalle del contrato">
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

export default {
  name: "ModalContratos",
  components: {},
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
      guardando: false,
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
        comentarioRenovacion: "",
      },
      comercializadorasList: [],
      nivelAcceso: null,
      errores: {},
      contratoTieneArchivo: false,
      nombreArchivoExistente: '',
      eliminarArchivoExistente: false,
      contratoOriginalIdRenovar: null,
      selectedFile: null,
      arrastrandoPdf: false,
      errorArchivoContrato: '',
      mostrarModalDetalleContrato: false,
      contratoDetalle: null,
      clienteDetalle: null,
      descargandoPdfId: null,
      descargandoPdfModal: false,
    };
  },

  methods: {
    handleFileUpload(event) {
      const archivo = event.target.files?.[0];
      if (!archivo) return false;
      return this.procesarArchivoContrato(archivo);
    },

    procesarArchivoContrato(archivo) {
      if (!archivo) return false;

      const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
      if (!esPdf) {
        this.mostrarErrorArchivo('El archivo seleccionado debe ser un PDF.');
        return false;
      }
      if (archivo.size > 10 * 1024 * 1024) {
        this.mostrarErrorArchivo('El PDF no puede superar los 10 MB.');
        return false;
      }
      this.errorArchivoContrato = '';
      this.selectedFile = archivo;
      return true;
    },

    onPdfDragEnter() {
      this.arrastrandoPdf = true;
    },

    onPdfDragLeave() {
      this.arrastrandoPdf = false;
    },

    onPdfDrop(event) {
      this.arrastrandoPdf = false;
      const archivo = event?.dataTransfer?.files?.[0];
      if (archivo) this.procesarArchivoContrato(archivo);
    },

    formatearTamanoArchivo(bytes) {
      if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '0 KB';
      const size = Number(bytes);
      if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    },

    // Cancela la selección de un archivo NUEVO pendiente de guardar. No debe
    // tocar el archivo que el contrato ya tenía guardado en el backend: si lo
    // hubiera, la tarjeta correspondiente debe reaparecer, no desaparecer.
    limpiarArchivoSeleccionado() {
      this.selectedFile = null;
      this.errorArchivoContrato = '';
      this.arrastrandoPdf = false;
      if (this.$refs?.pdfInput) this.$refs.pdfInput.value = '';
    },

    mostrarErrorArchivo(mensaje) {
      this.selectedFile = null;
      this.errorArchivoContrato = mensaje;
      if (this.$refs?.pdfInput) this.$refs.pdfInput.value = '';
      this.$swal.fire({
        icon: 'warning',
        title: 'PDF no válido',
        text: mensaje,
        confirmButtonColor: 'rgba(252, 215, 0)'
      });
    },

    // Quita el archivo YA GUARDADO en el backend. Solo actualiza el estado
    // local; la eliminación real (borrar el fichero y limpiar la BD) ocurre
    // al guardar el formulario, mandando eliminarArchivoContrato: true.
    quitarArchivoBackend() {
      this.contratoTieneArchivo = false;
      this.eliminarArchivoExistente = true;
      this.selectedFile = null;
      this.errorArchivoContrato = '';
      if (this.$refs?.pdfInput) this.$refs.pdfInput.value = '';
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
      this.cerrarModalDetalleContrato();
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.inicializarNuevoContrato();
      this.selectedFile = null;
    },

    async modificarContratoActual() {
      if (!this.contratoVigente) return;
      this.cerrarModalDetalleContrato();
      
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
      
      // Detectar si el contrato vigente trae un archivo ya subido desde el backend
      this.contratoTieneArchivo = !!(this.contratoVigente.rutaArchivoContrato);
      this.nombreArchivoExistente = this.contratoVigente.nombreArchivo || '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
    },

    async renovarContratoActual() {
      if (!this.contratoVigente) return;
      this.cerrarModalDetalleContrato();
      
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.contratoEditandoId = null;
      this.contratoOriginalIdRenovar = this.contratoVigente.id;
      
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
      
      // Una renovación siempre parte sin archivo (el usuario puede adjuntar uno nuevo)
      this.contratoTieneArchivo = false;
      this.nombreArchivoExistente = '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
    },

    async editarContratoGenerico(contrato) {
      this.cerrarModalDetalleContrato();
      
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
      
      // Detectar si el contrato trae un archivo ya subido desde el backend
      this.contratoTieneArchivo = !!(contrato.rutaArchivoContrato);
      this.nombreArchivoExistente = contrato.nombreArchivo || '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
    },

    async renovarContratoGenerico(contrato) {
      this.cerrarModalDetalleContrato();
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
      
      this.contratoTieneArchivo = false;
      this.nombreArchivoExistente = '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
    },

    cancelarFormulario() {
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.contratoOriginalIdRenovar = null;
      this.selectedFile = null;
      this.errorArchivoContrato = '';
      this.arrastrandoPdf = false;
      this.contratoTieneArchivo = false;
      this.nombreArchivoExistente = '';
      this.eliminarArchivoExistente = false;
    },

    async guardarContrato() {
      if (this.guardando) {
        return;
      }

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

      this.guardando = true;
      try {
        // Copiar los valores de los inputs pot1...pot6 a potencia1...potencia6 antes de enviar
        for (let i = 1; i <= 6; i++) {
          this.nuevoContrato['potencia' + i] = this.nuevoContrato['pot' + i];
        }
        
        // Asegurar que el ID está presente en modo edición
        if (this.modoEdicion && this.contratoEditandoId) {
          this.nuevoContrato.id = this.contratoEditandoId;
        }

        // Indicar al backend si hay que borrar el PDF ya guardado (el usuario
        // pulsó "Quitar" sobre el documento existente y no seleccionó uno nuevo).
        // Si se seleccionó un archivo nuevo, este flag es irrelevante: el backend
        // sustituye y borra el anterior automáticamente al subir el nuevo.
        this.nuevoContrato.eliminarArchivoContrato = this.eliminarArchivoExistente;

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
            response = await axios.put(
              `${process.env.VUE_APP_API_URL}/contratos/${this.contratoEditandoId}`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } else if (this.modoRenovacion && this.contratoOriginalIdRenovar) {
            response = await axios.post(
              `${process.env.VUE_APP_API_URL}/contratos/renovar/${this.contratoOriginalIdRenovar}`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          } else {
            response = await axios.post(
              `${process.env.VUE_APP_API_URL}/contratos`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
          }
        } 
        // Si no hay archivo, enviamos como JSON directamente
        else {
          if (this.modoEdicion && this.contratoEditandoId) {
            response = await axios.put(
              `${process.env.VUE_APP_API_URL}/contratos/${this.contratoEditandoId}`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          } else if (this.modoRenovacion && this.contratoOriginalIdRenovar) {
            response = await axios.post(
              `${process.env.VUE_APP_API_URL}/contratos/renovar/${this.contratoOriginalIdRenovar}`,
              this.nuevoContrato,
              { headers: { 'Content-Type': 'application/json' } }
            );
          } else {
            response = await axios.post(
              `${process.env.VUE_APP_API_URL}/contratos`,
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
        this.limpiarArchivoSeleccionado();
        
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
      } finally {
        this.guardando = false;
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

      this.descargandoPdfId = contrato.id;
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contratos/${contrato.id}/pdf`,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const filename = contrato.nombreArchivo ? contrato.nombreArchivo : `contrato_${contrato.id}.pdf`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
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
      } finally {
        this.descargandoPdfId = null;
      }
    },

    async descargarPDFExistente(contrato) {
      if (!contrato.rutaArchivoContrato) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Archivo no disponible',
          text: 'No hay archivo PDF disponible para este contrato'
        })
        return;
      }

      this.descargandoPdfModal = true;
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/contratos/${contrato.id}/pdf`,
          { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const filename = contrato.nombreArchivo ? contrato.nombreArchivo : `contrato_${contrato.id}.pdf`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Error al descargar el PDF existente:", error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al descargar el PDF del contrato'
        })
      } finally {
        this.descargandoPdfModal = false;
      }
    },

    verDetalleContrato(contrato) {
      try {
        this.contratoDetalle = typeof structuredClone === 'function'
          ? structuredClone(contrato)
          : JSON.parse(JSON.stringify(contrato));
      } catch (e) {
        this.contratoDetalle = { ...contrato };
      }

      const clienteFuente = contrato?.cliente || this.cliente || null;
      try {
        this.clienteDetalle = clienteFuente
          ? (typeof structuredClone === 'function' ? structuredClone(clienteFuente) : JSON.parse(JSON.stringify(clienteFuente)))
          : null;
      } catch (e) {
        this.clienteDetalle = clienteFuente ? { ...clienteFuente } : null;
      }

      this.mostrandoFormulario = false;
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
        comentarioRenovacion: "",
        userFO: "",
        passwordFO: "",
      };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = 0;
      }
      this.contratoTieneArchivo = false;
      this.nombreArchivoExistente = '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
    },

    cerrarModal() {
      this.$emit('cerrar-modal');
      // Resetear TODOS los estados y limpiar datos
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.contratoOriginalIdRenovar = null;
      this.selectedFile = null;
      this.errorArchivoContrato = '';
      this.arrastrandoPdf = false;
      this.contratoTieneArchivo = false;
      this.nombreArchivoExistente = '';
      this.eliminarArchivoExistente = false;
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


    async cargarComercializadoras() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/comercializadoras`);
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
          await axios.delete(`${process.env.VUE_APP_API_URL}/contratos/${contrato.id}`);
          
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
          this.contratoTieneArchivo = false;
          this.nombreArchivoExistente = '';
          this.eliminarArchivoExistente = false;
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
            axios.get(`${process.env.VUE_APP_API_URL}/tarifas-gas`)
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
            axios.get(`${process.env.VUE_APP_API_URL}/tarifas-luz`)
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

<style scoped src="./ModalContratos.css"></style>