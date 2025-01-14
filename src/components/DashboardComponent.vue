<template>
  <!-- Contenedor principal del dashboard -->
  <div class="dashboard-container">
    
    <!-- Encabezado del dashboard (actualmente vacío) -->
    <div class="dashboard-header">
    </div>
    
    <!-- Contenido principal del dashboard -->
    <div class="dashboard-content">
      
      <!-- Menú lateral con opciones de navegación -->
      <aside class="dashboard-menu">
        <!-- Enlace al módulo de cartera de clientes -->
        <router-link to="/dashboard/clientes" class="menu-link">
          Cartera de Clientes
        </router-link>

        <!-- Enlace al módulo de puntos de suministro -->
        <router-link to="/dashboard/puntos-suministro" class="menu-link">
          Puntos de Suministro
        </router-link>

        <!-- Enlace al módulo de Gestion de Proyectos -->
        <router-link to="/dashboard/gestion-proyectos" class="menu-link">
          Gestion de Proyectos
        </router-link>

        <!-- Enlace al módulo de Informes -->
        <router-link to="/dashboard/informes" class="menu-link">
          Informes
        </router-link>

        <!-- Enlace al módulo de Administracion -->
        <router-link to="/dashboard/administracion" class="menu-link">
          Administracion
        </router-link>
        
      </aside>

      <!-- Vista principal donde se mostrarán los componentes hijos -->
      <main class="dashboard-view">
        <!-- El componente hijo que coincida con la ruta se renderizará aquí -->
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  // Nombre del componente para facilitar su identificación
  name: 'Dashboard-Component',
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0;
  padding: 0;
  text-align: center;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: -4rem;/* Espacio superior dashboard*/
}

.dashboard-content {
  margin: 0;
  padding: 0;
  display: flex;
  width: 100%;
}

.dashboard-menu {
  background-color: #333;
  padding: 1rem;
  width: 200px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.menu-link {
  display: block;
  color: #ffffff;
  background-color: #555;
  padding: 10px 15px;
  margin: 8px 0;
  text-align: center;
  border-radius: 5px;
  text-decoration: none;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.menu-link:hover {
  background-color: #d4af37;
  color: #333;
}

.dashboard-view {
  margin: 0;
  padding: 0;
  flex-grow: 1;  
  margin-left: 1rem;
  background-color: #f1f1f1;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>