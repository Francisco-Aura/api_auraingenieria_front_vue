<template>
  <div class="informes-container fade-in">
    
    <!-- Panel de tipos de informes -->
    <div class="card info-panel">
      <div class="panel-header">
        <h2><i class="fas fa-chart-pie"></i> Informes Disponibles</h2>
      </div>
      <div class="panel-content">
        <div class="informe-opciones">
          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-pendientes-renovacion') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('contratos-pendientes-renovacion') ? 'true' : 'false'" @click="toggleInforme('contratos-pendientes-renovacion')" @keydown.enter.self.prevent="toggleInforme('contratos-pendientes-renovacion')" @keydown.space.self.prevent="toggleInforme('contratos-pendientes-renovacion')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Pendientes de Renovación</h3>
              <p>Listado de contratos que están próximos a su fecha de vencimiento</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-pendientes-renovacion') }" :title="esInformeActivo('contratos-pendientes-renovacion') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('contratos-pendientes-renovacion')"></i>
            </div>
          </div>
          
          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('puntos-suministro-sin-contrato') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('puntos-suministro-sin-contrato') ? 'true' : 'false'" @click="toggleInforme('puntos-suministro-sin-contrato')" @keydown.enter.self.prevent="toggleInforme('puntos-suministro-sin-contrato')" @keydown.space.self.prevent="toggleInforme('puntos-suministro-sin-contrato')">
            <div class="informe-icon">
              <i class="fas fa-bolt"></i>
            </div>
            <div class="informe-info">
              <h3>Puntos de Suministro sin Contrato</h3>
              <p>Puntos de suministro que no tienen contratos asociados actualmente</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('puntos-suministro-sin-contrato') }" :title="esInformeActivo('puntos-suministro-sin-contrato') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('puntos-suministro-sin-contrato')"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" :class="{ 'informe-card--activo': esInformeActivo('servicios-pendientes-pago') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('servicios-pendientes-pago') ? 'true' : 'false'" @click="toggleInforme('servicios-pendientes-pago')" @keydown.enter.self.prevent="toggleInforme('servicios-pendientes-pago')" @keydown.space.self.prevent="toggleInforme('servicios-pendientes-pago')">
            <div class="informe-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Pendientes de Pago</h3>
              <p>Listado de servicios que están pendientes de pago</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('servicios-pendientes-pago') }" :title="esInformeActivo('servicios-pendientes-pago') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('servicios-pendientes-pago')"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-vigentes') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('contratos-vigentes') ? 'true' : 'false'" @click="toggleInforme('contratos-vigentes')" @keydown.enter.self.prevent="toggleInforme('contratos-vigentes')" @keydown.space.self.prevent="toggleInforme('contratos-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-file-contract"></i>
            </div>
            <div class="informe-info">
              <h3>Contratos Vigentes</h3>
              <p>Listado de todos los contratos que están actualmente vigentes</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-vigentes') }" :title="esInformeActivo('contratos-vigentes') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('contratos-vigentes')"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contratos-historico') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('contratos-historico') ? 'true' : 'false'" @click="toggleInforme('contratos-historico')" @keydown.enter.self.prevent="toggleInforme('contratos-historico')" @keydown.space.self.prevent="toggleInforme('contratos-historico')">
            <div class="informe-icon">
              <i class="fas fa-history"></i>
            </div>
            <div class="informe-info">
              <h3>Histórico de Contratos</h3>
              <p>Histórico completo de contratos: vigentes, vencidos y renovados</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contratos-historico') }" :title="esInformeActivo('contratos-historico') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('contratos-historico')"></i>
            </div>
          </div>

          <div class="card informe-card" v-if="nivelAcceso === 1" :class="{ 'informe-card--activo': esInformeActivo('servicios-vigentes') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('servicios-vigentes') ? 'true' : 'false'" @click="toggleInforme('servicios-vigentes')" @keydown.enter.self.prevent="toggleInforme('servicios-vigentes')" @keydown.space.self.prevent="toggleInforme('servicios-vigentes')">
            <div class="informe-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="informe-info">
              <h3>Servicios Vigentes</h3>
              <p>Listado de servicios vigentes y pendientes de pago</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('servicios-vigentes') }" :title="esInformeActivo('servicios-vigentes') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('servicios-vigentes')"></i>
            </div>
          </div>

          <div class="card informe-card" :class="{ 'informe-card--activo': esInformeActivo('contactos-clientes') }" role="button" tabindex="0" :aria-expanded="esInformeActivo('contactos-clientes') ? 'true' : 'false'" @click="toggleInforme('contactos-clientes')" @keydown.enter.self.prevent="toggleInforme('contactos-clientes')" @keydown.space.self.prevent="toggleInforme('contactos-clientes')">
            <div class="informe-icon">
              <i class="fas fa-address-book"></i>
            </div>
            <div class="informe-info">
              <h3>Contactos de Clientes</h3>
              <p>Directorio de teléfonos y correos de todos los clientes y sus contactos</p>
            </div>
            <div class="informe-action" :class="{ 'informe-action--activo': esInformeActivo('contactos-clientes') }" :title="esInformeActivo('contactos-clientes') ? 'Contraer informe' : 'Expandir informe'">
              <i :class="iconoInforme('contactos-clientes')"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de datos (solo se muestra si se elige ver en pantalla). También sale si el
         informe viene vacío: antes la tarjeta quedaba marcada y no aparecía nada -->
    <div v-if="mostrarTabla" ref="panelInforme" class="card table-panel">
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
      <div class="table-responsive" v-desborde-tabla>
        <table class="data-table" :class="{ 'data-table--acciones-fijas': encabezados.includes('acciones') || encabezados.includes('pagos') }">
          <thead>
            <tr>
              <th v-for="columna in encabezados" :key="columna" class="sortable" :data-column="columna"
                  :class="{ 'th-acciones': columna === 'acciones', 'th-pagos': columna === 'pagos' }">
                <div class="column-header">
                  <div class="column-title" :class="{ 'column-title--sin-orden': columna === 'acciones' || columna === 'pagos' }" @click="columna !== 'acciones' && columna !== 'pagos' && sortBy(columna)" :tabindex="columna === 'acciones' || columna === 'pagos' ? null : 0" :role="columna === 'acciones' || columna === 'pagos' ? null : 'button'" @keydown.enter.prevent="columna !== 'acciones' && columna !== 'pagos' && sortBy(columna)" @keydown.space.prevent="columna !== 'acciones' && columna !== 'pagos' && sortBy(columna)">
                    <span v-if="columna === 'pagos'" class="column-text column-text--center" :title="'Marcar como pagado'">
                      <i class="fas fa-credit-card" style="color: #217346; font-size: 1rem;"></i>
                    </span>
                    <span v-else class="column-text" :title="formatearColumna(columna)">{{ formatearColumna(columna) }}</span>
                    <i v-if="columna !== 'acciones' && columna !== 'pagos'" :class="getSortIcon(columna)"></i>
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
                  <div v-else-if="columna === 'pagos'" class="column-filter-container column-filter-placeholder"></div>
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
            <tr v-for="(fila, index) in paginatedData" v-show="!loading" :key="filaKey(fila, index)" :class="index % 2 === 0 ? 'fila-par' : 'fila-impar'">
              <td v-for="columna in encabezados" :key="columna" :class="['table-cell', columna === 'acciones' ? 'table-cell-acciones' : '']" :data-column="columna">
                <template v-if="tipoSeleccionado === 'servicios-pendientes-pago' && columna === 'pagos'">
                  <div class="pagos-simple-display">
                    <button 
                      class="btn-pago-check"
                      :disabled="isSavingBulk"
                      @click="confirmarMarcoPagado(fila)"
                      title="Marcar siguiente pago como pagado"
                    >
                      <i class="fas fa-credit-card"></i>
                      <span>Marcar pagado</span>
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
            <tr v-if="!loading && paginatedData.length === 0" class="fila-sin-datos">
              <td :colspan="encabezados.length || 1" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">{{ datosInforme.length === 0 ? 'No hay datos en este informe' : 'No se encontraron registros que coincidan con los filtros' }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Fuera del contenedor que desplaza la tabla: antes, al moverla a la derecha, la
           paginación se iba con ella y la barra de desplazamiento quedaba debajo -->
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
          Mostrando {{ filteredData.length ? (currentPage - 1) * recordsPerPage + 1 : 0 }} - {{ Math.min(currentPage * recordsPerPage, filteredData.length) }} de {{ filteredData.length }} registros
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
          <span class="page-info">Página {{ currentPage }} de {{ totalPages || 1 }}</span>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
          <button 
            class="btn btn-outline" 
            :disabled="currentPage >= totalPages"
            @click="currentPage = totalPages"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Comentario de Renovación -->
  <div v-if="mostrarModalComentario" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="comentario-renovacion-title" @click.self="mostrarModalComentario = false">
    <div class="modal-comentario-renovacion">
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-comment-alt"></i></span>
        <div class="aura-modal-header__titulos">
          <h3 id="comentario-renovacion-title">Comentario de renovación</h3>
          <span class="aura-modal-header__subtitulo">Seguimiento de la renovación de este contrato</span>
        </div>
        <button class="close-button" @click="mostrarModalComentario = false"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <textarea
          ref="textareaComentario"
          v-model="comentarioRenovacionEditar"
          class="form-control textarea-comentario"
          rows="6"
          maxlength="10000"
          placeholder="Escriba el comentario de renovación..."
        ></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="mostrarModalComentario = false">
          <i class="fas fa-times"></i> Cancelar
        </button>
        <button class="btn btn-primary" @click="guardarComentarioRenovacion" :disabled="guardandoComentario">
          <i class="fas fa-save"></i> {{ guardandoComentario ? 'Guardando...' : 'Aceptar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ordenTabla } from '@/mixins/ordenTabla';
import { compararValores } from '@/utils/orden';
import axios from 'axios';
import Swal from 'sweetalert2';
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel';
import { escaparHtml } from '@/utils/html';
import { fechaCortaES } from '@/utils/fechas';
import { cupsVisible, tipoCups } from '@/utils/cups';

// Un único formateador de importes: crear un Intl.NumberFormat por celda costaba
// ~40 µs, y el filtro de una columna de importes lo pedía una vez por fila.
const FORMATO_EUROS = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
// Consumo anual en pantalla: kWh enteros con separador de miles (el Excel lleva el dato tal cual)
const FORMATO_KWH = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

export default {
  mixins: [ordenTabla],
  data() {
    return {
      loading: false,
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
        fechaInicioServicio: 'Inicio',
        fechaFinServicio: 'Fin',
        cliente: 'Cliente',
        cups: 'CUPS',
        contrato: 'Contrato',
        tarifaLuz: 'Tarifa Luz',
        tarifaGas: 'Tarifa Gas',
        tarifa: 'Tarifa',
        estado: 'Estado',
        comercializadoraActual: 'Com. Actual',
        comercializadora: 'Comercializadora',
        gestora: 'Gestora',
        producto: 'Producto',
        consumoAnual: 'Consumo kWh',
        importeCuotaPendiente: 'Importe Cuota Pendiente',
        importeFinal: 'Importe',
        descripcion: 'Descripción',
        estadoVencimiento: 'Estado',
        estadoPago: 'Pago',
        nombreCliente: 'Nombre Cliente',
        tipoContacto: 'Tipo Contacto',
        nombre: 'Nombre',
        cargo: 'Cargo',
        sector: 'Sector',
        telefono: 'Teléfono',
        correo: 'Correo',
        estadoBaja: 'De Baja',
        acciones: 'Acciones',
        direccion: 'Dirección',
        codigoPostal: 'Código Postal',
        poblacion: 'Población',
        provincia: 'Provincia',
        grupo: 'Grupo Empresarial',
      }
    };
  },
  computed: {
    filteredData() {
      let result = [...this.datosInforme];

      // Aplicar filtros por columna
      Object.entries(this.columnFilters).forEach(([column, value]) => {
        if (value) {
          // Coincide con el valor tal como se ve (fechas dd/mm/aaaa, importes...) o con el original
          const buscado = value.toLowerCase();
          result = result.filter(item =>
            String(item[column] ?? '').toLowerCase().includes(buscado)
            || String(this.mostrarValorCelda(item, column) ?? '').toLowerCase().includes(buscado)
          );
        }
      });

      // Aplicar ordenamiento
      if (this.sortKey && this.sortOrder) {
        const signo = this.sortOrder === 'asc' ? 1 : -1;
        result.sort((a, b) => compararValores(a[this.sortKey], b[this.sortKey]) * signo);
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

    // Identificador estable de fila, usado como :key en la tabla
    filaKey(fila, index) {
      return fila.idServicio ?? fila.codigoContrato ?? fila.idPS ?? index;
    },

    // Método para confirmar antes de marcar como pagado
    async confirmarMarcoPagado(fila) {
      // Mientras se guarda un pago la fila aún muestra el número anterior: otra
      // confirmación marcaría también la cuota siguiente
      if (this.isSavingBulk) return;
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
            <p><strong>Cliente:</strong> ${escaparHtml(fila.cliente)}</p>
            <p><strong>Gestora:</strong> ${escaparHtml(fila.gestora)}</p>
            <p><strong>Pago #${escaparHtml(siguientePago)}:</strong> ${escaparHtml(this.formatearImporte(importePago))}</p>
            <p><strong>Fecha de pago:</strong> ${escaparHtml(this.mostrarValorCelda({ fechaSiguientePago: fechaPago }, 'fechaSiguientePago'))}</p>
          </div>
          <p class="swal-marcar-pagado-confirmacion">¿Está seguro que desea marcar este pago como pagado?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#fcd700',
        confirmButtonText: '<i class="fas fa-credit-card"></i> Confirmar',
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
    // Método para marcar el siguiente pago como pagado
    async marcarSiguientePago(fila) {
      if (this.isSavingBulk) return;
      this.isSavingBulk = true;
      try {
        // Se marca la cuota que se ve en la fila («Pago #N»): pedir «la siguiente» podía
        // marcar otra si alguien ya había marcado esa desde otra pantalla o pestaña
        const api = `${process.env.VUE_APP_API_URL}/informes/servicios-pendientes-pago`;
        if (fila.siguientePagoNumero) {
          await axios.put(`${api}/actualizar-pago/${fila.idServicio}/${fila.siguientePagoNumero}`, null, { params: { pagado: true } });
        } else {
          await axios.put(`${api}/marcar-siguiente-pago/${fila.idServicio}`);
        }
        
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
        // Como texto: el segundo argumento posicional de SweetAlert se pinta como HTML
        Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'No se pudo actualizar el pago' });
      } finally {
        this.isSavingBulk = false;
      }
    },

    // Método para formatear fechas
    formatearFecha(fecha) {
      return fechaCortaES(fecha);
    },

    // Método para mostrar el informe directamente en pantalla
    esInformeActivo(tipo) {
      return this.tipoSeleccionado === tipo && this.mostrarTabla;
    },

    // Mientras llega un informe, su tarjeta enseña un indicador de carga: la tabla sale
    // debajo de las tarjetas y antes no se veía que el clic había hecho algo
    iconoInforme(tipo) {
      return this.loading && this.tipoSeleccionado === tipo ? 'fas fa-spinner fa-spin' : 'fas fa-chevron-right';
    },

    // Lleva la vista a la tabla recién abierta (a 1280×720 queda por debajo de las tarjetas)
    irATablaInforme() {
      this.$nextTick(() => {
        const panel = this.$refs.panelInforme;
        if (panel && typeof panel.scrollIntoView === 'function') {
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },

    toggleInforme(tipo) {
      if (this.tipoSeleccionado === tipo) {
        this.mostrarTabla = !this.mostrarTabla;
        if (this.mostrarTabla) this.irATablaInforme();
        return;
      }
      this.mostrarInforme(tipo);
    },

    // Cada petición de informe lleva un número: si el usuario pulsa otro informe (o
    // refresca) antes de que llegue la respuesta, la anterior se descarta. Antes una
    // respuesta lenta podía pintar los datos de un informe con las columnas de otro.
    nuevaPeticionInforme() {
      this.peticionInforme = (this.peticionInforme || 0) + 1;
      const peticion = this.peticionInforme;
      return () => peticion === this.peticionInforme;
    },

    async mostrarInforme(tipo) {
      // Si es el mismo informe que ya estaba visible (p.ej. un refresco tras
      // marcar un pago), no reseteamos la página ni el tamaño de página.
      const esMismoInforme = this.tipoSeleccionado === tipo && this.mostrarTabla;
      const tipoAnterior = this.tipoSeleccionado;
      const vigente = this.nuevaPeticionInforme();
      this.tipoSeleccionado = tipo;
      this.loading = true;
      try {
        let respuesta;
        if (tipo === 'contratos-pendientes-renovacion') {
          // El backend actual filtra con la sesión; nivel y nombre se envían solo por
          // compatibilidad con el backend anterior durante el despliegue
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${tipo}`, {
            params: { nivelAcceso: usuario?.nivelAcceso },
            headers: { 'X-Aura-Usuario-Nombre': usuario?.nombre }
          });
        } else {
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${tipo}`);
        }
        if (!vigente()) return;
        this.procesarDatosParaTabla(respuesta.data);
        this.tituloInforme = this.tituloVisible(tipo);
        this.mostrarTabla = true;
        if (!esMismoInforme) {
          // Resetear estado de paginación solo al cambiar a un informe distinto
          this.currentPage = 1;
          this.recordsPerPage = 10;
          this.recordsPerPageValue = 10;
          // Un filtro de una columna que este informe no tiene seguía filtrando (sin
          // casilla a la vista para quitarlo) y el informe salía vacío. Se conservan
          // los de las columnas que sí tiene, como hasta ahora.
          this.columnFilters = Object.fromEntries(
            Object.entries(this.columnFilters).filter(([columna]) => this.encabezados.includes(columna))
          );
          this.irATablaInforme();
        }
      } catch (error) {
        if (!vigente()) return;
        // La tarjeta marcada tiene que ser la del informe que se ve (y volver a pulsar
        // la nueva tiene que reintentar la carga)
        if (!esMismoInforme) this.tipoSeleccionado = tipoAnterior;
        console.error("Error al obtener el informe", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cargar el informe'
        });
      } finally {
        if (vigente()) this.loading = false;
      }
    },

    // Método para actualizar el informe actual
    async actualizarInforme() {
      if (!this.tipoSeleccionado) return;
      const vigente = this.nuevaPeticionInforme();
      this.loading = true;
      try {
        let respuesta;
        if (this.tipoSeleccionado === 'contratos-pendientes-renovacion') {
          // El backend actual filtra con la sesión; nivel y nombre se envían solo por
          // compatibilidad con el backend anterior durante el despliegue
          const usuario = JSON.parse(localStorage.getItem('usuario'));
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${this.tipoSeleccionado}`, {
            params: { nivelAcceso: usuario?.nivelAcceso },
            headers: { 'X-Aura-Usuario-Nombre': usuario?.nombre }
          });
        } else {
          respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/informes/${this.tipoSeleccionado}`);
        }
        if (!vigente()) return;
        this.procesarDatosParaTabla(respuesta.data);
        // No reseteamos página ni tamaño de página: es un refresco del mismo
        // informe, el usuario debe permanecer donde estaba.
      } catch (error) {
        if (!vigente()) return;
        console.error("Error al actualizar el informe", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el informe'
        });
      } finally {
        if (vigente()) this.loading = false;
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
          // «cups» es la columna visible (luz o gas), como en los informes de contratos:
          // cupsLuz y cupsGas no se enseñan y el informe salía sin ningún CUPS
          "cliente", "cupsLuz", "cupsGas", "cups", "direccion", "codigoPostal", "poblacion", "provincia"
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
          "fechaInicioServicio", "fechaFinServicio", "cliente", "grupo", "producto",
          "gestora", "comercializadora", "cups", "tarifa", "descripcion", "importeFinal",
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
            } else if (key === 'descripcion' && this.tipoSeleccionado === 'servicios-vigentes') {
              // El backend devuelve el campo como 'servicio', lo mapeamos a 'descripcion'
              fila[key] = item.servicio || '';
            } else if (key === 'importeFinal' && this.tipoSeleccionado === 'servicios-vigentes') {
              // Mostrar importe aunque comercializadora sea null
              fila[key] = item.importeFinal !== null && item.importeFinal !== undefined ? item.importeFinal : '';
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
        // Quita el identificador, numeroCuotas y campos internos de los encabezados visibles
        this.encabezados = columnasPermitidas[this.tipoSeleccionado].filter(
          col => !["codigoContrato", "idPS", "idServicio", "numeroCuotas", "siguientePagoNumero", "cupsLuz", "cupsGas"].includes(col)
        );
      } else {
        this.datosInforme = datos;
        this.encabezados = Object.keys(datos[0] || {});
      }
    },


    // Mismo título que la tarjeta del informe
    tituloVisible(tipo) {
      const titulos = {
        'contratos-pendientes-renovacion': 'Contratos Pendientes de Renovación',
        'puntos-suministro-sin-contrato': 'Puntos de Suministro sin Contrato',
        'servicios-pendientes-pago': 'Servicios Pendientes de Pago',
        'contratos-vigentes': 'Contratos Vigentes',
        'contratos-historico': 'Histórico de Contratos',
        'servicios-vigentes': 'Servicios Vigentes',
        'contactos-clientes': 'Contactos de Clientes',
      };
      return titulos[tipo] || this.formatearTitulo(tipo);
    },

    // Formatea el título corto (también nombre de la hoja Excel, máx. 31 caracteres)
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
      if (valor === null || valor === undefined || valor === '') return '';
      const numero = parseFloat(valor);
      if (isNaN(numero)) return valor;
      return FORMATO_EUROS.format(numero);
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
      // Fechas en el mismo formato que el resto de la aplicación (dd/mm/aaaa)
      const valorFecha = fila[columna];
      if (/^fecha/.test(columna) && typeof valorFecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(valorFecha)) {
        const [anio, mes, dia] = valorFecha.slice(0, 10).split('-');
        return `${dia}/${mes}/${anio}`;
      }
      if ((columna === 'importeCuotaPendiente' && this.tipoSeleccionado === 'servicios-pendientes-pago') ||
          (columna === 'importeFinal' && this.tipoSeleccionado === 'servicios-vigentes')) {
        return this.formatearImporte(fila[columna]);
      }
      if (columna === 'consumoAnual') {
        const valor = fila[columna];
        if (valor) {
          // Con separador de miles y sin decimales sueltos (antes «27301.370000000003 kWh»)
          const numero = Number(valor);
          return Number.isFinite(numero) ? `${FORMATO_KWH.format(numero)} kWh` : `${valor} kWh`;
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

    // Fecha ISO (AAAA-MM-DD...) como Date para Excel; a medianoche UTC para que
    // Excel muestre exactamente ese día. Cualquier otro valor se devuelve tal cual.
    valorFechaExcel(valor) {
      if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor;
      const [anio, mes, dia] = valor.slice(0, 10).split('-').map(Number);
      return new Date(Date.UTC(anio, mes - 1, dia));
    },

    // Obtiene el CUPS consolidado para mostrar (luz o gas)
    obtenerCupsParaMostrar(item) {
      return cupsVisible(item.cupsLuz, item.cupsGas);
    },

    // Obtiene el tipo de CUPS (Luz o Gas)
    getTipoCups(item) {
      return tipoCups(item.cupsLuz, item.cupsGas);
    },

    // Métodos para ordenamiento y filtrado

    filterByColumn(column, value) {
      this.columnFilters[column] = value;
    },

    async exportarExcel() {
      // Mientras carga otro informe los datos a la vista aún son los del anterior
      if (this.loading) return;
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

        // Usar los datos filtrados (incluyendo ordenamiento y filtros).
        // NOTA: se exportan TODAS las columnas del informe (this.encabezados),
        // no solo las primarias visibles en pantalla: el detalle expandible
        // es solo una forma de mostrarlo, no reduce la información exportada.
        const columnasImporte = new Set();
        const columnasFecha = new Set();
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
            } else if (/^fecha/.test(columnaKey)) {
              // Fecha real de Excel (se puede ordenar y filtrar), mostrada como dd/mm/aaaa
              columnasFecha.add(formattedColumnaName);
              rowData[formattedColumnaName] = this.valorFechaExcel(item[columnaKey]) ?? '';
            } else {
              rowData[formattedColumnaName] = item[columnaKey] ?? '';
            }
          });
          return rowData;
        });

        // Crear un libro de trabajo y una hoja de cálculo
        const ExcelJS = await cargarExcelJS();
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
          if (columnasFecha.has(col)) {
            columna.style = { numFmt: 'dd/mm/yyyy' };
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

        await descargarLibroExcel(workbook, `${this.formatearTitulo(this.tipoSeleccionado)}.xlsx`);

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
      // El cursor, en el comentario (antes se quedaba en el botón de la tabla, detrás)
      this.$nextTick(() => this.$refs.textareaComentario?.focus());
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
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el comentario' });
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