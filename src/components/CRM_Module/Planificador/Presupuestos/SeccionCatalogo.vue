<template>
  <section v-if="categoria" class="step-section" :class="{ titled: !!seccion.title }" :id="'seccion-' + seccion.id" :aria-label="seccion.title || categoria.label">
    <h3 v-if="seccion.title">{{ seccion.title }}</h3>
    <div class="cost-filters" role="search">
      <label class="search">
        Buscar
        <input v-model="filtros.q" type="search" :placeholder="'En ' + (seccion.title || categoria.label).toLowerCase() + '…'">
      </label>
      <template v-for="f in definiciones" :key="f.key">
        <label v-if="f.opciones.length > 1">
          {{ f.label }}
          <select v-model="filtros[f.key]"><option value="">Todos</option><option v-for="o in f.opciones" :key="o" :value="o">{{ o }}</option></select>
        </label>
      </template>
      <button v-if="hayFiltros" type="button" class="link-btn clear" @click="filtros = {}">Quitar filtros</button>
    </div>

    <label v-if="filtroDefecto" class="switch">
      <input v-model="verTodo" type="checkbox"><span class="switch-track" aria-hidden="true" />
      Ver también lo que no es para {{ filtroDefecto.label }}
    </label>

    <p class="muted result-count" aria-live="polite">
      {{ mostrados.length }} de {{ enCategoria.length }}{{ filtroDefecto && !verTodo ? ' · filtrado para ' + filtroDefecto.label : '' }}{{ filasSugeridas.length > 0 ? ' · ' + filasSugeridas.length + ' sugerido' + (filasSugeridas.length === 1 ? '' : 's') : '' }}{{ incompatibles.length > 0 ? ' · ' + incompatibles.length + ' incompatible' + (incompatibles.length === 1 ? '' : 's') + ' con lo elegido, al final' : '' }}
    </p>

    <p v-if="mostrados.length === 0 && incompatibles.length === 0" class="muted empty">Ningún equipo cumple los filtros.</p>
    <div v-else class="cost-table-wrap">
      <table class="cost-table">
        <thead>
          <tr>
            <th v-for="c in columnasCabecera" :key="c.clave" :class="c.clase" :aria-sort="ariaOrden(c.clave)">
              <button type="button" class="sort-btn" :class="{ on: orden && orden.key === c.clave }" title="Ordenar por esta columna" @click="orden = nextSort(orden, c.clave)">
                {{ c.etiqueta }}<span class="sort-icon" aria-hidden="true">{{ iconoOrden(c.clave) }}</span>
              </button>
            </th>
            <th class="act" />
          </tr>
        </thead>
        <tbody>
          <template v-if="filasSugeridas.length > 0">
            <tr class="group-row suggested-head">
              <th :colspan="numColumnas" scope="colgroup"><span aria-hidden="true">★</span> Sugeridos<span class="muted"> · encajan con lo elegido{{ filasSugeridas.some((s) => s.inStock) ? ' y los que hay en stock van primero' : '' }}</span></th>
            </tr>
            <fila-producto v-for="s in filasSugeridas" :key="'s' + s.item.id" v-bind="propsFila(s.item, s)" @anadir="$emit('anadir', $event)" @quitar="$emit('quitar', $event)" @ficha="$emit('ficha', $event)" />
          </template>
          <template v-if="restantes.length > 0">
            <tr v-if="filasSugeridas.length > 0 || incompatibles.length > 0" class="group-row"><th :colspan="numColumnas" scope="colgroup">Compatibles</th></tr>
            <fila-producto v-for="i in restantes" :key="i.id" v-bind="propsFila(i, null)" @anadir="$emit('anadir', $event)" @quitar="$emit('quitar', $event)" @ficha="$emit('ficha', $event)" />
          </template>
          <template v-if="incompatibles.length > 0">
            <tr class="group-row incompatible-head">
              <th :colspan="numColumnas" scope="colgroup">
                <button type="button" class="link-btn" :aria-expanded="incompatiblesAbiertos" @click="verIncompatibles = !incompatiblesAbiertos">
                  <span aria-hidden="true">{{ incompatiblesAbiertos ? '▾' : '▸' }} ⛔</span> Incompatibles con lo que ya has elegido ({{ incompatibles.length }})
                </button>
              </th>
            </tr>
            <template v-if="incompatiblesAbiertos">
              <fila-producto v-for="i in incompatibles" :key="'x' + i.id" v-bind="propsFila(i, null)" @anadir="$emit('anadir', $event)" @quitar="$emit('quitar', $event)" @ficha="$emit('ficha', $event)" />
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script>
import FilaProducto from './FilaProducto.vue'
import { nextSort, sortRows } from '@/utils/planificador/orden'
import { valoresDistintos } from '@/utils/planificador/formato'
import { esValorVacio } from '@/utils/planificador/caracteristicas'
import { esDeSeccion, insigniaBateria, lineaEspec } from '@/utils/planificador/pasos'

// Un trozo del catálogo dentro de un paso: buscador, filtros y la tabla de equipos con «Añadir». Arriba los sugeridos (con el
// stock primero), luego los compatibles y, al final, lo incompatible con lo ya elegido (plegado salvo que sea lo único).
export default {
  name: 'Seccion-Catalogo',
  components: { FilaProducto },
  props: {
    seccion: { type: Object, required: true },
    catalogo: { type: Object, required: true },
    estado: { type: Object, required: true },
    // Filtro por defecto según lo elegido antes: { label, test }
    filtroDefecto: { type: Object, default: null },
    // Inversor elegido (solo para la etiqueta «Compatible» de las baterías)
    inversor: { type: Object, default: null },
    // Avisos de compatibilidad de lo ya elegido, por producto (Map)
    avisos: { type: Map, default: () => new Map() },
    // Productos que no casan con lo elegido, con el motivo (Map)
    conflictos: { type: Map, default: () => new Map() },
    sugeridos: { type: Array, default: () => [] }
  },
  emits: ['anadir', 'quitar', 'ficha'],
  data() { return { filtros: {}, orden: null, verTodo: false, verIncompatibles: false } },
  computed: {
    categoria() { return this.catalogo.categories.find((c) => c.key === this.seccion.category) },
    enCategoria() { return this.catalogo.items.filter((i) => esDeSeccion(i, this.seccion)) },
    porFiltro() { return this.filtroDefecto && !this.verTodo ? this.enCategoria.filter(this.filtroDefecto.test) : this.enCategoria },
    // Lo incompatible con lo ya elegido va aparte, al final; lo que ya está añadido se enseña siempre arriba
    todosIncompatibles() { return this.porFiltro.filter((i) => this.conflictos.has(i.id) && !this.estado.lines.some((l) => l.itemId === i.id)) },
    base() { return this.porFiltro.filter((i) => !this.todosIncompatibles.includes(i)) },
    definiciones() {
      const campos = [
        { key: 'brand', label: 'Marca', leer: (i) => i.brand },
        ...this.categoria.filters.filter((f) => !(this.seccion.fixed && f.key in this.seccion.fixed)).map((f) => ({ key: 'attr:' + f.key, label: f.label, leer: (i) => i.attrs[f.key] })),
        { key: 'supplier', label: 'Proveedor', leer: (i) => i.supplier }
      ]
      return campos.map((f) => ({ ...f, opciones: valoresDistintos(this.base, f.leer) }))
    },
    hayFiltros() { return Object.values(this.filtros).some((v) => v) },
    coincide() {
      const q = (this.filtros.q || '').trim().toLowerCase()
      return (i) => (!q || (i.brand + ' ' + i.model + ' ' + i.supplier + ' ' + i.notes).toLowerCase().includes(q)) &&
        this.definiciones.every((f) => !this.filtros[f.key] || String(f.leer(i) ?? '') === this.filtros[f.key])
    },
    mostrados() { return this.ordenar(this.base.filter(this.coincide)) },
    filasSugeridas() { return this.sugeridos.filter((s) => this.mostrados.some((i) => i.id === s.item.id)) },
    idsSugeridos() { return new Set(this.filasSugeridas.map((s) => s.item.id)) },
    restantes() { return this.mostrados.filter((i) => !this.idsSugeridos.has(i.id)) },
    incompatibles() { return this.ordenar(this.todosIncompatibles.filter(this.coincide)) },
    incompatiblesAbiertos() { return this.verIncompatibles || (this.filasSugeridas.length === 0 && this.restantes.length === 0) },
    columnas() { return this.categoria.filters },
    numColumnas() { return this.columnas.length + 4 },
    columnasCabecera() {
      return [
        { clave: 'name', etiqueta: 'Equipo', clase: '' },
        ...this.columnas.map((f) => ({ clave: 'attr:' + f.key, etiqueta: f.label, clase: '' })),
        { clave: 'supplier', etiqueta: 'Proveedor', clase: '' },
        { clave: 'price', etiqueta: 'Precio', clase: 'num' }
      ]
    }
  },
  methods: {
    nextSort,
    ordenar(filas) {
      return sortRows(filas, this.orden, (i, clave) => {
        if (clave === 'name') return [i.brand, i.model].filter(Boolean).join(' ')
        if (clave === 'supplier') return i.supplier
        if (clave === 'price') return i.unit_price
        return i.attrs[clave.replace(/^attr:/, '')]
      })
    },
    ariaOrden(clave) { return !this.orden || this.orden.key !== clave ? 'none' : this.orden.dir === 'asc' ? 'ascending' : 'descending' },
    iconoOrden(clave) { return !this.orden || this.orden.key !== clave ? '↕' : this.orden.dir === 'asc' ? '▲' : '▼' },
    propsFila(item, sugerencia) {
      return {
        item, sugerencia, columnas: this.columnas, numColumnas: this.numColumnas,
        anadido: this.estado.lines.some((l) => l.itemId === item.id),
        insignia: this.seccion.id === 'baterias' ? insigniaBateria(item, this.inversor) : null,
        avisos: this.avisos.get(item.id) || [],
        conflicto: this.estado.lines.some((l) => l.itemId === item.id) ? undefined : this.conflictos.get(item.id),
        espec: lineaEspec(this.categoria.specs, item), esVacio: esValorVacio
      }
    }
  }
}
</script>
