<template>
  <div class="planificador-wrapper">
    <p v-if="estado === 'error'" class="error">No se pudo conectar con el servidor del Planificador.</p>

    <nav class="planificador-tabs" aria-label="Secciones del Planificador">
      <button v-for="s in SECCIONES" :key="s.clave" type="button" :class="{ active: seccion === s.clave }" :aria-pressed="seccion === s.clave" @click="irA(s.clave)">
        {{ s.etiqueta }}
      </button>
    </nav>

    <inventario-component v-if="seccion === 'inventario'" />
    <proyectos-component v-else-if="seccion === 'proyectos'" />
    <asistente-presupuesto-component v-else />
  </div>
</template>

<script>
import InventarioComponent from './Inventario/InventarioComponent.vue'
import AsistentePresupuestoComponent from './Presupuestos/AsistentePresupuestoComponent.vue'
import ProyectosComponent from './Proyectos/ProyectosComponent.vue'
import { planificadorApi } from '@/services/planificadorApi'

const SECCIONES = [
  { clave: 'proyectos', etiqueta: 'Proyectos' },
  { clave: 'presupuestos', etiqueta: 'Presupuestos' },
  { clave: 'inventario', etiqueta: 'Inventario' }
]

// Contenedor del Planificador: Presupuestos e Inventario. Proyectos, tareas y contratos se añaden en las siguientes fases.
export default {
  name: 'Planificador-Component',
  components: { InventarioComponent, AsistentePresupuestoComponent, ProyectosComponent },
  data() {
    return { SECCIONES, estado: 'cargando', seccion: 'proyectos' }
  },
  async mounted() {
    try {
      const r = await planificadorApi.salud()
      this.estado = r.status === 'ok' ? 'ok' : 'error'
    } catch (e) {
      this.estado = 'error'
    }
  },
  methods: {
    irA(clave) {
      this.seccion = clave
    }
  }
}
</script>

<style src="./PlanificadorComponent.css"></style>
