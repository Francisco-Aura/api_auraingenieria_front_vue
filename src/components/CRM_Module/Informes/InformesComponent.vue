<template>
    <div class="informes-container">
      <h2>Informes</h2>
      <div class="botones-informes">
        <button @click="generarInforme('contratos-pendientes-renovacion')">Contratos Pendientes de Renovación</button>
        <button @click="generarInforme('puntos-suministro-sin-contrato')">Puntos de Suministro sin Contrato</button>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import { jsPDF } from "jspdf";
  import autoTable from "jspdf-autotable";
  
  export default {
    methods: {
      async generarInforme(tipo) {
        try {
          const respuesta = await axios.get(`${process.env.VUE_APP_API_URL}/api/informes/${tipo}`);
          this.crearPDF(respuesta.data, tipo);
        } catch (error) {
          console.error("Error al obtener el informe", error);
        }
      },
      crearPDF(datos, tipo) {
        // Crear documento en horizontal (landscape) y tamaño A4
        const doc = new jsPDF({ orientation: "landscape", format: "a1" });

        // Título del informe
        doc.setFontSize(16);
        doc.text(`Informe: ${tipo.replace(/-/g, ' ')}`, 14, 10);
        
        // Extraer claves para los encabezados
        const encabezados = Object.keys(datos[0]).map(key => key.toUpperCase());

        // Convertir los datos en formato tabla
        const filas = datos.map(item => Object.values(item));

        // Generar tabla con ajuste automático de ancho
        autoTable(doc, {
          head: [encabezados],
          body: filas,
          startY: 20,
          theme: "striped",
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 240, 240] },
          columnStyles: { 0: { cellWidth: 'auto' } }, // Ajusta automáticamente el ancho de las columnas
          margin: { top: 15, left: 10, right: 10 }, // Márgenes ajustados
        });

        // Descargar el PDF o abrirlo en una nueva pestaña
        doc.save(`${tipo}.pdf`);
      }
    }    
  };
  </script>
  
  <style scoped>
  .informes-container {
    text-align: center;
    padding: 20px;
  }
  .botones-informes button {
    margin: 10px;
    padding: 10px;
    font-size: 16px;
    cursor: pointer;
  }
  </style>
  