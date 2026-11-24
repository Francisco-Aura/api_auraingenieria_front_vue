<template>
  <modal-component :ancho="true" titulo="Editar datos del proyecto" @cerrar="$emit('cerrar')">
    <label class="field">Nombre <input v-model="nombre"></label>
    <label class="field">Descripción <textarea v-model="descripcion" rows="2" /></label>
    <fieldset class="precio-caja">
      <legend>Contrato inicial de referencia</legend>
      <p class="hint">Es la base de los cambios registrados. Modificarlo recalcula los importes y datos vigentes.</p>
      <campos-contrato v-model:valores="valores" :campos="campos" />
      <comprobaciones-contrato :valores="valores" />
    </fieldset>
    <p v-if="error" class="error">{{ error }}</p>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" :disabled="!nombre.trim() || ocupado" @click="guardar">Guardar</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'
import CamposContrato from '../Contratos/CamposContrato.vue'
import ComprobacionesContrato from '../Contratos/ComprobacionesContrato.vue'
import { mensajeError } from '@/services/planificadorApi'
import { formularioDeContrato } from '@/utils/planificador/contratos/formatoContrato'

// Datos del proyecto: nombre, descripción y contrato inicial de referencia.
export default {
  name: 'Editar-Proyecto-Modal',
  components: { ModalComponent, CamposContrato, ComprobacionesContrato },
  props: {
    proyecto: { type: Object, required: true },
    campos: { type: Array, required: true },
    base: { type: Object, default: () => ({}) },
    alGuardar: { type: Function, required: true }
  },
  emits: ['cerrar'],
  data() {
    return { nombre: this.proyecto.name, descripcion: this.proyecto.description, valores: formularioDeContrato(this.campos, this.base), ocupado: false, error: null }
  },
  methods: {
    async guardar() {
      this.ocupado = true
      this.error = null
      try {
        await this.alGuardar({ name: this.nombre.trim(), description: this.descripcion.trim(), baseline: this.valores })
      } catch (e) {
        this.error = mensajeError(e)
        this.ocupado = false
      }
    }
  }
}
</script>
