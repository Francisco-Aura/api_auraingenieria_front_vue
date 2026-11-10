<template>
  <div class="contract-generator">
    <p class="hint">Se genera con el modelo de contrato, los datos de instalación y la forma de pago elegida. El contrato se entrega solo en PDF.</p>
    <div class="party-grid">
      <label v-for="clave in claves" :key="clave" :class="clave === 'domicilio' || clave === 'instalacion' ? 'wide-field' : undefined">
        {{ ETIQUETAS_PARTE[clave] }}
        <input :class="{ 'required-empty': intentado && !valorDe(clave).trim() }" :value="parte[clave]" :placeholder="clave === 'empresa' ? 'Con su forma jurídica (S.L., S.A.…)' : clave === 'kw_nominal' ? sugeridos : ''"
               @input="$emit('update:parte', { ...parte, [clave]: $event.target.value })">
      </label>
    </div>
    <div class="generate-actions">
      <button type="button" :disabled="ocupado" @click="generar">{{ ocupado ? 'Generando…' : 'Generar contrato (PDF)' }}</button>
      <span v-if="problemaPlan" class="plan-problem">Revisa la forma de pago: {{ problemaPlan }}</span>
    </div>
    <p v-if="intentado && faltan.length > 0" class="plan-problem missing-list" role="alert">Faltan por rellenar: {{ faltan.join(', ') }}.</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { descargarArchivo } from '@/utils/planificador/documentos/descarga'
import { planPayload, planProblem } from '@/utils/planificador/contratos/pagos'
import { ETIQUETAS_PARTE, datosQueFaltan, kwSugeridos } from '@/utils/planificador/contratos/partes'

// Genera el contrato (MODELO_2) en PDF con los datos del presupuesto y los que se completen aquí, y lo descarga. No guarda nada: al crear el
// proyecto, el servidor lo archiva en su carpeta de Dropbox.
export default {
  name: 'Generador-Contrato',
  props: {
    parte: { type: Object, required: true },
    // Datos de instalación del contrato inicial (todo texto)
    contrato: { type: Object, required: true },
    plan: { type: Object, required: true },
    // Garantías de los módulos leídas del presupuesto
    extras: { type: Object, default: () => ({}) },
    // Ya se intentó generar con datos que faltaban: solo entonces se marcan en rojo
    intentado: { type: Boolean, default: false }
  },
  emits: ['update:parte', 'intento', 'generado'],
  data() { return { ETIQUETAS_PARTE, ocupado: false, error: null } },
  computed: {
    claves() { return Object.keys(ETIQUETAS_PARTE) },
    sugeridos() { return kwSugeridos(this.contrato) },
    faltan() { return datosQueFaltan(this.parte, this.contrato) },
    problemaPlan() { return planProblem(this.plan) }
  },
  methods: {
    valorDe(clave) { return clave === 'kw_nominal' ? this.parte.kw_nominal || this.sugeridos : this.parte[clave] },
    async generar() {
      // El botón siempre está activo: si falta algo, se marca en rojo lo que falta en lugar de generar
      if (this.faltan.length > 0 || this.problemaPlan !== null) { this.$emit('intento'); return }
      this.ocupado = true
      this.error = null
      const c = this.contrato
      try {
        const { blob, nombre } = await planificadorApi.generarContrato({
          ...this.parte, kw_nominal: this.parte.kw_nominal || this.sugeridos,
          // El firmante del promotor es su representante
          firmante: this.parte.representante, firmante_dni: this.parte.dni,
          kwp: c.potencia_kwp ?? '', paneles_uds: c.paneles_uds ?? '', paneles_modelo: c.paneles_modelo ?? '', inversor_uds: c.inversor_uds ?? '',
          inversor_modelo: c.inversor_modelo ?? '', estructura: c.estructura ?? '', bateria: c.bateria ?? '', importe_total: c.importe_total ?? '',
          payment_plan: planPayload(this.plan), anio: String(new Date().getFullYear()), ...this.extras
        })
        descargarArchivo(blob, nombre)
        this.$emit('generado')
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    }
  }
}
</script>
