<template>
  <nav class="pestanas-propuesta" role="tablist" aria-label="Estudio y presupuesto de la propuesta">
    <button v-for="p in pestanas" :key="p.id" type="button" role="tab" class="pestana" :class="{ activa: activa === p.id }" :aria-selected="activa === p.id"
            :disabled="activa !== p.id && !p.hay" :title="activa !== p.id && !p.hay ? p.vacio : ''" @click="activa !== p.id && $emit('ir', p.id)">
      <span>{{ p.nombre }}</span>
      <span v-if="p.estado" class="tag state" :class="p.clase">{{ p.estado }}</span>
    </button>
  </nav>
</template>

<script>
// Las dos caras de una propuesta, estudio y presupuesto, como pestañas de la misma pantalla. Cada una lleva su estado; la que no
// existe todavía sale apagada (se crea desde la propia pantalla).
export default {
  name: 'Pestanas-Propuesta',
  props: {
    activa: { type: String, required: true },
    estudio: { type: Object, default: () => ({ hay: false, estado: '', clase: '' }) },
    presupuesto: { type: Object, default: () => ({ hay: false, estado: '', clase: '' }) }
  },
  emits: ['ir'],
  computed: {
    pestanas() {
      return [
        { id: 'estudio', nombre: 'Estudio', vacio: 'Todavía no hay estudio asociado', ...this.estudio },
        { id: 'presupuesto', nombre: 'Presupuesto', vacio: 'Todavía no hay presupuesto asociado', ...this.presupuesto }
      ]
    }
  }
}
</script>

<style scoped>
.pestanas-propuesta { display: flex; gap: 4px; border-bottom: 1px solid var(--borde, #d9dee5); margin: 0 0 14px; }
.pestana { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; border-bottom: 3px solid transparent; border-radius: 0; padding: 8px 14px; color: inherit; font: inherit; cursor: pointer; }
.pestana.activa { border-bottom-color: var(--color-primario, #1b6ca8); font-weight: 600; cursor: default; }
.pestana:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
