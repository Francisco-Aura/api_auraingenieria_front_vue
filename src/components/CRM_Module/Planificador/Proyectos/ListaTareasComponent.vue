<template>
  <p v-if="tareas.length === 0" class="muted">Sin tareas todavía.</p>
  <div v-else class="tasklist">
    <section v-for="g in grupos" :key="g.nombre || 'todas'" class="tl-group" :style="{ '--c': colorDe(g.nombre) }">
      <header v-if="g.nombre" class="tl-head" :class="{ selected: faseSeleccionada(g.nombre) }">
        <button type="button" class="tl-toggle" :aria-expanded="!plegados.includes(g.nombre)" :title="plegados.includes(g.nombre) ? 'Expandir' : 'Plegar'" @click="alternar(g.nombre)">
          {{ plegados.includes(g.nombre) ? '▸' : '▾' }}
        </button>
        <button type="button" class="tl-phase-name" @click="$emit('seleccionar', { kind: 'phase', name: g.nombre })">{{ g.nombre }}</button>
        <span class="tl-head-meta">{{ g.hechas }}/{{ g.tareas.length }} hechas · {{ shortDate(g.inicio) }} → {{ shortDate(g.fin) }}</span>
        <div class="tl-head-bar"><insignia-tarea tipo="progreso" :valor="g.progreso" :color="colorDe(g.nombre)" /></div>
      </header>

      <ul v-if="!plegados.includes(g.nombre)" class="tl-rows">
        <li v-for="t in g.tareas" :key="t.id" class="tl-row" :class="[{ selected: tareaSeleccionada(t), done: t.status === 'done' }, retrasoDe(t) ? 'late level-' + retrasoDe(t).level : '']"
            :style="retrasoDe(t) ? { '--alert': retrasoDe(t).color } : undefined" @click="$emit('seleccionar', { kind: 'task', id: t.id })">
          <button type="button" class="tl-check" :title="t.status === 'done' ? 'Reabrir (vuelve a En curso)' : (moveBlockedReason(t, 'done') || 'Finalizar la tarea')"
                  :aria-label="t.status === 'done' ? 'Reabrir la tarea' : 'Finalizar la tarea'" :disabled="t.status !== 'done' && moveBlockedReason(t, 'done') !== null"
                  @click.stop="$emit('alternar-hecha', t)">{{ t.status === 'done' ? '✓' : '' }}</button>
          <span class="tl-name">
            <span v-if="t.milestone" class="tl-milestone">◆ </span>{{ t.name }}
            <template v-if="retrasoDe(t)"> <insignia-tarea tipo="retraso" :retraso="retrasoDe(t)" /></template>
            <template v-if="idsRevisar.has(t.id)"> <span class="review-badge" title="Hay un cambio del contrato por revisar">↻ Cambio</span></template>
          </span>
          <span class="tl-dept"><insignia-tarea tipo="area" :nombre="t.department" /></span>
          <span class="tl-dates">{{ shortDate(t.start) }} → {{ shortDate(t.end) }}</span>
          <span class="tl-dur">{{ durationDays(t.start, t.end) }} d</span>
          <span class="tl-status"><insignia-tarea tipo="estado" :estado="t.status" :detalle="detalle(t)" /></span>
          <span class="tl-deps" :title="t.depends_on.length + ' dependencia(s)'">{{ t.depends_on.length > 0 ? '⛓ ' + t.depends_on.length : '' }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import InsigniaTarea from './InsigniaTarea.vue'
import { NO_COLOR, orderedPhases } from '@/utils/planificador/tareas/colores'
import { durationDays, shortDate } from '@/utils/planificador/tareas/fechas'
import { delayOf } from '@/utils/planificador/tareas/retraso'
import { moveBlockedReason } from '@/utils/planificador/tareas/flujo'

// Las tareas agrupadas por fase, en el orden de la plantilla; las tareas sueltas, al final.
export default {
  name: 'Lista-Tareas-Component',
  components: { InsigniaTarea },
  props: {
    tareas: { type: Array, required: true },
    colores: { type: Map, required: true },
    seleccion: { type: Object, default: null },
    // Tareas con algún cambio del contrato por revisar
    idsRevisar: { type: Object, default: () => new Set() }
  },
  emits: ['seleccionar', 'alternar-hecha'],
  data() { return { plegados: [] } },
  computed: {
    grupos() {
      const grupos = orderedPhases(this.tareas).map((nombre) => ({ nombre, tareas: this.tareas.filter((t) => t.phase === nombre) }))
      const sueltas = this.tareas.filter((t) => !t.phase)
      if (sueltas.length > 0) grupos.push({ nombre: grupos.length > 0 ? 'Sin fase' : '', tareas: sueltas })
      return grupos.map((g) => ({
        ...g,
        hechas: g.tareas.filter((t) => t.status === 'done').length,
        progreso: Math.round(g.tareas.reduce((s, t) => s + t.progress, 0) / g.tareas.length),
        inicio: g.tareas.reduce((m, t) => (t.start < m ? t.start : m), g.tareas[0].start),
        fin: g.tareas.reduce((m, t) => (t.end > m ? t.end : m), g.tareas[0].end)
      }))
    }
  },
  methods: {
    shortDate, durationDays, moveBlockedReason,
    colorDe(nombre) { return this.colores.get(nombre) || NO_COLOR },
    retrasoDe(t) { return delayOf(t) },
    faseSeleccionada(nombre) { return !!this.seleccion && this.seleccion.kind === 'phase' && this.seleccion.name === nombre },
    tareaSeleccionada(t) { return !!this.seleccion && this.seleccion.kind === 'task' && this.seleccion.id === t.id },
    alternar(nombre) { this.plegados = this.plegados.includes(nombre) ? this.plegados.filter((n) => n !== nombre) : [...this.plegados, nombre] },
    detalle(t) {
      const hechas = t.checklist.filter((i) => i.done).length
      if (t.status === 'doing' && t.checklist.length > 0) return hechas + '/' + t.checklist.length
      return t.status === 'blocked' ? t.status_reason || '' : ''
    }
  }
}
</script>
