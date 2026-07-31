<template>
  <div class="informes-container fade-in">
    <!-- Loading spinner -->
    <Spinner :isLoading="loading" />
    
    <!-- Panel de tipos de informes -->
    <div class="card info-panel">
      <div class="panel-header">
        <h2><i class="fas fa-chart-pie"></i> Informes Disponibles</h2>
      </div>
      <div class="panel-content">
        <div class="informe-opciones">
          <div class="card informe-card" @click="mostrarInforme('contratos-pendientes-renovacion')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Pendientes de Renovación</h3>
              <p>Listado de contratos que están próximos a su fecha de vencimiento</p>
            </div>
            <div class="informe-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>
          
          <div class="card informe-card" @click="mostrarInforme('puntos-suministro-sin-contrato')">
            <div class="informe-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="informe-info">
              <h3>Puntos de Suministro sin Contrato</h3>
              <p>Puntos de suministro que no tienen contratos asociados actualmente</p>
            </div>
            <div class="informe-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" @click="mostrarInforme('servicios-pendientes-pago')">
            <div class="informe-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Pendientes de Pago</h3>
              <p>Listado de servicios que están pendientes de pago</p>
            </div>
            <div class="informe-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" @click="mostrarInforme('contratos-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Vigentes</h3>
              <p>Listado de todos los contratos que están actualmente vigentes</p>
            </div>
            <div class="informe-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" @click="mostrarInforme('servicios-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Vigentes</h3>
              <p>Listado de servicios vigentes y pendientes de pago</p>
            </div>
            <div class="informe-action">
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div class="card informe-card" @click="mostrarInforme('contactos-clientes')">
            <div class="informe-icon">
              <i class="fas fa-address-book"></i>
            </div>
            <div class="informe-info">
              <h3>Contactos de Clientes</h3>
              <p>Directorio de teléfonos y correos de todos los clientes y sus contactos</p>
            </div>
            <div class="informe-action">
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
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="columna in encabezados" :key="columna" class="sortable" :data-column="columna">
                <div class="column-header">
                  <div class="column-title" @click="columna !== 'acciones' && sortBy(columna)" :style="columna === 'acciones' ? 'cursor:default' : ''">
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
            <tr v-for="(fila, index) in paginatedData" :key="index">
              <td v-for="columna in encabezados" :key="columna" class="table-cell" :data-column="columna">
                <template v-if="tipoSeleccionado === 'servicios-pendientes-pago' && columna === 'pagos'">
                  <div class="pagos-simple-display">
                    <button 
                      class="btn btn-sm btn-mark-paid"
                      @click="confirmarMarcoPagado(fila)"
                      :disabled="false"
                      title="Marcar siguiente pago como pagado"
                      style="background: none; border: none; box-shadow: none; padding: 0; width: auto; height: auto; min-width: unset; min-height: unset;"
                    >
                      <i class="fas fa-money-bill-wave icono-billete-verde"></i>
                    </button>
                  </div>
                </template>
                <template v-else-if="tipoSeleccionado === 'contratos-pendientes-renovacion' && columna === 'acciones'">
                  <div class="action-buttons-informe">
                    <button
                      class="btn-icon btn-renovar"
                      @click="iniciarRenovacion(fila)"
                      title="Renovar contrato"
                    >
                      <i class="fas fa-sync-alt"></i> Renovar
                    </button>
                    <button
                      class="btn-icon btn-comentario"
                      @click="abrirModalComentario(fila)"
                      :title="fila.comentarioRenovacion ? fila.comentarioRenovacion : 'Sin comentario'"
                    >
                      <i class="fas fa-comment-alt" :class="{ 'has-comment': fila.comentarioRenovacion }"></i> Comentario
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
  <div v-if="mostrarModalComentario" class="modal-overlay" @click.self="mostrarModalComentario = false">
    <div class="modal-comentario-renovacion">
      <div class="modal-header">
        <h3><i class="fas fa-comment-alt"></i> Comentario de Renovación</h3>
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
import Spinner from '@/components/SpinnerComponent.vue';

export default {
  components: {
    Spinner
  },
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
        comercializadoraActual: 'Comercializadora Actual',
        consumoAnual: 'Consumo Anual (kWh)',
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
    // Watcher para filteredData para resetear a la primera página cuando se apliquen filtros
    filteredData() {
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
          <div style="text-align: left; margin: 10px 0;">
            <p><strong>Cliente:</strong> ${fila.cliente}</p>
            <p><strong>Gestora:</strong> ${fila.gestora}</p>
            <p><strong>Pago #${siguientePago}:</strong> ${this.formatearImporte(importePago)}</p>
            <p><strong>Fecha de pago:</strong> ${this.formatearFecha(fechaPago)}</p>
          </div>
          <p style="margin-top: 15px;">¿Está seguro que desea marcar este pago como pagado?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: '<i class="fas fa-money-bill-wave"></i> Sí, marcar como pagado',
        cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
        reverseButtons: true,
        customClass: {
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
    async mostrarInforme(tipo) {
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
        // Resetear estado de paginación
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.recordsPerPageValue = 10;
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
        // Resetear estado de paginación
        this.currentPage = 1;
        this.recordsPerPage = 10;
        this.recordsPerPageValue = 10;
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
        "servicios-vigentes": [
          "idServicio", // identificador
          "cliente", "servicio", "fechaInicioServicio", "fechaFinServicio", 
          "gestora", "producto", "comercializadora", "importeFinal",
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
              // Para todos los informes con CUPS, calcular el valor consolidado desde cupsLuz/cupsGas
              fila[key] = this.obtenerCupsParaMostrar(item);
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
            fila.comentarioRenovacion = item.comentarioRenovacion;
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
              rowData[formattedColumnaName] = this.formatearImporte(item[columnaKey]);
            } else if (columnaKey === 'cups') {
              // Manejar CUPS: en servicios-pendientes-pago ya viene resuelto como item.cups
              if (this.tipoSeleccionado === 'servicios-pendientes-pago') {
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
          
          return {
            header: col,
            key: col,
            width: ancho
          };
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
      this.guardandoComentario = true;
      try {
        await axios.patch(
          `${process.env.VUE_APP_API_URL}/contratos/${this.contratoComentarioId}/comentario-renovacion`,
          { comentarioRenovacion: this.comentarioRenovacionEditar }
        );
        this.mostrarModalComentario = false;
        // Actualizar el comentario en la tabla sin recargar todo
        const fila = this.datosInforme.find(f => f.codigoContrato === this.contratoComentarioId);
        if (fila) fila.comentarioRenovacion = this.comentarioRenovacionEditar;
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

<style scoped>
/* Estilos existentes mantenidos... */
.informes-container {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 90%;
  margin: 0 auto;
}

:root {
  --primary-color-rgb: 255, 193, 7; /* Definir el RGB para el color primario amarillo */
}

/* Panel de estadísticas */
.stats-panel {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 1rem;
}

.stats-container {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 0.8rem 1rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  min-width: 200px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 0.7rem;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  margin-right: 0.8rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

/* Panel de informes */
.info-panel {
  padding: 0;
  overflow: hidden;
}

.panel-header {
  background-color: var(--primary-color);
  color: white;
  padding: 0.8rem 1rem;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.panel-header h2 i {
  margin-right: 10px;
}

.panel-content {
  padding: 20px;
}

.informe-opciones {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.informe-card {
  display: flex;
  align-items: center;
  padding: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.informe-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.informe-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-right: 16px;
  flex-shrink: 0;
}

.informe-info {
  flex: 1;
}

.informe-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.informe-info p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.informe-action {
  color: var(--primary-color);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Panel de la tabla */
.table-panel {
  background: white;
  border-radius: 0.7rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.table-header h2 i {
  margin-right: 10px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-actions .btn {
  background: transparent;
  border-color: var(--border-color);
  color: var(--text-primary);
  padding: 6px 10px;
  font-size: 0.9rem;
}

.table-actions .btn:hover {
  background-color: var(--hover-color);
}

/* Modal de selección */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  width: 600px;
  max-width: 90%;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  padding: 16px 20px;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.modal-close {
  background: transparent;
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
}

.option-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.option-card {
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.option-card:hover {
  background-color: var(--primary-light);
  color: white;
}

.option-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  color: var(--primary-color);
}

.option-card:hover .option-icon {
  color: white;
}

.option-info h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.option-info p {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .stats-container {
    flex-direction: column;
  }
  
  .stats-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .option-selector {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .informe-opciones {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .modal-container {
    max-width: 98vw;
    width: 98vw;
    max-height: 98vh;
  }
  .modal-body {
    max-height: 70vh;
  }
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

/* Estilos para los filtros y ordenamiento */
.column-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.column-title {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 2px 0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  gap: 4px;
  font-size: 0.95rem;
  min-height: 20px;
}

.column-text {
  margin-right: 0;
  word-break: break-word;
  white-space: normal;
  line-height: 1.2;
}

.column-title:hover {
  background-color: var(--hover-color);
}

.column-filter-container {
  position: relative;
  min-width: 60px;
}

.column-filter {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  min-width: 55px;
}

.column-filter:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.column-filter::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

/* Estilos para la paginación mejorados */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-per-page label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.records-per-page select {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.page-info {
  color: var(--text-primary);
  font-weight: 500;
  padding: 0 10px;
}

.btn-outline {
  background: white;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  min-width: 40px;
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

/* Estilos para la tabla */
.data-table {
  width: 100%;
  min-width: auto;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 12px 10px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 120px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.3;
}

.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: 52px; /* Altura fija para las filas */
}

.text-truncate {
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--hover-color);
}

/* Estilos Generales de Botones - Actualizados */
.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: none !important;
  cursor: pointer !important;
  letter-spacing: 0.3px !important;
}

.btn i {
  font-size: 1.1em !important;
}

/* Botón Refresh/Actualizar */
.btn-refresh {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1) !important;
}

.btn-refresh:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15) !important;
}

.btn-refresh:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
  box-shadow: none !important;
  background: #9ca3af !important;
}

/* Botón Excel */
.btn-excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1) !important;
}

.btn-excel:hover {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.15) !important;
}

/* Botón Primary (Crear, Guardar, etc) */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1) !important;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15) !important;
}

.btn-primary i {
  font-size: 1.1em !important;
}

/* Botón Create (Alias para Primary) */
.btn-create {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;
  color: white !important;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1) !important;
}

.btn-create:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15) !important;
}

.btn-create i {
  font-size: 1.1em !important;
}

.btn-export {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  border: none !important;
  cursor: pointer !important;
}

.btn-export i {
  font-size: 1.2em !important;
}

/* Estilos para las celdas de la tabla */
.table-cell {
  position: relative;
  min-width: 100px;
  max-width: 180px;
  height: 40px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  cursor: default;
  transition: background-color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-content {
  width: 100%;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-wrap: break-word;
  display: block;
  line-height: 1.4;
  padding-right: 20px;
}

/* Indicador visual de celda editable */
.table-cell:hover {
  background-color: var(--hover-color);
}

/* Ajustes para la tabla responsiva */
.table-responsive {
  overflow-x: auto;
  background-color: white;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
}

/* Estilos para los controles de filtro */
.table-controls {
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Permitir wrap en los nombres de las columnas */
.data-table th .column-title {
  display: flex;
  align-items: center;
  gap: 4px;
  word-break: break-word;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
  min-height: 24px;
  flex-wrap: wrap;
  max-width: 100%;
}

.data-table th .column-title i {
  flex-shrink: 0;
}

/* Ajuste general: reducir max-width de otras celdas para optimizar espacio */
.table-cell {
  min-width: 80px;
  max-width: 140px;
  height: 40px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  cursor: default;
  transition: background-color 0.2s ease;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-content {
  width: 100%;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  padding-right: 20px;
}

/* Estilos específicos para la columna CUPS */
.data-table th[data-column="cups"],
.data-table th[data-column="cupsLuz"],
.data-table th[data-column="cupsGas"],
.data-table td[data-column="cups"],
.data-table td[data-column="cupsLuz"],
.data-table td[data-column="cupsGas"] {
  min-width: 200px !important;
  max-width: 250px !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: ellipsis !important;
}

.data-table td[data-column="cups"] .cell-content,
.data-table td[data-column="cupsLuz"] .cell-content,
.data-table td[data-column="cupsGas"] .cell-content {
  max-width: none !important;
  overflow: visible !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* ── Estilos específicos para informe Contactos Clientes ── */
.data-table td[data-column="correo"],
.data-table th[data-column="correo"] {
  min-width: 220px !important;
  max-width: 320px !important;
}

.data-table td[data-column="sector"],
.data-table th[data-column="sector"] {
  min-width: 130px !important;
  max-width: 200px !important;
}

.data-table td[data-column="cargo"],
.data-table th[data-column="cargo"] {
  min-width: 150px !important;
  max-width: 220px !important;
}

.data-table td[data-column="telefono"],
.data-table th[data-column="telefono"] {
  min-width: 140px !important;
  max-width: 180px !important;
}

.data-table td[data-column="nombreCliente"],
.data-table th[data-column="nombreCliente"] {
  min-width: 180px !important;
  max-width: 260px !important;
}

.contacto-link-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  overflow: hidden;
}

.contacto-email-text,
.contacto-phone-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* Celda CUPS con icono FontAwesome */
.cups-informe-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
}

.cups-valor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  font-weight: 600;
}

.tipo-cups-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.7rem;
  flex-shrink: 0;
}

.tipo-cups-badge.is-luz {
  background: rgba(255, 235, 59, 0.2);
  color: #fbc02d;
}

.tipo-cups-badge.is-gas {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.contacto-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s;
  user-select: text;
  -webkit-user-select: text;
}

.contacto-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.contacto-link i {
  font-size: 0.8em;
  opacity: 0.7;
  flex-shrink: 0;
}

.contacto-email {
  color: #2563eb;
}

.contacto-email-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #374151;
  font-weight: 500;
  user-select: text;
  -webkit-user-select: text;
}

.contacto-email-text i {
  font-size: 0.8em;
  opacity: 0.5;
  color: #2563eb;
  flex-shrink: 0;
}

.contacto-phone {
  color: #059669;
}

.contacto-phone:hover {
  color: #047857;
}

.contacto-phone-text {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #374151;
  font-weight: 500;
  user-select: text;
  -webkit-user-select: text;
}

.contacto-phone-text i {
  font-size: 0.8em;
  opacity: 0.5;
  color: #059669;
  flex-shrink: 0;
}

.btn-copy-cell {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 5px;
  font-size: 0.75em;
  flex-shrink: 0;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}

.btn-copy-cell:hover {
  color: #2563eb;
  border-color: #2563eb;
  background: #eff6ff;
}

/* NUEVOS ESTILOS PARA EL GESTOR DE PAGOS INNOVADOR */
.pagos-simple-display {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 8px;
}

.btn-mark-paid {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  width: auto !important;
  height: auto !important;
  min-width: unset !important;
  min-height: unset !important;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-mark-paid:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icono-billete-verde {
  color: #217346 !important;
  font-size: 1.4rem;
}

/* Botones de acción en contratos pendientes de renovación */
.action-buttons-informe {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-renovar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background-color: #28a745;
  color: white;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-renovar:hover {
  background-color: #218838;
}

.btn-comentario {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background-color: #6c757d;
  color: white;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-comentario:hover {
  background-color: #5a6268;
}

.btn-comentario .has-comment {
  color: #ffc107;
}

/* Modal comentario renovación */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-comentario-renovacion {
  background: var(--surface-color, #fff);
  border-radius: 10px;
  width: 520px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.modal-comentario-renovacion .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-comentario-renovacion .modal-header h3 {
  margin: 0;
  font-size: 1rem;
}

.modal-comentario-renovacion .modal-body {
  padding: 20px;
}

.textarea-comentario {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  font-size: 0.9rem;
  resize: vertical;
}

.modal-comentario-renovacion .modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #e0e0e0;
}

/* RE-ADJUSTADO Ajuste específico para la columna de pagos */
.data-table th[data-column="pagos"],
.data-table td[data-column="pagos"] {
  min-width: 100px;
  max-width: 120px;
  position: relative;
}

.data-table td[data-column="pagos"] {
  overflow: hidden !important; /* Volver a ocultar, ya no hay panel */
  text-align: center; /* Centrar el contenido */
  vertical-align: middle;
  padding: 12px 8px;
}

/* Mejora visual para estados de hover en la tabla */
.data-table tbody tr:hover {
  background-color: rgba(var(--primary-color-rgb), 0.05); /* Color primario con transparencia */
}

/* Botón Toggle Baja (Mostrar/Ocultar dados de baja) */
.btn-toggle-baja {
  background: #f3f4f6 !important;
  color: #4b5563 !important;
  border: 1px solid #e5e7eb !important;
  font-weight: 600 !important;
  padding: 10px 20px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}

.btn-toggle-baja:hover {
  background: #e5e7eb !important;
  color: #1f2937 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
}

/* Estado Activo (Rojo) para Toggle Baja */
.btn-toggle-baja.active {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.1) !important;
}

.btn-toggle-baja.active:hover {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
  box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3), 0 4px 6px -2px rgba(239, 68, 68, 0.15) !important;
}

/* Botón Primary (Crear, Guardar, etc) */
.btn-primary {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2), 0 2px 4px -1px rgba(249, 115, 22, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3), 0 4px 6px -2px rgba(249, 115, 22, 0.15);
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  margin: 0;
}

.btn-icon i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.btn-icon.btn-edit {
  color: #2196f3;
}

.btn-icon.btn-edit:hover {
  background-color: rgba(33, 150, 243, 0.1);
}

.btn-icon.btn-view {
  color: #43a047;
}

.btn-icon.btn-view:hover {
  background-color: rgba(67, 160, 71, 0.1);
}

.btn-icon.btn-delete {
  color: #dc3545;
}

.btn-icon.btn-delete:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

/* Badges estado baja */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-baja {
  background-color: rgba(220, 53, 69, 0.12);
  color: #b91c1c;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.badge-activo {
  background-color: rgba(34, 197, 94, 0.12);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
</style>