<template>
  <div class="spinner-overlay" v-if="isLoading">
    <div class="spinner"></div>
  </div>
</template>

<script>
export default {
  props: {
    isLoading: {
      type: Boolean,
      required: true,
    },
  },
};
</script>

<style scoped>
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Más oscuro para mayor visibilidad */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Alinea el spinner arriba */
  z-index: 9999;
  padding-top: 100px; /* Da espacio desde la parte superior */
}

.spinner {
  border: 6px solid rgba(255, 255, 255, 0.3); /* Grosor incrementado */
  border-top: 6px solid #fff; /* Blanco puro para mayor contraste */
  border-radius: 50%;
  width: 80px; /* Tamaño aumentado */
  height: 80px;
  animation: spin 0.8s linear infinite; /* Velocidad de rotación más rápida */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
