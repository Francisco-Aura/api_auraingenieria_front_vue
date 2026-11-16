<template>
  <span v-if="tipo === 'estado'" class="pill" :style="{ '--c': meta.color }">
    {{ meta.icon ? meta.icon + ' ' : '' }}{{ meta.label }}<span v-if="detalle" class="pill-detail"> · {{ detalle }}</span>
  </span>

  <span v-else-if="tipo === 'retraso' && retraso" class="retraso-insignia" :class="'level-' + retraso.level" :style="{ '--c': retraso.color }"
        :title="retraso.label + ' (gravedad ' + levelName(retraso.level) + '). Plazo previsto: ' + retraso.planned">⚠ +{{ retraso.days }} d</span>

  <span v-else-if="tipo === 'area' && partes.length > 0" class="insignia-grupo">
    <span v-for="p in partes" :key="p" class="badge" :style="{ '--c': departmentColor(p) }" :title="p">{{ p }}</span>
  </span>

  <component :is="alHacerClic ? 'button' : 'span'" v-else-if="tipo === 'fase'" class="fase-chip" :style="{ '--c': color }" :title="nombre" type="button" @click="$emit('clic')">{{ nombre.split('—')[0].trim() }}</component>

  <div v-else-if="tipo === 'progreso'" class="pbar" :style="color ? { '--c': color } : undefined" :aria-label="valor + '%'"><div class="pbar-fill" :style="{ width: valor + '%' }" /></div>
</template>

<script>
import { STATUS_META, departmentColor } from '@/utils/planificador/tareas/colores'
import { levelName } from '@/utils/planificador/tareas/retraso'

// Etiquetas pequeñas de las tareas: estado, retraso, área, fase y barra de progreso (Chips.tsx del Planificador actual).
export default {
  name: 'Insignia-Tarea',
  props: {
    tipo: { type: String, required: true },
    estado: { type: String, default: 'todo' },
    detalle: { type: String, default: '' },
    retraso: { type: Object, default: null },
    nombre: { type: String, default: '' },
    color: { type: String, default: '' },
    valor: { type: Number, default: 0 },
    alHacerClic: { type: Boolean, default: false }
  },
  emits: ['clic'],
  computed: {
    meta() { return STATUS_META[this.estado] },
    // «ADMINISTRACIÓN/COORDINACIÓN» son dos áreas: se muestran como dos etiquetas, cada una con su color
    partes() { return this.nombre.split('/').map((p) => p.trim()).filter(Boolean) }
  },
  methods: { levelName, departmentColor }
}
</script>
