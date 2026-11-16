// Entrada del Planificador: se publica como página propia (/planificador/) y la intranet la enseña dentro de un marco,
// de modo que sus estilos no se mezclan con los de la intranet.
import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import { cabecerasUsuario } from '@/services/usuarioActual'
import { iniciarTema } from '@/utils/planificador/tema'
import '@/styles/planificador/index.css'
import '@/styles/planificador/App.css'
import '@/styles/planificador/Dialog.css'
import '@/styles/planificador/CalculadoraCostes.css'
import '@/styles/planificador/Inventario.css'
import '@/styles/planificador/Estudios.css'
import '@/styles/planificador/PanelHistorialPrecios.css'
import '@/styles/planificador/Chips.css'
import '@/styles/planificador/ListaTareas.css'
import '@/styles/planificador/TableroTareas.css'
import '@/styles/planificador/Gantt.css'
import '@/styles/planificador/Cambios.css'
import '@/styles/planificador/CarpetaDropbox.css'
import '@/styles/planificador/SelectorCarpetaDropbox.css'
import '@/styles/planificador/GeneradorContrato.css'
import '@/styles/planificador/ContratoProyecto.css'
import '@/styles/planificador/CambiosPresupuesto.css'
import '@/styles/planificador/PlanPagos.css'
import '@/styles/planificador/ModoPago.css'
import '@/styles/planificador/PanelMaterial.css'
import '@/styles/planificador/SubidaContrato.css'
import '@/styles/planificador/PanelTarea.css'
import '@/styles/planificador/VistaActividad.css'
import '@/styles/planificador/EliminarProyecto.css'
import '@/styles/planificador/Inicio.css'
import '@/styles/planificador/RichText.css'
import '@/styles/planificador/VisorEscaneo.css'
import '@/styles/planificador/VistaCambios.css'
import '@/styles/planificador/FichaProducto.css'

axios.defaults.baseURL = '/api'

// Igual que la intranet: el usuario viaja en cabeceras en todas las peticiones (no se verifica)
axios.interceptors.request.use(config => {
  // El backend de la intranet rechaza sin esta cabecera cualquier petición que modifique datos (protección CSRF):
  // la envían todas las pantallas de la intranet y el Planificador también la necesita para guardar
  config.headers['X-Requested-With'] = 'XMLHttpRequest'
  Object.assign(config.headers, cabecerasUsuario())
  return config
})

iniciarTema()

// Dentro de la intranet (marco) los paneles ocupan todo el espacio; solo suelto (pestaña propia) llevan margen
if (window.self !== window.top) document.documentElement.classList.add('embedded')
createApp(App).mount('#app')
