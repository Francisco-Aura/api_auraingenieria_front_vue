<template>
  <div>
    <div v-if="pendiente" class="contrato-pendiente" role="alert">
      <strong>⚠ Contrato pendiente de generar.</strong> Es obligatorio: al generarlo se guarda solo en la carpeta de contrato de Dropbox del proyecto.
      <button type="button" @click="abrir">Generar contrato</button>
    </div>
    <p v-else class="muted contrato-hecho">
      📄 Contrato generado el {{ cuando(proyecto.contract_generated_at) }}<template v-if="proyecto.contract_file"> · guardado en Dropbox: {{ nombreDe(proyecto.contract_file) }}</template>.
      <a :href="urlPdf" target="_blank" rel="noreferrer">PDF</a> · <button type="button" class="enlace-boton" @click="abrir">Generar de nuevo</button>
    </p>

    <modal-component v-if="abierto" :ancho="true" titulo="Contrato del proyecto" @cerrar="abierto = false">
      <div v-if="resultado" class="contract-result">
        <p>✓ Contrato generado. {{ resultado.saved.length > 0 ? 'Guardado en Dropbox (carpeta de contrato): ' + resultado.saved.map(nombreDe).join(', ') + '.' : 'No se guardó en Dropbox: el proyecto no tiene carpeta.' }}</p>
        <p v-if="resultado.warning" class="error">{{ resultado.warning }} Puedes generarlo de nuevo cuando Dropbox responda.</p>
        <p>Descargar: <a :href="urlPdf" target="_blank" rel="noreferrer">PDF</a></p>
      </div>
      <template v-else>
        <p class="hint">Se genera con el modelo de contrato, el presupuesto inicial y la forma de pago del proyecto. Los datos que escribas aquí quedan guardados.</p>
        <div class="party-rejilla">
          <label v-for="clave in claves" :key="clave" :class="clave === 'domicilio' || clave === 'instalacion' ? 'wide-campo' : undefined">
            {{ ETIQUETAS_PARTE[clave] }}<input v-model="parte[clave]">
          </label>
          <label>Lugar de la firma <span class="muted">(la fecha es la de hoy)</span><input v-model="lugar"></label>
        </div>
        <p v-if="error" class="error" role="alert">{{ error }} <template v-if="/(Paneles|Inversor|Estructura|Potencia total|Importe total)/.test(error)">Los datos del presupuesto se completan en «Editar datos».</template></p>
      </template>
      <template #pie>
        <button v-if="resultado" type="button" @click="abierto = false">Cerrar</button>
        <template v-else>
          <button type="button" class="secondary" @click="abierto = false">Cancelar</button>
          <button type="button" :disabled="ocupado" @click="generar">{{ ocupado ? 'Generando…' : 'Generar y guardar en Dropbox' }}</button>
        </template>
      </template>
    </modal-component>
  </div>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { ETIQUETAS_PARTE, PARTE_VACIA, kwSugeridos } from '@/utils/planificador/contratos/partes'

// El contrato es obligatorio: mientras no se haya generado, el proyecto lo avisa («contrato pendiente»). Se genera desde aquí con los datos
// guardados y se archiva solo, en PDF, en la carpeta de contrato de Dropbox.
export default {
  name: 'Contrato-Proyecto-Component',
  components: { ModalComponent },
  props: {
    proyecto: { type: Object, required: true },
    // Datos del contrato inicial (los que también necesita el contrato)
    base: { type: Object, default: () => ({}) }
  },
  emits: ['actualizado'],
  data() { return { ETIQUETAS_PARTE, abierto: false, parte: { ...PARTE_VACIA }, lugar: '', ocupado: false, error: null, resultado: null } },
  computed: {
    claves() { return Object.keys(ETIQUETAS_PARTE) },
    pendiente() { return !this.proyecto.contract_generated_at },
    urlPdf() { return planificadorApi.urlContratoProyecto(this.proyecto.id) }
  },
  methods: {
    cuando(iso) { return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    nombreDe(ruta) { return ruta.split('/').pop() },
    abrir() {
      const guardado = this.proyecto.contract_party || {}
      const contrato = Object.fromEntries(Object.entries(this.base).map(([k, v]) => [k, v == null ? '' : String(v)]))
      this.parte = { ...PARTE_VACIA, ...Object.fromEntries(Object.keys(PARTE_VACIA).map((k) => [k, guardado[k] ?? ''])) }
      this.parte.kw_nominal = guardado.kw_nominal || kwSugeridos(contrato)
      this.lugar = guardado.lugar_firma || 'Lorca' // lugar de la firma por defecto; se puede cambiar
      this.error = null
      this.resultado = null
      this.abierto = true
    },
    async generar() {
      this.ocupado = true
      this.error = null
      try {
        const r = await planificadorApi.generarContratoProyecto(this.proyecto.id, { ...this.parte, firmante: this.parte.representante, firmante_dni: this.parte.dni, lugar_firma: this.lugar })
        this.$emit('actualizado', r.project)
        this.resultado = { saved: r.saved, warning: r.warning }
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    }
  }
}
</script>
