<template>
  <div class="propuesta-caja">
    <template v-if="lista === null">
      <p v-if="error" class="error">{{ error }}</p>
      <p v-else class="muted">Cargando la propuesta…</p>
    </template>
    <template v-else>
      <template v-if="!actual">
        <p class="muted">Este presupuesto está aprobado. Crea la propuesta que se le mandará al cliente y anota aquí cómo avanza.</p>
        <div class="propuesta-acciones">
          <button type="button" :disabled="ocupado" @click="ejecutar(() => crear())">Crear propuesta</button>
        </div>
      </template>

      <template v-else>
        <div class="propuesta-cabecera">
          <h3>Propuesta nº {{ actual.version }}</h3>
          <span class="tag state" :class="CLASE_PROPUESTA[actual.status]">{{ ETIQUETA[actual.status] }}</span>
        </div>

        <section class="propuesta-logo" aria-label="Logo del cliente">
          <button type="button" class="propuesta-logo-caja" :disabled="ocupado || logoBloqueado" :title="logoBloqueado ? 'Logo de la empresa del cliente' : 'Haz clic o arrastra una imagen para subir el logo'" @click="$refs.logo.click()" @dragover.prevent @drop.prevent="soltarLogo">
            <img v-if="actual.client_logo" :src="actual.client_logo" alt="Logo de la empresa del cliente">
            <span v-else class="muted">+ Subir logo</span>
          </button>
          <div>
            <strong>Logo de la empresa del cliente</strong>
            <p v-if="!actual.has_logo" class="muted propuesta-ayuda">Hace falta para descargar la presentación. PNG, JPG, WebP o SVG.</p>
            <p v-else-if="!actual.client_logo" class="muted propuesta-ayuda">Se usa el logo de los parámetros del presupuesto. Si subes otro, será el de esta propuesta.</p>
            <div v-else-if="!logoBloqueado" class="propuesta-acciones">
              <button type="button" class="enlace-boton" :disabled="ocupado" @click="$refs.logo.click()">Cambiar el logo</button>
              <button type="button" class="enlace-boton" :disabled="ocupado" @click="quitarLogo">Quitar el logo</button>
            </div>
          </div>
          <input ref="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subirLogo">
        </section>

        <section class="propuesta-logo" aria-label="Encaje de los paneles">
          <button type="button" class="propuesta-logo-caja propuesta-encaje-caja" :disabled="ocupado || encajeBloqueado" :title="encajeBloqueado ? 'Encaje de los paneles en el proyecto' : 'Haz clic o arrastra una imagen para subir el encaje'" @click="$refs.encaje.click()" @dragover.prevent @drop.prevent="soltarEncaje">
            <img v-if="actual.client_encaje" :src="actual.client_encaje" alt="Encaje de los paneles en el proyecto">
            <span v-else class="muted">+ Subir encaje</span>
          </button>
          <div>
            <strong>Encaje de los paneles</strong>
            <p v-if="!actual.has_encaje" class="muted propuesta-ayuda">Obligatorio para descargar la presentación: la disposición en la que quedarán los paneles en el proyecto. PNG, JPG, WebP o SVG.</p>
            <p v-else-if="!actual.client_encaje" class="muted propuesta-ayuda">Se usa el encaje de los parámetros del presupuesto. Si subes otro, será el de esta propuesta.</p>
            <div v-else-if="!encajeBloqueado" class="propuesta-acciones">
              <button type="button" class="enlace-boton" :disabled="ocupado" @click="$refs.encaje.click()">Cambiar el encaje</button>
              <button type="button" class="enlace-boton" :disabled="ocupado" @click="quitarEncaje">Quitar el encaje</button>
            </div>
          </div>
          <input ref="encaje" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden @change="subirEncaje">
        </section>

        <section class="propuesta-documento" aria-label="Documento">
          <div>
            <strong>Presentación de la propuesta</strong>
          </div>
          <p v-if="faltan.length > 0" class="muted propuesta-faltantes">Para descargarla falta: {{ faltan.join(' y ') }}.</p>
          <button type="button" class="secondary" :disabled="ocupado || faltan.length > 0" @click="ejecutar(() => descargar(actual.id))">Descargar presentación</button>
        </section>

        <ol class="propuesta-pasos">
          <li :class="enviada ? 'done' : 'now'">
            <span class="paso-marca" aria-hidden="true">{{ enviada ? '✓' : '1' }}</span>
            <div>
              <strong>Entregada al cliente</strong>
              <p v-if="enviada" class="muted">{{ dia(actual.sent_at) }}{{ actual.sent_by ? ' · ' + actual.sent_by : '' }}</p>
              <template v-else>
                <p class="muted">Cuando ya se la hayas mandado, anótalo aquí.</p>
                <div class="propuesta-acciones">
                  <button type="button" class="secondary" :disabled="ocupado" @click="marcarEntregada">Marcar como entregada</button>
                  <button type="button" class="enlace-boton" :disabled="ocupado" @click="eliminarBorrador">Eliminar borrador</button>
                </div>
              </template>
            </div>
          </li>

          <li :class="decidida ? 'done' : enviada ? 'now' : 'todo'">
            <span class="paso-marca" aria-hidden="true">{{ decidida ? (actual.status === 'aprobada' ? '✓' : '✕') : '2' }}</span>
            <div>
              <strong>Validación</strong>
              <template v-if="decidida">
                <p class="muted">
                  {{ actual.status === 'aprobada' ? 'Validada' : 'Anulada' }} el {{ dia(actual.decided_at) }}{{ actual.decided_by ? ' · ' + actual.decided_by : '' }}
                </p>
                <p v-if="actual.note" class="propuesta-nota">«{{ actual.note }}»</p>
              </template>
              <template v-else-if="enviada && validador">
                <p v-if="!estudioValido" class="muted">El estudio está rechazado o cancelado: cambia su estado para poder validar.</p>
                <div class="propuesta-acciones">
                  <button type="button" class="secondary" :disabled="ocupado || !estudioValido" :title="estudioValido ? '' : 'Con el estudio rechazado o cancelado no se valida'" @click="responder('aprobar')">Validar</button>
                  <button type="button" class="secondary" :disabled="ocupado" @click="responder('rechazar')">Anular</button>
                </div>
              </template>
              <p v-else-if="enviada" class="muted">Pendiente de validar.</p>
              <p v-else class="muted">Pendiente de que se entregue.</p>
            </div>
          </li>
        </ol>

        <div v-if="actual.status === 'rechazada'" class="propuesta-acciones">
          <button type="button" :disabled="ocupado" @click="ejecutar(() => crear())">Crear la propuesta nº {{ actual.version + 1 }}</button>
        </div>
        <p v-if="actual.status === 'aprobada'" class="paso-nota ok">Propuesta validada.</p>
      </template>

      <details v-if="historial.length > 0" class="propuesta-historial">
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
import { prepararLogo, prepararEncaje } from '@/utils/planificador/logo'
import { CLASE_PROPUESTA } from '@/utils/planificador/listaPresupuestos'
import { esValidador } from '@/services/usuarioActual'

const ETIQUETA = { borrador: 'Borrador', enviada: 'Entregada al cliente', aprobada: 'Validada', rechazada: 'Anulada' }

// Segunda fase de un presupuesto aprobado: la propuesta que se manda al cliente para que la apruebe. Cada versión tiene su
// estado (borrador, entregada, validada o anulada); validarla (con el presupuesto aprobado y un estudio que no esté rechazado ni cancelado, que pasa a aceptado) o anularla es cosa de quien valida. Si se anula se crea otra
// sin tocar el presupuesto aprobado.
export default {
  name: 'Seccion-Propuesta',
  props: { presupuestoId: { type: String, required: true }, estudioValido: { type: Boolean, default: true } },
  emits: ['cambio', 'estado'],
  data() { return { ETIQUETA, CLASE_PROPUESTA, planificadorApi, lista: null, ocupado: false, error: '' } },
  computed: {
    actual() { return this.lista && this.lista[0] },
    historial() { return this.lista ? this.lista.slice(1) : [] },
    validador() { return esValidador() },
    enviada() { return !!this.actual && this.actual.status !== 'borrador' },
    decidida() { return !!this.actual && (this.actual.status === 'aprobada' || this.actual.status === 'rechazada') },
    // El logo de una propuesta ya validada o anulada se ve, pero no se cambia
    logoBloqueado() { return this.decidida && !!this.actual.client_logo },
    // Lo mismo con el encaje de los paneles
    encajeBloqueado() { return this.decidida && !!this.actual.client_encaje },
    // La presentación no se descarga sin el logo del cliente ni el encaje de los paneles (el servidor también lo exige)
    faltan() {
      const f = []
      if (!this.actual.has_logo) f.push('el logo de la empresa')
      if (!this.actual.has_encaje) f.push('el encaje de los paneles')
      return f
    }
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
      if (archivo) this.guardarLogo(archivo)
    },
    soltarLogo(evento) {
      const archivo = evento.dataTransfer.files && evento.dataTransfer.files[0]
      if (archivo && archivo.type.startsWith('image/')) this.guardarLogo(archivo)
    },
    // El logo se reduce en el navegador y se guarda en la propuesta
    guardarLogo(archivo) {
      this.ejecutar(async () => planificadorApi.guardarLogoPropuesta(this.actual.id, await prepararLogo(archivo, 700)))
    },
    quitarLogo() {
      this.ejecutar(() => planificadorApi.borrarLogoPropuesta(this.actual.id))
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
    // El encaje se reduce en el navegador y se guarda en la propuesta
    guardarEncaje(archivo) {
      this.ejecutar(async () => planificadorApi.guardarEncajePropuesta(this.actual.id, await prepararEncaje(archivo)))
    },
    quitarEncaje() {
      this.ejecutar(() => planificadorApi.borrarEncajePropuesta(this.actual.id))
    },
    eliminarBorrador() {
      if (window.confirm('Se eliminará esta propuesta en borrador. ¿Continuar?')) this.ejecutar(() => planificadorApi.borrarPropuesta(this.actual.id))
    },
    marcarEntregada() {
      if (window.confirm('Se anotará que la propuesta se ha entregado al cliente. ¿Continuar?')) this.ejecutar(() => planificadorApi.enviarPropuesta(this.actual.id))
    },
    responder(que) {
      const texto = que === 'aprobar'
        ? 'Se validará la propuesta. Si quieres, anota una condición o un comentario:'
        : 'Se anulará la propuesta. Si lo sabes, anota el motivo:'
      const nota = window.prompt(texto)
      if (nota === null) return
      this.ejecutar(() => (que === 'aprobar' ? planificadorApi.aprobarPropuesta(this.actual.id, nota) : planificadorApi.rechazarPropuesta(this.actual.id, nota)))
    }
  }
}
</script>
