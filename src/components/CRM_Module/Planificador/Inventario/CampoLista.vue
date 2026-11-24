<template>
  <label class="lista-campo">
    <span>{{ etiqueta }}</span>
    <span class="lista-campo-fila">
      <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">{{ vacio }}</option>
        <option v-for="o in mostradas" :key="o" :value="o">{{ o }}</option>
      </select>
    </span>
  </label>
</template>

<script>
// Desplegable de una lista (marcas, proveedores): solo se elige de la lista; se crean en «Marcas y proveedores».
export default {
  name: 'Campo-Lista',
  props: {
    etiqueta: { type: String, required: true },
    modelValue: { type: String, default: '' },
    opciones: { type: Array, default: () => [] },
    vacio: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  computed: {
    mostradas() {
      const todas = [...new Set([...(this.modelValue ? [this.modelValue] : []), ...this.opciones])]
      return todas.sort((a, b) => a.localeCompare(b, 'es'))
    }
  }
}
</script>
