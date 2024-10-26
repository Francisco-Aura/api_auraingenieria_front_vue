<template>
  <!-- Contenedor principal que envuelve el formulario de inicio de sesión -->
  <div class="login-wrapper">
    <div class="container">
      <h2>Iniciar sesión</h2>
      <!-- Formulario que se envía al hacer clic en el botón -->
      <form @submit.prevent="submitForm">
        <!-- Campo de texto para el nombre de usuario -->
        <input type="text" placeholder="Usuario" v-model="username" required />
        <!-- Campo de texto para la contraseña -->
        <input type="password" placeholder="Contraseña" v-model="password" required />
        <div class="button-container">
          <!-- Botón para enviar el formulario -->
          <button type="submit">Acceder</button>
          <!-- Enlace para recuperar la contraseña -->
          <a href="#">¿Olvidaste tu contraseña?</a>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  // Datos del componente
  data() {
    return {
      username: '', // Almacena el nombre de usuario
      password: ''  // Almacena la contraseña
    };
  },
  // Métodos del componente
  methods: {
    // Método para manejar el envío del formulario
    submitForm() {
      // Verifica si el nombre de usuario y la contraseña son correctos
      if (this.username === 'bruno' && this.password === 'bagf') {
        // Redirige al usuario al dashboard si las credenciales son correctas
        this.$router.push('/dashboard');
      } else {
        // Muestra un mensaje de error si las credenciales son incorrectas
        alert('Usuario o contraseña incorrectos');
      }
    }
  }
};
</script>

<style scoped>
/* Estilo del contenedor principal del login */
.login-wrapper {
  display: flex; /* Usa flexbox para centrar el contenido */
  justify-content: center; /* Centra horizontalmente */
  align-items: center; /* Centra verticalmente */
  height: 100vh; /* Ocupa toda la altura de la ventana */
}

/* Estilo del cuadro del formulario */
.container {
  background-color: #d9d9d9; /* Color de fondo del cuadro */
  padding: 40px; /* Espaciado interno */
  border-radius: 10px; /* Bordes redondeados */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* Sombra del cuadro */
  width: 300px; /* Ancho fijo del cuadro */
  text-align: center; /* Centra el texto dentro del cuadro */
}

/* Estilo del encabezado */
h2 {
  color: #333; /* Color del texto */
  margin-bottom: 30px; /* Margen inferior */
}

/* Estilo de los campos de texto */
input {
  width: 100%; /* Ancho completo del campo */
  padding: 10px; /* Espaciado interno */
  margin-bottom: 20px; /* Margen inferior */
  border: none; /* Sin borde */
  border-radius: 5px; /* Bordes redondeados */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Sombra del campo */
  font-size: 16px; /* Tamaño de fuente */
  transition: box-shadow 0.3s ease; /* Transición suave para el efecto de enfoque */
}

/* Estilo del campo de texto al recibir el foco */
input:focus {
  outline: none; /* Sin contorno */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Aumenta la sombra al enfocar */
}

/* Estilo del contenedor de botones */
.button-container {
  display: flex; /* Usa flexbox para alinear los botones */
  justify-content: space-between; /* Espacio entre los elementos */
  align-items: center; /* Centra verticalmente */
}

/* Estilo del botón de acceso */
button {
  background-color: #f0c040; /* Color de fondo del botón */
  color: #333; /* Color del texto del botón */
  border: none; /* Sin borde */
  padding: 10px 20px; /* Espaciado interno */
  border-radius: 5px; /* Bordes redondeados */
  cursor: pointer; /* Cambia el cursor al pasar por encima */
  transition: background-color 0.3s ease; /* Transición suave para el color de fondo */
}

/* Estilo del botón al pasar el cursor por encima */
button:hover {
  background-color: #e5b233; /* Color de fondo del botón al pasar el cursor */
}

/* Estilo del enlace de contraseña olvidada */
a {
  color: #333; /* Color del texto del enlace */
  text-decoration: none; /* Sin subrayado */
  font-size: 14px; /* Tamaño de fuente */
  transition: color 0.3s ease; /* Transición suave para el color */
}

/* Estilo del enlace al pasar el cursor por encima */
a:hover {
  color: #f0c040; /* Color del enlace al pasar el cursor */
}
</style>
