<template>
  <div class="suministro-container">
    <!-- Título principal de la página -->
    <h2>Puntos de Suministro</h2>
    <!-- Muestra un spinner mientras se realizan solicitudes al servidor -->
    <Spinner :isLoading="loading" />  
    
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
            <button @click="abrirFormularioPSActualizar(suministro)">Modificar PS</button>
            <button @click="abrirModalContratos(suministro.id,suministro.idCliente)">Contrato</button>
            <button @click="abrirModalServicios(suministro.id,suministro.idCliente)">Servicio</button>
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
    <ModalContratos v-if="modalCliente" 
      :visible="mostrarModalContratos"
      :cliente="modalCliente"
      :puntoSuministro="modalPuntoSuministro"
      :contratos="contratos"
      :comercializadoras="comercializadoras"
      :tarifasGas="tarifasGas"
      :tarifasLuz="tarifasLuz"
      :contratoActual="contratoActual"
      :contratosHistoricos="contratosHistoricos"
      @cerrar-modal="cerrarModalContratos"
    />

    <!-- Modal de Servicios -->
    <ModalServicios v-if="modalCliente" 
      :visible="mostrarModalServicios" 
      :cliente="modalCliente"
      :puntoSuministro="modalPuntoSuministro"
      :servicios="servicios"
      :gestoras="gestoras"
      :productos="productos"
      :servicioActual="servicioActual"
      :serviciosHistoricos="serviciosHistoricos"
      @cerrar-modal="cerrarModalServicios"
    />
  </div>
</template>

<script>
// Importamos los componentes y librerías necesarias
import ModalActualizarPuntoSuministro from './ActualizarPuntoSuministro.vue';
import ModalContratos from './ModalContratos.vue';
import ModalServicios from './ModalServicios.vue';
import axios from "axios"; // Librería para hacer peticiones HTTP
import Spinner from "@/components/SpinnerComponent.vue";


export default {
  name: "PuntosSuministro", // Nombre del componente
  components: {
    ModalActualizarPuntoSuministro,
    ModalContratos,
    ModalServicios,
    Spinner
  },
  data() {
    return {
      loading: false,               // Estado para mostrar un spinner de carga
      puntosSuministro: [],         // Lista de puntos de suministro
      filter: "",                   // Filtro de búsqueda
      formularioVisible: false,     // Control de visibilidad del formulario de actualización
      
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
      comercializadoras: [],
      tarifasGas: [],
      tarifasLuz: [],

      // Datos SERVICIO
      mostrarModalServicios: false, // Control de visibilidad del modal de servicios
      servicios: [], // Lista de servicios asociados al punto de suministro
      nuevoServicio: {
        id: "",
        fecha: "",
        fechaInicioServicio: "",
        fechaFinServicio: "",
        descripcion: "",
        idGestora:0,
        idProducto:0,
      },
      modalCliente: null, // Cliente actual para el modal
      modalPuntoSuministro: null, // Punto de suministro actual para el modal
      gestoras: [],
      productos: [],
    };
  },

  computed: {
    // Filtra los puntos de suministro según el término ingresado en "filter"
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) =>
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
    },

    // Obtiene el contrato actual (aquel cuya fecha de finalización es posterior a hoy)
    contratoActual() {
      const ahora = new Date();
      return this.contratos.find(
        (contrato) => new Date(contrato.fechaFin) > ahora
      );
    },

    // Obtiene los contratos históricos (los que ya finalizaron)
    contratosHistoricos() {
      const ahora = new Date();
      return this.contratos.filter(
        (contrato) => new Date(contrato.fechaFin) <= ahora
      );
    },

    // Obtiene el servicio actual (vigente)
    servicioActual() {
      const ahora = new Date();
      return this.servicios.find(
        (servicio) => new Date(servicio.fechaFinServicio) > ahora
      );
    },

    // Obtiene los servicios históricos (finalizados)
    serviciosHistoricos() {
      const ahora = new Date();
      return this.servicios.filter(
        (servicio) => new Date(servicio.fechaFinServicio) <= ahora
      );
    },
  },

  // Se ejecuta cuando el componente es creado para cargar datos iniciales
  created() {
    this.fetchPuntosSuministro();
  },

  methods: {
    // Carga todos los puntos de suministro desde la API
    async fetchPuntosSuministro() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/all`);
        this.puntosSuministro = response.data;
      } catch (error) {
          console.error("Error al cargar los puntos de suministro:", error);
      } finally {
          this.loading = false;
      }
    },

    // Abre el formulario de actualización de un punto de suministro
    async abrirFormularioPSActualizar(ps) {
      if (!ps.id) return alert("Punto de suministro no válido");
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        this.modificarPunto = { ...response.data };
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
      }
    },

    // Cierra el formulario de actualización
    cerrarModal() {
      this.formularioVisible = false;
    },

    // Actualiza un punto de suministro en la API
    async actualizarPS(actualizadoPunto) {
      try {
        await axios.post(`${process.env.VUE_APP_API_URL}/api/puntos-suministro`, actualizadoPunto);
        this.fetchPuntosSuministro();
      } catch (error) {
        console.error("Error al actualizar el punto de suministro:", error);
      }
    },

    // Abre el modal de contratos con los datos del punto de suministro seleccionado
    async abrirModalContratos(idPuntoSuministro,idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`);
        this.contratos = response.data;
        this.modalPuntoSuministro = idPuntoSuministro;  
        this.modalCliente = idCliente;   
        this.mostrarModalContratos = true;
      } catch (error) {
        console.error("Error al cargar contratos:", error);
      }
    },

    // Cierra el modal de contratos
    cerrarModalContratos() {
      this.mostrarModalContratos = false;
    },

    // Abre el modal de servicios con los datos del punto de suministro seleccionado
    async abrirModalServicios(idPuntoSuministro,idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/servicios/punto-suministro/${idPuntoSuministro}`);
        this.servicios = response.data;
        this.modalPuntoSuministro = idPuntoSuministro;  
        this.modalCliente = idCliente; 
        this.mostrarModalServicios = true;
      } catch (error) {
        console.error("Error al cargar servicios:", error);
      }
    },

    // Cierra el modal de contratos
    cerrarModalServicios() {
      this.mostrarModalServicios = false;
    },

  },

  // Se ejecuta cuando el componente es montado para cargar datos necesarios
  async mounted() {
    this.loading = true; // Forzar la visibilidad del spinner
    setTimeout(() => { 
      this.loading = false; 
    }, 2000); // Simular carga por 2 segundos
    //Precargamos los arrays de los combos
    try {
      const [comercializadoras, tarifasGas, tarifasLuz,gestoras,productos] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/comercializadoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifas-gas`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/tarifasLuz`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/gestoras`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/productos`),
      ]);
      this.comercializadoras = comercializadoras.data;
      this.tarifasGas = tarifasGas.data;
      this.tarifasLuz = tarifasLuz.data;
      this.gestoras = gestoras.data;
      this.productos = productos.data;
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    }
  }
};
</script>


<style scoped>
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

 