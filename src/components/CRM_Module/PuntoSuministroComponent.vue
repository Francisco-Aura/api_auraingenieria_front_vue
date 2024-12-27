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
          <!-- Botones para realizar acciones -->
          <td>
            <button class="btn btn-modPS" @click="abrirFormularioPSActualizar(suministro)">
              Modificar PS
            </button>
            <button class="btn btn-crearContrato" @click="abrirModalContratos(suministro.id)">
              Contrato
            </button>
            <button class="btn btn-crearContrato" @click="abrirModalServicios(suministro.id)">
              Servicio
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para actualizar puntos de suministro -->
    <div v-if="formularioVisible" class="modal-overlay">
      <div class="modal-content">
        <h1>Actualizar Punto de Suministro</h1>
        <h2>{{ modificarPunto.nombreCliente || 'Desconocido' }}</h2>

        <!-- Formulario para actualizar el punto de suministro -->
        <form @submit.prevent="actualizarPS">
          <div class="form-grid">
            <!-- Primera Columna del formulario -->
            <div class="form-column">
              <div class="form-group">
                <label for="direccion">Dirección</label>
                <input 
                  type="text" 
                  id="direccion" 
                  v-model="modificarPunto.direccion" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="codigoPostal">Código Postal</label>
                <input 
                  type="text" 
                  id="codigoPostal" 
                  v-model="modificarPunto.codigoPostal" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="poblacion">Población</label>
                <input 
                  type="text" 
                  id="poblacion" 
                  v-model="modificarPunto.poblacion" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="provincia">Provincia</label>
                <input 
                  type="text" 
                  id="provincia" 
                  v-model="modificarPunto.provincia" 
                  class="form-control" 
                  required
                />
              </div>
            </div>

            <!-- Segunda Columna del formulario -->
            <div class="form-column">
              <div class="form-group">
                <label for="cupsluz">CUPS Luz</label>
                <input 
                  type="text" 
                  id="cupsluz" 
                  v-model="modificarPunto.cupsluz" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label for="cupsgas">CUPS Gas</label>
                <input 
                  type="text" 
                  id="cupsgas" 
                  v-model="modificarPunto.cupsgas" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label for="contador">Contador</label>
                <div class="input-with-checkbox">
                  <input 
                    type="text" 
                    id="contador" 
                    v-model="modificarPunto.contador" 
                    class="form-control" 
                    @input="modificarPunto.propiedadContador = !!modificarPunto.contador"
                  />
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="modificarPunto.propiedadContador"
                      disabled
                    />
                    Propiedad
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label for="modem">Modem</label>
                <div class="input-with-checkbox">
                  <input 
                    type="text" 
                    id="modem" 
                    v-model="modificarPunto.modem" 
                    class="form-control" 
                    @input="modificarPunto.propiedadModem = !!modificarPunto.modem"
                  />
                  <label>
                    <input 
                      type="checkbox" 
                      v-model="modificarPunto.propiedadModem"
                      disabled
                    />
                    Propiedad
                  </label>
                </div>
              </div>
            </div>

            <!-- Campos que ocupan toda el ancho -->
            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea 
                id="observaciones" 
                v-model="modificarPunto.observaciones" 
                class="form-control" 
                rows="3"
              ></textarea>
            </div>
            <div class="form-group full-width">
              <label for="fechaInstalacion">Fecha de Instalación</label>
              <input 
                type="date" 
                id="fechaInstalacion" 
                v-model="modificarPunto.fechaInstalacion" 
                class="form-control" 
              />
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="modal-footer">
            <button type="button" @click="cerrarModal" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">Actualizar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Contratos -->
    <div v-if="mostrarModalContratos" class="modal-overlay">
      <div class="modal-content">
        <button type="button" @click="cerrarModalContratos" class="close-button" aria-label="Cerrar">&times;</button>
        <h2>Gestión de Contratos</h2>
        <!-- Tabs para alternar entre las vistas de contratos -->
        <div class="tabs">
          <button :class="{ active: pestañaActivaContratos === 'nuevo' }" @click="pestañaActivaContratos = 'nuevo'">
            Nuevo Contrato
          </button>
          <button :class="{ active: pestañaActivaContratos === 'actual' }" @click="pestañaActivaContratos = 'actual'">
            Contrato Actual
          </button>
          <button :class="{ active: pestañaActivaContratos === 'historico' }" @click="pestañaActivaContratos = 'historico'">
            Contratos Históricos
          </button>
        </div>
        <!-- Contenido dinámico según la pestaña activa -->
        <div class="tab-content">
          <!-- Crear nuevo contrato -->
          <div v-if="pestañaActivaContratos === 'nuevo'">
            <h3>Crear Nuevo Contrato</h3>
            <form @submit.prevent="crearNuevoContrato">
              <div class="form-group">
                <label for="fechaInicioContrato">Fecha Inicio:</label>
                <input type="date" id="fechaInicioContrato" v-model="nuevoContrato.fechaInicio" required />
              </div>
              <div class="form-group">
                <label for="fechaFinContrato">Fecha Fin:</label>
                <input type="date" id="fechaFinContrato" v-model="nuevoContrato.fechaFin" required />
              </div>
              <div class="form-group">
                <label for="detallesContrato">Detalles:</label>
                <textarea id="detallesContrato" v-model="nuevoContrato.detalles" rows="3" required></textarea>
              </div>
              <button type="button" @click="cerrarModalContratos" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Contrato</button>
            </form>
          </div>
          <!-- Visualizar contrato actual -->
          <div v-if="pestañaActivaContratos === 'actual'">
            <h3>Contrato Actual</h3>
            <div v-if="contratoActual">
              <p><strong>ID:</strong> {{ contratoActual.id }}</p>
              <p><strong>Fecha Inicio:</strong> {{ contratoActual.fechaInicio }}</p>
              <p><strong>Fecha Fin:</strong> {{ contratoActual.fechaFin }}</p>
              <p><strong>Detalles:</strong> {{ contratoActual.detalles }}</p>
            </div>
            <div v-else>
              <p>No hay contratos actuales.</p>
            </div>
          </div>
          <!-- Listado de contratos históricos -->
          <div v-if="pestañaActivaContratos === 'historico'">
            <h3>Contratos Históricos</h3>
            <ul>
              <li v-for="contrato in contratosHistoricos" :key="contrato.id">
                <strong>ID:</strong> {{ contrato.id }} - 
                <strong>Fecha Fin:</strong> {{ contrato.fechaFin }}
                <button @click="verDetalleContrato(contrato)">Ver Detalle</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>


    <!-- Modal de Servicios -->
    <div v-if="mostrarModalServicios" class="modal-overlay">
      <div class="modal-content">                
        <button type="button" @click="cerrarModalServicios" class="close-button" aria-label="Cerrar">&times;</button>
        <h2>Gestión de Servicios</h2>
        <!-- Tabs para alternar entre las vistas de servicios -->
        <div class="tabs">
          <button :class="{ active: pestañaActivaServicios === 'nuevo' }" @click="pestañaActivaServicios = 'nuevo'">
            Nuevo Servicio
          </button>
          <button :class="{ active: pestañaActivaServicios === 'actual' }" @click="pestañaActivaServicios = 'actual'">
            Servicio Actual
          </button>
          <button :class="{ active: pestañaActivaServicios === 'historico' }" @click="pestañaActivaServicios = 'historico'">
            Servicios Históricos
          </button>
        </div>
        <!-- Contenido dinámico según la pestaña activa -->
        <div class="tab-content">
          <!-- Crear nuevo servicio -->
          <div v-if="pestañaActivaServicios === 'nuevo'">
            <h3>Crear Nuevo Servicio</h3>
            <form @submit.prevent="crearNuevoServicio">
              <div class="form-group">
                <label for="fechaInicioServicio">Fecha Inicio:</label>
                <input type="date" id="fechaInicioServicio" v-model="nuevoServicio.fechaInicio" required />
              </div>
              <div class="form-group">
                <label for="fechaFinServicio">Fecha Fin:</label>
                <input type="date" id="fechaFinServicio" v-model="nuevoServicio.fechaFin" required />
              </div>
              <div class="form-group">
                <label for="descripcionServicio">Descripción:</label>
                <textarea id="descripcionServicio" v-model="nuevoServicio.descripcion" rows="3" required></textarea>
              </div>
              <button type="button" @click="cerrarModalServicios" class="btn btn-secondary">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Servicio</button>
            </form>
          </div>
          <!-- Visualizar servicio actual -->
          <div v-if="pestañaActivaServicios === 'actual'">
            <h3>Servicio Actual</h3>
            <div v-if="servicioActual">
              <p><strong>ID:</strong> {{ servicioActual.id }}</p>
              <p><strong>Descripción:</strong> {{ servicioActual.descripcion }}</p>
              <p><strong>Fecha Inicio:</strong> {{ servicioActual.fechaInicio }}</p>
              <p><strong>Fecha Fin:</strong> {{ servicioActual.fechaFin }}</p>
            </div>
            <div v-else>
              <p>No hay servicios actuales.</p>
            </div>
          </div>
          <!-- Listado de servicios históricos -->
          <div v-if="pestañaActivaServicios === 'historico'">
            <h3>Servicios Históricos</h3>
            <ul>
              <li v-for="servicio in serviciosHistoricos" :key="servicio.id">
                <strong>ID:</strong> {{ servicio.id }} - 
                <strong>Fecha Fin:</strong> {{ servicio.fechaFin }}
                <button @click="verDetalleServicio(servicio)">Ver Detalle</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>



<script>
import axios from "axios";

export default {
  name: "PuntosSuministro",

  // Variables reactivas del componente
  data() {
    return {
      puntosSuministro: [], // Lista de puntos de suministro
      filter: "", // Filtro de búsqueda
      formularioVisible: false, // Control de visibilidad del formulario de actualización
      
      // Datos del formulario para modificar un punto de suministro
      modificarPunto: {
        id: null,
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        cupsluz: "",
        cupsgas: "",
        contador: "",
        propiedadContador: 0, // 0: no es propietario, 1: es propietario
        modem: "",
        propiedadModem: 0, // 0: no es propietario, 1: es propietario
        observaciones: "",
        fechaInstalacion: "",
        fechaBaja: null, // Fecha de baja lógica
        idCliente: null, // ID del cliente asociado
        nombreCliente: "", // Nombre del cliente asociado
      },          

      // Datos CONTRATOS
      pestañaActivaContratos: "actual", // Pestaña activa en el modal de contratos
      mostrarModalContratos: false, // Control de visibilidad del modal de contratos
      contratos: [], // Lista de contratos asociados al punto de suministro
      nuevoContrato: {
        fechaInicio: "",
        fechaFin: "",
        detalles: "",
      },

      // Datos SERVICIO
      pestañaActivaServicios: "actual", // Pestaña activa en el modal de servicios
      mostrarModalServicios: false, // Control de visibilidad del modal de servicios
      servicios: [], // Lista de servicios asociados al punto de suministro
      nuevoServicio: {
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
      },
    };
  },

  // Computed properties para filtrar y clasificar datos
  computed: {
    // Filtrar puntos de suministro según el término de búsqueda
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) =>
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
    },

    // Obtener el contrato actual (vigente)
    contratoActual() {
      const ahora = new Date();
      return this.contratos.find(
        (contrato) => new Date(contrato.fechaFin) > ahora
      );
    },

    // Obtener contratos históricos (finalizados)
    contratosHistoricos() {
      const ahora = new Date();
      return this.contratos.filter(
        (contrato) => new Date(contrato.fechaFin) <= ahora
      );
    },

    // Obtener el servicio actual (vigente)
    servicioActual() {
      const ahora = new Date();
      return this.servicios.find(
        (servicio) => new Date(servicio.fechaFinServicio) > ahora
      );
    },

    // Obtener servicios históricos (finalizados)
    serviciosHistoricos() {
      const ahora = new Date();
      return this.servicios.filter(
        (servicio) => new Date(servicio.fechaFinServicio) <= ahora
      );
    },
  },

  // Cargar datos al crear el componente
  created() {
    this.fetchPuntosSuministro();
  },

  methods: {
    // Obtener todos los puntos de suministro del backend
    async fetchPuntosSuministro() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`
        );
        this.puntosSuministro = response.data;
      } catch (error) {
        console.error("Error al cargar los puntos de suministro:", error);
      }
    },

    // Abrir formulario para actualizar un punto de suministro
    async abrirFormularioPSActualizar(ps) {
      if (!ps.id) {
        console.error("El punto de suministro seleccionado no tiene un ID válido.");
        alert("No se puede cargar el punto de suministro seleccionado.");
        return;
      }

      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        const punto = response.data;

        // Mapear datos al formato del formulario
        this.modificarPunto = {
          ...punto,
          propiedadContador: punto.propiedadContador ? 1 : 0,
          propiedadModem: punto.propiedadModem ? 1 : 0,
        };
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        alert("No se pudo cargar la información del punto de suministro.");
      }
    },

    // Cerrar formulario de actualización y reiniciar datos
    cerrarModal() {
      this.formularioVisible = false;
      this.modificarPunto = {
        id: null,
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        cupsluz: "",
        cupsgas: "",
        contador: "",
        propiedadContador: 0,
        modem: "",
        propiedadModem: 0,
        observaciones: "",
        fechaInstalacion: "",
        fechaBaja: null,
        idCliente: null,
        nombreCliente: "",
      };
    },

    // Actualizar un punto de suministro
    async actualizarPS() {
      try {
        const payload = {
          ...this.modificarPunto,
          propiedadContador: this.modificarPunto.propiedadContador ? 1 : 0,
          propiedadModem: this.modificarPunto.propiedadModem ? 1 : 0,
        };

        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/${this.modificarPunto.id}`,
          payload
        );

        if (response.status === 200) {
          alert("Punto de suministro actualizado con éxito.");
          this.cerrarModal();
          this.fetchPuntosSuministro();
        }
      } catch (error) {
        console.error("Error al actualizar el punto de suministro:", error);
        alert("No se pudo actualizar el punto de suministro.");
      }
    },

    // Abrir modal de contratos
    async abrirModalContratos(idPuntoSuministro) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`);
        this.contratos = response.data;
        this.mostrarModalContratos = true;
      } catch (error) {
        console.error("Error al cargar los contratos:", error);
        alert("No se pudieron cargar los contratos.");
      }
    },

    // Cerrar modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
      this.contratos = [];
      this.pestañaActivaContratos = "actual";
    },

    // Mostrar detalles de un contrato
    verDetalle(contrato) {
      alert(`Detalles del contrato ID: ${contrato.id}\n${JSON.stringify(contrato, null, 2)}`);
    },

    // Abrir modal de servicios
    async abrirModalServicios(idPuntoSuministro) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/${idPuntoSuministro}`);
        this.servicios = response.data;
        this.mostrarModalServicios = true;
      } catch (error) {
        console.error("Error al cargar los servicios:", error);
        alert("No se pudieron cargar los servicios.");
      }
    },

    // Cerrar modal de servicios
    cerrarModalServicios() {
      this.mostrarModalServicios = false;
      this.servicios = [];
      this.pestañaActivaServicios = "actual";
    },

    // Mostrar detalles de un servicio
    verDetalleServicio(servicio) {
      alert(`Detalles del servicio ID: ${servicio.id}\n${JSON.stringify(servicio, null, 2)}`);
    },

    // Crear un nuevo contrato
    async crearNuevoContrato() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/contratos`,this.nuevoContrato);
        alert("Contrato creado con éxito.");
        this.nuevoContrato = { fechaInicio: "", fechaFin: "", detalles: "" };
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error("Error al crear el contrato:", error);
        alert("No se pudo crear el contrato.");
      }
    },

    // Crear un nuevo servicio
    async crearNuevoServicio() {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/servicios`,this.nuevoServicio);
        alert("Servicio creado con éxito.");
        this.nuevoServicio = { fechaInicioServicio: "", fechaFinServicio: "", descripcion: "" };
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error("Error al crear el servicio:", error);
        alert("No se pudo crear el servicio.");
      }
    },
  },
};
</script>