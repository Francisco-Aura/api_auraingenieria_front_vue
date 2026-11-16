<template>
  <div class="creator" :class="{ 'with-escaneo': archivoPresupuesto }">
    <form class="nuevo-proyecto" :class="{ reading: leyendo }" :aria-busy="leyendo" @submit.prevent="crear">
      <div class="nuevo-proyecto-cabecera">
        <h1>Nuevo proyecto</h1>
        <div class="row">
          <span v-if="guardadoEl" class="muted borrador-guardado">Borrador guardado {{ horaBorrador(guardadoEl) }}</span>
          <button type="button" class="secondary" :disabled="!hayContenido" @click="guardarYSalir">Guardar borrador y salir</button>
          <button type="button" class="secondary" @click="cancelar">Cancelar</button>
        </div>
      </div>

      <p v-if="problema && problema.kind === 'conflict'" class="notice warn" role="alert">
        {{ problema.message }} <button type="button" class="enlace-boton" @click="cargarLaSuya">Cargar su versión</button>
      </p>
      <p v-if="problema && problema.kind === 'lost'" class="notice warn" role="alert">
        {{ problema.message }} Lo que tienes aquí ya no se guarda. <button type="button" class="enlace-boton" @click="separar">Seguir como borrador nuevo</button>
      </p>
      <p v-if="problema && problema.kind === 'offline'" class="notice warn">{{ problema.message }}</p>

      <p v-if="restauradoEl && !problema" class="notice borrador-aviso" role="status">
        Estás con un borrador compartido<template v-if="actualizadoPor"> (último cambio de {{ actualizadoPor }}, {{ horaBorrador(restauradoEl) }})</template>.
        Lo que escribas se guarda en él y lo ven las demás personas. El PDF del presupuesto no se guarda: si lo
        vuelves a subir, se leerá otra vez. <button type="button" class="enlace-boton" @click="empezarDeNuevo">Empezar un proyecto nuevo</button>
      </p>

      <!-- Lo primero es el presupuesto: de él salen el nombre y los datos del contrato inicial -->
      <section class="contrato-primero">
        <h2>Presupuesto</h2>
        <subir-oferta :campos="campos" @ocupado="leyendo = $event" @archivo="archivoPresupuesto = $event" @proyecto="alLeerProyecto" @datos-extraidos="alLeerDatos" @extraccion="alLeerExtraccion" />
      </section>

      <label :class="{ 'from-contrato': nombreDeOferta }">
        Nombre
        <input v-model="datos.nombre" autofocus placeholder="Ej.: Instalación TIKI TAKA Lorca" required @input="nombreTocado = true; nombreDeOferta = false">
      </label>

      <label>
        <span>Descripción <span class="muted">(opcional)</span></span>
        <textarea v-model="datos.descripcion" rows="2" />
      </label>

      <label>
        Fecha de inicio
        <input v-model="datos.inicio" type="date" required>
      </label>
      <p v-if="fechaPasada" class="notice warn fecha-warning">
        La fecha es anterior a hoy: las tareas que no estén hechas aparecerán con retraso desde el primer día.
      </p>

      <fieldset v-if="campos.length > 0" class="contrato-caja">
        <legend>Datos de instalación</legend>
        <campos-contrato :valores="datos.baseline" :campos="campos" :resaltar="datos.desdeContrato" :invalidos="invalidos" @update:valores="cambiarBaseline" />
        <comprobaciones-contrato :valores="datos.baseline" :reparto="planPercents(datos.plan)" />
      </fieldset>

      <fieldset class="contrato-caja">
        <legend>Forma de pago</legend>
        <plan-pagos-editor :plan="datos.plan" :total="datos.baseline.importe_total" @update:plan="datos.plan = $event; datos.contratoGenerado = false" />
      </fieldset>

      <!-- El contrato se genera con los datos de instalación y la forma de pago, y se guarda en la carpeta de Dropbox -->
      <fieldset class="contrato-caja">
        <legend>Contrato</legend>
        <generador-contrato :parte="datos.parte" :contrato="datos.baseline" :plan="datos.plan" :extras="datos.extras" :intentado="contratoIntentado"
                            @update:parte="datos.parte = $event; datos.contratoGenerado = false" @intento="contratoIntentado = true" @generado="datos.contratoGenerado = true" />
        <p class="hint contrato-estado" :class="{ ok: datos.contratoGenerado }">
          {{ datos.contratoGenerado
            ? '✓ Contrato generado: al crear el proyecto se guarda solo en la carpeta de contrato de Dropbox.'
            : 'El contrato es obligatorio. Si no lo generas ahora, el proyecto se crea igualmente y queda con el contrato pendiente: lo generas desde su pantalla y se guarda solo en Dropbox.' }}
        </p>
      </fieldset>

      <fieldset v-if="estadoDropbox && estadoDropbox.enabled" class="contrato-caja">
        <legend>Carpeta en Dropbox</legend>
        <div v-if="datos.carpetaExistente" class="dbx-chosen" role="status">
          <span>📁 Se usará la carpeta que ya existe:</span>
          <strong class="dbx-chosen-path">{{ relativoABase(datos.carpetaExistente, estadoDropbox.base) }}</strong>
          <button type="button" class="secondary" @click="eligiendoCarpeta = true">Cambiar</button>
          <button type="button" class="secondary" @click="datos.carpetaExistente = null">Crear una nueva</button>
        </div>
        <template v-else>
          <campo-carpeta-dropbox :empresa="empresaCarpeta" :lugar="lugarCarpeta" :fecha-inicio="datos.inicio" @update:empresa="datos.empresaCarpeta = $event" @update:lugar="datos.lugarCarpeta = $event" />
          <div class="dbx-elegir">
            <p class="hint">¿La carpeta ya existe con otro nombre? Elígela en Dropbox en vez de crear una.</p>
            <button type="button" class="secondary" @click="eligiendoCarpeta = true">Elegir una carpeta que ya existe…</button>
          </div>
          <p v-if="!nombreCarpeta.trim()" class="notice warn fecha-warning">
            Sin nombre no se crea carpeta: no se podrán subir archivos al proyecto hasta que la crees desde él.
          </p>
        </template>
        <selector-carpeta-dropbox v-if="eligiendoCarpeta" @cerrar="eligiendoCarpeta = false" @elegir="elegirCarpeta" />
      </fieldset>

      <p v-if="!plantilla" class="error">No se han podido cargar los pasos del proyecto. Recarga la página; si sigue igual, avisa a quien mantiene el servidor.</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div class="row">
        <button type="submit" :disabled="ocupado || leyendo || !datos.nombre.trim() || problemaPlan !== null">Crear proyecto</button>
        <button type="button" class="secondary" :disabled="!hayContenido" @click="guardarYSalir">Guardar borrador y salir</button>
        <button type="button" class="secondary" @click="cancelar">Cancelar</button>
      </div>
    </form>

    <div v-if="archivoPresupuesto" class="creador-escaneo">
      <visor-pdf :archivo="archivoPresupuesto" @cerrar="archivoPresupuesto = null" />
    </div>
  </div>
</template>

<script>
import CamposContrato from '../Contratos/CamposContrato.vue'
import ComprobacionesContrato from '../Contratos/ComprobacionesContrato.vue'
import PlanPagosEditor from '../Contratos/PlanPagosEditor.vue'
import GeneradorContrato from '../Contratos/GeneradorContrato.vue'
import VisorPdf from '../Contratos/VisorPdf.vue'
import CampoCarpetaDropbox from './CampoCarpetaDropbox.vue'
import SelectorCarpetaDropbox from './SelectorCarpetaDropbox.vue'
import SubirOferta from './SubirOfertaComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { STANDARD_PLAN, planPayload, planPercents, planProblem } from '@/utils/planificador/contratos/pagos'
import { formularioDeContrato } from '@/utils/planificador/contratos/formatoContrato'
import { PARTE_VACIA, DATOS_OBLIGATORIOS_DEL_CONTRATO, kwSugeridos } from '@/utils/planificador/contratos/partes'
import { folderBase, relativoABase, shortCompany, suggestedPlace } from '@/utils/planificador/documentos/carpetas'
import { horaBorrador } from '@/utils/planificador/borradores'
import { todayStr } from '@/utils/planificador/tareas/fechas'

const estadoHttp = (e) => (e && e.response && e.response.status) || 0

// Alta de proyecto. Lo escrito se guarda solo como borrador compartido en el servidor (cualquiera puede continuarlo); al crear el
// proyecto, el servidor consume el borrador. Los datos del borrador usan los mismos nombres que el Planificador anterior.
export default {
  name: 'Nuevo-Proyecto-Component',
  components: { CamposContrato, ComprobacionesContrato, PlanPagosEditor, GeneradorContrato, VisorPdf, CampoCarpetaDropbox, SelectorCarpetaDropbox, SubirOferta },
  props: {
    plantillas: { type: Array, default: () => [] },
    // Datos del contrato de referencia (importe, equipos, potencia)
    campos: { type: Array, default: () => [] },
    // Borrador que se retoma: { id, name, data, updated_at, updated_by }
    borrador: { type: Object, default: null }
  },
  emits: ['crear', 'cancelar', 'borradores-cambiados'],
  data() {
    const g = (this.borrador && this.borrador.data) || {}
    return {
      datos: {
        nombre: g.name || '', descripcion: g.description || '', inicio: g.startDate || todayStr(),
        baseline: { ...formularioDeContrato(this.campos), ...(g.baseline || {}) }, desdeContrato: Array.isArray(g.fromContract) ? g.fromContract : [],
        plan: g.plan || STANDARD_PLAN, parte: { ...PARTE_VACIA, ...(g.party || {}) },
        // El contrato es obligatorio: si no se genera aquí, el proyecto se crea igualmente y queda pendiente de generar
        contratoGenerado: g.contractGenerated === true,
        // Garantías de los módulos leídas del presupuesto (van al contrato)
        extras: g.extras || {},
        // Empresa en corto y lugar de la carpeta de Dropbox: null = el sugerido a partir de la empresa del contrato
        empresaCarpeta: g.folderCompany ?? null, lugarCarpeta: g.folderPlace ?? null, carpetaExistente: g.existingFolder || null
      },
      borradorId: this.borrador ? this.borrador.id : null,
      versionBorrador: this.borrador ? this.borrador.updated_at : null,
      actualizadoPor: this.borrador ? this.borrador.updated_by || '' : '',
      restauradoEl: this.borrador ? this.borrador.updated_at : null,
      guardadoEl: this.borrador ? this.borrador.updated_at : null,
      // Problema con el borrador: otra persona lo cambió (conflict) o ya no existe (lost); en ambos se deja de guardar
      problema: null,
      error: null, ocupado: false, temporizador: null, cadena: Promise.resolve(), estadoDropbox: null, contratoIntentado: false, eligiendoCarpeta: false,
      leyendo: false, nombreDeOferta: false, nombreTocado: !!(g.name && g.name.trim()), archivoPresupuesto: null
    }
  },
  computed: {
    plantilla() { return this.plantillas[0] || null },
    empresaCarpeta() { return this.datos.empresaCarpeta ?? shortCompany(this.datos.parte.empresa) },
    lugarCarpeta() { return this.datos.lugarCarpeta ?? suggestedPlace(this.datos.parte.empresa) },
    nombreCarpeta() { return folderBase(this.empresaCarpeta, this.lugarCarpeta) },
    fechaPasada() { return this.datos.inicio < todayStr() },
    problemaPlan() { return planProblem(this.datos.plan) },
    // Datos del presupuesto que faltan para el contrato, a marcar en rojo después del intento
    invalidos() { return this.contratoIntentado ? DATOS_OBLIGATORIOS_DEL_CONTRATO.map(([clave]) => clave) : [] },
    // Hay algo escrito que merezca guardarse (un formulario vacío no deja borrador)
    hayContenido() {
      return this.datos.nombre.trim() !== '' || this.datos.descripcion.trim() !== '' || this.datos.parte.empresa.trim() !== ''
        || Object.values(this.datos.baseline).some((v) => String(v).trim() !== '')
    },
    // El borrador ya no es de este formulario (cambió o se descartó)
    detenido() { return !!this.problema && (this.problema.kind === 'conflict' || this.problema.kind === 'lost') }
  },
  mounted() { planificadorApi.dropboxEstado().then((e) => { this.estadoDropbox = e }, () => { this.estadoDropbox = { enabled: false, base: '' } }) },
  beforeUnmount() { window.clearTimeout(this.temporizador) },
  watch: {
    // Los campos del contrato llegan del servidor: si el formulario se abrió antes, se completan los que falten
    campos(nuevos) { this.datos.baseline = { ...formularioDeContrato(nuevos), ...this.datos.baseline } },
    // El borrador se guarda solo mientras se rellena (con un pequeño retraso para no guardar a cada tecla)
    datos: {
      deep: true,
      handler() {
        window.clearTimeout(this.temporizador)
        this.temporizador = window.setTimeout(() => { this.guardar() }, 800)
      }
    }
  },
  methods: {
    planPercents, relativoABase, horaBorrador,
    // Los mismos nombres que usaba el Planificador anterior
    instantanea() {
      const d = this.datos
      return {
        name: d.nombre, description: d.descripcion, startDate: d.inicio, baseline: d.baseline, fromContract: d.desdeContrato, plan: d.plan, party: d.parte,
        extras: d.extras, folderCompany: d.empresaCarpeta, folderPlace: d.lugarCarpeta, existingFolder: d.carpetaExistente, contractGenerated: d.contratoGenerado
      }
    },
    // Los guardados van de uno en uno y en orden: el primero crea el borrador y los siguientes lo actualizan
    guardar() {
      this.cadena = this.cadena.then(async () => {
        if (this.detenido || !this.hayContenido) return
        const cuerpo = { name: this.datos.nombre.trim(), data: JSON.parse(JSON.stringify(this.instantanea())) }
        try {
          if (this.borradorId === null) {
            const r = await planificadorApi.crearBorrador(cuerpo)
            this.borradorId = r.id
            this.versionBorrador = r.updated_at
            this.actualizadoPor = r.updated_by
            this.guardadoEl = r.updated_at
          } else {
            const r = await planificadorApi.guardarBorrador(this.borradorId, { ...cuerpo, base_updated_at: this.versionBorrador })
            this.versionBorrador = r.updated_at
            this.guardadoEl = r.updated_at
          }
          if (this.problema && this.problema.kind === 'offline') this.problema = null
          this.$emit('borradores-cambiados')
        } catch (e) {
          if (estadoHttp(e) === 409) this.problema = { kind: 'conflict', message: mensajeError(e) }
          else if (estadoHttp(e) === 404) this.problema = { kind: 'lost', message: 'Este borrador ya no existe: otra persona lo habrá creado como proyecto o lo habrá descartado.' }
          else this.problema = { kind: 'offline', message: 'No se pudo guardar el borrador. Se reintentará al seguir escribiendo.' }
        }
      })
      return this.cadena
    },
    async guardarYSalir() {
      if (this.detenido && !window.confirm('Lo que has escrito aquí no se ha guardado en el borrador. ¿Salir igualmente?')) return
      window.clearTimeout(this.temporizador)
      await this.guardar()
      this.$emit('cancelar')
    },
    async cancelar() {
      const mensaje = this.borradorId
        ? '¿Descartar el borrador? Desaparecerá para todas las personas que lo vean en la lista.'
        : '¿Cancelar el proyecto? Se perderán los datos que has escrito.'
      if ((this.borradorId || this.hayContenido) && !window.confirm(mensaje)) return
      window.clearTimeout(this.temporizador)
      if (this.borradorId && !this.detenido) await planificadorApi.borrarBorrador(this.borradorId).catch(() => undefined)
      this.$emit('borradores-cambiados')
      this.$emit('cancelar')
    },
    aplicar(g) {
      this.datos = {
        nombre: g.name || '', descripcion: g.description || '', inicio: g.startDate || todayStr(),
        baseline: { ...formularioDeContrato(this.campos), ...(g.baseline || {}) }, desdeContrato: Array.isArray(g.fromContract) ? g.fromContract : [],
        plan: g.plan || STANDARD_PLAN, parte: { ...PARTE_VACIA, ...(g.party || {}) }, contratoGenerado: g.contractGenerated === true, extras: g.extras || {},
        empresaCarpeta: g.folderCompany ?? null, lugarCarpeta: g.folderPlace ?? null, carpetaExistente: g.existingFolder || null
      }
      this.nombreDeOferta = false
      this.nombreTocado = !!g.name
    },
    // Otra persona ha guardado el borrador mientras se editaba: se carga su versión (lo que se había escrito aquí se pierde)
    async cargarLaSuya() {
      if (!this.borradorId) return
      try {
        const suya = await planificadorApi.borrador(this.borradorId)
        this.aplicar(suya.data || {})
        this.versionBorrador = suya.updated_at
        this.actualizadoPor = suya.updated_by
        this.guardadoEl = suya.updated_at
        this.restauradoEl = suya.updated_at
        this.problema = null
      } catch (e) {
        this.problema = { kind: 'lost', message: mensajeError(e) || 'El borrador ya no existe.' }
      }
    },
    // Seguir con este formulario como proyecto nuevo, sin tocar el borrador compartido (otras personas siguen viéndolo)
    separar() {
      this.borradorId = null
      this.versionBorrador = null
      this.guardadoEl = null
      this.restauradoEl = null
      this.problema = null
    },
    empezarDeNuevo() { this.separar(); this.aplicar({}) },
    // El nombre sugerido por el presupuesto no pisa lo que ya se haya escrito
    alLeerProyecto({ name }) {
      if (name && !this.nombreTocado) { this.datos.nombre = name; this.nombreDeOferta = true }
    },
    alLeerDatos(valores) {
      this.datos.baseline = { ...this.datos.baseline, ...valores }
      this.datos.desdeContrato = Object.keys(valores)
      this.datos.contratoGenerado = false
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
    // Al editar un dato a mano deja de considerarse «leído del presupuesto»; cambiar los datos del contrato obliga a generarlo de nuevo
    cambiarBaseline(valores) {
      this.datos.desdeContrato = this.datos.desdeContrato.filter((k) => valores[k] === this.datos.baseline[k])
      this.datos.baseline = valores
      this.datos.contratoGenerado = false
    },
    elegirCarpeta(ruta) { this.datos.carpetaExistente = ruta; this.eligiendoCarpeta = false },
    async crear() {
      this.error = null
      if (!this.datos.nombre.trim() || this.ocupado || this.problemaPlan) return
      window.clearTimeout(this.temporizador)
      this.ocupado = true
      const d = this.datos
      const cuerpo = {
        name: d.nombre.trim(), description: d.descripcion.trim(), start_date: d.inicio,
        template_id: this.plantilla ? this.plantilla.id : null, exclude_steps: [],
        baseline: d.baseline, payment_plan: planPayload(d.plan),
        // Con una carpeta existente elegida se usa esa; si no, se crea (o reutiliza) la de «aammdd_EMPRESA_LUGAR»
        dropbox_existing: this.estadoDropbox && this.estadoDropbox.enabled && d.carpetaExistente ? d.carpetaExistente : '',
        dropbox_name: this.estadoDropbox && this.estadoDropbox.enabled && !d.carpetaExistente ? this.nombreCarpeta.trim() : '',
        // Crear desde el borrador lo consume: si otra persona se adelantó, el servidor avisa y no duplica el proyecto
        draft_id: this.borradorId,
        // Datos del contrato: se guardan en el proyecto. Si ya se generó aquí se archiva en Dropbox al crearlo; si no, queda pendiente
        contract_party: { ...d.extras, ...d.parte, kw_nominal: d.parte.kw_nominal || kwSugeridos(d.baseline), firmante: d.parte.representante, firmante_dni: d.parte.dni },
        contract_generated: d.contratoGenerado
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
