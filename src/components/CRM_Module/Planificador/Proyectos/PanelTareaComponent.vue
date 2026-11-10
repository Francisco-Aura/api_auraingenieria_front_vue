<template>
  <aside v-if="vista" class="drawer" :style="{ '--c': color }">
    <button type="button" class="drawer-close" title="Cerrar (Esc)" aria-label="Cerrar" @click="$emit('cerrar')">×</button>

    <template v-if="tarea">
      <header class="drawer-head">
        <div class="drawer-chips">
          <insignia-tarea v-if="tarea.phase" tipo="fase" :nombre="tarea.phase" :color="colores.get(tarea.phase) || NO_COLOR" :al-hacer-clic="true" @clic="$emit('seleccionar', { kind: 'phase', name: tarea.phase })" />
          <insignia-tarea tipo="area" :nombre="tarea.department" />
          <span v-if="tarea.milestone" class="drawer-milestone">◆ Hito</span>
        </div>
        <h2>{{ tarea.name }}</h2>
      </header>

      <div v-if="cambiosPendientes.length > 0" class="change-banner" role="status">
        <strong>↻ Cambios del contrato que afectan a esta tarea</strong>
        <ul>
          <li v-for="c in cambiosPendientes" :key="c.id">
            <div>
              <b>CAMBIO {{ c.number }}</b> · {{ c.date }} — {{ c.reason }}
              <div class="change-values">
                <span v-for="k in c.touched.filter((x) => tarea.uses.includes(x))" :key="k">{{ etiquetaTarea(campoDe(k) ? campoDe(k).label : k) }}: <strong>{{ k === 'importe_total' ? dinero(c.new_total) : formatoValor(campoDe(k), c.set[k]) }}</strong></span>
              </div>
            </div>
            <button type="button" class="secondary" @click="$emit('revisar-cambios', tarea.id, [...tarea.change_acks, c.id])">Marcar como revisado</button>
          </li>
        </ul>
      </div>

      <div v-if="retraso" class="alert-banner" :class="'level-' + retraso.level" :style="{ '--alert': retraso.color }" role="alert">
        <strong>⚠ {{ retraso.label }} · Incidencia {{ levelName(retraso.level) }}</strong>
        <p>
          {{ retraso.own
            ? 'Su plazo era el ' + shortDate(retraso.planned) + ' y sigue sin completarse. Cada día que pase, se prorroga un día más y se desplazan las tareas que dependen de ella.'
            : 'Se ha desplazado ' + retraso.days + (retraso.days === 1 ? ' día' : ' días') + ' sobre su plazo previsto (' + shortDate(retraso.planned) + ') porque se han retrasado sus predecesoras.' }}
        </p>
        <ul v-if="predecesorasRetrasadas.length > 0">
          <li v-for="x in predecesorasRetrasadas" :key="x.pred.id">
            <button type="button" class="dep-link" @click="$emit('seleccionar', { kind: 'task', id: x.pred.id })">{{ x.pred.name }}</button>
            <span class="alert-days" :style="{ color: x.retraso.color }">+{{ x.retraso.days }} d</span>
          </li>
        </ul>
        <p class="hint">Si cambias las fechas a mano, el nuevo fin pasa a ser el plazo de referencia y el aviso desaparece.</p>
      </div>

      <div v-if="tarea.status === 'blocked'" class="status-banner blocked" role="status">
        <strong>⛔ Bloqueada: {{ tarea.status_reason || 'sin motivo indicado' }}</strong>
        <p v-if="tarea.status_note">{{ tarea.status_note }}</p>
        <button type="button" class="link-btn" @click="$emit('pedir-estado', tarea, 'blocked')">Editar motivo</button>
      </div>
      <div v-if="tarea.status === 'paused'" class="status-banner paused" role="status"><strong>⏸ En pausa</strong><p>La tarea está detenida. Mientras no se retome, sus plazos siguen corriendo.</p></div>
      <div v-if="tarea.status === 'done'" class="status-banner done" role="status">
        <strong>✓ Finalizada{{ tarea.completed_at ? ' el ' + shortDate(tarea.completed_at) : '' }}</strong>
        <p v-if="tarea.closing_note">{{ tarea.closing_note }}</p>
      </div>
      <div v-if="faltaDocumentacion" class="status-banner doing" role="status">
        <strong>Todas las subtareas están hechas, pero falta documentación</strong>
        <p>Para finalizar la tarea hay que aportar: {{ pendientes.map((d) => d.label).join('; ') }}.</p>
        <button type="button" class="link-btn" @click="$emit('pedir-estado', tarea, 'done')">Aportar y finalizar…</button>
      </div>

      <section>
        <h4>Estado</h4>
        <div class="segmented five">
          <button v-for="s in STATUS_ORDER" :key="s" type="button" :class="{ active: tarea.status === s }" :style="{ '--s': STATUS_META[s].color }" :disabled="moveBlockedReason(tarea, s) !== null"
                  :title="moveBlockedReason(tarea, s) || (s === 'blocked' ? 'Pausa con motivo' : s === 'done' ? 'Finalizar aportando la documentación requerida' : tarea.status === 'done' && s === 'doing' ? 'Reabrir la tarea' : undefined)"
                  @click="tarea.status !== s && $emit('pedir-estado', tarea, s)">{{ STATUS_META[s].label }}</button>
        </div>
        <div class="drawer-progress"><insignia-tarea tipo="progreso" :valor="tarea.progress" :color="STATUS_META[tarea.status].color" /><span>{{ tarea.progress }}%</span></div>
      </section>

      <section v-if="filasContrato.length > 0">
        <h4>Datos vigentes del contrato</h4>
        <dl class="contract-data">
          <div v-for="r in filasContrato" :key="r.key" :class="{ changed: r.cambiado }">
            <dt>{{ r.etiqueta }}</dt>
            <dd><strong>{{ r.valor }}</strong><span v-if="r.cambiado" class="was"> (antes {{ r.original }})</span><span v-if="r.extra" class="was"> · {{ r.extra }}</span></dd>
          </div>
        </dl>
      </section>

      <section>
        <h4>Fechas</h4>
        <div class="drawer-dates">
          <label>Inicio <input type="date" :value="tarea.start" @change="moverInicio($event.target.value)"></label>
          <label>Fin <input type="date" :value="tarea.end" :min="tarea.start" @change="$event.target.value && $emit('cambiar', tarea.id, { end: $event.target.value })"></label>
          <span class="drawer-duration">{{ durationDays(tarea.start, tarea.end) }} días</span>
        </div>
        <p v-if="tarea.planned_end && tarea.planned_end !== tarea.end" class="hint">Plazo previsto originalmente: {{ shortDate(tarea.planned_end) }}.</p>
        <p class="hint">{{ masTemprano ? 'No puede empezar antes del ' + shortDate(masTemprano) + ' (cuando terminan sus predecesoras). ' : '' }}Si cambias las fechas, se mueven las tareas que dependen de esta.</p>
      </section>

      <section>
        <h4>Depende de</h4>
        <p v-if="predecesoras.length === 0" class="hint">Puede empezar cuando quieras.</p>
        <ul class="dep-list"><li v-for="p in predecesoras" :key="p.id">
          <button type="button" class="dep-link" @click="$emit('seleccionar', { kind: 'task', id: p.id })"><span class="dep-dot" :style="{ background: colores.get(p.phase) || NO_COLOR }" />{{ p.name }}</button>
          <insignia-tarea tipo="estado" :estado="p.status" />
        </li></ul>
      </section>

      <section v-if="sucesoras.length > 0">
        <h4>Desbloquea</h4>
        <ul class="dep-list"><li v-for="s in sucesoras" :key="s.id">
          <button type="button" class="dep-link" @click="$emit('seleccionar', { kind: 'task', id: s.id })"><span class="dep-dot" :style="{ background: colores.get(s.phase) || NO_COLOR }" />{{ s.name }}</button>
          <insignia-tarea tipo="estado" :estado="s.status" />
        </li></ul>
      </section>

      <section v-if="tarea.checklist.length > 0">
        <h4>Subtareas <span class="count">{{ hechas }}/{{ tarea.checklist.length }}</span></h4>
        <ul class="check-list"><li v-for="(item, i) in tarea.checklist" :key="i"><label>
          <input type="checkbox" :checked="item.done" @change="marcarSubtarea(i, $event.target.checked)"><span :class="{ done: item.done }">{{ item.text }}</span>
        </label></li></ul>
      </section>

      <section v-if="tarea.kind === 'material'">
        <h4>Material sobrante</h4>
        <material-component :proyecto-id="tarea.project_id" />
      </section>

      <section>
        <h4>Documentación y elementos <span class="count">{{ cuentaDocumentos }}</span></h4>
        <entregables-panel :tarea="tarea" :acciones="acciones" />
      </section>

      <section v-if="tarea.description"><h4>Descripción</h4><p class="descripcion-tarea">{{ tarea.description }}</p></section>

      <footer class="drawer-foot"><button type="button" class="danger-btn" @click="$emit('eliminar', tarea.id)">Eliminar tarea</button></footer>
    </template>

    <template v-else>
      <header class="drawer-head"><div class="drawer-chips"><span class="drawer-milestone">Fase</span></div><h2>{{ nombreFase }}</h2></header>
      <p v-if="propias.length === 0" class="hint">Esta fase no tiene tareas.</p>
      <template v-else>
        <section>
          <h4>Resumen</h4>
          <div class="drawer-progress"><insignia-tarea tipo="progreso" :valor="progresoFase" /><span>{{ progresoFase }}%</span></div>
          <p class="hint">
            {{ shortDate(inicioFase) }} → {{ shortDate(finFase) }} · {{ durationDays(inicioFase, finFase) }} días · {{ cuenta('done') }} hechas, {{ cuenta('doing') }} en curso, {{ cuenta('todo') }} pendientes{{ cuenta('paused') > 0 ? ', ' + cuenta('paused') + ' en pausa' : '' }}{{ cuenta('blocked') > 0 ? ', ' + cuenta('blocked') + ' bloqueadas' : '' }}
          </p>
        </section>
        <section>
          <h4>Tareas <span class="count">{{ propias.length }}</span></h4>
          <ul class="dep-list"><li v-for="t in propias" :key="t.id">
            <button type="button" class="dep-link" @click="$emit('seleccionar', { kind: 'task', id: t.id })">{{ t.name }}</button>
            <insignia-tarea tipo="estado" :estado="t.status" />
          </li></ul>
        </section>
      </template>
    </template>
  </aside>
</template>

<script>
import InsigniaTarea from './InsigniaTarea.vue'
import EntregablesPanel from './EntregablesPanel.vue'
import MaterialComponent from './MaterialComponent.vue'
import { dinero, etiquetaTarea, formatoValor } from '@/utils/planificador/contratos/formatoContrato'
import { NO_COLOR, STATUS_META, STATUS_ORDER } from '@/utils/planificador/tareas/colores'
import { addDays, durationDays, formatDate, parseDate, shortDate } from '@/utils/planificador/tareas/fechas'
import { delayOf, levelName } from '@/utils/planificador/tareas/retraso'
import { moveBlockedReason, pendingDeliverables } from '@/utils/planificador/tareas/flujo'

// Panel lateral con el detalle de una tarea (o de una fase): estado, fechas, dependencias, subtareas y documentación.
export default {
  name: 'Panel-Tarea-Component',
  components: { InsigniaTarea, EntregablesPanel, MaterialComponent },
  props: {
    seleccion: { type: Object, required: true },
    tareas: { type: Array, required: true },
    colores: { type: Map, required: true },
    acciones: { type: Object, required: true },
    // Contrato del proyecto (datos vigentes y cambios por revisar); null mientras carga
    contrato: { type: Object, default: null }
  },
  emits: ['seleccionar', 'cerrar', 'cambiar', 'pedir-estado', 'eliminar', 'revisar-cambios'],
  data() { return { NO_COLOR, STATUS_META, STATUS_ORDER } },
  computed: {
    tarea() { return this.seleccion.kind === 'task' ? this.tareas.find((t) => t.id === this.seleccion.id) : undefined },
    vista() { return this.seleccion.kind !== 'task' || !!this.tarea },
    nombreFase() { return this.seleccion.kind === 'phase' ? this.seleccion.name : (this.tarea && this.tarea.phase) || '' },
    color() { return this.colores.get(this.nombreFase) || NO_COLOR },
    porId() { return new Map(this.tareas.map((t) => [t.id, t])) },
    predecesoras() { return this.tarea.depends_on.map((id) => this.porId.get(id)).filter(Boolean) },
    sucesoras() { return this.tareas.filter((t) => t.depends_on.includes(this.tarea.id)) },
    // Fecha más temprana permitida por las predecesoras
    masTemprano() {
      return this.predecesoras.length ? formatDate(addDays(Math.max(...this.predecesoras.map((p) => parseDate(p.end))), 1)) : null
    },
    hechas() { return this.tarea.checklist.filter((i) => i.done).length },
    pendientes() { return pendingDeliverables(this.tarea) },
    faltaDocumentacion() { return this.tarea.status !== 'done' && this.tarea.checklist.length > 0 && this.hechas === this.tarea.checklist.length && this.pendientes.length > 0 },
    retraso() { return delayOf(this.tarea) },
    // Cambios del contrato que tocan datos de esta tarea y aún no se han revisado
    cambiosPendientes() {
      if (!this.contrato) return []
      const ids = this.contrato.pending_by_task[this.tarea.id] || []
      return this.contrato.changes.filter((c) => ids.includes(c.id))
    },
    // Datos del contrato que usa la tarea, con su valor vigente
    filasContrato() {
      if (!this.contrato) return []
      const porcentaje = /(\d+)\s?%/.exec(this.tarea.name)
      return this.tarea.uses.map((key) => {
        const campo = this.campoDe(key)
        const original = this.contrato.baseline[key]
        const actual = this.contrato.current[key]
        const total = Number(actual ?? 0)
        let extra = null
        if (key === 'importe_total') {
          // Una tarea de facturar muestra el importe de su pago; en las antiguas se calcula con el porcentaje del nombre
          if (this.tarea.payment_amount != null) extra = 'Importe de este pago: ' + dinero(this.tarea.payment_amount)
          else if (porcentaje && total > 0) extra = porcentaje[1] + ' % = ' + dinero((total * Number(porcentaje[1])) / 100)
        }
        return { key, etiqueta: etiquetaTarea(campo ? campo.label : key), valor: formatoValor(campo, actual), original: formatoValor(campo, original), cambiado: String(original ?? '') !== String(actual ?? ''), extra }
      })
    },
    predecesorasRetrasadas() { return this.predecesoras.flatMap((pred) => { const d = delayOf(pred); return d ? [{ pred, retraso: d }] : [] }) },
    cuentaDocumentos() {
      const dados = new Set(this.tarea.attachments.map((a) => a.requirement))
      const total = this.tarea.deliverables.filter((d) => !d.na).length
      const ok = this.tarea.deliverables.filter((d) => !d.na && dados.has(d.key)).length
      return total > 0 ? ok + '/' + total + ' aportados' : this.tarea.attachments.length + ' adjuntos'
    },
    propias() { return this.tareas.filter((t) => (this.nombreFase === 'Sin fase' ? !t.phase : t.phase === this.nombreFase)) },
    progresoFase() { return Math.round(this.propias.reduce((s, t) => s + t.progress, 0) / this.propias.length) },
    inicioFase() { return this.propias.reduce((m, t) => (t.start < m ? t.start : m), this.propias[0].start) },
    finFase() { return this.propias.reduce((m, t) => (t.end > m ? t.end : m), this.propias[0].end) }
  },
  mounted() {
    this.alTecla = (e) => { if (e.key === 'Escape') this.$emit('cerrar') }
    window.addEventListener('keydown', this.alTecla)
  },
  beforeUnmount() { window.removeEventListener('keydown', this.alTecla) },
  methods: {
    dinero, etiquetaTarea, formatoValor,
    campoDe(clave) { return this.contrato ? this.contrato.fields.find((f) => f.key === clave) : undefined },
    shortDate, durationDays, levelName, moveBlockedReason,
    cuenta(estado) { return this.propias.filter((t) => t.status === estado).length },
    marcarSubtarea(indice, marcada) {
      this.$emit('cambiar', this.tarea.id, { checklist: this.tarea.checklist.map((item, i) => (i === indice ? { ...item, done: marcada } : item)) })
    },
    // Cambiar el inicio desplaza la tarea entera conservando su duración
    moverInicio(valor) {
      if (!valor || valor === this.tarea.start) return
      const desplazamiento = parseDate(valor) - parseDate(this.tarea.start)
      this.$emit('cambiar', this.tarea.id, { start: valor, end: formatDate(parseDate(this.tarea.end) + desplazamiento) })
    }
  }
}
</script>
