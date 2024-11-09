<template>
  <div class="suministro-container">
    <h2>Puntos de Suministro</h2>
    <div class="filter-container">
      <input
        type="text"
        v-model="filter"
        placeholder="Buscar Punto Suministro..."
        class="filter-input"
      />
    </div>
    <table class="suministro-table">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Dirección</th>
          <th>Cups Luz</th>
          <th>Cups Gas</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="suministro in filteredPuntosSuministro"
          :key="suministro.id"
        >
          <td>{{ suministro.cliente }}</td>
          <td>
            {{ suministro.direccion }}, {{ suministro.codigoPostal }}, {{
            suministro.poblacion }}, {{ suministro.provincia }}
          </td>
          <td>{{ suministro.cupsluz }}</td>
          <td>{{ suministro.cupsgas }}</td>
          <td>
            <button class="btn" @click="consultaContrato(cliente)">Contrato</button>
            <button class="btn" @click="consultaServicio(cliente)">Servicio</button>
            <button class="btn" @click="modificarSuministro(cliente.idCliente)">Modificar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PuntosSuministro',
  data() {
    return {
      puntosSuministro: [],
      filter: '' // Campo para filtrar los datos
    };
  },
  computed: {
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) =>
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
    }
  },
  created() {
    this.fetchPuntosSuministro();
  },
  methods: {
    async fetchPuntosSuministro() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`
        );
        this.puntosSuministro = response.data;
      } catch (error) {
        console.error('Error al cargar los puntos de suministro:', error);
      }
    }
  }
};
</script>

<style scoped>
/* Escala la aplicación completa al 75% */
body {
  transform: scale(0.75);
  transform-origin: top left;
  width: 133.33%; /* Compensa el escalado al 75% */
  overflow-x: hidden; /* Evita scroll horizontal */
}

.suministro-container {
  padding: 1.5rem;
  color: #333;
}

.filter-container {
  margin-bottom: 1rem;
}

.filter-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1em;
}

.suministro-table {
  width: 100%;
  border-collapse: collapse;
}

.suministro-table th,
.suministro-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.suministro-table th {
  background-color: #333;
  color: #f5c600;
}

.suministro-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.suministro-table tr:hover {
  background-color: #eaeaea;
}

.btn {
  padding: 0.4rem 0.8rem;
  margin: 0.2rem;
  cursor: pointer;
  border: none;
  font-size: 0.9rem;
  color: #f5c600;
  border-radius: 4px;
  background-color: #333;
}
</style>
