<template>
  <tr :class="tono || undefined">
    <td>
      <button type="button" class="product-link" title="Ver la ficha técnica" @click="$emit('ficha', item)">{{ [item.brand, item.model].filter(Boolean).join(' ') }}</button>
      <button type="button" class="icon-btn product-edit" title="Editar el producto en el inventario (precio, características…)" :aria-label="'Editar ' + [item.brand, item.model].filter(Boolean).join(' ')" @click="$emit('editar', item)">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" /></svg>
      </button>
      <span v-if="sugerencia" class="tag stock" :class="sugerencia.inStock ? 'in' : 'out'">{{ sugerencia.inStock ? 'En stock: ' + item.stock : item.stock > 0 ? 'Stock: ' + item.stock + ' de ' + (sugerencia.units ?? 1) : 'Sin stock' }}</span>
      <span v-if="sugerencia && (sugerencia.units ?? 1) > 1" class="tag state borrador" title="Unidades que hacen falta para las entradas de tus strings: se añaden solas">× {{ sugerencia.units }} uds.</span>
      <span v-if="item.datasheet" class="tag" title="Tiene la ficha técnica del fabricante adjunta">📄 Ficha</span>
      <span v-if="insignia" class="tag compat" :class="insignia.kind" :title="insignia.title">{{ insignia.text }}</span>
      <span v-if="conflicto" class="tag issue bad" title="No casa con lo que has elegido">⛔ Incompatible</span>
      <span v-if="avisos.length > 0" class="tag issue" :class="peor === 'error' ? 'bad' : 'warn'" title="Este producto tiene avisos de compatibilidad con lo elegido en el presupuesto">{{ peor === 'error' ? '⛔ Incompatible' : '⚠ Revisar' }}</span>
    </td>
    <td v-for="f in columnas" :key="f.key">
      <span v-if="!esVacio(item.attrs[f.key])" class="tag attr">{{ item.attrs[f.key] }}{{ unidad(f.label) }}</span>
      <span v-else class="muted">—</span>
    </td>
    <td><template v-if="item.supplier">{{ item.supplier }}</template><span v-else class="muted">—</span></td>
    <td class="num">
      <template v-if="item.unit_price > 0">{{ eur(item.unit_price) }}<span class="muted"> / {{ item.unit }}</span></template>
      <span v-else class="tag no-price" title="Este producto no tiene precio todavía: complétalo en el inventario">⚠ Sin precio</span>
    </td>
    <td class="num act">
      <button v-if="anadido" type="button" class="secondary" @click="$emit('quitar', item.id)">Quitar</button>
      <button v-else type="button" @click="$emit('anadir', item)">Añadir</button>
    </td>
  </tr>
  <!-- Por qué encaja, características y notas: a todo el ancho, no apretadas en la columna del nombre -->
  <tr v-if="sugerencia || espec || item.notes" class="detail-row" :class="tono">
    <td :colspan="numColumnas">
      <div v-if="sugerencia" class="muted note suggested-why">Encaja: {{ sugerencia.reasons.join(' · ') }}</div>
      <div v-if="espec" class="muted note">{{ espec }}</div>
      <div v-if="item.notes" class="muted note">{{ item.notes }}</div>
    </td>
  </tr>
  <tr v-if="avisos.length > 0 || conflicto" class="issue-row" :class="tono">
    <td :colspan="numColumnas">
      <div v-for="i in avisos" :key="i.id" class="item-issue" :class="levelClass(i.level)" role="alert">{{ i.message }}</div>
      <div v-for="m in conflicto || []" :key="m" class="item-issue bad">{{ m }}</div>
    </td>
  </tr>
</template>

<script>
import { eur } from '@/utils/planificador/formato'
import { levelClass } from '@/utils/planificador/motor/compatibilidad'
import { unidadDe } from '@/utils/planificador/formularioEquipo'

// Una fila del catálogo de un paso: el producto, sus características, su precio y «Añadir» o «Quitar», con sus avisos debajo.
export default {
  name: 'Fila-Producto',
  props: {
    item: { type: Object, required: true },
    sugerencia: { type: Object, default: null },
    columnas: { type: Array, default: () => [] },
    numColumnas: { type: Number, default: 4 },
    anadido: { type: Boolean, default: false },
    insignia: { type: Object, default: null },
    avisos: { type: Array, default: () => [] },
    conflicto: { type: Array, default: undefined },
    espec: { type: String, default: '' },
    esVacio: { type: Function, required: true }
  },
  emits: ['anadir', 'quitar', 'ficha', 'editar'],
  computed: {
    // Las filas de detalle y de aviso de un producto comparten el fondo de su fila (añadido o sugerido): se ven como un solo bloque
    tono() { return this.anadido ? 'added' : this.sugerencia ? 'suggested-row' : '' },
    peor() { return this.avisos.some((i) => i.level === 'error') ? 'error' : 'warn' }
  },
  methods: { eur, levelClass, unidad: unidadDe }
}
</script>
