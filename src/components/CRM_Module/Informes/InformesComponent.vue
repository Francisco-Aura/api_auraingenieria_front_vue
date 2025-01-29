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
        const doc = new jsPDF();
        doc.text(`Informe: ${tipo.replace(/-/g, ' ')}`, 10, 10);
        
        let y = 20;
        datos.forEach((item, index) => {
          doc.text(`${index + 1}. ${JSON.stringify(item)}`, 10, y);
          y += 10;
        });
        
        const pdfBlob = doc.output("blob");
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, "_blank");
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
  