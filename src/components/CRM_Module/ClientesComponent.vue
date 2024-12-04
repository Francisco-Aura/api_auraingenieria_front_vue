<template>
  <!-- Componente Spinner para mostrar cuando la aplicación esté cargando -->
  <Spinner :isLoading="loading" />

  <div class="clientes-container">
    <!-- Contenedor para el filtro y el botón de creación de clientes -->
    <div class="filter-container">
      <button class="btn btn-crear" @click="abrirFormularioCliente">Crear Cliente</button>
      <!-- Campo de entrada para filtrar clientes por nombre o CIF -->
      <input type="text" placeholder="Buscar cliente..." v-model="filter" class="filter-input" />
    </div>

    <!-- Tabla para mostrar la lista de clientes -->
    <table class="clientes-table">
      <thead>
        <tr>
          <th>Nombre Cliente</th>
          <th>CIF</th>
          <th>Dirección Fiscal</th>
          <th>PS</th> <!-- Puntos de suministro -->
          <th>Empleado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <!-- Itera sobre los clientes filtrados para mostrarlos en la tabla -->
        <tr v-for="cliente in filteredClientes" :key="cliente.idCliente">
          <td>{{ cliente.nombre }}</td>
          <td>{{ cliente.cif }}</td>
          <td>{{ cliente.direccionFiscal }}</td>
          <td>
            <!-- Total de puntos de suministro y botón para ver detalles -->
            {{ cliente.totalPuntosSuministro }}
            <button class="btn btn-ojo" @click="verPuntosSuministro(cliente)">👁️</button>
          </td>
          <td>{{ cliente.empleadoAsignado }}</td>
          <td>
            <!-- Botón para consultar los datos de un cliente específico -->
            <button class="btn btn-consultar" @click="abrirFormularioClienteActualizar(cliente.idCliente)">
              Consulta Cliente
            </button>
            <!-- Botón para crear un nuevo punto de suministro (aún no implementado) -->
            <button class="btn btn-crearPS">Crear Punto Suministro</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para mostrar los puntos de suministro de un cliente -->
    <div v-if="isModalPuntosOpen" class="modal-overlay">
      <div class="modal-content">
        <h2>Puntos de Suministro del Cliente: {{ clienteSeleccionado?.nombre || 'Desconocido' }}</h2>

        <!-- Filtro para los puntos de suministro -->
        <input
          type="text"
          placeholder="Buscar en puntos de suministro..."
          v-model="filterPuntos"
          class="filter-input full-width"
        />
        <table class="puntos-suministro-table">
          <thead>
            <tr>
              <th>Dirección</th>
              <th>CUPS Luz</th>
              <th>CUPS Gas</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>            
            <tr v-for="punto in filteredPuntosSuministro()" :key="punto.idPunto">
              <td>{{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}</td>
              <td>{{ punto.cupsluz }}</td>
              <td>{{ punto.cupsgas }}</td>
              <td>
                <button class="btn btn-detalle" @click="verDetallePunto(punto)">Detalle</button>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- Botón para cerrar el modal -->
        <button @click="closeModalPuntos " class="btn btn-cancelar">Cerrar</button>
      </div>
    </div>

    <!-- Modal para crear o modificar clientes -->
    <div v-if="formularioVisible" class="modal-overlay">
      <div class="modal-content">
        <!-- Título dinámico según el modo del formulario -->
        <h2>{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
        <!-- Formulario para crear o actualizar clientes -->
        <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()">
          <div class="form-container">
            <div class="form-column">
              <!-- Columna 1 -->
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" v-model="nuevoCliente.nombre" required />

              <label for="direccionFiscal">Dirección Fiscal</label>
              <input type="text" id="direccionFiscal" v-model="nuevoCliente.direccion" required />

              <label for="codigoPostal">Código Postal</label>
              <input type="text" id="codigoPostal" v-model="nuevoCliente.codigoPostal" required />

              <label for="poblacion">Población</label>
              <input type="text" id="poblacion" v-model="nuevoCliente.poblacion" required />

              <label for="provincia">Provincia</label>
              <input type="text" id="provincia" v-model="nuevoCliente.provincia" required />

              <label for="iban">IBAN</label>
              <input type="text" id="iban" v-model="nuevoCliente.iban" required />

              <label for="nombreContacto">Nombre de Contacto</label>
              <input type="text" id="nombreContacto" v-model="nuevoCliente.nombreContacto" required />

              <label for="dniContacto">DNI Contacto</label>
              <input type="text" id="dniContacto" v-model="nuevoCliente.dniContacto" required />

              <label for="telefonoContacto">Teléfono de Contacto</label>
              <input type="text" id="telefonoContacto" v-model="nuevoCliente.telefonoContacto" required />

              <label for="emailContacto">Email de Contacto</label>
              <input type="email" id="emailContacto" v-model="nuevoCliente.emailContacto" required />

              <label for="empleado">Empleado</label>
              <select id="empleado" v-model="nuevoCliente.idEmpleado" required>
                <option value="">Seleccione un empleado</option>
                <option v-for="empleado in empleados" :key="empleado.idUsuario" :value="empleado.idUsuario">
                  {{ empleado.nombre }}
                </option>
              </select>
              
              <label for="actividad">Actividad</label>
              <input type="text" id="actividad" v-model="nuevoCliente.actividad" />

              <label for="codigoSector">Código Sector</label>
              <select id="codigoSector" v-model="nuevoCliente.codigoSector" required>
                <option value="">Seleccione un código sector</option>
                <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                  {{ sector.nombre }}
                </option>
              </select>

              <label for="codigoSubtipologia">Código Subtipología</label>
              <select id="codigoSubtipologia" v-model="nuevoCliente.codigoSubtipologia" required>
                <option value="">Seleccione un código subtipología</option>
                <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                  {{ subtipologia.nombre }}
                </option>
              </select>

              <label for="notas">Notas</label>
              <textarea id="notas" v-model="nuevoCliente.notas"></textarea>
            </div>            
            <!-- Columna 4 -->
            <div class="form-column">
              <label for="nombreAutorizado1">Nombre Autorizado 1</label>
              <input type="text" id="nombreAutorizado1" v-model="nuevoCliente.nombreAutorizado1" />

              <label for="cargoAutorizado1">Cargo Autorizado 1</label>
              <input type="text" id="cargoAutorizado1" v-model="nuevoCliente.cargoAutorizado1" />

              <label for="dniAutorizado1">DNI Autorizado 1</label>
              <input type="text" id="dniAutorizado1" v-model="nuevoCliente.dniAutorizado1" />

              <label for="emailAutorizado1">Email Autorizado 1</label>
              <input type="email" id="emailAutorizado1" v-model="nuevoCliente.emailAutorizado1" />

              <label for="nombreAutorizado1">Telefono Autorizado 1</label>
              <input type="text" id="nombreAutorizado1" v-model="nuevoCliente.telefonoAutorizado1" />

              <label for="nombreAutorizado2">Nombre Autorizado 2</label>
              <input type="text" id="nombreAutorizado2" v-model="nuevoCliente.nombreAutorizado2" />

              <label for="cargoAutorizado2">Cargo Autorizado 2</label>
              <input type="text" id="cargoAutorizado2" v-model="nuevoCliente.cargoAutorizado2" />

              <label for="dniAutorizado2">DNI Autorizado 2</label>
              <input type="text" id="dniAutorizado2" v-model="nuevoCliente.dniAutorizado2" />

              <label for="emailAutorizado2">Email Autorizado 2</label>
              <input type="email" id="emailAutorizado2" v-model="nuevoCliente.emailAutorizado2" />

              <label for="nombreAutorizado2">Telefono Autorizado 2</label>
              <input type="text" id="nombreAutorizado2" v-model="nuevoCliente.telefonoAutorizado2" />

              <label for="nombreAutorizado3">Nombre Autorizado 3</label>
              <input type="text" id="nombreAutorizado3" v-model="nuevoCliente.nombreAutorizado3" />

              <label for="cargoAutorizado3">Cargo Autorizado 3</label>
              <input type="text" id="cargoAutorizado3" v-model="nuevoCliente.cargoAutorizado3" />

              <label for="dniAutorizado3">DNI Autorizado 3</label>
              <input type="text" id="dniAutorizado3" v-model="nuevoCliente.dniAutorizado3" />

              <label for="emailAutorizado3">Email Autorizado 3</label>
              <input type="email" id="emailAutorizado3" v-model="nuevoCliente.emailAutorizado3" />

              <label for="nombreAutorizado3">Telefono Autorizado 3</label>
              <input type="text" id="nombreAutorizado3" v-model="nuevoCliente.telefonoAutorizado3" />
            </div>
          </div>

          <div>
            <!-- Botón dinámico para crear o actualizar según el modo -->
            <button type="submit" :disabled="isSubmitting">
              {{ modoActualizar ? 'Actualizar' : 'Crear' }}
            </button>
            <!-- Botón para cancelar y cerrar el formulario -->
            <button type="button" class="btn btn-cancelarUsuario" @click="cancelarFormulario">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Spinner from "@/components/SpinnerComponent.vue"; // Asegúrate de ajustar la ruta según tu estructura de carpetas

export default {
  name: 'ClientesComponent',
  components: {
    Spinner, // Componente para mostrar un spinner durante cargas
  },
  data() {
    return {
      // Lista de clientes obtenida del backend
      clientes: [],
      // Lista de empleados para el select del formulario
      empleados: [],
      // Lista de puntos de suministro del cliente seleccionado
      puntosSuministro: [],
      // Controla la visibilidad del modal de puntos de suministro
      isModalPuntosOpen: false,
      //Cliente seleccionado para mostrar sus puntos de suministro
      clienteSeleccionado: null, 
      // ID del cliente seleccionado para actualizar
      idClienteActualizar: null,
      // Evita múltiples envíos del formulario
      isSubmitting: false,
      // Listas para selects de sectores y subtipologías
      sectores: [],
      subtipologias: [],
      // Filtro para buscar clientes      
      filter: '',
      // Filtro para buscar en los puntos de suministro
      filterPuntos: '',
      // Controla la visibilidad del formulario de clientes
      formularioVisible: false,
      // Indica si el formulario está en modo actualización
      modoActualizar: false,
      // Objeto para almacenar los datos del cliente nuevo o actualizado
      nuevoCliente: {   
        // Campos inicializados en blanco o null     
        nombre: '',
        nombreComercial: '',
        cif: '',
        direccionFiscal: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        iban: '',
        nombreContacto: '',
        dniContacto: '',
        telefonoContacto: '',
        emailContacto: '',
        empleado: null,
        actividad: '',
        codigoSector: null,
        codigoSubtipologia: null,
        notas: '',
        //Autorizados
        nombreAutorizado1: '',
        cargoAutorizado1: '',
        dniAutorizado1: '',
        emailAutorizado1: '',
        telefonoAutorizado1: '',
        nombreAutorizado2: '',
        cargoAutorizado2: '',
        dniAutorizado2: '',
        emailAutorizado2: '',
        telefonoAutorizado2: '',
        nombreAutorizado3: '',
        cargoAutorizado3: '',
        dniAutorizado3: '',
        emailAutorizado3: '',
        telefonoAutorizado3: '',
        
      },
    };
  },  
  computed: {
    // Calcula una lista de clientes filtrados según el texto de búsqueda
    filteredClientes() {
      return this.clientes
        .map((cliente) => ({
          ...cliente,
          direccionFiscal: `${cliente.direccionFiscal || ''}`, // Aseguramos que siempre sea un string
          totalPuntosSuministro: cliente.numeroPuntosSuministro || 0,
          empleado: cliente.empleadoAsignado,
        }))
        .filter((cliente) => {
          const nombre = cliente.nombre || ''; // Evita errores si nombre es null o undefined
          const cif = cliente.cif || ''; // Evita errores si cif es null o undefined
          const filtro = this.filter?.toLowerCase() || ''; // Asegura que filter no sea null
          return nombre.toLowerCase().includes(filtro) || cif.toLowerCase().includes(filtro);
        });
    },
  },
  methods: {
    normalizeText(text) {
      return text
        ? text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
            .toLowerCase()
        : ''; // Devuelve una cadena vacía si el texto es null o undefined
    },
    //Llamada para obtener todos los clientes
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        console.log('Clientes cargados:', response.data);
        this.clientes = response.data;
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      } finally {
        this.loading = false;
      }
    },
    //Llamada para obtener los puntos de suministro de un cliente (boton OJO)
    async verPuntosSuministro(cliente) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${cliente.idCliente}`);
        console.log('Puntos de suministro:', response.data); // Verifica la respuesta
        this.puntosSuministro = response.data;
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true;
      } catch (error) {
        console.error('Error al obtener los puntos de suministro:', error);
      }
    },
    closeModalPuntos() {
      this.isModalPuntosOpen = false; // Cierra el modal de puntos de suministro
      this.puntosSuministro = [];
    },
    verDetallePunto(punto) {
      console.log('Ver detalle del punto de suministro:', punto);
      // Aquí podrías agregar la lógica para mostrar más detalles
    },
    // Lista filtrada de puntos de suministro
    filteredPuntosSuministro() {
      const filtro = this.normalizeText(this.filterPuntos); // Normalizamos el texto del filtro
      return this.puntosSuministro.filter((punto) => {
        // Concatenamos todas las propiedades de los puntos de suministro que queremos filtrar
        const concatenated = [
          punto.direccion || '',
          punto.codigoPostal || '',
          punto.poblacion || '',
          punto.provincia || '',
          punto.cupsluz || '',
          punto.cupsgas || ''
        ].join(' ').toLowerCase(); // Aseguramos que la concatenación sea una cadena en minúsculas
        return this.normalizeText(concatenated).includes(filtro); // Comparamos el filtro con el texto concatenado
      });
    }, 
    abrirFormularioClienteActualizar(idCliente) {
      this.idClienteActualizar = idCliente;
      console.log("Cargando datos para cliente con ID:", idCliente); // Verifica si llega aquí      
      axios
        .get(`${process.env.VUE_APP_API_URL}/api/clientes/cliente`, { params: { idCliente } })
        .then((response) => {
          console.log("Datos del cliente recibidos:", response.data); // Verifica los datos recibidos
          this.nuevoCliente = { ...response.data, idCliente }; // Asegura que idCliente esté definido
          this.nuevoCliente = response.data;
          this.formularioVisible = true;
          this.modoActualizar = true;
        })
        .catch((error) => {
          console.error("Error al obtener los datos del cliente:", error);
        });
    },
    // Actualiza un cliente
async actualizarCliente() {
  if (!this.idClienteActualizar) {
    console.error("ID del cliente no definido. No se puede actualizar.");
    alert("Error: El cliente seleccionado no tiene un ID válido.");
    return;
  }
  
  this.isSubmitting = true;

  try {
    // Enviar datos actualizados al backend
    const response = await axios.put(
      `${process.env.VUE_APP_API_URL}/api/clientes/${this.idClienteActualizar}`,
      this.nuevoCliente // Objeto con los datos actualizados
    );
    
    // Validar respuesta del backend
    if (response.status === 200) {
      alert('Cliente actualizado con éxito.');
      this.cancelarFormulario();
      this.fetchClientes(); // Actualiza la lista de clientes
    }
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);

    if (error.response) {
      // Manejar errores específicos
      switch (error.response.status) {
        case 400:
          alert('Datos inválidos. Por favor, revise los campos ingresados.');
          break;
        case 404:
          alert('Cliente no encontrado.');
          break;
        case 500:
          alert('Error interno del servidor. Intente nuevamente más tarde.');
          break;
        default:
          alert('Ocurrió un error inesperado.');
      }
    } else {
      alert('No se pudo conectar con el servidor. Intente nuevamente.');
    }
  } finally {
    this.isSubmitting = false;
  }
},


    cancelarFormulario() {
      this.formularioVisible = false;
      this.modoActualizar = false; // Vuelve a modo creación por defecto
      this.resetFormulario();
    },

    abrirFormularioCliente () {
      this.resetFormulario();  // Asegura que el formulario esté vacío
      this.formularioVisible = true;  // Muestra el formulario
      this.modoActualizar = false;  // Asegura que está en modo de creación
    },

    async fetchSelectData() {
      try {
        const [empleadosResponse, sectoresResponse, subtipologiasResponse] = await Promise.all([
          axios.get(`${process.env.VUE_APP_API_URL}/api/empleados`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/sectores`),
          axios.get(`${process.env.VUE_APP_API_URL}/api/subtipologias`),
        ]);
        this.empleados = empleadosResponse.data;
        this.sectores = sectoresResponse.data;
        this.subtipologias = subtipologiasResponse.data;
      } catch (error) {
        console.error('Error al obtener datos de selects:', error);
        alert('Error al cargar datos para el formulario. Intente nuevamente más tarde.');
      }
    },

    async crearCliente() {
      this.isSubmitting = true;
      //console.log('Datos enviados al backend:', this.nuevoCliente); // Verifica aquí los valores
      if (!this.nuevoCliente.nombre || !this.nuevoCliente.cif) {
        this.isSubmitting = false;
        alert('El nombre y CIF son obligatorios.');
        return;
      }
      try {
        // Agregar fecha y hora del sistema
        this.nuevoCliente.fechaAlta = new Date().toISOString(); // Formato ISO para compatibilidad
        await axios.post(`${process.env.VUE_APP_API_URL}/api/clientes/cliente`, this.nuevoCliente);
        this.fetchClientes();  // Actualiza la lista de clientes
        this.cancelarFormulario();  // Cierra el formulario
      } catch (error) {
        console.error('Error al crear cliente:', error);        
        alert('Hubo un error al crear el cliente. Por favor, inténtelo de nuevo.');
      } finally {
        this.isSubmitting = false;
      }
    },

    resetFormulario() {
      this.nuevoCliente = {
        nombre: '',
        nombreComercial: '',
        cif: '',
        direccionFiscal: '',
        codigoPostal: '',
        poblacion: '',
        provincia: '',
        iban: '',
        nombreContacto: '',
        dniContacto: '',
        telefonoContacto: '',
        emailContacto: '',
        empleado: null,
        actividad: '',
        codigoSector: null,
        codigoSubtipologia: null,
        notas: '',
        //Autorizados
        nombreAutorizado1: '',
        cargoAutorizado1: '',
        dniAutorizado1: '',
        emailAutorizado1: '',
        telefonoAutorizado1: '',
        nombreAutorizado2: '',
        cargoAutorizado2: '',
        dniAutorizado2: '',
        emailAutorizado2: '',
        telefonoAutorizado2: '',
        nombreAutorizado3: '',
        cargoAutorizado3: '',
        dniAutorizado3: '',
        emailAutorizado3: '',
        telefonoAutorizado3: '',
      };
    },    
  },
  mounted() {
    this.fetchClientes(); // Carga inicial de la lista de clientes
    this.fetchSelectData(); // Carga inicial de empleados, sectores y subtipologías
  },
};
</script>