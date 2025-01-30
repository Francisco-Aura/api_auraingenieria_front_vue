<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Puntos de Suministro del Cliente: {{ cliente?.nombre || "Desconocido" }}</h2>
      <input
        type="text"
        placeholder="Buscar en puntos de suministro..."
        v-model="filterPuntos"
        class="filter-input full-width"
      />
      <table v-if="puntosSuministro.length > 0" class="puntos-suministro-table">
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
      const filtro = this.normalizeText(this.filterPuntos);
      return this.puntosSuministro.filter((punto) => {
        const concatenated = [
          punto.direccion || '',
          punto.codigoPostal || '',
          punto.poblacion || '',
          punto.provincia || '',
          punto.cupsluz || '',
          punto.cupsgas || ''
        ].join(' ').toLowerCase();
        return this.normalizeText(concatenated).includes(filtro);
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
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    verDetallePunto(punto) {
      console.log("Detalle del punto:", punto);
    },
  },
};
</script>

<style scoped>

.modal-overlay {
  position: fixed; /* Fijar en la pantalla */
  top: 0;
  left: 12.5%;
  width: 90vw;
  height: 125vh;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo oscuro translúcido */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Asegurar que esté por encima de todo */
}

.modal-content {
  min-width: 100%;
  min-height: 100%;  
  background: rgb(219, 219, 219);
  padding: 20px;
  border-radius: 10px;
  max-width: 80vw; /* Para que no sea demasiado grande en pantallas grandes */
  max-height: 80vh; /* Limitar altura para evitar que sobresalga */
  overflow-y: auto; /* Permitir scroll si el contenido es muy grande */
}

/* =============================== */
/*        Estilos de Botones        */
/* =============================== */
.btn {
  padding: 0.4rem 0.8rem;
  margin: 0.2rem;
  cursor: pointer;
  border: none;
  font-size: 1rem;
  color: #f5c600;
  background-color: #333;
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
}

/* Estilo de los botones al pasar el ratón */
.btn:hover {
  background-color: #f5c600;
  color: #333;
}

/* Botones con estilo "ojo" */
.btn-ojo {
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  color: #f5c600;
  cursor: pointer;
}
/* Efecto hover para los botones "ojo" */
.btn-ojo:hover {
  color: #333;
  background-color: transparent;
}

/*TABLAS*/
table {
  width: 100%;
  border-collapse: collapse;
}

table th, table td {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
}

table th {
  background-color: #333;
  color: #f5c600;
}

table tr:nth-child(even) {
  background-color: #f2f2f2;
}

table tr:hover {
  background-color: #eaeaea;
}
/*///////////////////////////////////*/
label {
  margin-top: 1rem;
  display: block;
  font-weight: bold;
}

input[type="text"] {
  font-size: 0.9rem;
}

input:focus {
  outline: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
</style>