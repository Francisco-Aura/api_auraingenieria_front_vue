<template>
  <pestanas-propuesta v-if="presupuesto" activa="presupuesto" :estudio="pestanaEstudio" :presupuesto="pestanaPresupuesto" @ir="abrirEstudio" />
  <nav v-if="presupuesto" class="variante-tira" aria-label="Estudio asociado">
    <span class="muted variante-tira-etiqueta">Estudio</span>
    <div class="variante-tira-lista">
      <!-- El estudio va con el presupuesto por su cliente y proyecto: aquí no se desasocia; se abre, modifica o elimina desde la pestaña «Estudio» -->
      <div v-if="asociado" class="variante-chip actual">
        <strong>{{ etiquetaEstudio(asociado) }}</strong>
      </div>
      <template v-else>
        <template v-if="compatibles.length > 0">
          <select v-model="elegido" aria-label="Estudio que se asocia">
            <option value="">Elige un estudio</option>
            <option v-for="e in compatibles" :key="e.id" :value="e.id">{{ etiquetaEstudio(e) }}</option>
          </select>
          <button type="button" class="secondary" :disabled="ocupado || !elegido" @click="cambiar(elegido)">Asociar</button>
        </template>
        <button type="button" class="secondary" :disabled="ocupado" @click="$emit('crear-estudio', { presupuestoId, customer: cliente, proyecto })">Crear estudio</button>
      </template>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </nav>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { estudiosCompatibles, etiquetaEstudio } from '@/utils/planificador/estudioAsociado'
import { ESTADOS_ESTUDIO, ETIQUETA_ESTADO } from '@/utils/planificador/listaPresupuestos'
import PestanasPropuesta from '../PestanasPropuesta.vue'

// El estudio al que está asociado el presupuesto abierto. Solo se ofrecen los del mismo cliente y proyecto.
export default {
  name: 'Estudio-Asociado',
  components: { PestanasPropuesta },
  props: {
    presupuestoId: { type: String, required: true },
    // El cliente y el proyecto del presupuesto: con ellos arranca el estudio que se crea desde aquí
    cliente: { type: Object, default: null },
    proyecto: { type: String, default: '' },
    // Cambia cuando el presupuesto cambia de estado: se vuelve a leer para enseñar el de ahora
    refrescar: { type: String, default: '' }
  },
  emits: ['crear-estudio', 'abrir-estudio'],
  data() { return { presupuesto: null, estudios: [], elegido: '', ocupado: false, error: '' } },
  computed: {
    asociado() {
      const id = this.presupuesto && this.presupuesto.study_id
      return id ? this.estudios.find((e) => e.id === id) || { id, kwp: 0, estadoNombre: 'Estudio' } : null
    },
    compatibles() { return this.presupuesto ? estudiosCompatibles(this.presupuesto, this.estudios) : [] },
    pestanaEstudio() {
      const e = this.asociado ? ESTADOS_ESTUDIO[this.asociado.estado] : null
      return { hay: !!this.asociado, estado: e ? e.label : '', clase: e ? e.cls : '' }
    },
    pestanaPresupuesto() {
      const s = this.presupuesto ? this.presupuesto.status : ''
      return { hay: true, estado: ETIQUETA_ESTADO[s] || '', clase: s }
    }
  },
  watch: { presupuestoId() { this.cargar() }, refrescar() { this.cargar() } },
  mounted() { this.cargar() },
  methods: {
    etiquetaEstudio,
    async cargar() {
      this.elegido = ''
      try {
        const [lista, estudios] = await Promise.all([planificadorApi.presupuestos(), planificadorApi.estudios()])
        this.presupuesto = lista.find((b) => b.id === this.presupuestoId) || null
        this.estudios = estudios
      } catch (e) { /* sin selector: no pasa nada */ }
    },
    abrirEstudio() {
      if (this.asociado) this.$emit('abrir-estudio', { id: this.asociado.id, presupuestoId: this.presupuestoId })
    },
    async cambiar(studyId) {
      this.ocupado = true
      this.error = ''
      try {
        this.presupuesto = await planificadorApi.asociarEstudio(this.presupuestoId, studyId)
        this.elegido = ''
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    }
  }
}
</script>
