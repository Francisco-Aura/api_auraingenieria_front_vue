<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
/* Escala la aplicación completa al 75% */
body {
  transform: scale(0.75);
  transform-origin: top left;
  width: 133.33%; /* Compensa el escalado al 75% */
  overflow-x: hidden; /* Evita scroll horizontal */
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
