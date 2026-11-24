<template>
  <dialog ref="dialogo" class="rh-ventana" aria-labelledby="rh-dialogo-titulo" @cancel.prevent="$emit('cerrar')">
    <div class="rh-dialogo">
      <h2 id="rh-dialogo-titulo">{{ titulo }}</h2>
      <slot></slot>
    </div>
  </dialog>
</template>

<script>
// Ventana modal con <dialog>: el foco queda dentro, Esc la cierra y el fondo no responde.
export default {
  name: 'DialogoRegistro',
  props: { titulo: { type: String, required: true } },
  emits: ['cerrar'],
  mounted() {
    const d = this.$refs.dialogo;
    if (d && !d.open) d.showModal();
  },
  beforeUnmount() {
    const d = this.$refs.dialogo;
    if (d && d.open) d.close();
  }
};
</script>
