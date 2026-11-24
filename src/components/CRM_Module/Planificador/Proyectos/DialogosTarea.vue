<template>
  <modal-component v-if="tipo === 'block'" titulo="Bloquear la tarea" @cerrar="$emit('cerrar')">
    <p class="hint"><strong>{{ tarea.name }}</strong><br>Una tarea bloqueada queda detenida y con el motivo visible para todo el equipo. Se desbloquea cambiando su estado.</p>
    <label class="field">
      Motivo
      <select v-model="motivo"><option value="">Elige un motivo…</option><option v-for="r in BLOCK_REASONS" :key="r" :value="r">{{ r }}</option></select>
    </label>
    <label v-if="motivo === 'Otro'" class="field">¿Cuál? <input v-model="propio" placeholder="Describe el motivo"></label>
    <label class="field">Detalle <span class="muted">(opcional)</span>
      <textarea v-model="nota" rows="3" placeholder="Qué falta, a quién hay que reclamárselo, cuándo se espera…" />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" :disabled="!valido || ocupado" @click="confirmarBloqueo">{{ tarea.status === 'blocked' ? 'Guardar motivo' : 'Bloquear tarea' }}</button>
    </template>
  </modal-component>

  <modal-component v-else :ancho="true" titulo="Finalizar la tarea" @cerrar="$emit('cerrar')">
    <p class="hint"><strong>{{ tarea.name }}</strong><br>Para darla por terminada, aporta cada documento o elemento requerido (enlace o nota). Si alguno no aplica, márcalo y explica por qué.</p>
    <entregables-panel :tarea="tarea" :acciones="acciones" />
    <label class="field">Comentario de cierre <span class="muted">(opcional)</span>
      <textarea v-model="nota" rows="2" placeholder="Algo que deba saber el equipo: incidencias, cambios respecto a lo previsto…" />
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <template #pie>
      <span v-if="pendientes.length > 0" class="pie-pista">Faltan {{ pendientes.length }} {{ pendientes.length === 1 ? 'elemento' : 'elementos' }} por aportar</span>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="finish-boton" :disabled="pendientes.length > 0 || ocupado" @click="confirmarCierre">Finalizar tarea</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import EntregablesPanel from './EntregablesPanel.vue'
import { mensajeError } from '@/services/planificadorApi'
import { BLOCK_REASONS } from '@/utils/planificador/tareas/colores'
import { pendingDeliverables } from '@/utils/planificador/tareas/flujo'

// Los dos diálogos de cambio de estado: bloquear (con motivo) y finalizar (aportando la documentación requerida).
export default {
  name: 'Dialogos-Tarea',
  components: { ModalComponent, EntregablesPanel },
  props: {
    tipo: { type: String, required: true },
    tarea: { type: Object, required: true },
    acciones: { type: Object, required: true },
    // Funciones que devuelven una promesa: si fallan, el error se enseña en el diálogo
    alBloquear: { type: Function, default: null },
    alFinalizar: { type: Function, default: null }
  },
  emits: ['cerrar'],
  data() {
    const actual = this.tarea.status_reason
    const conocido = BLOCK_REASONS.includes(actual)
    return {
      BLOCK_REASONS, error: null, ocupado: false,
      motivo: actual ? (conocido ? actual : 'Otro') : '', propio: actual && !conocido ? actual : '',
      nota: this.tipo === 'block' ? this.tarea.status_note : this.tarea.closing_note
    }
  },
  computed: {
    motivoFinal() { return this.motivo === 'Otro' ? this.propio.trim() || 'Otro' : this.motivo },
    valido() { return !!this.motivoFinal && (this.motivo !== 'Otro' || !!this.propio.trim() || !!this.nota.trim()) },
    pendientes() { return pendingDeliverables(this.tarea) }
  },
  methods: {
    async intentar(accion) {
      this.ocupado = true
      this.error = null
      try { await accion() } catch (e) { this.error = mensajeError(e); this.ocupado = false }
    },
    confirmarBloqueo() { this.intentar(() => this.alBloquear(this.motivoFinal, this.nota.trim())) },
    confirmarCierre() { this.intentar(() => this.alFinalizar(this.nota.trim())) }
  }
}
</script>
