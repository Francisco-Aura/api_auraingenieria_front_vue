<template>
  <div class="lists-manager">
    <p class="muted lists-help">
      Aquí se crean y se eliminan las marcas y los proveedores; en cada producto solo se elige de la lista. Solo se puede eliminar
      uno que ningún producto use: para quitar uno que está en uso, cambia antes el de sus productos.
    </p>
    <div class="lists-grid">
      <section v-for="col in columnas" :key="col.tipo" class="lists-col" :aria-label="col.titulo">
        <h3>{{ col.titulo }} <span v-if="col.filas" class="muted">({{ col.filas.length }})</span></h3>
        <form class="lists-add" @submit.prevent="anadir(col.tipo)">
          <input v-model="nuevo[col.tipo]" :placeholder="col.marcador" :aria-label="col.tipo === 'marca' ? 'Nombre de la nueva marca' : 'Nombre del nuevo proveedor'">
          <button type="submit" :disabled="!nuevo[col.tipo].trim()">Añadir</button>
        </form>
        <p v-if="col.filas === null" class="muted">Cargando…</p>
        <p v-else-if="col.filas.length === 0" class="muted">No hay ninguno.</p>
        <ul v-else>
          <li v-for="f in col.filas" :key="f.name">
            <span class="lists-name">{{ f.name }}</span>
            <span v-if="f.products > 0" class="muted">{{ f.products }} producto{{ f.products === 1 ? '' : 's' }}</span>
            <button v-else type="button" class="secondary lists-remove" @click="eliminar(col.tipo, f.name)">Eliminar</button>
          </li>
        </ul>
      </section>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'

// Las listas de marcas y de proveedores del inventario: aquí se crean y se eliminan.
export default {
  name: 'Listas-Marcas-Proveedores',
  emits: ['cambiado'],
  data() {
    return { marcas: null, proveedores: null, error: '', nuevo: { marca: '', proveedor: '' } }
  },
  computed: {
    columnas() {
      return [
        { tipo: 'marca', titulo: 'Marcas', marcador: 'Nueva marca…', filas: this.marcas },
        { tipo: 'proveedor', titulo: 'Proveedores', marcador: 'Nuevo proveedor…', filas: this.proveedores }
      ]
    }
  },
  mounted() { this.cargar() },
  methods: {
    async cargar() {
      try {
        const [m, p] = await Promise.all([planificadorApi.marcas(), planificadorApi.proveedores()])
        this.marcas = m
        this.proveedores = p
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    async eliminar(tipo, nombre) {
      if (!window.confirm('Se eliminará ' + (tipo === 'marca' ? 'la marca' : 'el proveedor') + ' «' + nombre + '» de la lista. ¿Continuar?')) return
      this.error = ''
      try {
        await (tipo === 'marca' ? planificadorApi.borrarMarca(nombre) : planificadorApi.borrarProveedor(nombre))
        await this.cargar()
        this.$emit('cambiado')
      } catch (e) {
        this.error = mensajeError(e)
      }
    },
    async anadir(tipo) {
      const nombre = this.nuevo[tipo].trim()
      if (!nombre) return
      this.error = ''
      try {
        await (tipo === 'marca' ? planificadorApi.crearMarca(nombre) : planificadorApi.crearProveedor(nombre))
        this.nuevo[tipo] = ''
        await this.cargar()
        this.$emit('cambiado')
      } catch (e) {
        this.error = mensajeError(e)
      }
    }
  }
}
</script>
