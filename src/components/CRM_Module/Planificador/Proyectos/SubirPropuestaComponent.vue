<template>
  <div class="contrato-subida" :class="{ dragging: arrastrando }" @dragenter="entrarArrastre" @dragover="sobreArrastre" @dragleave="salirArrastre" @drop="soltar">
    <div class="subida-fila">
      <label class="subida-boton" :class="{ disabled: ocupado }">
        {{ ocupado ? 'Leyendo la propuesta…' : 'Subir propuesta' }}
        <input type="file" hidden :disabled="ocupado" accept=".pdf,application/pdf" @change="elegir">
      </label>
      <span class="muted">{{ arrastrando ? 'Suelta el PDF aquí para leerlo.' : 'o arrástrala hasta aquí. Propuesta de Aura en PDF (la que se descarga del presupuestador): se rellenan los datos del proyecto, del cliente y del contrato.' }}</span>
    </div>

    <div v-if="ocupado" class="lectura-caja" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <div><strong>Leyendo la propuesta…</strong><span class="muted"> Se están rellenando los datos del proyecto y del contrato. Puede tardar unos segundos.</span></div>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="ilegible" class="subida-resultado scan-note"><strong>{{ ilegible }}</strong> no tiene texto que se pueda leer (¿es un escaneo?). Teclea los datos mirando la propuesta.</p>

    <div v-if="resultado" class="subida-resultado">
      <p><strong>{{ resultado.filename }}</strong> leído. {{ encontrados.length + datosProyecto.length > 0 ? 'Se han rellenado los datos que aparecen abajo; revísalos antes de crear el proyecto.' : 'No se ha encontrado ningún dato de los que se piden.' }}</p>
      <ul v-if="datosProyecto.length > 0" class="found">
        <li v-for="[clave, f] in datosProyecto" :key="clave">
          <div class="found-head"><strong>{{ ETIQUETAS_PROYECTO[clave] }}:</strong> {{ f.value }}</div>
          <blockquote v-if="clave !== 'name'">{{ f.source }}</blockquote>
        </li>
      </ul>
      <ul v-if="encontrados.length > 0" class="found">
        <li v-for="[clave, f] in encontrados" :key="clave">
          <div class="found-head">
            <strong>{{ etiqueta(clave) }}:</strong> {{ formatoValor(campo(clave), f.value) }}
            <span v-if="f.confidence !== 'alta'" class="conf" :class="f.confidence" :title="CONFIANZA[f.confidence]">Comprobar</span>
          </div>
          <blockquote>{{ f.source }}</blockquote>
        </li>
      </ul>
      <ul v-if="resultado.notes.length > 0" class="notas"><li v-for="n in resultado.notes" :key="n">{{ n }}</li></ul>
      <p v-if="resultado.missing.length > 0" class="muted">No encontrado en la propuesta: {{ resultado.missing.map(etiqueta).join(', ') }}. Complétalo a mano.</p>
    </div>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { formatoValor } from '@/utils/planificador/contratos/formatoContrato'

const ETIQUETAS_PROYECTO = { company: 'Empresa promotora', locality: 'Localidad', name: 'Nombre del proyecto' }
// El texto se lee exactamente; lo que varía es cuánto se ha tenido que «interpretar» para saber a qué dato corresponde (un importe con su
// símbolo es directo; un dato suelto que solo se reconoce por su posición, no).
const CONFIANZA = {
  alta: 'Leído tal cual',
  media: 'Interpretado por su posición en la propuesta: comprueba que es el dato correcto',
  baja: 'Interpretado con poca certeza: compruébalo con atención'
}
const esPdf = (archivo) => archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name)

// Subida de la propuesta de Aura (PDF) para rellenar el nombre del proyecto, el cliente, el contrato inicial de referencia y la forma de pago.
export default {
  name: 'Subir-Propuesta-Component',
  props: { campos: { type: Array, default: () => [] } },
  emits: ['ocupado', 'datos-extraidos', 'extraccion', 'proyecto', 'archivo', 'plan-extraido'],
  data() { return { ETIQUETAS_PROYECTO, CONFIANZA, ocupado: false, error: null, resultado: null, ilegible: null, arrastrando: false, profundidad: 0 } },
  computed: {
    encontrados() { return this.resultado ? Object.entries(this.resultado.fields) : [] },
    datosProyecto() { return this.resultado ? ['company', 'locality', 'name'].filter((k) => this.resultado.project[k]).map((k) => [k, this.resultado.project[k]]) : [] }
  },
  methods: {
    formatoValor,
    campo(clave) { return this.campos.find((c) => c.key === clave) },
    etiqueta(clave) { const c = this.campo(clave); return c ? c.label : clave },
    tieneArchivos(e) { return Array.from((e.dataTransfer && e.dataTransfer.types) || []).includes('Files') },
    entrarArrastre(e) { if (this.ocupado || !this.tieneArchivos(e)) return; e.preventDefault(); this.profundidad += 1; this.arrastrando = true },
    // Sin esto el navegador no permite soltar aquí (y abriría el PDF en la pestaña)
    sobreArrastre(e) { if (this.ocupado || !this.tieneArchivos(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy' },
    salirArrastre() { this.profundidad = Math.max(0, this.profundidad - 1); if (this.profundidad === 0) this.arrastrando = false },
    soltar(e) {
      if (!this.tieneArchivos(e)) return
      e.preventDefault()
      this.profundidad = 0
      this.arrastrando = false
      if (this.ocupado) return
      const archivos = Array.from(e.dataTransfer.files)
      if (archivos.length > 1) { this.error = 'Suelta un solo archivo: la propuesta en PDF.'; return }
      if (archivos[0]) this.subir(archivos[0])
    },
    elegir(e) {
      const archivo = e.target.files && e.target.files[0]
      e.target.value = ''
      if (archivo) this.subir(archivo)
    },
    async subir(archivo) {
      this.error = null
      this.resultado = null
      this.ilegible = null
      if (!esPdf(archivo)) { this.error = 'Solo se puede subir la propuesta en PDF.'; return }
      this.$emit('archivo', archivo)
      this.ocupado = true
      this.$emit('ocupado', true)
      try {
        const lectura = await planificadorApi.leerPropuesta(archivo)
        if (lectura.kind === 'scan') { this.ilegible = archivo.name; return } // PDF sin texto (escaneado): hay que teclear los datos
        this.resultado = lectura
        this.$emit('proyecto', { name: lectura.project.name ? lectura.project.name.value : undefined })
        this.$emit('extraccion', lectura)
        if (lectura.payment_plan) this.$emit('plan-extraido', lectura.payment_plan) // la forma de pago de la propuesta
        this.$emit('datos-extraidos', Object.fromEntries(Object.entries(lectura.fields).map(([k, f]) => [k, f.value])))
      } catch (e) {
        // Sin respuesta del servidor no es que el PDF sea ilegible: no se ha podido ni enviar (servidor parado o reiniciándose, o con una versión anterior)
        this.error = e && e.response ? mensajeError(e)
          : 'No se ha podido enviar la propuesta al servidor (sin respuesta). Comprueba que el Planificador está en marcha, recarga la página y vuelve a intentarlo.'
      } finally {
        this.ocupado = false
        this.$emit('ocupado', false) // los datos ya están en el formulario (o la lectura falló): termina la carga
      }
    }
  }
}
</script>
