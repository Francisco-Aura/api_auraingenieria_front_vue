<template>
  <p v-if="!vista" :class="error ? 'mat-error' : 'muted'" :role="error ? 'alert' : undefined">{{ error || 'Cargando el material del proyecto…' }}</p>
  <div v-else class="mat">
    <p class="muted mat-help">Solo puede sobrar material de los productos que lleva el presupuesto del proyecto, y como máximo lo que se ha empleado. Lo que registres se suma al stock del producto en el inventario.</p>
    <p v-if="error" class="mat-error" role="alert">{{ error }}</p>

    <p v-if="vista.products.length === 0" class="mat-empty">
      {{ vista.configured ? 'El presupuesto del proyecto no lleva material que pueda sobrar (solo trabajos o gestión).' : 'Este proyecto no tiene presupuesto guardado: sin él no se sabe qué material se ha empleado. Guárdalo desde los ajustes del proyecto.' }}
    </p>
    <ul v-else class="mat-list">
      <li v-for="p in vista.products" :key="p.id" class="mat-item">
        <div class="mat-info">
          <strong class="mat-name">{{ nombreDe(p) }}</strong>
          <span class="mat-nums">Lleva <b>{{ formato(p.used) }}</b><template v-if="p.returned > 0"> · devuelto <b>{{ formato(p.returned) }}</b></template> · puede sobrar <b>{{ formato(p.available) }}</b> · en almacén <b>{{ formato(p.stock) }}</b></span>
        </div>
        <div class="mat-add">
          <campo-numerico :etiqueta="'Sobrante de ' + nombreDe(p)" :model-value="cantidades[p.id] || 0" @update:model-value="cantidades[p.id] = $event" />
          <span class="mat-unit">{{ p.unit }}</span>
          <button type="button" :disabled="p.available <= 0 || ocupado !== null" :title="p.available <= 0 ? 'Ya se ha devuelto todo lo que llevaba' : 'Sumar al stock del producto'" @click="anadir(p)">{{ ocupado === p.id ? 'Guardando…' : 'Añadir al stock' }}</button>
        </div>
      </li>
    </ul>

    <template v-if="vista.returns.length > 0">
      <h5 class="mat-sub">Devuelto al almacén</h5>
      <ul class="mat-returns">
        <li v-for="r in vista.returns" :key="r.id">
          <span class="mat-ret-text"><b>+{{ formato(r.qty) }} {{ r.unit }}</b> {{ r.label }}<span class="muted"> · {{ r.by ? r.by + ', ' : '' }}{{ cuando(r.at) }}</span></span>
          <span v-if="deshaciendo === r.id" class="mat-confirm">¿Restar del stock?
            <button type="button" class="link-btn" :disabled="ocupado !== null" @click="deshacer(r)">Sí</button>
            <button type="button" class="link-btn" @click="deshaciendo = null">No</button>
          </span>
          <button v-else type="button" class="link-btn" @click="deshaciendo = r.id">Deshacer</button>
        </li>
      </ul>
    </template>
  </div>
</template>

<script>
import CampoNumerico from '../Presupuestos/CampoNumerico.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'

const formato = (n) => n.toLocaleString('es-ES', { maximumFractionDigits: 3 })
// «AIKO 615» de la marca AIKO es solo «AIKO 615»: no se repite la marca si el modelo ya empieza por ella
const nombreDe = (p) => (p.brand && p.model.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.model : [p.brand, p.model].filter(Boolean).join(' ')) || p.id

// Revisión de material de un proyecto: los productos que lleva su presupuesto y, de cada uno, cuánto ha sobrado. Lo que se registra
// se suma al stock del producto en el inventario; el servidor comprueba que no sobre más de lo empleado.
export default {
  name: 'Material-Component',
  components: { CampoNumerico },
  props: { proyectoId: { type: String, required: true } },
  data() { return { vista: null, error: null, cantidades: {}, ocupado: null, deshaciendo: null } },
  watch: { proyectoId: { immediate: true, handler() { this.vista = null; this.cantidades = {}; this.cargar() } } },
  methods: {
    formato, nombreDe,
    cuando(iso) { return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    cargar() {
      planificadorApi.material(this.proyectoId).then((v) => { this.vista = v; this.error = null }, (e) => { this.error = mensajeError(e) })
    },
    async ejecutar(clave, accion) {
      this.ocupado = clave
      this.error = null
      try { this.vista = await accion() } catch (e) { this.error = mensajeError(e) } finally { this.ocupado = null }
    },
    anadir(p) {
      const cantidad = this.cantidades[p.id] || 0
      if (!(cantidad > 0)) { this.error = 'Indica cuánto sobra de ' + nombreDe(p) + '.'; return }
      if (cantidad > p.available + 1e-9) {
        this.error = 'De ' + nombreDe(p) + ' no puede sobrar más de ' + formato(p.available) + ' ' + p.unit + ': el proyecto lleva ' + formato(p.used) + ' y ya se han devuelto ' + formato(p.returned) + '.'
        return
      }
      this.ejecutar(p.id, async () => {
        const siguiente = await planificadorApi.devolverMaterial(this.proyectoId, { equipment_id: p.id, qty: cantidad })
        this.cantidades[p.id] = 0
        return siguiente
      })
    },
    async deshacer(r) {
      await this.ejecutar(r.id, () => planificadorApi.deshacerDevolucion(this.proyectoId, r.id))
      this.deshaciendo = null
    }
  }
}
</script>
