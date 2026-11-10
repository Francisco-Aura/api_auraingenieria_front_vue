<template>
  <section ref="raiz" class="costs-catalog budget-steps" aria-label="Presupuestador por pasos">
    <ol ref="nav" class="steps-nav">
      <li v-for="(s, i) in STEPS" :key="s.key">
        <button type="button" :class="{ current: i === actual, done: hecho(s), locked: !!bloqueo(i) }" :aria-current="i === actual ? 'step' : undefined"
                :aria-disabled="bloqueo(i) ? true : undefined" :title="bloqueo(i) || s.title" @click="ir(i)">
          <span class="step-num">{{ hecho(s) && i !== actual ? '✓' : i + 1 }}</span>
          <span class="step-title">{{ s.short }}</span>
          <span v-if="contar(s) > 0" class="tab-count">{{ contar(s) }}</span>
          <span v-if="avisosDe(s).length > 0" class="step-issues" :class="avisosDe(s).some((x) => x.level === 'error') ? 'bad' : 'warn'"
                :title="avisosDe(s).map((x) => x.message).join('\n')" :aria-label="avisosDe(s).length + ' aviso' + (avisosDe(s).length === 1 ? '' : 's') + ' de compatibilidad'">⚠ {{ avisosDe(s).length }}</span>
        </button>
      </li>
    </ol>

    <div ref="panel" class="step-panel">
      <header class="step-head">
        <span class="step-kicker">Paso {{ actual + 1 }} de {{ STEPS.length }}</span>
        <h2>{{ paso.title }}</h2>
        <ul class="step-help"><li v-for="h in paso.help" :key="h">{{ h }}</li></ul>
      </header>

      <nav v-if="paso.sections.length > 1" ref="pestanas" class="step-sections" aria-label="Secciones de este paso">
        <button v-for="sec in paso.sections" :key="sec.id" type="button" :class="{ on: seccionActiva === sec.id }" :aria-current="seccionActiva === sec.id ? 'true' : undefined" @click="saltarA(sec.id)">
          {{ sec.title || nombreCategoria(sec.category) }}
          <span v-if="contarSeccion(sec, estado, catalogo) > 0" class="step-sections-count" :title="contarSeccion(sec, estado, catalogo) + ' elegido(s) en esta sección'">✓ {{ contarSeccion(sec, estado, catalogo) }}</span>
        </button>
      </nav>

      <!-- Lo que conviene saber en cada paso, según lo elegido antes -->
      <template v-if="paso.key === 'paneles'">
        <div class="fixed-params">
          <ul>
            <li><span class="muted">Potencia a instalar</span> <strong>{{ s.targetKwp > 0 ? kw(s.targetKwp) + ' kWp' : 'sin indicar' }}</strong></li>
            <li><span class="muted">Paneles</span> <strong>{{ estado.moduleCount }} × {{ estado.moduleWp }} Wp</strong></li>
          </ul>
          <button type="button" class="link-btn" @click="$emit('editar-parametros')">Editar parámetros</button>
        </div>
        <p v-if="s.targetKwp > 0" class="step-note info">
          Potencia objetivo <strong>{{ kw(s.targetKwp) }} kWp</strong> ÷ {{ wpPanel }} Wp por panel = <strong>{{ necesarios }} paneles</strong>
          <template v-if="necesarios !== estado.moduleCount"> (ahora hay {{ estado.moduleCount }}) <button type="button" class="link-btn" @click="$emit('cambiar', { moduleCount: necesarios, moduleWp: wpPanel })">Usar {{ necesarios }}</button></template>
        </p>
        <p v-else class="muted">Sin potencia a instalar: edita los parámetros para calcular cuántos paneles hacen falta.</p>
        <table v-if="panel" class="spec-table">
          <caption>Datos técnicos de {{ [panel.brand, panel.model].filter(Boolean).join(' ') }}: se usan para elegir la estructura y el inversor</caption>
          <tbody><tr>
            <th>Voc</th><td>{{ panel.attrs.voc_v ?? '—' }} V</td><th>Isc</th><td>{{ panel.attrs.isc_a ?? '—' }} A</td>
            <th>Vmp</th><td>{{ panel.attrs.vmp_v ?? '—' }} V</td><th>Imp</th><td>{{ panel.attrs.imp_a ?? '—' }} A</td>
            <th>Dimensiones</th><td>{{ panel.attrs.largo_mm ?? '—' }} × {{ panel.attrs.ancho_mm ?? '—' }} mm</td>
          </tr></tbody>
        </table>
        <p v-else class="muted">Elige un panel para ver sus datos técnicos.</p>
        <p class="muted">Los datos técnicos son orientativos: confírmalos con la ficha del fabricante.</p>
      </template>

      <template v-else-if="paso.key === 'estructura'">
        <div class="fixed-params">
          <ul><li><span class="muted">Cubierta</span> <strong>{{ ROOF_LABEL[s.roof] }}</strong></li></ul>
          <button type="button" class="link-btn" @click="$emit('editar-parametros')">Editar parámetros</button>
        </div>
        <p class="step-note info">Se enseña lo adecuado para cubierta {{ ROOF_LABEL[s.roof].toLowerCase() }}<template v-if="panel"> · paneles de {{ panel.attrs.largo_mm ?? '—' }} × {{ panel.attrs.ancho_mm ?? '—' }} mm, {{ estado.moduleCount }} unidades</template>.</p>
      </template>

      <template v-else-if="paso.key === 'inversor'">
        <p class="step-note info">
          Paneles: <strong>{{ estado.moduleCount }} × {{ estado.moduleWp }} Wp = {{ kw(kwpPaneles) }} kWp</strong>
          <template v-if="kwpPaneles < 3"> · Con pocas placas o muchas sombras, mira también los microinversores y optimizadores (filtro «Tipo»).</template>
        </p>
        <div class="fixed-params">
          <ul>
            <li><span class="muted">Suministro</span> <strong>{{ SUMINISTRO[s.supply] }}</strong></li>
            <li><span class="muted">Baterías en el futuro</span> <strong>{{ s.futureBattery ? 'Sí (elegir un inversor híbrido)' : 'No' }}</strong></li>
          </ul>
          <button type="button" class="link-btn" @click="$emit('editar-parametros')">Editar parámetros</button>
        </div>
        <template v-if="inversor">
          <p v-if="kwInversor > 0" class="step-note" :class="relacion >= 0.9 && relacion <= 1.35 ? 'ok' : 'warn'">
            Inversor de <strong>{{ kw(kwInversor) }} kW</strong> para {{ kw(kwpPaneles) }} kWp de paneles (relación {{ relacion.toLocaleString('es-ES', { maximumFractionDigits: 2 }) }}).
            {{ relacion < 0.9 ? 'El inversor es bastante mayor que los paneles.' : relacion > 1.35 ? 'El inversor queda corto para esta potencia de paneles.' : 'Es una relación habitual (el inversor algo por debajo o similar a los paneles).' }}
          </p>
          <template v-if="conStrings && panel">
            <p v-if="plan" class="step-note info">Strings: de <strong>{{ plan.min }}</strong> a <strong>{{ plan.max }}</strong> paneles en serie (con el voltaje de invierno incluido).</p>
            <p v-else class="muted">Sin datos técnicos suficientes de este panel o inversor para comprobar las tensiones de los strings: puedes repartirlos igualmente.</p>
            <template v-if="plan && plan.length === null"><p v-for="t in plan.problems" :key="t" class="step-note warn">{{ t }}</p></template>
            <disenador-strings :estado="estado" :panel="panel" :inversor="inversor" :unidades="unidadesInversor" @cambio="$emit('cambiar', { strings: $event })" />
          </template>
          <p v-else class="muted">{{ conStrings ? 'Elige un panel para diseñar los strings.' : 'Con microinversores u optimizadores no hay strings: cada panel va a su unidad.' }}</p>
          <p class="muted">Comprueba siempre los límites con la ficha del fabricante.</p>
        </template>
        <template v-else>
          <p class="muted">Elige un inversor para comprobar su potencia y los strings.</p>
          <p v-if="(estado.strings || []).length === 0" class="muted">Diseña abajo los strings y aquí verás los inversores que los admiten.</p>
          <p v-else-if="!panel" class="muted">Elige primero el panel para saber qué inversores admiten tus strings.</p>
          <p v-else-if="compatibles.length === 0" class="step-note warn">Ningún inversor del inventario admite estos strings ({{ resumenStrings(estado.strings) }}) con este panel: cambia los strings abajo.</p>
          <p v-else class="step-note info">
            Admiten tus strings ({{ resumenStrings(estado.strings) }}):
            {{ compatibles.slice(0, 3).map((c) => [c.item.brand, c.item.model].filter(Boolean).join(' ') + (c.units > 1 ? ' (' + c.units + ' uds.)' : '')).join(' · ') }}{{ compatibles.length > 3 ? ' y ' + (compatibles.length - 3) + ' más' : '' }}.
          </p>
          <disenador-strings :estado="estado" :panel="panel || null" :inversor="null" :unidades="1" @cambio="$emit('cambiar', { strings: $event })" />
        </template>
      </template>

      <template v-else-if="paso.key === 'baterias'">
        <p v-if="inversor" class="muted">Se compara cada batería con el inversor elegido: {{ [inversor.brand, inversor.model].filter(Boolean).join(' ') }}.</p>
        <p v-else class="step-note warn">Aún no hay inversor elegido (paso anterior): no se puede comprobar la compatibilidad.</p>
      </template>

      <template v-else-if="paso.key === 'cableado_cc'">
        <div class="fixed-params">
          <ul><li><span class="muted">Cable por polaridad (rojo y negro)</span> <strong>{{ s.cableMeters > 0 ? kw(s.cableMeters) + ' m' : 'sin indicar' }}</strong></li></ul>
          <button type="button" class="link-btn" @click="$emit('editar-parametros')">Editar parámetros</button>
        </div>
        <p v-if="s.cableMeters > 0" class="step-note info">Con un margen del {{ Math.round(CABLE_MARGIN * 100) }} %: <strong>{{ withMargin(s.cableMeters) }} m de rojo y {{ withMargin(s.cableMeters) }} m de negro</strong>. Al añadir un cable se pone ya esa cantidad.</p>
        <p v-else class="muted">Sin metros indicados: edita los parámetros para que al añadir el cable se calcule la cantidad con su margen.</p>
        <p v-if="estado.moduleCount > 0" class="muted">Los conectores MC4 van por pares: unos {{ Math.ceil(estado.moduleCount / 6) * 2 + 2 }} pares como mínimo para {{ estado.moduleCount }} paneles.</p>
        <p v-if="inversor" class="step-note" :class="String(inversor.attrs.prot_cc ?? '') === 'Sí' ? 'warn' : 'info'">
          Protecciones de continua · {{ [inversor.brand, inversor.model].filter(Boolean).join(' ') }}:
          {{ String(inversor.attrs.prot_cc ?? '') === 'Sí' ? 'lleva ya protecciones y seccionador en continua integrados: revisa la ficha antes de duplicarlos.'
            : String(inversor.attrs.prot_cc ?? '') === 'No' ? 'no lleva protecciones en continua integradas: hacen falta fusibles, seccionador y DPS.'
            : 'sin dato de protecciones integradas: revisa la ficha del fabricante.' }}
        </p>
        <p v-else class="muted">Elige un inversor (paso Inversor) para saber qué protecciones de continua lleva ya integradas.</p>
        <template v-if="cobertura">
          <p class="step-note info">
            Fusibles de string: {{ FUSES_PER_STRING }} por string (positivo y negativo), <strong>{{ cobertura.need.quantity }} unidades</strong> para {{ cobertura.need.strings }} string{{ cobertura.need.strings === 1 ? '' : 's' }}
            <template v-if="cobertura.need.minAmps !== null && cobertura.need.maxAmps !== null">, de {{ Math.ceil(cobertura.need.minAmps) }} a {{ Math.floor(cobertura.need.maxAmps) }} A</template>
            <template v-if="cobertura.need.minVolts !== null"> y al menos {{ Math.ceil(cobertura.need.minVolts) }} V</template>. Al añadirlos se pone ya esa cantidad.
          </p>
          <p v-if="cobertura.missing.length > 0" class="step-note warn">Falta en el inventario para cubrirlos: {{ cobertura.missing.join(' · ') }}. Dalo de alta en el Inventario (categoría Protecciones, con su «Elemento» y sus características) y saldrá aquí como sugerido.</p>
        </template>
      </template>

      <template v-else-if="paso.key === 'alterna'">
        <div class="fixed-params">
          <ul><li><span class="muted">Cable de alterna (inversor → cuadro general)</span> <strong>{{ s.acMeters > 0 ? kw(s.acMeters) + ' m' : 'sin indicar' }}</strong></li></ul>
          <button type="button" class="link-btn" @click="$emit('editar-parametros')">Editar parámetros</button>
        </div>
        <p v-if="s.acMeters > 0" class="step-note info">Con un margen del {{ Math.round(CABLE_MARGIN * 100) }} %: <strong>{{ withMargin(s.acMeters) }} m</strong>.</p>
      </template>

      <seccion-catalogo
        v-for="sec in paso.sections" :key="sec.id" :seccion="sec" :catalogo="catalogo" :estado="estado" :filtro-defecto="filtroPorDefecto(sec, s)" :inversor="inversor || null"
        :avisos="avisosPorProducto" :conflictos="conflictos" :sugeridos="sugeridos.get(sec.id) || []"
        @anadir="$emit('anadir', $event)" @quitar="$emit('quitar', $event)" @ficha="$emit('ficha', $event)"
      />

      <!-- Siempre a la vista: se elige y se sigue sin volver a subir a la barra de pasos -->
      <div class="step-bar">
        <nav class="step-nav-buttons" aria-label="Cambiar de paso">
          <button type="button" class="secondary" :disabled="actual === 0" @click="actual--">← Anterior</button>
          <span class="step-count">Paso {{ actual + 1 }} de {{ STEPS.length }} · <strong v-if="contar(paso) > 0">{{ contar(paso) }} elegido{{ contar(paso) === 1 ? '' : 's' }}</strong><template v-else>nada elegido</template></span>
          <button v-if="actual < STEPS.length - 1" type="button" :class="{ secondary: !hecho(paso) }" :disabled="siguienteBloqueado !== null" :title="siguienteBloqueado || undefined" @click="actual++">
            {{ hecho(paso) ? 'Siguiente: ' + STEPS[actual + 1].title + ' →' : 'Saltar este paso →' }}
          </button>
          <span v-else class="muted">Último paso: revisa el presupuesto a la derecha.</span>
        </nav>
      </div>
    </div>
  </section>
</template>

<script>
import SeccionCatalogo from './SeccionCatalogo.vue'
import DisenadorStrings from './DisenadorStrings.vue'
import { CABLE_MARGIN, ROOF_LABEL, STEPS, panelCount, stringPlan, withMargin } from '@/utils/planificador/motor/pasosConfig'
import { FUSES_PER_STRING, fuseCoverage } from '@/utils/planificador/motor/protecciones'
import { issuesByItem } from '@/utils/planificador/motor/compatibilidad'
import {
  conflictosDelPaso, contarPaso, contarSeccion, elegidos, filtroPorDefecto, guardarPaso, inversoresCompatibles, motivoBloqueo, pasoGuardado, pasoHecho,
  resumenStrings, sugeridosDelPaso, unidadesDeInversor
} from '@/utils/planificador/pasos'

const SUMINISTRO = { '': 'Sin decidir', monofasico: 'Monofásico', trifasico: 'Trifásico' }

// El presupuestador por pasos: cada paso explica qué hay que decidir y enseña solo lo del catálogo que viene al caso, con lo
// elegido en los pasos anteriores a la vista.
export default {
  name: 'Pasos-Presupuesto',
  components: { SeccionCatalogo, DisenadorStrings },
  props: {
    catalogo: { type: Object, required: true },
    estado: { type: Object, required: true },
    // Avisos de compatibilidad del presupuesto
    avisos: { type: Array, default: () => [] },
    // Para recordar el paso de cada presupuesto por separado
    presupuestoId: { type: String, required: true }
  },
  emits: ['cambiar', 'anadir', 'quitar', 'ficha', 'editar-parametros'],
  data() {
    return {
      STEPS, ROOF_LABEL, SUMINISTRO, CABLE_MARGIN, FUSES_PER_STRING, actual: 0, seccionActiva: '', listo: false
    }
  },
  computed: {
    paso() { return STEPS[this.actual] },
    s() { return this.estado.survey },
    panel() { return elegidos(this.estado, this.catalogo, 'modulos')[0] },
    inversor() { return elegidos(this.estado, this.catalogo, 'inversores')[0] },
    wpPanel() { return this.panel ? Number(this.panel.attrs.potencia_wp) : this.estado.moduleWp },
    necesarios() { return panelCount(this.s.targetKwp, this.wpPanel) },
    kwpPaneles() { return (this.estado.moduleWp * this.estado.moduleCount) / 1000 },
    kwInversor() { return this.inversor ? Number(this.inversor.attrs.potencia_kw) : 0 },
    relacion() { return this.kwInversor > 0 ? this.kwpPaneles / this.kwInversor : 0 },
    unidadesInversor() { return unidadesDeInversor(this.estado, this.inversor) },
    // Con microinversores u optimizadores no hay strings
    conStrings() { return !!this.inversor && !['Microinversor', 'Optimizador'].includes(String(this.inversor.attrs.tipo ?? '')) },
    plan() { return this.panel && this.inversor ? stringPlan(this.panel, this.inversor, this.estado.moduleCount, this.unidadesInversor) : null },
    compatibles() { return inversoresCompatibles(this.estado, this.panel, this.catalogo) },
    cobertura() { return fuseCoverage(this.estado, this.catalogo) },
    avisosPorProducto() { return issuesByItem(this.avisos, this.estado) },
    // Los sugeridos y lo incompatible se calculan con lo elegido hasta este paso
    sugeridos() { return sugeridosDelPaso(this.estado, this.catalogo, this.actual) },
    conflictos() { return conflictosDelPaso(this.estado, this.catalogo, this.actual) },
    siguienteBloqueado() { return this.actual < STEPS.length - 1 ? motivoBloqueo(this.actual + 1, this.estado, this.catalogo) : null }
  },
  watch: {
    actual(n) {
      if (!this.listo) return
      guardarPaso(this.presupuestoId, n)
      // Al cambiar de paso se vuelve al principio del paso, no se queda a media tabla del anterior
      this.$nextTick(() => this.$refs.panel && this.$refs.panel.scrollIntoView({ block: 'start' }))
      this.seccionActiva = STEPS[n].sections[0].id
    }
  },
  created() {
    // El paso por el que se iba se recuerda en este navegador; si ya no se puede abrir (p. ej. se vació el presupuesto y depende
    // de otro), se empieza por el primero
    const guardado = pasoGuardado(this.presupuestoId)
    this.actual = guardado > 0 && motivoBloqueo(guardado, this.estado, this.catalogo) ? 0 : guardado
    this.seccionActiva = STEPS[this.actual].sections[0].id
  },
  mounted() {
    this.listo = true
    window.addEventListener('scroll', this.alDesplazar, { passive: true })
  },
  beforeUnmount() { window.removeEventListener('scroll', this.alDesplazar) },
  methods: {
    kw(n) { return n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) },
    withMargin, resumenStrings, filtroPorDefecto, contarSeccion,
    hecho(paso) { return pasoHecho(paso, this.estado, this.catalogo) },
    contar(paso) { return contarPaso(paso, this.estado, this.catalogo) },
    bloqueo(i) { return i !== this.actual ? motivoBloqueo(i, this.estado, this.catalogo) : null },
    avisosDe(paso) { return this.avisos.filter((x) => x.step === paso.key) },
    nombreCategoria(clave) { const c = this.catalogo.categories.find((x) => x.key === clave); return c ? c.label : clave },
    ir(i) { if (!this.bloqueo(i)) this.actual = i },
    saltarA(id) {
      this.seccionActiva = id
      const el = document.getElementById('seccion-' + id)
      if (el) el.scrollIntoView({ block: 'start' })
    },
    // Resalta la sección que se está viendo (el inversor, el medidor y la monitorización comparten paso y la página es larga)
    alDesplazar() {
      if (this.paso.sections.length < 2) return
      const limite = ((this.$refs.nav && this.$refs.nav.offsetHeight) || 0) + ((this.$refs.pestanas && this.$refs.pestanas.offsetHeight) || 0) + 40
      let activa = this.paso.sections[0].id
      for (const sec of this.paso.sections) {
        const el = document.getElementById('seccion-' + sec.id)
        if (el && el.getBoundingClientRect().top <= limite) activa = sec.id
      }
      this.seccionActiva = activa
    }
  }
}
</script>
