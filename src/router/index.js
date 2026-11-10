import { createRouter, createWebHistory } from 'vue-router';

// Importación síncrona solo para LoginComponent (primera pantalla)
import LoginComponent from '@/components/LoginComponent.vue';
import { planificadorDisponible } from '@/config/entornos';

// Lazy loading para todos los demás componentes
const DashboardComponent = () => import('@/components/DashboardComponent.vue');
const ClientesComponent = () => import('@/components/CRM_Module/Clientes/ClientesComponent.vue');
const PuntosSuministroComponent = () => import('@/components/CRM_Module/PuntosSuministro/PuntoSuministroComponent.vue');
const InformesComponent = () => import('@/components/CRM_Module/Informes/InformesComponent.vue');
const AdministracionComponent = () => import('@/components/CRM_Module/Administracion/AdministracionComponent.vue');
const TareasComponent = () => import('@/components/CRM_Module/Tareas/TareasComponent.vue');
const McasAdminComponent = () => import('@/components/CRM_Module/MCAS/McasAdminComponent.vue');
const McasComponent = () => import('@/components/CRM_Module/MCAS/McasComponent.vue');
const PlanificadorComponent = () => import('@/components/PlanificadorComponent.vue');
const RegistroHorarioComponent = () => import('@/components/RegistroHorarioComponent.vue');

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
      // /dashboard a secas era una pantalla vacía: se abre la cartera de clientes
      { path: '', redirect: '/dashboard/clientes' },
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
        // Como en el menú: solo administradores (escribiendo la URL se veían las tablas
        // maestras y los datos de los usuarios)
        meta: { requiresAuth: true, requiresAdmin: true }
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
      },
      {
        path: 'planificador',
        component: PlanificadorComponent,
        meta: { requiresAuth: true },
        // Donde el Planificador no está disponible (PRO), entrar por la dirección también lleva al inicio
        beforeEnter: () => (planificadorDisponible() ? true : '/dashboard/clientes')
      },
      {
        path: 'registro-horario',
        component: RegistroHorarioComponent,
        meta: { requiresAuth: true }
      }
    ]
  },
  // Una dirección que no existe dejaba la página en blanco
  { path: '/:pathMatch(.*)*', redirect: '/dashboard/clientes' },
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

// Tras un despliegue, una pestaña abierta con la versión anterior pide trozos de la
// app que ya no existen. En vez de quedarse en blanco, se recarga una vez para coger
// la versión nueva (como mucho una vez cada 10 s, para no entrar en bucle sin red).
router.onError((error, to) => {
  const mensaje = String(error?.message || '');
  if (!/Loading (CSS )?chunk|ChunkLoadError|dynamically imported module/i.test(mensaje)) return;
  let ultima = 0;
  try {
    ultima = Number(sessionStorage.getItem('aura-recarga-version')) || 0;
  } catch (e) {
    // sin sessionStorage se recarga igual
  }
  if (Date.now() - ultima < 10000) return;
  try {
    sessionStorage.setItem('aura-recarga-version', String(Date.now()));
  } catch (e) {
    // sin sessionStorage se recarga igual
  }
  window.location.assign(to?.fullPath || '/');
});

// Exporta el router
export default router;
