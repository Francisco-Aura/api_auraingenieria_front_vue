<template>
  <div class="proposal-box">
    <template v-if="lista === null">
      <p v-if="error" class="error">{{ error }}</p>
      <p v-else class="muted">Cargando la propuesta…</p>
    </template>
    <template v-else>
      <template v-if="!actual">
        <p class="muted">Este presupuesto está validado. Crea la propuesta que se le mandará al cliente y anota aquí cómo avanza.</p>
        <div class="proposal-actions">
          <button type="button" :disabled="ocupado" @click="ejecutar(() => crear())">Crear propuesta</button>
        </div>
      </template>

      <template v-else>
        <div class="proposal-head">
          <h3>Propuesta nº {{ actual.version }}</h3>
          <span class="tag state" :class="CLASE_PROPUESTA[actual.status]">{{ ETIQUETA[actual.status] }}</span>
        </div>

        <section class="proposal-doc" aria-label="Documento">
          <div>
            <strong>Presentación de la propuesta</strong>
            <p class="muted proposal-help">Se genera con los datos del presupuesto; lo que no tiene, como la dirección del cliente, queda en blanco. Es un archivo HTML: se abre en el navegador, y para sacar el PDF se imprime (Ctrl+P, «Guardar como PDF»).</p>
          </div>
          <button type="button" class="secondary" :disabled="ocupado || faltanGarantias.length > 0" @click="ejecutar(() => descargar(actual.id))">Descargar presentación</button>
          <p v-if="faltanGarantias.length > 0" class="step-note warn proposal-missing" role="alert">
            No se puede descargar la presentación porque falta {{ faltanGarantias.join(', ') }}. Complétala en el inventario.
          </p>
        </section>

        <section class="proposal-logo" aria-label="Logo del cliente">
          <button type="button" class="proposal-logo-box" :disabled="ocupado" :title="actual.client_logo ? 'Cambiar el logo' : 'Subir el logo de la empresa del cliente'" @click="$refs.logo.click()">
            <img v-if="actual.client_logo" :src="actual.client_logo" alt="Logo de la empresa del cliente">
            <span v-else class="muted">+ Subir logo</span>
          </button>
          <div>
            <strong>Logo de la empresa del cliente</strong>
            <p class="muted proposal-help">Se inserta solo en la presentación («Te lo ponemos fácil»). PNG, JPG, WebP o SVG.</p>
            <div class="proposal-actions">
              <button type="button" class="secondary" :disabled="ocupado" title="Subir el logo de la empresa del cliente" @click="$refs.logo.click()">
                {{ actual.client_logo ? 'Cambiar logo' : 'Subir logo' }}
              </button>
              <button v-if="actual.client_logo" type="button" class="link-btn" :disabled="ocupado" @click="ejecutar(() => planificadorApi.borrarLogoPropuesta(actual.id))">Quitar</button>
              <input ref="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subirLogo">
            </div>
          </div>
        </section>

        <ol class="proposal-steps">
          <li class="done">
            <span class="step-mark" aria-hidden="true">✓</span>
            <div>
              <strong>Propuesta creada</strong>
              <p class="muted">{{ dia(actual.created_at) }}{{ actual.created_by ? ' · ' + actual.created_by : '' }}</p>
              <button v-if="actual.status === 'borrador'" type="button" class="link-btn" :disabled="ocupado" @click="eliminarBorrador">Eliminar borrador</button>
            </div>
          </li>

          <li :class="enviada ? 'done' : 'now'">
            <span class="step-mark" aria-hidden="true">{{ enviada ? '✓' : '2' }}</span>
            <div>
              <strong>Entregada al cliente</strong>
              <p v-if="enviada" class="muted">{{ dia(actual.sent_at) }}{{ actual.sent_by ? ' · ' + actual.sent_by : '' }}</p>
              <template v-else>
                <p class="muted">Cuando ya se la hayas mandado, anótalo aquí.</p>
                <button type="button" class="secondary" :disabled="ocupado" @click="marcarEntregada">Marcar como entregada</button>
              </template>
            </div>
          </li>

          <li :class="decidida ? 'done' : enviada ? 'now' : 'todo'">
            <span class="step-mark" aria-hidden="true">{{ decidida ? (actual.status === 'aprobada' ? '✓' : '✕') : '3' }}</span>
            <div>
              <strong>Respuesta del cliente</strong>
              <template v-if="decidida">
                <p class="muted">
                  {{ actual.status === 'aprobada' ? 'Aprobada' : 'Rechazada' }} el {{ dia(actual.decided_at) }}{{ actual.decided_by ? ' · anotado por ' + actual.decided_by : '' }}
                </p>
                <p v-if="actual.note" class="proposal-note">«{{ actual.note }}»</p>
              </template>
              <template v-else-if="enviada">
                <p class="muted">¿Qué ha contestado el cliente?</p>
                <div class="proposal-actions">
                  <button type="button" class="secondary" :disabled="ocupado" @click="responder('aprobar')">La aprueba</button>
                  <button type="button" class="secondary" :disabled="ocupado" @click="responder('rechazar')">La rechaza</button>
                </div>
              </template>
              <p v-else class="muted">Pendiente de que se envíe.</p>
            </div>
          </li>
        </ol>

        <div v-if="actual.status === 'rechazada'" class="proposal-actions">
          <button type="button" :disabled="ocupado" @click="ejecutar(() => crear())">Crear la propuesta nº {{ actual.version + 1 }}</button>
        </div>
        <p v-if="actual.status === 'aprobada'" class="step-note ok">El cliente aprobó la propuesta.</p>
      </template>

      <details v-if="historial.length > 0" class="proposal-history">
        <summary>Versiones anteriores ({{ historial.length }})</summary>
        <ul>
          <li v-for="p in historial" :key="p.id">
            <span class="tag state" :class="CLASE_PROPUESTA[p.status]">{{ ETIQUETA[p.status] }}</span> Propuesta nº {{ p.version }}{{ p.decided_at ? ' · ' + dia(p.decided_at) : '' }}
            <span v-if="p.note" class="muted"> · «{{ p.note }}»</span>
          </li>
        </ul>
      </details>
      <p v-if="error" class="error">{{ error }}</p>
    </template>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { prepararLogo } from '@/utils/planificador/logo'
import { CLASE_PROPUESTA } from '@/utils/planificador/listaPresupuestos'

const ETIQUETA = { borrador: 'Borrador', enviada: 'Entregada al cliente', aprobada: 'Aprobada', rechazada: 'Rechazada' }

// Segunda fase de un presupuesto validado: la propuesta que se manda al cliente para que la apruebe. Cada versión tiene su
// estado (borrador, enviada, aprobada o rechazada); si el cliente la rechaza se crea otra sin tocar el presupuesto validado.
export default {
  name: 'Seccion-Propuesta',
  props: { presupuestoId: { type: String, required: true } },
  emits: ['cambio', 'estado'],
  data() { return { ETIQUETA, CLASE_PROPUESTA, planificadorApi, lista: null, ocupado: false, error: '' } },
  computed: {
    actual() { return this.lista && this.lista[0] },
    historial() { return this.lista ? this.lista.slice(1) : [] },
    faltanGarantias() { return (this.actual && this.actual.missing_warranties) || [] },
    enviada() { return !!this.actual && this.actual.status !== 'borrador' },
    decidida() { return !!this.actual && (this.actual.status === 'aprobada' || this.actual.status === 'rechazada') }
  },
  watch: { presupuestoId() { this.lista = null; this.cargar() } },
  mounted() { this.cargar() },
  methods: {
    dia(iso) { return iso ? new Date(iso).toLocaleDateString('es-ES', { dateStyle: 'short' }) : '' },
    async cargar() {
      try {
        this.lista = await planificadorApi.propuestas(this.presupuestoId)
        // Quien muestra la propuesta necesita saber en qué va (p. ej. para saber si se puede quitar la validación)
        this.$emit('estado', this.lista[0] ? this.lista[0].status : '')
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    crear() { return planificadorApi.crearPropuesta(this.presupuestoId) },
    async ejecutar(accion) {
      this.ocupado = true
      this.error = ''
      try {
        await accion()
        await this.cargar()
        this.$emit('cambio')
      } catch (e) {
        this.error = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    // Se descarga con su nombre: abrir una pestaña tras una petición asíncrona lo bloquea el navegador
    async descargar(id) {
      const { blob, filename } = await planificadorApi.propuestaHtml(id)
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = filename
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
    },
    subirLogo(evento) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (!archivo) return
      // El logo se reduce en el navegador y se guarda en la propuesta
      this.ejecutar(async () => planificadorApi.guardarLogoPropuesta(this.actual.id, await prepararLogo(archivo, 700)))
    },
    eliminarBorrador() {
      if (window.confirm('Se eliminará esta propuesta en borrador. ¿Continuar?')) this.ejecutar(() => planificadorApi.borrarPropuesta(this.actual.id))
    },
    marcarEntregada() {
      if (window.confirm('Se anotará que la propuesta se ha entregado al cliente. ¿Continuar?')) this.ejecutar(() => planificadorApi.enviarPropuesta(this.actual.id))
    },
    responder(que) {
      const texto = que === 'aprobar'
        ? 'El cliente ha aprobado la propuesta. Si quieres, anota una condición o un comentario:'
        : 'El cliente ha rechazado la propuesta. Si lo sabes, anota el motivo:'
      const nota = window.prompt(texto)
      if (nota === null) return
      this.ejecutar(() => (que === 'aprobar' ? planificadorApi.aprobarPropuesta(this.actual.id, nota) : planificadorApi.rechazarPropuesta(this.actual.id, nota)))
    }
  }
}
</script>
