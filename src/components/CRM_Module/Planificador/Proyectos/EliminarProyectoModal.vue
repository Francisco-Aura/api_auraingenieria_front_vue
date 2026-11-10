<template>
  <modal-component titulo="Eliminar proyecto" @cerrar="$emit('cerrar')">
    <p>Vas a eliminar <strong>{{ nombre }}</strong> con todas sus tareas, documentación aportada, cambios y registro de actividad.</p>
    <p class="hint">Se borra <strong>definitivamente y al momento</strong>: no se puede deshacer ni recuperar.</p>
    <label class="check-row"><input v-model="entendido" type="checkbox"> Entiendo que el proyecto dejará de estar disponible para todo el equipo.</label>
    <label class="field">
      Para confirmar, escribe el nombre del proyecto:
      <span class="confirm-name">{{ nombre }}</span>
      <input v-model="escrito" :placeholder="nombre" autocomplete="off" spellcheck="false">
    </label>
    <p v-if="error" class="error">{{ error }}</p>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="danger-btn" :disabled="!entendido || !coincide || ocupado" @click="confirmar">{{ ocupado ? 'Eliminando…' : 'Eliminar proyecto' }}</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import { mensajeError } from '@/services/planificadorApi'

// Eliminar un proyecto exige entender lo que implica y escribir su nombre exacto.
export default {
  name: 'Eliminar-Proyecto-Modal',
  components: { ModalComponent },
  props: { nombre: { type: String, required: true }, alConfirmar: { type: Function, required: true } },
  emits: ['cerrar'],
  data() { return { entendido: false, escrito: '', ocupado: false, error: null } },
  computed: { coincide() { return this.escrito.trim() === this.nombre.trim() } },
  methods: {
    async confirmar() {
      this.ocupado = true
      this.error = null
      try { await this.alConfirmar() } catch (e) { this.error = mensajeError(e); this.ocupado = false }
    }
  }
}
</script>
