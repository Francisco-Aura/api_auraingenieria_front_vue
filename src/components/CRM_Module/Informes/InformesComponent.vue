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
        </div>
      </div>
    </div>

    <!-- Tabla de datos (solo se muestra si se elige ver en pantalla) -->
    <div v-if="mostrarTabla && datosInforme.length > 0" class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-table"></i> {{ tituloInforme }}</h2>
        <div class="table-actions">
          <button class="btn btn-outline" @click="crearPDF(datosInforme, tipoSeleccionado)" title="Exportar a PDF">
            <i class="fas fa-file-pdf"></i> Exportar PDF
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="columna in encabezados" :key="columna">
                <i class="fas fa-sort mr-2"></i>{{ columna }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, index) in datosInforme" :key="index">
              <td v-for="columna in encabezados" :key="columna">{{ fila[columna] ?? '' }}</td>
            </tr>
          </tbody>
        </table>
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

export default {
  data() {
    return {
      mostrarModal: false, // Control de visibilidad del modal
      mostrarTabla: false, // Control de visibilidad de la tabla
      datosInforme: [], // Almacena los datos del informe para la tabla
      encabezados: [], // Encabezados de la tabla
      tipoSeleccionado: "", // Guarda el tipo de informe seleccionado
      tituloInforme: "" // Almacena el título del informe para la tabla
    };
  },
  methods: {
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
          // Filtra las columnas según el tipo de informe
          this.procesarDatosParaTabla(respuesta.data);
          this.tituloInforme = this.formatearTitulo(this.tipoSeleccionado);
          this.mostrarTabla = true;
        }
      } catch (error) {
        console.error("Error al obtener el informe", error);
      }
    },

    // Filtra los datos para la tabla en pantalla
    procesarDatosParaTabla(datos) {
      const columnasPermitidas = {
        "contratos-pendientes-renovacion": [
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", 
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraActual"
        ],
        "puntos-suministro-sin-contrato": [
          "cliente", "direccion", "codigoPostal", "poblacion", "provincia", "cupsLuz", "cupsGas"
        ] 
      };

      if (columnasPermitidas[this.tipoSeleccionado]) {
        this.datosInforme = datos.map(item =>
          Object.fromEntries(
            Object.entries(item).filter(([key]) => columnasPermitidas[this.tipoSeleccionado].includes(key))
          )
        );
        this.encabezados = columnasPermitidas[this.tipoSeleccionado];
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
          columnasPermitidas[tipo].map(col => item[col] ?? "")
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
    }
  }
};
</script>

<style scoped>
/* Grid layout para el contenedor principal */
.informes-container {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 20px;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
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
  padding: 0;
  overflow: hidden;
}

.table-header {
  background-color: white;
  color: white;
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
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.table-actions .btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
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
</style>
