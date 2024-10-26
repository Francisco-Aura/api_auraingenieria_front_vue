<template>
  <div class="crm-container">
    <div class="crm-header">
      <h1>CRM Aura Ingeniería Energética</h1>
      <router-link class="back-link" to="/dashboard">Volver al Dashboard</router-link>
    </div>
    <div class="crm-content">
      <aside class="crm-menu">
        <router-link to="/dashboard/crm/clientes" class="menu-link">Clientes</router-link>
        <router-link to="/dashboard/crm/puntos-suministro" class="menu-link">Puntos de Suministro</router-link>
        <router-link to="/dashboard/crm/contratos" class="menu-link">Contratos</router-link>
        <router-link to="/dashboard/crm/servicios" class="menu-link">Servicios</router-link>
      </aside>
      <main class="crm-view">
        <router-view></router-view> <!-- Aquí se cargarán los componentes hijos -->
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CRM'
};
</script>

<style scoped>
.crm-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  text-align: center;
}

.crm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 2rem;
}

.back-link {
  color: #555;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #d4af37; /* Color amarillo dorado */
}

.crm-content {
  display: flex;
  width: 100%;
}

.crm-menu {
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
  background-color: #d4af37; /* Color amarillo dorado */
  color: #333; /* Texto oscuro sobre el amarillo */
}

.crm-view {
  flex-grow: 1;
  padding: 2rem;
  margin-left: 1rem;
  background-color: #f1f1f1; /* Gris claro */
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
