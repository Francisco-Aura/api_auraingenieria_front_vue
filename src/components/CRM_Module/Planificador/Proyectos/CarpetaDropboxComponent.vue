<template>
  <div v-if="proyecto.dropbox_path" class="dbx-linea">
    <p class="muted" :title="proyecto.dropbox_path">
      📁 Dropbox: <span class="dbx-path">{{ relativoABase(proyecto.dropbox_path, estado ? estado.base : '') }}</span>
      <template v-if="estado && estado.enabled"> <button type="button" class="enlace-boton" :disabled="ocupado" @click="completarSubcarpetas">Crear subcarpetas que falten</button></template>
    </p>
    <p v-if="nota" class="muted">{{ nota }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
  <p v-else-if="estado && !estado.enabled" class="muted dbx-linea">📁 Dropbox no está configurado en este servidor: no se pueden subir archivos a este proyecto.</p>
  <div v-else-if="estado" class="dbx-linea">
    <p class="muted">
      📁 Este proyecto no tiene carpeta en Dropbox: sin ella no se pueden subir archivos (el servidor no los guarda).
      <template v-if="!abierto"> <button type="button" class="enlace-boton" @click="abierto = true">Crear carpeta</button> · <button type="button" class="enlace-boton" @click="eligiendo = true">Elegir una que ya existe</button></template>
    </p>
    <selector-carpeta-dropbox v-if="eligiendo" @cerrar="eligiendo = false" @elegir="crear" />
    <p v-if="!abierto && error" class="error">{{ error }}</p>
    <div v-if="abierto" class="dbx-crear">
      <campo-carpeta-dropbox v-model:empresa="empresa" v-model:lugar="lugar" :fecha-inicio="proyecto.start_date || ''" />
      <div class="row">
        <button type="button" :disabled="ocupado || !nombre.trim()" @click="crear()">Crear carpeta</button>
        <button type="button" class="secondary" @click="abierto = false">Cancelar</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import CampoCarpetaDropbox from './CampoCarpetaDropbox.vue'
import SelectorCarpetaDropbox from './SelectorCarpetaDropbox.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { folderBase, relativoABase } from '@/utils/planificador/documentos/carpetas'

// Línea de estado de la carpeta de Dropbox de un proyecto; si no la tiene, permite crearla (o elegir una que ya existe).
export default {
  name: 'Carpeta-Dropbox-Component',
  components: { CampoCarpetaDropbox, SelectorCarpetaDropbox },
  props: { proyecto: { type: Object, required: true } },
  emits: ['cambiado'],
  data() { return { estado: null, abierto: false, eligiendo: false, empresa: '', lugar: '', ocupado: false, error: null, nota: null } },
  computed: { nombre() { return folderBase(this.empresa, this.lugar) } },
  mounted() { planificadorApi.dropboxEstado().then((e) => { this.estado = e }, () => { this.estado = { enabled: false, base: '' } }) },
  methods: {
    relativoABase,
    // Proyecto con carpeta: se pueden crear las subcarpetas fijas que falten (los antiguos pudieron nacer sin todas)
    async completarSubcarpetas() {
      this.ocupado = true
      this.error = null
      this.nota = null
      try {
        const { created } = await planificadorApi.completarSubcarpetasDropbox(this.proyecto.id)
        this.nota = created.length ? 'Se crearon ' + created.length + ' subcarpetas.' : 'Ya estaban todas las subcarpetas.'
      } catch (e) { this.error = mensajeError(e) } finally { this.ocupado = false }
    },
    // Crea la carpeta nueva (por su nombre) o, con `existente`, usa una que ya está en Dropbox sin crear nada
    async crear(existente) {
      this.ocupado = true
      this.error = null
      try {
        this.$emit('cambiado', await planificadorApi.crearCarpetaDropbox(this.proyecto.id, existente ? { existing: existente } : { name: this.nombre }))
        this.abierto = false
        this.eligiendo = false
      } catch (e) { this.error = mensajeError(e) } finally { this.ocupado = false }
    }
  }
}
</script>
