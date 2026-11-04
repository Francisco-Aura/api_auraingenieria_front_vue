<template>
  <div v-if="visible" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="servicios-modal-title">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-tools"></i></span>
        <div class="aura-modal-header__titulos">
          <h1 id="servicios-modal-title" class="modal-title">{{ tituloModal }}</h1>
          <span class="aura-modal-header__subtitulo">
            <span><strong>{{ cliente?.nombre || 'Cliente no disponible' }}</strong></span>
            <span class="aura-dato"><span class="aura-dato__etiqueta">DNI/CIF</span>{{ cifCliente || 'No disponible' }}</span>
            <span class="aura-dato"><span class="aura-dato__etiqueta">CUPS</span>{{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
          </span>
        </div>
        <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar gestión de servicios">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido principal sin pestañas -->
      <div v-if="!cargando && !cargandoDatos" class="main-content-container">
        <!-- Vista principal: Histórico de servicios con formulario de edición/creación cuando sea necesario -->
        <div v-if="!mostrandoFormulario" class="main-content">
          <!-- Botones de acción principales -->
          <div class="action-buttons-main">
            <button @click="crearNuevoServicio" class="btn-modern btn-primary">
              <i class="fas fa-plus"></i> Crear servicio
            </button>
            <button @click="modificarServicioActual" class="btn-modern btn-warning" v-if="tieneServicioVigente">
              <i class="fas fa-edit"></i> Modificar actual
            </button>
            <button @click="renovarServicioActual" class="btn-modern btn-success" v-if="tieneServicioVigente">
              <i class="fas fa-sync-alt"></i> Renovar actual
            </button>
          </div>

          <!-- Histórico de servicios -->
          <div class="contracts-history">
            <h3><i class="fas fa-history"></i> Histórico de servicios</h3>
            <div v-if="todosLosServiciosOrdenados.length" class="history-table-container">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>ID Servicio</th>
                    <th>CUPS</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Producto</th>
                    <th>Gestora</th>
                    <th>Comercializadora</th>
                    <th>Pagos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="servicio in todosLosServiciosOrdenados" :key="servicio.id" class="history-row"
                      :class="{ 
                        'servicio-vigente': obtenerEstadoServicio(servicio) === 'VIGENTE',
                        'servicio-pendiente': obtenerEstadoServicio(servicio) === 'PENDIENTE'
                      }">
                    <td>
                      <span v-if="obtenerEstadoServicio(servicio) === 'VIGENTE'" class="status-vigente">
                        <i class="fas fa-circle"></i> VIGENTE
                      </span>
                      <span v-else-if="obtenerEstadoServicio(servicio) === 'PENDIENTE'" class="status-pendiente">
                        <i class="fas fa-exclamation-circle"></i> PENDIENTE
                      </span>
                      <span v-else-if="esServicioProximo(servicio)" class="status-proximo" :title="'Empieza el ' + formatDate(servicio.fechaInicioServicio)">
                        <i class="fas fa-clock"></i> PRÓXIMO
                      </span>
                      <span v-else class="status-historico">
                        <i class="fas fa-circle"></i> HISTÓRICO
                      </span>
                    </td>
                    <td class="contract-number">#{{ servicio.id }}</td>
                    <td>{{ servicio.cups || 'Sin CUPS' }}</td>
                    <td>{{ formatDate(servicio.fechaInicioServicio) }}</td>
                    <td>{{ formatDate(servicio.fechaFinServicio) }}</td>
                    <td>{{ getProductoNombre(servicio.idProducto) }}</td>
                    <td>{{ getGestoraNombre(servicio.idGestora) }}</td>
                    <td>{{ getComercializadoraNombre(servicio.idComercializadora) }}</td>
                    <td class="pagos-column">
                      <div v-if="servicio.pagos" class="pagos-mini">
                        <span class="pago-indicador">{{ obtenerMesesPagados(servicio.pagos) }}/{{ obtenerNumeroCuotas(servicio.pagos) }} P</span>
                        <span class="total-indicador">{{ formatearEuros(esDescuentoTotal(servicio.pagos.importe, servicio.pagos.descuento) ? 0 : (servicio.pagos.importeFinal || servicio.pagos.importe)) }}</span>
                      </div>
                      <div v-else class="sin-pagos-mini" title="Este servicio no tiene plan de pagos">
                        <span>Sin plan</span>
                      </div>
                    </td>
                    <td class="action-buttons">
                      <button @click="editarServicioGenerico(servicio)" class="btn-icon btn-edit" title="Editar servicio" aria-label="Editar servicio">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="renovarServicioGenerico(servicio)" class="btn-icon btn-renew" title="Renovar servicio" aria-label="Renovar servicio">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button @click="verDetalleServicio(servicio)" class="btn-icon btn-view" title="Ver detalle" aria-label="Ver detalle del servicio">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button @click="gestionarPagosServicio(servicio)" class="btn-icon btn-payment" title="Gestionar pagos" aria-label="Gestionar pagos del servicio">
                        <i class="fas fa-euro-sign"></i>
                      </button>
                      <button @click="eliminarServicio(servicio)" class="btn-icon btn-delete" title="Eliminar servicio" aria-label="Eliminar servicio" v-if="nivelAcceso === 1">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="no-history">
              <i class="fas fa-history"></i>
              <p>No hay servicios disponibles</p>
            </div>
          </div>
        </div>

        <!-- Formulario de creación/edición de servicios -->
        <div v-if="mostrandoFormulario" class="form-content">
          <form @submit.prevent="guardarServicio" class="modern-form" novalidate>
            <div class="form-grid-modern">
              <!-- Sección de Información del servicio -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-info-circle"></i>
                  <h3>Información del servicio</h3>
                </div>

                <div class="form-group-modern">
                  <label for="cups">CUPS <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-barcode icon-prefix"></i>
                    <input
                      id="cups"
                      class="form-control-modern cups-readonly"
                      v-model="nuevoServicio.cups"
                      readonly
                      title="Campo automático basado en el punto de suministro seleccionado"
                    />
                  </div>
                  <small class="field-help">Campo automático del punto de suministro seleccionado</small>
                </div>

                <div class="form-group-modern">
                  <label for="producto">Producto <span class="required">*</span></label>
                  <div class="select-container-modern" :class="{ 'select-error': errores.idProducto }">
                    <select
                      id="producto"
                      v-model="nuevoServicio.idProducto"
                      class="form-select-modern"
                      @change="errores.idProducto = ''"
                      required
                    >
                      <option :value="0">Seleccione...</option>
                      <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                        {{ producto.nombre }}
                      </option>
                    </select>
                  </div>
                  <small v-if="errores.idProducto" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idProducto }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="gestora">Gestora <span class="required">*</span></label>
                  <div class="select-container-modern" :class="{ 'select-error': errores.idGestora }">
                    <select
                      id="gestora"
                      v-model="nuevoServicio.idGestora"
                      class="form-select-modern"
                      @change="errores.idGestora = ''"
                      required
                    >
                      <option :value="0">Seleccione...</option>
                      <option v-for="gestora in gestoras" :key="gestora.id" :value="gestora.id">
                        {{ gestora.nombre }}
                      </option>
                    </select>
                  </div>
                  <small v-if="errores.idGestora" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idGestora }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="comercializadora">Comercializadora <span class="required">*</span></label>
                  <div class="select-container-modern" :class="{ 'select-error': errores.idComercializadora }">
                    <select
                      id="comercializadora"
                      v-model="nuevoServicio.idComercializadora"
                      class="form-select-modern"
                      @change="errores.idComercializadora = ''"
                      required
                    >
                      <option :value="0">Seleccione...</option>
                      <option v-for="comercializadora in comercializadorasList" :key="comercializadora.id" :value="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                  </div>
                  <small v-if="errores.idComercializadora" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idComercializadora }}</small>
                </div>
              </div>
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas del servicio</h3>
                </div>
                
                <div class="form-group-modern">
                  <label for="fechaInicioServicio">Fecha inicio <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-play icon-prefix"></i>
                    <input
                      type="date"
                      id="fechaInicioServicio"
                      v-model="nuevoServicio.fechaInicioServicio"
                      class="form-control-modern" :class="{ 'input-error': errores.fechaInicioServicio }"
                      @change="errores.fechaInicioServicio = ''"
                      required
                    />
                  </div>
                  <small v-if="errores.fechaInicioServicio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaInicioServicio }}</small>
                </div>

                <div class="form-group-modern">
                  <label for="fechaFinServicio">Fecha fin <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-stop icon-prefix"></i>
                    <input
                      type="date"
                      id="fechaFinServicio"
                      v-model="nuevoServicio.fechaFinServicio"
                      class="form-control-modern" :class="{ 'input-error': errores.fechaFinServicio }"
                      @change="errores.fechaFinServicio = ''"
                      required
                    />
                  </div>
                  <small v-if="errores.fechaFinServicio" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.fechaFinServicio }}</small>
                </div>
                
                <div class="form-group-modern">
                  <label for="descripcion">Descripción</label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-file-alt icon-prefix"></i>
                    <input
                      type="text"
                      id="descripcion"
                      v-model="nuevoServicio.descripcion"
                      class="form-control-modern"
                      maxlength="250"
                      placeholder="Descripción del servicio"
                    />
                  </div>
                </div>
              </div>

               <!-- Sección de Gestión de pagos y Cuotas -->
               <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-euro-sign"></i>
                  <h3>Gestión de pagos</h3>
                </div>

                <div class="form-group-modern">
                  <label for="modalidadPago">Modalidad de pago <span class="required">*</span></label>
                  <div class="select-container-modern" :class="{ 'select-error': errores.idPagoPlazos }">
                    <select
                      id="modalidadPago"
                      v-model="nuevoServicio.idPagoPlazos"
                      class="form-select-modern"
                      @change="errores.idPagoPlazos = ''"
                      required
                    >
                      <option :value="null">Seleccione...</option>
                      <option v-for="plazo in modalidadesPago" :key="plazo.id" :value="plazo.id">
                        {{ plazo.nombre }}<span v-if="plazo.descripcion"> - {{ plazo.descripcion }}</span>
                      </option>
                    </select>
                  </div>
                  <small v-if="errores.idPagoPlazos" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.idPagoPlazos }}</small>
                </div>

                <div class="form-group-modern importe-euro-group">
                  <label>Importe total</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.importe"
                      placeholder="0.00"
                      class="form-control-modern"
                      step="0.01"
                      min="0"
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>

                <div class="form-group-modern importe-euro-group">
                  <label>Descuento</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.descuento"
                      placeholder="0.00"
                      class="form-control-modern"
                      step="0.01"
                      min="0"
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>

                <div class="form-group-modern importe-euro-group">
                  <label>Importe final</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.importeFinal"
                      class="form-control-modern"
                      step="0.01"
                      min="0"
                      readonly
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>

                <div class="form-group-modern importe-euro-group">
                  <label>Importe pagado</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      :value="totalPagadoFormulario"
                      class="form-control-modern importe-pagado-readonly"
                      step="0.01"
                      min="0"
                      readonly
                    />
                    <span class="euro-inline">€</span>
                  </div>
                  <small class="field-help">Se actualiza automáticamente según las cuotas pagadas</small>
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
                    v-model="nuevoServicio.observaciones"
                    class="form-control-modern textarea-modern"
                    rows="4"
                    maxlength="10000"
                    placeholder="Añada aquí cualquier observación relevante sobre el servicio..."
                  ></textarea>
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
      <div v-else class="main-content-container main-content-skeleton">
        <div class="contracts-history">
          <div class="history-table-container">
            <table class="history-table">
              <tbody>
                <tr v-for="n in 4" :key="'skeleton-' + n" class="skeleton-row">
                  <td v-for="col in 10" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE SERVICIO - FUERA DEL MODAL PRINCIPAL -->
    <div v-if="mostrarModalDetalleServicio" class="modal-overlay detalle-contrato-modal" v-cierre-fondo="cerrarModalDetalleServicio">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header aura-modal-header">
          <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-clipboard-list"></i></span>
          <div class="aura-modal-header__titulos">
            <h2>Detalle del servicio</h2>
            <span class="aura-modal-header__subtitulo"><span class="aura-dato"><span class="aura-dato__etiqueta">Servicio</span>#{{ servicioDetalle?.id }}</span></span>
          </div>
          <button type="button" @click="cerrarModalDetalleServicio" class="close-button" aria-label="Cerrar detalle del servicio">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="detalle-contrato-pdf">
          <div class="detalle-contrato-header">
            <div class="cliente-info">
              <h4><i class="fas fa-user"></i> Información del Cliente</h4>
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">{{ cliente?.nombre || 'Desconocido' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">DNI/CIF:</span>
                <span class="info-value">{{ cifCliente || 'No disponible' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CUPS:</span>
                <span class="info-value">{{ obtenerCupsDelPuntoSuministro() || 'No disponible' }}</span>
              </div>
            </div>
            <div class="contrato-info">
              <h4><i class="fas fa-clipboard-list"></i> Información del servicio</h4>
              <div class="info-row">
                <span class="info-label">ID Servicio:</span>
                <span class="info-value">#{{ servicioDetalle?.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">CUPS:</span>
                <span class="info-value">{{ servicioDetalle?.cups }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vigencia:</span>
                <span class="info-value">{{ formatDate(servicioDetalle?.fechaInicioServicio) }} - {{ formatDate(servicioDetalle?.fechaFinServicio) }}</span>
              </div>
            </div>
          </div>
          <div class="detalle-contrato-section">
            <h4><i class="fas fa-info-circle"></i> Datos del Servicio</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Descripción:</span>
                <span class="info-value"><i class="fas fa-file-alt"></i> {{ servicioDetalle?.descripcion || 'Sin descripción' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Producto:</span>
                <span class="info-value"><i class="fas fa-box"></i> {{ getProductoNombre(servicioDetalle?.idProducto) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Gestora:</span>
                <span class="info-value"><i class="fas fa-building"></i> {{ getGestoraNombre(servicioDetalle?.idGestora) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Comercializadora:</span>
                <span class="info-value"><i class="fas fa-store"></i> {{ getComercializadoraNombre(servicioDetalle?.idComercializadora) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Sección de pagos en el detalle -->
          <div v-if="servicioDetalle?.pagos" class="detalle-contrato-section">
            <h4><i class="fas fa-euro-sign"></i> Información de Pagos</h4>
            <div class="info-grid">
              <div class="info-row info-row-importe">
                <span class="info-label">Importe Total:</span>
                <span class="info-value info-value-importe">{{ formatearEuros(servicioDetalle.pagos.importe) }}</span>
              </div>
              <div class="info-row info-row-importe">
                <span class="info-label">Descuento:</span>
                <span class="info-value info-value-importe">{{ formatearEuros(servicioDetalle.pagos.descuento) }}</span>
              </div>
              <div class="info-row info-row-importe">
                <span class="info-label">Importe Final:</span>
                <span class="info-value info-value-importe">{{ formatearEuros(servicioDetalle.pagos.importeFinal) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cuotas Pagadas:</span>
                <span class="info-value">{{ obtenerMesesPagados(servicioDetalle.pagos) }}/{{ obtenerNumeroCuotas(servicioDetalle.pagos) }}</span>
              </div>
            </div>
          </div>
          
          <div class="detalle-contrato-section" v-if="servicioDetalle?.observaciones">
            <h4><i class="fas fa-sticky-note"></i> Observaciones</h4>
            <div class="observaciones-content">
              {{ servicioDetalle?.observaciones }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL GESTIÓN DE PAGOS - FUERA DEL MODAL PRINCIPAL -->
    <div v-if="mostrarModalGestionPagos" class="modal-overlay detalle-contrato-modal" v-cierre-fondo="pedirCerrarGestionPagos">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header aura-modal-header">
          <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-euro-sign"></i></span>
          <div class="aura-modal-header__titulos">
            <h2>Gestión de pagos</h2>
            <span class="aura-modal-header__subtitulo"><span class="aura-dato"><span class="aura-dato__etiqueta">Servicio</span>#{{ servicioGestionPagos?.id }}</span><span>Marque cada cuota cobrada y pulse «Guardar» en su fila</span></span>
          </div>
          <button type="button" @click="pedirCerrarGestionPagos" class="close-button" aria-label="Cerrar gestión de pagos">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="detalle-contrato-pdf">
          <!-- Resumen de pagos -->
          <div class="pagos-progreso">
            <div class="pagos-resumen-compacto">
              <div class="resumen-item">
                <span class="resumen-label">Pagadas:</span>
                <span class="resumen-valor">{{ cuotasPagadas }} de {{ cuotas.length }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Total pagado:</span>
                <span class="resumen-valor">{{ formatearEuros(totalPagado) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Importe final:</span>
                <span class="resumen-valor">{{ formatearEuros(servicioGestionPagos?.pagos?.importeFinal) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Tabla de cuotas -->
          <div v-if="cuotas.length" class="cuotas-table-wrapper">
            <table class="cuotas-table">
              <thead>
                <tr>
                  <th class="ct-num">#</th>
                  <th class="ct-estado">Estado</th>
                  <th class="ct-fecha">Fecha</th>
                  <th class="ct-importe">Importe</th>
                  <th class="ct-pagado">Pagado</th>
                  <th class="ct-acciones"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cuota in cuotas" :key="cuota.id" :class="{ 'ct-row-pagada': cuota.pagado }">
                  <td class="ct-num">
                    <span class="ct-badge-num">{{ cuota.numeroPago }}</span>
                  </td>
                  <td class="ct-estado">
                    <!-- Un cambio sin guardar no se presenta como hecho: «Sin guardar» hasta pulsar Guardar -->
                    <span v-if="cuota.editado" class="ct-pill ct-pill--sin-guardar" title="Pulse «Guardar» en esta fila para guardar el cambio">
                      <i class="fas fa-pen"></i>
                      Sin guardar
                    </span>
                    <span v-else class="ct-pill" :class="cuota.pagado ? 'ct-pill--pagado' : 'ct-pill--pendiente'">
                      <i :class="cuota.pagado ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                      {{ cuota.pagado ? 'Pagado' : 'Pendiente' }}
                    </span>
                  </td>
                  <td class="ct-fecha">
                    <input type="date" v-model="cuota.fechaPago" @change="marcarEditado(cuota)" class="ct-input" />
                  </td>
                  <td class="ct-importe">
                    <div class="ct-input-euro">
                      <input type="number" v-model="cuota.importePago" min="0" step="0.01" @change="marcarEditado(cuota)" class="ct-input" />
                      <span class="ct-euro">€</span>
                    </div>
                  </td>
                  <td class="ct-pagado">
                    <input type="checkbox" v-model="cuota.pagado" @change="marcarEditado(cuota)" class="ct-checkbox" />
                  </td>
                  <td class="ct-acciones">
                    <button type="button" class="btn-guardar-compact" :disabled="!cuota.editado" @click="guardarCuota(cuota)" title="Guardar cambios">
                      <i class="fas fa-save"></i>
                      <span>Guardar</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="sin-cuotas">
            <i class="fas fa-info-circle"></i> No hay cuotas generadas para este servicio.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { fechaLocalISO, enVigorHoy, terminadoHoy, fechaES } from "@/utils/fechas";
import { cupsRecortado } from "@/utils/cups";
import { nombreComercializadora } from "@/utils/maestros";
import { escaparHtml } from "@/utils/html";

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export default {
  name: "ModalServicios",
  components: {},
  emits: ['cerrar-modal', 'servicio-creado', 'servicio-actualizado', 'servicio-renovado', 'recargar-servicios'],
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    cargando: {
      type: Boolean,
      default: false,
    },
    servicioActual: {
      type: Object,
      default: () => ({
        id: "",
        cups: "",
        fecha: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        fechaPago: "",
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        observaciones: "",
      }),
    },
    serviciosHistoricos: {
      type: Array,
      required: false,
      default: () => [],
    },
    servicios: {
      type: Array,
      required: false,
      default: () => [],
    },
    cliente: {
      type: [Object, Number],
      required: true
    },
    puntoSuministroSeleccionado: {
      type: [Object, Number],
      required: true
    },
    gestoras: {
      type: Array,
      required: true,
    },
    productos: {
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
      mostrandoFormulario: false,
      modoEdicion: false,
      modoRenovacion: false,
      servicioEditandoId: null,
      cargandoDatos: false,
      guardando: false,
      nuevoServicio: {
        idCliente: "",
        idPuntoSuministro: "",
        cups: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        idPagoPlazos: null,
        importe: 0,
        descuento: 0,
        importeFinal: 0,
        observaciones: "",
      },
      mostrarModalDetalleServicio: false,
      servicioDetalle: null,
      mostrarModalGestionPagos: false,
      servicioGestionPagos: null,
      comercializadorasList: [],
      modalidadesPago: [],
      nivelAcceso: null,
      cuotas: [],
      pagosExistentes: null,
      peticionEdicion: 0,
      modalidadDebounceTimer: null,
      errores: {},
    };
  },

  methods: {
    // Validación del formulario de servicio
    validarServicio() {
      this.errores = {};
      let valido = true;
      if (!this.nuevoServicio.idProducto) {
        this.errores.idProducto = 'Producto es obligatorio';
        valido = false;
      }
      if (!this.nuevoServicio.idGestora) {
        this.errores.idGestora = 'Gestora es obligatoria';
        valido = false;
      }
      if (!this.nuevoServicio.idComercializadora) {
        this.errores.idComercializadora = 'Comercializadora es obligatoria';
        valido = false;
      }
      if (!this.nuevoServicio.fechaInicioServicio) {
        this.errores.fechaInicioServicio = 'Fecha de inicio es obligatoria';
        valido = false;
      }
      if (!this.nuevoServicio.fechaFinServicio) {
        this.errores.fechaFinServicio = 'Fecha de fin es obligatoria';
        valido = false;
      }
      if (this.nuevoServicio.fechaInicioServicio && this.nuevoServicio.fechaFinServicio &&
          this.nuevoServicio.fechaFinServicio < this.nuevoServicio.fechaInicioServicio) {
        this.errores.fechaFinServicio = 'La fecha de fin no puede ser anterior a la fecha de inicio';
        valido = false;
      }
      if (!this.nuevoServicio.idPagoPlazos) {
        this.errores.idPagoPlazos = 'Modalidad de pago es obligatoria';
        valido = false;
      }
      return valido;
    },
    // Importes en formato español: 92,5 → «92,50 €»
    formatearEuros(valor) {
      const numero = Number(valor);
      return FORMATO_EUROS.format(Number.isFinite(numero) ? numero : 0);
    },

    // Helper para obtener el CUPS correcto del punto de suministro
    obtenerCupsDelPuntoSuministro() {
      return cupsRecortado(this.puntoSuministroData);
    },

    // «05/03/2026», como la lista de puntos de suministro (antes «5/3/2026»)
    formatDate(date) {
      return fechaES(date, '');
    },

    // Solo para la etiqueta de la tabla: un servicio que aún no ha empezado no es
    // «histórico». No cambia cuál cuenta como vigente para Modificar/Renovar actual.
    esServicioProximo(servicio) {
      const inicio = fechaLocalISO(servicio?.fechaInicioServicio);
      return inicio !== '' && inicio > fechaLocalISO();
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      
      try {
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '';
        }
        
        return fechaLocalISO(date);
      } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return '';
      }
    },

    getGestoraNombre(id) {
      if (!id || id === '') return 'Sin Gestora';
      
      if (!this.gestoras || !this.gestoras.length) {
        return 'Cargando...';
      }
      
      const gestora = this.gestoras.find(g => g.id == id);
      
      if (!gestora) {
        return 'Gestora Desconocida';
      }
      
      return gestora.nombre;
    },

    getProductoNombre(id) {
      if (!id || id === '') return 'Sin Producto';
      
      if (!this.productos || !this.productos.length) {
        return 'Cargando...';
      }
      
      const producto = this.productos.find(p => p.id == id);
      
      if (!producto) {
        return 'Producto Desconocido';
      }
      
      return producto.nombre;
    },

    getComercializadoraNombre(id) {
      // Primero las comercializadoras del prop y, si no hay, las cargadas por la ventana
      return nombreComercializadora(id, this.comercializadoras, this.comercializadorasList);
    },

    // Nuevos métodos para manejar la nueva interfaz
    crearNuevoServicio() {
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.servicioEditandoId = null;
      this.pagosExistentes = null;
      this.cuotas = [];
      this.inicializarNuevoServicio();
    },

    async modificarServicioActual() {
      if (!this.servicioVigente) return;
      const servicioId = this.servicioVigente.id;
      const peticion = this.empezarCargaEdicion(servicioId);
      
      // Cargar datos completos del servicio desde el backend
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios/${servicioId}`);
        if (peticion !== this.peticionEdicion) return;
        const servicioCompleto = response.data;
        
        this.nuevoServicio = { 
          idCliente: servicioCompleto.idCliente,
          idPuntoSuministro: servicioCompleto.idPuntoSuministro,
          cups: this.obtenerCupsDelPuntoSuministro() || servicioCompleto.cups || "",
          fechaInicioServicio: this.formatDateForInput(servicioCompleto.fechaInicioServicio),
          fechaFinServicio: this.formatDateForInput(servicioCompleto.fechaFinServicio),
          descripcion: servicioCompleto.descripcion || "",
          idGestora: servicioCompleto.idGestora || 0,
          idProducto: servicioCompleto.idProducto || 0,
          idComercializadora: servicioCompleto.idComercializadora || 0,
          observaciones: servicioCompleto.observaciones || "",
          importe: servicioCompleto.importe || 0,
          descuento: servicioCompleto.descuento || 0,
          importeFinal: this.esDescuentoTotal(servicioCompleto.importe, servicioCompleto.descuento) ? 0 : (servicioCompleto.importeFinal || servicioCompleto.importe || 0),
          idPagoPlazos: servicioCompleto.idPagoPlazos || null // ¡CAMPO CRÍTICO INCLUIDO!
        };

      } catch (error) {
        if (peticion !== this.peticionEdicion) return;
        console.error('Error al cargar datos completos del servicio:', error);
        // Fallback al método anterior si falla la carga
        this.nuevoServicio = { ...this.servicioVigente };
        
        // Asegurar que el campo CUPS esté siempre cargado
        if (!this.nuevoServicio.cups) {
          this.nuevoServicio.cups = this.obtenerCupsDelPuntoSuministro();
        }
      }
      
      await this.terminarCargaEdicion(peticion, servicioId);
    },

    renovarServicioActual() {
      if (!this.servicioVigente) return;
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.servicioEditandoId = null;
      this.nuevoServicio = {
        ...this.servicioVigente,
        id: undefined,
        idCliente: this.servicioVigente.idCliente || this.servicioVigente.cliente?.id || this.cliente?.id,
        idPuntoSuministro: this.servicioVigente.idPuntoSuministro || this.servicioVigente.puntoSuministro?.id || this.puntoSuministroData?.id,
        cups: this.obtenerCupsDelPuntoSuministro() || this.servicioVigente.cups || "",
        fechaInicioServicio: this.formatDateForInput(this.servicioVigente.fechaInicioServicio) || '',
        fechaFinServicio: this.formatDateForInput(this.servicioVigente.fechaFinServicio) || '',
      };
      
      // Asegurar que el campo CUPS esté siempre cargado para renovación
      if (!this.nuevoServicio.cups) {
        this.nuevoServicio.cups = this.obtenerCupsDelPuntoSuministro();
      }
    },

    async editarServicioGenerico(servicio) {
      const peticion = this.empezarCargaEdicion(servicio.id);
      
      // Cargar datos completos del servicio desde el backend
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios/${servicio.id}`);
        if (peticion !== this.peticionEdicion) return;
        const servicioCompleto = response.data;
        
        this.nuevoServicio = {
          id: servicioCompleto.id,
          idCliente: servicioCompleto.idCliente || servicio.cliente?.id || this.cliente?.id,
          idPuntoSuministro: servicioCompleto.idPuntoSuministro || servicio.puntoSuministro?.id || this.puntoSuministroData?.id,
          cups: this.obtenerCupsDelPuntoSuministro() || servicioCompleto.cups || "",
          fechaInicioServicio: this.formatDateForInput(servicioCompleto.fechaInicioServicio),
          fechaFinServicio: this.formatDateForInput(servicioCompleto.fechaFinServicio),
          descripcion: servicioCompleto.descripcion || "",
          idGestora: servicioCompleto.idGestora || 0,
          idProducto: servicioCompleto.idProducto || 0,
          idComercializadora: servicioCompleto.idComercializadora || 0,
          observaciones: servicioCompleto.observaciones || "",
          importe: servicioCompleto.importe || 0,
          descuento: servicioCompleto.descuento || 0,
          importeFinal: this.esDescuentoTotal(servicioCompleto.importe, servicioCompleto.descuento) ? 0 : (servicioCompleto.importeFinal || servicioCompleto.importe || 0),
          idPagoPlazos: servicioCompleto.idPagoPlazos || null // ¡CAMPO CRÍTICO INCLUIDO!
        };
        
      } catch (error) {
        if (peticion !== this.peticionEdicion) return;
        console.error('Error al cargar datos completos del servicio:', error);
        // Fallback al método anterior si falla la carga
        this.nuevoServicio = JSON.parse(JSON.stringify(servicio));
        this.nuevoServicio.id = servicio.id;
        this.nuevoServicio.idCliente = servicio.idCliente || servicio.cliente?.id || this.cliente?.id;
        this.nuevoServicio.idPuntoSuministro = servicio.idPuntoSuministro || servicio.puntoSuministro?.id || this.puntoSuministroData?.id;
        
        // Asegurar que el campo CUPS esté siempre cargado
        if (!this.nuevoServicio.cups) {
          this.nuevoServicio.cups = this.obtenerCupsDelPuntoSuministro();
        }
        
        this.nuevoServicio.fechaInicioServicio = this.formatDateForInput(servicio.fechaInicioServicio);
        this.nuevoServicio.fechaFinServicio = this.formatDateForInput(servicio.fechaFinServicio);
      }
      
      await this.terminarCargaEdicion(peticion, servicio.id);
    },

    // Hasta tener el servicio y su plan de pagos el formulario no se enseña: guardar antes
    // de que llegara el plan (o si fallaba su carga) lo regeneraba como si no hubiera
    // ninguna cuota pagada. La última edición abierta es la que vale.
    empezarCargaEdicion(servicioId) {
      this.peticionEdicion += 1;
      this.pagosExistentes = null;
      this.cuotas = [];
      this.errores = {};
      this.cargandoDatos = true;
      this.mostrandoFormulario = true;
      this.modoEdicion = true;
      this.modoRenovacion = false;
      this.servicioEditandoId = servicioId;
      return this.peticionEdicion;
    },

    async terminarCargaEdicion(peticion, servicioId) {
      const planCargado = await this.cargarDatosPagosServicio(servicioId);
      if (peticion !== this.peticionEdicion) return;
      this.cargandoDatos = false;
      if (!planCargado) {
        this.cancelarFormulario();
        this.$swal.fire({
          icon: 'error',
          title: 'No se pudo abrir el servicio',
          text: 'No se han podido cargar sus pagos. Inténtelo de nuevo en unos segundos; no se ha modificado nada.',
          confirmButtonColor: '#fcd700'
        });
      }
    },

    renovarServicioGenerico(servicio) {
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = true;
      this.servicioEditandoId = null;
      
      this.nuevoServicio = {
        ...servicio,
        id: undefined,
        idCliente: servicio.idCliente || servicio.cliente?.id || this.cliente?.id,
        idPuntoSuministro: servicio.idPuntoSuministro || servicio.puntoSuministro?.id || this.puntoSuministroData?.id,
        cups: this.obtenerCupsDelPuntoSuministro() || servicio.cups || "",
        fechaInicioServicio: this.formatDateForInput(servicio.fechaInicioServicio) || '',
        fechaFinServicio: this.formatDateForInput(servicio.fechaFinServicio) || '',
      };
      
      // Asegurar que el campo CUPS esté siempre cargado para renovación
      if (!this.nuevoServicio.cups) {
        this.nuevoServicio.cups = this.obtenerCupsDelPuntoSuministro();
      }
      
    },

    cancelarFormulario() {
      // Una carga de edición que siga en curso ya no abre el formulario
      this.peticionEdicion += 1;
      this.cargandoDatos = false;
      this.mostrandoFormulario = false;
      // Los avisos en rojo de este intento no se arrastran al siguiente formulario
      this.errores = {};
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.servicioEditandoId = null;
      this.cuotas = [];
      this.pagosExistentes = null; // Limpiar datos de pagos existentes
    },

    async guardarServicio() {
      if (this.guardando) {
        return;
      }

      let bloqueoAdquirido = false;

      // Validar campos obligatorios con indicadores visuales
      if (!this.validarServicio()) {
        await this.$swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Revise los campos marcados en rojo antes de guardar.',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      try {
        if (!this.nuevoServicio.idPuntoSuministro) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Error de configuración',
            text: 'No se pudo determinar el punto de suministro. Verifique la configuración.',
            confirmButtonColor: '#fcd700'
          });
          return;
        }

        // Validar importes no negativos
        if (this.nuevoServicio.importe < 0 || this.nuevoServicio.descuento < 0 || this.nuevoServicio.importeFinal < 0) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Importes inválidos',
            text: 'Los importes no pueden ser negativos',
            confirmButtonColor: '#fcd700'
          });
          return;
        }

        // Validar que el descuento no sea mayor que el importe
        if (this.nuevoServicio.descuento > this.nuevoServicio.importe) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Descuento inválido',
            text: 'El descuento no puede ser mayor que el importe total',
            confirmButtonColor: '#fcd700'
          });
          return;
        }

        // Confirmar ANTES de persistir nada si el cambio de modalidad de pago
        // perdería cuotas ya pagadas. Si el usuario cancela, no se ejecuta ninguna petición.
        const confirmacionPagos = await this.confirmarCambioModalidadPagoSiAplica();
        if (!confirmacionPagos.proceder) {
          return;
        }

        // Dos envios pueden coincidir mientras se espera la confirmacion.
        // Solo el primero que llegue a la mutacion adquiere el bloqueo.
        if (this.guardando) {
          return;
        }
        this.guardando = true;
        bloqueoAdquirido = true;

        this.$swal.fire({
          title: 'Guardando servicio...',
          text: 'Por favor, espere mientras se procesa la información.',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            this.$swal.showLoading();
          }
        });

        const servicioPayload = {
          id: this.modoEdicion ? this.servicioEditandoId : null,
          cups: this.nuevoServicio.cups,
          fechaInicioServicio: this.nuevoServicio.fechaInicioServicio,
          fechaFinServicio: this.nuevoServicio.fechaFinServicio,
          descripcion: this.nuevoServicio.descripcion,
          importe: this.nuevoServicio.importe || 0,
          descuento: this.nuevoServicio.descuento || 0,
          importeFinal: this.descuentoTotalFormulario() ? 0 : (this.nuevoServicio.importeFinal || this.nuevoServicio.importe || 0),
          idGestora: this.nuevoServicio.idGestora || null,
          idProducto: this.nuevoServicio.idProducto || null,
          idComercializadora: this.nuevoServicio.idComercializadora || null,
          idPagoPlazos: this.nuevoServicio.idPagoPlazos || null, // ¡CAMPO FALTANTE CRÍTICO!
          observaciones: this.nuevoServicio.observaciones || "",
          puntoSuministro: {
            id: this.nuevoServicio.idPuntoSuministro
          },
          cliente: {
            id: typeof this.cliente === 'object' ? this.cliente.id : this.cliente
          }
        };
        let pagosPayload = null;
        const servicioId = this.modoEdicion ? this.servicioEditandoId : null;
        
        // Si hay datos de pagos, manejarlos según el modo
        if (this.nuevoServicio.idPagoPlazos && 
            (this.nuevoServicio.importe >= 0 || this.nuevoServicio.importeFinal >= 0)) {
          
          // Validar que tenemos un ID de servicio válido
          if (this.modoEdicion) {
            // MODO EDICIÓN: Lógica inteligente para manejar cambios en pagos
            const pagosCambiaron = this.verificarCambiosEnPagos();
            const cambioModalidad = this.cambioModalidadPago();

            if (pagosCambiaron) {

              if (cambioModalidad && this.pagosExistentes) {
                // La confirmación de posible pérdida de cuotas pagadas ya se
                // resolvió en confirmarCambioModalidadPagoSiAplica(), antes de
                // persistir el servicio. Aquí solo se genera el nuevo plan.
                const pagosGenerados = await this.generarPlanDePagos();

                // Fusionar cuotas existentes con el nuevo plan
                pagosPayload = await this.fusionarCuotasConNuevoPlan(servicioId, pagosGenerados);
              } else if (cambioModalidad && !this.pagosExistentes) {
                // CASO ESPECIAL: Servicio sin pagos previos pero ahora con modalidad de pago
                
                const pagosGenerados = await this.generarPlanDePagos();

                if (pagosGenerados) {
                  pagosPayload = {
                    id: null, // Nuevo registro
                    pagoPlazos: {
                      id: Number(this.nuevoServicio.idPagoPlazos)
                    },
                    servicio: {
                      id: Number(servicioId)
                    },
                    importe: this.nuevoServicio.importe || pagosGenerados.importe || 0,
                    descuento: this.nuevoServicio.descuento || pagosGenerados.descuento || 0,
                    importeFinal: this.descuentoTotalFormulario() ? 0 : (this.nuevoServicio.importeFinal || pagosGenerados.importeFinal || 0),
                    // Incluir todas las fechas e importes de las cuotas generadas
                    ...pagosGenerados
                  };

                }
              } else {
                // SIN CAMBIO DE MODALIDAD: Solo actualizar importes preservando todo lo demás
                pagosPayload = this.crearPayloadPagosPreservando(servicioId);
              }
            } 
          } else {
            // MODO CREACIÓN: Generar nuevo plan de pagos
            const pagosGenerados = await this.generarPlanDePagos();

            if (pagosGenerados && this.nuevoServicio.idPagoPlazos) {
              pagosPayload = {
                id: null, // Nuevo registro
                pagoPlazos: {
                  id: Number(this.nuevoServicio.idPagoPlazos)
                },
                servicio: {
                  id: Number(servicioId)
                },
                importe: this.nuevoServicio.importe || pagosGenerados.importe || 0,
                descuento: this.nuevoServicio.descuento || pagosGenerados.descuento || 0,
                importeFinal: this.descuentoTotalFormulario() ? 0 : (this.nuevoServicio.importeFinal || pagosGenerados.importeFinal || 0),
                // Incluir todas las fechas e importes de las cuotas generadas
                primerPagoFecha: pagosGenerados.primerPagoFecha,
                primerPagoImporte: pagosGenerados.primerPagoImporte,
                primerPagoPagado: pagosGenerados.primerPagoPagado || false,
                segundoPagoFecha: pagosGenerados.segundoPagoFecha,
                segundoPagoImporte: pagosGenerados.segundoPagoImporte,
                segundoPagoPagado: pagosGenerados.segundoPagoPagado || false,
                tercerPagoFecha: pagosGenerados.tercerPagoFecha,
                tercerPagoImporte: pagosGenerados.tercerPagoImporte,
                tercerPagoPagado: pagosGenerados.tercerPagoPagado || false,
                cuartoPagoFecha: pagosGenerados.cuartoPagoFecha,
                cuartoPagoImporte: pagosGenerados.cuartoPagoImporte,
                cuartoPagoPagado: pagosGenerados.cuartoPagoPagado || false,
                quintoPagoFecha: pagosGenerados.quintoPagoFecha,
                quintoPagoImporte: pagosGenerados.quintoPagoImporte,
                quintoPagoPagado: pagosGenerados.quintoPagoPagado || false,
                sextoPagoFecha: pagosGenerados.sextoPagoFecha,
                sextoPagoImporte: pagosGenerados.sextoPagoImporte,
                sextoPagoPagado: pagosGenerados.sextoPagoPagado || false,
                septimoPagoFecha: pagosGenerados.septimoPagoFecha,
                septimoPagoImporte: pagosGenerados.septimoPagoImporte,
                septimoPagoPagado: pagosGenerados.septimoPagoPagado || false,
                octavoPagoFecha: pagosGenerados.octavoPagoFecha,
                octavoPagoImporte: pagosGenerados.octavoPagoImporte,
                octavoPagoPagado: pagosGenerados.octavoPagoPagado || false,
                novenoPagoFecha: pagosGenerados.novenoPagoFecha,
                novenoPagoImporte: pagosGenerados.novenoPagoImporte,
                novenoPagoPagado: pagosGenerados.novenoPagoPagado || false,
                decimoPagoFecha: pagosGenerados.decimoPagoFecha,
                decimoPagoImporte: pagosGenerados.decimoPagoImporte,
                decimoPagoPagado: pagosGenerados.decimoPagoPagado || false,
                decimoprimerPagoFecha: pagosGenerados.decimoprimerPagoFecha,
                decimoprimerPagoImporte: pagosGenerados.decimoprimerPagoImporte,
                decimoprimerPagoPagado: pagosGenerados.decimoprimerPagoPagado || false,
                decimosegundoPagoFecha: pagosGenerados.decimosegundoPagoFecha,
                decimosegundoPagoImporte: pagosGenerados.decimosegundoPagoImporte,
                decimosegundoPagoPagado: pagosGenerados.decimosegundoPagoPagado || false
              };

            }
          }
        }
        
        // Mostrar mensaje de éxito con información adicional si se preservaron pagos
        // El backend vincula los pagos al servicio persistido. Evitamos enviar
        // un ID provisional durante el alta y mantenemos una sola mutacion.
        if (pagosPayload) {
          delete pagosPayload.servicio;
        }

        const response = await axios.post(
          `${process.env.VUE_APP_API_URL}/servicios/guardar-con-pagos`,
          { servicio: servicioPayload, pagos: pagosPayload }
        );

        let mensajeExito = this.modoEdicion 
          ? 'El servicio ha sido actualizado correctamente.' 
          : (this.modoRenovacion ? 'El servicio ha sido renovado correctamente.' : 'El nuevo servicio ha sido creado correctamente.');
        
        if (this.modoEdicion && this.pagosExistentes && this.verificarCambiosEnPagos()) {
          const cuotasPagadas = this.contarCuotasPagadas();
          if (cuotasPagadas > 0) {
            mensajeExito += ` Se han preservado las cuotas ya pagadas.`;
          }
        }

        await this.$swal.fire({
          title: this.modoEdicion ? 'Servicio actualizado' : (this.modoRenovacion ? 'Servicio renovado' : 'Servicio creado'),
          text: mensajeExito,
          icon: 'success',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar',
          timer: 3000,
          timerProgressBar: true
        });
        
        if (this.modoEdicion) {
          this.$emit("servicio-actualizado", response.data);
        } else if (this.modoRenovacion) {
          this.$emit("servicio-renovado", response.data);
        } else {
          this.$emit("servicio-creado", response.data);
        }
        
        this.$emit("recargar-servicios");
        this.cancelarFormulario();
        
      } catch (error) {
        console.error("Error al guardar el servicio:", error);
        const errData = error.response?.data;
        const detalle = errData?.message || errData?.error || errData?.mensaje || (typeof errData === 'string' ? errData : '') || error.message || '';
        this.$swal.fire({
          title: 'Error',
          text: `No se pudo ${this.modoEdicion ? 'actualizar' : (this.modoRenovacion ? 'renovar' : 'crear')} el servicio.${detalle ? ' ' + detalle : ' Por favor, verifica los datos e inténtalo de nuevo.'}`,
          icon: 'error',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        if (bloqueoAdquirido) {
          this.guardando = false;
        }
      }
    },

    // Verificar si un servicio tiene cuotas pendientes de pago
    tieneCuotasPendientes(servicio) {
      // Sin plan de pagos no hay cuotas que cobrar: no está pendiente (como en el informe
      // «Servicios pendientes de pago»). Antes el plan vacío del servidor contaba como 12
      // cuotas sin pagar y el servicio se quedaba PENDIENTE para siempre
      if (!servicio.pagos) return false;
      
      const pagos = servicio.pagos;
      const numeroCuotas = this.obtenerNumeroCuotas(pagos);
      
      // Array de los campos de pago en orden
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      // Verificar si hay al menos una cuota pendiente dentro del número de cuotas de la modalidad
      for (let i = 0; i < numeroCuotas && i < camposPagado.length; i++) {
        if (!pagos[camposPagado[i]]) {
          return true; // Hay al menos una cuota pendiente
        }
      }
      
      return false; // Todas las cuotas están pagadas
    },

    // Determinar el estado de un servicio: VIGENTE, PENDIENTE o HISTÓRICO
    obtenerEstadoServicio(servicio) {
      // Si está dentro del período de vigencia
      if (enVigorHoy(servicio.fechaInicioServicio, servicio.fechaFinServicio)) {
        return 'VIGENTE';
      }
      
      // Si ya pasó la fecha de fin pero tiene cuotas pendientes
      if (terminadoHoy(servicio.fechaFinServicio) && this.tieneCuotasPendientes(servicio)) {
        return 'PENDIENTE';
      }
      
      // En cualquier otro caso es histórico
      return 'HISTÓRICO';
    },

    verDetalleServicio(servicio) {
      // Crear una copia del servicio y asegurar que tenga el CUPS correcto
      this.servicioDetalle = {
        ...servicio,
        cups: this.obtenerCupsDelPuntoSuministro() || servicio.cups || ""
      };
      this.mostrarModalDetalleServicio = true;
    },

    async gestionarPagosServicio(servicio) {
      // Asegurar que tenemos un servicio válido
      if (!servicio || !servicio.id) {
        console.error('❌ Se intentó gestionar pagos de un servicio inválido:', servicio);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo identificar el servicio seleccionado.',
          confirmButtonColor: '#fcd700'
        });
        return;
      }
    
      // Asignar el servicio actual ANTES de cargar las cuotas
      this.servicioGestionPagos = { ...servicio }; // Crear una copia para evitar referencias
      this.mostrarModalGestionPagos = true;
      
      // Cargar las cuotas después de mostrar el modal
      try {
        await this.cargarCuotasParaGestion(servicio.id);
      } catch (error) {
        console.error('❌ Error al cargar cuotas:', error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error al cargar cuotas',
          text: 'No se pudieron cargar las cuotas del servicio.',
          confirmButtonColor: '#fcd700'
        });
        // Si falla, cerrar el modal
        this.cerrarModalGestionPagos();
      }
    },

    inicializarNuevoServicio() {
      // Obtener el CUPS del punto de suministro usando el helper
      const cupsValue = this.obtenerCupsDelPuntoSuministro();
      
      this.nuevoServicio = {
        idCliente: this.cliente?.id || "",
        idPuntoSuministro: this.puntoSuministroData?.id || "",
        cups: cupsValue,
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        idPagoPlazos: null,
        importe: 0,
        descuento: 0,
        importeFinal: 0,
        observaciones: "",
      };
    },

    cerrarModal() {
      this.$emit('cerrar-modal');
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.servicioEditandoId = null;
      this.pagosExistentes = null; // Limpiar datos de pagos existentes
    },

    cerrarModalDetalleServicio() {
      this.mostrarModalDetalleServicio = false;
      this.servicioDetalle = null;
    },

    // Cerrar «Gestión de pagos» (X, Esc o clic fuera): si hay cuotas cambiadas sin pulsar
    // «Guardar», se pregunta antes; antes se cerraba y el cambio se perdía sin avisar
    async pedirCerrarGestionPagos() {
      const sinGuardar = this.cuotas.filter(cuota => cuota.editado).length;
      if (sinGuardar) {
        const respuesta = await this.$swal.fire({
          icon: 'warning',
          title: sinGuardar === 1 ? 'Hay una cuota sin guardar' : `Hay ${sinGuardar} cuotas sin guardar`,
          text: 'Si cierra ahora, se perderán los cambios que no ha guardado con el botón «Guardar» de su fila.',
          showCancelButton: true,
          confirmButtonText: 'Cerrar sin guardar',
          cancelButtonText: 'Seguir editando',
          confirmButtonColor: '#d33',
          focusCancel: true
        });
        if (!respuesta.isConfirmed) return;
      }
      this.cerrarModalGestionPagos();
    },

    cerrarModalGestionPagos() {
      
      this.mostrarModalGestionPagos = false;
      this.servicioGestionPagos = null;
      this.cuotas = [];
      
      // Limpiar cualquier cuota que pueda estar en estado editado
      this.cuotas.forEach(cuota => {
        cuota.editado = false;
      });
      
      // Emitir evento para recargar servicios ahora que se cierra el modal
      // Esto asegura que los datos se mantengan sincronizados sin afectar la vista actual
      this.$emit("recargar-servicios");
    },

    /** Usa la lista que ya envía el padre y solo la pide al servidor si llega vacía. */
    async cargarComercializadoras() {
      if (this.comercializadoras && this.comercializadoras.length > 0) {
        this.comercializadorasList = [...this.comercializadoras];
        return;
      }
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/comercializadoras`);
        this.comercializadorasList = response.data;
      } catch (error) {
        console.error('Error al cargar comercializadoras:', error);
        this.comercializadorasList = [];
      }
    },

    // Eliminar servicio con confirmación
    async eliminarServicio(servicio) {
      try {
        // Verificar si el servicio tiene pagos asociados
        let tienePagos = false;
        try {
          const responsePagos = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicio.id}`);
          tienePagos = responsePagos.data && responsePagos.data.id;
        } catch (error) {
          // Si no hay pagos, continuar con la eliminación normal
        }

        // Crear mensaje de confirmación apropiado
        let mensajeConfirmacion = `¿Deseas eliminar el servicio #${servicio.id}?`;
        if (tienePagos) {
          mensajeConfirmacion += '\n\n⚠️ Este servicio tiene pagos asociados que también se eliminarán.';
        }

        const result = await this.$swal.fire({
          title: '¿Estás seguro?',
          text: mensajeConfirmacion,
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
            text: 'Por favor, espere mientras se elimina el servicio y sus datos asociados.',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
              this.$swal.showLoading();
            }
          });

          try {
            // El servidor borra el servicio y su plan de pagos en la misma operación: si
            // algo falla no queda un servicio sin pagos
            await axios.delete(`${process.env.VUE_APP_API_URL}/servicios/${servicio.id}`);
            
            // Mostrar mensaje de éxito
            await this.$swal.fire({
              title: 'Eliminado',
              text: 'El servicio y sus datos asociados han sido eliminados correctamente.',
              icon: 'success',
              confirmButtonColor: '#fcd700',
              confirmButtonText: 'Aceptar',
              timer: 2000,
              timerProgressBar: true
            });

            // Emitir evento para recargar servicios
            this.$emit("recargar-servicios");
          } catch (deleteError) {
            console.error('Error durante la eliminación:', deleteError);
            throw deleteError;
          }
        }
      } catch (error) {
        console.error('Error al eliminar servicio:', error);

        // El servidor explica el motivo cuando lo hay (p. ej. datos asociados)
        const motivo = error.response?.data?.error;
        const mensajeError = motivo
          ? `No se pudo eliminar el servicio: ${motivo}`
          : 'No se pudo eliminar el servicio. Por favor, inténtalo de nuevo.';

        this.$swal.fire({
          title: 'Error',
          text: mensajeError,
          icon: 'error',
          confirmButtonColor: '#fcd700',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    /** Pide al servidor el reparto de cuotas de la modalidad elegida. */
    async generarPlanDePagos() {
      try {
        const respuesta = await axios.post(`${process.env.VUE_APP_API_URL}/servicios-pagos/generar-plan`, {
          idPagoPlazos: this.nuevoServicio.idPagoPlazos,
          importeTotal: this.descuentoTotalFormulario() ? 0 : (this.nuevoServicio.importeFinal || this.nuevoServicio.importe),
          fechaInicio: this.nuevoServicio.fechaInicioServicio
        });
        return respuesta.data;
      } catch (error) {
        console.error('Error al generar el plan de pagos:', error);
        throw new Error('No se pudo generar el nuevo plan de pagos');
      }
    },

    async cargarModalidadesPago() {
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/pagos-plazos`);
        this.modalidadesPago = resp.data;
      } catch (e) {
        console.error('Error al cargar modalidades de pago:', e);
        this.modalidadesPago = [];
      }
    },

    // Con la ventana de «Gestión de pagos» abierta, solo valen las cuotas de su servicio:
    // una carga de otro (p. ej. la del vigente tras recargar la lista) no las sustituye
    cuotasDeOtroServicio(servicioId) {
      return this.mostrarModalGestionPagos && this.servicioGestionPagos?.id !== servicioId;
    },

    async cargarCuotas() {
      if (!this.servicioActual || !this.servicioActual.id) return;
      
      // Reutilizar el método mejorado de cargar cuotas
      try {
        await this.cargarCuotasParaGestion(this.servicioActual.id);
      } catch (error) {
        console.error('Error al cargar las cuotas del servicio actual:', error);
      }
    },

    async cargarCuotasParaGestion(servicioId) {
      try {
        // Verificar que el servicioId es válido
        if (!servicioId) {
          this.cuotas = [];
          return;
        }
      
        
        // Intentar cargar desde el endpoint de cuotas primero
        try {
          const resp = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicioId}/cuotas`);
          if (this.cuotasDeOtroServicio(servicioId)) return;
          this.cuotas = resp.data.map(c => ({ ...c, editado: false }));
          return;
        } catch (cuotasError) {
          console.error('Error al cargar cuotas:', cuotasError);
        }
        
        // Si no hay endpoint de cuotas, cargar desde servicios-pagos y convertir
        const respPagos = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicioId}`);
        if (this.cuotasDeOtroServicio(servicioId)) return;
        const pagos = respPagos.data;
        
        // Verificar que los datos de pagos corresponden al servicio correcto
        if (pagos && pagos.servicio?.id !== servicioId) {
          console.error(`⚠️ Error de sincronización: Se solicitó servicio ${servicioId} pero se recibió servicio ${pagos.servicio?.id}`);
          this.cuotas = [];
          return;
        }
        
        if (pagos) {
          
          // Convertir los datos de pagos a formato de cuotas
          this.cuotas = [];
          
          // Obtener el número real de cuotas de la modalidad actual
          const numeroCuotasReales = this.obtenerNumeroCuotasDesdePagos(pagos);
          
          const cuotasData = [
            { num: 1, fecha: 'primerPagoFecha', importe: 'primerPagoImporte', pagado: 'primerPagoPagado' },
            { num: 2, fecha: 'segundoPagoFecha', importe: 'segundoPagoImporte', pagado: 'segundoPagoPagado' },
            { num: 3, fecha: 'tercerPagoFecha', importe: 'tercerPagoImporte', pagado: 'tercerPagoPagado' },
            { num: 4, fecha: 'cuartoPagoFecha', importe: 'cuartoPagoImporte', pagado: 'cuartoPagoPagado' },
            { num: 5, fecha: 'quintoPagoFecha', importe: 'quintoPagoImporte', pagado: 'quintoPagoPagado' },
            { num: 6, fecha: 'sextoPagoFecha', importe: 'sextoPagoImporte', pagado: 'sextoPagoPagado' },
            { num: 7, fecha: 'septimoPagoFecha', importe: 'septimoPagoImporte', pagado: 'septimoPagoPagado' },
            { num: 8, fecha: 'octavoPagoFecha', importe: 'octavoPagoImporte', pagado: 'octavoPagoPagado' },
            { num: 9, fecha: 'novenoPagoFecha', importe: 'novenoPagoImporte', pagado: 'novenoPagoPagado' },
            { num: 10, fecha: 'decimoPagoFecha', importe: 'decimoPagoImporte', pagado: 'decimoPagoPagado' },
            { num: 11, fecha: 'decimoprimerPagoFecha', importe: 'decimoprimerPagoImporte', pagado: 'decimoprimerPagoPagado' },
            { num: 12, fecha: 'decimosegundoPagoFecha', importe: 'decimosegundoPagoImporte', pagado: 'decimosegundoPagoPagado' }
          ];
          
          // Solo procesar las cuotas que corresponden a la modalidad actual
          for (let i = 0; i < numeroCuotasReales && i < cuotasData.length; i++) {
            const cuotaInfo = cuotasData[i];
            const fechaPago = pagos[cuotaInfo.fecha];
            const importePago = pagos[cuotaInfo.importe];
            const estaPagado = pagos[cuotaInfo.pagado];
            
            if (fechaPago && importePago) {
              this.cuotas.push({
                id: `${servicioId}-${cuotaInfo.num}`, // ID único para la cuota
                numeroPago: cuotaInfo.num,
                fechaPago: fechaPago.split('T')[0], // Convertir a formato YYYY-MM-DD
                importePago: importePago,
                pagado: estaPagado || false,
                editado: false,
                servicioId: servicioId, // IMPORTANTE: Asegurar que cada cuota sepa a qué servicio pertenece
                // Añadir los nombres de los campos para poder actualizarlos
                fechaField: cuotaInfo.fecha,
                importeField: cuotaInfo.importe,
                pagadoField: cuotaInfo.pagado
              });
            }
          }
          
        } else {
          this.cuotas = [];
        }
      } catch (e) {
        this.cuotas = [];
        // Quien llama decide cómo avisar: antes un fallo se veía como «No hay cuotas»
        throw e;
      }
    },

    marcarEditado(cuota) {
      cuota.editado = true;
    },

    async guardarCuota(cuota) {
      const servicioIdActual = this.servicioGestionPagos?.id;
      try {
        if (!servicioIdActual) {
          throw new Error('No se pudo identificar el servicio actual');
        }
        
        if (cuota.fechaField && cuota.importeField && cuota.pagadoField) {
          // Cuotas montadas en pantalla a partir del plan (cuando no se pudo leer el listado
          // de cuotas): se actualiza el plan entero del servicio
          const servicioIdParaActualizar = cuota.servicioId || servicioIdActual;
          
          // Cargar los datos de pagos actuales del servicio específico
          const respPagos = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicioIdParaActualizar}`);
          const pagosActuales = respPagos.data;
          
          // Verificar que estamos actualizando el servicio correcto
          if (pagosActuales.servicio?.id !== servicioIdActual) {
            throw new Error(`Error de sincronización: Se esperaba servicio ${servicioIdActual} pero se cargó servicio ${pagosActuales.servicio?.id}`);
          }
          
          // Actualizar los campos específicos de esta cuota
          pagosActuales[cuota.fechaField] = cuota.fechaPago + 'T00:00:00.000Z'; // Convertir a formato ISO
          pagosActuales[cuota.importeField] = parseFloat(cuota.importePago);
          pagosActuales[cuota.pagadoField] = cuota.pagado;
          
          await axios.put(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicioIdParaActualizar}`, pagosActuales);
        } else {
          await axios.put(`${process.env.VUE_APP_API_URL}/servicios-pagos/cuota/${cuota.id}`, cuota);
        }
      } catch (e) {
        // Se enseña el motivo real del servidor (antes un fallo acababa en «No se pudo
        // determinar cómo actualizar la cuota»)
        console.error('Error al guardar cuota:', e);
        this.$swal.fire({ 
          icon: 'error', 
          title: 'Error al guardar cuota', 
          text: e.response?.data?.message || e.response?.data?.error || e.message || 'Error desconocido'
        });
        return;
      }
      
      cuota.editado = false;
      this.$swal.fire({ icon: 'success', title: 'Cuota actualizada', timer: 1200, showConfirmButton: false });
      
      // Recargar cuotas del servicio específico. NO se emite recargar-servicios aquí para
      // no desincronizar el modal: el refresco se hace al cerrar la gestión de pagos
      try {
        await this.cargarCuotasParaGestion(servicioIdActual);
      } catch (error) {
        console.error('Error al recargar las cuotas tras guardar:', error);
      }
    },

    async cargarDatosPagosServicio(servicioId) {
      if (!servicioId) return false;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/servicios-pagos/servicio/${servicioId}`);
        const pagos = response.data;
        // Un servicio sin plan de pagos devuelve un objeto vacío (sin id): sus importes no
        // pueden pisar con ceros los del propio servicio
        if (pagos?.id) {
          this.nuevoServicio.idPagoPlazos = Number(pagos.pagoPlazos?.id) || null;
          this.nuevoServicio.importe = parseFloat(pagos.importe) || 0;
          this.nuevoServicio.descuento = parseFloat(pagos.descuento) || 0;
          this.nuevoServicio.importeFinal = parseFloat(pagos.importeFinal) || 0;
          
          // Guardar los datos de pagos existentes para preservarlos durante la edición
          this.pagosExistentes = { ...pagos };
          
          this.$nextTick(() => {
            this.$forceUpdate();
          });
        }
        
        // También las cuotas del servicio que se edita (antes, las del vigente)
        if (this.modoEdicion) {
          await this.cargarCuotasParaGestion(servicioId);
        }
        return true;
      } catch (error) {
        console.error("Error al cargar datos de pagos del servicio:", error);
        return false;
      }
    },

    obtenerMesesPagados(pagos) {
      if (!pagos) return 0;
      
      // Obtener el número real de cuotas de la modalidad de pago
      const numeroCuotasReales = this.obtenerNumeroCuotas(pagos);
      
      // Array de los campos de pago en orden
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      let contador = 0;
      // Solo contar hasta el número real de cuotas de la modalidad
      for (let i = 0; i < numeroCuotasReales && i < camposPagado.length; i++) {
        if (pagos[camposPagado[i]]) {
          contador++;
        }
      }
      
      return contador;
    },

    // Obtener número total de cuotas desde pagoPlazos
    obtenerNumeroCuotas(pagos) {
      if (!pagos || !pagos.pagoPlazos) return 12; // Fallback por defecto
      return pagos.pagoPlazos.numeroCuotas || 12;
    },

    // Método para verificar si han cambiado los datos de pago que requieren actualización
    verificarCambiosEnPagos() {
      // Si no hay datos existentes pero ahora hay modalidad de pago, hay cambios
      if (!this.pagosExistentes) {
        return !!(this.nuevoServicio.idPagoPlazos && 
                 (this.nuevoServicio.importe >= 0 || this.nuevoServicio.importeFinal >= 0));
      }
      
      // Verificar si alguno de los campos relevantes cambió
      return (
        this.pagosExistentes.importe !== this.nuevoServicio.importe ||
        this.pagosExistentes.descuento !== this.nuevoServicio.descuento ||
        this.pagosExistentes.importeFinal !== this.nuevoServicio.importeFinal ||
        this.pagosExistentes.pagoPlazos?.id !== this.nuevoServicio.idPagoPlazos
      );
    },

    // Método para verificar si cambió la modalidad de pago (requiere regeneración de plan)
    cambioModalidadPago() {
      // Si no hay pagos existentes pero ahora hay modalidad, es un cambio
      if (!this.pagosExistentes) {
        return !!this.nuevoServicio.idPagoPlazos;
      }
      
      // Si había modalidad anterior y ahora es diferente, es un cambio
      if (this.pagosExistentes.pagoPlazos?.id !== this.nuevoServicio.idPagoPlazos) {
        return true;
      }
      
      return false;
    },

    // Confirma ANTES de persistir nada si el cambio de modalidad de pago perdería
    // cuotas ya pagadas. Debe llamarse antes de cualquier petición de guardado.
    async confirmarCambioModalidadPagoSiAplica() {
      if (!this.modoEdicion) return { proceder: true };

      const hayDatosDePago = this.nuevoServicio.idPagoPlazos &&
        (this.nuevoServicio.importe >= 0 || this.nuevoServicio.importeFinal >= 0);
      if (!hayDatosDePago) return { proceder: true };

      const pagosCambiaron = this.verificarCambiosEnPagos();
      const cambioModalidad = this.cambioModalidadPago();
      if (!(pagosCambiaron && cambioModalidad && this.pagosExistentes)) {
        return { proceder: true };
      }

      const resultadoVerificacion = await this.verificarPerdidaDatos();
      if (!resultadoVerificacion.sePierdenDatos) {
        return { proceder: true };
      }

      const cuotasHtml = resultadoVerificacion.detalleCuotasPerdidas.map(cuota =>
        `<li>Cuota ${cuota.numero}: ${cuota.importe.toFixed(2)}€ ${cuota.fecha ? `(Pagada: ${escaparHtml(cuota.fecha)})` : ''}</li>`
      ).join('');

      const resultado = await this.$swal.fire({
        title: '⚠️ Advertencia: Pérdida de Datos de Pagos',
        html: `
          <div class="swal-perdida-cuotas-contenedor">
            <div class="swal-perdida-cuotas-resumen">
              <h4>📊 Resumen del cambio:</h4>
              <p><strong>Cuotas actuales:</strong> ${resultadoVerificacion.cuotasActuales}</p>
              <p><strong>Nuevas cuotas:</strong> ${resultadoVerificacion.nuevasCuotas}</p>
              <p><strong>Cuotas ya pagadas:</strong> ${resultadoVerificacion.cuotasPagadas}</p>
            </div>
            
            <div class="swal-perdida-cuotas-detalle">
              <h4>⚠️ Datos que se perderán:</h4>
              <p><strong>${resultadoVerificacion.cuotasQueSePerderan} cuotas pagadas</strong></p>
              <p><strong>Importe total: ${resultadoVerificacion.importePerdido.toFixed(2)}€</strong></p>
              
              <details>
                <summary>Ver detalle de cuotas que se perderán</summary>
                <ul>
                  ${cuotasHtml}
                </ul>
              </details>
            </div>
            
            <div class="swal-perdida-cuotas-irreversible">
              <p>
                ⚠️ Esta acción no se puede deshacer. Los datos de las cuotas pagadas que excedan el nuevo número de cuotas se eliminarán permanentemente.
              </p>
            </div>
            
            <p class="swal-perdida-cuotas-pregunta">¿Estás seguro de que quieres continuar con este cambio?</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar y perder datos',
        cancelButtonText: 'Cancelar operación',
        width: '600px'
      });

      if (!resultado.isConfirmed) {
        // Usuario canceló: restaurar modalidad anterior y no persistir nada todavía
        this.nuevoServicio.idPagoPlazos = this.pagosExistentes.pagoPlazos?.id;
        this.$swal.fire({
          title: 'Operación cancelada',
          text: 'No se han realizado cambios en los pagos. Se mantiene la modalidad original.',
          icon: 'info',
          confirmButtonColor: '#fcd700'
        });
        return { proceder: false };
      }

      return { proceder: true };
    },

    // Método para contar cuotas pagadas en los datos existentes
    contarCuotasPagadas() {
      if (!this.pagosExistentes) return 0;
      
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      // Solo las del plan: las cuotas que no usa la modalidad se guardan como pagadas
      return camposPagado.slice(0, this.obtenerNumeroCuotasActual())
        .filter(campo => this.pagosExistentes[campo]).length;
    },

    // Método para obtener detalle de cuotas pagadas
    obtenerCuotasPagadasDetalle() {
      if (!this.pagosExistentes) return [];
      
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      const camposImporte = [
        'primerPagoImporte', 'segundoPagoImporte', 'tercerPagoImporte', 'cuartoPagoImporte',
        'quintoPagoImporte', 'sextoPagoImporte', 'septimoPagoImporte', 'octavoPagoImporte',
        'novenoPagoImporte', 'decimoPagoImporte', 'decimoprimerPagoImporte', 'decimosegundoPagoImporte'
      ];

      const camposFecha = [
        'primerPagoFecha', 'segundoPagoFecha', 'tercerPagoFecha', 'cuartoPagoFecha',
        'quintoPagoFecha', 'sextoPagoFecha', 'septimoPagoFecha', 'octavoPagoFecha',
        'novenoPagoFecha', 'decimoPagoFecha', 'decimoprimerPagoFecha', 'decimosegundoPagoFecha'
      ];
      
      const cuotasPagadas = [];
      const numeroCuotasActual = this.obtenerNumeroCuotasActual();
      
      for (let i = 0; i < numeroCuotasActual && i < camposPagado.length; i++) {
        if (this.pagosExistentes[camposPagado[i]]) {
          cuotasPagadas.push({
            numero: i + 1,
            importe: this.pagosExistentes[camposImporte[i]] || 0,
            fecha: this.pagosExistentes[camposFecha[i]] || null,
            campoPagado: camposPagado[i],
            campoImporte: camposImporte[i],
            campoFecha: camposFecha[i]
          });
        }
      }
      
      return cuotasPagadas;
    },

    // Método para obtener número de cuotas de la nueva modalidad
    obtenerNumeroCuotasNuevaModalidad() {
      const modalidad = this.modalidadesPago.find(m => m.id === this.nuevoServicio.idPagoPlazos);
      return modalidad ? modalidad.numeroCuotas : 12;
    },

    // Método para preservar estados de pagos al crear payload (sin cambio de modalidad)
    crearPayloadPagosPreservando(servicioId) {
      const payloadBase = {
        ...this.pagosExistentes, // Partir de los datos existentes para preservar fechas y estados pagado
        // Solo actualizar los campos que pueden cambiar en la edición
        importe: this.nuevoServicio.importe,
        descuento: this.nuevoServicio.descuento,
        importeFinal: this.nuevoServicio.importeFinal,
        pagoPlazos: {
          id: Number(this.nuevoServicio.idPagoPlazos)
        },
        servicio: {
          id: Number(servicioId)
        }
        // IMPORTANTE: NO se incluyen fechas ni estados pagado porque se preservan del objeto existente
      };

      // Si cambió el importe final, recalcular cuotas no pagadas
      const importeCambio = this.pagosExistentes.importeFinal !== this.nuevoServicio.importeFinal;
      if (importeCambio) {
        return this.recalcularImportesCuotasNoPagadas(payloadBase);
      }

      return payloadBase;
    },

    // Método para recalcular importes solo en cuotas no pagadas
    recalcularImportesCuotasNoPagadas(payload) {
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      const camposImporte = [
        'primerPagoImporte', 'segundoPagoImporte', 'tercerPagoImporte', 'cuartoPagoImporte',
        'quintoPagoImporte', 'sextoPagoImporte', 'septimoPagoImporte', 'octavoPagoImporte',
        'novenoPagoImporte', 'decimoPagoImporte', 'decimoprimerPagoImporte', 'decimosegundoPagoImporte'
      ];

      const numeroCuotas = this.obtenerNumeroCuotasActual();
      const importeTotal = this.descuentoTotalFormulario() ? 0 : (this.nuevoServicio.importeFinal || this.nuevoServicio.importe);
      
      // Calcular importe ya pagado y cuotas pendientes
      let importePagado = 0;
      let cuotasPendientes = 0;
      
      for (let i = 0; i < numeroCuotas && i < camposPagado.length; i++) {
        if (payload[camposPagado[i]]) {
          importePagado += payload[camposImporte[i]] || 0;
        } else {
          cuotasPendientes++;
        }
      }
      
      // Lo que falta por pagar, repartido entre las cuotas pendientes con los céntimos
      // sobrantes en la última (antes, 100 € en 3 cuotas daban 99,99 €)
      const importes = this.repartirEnCuotas(Math.max(0, importeTotal - importePagado), cuotasPendientes);
      let siguiente = 0;
      for (let i = 0; i < numeroCuotas && i < camposPagado.length; i++) {
        if (!payload[camposPagado[i]]) {
          payload[camposImporte[i]] = importes[siguiente++];
        }
      }
      
      return payload;
    },

    // Método para fusionar cuotas existentes con nuevo plan (cuando cambia modalidad)
    async fusionarCuotasConNuevoPlan(servicioId, pagosGenerados) {
      const camposFecha = [
        'primerPagoFecha', 'segundoPagoFecha', 'tercerPagoFecha', 'cuartoPagoFecha',
        'quintoPagoFecha', 'sextoPagoFecha', 'septimoPagoFecha', 'octavoPagoFecha',
        'novenoPagoFecha', 'decimoPagoFecha', 'decimoprimerPagoFecha', 'decimosegundoPagoFecha'
      ];
      
      const camposImporte = [
        'primerPagoImporte', 'segundoPagoImporte', 'tercerPagoImporte', 'cuartoPagoImporte',
        'quintoPagoImporte', 'sextoPagoImporte', 'septimoPagoImporte', 'octavoPagoImporte',
        'novenoPagoImporte', 'decimoPagoImporte', 'decimoprimerPagoImporte', 'decimosegundoPagoImporte'
      ];
      
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];

      const numeroCuotasNueva = this.obtenerNumeroCuotasNuevaModalidad();
      const numeroCuotasActual = this.obtenerNumeroCuotasActual();

      // Crear payload base con los datos del nuevo plan
      const payloadFusionado = {
        // PRIMERO: Incluir las fechas e importes del nuevo plan
        ...pagosGenerados,
        // DESPUÉS: Sobrescribir con los valores correctos (para que NO se pierdan)
        id: this.pagosExistentes?.id || null,
        pagoPlazos: {
          id: Number(this.nuevoServicio.idPagoPlazos)
        },
        servicio: {
          id: Number(servicioId)
        },
        importe: this.nuevoServicio.importe,
        descuento: this.nuevoServicio.descuento,
        importeFinal: this.nuevoServicio.importeFinal
      };

      // Las cuotas pagadas que siguen en el plan se conservan y lo que falta por pagar se
      // reparte entre las demás. Antes cada cuota pendiente era «total / nº de cuotas»
      // aunque ya hubiera cuotas pagadas, y el plan no sumaba el importe del servicio
      // (12 cuotas de 100 € con 3 pagadas pasadas a 6 dejaban 300 € sin cobrar).
      const importeServicio = this.descuentoTotalFormulario() ? 0
        : (Number(this.nuevoServicio.importeFinal || this.nuevoServicio.importe) || 0);
      let yaPagado = 0;
      let pendientes = 0;
      for (let i = 0; i < numeroCuotasNueva && i < camposPagado.length; i++) {
        if (i < numeroCuotasActual && this.pagosExistentes[camposPagado[i]]) {
          yaPagado += Number(this.pagosExistentes[camposImporte[i]]) || 0;
        } else {
          pendientes++;
        }
      }
      const importesPendientes = this.repartirEnCuotas(Math.max(0, importeServicio - yaPagado), pendientes);
      let siguientePendiente = 0;

      // Preservar estados pagado de las cuotas existentes que siguen vigentes
      for (let i = 0; i < numeroCuotasNueva && i < camposPagado.length; i++) {
        const campoPagado = camposPagado[i];
        const campoFecha = camposFecha[i];
        const campoImporte = camposImporte[i];
        
        // Si la cuota existía antes y estaba pagada, preservar ese estado completo
        if (i < numeroCuotasActual && this.pagosExistentes[campoPagado]) {
          payloadFusionado[campoPagado] = true;
          
          // Preservar fecha e importe original para cuotas pagadas
          if (this.pagosExistentes[campoFecha]) {
            payloadFusionado[campoFecha] = this.pagosExistentes[campoFecha];
          }
          if (this.pagosExistentes[campoImporte] !== null && this.pagosExistentes[campoImporte] !== undefined) {
            payloadFusionado[campoImporte] = this.pagosExistentes[campoImporte];
          }
        } else {
          // Para cuotas no pagadas o nuevas, usar los valores recalculados
          payloadFusionado[campoPagado] = false;
          const importeCuota = importesPendientes[siguientePendiente++];
          // Mantener fecha del nuevo plan pero asegurar importe recalculado
          if (payloadFusionado[campoImporte] !== null && payloadFusionado[campoImporte] !== undefined) {
            payloadFusionado[campoImporte] = importeCuota;
          }
        }
      }

      // IMPORTANTE: Limpiar campos de cuotas que ya no existen en la nueva modalidad
      for (let i = numeroCuotasNueva; i < camposPagado.length; i++) {
        const campoPagado = camposPagado[i];
        const campoFecha = camposFecha[i];
        const campoImporte = camposImporte[i];
        
        // Limpiar campos de cuotas que ya no existen
        payloadFusionado[campoPagado] = null;
        payloadFusionado[campoFecha] = null;
        payloadFusionado[campoImporte] = null;
        
      }
      
      return payloadFusionado;
    },

    // Método para verificar si se perderían datos al cambiar modalidad
    async verificarPerdidaDatos() {
      if (!this.cambioModalidadPago()) return { sePierdenDatos: false };
      
      const cuotasPagadas = this.contarCuotasPagadas();
      const nuevasCuotas = this.obtenerNumeroCuotasNuevaModalidad();
      const cuotasActuales = this.obtenerNumeroCuotasActual();
      
      // Obtener información detallada de cuotas pagadas que se perderían
      const cuotasPagadasDetalle = this.obtenerCuotasPagadasDetalle();
      const cuotasQueSePerderan = cuotasPagadasDetalle.filter(cuota => cuota.numero > nuevasCuotas);
      
      // Si se reducen las cuotas y hay cuotas pagadas que se perderían
      if (nuevasCuotas < cuotasActuales && cuotasQueSePerderan.length > 0) {
        const importeTotal = cuotasQueSePerderan.reduce((total, cuota) => total + cuota.importe, 0);
        
        return {
          sePierdenDatos: true,
          cuotasActuales,
          nuevasCuotas,
          cuotasPagadas,
          cuotasQueSePerderan: cuotasQueSePerderan.length,
          importePerdido: importeTotal,
          detalleCuotasPerdidas: cuotasQueSePerderan
        };
      }
      
      return { 
        sePierdenDatos: false,
        cuotasActuales,
        nuevasCuotas,
        cuotasPagadas 
      };
    },

    // Método para obtener número de cuotas de la modalidad actual
    obtenerNumeroCuotasActual() {
      if (!this.pagosExistentes || !this.pagosExistentes.pagoPlazos) return 12;
      return this.pagosExistentes.pagoPlazos.numeroCuotas || 12;
    },

    // Método para verificar cambios de modalidad en tiempo real
    // Método para obtener información resumida de la modalidad actual
    obtenerInfoModalidadActual() {
      if (!this.pagosExistentes || !this.pagosExistentes.pagoPlazos) {
        return { cuotas: 0, nombre: 'No definida' };
      }
      
      const modalidad = this.modalidadesPago.find(m => m.id === this.pagosExistentes.pagoPlazos.id);
      return {
        cuotas: modalidad ? modalidad.numeroCuotas : 12,
        nombre: modalidad ? modalidad.nombre : 'Desconocida'
      };
    },

    // Método para obtener información de la nueva modalidad
    obtenerInfoNuevaModalidad() {
      if (!this.nuevoServicio.idPagoPlazos) {
        return { cuotas: 0, nombre: 'No seleccionada' };
      }
      
      const modalidad = this.modalidadesPago.find(m => m.id === this.nuevoServicio.idPagoPlazos);
      return {
        cuotas: modalidad ? modalidad.numeroCuotas : 12,
        nombre: modalidad ? modalidad.nombre : 'Desconocida'
      };
    },

    // Método auxiliar para obtener el número de cuotas desde los datos de pagos
    obtenerNumeroCuotasDesdePagos(pagos) {
      if (!pagos || !pagos.pagoPlazos) return 12; // Fallback por defecto
      return pagos.pagoPlazos.numeroCuotas || 12;
    },

    // Método para calcular el importe pagado desde los datos de pagos existentes
    calcularImportePagadoDesdePagos(pagos) {
      if (!pagos) return 0;
      
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      const camposImporte = [
        'primerPagoImporte', 'segundoPagoImporte', 'tercerPagoImporte', 'cuartoPagoImporte',
        'quintoPagoImporte', 'sextoPagoImporte', 'septimoPagoImporte', 'octavoPagoImporte',
        'novenoPagoImporte', 'decimoPagoImporte', 'decimoprimerPagoImporte', 'decimosegundoPagoImporte'
      ];
      
      let totalPagado = 0;
      const numeroCuotas = this.obtenerNumeroCuotasDesdePagos(pagos);
      
      // Solo contar hasta el número real de cuotas de la modalidad
      for (let i = 0; i < numeroCuotas && i < camposPagado.length; i++) {
        if (pagos[camposPagado[i]]) {
          totalPagado += parseFloat(pagos[camposImporte[i]]) || 0;
        }
      }
      
      // Redondear a 2 decimales
      return Math.round(totalPagado * 100) / 100;
    },

    // Método para validar cambios de modalidad en tiempo real (mejorado)
    async validarCambioModalidadTiempoReal() {
      if (!this.modoEdicion || !this.pagosExistentes || !this.nuevoServicio.idPagoPlazos) return;
      
      const modalidadActual = this.pagosExistentes.pagoPlazos?.id;
      const modalidadNueva = this.nuevoServicio.idPagoPlazos;
      
      // Solo validar si realmente cambió la modalidad
      if (modalidadActual === modalidadNueva) return;
      
      const infoActual = this.obtenerInfoModalidadActual();
      const infoNueva = this.obtenerInfoNuevaModalidad();
      const cuotasPagadas = this.contarCuotasPagadas();
      
      if (cuotasPagadas > 0) {
        
        if (infoNueva.cuotas < infoActual.cuotas && cuotasPagadas > infoNueva.cuotas) {
          const cuotasQueSePerderan = cuotasPagadas - infoNueva.cuotas;

          // Mostrar información en la interfaz (puedes usar esto para mostrar un warning en tiempo real)
          this.$emit('cambio-modalidad-warning', {
            modalidadActual: infoActual,
            modalidadNueva: infoNueva,
            cuotasPagadas,
            cuotasQueSePerderan
          });
        } else if (infoNueva.cuotas > infoActual.cuotas) {
          // No hacer nada
        } else {
          // No hacer nada
        }
      }
    },

    /** Importe menos descuento, con dos decimales, para el resumen del formulario. */
    calcularImporteFinal() {
      const imp = parseFloat(this.nuevoServicio.importe) || 0;
      const desc = parseFloat(this.nuevoServicio.descuento) || 0;
      return (imp - desc).toFixed(2);
    },

    // Un importe final de 0 por un descuento de todo el importe es un 0 de verdad. Con
    // «importeFinal || importe» ese 0 se tomaba por vacío y el servicio se guardaba (y su
    // plan de cuotas se generaba) por el importe completo. En el resto de casos, como antes.
    // Reparte un importe en cuotas al céntimo: los céntimos que sobran van a la última,
    // así la suma es exactamente el importe (como hace el servidor al generar el plan)
    repartirEnCuotas(importe, cuotas) {
      if (!cuotas || cuotas <= 0) return [];
      const centimos = Math.round((Number(importe) || 0) * 100);
      const base = Math.trunc(centimos / cuotas);
      return Array.from({ length: cuotas }, (_, i) =>
        (i === cuotas - 1 ? centimos - base * (cuotas - 1) : base) / 100);
    },

    esDescuentoTotal(importe, descuento) {
      const imp = parseFloat(importe) || 0;
      const desc = parseFloat(descuento) || 0;
      return imp > 0 && desc >= imp;
    },

    descuentoTotalFormulario() {
      return this.esDescuentoTotal(this.nuevoServicio.importe, this.nuevoServicio.descuento);
    }
  },

  computed: {
    todosLosServiciosOrdenados() {
      const todosLosServicios = [...this.servicios, ...this.serviciosHistoricos];
      const serviciosUnicos = todosLosServicios.filter((servicio, index, array) => 
        array.findIndex(s => s.id === servicio.id) === index
      );
      return serviciosUnicos.sort((a, b) => {
        return new Date(b.fechaInicioServicio) - new Date(a.fechaInicioServicio);
      });
    },

    textoBotonGuardar() {
      if (this.modoEdicion) return 'Guardar cambios';
      if (this.modoRenovacion) return 'Guardar y Renovar';
      return 'Guardar servicio';
    },

    tituloModal() {
      if (!this.mostrandoFormulario) return 'Gestión de servicios';
      if (this.modoEdicion) return 'Modificar servicio';
      if (this.modoRenovacion) return 'Renovar servicio';
      return 'Nuevo servicio';
    },

    // Mismo criterio que contratos: primero el CIF del cliente y, si no hay, el DNI del autorizado.
    cifCliente() {
      return this.cliente?.cif?.trim() || this.cliente?.dniAutorizado?.trim() || '';
    },

    puntoSuministroData() {
      return this.puntoSuministroSeleccionado;
    },

    servicioActualCalculado() {
      if (!this.servicios || this.servicios.length === 0) {
        return null;
      }
      
      const servicioVigente = this.servicios.find(
        (servicio) => enVigorHoy(servicio.fechaInicioServicio, servicio.fechaFinServicio)
      );
      
      return servicioVigente || null;
    },

    tieneServicioVigente() {
      const servicio = this.servicioActualCalculado;
      return servicio && servicio.id;
    },

    servicioVigente() {
      return this.servicioActual || this.servicioActualCalculado;
    },

    cuotasPagadas() {
      return this.cuotas.filter(c => c.pagado).length;
    },

    totalPagado() {
      const total = this.cuotas.filter(c => c.pagado).reduce((acc, c) => acc + (parseFloat(c.importePago) || 0), 0);
      return Math.round(total * 100) / 100;
    },

    totalPagadoFormulario() {
      let importePagado = 0;
      // Un servicio nuevo o una renovación aún no tiene nada pagado (las cuotas cargadas
      // pueden ser las del servicio vigente)
      if (!this.modoEdicion) return 0;
      
      // Si estamos en modo edición y hay datos de pagos existentes, calcular desde ahí
      if (this.modoEdicion && this.pagosExistentes) {
        importePagado = this.calcularImportePagadoDesdePagos(this.pagosExistentes);
      }
      // Si hay cuotas cargadas, usar el método existente
      else if (this.cuotas && this.cuotas.length > 0) {
        importePagado = this.totalPagado;
      }
      
      // Redondear a 2 decimales
      return Math.round(importePagado * 100) / 100;
    }
  },

  watch: {
    visible: {
      immediate: true,
      async handler(newVal) {
        if (newVal) {
          this.cargandoDatos = false;
          this.mostrandoFormulario = false;
          this.errores = {};
          this.modoEdicion = false;
          this.modoRenovacion = false;
          
          // Cargar datos necesarios si no están disponibles
          this.$nextTick(async () => {
            try {
              
              // Cargar comercializadoras si no vienen como prop o están vacías
              if (!this.comercializadoras || !this.comercializadoras.length) {
                await this.cargarComercializadoras();
              }
              
              // Cargar otros datos si es necesario
              if (!this.modalidadesPago || !this.modalidadesPago.length) {
                await this.cargarModalidadesPago();
              }
              
            } catch (error) {
              console.error("Error al inicializar vista del modal:", error);
              this.cargandoDatos = false;
            }
          });
        } else {
          this.peticionEdicion += 1;
          this.cargandoDatos = false;
          this.mostrandoFormulario = false;
          this.modoEdicion = false;
          this.modoRenovacion = false;
          this.mostrarModalDetalleServicio = false;
          this.mostrarModalGestionPagos = false;
          this.pagosExistentes = null; // Limpiar datos de pagos existentes
        }
      }
    },

    'nuevoServicio.importe': function() {
      this.nuevoServicio.importeFinal = Number(this.calcularImporteFinal());
    },

    'nuevoServicio.descuento': function() {
      this.nuevoServicio.importeFinal = Number(this.calcularImporteFinal());
    },

    'nuevoServicio.idPagoPlazos': {
      handler: function(newVal, oldVal) {
        if (this.modoEdicion && newVal !== oldVal) {
          // Debounce para evitar múltiples validaciones
          clearTimeout(this.modalidadDebounceTimer);
          this.modalidadDebounceTimer = setTimeout(() => {
            this.validarCambioModalidadTiempoReal();
          }, 300);
        }
      },
      immediate: false
    },

    servicioActual: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.id) {
          this.cargarCuotas();
        } else {
          this.cuotas = [];
        }
      },
    },
  },

  async mounted() {
    this.cargandoDatos = false;
    
    // Obtener el nivel de acceso del usuario
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      this.nivelAcceso = usuario.nivelAcceso;
    }
    
    // Cargar datos básicos independientemente de si el modal está visible
    try {
      await Promise.all([
        this.cargarComercializadoras(),
        this.cargarModalidadesPago()
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales en ModalServicios:', error);
    }
  },
  
  beforeUnmount() {
    // Limpiar timers para evitar memory leaks
    if (this.modalidadDebounceTimer) {
      clearTimeout(this.modalidadDebounceTimer);
    }
  }
};
</script>

<style scoped src="./ModalServicios.css"></style>
