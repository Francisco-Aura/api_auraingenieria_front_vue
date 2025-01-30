<template>
  <!-- Contenedor principal del módulo de gestión de clientes -->
  <div class="clientes-container">
    <!-- Muestra un spinner mientras se realizan solicitudes al servidor -->
    <Spinner :isLoading="loading" />  
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
          <th>Usuario</th>
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
            <button class="btn btn-ojo" @click="verPuntosSuministro(cliente)" title="Ver puntos de suministro">👁️</button>
          </td>
          <td>{{ cliente.usuarioAsignado }}</td>
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

    <Teleport to="body">
      <!-- Modal: Detalle de puntos de suministro -->
      <PuntosSuministroClienteComponent
        v-if="isModalPuntosOpen"
        :cliente="clienteSeleccionado"
        :puntosSuministro="puntosSuministro"
        @cerrar-modal="cerrarModalPuntos"
      />
    </Teleport>

    <Teleport to="body">
      <!-- Modal: Crear o actualizar cliente -->
      <CreaActualizaClienteComponent
        :formularioVisible="formularioVisible"
        :modoActualizar="modoActualizar"
        :nuevoCliente="clienteSeleccionado"
        :sectores="sectores"
        :usuarios="usuarios"
        :subtipologias="subtipologias"
        @cancelar-formulario="formularioVisible = false"
        @crear-cliente="crearCliente"
        @actualizar-cliente="actualizarCliente"
      />
    </Teleport>
    
    <Teleport to="body">
      <!-- Modal: Crear punto de suministro, con teleport nos lo llevamos al DOM y sacamos del componente -->
      <CrearPuntosSuministroComponent
        v-if="showModalPS"
        :ShowModalPS="showModalPS"
        :formulario-visible="showModalPS"
        :cliente="clienteSeleccionado"
        :nuevo-punto="nuevoPunto"
        @guardar-punto-suministro="crearPuntoSuministro"
        @cerrar-formulario="cerrarFormularioNuevoPuntoSuministro"
      />
    </Teleport>
    
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
      usuarios: [], // Opciones de usuarios
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
  methods: {
    // Carga la lista de clientes desde el backend
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        this.clientes = response.data;
        console.log("Clientes cargados:", this.clientes);
      } catch (error) {
        console.error("Error al cargar clientes:", error);
      } finally {
        this.loading = false;
      }
    },
    // Carga los puntos de suministro asociados a un cliente
    async fetchPuntosSuministro(idCliente) {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${idCliente}`);
        console.log("Puntos de suministro recibidos:", response.data);
        this.puntosSuministro = response.data;
      } catch (error) {
        alert("No se pudieron cargar los puntos de suministro.");
      } finally {
        this.loading = false;
      }
    },
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
        idUsuario: null,
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
        direccion: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        propiedadContador: 0,
        contador: '',
        propiedadModem: 0,
        modem: '',
        observaciones: '',
        fechaInstalacion: '',
        idCliente: null,
        nombreCliente: '',
        cupsluz: '',
        cupsgas: ''
      };
    },    
    // Muestra el modal de puntos de suministro para el cliente seleccionado
    verPuntosSuministro(cliente) {
      try {
        console.log("Cliente seleccionado para ver los puntos de suministro :", cliente);
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true; // Abre el modal primero
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
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/${idCliente}`);
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
        await axios.post(`${process.env.VUE_APP_API_URL}/api/clientes`, clienteRecibido);
        alert("Cliente creado con éxito.");
        this.fetchClientes(); // Actualiza la lista
        this.cancelarFormulario(); // Limpia y cierra el formulario
      } catch (error) {
        console.error("Error al crear cliente:", error);
      }
    },
    // Muestra el modal para crear un punto de suministro
    abrirFormularioNuevoPunto(cliente) {
      console.log("Cliente recibido para crear punto de suministro:", cliente); // Verifica que los datos sean correctos
      this.clienteSeleccionado = cliente;
      this.nuevoPunto = this.resetFormularioPuntoSuministro();
      this.nuevoPunto.idCliente = cliente.idCliente; // Asigna el idCliente
      this.nuevoPunto.nombreCliente = cliente.nombre; // Asigna el nombreCliente
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
        // Adaptamos los datos para que coincidan con el formato que requiere el backend
        const datosAdaptados = {
          direccion: this.nuevoPunto.direccion,
          codigoPostal: this.nuevoPunto.codigoPostal,
          poblacion: this.nuevoPunto.poblacion,
          provincia: this.nuevoPunto.provincia,
          propiedadContador: this.nuevoPunto.propiedadContador ? 1 : 0,
          contador: this.nuevoPunto.contador,
          propiedadModem: this.nuevoPunto.propiedadModem ? 1 : 0,
          modem: this.nuevoPunto.modem,
          observaciones: this.nuevoPunto.observaciones,
          fechaInstalacion: this.nuevoPunto.fechaInstalacion,
          cliente: { id: this.nuevoPunto.idCliente }, // Aquí adaptamos el formato para que coincida con el backend
          clienteNombre: this.nuevoPunto.nombreCliente,
          CUPSluz: this.nuevoPunto.cupsluz, // Respeta mayúsculas/minúsculas del modelo
          CUPSgas: this.nuevoPunto.cupsgas,
        };
        console.log("Datos enviados al backend (JSON):", JSON.stringify(datosAdaptados, null, 2));

        await axios.post(
          `${process.env.VUE_APP_API_URL}/api/puntos-suministro`,
          datosAdaptados
        );
        alert("Punto de suministro creado.");
        this.fetchClientes();
        this.cerrarFormularioNuevoPuntoSuministro();
      } catch (error) {
        console.error("Error al crear punto de suministro:", error);
      }
    },    
  },
  async mounted() {
    this.loading = true; // Forzar la visibilidad del spinner
    setTimeout(() => { 
      this.loading = false; 
    }, 2000); // Simular carga por 2 segundos
    //Precargamos los arrays de los combos
    try {
      const [clientes, usuarios, sectores, subtipologias] = await Promise.all([
        axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/usuarios`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/sectores`),
        axios.get(`${process.env.VUE_APP_API_URL}/api/subtipologias`),
      ]);
      this.clientes = clientes.data;
      this.usuarios = usuarios.data;
      this.sectores = sectores.data;
      this.subtipologias = subtipologias.data;
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

 