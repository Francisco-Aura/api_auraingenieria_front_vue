<template>
  <div class="informes-container">
    <h2>Informes</h2>

    <!-- Botones para generar informes -->
    <div class="botones-informes">
      <button @click="preguntarModo('contratos-pendientes-renovacion')">Contratos Pendientes de Renovación</button>
      <button @click="preguntarModo('puntos-suministro-sin-contrato')">Puntos de Suministro sin Contrato</button>
    </div>

    <!-- Modal para seleccionar modo de visualización -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <h3>¿Cómo quieres ver el informe?</h3>
        <button @click="generarInforme('pdf')">📄 Generar PDF</button>
        <button @click="generarInforme('pantalla')">🖥️ Ver en Pantalla</button>
        <button @click="cerrarModal">❌ Cancelar</button>
      </div>
    </div>

    <!-- Tabla de datos (solo se muestra si se elige ver en pantalla) -->
    <div v-if="mostrarTabla && datosInforme.length > 0" class="tabla-container">
      <h3>Datos del Informe: {{ tituloInforme }}</h3>
      <table>
        <thead>
          <tr>
            <th v-for="columna in encabezados" :key="columna">{{ columna }}</th>
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
          this.tituloInforme = this.tipoSeleccionado.replace(/-/g, ' ');
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
        this.encabezados = columnasPermitidas[this.tipoSeleccionado]; // No usar .toUpperCase()
      } else {
        this.datosInforme = datos;
        this.encabezados = Object.keys(datos[0]).map(key => key.toUpperCase());
      }
    },

    // Genera el PDF del informe con las columnas específicas
    crearPDF(datos, tipo) {
      const columnasPermitidas = {
        "contratos-pendientes-renovacion": [
          "fechaInicio", "fechaFin", "cliente", "cupsLuz", "cupsGas", 
          "contrato", "tarifaLuz", "tarifaGas", "comercializadoraAnterior", "comercializadoraActual"
        ],
        "puntos-suministro-sin-contrato": [
          "cliente", "direccion", "codigoPostal", "poblacion", "provincia", "cupsLuz", "cupsGas"
        ]
      };

      const doc = new jsPDF({ orientation: "landscape", format: "a1" });

      doc.setFontSize(16);
      doc.text(`Informe: ${tipo.replace(/-/g, ' ')}`, 14, 10);

      let encabezados, filas;
      if (columnasPermitidas[tipo]) {
        encabezados = columnasPermitidas[tipo].map(col => col.toUpperCase());
        filas = datos.map(item =>
          columnasPermitidas[tipo].map(col => item[col] ?? "")
        );
      } else {
        encabezados = Object.keys(datos[0]).map(key => key.toUpperCase());
        filas = datos.map(item => Object.values(item));
      }

      autoTable(doc, {
        head: [encabezados],
        body: filas,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        columnStyles: { 0: { cellWidth: 'auto' } },
        margin: { top: 15, left: 10, right: 10 },
      });

      doc.save(`${tipo}.pdf`);
    }
  }
};
</script>

<style scoped>
/* =============================== */
/*        Contenedor General        */
/* =============================== */
.informes-container {
  text-align: center;
  padding: 20px;
}

/* =============================== */
/*        Botones de Informes       */
/* =============================== */
.botones-informes button {
  margin: 10px;
  padding: 12px 16px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  background-color: #333;
  color: #f5c600;
  border-radius: 5px;
  transition: background 0.3s, color 0.3s;
}

.botones-informes button:hover {
  background-color: #f5c600;
  color: #333;
}

/* =============================== */
/*        Modal de Selección        */
/* =============================== */
/*
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
*/
.modal-content button {
  display: block;
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  font-size: 16px;
  cursor: pointer;
}

/* =============================== */
/*        Tabla de Informes         */
/* =============================== */
.tabla-container {
  margin-top: 20px;
  padding: 10px;
}
</style>
