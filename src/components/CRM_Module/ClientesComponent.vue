<template>
  <div class="clientes-container">
    <div class="filter-container">
      <button class="btn btn-crear" @click="mostrarFormularioCrear">Crear Cliente</button>
      <input type="text" placeholder="Buscar cliente..." v-model="filter" class="filter-input" />
    </div>

    <table class="clientes-table">
      <thead>
        <tr>
          <th>Nombre Cliente</th>
          <th>CIF</th>
          <th>Dirección Fiscal</th>
          <th>PS</th>
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
            {{ cliente.totalPuntosSuministro }}
            <button class="btn btn-ojo" @click="mostrarPuntosSuministro(cliente.idCliente)">👁️</button>
          </td>
          <td>{{ cliente.empleadoAsignado }}</td>
          <td>
            <button class="btn btn-consultar" @click="mostrarFormularioActualizar(cliente.idCliente)">  Consulta Cliente </button>
            <button class="btn btn-crearPS">Crear Punto Suministro</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal para puntos de suministro -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal-content">
        <h2>Puntos de Suministro</h2>
        <ul v-if="puntosSuministro.length > 0">
          <li v-for="punto in puntosSuministro" :key="punto.idPuntoSuministro">
            {{ punto.nombre }} - {{ punto.direccion }}
          </li>
        </ul>
        <p v-else>No hay puntos de suministro disponibles.</p>
        <button class="btn btn-cerrar" @click="cerrarModalPS">Cerrar</button>
      </div>
    </div>

    <!-- Modal para crear o modificar clientes -->
    <div v-if="formularioVisible" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ modoActualizar ? 'Actualizar Cliente' : 'Alta de Cliente' }}</h2>
        <form @submit.prevent="modoActualizar ? actualizarCliente() : crearCliente()">
          <div class="form-container">
            <div class="form-column">
              <label for="nombre">Nombre</label>
              <input type="text" id="nombre" v-model="nuevoCliente.nombre" required />

              <label for="nombreComercial">Nombre Comercial</label>
              <input type="text" id="nombreComercial" v-model="nuevoCliente.nombreComercial" required />

              <label for="cif">CIF</label>
              <input type="text" id="cif" v-model="nuevoCliente.cif" required />

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
            <button type="submit" class="btn btn-crearUsuario">
              {{ modoActualizar ? 'Actualizar' : 'Crear' }}
            </button>
            <button type="button" class="btn btn-cancelarUsuario" @click="cancelarFormulario">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ClientesComponent',
  data() {
    return {
      clientes: [],
      empleados: [],
      puntosSuministro: [],
      modalVisible: false, // Para controlar la visibilidad del modal de puntos de suministro
      idClienteSeleccionado: null,
      sectores: [], // Aquí sectores inicializado como array vacío
      subtipologias: [], // Aquí subtipologías inicializado como array vacío
      filter: '',
      formularioVisible: false,
      modoActualizar: false, // Indica si estamos en modo actualización
      nuevoCliente: {        
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
    async mostrarPuntosSuministro(idCliente) {
      try {
        this.idClienteSeleccionado = idCliente;
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${idCliente}`);
        this.puntosSuministro = response.data;
        this.modalVisible = true; // Activa el modal
      } catch (error) {
        console.error("Error al cargar puntos de suministro:", error);
      }
    }, 
    cerrarModalPS() {
      this.modalVisible = false;
      this.puntosSuministro = [];
    },  
    mostrarFormularioActualizar(idCliente) {
      console.log("Cargando datos para cliente con ID:", idCliente); // Verifica si llega aquí
      axios
        .get(`${process.env.VUE_APP_API_URL}/api/cliente/cliente`, { params: { idCliente } })
        .then((response) => {
          console.log("Datos del cliente recibidos:", response.data); // Verifica los datos recibidos
          this.nuevoCliente = response.data;
          this.formularioVisible = true;
          this.modoActualizar = true;
        })
        .catch((error) => {
          console.error("Error al obtener los datos del cliente:", error);
        });
    },
    actualizarCliente() {
      axios
        .put(`${process.env.VUE_APP_API_URL}/api/cliente/actualizar`, this.nuevoCliente)
        .then(() => {
          alert('Cliente actualizado con éxito.');
          this.cancelarFormulario();
          this.fetchClientes(); // Actualiza la lista de clientes
        })
        .catch((error) => {
          console.error('Error al actualizar el cliente:', error);
          alert('No se pudo actualizar el cliente. Intente nuevamente.');
        });
    },
    cancelarFormulario() {
      this.formularioVisible = false;
      this.modoActualizar = false; // Vuelve a modo creación por defecto
      this.resetFormulario();
    },

    async fetchClientes() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/clientes/cartera`);
        this.clientes = response.data;
        console.log(this.clientes);
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
      }
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

    mostrarFormularioCrear() {
      this.formularioVisible = true;
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

    async crearCliente() {
      //console.log('Datos enviados al backend:', this.nuevoCliente); // Verifica aquí los valores
      if (!this.nuevoCliente.nombre || !this.nuevoCliente.cif) {
        alert('El nombre y CIF son obligatorios.');
        return;
      }
      try {
        // Agregar fecha y hora del sistema
        this.nuevoCliente.fechaAlta = new Date().toISOString(); // Formato ISO para compatibilidad
        await axios.post(`${process.env.VUE_APP_API_URL}/api/clientes/cliente`, this.nuevoCliente);
        this.fetchClientes();
        this.cancelarFormulario();
      } catch (error) {
        console.error('Error al crear cliente:', error);
        alert('Hubo un error al crear el cliente. Por favor, inténtelo de nuevo.');
      }
    },
  },
  mounted() {
    this.fetchClientes();
    this.fetchSelectData();
  },
};
</script>

<style scoped>
/* Estilos para el modal */
.modal-overlay {
  position: fixed;
  top: 0; /* Asegura que esté alineado con la parte superior de la página */
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Fondo semitransparente */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alineación en la parte superior */
  z-index: 1000; /* Asegura que el modal esté por encima de otros elementos */
  padding-top: 20px; /* Espacio entre el top de la pantalla y el modal */
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 500px;
  width: 100%;
}
  
.form-container {
  display: flex;
  gap: 20px;
}

.form-column {
  flex: 1;
}

.modal-content {
  width: 80%;  /* Aumenta el ancho del modal */
  max-width: 1200px; /* Limita el ancho máximo */
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
}

.form-container {
  display: flex;
  justify-content: space-between;
  gap: 20px; /* Espacio entre columnas */
}

.form-column {
  flex: 1;
}

.form-column input, .form-column select, .form-column textarea {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border-radius: 5px;
  border: 1px solid #ccc;
}

form div {
  margin-bottom: 15px;
}

textarea {
  width: 100%; /* Asegura que el textarea ocupe todo el ancho disponible */
  height: 150px; /* Ajusta la altura para que sea más grande */
  padding: 10px; /* Espaciado interior para que el texto no se pegue al borde */
  font-size: 14px; /* Aumenta el tamaño de la fuente para hacerlo más legible */
  border: 1px solid #ccc; /* Estilo para el borde del textarea */
  border-radius: 5px; /* Bordes redondeados para un estilo más moderno */
  resize: vertical; /* Permite redimensionar solo verticalmente */
}
</style>