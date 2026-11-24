<template>
  <modal-component :ancho="true" :titulo="titulo" @cerrar="cerrar">
    <form id="inv-form" class="inv-formulario" @submit.prevent="guardar">
      <p v-if="copiaDe" class="paso-nota info inv-copy-nota" role="status">
        Copia de <strong>«{{ copiaDe }}»</strong>: cambia lo que haga falta (el modelo, las características, los precios…) y pulsa
        «Crear producto». El stock empieza en 0.
      </p>
      <datalist id="inv-units"><option v-for="u in UNIDADES" :key="u" :value="u" /></datalist>

      <fieldset>
        <legend>Producto</legend>
        <div class="inv-rejilla">
          <label>
            Categoría
            <select v-model="form.category" :disabled="!creando" :title="creando ? undefined : 'La categoría no se cambia una vez creado el producto'"
                    @change="form.attrs = {}">
              <option v-for="c in categorias" :key="c.key" :value="c.key">{{ c.label }}</option>
            </select>
          </label>
          <campo-lista v-model="form.brand" etiqueta="Marca" :opciones="marcas" vacio="(sin marca)" />
          <label>Modelo <input v-model="form.model"></label>
          <label>Precio por <input v-model="form.unit" list="inv-units"></label>
          <label>Stock (unidades en almacén) <input v-model="form.stock" inputmode="decimal"></label>
        </div>
      </fieldset>

      <fieldset class="inv-offers">
        <legend>Proveedores y precios</legend>
        <p class="muted inv-pista">
          Cada proveedor del producto con su precio (sin IVA, por {{ form.unit || 'ud' }}). El principal es el que usa el presupuestador.
        </p>
        <template v-if="form.offers.length > 0">
          <p v-if="precios.length > 1" class="inv-oferta-resumen">
            <strong>{{ precios.length }} precios distintos</strong>
            <template v-if="minimo === maximo"> · todos los proveedores cobran lo mismo ({{ eur(minimo) }})</template>
            <template v-else> · de <strong>{{ eur(minimo) }}</strong> a <strong>{{ eur(maximo) }}</strong> · {{ eur(maximo - minimo) }} de diferencia</template>
          </p>
          <ul class="inv-oferta-lista">
            <li v-for="(oferta, i) in form.offers" :key="i" class="inv-oferta-tarjeta" :class="{ main: esPrincipal(oferta) }">
              <div class="inv-oferta-cabecera">
                <button type="button" class="inv-oferta-usar" :class="{ on: esPrincipal(oferta) }" :disabled="!oferta.supplier"
                        :aria-pressed="esPrincipal(oferta)" title="El precio del proveedor principal es el que usa el presupuestador"
                        @click="form.principal = oferta.supplier">
                  {{ esPrincipal(oferta) ? '★ Precio del presupuestador' : 'Usar este precio' }}
                </button>
                <span v-if="esMasBarata(oferta)" class="tag cheapest">Más barato</span>
                <button type="button" class="icon-btn inv-oferta-quitar" title="Quitar este proveedor"
                        :aria-label="'Quitar ' + (oferta.supplier || 'el proveedor ' + (i + 1))" @click="form.offers.splice(i, 1)">×</button>
              </div>
              <div class="inv-oferta-campos">
                <campo-lista :model-value="oferta.supplier" :etiqueta="'Proveedor ' + (i + 1)" :opciones="proveedoresLibres(oferta)"
                             vacio="(elige proveedor)" @update:model-value="cambiarProveedor(oferta, $event)" />
                <label class="inv-oferta-precio">
                  Precio (€ / {{ form.unit || 'ud' }})
                  <input v-model="oferta.price" inputmode="decimal" placeholder="0,00">
                </label>
              </div>
              <div v-if="precios.length > 1 && aNumero(oferta.price) > 0" class="inv-oferta-comparar">
                <span class="inv-oferta-barra" aria-hidden="true">
                  <span :class="{ cheap: esMasBarata(oferta) }" :style="{ width: Math.max(6, (aNumero(oferta.price) / maximo) * 100) + '%' }" />
                </span>
                <span class="muted">{{ comparacion(oferta) }}</span>
              </div>
            </li>
          </ul>
        </template>
        <p v-else class="muted inv-pista">Este producto aún no tiene proveedores: el precio queda sin definir.</p>
        <div class="inv-oferta-acciones">
          <button type="button" class="secondary" @click="form.offers.push({ supplier: '', price: '', ref: '' })">+ Añadir proveedor</button>
          <span v-if="!creando" class="inv-revisado">
            {{ producto && producto.price_reviewed_at ? 'Precios revisados el ' + fechaCorta(producto.price_reviewed_at) : 'Precios sin revisar nunca' }}
            <button type="button" class="enlace-boton" :disabled="bloqueado" @click="$emit('revisar', [productoId])">Marcar como revisados hoy</button>
          </span>
        </div>
        <historial-precios-panel v-if="!creando" :id="productoId" :unidad="producto ? producto.unit : 'ud'"
                                 :proveedor="producto ? producto.supplier : ''" :version="JSON.stringify(producto ? producto.offers : [])" />
      </fieldset>

      <fieldset v-if="campos.length > 0">
        <legend>Características de {{ categoria ? categoria.label.toLowerCase() : '' }}</legend>
        <div class="inv-rejilla">
          <label v-for="f in campos" :key="f.key">
            {{ f.label }}
            <!-- Lista cerrada: las reglas del presupuestador se apoyan en estos valores. Un valor antiguo fuera de la lista se sigue enseñando. -->
            <select v-if="f.options" v-model="form.attrs[f.key]">
              <option value="">Sin indicar</option>
              <option v-if="form.attrs[f.key] && !f.options.includes(form.attrs[f.key])" :value="form.attrs[f.key]">{{ form.attrs[f.key] }} (cámbialo)</option>
              <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
            </select>
            <input v-else v-model="form.attrs[f.key]">
          </label>
        </div>
      </fieldset>

      <fieldset class="inv-extras">
        <legend>Características adicionales</legend>
        <p class="muted inv-pista">Lo que no está arriba, agrupado: eficiencia, corrientes, comunicación, dimensiones, compatibilidades…</p>
        <details v-for="g in gruposExtras" :key="g.grupo" class="inv-grupo" :open="gruposAbiertos.includes(g.grupo)"
                 @toggle="alternarGrupo(g.grupo, $event.target.open)">
          <summary>{{ g.grupo }} <span class="inv-grupo-total">{{ g.filas.length }}</span></summary>
          <div v-for="extra in g.filas" :key="extra.indice" class="inv-extra">
            <input v-model="form.extras[extra.indice].nombre" aria-label="Nombre de la característica" placeholder="Característica" :readonly="extra.clave !== null">
            <input v-model="form.extras[extra.indice].valor" :aria-label="'Valor de ' + (extra.nombre || 'la característica')" placeholder="Valor">
            <button type="button" class="icon-btn" title="Quitar la característica" :aria-label="'Quitar ' + (extra.nombre || 'la característica')"
                    @click="form.extras.splice(extra.indice, 1)">×</button>
          </div>
        </details>
        <p v-if="form.extras.length === 0" class="muted inv-pista">Este producto aún no tiene características adicionales.</p>
        <div class="inv-anadir-extra">
          <select v-model="borrador.grupo" aria-label="Grupo de la característica">
            <option v-for="g in GRUPOS" :key="g" :value="g">{{ g }}</option>
          </select>
          <input v-model="borrador.nombre" aria-label="Nombre de la característica nueva" placeholder="Característica">
          <input v-model="borrador.valor" aria-label="Valor de la característica nueva" placeholder="Valor">
          <button type="button" class="secondary" :disabled="!borrador.nombre.trim() || !borrador.valor.trim()" @click="anadirExtra">+ Añadir</button>
        </div>
      </fieldset>

      <fieldset class="inv-sheet">
        <legend>Ficha técnica</legend>
        <p v-if="fichaActual" class="inv-ficha-fichero">
          📄 <a :href="urlFicha" target="_blank" rel="noreferrer">{{ fichaActual.split('/').pop() }}</a>
          <button type="button" class="enlace-boton" :disabled="bloqueado" @click="quitarFicha">Quitar</button>
        </p>
        <p v-if="copiaFicha" class="inv-ficha-fichero">
          📄 {{ copiaFicha.split('/').pop() }} <span class="muted">· la misma ficha que «{{ copiaDe }}»</span>
          <button type="button" class="enlace-boton" @click="sinFichaCopiada = true">No enlazarla</button>
        </p>
        <p v-if="fichaPendiente" class="inv-ficha-fichero">
          📄 {{ fichaPendiente.name }} <span class="muted">· se subirá al crear el producto</span>
          <button type="button" class="enlace-boton" @click="fichaPendiente = null">Quitar</button>
        </p>
        <p v-if="estadoDropbox && !estadoDropbox.datasheets" class="muted inv-pista">Las fichas técnicas no están configuradas en este servidor (Dropbox): no se pueden adjuntar.</p>
        <template v-else-if="marcaDeFicha">
          <div class="inv-ficha-acciones">
            <label class="inv-adjuntar">
              <span class="secondary btn-like">{{ fichaActual || fichaPendiente ? 'Subir otra ficha (PDF)…' : 'Subir ficha técnica (PDF)…' }}</span>
              <input type="file" accept="application/pdf,.pdf" hidden :disabled="bloqueado" @change="adjuntarFicha">
            </label>
            <button v-if="!creando" type="button" class="secondary" :disabled="bloqueado" @click="cargarArchivosDeMarca">Elegir de la carpeta de {{ marcaGuardada }}</button>
          </div>
          <label v-if="archivosMarca !== null" class="inv-brandfiles">
            {{ archivosMarca.length === 0 ? 'No hay PDF en la carpeta de ' + marcaGuardada + '.' : 'PDF de la carpeta de ' + marcaGuardada + ' (' + archivosMarca.length + ')' }}
            <select v-if="archivosMarca.length > 0" value="" :disabled="bloqueado" @change="enlazarFicha($event.target.value)">
              <option value="">Elige la ficha de este producto…</option>
              <option v-for="f in archivosMarca" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <p class="muted inv-pista">Las fichas están en Dropbox, en la carpeta de la marca ({{ marcaDeFicha }}), sin subcarpetas.<template v-if="!creando && form.brand !== marcaGuardada"> Guarda el cambio de marca antes de adjuntar.</template></p>
        </template>
        <p v-else class="muted inv-pista">Elige y guarda la marca del producto: la ficha se guarda en la carpeta de su marca.</p>
        <p v-if="errorFicha" class="error">{{ errorFicha }}</p>
      </fieldset>

      <label class="inv-notes">Observaciones <textarea v-model="form.notes" rows="3" /></label>
    </form>

    <template #pie>
      <button v-if="!creando && !sencilla" type="button" class="secondary" :disabled="bloqueado" title="Crea un producto nuevo con estos mismos datos para cambiar lo que haga falta" @click="duplicar">Duplicar</button>
      <button v-if="!creando && !sencilla" type="button" class="secondary danger" :disabled="bloqueado" @click="quitar">Quitar del inventario</button>
      <span v-if="problema && cambiado" class="plan-problema inv-problema">{{ problema }}</span>
      <span v-if="error" class="plan-problema inv-problema">{{ error }}</span>
      <button type="button" class="secondary" @click="cerrar">Cancelar</button>
      <button type="submit" form="inv-form" :disabled="bloqueado || !!problema || (!cambiado && !creando)">{{ creando ? 'Crear producto' : 'Guardar cambios' }}</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from './ModalComponent.vue'
import CampoLista from './CampoLista.vue'
import HistorialPreciosPanel from './HistorialPreciosPanel.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { eur, fechaCorta, nombreProducto } from '@/utils/planificador/formato'
import { GRUPOS, agruparFilas } from '@/utils/planificador/caracteristicas'
import { UNIDADES, camposDe, aNumero, formularioDe, formularioVacio, principalDe, cuerpoDe, problemaDe } from '@/utils/planificador/formularioEquipo'

// Ventana de un producto del inventario: alta, edición, duplicado y borrado.
export default {
  name: 'Ficha-Producto-Modal',
  components: { ModalComponent, CampoLista, HistorialPreciosPanel },
  props: {
    catalogo: { type: Object, required: true },
    // Id del producto abierto, o null para uno nuevo
    productoId: { type: String, default: null },
    // Categoría con la que empieza un producto nuevo
    categoriaInicial: { type: String, default: '' },
    // Datos de partida si es un duplicado: { producto, nombre }
    copia: { type: Object, default: null },
    marcas: { type: Array, default: () => [] },
    proveedores: { type: Array, default: () => [] },
    // Abierta desde el presupuestador: solo se edita (sin duplicar ni quitar del inventario)
    sencilla: { type: Boolean, default: false },
    ocupado: { type: Boolean, default: false }
  },
  emits: ['cerrar', 'guardado', 'borrado', 'revisar', 'duplicar', 'recargar'],
  data() {
    return {
      UNIDADES, GRUPOS,
      form: null, guardado: null, error: null, errorFicha: null, gruposAbiertos: [],
      borrador: { grupo: 'Otras', nombre: '', valor: '' }, sinFichaCopiada: false, trabajando: false,
      estadoDropbox: null, fichaPendiente: null, archivosMarca: null
    }
  },
  mounted() { planificadorApi.dropboxEstado().then((e) => { this.estadoDropbox = e }, () => { this.estadoDropbox = { enabled: false, datasheets: false, base: '' } }) },
  computed: {
    bloqueado() { return this.ocupado || this.trabajando },
    categorias() { return this.catalogo.categories },
    creando() { return this.productoId === null },
    producto() { return this.catalogo.items.find((i) => i.id === this.productoId) || null },
    categoria() { return this.categorias.find((c) => c.key === this.form.category) },
    campos() { return camposDe(this.categoria) },
    cambiado() { return JSON.stringify(this.form) !== JSON.stringify(this.guardado) },
    problema() { return problemaDe(this.form) },
    copiaDe() { return this.copia ? this.copia.nombre : '' },
    titulo() { return this.creando ? (this.copia ? 'Duplicar producto' : 'Nuevo producto') : nombreProducto({ brand: this.form.brand, model: this.form.model }) },
    // La ficha del original se enlaza a la copia mientras no cambie la marca (la ficha está en la carpeta de la marca)
    copiaFicha() {
      const c = this.copia
      return this.creando && c && c.producto.datasheet && !this.sinFichaCopiada && this.form.brand.trim() === c.producto.brand ? c.producto.datasheet : ''
    },
    fichaActual() { return this.producto ? this.producto.datasheet : '' },
    // La ficha vive en la carpeta de la marca GUARDADA del producto: para adjuntar hay que haber guardado la marca
    marcaGuardada() { return this.producto ? this.producto.brand : '' },
    marcaDeFicha() { return this.creando ? this.form.brand : this.marcaGuardada },
    urlFicha() { return planificadorApi.urlFicha(this.productoId) },
    precios() { return this.form.offers.filter((o) => o.supplier && aNumero(o.price) > 0).map((o) => aNumero(o.price)) },
    minimo() { return this.precios.length ? Math.min(...this.precios) : 0 },
    maximo() { return this.precios.length ? Math.max(...this.precios) : 0 },
    gruposExtras() { return agruparFilas(this.form.extras.map((x, indice) => ({ ...x, indice }))) }
  },
  created() {
    if (this.copia) {
      const base = formularioDe(this.copia.producto, this.categorias.find((c) => c.key === this.copia.producto.category))
      const modelo = base.model.trim()
      this.form = { ...base, model: modelo ? modelo + ' (copia)' : '', stock: '0' }
    } else if (this.producto) {
      this.form = formularioDe(this.producto, this.categorias.find((c) => c.key === this.producto.category))
    } else {
      this.form = formularioVacio(this.categoriaInicial || (this.categorias[0] && this.categorias[0].key) || '')
    }
    this.guardado = JSON.parse(JSON.stringify(this.form))
  },
  methods: {
    eur, fechaCorta, aNumero,
    esPrincipal(oferta) { return !!oferta.supplier && oferta.supplier === principalDe(this.form) },
    esMasBarata(oferta) {
      const precio = aNumero(oferta.price)
      return this.precios.length > 1 && precio > 0 && precio === this.minimo && this.minimo !== this.maximo
    },
    comparacion(oferta) {
      const precio = aNumero(oferta.price)
      if (precio === this.minimo) return this.minimo === this.maximo ? 'igual que los demás' : 'el más barato'
      const dif = precio - this.minimo
      return '+' + eur(dif) + ' (+' + Math.round((dif / this.minimo) * 100) + ' %) sobre el más barato'
    },
    proveedoresLibres(oferta) {
      return this.proveedores.filter((n) => n === oferta.supplier || !this.form.offers.some((o) => o.supplier === n))
    },
    cambiarProveedor(oferta, nombre) {
      const eraPrincipal = oferta.supplier && oferta.supplier === principalDe(this.form)
      oferta.supplier = nombre
      if (eraPrincipal || !this.form.principal) this.form.principal = nombre
    },
    alternarGrupo(grupo, abierto) {
      const esta = this.gruposAbiertos.includes(grupo)
      if (esta === abierto) return
      this.gruposAbiertos = abierto ? [...this.gruposAbiertos, grupo] : this.gruposAbiertos.filter((g) => g !== grupo)
    },
    anadirExtra() {
      this.form.extras.push({ clave: null, grupo: this.borrador.grupo, nombre: this.borrador.nombre.trim(), valor: this.borrador.valor.trim() })
      if (!this.gruposAbiertos.includes(this.borrador.grupo)) this.gruposAbiertos.push(this.borrador.grupo)
      this.borrador = { ...this.borrador, nombre: '', valor: '' }
    },
    cerrar() {
      if (this.cambiado && !window.confirm('Hay cambios sin guardar en este producto. ¿Descartarlos?')) return
      this.$emit('cerrar')
    },
    duplicar() {
      if (this.cambiado && !window.confirm('Hay cambios sin guardar en este producto. Se duplicará tal como está guardado y esos cambios se descartarán. ¿Continuar?')) return
      this.$emit('duplicar', this.producto)
    },
    async guardar() {
      if (this.problema) return
      this.trabajando = true
      this.error = null
      try {
        const cuerpo = cuerpoDe(this.form)
        if (this.creando) {
          const creado = await planificadorApi.crearEquipo({
            category: this.form.category,
            group: (this.categoria && this.categoria.groups[0]) || 'electricidad',
            ...cuerpo,
            ...(this.copiaFicha ? { datasheet: this.copiaFicha } : {})
          })
          if (this.fichaPendiente) {
            try { await planificadorApi.subirFicha(creado.id, this.fichaPendiente) } catch (e) { throw new Error('El producto se creó, pero la ficha no se pudo subir: ' + mensajeError(e)) }
          }
        } else {
          await planificadorApi.actualizarEquipo(this.productoId, cuerpo)
        }
        this.$emit('guardado')
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.trabajando = false
      }
    },
    async quitar() {
      if (!window.confirm('¿Quitar «' + nombreProducto(this.producto) + '» del inventario? Los presupuestos que ya lo usan no cambian.')) return
      try {
        await planificadorApi.borrarEquipo(this.productoId)
        this.$emit('borrado')
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    // Se sube y se enlaza al momento; en un producto nuevo se sube al crearlo
    async adjuntarFicha(evento) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (!archivo) return
      this.errorFicha = null
      if (!/\.pdf$/i.test(archivo.name) && archivo.type !== 'application/pdf') { this.errorFicha = 'La ficha técnica tiene que ser un PDF.'; return }
      if (this.creando) { this.fichaPendiente = archivo; return }
      this.trabajando = true
      try { await planificadorApi.subirFicha(this.productoId, archivo); this.$emit('recargar') } catch (e) { this.errorFicha = mensajeError(e) } finally { this.trabajando = false }
    },
    // «Elegir de la carpeta de la marca»: enseña los PDF que ya hay allí y enlaza el que se elija (no sube nada)
    async cargarArchivosDeMarca() {
      this.errorFicha = null
      try { this.archivosMarca = (await planificadorApi.opcionesFicha(this.productoId)).files } catch (e) { this.errorFicha = mensajeError(e) }
    },
    async enlazarFicha(archivo) {
      if (!archivo) return
      this.trabajando = true
      this.errorFicha = null
      try {
        await planificadorApi.actualizarEquipo(this.productoId, { datasheet: this.marcaGuardada + '/' + archivo })
        this.archivosMarca = null
        this.$emit('recargar')
      } catch (e) { this.errorFicha = mensajeError(e) } finally { this.trabajando = false }
    },
    async quitarFicha() {
      if (!window.confirm('¿Quitar la ficha de este producto? El PDF no se borra de Dropbox, solo deja de estar enlazado.')) return
      this.errorFicha = null
      try {
        await planificadorApi.quitarFicha(this.productoId)
        this.$emit('recargar')
      } catch (e) {
        this.errorFicha = mensajeError(e)
      }
    }
  }
}
</script>
