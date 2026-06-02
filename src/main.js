
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/styles.css';

// Importar FontAwesome optimizado (solo iconos necesarios)
import { FontAwesomeIcon } from './plugins/fontawesome';

// Importar SweetAlert2 (se cargará en un chunk separado)
import Swal from 'sweetalert2';

const app = createApp(App);

// Registrar el componente FontAwesome globalmente
app.component('font-awesome-icon', FontAwesomeIcon);

// Configurar SweetAlert2 globalmente
app.config.globalProperties.$swal = Swal;

app.use(router).mount('#app');
