<template>
  <div class="new-project">
    <div class="back-row"><button type="button" class="secondary" @click="$emit('cancelar')">← Cancelar</button></div>
    <h1>Nuevo proyecto</h1>
    <form class="setup-form" @submit.prevent="crear">
      <!-- Lo primero es el presupuesto: de él salen el nombre y los datos del contrato inicial -->
      <fieldset class="setup-card contract-first">
        <legend>Presupuesto</legend>
        <subir-oferta :campos="campos" @ocupado="leyendo = $event" @proyecto="alLeerProyecto" @datos-extraidos="alLeerDatos" @extraccion="alLeerExtraccion" />
      </fieldset>

      <fieldset class="setup-card">
        <legend>Datos del proyecto</legend>
        <label class="survey-field wide" :class="{ 'from-contract': nombreDeOferta }">Nombre <input v-model="datos.nombre" maxlength="200" placeholder="Ej.: Nave Ingaser" @input="nombreEscrito"></label>
        <label class="survey-field wide">Descripción <textarea v-model="datos.descripcion" rows="2" @input="programarBorrador" /></label>
        <label class="survey-field">Fecha de inicio <input v-model="datos.inicio" type="date" @input="programarBorrador"></label>
      </fieldset>

      <fieldset v-if="campos.length > 0" class="setup-card contract-box">
        <legend>Datos de instalación</legend>
        <campos-contrato :valores="datos.baseline" :campos="campos" @update:valores="cambiarBaseline" />
        <comprobaciones-contrato :valores="datos.baseline" :reparto="planPercents(datos.plan)" />
      </fieldset>

      <fieldset class="setup-card contract-box">
        <legend>Forma de pago</legend>
        <plan-pagos-editor :plan="datos.plan" :total="datos.baseline.importe_total" @update:plan="cambiarPlan" />
      </fieldset>

      <!-- El contrato se genera con los datos de instalación y la forma de pago, y se guarda en la carpeta de Dropbox -->
      <fieldset class="setup-card contract-box">
        <legend>Contrato</legend>
        <generador-contrato :parte="datos.parte" :contrato="datos.baseline" :plan="datos.plan" :extras="datos.extras" :intentado="contratoIntentado" @update:parte="cambiarParte" @intento="contratoIntentado = true" @generado="marcarGenerado" />
        <p class="muted contract-note">{{ datos.contratoGenerado ? '✓ Contrato generado: al crear el proyecto se guarda solo en la carpeta de contrato de Dropbox.' : 'El contrato es obligatorio: si no lo generas ahora, el proyecto queda con el contrato pendiente: lo generas desde su pantalla y se guarda solo en Dropbox.' }}</p>
      </fieldset>

      <fieldset v-if="estadoDropbox && estadoDropbox.enabled" class="setup-card contract-box">
        <legend>Carpeta en Dropbox</legend>
        <template v-if="datos.carpetaExistente">
          <p class="dbx-chosen">📁 Se usará la carpeta que ya existe: <strong class="dbx-chosen-path">{{ relativoABase(datos.carpetaExistente, estadoDropbox.base) }}</strong> <button type="button" class="link-btn" @click="cambiarCarpetaExistente(null)">Quitar</button></p>
        </template>
        <template v-else>
          <campo-carpeta-dropbox :empresa="empresaCarpeta" :lugar="lugarCarpeta" :fecha-inicio="datos.inicio" @update:empresa="(v) => { datos.empresaCarpeta = v; programarBorrador() }" @update:lugar="(v) => { datos.lugarCarpeta = v; programarBorrador() }" />
          <p class="hint">¿La carpeta ya existe con otro nombre? Elígela en Dropbox en vez de crear una nueva. <button type="button" class="link-btn" @click="eligiendoCarpeta = true">Elegir una que ya existe</button></p>
        </template>
        <selector-carpeta-dropbox v-if="eligiendoCarpeta" @cerrar="eligiendoCarpeta = false" @elegir="cambiarCarpetaExistente" />
      </fieldset>

      <fieldset class="setup-card">
        <legend>Pasos</legend>
        <label class="check-row"><input v-model="datos.conPlantilla" type="checkbox" @change="programarBorrador"> Cargar los {{ plantilla ? plantilla.step_count : 'pasos de la' }} pasos de la instalación fotovoltaica</label>
        <template v-if="datos.conPlantilla && plantilla && plantilla.optional_steps.length > 0">
          <p class="muted">Pasos opcionales (marca los que hagan falta):</p>
          <label v-for="o in plantilla.optional_steps" :key="o.key" class="check-row">
            <input type="checkbox" :checked="datos.opcionales.includes(o.key)" @change="alternarOpcional(o.key)"> {{ o.name }}
          </label>
        </template>
      </fieldset>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <div class="setup-actions">
        <button type="submit" :disabled="ocupado || leyendo">{{ ocupado ? 'Creando…' : leyendo ? 'Leyendo el presupuesto…' : 'Crear proyecto' }}</button>
        <button type="button" class="secondary" @click="$emit('cancelar')">Cancelar</button>
        <span class="muted">{{ estadoBorrador }}</span>
      </div>
    </form>
  </div>
</template>

<script>
import CamposContrato from '../Contratos/CamposContrato.vue'
import ComprobacionesContrato from '../Contratos/ComprobacionesContrato.vue'
import PlanPagosEditor from '../Contratos/PlanPagosEditor.vue'
import GeneradorContrato from '../Contratos/GeneradorContrato.vue'
import CampoCarpetaDropbox from './CampoCarpetaDropbox.vue'
import SelectorCarpetaDropbox from './SelectorCarpetaDropbox.vue'
import SubirOferta from './SubirOfertaComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { STANDARD_PLAN, planPayload, planPercents } from '@/utils/planificador/contratos/pagos'
import { formularioDeContrato } from '@/utils/planificador/contratos/formatoContrato'
import { PARTE_VACIA } from '@/utils/planificador/contratos/partes'
import { folderBase, relativoABase, shortCompany, suggestedPlace } from '@/utils/planificador/documentos/carpetas'
import { todayStr } from '@/utils/planificador/tareas/fechas'

// Alta de proyecto: nombre, descripción, inicio y plantilla (con sus pasos opcionales). Lo escrito se guarda solo como borrador
// compartido; al crear el proyecto, el servidor consume el borrador.
export default {
  name: 'Nuevo-Proyecto-Component',
  components: { CamposContrato, ComprobacionesContrato, PlanPagosEditor, GeneradorContrato, CampoCarpetaDropbox, SelectorCarpetaDropbox, SubirOferta },
  props: {
    plantillas: { type: Array, default: () => [] },
    // Datos del contrato de referencia (importe, equipos, potencia)
    campos: { type: Array, default: () => [] },
    // Borrador que se retoma: { id, name, data, updated_at }
    borrador: { type: Object, default: null }
  },
  emits: ['crear', 'cancelar', 'borradores-cambiados'],
  data() {
    const d = (this.borrador && this.borrador.data) || {}
    return {
      datos: {
        nombre: d.nombre || '', descripcion: d.descripcion || '', inicio: d.inicio || todayStr(),
        conPlantilla: d.conPlantilla !== false, opcionales: Array.isArray(d.opcionales) ? d.opcionales : [],
        baseline: { ...formularioDeContrato(this.campos), ...(d.baseline || {}) }, plan: d.plan || STANDARD_PLAN,
        parte: { ...PARTE_VACIA, ...(d.parte || {}) }, contratoGenerado: d.contratoGenerado === true,
        // Garantías de los módulos leídas del presupuesto (van al contrato)
        extras: d.extras || {},
        // Empresa en corto y lugar de la carpeta de Dropbox; null = el sugerido a partir de la empresa del contrato
        empresaCarpeta: d.empresaCarpeta ?? null, lugarCarpeta: d.lugarCarpeta ?? null, carpetaExistente: d.carpetaExistente || null
      },
      borradorId: this.borrador ? this.borrador.id : null,
      versionBorrador: this.borrador ? this.borrador.updated_at : null,
      error: null, ocupado: false, estadoBorrador: '', temporizador: null, estadoDropbox: null, contratoIntentado: false, eligiendoCarpeta: false,
      leyendo: false, nombreDeOferta: false, nombreTocado: !!(d.nombre && d.nombre.trim())
    }
  },
  computed: {
    plantilla() { return this.plantillas[0] || null },
    empresaCarpeta() { return this.datos.empresaCarpeta ?? shortCompany(this.datos.parte.empresa) },
    lugarCarpeta() { return this.datos.lugarCarpeta ?? suggestedPlace(this.datos.parte.empresa) }
  },
  mounted() { planificadorApi.dropboxEstado().then((e) => { this.estadoDropbox = e }, () => { this.estadoDropbox = { enabled: false, base: '' } }) },
  beforeUnmount() { window.clearTimeout(this.temporizador) },
  watch: {
    // Los campos del contrato llegan del servidor: si el formulario se abrió antes, se completan los que falten
    campos(nuevos) { this.datos.baseline = { ...formularioDeContrato(nuevos), ...this.datos.baseline } }
  },
  methods: {
    planPercents, relativoABase,
    nombreEscrito() { this.nombreTocado = true; this.nombreDeOferta = false; this.programarBorrador() },
    // El nombre sugerido por el presupuesto no pisa lo que ya se haya escrito
    alLeerProyecto({ name }) {
      if (name && !this.nombreTocado) { this.datos.nombre = name; this.nombreDeOferta = true; this.programarBorrador() }
    },
    alLeerDatos(valores) {
      this.datos.baseline = { ...this.datos.baseline, ...valores }
      this.datos.contratoGenerado = false
      this.programarBorrador()
    },
    alLeerExtraccion(lectura) {
      this.datos.extras = lectura.extras || {}
      // Datos del cliente del presupuesto para el contrato (lo ya tecleado no se pisa)
      const p = this.datos.parte
      this.datos.parte = {
        ...p, empresa: p.empresa || lectura.client.name || '', domicilio: p.domicilio || lectura.client.address || '', instalacion: p.instalacion || lectura.client.address || ''
      }
      // Lugar de la carpeta de Dropbox: la localidad del presupuesto, salvo que ya lo indique la empresa (lo que va entre paréntesis) o se haya escrito a mano
      const localidad = lectura.project.locality && lectura.project.locality.value
      if (localidad && !suggestedPlace(this.datos.parte.empresa) && this.datos.lugarCarpeta === null) {
        this.datos.lugarCarpeta = localidad.replace(/\s+/g, ' ').trim().toUpperCase()
      }
      this.datos.contratoGenerado = false
    },
    // Cambiar los datos del contrato obliga a generarlo de nuevo
    cambiarParte(parte) { this.datos.parte = parte; this.datos.contratoGenerado = false; this.programarBorrador() },
    marcarGenerado() { this.datos.contratoGenerado = true; this.programarBorrador() },
    cambiarCarpetaExistente(ruta) { this.datos.carpetaExistente = ruta; this.eligiendoCarpeta = false; this.programarBorrador() },
    cambiarBaseline(valores) { this.datos.baseline = valores; this.datos.contratoGenerado = false; this.programarBorrador() },
    cambiarPlan(plan) { this.datos.plan = plan; this.datos.contratoGenerado = false; this.programarBorrador() },
    alternarOpcional(clave) {
      this.datos.opcionales = this.datos.opcionales.includes(clave) ? this.datos.opcionales.filter((k) => k !== clave) : [...this.datos.opcionales, clave]
      this.programarBorrador()
    },
    // Lo escrito se guarda solo, con una pequeña espera
    programarBorrador() {
      window.clearTimeout(this.temporizador)
      this.temporizador = window.setTimeout(this.guardarBorrador, 1200)
    },
    async guardarBorrador() {
      if (!this.datos.nombre.trim() && !this.datos.descripcion.trim()) return
      const cuerpo = { name: this.datos.nombre, data: { ...this.datos } }
      try {
        if (this.borradorId) {
          const r = await planificadorApi.guardarBorrador(this.borradorId, { ...cuerpo, base_updated_at: this.versionBorrador })
          this.versionBorrador = r.updated_at
        } else {
          const r = await planificadorApi.crearBorrador(cuerpo)
          this.borradorId = r.id
          this.versionBorrador = r.updated_at
        }
        this.estadoBorrador = 'Borrador guardado'
        this.$emit('borradores-cambiados')
      } catch (e) {
        this.estadoBorrador = mensajeError(e)
      }
    },
    async crear() {
      this.error = null
      if (!this.datos.nombre.trim()) { this.error = 'El proyecto necesita un nombre'; return }
      window.clearTimeout(this.temporizador)
      this.ocupado = true
      const cuerpo = {
        name: this.datos.nombre.trim(), description: this.datos.descripcion, start_date: this.datos.inicio,
        baseline: this.datos.baseline, payment_plan: planPayload(this.datos.plan),
        // Datos del contrato: se guardan en el proyecto. Si ya se generó aquí se archiva en Dropbox al crearlo
        contract_party: { ...this.datos.parte, ...this.datos.extras, firmante: this.datos.parte.representante, firmante_dni: this.datos.parte.dni },
        contract_generated: this.datos.contratoGenerado,
        dropbox_existing: this.estadoDropbox && this.estadoDropbox.enabled && this.datos.carpetaExistente ? this.datos.carpetaExistente : '',
        dropbox_name: this.estadoDropbox && this.estadoDropbox.enabled && !this.datos.carpetaExistente ? folderBase(this.empresaCarpeta, this.lugarCarpeta).trim() : '',
        ...(this.datos.conPlantilla && this.plantilla ? { template_id: this.plantilla.id, exclude_steps: this.plantilla.optional_steps.map((o) => o.key).filter((k) => !this.datos.opcionales.includes(k)) } : {}),
        ...(this.borradorId ? { draft_id: this.borradorId } : {})
      }
      try {
        this.$emit('crear', await planificadorApi.crearProyecto(cuerpo))
      } catch (e) {
        this.error = mensajeError(e)
        this.ocupado = false
      }
    }
  }
}
</script>
