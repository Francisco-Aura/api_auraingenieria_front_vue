<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <!-- Encabezado del modal -->
      <div class="modal-header">
        <h1 class="modal-title">Gestión de Servicios</h1>
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
          v-if="servicioActual && servicioActual.id"
          type="button"
          class="tab-btn"
          :class="{ active: pestañaActiva === 'actual' }"
          @click="pestañaActiva = 'actual'"
        >
          <i class="fas fa-clipboard-list"></i>
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
        <!-- Crear/Editar servicio -->
        <div v-if="pestañaActiva === 'nuevo'" class="tab-content">
          <!-- Banner del cliente -->
          <div class="client-banner" v-if="cliente">
            <div class="client-info">
              <h4><i class="fas fa-user"></i> {{ cliente?.nombre || 'Desconocido' }}</h4>
              <span>DNI/CIF: {{ cliente?.dniAutorizado?.trim() || cliente?.cif?.trim() || 'No disponible' }}</span>
            </div>
          </div>

          <div v-if="puntoSuministroActivo" class="info-banner-punto">
            <i class="fas fa-info-circle"></i>
            Creando servicio para el punto de suministro:
            <b>{{ puntoSuministroActivo.cupsluz || puntoSuministroActivo.cupsgas }}</b>
          </div>

          <form @submit.prevent="guardarServicio" class="modern-form">
            <div class="form-grid-modern">
              <!-- Sección de Información del Servicio -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-info-circle"></i>
                  <h3>Información del Servicio</h3>
                </div>

                <div class="form-group-modern" v-if="!puntoSuministroActivo">
                  <label for="cups">CUPS <span class="required">*</span></label>
                  <div class="select-container-modern">
                    <select
                      id="cups"
                      v-model="nuevoServicio.idPuntoSuministro"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione un CUPS...</option>
                      <option v-for="punto in puntosSuministro" :key="punto.id" :value="punto.id">
                        {{ punto.cups }} - {{ punto.direccion }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
                <div class="form-group-modern" v-else>
                  <label for="cups">CUPS <span class="required">*</span></label>
                  <input
                    id="cups"
                    class="form-control-small"
                    :value="puntoSuministroActivo.cupsluz || puntoSuministroActivo.cupsgas"
                    disabled
                  />
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
                    <i class="fas fa-chevron-down select-icon"></i>
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
                    <i class="fas fa-chevron-down select-icon"></i>
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
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>

                <!-- Modalidad de pago -->
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
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>

              <!-- Sección de Fechas y Totales -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas y Totales</h3>
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

                <!-- Importe Total -->
                <div class="form-group-modern importe-euro-group">
                  <label>Importe Total</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.importe"
                      placeholder="0.00"
                      class="form-control-small"
                      step="0.01"
                      min="0"
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>

                <!-- Descuento -->
                <div class="form-group-modern importe-euro-group">
                  <label>Descuento</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.descuento"
                      placeholder="0.00"
                      class="form-control-small"
                      step="0.01"
                      min="0"
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>

                <!-- Importe Final -->
                <div class="form-group-modern importe-euro-group">
                  <label>Importe Final</label>
                  <div class="input-euro-inline">
                    <input
                      type="number"
                      v-model="nuevoServicio.importeFinal"
                      class="form-control-small"
                      step="0.01"
                      min="0"
                      readonly
                    />
                    <span class="euro-inline">€</span>
                  </div>
                </div>
              </div>

              <!-- Sección de Observaciones -->
              <div class="form-section-modern full-width">
                <div class="section-header-modern">
                  <i class="fas fa-sticky-note"></i>
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
                <button type="button" @click="cerrarModal" class="btn-modern btn-secondary">
                  <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" class="btn-modern btn-primary">
                  <i class="fas fa-save"></i> {{ modoEdicion ? 'Guardar Cambios' : 'Guardar Servicio' }}
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Visualizar servicio actual -->
        <div v-if="pestañaActiva === 'actual'" class="tab-content">
          <h3>Servicio Actual</h3>
          <div v-if="servicioActual" class="modern-contract-card">
            <div class="contract-header">
              <div class="contract-info">
                <h4>Servicio <span class="contract-number">#{{ servicioActual.id }}</span></h4>
                <p class="contract-dates">
                  <i class="fas fa-calendar-alt"></i> Vigente desde <b>{{ formatDate(servicioActual.fechaInicioServicio) }}</b> hasta <b>{{ formatDate(servicioActual.fechaFinServicio) }}</b>
                </p>
              </div>
              <div class="contract-actions">
                <button @click="editarServicio" class="btn btn-primary">
                  <i class="fas fa-edit"></i> Editar
                </button>
              </div>
            </div>
            <div class="modern-grid">
              <div class="modern-section">
                <div class="section-header">
                  <i class="fas fa-info-circle"></i>
                  <h5>Información General</h5>
                </div>
                <div class="info-row">
                  <span class="info-label">CUPS</span>
                  <span class="info-value"><i class="fas fa-barcode"></i> {{ servicioActual.cups }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Producto</span>
                  <span class="info-value"><i class="fas fa-box"></i> {{ getProductoNombre(servicioActual.idProducto) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Gestora</span>
                  <span class="info-value"><i class="fas fa-building"></i> {{ getGestoraNombre(servicioActual.idGestora) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Comercializadora</span>
                  <span class="info-value"><i class="fas fa-store"></i> {{ getComercializadoraNombre(servicioActual.idComercializadora) }}</span>
                </div>
              </div>
              <div class="modern-section">
                <div class="section-header">
                  <i class="fas fa-calendar-alt"></i>
                  <h5>Fechas y Pagos</h5>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha Inicio</span>
                  <span class="info-value"><i class="fas fa-play"></i> {{ formatDate(servicioActual.fechaInicioServicio) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Fecha Fin</span>
                  <span class="info-value"><i class="fas fa-stop"></i> {{ formatDate(servicioActual.fechaFinServicio) }}</span>
                </div>
              </div>
            </div>
            
            <!-- NUEVO DISEÑO COMPACTO DE GESTIÓN DE PAGOS -->
            <div class="modern-section" style="margin-top: 1rem;">
              <div class="section-header">
                <i class="fas fa-calendar-check"></i>
                <h5>Gestión de Pagos por Plazos/Meses</h5>
              </div>
              
              <!-- Gráfico de progreso de pagos -->
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
                </div>
              </div>
              
              <!-- Grid de cuotas en formato tarjeta -->
              <div v-if="cuotas.length" class="cuotas-grid">
                <div v-for="cuota in cuotas" :key="cuota.id" class="cuota-card" :class="{ 'pagada': cuota.pagado }">
                  <div class="cuota-header">
                    <span class="cuota-numero">Cuota {{ cuota.numeroPago }}</span>
                    <div class="cuota-estado" :class="{ 'pagado': cuota.pagado }">
                      {{ cuota.pagado ? 'Pagado' : 'Pendiente' }}
                    </div>
                  </div>
                  <div class="cuota-contenido">
                    <div class="cuota-campo">
                      <label>Fecha:</label>
                      <input type="date" v-model="cuota.fechaPago" @change="marcarEditado(cuota)" class="form-control-compact" />
                    </div>
                    <div class="cuota-campo">
                      <label>Importe:</label>
                      <div class="input-euro-compact">
                        <input type="number" v-model="cuota.importePago" min="0" step="0.01" @change="marcarEditado(cuota)" class="form-control-compact" />
                        <span class="euro-symbol">€</span>
                      </div>
                    </div>
                    <div class="cuota-campo checkbox-field">
                      <label class="checkbox-label">
                        <input type="checkbox" v-model="cuota.pagado" @change="marcarEditado(cuota)" />
                        Marcar como pagado
                      </label>
                    </div>
                  </div>
                  <div class="cuota-footer">
                    <button class="btn-guardar" :disabled="!cuota.editado" @click="guardarCuota(cuota)">
                      <i class="fas fa-save"></i> Guardar
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="sin-cuotas">
                <i class="fas fa-info-circle"></i> No hay cuotas generadas para este servicio.
              </div>
            </div>
            
            <div class="modern-notes" v-if="servicioActual.observaciones">
              <h5><i class="fas fa-sticky-note"></i> Observaciones</h5>
              <p>{{ servicioActual.observaciones }}</p>
            </div>
          </div>
          <div v-else class="no-contract">
            <i class="fas fa-clipboard-list"></i>
            <p>No hay servicio actual activo</p>
          </div>
        </div>

        <!-- Histórico de servicios -->
        <div v-if="pestañaActiva === 'historico'" class="tab-content">
          <h3>Histórico de Servicios</h3>
          <div v-if="serviciosHistoricosOrdenados.length" class="history-table-container">
            <table class="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>CUPS</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Fecha Pago</th>
                  <th>Producto</th>
                  <th>Gestora</th>
                  <th>Comercializadora</th>
                  <th>Pagos</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="servicio in serviciosHistoricosOrdenados" :key="servicio.id" class="history-row">
                  <td class="contract-number">#{{ servicio.id }}</td>
                  <td>{{ servicio.cups }}</td>
                  <td>{{ formatDate(servicio.fechaInicioServicio) }}</td>
                  <td>{{ formatDate(servicio.fechaFinServicio) }}</td>
                  <td>{{ formatDate(servicio.fechaPago) }}</td>
                  <td>{{ getProductoNombre(servicio.idProducto) }}</td>
                  <td>{{ getGestoraNombre(servicio.idGestora) }}</td>
                  <td>{{ getComercializadoraNombre(servicio.idComercializadora) }}</td>
                  <td class="pagos-column">
                    <div v-if="servicio.pagos" class="pagos-mini">
                      <span class="pago-indicador">{{ obtenerMesesPagados(servicio.pagos) }}/6 P</span>
                      <span class="total-indicador">{{ servicio.pagos.importeFinal || servicio.pagos.importe || 0 }}€</span>
                    </div>
                    <div v-else class="sin-pagos-mini">
                      <span>--/--</span>
                    </div>
                  </td>
                  <td class="observaciones-column">
                    <span v-if="servicio.observaciones" :title="servicio.observaciones" class="observaciones-texto">
                      {{ servicio.observaciones.length > 30 ? servicio.observaciones.substring(0, 30) + '...' : servicio.observaciones }}
                    </span>
                    <span v-else class="sin-observaciones">--</span>
                  </td>
                  <td class="action-buttons">
                    <button @click="verDetalleServicio(servicio)" class="btn-icon btn-view" title="Ver Detalle">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-history">
            <i class="fas fa-history"></i>
            <p>No hay servicios históricos disponibles</p>
          </div>
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
              <h4><i class="fas fa-file-alt"></i> Información del Servicio</h4>
              <div class="info-row">
                <span class="info-label">ID Servicio:</span>
                <span class="info-value">#{{ servicioDetalle?.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">{{ formatDate(servicioDetalle?.fecha) }}</span>
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
                  <span class="info-value"><i class="fas fa-file-alt"></i> {{ servicioDetalle?.descripcion }}</span>
                </div>
               <div class="info-row">
                <span class="info-label">Gestora:</span>
                <span class="info-value"><i class="fas fa-building"></i> {{ getGestoraNombre(servicioDetalle?.idGestora) }}</span>
              </div>
               <div class="info-row">
                <span class="info-label">Producto:</span>
                <span class="info-value"><i class="fas fa-box"></i> {{ getProductoNombre(servicioDetalle?.idProducto) }}</span>
              </div>
              <!-- Añadir aquí más detalles del servicio si es necesario -->
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
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ModalServicios",
  emits: ['cerrar-modal', 'servicio-guardado'],
  props: {
    visible: {
      type: Boolean,
      required: true,
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
        mesesCobrados: [],
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        observaciones: "",
      }),
    },
    serviciosHistoricos: {
      type: Array,
      default: () => [],
    },
    cliente: {
      type: [Object, Number],
      required: true
    },
    gestoras: {
      type: Array,
      default: () => [],
    },
    productos: {
      type: Array,
      default: () => [],
    },
    comercializadoras: {
      type: Array,
      default: () => [],
    },
    puntoSuministroSeleccionado: {
      type: [Object, Number],
      default: null
    },
  },
  data() {
    return {
      pestañaActiva: "actual",
      modoEdicion: false,
      servicioEditandoId: null,
      nuevoServicio: {
        id: "",
        idCliente: typeof this.cliente === 'object' ? this.cliente.id : this.cliente,
        idPuntoSuministro: this.puntoSuministroSeleccionado ? (typeof this.puntoSuministroSeleccionado === 'object' ? this.puntoSuministroSeleccionado.id : this.puntoSuministroSeleccionado) : "",
        cups: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        idPagoPlazos: null, // Cambiado de "" a null
        importe: 0, // Cambiado de null a 0
        descuento: 0, // Cambiado de null a 0
        importeFinal: 0, // Cambiado de null a 0
        observaciones: "",
      },
      mostrarModalDetalleServicio: false,
      servicioDetalle: null,
      puntosSuministro: [],
      comercializadorasList: [],
      modalidadesPago: [],
      cuotas: [],
    };
  },
  async created() {
    await this.cargarComercializadoras();
    await this.cargarModalidadesPago();
    if (this.cliente) {
      await this.cargarPuntosSuministro();
    }
  },
  async mounted() {
    if (this.servicioActual && this.servicioActual.id) {
      await this.cargarCuotas();
    }
  },
  computed: {
    serviciosHistoricosOrdenados() {
      if (!this.serviciosHistoricos) return [];
      return [...this.serviciosHistoricos].sort((a, b) => {
        return new Date(b.fechaInicioServicio) - new Date(a.fechaInicioServicio);
      });
    },
    cuotasPagadas() {
      return this.cuotas.filter(c => c.pagado).length;
    },
    totalPagado() {
      return this.cuotas.filter(c => c.pagado).reduce((acc, c) => acc + (parseFloat(c.importePago) || 0), 0);
    },
    calcularImporteFinal() {
      const imp = parseFloat(this.nuevoServicio.importe) || 0;
      const desc = parseFloat(this.nuevoServicio.descuento) || 0;
      return (imp - desc).toFixed(2);
    },
    puntoSuministroActivo() {
      if (!this.puntoSuministroSeleccionado) return null;
      if (typeof this.puntoSuministroSeleccionado === 'object') return this.puntoSuministroSeleccionado;
      // Buscar el objeto en puntosSuministro si solo se pasa el ID
      return this.puntosSuministro.find(p => p.id === this.puntoSuministroSeleccionado) || null;
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        if (this.servicioActual && this.servicioActual.id) {
          this.pestañaActiva = 'actual';
        } else {
          this.pestañaActiva = 'nuevo';
        }
        if (!this.modoEdicion) {
          this.resetNuevoServicio();
        }
        this.nuevoServicio.idCliente = typeof this.cliente === 'object' ? this.cliente.id : this.cliente;
        if (this.puntoSuministroSeleccionado) {
          this.nuevoServicio.idPuntoSuministro = typeof this.puntoSuministroSeleccionado === 'object' ? this.puntoSuministroSeleccionado.id : this.puntoSuministroSeleccionado;
        }
      } else {
        this.resetModalState();
      }
    },
    puntoSuministroSeleccionado: {
      handler(newVal) {
        if (newVal) {
          this.nuevoServicio.idPuntoSuministro = typeof newVal === 'object' ? newVal.id : newVal;
        }
      },
      immediate: true
    },
    cliente: {
      handler(newValue) {
        if (newValue) {
          this.cargarPuntosSuministro();
        }
      },
      immediate: true
    },
    servicioActual: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.id) {
          this.cargarCuotas();
        } else {
          this.cuotas = [];
        }
        // Si el servicio tiene modalidad de pago y pagos, recargar cuotas
        if (newVal && newVal.pagos && newVal.idPagoPlazos) {
          this.cargarCuotas();
        }
      },
    },
    'nuevoServicio.importe': function() {
      this.nuevoServicio.importeFinal = this.calcularImporteFinal;
    },
    'nuevoServicio.descuento': function() {
      this.nuevoServicio.importeFinal = this.calcularImporteFinal;
    },
  },
  methods: {
    resetModalState() {
      this.pestañaActiva = 'actual';
      this.modoEdicion = false;
      this.servicioEditandoId = null;
      this.resetNuevoServicio();
      this.mostrarModalDetalleServicio = false;
      this.servicioDetalle = null;
    },
    formatDate(date) {
      if (!date) return '';
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-ES');
    },
    getGestoraNombre(id) {
      if (!this.gestoras) return 'No especificada';
      const gestora = this.gestoras.find(g => g.id === id);
      return gestora ? gestora.nombre : 'No especificada';
    },
    getProductoNombre(id) {
      if (!this.productos) return 'No especificado';
      const producto = this.productos.find(p => p.id === id);
      return producto ? producto.nombre : 'No especificado';
    },
    getComercializadoraNombre(id) {
      if (!this.comercializadoras && !this.comercializadorasList) return 'No especificada';
      // Buscar en ambas listas por si acaso
      const lista = this.comercializadorasList && this.comercializadorasList.length ? this.comercializadorasList : this.comercializadoras;
      const comercializadora = lista.find(c => c.id === id || c.idComercializadora === id);
      return comercializadora ? comercializadora.nombre : 'No especificada';
    },
    editarServicio() {
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = true;
      this.servicioEditandoId = this.servicioActual.id;
      
      // Inicializar nuevoServicio con los datos básicos del servicio actual
      this.nuevoServicio = {
        ...this.servicioActual,
        observaciones: this.servicioActual.observaciones || "",
        // Los campos de pago se cargarán después de la llamada a la API
        idPagoPlazos: "",
        importe: 0,
        descuento: 0,
        importeFinal: 0,
      };
      
      // Cargar los datos de pagos asociados a este servicio
      this.cargarDatosPagosServicio(this.servicioEditandoId);
    },
    async guardarServicio() {
      try {
        if (!this.nuevoServicio.idPuntoSuministro) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor, seleccione un CUPS',
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
        if (!this.nuevoServicio.idPagoPlazos) {
          await this.$swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor, seleccione la modalidad de pago',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        // Validación extra: comprobar que la modalidad de pago existe en la lista
        const modalidadValida = this.modalidadesPago.find(m => m.id === this.nuevoServicio.idPagoPlazos);
        if (!modalidadValida) {
          await this.$swal.fire({
            icon: 'error',
            title: 'Modalidad de pago inválida',
            text: 'La modalidad de pago seleccionada no es válida. Actualice la página o contacte con soporte.',
            confirmButtonColor: '#d33'
          });
          return;
        }
        
        const puntoSeleccionado = this.puntosSuministro.find(p => p.id === this.nuevoServicio.idPuntoSuministro);
        
        // Create complete service payload with all necessary fields
        const servicioPayload = {
          id: this.modoEdicion ? this.servicioEditandoId : null,
          cups: puntoSeleccionado ? puntoSeleccionado.cups : this.nuevoServicio.cups,
          fechaInicioServicio: this.nuevoServicio.fechaInicioServicio,
          fechaFinServicio: this.nuevoServicio.fechaFinServicio,
          descripcion: this.nuevoServicio.descripcion,
          idGestora: this.nuevoServicio.idGestora || null,
          idProducto: this.nuevoServicio.idProducto || null,
          idComercializadora: this.nuevoServicio.idComercializadora || null,
          observaciones: this.nuevoServicio.observaciones || "",
          // DO NOT DELETE THESE IMPORTANT REFERENCE FIELDS
          puntoSuministro: {
            id: this.nuevoServicio.idPuntoSuministro
          },
          cliente: {
            id: typeof this.cliente === 'object' ? this.cliente.id : this.cliente
          }
        };

        // NUEVO: Generar plan de pagos desde el backend antes de guardar
        let pagosGenerados;
        try {
          const generarPlanResp = await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/generar-plan`, {
            idPagoPlazos: this.nuevoServicio.idPagoPlazos,
            importeTotal: this.nuevoServicio.importeFinal || this.nuevoServicio.importe,
            fechaInicio: this.nuevoServicio.fechaInicioServicio // Pasa la fecha de inicio del servicio como referencia
          });
          pagosGenerados = generarPlanResp.data;
        } catch (errorGenerarPlan) {
          console.error("Error al generar el plan de pagos en el backend:", errorGenerarPlan);
          await this.$swal.fire({
            icon: 'error',
            title: 'Error al generar plan de pagos',
            text: 'No se pudo generar el plan de pagos. Por favor, inténtelo de nuevo.',
            confirmButtonColor: '#d33'
          });
          return;
        }

        // Create payment payload using the generated payments from backend
        const pagosPayload = {
          id: this.servicioActual?.pagos?.id || null, // If editing and already has payment ID
          pagoPlazos: {
            id: this.nuevoServicio.idPagoPlazos
          },
          metodoPago: this.nuevoServicio.idMetodoPago ? { 
            id: this.nuevoServicio.idMetodoPago 
          } : null,
          importe: pagosGenerados.importe, // Use importe from generated payments
          descuento: pagosGenerados.descuento, // Use descuento from generated payments
          importeFinal: pagosGenerados.importeFinal, // Use importeFinal from generated payments
          // Include all payment installments from generated payments
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

        let response;
        if (this.modoEdicion && this.servicioEditandoId) {
          // Update existing service
          response = await axios.put(`${process.env.VUE_APP_API_URL}/api/servicios/${this.servicioEditandoId}`, servicioPayload);
          
          // Also update the payment record if it exists
          if (this.servicioActual?.pagos?.id) { // Use servicioActual.pagos.id to check if payment record exists
            pagosPayload.id = this.servicioActual.pagos.id;
            await axios.put(
              `${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${this.servicioEditandoId}`, 
              pagosPayload
            );
          } else {
            // Create payment record if it doesn't exist
            pagosPayload.servicio = { id: this.servicioEditandoId }; // Link to existing service
            await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos`, pagosPayload);
          }
        } else {
          // Create new service
          response = await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios`, servicioPayload);
          
          // Create associated payment record
          pagosPayload.servicio = { id: response.data.id };
          await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios-pagos`, pagosPayload);
        }
        
        this.$emit("servicio-guardado", response.data);
        await this.$swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: this.modoEdicion ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          showConfirmButton: false
        });
        this.cerrarModal();
      } catch (error) {
        console.error("Error al guardar el servicio:", error);
        let mensajeError = "Error al guardar el servicio. Por favor, verifica los datos e inténtalo de nuevo.";
        if (error.response && error.response.data && (error.response.data.mensaje || error.response.data.message)) {
          mensajeError = error.response.data.mensaje || error.response.data.message;
        }
        await this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensajeError,
          confirmButtonColor: '#d33'
        });
      }
    },
    verDetalleServicio(servicio) {
      this.servicioDetalle = servicio;
      this.mostrarModalDetalleServicio = true;
    },
    cerrarModal() {
      this.$emit("cerrar-modal");
      this.resetModalState();
    },
    cerrarModalDetalleServicio() {
      this.mostrarModalDetalleServicio = false;
      this.servicioDetalle = null;
    },
    async cargarComercializadoras() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/comercializadoras`);
        this.comercializadorasList = response.data;
      } catch (error) {
        console.error('Error al cargar comercializadoras:', error);
        alert('Error al cargar las comercializadoras');
      }
    },
    async cargarPuntosSuministro() {
      try {
        const clienteId = typeof this.cliente === 'object' ? this.cliente.id : this.cliente;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${clienteId}`);
        this.puntosSuministro = response.data;
      } catch (error) {
        console.error('Error al cargar puntos de suministro:', error);
        alert('Error al cargar los puntos de suministro del cliente');
      }
    },
    resetNuevoServicio() {
      this.nuevoServicio = {
        id: "",
        idCliente: typeof this.cliente === 'object' ? this.cliente.id : this.cliente,
        idPuntoSuministro: this.puntoSuministroSeleccionado ? (typeof this.puntoSuministroSeleccionado === 'object' ? this.puntoSuministroSeleccionado.id : this.puntoSuministroSeleccionado) : "",
        cups: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora: 0,
        idProducto: 0,
        idComercializadora: 0,
        idPagoPlazos: null, // Cambiado de "" a null
        importe: 0, // Cambiado de null a 0
        descuento: 0, // Cambiado de null a 0
        importeFinal: 0, // Cambiado de null a 0
        observaciones: "",
        pagos: this.inicializarPagosServicios()
      };
    },
    inicializarPagosServicios() {
      return {
        primerPagoFecha: null,
        primerPagoImporte: null,
        primerPagoPagado: false,
        segundoPagoFecha: null,
        segundoPagoImporte: null,
        segundoPagoPagado: false,
        tercerPagoFecha: null,
        tercerPagoImporte: null,
        tercerPagoPagado: false,
        cuartoPagoFecha: null,
        cuartoPagoImporte: null,
        cuartoPagoPagado: false,
        quintoPagoFecha: null,
        quintoPagoImporte: null,
        quintoPagoPagado: false,
        sextoPagoFecha: null,
        sextoPagoImporte: null,
        sextoPagoPagado: false,
        septimoPagoFecha: null,
        septimoPagoImporte: null,
        septimoPagoPagado: false,
        octavoPagoFecha: null,
        octavoPagoImporte: null,
        octavoPagoPagado: false,
        novenoPagoFecha: null,
        novenoPagoImporte: null,
        novenoPagoPagado: false,
        decimoPagoFecha: null,
        decimoPagoImporte: null,
        decimoPagoPagado: false,
        decimoprimerPagoFecha: null,
        decimoprimerPagoImporte: null,
        decimoprimerPagoPagado: false,
        decimosegundoPagoFecha: null,
        decimosegundoPagoImporte: null,
        decimosegundoPagoPagado: false,
        importe: null,
        descuento: null,
        importeFinal: null
      };
    },
    obtenerPagosPagados(pagos) {
      if (!pagos) return 0;
      let contador = 0;
      if (pagos.primerPagoPagado) contador++;
      if (pagos.segundoPagoPagado) contador++;
      if (pagos.tercerPagoPagado) contador++;
      if (pagos.cuartoPagoPagado) contador++;
      if (pagos.quintoPagoPagado) contador++;
      if (pagos.sextoPagoPagado) contador++;
      // Añadir las nuevas cuotas
      if (pagos.septimoPagoPagado) contador++;
      if (pagos.octavoPagoPagado) contador++;
      if (pagos.novenoPagoPagado) contador++;
      if (pagos.decimoPagoPagado) contador++;
      if (pagos.decimoprimerPagoPagado) contador++;
      if (pagos.decimosegundoPagoPagado) contador++;
      return contador;
    },
    obtenerMesesPagados(pagos) {
      if (!pagos) return 0;
      return this.obtenerPagosPagados(pagos);
    },
    obtenerMesesCobrados(pagos) {
      // En la nueva estructura no hay campo "cobrado", usamos pagado como referencia
      return this.obtenerPagosPagados(pagos);
    },
    async cargarCuotas() {
      if (!this.servicioActual || !this.servicioActual.id) return;
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${this.servicioActual.id}/cuotas`);
        this.cuotas = resp.data.map(c => ({ ...c, editado: false }));
      } catch (e) {
        this.cuotas = [];
      }
    },
    marcarEditado(cuota) {
      cuota.editado = true;
    },
    async guardarCuota(cuota) {
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/cuota/${cuota.id}`, cuota);
        cuota.editado = false;
        this.$swal.fire({ icon: 'success', title: 'Cuota actualizada', timer: 1200, showConfirmButton: false });
        // Recargar las cuotas para asegurar que la UI muestre el estado actualizado
        await this.cargarCuotas();
      } catch (e) {
        this.$swal.fire({ icon: 'error', title: 'Error al guardar cuota', text: e.message });
      }
    },
    async cargarModalidadesPago() {
      try {
        const resp = await axios.get(`${process.env.VUE_APP_API_URL}/api/pagos-plazos`);
        this.modalidadesPago = resp.data;
      } catch (e) {
        this.modalidadesPago = [];
      }
    },
    // NUEVO MÉTODO PARA CARGAR DATOS DE PAGOS DEL SERVICIO
    async cargarDatosPagosServicio(servicioId) {
      if (!servicioId) return;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios-pagos/servicio/${servicioId}`);
        const pagos = response.data;
        if (pagos) {
          this.nuevoServicio.idPagoPlazos = Number(pagos.pagoPlazos?.id) || null; // Asegurar que sea número o null
          this.nuevoServicio.importe = parseFloat(pagos.importe) || 0;
          this.nuevoServicio.descuento = parseFloat(pagos.descuento) || 0;
          this.nuevoServicio.importeFinal = parseFloat(pagos.importeFinal) || 0;
          
          // Forzar la actualización de la UI después de cargar los datos de forma asíncrona
          this.$nextTick(() => {
            this.$forceUpdate();
          });
        }
      } catch (error) {
        console.error("Error al cargar datos de pagos del servicio:", error);
        // Opcional: mostrar un mensaje de error al usuario
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los detalles de pago de este servicio.',
          confirmButtonColor: '#d33'
        });
      }
    }
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* Estilos para el nuevo formato de cuotas con tarjetas */
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

.form-control-compact {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.85rem;
  height: 30px;
}

.input-euro-compact {
  display: flex;
  align-items: center;
}

.input-euro-compact input {
  flex: 1;
}

.euro-symbol {
  margin-left: 4px;
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

/* Estilos para el resumen de pagos compacto */
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

/* Mantener los estilos existentes del archivo CSS que compartiste */
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
  width: 95%; 
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

.modern-form {
  display: flex;
  flex-direction: column;
  /* height: calc(100% - 70px); Eliminado para permitir que el formulario se ajuste dinámicamente */
}

.form-grid-modern {
  display: grid;
  grid-template-columns: repeat(2, 1fr); 
  gap: 15px;
  max-width: 100%;
  flex: 1; 
  overflow-y: auto; 
  padding-right: 10px; 
}

.form-section-modern {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 15px;
}

.form-section-modern.full-width {
  grid-column: 1 / -1; 
}

.section-header-modern {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header-modern i {
  font-size: 1rem;
}

.section-header-modern h3 {
  font-size: 0.95rem;
}

.form-group-modern {
  margin-bottom: 10px;
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

.form-control-modern,
.form-select-modern {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
  color: #333;
  background-color: #fff;
  height: 34px;
}

.form-control-modern:focus,
.form-select-modern:focus {
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

.btn-modern {
  padding: 10px 16px;
  font-size: 0.9rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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

.modal-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; 
  margin-top: 15px;
}

.required-legend {
  font-size: 0.9rem; 
  color: #777;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.modern-contract-card { 
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  padding: 2rem; 
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
  font-size: 1rem;
  margin-top: 0.2rem;
}

.contract-actions {
  display: flex;
  gap: 10px;
}

.modern-grid { 
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
  gap: 1.5rem; 
  margin-bottom: 1.2rem;
}

.modern-section {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 1.2rem 1.5rem; 
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
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  text-align: center;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #e9ecef;
}

.history-table td {
  padding: 0.5rem 0.5rem;
  border: 1px solid #e0e0e0;
  text-align: center;
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
  max-width: 90%; 
  width: 90%;
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

@media (max-width: 768px) {
  .form-grid-modern {
    grid-template-columns: 1fr; 
  }
  .form-row-modern {
    grid-template-columns: 1fr; 
    gap: 12px; 
  }
  .detalle-contrato-header {
    grid-template-columns: 1fr; 
    gap: 1rem;
  }
  .info-grid {
    grid-template-columns: 1fr; 
  }
  .detalle-contrato-content {
    width: 95vw;
    max-width: 95vw;
    margin: 10px;
  }
  .modal-content {
     width: 95vw;
     max-width: 95vw;
     margin: 10px;
  }
  .cuotas-grid {
    grid-template-columns: 1fr; /* Una columna en móviles */
  }
}

/* Estilos responsivos específicos para la sección de cuotas */
@media (max-width: 992px) {
  .cuotas-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Columnas más estrechas */
  }
}

/* Estilos para el banner de puntos de suministro */
.info-banner-punto {
  background: #fffbe6;
  color: #856404;
  border: 1px solid #ffe082;
  border-radius: 6px;
  padding: 8px 15px; 
  margin-bottom: 15px; 
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.info-banner-punto i {
  color: #fbc02d;
  font-size: 1.2rem;
}

/* Estilos para inputs con formato de euro */
.input-euro-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}
.euro-inline {
  color: #888;
  font-size: 1.1rem;
  font-weight: 500;
}

.form-control-small {
  padding: 5px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: border-color 0.15s ease-in-out;
  height: 30px;
}

.form-control-small:focus {
  outline: none;
  border-color: #fcd700;
  box-shadow: 0 0 0 0.2rem rgba(252, 215, 0, 0.25);
}

/* Animación para los elementos que cambian */
@keyframes highlight {
  0% { background-color: rgba(252, 215, 0, 0.2); }
  100% { background-color: transparent; }
}

.highlight {
  animation: highlight 1.5s ease;
}

/* Mejoras adicionales para la visualización de pagos */
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

</style>