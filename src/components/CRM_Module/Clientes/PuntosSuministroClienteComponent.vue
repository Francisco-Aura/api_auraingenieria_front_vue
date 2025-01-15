<template>
    <div class="modal-overlay">
      <div v-if="isModalPuntosOpen" class="modal-content">
        <h2>Puntos de Suministro del Cliente: {{ cliente?.nombre || "Desconocido" }}</h2>
  
        <input
          type="text"
          placeholder="Buscar en puntos de suministro..."
          v-model="filterPuntos"
          class="filter-input full-width"
        />
        <table  v-if="puntosSuministro.length > 0" class="puntos-suministro-table">
          <thead>
            <tr>
              <th>Dirección</th>
              <th>CUPS Luz</th>
              <th>CUPS Gas</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="punto in filteredPuntosSuministro" :key="punto.idPunto">
              <td>{{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}</td>
              <td>{{ punto.cupsluz }}</td>
              <td>{{ punto.cupsgas }}</td>
              <td>
                <button class="btn btn-detalle" @click="verDetallePunto(punto)">Detalle</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else>No hay puntos de suministro para mostrar.</p>
        <button @click="$emit('cerrar-modal')" class="btn btn-cancelar">Cerrar</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "PuntosSuministroClienteComponent",
    props: {
      cliente: {
        type: Object,
        required: true,
        default: () => ({}),
      },
      puntosSuministro: {
        type: Array,
        required: true,
        default: () => [],
      },
    },
    data() {
      return {
        filterPuntos: "",
      };
    },
    computed: {
        filteredPuntosSuministro() {
            const filtro = this.normalizeText(this.filterPuntos); // Normalizamos el texto del filtro
            return this.puntosSuministro.filter((punto) => {
                // Concatenamos todas las propiedades de los puntos de suministro que queremos filtrar
                const concatenated = [
                punto.direccion || '',
                punto.codigoPostal || '',
                punto.poblacion || '',
                punto.provincia || '',
                punto.cupsluz || '',
                punto.cupsgas || ''
                ].join(' ').toLowerCase(); // Aseguramos que la concatenación sea una cadena en minúsculas
                return this.normalizeText(concatenated).includes(filtro); // Comparamos el filtro con el texto concatenado
            });
        },
    },
    mounted() {
      console.log("El modal de puntos de suministro se ha montado en el DOM.");
      console.log("Cliente recibido en modal:", this.cliente);
      console.log("Puntos de suministro recibidos:", this.puntosSuministro);
    },
    methods: {
        normalizeText(text) {
            if (!text) return "";
            return text
            .toString()
            .normalize("NFD") // Descompone caracteres con diacríticos
            .replace(/[\u0300-\u036f]/g, "") // Elimina los diacríticos
            .toLowerCase(); // Convierte el texto a minúsculas
        },
        verDetallePunto(punto) {
            console.log("Detalle del punto:", punto);
            // Implementar lógica de detalle
        },
    },
  };
  </script>
  
  <style scoped>
    .modal-overlay {
      display: block !important;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }

    .modal-content {
      display: block !important;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
    }


  </style>
  