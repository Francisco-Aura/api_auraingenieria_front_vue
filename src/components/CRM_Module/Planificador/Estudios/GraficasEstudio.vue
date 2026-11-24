<template>
  <div class="estudio-graficas">
    <div class="estudio-pestanas" role="tablist">
      <button v-for="p in pestanas" :key="p.id" type="button" role="tab" :aria-selected="actual.id === p.id" :class="{ on: actual.id === p.id }" @click="pestana = p.id">{{ p.nombre }}</button>
    </div>

    <div v-if="actual.kpis && actual.kpis.length" class="estudio-mini-kpis">
      <div v-for="k in actual.kpis" :key="k.texto"><b>{{ k.valor }}</b><span>{{ k.texto }}</span></div>
    </div>

    <div v-for="(bloque, i) in actual.bloques" :key="actual.id + i" class="grafica-bloque" :class="{ doble: bloque.length > 1 }">
      <grafica-svg v-for="(spec, k) in bloque" :key="k" :spec="spec" :ancho="bloque.length > 1 ? ANCHO_PAREJA : ANCHO_SUELTA" :alto="bloque.length > 1 ? 290 : 300" />
    </div>
  </div>
</template>

<script>
import GraficaSvg from './GraficaSvg.vue'
import { ANCHO_PAREJA, ANCHO_SUELTA, construirCategorias } from '@/utils/planificador/graficasEstudio'

// Las gráficas del resultado, dibujadas aquí con los datos que calcula el servidor: se ven y se recalculan con el estudio.
// Qué gráficas hay y cómo se arman está en utils/planificador/graficasEstudio.js (lo comparte la descarga del informe).
export default {
  name: 'Graficas-Estudio',
  components: { GraficaSvg },
  props: { resultado: { type: Object, required: true } },
  data() { return { pestana: 'consumo', ANCHO_SUELTA, ANCHO_PAREJA } },
  computed: {
    /** Una pestaña por categoría; las gráficas marcadas como «par» van de dos en dos, y las tablas solo existen en el informe. */
    pestanas() {
      return construirCategorias(this.resultado).map((c) => {
        const bloques = []
        let anteriorPar = false
        for (const m of c.modulos) {
          if (m.tipo !== 'grafica') continue
          if (m.par && anteriorPar) bloques[bloques.length - 1].push(...m.specs)
          else bloques.push([...m.specs])
          anteriorPar = !!m.par
        }
        return { id: c.id, nombre: c.nombre, kpis: c.kpis, bloques }
      }).filter((c) => c.bloques.length)
    },
    actual() { return this.pestanas.find((p) => p.id === this.pestana) || this.pestanas[0] }
  }
}
</script>
