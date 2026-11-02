<template>
  <div class="dashboard-wrapper" :class="{ 'dashboard-wrapper--app': esAplicacionIncrustada }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Logo container -->
      <div class="sidebar-header">
        <div class="logo-container">
          <img v-if="!sidebarCollapsed" src="@/assets/logo.png" alt="AURA Logo" class="logo-icon" />
          <span v-if="!sidebarCollapsed" class="logo-text">AURA</span>
        </div>
        <button class="toggle-sidebar" @click="toggleSidebar">
          <i class="fas" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
        </button>
      </div>

      <!-- Menu items -->
      <div class="sidebar-menu">
        <router-link to="/dashboard/clientes" class="menu-item" active-class="active" exact>
          <i class="fas fa-users menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Cartera de Clientes</span>
          <div v-if="sidebarCollapsed" class="tooltip">Cartera de Clientes</div>
        </router-link>

        <router-link to="/dashboard/puntos-suministro" class="menu-item" active-class="active">
          <i class="fas fa-bolt menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Puntos de Suministro</span>
          <div v-if="sidebarCollapsed" class="tooltip">Puntos de Suministro</div>
        </router-link>

        <router-link to="/dashboard/informes" class="menu-item" active-class="active">
          <i class="fas fa-chart-bar menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Informes</span>
          <div v-if="sidebarCollapsed" class="tooltip">Informes</div>
        </router-link>

        <router-link to="/dashboard/planificador" class="menu-item" active-class="active">
          <i class="fas fa-project-diagram menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Planificador</span>
          <span v-if="presupuestosPorValidar > 0" class="menu-dot" :title="presupuestosPorValidar + ' presupuesto(s) pendiente(s) de validar'" aria-label="Hay presupuestos pendientes de validar"></span>
          <div v-if="sidebarCollapsed" class="tooltip">Planificador</div>
        </router-link>

        <router-link v-if="moduloTareasActivo" to="/dashboard/tareas" class="menu-item" active-class="active">
          <i class="fas fa-tasks menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Gestión de Tareas</span>
          <div v-if="sidebarCollapsed" class="tooltip">Gestión de Tareas</div>
        </router-link>
        
        <router-link to="/dashboard/registro-horario" class="menu-item" active-class="active">
          <i class="fas fa-user-clock menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Registro horario</span>
          <div v-if="sidebarCollapsed" class="tooltip">Registro horario</div>
        </router-link>

        <router-link v-if="nivelAcceso === 1" to="/dashboard/administracion" class="menu-item" active-class="active">
          <i class="fas fa-cog menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Administración</span>
          <div v-if="sidebarCollapsed" class="tooltip">Administración</div>
        </router-link>
      </div>

      <!-- User profile at the bottom -->
      <div class="sidebar-footer">
        <div class="user-profile" @click="handleUserProfileClick">
          <div class="avatar">
            <i class="fas fa-user"></i>
          </div>
          <div v-if="!sidebarCollapsed" class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRole }}</div>
          </div>
        </div>
        <div v-if="userMenuOpen && !sidebarCollapsed" class="user-menu">
          <div class="menu-option" @click="cerrarSesion">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar sesión</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="main-content">
      <!-- Top header -->
      <header class="main-header">
        <div class="header-left">
          <div class="page-title">
            <h1>{{ pageTitle }}</h1>
          </div>
        </div>
        <div class="header-right">
          <NotificacionesComponent v-if="moduloTareasActivo" />
        </div>
      </header>

      <!-- Main view area -->
      <main class="content-wrapper" :class="{ 'content-wrapper--app': esAplicacionIncrustada }">
        <div class="content-container">
          <router-view></router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import NotificacionesComponent from '@/components/CRM_Module/Tareas/NotificacionesComponent.vue'
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'Dashboard-Component',
  components: {
    NotificacionesComponent
  },
  data() {
    return {
      nivelAcceso: null,
      sidebarCollapsed: false,
      userMenuOpen: false,
      userName: 'Usuario',
      userRole: 'Administrador',
      routes: {
        '/dashboard/clientes': 'Cartera de Clientes',
        '/dashboard/puntos-suministro': 'Puntos de Suministro',
        '/dashboard/informes': 'Informes',
        '/dashboard/administracion': 'Administración',
        '/dashboard/tareas': 'Gestión de Tareas',
        '/dashboard/planificador': 'Planificador',
        '/dashboard/registro-horario': 'Registro horario'
      },
      moduloTareasActivo: false,
      // Ofertas del presupuestador enviadas al cliente a la espera de que las valide el usuario 1 (solo se le avisa a él)
      presupuestosPorValidar: 0,
      temporizadorPresupuestos: null
    };
  },
  computed: {
    pageTitle() {
      // Retorna el título basado en la ruta actual
      return this.routes[this.$route.path] || 'Dashboard';
    },
    // Aplicaciones que se muestran dentro de la página (iframe) y gestionan su propio desplazamiento
    esAplicacionIncrustada() {
      return ['/dashboard/planificador', '/dashboard/registro-horario'].includes(this.$route.path);
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      if (this.sidebarCollapsed) {
        this.userMenuOpen = false;
      }
    },
    toggleUserMenu() {
      if (!this.sidebarCollapsed) {
        this.userMenuOpen = !this.userMenuOpen;
      }
    },
    cerrarSesion() {
      localStorage.removeItem('usuario');
      localStorage.removeItem('token');
      this.$router.push('/');
    },
    handleUserProfileClick() {
      if (this.sidebarCollapsed) {
        this.toggleSidebar();
      } else {
        this.toggleUserMenu();
      }
    },
    async verificarModuloTareas() {
      try {
        this.moduloTareasActivo = await tareasApi.verificarModuloActivo()
      } catch (error) {
        console.error('Error verificando módulo de tareas:', error)
        // Si no se puede verificar, no mostrar el módulo (más seguro que forzarlo activo)
        this.moduloTareasActivo = false
      }
    },
    // Cuenta las ofertas enviadas pendientes de validar (una oferta con varias variantes cuenta una vez). Solo para quien valida.
    async cargarPresupuestosPorValidar() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
      if (!usuario || String(usuario.id) !== '1') {
        this.presupuestosPorValidar = 0;
        return;
      }
      try {
        const res = await fetch('/planificador/api/budgets', { headers: { 'X-Usuario-Id': String(usuario.id) } });
        if (!res.ok) return;
        const presupuestos = await res.json();
        const ofertas = new Set(presupuestos.filter((p) => p.status === 'enviado').map((p) => p.offer_id || p.id));
        this.presupuestosPorValidar = ofertas.size;
      } catch (error) {
        // Sin planificador o sin red: no se enseña ningún aviso
      }
    },
    handleResize() {
      if (window.innerWidth < 900 && !this.sidebarCollapsed) {
        this.sidebarCollapsed = true;
        this.userMenuOpen = false;
      }
    }
  },
  async created() {
    // Cargar nivel de acceso desde localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario) {
      this.nivelAcceso = usuario.nivelAcceso;
      this.userName = usuario.nombre || 'Usuario';
      // Bajo el nombre se muestra su grupo de trabajo; sin grupo (o con una sesión anterior al grupo), su nivel de acceso
      const grupos = { comercial: 'Comercial', ingenieria: 'Ingeniería', administracion: 'Administración', coordinacion: 'Coordinación' };
      this.userRole = grupos[usuario.grupo] || (usuario.nivelAcceso === 1 ? 'Administrador' : 'Usuario');
    } else {
      // Si no hay usuario autenticado, redirigir al login
      this.$router.push('/');
    }

    // Verificar si el módulo de tareas está activo
    await this.verificarModuloTareas()
  },
  mounted() {
    // Colapsar sidebar en pantallas pequeñas al cargar y al redimensionar
    if (window.innerWidth < 900) {
      this.sidebarCollapsed = true;
    }
    window.addEventListener('resize', this.handleResize);
    this.cargarPresupuestosPorValidar();
    this.temporizadorPresupuestos = setInterval(this.cargarPresupuestosPorValidar, 60000);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    clearInterval(this.temporizadorPresupuestos);
  },
  watch: {
    // Cerrar menú de usuario al cambiar de ruta
    '$route'() {
      this.userMenuOpen = false;
      // Al salir del planificador (donde se valida) se vuelve a contar
      this.cargarPresupuestosPorValidar();
    }
  }
};
</script>

<style scoped src="./DashboardComponent.css"></style>

