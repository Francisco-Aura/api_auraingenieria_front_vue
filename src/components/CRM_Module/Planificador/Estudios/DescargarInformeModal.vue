<template>
  <modal-component titulo="Descargar el informe" ancho @cerrar="$emit('cerrar')">
    <div class="informe-resumen">
      <span>{{ seleccionados }} de {{ total }} módulos</span>
      <span class="informe-acciones-todo">
        <button type="button" class="enlace-boton" @click="marcarTodo(true)">Todos</button>
        <button type="button" class="enlace-boton" @click="marcarTodo(false)">Ninguno</button>
      </span>
    </div>

    <ol class="informe-categorias">
      <li v-for="(c, i) in orden" :key="c.id" class="informe-categoria" :class="{ sobre: sobre(orden, i) }"
          @dragover="permitir($event, orden)" @dragenter="entrar(orden, i)" @drop.stop="soltar($event, orden, i)">
        <div class="informe-cabecera" draggable="true" @dragstart="empezar($event, orden, i)" @dragend="terminar">
          <span class="informe-asa" aria-hidden="true">⠿</span>
          <label class="informe-check">
            <input type="checkbox" :checked="estadoCategoria(c) === 'todos'" :indeterminate.prop="estadoCategoria(c) === 'algunos'" @change="marcarCategoria(c, $event.target.checked)">
            <strong>{{ c.nombre }}</strong>
          </label>
        </div>
        <ul class="informe-modulos">
          <li v-for="(m, k) in c.modulos" :key="m.id" :class="{ apagado: !m.activo, sobre: sobre(c.modulos, k) }" draggable="true"
              @dragstart.stop="empezar($event, c.modulos, k)" @dragend="terminar"
              @dragover="permitir($event, c.modulos)" @dragenter="entrar(c.modulos, k)" @drop.stop="soltar($event, c.modulos, k)">
            <span class="informe-asa" aria-hidden="true">⠿</span>
            <label class="informe-check">
              <input v-model="m.activo" type="checkbox">
              <span>{{ m.nombre }}</span>
              <small v-if="m.tipo === 'tabla'">tabla</small>
              <small v-else-if="m.tipo === 'texto' && m.sugerida">sugerida</small>
            </label>
          </li>
        </ul>
      </li>
    </ol>

    <template #pie>
      <button type="button" class="secondary" :disabled="ocupado" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="secondary" :disabled="ocupado" @click="descargar('html')">HTML</button>
      <button type="button" :disabled="ocupado" @click="descargar('pdf')">{{ ocupado ? 'Preparando…' : 'Descargar PDF' }}</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { guardarPreferencias, ordenInicial } from '@/utils/planificador/informePersonalizado'

// Elegir qué módulos lleva el informe (gráfica + explicación) y en qué orden. Las categorías van juntas: se ordenan como bloques.
export default {
  name: 'Descargar-Informe-Modal',
  components: { ModalComponent },
  props: { categorias: { type: Array, required: true }, ocupado: { type: Boolean, default: false } },
  emits: ['cerrar', 'descargar'],
  data() { return { orden: ordenInicial(this.categorias), arrastre: null, destino: null } },
  computed: {
    total() { return this.orden.reduce((a, c) => a + c.modulos.length, 0) },
    seleccionados() { return this.orden.reduce((a, c) => a + c.modulos.filter((m) => m.activo).length, 0) }
  },
  watch: {
    // Lo elegido se recuerda para la próxima vez, aunque se cierre sin descargar
    orden: { deep: true, handler(o) { guardarPreferencias(o) } }
  },
  methods: {
    // Arrastrar: solo se reordena dentro de la misma lista (categorías entre sí, módulos dentro de su categoría)
    empezar(e, lista, i) {
      this.arrastre = { lista, i }
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(i))
    },
    permitir(e, lista) { if (this.arrastre && this.arrastre.lista === lista) { e.preventDefault(); e.stopPropagation() } },
    entrar(lista, i) { if (this.arrastre && this.arrastre.lista === lista) this.destino = { lista, i } },
    sobre(lista, i) {
      return !!(this.arrastre && this.destino && this.destino.lista === lista && this.destino.i === i && this.arrastre.i !== i)
    },
    soltar(e, lista, j) {
      if (!this.arrastre || this.arrastre.lista !== lista) return
      e.preventDefault()
      const i = this.arrastre.i
      if (i !== j) lista.splice(j, 0, lista.splice(i, 1)[0])
      this.terminar()
    },
    terminar() { this.arrastre = null; this.destino = null },
    estadoCategoria(c) {
      const n = c.modulos.filter((m) => m.activo).length
      return n === 0 ? 'ninguno' : n === c.modulos.length ? 'todos' : 'algunos'
    },
    marcarCategoria(c, valor) { c.modulos.forEach((m) => { m.activo = valor }) },
    marcarTodo(valor) { this.orden.forEach((c) => this.marcarCategoria(c, valor)) },
    descargar(formato) { this.$emit('descargar', { formato, orden: this.orden }) }
  }
}
</script>
