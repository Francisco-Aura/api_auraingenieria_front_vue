<template>
  <modal-component titulo="Duplicar presupuesto" @cerrar="$emit('cerrar')">
    <p class="hint">Se copia todo el presupuesto: <strong>{{ nombre }}</strong></p>
    <fieldset class="price-box payment-mode">
      <legend>Cliente de la copia</legend>
      <label class="radio">
        <input v-model="cliente" type="radio" name="cliente-copia" value="mismo">
        <span>
          <strong>Mantener el mismo cliente</strong>
          <small class="muted"> — es otra versión del mismo proyecto: se junta con él en el listado (v1, v2…).</small>
        </span>
      </label>
      <label class="radio">
        <input v-model="cliente" type="radio" name="cliente-copia" value="otro">
        <span>
          <strong>Elegir otro cliente</strong>
          <small class="muted"> — la copia sale sin cliente y se abre en «Parámetros» para elegirlo (uno existente o un potencial nuevo).</small>
        </span>
      </label>
    </fieldset>
    <label v-if="variante && cliente === 'mismo'" class="field">
      Nombre de la versión <span class="muted">(opcional, por ejemplo «con baterías»)</span>
      <input v-model="nombreVariante" maxlength="60" placeholder="Si lo dejas vacío solo se numera: v2, v3…" @keydown.enter.prevent="confirmar">
    </label>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" @click="confirmar">Duplicar</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'

// Al duplicar un presupuesto: se copia entero y solo se elige si la copia lleva el mismo cliente (otra versión del mismo proyecto)
// u otro cliente (un presupuesto suelto, sin cliente hasta que se elija).
export default {
  name: 'Duplicar-Presupuesto-Modal',
  components: { ModalComponent },
  props: {
    nombre: { type: String, default: '' },
    // Un presupuesto compartido (no descartado) se guarda ya en el servidor como una versión más de su proyecto
    variante: { type: Boolean, default: false }
  },
  emits: ['cerrar', 'confirmar'],
  data() { return { cliente: 'mismo', nombreVariante: '' } },
  methods: {
    confirmar() { this.$emit('confirmar', { cliente: this.cliente, nombre: this.nombreVariante.trim() }) }
  }
}
</script>
