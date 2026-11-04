<template>
  <div v-if="visible" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contratos-modal-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-file-contract"></i></span>
        <div class="aura-modal-header__titulos">
          <h1 id="contratos-modal-title" class="modal-title">{{ tituloModal }}</h1>
          <span class="aura-modal-header__subtitulo">
            <span><strong>{{ cliente?.nombre || 'Cliente no disponible' }}</strong></span>
            <span class="aura-dato"><span class="aura-dato__etiqueta">DNI/CIF</span>{{ dniClienteActual || 'No disponible' }}</span>
            <span class="aura-dato"><span class="aura-dato__etiqueta">CUPS</span>{{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
          </span>
        </div>
        <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar gestión de contratos">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido principal sin pestañas -->
      <div v-if="cargandoDatos" class="main-content-container main-content-skeleton">
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
          <!-- Botones de acción principales -->
          <div class="action-buttons-main">
            <button @click="crearNuevoContrato" class="btn-modern btn-primary">
              <i class="fas fa-plus"></i> Crear contrato
            </button>
            <button @click="modificarContratoActual" class="btn-modern btn-warning" v-if="tieneContratoVigente">
              <i class="fas fa-edit"></i> Modificar actual
            </button>
            <button @click="renovarContratoActual" class="btn-modern btn-success" v-if="tieneContratoVigente">
              <i class="fas fa-sync-alt"></i> Renovar actual
            </button>
          </div>

          <!-- Histórico de contratos -->
          <div class="contracts-history">
            <h3><i class="fas fa-history"></i> Histórico de contratos</h3>
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
                      <span v-else-if="esContratoProximo(contrato)" class="status-proximo" :title="'Empieza el ' + formatDate(contrato.fechaInicio)">
                        <i class="fas fa-clock"></i> PRÓXIMO
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
                    <td class="celda-numero">{{ formatearConsumo(contrato.consumoAnual) }}</td>
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
                      <button @click="verDetalleContrato(contrato)" class="btn-icon btn-view" title="Ver detalle" aria-label="Ver detalle del contrato">
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
                      <button @click="eliminarContrato(contrato)" class="btn-icon btn-delete" title="Eliminar contrato" aria-label="Eliminar contrato" v-if="nivelAcceso === 1">
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
          <form @submit.prevent="guardarContrato" class="modern-form formulario-contrato" novalidate>
            <div class="aura-pestanas" role="tablist" aria-label="Secciones del contrato">
              <button
                v-for="(p, indice) in pestanasContrato"
                :key="p.id"
                type="button"
                role="tab"
                class="aura-pestana"
                :class="{ 'aura-pestana--activa': pestanaContrato === p.id, 'aura-pestana--error': pestanaConErrores(p.id) }"
                :aria-selected="pestanaContrato === p.id ? 'true' : 'false'"
                @click="pestanaContrato = p.id"
              >
                <span class="aura-pestana__numero">{{ indice + 1 }}</span>
                <span>{{ p.label }}</span>
                <span
                  v-if="p.id === 'mcas'"
                  class="aura-pestana__marca"
                  :class="'aura-pestana__marca--' + marcaMcas"
                  :title="tituloMarcaMcas"
                ></span>
              </button>
            </div>

            <div class="pestana-contrato-cuerpo">
              <!-- 1 · Contrato -->
              <div v-show="pestanaContrato === 'contrato'" class="rejilla-contrato" role="tabpanel">
                <div class="columna-contrato">
                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>Fechas y comercializadora</h3>
                  </div>
                  <div class="fila-campos fila-campos--3">
                    <div class="form-group-modern">
                      <label for="fechaEnvioContrato">Fecha envío <span class="required">*</span></label>
                      <CampoFecha id="fechaEnvioContrato" v-model="nuevoContrato.fechaEnvio" required
                                  :error="!!errores.fechaEnvio" @change="errores.fechaEnvio = ''" />
                      <small v-if="errores.fechaEnvio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaEnvio }}</small>
                    </div>
                    <div class="form-group-modern">
                      <label for="fechaInicioContrato">Fecha inicio <span class="required">*</span></label>
                      <CampoFecha id="fechaInicioContrato" v-model="nuevoContrato.fechaInicio" required
                                  :error="!!errores.fechaInicio" :atajos="atajosInicioContrato"
                                  @change="alCambiarInicioContrato" />
                      <small v-if="errores.fechaInicio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaInicio }}</small>
                    </div>
                    <div class="form-group-modern">
                      <!-- La duración va en la línea de la etiqueta: debajo movía todo el formulario -->
                      <div class="etiqueta-fecha">
                        <label for="fechaFinContrato">Fecha fin <span class="required">*</span></label>
                        <span v-if="duracionContrato" class="ayuda-fecha">Duración: {{ duracionContrato }}</span>
                      </div>
                      <CampoFecha id="fechaFinContrato" v-model="nuevoContrato.fechaFin" required
                                  :error="!!errores.fechaFin" :hoy="false" :min="nuevoContrato.fechaInicio || ''"
                                  :abrir-en="finUnAnioContrato" :atajos="atajosFinContrato" :marcas="marcasFinContrato"
                                  @change="alCambiarFinContrato" />
                      <small v-if="errores.fechaFin" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaFin }}</small>
                    </div>
                  </div>
                  <div class="fila-campos fila-campos--2">
                    <div class="form-group-modern">
                      <label for="comercializadoraActual">Comercializadora actual <span class="required">*</span></label>
                      <div class="select-container-modern" :class="{ 'select-error': errores.idComercializadoraActual }">
                        <select id="comercializadoraActual" v-model="nuevoContrato.idComercializadoraActual"
                                class="form-select-modern" @change="errores.idComercializadoraActual = ''" required>
                          <option value="">Seleccione...</option>
                          <option v-for="comercializadora in comercializadorasList" :value="comercializadora.id" :key="comercializadora.id">
                            {{ comercializadora.nombre }}
                          </option>
                        </select>
                      </div>
                      <small v-if="errores.idComercializadoraActual" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idComercializadoraActual }}</small>
                    </div>
                    <div class="form-group-modern">
                      <label for="comercializadoraAnterior">Comercializadora anterior</label>
                      <div class="select-container-modern">
                        <select id="comercializadoraAnterior" v-model="nuevoContrato.idComercializadoraAnterior" class="form-select-modern">
                          <option value="">Seleccione...</option>
                          <option v-for="comercializadora in comercializadorasList" :value="comercializadora.id" :key="comercializadora.id">
                            {{ comercializadora.nombre }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <!-- Seguidos (reunión del 04/11/2026): comercializadora, tipo de precio y producto.
                       El desplegable de productos solo trae los de esa comercializadora y ese tipo de precio. -->
                  <div class="fila-campos fila-campos--2">
                    <div class="form-group-modern" :class="claseCampoMcas('mcasTipoPrecio')">
                      <label for="mcasTipoPrecio">Tipo de precio</label>
                      <div class="select-container-modern">
                        <select id="mcasTipoPrecio" v-model="nuevoContrato.mcasTipoPrecio" class="form-select-modern"
                                title="Fijo: precio pactado. Indexado: sigue al mercado. Sin comisión automática: el contrato no comisiona.">
                          <option :value="null">Sin comisión automática</option>
                          <option value="FIJO">FIJO</option>
                          <option value="INDEXADO">INDEXADO</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group-modern" :class="claseCampoMcas('mcasIdProductoComercial')">
                      <label for="mcasIdProductoComercial">Tarifa de precios (producto)</label>
                      <div class="select-container-modern">
                        <select id="mcasIdProductoComercial" v-model="nuevoContrato.mcasIdProductoComercial" class="form-select-modern"
                                :disabled="!!textoSinProductoMcas"
                                title="Oferta contratada con la comercializadora (por ejemplo, Plan Personalizado)">
                          <option :value="null">{{ textoSinProductoMcas || 'Sin producto' }}</option>
                          <option v-for="p in productosComercializesFiltrados" :key="p.id" :value="p.id">
                            {{ etiquetaProductoMcas(p) }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-globe"></i>
                    <h3>Facturación online</h3>
                  </div>
                  <div class="fila-campos fila-campos--2">
                    <div class="form-group-modern">
                      <label for="userFO">Usuario</label>
                      <input type="text" id="userFO" v-model="nuevoContrato.userFO" class="form-control-modern"
                             maxlength="200" placeholder="Usuario de la web de la comercializadora" />
                    </div>
                    <div class="form-group-modern">
                      <label for="passwordFO">Contraseña</label>
                      <input type="text" id="passwordFO" v-model="nuevoContrato.passwordFO" class="form-control-modern"
                             maxlength="200" placeholder="Contraseña de la web" />
                    </div>
                  </div>
                </section>

                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-comment-alt"></i>
                    <h3>Observaciones y renovación</h3>
                  </div>
                  <div class="form-group-modern">
                    <label for="observaciones">Observaciones generales</label>
                    <textarea id="observaciones" v-model="nuevoContrato.observaciones"
                              class="form-control-modern textarea-modern textarea-contrato" rows="4" maxlength="10000"
                              placeholder="Añada aquí cualquier observación relevante sobre el contrato..."></textarea>
                  </div>
                  <div class="form-group-modern">
                    <label for="comentarioRenovacion">Comentario de renovación</label>
                    <textarea id="comentarioRenovacion" v-model="nuevoContrato.comentarioRenovacion"
                              class="form-control-modern textarea-modern textarea-contrato textarea-contrato--corta" rows="2" maxlength="10000"
                              placeholder="Notas breves sobre la renovación..."></textarea>
                  </div>
                </section>

                </div>
                <div class="columna-contrato">
                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-file-contract"></i>
                    <h3>Datos del contrato</h3>
                  </div>
                  <div class="fila-campos fila-campos--2">
                    <div class="form-group-modern">
                      <label for="contrato">Número de contrato <span class="required">*</span></label>
                      <input type="text" id="contrato" v-model="nuevoContrato.contrato"
                             class="form-control-modern" :class="{ 'input-error': errores.contrato }"
                             @input="errores.contrato = ''" maxlength="100" required />
                      <small v-if="errores.contrato" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.contrato }}</small>
                    </div>
                    <div class="form-group-modern">
                      <label for="consumoAnual">Consumo anual (kWh) <span class="required">*</span></label>
                      <input type="number" id="consumoAnual" v-model="nuevoContrato.consumoAnual"
                             class="form-control-modern" step="0.0001" min="0" required placeholder="0" />
                    </div>
                  </div>
                  <div class="fila-campos fila-campos--2">
                    <div class="form-group-modern">
                      <label for="tarifaLuz">
                        <i class="fas fa-bolt" :class="{ 'text-active': esLuz, 'text-disabled': !esLuz }"></i>
                        Tarifa luz <span v-if="esLuz" class="required">*</span>
                      </label>
                      <div class="select-container-modern">
                        <select id="tarifaLuz" v-model="nuevoContrato.idTarifaLuz" class="form-select-modern" :disabled="!esLuz" :required="esLuz">
                          <option v-if="esLuz" value="">Seleccione...</option>
                          <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">{{ tarifa.nombre }}</option>
                        </select>
                      </div>
                    </div>
                    <div class="form-group-modern">
                      <label for="tarifaGas">
                        <i class="fas fa-fire" :class="{ 'text-active': esGas, 'text-disabled': !esGas }"></i>
                        Tarifa gas <span v-if="esGas" class="required">*</span>
                      </label>
                      <div class="select-container-modern">
                        <select id="tarifaGas" v-model="nuevoContrato.idTarifaGas" class="form-select-modern" :disabled="!esGas" :required="esGas">
                          <option v-if="esGas" value="">Seleccione...</option>
                          <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">{{ tarifa.nombre }}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="form-group-modern">
                    <label class="potencias-label">Potencias contratadas (kW)</label>
                    <div class="potencias-grid-compacta">
                      <div class="potencia-item-compacta" v-for="n in 6" :key="n">
                        <label :for="'pot' + n" class="potencia-label-compacta">P{{ n }}</label>
                        <input :id="'pot' + n" v-model="nuevoContrato['pot' + n]" type="number" step="0.0001" min="0"
                               class="potencia-input-compacta" placeholder="0" />
                      </div>
                    </div>
                  </div>
                </section>

                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-solar-panel"></i>
                    <h3>Autoconsumo, exenciones y denuncia</h3>
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
                <div class="form-group-modern">
                  <!-- Contenedor compacto para denuncia -->
                  <div class="denuncia-compacta" :class="{ 'denuncia-compacta--activa': denunciaRealizada }">
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
                      <CampoFecha id="fechaDenunciaContrato" v-model="nuevoContrato.fechaDenunciaContrato"
                                  compacto :required="denunciaRealizada" />
                    </div>
                  </div>
                </div>
                </section>
                <section class="form-section-modern">
                  <div class="section-header-modern">
                    <i class="fas fa-file-pdf"></i>
                    <h3>Documento del contrato</h3>
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
                    <strong :title="selectedFile.name">{{ selectedFile.name }}</strong>
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
                    <strong :title="nombreArchivoExistente || 'Documento del contrato'">{{ nombreArchivoExistente || 'Documento del contrato' }}</strong>
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
                </section>
                </div>
              </div>

              <!-- 2 · Comisión MCAS -->
              <div v-show="pestanaContrato === 'mcas'" class="pestana-mcas" role="tabpanel">
                <!-- Al modificar un contrato guardado: lo que hay hoy de su comisión -->
                <div v-if="modoEdicion && textoComisionActual" class="mcas-actual" role="note">
                  <i class="fas fa-receipt" aria-hidden="true"></i>
                  <span><strong>Comisión actual:</strong> {{ textoComisionActual }}</span>
                </div>

                <!-- Comisión estimada (vista previa del servidor) o lo que falta para calcularla -->
                <div class="mcas-estado" :class="'mcas-estado--' + cabeceraMcas.tono" role="status" aria-live="polite">
                  <i :class="cabeceraMcas.icono" aria-hidden="true"></i>
                  <div class="mcas-estado-texto">
                    <div class="mcas-estado-titulo">
                      <strong>{{ cabeceraMcas.titulo }}</strong>
                      <span v-if="cabeceraMcas.estimacion" class="mcas-estimacion-marca">
                        Estimación
                      </span>
                    </div>
                    <ul v-if="cabeceraMcas.faltan.length" class="mcas-faltan">
                      <li v-for="f in cabeceraMcas.faltan" :key="f.campo">
                        <button type="button" class="mcas-enlace" @click="irACampoMcas(f.campo)">{{ f.etiqueta }}</button>
                      </li>
                    </ul>
                    <ul v-if="cabeceraMcas.avisos.length" class="mcas-avisos">
                      <li v-for="(aviso, indiceAviso) in cabeceraMcas.avisos" :key="indiceAviso">{{ aviso }}</li>
                    </ul>
                    <span v-if="cabeceraMcas.detalle">{{ cabeceraMcas.detalle }}</span>
                    <span v-if="cargandoVistaPrevia && vistaPreviaMcasValida" class="mcas-estado-cargando">
                      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> {{ esAdminMcas ? 'Actualizando la estimación…' : 'Comprobando los datos…' }}
                    </span>
                  </div>
                </div>
                <div v-if="avisoRecomendadoMcas" class="mcas-recomendado" role="note">
                  <i class="fas fa-lightbulb" aria-hidden="true"></i>
                  <span>{{ avisoRecomendadoMcas }}</span>
                </div>

                <section class="form-section-modern mcas-section">
                  <!-- Datos de la pestaña Contrato que usa la comisión: aquí solo se enseñan -->
                  <div v-if="filasSoloLecturaMcas.length" class="mcas-solo-lectura">
                    <div v-for="fila in filasSoloLecturaMcas" :key="fila.campo" class="mcas-solo-lectura__fila"
                         :class="{ 'mcas-solo-lectura__fila--falta': fila.falta }">
                      <span class="mcas-solo-lectura__etiqueta">{{ fila.etiqueta }}</span>
                      <span class="mcas-solo-lectura__valor">{{ fila.valor }}</span>
                      <button type="button" class="mcas-enlace" @click="irACampoMcas(fila.campo)">
                        Cambiar en pestaña «Contrato»
                      </button>
                    </div>
                  </div>

                  <!-- Cada campo se dibuja una vez: a la vista o plegado en «Otros datos» (nunca se borra su valor) -->
                  <template v-for="grupo in gruposCamposMcas" :key="grupo.id">
                    <component :is="grupo.plegado ? 'details' : 'div'" :class="grupo.plegado ? 'mcas-otros' : 'mcas-grupo'">
                      <summary v-if="grupo.plegado" class="mcas-otros__titulo">
                        Otros datos ({{ camposMcas.otrosConValor }} con valor)
                      </summary>
                      <p v-if="grupo.plegado" class="mcas-otros__ayuda">
                        No intervienen en la comisión estimada de este contrato. Lo que ya tengan escrito se conserva.
                      </p>
                      <div class="mcas-form-row">
                        <template v-for="campo in grupo.campos" :key="campo">
                          <div v-if="campo === 'mcasTipoSuministro'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasTipoSuministro"><i class="fas fa-fire-alt"></i> Tipo de suministro</label>
                            <div class="select-container-modern">
                              <select id="mcasTipoSuministro" v-model="nuevoContrato.mcasTipoSuministro" class="form-select-modern"
                                      :class="{ 'input-error': errores.mcasTipoSuministro }" @change="errores.mcasTipoSuministro = ''">
                                <option :value="null">Seleccione...</option>
                                <option value="LUZ">LUZ</option>
                                <option value="GAS">GAS</option>
                              </select>
                            </div>
                            <small v-if="errores.mcasTipoSuministro" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.mcasTipoSuministro }}</small>
                          </div>

                          <div v-else-if="campo === 'mcasEsRenovacion'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasEsRenovacion"><i class="fas fa-sync-alt"></i> ¿Es renovación?</label>
                            <div class="select-container-modern">
                              <select id="mcasEsRenovacion" v-model="nuevoContrato.mcasEsRenovacion" class="form-select-modern"
                                      :disabled="modoRenovacion">
                                <option :value="null">No especificado</option>
                                <option :value="false">No (nuevo contrato)</option>
                                <option :value="true">Sí (renovación)</option>
                              </select>
                            </div>
                            <!-- Al renovar, el servidor la calcula siempre como renovación -->
                            <small class="mcas-campo-ayuda">{{ modoRenovacion ? 'Las renovaciones siempre se calculan como renovación.' : 'Las renovaciones pueden tener otra comisión.' }}</small>
                          </div>

                          <div v-else-if="campo === 'mcasTipoRenovacion'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasTipoRenovacion"><i class="fas fa-file-signature"></i> Tipo de renovación</label>
                            <div class="select-container-modern">
                              <select id="mcasTipoRenovacion" v-model="nuevoContrato.mcasTipoRenovacion" class="form-select-modern">
                                <option :value="null">Seleccione...</option>
                                <option value="FIRMADA">FIRMADA</option>
                                <option value="TACITA">TÁCITA</option>
                                <option value="OTRA">OTRA</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">Firmada si el cliente firmó la renovación; tácita si se renovó sola.</small>
                          </div>

                          <div v-else-if="campo === 'mcasNumeroPagos'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasNumeroPagos"><i class="fas fa-credit-card"></i> Nº de pagos</label>
                            <div class="input-with-icon-modern">
                              <i class="fas fa-credit-card icon-prefix"></i>
                              <input id="mcasNumeroPagos" type="number" min="1" max="12" step="1"
                                     v-model.number="nuevoContrato.mcasNumeroPagos"
                                     class="form-control-modern" :class="{ 'input-error': errores.mcasNumeroPagos }"
                                     @input="errores.mcasNumeroPagos = ''" placeholder="1"/>
                            </div>
                            <small v-if="errores.mcasNumeroPagos" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.mcasNumeroPagos }}</small>
                            <small v-else class="mcas-campo-ayuda">En cuántos pagos se cobra la comisión (de 1 a 12).</small>
                          </div>

                          <div v-else-if="campo === 'mcasSegmento'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasSegmento"><i class="fas fa-users"></i> Segmento</label>
                            <div class="select-container-modern">
                              <select id="mcasSegmento" v-model="nuevoContrato.mcasSegmento" class="form-select-modern">
                                <option :value="null">Seleccione...</option>
                                <option value="RESIDENCIAL">RESIDENCIAL</option>
                                <option value="PYME">PYME</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">Residencial para particulares; pyme para empresas y autónomos.</small>
                          </div>

                          <div v-else-if="campo === 'mcasAltaNueva'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasAltaNueva"><i class="fas fa-star"></i> Alta nueva</label>
                            <div class="select-container-modern">
                              <select id="mcasAltaNueva" v-model="nuevoContrato.mcasAltaNueva" class="form-select-modern">
                                <option :value="null">No especificado</option>
                                <option :value="true">Sí (primera alta)</option>
                                <option :value="false">No</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">Sí, si el cliente contrata por primera vez con esta comercializadora.</small>
                          </div>

                          <div v-else-if="campo === 'mcasAmbito'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasAmbito"><i class="fas fa-map-marker-alt"></i> Ámbito</label>
                            <div class="select-container-modern">
                              <select id="mcasAmbito" v-model="nuevoContrato.mcasAmbito" class="form-select-modern">
                                <option :value="null">Sin especificar</option>
                                <option v-for="opcion in opcionesAmbitoMcas" :key="opcion.valor" :value="opcion.valor">{{ opcion.etiqueta }}</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">Dentro o fuera de ámbito, según indique la comercializadora.</small>
                          </div>

                          <div v-else-if="campo === 'mcasZonaComision'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasZonaComision"><i class="fas fa-map"></i> Zona de comisión</label>
                            <div class="select-container-modern">
                              <select id="mcasZonaComision" v-model="nuevoContrato.mcasZonaComision" class="form-select-modern">
                                <option :value="null">Sin especificar</option>
                                <option v-for="zona in opcionesZonaMcas" :key="zona" :value="zona">{{ zona }}</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">ZAR si el CUPS de luz empieza por ES0021; ZBR en el resto.</small>
                          </div>

                          <div v-else-if="campo === 'mcasIdGestora'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasIdGestora"><i class="fas fa-building"></i> Gestora</label>
                            <div class="select-container-modern">
                              <select id="mcasIdGestora" v-model="nuevoContrato.mcasIdGestora" class="form-select-modern">
                                <option :value="null">Sin gestora específica</option>
                                <option v-for="g in gestorasList" :key="g.id" :value="g.id">{{ g.nombre }}</option>
                              </select>
                            </div>
                            <small class="mcas-campo-ayuda">Canal por el que se gestiona el contrato, si la comisión depende de él.</small>
                          </div>

                          <div v-else-if="campo === 'mcasFeeEurMwh'" class="form-group-modern" :class="claseCampoMcas(campo)">
                            <label for="mcasFeeEurMwh"><i class="fas fa-euro-sign"></i> FEE del contrato</label>
                            <div class="input-with-icon-modern">
                              <i class="fas fa-euro-sign icon-prefix"></i>
                              <input id="mcasFeeEurMwh" type="text" inputmode="decimal"
                                     v-model="nuevoContrato.mcasFeeEurMwh"
                                     class="form-control-modern" :class="{ 'input-error': errores.mcasFeeEurMwh }"
                                     @input="errores.mcasFeeEurMwh = ''" placeholder="ej.: 7,5"/>
                              <span class="mcas-sufijo">€/MWh</span>
                            </div>
                            <small v-if="errores.mcasFeeEurMwh" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.mcasFeeEurMwh }}</small>
                            <small v-else class="mcas-campo-ayuda">Importe negociado con el cliente. Solo hace falta si la comisión se calcula sobre el FEE.</small>
                          </div>

                        </template>
                      </div>
                    </component>
                  </template>

                  <!-- Aviso retrocesión -->
                  <div class="mcas-retro-note">
                    <i class="fas fa-shield-alt"></i>
                    <span>La <strong>política de retrocesión</strong> publicada de la comercializadora se muestra en la propuesta
                    como retrocesión potencial: <em>no se descuenta en el alta</em> y solo se aplicaría si el contrato causa baja anticipada.</span>
                  </div>
                </section>
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
    <div v-if="mostrarModalDetalleContrato" class="modal-overlay detalle-contrato-modal" v-cierre-fondo="cerrarModalDetalleContrato">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header aura-modal-header">
          <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-file-contract"></i></span>
          <div class="aura-modal-header__titulos">
            <h2>Detalle del contrato</h2>
            <span class="aura-modal-header__subtitulo"><span class="aura-dato"><span class="aura-dato__etiqueta">Contrato</span>{{ contratoDetalle?.contrato || '—' }}</span></span>
          </div>
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
                  <i class="fas fa-bolt"></i> {{ formatearConsumo(contratoDetalle?.consumoAnual) }}
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
import { descargarBlob } from '@/utils/descargas';
import axios from "axios";
import { fechaLocalISO, enVigorHoy, fechaES, finDePeriodo, mesesExactos, sumarDias, textoDuracion, atajoPrimeroDelMes, atajosDuracion } from "@/utils/fechas";
import CampoFecha from '@/components/comun/CampoFecha.vue';
import { cupsRecortado } from "@/utils/cups";
import { leerDecimal } from "@/utils/numeros";
import { nombreComercializadora } from "@/utils/maestros";
import { escaparHtml } from "@/utils/html";
import { cabeceraVistaPrevia, campoRelevante, faltantesVistaPrevia, opcionesCampoMcas, organizarCamposMcas, textoResumenMcas } from './mcasCamposContrato';

// Pestañas del formulario y campos validados en cada una
// Miles siempre con punto (es-ES no los pone en números de cuatro cifras)
const FORMATO_CONSUMO = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' });

const PESTANAS_CONTRATO = [
  { id: 'contrato', label: 'Contrato', campos: ['fechaEnvio', 'fechaInicio', 'fechaFin', 'idComercializadoraActual', 'contrato'] },
  { id: 'mcas', label: 'Comisión MCAS', campos: ['mcasTipoSuministro', 'mcasFeeEurMwh', 'mcasNumeroPagos'] },
];

// Vista previa de la comisión: espera tras el último cambio antes de pedirla.
const ESPERA_VISTA_PREVIA_MS = 600;
// No influyen en la comisión: no viajan a la vista previa ni provocan otra petición al escribirlos.
const CAMPOS_FUERA_VISTA_PREVIA = ['userFO', 'passwordFO', 'observaciones', 'comentarioRenovacion', 'eliminarArchivoContrato'];
// Campos que se rellenan en la pestaña Contrato y el id de su control (el resto usa el nombre del campo).
const CAMPOS_EN_PESTANA_CONTRATO = ['contrato', 'fechaInicio', 'idComercializadoraActual', 'consumoAnual', 'idTarifaLuz', 'idTarifaGas',
  'mcasTipoPrecio', 'mcasIdProductoComercial', 'potenciaContratada'];
const ID_CAMPO_FORMULARIO = { fechaInicio: 'fechaInicioContrato', idComercializadoraActual: 'comercializadoraActual', idTarifaLuz: 'tarifaLuz', idTarifaGas: 'tarifaGas',
  potenciaContratada: 'pot1' };
const ETIQUETA_AMBITO = { NA: 'N/A' };

export default {
  name: "ModalContratos",
  components: { CampoFecha },
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
        // Campos MCAS
        mcasTipoPrecio: null,
        mcasTipoSuministro: null,
        mcasSegmento: null,
        mcasEsRenovacion: null,
        mcasTipoRenovacion: null,
        mcasAmbito: null,
        mcasIdGestora: null,
        mcasIdProductoComercial: null,
        mcasZonaComision: null,
        mcasFeeEurMwh: null,
        mcasFeeUnidad: 'EUR_MWH',
        mcasPotenciaCalculo: null,
        mcasNumeroPagos: null,
        mcasFechaPrimeraAplicacion: null,
        mcasAltaNueva: null,
        mcasFechaUltimaRelacionComercializadora: null,
      },
      comercializadorasList: [],
      // Petición de gestoras/productos MCAS en curso, compartida por todas las llamadas.
      cargaGestorasProductos: null,
      gestorasList: [],
      productosComerciales: [],
      // Pestaña visible del formulario: contrato · mcas
      pestanaContrato: 'contrato',
      pestanasContrato: PESTANAS_CONTRATO,
      nivelAcceso: null,
      errores: {},
      contratoTieneArchivo: false,
      nombreArchivoExistente: '',
      eliminarArchivoExistente: false,
      contratoOriginalIdRenovar: null,
      // Fecha fin puesta por la aplicación ({ de: contrato del formulario, fin, meses }): mientras
      // nadie la cambie a mano, sigue a la fecha de inicio manteniendo la duración.
      finPropuesta: null,
      selectedFile: null,
      arrastrandoPdf: false,
      errorArchivoContrato: '',
      mostrarModalDetalleContrato: false,
      contratoDetalle: null,
      clienteDetalle: null,
      descargandoPdfId: null,
      descargandoPdfModal: false,
      // Comisión MCAS: vista previa mientras se rellena y resumen del contrato guardado
      vistaPrevia: null,
      cargandoVistaPrevia: false,
      errorVistaPrevia: false,
      // Número de la última petición: descarta las respuestas que llegan tarde
      solicitudVistaPrevia: 0,
      temporizadorVistaPrevia: null,
      resumenMcas: null,
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
        confirmButtonColor: '#fcd700'
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
      if (this.nuevoContrato.mcasTipoPrecio) {
        // Campo no informado (null, vacío o ausente en contratos antiguos)
        const informado = (valor) => valor !== null && valor !== undefined && String(valor).trim() !== '';
        if (!this.nuevoContrato.mcasTipoSuministro) {
          this.errores.mcasTipoSuministro = 'Indique si el suministro es de luz o de gas';
          valido = false;
        }
        const fee = this.normalizarDecimalMcas(this.nuevoContrato.mcasFeeEurMwh);
        if (informado(this.nuevoContrato.mcasFeeEurMwh) && fee === null) {
          this.errores.mcasFeeEurMwh = 'El FEE debe ser un número no negativo';
          valido = false;
        }
        const pagos = this.nuevoContrato.mcasNumeroPagos;
        if (informado(pagos) && (!Number.isInteger(Number(pagos)) || Number(pagos) < 1 || Number(pagos) > 12)) {
          this.errores.mcasNumeroPagos = 'El número de pagos debe estar entre 1 y 12';
          valido = false;
        }
      }
      return valido;
    },

    normalizarDecimalMcas(valor) {
      // Como en Comisiones MCAS, pero aquí un negativo no vale
      const numero = leerDecimal(valor);
      return numero !== null && numero >= 0 ? numero : null;
    },

    /**
     * Deja un contrato listo para enviarlo al servidor: normaliza el FEE (con coma o
     * punto), copia los huecos pot1…pot6 a potencia1…potencia6 y fija el id al
     * modificar. La potencia de cálculo (siempre la mayor), la primera aplicación (la
     * fecha de inicio) y la última relación con la comercializadora (la calcula el
     * servidor) ya no se rellenan a mano. Lo usan el guardado (sobre el propio
     * formulario) y la vista previa (sobre una copia).
     */
    payloadContrato(contrato = this.nuevoContrato) {
      contrato.mcasFeeEurMwh = this.normalizarDecimalMcas(contrato.mcasFeeEurMwh);
      contrato.mcasPotenciaCalculo = null;
      contrato.mcasFechaPrimeraAplicacion = null;
      contrato.mcasFechaUltimaRelacionComercializadora = null;
      if (contrato.mcasFeeEurMwh !== null) contrato.mcasFeeUnidad = 'EUR_MWH';
      for (let i = 1; i <= 6; i++) {
        if (contrato['pot' + i] !== undefined) contrato['potencia' + i] = contrato['pot' + i];
      }
      if (this.modoEdicion && this.contratoEditandoId) contrato.id = this.contratoEditandoId;
      return contrato;
    },

    // Cuerpo de la vista previa: una copia del formulario, sin tocar lo que el usuario escribe.
    cuerpoVistaPrevia() {
      const copia = JSON.parse(JSON.stringify(this.nuevoContrato || {}));
      CAMPOS_FUERA_VISTA_PREVIA.forEach((campo) => { delete copia[campo]; });
      // Al renovar, el servidor guarda siempre la comisión como renovación: la estimación también.
      if (this.modoRenovacion) copia.mcasEsRenovacion = true;
      return this.payloadContrato(copia);
    },

    // Pide la vista previa 600 ms después del último cambio (sin firma, la olvida).
    programarVistaPrevia(firma) {
      clearTimeout(this.temporizadorVistaPrevia);
      this.temporizadorVistaPrevia = null;
      // Cualquier respuesta en camino corresponde a un formulario que ya ha cambiado.
      this.solicitudVistaPrevia += 1;
      if (!firma) {
        this.vistaPrevia = null;
        this.errorVistaPrevia = false;
        this.cargandoVistaPrevia = false;
        return;
      }
      this.cargandoVistaPrevia = true;
      this.temporizadorVistaPrevia = setTimeout(() => {
        this.temporizadorVistaPrevia = null;
        this.pedirVistaPrevia();
      }, ESPERA_VISTA_PREVIA_MS);
    },

    // Comisión estimada del contrato tal como está en el formulario. No guarda nada.
    async pedirVistaPrevia() {
      const solicitud = ++this.solicitudVistaPrevia;
      this.cargandoVistaPrevia = true;
      try {
        const { data } = await axios.post('/mcas/vista-previa', this.cuerpoVistaPrevia(),
          { headers: { 'Content-Type': 'application/json' } });
        if (solicitud !== this.solicitudVistaPrevia) return;
        this.vistaPrevia = data && typeof data === 'object' && typeof data.estado === 'string' ? data : null;
        this.errorVistaPrevia = !this.vistaPrevia;
        this.sugerirZonaMcas();
      } catch (error) {
        if (solicitud !== this.solicitudVistaPrevia) return;
        console.warn('No se pudo calcular la comisión estimada:', error);
        this.vistaPrevia = null;
        this.errorVistaPrevia = true;
      } finally {
        if (solicitud === this.solicitudVistaPrevia) this.cargandoVistaPrevia = false;
      }
    },

    // Lleva a la pestaña del campo y le da el foco (desplegando «Otros datos» si hace falta).
    async irACampoMcas(campo) {
      this.pestanaContrato = CAMPOS_EN_PESTANA_CONTRATO.includes(campo) ? 'contrato' : 'mcas';
      await this.$nextTick();
      if (typeof document === 'undefined') return;
      const elemento = document.getElementById(ID_CAMPO_FORMULARIO[campo] || campo);
      const plegado = elemento?.closest?.('details');
      if (plegado && !plegado.open) plegado.open = true;
      elemento?.focus?.();
    },

    // El producto elegido solo se quita si ya no encaja (otra comercializadora, otro tipo de
    // precio...). Sin la lista de productos todavía cargada no se puede saber: se deja.
    descartarProductoIncompatibleMcas() {
      this.$nextTick(() => {
        const id = this.nuevoContrato?.mcasIdProductoComercial;
        if (id === null || id === undefined || id === '' || !this.productosComerciales.length) return;
        if (!this.productosComercializesFiltrados.some(p => String(p.id) === String(id))) {
          this.nuevoContrato.mcasIdProductoComercial = null;
        }
      });
    },

    // Nombre del producto en el desplegable; si es de una gestora y el contrato aún no tiene, cuál.
    etiquetaProductoMcas(producto) {
      const conGestora = producto?.idGestora !== null && producto?.idGestora !== undefined;
      const sinGestora = !this.nuevoContrato?.mcasIdGestora;
      if (!conGestora || !sinGestora) return producto?.nombre;
      const gestora = this.gestorasList.find(g => String(g.id) === String(producto.idGestora));
      return `${producto.nombre} (gestora ${gestora ? gestora.nombre : producto.idGestora})`;
    },

    // Con tipo de precio, no se guarda si la tabla de comisiones pide datos que faltan
    // (reunión del 04/11/2026). Solo en «Faltan datos»: sin tabla que encaje (p. ej. solo
    // hay tablas de una gestora y el contrato no es de ninguna) la comisión se completa a
    // mano y el contrato se guarda. Se pide la vista previa en ese momento para no fiarse
    // de una vieja; si el servidor no responde, deja guardar (la comisión se revisa después).
    async datosMcasCompletos() {
      if (this.sinComisionMcas) return true;
      if (this.temporizadorVistaPrevia || this.cargandoVistaPrevia || !this.vistaPreviaMcasValida) {
        clearTimeout(this.temporizadorVistaPrevia);
        this.temporizadorVistaPrevia = null;
        await this.pedirVistaPrevia();
      }
      if (!this.vistaPreviaMcasValida || this.vistaPrevia.estado !== 'REQUIERE_DATOS') return true;
      const faltan = faltantesVistaPrevia(this.vistaPrevia, this.nuevoContrato);
      if (!faltan.length) return true;
      await this.irACampoMcas(faltan[0].campo);
      this.$swal.fire({
        icon: 'warning',
        title: 'Faltan datos de la comisión',
        html: `<p>Complete estos datos antes de guardar el contrato:</p><p><strong>${faltan.map(f => escaparHtml(f.etiqueta)).join(', ')}</strong></p>`,
        confirmButtonColor: '#fcd700',
        confirmButtonText: 'Entendido'
      });
      return false;
    },

    claseCampoMcas(campo) {
      return { 'mcas-campo--falta': this.camposFaltanMcas.includes(campo) };
    },

    // ---- Fechas del contrato ----
    // ¿La fecha fin actual la puso la aplicación (y nadie la ha tocado)? Va atada al objeto del
    // formulario: al abrir otro contrato (nuevo, editar, renovar) deja de valer sola.
    finPropuestaVigente() {
      const p = this.finPropuesta;
      return p && p.de === this.nuevoContrato && p.fin === this.nuevoContrato.fechaFin ? p : null;
    },
    proponerFin(inicio, meses) {
      const fin = finDePeriodo(inicio, meses);
      this.nuevoContrato.fechaFin = fin;
      this.finPropuesta = fin ? { de: this.nuevoContrato, fin, meses } : null;
    },
    // Al poner la fecha de inicio: si la fecha fin está vacía (o la puso la aplicación), se
    // propone la que toca (un año, o la duración elegida con los atajos) y se ve la duración.
    alCambiarInicioContrato(inicio) {
      this.errores.fechaInicio = '';
      const propuesta = this.finPropuestaVigente();
      if (!inicio) {
        if (propuesta) this.nuevoContrato.fechaFin = '';
        this.finPropuesta = null;
      } else if (!this.nuevoContrato.fechaFin || propuesta) {
        this.proponerFin(inicio, propuesta?.meses || 12);
      }
      this.comprobarOrdenFechasContrato();
    },
    alCambiarFinContrato(fin) {
      const inicio = this.nuevoContrato.fechaInicio;
      // Elegida con un atajo («2 años»): se recuerda la duración por si luego cambia el inicio
      const meses = [12, 24, 36].find((m) => inicio && finDePeriodo(inicio, m) === fin);
      this.finPropuesta = meses ? { de: this.nuevoContrato, fin, meses } : null;
      this.errores.fechaFin = '';
      this.comprobarOrdenFechasContrato();
    },
    // Aviso en el momento (antes salía solo al guardar)
    comprobarOrdenFechasContrato() {
      const { fechaInicio, fechaFin } = this.nuevoContrato;
      if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
        this.errores.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
      }
    },
    // Al renovar, el nuevo contrato empieza al día siguiente de acabar el anterior y dura lo
    // mismo (un año si no eran meses justos). Antes salían las fechas del anterior.
    proponerFechasRenovacion(anterior) {
      const finAnterior = this.formatDateForInput(anterior?.fechaFin);
      if (!finAnterior) return;
      const meses = mesesExactos(this.formatDateForInput(anterior.fechaInicio), finAnterior) || 12;
      this.nuevoContrato.fechaInicio = sumarDias(finAnterior, 1);
      this.proponerFin(this.nuevoContrato.fechaInicio, meses);
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

    // «05/03/2026», como la columna «Fin Contrato» de la lista (antes «5/3/2026»)
    formatDate(date) {
      return fechaES(date, '');
    },

    // «1.250.000,5 kWh»: miles con punto y decimales con coma (antes «1250000.5 kWh»)
    formatearConsumo(valor) {
      const numero = Number(valor);
      return `${FORMATO_CONSUMO.format(Number.isFinite(numero) ? numero : 0)} kWh`;
    },

    // Helper para obtener el CUPS correcto del punto de suministro
    obtenerCupsDelPuntoSuministro() {
      return cupsRecortado(this.puntoSuministroData);
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
        
        // Formatear a YYYY-MM-DD para input date (día local, sin pasar a UTC)
        return fechaLocalISO(date);
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
      // Primero las comercializadoras del prop y, si no hay, las cargadas por la ventana
      return nombreComercializadora(id, this.comercializadoras, this.comercializadorasList);
    },

    // Nuevos métodos para manejar la nueva interfaz
    async crearNuevoContrato() {
      this.cerrarModalDetalleContrato();
      await this.asegurarComercializadorasCargadas();
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.contratoEditandoId = null;
      this.resumenMcas = null;
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
      this.nuevoContrato.mcasIdProductoComercial = this.contratoVigente.mcasIdProductoComercial || null;
      
      // Detectar si el contrato vigente trae un archivo ya subido desde el backend
      this.contratoTieneArchivo = !!(this.contratoVigente.rutaArchivoContrato);
      this.nombreArchivoExistente = this.contratoVigente.nombreArchivo || '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
      this.cargarResumenMcas(this.contratoEditandoId);
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
      this.resumenMcas = null;
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
        // MCAS: en renovación siempre marcar como renovación y limpiar datos de fecha
        mcasEsRenovacion: true,
        mcasFechaPrimeraAplicacion: null,
      };
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = this.contratoVigente['potencia' + i] || 0;
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = this.contratoVigente.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = this.contratoVigente.idComercializadoraAnterior || "";
      this.nuevoContrato.mcasIdProductoComercial = this.contratoVigente.mcasIdProductoComercial || null;
      this.completarDatosMcas();
      this.proponerFechasRenovacion(this.contratoVigente);
      
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
      this.nuevoContrato.mcasIdProductoComercial = contrato.mcasIdProductoComercial || null;
      
      // Detectar si el contrato trae un archivo ya subido desde el backend
      this.contratoTieneArchivo = !!(contrato.rutaArchivoContrato);
      this.nombreArchivoExistente = contrato.nombreArchivo || '';
      this.eliminarArchivoExistente = false;
      this.selectedFile = null;
      this.cargarResumenMcas(contrato.id);
    },

    async renovarContratoGenerico(contrato) {
      this.cerrarModalDetalleContrato();
      // ASEGURAR que las comercializadoras estén cargadas
      await this.asegurarComercializadorasCargadas();
      
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.contratoEditandoId = null;
      this.resumenMcas = null;
      // Igual que «Renovar actual»: el contrato de origen queda vencido al guardar
      this.contratoOriginalIdRenovar = contrato.id;

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
        // MCAS: en renovación siempre marcar como renovación y limpiar datos de fecha
        mcasEsRenovacion: true,
        mcasFechaPrimeraAplicacion: null,
      };
      
      // Sincronizar potencias para los inputs
      for (let i = 1; i <= 6; i++) {
        this.nuevoContrato['pot' + i] = contrato['potencia' + i] || 0;
      }
      
      // FORZAR la asignación de comercializadoras después de $nextTick
      await this.$nextTick();
      this.nuevoContrato.idComercializadoraActual = contrato.idComercializadoraActual || "";
      this.nuevoContrato.idComercializadoraAnterior = contrato.idComercializadoraAnterior || "";
      this.nuevoContrato.mcasIdProductoComercial = contrato.mcasIdProductoComercial || null;
      this.completarDatosMcas();
      this.proponerFechasRenovacion(contrato);
      
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
      this.resumenMcas = null;
    },

    // Lleva a la vista el primer campo en rojo de la pestaña abierta: con el formulario
    // desplazado hacia abajo, el aviso pedía revisar campos que no se veían
    irAlPrimerError() {
      this.$nextTick(() => {
        this.$nextTick(() => {
          const campo = [...(this.$el?.querySelectorAll?.('.pestana-contrato-cuerpo [role="tabpanel"] :is(.input-error, .select-error)') || [])]
            .find(el => el.offsetParent !== null);
          if (campo && campo.scrollIntoView) campo.scrollIntoView({ block: 'center' });
        });
      });
    },

    async guardarContrato() {
      if (this.guardando) {
        return;
      }

      if (!this.validarContrato()) {
        // Mostrar la pestaña donde está el primer campo con error
        const conError = PESTANAS_CONTRATO.find(p => this.pestanaConErrores(p.id));
        if (conError) this.pestanaContrato = conError.id;
        this.irAlPrimerError();
        this.$swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Revise los campos marcados en rojo antes de guardar.',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      this.guardando = true;
      // Con tipo de precio, el servidor calcula (o intenta calcular) la comisión al guardar:
      // después se le pregunta qué ha pasado, para contarlo tal cual.
      const consultaMcas = Boolean(this.nuevoContrato.mcasTipoPrecio);
      try {
        if (!(await this.datosMcasCompletos())) return;
        // Decimales normalizados, potencias copiadas e id en modo edición (igual que la vista previa)
        this.payloadContrato(this.nuevoContrato);

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

        // Mostrar mensaje de éxito (con lo que ha pasado con la comisión MCAS)
        const mensajeExito = this.modoEdicion
          ? 'El contrato ha sido actualizado correctamente.'
          : (this.modoRenovacion ? 'El contrato ha sido renovado correctamente.' : 'El nuevo contrato ha sido creado correctamente.');
        // Comisiones MCAS actualiza su contador de pendientes
        this.avisarPropuestasCambiadas();
        const resultadoMcas = consultaMcas
          ? await this.consultarResultadoMcas(response?.data?.id ?? this.contratoEditandoId)
          : null;
        await this.$swal.fire({
          title: this.modoEdicion ? 'Contrato actualizado' : (this.modoRenovacion ? 'Contrato renovado' : 'Contrato creado'),
          ...(resultadoMcas
            ? { html: `<p>${escaparHtml(mensajeExito)}</p><p class="swal-resultado-mcas"><i class="fas fa-calculator"></i> ${escaparHtml(resultadoMcas)}</p>` }
            : { text: mensajeExito, timer: 2000, timerProgressBar: true }),
          icon: 'success',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
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
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        this.guardando = false;
      }
    },

    pestanaConErrores(idPestana) {
      const pestana = PESTANAS_CONTRATO.find(p => p.id === idPestana);
      return !!pestana && pestana.campos.some(campo => this.errores[campo]);
    },

    // Resumen de la comisión de un contrato guardado (cualquier usuario puede pedirlo).
    async pedirResumenMcas(idContrato) {
      if (idContrato === null || idContrato === undefined || idContrato === '') return null;
      try {
        const { data } = await axios.get(`/mcas/propuestas/contrato/${idContrato}/resumen`);
        return data && typeof data === 'object' ? data : null;
      } catch (error) {
        console.warn('No se pudo consultar la comisión del contrato:', error);
        return null;
      }
    },

    // Qué ha pasado con la comisión del contrato recién guardado, contado por el servidor.
    async consultarResultadoMcas(idContrato) {
      return textoResumenMcas(await this.pedirResumenMcas(idContrato));
    },

    // «Comisión actual» del contrato que se está modificando.
    async cargarResumenMcas(idContrato) {
      this.resumenMcas = null;
      const resumen = await this.pedirResumenMcas(idContrato);
      if (this.modoEdicion && String(this.contratoEditandoId) === String(idContrato)) this.resumenMcas = resumen;
    },

    // Evento de ventana que escucha Comisiones MCAS para refrescar sus pendientes.
    avisarPropuestasCambiadas() {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
      window.dispatchEvent(new CustomEvent('mcas:propuestas-cambiadas'));
    },

    esContratoVigente(contrato) {
      return enVigorHoy(contrato.fechaInicio, contrato.fechaFin);
    },

    // Solo para la etiqueta de la tabla: un contrato que aún no ha empezado no es
    // «histórico». No cambia cuál cuenta como vigente para Modificar/Renovar actual.
    esContratoProximo(contrato) {
      const inicio = fechaLocalISO(contrato?.fechaInicio);
      return inicio !== '' && inicio > fechaLocalISO();
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

        descargarBlob(response.data, contrato.nombreArchivo || `contrato_${contrato.id}.pdf`);
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

        descargarBlob(response.data, contrato.nombreArchivo || `contrato_${contrato.id}.pdf`);
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
        // MCAS se activa en todo contrato nuevo: precio FIJO y el suministro del CUPS
        mcasTipoPrecio: 'FIJO',
        mcasTipoSuministro: tieneLuz ? 'LUZ' : (tieneGas ? 'GAS' : null),
        mcasSegmento: null,
        mcasEsRenovacion: false,
        mcasTipoRenovacion: null,
        mcasAmbito: null,
        mcasIdGestora: null,
        mcasIdProductoComercial: null,
        mcasZonaComision: null,
        mcasFeeEurMwh: null,
        mcasFeeUnidad: 'EUR_MWH',
        mcasPotenciaCalculo: null,
        mcasNumeroPagos: 1,
        mcasFechaPrimeraAplicacion: null,
        mcasAltaNueva: null,
        mcasFechaUltimaRelacionComercializadora: null,
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

    // Propone la zona de comisión por el CUPS cuando la tabla de comisiones la usa (según
    // la vista previa), solo si el usuario no ha elegido ninguna. En un contrato ya guardado
    // no se rellena: cambiaría sus datos MCAS y dejaría desactualizada su propuesta
    // pendiente sin que el usuario lo haya decidido.
    sugerirZonaMcas() {
      const contrato = this.nuevoContrato;
      if (!contrato || this.modoEdicion || !this.zonaSugeridaMcas) return;
      const zona = contrato.mcasZonaComision;
      if (zona !== null && zona !== undefined && String(zona).trim() !== '') return;
      contrato.mcasZonaComision = this.zonaSugeridaMcas;
    },

    // Completa (sin pisar) los datos MCAS mínimos para que el contrato genere su propuesta
    completarDatosMcas() {
      if (!this.nuevoContrato.mcasTipoPrecio) this.nuevoContrato.mcasTipoPrecio = 'FIJO';
      if (!this.nuevoContrato.mcasTipoSuministro) {
        this.nuevoContrato.mcasTipoSuministro = this.esLuz ? 'LUZ' : (this.esGas ? 'GAS' : null);
      }
    },

    cerrarModalDetalleContrato() {
      this.mostrarModalDetalleContrato = false;
      this.contratoDetalle = null;
      this.clienteDetalle = null;
    },

    async cargarComercializadoras() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/comercializadoras`);
        this.comercializadorasList = response.data;
      } catch (error) {
        console.error('Error al cargar comercializadoras:', error);
        this.comercializadorasList = [];
      }
      // Cargar también gestoras y productos MCAS en paralelo
      this.cargarGestorasYProductos();
    },

    /**
     * Gestoras y productos comerciales MCAS. Se piden una sola vez mientras el modal
     * vive: `asegurarComercializadorasCargadas` entra desde los cinco puntos del
     * formulario y antes repetía las dos peticiones en cada uno. Si alguna falla se
     * olvida la carga para poder reintentarla.
     */
    cargarGestorasYProductos() {
      if (this.cargaGestorasProductos) return this.cargaGestorasProductos;

      this.cargaGestorasProductos = Promise.all([
        axios.get('/gestoras').catch(() => null),
        axios.get('/mcas/productos-comerciales').catch(() => null),
      ]).then(([ges, prod]) => {
        this.gestorasList = ges ? (ges.data || []) : [];
        this.productosComerciales = prod ? (prod.data || []) : [];
        if (!ges || !prod) {
          console.warn('No se pudieron cargar gestoras/productos MCAS');
          this.cargaGestorasProductos = null;
        }
      });

      return this.cargaGestorasProductos;
    },

    // Método auxiliar para asegurar que las comercializadoras estén cargadas
    async asegurarComercializadorasCargadas() {
      await this.cargarGestorasYProductos();
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
            confirmButtonColor: '#fcd700',
            confirmButtonText: 'Aceptar',
            timer: 2000,
            timerProgressBar: true
          });

          // Emitir evento para recargar contratos
          this.$emit("recargar-contratos");
          // Y la tabla de puntos (tarifa, fin de contrato, contratos activos), como al
          // crear, modificar o renovar
          this.$emit("contrato-eliminado");
        }
      } catch (error) {
        console.error('Error al eliminar contrato:', error);
        // El servidor explica el motivo cuando lo hay (p. ej. datos asociados)
        const motivo = error.response?.data?.error;
        this.$swal.fire({
          title: 'Error',
          text: motivo ? `No se pudo eliminar el contrato: ${motivo}` : 'No se pudo eliminar el contrato. Por favor, inténtalo de nuevo.',
          icon: 'error',
          confirmButtonColor: '#fcd700',
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

    tituloModal() {
      if (!this.mostrandoFormulario) return 'Gestión de contratos';
      if (this.modoEdicion) return 'Modificar contrato';
      if (this.modoRenovacion) return 'Renovar contrato';
      return 'Nuevo contrato';
    },

    // Datos mínimos que el servidor exige para calcular la comisión MCAS al guardar.
    // Sin vista previa (sin red o aún sin respuesta) son el respaldo de la pestaña.
    mcasFaltanCampos() {
      const c = this.nuevoContrato || {};
      // «Sin comisión automática» es una elección, no un dato que falta.
      if (this.sinComisionMcas) return [];
      const vacio = (v) => v === null || v === undefined || String(v).trim() === '';
      const requisitos = [
        ['Tipo de precio', 'mcasTipoPrecio'],
        ['Tipo de suministro', 'mcasTipoSuministro'],
        ['Número de contrato', 'contrato'],
        ['Fecha de inicio', 'fechaInicio'],
        ['Comercializadora actual', 'idComercializadoraActual'],
      ];
      // El servidor exige el tipo de renovación en toda comisión de renovación:
      // sin él la propuesta nace en «Faltan datos» y no se calcula el importe.
      if (this.esRenovacionMcas) requisitos.push(['Tipo de renovación', 'mcasTipoRenovacion']);
      return requisitos.filter(([, campo]) => vacio(c[campo])).map(([etiqueta, campo]) => ({ etiqueta, campo }));
    },

    mcasFaltan() {
      return this.mcasFaltanCampos.map(f => f.etiqueta);
    },

    // Al renovar, el servidor marca la comisión como renovación aunque el
    // desplegable del formulario se haya quedado sin elegir.
    esRenovacionMcas() {
      return this.modoRenovacion || this.nuevoContrato?.mcasEsRenovacion === true;
    },

    vistaPreviaMcasValida() {
      const vista = this.vistaPrevia;
      return !!vista && typeof vista === 'object' && typeof vista.estado === 'string';
    },

    // Tipo de precio en «Sin comisión automática»: el contrato no genera propuesta y no hay nada que pedir.
    sinComisionMcas() {
      const tipo = this.nuevoContrato?.mcasTipoPrecio;
      return tipo === null || tipo === undefined || String(tipo).trim() === '';
    },

    // Color de la marca de la pestaña: gris sin comisión, verde lista, naranja si falta algo.
    marcaMcas() {
      if (this.sinComisionMcas) return 'neutro';
      return this.mcasListo ? 'ok' : 'aviso';
    },

    // Marca de la pestaña: la decide la vista previa; sin ella, los datos mínimos.
    mcasListo() {
      if (this.vistaPreviaMcasValida) return this.vistaPrevia.estado === 'CALCULADO';
      return this.mcasFaltan.length === 0;
    },

    // Datos que el servidor no exige, pero que casi todas las reglas usan: solo se avisan.
    // No cuentan para «mcasListo». Con vista previa sobran: ya dice qué usa la comercializadora.
    mcasRecomendados() {
      const c = this.nuevoContrato || {};
      const vacio = (v) => v === null || v === undefined || String(v).trim() === '';
      if (vacio(c.mcasTipoPrecio)) return [];
      return [['Segmento', c.mcasSegmento]].filter(([, valor]) => vacio(valor)).map(([nombre]) => nombre);
    },

    avisoRecomendadoMcas() {
      if (this.vistaPreviaMcasValida) return '';
      return this.mcasRecomendados.length
        ? `Recomendado: ${this.mcasRecomendados.join(', ')} (casi todas las reglas lo usan)`
        : '';
    },

    // Zona de comisión por el CUPS de luz (ZAR si es ES0021, ZBR el resto), solo si la
    // tabla de comisiones de la comercializadora usa la zona y la admite.
    zonaSugeridaMcas() {
      if (!campoRelevante(this.vistaPrevia, 'ZONA_COMISION') || this.nuevoContrato?.mcasTipoSuministro === 'GAS') return null;
      const cups = String(this.puntoSuministroData?.CUPSluz || this.puntoSuministroData?.cupsluz || '').trim().toUpperCase();
      if (!cups) return null;
      const zona = cups.startsWith('ES0021') ? 'ZAR' : 'ZBR';
      return opcionesCampoMcas(this.vistaPrevia, 'ZONA_COMISION', [zona]).includes(zona) ? zona : null;
    },

    // Zonas y ámbitos: los que trae la vista previa o los de siempre (conservando el valor guardado).
    opcionesZonaMcas() {
      return opcionesCampoMcas(this.vistaPrevia, 'ZONA_COMISION', ['ZBR', 'ZAR'], this.nuevoContrato?.mcasZonaComision);
    },

    opcionesAmbitoMcas() {
      return opcionesCampoMcas(this.vistaPrevia, 'AMBITO', ['DENTRO', 'FUERA', 'NA'], this.nuevoContrato?.mcasAmbito)
        .map(valor => ({ valor, etiqueta: ETIQUETA_AMBITO[valor] || valor }));
    },

    // Cambia cuando cambia algo que influye en la comisión; null si no hay que pedir vista previa.
    firmaVistaPrevia() {
      if (!this.visible || !this.mostrandoFormulario || !this.nuevoContrato?.mcasTipoPrecio) return null;
      return JSON.stringify(this.cuerpoVistaPrevia());
    },

    camposMcas() {
      return organizarCamposMcas({
        vistaPrevia: this.vistaPrevia, contrato: this.nuevoContrato, esRenovacion: this.esRenovacionMcas, errores: this.errores,
      });
    },

    // Campos a la vista y, si los hay, los plegados en «Otros datos».
    gruposCamposMcas() {
      const { principales, otros } = this.camposMcas;
      const grupos = [{ id: 'principal', plegado: false, campos: principales }];
      if (otros.length) grupos.push({ id: 'otros', plegado: true, campos: otros });
      return grupos;
    },

    camposFaltanMcas() {
      return this.vistaPreviaMcasValida
        ? faltantesVistaPrevia(this.vistaPrevia, this.nuevoContrato).map(f => f.campo)
        : this.mcasFaltanCampos.map(f => f.campo);
    },

    // Consumo y tarifa: se cambian en la pestaña Contrato; aquí se enseña su valor.
    filasSoloLecturaMcas() {
      const c = this.nuevoContrato || {};
      return this.camposMcas.soloLectura.map((fila) => {
        let valor;
        if (fila.campo === 'consumoAnual') {
          const consumo = this.normalizarDecimalMcas(c.consumoAnual);
          valor = consumo ? `${consumo.toLocaleString('es-ES', { maximumFractionDigits: 4 })} kWh` : 'Sin indicar';
        } else if (fila.campo === 'mcasTipoPrecio') {
          valor = c.mcasTipoPrecio || 'Sin comisión automática';
        } else if (fila.campo === 'mcasIdProductoComercial') {
          const producto = this.productosComerciales.find(p => String(p.id) === String(c.mcasIdProductoComercial));
          valor = producto ? producto.nombre : 'Sin producto';
        } else if (fila.campo === 'potenciaContratada') {
          valor = this.mayorPotenciaMcas === null ? 'Sin indicar'
            : `${this.mayorPotenciaMcas.toLocaleString('es-ES', { maximumFractionDigits: 4 })} kW`;
        } else {
          valor = fila.campo === 'idTarifaGas' ? this.getTarifaGasNombre(c.idTarifaGas) : this.getTarifaLuzNombre(c.idTarifaLuz);
        }
        return { ...fila, valor };
      });
    },

    // Cabecera de la pestaña: comisión estimada o lo que falta; sin vista previa, el respaldo.
    cabeceraMcas() {
      if (this.sinComisionMcas) {
        return {
          tono: 'neutro', icono: 'fas fa-info-circle', faltan: [], avisos: [], estimacion: false,
          titulo: 'Sin comisión automática: este contrato no generará propuesta de comisión',
          detalle: 'Si el contrato debe comisionar, elija FIJO o INDEXADO en «Tipo de precio» (pestaña Contrato).',
        };
      }
      if (this.vistaPreviaMcasValida) return cabeceraVistaPrevia(this.vistaPrevia, this.nuevoContrato, { verImporte: this.esAdminMcas });
      const faltan = this.mcasFaltanCampos;
      let detalle = 'Al guardar, se aplica la tabla de comisiones de la comercializadora y la propuesta queda en Comisiones MCAS; '
        + 'cuando un administrador la aprueba, se crea el servicio de comisión en este punto de suministro. '
        + 'Si el contrato no debe comisionar, elija «Sin comisión automática» en «Tipo de precio».';
      if (this.cargandoVistaPrevia) detalle = this.esAdminMcas ? 'Calculando la comisión estimada…' : 'Comprobando los datos de la comisión…';
      else if (this.errorVistaPrevia) detalle = 'No se ha podido calcular la estimación ahora mismo; al guardar el contrato se calculará igualmente.';
      return faltan.length
        ? { tono: 'aviso', icono: 'fas fa-exclamation-triangle', titulo: 'Para calcular la comisión falta:', detalle, faltan, avisos: [], estimacion: false }
        : { tono: 'ok', icono: 'fas fa-check-circle', titulo: 'Al guardar se calculará la comisión de este contrato', detalle, faltan: [], avisos: [], estimacion: false };
    },

    tituloMarcaMcas() {
      const { titulo, faltan } = this.cabeceraMcas;
      const estado = [titulo, faltan.map(f => f.etiqueta).join(', ')].filter(Boolean).join(' ');
      return [estado, this.avisoRecomendadoMcas].filter(Boolean).join('. ');
    },

    textoComisionActual() {
      return textoResumenMcas(this.resumenMcas);
    },

    // Mayor de las potencias contratadas P1…P6 (null si ninguna es mayor que 0).
    mayorPotenciaMcas() {
      const c = this.nuevoContrato || {};
      const potencias = [1, 2, 3, 4, 5, 6]
        .map(n => this.normalizarDecimalMcas(c['pot' + n] !== undefined ? c['pot' + n] : c['potencia' + n]))
        .filter(p => p !== null && p > 0);
      return potencias.length ? Math.max(...potencias) : null;
    },

    // La comisión (importe, pagos y avisos del cálculo) solo la ven los administradores.
    // Atajos del calendario de las fechas del contrato
    atajosInicioContrato() {
      return [atajoPrimeroDelMes()];
    },
    finUnAnioContrato() {
      return finDePeriodo(this.nuevoContrato?.fechaInicio, 12);
    },
    atajosFinContrato() {
      return atajosDuracion(this.nuevoContrato?.fechaInicio);
    },
    // En el calendario de la fecha fin, un punto en el día de inicio
    marcasFinContrato() {
      const inicio = this.nuevoContrato?.fechaInicio;
      return inicio ? [{ fecha: inicio, texto: 'Inicio del contrato' }] : [];
    },
    duracionContrato() {
      return textoDuracion(this.nuevoContrato?.fechaInicio, this.nuevoContrato?.fechaFin);
    },
    esAdminMcas() {
      try {
        return Number(JSON.parse(localStorage.getItem('usuario') || '{}')?.nivelAcceso) === 1;
      } catch (e) {
        return false;
      }
    },

    // Por qué el desplegable de productos aún no se puede usar ('' si se puede).
    textoSinProductoMcas() {
      if (!this.nuevoContrato?.idComercializadoraActual) return 'Elija antes la comercializadora';
      if (!this.nuevoContrato?.mcasTipoPrecio) return 'Elija antes el tipo de precio';
      return '';
    },

    // Texto dinámico para el botón de guardar
    textoBotonGuardar() {
      if (this.modoEdicion) return 'Guardar cambios';
      if (this.modoRenovacion) return 'Guardar y Renovar';
      return 'Guardar contrato';
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

    // Productos comerciales filtrados por la comercializadora seleccionada
    productosComercializesFiltrados() {
      const idComercializadora = this.nuevoContrato?.idComercializadoraActual
      const tipoPrecio = this.nuevoContrato?.mcasTipoPrecio
      const tipoSuministro = this.nuevoContrato?.mcasTipoSuministro
      const idGestora = this.nuevoContrato?.mcasIdGestora
      const fechaContrato = this.nuevoContrato?.fechaInicio || fechaLocalISO()
      return this.productosComerciales.filter(p => {
        if (p.activo === false) return false
        if (idComercializadora && Number(p.idComercializadora) !== Number(idComercializadora)) return false
        if (tipoPrecio && p.tipoPrecio !== tipoPrecio) return false
        if (tipoSuministro && p.tipoSuministro !== tipoSuministro) return false
        // Los de una gestora salen también sin gestora elegida: al escoger uno se pone la suya
        if (p.idGestora != null && idGestora !== null && idGestora !== undefined && idGestora !== ''
          && Number(p.idGestora) !== Number(idGestora)) return false
        if (p.activoDesde && p.activoDesde > fechaContrato) return false
        if (p.activoHasta && p.activoHasta < fechaContrato) return false
        return true
      })
    },
    

    
    // Calcular el contrato actual internamente basándose en los contratos recibidos
    contratoActualCalculado() {
      if (!this.contratos || this.contratos.length === 0) {
        return null;
      }
      
      const contratoVigente = this.contratos.find(
        (contrato) => enVigorHoy(contrato.fechaInicio, contrato.fechaFin)
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
    // Las dos pestañas comparten el contenedor que se desplaza: sin esto, «Comisión MCAS»
    // se abría a media altura y tapaba la comisión actual y lo que falta para calcularla
    pestanaContrato() {
      this.$nextTick(() => {
        const cuerpo = this.$el?.querySelector?.('.pestana-contrato-cuerpo');
        if (cuerpo) cuerpo.scrollTop = 0;
      });
    },
    mostrandoFormulario(abierto) {
      if (abierto) {
        this.pestanaContrato = 'contrato';
        // Los avisos en rojo de un intento anterior no se arrastran al volver a abrir
        this.errores = {};
      }
    },
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
              // El usuario puede hacer clic en "Crear contrato" si quiere añadir uno
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
    },

    // Cuando cambia la comercializadora, limpiar el producto comercial MCAS
    // (el producto del contrato anterior puede no corresponder a la nueva comercializadora)
    // La zona sugerida se propone al llegar la vista previa (pedirVistaPrevia), que es
    // quien sabe si la tabla de comisiones de la nueva comercializadora la usa.
    'nuevoContrato.idComercializadoraActual'(newVal, oldVal) {
      if (newVal !== oldVal && oldVal !== undefined) this.descartarProductoIncompatibleMcas()
    },
    'nuevoContrato.mcasTipoPrecio'(newVal, oldVal) {
      if (newVal !== oldVal && oldVal !== undefined) this.descartarProductoIncompatibleMcas()
    },
    'nuevoContrato.mcasTipoSuministro'(newVal, oldVal) {
      if (newVal !== oldVal && oldVal !== undefined) this.descartarProductoIncompatibleMcas()
    },
    // Un producto de una gestora trae su gestora si el contrato aún no tiene ninguna
    'nuevoContrato.mcasIdProductoComercial'(id) {
      if (id === null || id === undefined || id === '' || this.nuevoContrato?.mcasIdGestora) return
      const producto = this.productosComerciales.find(p => String(p.id) === String(id))
      if (producto && producto.idGestora !== null && producto.idGestora !== undefined) {
        this.nuevoContrato.mcasIdGestora = producto.idGestora
      }
    },
    'nuevoContrato.mcasIdGestora'(newVal, oldVal) {
      if (newVal !== oldVal && oldVal !== undefined) this.descartarProductoIncompatibleMcas()
    },
    'nuevoContrato.fechaInicio'(newVal, oldVal) {
      if (newVal !== oldVal && oldVal !== undefined) this.descartarProductoIncompatibleMcas()
    },
    // Vista previa de la comisión: se pide 600 ms después del último cambio que influye en ella
    firmaVistaPrevia(firma) {
      this.programarVistaPrevia(firma)
    }
  },
  beforeUnmount() {
    clearTimeout(this.temporizadorVistaPrevia);
    this.temporizadorVistaPrevia = null;
    // Una respuesta que llegue después ya no se aplica
    this.solicitudVistaPrevia += 1;
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
        
        if (needsComercializadoras) {
          promises.push(this.cargarComercializadoras());
        }
        
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
