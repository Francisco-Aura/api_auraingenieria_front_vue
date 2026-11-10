<template>
  <ul v-if="visible" class="checks" aria-label="Comprobaciones automáticas">
    <li v-for="c in comprobaciones" :key="c.text" :class="c.level"><span class="check-icon">{{ c.level === 'ok' ? '✓' : c.level === 'warn' ? '⚠' : 'ℹ' }}</span>{{ c.text }}</li>
  </ul>
</template>

<script>
import { checkContract } from '@/utils/planificador/motor/reglasContrato'

// Comprobaciones automáticas de los datos tecleados: se actualizan al escribir.
export default {
  name: 'Comprobaciones-Contrato',
  props: {
    valores: { type: Object, required: true },
    reparto: { type: Array, default: undefined }
  },
  computed: {
    comprobaciones() { return checkContract(this.valores, this.reparto) },
    conDatos() { return Object.values(this.valores).some((v) => String(v).trim() !== '') },
    visible() { return this.conDatos || this.comprobaciones.length > 1 }
  }
}
</script>
