<template>
  <div class="estudios">
    <estudio-editor v-if="abierto" :id="abierto" @volver="cerrarEstudio" @cambiado="cargar" />
    <template v-else>
      <div v-if="etiquetaVolver" class="back-row">
        <button type="button" class="secondary" @click="$emit('cerrar')">{{ etiquetaVolver }}</button>
      </div>
      <div class="costs-title">
        <h1>Estudios fotovoltaicos</h1>
        <div class="title-actions">
          <button type="button" @click="creando = !creando">+ Nuevo estudio</button>
        </div>
      </div>
      <p class="muted inv-note">
        Registro de los estudios de autoconsumo: cada uno guarda el consumo del cliente, la instalación propuesta, su rentabilidad
        y el informe en PDF, con su estado y observaciones.
      </p>

      <form v-if="creando" class="estudio-nuevo setup-card" @submit.prevent="crear">
        <label class="survey-field">
          Nombre del cliente
          <input ref="nuevoCliente" v-model.trim="nuevoCliente" maxlength="255" placeholder="Ej.: Curtidos Domingo Molina" autocomplete="off">
        </label>
        <button type="submit" :disabled="!nuevoCliente || ocupado">Crear estudio</button>
        <button type="button" class="secondary" @click="creando = false">Cancelar</button>
      </form>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="!lista" class="muted">Cargando estudios…</p>
      <template v-else>
        <div class="estudio-filtros">
          <input v-model="busqueda" type="search" placeholder="Buscar por cliente o CUPS" aria-label="Buscar estudios">
          <select v-model="filtroEstado" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option v-for="(nombre, id) in ESTADOS" :key="id" :value="id">{{ nombre }}</option>
          </select>
          <span class="muted">{{ visibles.length }} de {{ lista.length }}</span>
        </div>
        <p v-if="lista.length === 0" class="muted">Aún no hay estudios. Pulsa «+ Nuevo estudio» para empezar.</p>
        <p v-else-if="visibles.length === 0" class="muted">Ningún estudio coincide con la búsqueda.</p>
        <ul class="estudio-lista">
          <li v-for="s in visibles" :key="s.id">
            <button type="button" class="estudio-fila" @click="abierto = s.id">
              <span class="estudio-cabecera">
                <strong>{{ s.cliente }}</strong>
                <span class="estudio-estado" :class="s.estado">{{ s.estadoNombre }}</span>
              </span>
              <span class="muted estudio-meta">
                <template v-if="s.cups">CUPS {{ s.cups }} · </template>
                <template v-if="s.calculado">{{ fmt(s.kwp, 0) }} kWp<template v-if="s.bateriaKwh > 0"> + {{ fmt(s.bateriaKwh, 0) }} kWh</template> ·
                  cubre el {{ fmt(s.cobertura * 100, 0) }} % · ahorro {{ fmt(s.ahorroPrimerAno, 0) }} €/año<template v-if="s.retorno"> · retorno {{ fmt(s.retorno, 1) }} años</template></template>
                <template v-else>Sin calcular: falta el consumo del cliente</template>
              </span>
              <span v-if="s.observaciones" class="estudio-obs">📝 {{ s.observaciones }}</span>
              <span class="muted estudio-fecha">Actualizado {{ fecha(s.actualizadoEl) }}<template v-if="s.actualizadoPor"> · {{ s.actualizadoPor }}</template><template v-if="s.curvaEstimada"> · curva estimada</template></span>
            </button>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>

<script>
import EstudioEditor from './EstudioEditor.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'

// Los mismos estados que el servidor (EstudioService.ESTADOS), para el filtro
const ESTADOS = {
  en_estudio: 'En estudio',
  pte_doc: 'Pendiente de documentación del cliente',
  entregado: 'Informe entregado',
  pte_cliente: 'Pendiente de respuesta del cliente',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado por el cliente',
  cancelado: 'Cancelado / sin interés'
}

export default {
  name: 'Estudios-Component',
  components: { EstudioEditor },
  props: { etiquetaVolver: { type: String, default: '' } },
  emits: ['cerrar'],
  data() {
    return { lista: null, error: '', abierto: null, creando: false, nuevoCliente: '', ocupado: false, busqueda: '', filtroEstado: '', ESTADOS }
  },
  computed: {
    visibles() {
      const q = this.busqueda.trim().toLowerCase()
      return (this.lista || []).filter((s) => (!this.filtroEstado || s.estado === this.filtroEstado)
        && (!q || s.cliente.toLowerCase().includes(q) || (s.cups || '').toLowerCase().includes(q)))
    }
  },
  watch: {
    creando(v) { if (v) this.$nextTick(() => this.$refs.nuevoCliente && this.$refs.nuevoCliente.focus()) }
  },
  mounted() { this.cargar() },
  methods: {
    async cargar() {
      try {
        this.lista = await planificadorApi.estudios()
        this.error = ''
      } catch (e) {
        this.error = 'No se han podido cargar los estudios: ' + mensajeError(e)
        if (!this.lista) this.lista = []
      }
    },
    async crear() {
      this.ocupado = true
      this.error = ''
      try {
        const nuevo = await planificadorApi.crearEstudio({ cliente: this.nuevoCliente })
        this.nuevoCliente = ''
        this.creando = false
        this.abierto = nuevo.id
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    cerrarEstudio() {
      this.abierto = null
      this.cargar()
    },
    fmt(n, d) { return n === null || n === undefined || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) },
    fecha(iso) {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>
