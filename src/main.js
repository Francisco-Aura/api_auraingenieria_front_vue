import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';  // Asegúrate de poner la ruta correcta



createApp(App).use(router).mount('#app');
