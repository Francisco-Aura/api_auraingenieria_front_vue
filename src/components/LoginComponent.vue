<template>
  <div class="login-wrapper">
    <div class="container">
      <h2>Iniciar sesión</h2>
      <form @submit.prevent="submitForm">
        <input type="text" placeholder="Usuario" v-model="username" required />
        <input type="password" placeholder="Contraseña" v-model="password" required />
        <div class="button-container">
          <button type="submit">Acceder</button>
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      username: '',
      password: ''
    };
  },
  methods: {
    async submitForm() {
      try {
        // Asegúrate de que la URL de la API esté correctamente configurada
        const response = await axios.post(`${process.env.VUE_APP_API_URL}/auth/login`, {
          user: this.username, // Cambia "username" por "user"
          password: this.password
        });

        // Maneja la respuesta del backend
        if (response.status === 200) { // Cambia a 200, que es el código de éxito correcto
          // Si la autenticación es exitosa, puedes guardar un token si lo devuelve tu backend
          // Aquí solo devuelve un mensaje, así que puedes guardar una variable de estado o redirigir
          alert('Login Satisfactorio'); // Aquí puedes mostrar un mensaje de éxito
          this.$router.push('/dashboard'); // Redirige al dashboard
        } else {
          alert('Error en la autenticación');
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Usuario o contraseña incorrectos'); // Muestra un mensaje de error
      }
    }
  }
};
</script>

<style scoped>
/* Escala la aplicación completa al 75% */
body {
  transform: scale(0.75);
  transform-origin: top left;
  width: 133.33%; /* Compensa el escalado al 75% */
  overflow-x: hidden; /* Evita scroll horizontal */
}

/* Estilo del contenedor principal del login */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* Estilo del cuadro del formulario */
.container {
  background-color: #d9d9d9;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  width: 300px;
  text-align: center;
}

/* Estilo del encabezado */
h2 {
  color: #333;
  margin-bottom: 30px;
}

/* Estilo de los campos de texto */
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: none;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  transition: box-shadow 0.3s ease;
}

/* Estilo del campo de texto al recibir el foco */
input:focus {
  outline: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Estilo del contenedor de botones */
.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Estilo del botón de acceso */
button {
  background-color: #f0c040;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* Estilo del botón al pasar el cursor por encima */
button:hover {
  background-color: #e5b233;
}

/* Estilo del enlace de contraseña olvidada */
a {
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

/* Estilo del enlace al pasar el cursor por encima */
a:hover {
  color: #f0c040;
}
</style>
