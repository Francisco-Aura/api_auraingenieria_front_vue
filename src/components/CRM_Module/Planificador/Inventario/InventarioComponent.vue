<template>
  <div class="inventory">
    <div v-if="etiquetaVolver" class="back-row">
      <button type="button" class="secondary" @click="$emit('cerrar')">{{ etiquetaVolver }}</button>
    </div>
    <div class="costs-title">
      <h1>Inventario</h1>
      <div class="title-actions">
        <button type="button" class="secondary" :aria-expanded="mostrarListas" @click="mostrarListas = !mostrarListas">Marcas y proveedores</button>
        <button type="button" class="secondary" :disabled="exportando" title="Descarga todo el inventario en un Excel: una hoja con todo, una por categoría y los precios de cada proveedor" @click="exportarExcel">{{ exportando ? 'Generando…' : 'Exportar a Excel' }}</button>
        <button type="button" @click="abrir(null)">+ Nuevo producto</button>
      </div>
    </div>
    <listas-marcas-proveedores v-if="mostrarListas" @cambiado="logosCambiados" />
    <p class="muted inv-note">
      Los productos de aquí son los que se eligen en el presupuestador. Cada categoría tiene sus características
      (potencia, tensión…) y además se pueden añadir las que hagan falta.
    </p>

    <div v-if="revision && catalogo" class="inv-review" :class="{ due: revision.days_left <= 0 && !revision.notified }" role="status">
      <div>
        <strong>Revisión de precios</strong>
        <span v-if="revision.reviewed_products === 0"> · aún no se ha revisado ningún precio</span>
        <span v-else> · última revisión: {{ fechaCorta(revision.last_review) }}{{ revision.days_since === 0 ? ' (hoy)' : ' (hace ' + revision.days_since + (revision.days_since === 1 ? ' día)' : ' días)') }}</span>
        <span class="muted">{{ textoRevision }}</span>
      </div>
      <button type="button" class="secondary" :disabled="ocupado || visibles.length === 0" @click="revisarVisibles">
        Marcar como revisados los {{ visibles.length }} que veo
      </button>
    </div>
    <div v-if="catalogo && sinPrecio.length > 0" class="inv-review due" role="status">
      <div>
        <strong>⚠ {{ sinPrecio.length === 1 ? '1 producto sin precio' : sinPrecio.length + ' productos sin precio' }}</strong>
        <span class="muted"> · hay que completarlos: ábrelos y añade su proveedor y su precio. Se marcan con «Sin precio».</span>
      </div>
      <button type="button" class="secondary" @click="abrir(sinPrecio[0].id)">Corregir el primero</button>
    </div>

    <p v-if="error && !catalogo" class="error">No se ha podido cargar el inventario: {{ error }}</p>
    <p v-else-if="!catalogo" class="muted">Cargando inventario…</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>

    <div v-if="catalogo" class="inv-body">
      <aside class="inv-filter" aria-label="Filtrar productos">
        <label class="inv-search">
          Buscar
          <input v-model="consulta" type="search" placeholder="Marca, modelo, proveedor…">
        </label>
        <h2>Categorías</h2>
        <ul class="inv-cats">
          <li>
            <button type="button" :class="{ active: categoriaFiltro === '' }" :aria-pressed="categoriaFiltro === ''" @click="elegirCategoria('')">
              <icono-categoria nombre="todas" /><span class="inv-cat-name">Todas</span><span class="inv-cat-count">{{ catalogo.items.length }}</span>
            </button>
          </li>
          <li v-for="c in categorias" :key="c.key">
            <button type="button" :class="{ active: categoriaFiltro === c.key }" :aria-pressed="categoriaFiltro === c.key" @click="elegirCategoria(c.key)">
              <icono-categoria :nombre="c.key" /><span class="inv-cat-name">{{ c.label }}</span><span class="inv-cat-count">{{ cuentas[c.key] || 0 }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="inv-results" aria-label="Productos">
        <div class="inv-toolbar" role="search" aria-label="Filtros">
          <div class="inv-tool">
            <span class="inv-tool-label">Precio (€)</span>
            <span class="inv-range">
              <input v-model="precioMin" aria-label="Precio mínimo" inputmode="decimal" placeholder="Desde">
              <span aria-hidden="true">–</span>
              <input v-model="precioMax" aria-label="Precio máximo" inputmode="decimal" placeholder="Hasta">
            </span>
          </div>
          <label class="switch">
            <input v-model="soloStock" type="checkbox"><span class="switch-track" aria-hidden="true" /> Solo con stock
          </label>
          <label class="inv-tool">
            <span class="inv-tool-label">Marca</span>
            <select v-model="marca"><option value="">Todas</option><option v-for="v in valoresDistintos(grupo, (i) => i.brand)" :key="v" :value="v">{{ v }}</option></select>
          </label>
          <label class="inv-tool">
            <span class="inv-tool-label">Proveedor</span>
            <select v-model="proveedor"><option value="">Todos</option><option v-for="v in valoresDistintos(grupo, (i) => i.supplier)" :key="v" :value="v">{{ v }}</option></select>
          </label>
          <template v-for="f in filtrosCategoria" :key="f.key">
            <label v-if="opcionesFiltro(f).length > 1" class="inv-tool">
              <span class="inv-tool-label">{{ f.label }}</span>
              <select :value="filtrosAtributo[f.key] || ''" @change="filtrosAtributo[f.key] = $event.target.value"><option value="">Todos</option><option v-for="o in opcionesFiltro(f)" :key="o" :value="o">{{ o === 'Todas' ? 'Cualquier cubierta' : o }}</option></select>
            </label>
          </template>
          <label class="inv-tool">
            <span class="inv-tool-label">Ordenar por</span>
            <select v-model="orden"><option v-for="o in ORDENES" :key="o.key" :value="o.key">{{ o.label }}</option></select>
          </label>
          <button v-if="hayFiltros" type="button" class="link-btn" @click="quitarFiltros">Quitar filtros</button>
        </div>
        <p class="muted result-count" aria-live="polite">
          {{ visibles.length }} {{ visibles.length === 1 ? 'producto' : 'productos' }}{{ categoriaFiltro ? ' en ' + categoriaDe(categoriaFiltro).label.toLowerCase() : '' }}
          <template v-if="valorStock > 0"> · valor en stock <strong>{{ eur(valorStock) }}</strong></template>
        </p>
        <p v-if="visibles.length === 0" class="muted inv-none">Ningún producto cumple la búsqueda.</p>
        <ul v-else class="inv-cards">
          <li v-for="item in visibles" :key="item.id">
            <button type="button" class="inv-card" :class="{ 'needs-review': porRevisar(item) }" @click="abrir(item.id)">
              <span class="inv-card-top">
                <span class="inv-card-icon"><icono-categoria :nombre="item.category" /></span>
                <span class="inv-card-cat">{{ categoriaDe(item.category) ? categoriaDe(item.category).label : item.category }}</span>
                <logo-marca v-if="item.brand" :nombre="item.brand" :tiene-logo="marcasConLogo.includes(item.brand)" :version="versionLogos" />
              </span>
              <span v-if="porRevisar(item) || item.datasheet" class="inv-card-flags">
                <span v-if="porRevisar(item)" class="tag review"
                      :title="item.price_reviewed_at ? 'Precio revisado el ' + fechaCorta(item.price_reviewed_at) : 'El precio no se ha revisado nunca'">Por revisar</span>
                <span v-if="item.datasheet" class="tag ficha" title="Tiene la ficha técnica adjunta">📄 Ficha</span>
              </span>
              <strong class="inv-card-name">{{ nombreProducto(item) }}</strong>
              <insignia-proteccion :producto="item" />
              <span class="muted inv-card-supplier">{{ item.supplier || 'Sin proveedor' }}{{ resumenOfertas(item) }}</span>
              <span v-if="destacar(item).datos.length > 0 || destacar(item).mas > 0" class="inv-specs">
                <span v-for="c in destacar(item).datos" :key="c.key" class="inv-spec">
                  <span class="inv-spec-label">{{ c.label }}</span><span class="inv-spec-value">{{ c.value }}</span>
                </span>
                <span v-if="destacar(item).mas > 0" class="inv-spec-more" title="Más características en la ficha del producto">+{{ destacar(item).mas }} características más en la ficha</span>
              </span>
              <span class="inv-card-foot">
                <span v-if="item.unit_price > 0" class="inv-card-price">{{ eur(item.unit_price) }} <span class="muted">/ {{ item.unit }}</span></span>
                <span v-else class="tag no-price" title="Este producto no tiene precio: complétalo en su ficha">⚠ Sin precio</span>
                <span v-if="item.stock > 0" class="inv-stock con">{{ cantidad(item.stock) }} en stock</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>

    <ficha-producto-modal
      v-if="ficha" :key="ficha.clave" :catalogo="catalogo" :producto-id="ficha.id" :categoria-inicial="categoriaFiltro" :copia="ficha.copia"
      :marcas="marcas" :proveedores="proveedores" :ocupado="ocupado"
      @cerrar="ficha = null" @guardado="alGuardar" @borrado="alGuardar" @revisar="marcarRevisados" @recargar="cargar"
      @duplicar="duplicar"
    />
  </div>
</template>

<script>
import IconoCategoria from './IconoCategoria.vue'
import LogoMarca from './LogoMarca.vue'
import InsigniaProteccion from './InsigniaProteccion.vue'
import ListasMarcasProveedores from './ListasMarcasProveedores.vue'
import FichaProductoModal from './FichaProductoModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { descargarArchivo } from '@/utils/planificador/documentos/descarga'
import { eur, cantidad, valoresDistintos, fechaCorta, nombreProducto } from '@/utils/planificador/formato'
import { esValorVacio } from '@/utils/planificador/caracteristicas'
import { necesitaRevision, destacadas } from '@/utils/planificador/formularioEquipo'

const ORDENES = [
  { key: 'categoria', label: 'Categoría y nombre' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio-asc', label: 'Precio: de menor a mayor' },
  { key: 'precio-desc', label: 'Precio: de mayor a menor' },
  { key: 'stock-desc', label: 'Con más stock primero' }
]

// Inventario: los productos y sus características. Es el mismo catálogo que usa el presupuestador.
export default {
  name: 'Inventario-Component',
  props: { etiquetaVolver: { type: String, default: '' } },
  emits: ['cerrar'],
  components: { IconoCategoria, LogoMarca, InsigniaProteccion, ListasMarcasProveedores, FichaProductoModal },
  data() {
    return {
      ORDENES,
      catalogo: null, error: null, ocupado: false, revision: null,
      consulta: '', categoriaFiltro: '', precioMin: '', precioMax: '', soloStock: false, marca: '', proveedor: '',
      filtrosAtributo: {}, orden: 'categoria',
      marcas: [], marcasConLogo: [], proveedores: [], versionLogos: 0, mostrarListas: false,
      // Producto abierto: { id: string|null (null = nuevo), clave, copia }
      ficha: null, contadorFichas: 0, exportando: false
    }
  },
  computed: {
    categorias() { return this.catalogo ? this.catalogo.categories : [] },
    cuentas() {
      const c = {}
      for (const i of (this.catalogo ? this.catalogo.items : [])) c[i.category] = (c[i.category] || 0) + 1
      return c
    },
    // Productos de la categoría y de la búsqueda: sobre ellos se ofrecen marcas, proveedores y valores de cada característica.
    grupo() {
      const q = this.consulta.trim().toLowerCase()
      return (this.catalogo ? this.catalogo.items : []).filter((i) =>
        (!this.categoriaFiltro || i.category === this.categoriaFiltro) &&
        (!q || (i.brand + ' ' + i.model + ' ' + i.supplier + ' ' + i.notes).toLowerCase().includes(q)))
    },
    filtrosCategoria() {
      const c = this.categoriaFiltro ? this.categoriaDe(this.categoriaFiltro) : null
      return c ? c.filters : []
    },
    visibles() {
      const orden = new Map(this.categorias.map((c, i) => [c.key, i]))
      const min = this.precioMin.trim() === '' ? null : Number(this.precioMin.replace(',', '.'))
      const max = this.precioMax.trim() === '' ? null : Number(this.precioMax.replace(',', '.'))
      const filas = this.grupo.filter((i) =>
        (min === null || Number.isNaN(min) || i.unit_price >= min) &&
        (max === null || Number.isNaN(max) || i.unit_price <= max) &&
        (!this.soloStock || i.stock > 0) &&
        (!this.marca || i.brand === this.marca) &&
        (!this.proveedor || i.supplier === this.proveedor) &&
        Object.entries(this.filtrosAtributo).every(([clave, valor]) => !valor || String(i.attrs[clave] ?? '') === valor))
      const porNombre = (a, b) => nombreProducto(a).localeCompare(nombreProducto(b), 'es')
      return [...filas].sort((a, b) => {
        if (this.orden === 'nombre') return porNombre(a, b)
        if (this.orden === 'precio-asc') return a.unit_price - b.unit_price || porNombre(a, b)
        if (this.orden === 'precio-desc') return b.unit_price - a.unit_price || porNombre(a, b)
        if (this.orden === 'stock-desc') return b.stock - a.stock || porNombre(a, b)
        return (orden.get(a.category) ?? 99) - (orden.get(b.category) ?? 99) || porNombre(a, b)
      })
    },
    hayFiltros() {
      return this.precioMin !== '' || this.precioMax !== '' || this.soloStock || this.marca !== '' || this.proveedor !== '' ||
        Object.values(this.filtrosAtributo).some(Boolean)
    },
    valorStock() { return this.visibles.reduce((suma, i) => suma + i.stock * i.unit_price, 0) },
    // Un producto sin precio es un dato incompleto que hay que corregir: se avisa y se llega al siguiente
    sinPrecio() {
      return (this.catalogo ? this.catalogo.items : []).filter((i) => i.unit_price <= 0)
        .sort((a, b) => nombreProducto(a).localeCompare(nombreProducto(b), 'es'))
    },
    textoRevision() {
      const r = this.revision
      const n = this.catalogo.items.filter((i) => necesitaRevision(i, r.plazo)).length
      const estado = n > 0 ? ' · ' + n + ' con el precio por revisar (en ámbar)' : ' · todos los precios están al día'
      if (r.notified) return estado + ' · Ingeniería ya está avisada; se avisará de nuevo ' + r.plazo + ' días después de la próxima revisión.'
      if (r.days_left > 0) return estado + ' · se avisa a Ingeniería el ' + fechaCorta(r.due_date) + ' (en ' + r.days_left + (r.days_left === 1 ? ' día).' : ' días).')
      return estado + ' · toca revisar los precios: Ingeniería recibe el aviso en la próxima ejecución diaria.'
    }
  },
  mounted() {
    this.cargar()
    this.cargarListas()
    this.cargarRevision()
  },
  methods: {
    // Baja el inventario completo en un Excel (lo que hay guardado, sin los filtros de la pantalla)
    async exportarExcel() {
      this.exportando = true
      this.error = null
      try {
        const { blob, nombre } = await planificadorApi.exportarInventario()
        descargarArchivo(blob, nombre)
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.exportando = false
      }
    },
    eur, cantidad, valoresDistintos, fechaCorta, nombreProducto,
    categoriaDe(clave) { return this.categorias.find((c) => c.key === clave) },
    porRevisar(item) { return necesitaRevision(item, this.revision ? this.revision.plazo : 15) },
    destacar(item) { return destacadas(item, this.categoriaDe(item.category), esValorVacio) },
    opcionesFiltro(f) {
      return valoresDistintos(this.grupo.filter((i) => i.category === this.categoriaFiltro), (i) => (esValorVacio(i.attrs[f.key]) ? undefined : i.attrs[f.key]))
    },
    resumenOfertas(item) {
      const precios = (item.offers || []).filter((o) => o.price > 0).map((o) => o.price)
      if (precios.length < 2) return ''
      const bajo = Math.min(...precios)
      const alto = Math.max(...precios)
      return ' · ' + precios.length + ' proveedores' + (alto > bajo ? ' · de ' + eur(bajo) + ' a ' + eur(alto) : '')
    },
    elegirCategoria(clave) {
      this.categoriaFiltro = clave
      this.filtrosAtributo = {}
    },
    quitarFiltros() {
      this.precioMin = ''
      this.precioMax = ''
      this.soloStock = false
      this.marca = ''
      this.proveedor = ''
      this.filtrosAtributo = {}
    },
    async cargar() {
      try {
        this.catalogo = await planificadorApi.catalogo()
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    async cargarListas() {
      try {
        const [m, p] = await Promise.all([planificadorApi.marcas(), planificadorApi.proveedores()])
        this.marcas = m.map((x) => x.name)
        this.marcasConLogo = m.filter((x) => x.logo).map((x) => x.name)
        this.proveedores = p.map((x) => x.name)
      } catch (e) { /* las listas se vuelven a pedir al abrir un producto */ }
    },
    async cargarRevision() {
      try { this.revision = await planificadorApi.estadoRevision() } catch (e) { /* sin aviso de revisión */ }
    },
    async logosCambiados() {
      this.versionLogos += 1
      await this.cargarListas()
    },
    abrir(id) {
      this.error = null
      this.contadorFichas += 1
      this.ficha = { id, clave: this.contadorFichas, copia: null }
    },
    // Duplicar: se abre el formulario de un producto nuevo con todos los datos del original
    duplicar(producto) {
      this.error = null
      this.contadorFichas += 1
      this.ficha = { id: null, clave: this.contadorFichas, copia: { producto, nombre: nombreProducto(producto) } }
    },
    async alGuardar() {
      this.ficha = null
      await Promise.all([this.cargar(), this.cargarRevision()])
    },
    async marcarRevisados(ids) {
      this.ocupado = true
      try {
        await planificadorApi.marcarRevisados(ids)
        await Promise.all([this.cargar(), this.cargarRevision()])
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    revisarVisibles() {
      if (!window.confirm('¿Dar por revisados los precios de los ' + this.visibles.length + ' productos que se ven ahora? No cambia ningún precio.')) return
      this.marcarRevisados(this.visibles.map((i) => i.id))
    }
  }
}
</script>
