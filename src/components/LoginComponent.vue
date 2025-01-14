<template>
  <!-- Contenedor principal para la pantalla de inicio de sesión -->
  <div class="login-wrapper">
    <!-- Contenedor interno centrado -->
    <div class="container">
      <!-- Título de la página de inicio de sesión -->
      <h2>Iniciar sesión</h2>

      <!-- Formulario de inicio de sesión -->
      <form @submit.prevent="submitForm"> <!-- Evita la recarga de página al enviar el formulario -->
        <!-- Campo de entrada para el nombre de usuario -->
        <input type="text" placeholder="Usuario" v-model="username" required />
        
        <!-- Campo de entrada para la contraseña -->
        <input type="password" placeholder="Contraseña" v-model="password" required />
        
        <!-- Contenedor para el botón de envío y el enlace de recuperación de contraseña -->
        <div class="button-container">
          <!-- Botón para enviar el formulario -->
          <button type="submit">Acceder</button>

          <!-- Enlace para la recuperación de contraseña (aún no funcional) -->
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import axios from 'axios'; // Importa Axios para realizar solicitudes HTTP

export default {
  // Define el estado reactivo del componente
  data() {
    return {
      username: '', // Almacena el nombre de usuario ingresado
      password: ''  // Almacena la contraseña ingresada
    };
  },
  methods: {
    // Método para manejar el envío del formulario
    async submitForm() {
      try {
        // Realiza una solicitud POST a la API de autenticación
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/auth/login`, {
          user: this.username,  // Envía el nombre de usuario en el cuerpo de la solicitud
          password: this.password // Envía la contraseña en el cuerpo de la solicitud
        });

        // Verifica si la respuesta fue exitosa
        if (response.status === 200) { // Código HTTP 200 indica éxito
          // Redirige al usuario al dashboard después del inicio de sesión exitoso
          this.$router.push('/dashboard');
        } else {
          // Maneja cualquier respuesta que no sea exitosa
          alert('Error en la autenticación');
        }
      } catch (error) {
        // Maneja errores en la solicitud, como credenciales incorrectas o problemas del servidor
        console.error('Error en la solicitud:', error);
        alert('Usuario o contraseña incorrectos');
      }
    }
  }
};
</script>
<style scoped>
/* Enlace de login */
a {
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

a:hover {
  color: #f0c040;
}

.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.container {
  background-color: #d9d9d9;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  width: 300px;
  text-align: center;
}

h2 {
  color: #333;
  margin-bottom: 30px;
}

input {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  transition: box-shadow 0.3s ease;
}
</style>