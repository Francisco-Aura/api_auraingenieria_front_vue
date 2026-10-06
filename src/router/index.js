import { createRouter, createWebHistory } from 'vue-router';

// Importación síncrona solo para LoginComponent (primera pantalla)
import LoginComponent from '@/components/LoginComponent.vue';

// Lazy loading para todos los demás componentes
const DashboardComponent = () => import('@/components/DashboardComponent.vue');
const ClientesComponent = () => import('@/components/CRM_Module/Clientes/ClientesComponent.vue');
const PuntosSuministroComponent = () => import('@/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue');
const InformesComponent = () => import('@/components/CRM_Module/Informes/InformesComponent.vue');
const AdministracionComponent = () => import('@/components/CRM_Module/Administracion/AdministracionComponent.vue');
const TareasComponent = () => import('@/components/CRM_Module/Tareas/TareasComponent.vue');
const McasAdminComponent = () => import('@/components/CRM_Module/MCAS/McasAdminComponent.vue');
const McasComponent = () => import('@/components/CRM_Module/MCAS/McasComponent.vue');

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
      },
      {
        path: 'tareas',
        component: TareasComponent,
        meta: { requiresAuth: true }
      },
      {
        path: 'mcas',
        component: McasAdminComponent,
        meta: { requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'mcas-propuestas',
        component: McasComponent,
        meta: { requiresAuth: true, requiresAdmin: true }
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
    const usuarioJson = localStorage.getItem('usuario');
    
    if (!usuarioJson) {
      // Si no hay usuario autenticado, redirigir al login
      next('/');
    } else {
      try {
        const usuario = JSON.parse(usuarioJson);
        if (to.matched.some(record => record.meta.requiresAdmin) && Number(usuario.nivelAcceso) !== 1) {
          next('/dashboard/clientes');
        } else {
          next();
        }
      } catch {
        localStorage.removeItem('usuario');
        next('/');
      }
    }
  } else {
    // Si la ruta no requiere autenticación, permitir el acceso
    next();
  }
});

// Exporta el router
export default router;
