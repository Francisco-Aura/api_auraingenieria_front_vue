<template>
  <section v-if="!vista" class="tarjeta-block"><p class="muted">{{ error || 'Cargando el presupuesto…' }}</p></section>

  <section v-else-if="!vista.configured" class="tarjeta-block">
    <h2>Presupuesto con cambios</h2>
    <p class="hint">Este proyecto aún no tiene presupuesto. Guarda el del Presupuestador como <strong>presupuesto inicial</strong> y podrás ver cómo lo modifican los cambios, línea a línea.</p>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="button" :disabled="ocupado" @click="guardarInicial">Guardar el del Presupuestador como presupuesto inicial</button>
  </section>

  <section v-else class="tarjeta-block bd">
    <div class="block-cabecera">
      <h2>Presupuesto con cambios</h2>
      <div v-if="!borrador" class="bd-acciones">
        <label class="bd-only"><input v-model="soloCambiado" type="checkbox"> Solo lo que ha cambiado</label>
        <button v-if="vista.per_change.length === 0" type="button" class="secondary" :disabled="ocupado" @click="guardarInicial">Volver a cargar el del Presupuestador</button>
        <button type="button" @click="empezar">Cambio en el presupuesto</button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>

    <div class="bd-estadisticas">
      <div class="bd-dato"><span>Coste</span><strong>{{ eur(t.coste) }}</strong><small>inicial {{ eur(vista.initial.cost) }} · <span :class="tono(-dCoste)">{{ conSignoEur(dCoste) }}</span></small></div>
      <div class="bd-dato"><span>Presupuesto (venta)</span><strong>{{ eur(t.venta) }}</strong><small>inicial {{ eur(vista.initial.budget) }} · <span :class="tono(dVenta)">{{ conSignoEur(dVenta) }}</span></small></div>
      <div class="bd-dato"><span>Beneficio</span><strong>{{ eur(t.venta - t.coste) }}</strong><small>inicial {{ eur(vista.initial.profit) }} · <span :class="tono(dBeneficio)">{{ conSignoEur(dBeneficio) }}</span></small></div>
      <div class="bd-dato"><span>Margen</span><strong>{{ pct(t.venta > 0 ? (t.venta - t.coste) / t.venta : 0) }}</strong><small>inicial {{ pct(vista.initial.margin) }}</small></div>
    </div>

    <p v-if="borrador" class="hint">Escribe en la columna <strong>Vigente</strong> las cantidades que quedan; al guardar, el cambio recoge cuántas se añaden o se quitan en cada línea.</p>

    <div class="bd-tabla-envoltorio">
      <table class="bd-tabla">
        <thead><tr><th>Equipo</th><th class="num">Inicial</th><th class="num">Cambios</th><th class="num">Vigente</th><th class="num">Precio</th><th class="num">Importe vigente</th><th class="num">Dif.</th></tr></thead>
        <tbody>
          <template v-for="g in grupos" :key="g">
            <tr class="bd-grupo">
              <td colspan="5">{{ nombrePartida(g) }}</td>
              <td class="num">{{ eur(sumaGrupo(g)) }}</td>
              <td class="num" :class="tono(difGrupo(g))">{{ conSignoEur(difGrupo(g)) }}</td>
            </tr>
            <tr v-for="l in filasDe(g)" :key="l.id" :class="{ 'bd-cambiado': delta(l) !== 0 || l.added }">
              <td>
                <div class="bd-nombre">{{ l.model || l.equipment }}</div>
                <div class="bd-sub">{{ l.model ? l.equipment : '' }}<span v-if="l.added" class="bd-etiqueta">nuevo</span><span v-for="n in l.changes" :key="n" class="bd-etiqueta">C{{ n }}</span></div>
              </td>
              <td class="num">{{ cant(l.initial_qty) }}</td>
              <td class="num" :class="tono(delta(l))">{{ conSignoCant(delta(l)) }}</td>
              <td class="num">
                <campo-numerico v-if="borrador && !l.auto" clase="bd-entrada" :etiqueta="'Cantidad vigente de ' + (l.model || l.equipment)" :model-value="borrador.cantidades[l.id] ?? l.current_qty" @update:model-value="borrador.cantidades[l.id] = $event" />
                <template v-else>{{ cant(mostrada(l)) }}<span v-if="l.auto" class="bd-auto" title="Sigue al número de módulos"> ⟲</span></template>
              </td>
              <td class="num">{{ eur(l.price) }}</td>
              <td class="num">{{ eur(mostrada(l) * l.price) }}</td>
              <td class="num" :class="tono(mostrada(l) * l.price - l.initial_total)">{{ conSignoEur(redondear2(mostrada(l) * l.price - l.initial_total)) }}</td>
            </tr>
          </template>
          <tr v-for="a in (borrador ? borrador.nuevas : [])" :key="a.id" class="bd-cambiado">
            <td><div class="bd-nombre">{{ a.data.model || a.data.equipment }}</div><div class="bd-sub">{{ a.data.model ? a.data.equipment : '' }}<span class="bd-etiqueta">nuevo</span></div></td>
            <td class="num">0</td>
            <td class="num bd-plus">{{ conSignoCant(a.qty) }}</td>
            <td class="num"><campo-numerico clase="bd-entrada" :etiqueta="'Cantidad de ' + (a.data.model || a.data.equipment)" :model-value="a.qty" @update:model-value="a.qty = $event" /></td>
            <td class="num">{{ eur(a.data.price) }}</td>
            <td class="num">{{ eur(a.qty * a.data.price) }}</td>
            <td class="num bd-plus">{{ conSignoEur(a.qty * a.data.price) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="borrador" class="bd-borrador">
      <div class="bd-modules">
        <label class="field">Módulos <campo-numerico clase="bd-entrada" etiqueta="Número de módulos" :model-value="borrador.modulos" @update:model-value="borrador.modulos = Math.round($event)" /></label>
        <span class="muted">ahora {{ vista.current.module_count }} · {{ cant((vista.module_wp * borrador.modulos) / 1000) }} kWp</span>
      </div>

      <fieldset v-if="catalogo" class="bd-selector">
        <legend>Añadir un producto nuevo</legend>
        <div class="bd-selector-fila">
          <select v-model="categoria" aria-label="Categoría"><option value="">Todas las categorías</option><option v-for="c in catalogo.categories" :key="c.key" :value="c.key">{{ c.label }}</option></select>
          <input v-model="busqueda" placeholder="Buscar por marca o modelo…">
        </div>
        <ul v-if="encontrados.length > 0" class="bd-found">
          <li v-for="i in encontrados" :key="i.id"><button type="button" @click="anadirProducto(i)"><span>{{ [i.brand, i.model].filter(Boolean).join(' ') }} <small class="muted">{{ i.supplier }}</small></span><span>{{ eur(i.unit_price) }}</span></button></li>
        </ul>
      </fieldset>

      <div class="formulario-rejilla">
        <label class="field">Fecha <input v-model="borrador.fecha" type="date"></label>
        <label class="field">Impacto en el contrato (+ / − €)
          <input type="number" step="any" :value="impactoFinal" @input="borrador.impacto = $event.target.value === '' ? 0 : Number($event.target.value)">
          <small class="muted">Por defecto, lo que varía el presupuesto de venta. Se puede ajustar.</small>
        </label>
      </div>
      <fieldset v-if="impactoFinal > 0" class="precio-caja pago-modo">
        <legend>Cómo se cobra este aumento</legend>
        <label class="radio"><input v-model="borrador.modoPago" type="radio" name="modo-cobro-pres" value="split"><span><strong>Repartirlo entre los pagos pendientes</strong><small class="muted"> — se suma a las facturas que aún no se han empezado, en proporción a su importe.</small></span></label>
        <label class="radio"><input v-model="borrador.modoPago" type="radio" name="modo-cobro-pres" value="new"><span><strong>Cobrarlo en un pago nuevo</strong><small class="muted"> — se añade una factura adicional por este importe; las demás no cambian.</small></span></label>
      </fieldset>
      <label class="field">Motivo <textarea v-model="borrador.motivo" rows="2" /></label>
      <div class="bd-borrador-acciones">
        <span class="muted">Coste {{ conSignoEur(dCoste) }} · Presupuesto {{ conSignoEur(dVenta) }} · Beneficio {{ conSignoEur(dBeneficio) }}</span>
        <button type="button" class="secondary" :disabled="ocupado" @click="borrador = null">Cancelar</button>
        <button type="button" :disabled="ocupado" @click="guardarBorrador">Guardar como cambio</button>
      </div>
    </div>

    <table v-if="vista.per_change.length > 0" class="bd-tabla bd-por-cambio">
      <thead><tr><th>Cambio</th><th class="num">Coste</th><th class="num">Presupuesto</th><th class="num">Beneficio</th></tr></thead>
      <tbody>
        <tr v-for="c in vista.per_change" :key="c.id">
          <td><strong>C{{ c.number }}</strong> <span class="muted">· {{ cambioDe(c.id) ? cambioDe(c.id).date : '' }}</span><div class="bd-sub">{{ cambioDe(c.id) ? cambioDe(c.id).reason : '' }}</div></td>
          <td class="num" :class="tono(-c.cost_delta)">{{ conSignoEur(c.cost_delta) }}</td>
          <td class="num" :class="tono(c.budget_delta)">{{ conSignoEur(c.budget_delta) }}</td>
          <td class="num" :class="tono(c.profit_delta)">{{ conSignoEur(c.profit_delta) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script>
import CampoNumerico from '../Presupuestos/CampoNumerico.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { latestLocal, budgetName } from '@/utils/planificador/almacenPresupuestos'
import { eur, lineTotal, newLine, pct } from '@/utils/planificador/motor/costes'
import { todayStr } from '@/utils/planificador/tareas/fechas'
import { baseDesdePresupuestador, cantidadDeBorrador, construirCambio, crearBorrador, gruposOrdenados, lineaNueva, totalesDeBorrador } from '@/utils/planificador/contratos/variacionPresupuesto'

const cant = (n) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(n)
const redondear2 = (n) => Math.round(n * 100) / 100
const redondear3 = (n) => Math.round(n * 1000) / 1000

// Presupuesto del proyecto con los cambios aplicados: por cada línea, lo inicial, lo que han variado los cambios y lo vigente. Un
// cambio se redacta editando las cantidades en la propia lista; al guardarlo se calcula cuántas unidades se añaden o se quitan.
export default {
  name: 'Presupuesto-Cambios-Component',
  components: { CampoNumerico },
  props: {
    proyectoId: { type: String, required: true },
    contrato: { type: Object, required: true },
    // Los cambios ya registrados, tal y como se vuelven a enviar al guardar (para no perder ninguno)
    cambiosGuardados: { type: Array, required: true },
    alGuardarCambios: { type: Function, required: true }
  },
  data() { return { vista: null, catalogo: null, error: null, soloCambiado: false, borrador: null, ocupado: false, categoria: '', busqueda: '' } },
  computed: {
    t() { return totalesDeBorrador(this.vista, this.borrador) },
    dCoste() { return this.borrador ? this.t.dCoste : redondear2(this.vista.current.cost - this.vista.initial.cost) },
    dVenta() { return this.borrador ? this.t.dVenta : redondear2(this.vista.current.budget - this.vista.initial.budget) },
    dBeneficio() { return this.borrador ? redondear2(this.t.dVenta - this.t.dCoste) : redondear2(this.vista.current.profit - this.vista.initial.profit) },
    impactoFinal() { return this.borrador ? (this.borrador.impacto ?? this.t.dVenta) : 0 },
    filas() { return this.soloCambiado ? this.vista.lines.filter((l) => l.delta !== 0 || l.added) : this.vista.lines },
    grupos() { return gruposOrdenados(this.filas, this.catalogo ? this.catalogo.partidas : null) },
    nombresPartida() { return new Map((this.catalogo ? this.catalogo.partidas : []).map((p) => [p.key, p.label])) },
    encontrados() {
      if (!this.catalogo) return []
      const aguja = this.busqueda.trim().toLowerCase()
      if (this.categoria === '' && aguja === '') return []
      return this.catalogo.items.filter((i) => (this.categoria === '' || i.category === this.categoria) && (aguja === '' || (i.brand + ' ' + i.model).toLowerCase().includes(aguja))).slice(0, 8)
    }
  },
  watch: {
    // El contrato cambia de objeto tras cada cambio guardado: el presupuesto se vuelve a pedir
    contrato: { immediate: true, handler() { this.cargar() } }
  },
  mounted() { planificadorApi.catalogo().then((c) => { this.catalogo = c }, () => undefined) },
  methods: {
    eur, pct, redondear2,
    cant,
    conSignoCant: (n) => (n === 0 ? '—' : (n > 0 ? '+' : '−') + cant(Math.abs(n))),
    conSignoEur: (n) => (n === 0 ? '—' : (n > 0 ? '+' : '−') + eur(Math.abs(n))),
    tono: (n) => (n > 0 ? 'bd-plus' : n < 0 ? 'bd-minus' : ''),
    nombrePartida(g) { return this.nombresPartida.get(g) || g },
    filasDe(g) { return this.filas.filter((l) => l.group === g) },
    mostrada(l) { return cantidadDeBorrador(l, this.borrador) },
    delta(l) { return redondear3(this.mostrada(l) - l.initial_qty) },
    sumaGrupo(g) { return this.filasDe(g).reduce((s, l) => s + this.mostrada(l) * l.price, 0) },
    difGrupo(g) { return redondear2(this.sumaGrupo(g) - this.filasDe(g).reduce((s, l) => s + l.initial_total, 0)) },
    cambioDe(id) { return this.contrato.changes.find((c) => c.id === id) },
    async cargar() {
      try { this.vista = await planificadorApi.presupuestoProyecto(this.proyectoId) } catch (e) { this.error = mensajeError(e) }
    },
    empezar() { this.error = null; this.borrador = crearBorrador(this.vista, todayStr()) },
    anadirProducto(item) {
      const etiqueta = ((this.catalogo.categories.find((c) => c.key === item.category) || {}).label) || ''
      this.borrador.nuevas.push(lineaNueva(newLine(item, etiqueta)))
    },
    async guardarInicial() {
      // «El del Presupuestador» es el último presupuesto que se ha tocado en este navegador
      const ultimo = latestLocal()
      const costes = ultimo && ultimo.state
      if (!costes || costes.lines.length === 0) { this.error = 'El Presupuestador está vacío: monta primero la tabla de costes del proyecto.'; return }
      const coste = costes.lines.reduce((s, l) => s + lineTotal(l, costes), 0)
      if (!window.confirm('Se guardará como presupuesto inicial del proyecto el último presupuesto que has tocado en el Presupuestador, «' + budgetName(costes) + '»: ' + costes.lines.length + ' líneas, coste ' + eur(coste) + '.\n\nLos cambios se calcularán sobre él. ¿Continuar?')) return
      this.error = null
      this.ocupado = true
      try {
        await planificadorApi.actualizarProyecto(this.proyectoId, { budget: baseDesdePresupuestador(costes) })
        await this.cargar()
      } catch (e) { this.error = mensajeError(e) } finally { this.ocupado = false }
    },
    async guardarBorrador() {
      const construido = construirCambio(this.vista, this.borrador)
      if (!construido) { this.error = 'No has cambiado ninguna cantidad.'; return }
      if (!this.borrador.motivo.trim()) { this.error = 'Indica el motivo del cambio.'; return }
      this.error = null
      this.ocupado = true
      const impacto = this.borrador.impacto ?? this.t.dVenta
      try {
        await this.alGuardarCambios([...this.cambiosGuardados, {
          date: this.borrador.fecha, reason: this.borrador.motivo.trim(), impact: impacto, set: construido.set, budget: construido.budget,
          payment_mode: impacto > 0 ? this.borrador.modoPago : 'split'
        }])
        this.borrador = null
      } catch (e) { this.error = mensajeError(e) } finally { this.ocupado = false }
    }
  }
}
</script>
