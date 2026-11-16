<template>
  <modal-component :ancho="true" titulo="Elegir una carpeta de Dropbox que ya existe" @cerrar="$emit('cerrar')">
    <p class="hint">Navega por Dropbox y elige la carpeta del proyecto (la que está dentro de la de su año). Se usará tal cual: no se crea ni se cambia nada en ella.</p>

    <nav class="dbx-crumbs" aria-label="Ruta">
      <button type="button" class="enlace-boton" @click="ir()">Carpeta de trabajos</button>
      <span v-for="(c, i) in migas" :key="i"> / <button type="button" class="enlace-boton" @click="ir(haciaMiga(i))">{{ c }}</button></span>
    </nav>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="cargando" class="muted">Cargando…</p>

    <template v-if="listado && !cargando">
      <p v-if="listado.can_choose" class="notice dbx-escoger">Estás dentro de la carpeta de un proyecto: pulsa <strong>«Elegir esta carpeta»</strong> para usarla.</p>
      <p v-else class="muted">{{ listado.depth === 0 ? 'Elige el año.' : 'Elige el proyecto (pulsa «Elegir» al lado de su nombre).' }}</p>
      <input v-if="listado.folders.length > 8" v-model="filtro" class="dbx-filtro" placeholder="Buscar por nombre…" aria-label="Buscar carpeta">
      <p v-if="visibles.length === 0" class="muted">{{ filtro ? 'Ninguna coincide.' : 'No hay subcarpetas.' }}</p>
      <ul class="dbx-folders">
        <li v-for="nombre in visibles" :key="nombre">
          <button type="button" class="dbx-abrir" @click="ir(unir(nombre))">📁 {{ nombre }}</button>
          <button v-if="listado.depth === 1" type="button" class="secondary" @click="$emit('elegir', unir(nombre))">Elegir</button>
        </li>
      </ul>
    </template>

    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" :disabled="!listado || !listado.can_choose" @click="$emit('elegir', listado.path)">Elegir esta carpeta</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { relativoABase } from '@/utils/planificador/documentos/carpetas'

// Selector de una carpeta de proyecto que ya existe en Dropbox: se navega desde la carpeta base (años → proyectos) y se elige la del
// proyecto. Se usa tal cual: no se crea nada en ella.
export default {
  name: 'Selector-Carpeta-Dropbox',
  components: { ModalComponent },
  emits: ['elegir', 'cerrar'],
  data() { return { listado: null, error: null, cargando: true, filtro: '' } },
  computed: {
    migas() { return this.listado ? relativoABase(this.listado.path, this.listado.base).split('/').filter(Boolean) : [] },
    visibles() {
      const aguja = this.filtro.trim().toLowerCase()
      return (this.listado ? this.listado.folders : []).filter((n) => n.toLowerCase().includes(aguja))
    }
  },
  mounted() { this.ir() },
  methods: {
    unir(nombre) { return this.listado.path + '/' + nombre },
    haciaMiga(i) { return this.listado.base + '/' + this.migas.slice(0, i + 1).join('/') },
    ir(ruta) {
      this.cargando = true
      this.error = null
      this.filtro = ''
      planificadorApi.dropboxCarpetas(ruta).then((l) => { this.listado = l }, (e) => { this.error = mensajeError(e) }).finally(() => { this.cargando = false })
    }
  }
}
</script>
