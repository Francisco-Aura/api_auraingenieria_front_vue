<template>
  <div class="modal-backdrop" @mousedown.self="$emit('cerrar')">
    <div class="modal" :class="{ wide: ancho }" role="dialog" aria-modal="true">
      <header class="modal-head">
        <h2>{{ titulo }}</h2>
        <button type="button" class="modal-close" aria-label="Cerrar" @click="$emit('cerrar')">×</button>
      </header>
      <div class="modal-body"><slot /></div>
      <footer v-if="$slots.pie" class="modal-foot"><slot name="pie" /></footer>
    </div>
  </div>
</template>

<script>
import { bloquearScroll, liberarScroll } from '@/utils/planificador/bloqueoScroll'

export default {
  name: 'Modal-Component',
  props: { titulo: { type: String, default: '' }, ancho: { type: Boolean, default: false } },
  emits: ['cerrar'],
  mounted() {
    bloquearScroll()
    this.alPulsarTecla = (e) => { if (e.key === 'Escape') this.$emit('cerrar') }
    window.addEventListener('keydown', this.alPulsarTecla)
  },
  beforeUnmount() {
    liberarScroll()
    window.removeEventListener('keydown', this.alPulsarTecla)
  }
}
</script>
