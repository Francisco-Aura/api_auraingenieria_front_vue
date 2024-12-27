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
            <button class="btn btn-crearPS" @click="CrearPuntoSuministro(cliente)">Crear Punto Suministro</button>
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
            <tr v-for="punto in filteredPuntosSuministro" :key="punto.idPunto">
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
            <!-- Columna 1 -->
            <div class="form-column">              
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" v-model="nuevoCliente.nombre" required />

              <label for="direccionFiscal">Dirección Fiscal</label>
              <input type="text" id="direccionFiscal" v-model="nuevoCliente.direccion" required />              

              <label for="iban">IBAN</label>
              <input type="text" id="iban" v-model="nuevoCliente.iban" required />

              <label for="nombreAutorizado">Nombre de AUTORIZADO</label>
              <input type="text" id="nombreAutorizado" v-model="nuevoCliente.nombreAutorizado" required />                     

              <label for="nombreContacto1">Nombre Contacto 1</label>
              <input type="text" id="nombreContacto1" v-model="nuevoCliente.nombreContacto1" />
             
              <label for="nombreContacto2">Nombre Contacto 2</label>
              <input type="text" id="nombreContacto2" v-model="nuevoCliente.nombreContacto2" />             

              <label for="nombreContacto3">Nombre Contacto 3</label>
              <input type="text" id="nombreContacto3" v-model="nuevoCliente.nombreContacto3" />
            </div>

            <!-- Columna 2 -->
            <div class="form-column">              
              <label for="nombreComercial">Nombre Comercial</label>
              <input type="text" id="nombreComercial" v-model="nuevoCliente.nombreComercial" required />

              <label for="codigoPostal">Código Postal</label>
              <input type="text" id="codigoPostal" v-model="nuevoCliente.codigoPostal" required />
        
              <label for="actividad">Actividad</label>
              <input type="text" id="actividad" v-model="nuevoCliente.actividad" />

              <label for="dniAutorizado">DNI AUTORIZADO</label>
              <input type="text" id="dniAutorizado" v-model="nuevoCliente.dniAutorizado" required />

              <label for="cargoContacto1">Cargo Contacto 1</label>
              <input type="text" id="cargoContacto1" v-model="nuevoCliente.cargoContacto1" />

              <label for="cargoContacto2">Cargo Contacto 2</label>
              <input type="text" id="cargoContacto2" v-model="nuevoCliente.cargoContacto2" />          

              <label for="cargoContacto3">Cargo Contacto 3</label>
              <input type="text" id="cargoContacto3" v-model="nuevoCliente.cargoContacto3" />
         
            </div>   
            <!-- Columna 3 -->
            <div class="form-column">              
              <label for="cif">CIF</label>
              <input type="text" id="cif" v-model="nuevoCliente.cif" required />

              <label for="poblacion">Población</label>
              <input type="text" id="poblacion" v-model="nuevoCliente.poblacion" required />

              <label for="codigoSector">Código Sector</label>
              <select id="codigoSector" v-model="nuevoCliente.codigoSector" required>
                <option value="">Seleccione un código sector</option>
                <option v-for="sector in sectores" :key="sector.id" :value="sector.id">
                  {{ sector.nombre }}
                </option>
              </select>                

              <label for="telefonoContacto">Teléfono de AUTORIZADO</label>
              <input type="text" id="telefonoAutorizado" v-model="nuevoCliente.telefonoAutorizado" required />             

              <label for="telefonoContacto1">Telefono Contacto 1</label>
              <input type="text" id="telefonoContacto1" v-model="nuevoCliente.telefonoContacto1" />            

              <label for="telefonoContacto2">Telefono Contacto 2</label>
              <input type="text" id="telefonoContacto2" v-model="nuevoCliente.telefonoContacto2" />             

              <label for="telefonoContacto3">Telefono Contacto 3</label>
              <input type="text" id="telefonoContacto3" v-model="nuevoCliente.telefonoContacto3" />

              <label for="userTelemedida">Usuario Telemedida</label>
              <input type="text" id="userTelemedida" v-model="nuevoCliente.userTelemedida" />
                        
            </div> 

            <!-- Columna 4 -->
            <div class="form-column">
              <label for="empleado">Empleado</label>
              <select id="empleado" v-model="nuevoCliente.idEmpleado" required>
                <option value="">Seleccione un empleado</option>
                <option v-for="empleado in empleados" :key="empleado.idUsuario" :value="empleado.idUsuario">
                  {{ empleado.nombre }}
                </option>
              </select>              

              <label for="provincia">Provincia</label>
              <input type="text" id="provincia" v-model="nuevoCliente.provincia" required />

              <label for="codigoSubtipologia">Código Subtipología</label>
              <select id="codigoSubtipologia" v-model="nuevoCliente.codigoSubtipologia" required>
                <option value="">Seleccione un código subtipología</option>
                <option v-for="subtipologia in subtipologias" :key="subtipologia.id" :value="subtipologia.id">
                  {{ subtipologia.nombre }}
                </option>
              </select>              

              <label for="emailAutorizado">Email de AUTORIZADO</label>
              <input type="email" id="emailAutorizado" v-model="nuevoCliente.emailAutorizado" required />

              <label for="emailContacto1">Email Contacto 1</label>
              <input type="email" id="emailContacto1" v-model="nuevoCliente.emailContacto1" />
             
              <label for="emailContacto2">Email Contacto 2</label>
              <input type="email" id="emailContacto2" v-model="nuevoCliente.emailContacto2" />
            
              <label for="emailContacto3">Email Contacto 3</label>
              <input type="email" id="emailContacto3" v-model="nuevoCliente.emailContacto3" />    
              
              <label for="passTelemedida">Contraseña Telemedida</label>
              <input type="text" id="passTelemedida" v-model="nuevoCliente.passTelemedida" />
            </div>
          </div>

          <!-- Campo "Notas" ocupa el ancho completo al final -->
          <div class="form-notas full-width">
            <label for="notas">Notas</label>
            <textarea id="notas" v-model="nuevoCliente.notas"></textarea>
          </div>

          <!-- Botones de acción -->
          <div class="form-buttons">            
            <button type="button" class="btn btn-cancelarUsuario" @click="cancelarFormulario">Cancelar</button>
            <button type="submit" :disabled="isSubmitting" class="btn" >
              {{ modoActualizar ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal para crear puntos de suministro -->
    <div v-if="showModal_PS" class="modal-overlay">
      <div class="modal-content" style="width: 80%; max-width: 900px; padding: 20px;">
        <h1>Nuevo Punto de Suministro</h1>
        <br>
        <h2>{{ clienteSeleccionado?.nombre || 'Desconocido' }}</h2>

        <!-- Formulario -->
        <form @submit.prevent="createPuntoSuministro">
          <div class="form-grid">
            <!-- Primera Columna -->
            <div class="form-column">
              <div class="form-group">
                <label for="direccion">Dirección</label>
                <input 
                  type="text" 
                  id="direccion" 
                  v-model="nuevoPunto.direccion" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="codigoPostal">Código Postal</label>
                <input 
                  type="text" 
                  id="codigoPostal" 
                  v-model="nuevoPunto.codigoPostal" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="poblacion">Población</label>
                <input 
                  type="text" 
                  id="poblacion" 
                  v-model="nuevoPunto.poblacion" 
                  class="form-control" 
                  required
                />
              </div>
              <div class="form-group">
                <label for="provincia">Provincia</label>
                <input 
                  type="text" 
                  id="provincia" 
                  v-model="nuevoPunto.provincia" 
                  class="form-control" 
                  required
                />
              </div>
            </div>

            <!-- Segunda Columna -->
            <div class="form-column">
              <div class="form-group">
                <label for="cupsluz">CUPS Luz</label>
                <input 
                  type="text" 
                  id="cupsluz" 
                  v-model="nuevoPunto.cupsluz" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label for="cupsgas">CUPS Gas</label>
                <input 
                  type="text" 
                  id="cupsgas" 
                  v-model="nuevoPunto.cupsgas" 
                  class="form-control" 
                />
              </div>
              <div class="form-group">
                <label for="contador">Contador</label>
                <div class="input-with-checkbox">
                  <input 
                    type="text" 
                    id="contador" 
                    v-model="nuevoPunto.contador" 
                    class="form-control" 
                    @input="nuevoPunto.propiedadContador = !!nuevoPunto.contador"
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="modem">Modem</label>
                <div class="input-with-checkbox">
                  <input 
                    type="text" 
                    id="modem" 
                    v-model="nuevoPunto.modem" 
                    class="form-control" 
                    @input="nuevoPunto.propiedadModem = !!nuevoPunto.modem"
                  />
                </div>
              </div>
            </div>

            <!-- Campos que ocupan dos columnas -->
            <div class="form-group full-width">
              <label for="observaciones">Observaciones</label>
              <textarea 
                id="observaciones" 
                v-model="nuevoPunto.observaciones" 
                class="form-control" 
                rows="3"
              ></textarea>
            </div>
            <div class="form-group full-width">
              <label for="fechaInstalacion">Fecha de Instalación</label>
              <input 
                type="date" 
                id="fechaInstalacion" 
                v-model="nuevoPunto.fechaInstalacion" 
                class="form-control" 
              />
            </div>
          </div>

          <!-- Botones -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal_PS">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
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
      // Cliente seleccionado para mostrar sus puntos de suministro
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
        nombreAutorizado: '',
        dniAutorizado: '',
        telefonoAutorizado: '',
        emailAutorizado: '',
        empleado: null,
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
      },
      showModal_PS: false,
      nuevoPunto: {        
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        propiedadContador: 0,
        contador: '',
        propiedadModem: 0,
        modem: '',
        observaciones: '',
        fechaInstalacion: ''
      },
      loading: false, // Controla el estado del spinner
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
  },
  methods: {
    normalizeText(text) {
      return text
        ? text
            .toString()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '') // Elimina acentos
            .toLowerCase()
        : ''; // Devuelve una cadena vacía si el texto es null o undefined
    },
    // Llamada para obtener todos los clientes
    async fetchClientes() {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        //console.log('Clientes cargados:', response.data);
        this.clientes = response.data;
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
        alert('Ocurrió un error al cargar los clientes.');
      } finally {
        this.loading = false;
      }
    },
    // Llamada para obtener los puntos de suministro de un cliente (botón OJO)
    async verPuntosSuministro(cliente) {
      try {
        this.loading = true;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/cliente/${cliente.idCliente}`);
        console.log('Puntos de suministro:', response.data); // Verifica la respuesta
        this.puntosSuministro = response.data;
        this.clienteSeleccionado = cliente;
        this.isModalPuntosOpen = true;
      } catch (error) {
        console.error('Error al obtener los puntos de suministro:', error);
        alert('Ocurrió un error al cargar los puntos de suministro.');
      } finally {
        this.loading = false;
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
    CrearPuntoSuministro(cliente) {
      this.clienteSeleccionado = cliente;
      this.nuevoPunto = {  // Resetea los valores del formulario al abrir el modal
        cliente: cliente.nombre,
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        propiedadContador: 0,
        contador: "",
        propiedadModem: 0,
        modem: "",
        observaciones: "",
        fechaInstalacion: "",
        idCliente: cliente.idCliente, // Asocia el cliente seleccionado al punto de suministro
      };
      this.showModal_PS = true;
    },
    async createPuntoSuministro() {
      this.loading = true; // Muestra el spinner mientras se procesa la solicitud
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
          //fechaBaja: "string", // Según el ejemplo que diste
          id_cliente: { id: this.nuevoPunto.idCliente },
          cupsluz: this.nuevoPunto.cupsluz,
          cupsgas: this.nuevoPunto.cupsgas,
        };

        console.log("Datos enviados al backend (JSON):", JSON.stringify(datosAdaptados, null, 2));

        // Llamada al backend para guardar el nuevo punto de suministro
        await axios.post(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/save`, datosAdaptados);
        alert("Punto de suministro creado con éxito");     

        this.fetchClientes();  // Actualiza la lista de clientes
        // Cierra el modal y resetea el formulario
        this.closeModal_PS();
      } catch (error) {
        console.error("Error al crear el punto de suministro:", error);
        alert(
          error.response?.data?.message || 
          "Ocurrió un error al intentar crear el punto de suministro."
        );
      } finally {
        this.loading = false; // Oculta el spinner
      }
    },


    closeModal_PS() {
      this.showModal_PS = false;
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
          `${process.env.VUE_APP_API_URL}/api/clientes/${this.idClienteActualizar}`, this.nuevoCliente // Objeto con los datos actualizados
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
        nombreAutorizado: '',
        dniAutorizado: '',
        telefonoAutorizado: '',
        emailAutorizado: '',
        empleado: null,
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
  },
  mounted() {
    this.fetchClientes(); // Carga inicial de la lista de clientes
    this.fetchSelectData(); // Carga inicial de empleados, sectores y subtipologías
  },
};
</script>
