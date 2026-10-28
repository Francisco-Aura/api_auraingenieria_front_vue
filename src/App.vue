<template>
  <div class="app-container">
    <router-view></router-view>
    <button
      type="button"
      class="boton-tema"
      :title="oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      @click="alternar"
    >
      {{ oscuro ? '☀️' : '🌙' }}
    </button>
  </div>
</template>

<script>
import { alternarTema, temaActual } from './modo-oscuro';

export default {
  name: 'App',
  data() {
    return { oscuro: temaActual() === 'oscuro' };
  },
  methods: {
    alternar() {
      alternarTema();
      this.oscuro = temaActual() === 'oscuro';
    }
  }
};
</script>

<style src="./App.css"></style>