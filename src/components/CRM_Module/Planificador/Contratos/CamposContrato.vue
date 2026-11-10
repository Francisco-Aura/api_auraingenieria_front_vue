<template>
  <div class="form-grid">
    <label v-for="f in campos" :key="f.key" :class="{ 'from-contract': resaltar.includes(f.key) }">
      {{ f.label }}
      <input :class="{ 'required-empty': invalidos.includes(f.key) && !String(valores[f.key] ?? '').trim() }" :type="f.type !== 'text' ? 'number' : 'text'" :inputmode="f.type !== 'text' ? 'decimal' : undefined" :step="f.type === 'int' ? 1 : 'any'" :min="f.type !== 'text' ? 0 : undefined"
             :value="valores[f.key] ?? ''" @input="$emit('update:valores', { ...valores, [f.key]: $event.target.value })">
    </label>
  </div>
</template>

<script>
// Cuadro de datos del contrato inicial de referencia: importe, equipos principales y potencia (todo texto, el servidor lo normaliza).
export default {
  name: 'Campos-Contrato',
  props: {
    campos: { type: Array, required: true },
    valores: { type: Object, required: true },
    // Claves rellenadas a partir del presupuesto subido (se resaltan hasta que se editan)
    resaltar: { type: Array, default: () => [] },
    // Claves que se marcan en rojo mientras sigan vacías (p. ej. tras intentar generar el contrato)
    invalidos: { type: Array, default: () => [] }
  },
  emits: ['update:valores']
}
</script>
