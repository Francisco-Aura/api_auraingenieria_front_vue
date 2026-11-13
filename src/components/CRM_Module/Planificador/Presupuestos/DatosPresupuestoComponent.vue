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
        <selector-cliente v-model="v.customer" :nombre-sugerido="inicio.client" :invalido="intentado && !v.customer" :cif-invalido="intentado" />
        <label class="survey-field wide">
          Nombre del proyecto
          <input v-model="v.reference" list="proyectos-del-cliente" placeholder="Ej.: Nave 2, fotovoltaica" maxlength="80" autocomplete="off">
          <datalist id="proyectos-del-cliente"><option v-for="p in proyectosSugeridos" :key="p" :value="p" /></datalist>
          <span class="muted field-hint">
            Los presupuestos del mismo cliente con el mismo nombre de proyecto son versiones unos de otros (v1, v2…):
            {{ proyectosSugeridos.length > 0 ? 'elige uno de los que ya tiene para no escribirlo distinto.' : 'escríbelo igual en todos.' }}
          </span>
        </label>
        <label v-if="!esPotencial" class="survey-field wide">
          CIF de la empresa
          <input v-model="v.cif" :class="{ 'required-empty': intentado && (!v.cif || v.cif.trim().length < 5) }" placeholder="Ej.: B12345678" maxlength="30" autocomplete="off">
          <span class="muted field-hint">Obligatorio: sale en la propuesta que se le entrega al cliente.</span>
        </label>
        <div class="survey-field wide">
          Logo de la empresa
          <div class="proposal-logo">
            <button type="button" class="proposal-logo-box" :class="{ 'required-empty': intentado && !v.clientLogo }" title="Haz clic o arrastra una imagen para subir el logo" @click="$refs.logo.click()" @dragover.prevent @drop.prevent="soltarLogo">
              <img v-if="v.clientLogo" :src="v.clientLogo" alt="Logo de la empresa del cliente">
              <span v-else class="muted">+ Subir logo</span>
            </button>
            <div>
              <span class="muted field-hint">Obligatorio: sale en la propuesta. PNG, JPG, WebP o SVG; haz clic en la caja o arrastra la imagen.</span>
              <button v-if="v.clientLogo" type="button" class="link-btn" @click="v.clientLogo = ''">Quitar el logo</button>
              <p v-if="errorLogo" class="error" role="alert">{{ errorLogo }}</p>
            </div>
            <input ref="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subirLogo">
          </div>
        </div>
        <div class="survey-field wide">
          Encaje de los paneles
          <div class="proposal-logo">
            <button type="button" class="proposal-logo-box proposal-encaje-box" title="Haz clic o arrastra una imagen para subir el encaje" @click="$refs.encaje.click()" @dragover.prevent @drop.prevent="soltarEncaje">
              <img v-if="v.encaje" :src="v.encaje" alt="Encaje de los paneles en el proyecto">
              <span v-else class="muted">+ Subir encaje</span>
            </button>
            <div>
              <span class="muted field-hint">Opcional: la disposición en la que quedarán los paneles en el proyecto. Sale en la propuesta con un marco. PNG, JPG, WebP o SVG; haz clic en la caja o arrastra la imagen.</span>
              <button v-if="v.encaje" type="button" class="link-btn" @click="v.encaje = ''">Quitar el encaje</button>
              <p v-if="errorEncaje" class="error" role="alert">{{ errorEncaje }}</p>
            </div>
            <input ref="encaje" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subirEncaje">
          </div>
        </div>
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
            <select v-model="v.roof">
              <option v-for="k in tiposCubierta" :key="k" :value="k">{{ ROOF_LABEL[k] }}</option>
            </select>
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

      <!-- Barra anclada abajo: el botón de guardar y los avisos de lo que falta se ven siempre, aunque el formulario sea largo -->
      <div class="setup-actions">
        <div v-if="intentado && problemas.length > 0" class="setup-problems" role="alert"><p v-for="p in problemas" :key="p">{{ p }}</p></div>
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
import { prepararLogo, prepararEncaje } from '@/utils/planificador/logo'
import { panelCount, ROOF_LABEL, ROOF_OPTIONS } from '@/utils/planificador/motor/pasosConfig'
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
    return { inicio, v: valoresDe(inicio), intentado: false, catalogo: null, nombresExistentes: [], errorLogo: '', errorEncaje: '', ROOF_LABEL }
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
    // «Chapa» a secas solo sale si el presupuesto ya la tenía (de antes de separar minionda y grecada)
    tiposCubierta() { return this.v.roof && !ROOF_OPTIONS.includes(this.v.roof) ? [this.v.roof, ...ROOF_OPTIONS] : ROOF_OPTIONS },
    esPotencial() { return !!this.v.customer && this.v.customer.kind === 'potencial' },
    problemas() { return problemasDe(this.v, this.cuenta) }
  },
  watch: {
    // Si el cliente elegido ya trae su CIF (los de la intranet), se rellena solo mientras no se haya escrito otro
    // El CIF del cliente potencial es el de la empresa (se escribe en su ficha); el de uno de la intranet se rellena solo mientras no se escriba otro
    'v.customer'(c) {
      if (!c) return
      if (c.kind === 'potencial') this.v.cif = c.cif || ''
      else if (c.cif && !this.v.cif) this.v.cif = c.cif
    },
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
    subirLogo(evento) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (archivo) this.guardarLogo(archivo)
    },
    soltarLogo(evento) {
      const archivo = evento.dataTransfer.files && evento.dataTransfer.files[0]
      if (archivo && archivo.type.startsWith('image/')) this.guardarLogo(archivo)
    },
    // El logo se reduce en el navegador (como el de la propuesta) y se guarda con el presupuesto
    guardarLogo(archivo) {
      this.errorLogo = ''
      prepararLogo(archivo, 700).then((uri) => { this.v.clientLogo = uri }, (e) => { this.errorLogo = e.message })
    },
    subirEncaje(evento) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (archivo) this.guardarEncaje(archivo)
    },
    soltarEncaje(evento) {
      const archivo = evento.dataTransfer.files && evento.dataTransfer.files[0]
      if (archivo && archivo.type.startsWith('image/')) this.guardarEncaje(archivo)
    },
    // El encaje se reduce en el navegador y se guarda con el presupuesto; solo aparece en la propuesta HTML
    guardarEncaje(archivo) {
      this.errorEncaje = ''
      prepararEncaje(archivo).then((uri) => { this.v.encaje = uri }, (e) => { this.errorEncaje = e.message })
    },
    enviar() {
      this.intentado = true
      if (this.problemas.length > 0) return
      this.$emit('enviar', aplicarValores(this.inicio, this.v))
    }
  }
}
</script>
