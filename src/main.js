import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/tokens.css';
import './styles/swal-dialogs.css';
import './assets/styles.css';
import './styles/shared-animations.css';
import './styles/shared-modern-forms.css';
import './styles/shared-pagination.css';
import './styles/shared-row-states.css';
import './styles/shared-ui.css';
import axios from 'axios'

// Importar FontAwesome optimizado (solo iconos necesarios)
import { FontAwesomeIcon } from './plugins/fontawesome';

// Importar SweetAlert2 (se cargará en un chunk separado)
import Swal from 'sweetalert2';

axios.defaults.baseURL = "/api"

// Interceptor global para añadir X-Aura-Usuario-Nombre en TODAS las peticiones
axios.interceptors.request.use(config => {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    if (usuario && usuario.nombre) {
      config.headers['X-Aura-Usuario-Nombre'] = usuario.nombre
    }
  } catch (e) {
    // Ignorar errores de localStorage
  }
  return config
})

const app = createApp(App);

// Registrar el componente FontAwesome globalmente
app.component('font-awesome-icon', FontAwesomeIcon);

// Configurar SweetAlert2 globalmente
app.config.globalProperties.$swal = Swal;

app.use(router).mount('#app');
