import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
import DashboardComponent from '@/components/DashboardComponent.vue';
import CRM from '@/components/CRM_Module/PrincipalComponent.vue';
import ClientesComponent from '@/components/CRM_Module/ClientesComponent.vue';
import ContratosComponent from '@/components/CRM_Module/ContratosComponent.vue';
import PuntosSuministroComponent from '@/components/CRM_Module/PuntoSuministroComponent.vue';
import ServiciosComponent from '@/components/CRM_Module/ServiciosComponent.vue';

// Define las rutas
const routes = [
  {
    path: '/',
    component: LoginComponent
  },
  {
    path: '/dashboard',
    component: DashboardComponent
  },
  {
    path: '/dashboard/crm',
    component: CRM,
    children: [
      {
        path: 'clientes',
        component: ClientesComponent
      },
      {
        path: 'puntos-suministro',
        component: PuntosSuministroComponent
      },
      {
        path: 'contratos',
        component: ContratosComponent
      },
      {
        path: 'servicios',
        component: ServiciosComponent
      }
    ]
  }
];

// Crea el router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Exporta el router
export default router;
