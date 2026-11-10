import { createRouter, createWebHistory } from 'vue-router'

const PlanificadorComponent = () => import('@/components/CRM_Module/Planificador/PlanificadorComponent.vue')

// La página se publica en /planificador/: la única ruta es la raíz de esa dirección (con ?proyecto=…&tarea=… cuando viene de un aviso)
export default createRouter({
  history: createWebHistory('/planificador/'),
  routes: [{ path: '/', component: PlanificadorComponent, meta: { requiresAuth: true } }]
})
