<template>
  <div v-if="visible" class="modal-overlay">
    <!-- Loading spinner -->
    <Spinner :isLoading="cargando || cargandoDatos" />
    
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h1 class="modal-title">Gestión de Servicios</h1>
        <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido principal sin pestañas -->
      <div v-if="cargando || cargandoDatos" class="modal-loading">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>{{ cargando ? 'Cargando servicios...' : 'Cargando datos del servicio...' }}</p>
        </div>
      </div>
      
      <div v-else-if="!cargando && !cargandoDatos" class="main-content-container">
        <!-- Debug info (invisible pero ejecuta el computed) -->
        <span style="display: none;">{{ debugEstadoCarga }}</span>
        
        <!-- Vista principal: Histórico de servicios con formulario de edición/creación cuando sea necesario -->
        <div v-if="!mostrandoFormulario" class="main-content">
          <!-- Banner del cliente -->
          <div class="client-banner">
            <div class="client-info">
              <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'Desconocido' }}</h4>
              <span>DNI/CIF: {{ cliente?.dniAutorizado?.trim() || cliente?.cif?.trim() || 'No disponible' }}</span>
            </div>
          </div>

          <!-- Botones de acción principales -->
          <div class="action-buttons-main">
            <button @click="crearNuevoServicio" class="btn-modern btn-primary">
              <i class="fas fa-plus"></i> Crear Servicio
            </button>
            <button @click="modificarServicioActual" class="btn-modern btn-warning" v-if="tieneServicioVigente">
              <i class="fas fa-edit"></i> Modificar Actual
            </button>
            <button @click="renovarServicioActual" class="btn-modern btn-success" v-if="tieneServicioVigente">
              <i class="fas fa-sync-alt"></i> Renovar Actual
            </button>
          </div>

          <!-- Histórico de servicios -->
          <div class="contracts-history">
            <h3><i class="fas fa-history"></i> Histórico de Servicios</h3>
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
                        <span class="total-indicador">{{ servicio.pagos.importeFinal || servicio.pagos.importe || 0 }}€</span>
                      </div>
                      <div v-else class="sin-pagos-mini">
                        <span>--/--</span>
                      </div>
                    </td>
                    <td class="action-buttons">
                      <button @click="editarServicioGenerico(servicio)" class="btn-icon btn-edit" title="Editar servicio">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="renovarServicioGenerico(servicio)" class="btn-icon btn-renew" title="Renovar servicio">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button @click="verDetalleServicio(servicio)" class="btn-icon btn-view" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button @click="gestionarPagosServicio(servicio)" class="btn-icon btn-payment" title="Gestionar Pagos">
                        <i class="fas fa-euro-sign"></i>
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
          <!-- Banner del cliente -->
          <div class="client-banner">
            <div class="client-info">
              <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'Desconocido' }}</h4>
              <span>DNI/CIF: {{ cliente?.dniAutorizado?.trim() || cliente?.cif?.trim() || 'No disponible' }}</span>
            </div>
          </div>

          <form @submit.prevent="guardarServicio" class="modern-form">
            <div class="form-grid-modern">
              <!-- Sección de Información del Servicio -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-info-circle"></i>
                  <h3>Información del Servicio</h3>
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
                  <div class="select-container-modern">
                    <select
                      id="producto"
                      v-model="nuevoServicio.idProducto"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione un producto...</option>
                      <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                        {{ producto.nombre }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="gestora">Gestora <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select
                      id="gestora"
                      v-model="nuevoServicio.idGestora"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione una gestora...</option>
                      <option v-for="gestora in gestoras" :key="gestora.id" :value="gestora.id">
                        {{ gestora.nombre }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="comercializadora">Comercializadora <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select
                      id="comercializadora"
                      v-model="nuevoServicio.idComercializadora"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione una comercializadora...</option>
                      <option v-for="comercializadora in comercializadorasList" :key="comercializadora.id" :value="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Sección de Fechas -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas del Servicio</h3>
                </div>
                
                <div class="form-group-modern">
                  <label for="fechaInicioServicio">Fecha Inicio <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-play icon-prefix"></i>
                    <input
                      type="date"
                      id="fechaInicioServicio"
                      v-model="nuevoServicio.fechaInicioServicio"
                      class="form-control-modern"
                      required
                    />
                  </div>
                </div>

                <div class="form-group-modern">
                  <label for="fechaFinServicio">Fecha Fin <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-stop icon-prefix"></i>
                    <input
                      type="date"
                      id="fechaFinServicio"
                      v-model="nuevoServicio.fechaFinServicio"
                      class="form-control-modern"
                      required
                    />
                  </div>
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
                      placeholder="Descripción del servicio"
                    />
                  </div>
                </div>
              </div>

               <!-- Sección de Gestión de Pagos y Cuotas -->
               <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-euro-sign"></i>
                  <h3>Gestión de Pagos</h3>
                </div>

                <div class="form-group-modern">
                  <label for="modalidadPago">Modalidad de Pago <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select
                      id="modalidadPago"
                      v-model="nuevoServicio.idPagoPlazos"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione modalidad...</option>
                      <option v-for="plazo in modalidadesPago" :key="plazo.id" :value="plazo.id">
                        {{ plazo.nombre }}<span v-if="plazo.descripcion"> - {{ plazo.descripcion }}</span>
                      </option>
                    </select>
                  </div>
                </div>

                <div class="form-group-modern importe-euro-group">
                  <label>Importe Total</label>
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
                  <label>Importe Final</label>
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
                  <label>Importe Pagado</label>
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
                <button type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-save"></i> {{ textoBotonGuardar }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE SERVICIO - FUERA DEL MODAL PRINCIPAL -->
    <div v-if="mostrarModalDetalleServicio" class="modal-overlay detalle-contrato-modal">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header">
          <h2><i class="fas fa-clipboard-list"></i> Detalle del Servicio</h2>
          <button type="button" @click="cerrarModalDetalleServicio" class="close-button" aria-label="Cerrar">
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
                <span class="info-value">{{ cliente?.dniAutorizado?.trim() || cliente?.cif?.trim() || 'No disponible' }}</span>
              </div>
            </div>
            <div class="contrato-info">
              <h4><i class="fas fa-clipboard-list"></i> Información del Servicio</h4>
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
                <span class="info-value info-value-importe">{{ servicioDetalle.pagos.importe || 0 }}€</span>
              </div>
              <div class="info-row info-row-importe">
                <span class="info-label">Descuento:</span>
                <span class="info-value info-value-importe">{{ servicioDetalle.pagos.descuento || 0 }}€</span>
              </div>
              <div class="info-row info-row-importe">
                <span class="info-label">Importe Final:</span>
                <span class="info-value info-value-importe">{{ servicioDetalle.pagos.importeFinal || 0 }}€</span>
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
    <div v-if="mostrarModalGestionPagos" class="modal-overlay detalle-contrato-modal">
      <div class="modal-content detalle-contrato-content">
        <div class="modal-header">
          <h2><i class="fas fa-euro-sign"></i> Gestión de Pagos - Servicio #{{ servicioGestionPagos?.id }}</h2>
          <button type="button" @click="cerrarModalGestionPagos" class="close-button" aria-label="Cerrar">
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
                <span class="resumen-valor">{{ totalPagado.toFixed(2) }}€</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Importe final:</span>
                <span class="resumen-valor">{{ servicioGestionPagos?.pagos?.importeFinal || 0 }}€</span>
              </div>
            </div>
          </div>
          
          <!-- Grid de cuotas compacto -->
          <div v-if="cuotas.length" class="cuotas-grid-compact">
            <div v-for="cuota in cuotas" :key="cuota.id" class="cuota-card-compact" :class="{ 'pagada': cuota.pagado }">
              <div class="cuota-header-compact">
                <span class="cuota-numero-compact">Cuota {{ cuota.numeroPago }}</span>
                <div class="cuota-estado-compact" :class="{ 'pagado': cuota.pagado }">
                  <i :class="cuota.pagado ? 'fas fa-check-circle' : 'fas fa-clock'"></i>
                  {{ cuota.pagado ? 'Pagado' : 'Pendiente' }}
                </div>
              </div>
              <div class="cuota-contenido-compact">
                <div class="cuota-fila">
                  <div class="cuota-campo-compact">
                    <label>Fecha:</label>
                    <input type="date" v-model="cuota.fechaPago" @change="marcarEditado(cuota)" class="form-control-compact" />
                  </div>
                  <div class="cuota-campo-compact cuota-campo-importe">
                    <label>Importe:</label>
                    <div class="input-euro-compact">
                      <input type="number" v-model="cuota.importePago" min="0" step="0.01" @change="marcarEditado(cuota)" class="form-control-compact" />
                      <span class="euro-symbol">€</span>
                    </div>
                  </div>
                </div>
                <div class="cuota-acciones">
                  <label class="checkbox-label-compact">
                    <input type="checkbox" v-model="cuota.pagado" @change="marcarEditado(cuota)" />
                    <span>Pagado</span>
                  </label>
                  <button type="button" class="btn-guardar-compact" :disabled="!cuota.editado" @click="guardarCuota(cuota)" title="Guardar cambios">
                    <i class="fas fa-save"></i>
                  </button>
                </div>
              </div>
            </div>
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
import Spinner from "@/components/SpinnerComponent.vue";

export default {
  name: "ModalServicios",
  components: {
    Spinner
  },
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
      puntosSuministro: [],
      comercializadorasList: [],
      modalidadesPago: [],
      cuotas: [],
      pagosExistentes: null, // Para preservar los datos de pagos existentes
      modalidadDebounceTimer: null, // Timer para debounce de validaciones
    };
  },

  methods: {
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('es-ES');
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      
      try {
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          console.warn('Fecha inválida:', dateString);
          return '';
        }
        
        return date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return '';
      }
    },

    getGestoraNombre(id) {
      if (!id || id === '') return 'Sin Gestora';
      
      if (!this.gestoras || !this.gestoras.length) {
        console.warn("No se han cargado las gestoras aún");
        return 'Cargando...';
      }
      
      const gestora = this.gestoras.find(g => g.id == id);
      
      if (!gestora) {
        console.warn(`No se encontró la gestora con ID: ${id}`, this.gestoras);
        return 'Gestora Desconocida';
      }
      
      return gestora.nombre;
    },

    getProductoNombre(id) {
      if (!id || id === '') return 'Sin Producto';
      
      if (!this.productos || !this.productos.length) {
        console.warn("No se han cargado los productos aún");
        return 'Cargando...';
      }
      
      const producto = this.productos.find(p => p.id == id);
      
      if (!producto) {
        console.warn(`No se encontró el producto con ID: ${id}`, this.productos);
        return 'Producto Desconocido';
      }
      
      return producto.nombre;
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
    crearNuevoServicio() {
      this.mostrandoFormulario = true;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.servicioEditandoId = null;
      this.inicializarNuevoServicio();
    },

    async modificarServicioActual() {
      if (!this.servicioVigente) return;
      this.mostrandoFormulario = true;
      this.modoEdicion = true;
      this.modoRenovacion = false;
      this.servicioEditandoId = this.servicioVigente.id;
      
      // Cargar datos completos del servicio desde el backend
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/${this.servicioVigente.id}`);
        const servicioCompleto = response.data;
        
        this.nuevoServicio = { 
          idCliente: servicioCompleto.idCliente,
          idPuntoSuministro: servicioCompleto.idPuntoSuministro,
          cups: servicioCompleto.cups || this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "",
          fechaInicioServicio: this.formatDate(servicioCompleto.fechaInicioServicio),
          fechaFinServicio: this.formatDate(servicioCompleto.fechaFinServicio),
          descripcion: servicioCompleto.descripcion || "",
          idGestora: servicioCompleto.idGestora || 0,
          idProducto: servicioCompleto.idProducto || 0,
          idComercializadora: servicioCompleto.idComercializadora || 0,
          observaciones: servicioCompleto.observaciones || "",
          importe: servicioCompleto.importe || 0,
          descuento: servicioCompleto.descuento || 0,
          importeFinal: servicioCompleto.importeFinal || servicioCompleto.importe || 0,
          idPagoPlazos: servicioCompleto.idPagoPlazos || null // ¡CAMPO CRÍTICO INCLUIDO!
        };

      } catch (error) {
        console.error('Error al cargar datos completos del servicio:', error);
        // Fallback al método anterior si falla la carga
        this.nuevoServicio = { ...this.servicioVigente };
        
        // Asegurar que el campo CUPS esté siempre cargado
        if (!this.nuevoServicio.cups) {
          this.nuevoServicio.cups = this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "";
        }
      }
      
      this.cargarDatosPagosServicio(this.servicioVigente.id);
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
        fechaInicioServicio: this.formatDateForInput(this.servicioVigente.fechaInicioServicio) || '',
        fechaFinServicio: this.formatDateForInput(this.servicioVigente.fechaFinServicio) || '',
      };
      
      // Asegurar que el campo CUPS esté siempre cargado para renovación
      if (!this.nuevoServicio.cups) {
        this.nuevoServicio.cups = this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "";
      }
    },

    async editarServicioGenerico(servicio) {
      this.mostrandoFormulario = true;
      this.modoEdicion = true;
      this.modoRenovacion = false;
      this.servicioEditandoId = servicio.id;
      
      // Cargar datos completos del servicio desde el backend
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/${servicio.id}`);
        const servicioCompleto = response.data;
        
        this.nuevoServicio = {
          id: servicioCompleto.id,
          idCliente: servicioCompleto.idCliente || servicio.cliente?.id || this.cliente?.id,
          idPuntoSuministro: servicioCompleto.idPuntoSuministro || servicio.puntoSuministro?.id || this.puntoSuministroData?.id,
          cups: servicioCompleto.cups || this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "",
          fechaInicioServicio: this.formatDateForInput(servicioCompleto.fechaInicioServicio),
          fechaFinServicio: this.formatDateForInput(servicioCompleto.fechaFinServicio),
          descripcion: servicioCompleto.descripcion || "",
          idGestora: servicioCompleto.idGestora || 0,
          idProducto: servicioCompleto.idProducto || 0,
          idComercializadora: servicioCompleto.idComercializadora || 0,
          observaciones: servicioCompleto.observaciones || "",
          importe: servicioCompleto.importe || 0,
          descuento: servicioCompleto.descuento || 0,
          importeFinal: servicioCompleto.importeFinal || servicioCompleto.importe || 0,
          idPagoPlazos: servicioCompleto.idPagoPlazos || null // ¡CAMPO CRÍTICO INCLUIDO!
        };
        
      } catch (error) {
        console.error('Error al cargar datos completos del servicio:', error);
        // Fallback al método anterior si falla la carga
        this.nuevoServicio = JSON.parse(JSON.stringify(servicio));
        this.nuevoServicio.id = servicio.id;
        this.nuevoServicio.idCliente = servicio.idCliente || servicio.cliente?.id || this.cliente?.id;
        this.nuevoServicio.idPuntoSuministro = servicio.idPuntoSuministro || servicio.puntoSuministro?.id || this.puntoSuministroData?.id;
        
        // Asegurar que el campo CUPS esté siempre cargado
        if (!this.nuevoServicio.cups) {
          this.nuevoServicio.cups = this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "";
        }
        
        this.nuevoServicio.fechaInicioServicio = this.formatDateForInput(servicio.fechaInicioServicio);
        this.nuevoServicio.fechaFinServicio = this.formatDateForInput(servicio.fechaFinServicio);
      }
      
      this.cargarDatosPagosServicio(servicio.id);
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
        fechaInicioServicio: this.formatDateForInput(servicio.fechaInicioServicio) || '',
        fechaFinServicio: this.formatDateForInput(servicio.fechaFinServicio) || '',
      };
      
      // Asegurar que el campo CUPS esté siempre cargado para renovación
      if (!this.nuevoServicio.cups) {
        this.nuevoServicio.cups = this.puntoSuministroData?.cupsluz || this.puntoSuministroData?.cupsgas || "";
      }
      
    },

    cancelarFormulario() {
      this.mostrandoFormulario = false;
      this.modoEdicion = false;
      this.modoRenovacion = false;
      this.servicioEditandoId = null;
      this.cuotas = [];
      this.pagosExistentes = null; // Limpiar datos de pagos existentes
    },

    async guardarServicio() {
      try {
        
        if (!this.nuevoServicio.idPuntoSuministro) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Error de configuración',
            text: 'No se pudo determinar el punto de suministro. Verifique la configuración.',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        
        if (!this.nuevoServicio.fechaInicioServicio) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor, ingrese la fecha de inicio del servicio',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        
        // Validar importes no negativos
        if (this.nuevoServicio.importe < 0 || this.nuevoServicio.descuento < 0 || this.nuevoServicio.importeFinal < 0) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Importes inválidos',
            text: 'Los importes no pueden ser negativos',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        
        // Validar que el descuento no sea mayor que el importe
        if (this.nuevoServicio.descuento > this.nuevoServicio.importe) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Descuento inválido',
            text: 'El descuento no puede ser mayor que el importe total',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        
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
          importeFinal: this.nuevoServicio.importeFinal || this.nuevoServicio.importe || 0,
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
        let response;
        
        if (this.modoEdicion && this.servicioEditandoId) {
          response = await axios.put(
            `${process.env.VUE_APP_API_URL}/api/servicios/${this.servicioEditandoId}`,
            servicioPayload
          );
        } else {
          response = await axios.post(
            `${process.env.VUE_APP_API_URL}/api/servicios`,
            servicioPayload
          );
        }
        
        // Si hay datos de pagos, manejarlos según el modo
        if (this.nuevoServicio.idPagoPlazos && 
            (this.nuevoServicio.importe > 0 || this.nuevoServicio.importeFinal > 0)) {
          
          // Validar que tenemos un ID de servicio válido
          const servicioId = this.modoEdicion ? this.servicioEditandoId : response.data.id;
          if (!servicioId) {
            throw new Error('No se pudo obtener el ID del servicio para asociar los pagos');
          }

          if (this.modoEdicion) {
            // MODO EDICIÓN: Lógica inteligente para manejar cambios en pagos
            const pagosCambiaron = this.verificarCambiosEnPagos();
            const cambioModalidad = this.cambioModalidadPago();

            if (pagosCambiaron) {

              if (cambioModalidad && this.pagosExistentes) {
                // CAMBIO DE MODALIDAD: Verificar si se perderían datos
                const resultadoVerificacion = await this.verificarPerdidaDatos();
                
                if (resultadoVerificacion.sePierdenDatos) {
                  // Crear HTML detallado para el modal de confirmación
                  const cuotasHtml = resultadoVerificacion.detalleCuotasPerdidas.map(cuota => 
                    `<li>Cuota ${cuota.numero}: ${cuota.importe.toFixed(2)}€ ${cuota.fecha ? `(Pagada: ${cuota.fecha})` : ''}</li>`
                  ).join('');
                  
                  // Mostrar modal de confirmación con información detallada
                  const resultado = await this.$swal.fire({
                    title: '⚠️ Advertencia: Pérdida de Datos de Pagos',
                    html: `
                      <div style="text-align: left; padding: 20px; max-height: 400px; overflow-y: auto;">
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                          <h4 style="margin: 0 0 10px 0; color: #495057;">📊 Resumen del cambio:</h4>
                          <p style="margin: 5px 0;"><strong>Cuotas actuales:</strong> ${resultadoVerificacion.cuotasActuales}</p>
                          <p style="margin: 5px 0;"><strong>Nuevas cuotas:</strong> ${resultadoVerificacion.nuevasCuotas}</p>
                          <p style="margin: 5px 0;"><strong>Cuotas ya pagadas:</strong> ${resultadoVerificacion.cuotasPagadas}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 15px;">
                          <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Datos que se perderán:</h4>
                          <p style="margin: 5px 0; color: #856404;"><strong>${resultadoVerificacion.cuotasQueSePerderan} cuotas pagadas</strong></p>
                          <p style="margin: 5px 0; color: #856404;"><strong>Importe total: ${resultadoVerificacion.importePerdido.toFixed(2)}€</strong></p>
                          
                          <details style="margin-top: 10px;">
                            <summary style="cursor: pointer; font-weight: bold; color: #856404;">Ver detalle de cuotas que se perderán</summary>
                            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                              ${cuotasHtml}
                            </ul>
                          </details>
                        </div>
                        
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                          <p style="margin: 0; color: #721c24; font-weight: bold;">
                            ⚠️ Esta acción no se puede deshacer. Los datos de las cuotas pagadas que excedan el nuevo número de cuotas se eliminarán permanentemente.
                          </p>
                        </div>
                        
                        <p style="margin-top: 15px; font-weight: bold;">¿Estás seguro de que quieres continuar con este cambio?</p>
                      </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#e74c3c',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, continuar y perder datos',
                    cancelButtonText: 'Cancelar operación',
                    width: '600px'
                  });
                  
                  if (!resultado.isConfirmed) {
                    // Usuario canceló, restaurar modalidad anterior
                    this.nuevoServicio.idPagoPlazos = this.pagosExistentes.pagoPlazos?.id;
                    this.$swal.fire({
                      title: 'Operación cancelada', 
                      text: 'No se han realizado cambios en los pagos. Se mantiene la modalidad original.', 
                      icon: 'info',
                      confirmButtonColor: '#fcd700'
                    });
                    return; // Salir sin hacer cambios
                  }
                }
                
                let pagosGenerados;
                try {
                  const generarPlanResp = await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/generar-plan`, {
                    idPagoPlazos: this.nuevoServicio.idPagoPlazos,
                    importeTotal: this.nuevoServicio.importeFinal || this.nuevoServicio.importe,
                    fechaInicio: this.nuevoServicio.fechaInicioServicio
                  });
                  pagosGenerados = generarPlanResp.data;
                } catch (errorGenerarPlan) {
                  console.error("Error al generar el plan de pagos:", errorGenerarPlan);
                  throw new Error('No se pudo generar el nuevo plan de pagos');
                }

                // Fusionar cuotas existentes con el nuevo plan
                const pagosPayload = await this.fusionarCuotasConNuevoPlan(servicioId, pagosGenerados);
                
                await axios.put(
                  `${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${this.servicioEditandoId}`, 
                  pagosPayload
                );
              } else if (cambioModalidad && !this.pagosExistentes) {
                // CASO ESPECIAL: Servicio sin pagos previos pero ahora con modalidad de pago
                
                let pagosGenerados;
                try {
                  const generarPlanResp = await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/generar-plan`, {
                    idPagoPlazos: this.nuevoServicio.idPagoPlazos,
                    importeTotal: this.nuevoServicio.importeFinal || this.nuevoServicio.importe,
                    fechaInicio: this.nuevoServicio.fechaInicioServicio
                  });
                  pagosGenerados = generarPlanResp.data;
                } catch (errorGenerarPlan) {
                  console.error("Error al generar el plan de pagos:", errorGenerarPlan);
                  throw new Error('No se pudo generar el nuevo plan de pagos');
                }

                if (pagosGenerados) {
                  const pagosPayload = {
                    id: null, // Nuevo registro
                    pagoPlazos: {
                      id: Number(this.nuevoServicio.idPagoPlazos)
                    },
                    servicio: {
                      id: Number(servicioId)
                    },
                    importe: this.nuevoServicio.importe || pagosGenerados.importe || 0,
                    descuento: this.nuevoServicio.descuento || pagosGenerados.descuento || 0,
                    importeFinal: this.nuevoServicio.importeFinal || pagosGenerados.importeFinal || 0,
                    // Incluir todas las fechas e importes de las cuotas generadas
                    ...pagosGenerados
                  };

                  await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos`, pagosPayload);
                }
              } else {
                // SIN CAMBIO DE MODALIDAD: Solo actualizar importes preservando todo lo demás
                const pagosPayload = this.crearPayloadPagosPreservando(servicioId);
                
                await axios.put(
                  `${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${this.servicioEditandoId}`, 
                  pagosPayload
                );
              }
            } 
          } else {
            // MODO CREACIÓN: Generar nuevo plan de pagos
            let pagosGenerados;
            try {
              const generarPlanResp = await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/generar-plan`, {
                idPagoPlazos: this.nuevoServicio.idPagoPlazos,
                importeTotal: this.nuevoServicio.importeFinal || this.nuevoServicio.importe,
                fechaInicio: this.nuevoServicio.fechaInicioServicio
              });
              pagosGenerados = generarPlanResp.data;
            } catch (errorGenerarPlan) {
              console.error("Error al generar el plan de pagos:", errorGenerarPlan);
            }

            if (pagosGenerados && this.nuevoServicio.idPagoPlazos) {
              const pagosPayload = {
                id: null, // Nuevo registro
                pagoPlazos: {
                  id: Number(this.nuevoServicio.idPagoPlazos)
                },
                servicio: {
                  id: Number(servicioId)
                },
                importe: this.nuevoServicio.importe || pagosGenerados.importe || 0,
                descuento: this.nuevoServicio.descuento || pagosGenerados.descuento || 0,
                importeFinal: this.nuevoServicio.importeFinal || pagosGenerados.importeFinal || 0,
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

              await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos`, pagosPayload);
            }
          }
        }
        
        // Mostrar mensaje de éxito con información adicional si se preservaron pagos
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
          confirmButtonColor: 'rgba(252, 215, 0)',
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
        console.error("Detalles del error:", error.response?.data);
        this.$swal.fire({
          title: 'Error',
          text: `No se pudo ${this.modoEdicion ? 'actualizar' : (this.modoRenovacion ? 'renovar' : 'crear')} el servicio. Por favor, verifica los datos e inténtalo de nuevo.`,
          icon: 'error',
          confirmButtonColor: 'rgba(252, 215, 0)',
          confirmButtonText: 'Aceptar'
        });
      }
    },

    esServicioVigente(servicio) {
      const ahora = new Date();
      const fechaFin = new Date(servicio.fechaFinServicio);
      const fechaInicio = new Date(servicio.fechaInicioServicio);
      return fechaInicio <= ahora && fechaFin > ahora;
    },

    // Verificar si un servicio tiene cuotas pendientes de pago
    tieneCuotasPendientes(servicio) {
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
      const ahora = new Date();
      const fechaFin = new Date(servicio.fechaFinServicio);
      const fechaInicio = new Date(servicio.fechaInicioServicio);
      
      // Si está dentro del período de vigencia
      if (fechaInicio <= ahora && fechaFin > ahora) {
        return 'VIGENTE';
      }
      
      // Si ya pasó la fecha de fin pero tiene cuotas pendientes
      if (fechaFin <= ahora && this.tieneCuotasPendientes(servicio)) {
        return 'PENDIENTE';
      }
      
      // En cualquier otro caso es histórico
      return 'HISTÓRICO';
    },

    verDetalleServicio(servicio) {
      this.servicioDetalle = servicio;
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
          confirmButtonColor: '#d33'
        });
        return;
      }
      
      console.log(`🎯 Iniciando gestión de pagos para servicio:`, servicio.id);
      
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
          confirmButtonColor: '#d33'
        });
        // Si falla, cerrar el modal
        this.cerrarModalGestionPagos();
      }
    },

    inicializarNuevoServicio() {
      // Obtener el CUPS del punto de suministro
      const cupsValue = this.puntoSuministroData?.cupsluz || 
                       this.puntoSuministroData?.cupsgas || 
                       this.puntoSuministroActivo?.cupsluz || 
                       this.puntoSuministroActivo?.cupsgas || "";
      
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

    cerrarModalGestionPagos() {
      console.log('🔒 Cerrando modal de gestión de pagos');
      
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

    async cargarComercializadoras() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/comercializadoras`);
        this.comercializadorasList = response.data;
      } catch (error) {
        console.error('Error al cargar comercializadoras:', error);
        this.comercializadorasList = [];
      }
    },

    async cargarPuntosSuministro() {
      try {
        const clienteId = typeof this.cliente === 'object' ? this.cliente.id : this.cliente;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${clienteId}`);
        this.puntosSuministro = response.data;
      } catch (error) {
        console.error('Error al cargar puntos de suministro:', error);
      }
    },

    async cargarModalidadesPago() {
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/api/pagos-plazos`);
        this.modalidadesPago = resp.data;
      } catch (e) {
        console.error('Error al cargar modalidades de pago:', e);
        this.modalidadesPago = [];
      }
    },

    async cargarCuotas() {
      if (!this.servicioActual || !this.servicioActual.id) return;
      
      // Reutilizar el método mejorado de cargar cuotas
      await this.cargarCuotasParaGestion(this.servicioActual.id);
    },

    async cargarCuotasParaGestion(servicioId) {
      try {
        // Verificar que el servicioId es válido
        if (!servicioId) {
          console.warn('Se intentó cargar cuotas sin servicioId válido');
          this.cuotas = [];
          return;
        }
        
        console.log(`🔄 Cargando cuotas para servicio: ${servicioId}`);
        
        // Intentar cargar desde el endpoint de cuotas primero
        try {
          const resp = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioId}/cuotas`);
          this.cuotas = resp.data.map(c => ({ ...c, editado: false }));
          console.log(`✅ Cuotas cargadas correctamente desde endpoint de cuotas para servicio ${servicioId}:`, this.cuotas.length);
          return;
        } catch (cuotasError) {
          console.log('Endpoint de cuotas no disponible, intentando con datos de pagos');
        }
        
        // Si no hay endpoint de cuotas, cargar desde servicios-pagos y convertir
        const respPagos = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioId}`);
        const pagos = respPagos.data;
        
        // Verificar que los datos de pagos corresponden al servicio correcto
        if (pagos && pagos.servicio?.id !== servicioId) {
          console.error(`⚠️ Error de sincronización: Se solicitó servicio ${servicioId} pero se recibió servicio ${pagos.servicio?.id}`);
          this.cuotas = [];
          return;
        }
        
        if (pagos) {
          console.log(`📊 Procesando datos de pagos para servicio ${servicioId}`);
          
          // Convertir los datos de pagos a formato de cuotas
          this.cuotas = [];
          
          // Obtener el número real de cuotas de la modalidad actual
          const numeroCuotasReales = this.obtenerNumeroCuotasDesdePagos(pagos);
          console.log(`🔢 Número de cuotas de la modalidad: ${numeroCuotasReales}`);
          
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
          
          console.log(`✅ Se procesaron ${this.cuotas.length} cuotas para servicio ${servicioId}`);
        } else {
          console.log(`❌ No se encontraron datos de pagos para servicio ${servicioId}`);
          this.cuotas = [];
        }
      } catch (e) {
        console.error(`❌ Error al cargar cuotas para gestión del servicio ${servicioId}:`, e);
        this.cuotas = [];
      }
    },

    marcarEditado(cuota) {
      cuota.editado = true;
    },

    async guardarCuota(cuota) {
      try {
        // Guardar el ID del servicio actual para evitar confusiones
        const servicioIdActual = this.servicioGestionPagos?.id;
        
        if (!servicioIdActual) {
          throw new Error('No se pudo identificar el servicio actual');
        }
        
        // Intentar actualizar la cuota individual primero
        try {
          await axios.put(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/cuota/${cuota.id}`, cuota);
          cuota.editado = false;
          this.$swal.fire({ icon: 'success', title: 'Cuota actualizada', timer: 1200, showConfirmButton: false });
          
          // Recargar cuotas del servicio específico (usando el ID guardado)
          await this.cargarCuotasParaGestion(servicioIdActual);
          
          // NO emitir recargar-servicios aquí para evitar desincronización del modal
          // El refresco se hará cuando se cierre el modal de gestión de pagos
          return;
        } catch (cuotaError) {
          console.log('Endpoint de cuota individual no disponible, actualizando datos de pagos completos');
        }
        
        // Si no funciona el endpoint individual, actualizar todo el objeto de pagos
        if (cuota.fechaField && cuota.importeField && cuota.pagadoField) {
          // Usar el servicioId de la cuota para mayor seguridad
          const servicioIdParaActualizar = cuota.servicioId || servicioIdActual;
          
          // Cargar los datos de pagos actuales del servicio específico
          const respPagos = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioIdParaActualizar}`);
          const pagosActuales = respPagos.data;
          
          // Verificar que estamos actualizando el servicio correcto
          if (pagosActuales.servicio?.id !== servicioIdActual) {
            throw new Error(`Error de sincronización: Se esperaba servicio ${servicioIdActual} pero se cargó servicio ${pagosActuales.servicio?.id}`);
          }
          
          // Actualizar los campos específicos de esta cuota
          pagosActuales[cuota.fechaField] = cuota.fechaPago + 'T00:00:00.000Z'; // Convertir a formato ISO
          pagosActuales[cuota.importeField] = parseFloat(cuota.importePago);
          pagosActuales[cuota.pagadoField] = cuota.pagado;
          
          // Enviar la actualización completa
          await axios.put(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioIdParaActualizar}`, pagosActuales);
          
          cuota.editado = false;
          this.$swal.fire({ icon: 'success', title: 'Cuota actualizada', timer: 1200, showConfirmButton: false });
          
          // Recargar cuotas del servicio específico (usando el ID guardado)
          await this.cargarCuotasParaGestion(servicioIdActual);
          
          // NO emitir recargar-servicios aquí para evitar desincronización del modal
          // El refresco se hará cuando se cierre el modal de gestión de pagos
        } else {
          throw new Error('No se pudo determinar cómo actualizar la cuota');
        }
      } catch (e) {
        console.error('Error al guardar cuota:', e);
        this.$swal.fire({ 
          icon: 'error', 
          title: 'Error al guardar cuota', 
          text: e.response?.data?.message || e.message || 'Error desconocido'
        });
      }
    },

    async cargarDatosPagosServicio(servicioId) {
      if (!servicioId) return;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioId}`);
        const pagos = response.data;
        if (pagos) {
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
        
        // También cargar las cuotas si estamos en modo edición
        if (this.modoEdicion) {
          await this.cargarCuotas();
        }
      } catch (error) {
        console.error("Error al cargar datos de pagos del servicio:", error);
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
                 (this.nuevoServicio.importe > 0 || this.nuevoServicio.importeFinal > 0));
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

    // Método para contar cuotas pagadas en los datos existentes
    contarCuotasPagadas() {
      if (!this.pagosExistentes) return 0;
      
      const camposPagado = [
        'primerPagoPagado', 'segundoPagoPagado', 'tercerPagoPagado', 'cuartoPagoPagado',
        'quintoPagoPagado', 'sextoPagoPagado', 'septimoPagoPagado', 'octavoPagoPagado',
        'novenoPagoPagado', 'decimoPagoPagado', 'decimoprimerPagoPagado', 'decimosegundoPagoPagado'
      ];
      
      return camposPagado.filter(campo => this.pagosExistentes[campo]).length;
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
      const importeTotal = this.nuevoServicio.importeFinal || this.nuevoServicio.importe;
      
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
      
      // Recalcular importe para cuotas pendientes
      const importePendiente = importeTotal - importePagado;
      const importePorCuotaPendiente = cuotasPendientes > 0 ? importePendiente / cuotasPendientes : 0;
      
      // Actualizar importes de cuotas no pagadas
      for (let i = 0; i < numeroCuotas && i < camposPagado.length; i++) {
        if (!payload[camposPagado[i]]) {
          payload[camposImporte[i]] = Number(importePorCuotaPendiente.toFixed(2));
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

      // Recalcular importes solo para cuotas no pagadas
      const importePorCuotaNueva = numeroCuotasNueva > 0 ? 
        (this.nuevoServicio.importeFinal || this.nuevoServicio.importe) / numeroCuotasNueva : 0;

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
          // Mantener fecha del nuevo plan pero asegurar importe recalculado
          if (payloadFusionado[campoImporte] !== null && payloadFusionado[campoImporte] !== undefined) {
            payloadFusionado[campoImporte] = Number(importePorCuotaNueva.toFixed(2));
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
    verificarCambioModalidadEnTiempoReal() {
      if (!this.pagosExistentes || !this.nuevoServicio.idPagoPlazos) return;
      
      const infoActual = this.obtenerInfoModalidadActual();
      const infoNueva = this.obtenerInfoNuevaModalidad();
      
      if (infoActual.cuotas !== infoNueva.cuotas) {
        
        // Si hay cuotas pagadas, verificar si se perderían datos
        if (this.cambioModalidadPago()) {
          const cuotasPagadas = this.contarCuotasPagadas();
          if (cuotasPagadas > 0) {
            if (infoNueva.cuotas < infoActual.cuotas && cuotasPagadas > infoNueva.cuotas) {
              console.log(`ADVERTENCIA: Se perderán datos de ${cuotasPagadas - infoNueva.cuotas} cuotas pagadas`);
            }
          }
        }
      }
    },

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
          console.log(`Aumento de cuotas: se preservarán todas las ${cuotasPagadas} cuotas pagadas`);
        } else {
          console.log(`Reducción de cuotas sin pérdidas: se preservarán todas las ${cuotasPagadas} cuotas pagadas`);
        }
      }
    },

    // Método para mostrar información de ayuda sobre el cambio de modalidad
    mostrarAyudaCambioModalidad() {
      this.$swal.fire({
        title: '💡 Información sobre cambio de cuotas',
        html: `
          <div style="text-align: left; padding: 20px;">
            <h4>¿Qué sucede cuando cambias el número de cuotas?</h4>
            
            <div style="margin: 15px 0; padding: 15px; background: #e7f5e7; border-radius: 8px;">
              <h5 style="color: #28a745; margin-top: 0;">✅ Si aumentas las cuotas:</h5>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Se preservan todas las cuotas ya pagadas</li>
                <li>Se crean nuevas cuotas con importes recalculados</li>
                <li>No se pierde ningún dato</li>
              </ul>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 8px;">
              <h5 style="color: #856404; margin-top: 0;">⚠️ Si reduces las cuotas:</h5>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Se preservan las cuotas pagadas que quepan en el nuevo número</li>
                <li>Las cuotas pagadas que excedan el nuevo límite se eliminarán</li>
                <li>Te pediremos confirmación antes de eliminar datos</li>
              </ul>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background: #d1ecf1; border-radius: 8px;">
              <h5 style="color: #0c5460; margin-top: 0;">🔢 Recálculo de importes:</h5>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Las cuotas ya pagadas mantienen su importe original</li>
                <li>Las cuotas pendientes se recalculan con el nuevo importe total</li>
                <li>Se distribuye equitativamente entre las cuotas restantes</li>
              </ul>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#fcd700',
        confirmButtonText: 'Entendido',
        width: '600px'
      });
    },
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
      if (this.modoEdicion) return 'Guardar Cambios';
      if (this.modoRenovacion) return 'Guardar y Renovar';
      return 'Guardar Servicio';
    },

    puntoSuministroData() {
      return this.puntoSuministroSeleccionado;
    },

    puntoSuministroActivo() {
      return this.puntoSuministroData;
    },

    servicioActualCalculado() {
      if (!this.servicios || this.servicios.length === 0) {
        return null;
      }
      
      const ahora = new Date();
      const servicioVigente = this.servicios.find(
        (servicio) => {
          const fechaFin = new Date(servicio.fechaFinServicio);
          const fechaInicio = new Date(servicio.fechaInicioServicio);
          return fechaInicio <= ahora && fechaFin > ahora;
        }
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
    },

    calcularImporteFinal() {
      const imp = parseFloat(this.nuevoServicio.importe) || 0;
      const desc = parseFloat(this.nuevoServicio.descuento) || 0;
      return (imp - desc).toFixed(2);
    },

    debugEstadoCarga() {
      const info = {
        cargandoDatos: this.cargandoDatos,
        mostrandoFormulario: this.mostrandoFormulario,
        visible: this.visible,
        tieneServicios: this.servicios?.length || 0,
        tieneHistoricos: this.serviciosHistoricos?.length || 0,
        comercializadorasProp: this.comercializadoras?.length || 0,
        comercializadorasList: this.comercializadorasList?.length || 0,
        gestoras: this.gestoras?.length || 0,
        productos: this.productos?.length || 0
      };
      return info;
    }
  },

  watch: {
    visible: {
      immediate: true,
      async handler(newVal) {
        if (newVal) {
          this.cargandoDatos = false;
          this.mostrandoFormulario = false;
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
              
              if (!this.puntosSuministro || !this.puntosSuministro.length) {
                await this.cargarPuntosSuministro();
              }
              
            } catch (error) {
              console.error("Error al inicializar vista del modal:", error);
              this.cargandoDatos = false;
            }
          });
        } else {
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
      this.nuevoServicio.importeFinal = this.calcularImporteFinal;
    },

    'nuevoServicio.descuento': function() {
      this.nuevoServicio.importeFinal = this.calcularImporteFinal;
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
    
    // Cargar datos básicos independientemente de si el modal está visible
    try {
      await Promise.all([
        this.cargarComercializadoras(),
        this.cargarModalidadesPago(),
        this.cargarPuntosSuministro()
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

/* Histórico de servicios */
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

.status-pendiente {
  color: #28a745;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-pendiente i {
  color: #28a745;
  animation: pulseWarning 2s infinite;
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

@keyframes pulseWarning {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

/* Estados de servicio en la tabla */
.servicio-vigente {
  background-color: rgba(252, 215, 0, 0.1) !important;
  border-left: 4px solid rgba(252, 215, 0) !important;
}

.servicio-pendiente {
  background-color: rgba(40, 167, 69, 0.1) !important;
  border-left: 4px solid #28a745 !important;
}

/* Botones de acción en la tabla */
.action-buttons {
  display: flex;
  gap: 4px;
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

.btn-icon.btn-payment:hover {
  background: rgba(25, 135, 84, 0.1);
  border-color: #198754;
  color: #198754;
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

/* Pagos en la tabla */
.pagos-column {
  text-align: center;
}

.pagos-mini {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.pago-indicador {
  background: #e3f2fd;
  color: #1976d2;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 0.7rem;
  font-weight: 600;
}

.total-indicador {
  font-size: 0.8rem;
  font-weight: 700;
  color: #333;
}

.sin-pagos-mini {
  color: #6c757d;
  font-style: italic;
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
  padding: 0.8rem 1.3rem;
  border-bottom: 1px solid #e0e0e0;
  background: var(--primary-color);
  color: white;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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
  position: absolute;
  top: 0.6rem;
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

.client-info span {
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
  min-height: 42px;
  padding-top: 0.4rem;
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

.select-container-modern {
  position: relative;
  width: 100%;
}

/* Inputs con formato euro */
.input-euro-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.euro-inline {
  color: #888;
  font-size: 0.9rem;
  font-weight: 500;
}

.importe-euro-group {
  margin-bottom: 0.4rem;
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

.action-buttons {
  display: flex;
  gap: 0.6rem;
}

/* Estilos para cuotas compactas */
.cuotas-grid-compact {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.cuota-card-compact {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  overflow: hidden;
  transition: all 0.2s;
  min-height: 120px;
}

.cuota-card-compact:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.cuota-card-compact.pagada {
  border-color: #c6ebd9;
  background: #f0fff7;
}

.cuota-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.cuota-card-compact.pagada .cuota-header-compact {
  background: #d9f3e7;
}

.cuota-numero-compact {
  font-weight: 600;
  color: #495057;
  font-size: 0.8rem;
}

.cuota-estado-compact {
  font-size: 0.7rem;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
  background: #ffe9e9;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 3px;
}

.cuota-estado-compact.pagado {
  background: #d1f0d9;
  color: #198754;
}

.cuota-estado-compact i {
  font-size: 0.65rem;
}

.cuota-contenido-compact {
  padding: 6px 8px;
  overflow: hidden; /* Evita que el contenido se desborde */
}

.cuota-fila {
  display: flex;
  gap: 4px; /* Gap reducido para ahorrar espacio */
  margin-bottom: 6px;
  align-items: flex-end; /* Alinea los campos por la parte inferior */
}

.cuota-campo-compact {
  flex: 1;
}

/* Campo de importe más ancho que el de fecha */
.cuota-campo-importe {
  flex: 1.3 !important; /* 30% más ancho que el campo de fecha (más conservador) */
  min-width: 80px !important; /* Ancho mínimo reducido para que quepa mejor */
}

.cuota-campo-compact label {
  display: block;
  font-size: 0.7rem;
  margin-bottom: 2px;
  color: #6c757d;
  font-weight: 500;
}

.form-control-compact {
  width: 100%;
  padding: 3px 6px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  font-size: 0.75rem;
  height: 24px;
}

.input-euro-compact {
  display: flex;
  align-items: center;
}

.input-euro-compact input {
  flex: 1;
  min-width: 70px; /* Ancho mínimo reducido para que quepa mejor */
  padding: 3px 6px; /* Padding reducido para ahorrar espacio */
}

.euro-symbol {
  margin-left: 2px;
  color: #6c757d;
  font-size: 0.7rem;
}

.cuota-acciones {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.checkbox-label-compact {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #495057;
}

.checkbox-label-compact input[type="checkbox"] {
  width: 14px;
  height: 14px;
  margin: 0;
}

.btn-guardar-compact {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 3px;
  background: #fcd700;
  color: black;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-guardar-compact:hover:not(:disabled) {
  background: #ecc800;
  transform: scale(1.1);
}

.btn-guardar-compact:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Mantener estilos antiguos para compatibilidad */
.cuotas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.cuota-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  transition: all 0.2s;
}

.cuota-card:hover {
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}

.cuota-card.pagada {
  border-color: #c6ebd9;
  background: #f0fff7;
}

.cuota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.cuota-card.pagada .cuota-header {
  background: #d9f3e7;
}

.cuota-numero {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

.cuota-estado {
  font-size: 0.75rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  background: #ffe9e9;
  color: #dc3545;
}

.cuota-estado.pagado {
  background: #d1f0d9;
  color: #198754;
}

.cuota-contenido {
  padding: 10px;
}

.cuota-campo {
  margin-bottom: 8px;
}

.cuota-campo label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 3px;
  color: #6c757d;
}

.checkbox-field {
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}

.cuota-footer {
  padding: 8px;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.btn-guardar {
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: 4px;
  background: #fcd700;
  color: black;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.btn-guardar:hover:not(:disabled) {
  background: #ecc800;
}

.btn-guardar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Resumen de pagos compacto */
.pagos-progreso {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  align-items: center;
}

.pagos-resumen-compacto {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.resumen-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.resumen-label {
  color: #495057;
  font-weight: 600;
  font-size: 0.85rem;
}

.resumen-valor {
  color: #198754;
  font-weight: 700;
  font-size: 0.9rem;
}

.sin-cuotas {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  color: #6c757d;
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
  color: black;
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
  color: black;
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
  color: black;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detalle-contrato-section h4 i {
  color: var(--primary-color);
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
  min-width: 300px; /* Ancho mínimo para evitar entrecortado */
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
  flex: 1; /* Permite que se expanda */
  min-width: 120px; /* Ancho mínimo para importes largos */
  text-align: right; /* Alinea los números a la derecha */
  word-break: break-word; /* Evita que se entrecorte el texto */
}

.observaciones-content {
  background: #fff;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  color: black;
  line-height: 1.5;
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

/* Estilos para campo CUPS readonly */
.cups-readonly {
  background-color: #f8f9fa !important;
  border-color: #e9ecef !important;
  color: #495057 !important;
  cursor: not-allowed !important;
  font-weight: 600 !important;
}

/* Estilos para campo de importe pagado readonly */
.importe-pagado-readonly {
  background-color: #e8f5e8 !important;
  border-color: #c3e6c3 !important;
  color: #2d5a2d !important;
  cursor: not-allowed !important;
  font-weight: 600 !important;
}

.field-help {
  display: block;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  font-style: italic;
}

/* Estilos específicos para campos de importe */
.info-row-importe {
  min-width: 350px; /* Más ancho para campos de importe */
}

.info-value-importe {
  min-width: 150px; /* Ancho mínimo mayor para importes */
  font-family: 'Consolas', 'Monaco', monospace; /* Fuente monoespaciada para números */
  font-size: 1.1rem; /* Ligeramente más grande */
  color: #2c3e50; /* Color más definido */
}

/* Media queries para responsividad */
@media (max-width: 1200px) {
  .form-grid-modern {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cuotas-grid-compact {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .cuotas-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .detalle-contrato-content {
    width: 80%;
    max-width: 80%;
  }
}

@media (max-width: 768px) {
  .form-grid-modern {
    grid-template-columns: 1fr;
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
  
  .cuotas-grid-compact {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cuotas-grid {
    grid-template-columns: 1fr;
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
  
  .cuotas-grid-compact {
    grid-template-columns: 1fr;
  }
  
  .cuota-fila {
    flex-direction: column;
    gap: 4px;
  }
}
</style>