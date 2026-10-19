<template>
  <div class="dashboard-wrapper">
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
          <div v-if="sidebarCollapsed" class="tooltip">Planificador</div>
        </router-link>

        <router-link v-if="moduloTareasActivo" to="/dashboard/tareas" class="menu-item" active-class="active">
          <i class="fas fa-tasks menu-icon"></i>
          <span v-if="!sidebarCollapsed" class="menu-text">Gestión de Tareas</span>
          <div v-if="sidebarCollapsed" class="tooltip">Gestión de Tareas</div>
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
      <main class="content-wrapper">
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
        '/dashboard/planificador': 'Planificador'
      },
      moduloTareasActivo: false
    };
  },
  computed: {
    pageTitle() {
      // Retorna el título basado en la ruta actual
      return this.routes[this.$route.path] || 'Dashboard';
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
      this.userRole = usuario.nivelAcceso === 1 ? 'Administrador' : 'Usuario';
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
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
    // Cerrar menú de usuario al cambiar de ruta
    '$route'() {
      this.userMenuOpen = false;
    }
  }
};
</script>

<style scoped src="./DashboardComponent.css"></style>

