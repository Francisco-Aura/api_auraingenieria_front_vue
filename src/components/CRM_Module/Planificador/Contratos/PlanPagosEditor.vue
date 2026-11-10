<template>
  <div class="payment-plan">
    <div class="plan-mode" role="radiogroup" aria-label="Forma de pago">
      <label :class="{ on: !personalizada }">
        <input type="radio" name="modo-pago" :checked="!personalizada" @change="$emit('update:plan', { mode: 'standard', stages: STANDARD_STAGES })">
        <span><strong>Habitual</strong><small>30 % · 40 % · 20 % · 10 %</small></span>
      </label>
      <label :class="{ on: personalizada }">
        <input type="radio" name="modo-pago" :checked="personalizada" @change="pasarAPersonalizada">
        <span><strong>Personalizada</strong><small>Los pagos y porcentajes que quieras</small></span>
      </label>
    </div>

    <table class="plan-table">
      <thead><tr><th>Pago</th><th class="num">%</th><th class="num">Importe</th><th v-if="personalizada" aria-label="Quitar" /></tr></thead>
      <tbody>
        <tr v-for="(s, i) in plan.stages" :key="i">
          <td>
            <input v-if="personalizada" :value="s.label" :placeholder="'Pago ' + (i + 1) + ': ¿a qué corresponde?'" @input="cambiarTexto(i, $event.target.value)">
            <template v-else>{{ s.note || s.label }}</template>
          </td>
          <td class="num">
            <input v-if="personalizada" class="pct" inputmode="decimal" :value="String(s.percent)" @input="cambiarPorcentaje(i, $event.target.value)">
            <template v-else>{{ s.percent }} %</template>
          </td>
          <td class="num">{{ importeDe(stagePercent(s)) }}</td>
          <td v-if="personalizada"><button type="button" class="icon-btn" title="Quitar este pago" @click="quitar(i)">×</button></td>
        </tr>
      </tbody>
      <tfoot>
        <tr :class="problema ? 'bad' : 'good'"><td>Total</td><td class="num">{{ suma }} %</td><td class="num">{{ importeDe(suma) }}</td><td v-if="personalizada" /></tr>
      </tfoot>
    </table>

    <div v-if="personalizada" class="plan-actions">
      <button type="button" class="secondary" :disabled="plan.stages.length >= MAX_STAGES" @click="anadir">+ Añadir pago</button>
      <span v-if="problema" class="plan-problem">{{ problema }}</span>
      <span v-else class="muted plan-hint">Al cambiar un porcentaje, la diferencia pasa al pago anterior. El texto de cada pago es libre y es el que aparece en el contrato.</span>
    </div>
  </div>
</template>

<script>
import { parseNumber } from '@/utils/planificador/motor/reglasContrato'
import { MAX_STAGES, STANDARD_STAGES, applyPercentEdit, planProblem, planTotal, settleOnLast, stagePercent, withSuggestedTexts } from '@/utils/planificador/contratos/pagos'
import { dinero } from '@/utils/planificador/contratos/formatoContrato'

// Forma de pago: la habitual (30/40/20/10) o una personalizada con las etapas y porcentajes que se indiquen.
export default {
  name: 'Plan-Pagos-Editor',
  props: {
    plan: { type: Object, required: true },
    // Importe total tecleado en el contrato, para enseñar cuánto es cada pago
    total: { type: String, default: undefined }
  },
  emits: ['update:plan'],
  data() { return { MAX_STAGES, STANDARD_STAGES } },
  computed: {
    personalizada() { return this.plan.mode === 'custom' },
    problema() { return planProblem(this.plan) },
    suma() { return planTotal(this.plan) },
    importe() { return parseNumber(this.total) }
  },
  methods: {
    stagePercent,
    importeDe(porcentaje) { return this.importe !== null && Number.isFinite(porcentaje) ? dinero((this.importe * porcentaje) / 100) : '—' },
    cambiar(etapas) { this.$emit('update:plan', { ...this.plan, stages: etapas }) },
    cambiarTexto(i, texto) { this.cambiar(this.plan.stages.map((s, j) => (j === i ? { ...s, label: texto } : s))) },
    // Al cambiar un porcentaje, la diferencia pasa al pago anterior (al último, si es el primero)
    cambiarPorcentaje(i, texto) { this.cambiar(applyPercentEdit(this.plan.stages, i, texto)) },
    // Al quitar pagos, los que no se hayan escrito a mano pasan a llevar el texto sugerido para los que quedan
    quitar(i) { this.cambiar(withSuggestedTexts(settleOnLast(this.plan.stages.filter((_, j) => j !== i)))) },
    // El pago nuevo entra vacío: al escribir su porcentaje, el anterior cede lo necesario
    anadir() { this.cambiar(withSuggestedTexts([...this.plan.stages, { label: '', percent: '' }])) },
    // Se parte de la habitual para ajustarla, en vez de empezar en blanco
    pasarAPersonalizada() { this.$emit('update:plan', { mode: 'custom', stages: withSuggestedTexts(this.plan.stages.map((s) => ({ ...s, percent: String(s.percent) }))) }) }
  }
}
</script>
