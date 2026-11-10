<template>
  <planificador-component />
</template>

<script>
import PlanificadorComponent from '@/components/CRM_Module/Planificador/PlanificadorComponent.vue'

// El Planificador es una sola pantalla (con su inicio y sus áreas): no hace falta enrutador, y así no choca con el historial que usa el
// botón Atrás para ir entre el presupuestador, el inventario y el inicio.
export default {
  name: 'App',
  components: { PlanificadorComponent }
}
</script>
