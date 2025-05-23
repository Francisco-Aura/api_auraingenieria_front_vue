import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';  // Asegúrate de poner la ruta correcta

// Importar Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

// Importar SweetAlert2
import Swal from 'sweetalert2';

const app = createApp(App);

// Configurar SweetAlert2 globalmente
app.config.globalProperties.$swal = Swal;

app.use(router).mount('#app');
