<template>
  <div class="suministro-container">
    <!-- Título principal de la página -->
    <h2>Puntos de Suministro</h2>

    <!-- Contenedor del filtro -->
    <div class="filter-container">
      <!-- Campo de entrada para buscar puntos de suministro -->
      <input
        type="text"        
        v-model="filter" 
        placeholder="Buscar Punto Suministro..."
        class="filter-input" 
      />
    </div>

    <!-- Tabla para mostrar los puntos de suministro -->
    <table class="suministro-table">
      <thead>
        <!-- Cabecera de la tabla con las columnas -->
        <tr>
          <th>Cliente</th> <!-- Nombre del cliente -->
          <th>Dirección</th> <!-- Dirección del punto de suministro -->
          <th>Cups Luz</th> <!-- Código del suministro eléctrico -->
          <th>Cups Gas</th> <!-- Código del suministro de gas -->
          <th>Acciones</th> <!-- Acciones que el usuario puede realizar -->
        </tr>
      </thead>
      <tbody>
        <!-- Iteración sobre los puntos de suministro filtrados -->
        <tr
          v-for="suministro in filteredPuntosSuministro"
          :key="suministro.id" 
        >
          <!-- Nombre del cliente -->
          <td>{{ suministro.cliente }}</td>
          <!-- Dirección detallada del suministro -->
          <td>
            {{ suministro.direccion }}, {{ suministro.codigoPostal }}, 
            {{ suministro.poblacion }}, {{ suministro.provincia }}
          </td>
          <!-- Código de suministro de luz -->
          <td>{{ suministro.cupsluz }}</td>
          <!-- Código de suministro de gas -->
          <td>{{ suministro.cupsgas }}</td>
          <!-- Botones para realizar acciones (sin funcionalidad implementada) -->
          <td>
            <button class="btn btn-modPS">Modificar PS</button>
            <button class="btn btn-crearContrato">Contrato</button>
            <button class="btn btn-crearServicio">Servicio</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios'; // Importación de Axios para realizar solicitudes HTTP

export default {
  name: 'PuntosSuministro', // Nombre del componente
  data() {
    return {
      puntosSuministro: [], // Lista de puntos de suministro obtenidos desde la API
      filter: '', // Campo de texto para aplicar un filtro
    };
  },
  computed: {
    // Propiedad computada para filtrar los puntos de suministro
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) =>
        // Comprueba si algún valor del objeto contiene el texto del filtro
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
    },
  },
  created() {
    // Llama al método para obtener los puntos de suministro al crear el componente
    this.fetchPuntosSuministro();
  },
  methods: {
    // Método para obtener la lista de puntos de suministro desde la API
    async fetchPuntosSuministro() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`
        ); // URL de la API para obtener los datos
        this.puntosSuministro = response.data; // Asigna los datos a la lista
      } catch (error) {
        console.error('Error al cargar los puntos de suministro:', error); // Manejo de errores
      }
    },
  },
};
</script>
