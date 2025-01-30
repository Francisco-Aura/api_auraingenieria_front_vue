<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
      <h2>Gestión de Servicios</h2>
      <!-- Tabs para alternar entre las vistas de servicios -->
      <div class="tabs">
        <button :class="{ active: pestañaActiva === 'nuevo' }" @click="pestañaActiva = 'nuevo'">Nuevo Servicio</button>
        <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">Servicio Actual</button>
        <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">Servicios Históricos</button>
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

.form-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}
.form-column {
  flex: 1;
}
.form-actions {
  margin-top: 20px;
  text-align: right;
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

button {
  padding: 10px 20px;
  margin-right: 10px;
  border: none;
  background-color: #333;
  color: #f5c600;
  border-radius: 5px;
}

button:hover {
  background-color: #f5c600;
  color: #333;
}

.btn-cancelar:hover {
  background-color: #5a6268;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
}
.tabs button {
  padding: 10px;
  border: 1px solid #070707;
  cursor: pointer;
  background-color: #808080;
}
.tabs button.active {
  background-color: #ddd;
  color: #f50000;
  font-weight: bold;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  color: #333;
  transition: color 0.3s ease;
}

.close-button:hover {
  color: #ff3c00; /* Cambia el color al pasar el cursor */
}
</style>
