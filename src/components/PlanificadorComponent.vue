<template>
  <div class="planificador-wrapper">
    <!-- Mientras carga el planificador se muestra un esqueleto, como en el resto de módulos -->
    <div v-if="cargando" class="planificador-skeleton" aria-hidden="true">
      <div class="sk-bar sk-title"></div>
      <div class="sk-row">
        <div class="sk-bar sk-card"></div>
        <div class="sk-bar sk-card"></div>
        <div class="sk-bar sk-card"></div>
      </div>
      <div class="sk-bar sk-table"></div>
    </div>
    <iframe
      class="planificador-frame"
      :class="{ 'planificador-oculto': cargando }"
      src="/planificador/"
      title="Planificador de proyectos"
      @load="cargando = false"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'Planificador-Component',
  data() {
    return { cargando: true };
  }
};
</script>

<style scoped>
.planificador-wrapper {
  position: relative;
  height: 100%; /* el dashboard le da exactamente el alto que queda bajo la cabecera */
}

.planificador-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #f7f9fc;
}

.planificador-oculto {
  visibility: hidden;
}

.planificador-skeleton {
  position: absolute;
  inset: 0;
  padding: 24px;
}

.sk-bar {
  border-radius: 8px;
  background: linear-gradient(90deg, #e8edf3 25%, #f4f7fa 50%, #e8edf3 75%);
  background-size: 200% 100%;
  animation: sk-brillo 1.4s ease-in-out infinite;
}

.sk-title { width: 240px; height: 28px; margin-bottom: 24px; }
.sk-row { display: flex; gap: 16px; margin-bottom: 24px; }
.sk-card { flex: 1; height: 110px; }
.sk-table { height: 320px; }

@keyframes sk-brillo {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
</style>
