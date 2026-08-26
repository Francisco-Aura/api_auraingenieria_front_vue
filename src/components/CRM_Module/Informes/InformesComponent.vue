<template>
  <div class="informes-container fade-in">
    
    <!-- Panel de tipos de informes -->
    <div class="card info-panel">
      <div class="panel-header">
        <h2><i class="fas fa-chart-pie"></i> Informes Disponibles</h2>
      </div>
      <div class="panel-content">
        <div class="informe-opciones">
          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-pendientes-renovacion') }" @click="toggleInforme('contratos-pendientes-renovacion')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Pendientes de Renovación</h3>
              <p>Listado de contratos que están próximos a su fecha de vencimiento</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-pendientes-renovacion') }" :title="esInformeActivo('contratos-pendientes-renovacion') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
          
          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('puntos-suministro-sin-contrato') }" @click="toggleInforme('puntos-suministro-sin-contrato')">
            <div class="informe-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="informe-info">
              <h3>Puntos de Suministro sin Contrato</h3>
              <p>Puntos de suministro que no tienen contratos asociados actualmente</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('puntos-suministro-sin-contrato') }" :title="esInformeActivo('puntos-suministro-sin-contrato') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" :class="{ 'informe-card--activo': esInformeActivo('servicios-pendientes-pago') }" @click="toggleInforme('servicios-pendientes-pago')">
            <div class="informe-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Pendientes de Pago</h3>
              <p>Listado de servicios que están pendientes de pago</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('servicios-pendientes-pago') }" :title="esInformeActivo('servicios-pendientes-pago') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-vigentes') }" @click="toggleInforme('contratos-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Vigentes</h3>
              <p>Listado de todos los contratos que están actualmente vigentes</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-vigentes') }" :title="esInformeActivo('contratos-vigentes') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-historico') }" @click="toggleInforme('contratos-historico')">
            <div class="informe-icon">
              <i class="fas fa-history"></i>
            </div>
            <div class="informe-info">
              <h3>Histórico de Contratos</h3>
              <p>Histórico completo de contratos: vigentes, vencidos y renovados</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-historico') }" :title="esInformeActivo('contratos-historico') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" :class="{ 'informe-card--activo': esInformeActivo('servicios-vigentes') }" @click="toggleInforme('servicios-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Vigentes</h3>
              <p>Listado de servicios vigentes y pendientes de pago</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('servicios-vigentes') }" :title="esInformeActivo('servicios-vigentes') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contactos-clientes') }" @click="toggleInforme('contactos-clientes')">
            <div class="informe-icon">
              <i class="fas fa-address-book"></i>
            </div>
            <div class="informe-info">
              <h3>Contactos de Clientes</h3>
              <p>Directorio de teléfonos y correos de todos los clientes y sus contactos</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contactos-clientes') }" :title="esInformeActivo('contactos-clientes') ? 'Contraer informe' : 'Expandir informe'">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de datos (solo se muestra si se elige ver en pantalla) -->
    <div v-if="mostrarTabla && datosInforme.length > 0" class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-table"></i> {{ tituloInforme }}</h2>
        <div class="table-actions">
          <button class="btn btn-refresh" @click="actualizarInforme" title="Actualizar datos">
            <i class="fas fa-sync-alt"></i>
            <span>Actualizar</span>
          </button>
          <button class="btn btn-export btn-excel" @click="exportarExcel" title="Excel">
            <i class="fas fa-file-excel"></i> Excel
          </button>
          <button class="btn btn-collapse-tabla" @click="mostrarTabla = false" title="Contraer tabla">
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="columna in encabezados" :key="columna" class="sortable" :data-column="columna">
                <div class="column-header">
                  <div class="column-title" :class="{ 'column-title--sin-orden': columna === 'acciones' }" @click="columna !== 'acciones' && sortBy(columna)">
                    <span class="column-text">{{ formatearColumna(columna) }}</span>
                    <i v-if="columna !== 'acciones'" :class="getSortIcon(columna)"></i>
                  </div>
                  <div v-if="columna !== 'pagos' && columna !== 'acciones'" class="column-filter-container">
                    <input 
                      type="text" 
                      class="column-filter" 
                      v-model="columnFilters[columna]" 
                      @input="filterByColumn(columna, $event.target.value)"
                      placeholder="Filtrar..."
                      @click.stop
                    >
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="n in 8" :key="'skeleton-' + n" class="skeleton-row">
                <td v-for="columna in encabezados" :key="columna"><div class="skeleton-line skeleton-line--md"></div></td>
              </tr>
            </template>
            <tr v-for="(fila, index) in paginatedData" v-show="!loading" :key="index">
              <td v-for="columna in encabezados" :key="columna" :class="['table-cell', columna === 'acciones' ? 'table-cell-acciones' : '']" :data-column="columna">
                <template v-if="tipoSeleccionado === 'servicios-pendientes-pago' && columna === 'pagos'">
                  <div class="pagos-simple-display">
                    <button 
                      class="btn btn-sm btn-mark-paid btn-icono-desnudo"
                      @click="confirmarMarcoPagado(fila)"
                      :disabled="false"
                      title="Marcar siguiente pago como pagado"
                    >
                      <i class="fas fa-money-bill-wave icono-billete-verde"></i>
                    </button>
                  </div>
                </template>
                <template v-else-if="tipoSeleccionado === 'contratos-pendientes-renovacion' && columna === 'acciones'">
                  <div class="action-buttons-informe">
                    <button
                      class="btn-accion-informe btn-renovar"
                      @click="iniciarRenovacion(fila)"
                      title="Renovar contrato"
                      aria-label="Renovar contrato"
                    >
                      <i class="fas fa-sync-alt"></i>
                    </button>
                    <button
                      class="btn-accion-informe btn-comentario"
                      @click="abrirModalComentario(fila)"
                      :title="fila.comentarioRenovacion ? `Comentario: ${fila.comentarioRenovacion}` : 'Sin comentario'"
                      aria-label="Ver o editar comentario"
                    >
                      <i class="fas fa-comment-alt" :class="{ 'has-comment': fila.comentarioRenovacion }"></i>
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="cell-content" :title="mostrarValorCelda(fila, columna)">
                    <span
                      v-if="columna === 'estadoBaja'"
                      :class="fila[columna] === 'SI' ? 'badge badge-baja' : 'badge badge-activo'"
                    >{{ fila[columna] }}</span>
                    <template v-else-if="tipoSeleccionado === 'contactos-clientes' && columna === 'correo' && fila[columna] && fila[columna] !== '-'">
                      <div class="contacto-link-wrapper">
                        <span class="contacto-email-text">
                          <i class="fas fa-envelope"></i> {{ fila[columna] }}
                        </span>
                        <button class="btn-copy-cell" @click.stop="copiarAlPortapapeles(fila[columna])" title="Copiar correo">
                          <i class="fas fa-copy"></i>
                        </button>
                      </div>
                    </template>
                    <template v-else-if="tipoSeleccionado === 'contactos-clientes' && columna === 'telefono' && fila[columna] && fila[columna] !== '-'">
                      <div class="contacto-link-wrapper">
                        <span class="contacto-phone-text">
                          <i class="fas fa-phone"></i> {{ fila[columna] }}
                        </span>
                        <button class="btn-copy-cell" @click.stop="copiarAlPortapapeles(fila[columna])" title="Copiar teléfono">
                          <i class="fas fa-copy"></i>
                        </button>
                      </div>
                    </template>
                    <template v-else-if="columna === 'cups' && fila[columna] && fila[columna] !== '-'">
                      <div class="cups-informe-cell">
                        <span v-if="getTipoCups(fila)" class="tipo-cups-badge" :class="getTipoCups(fila) === 'Gas' ? 'is-gas' : 'is-luz'">
                          <i :class="getTipoCups(fila) === 'Gas' ? 'fas fa-fire' : 'fas fa-bolt'"></i>
                        </span>
                        <span class="cups-valor">{{ fila[columna] }}</span>
                      </div>
                    </template>
                    <template v-else>{{ mostrarValorCelda(fila, columna) }}</template>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pagination-controls">
          <div class="records-per-page">
            <label for="recordsPerPage">Registros por página:</label>
            <select v-model.number="recordsPerPageValue" @change="onRecordsPerPageChange" id="recordsPerPage" class="form-control">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
          <div class="pagination-info">
            Mostrando {{ (currentPage - 1) * recordsPerPage + 1 }} - {{ Math.min(currentPage * recordsPerPage, filteredData.length) }} de {{ filteredData.length }} registros
          </div>
          <div class="pagination-buttons">
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === 1"
              @click="currentPage = 1"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
            <button 
              class="btn btn-outline" 
              :disabled="currentPage === totalPages"
              @click="currentPage = totalPages"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Comentario de Renovación -->
  <div v-if="mostrarModalComentario" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="comentario-renovacion-title" @click.self="mostrarModalComentario = false">
    <div class="modal-comentario-renovacion">
      <div class="modal-header">
        <h3 id="comentario-renovacion-title"><i class="fas fa-comment-alt"></i> Comentario de Renovación</h3>
        <button class="close-button" @click="mostrarModalComentario = false"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <textarea
          v-model="comentarioRenovacionEditar"
          class="form-control textarea-comentario"
          rows="6"
          maxlength="10000"
          placeholder="Escriba el comentario de renovación..."
        ></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="mostrarModalComentario = false">Cancelar</button>
        <button class="btn btn-primary" @click="guardarComentarioRenovacion" :disabled="guardandoComentario">
          <i class="fas fa-save"></i> {{ guardandoComentario ? 'Guardando...' : 'Aceptar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';

export default {
  data() {
    return {
      loading: false,
      mostrarModal: false,
      mostrarTabla: false,
      nivelAcceso: null,            // Nivel de acceso del usuario
      datosInforme: [],
      encabezados: [],
      tipoSeleccionado: "",
      tituloInforme: "",
      columnFilters: {},
      sortKey: null,
      sortOrder: null,
      recordsPerPage: 10,
      recordsPerPageValue: 10,
      currentPage: 1,
      isSavingBulk: false,
      // Modal comentario renovación
      mostrarModalComentario: false,
      comentarioRenovacionEditar: '',
      contratoComentarioId: null,
      guardandoComentario: false,
      // Mapeo de etiquetas para encabezados en español
      etiquetasColumnas: {
        codigoContrato: 'Código Contrato',
        fechaInicio: 'Fecha Inicio',
        fechaFin: 'Fecha Fin',
        cliente: 'Cliente',
        cups: 'CUPS',
        contrato: 'Contrato',
        tarifaLuz: 'Tarifa Luz',
        tarifaGas: 'Tarifa Gas',
        tarifa: 'Tarifa',
        estado: 'Estado',
        comercializadoraActual: 'Com. Actual',
        consumoAnual: 'Consumo kWh',
        importeCuotaPendiente: 'Importe Cuota Pendiente',
        importeFinal: 'Importe Final',
        nombreCliente: 'Nombre Cliente',
        tipoContacto: 'Tipo Contacto',
        nombre: 'Nombre',
        cargo: 'Cargo',
        sector: 'Sector',
        telefono: 'Teléfono',
        correo: 'Correo',
        estadoBaja: 'De Baja',
        acciones: 'Acciones',
      }
    };
  },
  computed: {
    filteredData() {
      let result = [...this.datosInforme];

      // Aplicar filtros por columna
      Object.entries(this.columnFilters).forEach(([column, value]) => {
        if (value) {
          result = result.filter(item => 
            String(item[column] || '').toLowerCase().includes(value.toLowerCase())
          );
        }
      });

      // Aplicar ordenamiento
      if (this.sortKey && this.sortOrder) {
        result.sort((a, b) => {
          let aValue = a[this.sortKey] || '';
          let bValue = b[this.sortKey] || '';
          
          if (this.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }

      return result;
    },

    paginatedData() {
      const start = (this.currentPage - 1) * this.recordsPerPage;
      const end = start + this.recordsPerPage;
      return this.filteredData.slice(start, end);
    },

    totalPages() {
      return Math.ceil(this.filteredData.length / this.recordsPerPage);
    }
  },
  watch: {
    // Watcher para asegurar que currentPage se resetee cuando cambie el número de páginas
    totalPages(newVal) {
      if (this.currentPage > newVal && newVal > 0) {
        this.currentPage = newVal;
      }
    },
    // Resetear a la primera página solo cuando el usuario cambia un filtro u
    // ordenación, no cuando se refrescan los datos (actualizarInforme,
    // marcarSiguientePago, etc.) manteniendo así su página actual.
    columnFilters: {
      deep: true,
      handler() {
        this.currentPage = 1;
      }
    },
    sortKey() {
      this.currentPage = 1;
    },
    sortOrder() {
      this.currentPage = 1;
    }
  },
  methods: {
    // Método para manejar el cambio de registros por página
    onRecordsPerPageChange() {
      this.recordsPerPage = this.recordsPerPageValue;
      this.currentPage = 1; // Resetear a la primera página
    },

    // Método para confirmar antes de marcar como pagado
    async confirmarMarcoPagado(fila) {
      
      const siguientePago = fila.siguientePagoNumero;
      const fechaPago = fila.fechaSiguientePago;
      const importePago = fila.importeCuotaPendiente;
      
      
      if (!siguientePago) {
        Swal.fire({
          icon: 'info',
          title: 'Sin pagos pendientes',
          text: 'Este servicio no tiene pagos pendientes.',
          timer: 1500,
          showConfirmButton: false
        });
        return;
      }
      
      const result = await Swal.fire({
        title: '¿Marcar como pagado?',
        html: `
          <div class="swal-marcar-pagado-info">
            <p><strong>Cliente:</strong> ${fila.cliente}</p>
            <p><strong>Gestora:</strong> ${fila.gestora}</p>
            <p><strong>Pago #${siguientePago}:</strong> ${this.formatearImporte(importePago)}</p>
            <p><strong>Fecha de pago:</strong> ${this.formatearFecha(fechaPago)}</p>
          </div>
          <p class="swal-marcar-pagado-confirmacion">¿Está seguro que desea marcar este pago como pagado?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: '<i class="fas fa-money-bill-wave"></i> Sí, marcar como pagado',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        reverseButtons: true,
        customClass: {
          popup: 'swal-marcar-pagado',
          confirmButton: 'btn-confirm-payment',
          cancelButton: 'btn-cancel-payment'
        }
      });

      if (result.isConfirmed) {
        await this.marcarSiguientePago(fila);
      }
    },

    // Método para obtener el número de pagos realizados
    getPagosPagados(fila) {
      let pagados = 0;
      const numCuotas = fila.numeroCuotas || 12;
      for (let i = 1; i <= numCuotas; i++) {
        if (fila[`pago${i}_pagado`] === 1) {
          pagados++;
        }
      }
      return pagados;
    },

    // Método para marcar el siguiente pago como pagado
    async marcarSiguientePago(fila) {
      this.isSavingBulk = true;
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/informes/servicios-pendientes-pago/marcar-siguiente-pago/${fila.idServicio}`);
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'El pago ha sido marcado como pagado correctamente.',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Recargar el informe para mostrar los cambios
        await this.mostrarInforme(this.tipoSeleccionado);
      } catch (error) {
        console.error('Error al actualizar pago:', error);
        Swal.fire('Error', 'No se pudo actualizar el pago', 'error');
      } finally {
        this.isSavingBulk = false;
      }
    },

    // Método para formatear fechas
    formatearFecha(fecha) {
      if (!fecha) return '';
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    },

    // Método para mostrar el informe directamente en pantalla
    esInformeActivo(tipo) {
      return this.tipoSeleccionado === tipo && this.mostrarTabla;
    },

    toggleInforme(tipo) {
      if (this.tipoSeleccionado === tipo) {
        this.mostrarTabla = !this.mostrarTabla;
        return;
      }
      this.mostrarInforme(tipo);
    },

    async mostrarInforme(tipo) {
      // Si es el mismo informe que ya estaba visible (p.ej. un refresco tras
      // marcar un pago), no reseteamos la página ni el tamaño de página.
      const esMismoInforme = this.tipoSeleccionado === tipo && this.mostrarTabla;
      this.tipoSeleccionado = tipo;
      this.loading = true;
      try {
        let respuesta;
        if (tipo === 'contratos-pendientes-renovacion') {
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${tipo}`, {
            params: { nivelAcceso: usuario?.nivelAcceso },
            headers: { 'X-Aura-Usuario-Nombre': usuario?.nombre }
          });
        } else {
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${tipo}`);
        }
        this.procesarDatosParaTabla(respuesta.data);
        this.tituloInforme = this.formatearTitulo(tipo);
        this.mostrarTabla = true;
        if (!esMismoInforme) {
          // Resetear estado de paginación solo al cambiar a un informe distinto
          this.currentPage = 1;
          this.recordsPerPage = 10;
          this.recordsPerPageValue = 10;
        }
      } catch (error) {
        console.error("Error al obtener el informe", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el informe'
        });
      } finally {
        this.loading = false;
      }
    },

    // Método para actualizar el informe actual
    async actualizarInforme() {
      if (!this.tipoSeleccionado) return;
      this.loading = true;
      try {
        let respuesta;
        if (this.tipoSeleccionado === 'contratos-pendientes-renovacion') {
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${this.tipoSeleccionado}`, {
            params: { nivelAcceso: usuario?.nivelAcceso },
            headers: { 'X-Aura-Usuario-Nombre': usuario?.nombre }
          });
        } else {
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${this.tipoSeleccionado}`);
        }
        this.procesarDatosParaTabla(respuesta.data);
        // No reseteamos página ni tamaño de página: es un refresco del mismo
        // informe, el usuario debe permanecer donde estaba.
      } catch (error) {
        console.error("Error al actualizar el informe", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el informe'
        });
      } finally {
        this.loading = false;
      }
    },

    // Filtra los datos para la tabla en pantalla
    procesarDatosParaTabla(datos) {
      const columnasPermitidas = {
        "contratos-pendientes-renovacion": [
          "codigoContrato", // identificador
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", "cups",
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual", "consumoAnual",
          "acciones" // columna especial de acciones
        ],
        "puntos-suministro-sin-contrato": [
          "idPS", // identificador
          "cliente", "direccion", "codigoPostal", "poblacion", "provincia", "cupsLuz", "cupsGas"
        ],
        "servicios-pendientes-pago": [
          "idServicio", // identificador
          "cups", "cliente", "gestora", "importeCuotaPendiente", "fechaSiguientePago",
          "estadoPago", "numeroCuotas", "siguientePagoNumero", // Añadido para lógica de marcar como pagado
          "pagos" // Esta columna se renderizará de forma personalizada al final
        ],
        "contratos-vigentes": [
          "codigoContrato", // identificador
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", "cups",
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual", "consumoAnual"
        ],
        "contratos-historico": [
          "codigoContrato", // identificador
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", "cups",
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual", "consumoAnual", "estado"
        ],
        "servicios-vigentes": [
          "idServicio", // identificador
          "cliente", "servicio", "fechaInicioServicio", "fechaFinServicio", 
          "gestora", "producto", "comercializadora", "cups", "tarifa", "importeFinal",
          "estadoVencimiento", "estadoPago"
        ],
        "contactos-clientes": [
          "nombreCliente", "tipoContacto", "nombre", "cargo","sector", "telefono", "correo", "estadoBaja"
        ]
      };

      if (columnasPermitidas[this.tipoSeleccionado]) {
        this.datosInforme = datos.map(item => {
          const fila = {};
          columnasPermitidas[this.tipoSeleccionado].forEach(key => {
            if (key === 'cups') {
              // servicios-pendientes-pago y servicios-vigentes ya traen el CUPS consolidado
              // desde el backend (no exponen cupsLuz/cupsGas por separado)
              if (this.tipoSeleccionado === 'servicios-pendientes-pago' || this.tipoSeleccionado === 'servicios-vigentes') {
                fila[key] = item.cups || '';
              } else {
                // Para el resto de informes, calcular el valor consolidado desde cupsLuz/cupsGas
                fila[key] = this.obtenerCupsParaMostrar(item);
              }
            } else if (key === 'acciones') {
              // columna virtual, no copiar del item
              fila[key] = null;
            } else {
              fila[key] = item[key];
            }
          });
          // Preservar campos extra necesarios para acciones en contratos pendientes
          if (this.tipoSeleccionado === 'contratos-pendientes-renovacion') {
            fila.codigoContrato = item.codigoContrato;
            fila.idPuntoSuministro = item.idPuntoSuministro;
            fila.idCliente = item.idCliente;
            fila.comentarioRenovacion = (item.comentarioRenovacion || '').trim() || null;
          }
          if (this.tipoSeleccionado === 'servicios-pendientes-pago') {
            // Mapear los estados de pago solo hasta el número de cuotas real
            const numCuotas = item.numeroCuotas || 12;
            for (let i = 1; i <= numCuotas; i++) {
              const pagoStatus = item[`pago${i}Pagado`];
              fila[`pago${i}_pagado`] = (pagoStatus === 1 || pagoStatus === '1' || pagoStatus === true) ? 1 : 0;
            }
            // Preservar cupsLuz y cupsGas para determinación de tipo
            fila.cupsLuz = item.cupsLuz || null;
            fila.cupsGas = item.cupsGas || null;
          }
          return fila;
        });
        // Quita el identificador y numeroCuotas de los encabezados visibles
        this.encabezados = columnasPermitidas[this.tipoSeleccionado].filter(
          col => !["codigoContrato", "idPS", "idServicio", "numeroCuotas", "siguientePagoNumero", "cupsLuz", "cupsGas"].includes(col)
        );
      } else {
        this.datosInforme = datos;
        this.encabezados = Object.keys(datos[0] || {});
      }
    },


    // Formatea el título para mostrar
    formatearTitulo(texto) {
      return texto
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    // Formatea el nombre de la columna para mostrar
    formatearColumna(texto) {
      // Usar mapeo de etiquetas si existe
      if (this.etiquetasColumnas[texto]) {
        return this.etiquetasColumnas[texto];
      }
      
      // Casos especiales para ciertas columnas
      if (texto === 'pagos') {
        return 'Marcar como pagado';
      }
      if (texto === 'fechaSiguientePago') {
        return 'Fecha de pago';
      }
      if (texto === 'gestora') {
        return 'Gestora';
      }
      if (texto === 'cups') {
        return 'CUPS';
      }
      if (texto === 'importeCuotaPendiente') {
        return 'Importe cuota';
      }
      return texto
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    },

    // Formatear importe con euros
    formatearImporte(valor) {
      if (!valor && valor !== 0) return '';
      const numero = parseFloat(valor);
      if (isNaN(numero)) return valor;
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numero);
    },

    // Copiar texto al portapapeles
    copiarAlPortapapeles(texto) {
      const mostrarExito = () => {
        this.$swal.fire({
          icon: 'success',
          title: 'Copiado',
          text: `"${texto}" copiado al portapapeles`,
          timer: 1200,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto).then(mostrarExito).catch(() => {
          // Fallback para contextos no seguros
          const el = document.createElement('textarea');
          el.value = texto;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          document.body.appendChild(el);
          el.focus();
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
          mostrarExito();
        });
      } else {
        // Fallback para contextos no seguros (HTTP)
        const el = document.createElement('textarea');
        el.value = texto;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        mostrarExito();
      }
    },

    // Método auxiliar para mostrar valores en la tabla
    mostrarValorCelda(fila, columna) {
      if ((columna === 'importeCuotaPendiente' && this.tipoSeleccionado === 'servicios-pendientes-pago') ||
          (columna === 'importeFinal' && this.tipoSeleccionado === 'servicios-vigentes')) {
        return this.formatearImporte(fila[columna]);
      }
      if (columna === 'consumoAnual') {
        const valor = fila[columna];
        if (valor) {
          return `${valor} kWh`;
        }
        return '-';
      }
      if (columna === 'cups') {
        return fila[columna] || '-';
      }
      // En el informe de contactos, mostrar '-' en lugar de celda vacía
      if (this.tipoSeleccionado === 'contactos-clientes') {
        const valor = fila[columna];
        return (valor !== null && valor !== undefined && String(valor).trim() !== '') ? valor : '-';
      }
      return fila[columna] ?? '';
    },

    // Obtiene el CUPS consolidado para mostrar (luz o gas)
    obtenerCupsParaMostrar(item) {
      if (item.cupsLuz && item.cupsLuz.trim() !== '') {
        return item.cupsLuz;
      }
      if (item.cupsGas && item.cupsGas.trim() !== '') {
        return item.cupsGas;
      }
      return '';
    },

    // Obtiene el tipo de CUPS (Luz o Gas)
    getTipoCups(item) {
      if (item.cupsLuz && item.cupsLuz.trim() !== '') {
        return 'Luz';
      }
      if (item.cupsGas && item.cupsGas.trim() !== '') {
        return 'Gas';
      }
      return '';
    },

    // Métodos para ordenamiento y filtrado
    sortBy(key) {
      if (this.sortKey === key) {
        if (this.sortOrder === 'asc') {
          this.sortOrder = 'desc';
        } else if (this.sortOrder === 'desc') {
          this.sortKey = null;
          this.sortOrder = null;
        }
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },

    getSortIcon(key) {
      if (this.sortKey !== key) return 'fas fa-sort';
      if (!this.sortOrder) return 'fas fa-sort';
      return this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    },

    filterByColumn(column, value) {
      this.columnFilters[column] = value;
    },

    async exportarExcel() {
      try {
        // Validar que hay datos y encabezados disponibles
        if (!this.encabezados || this.encabezados.length === 0) {
          this.$swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay columnas para exportar. Por favor, carga un informe primero.'
          });
          return;
        }

        if (!this.filteredData || this.filteredData.length === 0) {
          this.$swal.fire({
            icon: 'warning',
            title: 'Sin datos',
            text: 'No hay datos para exportar a Excel.'
          });
          return;
        }

        // Usar los datos filtrados (incluyendo ordenamiento y filtros)
        const columnasImporte = new Set();
        const data = this.filteredData.map(item => {
          const rowData = {};
          // Mapear las columnas según los encabezados actuales
          (this.encabezados || []).forEach(columnaKey => {
            // Excluir columnas no exportables
            if (columnaKey === 'pagos' || columnaKey === 'acciones') {
              return;
            }
            
            const formattedColumnaName = this.formatearColumna(columnaKey);
            if ((columnaKey === 'importeCuotaPendiente' && this.tipoSeleccionado === 'servicios-pendientes-pago') ||
                (columnaKey === 'importeFinal' && this.tipoSeleccionado === 'servicios-vigentes')) {
              // Exportar como número real (no texto) para que Excel lo trate como celda numérica
              columnasImporte.add(formattedColumnaName);
              const numero = parseFloat(item[columnaKey]);
              rowData[formattedColumnaName] = isNaN(numero) ? null : numero;
            } else if (columnaKey === 'cups') {
              // Manejar CUPS: en servicios-pendientes-pago/servicios-vigentes ya viene resuelto como item.cups
              if (this.tipoSeleccionado === 'servicios-pendientes-pago' || this.tipoSeleccionado === 'servicios-vigentes') {
                rowData[formattedColumnaName] = item[columnaKey] || '';
              } else {
                const tipo = this.getTipoCups(item);
                const valor = item[columnaKey] || '';
                rowData[formattedColumnaName] = tipo ? `${tipo}: ${valor}` : valor;
              }
            } else {
              rowData[formattedColumnaName] = item[columnaKey] ?? '';
            }
          });
          return rowData;
        });

        // Crear un libro de trabajo y una hoja de cálculo
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(this.formatearTitulo(this.tipoSeleccionado));

        // Obtener las columnas de los datos
        const columnas = data.length > 0 ? Object.keys(data[0]) : [];
        
        // Configurar columnas con anchos dinámicos y etiquetas en español
        worksheet.columns = columnas.map(col => {
          let ancho = 20;  // Ancho por defecto
          
          // Ajustar ancho basado en el tipo de columna
          if (col.includes('Consumo') || col.includes('kWh')) {
            ancho = 16;
          } else if (col.includes('Código') || col.includes('CUPS')) {
            ancho = 18;
          } else if (col.includes('Importe') || col.includes('Precio')) {
            ancho = 16;
          } else if (col.includes('Fecha') || col.includes('Fin')) {
            ancho = 14;
          } else if (col.includes('Tarifa')) {
            ancho = 12;
          } else if (col.includes('Tipo') || col.includes('Comercial')) {
            ancho = 14;
          } else if (col.length > 20) {
            ancho = Math.min(25, col.length / 1.5);
          }
          
          const columna = {
            header: col,
            key: col,
            width: ancho
          };

          // Las columnas de importe se exportan como número con formato de moneda,
          // no como texto, para que Excel permita operar con ellas (sumar, ordenar...)
          if (columnasImporte.has(col)) {
            columna.style = { numFmt: '#,##0.00 "€"' };
          }

          return columna;
        });

        // Añadir datos
        worksheet.addRows(data);

        // Estilizar encabezados
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        worksheet.getRow(1).alignment = {
          vertical: 'center',
          horizontal: 'left',
          wrapText: true
        };
        
        // Configurar altura de encabezado
        worksheet.getRow(1).height = 30;
        
        // Aplicar estilos a todas las filas
        (worksheet.rows || []).forEach((row, index) => {
          if (index > 0) {
            row.alignment = {
              vertical: 'middle',
              horizontal: 'left',
              wrapText: false
            };
          }
        });

        // Generar buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.formatearTitulo(this.tipoSeleccionado)}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error("Error al exportar a Excel:", error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al exportar a Excel.'
        })
      }
    },
    // Iniciar flujo de renovación desde informes
    iniciarRenovacion(fila) {
      sessionStorage.setItem('pendingRenovacion', JSON.stringify({
        idPuntoSuministro: fila.idPuntoSuministro,
        idCliente: fila.idCliente,
        idContrato: fila.codigoContrato
      }));
      this.$router.push('/dashboard/puntos-suministro');
    },

    // Abrir modal de comentario de renovación
    abrirModalComentario(fila) {
      this.contratoComentarioId = fila.codigoContrato;
      this.comentarioRenovacionEditar = fila.comentarioRenovacion || '';
      this.mostrarModalComentario = true;
    },

    // Guardar comentario de renovación
    async guardarComentarioRenovacion() {
      if (this.contratoComentarioId == null) return;
      // Trim para evitar que espacios o saltos de línea cuenten como comentario
      const comentarioLimpio = (this.comentarioRenovacionEditar || '').trim();
      this.guardandoComentario = true;
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_URL}/contratos/${this.contratoComentarioId}/comentario-renovacion`,
          { comentarioRenovacion: comentarioLimpio || null }
        );
        this.mostrarModalComentario = false;
        // Actualizar el comentario en la tabla sin recargar todo
        const fila = this.datosInforme.find(f => f.codigoContrato === this.contratoComentarioId);
        if (fila) fila.comentarioRenovacion = comentarioLimpio || null;
        Swal.fire({
          icon: 'success',
          title: 'Comentario guardado',
          timer: 1200,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        console.error('Error al guardar comentario de renovación', error);
        Swal.fire('Error', 'No se pudo guardar el comentario', 'error');
      } finally {
        this.guardandoComentario = false;
      }
    },
  },
  mounted() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      this.nivelAcceso = usuario.nivelAcceso;
    }
  }
};
</script>

<style scoped src="./InformesComponent.css"></style>