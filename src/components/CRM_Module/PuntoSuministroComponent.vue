<template>
  <div class="suministro-container">
    <!-- Resto del código existente -->
    <table class="suministro-table">
      <thead>
        <!-- Cabecera de la tabla -->
      </thead>
      <tbody>
        <tr v-for="suministro in filteredPuntosSuministro" :key="suministro.id">
          <td>{{ suministro.cliente }}</td>
          <td>
            {{ suministro.direccion }}, {{ suministro.codigoPostal }},
            {{ suministro.poblacion }}, {{ suministro.provincia }}
          </td>
          <td>{{ suministro.cupsluz }}</td>
          <td>{{ suministro.cupsgas }}</td>
          <td>
            <button class="btn btn-modPS" @click="abrirFormularioPSActualizar(suministro)">
              Modificar PS
            </button>
            <button class="btn btn-crearContrato" @click="abrirModalContratos(suministro.id)">
              Contrato
            </button>
            <button class="btn btn-crearServicio">Servicio</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de Contratos -->
    <div v-if="mostrarModalContratos" class="modal-overlay">
      <div class="modal-content">
        <span class="close" @click="cerrarModalContratos">&times;</span>

        <!-- Tabs -->
        <div class="tabs">
          <button :class="{ active: pestañaActiva === 'actual' }" @click="pestañaActiva = 'actual'">Contrato Actual</button>
          <button :class="{ active: pestañaActiva === 'historico' }" @click="pestañaActiva = 'historico'">Histórico</button>
        </div>

        <!-- Contenido del modal -->
        <div class="tab-content">
          <div v-if="pestañaActiva === 'actual'">
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

          <div v-if="pestañaActiva === 'historico'">
            <h3>Contratos Históricos</h3>
            <ul>
              <li v-for="contrato in contratosHistoricos" :key="contrato.id">
                <strong>ID:</strong> {{ contrato.id }} - 
                <strong>Fecha Fin:</strong> {{ contrato.fechaFin }}
                <button @click="verDetalle(contrato)">Ver Detalle</button>
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
  data() {
    return {
      puntosSuministro: [],
      filter: "",
      formularioVisible: false,
      modificarPunto: {
        id: null,
        direccion: "",
        codigoPostal: "",
        poblacion: "",
        provincia: "",
        cupsluz: "",
        cupsgas: "",
        contador: "",
        propiedadContador: 0, // Cambiado a entero
        modem: "",
        propiedadModem: 0, // Cambiado a entero
        observaciones: "",
        fechaInstalacion: "",
        fechaBaja: null, // Se agrega para mantener consistencia con el DTO
        idCliente: null,
        nombreCliente: "",        
      },
      mostrarModalContratos: false,
      contratos: [],
      pestañaActiva: 'actual',
    };
  },
  computed: {
    filteredPuntosSuministro() {
      return this.puntosSuministro.filter((suministro) =>
        Object.values(suministro).some((value) =>
          String(value).toLowerCase().includes(this.filter.toLowerCase())
        )
      );
    },
    
    contratoActual() {
      const ahora = new Date();
      return this.contratos.find(
        (contrato) => new Date(contrato.fechaFin) > ahora
      );
    },
    contratosHistoricos() {
      const ahora = new Date();
      return this.contratos.filter(
        (contrato) => new Date(contrato.fechaFin) <= ahora
      );
    },
  },
  
  created() {
    this.fetchPuntosSuministro();
    },
  methods: {
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
    async abrirFormularioPSActualizar(ps) {
      if (!ps.id) {
        console.error("El punto de suministro seleccionado no tiene un ID válido.");
        alert("No se puede cargar el punto de suministro seleccionado.");
        return;
      }

      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/puntos-suministro/${ps.id}`);
        const punto = response.data;

        // Mapear los datos del DTO al formato usado en el formulario
        this.modificarPunto = {
          ...punto,
          propiedadContador: punto.propiedadContador ? 1 : 0, // Convertir a entero
          propiedadModem: punto.propiedadModem ? 1 : 0, // Convertir a entero
        };
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        alert("No se pudo cargar la información del punto de suministro.");
      }
    },
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
    async actualizarPS() {
      try {
        // Asegurar que los campos booleanos sean enviados como enteros
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
    async abrirModalContratos(idPuntoSuministro) {
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_URL}/api/contratos/punto-suministro/${idPuntoSuministro}`
      );
      this.contratos = response.data;
      this.mostrarModalContratos = true;
    } catch (error) {
      console.error("Error al cargar los contratos:", error);
      alert("No se pudieron cargar los contratos.");
    }
  },
  cerrarModalContratos() {
    this.mostrarModalContratos = false;
    this.contratos = [];
    this.pestañaActiva = 'actual';
  },
  verDetalle(contrato) {
    alert(`Detalles del contrato ID: ${contrato.id}\n${JSON.stringify(contrato, null, 2)}`);
  },
  },
};
</script>

