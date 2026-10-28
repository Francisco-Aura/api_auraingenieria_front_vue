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
import './styles/shared-modal-header.css';
import './styles/shared-buttons.css';
import './styles/shared-motion.css';
import axios from 'axios'

// Los iconos se muestran con la hoja de estilos de Font Awesome enlazada en
// public/index.html (clases "fas fa-..."); no hace falta el componente SVG.

// Importar SweetAlert2 (se cargará en un chunk separado)
import Swal from 'sweetalert2';
import desbordeTabla from './directives/desbordeTabla';
import { instalarCapasModales } from './services/capasModales';
import { instalarDialogos } from './services/dialogos';

axios.defaults.baseURL = "/api"

// La identidad va en la cookie de sesión que fija el login (HttpOnly, la gestiona
// el navegador). X-Requested-With: el backend rechaza sin ella cualquier petición
// que modifique datos, lo que impide que otra web las lance con la sesión del usuario (CSRF).
// X-Aura-Usuario-Nombre se sigue enviando solo por compatibilidad con un backend
// anterior durante el despliegue; el backend nuevo no la usa para identificar.
axios.interceptors.request.use(config => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
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

// Sesión caducada o cerrada en el servidor (401): se limpia el usuario local y se
// vuelve al login. El 401 del propio login (credenciales incorrectas) lo trata su pantalla.
axios.interceptors.response.use(
  response => response,
  error => {
    const url = error?.config?.url || ''
    if (error?.response?.status === 401 && !url.includes('/usuarios/login')) {
      localStorage.removeItem('usuario')
      localStorage.removeItem('token')
      if (router.currentRoute.value.path !== '/') {
        // Cierra el aviso de error que abra la pantalla que hizo la petición
        router.push('/').then(() => setTimeout(() => Swal.close()))
      }
    }
    return Promise.reject(error)
  }
)

// Que otras webs no sepan desde qué pantalla de Aura se pulsó un enlace externo
const politicaReferer = document.createElement('meta')
politicaReferer.name = 'referrer'
politicaReferer.content = 'same-origin'
document.head.appendChild(politicaReferer)

// Aura no se deja mostrar dentro de un marco de otra página (clickjacking: una web
// ajena encima de Aura para que el usuario pulse sin saberlo). No depende del
// servidor web: si alguien la enmarca, ni se monta.
const enMarcoAjeno = (() => {
  try {
    return window.top !== window.self
  } catch (e) {
    return true
  }
})()

if (enMarcoAjeno) {
  try {
    window.top.location = window.self.location.href
  } catch (e) {
    // El navegador no deja salir del marco: la app simplemente no se muestra
  }
} else {
  const app = createApp(App);

  // Configurar SweetAlert2 globalmente, con los textos y el orden de botones de Aura
  instalarDialogos(Swal);
  app.config.globalProperties.$swal = Swal;
  // Modales: la pantalla de detrás no se desplaza y Esc cierra el de encima
  instalarCapasModales();
  // Columna de acciones fija solo cuando la tabla no cabe (ver la directiva)
  app.directive('desborde-tabla', desbordeTabla);

  app.use(router).mount('#app');
}
