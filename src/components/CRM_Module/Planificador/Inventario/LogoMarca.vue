<template>
  <span class="marca-logo" :style="{ height: tamano + 'px', minWidth: tamano + 'px' }" :title="nombre">
    <img v-if="tieneLogo" :src="url" :alt="'Logo de ' + nombre">
    <span v-else aria-hidden="true">{{ nombre.charAt(0) }}</span>
  </span>
</template>

<script>
import { planificadorApi } from '@/services/planificadorApi'

// Logo de una marca sobre una pastilla clara (se ve igual en claro y en oscuro); sin logo, su inicial.
export default {
  name: 'Logo-Marca',
  props: {
    nombre: { type: String, required: true },
    tieneLogo: { type: Boolean, default: false },
    version: { type: Number, default: 0 },
    tamano: { type: Number, default: 28 }
  },
  computed: {
    url() { return planificadorApi.urlLogoMarca(this.nombre, this.version) }
  }
}
</script>
