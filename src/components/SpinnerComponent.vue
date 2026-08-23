<template>
  <Teleport to="body">
    <div v-if="isLoading" class="spinner-overlay">
      <div class="spinner-container">
        <div class="spinner-modern">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-core">
            <i class="fas fa-bolt"></i>
          </div>
        </div>
        <div class="loading-text">
          <span class="loading-text-main">Cargando</span>
          <span class="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: "SpinnerComponent",
  props: {
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped src="./SpinnerComponent.css"></style>
