<template>
  <section class="string-designer" aria-label="Diseño de los strings">
    <header class="string-head">
      <h3>
        <button type="button" class="string-toggle" :aria-expanded="abierto" :title="abierto ? 'Plegar el diseño de strings' : 'Desplegar el diseño de strings'" @click="abierto = !abierto">
          <span aria-hidden="true">{{ abierto ? '▾' : '▸' }}</span> Diseño de strings
        </button>
      </h3>
      <span class="tag state" :class="creado ? 'borrador' : 'local'" :title="creado ? 'Hay strings creados: cambia lo que quieras a mano' : 'Indica cuántos strings quieres crear'">
        {{ creado ? 'Repartido' : 'Sin repartir' }}
      </span>
      <span v-if="!abierto" class="muted string-summary">
        {{ creado ? diseno.length + ' string' + (diseno.length === 1 ? '' : 's') + ' · ' + total + ' de ' + objetivo + ' paneles' : 'sin strings' }}{{ hayProblemas ? ' · ⛔ revisar' : '' }}
      </span>
    </header>
    <template v-if="abierto">
    <p v-if="informe" class="muted string-help">
      {{ informe.limits ? 'Entre ' + informe.limits.min + ' y ' + informe.limits.max + ' paneles por string con este panel y este inversor.' : 'Faltan datos técnicos para comprobar las tensiones.' }}
      {{ variosModelos ? 'Los inversores tienen' : 'El inversor tiene' }} {{ informe.inputsAvailable }} entrada{{ informe.inputsAvailable === 1 ? '' : 's' }}{{ variosModelos ? ' en total (' + nombresModelos + ')' : unidades > 1 ? ' (' + unidades + ' inversores)' : '' }}:
      los strings de una misma entrada tienen que ser iguales.
    </p>
    <p class="string-clamps" role="status">
      <template v-if="grapas.rows > 0">
        Grapas de la estructura: <strong>{{ fmt(grapas.finals) }} finales</strong> y <strong>{{ fmt(grapas.intermediates) }} intermedias</strong>
        <span class="muted"> ({{ fmt(grapas.rows) }} fila{{ grapas.rows === 1 ? '' : 's' }} de paneles, con dos raíles por fila; un string partida son varias filas)</span>
      </template>
      <span v-else class="muted">Crea los strings para saber cuántas grapas hacen falta.</span>
    </p>

    <label class="string-count">
      ¿Cuántos strings quieres crear?
      <campo-numerico :model-value="diseno.length" etiqueta="Número de strings" @update:model-value="fijarCantidad" @fin="ajustarCantidad" />
    </label>
    <p v-if="rango" class="string-range muted" :class="{ bad: fueraDeRango }" role="status">
      Con {{ fmt(rango.total) }} paneles hacen falta entre <strong>{{ rango.min }}</strong> y <strong>{{ rango.max }}</strong> strings
      (de {{ rango.perMin }} a {{ rango.perMax }} paneles cada uno).
    </p>
    <p v-else-if="objetivo > 0" class="string-range bad" role="status">
      Con {{ fmt(objetivo) }} paneles no se puede formar ningún string válido: revisa los paneles del presupuesto.
    </p>

    <div class="strings-wrap">
      <table class="strings-table">
        <thead>
          <tr>
            <th>String</th>
            <th>Paneles</th>
            <th title="Un string partida es uno solo eléctricamente, pero sus paneles van en tramos separados (por ejemplo, 6 y 6): cada corte necesita más grapas">Tipo</th>
            <th v-if="informe">Entrada del inversor</th>
            <th v-if="informe" title="Los paneles dan más tensión cuando hace frío y menos cuando hace calor: el inversor tiene que aguantar la máxima y arrancar con la mínima">Tensión del string</th>
            <th v-if="informe">Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in diseno" :key="s.id" :class="{ bad: malo(i, s) }">
            <td><strong>{{ i + 1 }}</strong></td>
            <td><campo-numerico :model-value="s.panels" :etiqueta="'Paneles del string ' + (i + 1)" @update:model-value="cambiar(s.id, { panels: Math.round($event) })" /></td>
            <td>
              <select :aria-label="'Tipo del string ' + (i + 1)" :value="s.parts && s.parts > 1 ? s.parts : 1"
                      @change="cambiar(s.id, { parts: Number($event.target.value) > 1 ? Number($event.target.value) : undefined })">
                <option :value="1">Normal</option>
                <option :value="2">Partida en 2 tramos</option>
                <option :value="3">Partida en 3 tramos</option>
                <option :value="4">Partida en 4 tramos</option>
              </select>
              <span v-if="s.parts && s.parts > 1 && s.panels > 0" class="muted split-note">{{ partido(s.panels, s.parts) }}</span>
            </td>
            <template v-if="informe && informe.strings[i]">
              <td>
                <select :aria-label="'Entrada del string ' + (i + 1)" :value="s.input" @change="cambiar(s.id, { input: Number($event.target.value) })">
                  <option :value="0">Sin asignar</option>
                  <option v-for="k in Math.max(informe.inputsAvailable, s.input)" :key="k" :value="k">{{ etiquetaEntrada(k) }}</option>
                </select>
              </td>
              <td class="string-volts">
                <template v-if="informe.strings[i].vocCold !== null">
                  <span title="La tensión más alta que verá el inversor (el día más frío del año): no puede pasar de su tensión máxima de entrada">máx. {{ fmt(informe.strings[i].vocCold) }} V</span>
                  <span class="muted" title="La más baja (el día más caluroso): tiene que llegar al arranque del inversor">{{ informe.strings[i].vmpHot !== null ? 'mín. ' + fmt(informe.strings[i].vmpHot) + ' V' : '' }}</span>
                </template>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <span v-if="malo(i, s)" class="tag issue bad" :title="problemasDeFila(i, s).join(' ')">⛔ Revisar</span>
                <span v-else class="tag state validado">✓ Válido</span>
              </td>
            </template>
            <td class="string-tools">
              <button v-if="sumar(s) > 0" type="button" class="secondary string-adjust" :title="'Suma a este string los ' + sumar(s) + ' paneles que faltan por repartir'" @click="cambiar(s.id, { panels: s.panels + sumar(s) })">+{{ sumar(s) }}</button>
              <button v-if="quitarN(s) > 0" type="button" class="secondary string-adjust" :title="'Quita de este string los ' + quitarN(s) + ' paneles que sobran'" @click="cambiar(s.id, { panels: s.panels - quitarN(s) })">−{{ quitarN(s) }}</button>
              <button type="button" class="icon-btn trash" title="Quitar el string" :aria-label="'Quitar el string ' + (i + 1)" @click="quitar(s.id)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
              </button>
            </td>
          </tr>
          <tr v-if="diseno.length === 0">
            <td :colspan="informe ? 7 : 4" class="muted">Aún no has repartido los strings: indica arriba cuántos quieres crear.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="string-foot">
      <span class="string-total" :class="!creado ? '' : faltan === 0 ? 'ok' : 'bad'">
        Paneles repartidos: <strong>{{ total }}</strong> de <strong>{{ objetivo }}</strong>
        {{ faltan > 0 ? ' · faltan ' + faltan : faltan < 0 ? ' · sobran ' + (-faltan) : ' ✓' }}
        <span v-if="faltan !== 0 && creado" class="muted"> · usa «{{ faltan > 0 ? '+' : '−' }}N» en un string para {{ faltan > 0 ? 'sumarle lo que falta' : 'quitarle lo que sobra' }}</span>
      </span>
      <div class="string-actions">
        <button v-if="sinAsignar && ctx" type="button" class="secondary" title="Reparte los strings entre las entradas del inversor, sin cambiar sus paneles" @click="$emit('cambio', assignInputs(diseno, totalInputs(ctx)))">Asignar entradas</button>
        <button v-if="hayProblemas && ctx" type="button" class="secondary" title="Cambia los strings por unos que valgan para este panel y este inversor" @click="$emit('cambio', autoStrings(ctx))">Proponer strings para este inversor</button>
        <button type="button" class="secondary" :disabled="!creado || !cambiaReparto" title="Reparte los paneles por igual entre los strings que hay, sin cambiar cuántos son" @click="$emit('cambio', reparto)">Repartir automáticamente</button>
        <button type="button" class="secondary" :disabled="rango && diseno.length >= rango.max" :title="rango && diseno.length >= rango.max ? 'Ya hay el máximo de strings: ' + rango.max : undefined" @click="anadir">+ Añadir string</button>
      </div>
    </footer>

    <p v-if="textoEntradas.length > 0" class="muted string-inputs">{{ textoEntradas.join(' · ') }}</p>
    <ul v-if="informe && informe.strings.some((s) => s.problems.some((m) => !isMissingInput(m)))" class="string-problems" role="alert">
      <li v-for="m in problemasDeStrings" :key="m">{{ m }}</li>
    </ul>
    <ul v-if="otrosProblemas.length > 0" class="string-problems" role="alert">
      <li v-for="m in otrosProblemas" :key="m">{{ m }}</li>
    </ul>
    </template>
  </section>
</template>

<script>
import CampoNumerico from './CampoNumerico.vue'
import { MAX_STRING_PANELS, MIN_STRING_PANELS } from '@/utils/planificador/motor/pasosConfig'
import {
  analyzeStrings, assignInputs, autoStrings, clampTotals, createStrings, inputOwner, newStringId, spreadPanels, spreadStrings, totalInputs
, groupStringProblems, isMissingInput, missingInputsProblem, stringCountRange } from '@/utils/planificador/motor/strings'

// Diseño de los strings del presupuesto: cuántos hay y cuántos paneles lleva cada uno. Mientras no hay inversor elegido es libre;
// al elegir panel e inversor cada string se comprueba contra ellos (tensiones), se le asigna una entrada y cada entrada se comprueba
// contra su corriente. Permite strings de distinto tamaño siempre que vayan a entradas distintas.
export default {
  name: 'Disenador-Strings',
  components: { CampoNumerico },
  props: {
    // Empieza plegado (en el presupuesto abierto; en el formulario de partida, desplegado)
    inicioPlegado: { type: Boolean, default: false },
    // El presupuesto (con sus strings y nº de paneles)
    estado: { type: Object, required: true },
    // El panel y el inversor de strings elegidos; sin alguno de los dos solo se reparten los paneles
    panel: { type: Object, default: null },
    inversor: { type: Object, default: null },
    // Cuántos inversores de este modelo hay en el presupuesto
    unidades: { type: Number, default: 1 },
    // Todos los modelos de inversor de strings del presupuesto con sus unidades ([{ item, units }]); con varios, las entradas se cuentan seguidas
    grupos: { type: Array, default: null }
  },
  emits: ['cambio'],
  data() { return { assignInputs, autoStrings, totalInputs, isMissingInput, abierto: !this.inicioPlegado } },
  computed: {
    diseno() { return this.estado.strings || [] },
    creado() { return this.diseno.length > 0 },
    objetivo() { return Math.round(this.estado.moduleCount) },
    // Con panel e inversor elegidos se comprueba contra ellos; si no, el diseño es libre
    ctx() { return this.panel && this.inversor ? { panel: this.panel, inverter: this.inversor, units: this.unidades, ...(this.grupos && this.grupos.length > 0 ? { groups: this.grupos } : {}), moduleCount: this.estado.moduleCount } : null },
    variosModelos() { return !!this.grupos && this.grupos.length > 1 },
    nombresModelos() { return (this.grupos || []).map((g) => g.units + ' × ' + [g.item.brand, g.item.model].filter(Boolean).join(' ')).join(' + ') },
    informe() { return this.ctx ? analyzeStrings(this.diseno, this.ctx) : null },
    total() { return this.informe ? this.informe.total : this.diseno.reduce((s, x) => s + (x.panels > 0 ? x.panels : 0), 0) },
    faltan() { return this.objetivo - this.total },
    porInversor() { return this.inversor ? Math.max(1, Number(this.inversor.attrs.n_mppt) || 1) : 1 },
    // Reparte los paneles por igual entre los strings que hay (tras añadir o quitar)
    reparto() { return this.ctx ? spreadStrings(this.diseno, this.ctx) : spreadPanels(this.diseno, this.estado.moduleCount) },
    cambiaReparto() { return this.reparto.some((s, i) => s.panels !== this.diseno[i].panels || s.input !== this.diseno[i].input) },
    grapas() { return clampTotals(this.diseno) },
    sinAsignar() { return this.ctx !== null && this.diseno.some((s) => s.input < 1) },
    // Los avisos de «esta entrada no existe» se juntan en uno solo (con muchos strings eran decenas de líneas iguales)
    problemaEntradas() { return this.informe ? missingInputsProblem(this.informe) : null },
    problemasInforme() { return this.informe ? [...this.informe.problems, ...(this.problemaEntradas ? [this.problemaEntradas] : []), ...this.informe.inputs.flatMap((i) => i.problems)] : [] },
    // Sin inversor no se comprueban tensiones, pero el máximo y el mínimo de paneles por string valen siempre
    demasiado() {
      if (this.informe) return []
      return groupStringProblems(this.diseno.flatMap((s, i) => {
        if (s.panels > MAX_STRING_PANELS) return [{ n: i + 1, text: 'Un string no puede llevar más de ' + MAX_STRING_PANELS + ' paneles y este lleva ' + s.panels + '.' }]
        if (s.panels > 0 && s.panels < MIN_STRING_PANELS) return [{ n: i + 1, text: 'Un string no puede llevar menos de ' + MIN_STRING_PANELS + ' paneles y este lleva ' + s.panels + '.' }]
        return []
      }))
    },
    otrosProblemas() { return [...this.problemasInforme, ...this.demasiado] },
    // Los avisos iguales de varios strings se juntan en uno («Strings 1 a 5: …»)
    problemasDeStrings() { return groupStringProblems(this.informe.strings.flatMap((s, i) => s.problems.filter((m) => !isMissingInput(m)).map((m) => ({ n: i + 1, text: m })))) },
    // Cuántos strings caben con estos paneles (y, con inversor, con los límites de tensión de ese panel y ese inversor)
    rango() { return stringCountRange(this.objetivo, this.informe ? this.informe.limits : null) },
    fueraDeRango() { return !!this.rango && this.creado && (this.diseno.length < this.rango.min || this.diseno.length > this.rango.max) },
    hayProblemas() { return !!this.informe && (this.problemasInforme.length > 0 || this.informe.strings.some((s) => s.problems.length > 0)) },
    textoEntradas() {
      return ((this.informe && this.informe.inputs) || []).map((i) => {
        const amperios = i.imp !== null ? ' · ' + this.fmt(i.imp, 1) + ' A' : ''
        return this.etiquetaEntrada(i.input) + ': ' + i.strings + ' string' + (i.strings === 1 ? '' : 's') + amperios
      })
    }
  },
  methods: {
    fmt(n, decimales = 0) { return n.toLocaleString('es-ES', { maximumFractionDigits: decimales }) },
    // «6 + 6» (o «5 + 4 + 4»): cómo quedan repartidos los paneles de un string partida en sus tramos
    partido(paneles, tramos) {
      const base = Math.floor(paneles / tramos)
      const sobran = paneles % tramos
      return Array.from({ length: tramos }, (_, i) => base + (i < sobran ? 1 : 0)).join(' + ')
    },
    etiquetaEntrada(k) {
      if (this.variosModelos && this.ctx) {
        const dueno = inputOwner(this.ctx, k)
        return dueno ? 'Entrada ' + k + ' · inversor ' + dueno.unit + ' (' + [dueno.item.brand, dueno.item.model].filter(Boolean).join(' ') + ')' : 'Entrada ' + k
      }
      return this.unidades > 1 ? 'Entrada ' + k + ' · inversor ' + Math.ceil(k / this.porInversor) : 'Entrada ' + k
    },
    problemasDeFila(i, s) {
      const comprobacion = this.informe && this.informe.strings[i]
      const deEntrada = (this.informe && this.informe.inputs.find((k) => k.input === s.input)) || { problems: [] }
      return comprobacion ? [...comprobacion.problems, ...deEntrada.problems] : []
    },
    malo(i, s) { return this.problemasDeFila(i, s).length > 0 },
    // Lo que sobra o falta para llegar a los paneles del presupuesto se puede pasar a este string de un clic
    sumar(s) {
      const max = (this.informe && this.informe.limits && this.informe.limits.max) || Infinity
      return this.faltan > 0 ? Math.min(this.faltan, Math.max(0, max - s.panels)) : 0
    },
    quitarN(s) { return this.faltan < 0 ? Math.min(-this.faltan, Math.max(0, s.panels - 1)) : 0 },
    cambiar(id, cambios) { this.$emit('cambio', this.diseno.map((s) => (s.id === id ? { ...s, ...cambios } : s))) },
    quitar(id) { this.$emit('cambio', this.diseno.filter((s) => s.id !== id)) },
    // Mientras se escribe solo se tapa por arriba (un «1» camino del «17» no se puede corregir aún); al salir del campo, o con las
    // flechas, también por abajo: no se puede dejar un número de strings con el que sobran paneles por string.
    fijarCantidad(n, ajustar = false) {
      const tope = this.rango ? this.rango.max : 60
      let cuantos = Math.min(Math.max(0, Math.round(n)), tope)
      if (ajustar && this.rango && cuantos > 0) cuantos = Math.max(cuantos, this.rango.min)
      if (cuantos === this.diseno.length) return
      this.$emit('cambio', cuantos === 0 ? null : createStrings(cuantos, this.diseno, this.estado.moduleCount, this.ctx))
    },
    ajustarCantidad() { this.$nextTick(() => { if (this.creado) this.fijarCantidad(this.diseno.length, true) }) },
    anadir() {
      const usadas = new Set(this.diseno.map((s) => s.input))
      const libre = this.ctx ? Array.from({ length: totalInputs(this.ctx) }, (_, i) => i + 1).find((k) => !usadas.has(k)) || 0 : 0
      const quiere = this.faltan > 0 ? this.faltan : (this.informe && this.informe.limits && this.informe.limits.min) || MIN_STRING_PANELS
      const paneles = Math.max(MIN_STRING_PANELS, Math.min(quiere, (this.informe && this.informe.limits && this.informe.limits.max) || MAX_STRING_PANELS))
      this.$emit('cambio', [...this.diseno, { id: newStringId(), panels: paneles, input: libre }])
    }
  }
}
</script>
