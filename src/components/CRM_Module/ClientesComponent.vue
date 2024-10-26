<template>
  <div class="clientes-container">
    <h1 class="header">Gestión de Clientes</h1>    

    <!-- Botón para abrir el formulario de crear cliente -->
    <button class="btn btn-crear" @click="openCreateModal">Crear Cliente</button>

    <!-- Tabla de clientes -->
    <table class="clientes-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>CIF</th>
          <th>Dirección</th>
          <th>Población</th>
          <th>Provincia</th>
          <th>Contacto</th>
          <th>Teléfono</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cliente in clientes" :key="cliente.id">
          <td>{{ cliente.id }}</td>
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.cif }}</td>
          <td>{{ cliente.direccion }}</td>
          <td>{{ cliente.poblacion }}</td>
          <td>{{ cliente.provincia }}</td>
          <td>{{ cliente.nombreContacto }}</td>
          <td>{{ cliente.telefonoContacto }}</td>
          <td>
            <button class="btn btn-editar" @click="openEditModal(cliente)">Editar</button>
            <button class="btn btn-eliminar" @click="deleteCliente(cliente.id)">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

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
          <button @click="saveCliente" class="btn btn-guardar">Guardar</button>
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
      editingCliente: false,
      selectedCliente: {
        id: null,
        nombre: '',
        cif: '',
        direccion: '',
        poblacion: '',
        provincia: '',
        nombreContacto: '',
        telefonoContacto: '',
      },
    };
  },
  methods: {
    async fetchClientes() {
      try {
        const response = await axios.get('/api/clientes');
        this.clientes = response.data;
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      }
    },
    openCreateModal() {
      this.isModalOpen = true;
      this.editingCliente = false;
      this.selectedCliente = {
        id: null,
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
    async saveCliente() {
      try {
        if (this.editingCliente) {
          await axios.put(`/api/clientes/${this.selectedCliente.id}`, this.selectedCliente);
        } else {
          await axios.post('/api/clientes', this.selectedCliente);
        }
        this.fetchClientes();
        this.closeModal();
      } catch (error) {
        console.error('Error al guardar el cliente:', error);
      }
    },
    async deleteCliente(id) {
      try {
        await axios.delete(`/api/clientes/${id}`);
        this.fetchClientes();
      } catch (error) {
        console.error('Error al eliminar el cliente:', error);
      }
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
.clientes-container {
  padding: 1.5rem;
  color: #333;
}

.header {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333333;
}

.subheader {
  margin-bottom: 1rem;
  font-size: 1rem;
  color: #555555;
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
  color: white;
  border-radius: 4px;
}

.btn-crear {
  background-color: #f5c600;
  color: #333;
}

.btn-editar {
  background-color: #5b9bd5;
}

.btn-eliminar {
  background-color: #d9534f;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-guardar {
  background-color: #4CAF50;
}

.btn-cancelar {
  background-color: #f5c600;
  color: #333;
}
</style>
