<template>
  <div ref="raiz" class="gantt" :style="{ '--days': dias, '--day-w': anchoDia + 'px', '--row-h': ROW_H + 'px', '--bar-h': BAR_H + 'px', '--label-w': LABEL_W + 'px' }">
    <div class="gantt-toolbar">
      <button v-for="(z, i) in ZOOMS" :key="z.label" type="button" :class="{ active: i === zoom }" @click="i === FIT ? ajustar() : (zoom = i)">{{ z.label }}</button>
      <button type="button" @click="irAHoy(true)">Hoy</button>
      <span class="gantt-sep" />
      <button v-if="fasesTodas.length > 0" type="button" @click="plegadas = todasPlegadas ? new Set() : new Set(fasesTodas)">{{ todasPlegadas ? 'Expandir fases' : 'Plegar fases' }}</button>
      <button type="button" :class="{ active: verTodas }" @click="verTodas = !verTodas">{{ verTodas ? 'Ocultar flechas' : 'Ver todas las flechas' }}</button>
      <span class="gantt-hint muted">Clic en una tarea para ver su detalle · pasa el ratón para ver sus dependencias</span>
    </div>

    <div ref="desplazable" class="gantt-scroll">
      <div class="gantt-inner">
        <div class="gantt-row gantt-head">
          <div class="gantt-label">Tarea</div>
          <div class="gantt-timeline">
            <div v-for="m in meses" :key="m.key" class="gantt-month" :style="{ gridColumn: (m.from + 1) + ' / ' + (m.to + 2) }" :title="m.month + ' ' + m.year"><span>{{ etiquetaMes(m) }}</span></div>
            <div v-for="(c, i) in celdas" :key="i" class="gantt-day" :class="{ weekend: c.weekend, today: i === indiceHoy }" :style="{ gridColumn: i + 1 }">{{ anchoDia >= 28 || (anchoDia >= 9 && c.monday) ? c.date : '' }}</div>
          </div>
        </div>

        <div class="gantt-body">
          <div class="gantt-layer" aria-hidden="true"><div v-for="(c, i) in celdas" :key="i" :class="[c.weekend ? 'weekend' : '', i === indiceHoy ? 'today' : '']" /></div>

          <template v-for="fila in filas" :key="fila.kind === 'phase' ? 'fase:' + fila.group.name : fila.task.id">
            <div v-if="fila.kind === 'phase'" class="gantt-row gantt-phase" :style="{ '--c': colores.get(fila.group.name) || NO_COLOR }">
              <div class="gantt-label" :title="fila.group.name">
                <button type="button" class="phase-toggle" :aria-expanded="!plegadas.has(fila.group.name)" :title="plegadas.has(fila.group.name) ? 'Expandir fase' : 'Plegar fase'" @click="alternarFase(fila.group.name)">{{ plegadas.has(fila.group.name) ? '▸' : '▾' }}</button>
                <span class="phase-name" title="Ver el detalle de la fase" @click="$emit('seleccionar', { kind: 'phase', name: fila.group.name })">{{ fila.group.name }}</span>
                <span v-if="retrasosDeFase(fila.group).length > 0" class="late-count" :style="{ color: peorRetraso(fila.group).color }" :title="retrasosDeFase(fila.group).length + ' tarea(s) con retraso en esta fase'">⚠ {{ retrasosDeFase(fila.group).length }}</span>
              </div>
              <div class="gantt-timeline">
                <div class="gantt-item" :style="{ gridColumn: (fila.group.start + 1) + ' / ' + (fila.group.end + 2) }" :title="fila.group.name + '\n' + fecha(fila.group.start) + ' → ' + fecha(fila.group.end) + ' · ' + fila.group.progress + '%'">
                  <div class="gantt-phase-bar"><div class="gantt-progress" :style="{ width: fila.group.progress + '%' }" /></div>
                  <span class="gantt-meta">{{ fila.group.end - fila.group.start + 1 }} d · {{ fila.group.progress }}%</span>
                </div>
              </div>
            </div>

            <div v-else class="gantt-row" :class="{ focus: foco === fila.task.id, selected: tareaSeleccionada === fila.task.id }" :data-task-id="fila.task.id"
                 :style="{ '--c': colores.get(fila.task.phase) || NO_COLOR }" @pointerenter="sobre = fila.task.id" @pointerleave="sobre = sobre === fila.task.id ? null : sobre">
              <div class="gantt-label" :class="{ nested: anidado }" :title="fila.task.name + (fila.task.department ? '\n' + fila.task.department : '')" @click="$emit('seleccionar', { kind: 'task', id: fila.task.id })">
                <span>
                  <span v-if="fila.task.status === 'blocked'" :title="'Bloqueada: ' + fila.task.status_reason">⛔ </span>
                  <span v-if="fila.task.status === 'paused'" title="En pausa">⏸ </span>
                  <span v-if="retrasoDe(fila.task)" class="late-mark" :style="{ color: retrasoDe(fila.task).color }" :title="retrasoDe(fila.task).label">⚠ </span>{{ fila.task.name }}
                </span>
              </div>
              <div class="gantt-timeline">
                <span v-if="retrasoDe(fila.task) && indicePrevisto(fila.task) >= 0 && indicePrevisto(fila.task) < dias" class="gantt-planned"
                      :style="{ gridColumn: (indicePrevisto(fila.task) + 1) + ' / ' + (indicePrevisto(fila.task) + 2), '--alert': retrasoDe(fila.task).color }" :title="'Plazo previsto: ' + retrasoDe(fila.task).planned" />
                <div class="gantt-item" :class="[fila.task.status, { milestone: fila.task.milestone, dragging: borrador && borrador.id === fila.task.id }, retrasoDe(fila.task) ? 'late level-' + retrasoDe(fila.task).level + (retrasoDe(fila.task).own ? ' own' : '') : '']"
                     :style="{ gridColumn: (rango(fila.task).start + 1) + ' / ' + (rango(fila.task).end + 2), ...(retrasoDe(fila.task) ? { '--bar': retrasoDe(fila.task).color } : {}) }">
                  <div class="gantt-bar" :title="fila.task.name + '\n' + fecha(rango(fila.task).start) + ' → ' + fecha(rango(fila.task).end) + ' · ' + fila.task.progress + '%'"
                       @pointerdown="empezar($event, fila.task, 'move')" @pointermove="mover" @pointerup="terminar" @pointercancel="terminar">
                    <div class="gantt-progress" :style="{ width: fila.task.progress + '%' }" />
                    <span class="gantt-handle start" @pointerdown="empezar($event, fila.task, 'start')" />
                    <span class="gantt-handle end" @pointerdown="empezar($event, fila.task, 'end')" />
                  </div>
                  <span class="gantt-meta">
                    {{ fila.task.milestone ? 'Hito' : rango(fila.task).end - rango(fila.task).start + 1 + ' d' }}{{ fila.task.status === 'done' ? ' · ✓' : fila.task.progress > 0 ? ' · ' + fila.task.progress + '%' : '' }}
                    <strong v-if="retrasoDe(fila.task)" class="late-meta" :style="{ color: retrasoDe(fila.task).color }"> · +{{ retrasoDe(fila.task).days }} d</strong>
                  </span>
                </div>
              </div>
            </div>
          </template>

          <p v-if="tareas.length === 0" class="muted gantt-empty">Sin tareas todavía.</p>

          <!-- Va por debajo de las barras para no ensuciarlas al cruzarlas -->
          <svg v-if="filas.length > 0" class="gantt-arrows" :width="dias * anchoDia" :height="filas.length * ROW_H">
            <g v-for="a in flechas" :key="a.key" class="gantt-arrow" :class="{ focused: a.focused }"><path class="line" :d="a.d" /><polygon :points="a.head" /></g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { NO_COLOR } from '@/utils/planificador/tareas/colores'
import { addDays, formatDate, parseDate, todayStr } from '@/utils/planificador/tareas/fechas'
import { delayOf } from '@/utils/planificador/tareas/retraso'
import {
  BAR_H, FIT, LABEL_W, ROW_H, ZOOMS, agruparPorFase, calcularArrastre, calcularFlechas, celdasDelRango, filasVisibles, inicioMinimo, mesesDelRango, rangoDelProyecto, rangosDe
} from '@/utils/planificador/tareas/cronograma'
import { diffDays } from '@/utils/planificador/tareas/fechas'

// Cronograma (Gantt): barras por fase y tarea con zoom, flechas de dependencia al pasar el ratón y arrastre para mover o
// redimensionar (el servidor recalcula las tareas que dependen de la movida).
export default {
  name: 'Cronograma-Component',
  props: {
    tareas: { type: Array, required: true },
    colores: { type: Map, required: true },
    seleccion: { type: Object, default: null },
    // Guarda el cambio de fechas: (id, { start, end }) → promesa
    alCambiar: { type: Function, required: true }
  },
  emits: ['seleccionar'],
  data() {
    return {
      ROW_H, BAR_H, LABEL_W, ZOOMS, FIT, NO_COLOR, zoom: 1, anchoAjustado: 12, borrador: null, plegadas: new Set(), sobre: null, verTodas: false, autoZoom: false
    }
  },
  computed: {
    hoy() { return parseDate(todayStr()) },
    anchoDia() { return this.zoom === FIT ? this.anchoAjustado : ZOOMS[this.zoom].px },
    rangoDias() { return rangoDelProyecto(this.tareas, this.hoy) },
    origen() { return this.rangoDias.origin },
    dias() { return this.rangoDias.days },
    indiceHoy() { return diffDays(this.origen, this.hoy) },
    indiceAncla() { return this.indiceHoy >= 0 && this.indiceHoy < this.dias ? this.indiceHoy : 0 },
    meses() { return mesesDelRango(this.origen, this.dias) },
    celdas() { return celdasDelRango(this.origen, this.dias) },
    rangos() { return rangosDe(this.tareas, this.borrador, this.origen) },
    grupos() { return agruparPorFase(this.tareas, this.rangos) },
    filas() { return filasVisibles(this.grupos, this.plegadas) },
    anidado() { return this.grupos.some((g) => g.name !== '') },
    filaDe() {
      const m = new Map()
      this.filas.forEach((f, i) => { if (f.kind === 'task') m.set(f.task.id, i) })
      return m
    },
    tareaSeleccionada() { return this.seleccion && this.seleccion.kind === 'task' ? this.seleccion.id : null },
    // Tarea cuyas dependencias se destacan: la que tiene el ratón encima o la abierta en el panel
    foco() { return this.sobre ?? this.tareaSeleccionada },
    flechas() { return calcularFlechas({ tareas: this.tareas, rangos: this.rangos, filaDe: this.filaDe, foco: this.foco, verTodas: this.verTodas, anchoDia: this.anchoDia }) },
    fasesTodas() { return this.grupos.filter((g) => g.name).map((g) => g.name) },
    todasPlegadas() { return this.fasesTodas.length > 0 && this.fasesTodas.every((n) => this.plegadas.has(n)) }
  },
  watch: {
    anchoDia() { this.$nextTick(() => this.irAHoy(false)) },
    // La primera vez, un proyecto largo se muestra entero; uno corto, por días
    'tareas.length'() { this.zoomInicial() }
  },
  mounted() { this.zoomInicial() },
  methods: {
    rango(t) { return this.rangos.get(t.id) },
    retrasoDe(t) { return delayOf(t) },
    indicePrevisto(t) { const d = delayOf(t); return d ? diffDays(this.origen, parseDate(d.planned)) : -1 },
    fecha(indice) { return formatDate(addDays(this.origen, indice)) },
    retrasosDeFase(g) { return g.tasks.map((t) => delayOf(t)).filter((d) => d !== null) },
    peorRetraso(g) { return this.retrasosDeFase(g).reduce((a, b) => (b.level > a.level ? b : a)) },
    // Con poco ancho, el mes se abrevia (y sin año) para que no se pisen
    etiquetaMes(m) {
      const ancho = (m.to - m.from + 1) * this.anchoDia
      return ancho >= 120 ? m.month + ' ' + m.year : ancho >= 36 ? m.month.slice(0, 3) : ''
    },
    alternarFase(nombre) {
      const siguiente = new Set(this.plegadas)
      if (!siguiente.delete(nombre)) siguiente.add(nombre)
      this.plegadas = siguiente
    },
    ajustar() {
      const ancho = this.$refs.desplazable ? this.$refs.desplazable.clientWidth : 0
      // Mínimo de 5 px por día: por debajo de eso las barras no se distinguen, mejor hacer scroll
      this.anchoAjustado = Math.max(5, Math.floor(((ancho - LABEL_W - 24) / this.dias) * 10) / 10)
      this.zoom = FIT
    },
    zoomInicial() {
      if (this.autoZoom || this.tareas.length === 0) return
      this.autoZoom = true
      if (this.dias > 45) this.ajustar(); else this.zoom = 0
    },
    // Deja «hoy» (o el inicio del proyecto) visible
    irAHoy(suave) {
      const el = this.$refs.desplazable
      if (el) el.scrollTo({ left: Math.max(0, this.indiceAncla * this.anchoDia - 120), behavior: suave ? 'smooth' : 'auto' })
    },

    // ---- Mover / redimensionar ----------------------------------------------------------------------------------------
    empezar(e, tarea, modo) {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      const inicio = diffDays(this.origen, parseDate(tarea.start))
      const fin = diffDays(this.origen, parseDate(tarea.end))
      this.arrastre = { id: tarea.id, modo, origenX: e.clientX, start: inicio, end: fin, minStart: inicioMinimo(tarea, this.tareas, this.origen), ultimo: { start: inicio, end: fin } }
      this.borrador = { id: tarea.id, start: inicio, end: fin }
    },
    mover(e) {
      const a = this.arrastre
      if (!a) return
      const nuevo = calcularArrastre(a, e.clientX - a.origenX, this.anchoDia, this.dias)
      a.ultimo = nuevo
      if (!this.borrador || this.borrador.start !== nuevo.start || this.borrador.end !== nuevo.end) this.borrador = { id: a.id, ...nuevo }
    },
    terminar() {
      const a = this.arrastre
      this.arrastre = null
      if (!a) return
      const tarea = this.tareas.find((t) => t.id === a.id)
      const { start, end } = a.ultimo
      if (!tarea || (start === a.start && end === a.end)) {
        // Sin movimiento: era un clic, se abre el detalle de la tarea
        this.borrador = null
        if (tarea) this.$emit('seleccionar', { kind: 'task', id: tarea.id })
        return
      }
      // Se mantiene el borrador hasta que el guardado termina, para que la barra no «salte» atrás
      Promise.resolve(this.alCambiar(a.id, { start: this.fecha(start), end: this.fecha(end) })).finally(() => { this.borrador = null })
    }
  }
}
</script>
