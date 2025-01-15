<template>
  <!-- Contenedor principal del módulo de gestión de clientes -->
  <div class="clientes-container">
    <!-- Muestra un spinner mientras se realizan solicitudes al servidor -->
    <Spinner :isLoading="loading" />
    
    <p>Estado del modal (isModalPuntosOpen): {{ isModalPuntosOpen }}</p>

    <!-- Sección de filtro y botón de creación de clientes -->
    <div class="filter-container">
      <button class="btn btn-crear" @click="abrirFormularioCrearCliente">Crear Cliente</button>
      <input
        type="text"
        placeholder="Buscar cliente..."
        v-model="filter"
        class="filter-input"
      />
    </div>

    <!-- Tabla para mostrar la lista de clientes -->
    <table class="clientes-table">
      <thead>
        <tr>
          <th>Nombre Cliente</th>
          <th>CIF</th>
          <th>Dirección Fiscal</th>
          <th>PS</th> <!-- Número de puntos de suministro -->
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
            {{ cliente.numeroPuntosSuministro }}
            <button class="btn btn-ojo" @click="verPuntosSuministro(cliente)">👁️</button>
          </td>
          <td>{{ cliente.empleadoAsignado }}</td>
          <td>
            <button class="btn btn-consultar" @click="cargarDatosCliente(cliente.idCliente)">
              Consultar Cliente
            </button>
            <button class="btn btn-crearPS" @click="abrirFormularioNuevoPunto(cliente)">
              Crear PS
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal: Detalle de puntos de suministro -->
    <PuntosSuministroClienteComponent
      v-if="isModalPuntosOpen"
      :cliente="clienteSeleccionado"
      :puntosSuministro="puntosSuministro"
      @cerrar-modal="cerrarModalPuntos"
    />

    <!-- Modal: Crear o actualizar cliente -->
    <CreaActualizaClienteComponent
      :formularioVisible="formularioVisible"
      :modoActualizar="modoActualizar"
      :nuevoCliente="clienteSeleccionado"
      :sectores="sectores"
      :empleados="empleados"
      :subtipologias="subtipologias"
      @cancelar-formulario="formularioVisible = false"
      @crear-cliente="crearCliente"
      @actualizar-cliente="actualizarCliente"
    />

    <!-- Modal: Crear punto de suministro -->
    <CrearPuntosSuministroComponent
      :formulario-visible="showModalPS"
      :cliente-seleccionado="clienteSeleccionado"
      :nuevo-punto="nuevoPunto"
      @guardar-punto-suministro="crearPuntoSuministro"
      @cerrar-formulario="cerrarFormularioNuevoPuntoSuministro"
    />
  </div>
</template>

<script>
import axios from "axios";
import Spinner from "@/components/SpinnerComponent.vue";
import PuntosSuministroClienteComponent from "@/components/CRM_Module/Clientes/PuntosSuministroClienteComponent.vue";
import CreaActualizaClienteComponent from "@/components/CRM_Module/Clientes/CreaActualizaClientesComponent.vue";
import CrearPuntosSuministroComponent from "@/components/CRM_Module/Clientes/CrearPuntosSuministroComponent.vue";

export default {
  name: "ClientesComponent",
  components: {
    Spinner,
    PuntosSuministroClienteComponent,
    CreaActualizaClienteComponent,
    CrearPuntosSuministroComponent,
  },
  data() {
    return {
      clientes: [], // Lista de clientes
      filter: "", // Texto del filtro
      puntosSuministro: [],        // Lista de puntos de suministro
      clienteSeleccionado: null,   // Cliente seleccionado
      isModalPuntosOpen: false,    // Estado para controlar la visibilidad del modal
      loading: false,              // Estado para mostrar un spinner de carga
      formularioVisible: false, // Control de visibilidad del formulario cliente
      modoActualizar: false, // Indica si el formulario está en modo actualizar
      nuevoCliente: this.resetFormularioCliente(), // Datos del nuevo cliente o cliente a actualizar
      sectores: [], // Opciones de sectores
      empleados: [], // Opciones de empleados
      subtipologias: [], // Opciones de subtipologías
      isSubmitting: false, // Evita múltiples envíos del formulario
      showModalPS: false, // Estado del modal de puntos de suministro
      nuevoPunto: this.resetFormularioPuntoSuministro(), // Datos del nuevo punto de suministro
    };
  },
  computed: {
    // Lista de clientes filtrados según el texto de búsqueda
    filteredClientes() {
      const filtro = this.filter.toLowerCase();
      return this.clientes.filter((cliente) => {
        const nombre = cliente.nombre || ""; // Si es null, usa cadena vacía
        const cif = cliente.cif || ""; // Si es null, usa cadena vacía
        return (
          nombre.toLowerCase().includes(filtro) ||
          cif.toLowerCase().includes(filtro)
        );
      });
    },
  },
  watch: {
    isModalPuntosOpen(val) {
      console.log("Estado de isModalPuntosOpen cambió desde el padre:", val);
    }
  },
  methods: {
    // Reinicia el formulario de cliente
    resetFormularioCliente() {
      return {
        nombre: '',
        nombreComercial: '',
        cif: '',
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        iban: '',
        nombreAutorizado: '',
        dniAutorizado: '',
        telefonoAutorizado: '',
        emailAutorizado: '',
        idEmpleado: null,
        actividad: '',
        codigoSector: null,
        codigoSubtipologia: null,
        notas: '',
        userTelemedida: '',
        passTelemedida: '',
        // Autorizados
        nombreContacto1: '',
        cargoContacto1: '',
        emailContacto1: '',
        telefonoContacto1: '',
        nombreContacto2: '',
        cargoContacto2: '',
        emailContacto2: '',
        telefonoContacto2: '',
        nombreContacto3: '',
        cargoContacto3: '',
        emailContacto3: '',
        telefonoContacto3: '', 
      };
    },
    // Reinicia el formulario de punto de suministro
    resetFormularioPuntoSuministro() {
      return {
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
      };
    },
    // Carga la lista de clientes desde el backend
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        this.clientes = response.data;
      } catch (error) {
        console.error("Error al obtener clientes:", error);
        alert("Error al cargar clientes.");
      } finally {
        this.loading = false;
      }
    },
    // Muestra el modal de puntos de suministro para el cliente seleccionado
    verPuntosSuministro(cliente) {
      try {
        console.log("Cliente seleccionado:", cliente);
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true; // Abre el modal primero
        console.log("Abriendo modal...");
        console.log("Estado del modal (isModalPuntosOpen):", this.isModalPuntosOpen);
        this.fetchPuntosSuministro(cliente.idCliente); // Luego carga los puntos
      } catch (error) {
        console.error('Error al mostrar puntos de suministro:', error);
      }
    },
    // Cierra el modal de puntos de suministro
    cerrarModalPuntos() {
        this.isModalPuntosOpen = false; // Cierra el modal
        this.clienteSeleccionado = null; // Limpia el cliente seleccionado
        this.puntosSuministro = []; // Limpia los puntos de suministro cargados
    },
    // Carga los puntos de suministro asociados a un cliente
    async fetchPuntosSuministro(idCliente) {
      try {
        this.loading = true;
        console.log("Cargando puntos de suministro para ID cliente:", idCliente);
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${idCliente}`);
        console.log("Puntos de suministro recibidos:", response.data);
        this.puntosSuministro = response.data;
      } catch (error) {
        console.error("Error al cargar puntos de suministro:", error);
        alert("No se pudieron cargar los puntos de suministro.");
      } finally {
        this.loading = false;
      }
    },

    // Muestra el modal de creación de cliente
    abrirFormularioCrearCliente() {
      this.nuevoCliente = {}; // Asegúrate de que sea un objeto vacío
      this.formularioVisible = true; // Muestra el formulario
      this.modoActualizar = false; // Asegura que sea modo de creación
    },
    // Cierra el modal de cliente
    cancelarFormulario() {
      this.formularioVisible = false;
      this.nuevoCliente = this.resetFormularioCliente(); // Limpia los datos al cerrar
    },
    // Carga datos para actualizar un cliente
    async cargarDatosCliente(idCliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cliente`,{ params: { idCliente } });
        this.clienteSeleccionado = response.data;
        this.formularioVisible = true;
        this.modoActualizar = true;
      } catch (error) {
          console.error("Error al cargar datos del cliente:", error);
      }
    },
    // Lógica para actualizar cliente
    async actualizarCliente(clienteActualizado) {
      console.log("Cliente recibido para actualizar:", clienteActualizado); // Verifica que los datos sean correctos
      if (!clienteActualizado.id) {
        console.error("El cliente recibido no tiene un ID.");
        return;
      }
      try {
        await axios.put(`${process.env.VUE_APP_API_URL}/api/clientes/${clienteActualizado.id}`, clienteActualizado);
        alert("Cliente actualizado.");
        this.fetchClientes(); // Actualiza la lista de clientes
        this.cancelarFormulario();
      } catch (error) {
        console.error("Error al actualizar cliente:", error);
      }
    },
    // Lógica para crear cliente
    async crearCliente(clienteRecibido) {
      try {
        if (this.modoActualizar) return; // Evita llamadas erróneas en modo actualización
        console.log("Cliente recibido para crear:", clienteRecibido); // Verifica que los datos sean correctos
        await axios.post(`${process.env.VUE_APP_API_URL}/api/clientes/cliente`, clienteRecibido);
        alert("Cliente creado con éxito.");
        this.fetchClientes(); // Actualiza la lista
        this.cancelarFormulario(); // Limpia y cierra el formulario
      } catch (error) {
        console.error("Error al crear cliente:", error);
      }
    },
    // Muestra el modal para crear un punto de suministro
    abrirFormularioNuevoPunto(cliente) {
      this.nuevoPunto = this.resetFormularioPuntoSuministro();
      this.nuevoPunto.cliente = cliente;
      this.showModalPS = true;
    },
    // Cierra el modal de puntos de suministro
    cerrarFormularioNuevoPuntoSuministro() {
      this.showModalPS = false;
    },
    // Crea un nuevo punto de suministro
    async crearPuntoSuministro() {
      try {
        // Adaptamos los datos para que coincidan con el formato que requiere el backend
        const datosAdaptados = {
          direccion: this.nuevoPunto.direccion,
          cliente: this.nuevoPunto.cliente,
          codigoPostal: this.nuevoPunto.codigoPostal,
          poblacion: this.nuevoPunto.poblacion,
          provincia: this.nuevoPunto.provincia,
          propiedadContador: this.nuevoPunto.propiedadContador ? 1 : 0,
          contador: this.nuevoPunto.contador,
          propiedadModem: this.nuevoPunto.propiedadModem ? 1 : 0,
          modem: this.nuevoPunto.modem,
          observaciones: this.nuevoPunto.observaciones,
          fechaInstalacion: this.nuevoPunto.fechaInstalacion,
          id_cliente: { id: this.nuevoPunto.idCliente },
          cupsluz: this.nuevoPunto.cupsluz,
          cupsgas: this.nuevoPunto.cupsgas,
        };
        console.log("Datos enviados al backend (JSON):", JSON.stringify(datosAdaptados, null, 2));

        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro/save`,
          datosAdaptados
        );
        alert("Punto de suministro creado.");
        this.fetchClientes();
        this.cerrarFormularioNuevoPuntoSuministro();
      } catch (error) {
        console.error("Error al crear punto de suministro:", error);
      }
    },
    // Carga las opciones de los selects
    async fetchSelectData() {
      try {
        const [empleados, sectores, subtipologias] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/api/empleados`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/sectores`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/subtipologias`),
        ]);
        this.empleados = empleados.data;
        this.sectores = sectores.data;
        this.subtipologias = subtipologias.data;
      } catch (error) {
        console.error("Error al cargar datos de selects:", error);
      }
    },
  },
  mounted() {
    this.fetchClientes();
    this.fetchSelectData();
  },
};
</script>

