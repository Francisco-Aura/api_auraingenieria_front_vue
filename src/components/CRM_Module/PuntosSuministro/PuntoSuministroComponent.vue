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
    <ModalActualizarPuntoSuministro 
      v-if="formularioVisible" 
      :modificarPunto="modificarPunto" 
      @cerrar-modal="cerrarModal"
      @actualizar-punto-suministro="actualizarPS"
    />

    <!-- Modal de Contratos -->
    <ModalContratos
      :visible="mostrarModalContratos"
      :contratos="contratos"
      :contratoActual="contratoActual"
      :contratosHistoricos="contratosHistoricos"
      @cerrar-modal="cerrarModalContratos"
      @crear-contrato="crearNuevoContrato"
    />

    <!-- Modal de Servicios -->
    <ModalServicios
      :visible="mostrarModalServicios"
      :servicios="servicios"
      :servicioActual="servicioActual"
      :serviciosHistoricos="serviciosHistoricos"
      @cerrar-modal="cerrarModalServicios"
      @crear-servicio="crearNuevoServicio"
    />
  </div>
</template>

<script>
import ModalActualizarPuntoSuministro from './ActualizarPuntoSuministro.vue';
import ModalContratos from './ModalContratos.vue';
import ModalServicios from './ModalServicios.vue';
import axios from "axios";

export default {
  name: "PuntosSuministro",
  components: {
    ModalActualizarPuntoSuministro,
    ModalContratos,
    ModalServicios
  },
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
      mostrarModalContratos: false, // Control de visibilidad del modal de contratos
      contratos: [], // Lista de contratos asociados al punto de suministro
      nuevoContrato: {
        fechaInicio: "",
        fechaFin: "",
        detalles: "",
      },

      // Datos SERVICIO
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
        console.log("Fetching all puntos de suministro");
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`
        );
        console.log("Fetched data:", response.data);
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
        console.log("Fetching punto de suministro with ID:", ps.id);
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        console.log("Fetched data:", response.data);
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
        console.log("Updating punto de suministro with payload:", payload);

        const response = await axios.put(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/${this.modificarPunto.id}`,
          payload
        );
        console.log("Update response:", response.data);

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
        console.log("Fetching contratos for punto de suministro with ID:", idPuntoSuministro);
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`);
        console.log("Fetched data:", response.data);
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
        console.log("Fetching servicios for punto de suministro with ID:", idPuntoSuministro);
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/${idPuntoSuministro}`);
        console.log("Fetched data:", response.data);
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