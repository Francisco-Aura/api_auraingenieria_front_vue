<template>
  <div class="dbx-field">
    <div class="dbx-two">
      <label>Empresa (nombre corto)<input :value="empresa" placeholder="Ej.: ALPEMA" maxlength="60" @input="$emit('update:empresa', $event.target.value)"></label>
      <label>Lugar o instalación (opcional)<input :value="lugar" placeholder="Ej.: PUNTA BALLENA" maxlength="60" @input="$emit('update:lugar', $event.target.value)"></label>
    </div>
    <p v-if="actual && actual.error" class="error dbx-note">{{ actual.error }}</p>
    <template v-if="vista">
      <p class="dbx-note" :class="vista.exists ? 'dbx-ok' : vista.year_exists ? 'muted' : 'error'">
        📁 <strong>{{ vista.folder }}</strong> —
        {{ vista.exists ? 'ya existe: se usará esa carpeta.' : vista.year_exists ? 'no existe todavía: se creará.' : 'no existe todavía y falta la carpeta del año: pide a administración que la cree.' }}
      </p>
      <div v-if="!vista.exists && vista.same_day.length > 0" class="dbx-same-day">
        <p class="muted dbx-note">Ese día ya hay carpetas. Si administración ya creó la de este proyecto con otro nombre, elígela para no duplicarla:</p>
        <button v-for="nombre in vista.same_day" :key="nombre" type="button" class="btn-ish" @click="elegirDelMismoDia(nombre)">{{ nombre }}</button>
      </div>
    </template>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { folderBase, withoutDatePrefix } from '@/utils/planificador/documentos/carpetas'

// Nombre de la carpeta del proyecto en Dropbox (aammdd_nombre) con su vista previa: qué carpeta saldrá, si ya existe (la suelen crear a
// mano en administración: en ese caso se reutiliza) y qué otras hay de ese mismo día.
export default {
  name: 'Campo-Carpeta-Dropbox',
  props: {
    // Empresa en corto y lugar de la instalación: la carpeta es «aammdd_EMPRESA_LUGAR»
    empresa: { type: String, required: true },
    lugar: { type: String, required: true },
    fechaInicio: { type: String, required: true }
  },
  emits: ['update:empresa', 'update:lugar'],
  data() { return { resultado: null } },
  computed: {
    valor() { return folderBase(this.empresa, this.lugar) },
    clave() { return this.fechaInicio + '|' + this.valor },
    // Solo se muestra lo que corresponde a lo escrito ahora (no una respuesta antigua)
    actual() { return this.resultado && this.resultado.clave === this.clave ? this.resultado : null },
    vista() { return this.actual ? this.actual.vista : null }
  },
  watch: {
    clave: { immediate: true, handler() { this.consultar() } }
  },
  beforeUnmount() { window.clearTimeout(this.temporizador) },
  methods: {
    consultar() {
      window.clearTimeout(this.temporizador)
      if (!this.valor.trim() || !this.fechaInicio) return
      const clave = this.clave
      this.temporizador = window.setTimeout(() => {
        planificadorApi.dropboxVistaPrevia(this.valor.trim(), this.fechaInicio).then(
          (vista) => { if (clave === this.clave) this.resultado = { clave, vista } },
          (e) => { if (clave === this.clave) this.resultado = { clave, error: mensajeError(e) } }
        )
      }, 500)
    },
    // «ALPEMA_PUNTA BALLENA» → empresa y lugar (lo de después del primer guion bajo)
    elegirDelMismoDia(nombre) {
      const [primero, ...resto] = withoutDatePrefix(nombre).split('_')
      this.$emit('update:empresa', primero)
      this.$emit('update:lugar', resto.join('_'))
    }
  }
}
</script>
