<template>
  <modal-component :ancho="true" :titulo="inicial ? 'Editar cambio' : 'Registrar cambio'" @cerrar="$emit('cerrar')">
    <div class="form-grid">
      <label class="field">Fecha <input v-model="fecha" type="date"></label>
      <label class="field">Impacto económico (+ / − €) <input v-model="impacto" type="number" step="any" placeholder="Ej.: 1200 o -150"></label>
    </div>

    <fieldset v-if="sube" class="price-box payment-mode">
      <legend>Cómo se cobra este aumento</legend>
      <label class="radio">
        <input v-model="modoPago" type="radio" name="modo-cobro" value="split">
        <span><strong>Repartirlo entre los pagos pendientes</strong><small class="muted"> — se suma a las facturas que aún no se han empezado, en proporción a su importe.</small></span>
      </label>
      <label class="radio">
        <input v-model="modoPago" type="radio" name="modo-cobro" value="new">
        <span><strong>Cobrarlo en un pago nuevo</strong><small class="muted"> — se añade una factura adicional por este importe; las demás no cambian.</small></span>
      </label>
    </fieldset>

    <label class="field">Motivo <textarea v-model="motivo" rows="3" /></label>

    <fieldset class="price-box">
      <legend>Datos del contrato que modifica (opcional)</legend>
      <p class="hint">Si cambias equipos o potencia, las tareas que los usan (pedidos, entregas, montaje…) mostrarán el valor nuevo y se marcarán para revisar.</p>
      <div v-for="(s, i) in cambios" :key="s.field" class="set-row">
        <span>{{ campo(s.field) ? campo(s.field).label : s.field }}</span>
        <input v-model="s.value" :type="campo(s.field) && campo(s.field).type !== 'text' ? 'number' : 'text'" :step="campo(s.field) && campo(s.field).type === 'int' ? 1 : 'any'"
               :min="campo(s.field) && campo(s.field).type !== 'text' ? 0 : undefined" :placeholder="'Ahora: ' + formatoValor(campo(s.field), contrato.current[s.field])">
        <button type="button" class="icon-btn" title="Quitar" @click="cambios.splice(i, 1)">×</button>
      </div>
      <select v-if="libres.length > 0" value="" @change="anadirCampo($event)">
        <option value="">+ Añadir dato que cambia…</option>
        <option v-for="f in libres" :key="f.key" :value="f.key">{{ f.label }}</option>
      </select>
    </fieldset>

    <p v-if="error" class="error">{{ error }}</p>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" :disabled="!valido || ocupado" @click="guardar">Guardar cambio</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { mensajeError } from '@/services/planificadorApi'
import { formatoValor } from '@/utils/planificador/contratos/formatoContrato'
import { todayStr } from '@/utils/planificador/tareas/fechas'

// Alta o edición de un cambio del contrato: fecha, impacto económico, cómo se cobra un aumento, motivo y datos que modifica.
export default {
  name: 'Dialogo-Cambio',
  components: { ModalComponent },
  props: {
    contrato: { type: Object, required: true },
    inicial: { type: Object, default: null },
    alGuardar: { type: Function, required: true }
  },
  emits: ['cerrar'],
  data() {
    const i = this.inicial
    return {
      fecha: i ? i.date : todayStr(), motivo: i ? i.reason : '', impacto: i ? String(i.impact) : '', modoPago: (i && i.payment_mode) || 'split',
      cambios: Object.entries((i && i.set) || {}).map(([field, value]) => ({ field, value: String(value) })),
      ocupado: false, error: null
    }
  },
  computed: {
    modificables() { return this.contrato.fields.filter((f) => f.key !== 'importe_total') },
    libres() { const usados = new Set(this.cambios.map((s) => s.field)); return this.modificables.filter((f) => !usados.has(f.key)) },
    // Un campo numérico de Vue entrega un número (o texto vacío): se trata siempre como texto
    impactoTexto() { return String(this.impacto ?? '').trim() },
    sube() { return Number(this.impactoTexto.replace(',', '.')) > 0 },
    valido() { return this.motivo.trim() !== '' && this.fecha !== '' }
  },
  methods: {
    formatoValor,
    campo(clave) { return this.modificables.find((f) => f.key === clave) },
    anadirCampo(e) {
      if (e.target.value) this.cambios.push({ field: e.target.value, value: '' })
      e.target.value = ''
    },
    async guardar() {
      this.ocupado = true
      this.error = null
      try {
        await this.alGuardar({
          id: this.inicial ? this.inicial.id : undefined, date: this.fecha, reason: this.motivo.trim(),
          impact: this.impactoTexto === '' ? 0 : this.impactoTexto,
          set: Object.fromEntries(this.cambios.map((s) => [s.field, String(s.value ?? '').trim()]).filter(([, v]) => v !== '')),
          budget: (this.inicial && this.inicial.budget) || null, // se conserva lo que el cambio varía del presupuesto
          payment_mode: this.sube ? this.modoPago : 'split'
        })
      } catch (e) {
        this.error = mensajeError(e)
        this.ocupado = false
      }
    }
  }
}
</script>
