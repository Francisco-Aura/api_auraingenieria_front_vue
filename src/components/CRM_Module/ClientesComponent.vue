<template>
  <div class="clientes-container">
    <!-- Filtro para localizar clientes -->
    <div class="filter-container">
      <input
        type="text"
        placeholder="Buscar cliente..."
        v-model="filter"
        class="filter-input"
      />
      <button class="btn btn-crear" @click="openCreateModal">Crear Cliente</button>
    </div>

    <!-- Tabla de clientes -->
    <table class="clientes-table">
      <thead>
        <tr>
          <th>Nombre Cliente</th>
          <th>CIF</th>
          <th>Dirección Fiscal</th>
          <th>PS</th>
          <th>Empleado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in filteredClientes" :key="cliente.idCliente">
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.cif }}</td>
          <td>{{ cliente.direccionFiscal }}</td>
          <td>
            {{ cliente.totalPuntosSuministro }}
            <button class="btn btn-ojo" @click="verPuntosSuministro(cliente)">👁️</button>
          </td>
          <td>{{ cliente.empleado }}</td>
          <td>
            <button class="btn btn-consultar" @click="consultarCliente(cliente)">Consultar</button>
            <button class="btn btn-editar" @click="openEditModal(cliente)">Modificar</button>
            <button class="btn btn-darBaja" @click="darBajaCliente(cliente.idCliente)">Dar de Baja</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de Puntos de Suministro -->
    <div v-if="isModalPuntosOpen" class="modal">
      <div class="modal-content">
        <h2>Puntos de Suministro del Cliente {{ clienteSeleccionado?.nombre || '' }}</h2>
        <!-- Filtro para los puntos de suministro -->
        <input
          type="text"
          placeholder="Buscar en puntos de suministro..."
          v-model="filterPuntos"
          class="filter-input full-width"
        />
        <table class="puntos-suministro-table">
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
        <button @click="closeModalPuntos" class="btn btn-cancelar">Cerrar</button>
      </div>
    </div>

    <!-- Modal para Crear/Editar Cliente -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <h2>{{ editingCliente ? 'Editar Cliente' : 'Crear Cliente' }}</h2>

        <label>Nombre:</label>
        <input type="text" v-model="selectedCliente.nombre" />

        <label>CIF:</label>
        <input type="text" v-model="selectedCliente.cif" />

        <label>Dirección:</label>
        <input type="text" v-model="selectedCliente.direccion" />

        <label>Población:</label>
        <input type="text" v-model="selectedCliente.poblacion" />

        <label>Provincia:</label>
        <input type="text" v-model="selectedCliente.provincia" />

        <label>Contacto:</label>
        <input type="text" v-model="selectedCliente.nombreContacto" />

        <label>Teléfono:</label>
        <input type="text" v-model="selectedCliente.telefonoContacto" />

        <div class="modal-actions">
          <button @click="saveCliente" class="btn btn-guardar">Actualizar</button>
          <button @click="closeModal" class="btn btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ClientesComponent',
  data() {
    return {
      clientes: [],
      isModalOpen: false,
      isModalPuntosOpen: false, // Variable para abrir el modal de puntos de suministro
      editingCliente: false,
      clienteSeleccionado: null,
      selectedCliente: {
        idCliente: null,
        nombre: '',
        cif: '',
        direccion: '',
        poblacion: '',
        provincia: '',
        nombreContacto: '',
        telefonoContacto: '',
      },
      filter: '',
      filterPuntos: '', // Variable para el filtro de puntos de suministro
      puntosSuministro: [], // Lista de puntos de suministro
    };
  },
  computed: {
    filteredClientes() {
      return this.clientes
        .map((cliente) => ({
          ...cliente,
          direccionFiscal: `${cliente.direccionFiscal}`,
          totalPuntosSuministro: cliente.numeroPuntosSuministro || 0,
          empleado: cliente.idEmpleado,
        }))
        .filter((cliente) => {
          return (
            cliente.nombre.toLowerCase().includes(this.filter.toLowerCase()) ||
            cliente.cif.toLowerCase().includes(this.filter.toLowerCase())
          );
        });
    },
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((punto) =>
        Object.values(punto)
          .join(' ')
          .toLowerCase()
          .includes(this.filterPuntos.toLowerCase())
      );
    },
  },
  methods: {
    async fetchClientes() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        this.clientes = response.data;
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      }
    },
    verPuntosSuministro(cliente) {
      axios
        .get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${cliente.idCliente}`)
        .then((response) => {
          this.puntosSuministro = response.data;
          this.clienteSeleccionado = cliente; // Guardar el cliente seleccionado
          this.isModalPuntosOpen = true; // Abre el modal de puntos de suministro
        })
        .catch((error) => {
          console.error('Error al obtener los puntos de suministro:', error);
        });
    },
    closeModalPuntos() {
      this.isModalPuntosOpen = false; // Cierra el modal de puntos de suministro
    },
    verDetallePunto(punto) {
      console.log('Ver detalle del punto de suministro:', punto);
      // Aquí podrías agregar la lógica para mostrar más detalles
    },
    openCreateModal() {
      this.isModalOpen = true;
      this.editingCliente = false;
      this.selectedCliente = {
        idCliente: null,
        nombre: '',
        cif: '',
        direccion: '',
        poblacion: '',
        provincia: '',
        nombreContacto: '',
        telefonoContacto: '',
      };
    },
    openEditModal(cliente) {
      this.isModalOpen = true;
      this.editingCliente = true;
      this.selectedCliente = { ...cliente };
    },
    consultarCliente(cliente) {
      console.log('Consultando cliente:', cliente);
    },
    async saveCliente() {
      try {
        let response;
        if (this.editingCliente) {
          response = await axios.put(`/cliente/${this.selectedCliente.idCliente}`, this.selectedCliente);
        } else {
          response = await axios.post('/cliente', this.selectedCliente);
        }
        alert(response.data.mensaje);
        this.fetchClientes();
        this.closeModal();
      } catch (error) {
        console.error('Error al guardar el cliente:', error);
      }
    },
    async deleteCliente(idCliente) {
      try {
        const response = await axios.delete(`/cliente/${idCliente}`);
        alert(response.data.mensaje);
        this.fetchClientes();
      } catch (error) {
        console.error('Error al eliminar el cliente:', error);
      }
    },
    darBajaCliente(idCliente) {
      console.log('Dando de baja al cliente con ID:', idCliente);
    },
    closeModal() {
      this.isModalOpen = false;
    },
  },
  mounted() {
    this.fetchClientes();
  },
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

.clientes-container {
  padding: 1.5rem;
  color: #333;
}

.filter-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filter-input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
  margin-right: 1rem;
}

.clientes-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.clientes-table th,
.clientes-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 0.85rem;
}

.clientes-table th {
  background-color: #333;
  color: #f5c600;
}

.clientes-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.clientes-table tr:hover {
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
  transition: background-color 0.3s;
  background-color: #333;
}

.btn-crear {
  background-color: #f5c600;
  color: #333;
}

.btn-editar:hover,
.btn-darBaja:hover {
  background-color: #f5c600;
  color: #333;
}

.btn-cancelar {
  background-color: #f5c600;
  color: #333;
}

.btn-guardar {
  background-color: #4CAF50;
}

.btn-ojo {
  background-color: transparent;
  border: none;
  font-size: 1.2rem;
  color: #f5c600;
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 80%;
  overflow-y: auto;
  width: 80%;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

/* Hace que el campo de búsqueda tenga el mismo ancho que la tabla */
.full-width {
  width: 100%;
  box-sizing: border-box; /* Asegura que los bordes estén dentro del ancho */
  margin-bottom: 1em; /* Espacio debajo del campo de búsqueda */
}

/* Estilos para la tabla de puntos de suministro */
.puntos-suministro-table {
  width: 100%;
  border-collapse: collapse;
}

.puntos-suministro-table th,
.puntos-suministro-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.puntos-suministro-table th {
  background-color: #333;
  color: #f5c600;
}

.puntos-suministro-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.puntos-suministro-table tr:hover {
  background-color: #eaeaea;
}

.btn-detalle {
  background-color: #f5c600;
  color: #333;
  padding: 0.5rem;
  font-size: 0.9rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.btn-detalle:hover {
  background-color: #e0b800;
}
</style>
