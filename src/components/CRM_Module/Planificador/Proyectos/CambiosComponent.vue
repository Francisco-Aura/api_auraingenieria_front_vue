<template>
  <p v-if="!contrato" class="muted">Cargando…</p>
  <div v-else class="changes">
    <p v-if="error" class="error">{{ error }}</p>

    <presupuesto-cambios-component :proyecto-id="proyectoId" :contrato="contrato" :cambios-guardados="contrato.changes.map(entradaDeCambio)" :al-guardar-cambios="guardar" />

    <!-- Resumen actualizado -->
    <section class="card-block">
      <h2>Resumen actualizado</h2>
      <div class="stats">
        <div class="stat"><span>Importe contrato original</span><strong>{{ dinero(contrato.summary.original) }}</strong></div>
        <div class="stat"><span>Total modificaciones</span><strong :class="contrato.summary.modifications > 0 ? 'up' : contrato.summary.modifications < 0 ? 'down' : ''">{{ conSigno(contrato.summary.modifications) }}</strong></div>
        <div class="stat main"><span>Importe total vigente</span><strong>{{ dinero(contrato.summary.current_total) }}</strong></div>
      </div>
      <p class="hint">Cada cambio registrado suma o resta su impacto económico al importe del contrato.</p>

      <!-- Forma de pago: los pagos ya facturados no cambian; las ampliaciones van a los que quedan o a una tarea nueva -->
      <table class="current-table payments-table">
        <thead><tr><th>Forma de pago <span v-if="contrato.payments.mode === 'custom'" class="tag">personalizada</span></th><th>%</th><th>Importe (sin IVA)</th><th>Facturado</th></tr></thead>
        <tbody>
          <tr v-for="(s, i) in contrato.payments.stages" :key="i">
            <td>
              <button v-if="s.task_id" type="button" class="link-btn" @click="$emit('abrir-tarea', s.task_id)">{{ s.label }}</button><template v-else>{{ s.label }}</template>
              <span v-if="s.note" class="muted"> · {{ s.note }}</span>
              <span v-if="s.extra" class="tag">ampliación</span>
            </td>
            <td>{{ s.percent }} %</td>
            <td>{{ dinero(s.amount) }}</td>
            <td>{{ s.done ? '✓' : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Datos vigentes (el contrato inicial se fija al crear el proyecto) -->
    <section class="card-block">
      <h2>Datos vigentes</h2>
      <p v-if="!contrato.baseline.importe_total" class="notice warn">Este proyecto no tiene contrato inicial de referencia, así que los importes parten de cero. <button type="button" class="link-btn" @click="$emit('editar-proyecto')">Completarlo ahora</button></p>
      <table class="current-table">
        <thead><tr><th>Dato</th><th>Contrato inicial</th><th>Vigente</th></tr></thead>
        <tbody>
          <tr v-for="f in contrato.fields" :key="f.key" :class="{ changed: cambiado(f) }">
            <td>{{ f.label }}</td>
            <td>{{ formatoValor(f, contrato.baseline[f.key]) }}</td>
            <td><strong>{{ formatoValor(f, contrato.current[f.key]) }}</strong><span v-if="cambiado(f)" class="tag">modificado</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Cambios registrados -->
    <section class="card-block">
      <div class="block-head"><h2>Cambios registrados</h2><button type="button" @click="editando = 'nuevo'">+ Registrar cambio</button></div>
      <p v-if="contrato.changes.length === 0" class="muted">Todavía no hay cambios. Registra uno cuando se modifique algo respecto al contrato inicial.</p>

      <article v-for="c in contrato.changes" :key="c.id" class="change">
        <header>
          <h3>CAMBIO {{ c.number }} <span class="muted">· {{ c.date }}</span></h3>
          <div class="change-actions">
            <button type="button" class="secondary" @click="editando = entradaDeCambio(c)">Editar</button>
            <button type="button" class="icon-btn" title="Eliminar este cambio" @click="quitar(c)">×</button>
          </div>
        </header>
        <dl>
          <dt>Motivo</dt><dd>{{ c.reason }}</dd>
          <dt>Impacto económico</dt><dd :class="c.impact > 0 ? 'up' : c.impact < 0 ? 'down' : ''">{{ conSigno(c.impact) }}</dd>
          <dt>Nuevo importe total contrato</dt><dd><strong>{{ dinero(c.new_total) }}</strong></dd>
          <template v-if="c.budget">
            <dt>Presupuesto</dt>
            <dd>
              <template v-if="c.budget.module_delta !== 0">Módulos {{ c.budget.module_delta > 0 ? '+' : '−' }}{{ Math.abs(c.budget.module_delta) }}</template>
              <template v-if="c.budget.module_delta !== 0 && c.budget.lines.length > 0"> · </template>
              <template v-if="c.budget.lines.length > 0">{{ c.budget.lines.length }} línea{{ c.budget.lines.length === 1 ? '' : 's' }} modificada{{ c.budget.lines.length === 1 ? '' : 's' }}</template>
            </dd>
          </template>
          <template v-if="Object.keys(c.set).length > 0">
            <dt>Datos que modifica</dt>
            <dd><ul class="sets"><li v-for="(valor, clave) in c.set" :key="clave">{{ campoDe(clave) ? campoDe(clave).label : clave }}: <strong>{{ String(valor) }}</strong></li></ul></dd>
          </template>
        </dl>

        <!-- El dinero no avisa a las tareas anteriores: va a los pagos que quedan o a una tarea nueva -->
        <footer v-if="Object.keys(c.payment_effect.tasks).length > 0 || c.payment_effect.new_task">
          <span class="muted">{{ c.payment_effect.new_task ? (c.payment_mode === 'new' ? 'Se cobra en un pago nuevo:' : 'Tarea de facturación creada:') : 'Repartido entre los pagos pendientes:' }}</span>
          <button v-if="c.payment_effect.new_task && porId.has(c.payment_effect.new_task)" type="button" class="task-chip" @click="$emit('abrir-tarea', c.payment_effect.new_task)">{{ porId.get(c.payment_effect.new_task).name }}</button>
          <template v-for="(delta, id) in c.payment_effect.tasks" :key="id">
            <button v-if="porId.has(id)" type="button" class="task-chip" @click="$emit('abrir-tarea', id)">{{ porId.get(id).payment_label || porId.get(id).name }} {{ conSigno(delta) }}</button>
          </template>
        </footer>

        <footer v-if="c.affected_tasks.length > 0">
          <span class="muted">Afecta a:</span>
          <template v-for="id in c.affected_tasks" :key="id">
            <button v-if="porId.has(id)" type="button" class="task-chip" :class="{ pending: c.pending_tasks.includes(id) }" :title="c.pending_tasks.includes(id) ? 'Pendiente de revisar' : 'Revisado'" @click="$emit('abrir-tarea', id)">{{ c.pending_tasks.includes(id) ? '↻ ' : '✓ ' }}{{ porId.get(id).name }}</button>
          </template>
        </footer>
      </article>
    </section>

    <dialogo-cambio v-if="editando" :contrato="contrato" :inicial="editando === 'nuevo' ? null : editando" :al-guardar="guardarCambio" @cerrar="editando = null" />
  </div>
</template>

<script>
import DialogoCambio from './DialogoCambio.vue'
import PresupuestoCambiosComponent from './PresupuestoCambiosComponent.vue'
import { mensajeError } from '@/services/planificadorApi'
import { conSigno, dinero, entradaDeCambio, formatoValor } from '@/utils/planificador/contratos/formatoContrato'

// Sección «Cambios»: resumen actualizado con la forma de pago, datos vigentes del contrato y registro de cambios.
export default {
  name: 'Cambios-Component',
  components: { DialogoCambio, PresupuestoCambiosComponent },
  props: {
    proyectoId: { type: String, required: true },
    contrato: { type: Object, default: null },
    tareas: { type: Array, required: true },
    // Guarda todos los cambios (lista completa): promesa que falla si el servidor los rechaza
    alGuardarCambios: { type: Function, required: true }
  },
  emits: ['abrir-tarea', 'editar-proyecto'],
  data() { return { editando: null, error: null } },
  computed: {
    porId() { return new Map(this.tareas.map((t) => [t.id, t])) },
    campos() { return new Map((this.contrato ? this.contrato.fields : []).map((f) => [f.key, f])) }
  },
  methods: {
    dinero, conSigno, formatoValor, entradaDeCambio,
    campoDe(clave) { return this.campos.get(clave) },
    cambiado(f) { return String(this.contrato.baseline[f.key] ?? '') !== String(this.contrato.current[f.key] ?? '') },
    async guardar(siguiente) {
      this.error = null
      try {
        await this.alGuardarCambios(siguiente)
      } catch (e) {
        this.error = mensajeError(e)
        throw e
      }
    },
    quitar(cambio) {
      const resumen = cambio.reason.length > 70 ? cambio.reason.slice(0, 70) + '…' : cambio.reason
      if (!window.confirm('¿Eliminar el CAMBIO ' + cambio.number + ' («' + resumen + '»)?')) return
      this.guardar(this.contrato.changes.filter((c) => c.id !== cambio.id).map(entradaDeCambio)).catch(() => undefined)
    },
    async guardarCambio(entrada) {
      const otros = this.contrato.changes.map(entradaDeCambio).filter((c) => c.id !== entrada.id)
      await this.guardar([...otros, entrada])
      this.editando = null
    }
  }
}
</script>
