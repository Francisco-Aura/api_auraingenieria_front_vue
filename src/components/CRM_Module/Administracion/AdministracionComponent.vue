<template>
  <div class="admin-container fade-in">
    <!-- Panel superior con stats -->
    <div class="stats-panel">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-database"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalRegistros }}</div>
            <div class="stat-label">Total Registros</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-table"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ tablas.length }}</div>
            <div class="stat-label">Tablas</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de búsqueda y filtros -->
    <div class="card filter-panel">
      <div class="filter-header">
        <h2><i class="fas fa-filter"></i> Filtros</h2>
      </div>
      <div class="filter-controls">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            class="form-control search-input"
            placeholder="Buscar en la tabla actual..."
            v-model="filter"
          />
        </div>
      </div>
    </div>

    <!-- Panel de selección de tablas -->
    <div class="card table-panel">
      <div class="table-header">
        <h2><i class="fas fa-database"></i> Tablas del Sistema</h2>
        <div class="table-actions">
          <button v-if="tablaSeleccionada" class="btn btn-primary" @click="nuevoRegistro">
            <i class="fas fa-plus"></i>
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tabla</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tabla in tablas" :key="tabla.nombre" @click="cargarDatos(tabla)">
              <td>
                <div class="table-info">
                  <i :class="['table-icon', tabla.icono]"></i>
                  <span>{{ tabla.nombre }}</span>
                </div>
              </td>
              <td>{{ getDescripcionTabla(tabla.nombre) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click.stop="cargarDatos(tabla)" title="Ver datos">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tabla de datos -->
    <div v-if="tablaSeleccionada" class="card table-panel">
      <div class="table-header">
        <h2><i :class="tablaSeleccionada.icono"></i> {{ tablaSeleccionada.nombre }}</h2>
        <div class="table-actions">
          <button class="btn btn-outline" title="Exportar a Excel">
            <i class="fas fa-file-excel"></i>
          </button>
          <button class="btn btn-outline" title="Exportar a PDF">
            <i class="fas fa-file-pdf"></i>
          </button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columnas" :key="col">{{ col }}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in filteredDatos" :key="fila.id">
              <td v-for="col in columnas" :key="col">{{ fila[col] }}</td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="editarRegistro(fila)" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon" @click="eliminarRegistro(fila.id)" title="Eliminar">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredDatos.length === 0">
              <td :colspan="columnas.length + 1" class="text-center py-4">
                <div class="empty-state">
                  <i class="fas fa-search fa-3x text-muted"></i>
                  <p class="mt-3">No se encontraron registros que coincidan con la búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Formulario de edición/inserción -->
    <div v-if="mostrarFormulario" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar Registro' : `Nuevo Registro en ${tablaSeleccionada.nombre}` }}</h2>
        </div>
        <form @submit.prevent="guardarRegistro" class="scrollable-form">
          <div class="form-container">
            <div v-for="col in columnasFiltradas" :key="col" class="form-group">
              <label :for="col">{{ col }}</label>
              <input 
                :id="col" 
                v-model="registro[col]" 
                class="form-control"
                :required="col !== 'id'"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="mostrarFormulario = false">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdministracionComponent',
  data() {
    return {
      tablas: [
        { nombre: "Comercializadoras", url: `${process.env.VUE_APP_API_URL}/api/comercializadoras`, icono: "fas fa-building" },
        { nombre: "Gestoras", url: `${process.env.VUE_APP_API_URL}/api/gestoras`, icono: "fas fa-briefcase" },
        { nombre: "Métodos de Pago", url: `${process.env.VUE_APP_API_URL}/api/metodos-pago`, icono: "fas fa-credit-card" },
        { nombre: "Niveles de Acceso", url: `${process.env.VUE_APP_API_URL}/api/niveles-acceso`, icono: "fas fa-user-shield" },
        { nombre: "Pago Plazos", url: `${process.env.VUE_APP_API_URL}/api/pagos-plazos`, icono: "fas fa-calendar-check" },
        { nombre: "Productos", url: `${process.env.VUE_APP_API_URL}/api/productos`, icono: "fas fa-box-open" },
        { nombre: "Sectores", url: `${process.env.VUE_APP_API_URL}/api/sectores`, icono: "fas fa-industry" },
        { nombre: "Subtipologías", url: `${process.env.VUE_APP_API_URL}/api/subtipologias`, icono: "fas fa-tags" },
        { nombre: "Tarifas Gas", url: `${process.env.VUE_APP_API_URL}/api/tarifas-gas`, icono: "fas fa-fire" },
        { nombre: "Tarifas Luz", url: `${process.env.VUE_APP_API_URL}/api/tarifasLuz`, icono: "fas fa-bolt" },
        { nombre: "Usuarios", url: `${process.env.VUE_APP_API_URL}/api/usuarios`, icono: "fas fa-users" }
      ],
      tablaSeleccionada: null,
      datos: [],
      columnas: [],
      mostrarFormulario: false,
      registro: {},
      editando: false,
      filter: ""
    };
  },
  computed: {
    columnasFiltradas() {
      return this.columnas.filter(col => col !== "id");
    },
    filteredDatos() {
      if (!this.filter) return this.datos;
      const filtro = this.filter.toLowerCase();
      return this.datos.filter(fila => {
        return Object.values(fila).some(valor => 
          String(valor).toLowerCase().includes(filtro)
        );
      });
    },
    totalRegistros() {
      return this.datos.length;
    }
  },
  methods: {
    getDescripcionTabla(nombre) {
      const descripciones = {
        "Comercializadoras": "Empresas comercializadoras de energía",
        "Gestoras": "Empresas gestoras de servicios",
        "Métodos de Pago": "Formas de pago disponibles",
        "Niveles de Acceso": "Niveles de permisos del sistema",
        "Pago Plazos": "Opciones de pago a plazos",
        "Productos": "Productos y servicios ofertados",
        "Sectores": "Sectores de actividad",
        "Subtipologías": "Clasificaciones de clientes",
        "Tarifas Gas": "Tarifas de gas natural",
        "Tarifas Luz": "Tarifas de energía eléctrica",
        "Usuarios": "Usuarios del sistema"
      };
      return descripciones[nombre] || "";
    },
    async cargarDatos(tabla) {
      this.tablaSeleccionada = tabla;
      this.mostrarFormulario = false;
      try {
        const respuesta = await axios.get(tabla.url);
        this.datos = respuesta.data;
        this.columnas = Object.keys(this.datos[0] || {});
      } catch (error) {
        console.error("Error al cargar datos", error);
      }
    },
    nuevoRegistro() {
      this.registro = {};
      this.mostrarFormulario = true;
      this.editando = false;
    },
    editarRegistro(fila) {
      this.registro = { ...fila };
      this.mostrarFormulario = true;
      this.editando = true;
    },
    async guardarRegistro() {
      try {
        if (this.editando) {
          await axios.put(`${this.tablaSeleccionada.url}/${this.registro.id}`, this.registro);
        } else {
          const respuesta = await axios.post(this.tablaSeleccionada.url, this.registro);
          this.datos.push(respuesta.data);
        }
        this.mostrarFormulario = false;
        this.cargarDatos(this.tablaSeleccionada);
      } catch (error) {
        console.error("Error al guardar registro", error);
      }
    },
    async eliminarRegistro(id) {
      if (confirm("¿Seguro que deseas eliminar este registro?")) {
        try {
          await axios.delete(`${this.tablaSeleccionada.url}/${id}`);
          this.cargarDatos(this.tablaSeleccionada);
        } catch (error) {
          console.error("Error al eliminar registro", error);
        }
      }
    }
  }
};
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

/* Stats Panel */
.stats-panel {
  margin-bottom: 20px;
}

.stats-container {
  display: flex;
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex: 1;
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

/* Filter Panel */
.filter-panel {
  margin-bottom: 20px;
}

.filter-header {
  background-color: var(--primary-color);
  color: white;
  padding: 15px 20px;
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
}

.filter-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.filter-header h2 i {
  margin-right: 10px;
}

.filter-controls {
  padding: 20px;
  display: flex;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  padding-left: 40px;
  width: 100%;
}

/* Table Panel */
.table-panel {
  margin-bottom: 20px;
}

.table-header {
  background-color: var(--primary-color);
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

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: var(--surface-color);
  font-weight: 600;
  color: var(--text-primary);
}

.data-table tr:hover {
  background-color: var(--light-gray);
}

.table-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-icon {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: var(--light-gray);
  color: var(--primary-color);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: var(--border-radius);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  background-color: var(--primary-color);
  color: white;
  padding: 15px 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

.scrollable-form {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.form-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
}

.modal-footer {
  padding: 15px 20px;
  background-color: var(--surface-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 20px;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}
</style>
  