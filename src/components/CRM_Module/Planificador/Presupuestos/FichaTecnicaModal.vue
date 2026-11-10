<template>
  <modal-component :ancho="true" :titulo="nombre" @cerrar="$emit('cerrar')">
    <div class="product-sheet">
      <p class="muted">
        {{ categoria ? categoria.label : producto.category }}{{ producto.supplier ? ' · ' + producto.supplier : '' }}
        <template v-if="producto.unit_price > 0"> · {{ eur(producto.unit_price) }} / {{ producto.unit }}</template>
        <template v-if="producto.stock > 0"> · {{ producto.stock }} en stock</template>
      </p>
      <p v-if="producto.notes">{{ producto.notes }}</p>
      <p v-if="producto.datasheet" class="inv-sheet-file">📄 <a :href="urlFicha" target="_blank" rel="noreferrer">{{ producto.datasheet.split('/').pop() }}</a></p>
      <table v-if="datos.length > 0" class="spec-table">
        <caption>Características</caption>
        <tbody><tr v-for="d in datos" :key="d.etiqueta"><th>{{ d.etiqueta }}</th><td>{{ d.valor }}</td></tr></tbody>
      </table>
      <template v-for="g in extras" :key="g.grupo">
        <table class="spec-table">
          <caption>{{ g.grupo }}</caption>
          <tbody><tr v-for="f in g.filas" :key="f.clave"><th>{{ f.nombre }}</th><td>{{ f.valor }}</td></tr></tbody>
        </table>
      </template>
      <p v-if="datos.length === 0 && extras.length === 0" class="muted">Este producto aún no tiene características en el inventario.</p>
    </div>
    <template #pie><button type="button" class="secondary" @click="$emit('cerrar')">Cerrar</button></template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { planificadorApi } from '@/services/planificadorApi'
import { eur, nombreProducto } from '@/utils/planificador/formato'
import { agruparFilas, esValorVacio, leerClaveExtra } from '@/utils/planificador/caracteristicas'
import { camposDe, unidadDe } from '@/utils/planificador/formularioEquipo'

// Ficha de un producto del inventario, solo para mirarla desde el presupuesto (se edita en el Inventario).
export default {
  name: 'Ficha-Tecnica-Modal',
  components: { ModalComponent },
  props: { producto: { type: Object, required: true }, categoria: { type: Object, default: null } },
  emits: ['cerrar'],
  computed: {
    nombre() { return nombreProducto(this.producto) },
    urlFicha() { return planificadorApi.urlFicha(this.producto.id) },
    datos() {
      return camposDe(this.categoria).filter((f) => !esValorVacio(this.producto.attrs[f.key]))
        .map((f) => ({ etiqueta: f.label.replace(/\s*\(.+\)$/, ''), valor: this.producto.attrs[f.key] + unidadDe(f.label) }))
    },
    extras() {
      const conocidas = new Set(camposDe(this.categoria).map((f) => f.key))
      const filas = Object.entries(this.producto.attrs).filter(([k, v]) => !conocidas.has(k) && !esValorVacio(v))
        .map(([clave, valor]) => ({ clave, ...leerClaveExtra(clave), valor: String(valor) }))
      return agruparFilas(filas)
    }
  },
  methods: { eur }
}
</script>
