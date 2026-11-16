<template>
  <nav v-if="actual" class="variante-tira" aria-label="Variantes de esta oferta">
    <span class="muted variante-tira-etiqueta">Variantes de esta oferta</span>
    <div class="variante-tira-lista">
      <div v-for="v in variantes" :key="v.id" class="variante-chip" :class="{ actual: v.id === presupuestoId }" :aria-current="v.id === presupuestoId ? 'true' : undefined">
        <template v-if="v.id === presupuestoId">
          <strong>{{ etiquetas.get(v.id) }}</strong>
          <span class="tag state" :class="etiqueta(v).cls" :title="etiqueta(v).title">{{ etiqueta(v).label }}</span>
          <span>{{ v.budget_total > 0 ? eur(v.budget_total) : '—' }}</span>
          <button type="button" class="icon-btn variante-renombrar" title="Cambiar el nombre de esta variante" aria-label="Cambiar el nombre de esta variante" @click="renombrar">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3zM13.5 6.5l3 3" /></svg>
          </button>
        </template>
        <button v-else type="button" class="variante-abrir" title="Abrir esta variante" @click="$emit('abrir', v.id)">
          <strong>{{ etiquetas.get(v.id) }}</strong>
          <span class="tag state" :class="etiqueta(v).cls" :title="etiqueta(v).title">{{ etiqueta(v).label }}</span>
          <span>{{ v.budget_total > 0 ? eur(v.budget_total) : '—' }}</span>
          <span v-if="v.budget_total > 0 && actual.budget_total > 0 && v.budget_total !== actual.budget_total" class="muted">
            ({{ v.budget_total > actual.budget_total ? '+' : '−' }}{{ eur(Math.abs(v.budget_total - actual.budget_total)) }})
          </span>
        </button>
        <button v-if="puedeEliminar(v)" type="button" class="icon-btn variante-papelera" title="Eliminar esta variante" :aria-label="'Eliminar la variante ' + etiquetas.get(v.id)" @click="eliminar(v)">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
        </button>
      </div>
      <button type="button" class="secondary variant-new" @click="$emit('nueva')">+ Nueva variante</button>
    </div>
  </nav>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { usuarioActual } from '@/services/usuarioActual'
import { eur } from '@/utils/planificador/formato'
import { variantLabels } from '@/utils/planificador/variantes'
import { etiquetaEstado, puedeBorrar } from '@/utils/planificador/listaPresupuestos'

// Las variantes de la oferta del presupuesto abierto, para compararlas y saltar de una a otra sin volver a la lista.
export default {
  name: 'Tira-Variantes',
  props: {
    presupuestoId: { type: String, required: true },
    // Cambia cuando cambia el estado del presupuesto o de su propuesta: se vuelve a pedir la lista al servidor
    refrescar: { type: String, default: '' }
  },
  emits: ['abrir', 'nueva', 'eliminada'],
  data() { return { todos: null } },
  computed: {
    actual() { return this.todos && this.todos.find((b) => b.id === this.presupuestoId) },
    // Un presupuesto sin variantes es la única de su oferta: la tira le da igualmente el botón de crear otra
    variantes() {
      const a = this.actual
      if (!a) return []
      return a.offer_id ? this.todos.filter((b) => b.offer_id === a.offer_id).sort((x, y) => x.created_at.localeCompare(y.created_at)) : [a]
    },
    etiquetas() { return variantLabels(this.variantes) }
  },
  watch: {
    presupuestoId() { this.cargar() },
    refrescar() { this.cargar() }
  },
  mounted() { this.cargar() },
  methods: {
    eur,
    etiqueta(v) { return etiquetaEstado({ kind: v.status, proposal: v.proposal_status }) },
    puedeEliminar(v) { return this.variantes.length > 1 && puedeBorrar(v.owner, v.owner_id, usuarioActual()) },
    async cargar() {
      try { this.todos = await planificadorApi.presupuestos() } catch (e) { /* sin tira: no pasa nada */ }
    },
    async renombrar() {
      const nombre = window.prompt('Nombre de esta versión (opcional; vacío = solo el número, v1, v2…):', this.actual.variant_name)
      if (nombre === null) return
      try {
        const actualizada = await planificadorApi.renombrarVariante(this.presupuestoId, nombre.trim())
        this.todos = this.todos.map((b) => (b.id === actualizada.id ? { ...b, variant_name: actualizada.variant_name } : b))
      } catch (e) {
        window.alert(mensajeError(e))
      }
    },
    // Se pregunta dos veces: eliminar una variante la borra para todos los usuarios y no se puede deshacer
    async eliminar(v) {
      const otras = this.variantes.filter((o) => o.id !== v.id)
      const nombre = this.etiquetas.get(v.id)
      if (!window.confirm('Se eliminará la variante «' + nombre + '» de esta oferta para todos los usuarios de la intranet. No se puede deshacer. ¿Continuar?')) return
      if (!window.confirm('Última comprobación: ¿eliminar definitivamente «' + nombre + '»?')) return
      try {
        await planificadorApi.borrarPresupuesto(v.id)
      } catch (e) {
        window.alert(mensajeError(e))
        return
      }
      // Si era la abierta, se abre otra en su lugar; si no, se vuelve a pedir la lista
      this.$emit('eliminada', v.id === this.presupuestoId ? (otras[0] && otras[0].id) : null)
      this.cargar()
    }
  }
}
</script>
