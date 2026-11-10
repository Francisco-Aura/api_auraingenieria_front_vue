<template>
  <span v-if="etiqueta" class="prot-badge" :class="'tone-' + tono" title="Tipo y elemento de la protección">
    <svg v-if="trazos" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" v-html="trazos" />
    {{ etiqueta }}
  </span>
</template>

<script>
// Etiqueta con símbolo y texto del elemento de una protección, coloreada por su tipo (CC, AC…).
const TRAZOS = {
  Fusible: '<rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M7 12h10"/>',
  Portafusibles: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 12h8M12 6v12"/>',
  'Fusible con portafusibles': '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M7 12h10"/>',
  Seccionador: '<path d="M4 17h5M15 17h5M9 17l6-9M12 5v3"/>',
  DPS: '<path d="M13 3L6 13h5l-1 8 7-10h-5l1-8z"/>',
  Magnetotérmico: '<path d="M4 12h4l2-5 4 10 2-5h4"/>',
  Diferencial: '<circle cx="12" cy="12" r="7"/><path d="M12 8v8M9 12h6"/>',
  'Relé diferencial': '<circle cx="9" cy="12" r="5"/><path d="M14 12h7M17 9v6"/>',
  Cuadro: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h8"/>',
  Transformador: '<circle cx="9" cy="12" r="4.5"/><circle cx="15" cy="12" r="4.5"/>',
  Conjunto: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/>'
}
const TONOS = { CC: 'cc', AC: 'ac', Cuadro: 'panel', Transformador: 'trafo' }

export default {
  name: 'Insignia-Proteccion',
  props: { producto: { type: Object, required: true } },
  computed: {
    tipo() { return String((this.producto.attrs || {}).tipo ?? '').trim() },
    elemento() { return String((this.producto.attrs || {}).elemento ?? '').trim() },
    etiqueta() {
      if (this.producto.category !== 'protecciones') return ''
      return [this.tipo, this.elemento].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ')
    },
    tono() { return TONOS[this.tipo] || 'none' },
    trazos() { return TRAZOS[this.elemento] || TRAZOS[this.tipo] || '' }
  }
}
</script>
