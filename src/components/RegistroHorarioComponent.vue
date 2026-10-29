<template>
  <div class="registro-horario-wrapper">
    <!-- Mientras carga se muestra un esqueleto, como en el resto de módulos -->
    <div v-if="cargando" class="registro-horario-skeleton" aria-hidden="true">
      <div class="sk-bar sk-title"></div>
      <div class="sk-row">
        <div class="sk-bar sk-card"></div>
        <div class="sk-bar sk-card"></div>
      </div>
      <div class="sk-bar sk-table"></div>
    </div>
    <iframe
      class="registro-horario-frame"
      :class="{ 'registro-horario-oculto': cargando }"
      src="/registro-horario/"
      title="Registro horario"
      @load="cargando = false"
    ></iframe>
  </div>
</template>

<script>
// Muestra el módulo «Registro horario», que nginx publica en /registro-horario/ (mismo origen que la intranet:
// por eso el modo oscuro, que se guarda en el localStorage de la intranet, le llega solo).
export default {
  name: 'RegistroHorario-Component',
  data() {
    return { cargando: true };
  }
};
</script>

<style scoped>
.registro-horario-wrapper {
  position: relative;
  height: 100%; /* el dashboard le da exactamente el alto que queda bajo la cabecera */
}

.registro-horario-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #f7f9fc;
}

.registro-horario-oculto {
  visibility: hidden;
}

.registro-horario-skeleton {
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
.sk-card { flex: 1; height: 160px; }
.sk-table { height: 320px; }

@keyframes sk-brillo {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
</style>
