<template>
    <!-- Modal para mostrar los puntos de suministro de un cliente -->
    <div class="modal-overlay">
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
</template>

<script>
    export default {
        name: 'MuestraPsClienteComponent',
        components: {},
    data() {
        return {     
        // Lista de puntos de suministro del cliente seleccionado
        puntosSuministro: [],
        // Cliente seleccionado para mostrar sus puntos de suministro
        clienteSeleccionado: null, 
        // Filtro para buscar en los puntos de suministro
        filterPuntos: '',      
        };
    },  
    computed: {    
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
        closeModalPuntos() {
            this.isModalPuntosOpen = false; // Cierra el modal de puntos de suministro
            this.puntosSuministro = [];
        },
        verDetallePunto(punto) {
            console.log('Ver detalle del punto de suministro:', punto);
            // Aquí podrías agregar la lógica para mostrar más detalles
        },    

        cancelarFormulario() {
            this.formularioVisible = false;
            this.modoActualizar = false; // Vuelve a modo creación por defecto
            this.resetFormulario();
        },
    }
};
</script>

<style scoped>

</style>