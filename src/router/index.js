import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
import DashboardComponent from '@/components/DashboardComponent.vue';
//CRM
import ClientesComponent from '@/components/CRM_Module/Clientes/ClientesComponent.vue';
import PuntosSuministroComponent from '@/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
import AdministracionComponent from '@/components/CRM_Module/Administracion/AdministracionComponent.vue';


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
        path: 'administracion',
        component: AdministracionComponent
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
