<template>
  <div class="informes-container fade-in">
    <!-- Panel superior con stats y opciones -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">2</div>
            <div class="stat-label">Informes Disponibles</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-file-pdf"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">12</div>
            <div class="stat-label">Informes Generados</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de tipos de informes -->
    <div class="card info-panel">
      <div class="panel-header">
        <h2><i class="fas fa-chart-pie"></i> Informes Disponibles</h2>
      </div>
      <div class="panel-content">
        <div class="informe-opciones">
          <div class="card informe-card" @click="preguntarModo('contratos-pendientes-renovacion')">
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
          
          <div class="card informe-card" @click="preguntarModo('puntos-suministro-sin-contrato')">
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

          <div class="card informe-card" @click="preguntarModo('servicios-pendientes-pago')">
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
        </div>
      </div>
    </div>

    <!-- Tabla de datos (solo se muestra si se elige ver en pantalla) -->
    <div v-if="mostrarTabla && datosInforme.length > 0" class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-table"></i> {{ tituloInforme }}</h2>
        <div class="table-actions">
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
                  <div class="column-title" @click="sortBy(columna)">
                    <span class="column-text">{{ formatearColumna(columna) }}</span>
                    <i :class="getSortIcon(columna)"></i>
                  </div>
                  <div class="column-filter-container">
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
                      @click="marcarTodosPagados(fila, true)"
                      :disabled="getPagosPagados(fila) === (fila.numeroCuotas || 12)"
                    >
                      <i class="fas fa-check-double"></i> Marcar Pagado
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div v-if="!esCeldaEditando(index, columna)" class="cell-content" @dblclick="iniciarEdicion(index, columna, fila[columna])">
                    {{ mostrarValorCelda(fila, columna) }}
                  </div>
                  <div v-else class="cell-edit">
                    <input 
                      type="text" 
                      v-model="valorEditando"
                      class="edit-input"
                      @blur="guardarEdicion(index, columna)"
                      @keyup.enter="guardarEdicion(index, columna)"
                      @keyup.esc="cancelarEdicion"
                      ref="editInput"
                    >
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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

    <!-- Modal para seleccionar modo de visualización -->
    <div v-if="mostrarModal" class="modal-backdrop">
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title">Seleccionar formato de informe</h3>
          <button class="modal-close" @click="cerrarModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="option-selector">
            <div class="option-card" @click="generarInforme('pdf')">
              <div class="option-icon">
                <i class="fas fa-file-pdf"></i>
              </div>
              <div class="option-info">
                <h4>Generar PDF</h4>
                <p>Exportar informe en formato PDF para descargar</p>
              </div>
            </div>
            
            <div class="option-card" @click="generarInforme('pantalla')">
              <div class="option-icon">
                <i class="fas fa-desktop"></i>
              </div>
              <div class="option-info">
                <h4>Ver en Pantalla</h4>
                <p>Mostrar los datos en formato tabla directamente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

export default {
  data() {
    return {
      mostrarModal: false,
      mostrarTabla: false,
      datosInforme: [],
      encabezados: [],
      tipoSeleccionado: "",
      tituloInforme: "",
      columnFilters: {},
      sortKey: null,
      sortOrder: null,
      recordsPerPage: 10,
      recordsPerPageValue: 10, // Nuevo campo reactivo
      currentPage: 1,
      celdaEditando: null,
      valorEditando: '',
      valorOriginal: '',
      isSaving: false,
      isSavingBulk: false,
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

    // Método para marcar todos los pagos como pagados o no pagados
    async marcarTodosPagados(fila, pagado) {
      this.isSavingBulk = true;
      try {
        const numCuotas = fila.numeroCuotas || 12;
        const promises = [];
        
        for (let i = 1; i <= numCuotas; i++) {
          if (fila[`pago${i}_pagado`] !== (pagado ? 1 : 0)) {
            promises.push(
              axios.put(`${process.env.VUE_APP_API_URL}/api/informes/servicios-pendientes-pago/actualizar-pago/${fila.idServicio}/${i}?pagado=${pagado}`)
            );
          }
        }
        
        await Promise.all(promises);
        
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: `Todos los pagos han sido ${pagado ? 'marcados como pagados' : 'desmarcados'}.`,
          timer: 1500,
          showConfirmButton: false
        });
        
        // Recargar los datos después de la actualización exitosa
        await this.generarInforme('pantalla');

      } catch (error) {
        console.error('Error al actualizar pagos en lote:', error);
        Swal.fire('Error', 'No se pudieron actualizar todos los pagos', 'error');
        // Recargar datos para revertir cambios optimistas
        await this.generarInforme('pantalla');
      } finally {
        this.isSavingBulk = false;
      }
    },

    // Abre el modal para preguntar el modo de visualización
    preguntarModo(tipo) {
      this.tipoSeleccionado = tipo;
      this.mostrarModal = true;
    },

    // Cierra el modal sin realizar ninguna acción
    cerrarModal() {
      this.mostrarModal = false;
    },

    // Genera el informe en la opción seleccionada
    async generarInforme(modo) {
      this.mostrarModal = false; // Cierra el modal

      try {
        const respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/api/informes/${this.tipoSeleccionado}`);
        
        if (modo === "pdf") {
          this.crearPDF(respuesta.data, this.tipoSeleccionado);
        } else {
          // Filtra los datos para la tabla en pantalla
          this.procesarDatosParaTabla(respuesta.data);
          this.tituloInforme = this.formatearTitulo(this.tipoSeleccionado);
          this.mostrarTabla = true;
          // Resetear estado de paginación
          this.currentPage = 1;
          this.recordsPerPage = 10;
          this.recordsPerPageValue = 10;
        }
      } catch (error) {
        console.error("Error al obtener el informe", error);
      }
    },

    // Filtra los datos para la tabla en pantalla
    procesarDatosParaTabla(datos) {
      const columnasPermitidas = {
        "contratos-pendientes-renovacion": [
          "codigoContrato", // identificador
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", 
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual"
        ],
        "puntos-suministro-sin-contrato": [
          "idPS", // identificador
          "cliente", "direccion", "codigoPostal", "poblacion", "provincia", "cupsLuz", "cupsGas"
        ],
        "servicios-pendientes-pago": [
          "idServicio", // identificador
          "cliente", "servicio", "fechaVencimiento", "importeTotal",
          "pagos", // Esta columna se renderizará de forma personalizada
          "estadoVencimiento", "estadoPago", "numeroCuotas" // Añadir numeroCuotas
        ]
      };

      if (columnasPermitidas[this.tipoSeleccionado]) {
        this.datosInforme = datos.map(item => {
          const fila = {};
          columnasPermitidas[this.tipoSeleccionado].forEach(key => {
            fila[key] = item[key];
          });
          if (this.tipoSeleccionado === 'servicios-pendientes-pago') {
            // Mapear los estados de pago para todas las 12 cuotas posibles
            for (let i = 1; i <= 12; i++) {
              // Convertir a 1 (pagado) o 0 (no pagado) de forma robusta
              const pagoStatus = item[`pago${i}Pagado`];
              fila[`pago${i}_pagado`] = (pagoStatus === 1 || pagoStatus === '1' || pagoStatus === true) ? 1 : 0;
            }
          }
          return fila;
        });
        // Quita el identificador y numeroCuotas de los encabezados visibles
        this.encabezados = columnasPermitidas[this.tipoSeleccionado].filter(
          col => !["codigoContrato", "idPS", "idServicio", "numeroCuotas"].includes(col)
        );
      } else {
        this.datosInforme = datos;
        this.encabezados = Object.keys(datos[0] || {});
      }
    },

    // Genera el PDF del informe con las columnas específicas
    crearPDF(datos, tipo) {
      const columnasPermitidas = {
        "contratos-pendientes-renovacion": [
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", 
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual"
        ],
        "puntos-suministro-sin-contrato": [
          "cliente", "direccion", "codigoPostal", "poblacion", "provincia", "cupsLuz", "cupsGas"
        ],
        "servicios-pendientes-pago": [
          "cliente", "servicio", "fechaVencimiento", "importeTotal", "estadoVencimiento", "estadoPago"
        ]
      };

      // Crear documento en orientación horizontal y tamaño A3
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      
      // Añadir logo
      const logo = new Image();
      logo.src = require('@/assets/logo.png');
      doc.addImage(logo, 'PNG', 14, 10, 30, 30);

      // Título del informe
      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      doc.text(`Informe: ${this.formatearTitulo(tipo)}`, 50, 25);

      // Fecha de generación
      doc.setFontSize(10);
      const fecha = new Date().toLocaleDateString();
      doc.text(`Generado el: ${fecha}`, 14, 45);

      let encabezados, filas;
      if (columnasPermitidas[tipo]) {
        encabezados = columnasPermitidas[tipo].map(col => this.formatearColumna(col));
        filas = datos.map(item =>
          columnasPermitidas[tipo].map(col => {
            if (col === 'importeTotal' && tipo === 'servicios-pendientes-pago') {
              return this.formatearImporte(item[col]);
            }
            return item[col] ?? "";
          })
        );
      } else {
        encabezados = Object.keys(datos[0] || {}).map(key => this.formatearColumna(key));
        filas = datos.map(item => Object.values(item));
      }

      // Ahora permitimos hasta 14 columnas por página en A3
      const maxColsPorPagina = 14;
      if (encabezados.length > maxColsPorPagina) {
        for (let i = 0; i < encabezados.length; i += maxColsPorPagina) {
          const subEncabezados = encabezados.slice(i, i + maxColsPorPagina);
          const subFilas = filas.map(fila => fila.slice(i, i + maxColsPorPagina));

          autoTable(doc, {
            head: [subEncabezados],
            body: subFilas,
            startY: 50,
            theme: "grid",
            styles: { 
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              cellWidth: 'wrap'
            },
            headStyles: { 
              fillColor: [255, 193, 7],
              textColor: [51, 51, 51],
              fontStyle: 'bold',
              halign: 'center',
              valign: 'middle',
              fontSize: 9,
              cellPadding: 2,
              textRotation: 45
            },
            alternateRowStyles: { 
              fillColor: [250, 250, 250]
            },
            margin: { top: 15, left: 10, right: 10 },
            didDrawPage: function(data) {
              doc.setFontSize(8);
              doc.text(
                `Página ${doc.internal.getNumberOfPages()}`,
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
              );
            }
          });
          if (i + maxColsPorPagina < encabezados.length) doc.addPage();
        }
      } else {
        autoTable(doc, {
          head: [encabezados],
          body: filas,
          startY: 50,
          theme: "grid",
          styles: { 
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          headStyles: { 
            fillColor: [255, 193, 7],
            textColor: [51, 51, 51],
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            fontSize: 9,
            cellPadding: 2,
            textRotation: 45
          },
          alternateRowStyles: { 
            fillColor: [250, 250, 250]
          },
          margin: { top: 15, left: 10, right: 10 },
          didDrawPage: function(data) {
            doc.setFontSize(8);
            doc.text(
              `Página ${doc.internal.getNumberOfPages()}`,
              data.settings.margin.left,
              doc.internal.pageSize.height - 10
            );
          }
        });
      }

      doc.save(`${tipo}.pdf`);
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

    // Método auxiliar para mostrar valores en la tabla
    mostrarValorCelda(fila, columna) {
      if (columna === 'importeTotal' && this.tipoSeleccionado === 'servicios-pendientes-pago') {
        return this.formatearImporte(fila[columna]);
      }
      return fila[columna] ?? '';
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

    exportarExcel() {
      try {
        // Usar los datos filtrados (incluyendo ordenamiento y filtros)
        const data = this.filteredData.map(item => {
          const rowData = {};
          // Mapear las columnas según los encabezados actuales y formatear los nombres
          this.encabezados.forEach(columnaKey => {
            const formattedColumnaName = this.formatearColumna(columnaKey);
            if (columnaKey === 'importeTotal' && this.tipoSeleccionado === 'servicios-pendientes-pago') {
              rowData[formattedColumnaName] = this.formatearImporte(item[columnaKey]);
            } else if (columnaKey === 'pagos' && this.tipoSeleccionado === 'servicios-pendientes-pago') {
              // Construir la cadena para los meses pagados
              const paidMonths = [];
              // Iterar a través de las cuotas hasta el numeroCuotas definido para el servicio
              const numCuotas = item.numeroCuotas || 12; // Usar numeroCuotas o un fallback (ej. 12)
              for (let i = 1; i <= numCuotas; i++) {
                if (item[`pago${i}_pagado`] === 1) {
                  paidMonths.push(`Cuota ${i}`);
                }
              }
              rowData[formattedColumnaName] = paidMonths.length > 0 ? paidMonths.join(', ') : 'Ninguna';
            }
            else {
              rowData[formattedColumnaName] = item[columnaKey] ?? '';
            }
          });
          return rowData;
        });

        if (data.length === 0) {
          alert("No hay datos para exportar a Excel.");
          return;
        }

        // Crear un libro de trabajo y una hoja de cálculo
        const ws = XLSX.utils.json_to_sheet(data);

        // Opcional: Ajustar anchos de columna (aproximado)
        const wscols = this.encabezados.map(() => ({ wch: 20 })); // Ancho por defecto de 20
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.formatearTitulo(this.tipoSeleccionado));

        // Generar el archivo y descargarlo
        XLSX.writeFile(wb, `${this.formatearTitulo(this.tipoSeleccionado)}.xlsx`);

      } catch (error) {
        console.error("Error al exportar a Excel:", error);
        alert("Ocurrió un error al exportar a Excel.");
      }
    },

    async iniciarEdicion(filaIndex, columna, valor) {
      // Verificar si la columna es editable
      if (this.tipoSeleccionado === 'contratos-pendientes-renovacion' ||
          this.tipoSeleccionado === 'puntos-suministro-sin-contrato') {
        await Swal.fire({
          icon: 'warning',
          title: 'Edición no permitida',
          text: 'La edición en línea no está disponible para este tipo de informe.',
          confirmButtonColor: '#3085d6'
        });
        return;
      }

      // Para 'servicios-pendientes-pago', solo 'estadoPago' debe ser editable a través de input de texto
      if (this.tipoSeleccionado === 'servicios-pendientes-pago') {
        // La columna 'pagos' se maneja con el nuevo diseño de indicadores, no con edición de texto en línea.
        // Por lo tanto, solo 'estadoPago' es elegible para la edición de texto en línea.
        if (columna !== 'estadoPago') {
          await Swal.fire({
            icon: 'warning',
            title: 'Columna no editable',
            text: 'Solo la columna "Estado Pago" puede ser editada directamente en este informe.',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
      }

      // Mostrar confirmación antes de editar
      const result = await Swal.fire({
        title: '¿Editar registro?',
        text: '¿Está seguro que desea editar este registro?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, editar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) {
        return;
      }

      this.celdaEditando = { filaIndex, columna };
      
      // Si es importeTotal, usar el valor sin formato para edición
      if (columna === 'importeTotal' && this.tipoSeleccionado === 'servicios-pendientes-pago') {
        this.valorEditando = valor; // valor numérico original
      } else {
        this.valorEditando = valor;
      }
      
      this.valorOriginal = valor;

      // Enfocar el input después de que se renderice
      this.$nextTick(() => {
        if (this.$refs.editInput) {
          this.$refs.editInput[0].focus();
        }
      });
    },

    esCeldaEditando(filaIndex, columna) {
      return this.celdaEditando && 
             this.celdaEditando.filaIndex === filaIndex && 
             this.celdaEditando.columna === columna;
    },

    async guardarEdicion(filaIndex, columna) {
      if (this.isSaving) return;
      if (this.valorEditando === this.valorOriginal) {
        this.cancelarEdicion();
        return;
      }
      this.isSaving = true;
      try {
        const fila = this.paginatedData[filaIndex];
        let datosActualizados = {};
        let idRegistro = null;
        switch(this.tipoSeleccionado) {
          case 'contratos-pendientes-renovacion':
            idRegistro = fila.codigoContrato || fila.id || fila.idContrato;
            datosActualizados = {
              codigoContrato: fila.codigoContrato,
              fechaInicio: fila.fechaInicio,
              fechaFin: fila.fechaFin,
              cliente: fila.cliente,
              cupsLuz: fila.cupsLuz,
              cupsGas: fila.cupsGas,
              contrato: fila.contrato,
              tarifaLuz: fila.tarifaLuz,
              tarifaGas: fila.tarifaGas,
              comercializadoraActual: fila.comercializadoraActual,
              [columna]: this.valorEditando
            };
            break;
          case 'puntos-suministro-sin-contrato':
            idRegistro = fila.idPS || fila.id || fila.idPuntoSuministro;
            datosActualizados = {
              idPS: fila.idPS,
              cliente: fila.cliente,
              direccion: fila.direccion,
              codigoPostal: fila.codigoPostal,
              poblacion: fila.poblacion,
              provincia: fila.provincia,
              cupsLuz: fila.cupsLuz,
              cupsGas: fila.cupsGas,
              [columna]: this.valorEditando
            };
            break;
          case 'servicios-pendientes-pago':
            idRegistro = fila.idServicio || fila.id;
            datosActualizados = {
              idServicio: fila.idServicio,
              cliente: fila.cliente,
              servicio: fila.servicio,
              fechaVencimiento: fila.fechaVencimiento,
              importeTotal: fila.importeTotal,
              // No enviar 'pagos' como tal, ya que se gestiona con onPagoClick
              estadoVencimiento: fila.estadoVencimiento,
              estadoPago: fila.estadoPago,
              [columna]: this.valorEditando
            };
            break;
        }
        if (!idRegistro) {
          throw new Error('No se encontró el identificador del registro.');
        }
        const respuesta = await axios.put(
          `${process.env.VUE_APP_API_URL}/api/informes/${this.tipoSeleccionado}/actualizar/${idRegistro}`,
          datosActualizados,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (respuesta.data.success) {
          this.datosInforme = this.datosInforme.map((item, idx) => 
            idx === filaIndex ? { ...item, [columna]: this.valorEditando } : item
          );
          await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Registro actualizado correctamente',
            confirmButtonColor: '#3085d6'
          });
        } else {
          throw new Error(respuesta.data.message || 'Error al actualizar');
        }
      } catch (error) {
        console.error('Error al guardar:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Error al guardar los cambios',
          confirmButtonColor: '#3085d6'
        });
        this.valorEditando = this.valorOriginal;
      } finally {
        this.isSaving = false;
        this.cancelarEdicion();
      }
    },

    cancelarEdicion() {
      this.celdaEditando = null;
      this.valorEditando = '';
      this.valorOriginal = '';
    },
  }
};
</script>

<style scoped>
/* Estilos existentes mantenidos... */
.informes-container {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 20px;
  padding: 20px;
  width: 100%;
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
  gap: 20px;
}

.stats-container {
  display: flex;
  gap: 20px;
}

.stat-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  min-width: 220px;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: var(--primary-light);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Panel de informes */
.info-panel {
  padding: 0;
  overflow: hidden;
}

.panel-header {
  background-color: var(--primary-color);
  color: white;
  padding: 15px 20px;
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

/* Panel de tabla */
.table-panel {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.table-header {
  background-color: var(--surface-color);
  color: var(--text-primary);
  padding: 15px 20px;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
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

.table-responsive {
  overflow-x: hidden;
  width: 100%;
}

/* Estilos para los filtros y ordenamiento */
.column-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-title {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.column-text {
  margin-right: 8px;
}

.column-title:hover {
  background-color: var(--hover-color);
}

.column-filter-container {
  position: relative;
}

.column-filter {
  width: 100%;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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
  flex-wrap: wrap;
  gap: 15px;
}

.records-per-page {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: white;
  padding: 8px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

.data-table th {
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-weight: 600;
  padding: 8px 10px;
  text-align: left;
  border-bottom: 2px solid var(--border-color);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: 100px;
}

.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
  height: auto;
  white-space: normal;
  word-break: break-word;
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

/* Estilos para el botón de exportar Excel */
.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-excel {
  background-color: #217346 !important;
  color: white !important;
  border: none !important;
}

.btn-excel:hover {
  background-color: #1e6b3d !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(33, 115, 70, 0.2) !important;
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
  cursor: text;
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
  white-space: nowrap;
  display: block;
  padding-right: 20px;
}

/* Estilos para la edición inline */
.cell-edit {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.edit-input {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  font-size: inherit;
  font-family: inherit;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.edit-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.2);
}

/* Indicador visual de celda editable */
.table-cell:hover {
  background-color: var(--hover-color);
}

.table-cell:hover::after {
  content: 'Doble clic para editar';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1000;
}

.table-cell:hover::after {
  opacity: 1;
}

/* Ajustes para la tabla responsiva */
.table-responsive {
  overflow-x: hidden;
  width: 100%;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 0;
}

/* Ajuste para columnas específicas que necesitan más espacio */
.data-table th[data-column="cliente"],
.data-table td[data-column="cliente"] {
  min-width: 200px;
}

.data-table th[data-column="direccion"],
.data-table td[data-column="direccion"] {
  min-width: 250px;
}

.data-table th[data-column="cupsLuz"],
.data-table td[data-column="cupsLuz"],
.data-table th[data-column="cupsGas"],
.data-table td[data-column="cupsGas"] {
  min-width: 150px;
}

/* Ajuste para columnas que pueden ser más estrechas */
.data-table th[data-column="fechaInicio"],
.data-table td[data-column="fechaInicio"],
.data-table th[data-column="fechaFin"],
.data-table td[data-column="fechaFin"],
.data-table th[data-column="importe"],
.data-table td[data-column="importe"] {
  min-width: 100px;
}

/* NUEVOS ESTILOS PARA EL GESTOR DE PAGOS INNOVADOR */
.pagos-simple-display {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  height: 100%;
}

.btn-mark-paid {
  background-color: var(--primary-color);
  color: black;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-mark-paid:hover:not(:disabled) {
  background-color: var(--primary-dark, #e0a800);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(var(--primary-color-rgb), 0.2);
}

.btn-mark-paid:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--background-color);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

/* RE-ADJUSTADO Ajuste específico para la columna de pagos */
.data-table th[data-column="pagos"],
.data-table td[data-column="pagos"] {
  min-width: 220px; /* Aumentar el ancho para el nuevo botón */
  max-width: 300px;
  position: relative;
}

.data-table td[data-column="pagos"] {
  overflow: hidden !important; /* Volver a ocultar, ya no hay panel */
  text-align: center; /* Centrar el contenido */
}

/* Mejora visual para estados de hover en la tabla */
.data-table tbody tr:hover {
  background-color: rgba(var(--primary-color-rgb), 0.05); /* Color primario con transparencia */
}
</style>