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
        '/dashboard/tareas': 'Gestión de Tareas'
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
        // Temporalmente activar el módulo para testing
        this.moduloTareasActivo = true
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
  watch: {
    // Cerrar menú de usuario al cambiar de ruta
    '$route'() {
      this.userMenuOpen = false;
    }
  }
};
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--background-color);
}

/* Sidebar styles */
.sidebar {
  background: linear-gradient(to bottom, rgba(152,153,155,1), rgba(100,101,103,0.8));
  color: var(--text-light);
  height: 100vh;
  width: 260px;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.2);
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 3.5rem;
  height: 3.5rem;
  margin-right: 5px;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));
  object-fit: contain; /* Ensures the image scales properly */
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.toggle-sidebar {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 1.2rem;
  padding: 6px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1001;
  margin-left: 0;
}

.toggle-sidebar:hover {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.sidebar-collapsed .toggle-sidebar {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  border: 2px solid rgba(252, 215, 0);
  left: 10px;
  position: absolute;
  top: 16px;
  transform: none;
}

.sidebar-collapsed .toggle-sidebar:hover {
  background: rgba(252, 215, 0);
  color: #222;
  border-color: rgba(252, 215, 0);
}

/* Sidebar menu */
.sidebar-menu {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 6px;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-left: 3px solid rgba(243, 156, 18, 0.5);
}

.menu-item.active {
  background: linear-gradient(to right, rgba(52, 152, 219, 0.2), transparent);
  color: white;
  border-left: 3px solid rgba(252, 215, 0);
}

.menu-icon {
  font-size: 1.2rem;
  width: 28px;
  text-align: center;
  margin-right: 16px;
  color: white;
}

.menu-text {
  font-size: 1rem;
  font-weight: 600;
  color:white;
}

/* Tooltip for collapsed sidebar */
.tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--secondary-color);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  white-space: nowrap;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1001;
}

.menu-item:hover .tooltip {
  opacity: 1;
  left: calc(100% + 8px);
}

/* User profile and user menu */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 16px 24px 16px;
  position: relative;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.sidebar-collapsed .sidebar-footer {
  padding: 8px 0;
}

.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 100%;
  justify-content: flex-start;
}

.sidebar-collapsed .user-profile {
  justify-content: center;
  width: 48px;
  margin: 0 auto;
  padding: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(252, 215, 0),rgba(252, 209, 79));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  font-size: 1.5rem;
}

.sidebar-collapsed .avatar {
  margin: 0;
}

.user-info, .dropdown-icon, .user-menu {
  display: none !important;
}

.sidebar:not(.sidebar-collapsed) .user-info,
.sidebar:not(.sidebar-collapsed) .dropdown-icon {
  display: block !important;
}

.sidebar:not(.sidebar-collapsed) .user-menu {
  display: block !important;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.dropdown-icon {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.user-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background-color: #263545;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideUp 0.3s ease forwards;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.menu-option {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  background-color: rgba(152,153,155)
}

.menu-option:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-option i {
  width: 20px;
  margin-right: 12px;
  font-size: 0.9rem;
}

/* Main content area */
.main-content {
  flex: 1;
  margin-left: 260px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
}

.sidebar-collapsed + .main-content {
  margin-left: 70px;
}

/* Header styles */
.main-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  background-color: var(--surface-color);
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 99;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  position: relative;
  padding-bottom: 3px;
}

.page-title h1::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 40px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.search-container {
  position: relative;
  margin-right: 24px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.search-input {
  background-color: #f0f5fa;
  border: 1px solid #e5eaf2;
  border-radius: 30px;
  padding: 10px 20px 10px 42px;
  width: 240px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  background-color: white;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  outline: none;
  width: 280px;
}

.header-icons {
  display: flex;
  align-items: center;
}

.icon-container {
  position: relative;
  margin-left: 20px;
  padding: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-container:hover {
  color: var(--primary-color);
}

/* Content area */
.content-wrapper {
  flex: 1;
  overflow: auto;
  background-color: #f7f9fc;
}

.content-container {
  max-width: 1600px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
  background-color: transparent;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .sidebar {
    width: 0;
    transform: translateX(-100%);
  }
  
  .sidebar-collapsed {
    width: 70px;
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .sidebar-collapsed + .main-content {
    margin-left: 70px;
  }
  
  .main-header {
    padding: 0 20px;
  }
  
  .search-input {
    width: 180px;
  }
  
  .search-input:focus {
    width: 220px;
  }
  
  .content-wrapper {
    padding: 20px;
  }
}

/* --- MEJORAS VISUALES PERFIL USUARIO --- */
.sidebar-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 16px 24px 16px;
  position: relative;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
}

.sidebar:not(.sidebar-collapsed) .user-profile {
  background: rgba(255,255,255,0.10);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  border-radius: 16px;
  padding: 16px 18px 16px 12px;
  display: flex;
  align-items: center;
  transition: background 0.2s, box-shadow 0.2s, transform 0.2s;
  width: 100%;
  margin: 0 auto;
  cursor: pointer;
  gap: 0;
  backdrop-filter: blur(2.5px);
  min-width: 0;
}

.sidebar:not(.sidebar-collapsed) .user-profile:hover {
  background: rgba(255,255,255,0.18);
  box-shadow: 0 8px 24px rgba(0,0,0,0.13);
  transform: translateY(-2px) scale(1.02);
}

.sidebar:not(.sidebar-collapsed) .avatar {
  width: 48px;
  height: 48px;
  font-size: 2rem;
  margin-right: 14px;
  box-shadow: 0 4px 12px rgba(252, 209, 79, 0.15);
  border: 2.5px solid #fffbe6;
  flex-shrink: 0;
}

.sidebar:not(.sidebar-collapsed) .user-info {
  display: flex !important;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  flex: 1 1 0%;
}

.sidebar:not(.sidebar-collapsed) .user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #fff;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  white-space: normal;
  overflow-wrap: break-word;
  line-height: 1.1;
}

.sidebar:not(.sidebar-collapsed) .user-role {
  font-size: 0.97rem;
  color: #ffe082;
  font-weight: 500;
  opacity: 0.92;
  line-height: 1.1;
}

.sidebar:not(.sidebar-collapsed) .dropdown-icon {
  margin-left: 12px;
  background: rgba(255,255,255,0.13);
  color: #fffbe6;
  width: 32px;
  height: 32px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 1.2rem;
  transition: background 0.2s;
  flex-shrink: 0;
}

.sidebar:not(.sidebar-collapsed) .dropdown-icon:hover {
  background: rgba(252, 215, 0);
  color: #222;
}

/* Layout para separar info y flecha */
.sidebar:not(.sidebar-collapsed) .user-profile {
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 10px;
}

/* Animación para el menú de usuario */
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.sidebar:not(.sidebar-collapsed) .user-menu {
  display: block !important;
  animation: fadeSlideDown 0.25s ease;
  background: rgba(38,53,69,0.98);
  backdrop-filter: blur(2.5px);
}
</style>

