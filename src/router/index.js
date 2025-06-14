import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
import DashboardComponent from '@/components/DashboardComponent.vue';
//CRM
import ClientesComponent from '@/components/CRM_Module/Clientes/ClientesComponent.vue';
import PuntosSuministroComponent from '@/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
import InformesComponent from '@/components/CRM_Module/Informes/InformesComponent.vue';
import AdministracionComponent from '@/components/CRM_Module/Administracion/AdministracionComponent.vue';
import KanbanComponent from '@/components/Kanban/KanbanComponent.vue';

// Define las rutas
const routes = [
  {
    path: '/',
    component: LoginComponent
  },
  {
    path: '/dashboard',
    component: DashboardComponent,
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
        path: 'informes',
        component: InformesComponent
      },
      {
        path: 'administracion',
        component: AdministracionComponent
      },
      {
        path: 'kanban',
        component: KanbanComponent
      }
    ]
  },  
];

// Crea el router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Exporta el router
export default router;
