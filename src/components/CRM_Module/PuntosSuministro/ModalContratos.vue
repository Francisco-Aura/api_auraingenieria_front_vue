<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-content">
      <button type="button" @click="cerrarModal" class="close-button" aria-label="Cerrar">&times;</button>
      <h2>Gestión de Contratos</h2>
      <!-- Tabs para alternar entre las vistas de contratos -->
      <div class="tabs">
        <button :class="{ active: pestañaActiva === 'nuevo' }" @click="pestañaActiva = 'nuevo'">Nuevo Contrato</button>
        <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">Contrato Actual</button>
        <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">Contratos Históricos</button>
      </div>
      <!-- Contenido dinámico según la pestaña activa -->
      <div class="tab-content">
        <!-- Crear nuevo contrato -->
        <div v-if="pestañaActiva === 'nuevo'">
          <h3>Crear Nuevo Contrato</h3>
          <h2>{{ cliente?.nombre || 'Desconocido' }}</h2>
          <form @submit.prevent="crearNuevoContrato">
            <div class="form-row">
              <!-- Primera columna -->
              <div class="form-column">
                <div class="form-group">
                  <label for="fechaEnvioContrato">Fecha Envío</label>
                  <input type="date" id="fechaEnvioContrato" v-model="nuevoContrato.fechaEnvio" required />
                </div>
                <div class="form-group">
                  <label for="fechaInicioContrato">Fecha Inicio</label>
                  <input type="date" id="fechaInicioContrato" v-model="nuevoContrato.fechaInicio" required />
                </div>
                <div class="form-group">
                  <label for="fechaFinContrato">Fecha Fin</label>
                  <input type="date" id="fechaFinContrato" v-model="nuevoContrato.fechaFin" required />
                </div>
                <div class="form-group">
                  <label for="contrato">Contrato</label>
                  <input type="text" id="contrato" v-model="nuevoContrato.contrato" required />
                </div>
                <div class="form-group">
                  <label for="tarifaGas">Tarifa Gas</label>
                  <select id="tarifaGas" v-model="nuevoContrato.idTarifaGas" required>
                    <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">
                      {{ tarifa.nombre }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="tarifaLuz">Tarifa Luz</label>
                  <select id="tarifaLuz" v-model="nuevoContrato.idTarifaLuz" required>
                    <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">
                      {{ tarifa.nombre }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="comercializadoraActual">Comercializadora Actual</label>
                  <select id="comercializadoraActual" v-model="nuevoContrato.idComercializadoraActual" required>
                    <option v-for="comercializadora in comercializadoras" :value="comercializadora.id" :key="comercializadora.id">
                      {{ comercializadora.nombre }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="comercializadoraAnterior">Comercializadora Anterior</label>
                  <select id="comercializadoraAnterior" v-model="nuevoContrato.idComercializadoraAnterior">
                    <option v-for="comercializadora in comercializadoras" :value="comercializadora.id" :key="comercializadora.id">
                      {{ comercializadora.nombre }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Segunda columna -->
              <div class="form-column">
                <div class="form-group" v-for="i in 6" :key="i">
                  <label :for="'potencia' + i">Potencia {{ i }}</label>
                  <input :id="'potencia' + i" type="number" v-model.number="nuevoContrato['potencia' + i]" />
                </div>
                <div class="form-group">
                  <label for="consumoAnual">Consumo Anual</label>
                  <input type="number" id="consumoAnual" v-model.number="nuevoContrato.consumoAnual" required />
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" v-model="nuevoContrato.exencionImpuestoElectricidad" />
                    Exención Impuesto Electricidad
                  </label>
                </div>
                
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="nuevoContrato.autoconsumo" />
                  Autoconsumo
                </label>
              </div>
              <div class="form-group">
                <label>
                  <input type="checkbox" v-model="nuevoContrato.denunciaContrato" />
                  Denuncia Contrato
                </label>
              </div>
              <div class="form-group">
                <label for="fechaDenunciaContrato">Fecha Denuncia Contrato</label>
                <input type="date" id="fechaDenunciaContrato" v-model="nuevoContrato.fechaDenunciaContrato" />
              </div>                            
            </div>
            <!-- Campo "Observaciones" ocupa el ancho completo al final -->
            <div class="form-notas full-width">
              <label for="observaciones">Observaciones</label>
                <textarea id="observaciones" v-model="nuevoContrato.observaciones"></textarea>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Contrato</button>
            </div>
          </form>
        </div>

        <!-- Visualizar contrato actual -->
        <div v-if="pestañaActiva === 'actual'">
          <h3>Actualizar Contrato Actual </h3>
            <div v-if="contratoActual">
              <form @submit.prevent="actualizarContrato">
              <div class="form-row">
                <!-- Primera columna -->
                <div class="form-column">
                  <div class="form-group">
                    <label for="fechaEnvioContrato">Fecha Envío</label>
                    <input type="date" id="fechaEnvioContrato" v-model="contratoActualCopia.fechaEnvio" />
                  </div>
                  <div class="form-group">
                    <label for="fechaInicioContrato">Fecha Inicio</label>
                    <input type="date" id="fechaInicioContrato" v-model="contratoActualCopia.fechaInicio" />
                  </div>
                  <div class="form-group">
                    <label for="fechaFinContrato">Fecha Fin</label>
                    <input type="date" id="fechaFinContrato" v-model="contratoActualCopia.fechaFin" />
                  </div>
                  <div class="form-group">
                    <label for="contrato">Contrato</label>
                    <input type="text" id="contrato" v-model="contratoActualCopia.contrato" />
                  </div>
                  <div class="form-group">
                    <label for="tarifaGas">Tarifa Gas</label>
                    <select id="tarifaGas" v-model="contratoActualCopia.idTarifaGas">
                      <option v-for="tarifa in tarifasGas" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="tarifaLuz">Tarifa Luz</label>
                    <select id="tarifaLuz" v-model="contratoActualCopia.idTarifaLuz">
                      <option v-for="tarifa in tarifasLuz" :value="tarifa.id" :key="tarifa.id">
                        {{ tarifa.nombre }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="comercializadoraActual">Comercializadora Actual</label>
                    <select id="comercializadoraActual" v-model="contratoActualCopia.idComercializadoraActual" required>
                      <option v-for="comercializadora in comercializadoras" :value="comercializadora.id" :key="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="comercializadoraAnterior">Comercializadora Anterior</label>
                    <select id="comercializadoraAnterior" v-model="contratoActualCopia.idComercializadoraAnterior">
                      <option v-for="comercializadora in comercializadoras" :value="comercializadora.id" :key="comercializadora.id">
                        {{ comercializadora.nombre }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Segunda columna -->
                <div class="form-column">
                  <div class="form-group" v-for="i in 6" :key="i">
                    <label :for="'potencia' + i">Potencia {{ i }}</label>
                    <input :id="'potencia' + i" type="number" v-model.number="contratoActualCopia['potencia' + i]" />
                  </div>
                  <div class="form-group">
                    <label for="consumoAnual">Consumo Anual</label>
                    <input type="number" id="consumoAnual" v-model.number="contratoActualCopia.consumoAnual" />
                  </div>
                  <div class="form-group">
                    <label>
                      <input type="checkbox" v-model="contratoActualCopia.exencionImpuestoElectricidad" />
                      Exención Impuesto Electricidad
                    </label>
                  </div>
                  
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>
                    <input type="checkbox" v-model="contratoActualCopia.autoconsumo" />
                    Autoconsumo
                  </label>
                </div>
                <div class="form-group">
                  <label>
                    <input type="checkbox" v-model="contratoActualCopia.denunciaContrato" />
                    Denuncia Contrato
                  </label>
                </div>
                <div class="form-group">
                  <label for="fechaDenunciaContrato">Fecha Denuncia Contrato</label>
                  <input type="date" id="fechaDenunciaContrato" v-model="contratoActualCopia.fechaDenunciaContrato" />
                </div>                            
              </div>
              <!-- Campo "Observaciones" ocupa el ancho completo al final -->
              <div class="form-notas full-width">
                <label for="observaciones">Observaciones</label>
                  <textarea id="observaciones" v-model="contratoActualCopia.observaciones"></textarea>
              </div>

              <!-- Botones de acción -->
              <div class="form-actions">
                <button type="button" @click="cerrarModal" class="btn btn-secondary">Cancelar</button>
                <button type="submit" class="btn btn-primary">Actualizar Contrato</button>
              </div>
            </form>
          </div>
          <div v-else>
            <p>No hay contratos actuales.</p>
          </div>
        </div>
        
        <!-- Listado de contratos históricos con tabla -->
        <div v-if="pestañaActiva === 'historico'">
          <h3>Contratos Históricos {{ cliente?.nombre || 'Cliente Desconocido' }} </h3>
          <div v-if="Array.isArray(contratosHistoricos) && contratosHistoricos.length">
            <table class="historical-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha Envío</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Contrato</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contrato in contratosHistoricos" :key="contrato.id">
                  <td>{{ contrato.id }}</td>
                  <td>{{ contrato.fechaEnvio }}</td>
                  <td>{{ contrato.fechaInicio }}</td>
                  <td>{{ contrato.fechaFin }}</td>
                  <td>{{ contrato.contrato }}</td>
                  <td>{{ contrato.observaciones }}</td>
                  <td>
                    <button @click="verDetalleContrato(contrato)">Ver Detalle</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else>
            <p>No hay contratos históricos disponibles.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "ModalContratos",
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    contratoActual: {
      type: Object,
      default: () => ({
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
      }),
    },
    contratosHistoricos: {
      type: Array,
      required: false,
      default: () => [], // Valor predeterminado vacío si no se pasa
    },
    cliente: {
      type: Object,
      default: () => ({}), // 👈 Esto evita que sea null y previene errores
    },
    puntoSuministro: {
      type: Object,
      default: () => ({}), // 👈 Esto evita que sea null y previene errores
    },
    tarifasGas: {
      type: Array,
      required: true,
    },
    tarifasLuz: {
      type: Array,
      required: true,
    },
    comercializadoras: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      pestañaActiva: "actual",
      nuevoContrato: {
        idCliente:"",
        idPuntoSuministro:"",        
        fecha:"",
        fechaEnvio:"",
        fechaInicio: "",
        fechaFin: "",
        contrato: "",
        idTarifaGas:"",
        idTarifaLuz:"",
        potencia1:0,        
        potencia2:0,
        potencia3:0,
        potencia4:0,
        potencia5:0,
        potencia6:0,
        consumoAnual:0,
        exencionImpuestoElectricidad:0,
        idComercializadoraActual:0,
        idComercializadoraAnterior:0,
        autoconsumo:0,
        denunciaContrato:0,
        fechaDenunciaContrato:"",
        observaciones: "",
      },
      contratoActualCopia: { ...this.contratoActual }, // Copia local de la prop
    };
  },
  watch: {
    contratoActual: {
      immediate: true,
      handler(val) {
        if (val) {
          this.contratoActualCopia = {
            ...val,
            exencionImpuestoElectricidad: val.exencionImpuestoElectricidad === 1,
            autoconsumo: val.autoconsumo === 1,
            denunciaContrato: val.denunciaContrato === 1,
          };
        }
      },
    },
  },

  methods: {
    cerrarModal() {
      this.$emit("cerrar-modal");
    },
    async crearNuevoContrato() {
      try {
        // Convertimos los booleanos a enteros antes de enviarlos
        const contratoParaEnviar = {
          ...this.contratoActualCopia,
          exencionImpuestoElectricidad: this.contratoActualCopia.exencionImpuestoElectricidad ? 1 : 0,
          autoconsumo: this.contratoActualCopia.autoconsumo ? 1 : 0,
          denunciaContrato: this.contratoActualCopia.denunciaContrato ? 1 : 0,
        };
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/api/contratos`, contratoParaEnviar);
        alert("Contrato creado con éxito: " + JSON.stringify(response.data));
        this.$emit("contrato-creado", response.data);
        this.cerrarModal();
      } catch (error) {
        console.error("Error al crear el contrato:", error);
        alert("Error al crear el contrato. Por favor, verifica los datos e inténtalo de nuevo.");
      }
    },
    async actualizarContrato() {
      try {
        // Convertimos los booleanos a enteros antes de enviarlos
        const contratoParaEnviar = {
          ...this.contratoActualCopia,
          exencionImpuestoElectricidad: this.contratoActualCopia.exencionImpuestoElectricidad ? 1 : 0,
          autoconsumo: this.contratoActualCopia.autoconsumo ? 1 : 0,
          denunciaContrato: this.contratoActualCopia.denunciaContrato ? 1 : 0,
        };
        // Usa la copia local para actualizar
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/api/contratos`, contratoParaEnviar);        
        this.$emit("contrato-actualizado", response.data);
        this.cerrarModal();
      } catch (error) {
        console.error("Error al actualizar el contrato:", error);
        alert("Error al actualizar el contrato. Por favor, verifica los datos e inténtalo de nuevo.");
      }
    },
    verDetalleContrato(contrato) {
      alert(`Detalles del contrato ID: ${contrato.id}\n${JSON.stringify(contrato, null, 2)}`);
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

/* Botón cerrar dentro del modal */
.modal-content {
  position: relative; /* Asegúrate de que el modal sea un contenedor de posición */
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
