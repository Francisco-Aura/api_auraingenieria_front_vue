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
import '@/styles/planificador/CostCalculator.css'
import '@/styles/planificador/Inventory.css'
import '@/styles/planificador/PriceHistoryPanel.css'
import '@/styles/planificador/Chips.css'
import '@/styles/planificador/TaskList.css'
import '@/styles/planificador/TaskBoard.css'
import '@/styles/planificador/Gantt.css'
import '@/styles/planificador/Changes.css'
import '@/styles/planificador/DropboxFolder.css'
import '@/styles/planificador/DropboxFolderPicker.css'
import '@/styles/planificador/ContractGenerator.css'
import '@/styles/planificador/ProjectContract.css'
import '@/styles/planificador/BudgetChanges.css'
import '@/styles/planificador/PaymentPlan.css'
import '@/styles/planificador/PaymentModeChoice.css'
import '@/styles/planificador/MaterialPanel.css'
import '@/styles/planificador/ContractUpload.css'
import '@/styles/planificador/TaskDrawer.css'
import '@/styles/planificador/ActivityView.css'
import '@/styles/planificador/DeleteProject.css'
import '@/styles/planificador/Home.css'
import '@/styles/planificador/RichText.css'
import '@/styles/planificador/ScanViewer.css'
import '@/styles/planificador/ChangesView.css'
import '@/styles/planificador/ProductSheet.css'

axios.defaults.baseURL = '/api'

// Igual que la intranet: el usuario viaja en cabeceras en todas las peticiones (no se verifica)
axios.interceptors.request.use(config => {
  Object.assign(config.headers, cabecerasUsuario())
  return config
})

iniciarTema()
createApp(App).mount('#app')
