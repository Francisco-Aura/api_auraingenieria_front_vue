import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
import DashboardComponent from '@/components/DashboardComponent.vue';
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
    path: '/dashboard',
    component: DashboardComponent,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'clientes',
        component: ClientesComponent,
        meta: { requiresAuth: true }
      },
      {
        path: 'puntos-suministro',
        component: PuntosSuministroComponent,
        meta: { requiresAuth: true }
      },
      {
        path: 'informes',
        component: InformesComponent,
        meta: { requiresAuth: true }
      },
      {
        path: 'administracion',
        component: AdministracionComponent,
        meta: { requiresAuth: true }
      }
    ]
  },  
];

// Crea el router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Guard de navegación para verificar autenticación
router.beforeEach((to, from, next) => {
  // Verificar si la ruta requiere autenticación
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Verificar si hay un usuario autenticado en localStorage
    const usuario = localStorage.getItem('usuario');
    
    if (!usuario) {
      // Si no hay usuario autenticado, redirigir al login
      next('/');
    } else {
      // Si hay usuario autenticado, permitir el acceso
      next();
    }
  } else {
    // Si la ruta no requiere autenticación, permitir el acceso
    next();
  }
});

// Exporta el router
export default router;
