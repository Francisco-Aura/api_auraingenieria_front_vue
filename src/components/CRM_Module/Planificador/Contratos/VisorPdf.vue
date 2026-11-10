<template>
  <aside class="scan" :style="altura ? { height: altura + 'px' } : undefined">
    <header class="scan-head">
      <strong :title="archivo.name">{{ archivo.name }}</strong>
      <div class="scan-tools">
        <a :href="url" target="_blank" rel="noreferrer" title="Abrir en una pestaña nueva">↗</a>
        <button type="button" title="Quitar el documento" @click="$emit('cerrar')">×</button>
      </div>
    </header>

    <div class="scan-body">
      <iframe :src="url" :title="'Presupuesto: ' + archivo.name" />
    </div>
  </aside>
</template>

<script>
export const esPdf = (archivo) => archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name)

// Muestra el presupuesto (PDF) junto al formulario, para ver de dónde salen los datos.
export default {
  name: 'Visor-Pdf',
  props: {
    archivo: { type: File, required: true },
    // Altura fija en px (en ventanas emergentes); sin ella, ocupa la altura disponible de la pantalla
    altura: { type: Number, default: 0 }
  },
  emits: ['cerrar'],
  data() { return { url: URL.createObjectURL(this.archivo) } },
  watch: {
    archivo(nuevo) { URL.revokeObjectURL(this.url); this.url = URL.createObjectURL(nuevo) }
  },
  beforeUnmount() { URL.revokeObjectURL(this.url) }
}
</script>
