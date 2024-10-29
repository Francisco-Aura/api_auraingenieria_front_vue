import { createRouter, createWebHistory } from 'vue-router';
import LoginComponent from '@/components/LoginComponent.vue';
import DashboardComponent from '@/components/DashboardComponent.vue';
//CRM
import CRM_Module from '@/components/CRM_Module/PrincipalComponent.vue';
import ClientesComponent from '@/components/CRM_Module/ClientesComponent.vue';
import ContratosComponent from '@/components/CRM_Module/ContratosComponent.vue';
import PuntosSuministroComponent from '@/components/CRM_Module/PuntoSuministroComponent.vue';
import ServiciosComponent from '@/components/CRM_Module/ServiciosComponent.vue';
import ConfiguracionComponent from '@/components/CRM_Module/ConfiguracionComponent.vue';
//Administracion
import Administracion_Module from '@/components/Admministracion_Module/PrincipalComponent.vue';
import UsuariosComponent from '@/components/Admministracion_Module/UsuariosComponent.vue';
//Informes
import Informes_Module from '@/components/Informes_Module/PrincipalComponent.vue';
import ContratosVigentesComponent from '@/components/Informes_Module/ContratosVigentesComponent.vue';
//Facturacion
import Facturacion_Module from '@/components/Facturacion_Module/PrincipalComponent.vue';
import FacturasClientesComponent from '@/components/Facturacion_Module/FacturasClientesComponent.vue';


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
    component: CRM_Module,
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
      ,
      {
        path: 'configuracion',
        component: ConfiguracionComponent
      }
    ]
  },
  {
    path: '/dashboard/administracion',
    component: Administracion_Module,
    children: [
      {
        path: 'Usuarios',
        component: UsuariosComponent
      }
    ]
  },
  {
    path: '/dashboard/informes',
    component: Informes_Module,
    children: [
      {
        path: 'contratosvigentes',
        component: ContratosVigentesComponent
      }
    ]
  },
  {
    path: '/dashboard/facturacion',
    component: Facturacion_Module,
    children: [
      {
        path: 'clientes',
        component: FacturasClientesComponent
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
