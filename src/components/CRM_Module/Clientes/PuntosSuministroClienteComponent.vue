<template>
  <div>
    <div class="modal-overlay fade-in" role="dialog" aria-modal="true" aria-labelledby="detalle-cliente-title">
    <div class="modal-content">
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-building"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="detalle-cliente-title">Detalle del cliente</h2>
          <span class="aura-modal-header__subtitulo">
            <span><strong>{{ cliente?.nombre || "Desconocido" }}</strong></span>
            <span v-if="cliente?.cif" class="aura-dato"><span class="aura-dato__etiqueta">CIF</span>{{ cliente.cif }}</span>
          </span>
        </div>
        <button type="button" class="close-button" @click="$emit('cerrar-modal')" aria-label="Cerrar detalle del cliente">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">

        <!-- Barra de pestañas -->
        <div class="tab-bar-cliente">
          <button :class="['tab-btn-cliente', { active: activeTab === 'puntos' }]" @click="activeTab = 'puntos'">
            <i class="fas fa-bolt"></i> Puntos de Suministro
            <span class="tab-count">{{ puntosSuministroLocal.length }}</span>
          </button>
        </div>

        <!-- Tab: Puntos de Suministro -->
        <div v-if="activeTab === 'puntos'">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Buscar en puntos de suministro..."
            v-model="filterPuntos"
            class="search-input"
          />
        </div>

        <div class="table-responsive" v-desborde-tabla>
          <table v-if="puntosSuministroLocal.length > 0 || cargandoPuntos" class="data-table data-table--acciones-fijas">
            <thead>
              <tr>
                <th><i class="fas fa-map-marker-alt"></i> Dirección</th>
                <th><i class="fas fa-id-card"></i> Identificación</th>
                <th><i class="fas fa-bolt"></i> CUPS</th>
                <th><i class="fas fa-tag"></i> Tipo</th>
                <th><i class="fas fa-bolt"></i> P1</th>
                <th><i class="fas fa-bolt"></i> P2</th>
                <th><i class="fas fa-bolt"></i> P3</th>
                <th><i class="fas fa-bolt"></i> P4</th>
                <th><i class="fas fa-bolt"></i> P5</th>
                <th><i class="fas fa-bolt"></i> P6</th>
                <th><i class="fas fa-calendar-alt"></i> Fin Contrato</th>
                <th><i class="fas fa-building"></i> Comercializadora</th>
                <th class="actions-header"><i class="fas fa-cogs"></i> Acciones</th>
              </tr>
            </thead>
            <tbody>
              <template v-if="cargandoPuntos">
                <tr v-for="n in 5" :key="'skeleton-' + n" class="skeleton-row">
                  <td v-for="col in 13" :key="col"><div class="skeleton-line skeleton-line--md"></div></td>
                </tr>
              </template>
              <!-- Sin coincidencias en la búsqueda: antes solo quedaba la cabecera -->
              <tr v-if="!cargandoPuntos && filterPuntos && filteredPuntosSuministro.length === 0" class="fila-sin-resultados">
                <td colspan="13">
                  <div class="empty-state">
                    <i class="fas fa-search fa-2x text-muted"></i>
                    <p>No hay puntos de suministro que coincidan con la búsqueda</p>
                  </div>
                </td>
              </tr>
              <tr v-for="punto in filteredPuntosSuministro" v-show="!cargandoPuntos" :key="punto.id">
                <td class="text-truncate" :title="`${punto.direccion}, ${punto.codigoPostal}, ${punto.poblacion}, ${punto.provincia}`">
                  {{ punto.direccion }}, {{ punto.codigoPostal }}, {{ punto.poblacion }}, {{ punto.provincia }}
                </td>
                <td class="text-truncate text-center" :title="punto.identificacion">{{ punto.identificacion || '-' }}</td>
                <td 
                  class="cups-cell text-center" 
                  :title="getCupsValue(punto)"
                >
                  <div class="cups-content">
                    <button
                      v-if="getCupsValue(punto) !== '-'"
                      class="btn-cups-link"
                      @click="navegarAPuntosSupministro(punto)"
                      :title="`Ver ${getCupsValue(punto)} en Puntos de Suministro`"
                    >{{ getCupsValue(punto) }}</button>
                    <span v-else>-</span>
                    <span v-if="getCupsValue(punto) !== '-'" class="cups-indicator" :class="getTipoCupsClass(punto)">
                      <i :class="getTipoCupsIcon(punto)"></i>
                    </span>
                  </div>
                </td>
                <td class="text-center">{{ getTipoCups(punto) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia1) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia2) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia3) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia4) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia5) }}</td>
                <td class="text-center potencia-cell">{{ formatPotencia(punto.potencia6) }}</td>
                <td class="text-center">{{ formatDate(punto.fechaFinUltimoContrato) }}</td>
                <td class="text-center">{{ punto.comercializadoraActual || '-' }}</td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button class="btn-icon btn-view" @click="verDetallePunto(punto)" title="Ver detalle" aria-label="Ver detalle del punto de suministro">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">
            <i class="fas fa-bolt fa-3x text-muted"></i>
            <p>No hay puntos de suministro para mostrar</p>
          </div>
        </div>
        </div><!-- /tab puntos -->

      </div>

      <div class="modal-footer">
        <button @click="$emit('cerrar-modal')" class="btn btn-secondary">
          <i class="fas fa-times"></i>
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </div>

    <!-- Modal de Detalles Punto de Suministro -->
    <ModalActualizarPuntoSuministro
      v-if="formularioVisible"
      :modificarPunto="modificarPunto"
      :modoConsulta="modoConsulta"
      @cerrar-modal="cerrarModalActualizarPunto"
      @actualizar-punto-suministro="onPuntoSuministroActualizado"
    />

    <!-- Modal detalle de tarea eliminado - ver desde edicion de cliente -->
  </div>
</template>

<script>
import ModalActualizarPuntoSuministro from '@/components/CRM_Module/PuntosSuministro/ActualizarPuntoSuministro.vue';
import axios from 'axios';
import { fechaCortaES } from '@/utils/fechas';
import { cupsVisible, tipoCups } from '@/utils/cups';

export default {
  name: "PuntosSuministroClienteComponent",
  components: {
    ModalActualizarPuntoSuministro
  },
  emits: ['cerrar-modal'],
  props: {
    cliente: {
      type: Object,
      required: true,
      default: () => ({}),
    },
    puntosSuministro: {
      type: Array,
      required: true,
      default: () => [],
    },
    // El padre está cargando los puntos (se muestran filas de carga en vez de "no hay puntos")
    cargando: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      filterPuntos: "",
      formularioVisible: false,
      modificarPunto: null,
      modoConsulta: false,
      puntosSuministroLocal: [],
      loading: false,
      activeTab: 'puntos',
    };
  },
  computed: {
    cargandoPuntos() {
      return this.loading || this.cargando;
    },
    filteredPuntosSuministro() {
      const filtro = this.normalizeText(this.filterPuntos);
      return this.puntosSuministroLocal.filter((punto) => {
        const concatenated = [
          punto.direccion || '',
          punto.codigoPostal || '',
          punto.poblacion || '',
          punto.provincia || '',
          punto.cupsluz || '',
          punto.cupsgas || ''
        ].join(' ').toLowerCase();
        return this.normalizeText(concatenated).includes(filtro);
      });
    },
  },
  watch: {
    puntosSuministro: {
      immediate: true,
      deep: true,
      handler(newVal) {
        // El padre ya los trae de la cartera del cliente (con potencias): no se vuelven a pedir
        this.puntosSuministroLocal = this.normalizarPuntos(newVal || []);
      },
    },
  },
  methods: {
    // Unifica los nombres de los CUPS (el backend devuelve CUPSluz/CUPSgas)
    normalizarPuntos(puntos) {
      return puntos.map(punto => {
        const newPunto = { ...punto };
        if (newPunto.CUPSluz !== undefined) {
          newPunto.cupsluz = newPunto.CUPSluz;
          delete newPunto.CUPSluz;
        }
        if (newPunto.CUPSgas !== undefined) {
          newPunto.cupsgas = newPunto.CUPSgas;
          delete newPunto.CUPSgas;
        }
        if (newPunto.cupsluz === undefined && newPunto.cups === undefined) {
          newPunto.cupsluz = '';
        }
        if (newPunto.cupsgas === undefined) {
          newPunto.cupsgas = '';
        }
        return newPunto;
      });
    },
    normalizeText(text) {
      if (!text) return "";
      return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    async refreshPuntosSuministro() {
      if (!this.cliente || !this.cliente.idCliente) return;
      this.loading = true;
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/cliente/${this.cliente.idCliente}/cartera`);
        this.puntosSuministroLocal = this.normalizarPuntos(response.data);
      } catch (error) {
        console.error("Error al actualizar puntos de suministro:", error);
        await this.$swal.fire({
          title: 'Error',
          text: `No se pudieron actualizar los puntos de suministro: ${error.message}`,
          icon: 'error',
          confirmButtonColor: '#fcd700'
        });
      } finally {
        this.loading = false;
      }
    },
    navegarAPuntosSupministro(punto) {
      const cups = this.getCupsValue(punto);
      this.$emit('cerrar-modal');
      // Un punto dado de baja solo se ve en esa pantalla con «Mostrar dados de baja»
      const query = punto.fechaBaja ? { cupsluz: cups, bajas: '1' } : { cupsluz: cups };
      this.$router.push({
        path: '/dashboard/puntos-suministro',
        query
      });
    },

    async verDetallePunto(punto) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/puntos-suministro/${punto.id}`);
        // Combinar datos del endpoint con las potencias del punto original
        this.modificarPunto = { 
          ...response.data,
          // Agregar las potencias desde el punto original que ya las tiene
          potencia1: punto.potencia1 || 0,
          potencia2: punto.potencia2 || 0,
          potencia3: punto.potencia3 || 0,
          potencia4: punto.potencia4 || 0,
          potencia5: punto.potencia5 || 0,
          potencia6: punto.potencia6 || 0
        };
        this.modoConsulta = true;
        this.formularioVisible = true;
      } catch (error) {
        console.error("Error al obtener el punto de suministro:", error);
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los detalles del punto de suministro.'
        })
      }
    },
    cerrarModalActualizarPunto() {
      this.formularioVisible = false;
      this.modificarPunto = null;
      this.modoConsulta = false;
    },
    async onPuntoSuministroActualizado() {
      await this.refreshPuntosSuministro();
    },

    // Métodos para manejar CUPS y potencias como en la tabla principal
    getCupsValue(punto) {
      return cupsVisible(punto.cupsluz, punto.cupsgas, '-');
    },

    getTipoCups(punto) {
      return tipoCups(punto.cupsluz, punto.cupsgas, '-');
    },

    getTipoCupsClass(punto) {
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return 'cups-luz';
      }
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return 'cups-gas';
      }
      return '';
    },

    getTipoCupsIcon(punto) {
      if (punto.cupsluz && punto.cupsluz.trim() !== '') {
        return 'fas fa-bolt';
      }
      if (punto.cupsgas && punto.cupsgas.trim() !== '') {
        return 'fas fa-fire';
      }
      return '';
    },

    formatPotencia(potencia) {
      if (potencia === null || potencia === undefined || potencia === 0) {
        return '-';
      }
      return parseFloat(potencia).toFixed(2) + ' kW';
    },

    formatDate(date) {
      return fechaCortaES(date, '-');
    },
  },
};
</script>

<style scoped src="./PuntosSuministroClienteComponent.css"></style>