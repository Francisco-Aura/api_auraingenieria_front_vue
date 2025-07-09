import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
//CRM
import ClientesComponent from '@/components/CRM_Module/Clientes/ClientesComponent.vue';
import PuntosSuministroComponent from '@/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue';
import InformesComponent from '@/components/CRM_Module/Informes/InformesComponent.vue';
import AdministracionComponent from '@/components/CRM_Module/Administracion/AdministracionComponent.vue';

// Define las rutas
const routes = [
  {
    path: '/',
    component: LoginComponent
  },
  {
    path: '/clientes',
    component: ClientesComponent
  },
  // Puedes agregar aquí rutas directas a los módulos si lo necesitas
];

// Crea el router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Exporta el router
export default router;
