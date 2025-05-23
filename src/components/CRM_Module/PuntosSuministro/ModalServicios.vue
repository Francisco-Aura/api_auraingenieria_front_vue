<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">
        <i class="fas fa-times"></i>
      </button>
      <h2>Gestión de Servicios</h2>
      <!-- Tabs para alternar entre las vistas de servicios -->
      <div class="tabs">
        <button :class="['tab-btn', { active: pestañaActiva === 'nuevo' }]" @click="pestañaActiva = 'nuevo'">Nuevo Servicio</button>
        <button :class="['tab-btn', { active: pestañaActiva === 'actual' }]" @click="pestañaActiva = 'actual'">Servicio Actual</button>
        <button :class="['tab-btn', { active: pestañaActiva === 'historico' }]" @click="pestañaActiva = 'historico'">Servicios Históricos</button>
      </div>
      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content">
        <!-- Crear nuevo servicio -->
        <div v-if="pestañaActiva === 'nuevo'">
          <h3>Crear Nuevo Servicio</h3>
          <h2>{{ cliente?.nombre || 'Desconocido' }}</h2>
          <form @submit.prevent="crearNuevoServicio">
            <div class="form-row">
              <!-- Primera columna -->
              <div class="form-column">
                <div class="form-group">
                  <label for="fecha">Fecha </label>
                  <input type="date" id="fecha" v-model="nuevoServicio.fecha" required />
                </div>
                <div class="form-group">
                  <label for="fechaInicioServicio">Fecha Inicio Servicio</label>
                  <input type="date" id="fechaInicioServicio" v-model="nuevoServicio.fechaInicioServicio" required />
                </div>
                <div class="form-group">
                  <label for="fechaFinServicio">Fecha Fin Servicio</label>
                  <input type="date" id="fechaFinServicio" v-model="nuevoServicio.fechaFinServicio" required />
                </div>
                <div class="form-group">
                  <label for="descripcion">Descripcion Servicio</label>
                  <input type="text" id="descripcion" v-model="nuevoServicio.descripcion" required />
                </div>
                <div class="form-group">
                  <label for="gestora">Gestora</label>
                  <select id="gestora" v-model="nuevoServicio.idGestora" required>
                    <option v-for="gestora in gestoras" :value="gestora.id" :key="gestora.id">
                      {{ gestora.nombre }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="producto">Producto</label>
                  <select id="producto" v-model="nuevoServicio.idProducto" required>
                    <option v-for="producto in productos" :value="producto.id" :key="producto.id">
                      {{ producto.nombre }}
                    </option>
                  </select>
                </div>                
              </div> 
            </div> 
            <!-- Botones de acción -->
            <div class="form-actions">
              <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Servicio</button>
            </div>
          </form>
        </div>
        <!-- Visualizar servicio actual -->
        <div v-if="pestañaActiva === 'actual'">
          <h3>Actualizar Servicio Actual</h3>
          <div v-if="servicioActual">
            <form @submit.prevent="actualizarServicio">
              <div class="form-row">
                <!-- Primera columna -->
                <div class="form-column">
                  <div class="form-group">
                    <label for="fecha">Fecha </label>
                    <input type="date" id="fecha" v-model="servicioActualCopia.fecha" required />
                  </div>
                  <div class="form-group">
                    <label for="fechaInicioServicio">Fecha Inicio Servicio</label>
                    <input type="date" id="fechaInicioServicio" v-model="servicioActualCopia.fechaInicioServicio" required />
                  </div>
                  <div class="form-group">
                    <label for="fechaFinServicio">Fecha Fin Servicio</label>
                    <input type="date" id="fechaFinServicio" v-model="servicioActualCopia.fechaFinServicio" required />
                  </div>
                  <div class="form-group">
                    <label for="descripcion">Descripcion Servicio</label>
                    <input type="text" id="descripcion" v-model="servicioActualCopia.descripcion" required />
                  </div>
                  <div class="form-group">
                    <label for="gestora">Gestora</label>
                    <select id="gestora" v-model="servicioActualCopia.idGestora" required>
                      <option v-for="gestora in gestoras" :value="gestora.id" :key="gestora.id">
                        {{ gestora.nombre }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="producto">Producto</label>
                    <select id="producto" v-model="servicioActualCopia.idProducto" required>
                      <option v-for="producto in productos" :value="producto.id" :key="producto.id">
                        {{ producto.nombre }}
                      </option>
                    </select>
                  </div>                
                </div> 
              </div> 
              <!-- Botones de acción -->
              <div class="form-actions">
                <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar Servicio</button>
              </div>
            </form>
          </div>
          <div v-else>
            <p>No hay servicios actuales.</p>
          </div>
        </div>
        <!-- Listado de servicios históricos -->
        <div v-if="pestañaActiva === 'historico'">
          <h3>Servicios Históricos {{ cliente?.nombre || 'Cliente Desconocido' }} </h3>
            <div v-if="Array.isArray(serviciosHistoricos) && serviciosHistoricos.length">
              <table class="historical-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha </th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Descripcion</th>
                    <th>Gestora</th>
                    <th>Producto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="servicio in serviciosHistoricos" :key="servicio.id">
                    <td>{{ servicio.id }}</td>
                    <td>{{ servicio.fecha }}</td>
                    <td>{{ servicio.fechaInicioServicio }}</td>
                    <td>{{ servicio.fechaFinServicio }}</td>
                    <td>{{ servicio.descripcion }}</td>
                    <td>{{ servicio.idGestora }}</td>
                    <td>{{ servicio.idProducto }}</td>
                    <td>
                      <button @click="verDetalleServicio(servicio)">Ver Detalle</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          <div v-else>
            <p>No hay servicios históricos disponibles.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ModalServicios",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    servicioActual: {
        id: "",
        fecha: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora:0,
        idProducto:0,
    },
    serviciosHistoricos: {
      type: Array,
      required: true,
    },
    cliente: {
      type: Object,
      default: () => ({}), // 👈 Esto evita que sea null y previene errores
    },
    gestoras: {
      type: Array,
      required: true,
    },
    productos: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      pestañaActiva: "actual",
      nuevoServicio: {
        id: "",
        fecha: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora:0,
        idProducto:0,
      },
      servicioActualCopia: { ...this.servicioActual }, // Copia local de la prop      
    };
  },
  methods: {
    cerrarModal() {
      this.$emit("cerrar-modal");
    },
    async crearNuevoServicio() {
      try {
        const respuesta = await axios.post("/api/servicios", this.nuevoServicio);
        alert("Servicio creado con éxito: " + respuesta.data.id);
        this.$emit("servicio-creado", respuesta.data);
        this.cerrarModal();
      } catch (error) {
        console.error("Error al crear el servicio", error);
        alert("Ocurrió un error al crear el servicio.");
      }
    },
    async actualizarServicio() {
      try {
        const respuesta = await axios.post("/api/servicios", this.nuevoServicio);
        alert("Servicio creado con éxito: " + respuesta.data.id);
        this.$emit("servicio-creado", respuesta.data);
        this.cerrarModal();
      } catch (error) {
        console.error("Error al crear el servicio", error);
        alert("Ocurrió un error al crear el servicio.");
      }
    },
    verDetalleServicio(servicio) {
      alert(`Detalles del servicio ID: ${servicio.id}\n${JSON.stringify(servicio, null, 2)}`);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  z-index: 1000;
}
.modal-content {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1100px;
  min-width: 600px;
  max-height: 90vh;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 32px 0 32px;
}
.modal-content h2, .modal-content h3 {
  margin: 0;
  padding: 24px 32px 0 32px;
  font-size: 1.5rem;
  font-weight: 700;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 2;
}
form {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px 0 32px;
}
.form-actions {
  background: #fff;
  padding: 18px 32px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: sticky;
  bottom: 0;
  z-index: 2;
}
@media (max-width: 700px) {
  .modal-content {
    min-width: 0;
    width: 98vw;
    max-width: 98vw;
    padding: 0 8px;
  }
}
.form-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.form-column {
  flex: 1;
}
.historical-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 14px;
}
.historical-table th,
.historical-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.historical-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}
.historical-table tr:nth-child(even) {
  background-color: #f9f9f9;
}
.historical-table tr:hover {
  background-color: #f1f1f1;
}

.tabs {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  padding: 0 32px;
}
.tab-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 8px 8px 0 0;
  background: var(--surface-color);
  color: var(--primary-color);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  outline: none;
}
.tab-btn.active, .tab-btn:hover {
  background: var(--primary-color);
  color: #fff;
}

.close-button {
  position: absolute;
  top: 18px;
  right: 18px;
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  color: var(--primary-color);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  z-index: 10;
}
.close-button:hover {
  background: var(--primary-light);
  color: #fff;
}
.close-button i {
  pointer-events: none;
}
</style>
