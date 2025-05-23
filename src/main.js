import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';  // Asegúrate de poner la ruta correcta

// Importar Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

createApp(App).use(router).mount('#app');
