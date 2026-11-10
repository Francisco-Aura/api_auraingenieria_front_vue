<template>
  <span v-if="t.tipo === 'hueco'" class="rt-blank" title="Por rellenar" />
  <span v-else-if="t.tipo === 'marca'" class="rt-chip">{{ t.texto }}</span>
  <a v-else-if="t.tipo === 'enlace'" :href="t.texto" target="_blank" rel="noreferrer">{{ t.texto }}</a>
  <template v-else>{{ t.texto }}</template>
</template>

<script>
// Un trozo de texto en línea: texto, hueco para rellenar (___), marcador [así] o enlace
export default {
  name: 'Trozo-Texto',
  props: { t: { type: Object, required: true } }
}
</script>
