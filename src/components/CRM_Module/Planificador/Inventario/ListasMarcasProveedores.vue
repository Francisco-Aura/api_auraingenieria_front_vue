<template>
  <div class="lists-manager">
    <p class="muted lists-ayuda">
      Aquí se crean y se eliminan las marcas y los proveedores, y se pone el logo de cada marca; en cada producto solo se elige de la
      lista. Solo se puede eliminar uno que ningún producto use: para quitar uno que está en uso, cambia antes el de sus productos.
    </p>
    <div class="lists-rejilla">
      <section v-for="col in columnas" :key="col.tipo" class="lists-col" :aria-label="col.titulo">
        <h3>{{ col.titulo }} <span v-if="col.filas" class="muted">({{ col.filas.length }})</span></h3>
        <form class="lists-anadir" @submit.prevent="anadir(col.tipo)">
          <input v-model="nuevo[col.tipo]" :placeholder="col.marcador" :aria-label="col.tipo === 'marca' ? 'Nombre de la nueva marca' : 'Nombre del nuevo proveedor'">
          <label v-if="col.tipo === 'marca'" class="secondary lists-logo-boton" :title="logoNuevo ? logoNuevo.name : 'Logo de la marca (opcional)'">
            {{ logoNuevo ? 'Logo ✓' : 'Logo' }}
            <input type="file" :accept="TIPOS_LOGO" hidden @change="elegirLogoNuevo">
          </label>
          <button type="submit" :disabled="!nuevo[col.tipo].trim()">Añadir</button>
        </form>
        <p v-if="col.filas === null" class="muted">Cargando…</p>
        <p v-else-if="col.filas.length === 0" class="muted">No hay ninguno.</p>
        <ul v-else>
          <li v-for="f in col.filas" :key="f.name">
            <span class="lists-nombre">
              <logo-marca v-if="col.tipo === 'marca'" :nombre="f.name" :tiene-logo="!!f.logo" :version="version" :tamano="28" />
              <span>{{ f.name }}</span>
            </span>
            <span class="lists-acciones">
              <label v-if="col.tipo === 'marca'" class="secondary lists-logo-boton">
                {{ f.logo ? 'Cambiar logo' : 'Subir logo' }}
                <input type="file" :accept="TIPOS_LOGO" hidden @change="subirLogo(f.name, $event)">
              </label>
              <span v-if="f.products > 0" class="muted">{{ f.products }} producto{{ f.products === 1 ? '' : 's' }}</span>
              <button v-else type="button" class="secondary lists-quitar" @click="eliminar(col.tipo, f.name)">Eliminar</button>
            </span>
          </li>
        </ul>
      </section>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script>
import LogoMarca from './LogoMarca.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { prepararLogo } from '@/utils/planificador/logo'

// Las listas de marcas y de proveedores del inventario: aquí se crean y se eliminan. Las marcas llevan su logo, que se sube al
// crearlas o después desde su fila; es el único sitio donde se cambia.
export default {
  name: 'Listas-Marcas-Proveedores',
  components: { LogoMarca },
  emits: ['cambiado'],
  data() {
    return {
      TIPOS_LOGO: 'image/png,image/jpeg,image/webp,image/svg+xml',
      marcas: null, proveedores: null, error: '', nuevo: { marca: '', proveedor: '' },
      logoNuevo: null, // logo elegido para la marca que se está creando
      version: 0
    }
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
    elegirLogoNuevo(evento) {
      this.logoNuevo = (evento.target.files && evento.target.files[0]) || null
      evento.target.value = ''
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
        // El logo se prepara antes de crear nada: si no vale, no se queda la marca a medias
        const logo = tipo === 'marca' && this.logoNuevo ? await prepararLogo(this.logoNuevo) : null
        await (tipo === 'marca' ? planificadorApi.crearMarca(nombre) : planificadorApi.crearProveedor(nombre))
        if (logo) await planificadorApi.guardarLogoMarca(nombre, logo)
        this.nuevo[tipo] = ''
        if (tipo === 'marca') this.logoNuevo = null
      } catch (e) {
        this.error = mensajeError(e)
      }
      this.version += 1
      await this.cargar()
      this.$emit('cambiado')
    },
    async subirLogo(nombre, evento) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (!archivo) return
      this.error = ''
      try {
        await planificadorApi.guardarLogoMarca(nombre, await prepararLogo(archivo))
        this.version += 1
        await this.cargar()
        this.$emit('cambiado')
      } catch (e) {
        this.error = mensajeError(e) || 'No se pudo subir el logo'
      }
    }
  }
}
</script>
