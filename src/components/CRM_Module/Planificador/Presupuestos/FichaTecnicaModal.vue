<template>
  <modal-component :ancho="true" :titulo="nombre" @cerrar="$emit('cerrar')">
    <div class="product-sheet">
      <div class="sheet-head">
        <span class="tag">{{ categoria ? categoria.label : producto.category }}</span>
        <span class="muted">{{ producto.supplier || 'Sin proveedor' }}</span>
        <strong v-if="producto.unit_price > 0" class="sheet-price">{{ eur(producto.unit_price) }} <span class="muted">/ {{ producto.unit }}</span></strong>
        <span v-else class="tag no-price sheet-price">⚠ Sin precio</span>
        <button type="button" class="icon-btn product-edit" title="Editar el producto en el inventario (precio, características…)" :aria-label="'Editar ' + nombre" @click="$emit('editar')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" /></svg>
        </button>
      </div>

      <dl v-if="propias.length > 0" class="sheet-data">
        <div v-for="fila in propias" :key="fila.etiqueta"><dt>{{ fila.etiqueta }}</dt><dd>{{ fila.valor }}</dd></div>
      </dl>
      <template v-if="grupos.length > 0">
        <h3>Características adicionales</h3>
        <div class="sheet-groups">
          <details v-for="(g, i) in grupos" :key="g.grupo" class="sheet-group" :open="i === 0">
            <summary>{{ g.grupo }} <span class="sheet-group-count">{{ g.filas.length }}</span></summary>
            <dl class="sheet-data">
              <div v-for="f in g.filas" :key="f.nombre"><dt>{{ f.nombre }}</dt><dd>{{ f.valor }}</dd></div>
            </dl>
          </details>
        </div>
      </template>
      <p v-if="propias.length === 0 && extras.length === 0" class="muted">Este producto aún no tiene características.</p>
      <p v-if="producto.notes" class="muted sheet-notes">{{ producto.notes }}</p>

      <template v-if="ofertas.length > 0">
        <h3>Proveedores y precios</h3>
        <p v-if="conPrecio.length > 1" class="muted sheet-offers-summary">
          {{ conPrecio.length }} precios distintos{{ masBarato !== null && masCaro !== null && masCaro > masBarato ? ': de ' + eur(masBarato) + ' a ' + eur(masCaro) + ' (' + eur(masCaro - masBarato) + ' de diferencia)' : ': todos iguales' }}
        </p>
        <ul class="sheet-offer-list">
          <li v-for="o in ofertas" :key="o.supplier" class="sheet-offer" :class="{ main: o.supplier === producto.supplier }">
            <div class="sheet-offer-name">
              <strong>{{ o.supplier }}</strong>
              <span v-if="o.supplier === producto.supplier" class="tag">★ precio del presupuestador</span>
              <span v-if="esMasBarato(o)" class="tag cheapest">más barato</span>
            </div>
            <div class="sheet-offer-price">
              <template v-if="o.price > 0"><strong>{{ eur(o.price) }}</strong> <span class="muted">/ {{ producto.unit }}</span></template>
              <span v-else class="tag no-price">sin precio</span>
            </div>
            <div v-if="conPrecio.length > 1 && o.price > 0 && masCaro !== null && masBarato !== null" class="sheet-offer-compare">
              <span class="sheet-offer-bar" aria-hidden="true"><span :class="{ cheap: esMasBarato(o) }" :style="{ width: Math.max(6, (o.price / masCaro) * 100) + '%' }" /></span>
              <span class="muted">{{ o.price === masBarato ? (masCaro === masBarato ? 'igual que los demás' : 'el más barato') : '+' + eur(o.price - masBarato) + ' sobre el más barato' }}</span>
            </div>
          </li>
        </ul>
      </template>
      <historial-precios-panel :id="producto.id" :unidad="producto.unit" :proveedor="producto.supplier" />

      <h3>Ficha técnica</h3>
      <template v-if="producto.datasheet">
        <p class="muted sheet-file">📄 {{ archivo }}</p>
        <iframe class="sheet-pdf" :title="'Ficha técnica de ' + nombre" :src="urlFicha" />
      </template>
      <p v-else class="muted">Este producto no tiene ficha técnica adjunta. Se adjunta desde el inventario.</p>
    </div>
    <template #pie>
      <a v-if="producto.datasheet" class="sheet-open" :href="urlFicha" target="_blank" rel="noreferrer">Abrir la ficha en otra pestaña ↗</a>
      <button type="button" @click="$emit('cerrar')">Cerrar</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import HistorialPreciosPanel from '../Inventario/HistorialPreciosPanel.vue'
import { planificadorApi } from '@/services/planificadorApi'
import { eur } from '@/utils/planificador/formato'
import { agruparFilas, esValorVacio, leerClaveExtra } from '@/utils/planificador/caracteristicas'
import { camposDe, unidadDe } from '@/utils/planificador/formularioEquipo'

// Ficha técnica de un producto del inventario: sus datos, sus características, sus proveedores y precios, el historial y, si tiene, el PDF de
// la ficha del fabricante a la vista. Se abre desde el nombre del producto en el presupuestador; el lápiz de la cabecera abre su edición.
export default {
  name: 'Ficha-Tecnica-Modal',
  components: { ModalComponent, HistorialPreciosPanel },
  props: { producto: { type: Object, required: true }, categoria: { type: Object, default: null } },
  emits: ['cerrar', 'editar'],
  computed: {
    nombre() { return [this.producto.brand, this.producto.model].filter(Boolean).join(' ') || 'Producto sin nombre' },
    urlFicha() { return planificadorApi.urlFicha(this.producto.id) },
    archivo() { return (this.producto.datasheet || '').split('/').pop() },
    // Las características de su categoría (con su etiqueta) y las que añadió alguien
    propias() {
      return camposDe(this.categoria).filter((f) => !esValorVacio(this.producto.attrs[f.key]))
        .map((f) => ({ etiqueta: f.label.replace(/\s*\(.+\)$/, ''), valor: this.producto.attrs[f.key] + unidadDe(f.label) }))
    },
    extras() {
      const conocidas = new Set(camposDe(this.categoria).map((f) => f.key))
      return Object.entries(this.producto.attrs).filter(([k, v]) => !conocidas.has(k) && !esValorVacio(v))
        .map(([clave, valor]) => ({ clave, ...leerClaveExtra(clave), valor: String(valor) }))
        // El nombre del PDF ya se ve en la sección de la ficha
        .filter((fila) => fila.nombre !== 'Ficha técnica')
    },
    grupos() { return agruparFilas(this.extras) },
    // Proveedores con su precio, del más barato al más caro (los que no tienen precio, al final)
    ofertas() {
      return [...(this.producto.offers || [])].sort((a, b) => (a.price > 0 ? a.price : Infinity) - (b.price > 0 ? b.price : Infinity))
    },
    conPrecio() { return this.ofertas.filter((o) => o.price > 0).map((o) => o.price) },
    masBarato() { return this.conPrecio.length > 0 ? Math.min(...this.conPrecio) : null },
    masCaro() { return this.conPrecio.length > 0 ? Math.max(...this.conPrecio) : null }
  },
  methods: {
    eur,
    esMasBarato(o) { return this.conPrecio.length > 1 && o.price > 0 && o.price === this.masBarato && this.masCaro !== this.masBarato }
  }
}
</script>
