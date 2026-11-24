<template>
  <div class="rt">
    <template v-for="(b, i) in bloques" :key="i">
      <h3 v-if="b.tipo === 'titulo'"><template v-for="(t, j) in b.trozos" :key="j"><trozo :t="t" /></template></h3>
      <ul v-else-if="b.tipo === 'lista'" class="rt-lista">
        <li v-for="(it, k) in b.elementos" :key="k">
          <span class="rt-marker">{{ it.marcador }}</span>
          <span><strong v-if="it.etiqueta">{{ it.etiqueta }}:</strong>{{ it.etiqueta ? ' ' : '' }}<template v-for="(t, j) in it.trozos" :key="j"><trozo :t="t" /></template></span>
        </li>
      </ul>
      <p v-else-if="b.tipo === 'aviso'" class="rt-callout" :class="b.tono">
        <span class="rt-icon">{{ b.icono }}</span>
        <span><strong v-if="b.etiqueta">{{ b.etiqueta }}:</strong>{{ b.etiqueta ? ' ' : '' }}<template v-for="(t, j) in b.trozos" :key="j"><trozo :t="t" /></template></span>
      </p>
      <p v-else-if="b.tipo === 'paso'" class="rt-paso">
        <span class="rt-num">{{ b.numero }}</span>
        <span><strong v-if="b.etiqueta">{{ b.etiqueta }}:</strong>{{ b.etiqueta ? ' ' : '' }}<template v-for="(t, j) in b.trozos" :key="j"><trozo :t="t" /></template></span>
      </p>
      <p v-else :class="{ 'rt-nota': b.nota }"><strong v-if="b.etiqueta">{{ b.etiqueta }}:</strong>{{ b.etiqueta ? ' ' : '' }}<template v-for="(t, j) in b.trozos" :key="j"><trozo :t="t" /></template></p>
    </template>
  </div>
</template>

<script>
import TrozoTexto from './TrozoTexto.vue'
import { bloquesDeTexto } from '@/utils/planificador/textoConFormato'

// Los textos de las guías vienen en texto plano con marcas sencillas; aquí se enseñan con formato, sin cambiar el texto guardado
export default {
  name: 'Texto-Con-Formato',
  components: { Trozo: TrozoTexto },
  props: { texto: { type: String, default: '' } },
  computed: { bloques() { return bloquesDeTexto(this.texto) } }
}
</script>
