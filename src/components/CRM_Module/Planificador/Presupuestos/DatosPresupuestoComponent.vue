<template>
  <div class="costs budget-setup">
    <div class="back-row">
      <button type="button" class="secondary" @click="$emit('cancelar')">{{ modo === 'nuevo' ? '← Volver al listado' : '← Volver al presupuesto' }}</button>
    </div>
    <div class="costs-title"><h1>{{ modo === 'nuevo' ? 'Nuevo presupuesto' : 'Parámetros del presupuesto' }}</h1></div>
    <p class="muted setup-lead">
      {{ modo === 'nuevo'
        ? 'Estos datos se fijan al empezar y condicionan todos los pasos: la estructura, el inversor, las baterías y los cables se calculan a partir de ellos.'
        : 'Cambiar estos datos recalcula las cantidades que siguen al número de paneles y vuelve a comprobar la compatibilidad de lo ya elegido.' }}
    </p>

    <form class="setup-form" novalidate @submit.prevent="enviar">
      <fieldset class="setup-card">
        <legend>Cliente</legend>
        <selector-cliente v-model="v.customer" :nombre-sugerido="inicio.client" :invalido="intentado && !v.customer" />
        <label class="survey-field wide">
          Nombre del proyecto
          <input v-model="v.reference" list="proyectos-del-cliente" placeholder="Ej.: Nave 2, fotovoltaica" maxlength="80" autocomplete="off">
          <datalist id="proyectos-del-cliente"><option v-for="p in proyectosSugeridos" :key="p" :value="p" /></datalist>
          <span class="muted field-hint">
            Los presupuestos del mismo cliente con el mismo nombre de proyecto son versiones unos de otros (v1, v2…):
            {{ proyectosSugeridos.length > 0 ? 'elige uno de los que ya tiene para no escribirlo distinto.' : 'escríbelo igual en todos.' }}
          </span>
        </label>
      </fieldset>

      <fieldset class="setup-card">
        <legend>Instalación</legend>
        <div class="survey-row">
          <label class="survey-field">Potencia que se quiere instalar (kWp) <campo-numerico v-model="v.targetKwp" etiqueta="Potencia a instalar en kWp" :paso="0.1" /></label>
          <label class="survey-field">
            Potencia de cada panel (Wp) <campo-numerico v-model="v.moduleWp" etiqueta="Potencia de cada panel en Wp" :paso="5" />
            <span class="muted field-hint">Se actualiza al elegir el panel</span>
          </label>
          <label class="survey-field">
            Nº de paneles
            <campo-numerico :model-value="cuenta" etiqueta="Número de paneles" @update:model-value="v.moduleCount = Math.round($event); v.manualPanels = true" />
            <span class="muted field-hint">{{ v.manualPanels ? 'Puesto a mano' : 'Se calcula: kWp ÷ Wp del panel' }}</span>
          </label>
        </div>
        <p v-if="cuenta > 0 && v.moduleWp > 0" class="step-note info setup-note">
          {{ cuenta }} paneles de {{ v.moduleWp }} Wp = <strong>{{ kw(kwpReales) }} kWp</strong>
          <template v-if="v.manualPanels && auto > 0 && auto !== cuenta">
            (para {{ kw(v.targetKwp) }} kWp saldrían {{ auto }}) <button type="button" class="link-btn" @click="v.manualPanels = false">Usar {{ auto }}</button>
          </template>
        </p>
        <div class="survey-row">
          <label class="survey-field">
            Tipo de cubierta
            <select v-model="v.roof"><option value="teja">Teja</option><option value="chapa">Chapa</option><option value="plana">Plana</option><option value="suelo">Suelo</option></select>
          </label>
          <label class="survey-field">
            Suministro eléctrico del cliente
            <select v-model="v.supply"><option value="">Sin decidir</option><option value="monofasico">Monofásico</option><option value="trifasico">Trifásico</option></select>
          </label>
        </div>
      </fieldset>

      <fieldset v-if="cuenta >= 1 && !sinStrings" class="setup-card">
        <legend>Strings</legend>
        <disenador-strings :estado="estadoStrings" :panel="ctxStrings && ctxStrings.panel" :inversor="ctxStrings && ctxStrings.inverter"
                           :unidades="ctxStrings ? ctxStrings.units : 1" :grupos="ctxStrings ? ctxStrings.groups : null" @cambio="v.strings = $event" />
      </fieldset>

      <fieldset class="setup-card">
        <legend>Venta</legend>
        <div class="survey-row">
          <label class="survey-field">
            Precio de venta (€/Wp) <campo-numerico v-model="v.saleRatio" etiqueta="Precio de venta en euros por Wp" :paso="0.01" />
            <span class="muted field-hint">Después se puede ajustar viendo el beneficio</span>
          </label>
        </div>
      </fieldset>

      <div v-if="intentado && problemas.length > 0" class="setup-problems" role="alert"><p v-for="p in problemas" :key="p">{{ p }}</p></div>
      <div class="setup-actions">
        <button type="submit">{{ modo === 'nuevo' ? 'Crear presupuesto' : 'Guardar parámetros' }}</button>
        <button type="button" class="secondary" @click="$emit('cancelar')">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script>
import SelectorCliente from './SelectorCliente.vue'
import DisenadorStrings from './DisenadorStrings.vue'
import CampoNumerico from './CampoNumerico.vue'
import { planificadorApi } from '@/services/planificadorApi'
import { panelCount } from '@/utils/planificador/motor/pasosConfig'
import { EMPTY_COSTS, EMPTY_SURVEY } from '@/utils/planificador/motor/costes'
import { stringContext } from '@/utils/planificador/motor/compatibilidad'
import { spreadPanels, spreadStrings } from '@/utils/planificador/motor/strings'
import { valoresDe, cuantosPaneles, aplicarValores, problemasDe } from '@/utils/planificador/datosPresupuesto'
import { budgetName, listLocal } from '@/utils/planificador/almacenPresupuestos'
import { proyectosDeCliente } from '@/utils/planificador/proyectos'

// Datos de partida del presupuesto: el cliente, la potencia a instalar, el panel, el suministro, la cubierta, los strings y el
// precio de venta. Se piden al crear el presupuesto (y se pueden cambiar con «Editar parámetros»): los pasos ya no los preguntan.
export default {
  name: 'Datos-Presupuesto-Component',
  components: { SelectorCliente, DisenadorStrings, CampoNumerico },
  props: {
    // Presupuesto del que se parte (al editar, el que se está haciendo; al crear, uno vacío)
    base: { type: Object, default: null },
    modo: { type: String, default: 'nuevo' }
  },
  emits: ['enviar', 'cancelar'],
  data() {
    const inicio = this.base || { ...EMPTY_COSTS, survey: EMPTY_SURVEY }
    // nombresExistentes: los nombres de los presupuestos que ya hay (de este navegador y del servidor), para sugerir los proyectos del cliente
    return { inicio, v: valoresDe(inicio), intentado: false, catalogo: null, nombresExistentes: [] }
  },
  computed: {
    proyectosSugeridos() { return proyectosDeCliente(this.v.customer && this.v.customer.name, this.nombresExistentes) },
    auto() { return panelCount(this.v.targetKwp, this.v.moduleWp) },
    cuenta() { return cuantosPaneles(this.v) },
    kwpReales() { return (this.v.moduleWp * this.cuenta) / 1000 },
    estadoStrings() { return { ...this.inicio, strings: this.v.strings, moduleCount: this.cuenta } },
    // El inventario sirve para el diseño de strings: con panel e inversor elegidos se comprueba con ellos y, si no, el reparto es libre
    ctxStrings() { return this.catalogo ? stringContext(this.estadoStrings, this.catalogo) : null },
    // Con microinversores u optimizadores no hay strings que diseñar
    sinStrings() {
      if (!this.catalogo) return false
      return this.inicio.lines.some((l) => {
        const i = this.catalogo.items.find((x) => x.id === l.itemId)
        return i && i.category === 'inversores' && ['Microinversor', 'Optimizador'].includes(String(i.attrs.tipo ?? '').trim())
      })
    },
    problemas() { return problemasDe(this.v, this.cuenta) }
  },
  watch: {
    // Si cambian los paneles (potencia, panel o número) y ya hay strings repartidos, se reparten de nuevo entre los mismos strings
    cuenta(n) {
      const diseno = this.v.strings
      if (!diseno || diseno.length === 0 || n <= 0) return
      if (diseno.reduce((s, x) => s + (x.panels > 0 ? x.panels : 0), 0) === n) return
      this.v.strings = this.ctxStrings ? spreadStrings(diseno, this.ctxStrings) : spreadPanels(diseno, n)
    }
  },
  mounted() {
    planificadorApi.catalogo().then((c) => { this.catalogo = c }, () => undefined)
    this.nombresExistentes = listLocal().map((l) => budgetName(l.state))
    planificadorApi.presupuestos().then((lista) => { this.nombresExistentes = [...this.nombresExistentes, ...lista.map((b) => b.name)] }, () => undefined)
  },
  methods: {
    kw(n) { return n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) },
    enviar() {
      this.intentado = true
      if (this.problemas.length > 0) return
      this.$emit('enviar', aplicarValores(this.inicio, this.v))
    }
  }
}
</script>
