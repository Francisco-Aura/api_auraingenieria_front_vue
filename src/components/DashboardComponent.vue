<template>
  <div class="dashboard">
    <div class="modules">
      <router-link to="/dashboard/crm" class="module">CRM</router-link>
      <router-link to="/dashboard/facturacion" class="module">Facturación</router-link>
      <router-link to="/dashboard/informes" class="module">Informes</router-link>
      <router-link to="/dashboard/administracion" class="module">Administración</router-link>
    </div>
    <!-- Imagen de la empresa -->
    <img src="@/images/LogoAura.jpg" alt="Logo de Aura Ingeniería" class="logo" />
      
  </div>
</template>

<script>
export default {
  name: 'DashboardComponent'
};
</script>

<style scoped>
.dashboard {
  text-align: center; /* Centra el texto */
  margin-top: 2rem; /* Margen superior */
}

h1 {
  font-size: 2.5rem; /* Tamaño del título */
  margin-bottom: 1rem; /* Margen inferior */
  color: #333; /* Color del título */
}

p {
  margin-top: 1rem; /* Margen superior del párrafo */
}

/* Contenedor de módulos */
.modules {
  display: flex; /* Usa flexbox para organizar los módulos */
  justify-content: center; /* Centra los módulos horizontalmente */
  flex-wrap: wrap; /* Permite que los módulos se ajusten en varias líneas */
  gap: 20px; /* Espacio entre módulos */
  margin-top: 1rem; /* Margen superior */
}

/* Módulos individuales */
.module {
  padding: 20px; /* Espaciado interno */
  background-color: #f0c040; /* Color de fondo del módulo */
  color: white; /* Color del texto */
  border-radius: 10px; /* Bordes redondeados */
  text-decoration: none; /* Sin subrayado */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Sombra del módulo */
  transition: background-color 0.3s, transform 0.3s; /* Transiciones suaves */
  width: 150px; /* Ancho fijo de cada módulo */
  text-align: center; /* Centra el texto */
}

/* Estilo del módulo al pasar el cursor por encima */
.module:hover {
  background-color: #e5b233; /* Cambia el color de fondo al pasar el cursor */
  transform: translateY(-5px); /* Efecto de elevación al pasar el cursor */
}

/* Estilo para la imagen del logo */
.logo {
  width: 100%; /* Ancho del logo al 100% del contenedor */
  max-width: 600px; /* Tamaño máximo del logo */
  height: auto; /* Mantiene la proporción de la imagen */
  margin-top: 20px; /* Margen superior de la imagen */
}
</style>
