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
                  <div class="select-container-modern">
                    <select
                      id="cups"
                      v-model="nuevoServicio.cups"
                      class="form-select-modern"
                      required
                    >
                      <option value="">Seleccione un CUPS...</option>
                      <option v-for="punto in puntosSuministro" :key="punto.id" :value="punto.cups">
                        {{ punto.cups }} - {{ punto.direccion }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
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
                      <option value="">Seleccione...</option>
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
                      <option value="">Seleccione...</option>
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
                      <option value="">Seleccione...</option>
                      <option v-for="comercializadora in comercializadorasList" :key="comercializadora.id" :value="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                    <i class="fas fa-chevron-down select-icon"></i>
                  </div>
                </div>
              </div>

              <!-- Sección de Fechas y Pagos -->
              <div class="form-section-modern">
                <div class="section-header-modern">
                  <i class="fas fa-calendar-alt"></i>
                  <h3>Fechas y Pagos</h3>
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
                  <label for="fechaPago">Fecha Pago <span class="required">*</span></label>
                  <div class="input-with-icon-modern">
                    <i class="fas fa-money-bill-wave icon-prefix"></i>
                    <input
                      type="date"
                      id="fechaPago"
                      v-model="nuevoServicio.fechaPago"
                      class="form-control-modern"
                      required
                    />
                  </div>
                </div>

                <div class="form-group-modern">
                  <label>Meses Cobrados</label>
                  <div class="meses-cobrados-grid">
                    <div v-for="mes in 12" :key="mes" class="mes-checkbox">
                      <input
                        type="checkbox"
                        :id="'mes' + mes"
                        v-model="nuevoServicio.mesesCobrados"
                        :value="mes"
                      />
                      <label :for="'mes' + mes">Mes {{ mes }}</label>
                    </div>
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
                <div class="info-row">
                  <span class="info-label">Fecha Pago</span>
                  <span class="info-value"><i class="fas fa-money-bill-wave"></i> {{ formatDate(servicioActual.fechaPago) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Meses Cobrados</span>
                  <span class="info-value">
                    <div class="meses-cobrados-display">
                      <span v-for="mes in servicioActual.mesesCobrados" :key="mes" class="mes-cobrado">
                        Mes {{ mes }}
                      </span>
                    </div>
                  </span>
                </div>
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
  },
  data() {
    return {
      pestañaActiva: "actual",
      modoEdicion: false,
      servicioEditandoId: null,
      nuevoServicio: {
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
      },
      mostrarModalDetalleServicio: false,
      servicioDetalle: null,
      puntosSuministro: [],
      comercializadorasList: [],
    };
  },
  async created() {
    await this.cargarComercializadoras();
    if (this.cliente) {
      await this.cargarPuntosSuministro();
    }
  },
  computed: {
    serviciosHistoricosOrdenados() {
      if (!this.serviciosHistoricos) return [];
      return [...this.serviciosHistoricos].sort((a, b) => {
        return new Date(b.fechaInicioServicio) - new Date(a.fechaInicioServicio);
      });
    }
  },
  watch: {
    servicioActual: {
      handler(newValue) {
        if (this.modoEdicion && newValue) {
          this.nuevoServicio = {
            ...newValue,
            mesesCobrados: newValue.mesesCobrados || [],
            observaciones: newValue.observaciones || ""
          };
        }
      },
    },
    visible(newValue) {
      if (newValue) {
        if (!this.modoEdicion) {
          this.resetNuevoServicio();
          this.pestañaActiva = 'nuevo';
        } else {
          this.pestañaActiva = 'nuevo';
        }
      } else {
        this.resetModalState();
      }
    },
    cliente: {
      handler(newValue) {
        if (newValue) {
          this.cargarPuntosSuministro();
        }
      },
      immediate: true
    }
  },
  methods: {
    resetModalState() {
      this.pestañaActiva = 'actual';
      this.modoEdicion = false;
      this.servicioEditandoId = null;
      this.nuevoServicio = {
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
      };
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
      if (!this.comercializadoras) return 'No especificada';
      const comercializadora = this.comercializadoras.find(c => c.id === id);
      return comercializadora ? comercializadora.nombre : 'No especificada';
    },
    editarServicio() {
      this.pestañaActiva = 'nuevo';
      this.modoEdicion = true;
      this.servicioEditandoId = this.servicioActual.id;
      this.nuevoServicio = { 
        ...this.servicioActual, 
        mesesCobrados: this.servicioActual.mesesCobrados || [],
        observaciones: this.servicioActual.observaciones || "" 
      };
    },
    async guardarServicio() {
      try {
        const servicioPayload = {
          ...this.nuevoServicio,
          idCliente: typeof this.cliente === 'object' ? this.cliente.id : this.cliente,
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

        this.$emit("servicio-guardado", response.data);
        alert("Servicio guardado con éxito.");
        this.cerrarModal();
      } catch (error) {
        console.error("Error al guardar el servicio:", error);
        alert("Error al guardar el servicio. Por favor, verifica los datos e inténtalo de nuevo.");
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
      };
    },
  },
};
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

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
   height: calc(100% - 70px); 
}


.form-grid-modern {
  display: grid;
  grid-template-columns: repeat(2, 1fr); 
  gap: 18px;
  max-width: 100%;
  flex: 1; 
  overflow-y: auto; 
  padding-right: 10px; 
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

.modal-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; 
  margin-top: 20px; 
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
}

.meses-cobrados-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.mes-checkbox {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.mes-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.mes-checkbox label {
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;
}

.meses-cobrados-display {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mes-cobrado {
  background: rgba(252, 215, 0, 0.1);
  color: #856404;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  border: 1px solid rgba(252, 215, 0, 0.2);
}
</style>
