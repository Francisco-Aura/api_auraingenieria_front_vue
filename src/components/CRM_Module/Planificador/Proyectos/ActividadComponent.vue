<template>
  <p v-if="error && !entradas" class="error">No se pudo cargar el registro: {{ error }}</p>
  <p v-else-if="!entradas" class="muted">Cargando actividad…</p>
  <section v-else class="activity">
    <div class="activity-filters">
      <label>Persona <select v-model="actor"><option value="">Todas</option><option v-for="a in actores" :key="a" :value="a">{{ a }}</option></select></label>
      <div class="kind-chips" role="group" aria-label="Tipo de cambio">
        <button v-for="(etiqueta, k) in TIPOS" :key="k" type="button" class="kind-chip" :class="['kind-' + k, { on: tipos.includes(k) }]" :aria-pressed="tipos.includes(k)" @click="alternar(k)">{{ etiqueta }}</button>
      </div>
    </div>
    <p v-if="entradas.length === 0" class="muted">Todavía no hay actividad. Aquí aparecerá cada cambio que haga el equipo, con su autor y la hora.</p>
    <p v-else-if="mostradas.length === 0" class="muted">Ningún cambio con esos filtros.</p>
    <div v-for="g in grupos" :key="g.clave" class="activity-day">
      <h3>{{ etiquetaDia(g.clave) }}</h3>
      <ol>
        <li v-for="e in g.items" :key="e.id" :class="'kind-' + e.kind">
          <span class="a-time">{{ hora(e.at) }}</span><span class="a-dot" aria-hidden="true" />
          <div class="a-body">
            <div class="a-line">
              <strong class="a-actor">{{ e.actor }}</strong> <span>{{ e.summary }}</span>
              <template v-if="e.task_name">
                <template v-if="e.task_id && tareaIds.has(e.task_id)"> · <button type="button" class="link-btn" @click="$emit('abrir-tarea', e.task_id)">{{ e.task_name }}</button></template>
                <span v-else class="muted"> · {{ e.task_name }}</span>
              </template>
            </div>
            <div v-if="e.detail" class="a-detail">{{ e.detail }}</div>
          </div>
          <span class="a-kind">{{ TIPOS[e.kind] || e.kind }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'

const TIPOS = { status: 'Estado', schedule: 'Fechas', checklist: 'Subtareas', docs: 'Documentación', contract: 'Contrato', structure: 'Tareas', material: 'Material', project: 'Proyecto' }
const CADA_MS = 20000

// Día en hora local (no UTC): una entrada de las 00:30 pertenece al día en que la ve quien la hizo
const claveLocal = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

// Quién ha cambiado qué y cuándo en el proyecto, agrupado por días y filtrable por persona y tipo.
export default {
  name: 'Actividad-Component',
  props: {
    proyectoId: { type: String, required: true },
    // Cambia cuando el proyecto cambia (tareas…): se vuelve a pedir el registro
    refrescar: { type: Number, default: 0 },
    // Tareas que siguen existiendo: solo esas se pueden abrir desde el registro
    tareaIds: { type: Set, default: () => new Set() }
  },
  emits: ['abrir-tarea'],
  data() { return { TIPOS, entradas: null, error: null, actor: '', tipos: [] } },
  computed: {
    actores() { return [...new Set((this.entradas || []).map((e) => e.actor))].sort() },
    mostradas() { return (this.entradas || []).filter((e) => (!this.actor || e.actor === this.actor) && (this.tipos.length === 0 || this.tipos.includes(e.kind))) },
    grupos() {
      const salida = []
      for (const e of this.mostradas) {
        const clave = claveLocal(new Date(e.at))
        const ultimo = salida[salida.length - 1]
        if (ultimo && ultimo.clave === clave) ultimo.items.push(e)
        else salida.push({ clave, items: [e] })
      }
      return salida
    }
  },
  watch: { proyectoId() { this.entradas = null; this.cargar() }, refrescar() { this.cargar() } },
  mounted() { this.cargar(); this.temporizador = window.setInterval(this.cargar, CADA_MS) },
  beforeUnmount() { window.clearInterval(this.temporizador) },
  methods: {
    async cargar() {
      try { this.entradas = await planificadorApi.actividad(this.proyectoId); this.error = null } catch (e) { this.error = mensajeError(e) }
    },
    alternar(k) { this.tipos = this.tipos.includes(k) ? this.tipos.filter((x) => x !== k) : [...this.tipos, k] },
    hora(iso) { return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) },
    etiquetaDia(clave) {
      const hoy = new Date()
      const ayer = new Date()
      ayer.setDate(hoy.getDate() - 1)
      if (clave === claveLocal(hoy)) return 'Hoy'
      if (clave === claveLocal(ayer)) return 'Ayer'
      const [y, m, d] = clave.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
}
</script>
