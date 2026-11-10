<template>
  <p v-if="tareas.length === 0" class="muted">Sin tareas todavía.</p>
  <div v-else class="board-wrap">
    <div class="board-filters">
      <label>Fase <select v-model="filtroFase"><option value="">Todas</option><option v-for="p in fases" :key="p" :value="p">{{ p }}</option></select></label>
      <label>Área <select v-model="filtroArea"><option value="">Todas</option><option v-for="d in areas" :key="d" :value="d">{{ d }}</option></select></label>
      <span class="muted board-hint">Arrastra una tarjeta para cambiar su estado. Una tarea iniciada no vuelve a Pendiente.</span>
    </div>

    <div class="board">
      <section v-for="estado in COLUMNAS" :key="estado" class="board-col" :class="{ over: sobre === estado }" :style="{ '--s': STATUS_META[estado].color }"
               @dragover="alArrastrarSobre($event, estado)" @dragleave="alSalir($event)" @drop="alSoltar($event, estado)">
        <header class="board-col-head"><span class="board-dot" /><h3>{{ STATUS_META[estado].label }}</h3><span class="board-count">{{ tarjetas(estado).length }}</span></header>
        <div class="board-cards">
          <article v-for="t in tarjetas(estado)" :key="t.id" class="card" draggable="true"
                   :class="[{ selected: seleccionada(t), dragging: arrastrando === t.id, done: estado === 'done' }, retrasoDe(t) ? 'late level-' + retrasoDe(t).level : '']"
                   :style="{ '--c': colores.get(t.phase) || NO_COLOR, ...(retrasoDe(t) ? { '--alert': retrasoDe(t).color } : {}) }"
                   @dragstart="empezarArrastre($event, t)" @dragend="arrastrando = null; sobre = null" @click="$emit('seleccionar', { kind: 'task', id: t.id })">
            <div class="card-chips">
              <insignia-tarea v-if="t.phase" tipo="fase" :nombre="t.phase" :color="colores.get(t.phase) || NO_COLOR" />
              <insignia-tarea tipo="area" :nombre="t.department" />
              <insignia-tarea v-if="retrasoDe(t)" tipo="retraso" :retraso="retrasoDe(t)" />
              <span v-if="idsRevisar.has(t.id)" class="review-badge" title="Hay un cambio del contrato por revisar">↻ Cambio</span>
            </div>
            <p class="card-title"><span v-if="t.milestone" class="card-milestone">◆ </span>{{ t.name }}</p>
            <p v-if="estado === 'blocked'" class="card-blocked" :title="t.status_note || undefined">⛔ {{ t.status_reason || 'Sin motivo indicado' }}</p>
            <footer class="card-foot">
              <span title="Fechas">{{ shortDate(t.start) }} → {{ shortDate(t.end) }} · {{ durationDays(t.start, t.end) }} d</span>
              <span v-if="t.checklist.length > 0" title="Subtareas hechas">☑ {{ t.checklist.filter((i) => i.done).length }}/{{ t.checklist.length }}</span>
              <span v-if="totalRequeridos(t) > 0" title="Documentos o elementos aportados">📎 {{ aportados(t) }}/{{ totalRequeridos(t) }}</span>
            </footer>
            <p v-if="estado !== 'done' && esperando(t).length > 0" class="card-waiting" :title="'Espera a:\n' + esperando(t).map((w) => w.name).join('\n')">
              ⛓ Espera a {{ esperando(t).length }} {{ esperando(t).length === 1 ? 'tarea' : 'tareas' }}
            </p>
          </article>
          <p v-if="tarjetas(estado).length === 0" class="board-empty">Sin tareas</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import InsigniaTarea from './InsigniaTarea.vue'
import { NO_COLOR, STATUS_META, STATUS_ORDER, orderedPhases } from '@/utils/planificador/tareas/colores'
import { durationDays, shortDate } from '@/utils/planificador/tareas/fechas'
import { delayOf } from '@/utils/planificador/tareas/retraso'
import { canMove } from '@/utils/planificador/tareas/flujo'

// Las tareas en columnas por estado: arrastrar una tarjeta cambia su estado (solo donde la tarea puede ir).
export default {
  name: 'Tablero-Tareas-Component',
  components: { InsigniaTarea },
  props: {
    tareas: { type: Array, required: true },
    colores: { type: Map, required: true },
    seleccion: { type: Object, default: null },
    // Tareas con algún cambio del contrato por revisar
    idsRevisar: { type: Object, default: () => new Set() }
  },
  emits: ['seleccionar', 'mover'],
  data() { return { COLUMNAS: STATUS_ORDER, STATUS_META, NO_COLOR, filtroFase: '', filtroArea: '', arrastrando: null, sobre: null } },
  computed: {
    fases() { return orderedPhases(this.tareas) },
    areas() { return [...new Set(this.tareas.map((t) => t.department).filter(Boolean))].sort() },
    porId() { return new Map(this.tareas.map((t) => [t.id, t])) },
    visibles() { return this.tareas.filter((t) => (!this.filtroFase || t.phase === this.filtroFase) && (!this.filtroArea || t.department === this.filtroArea)) }
  },
  methods: {
    shortDate, durationDays,
    tarjetas(estado) { return this.visibles.filter((t) => t.status === estado) },
    retrasoDe(t) { return delayOf(t) },
    seleccionada(t) { return !!this.seleccion && this.seleccion.kind === 'task' && this.seleccion.id === t.id },
    totalRequeridos(t) { return t.deliverables.filter((d) => !d.na).length },
    aportados(t) { const dados = new Set(t.attachments.map((a) => a.requirement)); return t.deliverables.filter((d) => !d.na && dados.has(d.key)).length },
    esperando(t) { return t.depends_on.map((id) => this.porId.get(id)).filter((p) => !!p && p.status !== 'done') },
    empezarArrastre(e, t) { this.arrastrando = t.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id) },
    // Solo se acepta soltar donde la tarea puede ir (no se vuelve a Pendiente, etc.)
    alArrastrarSobre(e, estado) {
      const arrastrada = this.arrastrando ? this.porId.get(this.arrastrando) : undefined
      if (!arrastrada || !canMove(arrastrada, estado)) return
      e.preventDefault()
      this.sobre = estado
    },
    alSalir(e) { if (!e.currentTarget.contains(e.relatedTarget)) this.sobre = null },
    alSoltar(e, estado) {
      e.preventDefault()
      const tarea = this.arrastrando ? this.porId.get(this.arrastrando) : undefined
      this.sobre = null
      this.arrastrando = null
      if (tarea && tarea.status !== estado && canMove(tarea, estado)) this.$emit('mover', tarea, estado)
    }
  }
}
</script>
