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
