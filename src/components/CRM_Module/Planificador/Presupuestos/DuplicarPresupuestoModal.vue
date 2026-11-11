<template>
  <modal-component titulo="Duplicar presupuesto" @cerrar="$emit('cerrar')">
    <p class="hint">Se copia todo el presupuesto: <strong>{{ nombre }}</strong></p>
    <fieldset class="price-box payment-mode">
      <legend>Cliente de la copia</legend>
      <label class="radio">
        <input v-model="cliente" type="radio" name="cliente-copia" value="mismo">
        <span><strong>Mantener el mismo cliente</strong></span>
      </label>
      <label class="radio">
        <input v-model="cliente" type="radio" name="cliente-copia" value="otro">
        <span>
          <strong>Elegir otro cliente</strong>
          <small class="muted"> — la copia sale sin cliente y se abre en «Parámetros» para elegirlo (uno existente o un potencial nuevo).</small>
        </span>
      </label>
    </fieldset>
    <fieldset v-if="variante && cliente === 'mismo'" class="price-box payment-mode">
      <legend>Qué se crea</legend>
      <label class="radio">
        <input v-model="como" type="radio" name="como-copia" value="copia">
        <span><strong>Una copia</strong><small class="muted"> — un presupuesto nuevo e independiente, solo en este navegador hasta que lo guardes.</small></span>
      </label>
      <label class="radio">
        <input v-model="como" type="radio" name="como-copia" value="variante">
        <span><strong>Una variante de esta oferta</strong><small class="muted"> — se guarda ya en el servidor como borrador de la misma oferta, para compararlas.</small></span>
      </label>
    </fieldset>
    <label v-if="variante && cliente === 'mismo' && como === 'variante'" class="field">
      Nombre de la variante <span class="muted">(opcional)</span>
      <input v-model="nombreVariante" maxlength="60" placeholder="Si lo dejas vacío se llamará «Versión N»" @keydown.enter.prevent="confirmar">
    </label>
    <template #pie>
      <button type="button" class="secondary" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" @click="confirmar">Duplicar</button>
    </template>
  </modal-component>
</template>

<script>
import ModalComponent from '../Inventario/ModalComponent.vue'

// Al duplicar un presupuesto: se copia entero; se elige si lleva el mismo cliente u otro y, en uno compartido, si la copia es
// independiente o una variante de su misma oferta.
export default {
  name: 'Duplicar-Presupuesto-Modal',
  components: { ModalComponent },
  props: {
    nombre: { type: String, default: '' },
    // Un presupuesto compartido (no descartado) también se puede duplicar como variante de su oferta
    variante: { type: Boolean, default: false }
  },
  emits: ['cerrar', 'confirmar'],
  data() { return { cliente: 'mismo', como: 'copia', nombreVariante: '' } },
  methods: {
    confirmar() {
      const variante = this.variante && this.cliente === 'mismo' && this.como === 'variante'
      this.$emit('confirmar', { cliente: this.cliente, variante, nombre: this.nombreVariante.trim() })
    }
  }
}
</script>
