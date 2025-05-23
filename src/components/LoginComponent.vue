<template>
  <!-- Contenedor principal para la pantalla de inicio de sesión -->
  <div class="login-wrapper">
    <div class="login-container">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Aura Ingeniería" class="logo">
        <h1>Aura Ingeniería</h1>
      </div>
      <!-- Mensaje de error -->
      <div v-if="loginError" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle alert-icon"></i>
        <div class="alert-content">
          <div class="alert-title">Error de autenticación</div>
          <div class="alert-message">Usuario o contraseña incorrectos.</div>
        </div>
      </div>
      
      <!-- Formulario de inicio de sesión -->
      <form @submit.prevent="submitForm" class="login-form">
        <div class="input-group">
          <i class="fas fa-user"></i>
          <input 
            type="text" 
            v-model="username" 
            placeholder="Usuario" 
            required 
            class="input-field"
          />
        </div>
        
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input 
            type="password" 
            v-model="password" 
            placeholder="Contraseña" 
            required 
            class="input-field"
          />
        </div>
        
        <button type="submit" class="login-button">
          <span>Acceder</span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // Importa Axios para realizar solicitudes HTTP

export default {
  name: 'LoginComponent',
  // Define el estado reactivo del componente
  data() {
    return {
      username: '', // Almacena el nombre de usuario ingresado
      password: '',  // Almacena la contraseña ingresada
      loginError: false // NUEVO: para mostrar el mensaje de error
    };
  },
  methods: {
    // Método para manejar el envío del formulario
    async submitForm() {
      this.loginError = false;
      try {
        // Realiza una solicitud GET a la API de autenticación
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/api/usuarios/login`, {
          params: {
            user: this.username,  // Envía el nombre de usuario como parámetro
            pass: this.password // Envía la contraseña como parámetro
          }
        });

        // Verifica si la respuesta fue exitosa
        if (response.status === 200) { // Código HTTP 200 indica éxito
          const userData = response.data;
          // Guardamos los datos del usuario en localStorage
          localStorage.setItem('usuario', JSON.stringify(userData));
          // Redirige al usuario al dashboard después del inicio de sesión exitoso
          this.$router.push('/dashboard/clientes');
        } else {
          this.loginError = true;
        }
      } catch (error) {
        this.loginError = true;
        // Maneja errores en la solicitud, como credenciales incorrectas o problemas del servidor
        console.error('Error en la solicitud:', error);
      }
    },

    // Método para mostrar un mensaje al hacer clic en "¿Olvidaste tu contraseña?"
    showRecoverPasswordMessage() {
      alert('La funcionalidad de recuperación de contraseña aún no está implementada.');
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');


:root {
  --accent-color: #FFC107;
  --primary-color: #333333;
  --secondary-color: #444444;
  --light-gray: #F5F5F5;
  --medium-gray: #E0E0E0;
  --dark-gray: #666666;
  --white: #FFFFFF;
  --surface-color: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #E0E0E0;
}

.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('@/assets/background_energy.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 20px;
}

.login-container {
  background: rgba(255, 255, 255, 0.562);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.007);
  width: 100%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.068);
}

.logo-container {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 120px;
  height: auto;
  margin-bottom: 20px;
}

.logo-container h1 {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  font-family: 'Poppins', sans-serif;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group i {
  position: absolute;
  left: 15px;
  color: var(--text-secondary);
  font-size: 16px;
}

.input-field {
  width: 100%;
  padding: 12px 15px 12px 40px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: var(--surface-color);
  color: var(--text-primary);
}

.input-field:focus {
  border-color: var(--accent-color);
  outline: none;
  box-shadow: 0 0 0 1px var(--accent-color);
}

.input-field::placeholder {
  color: var(--text-secondary);
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: var(--secondary-color);
  transform: translateY(-1px);
}

.links-container {
  text-align: center;
  margin-top: 20px;
}

.forgot-password {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: var(--accent-color);
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
  }
  
  .logo {
    width: 100px;
  }
  
  .input-field {
    padding: 10px 12px 10px 35px;
  }
}

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #e74c3c;
  display: flex;
  align-items: center;
  background-color: rgba(231, 76, 60, 0.08);
  color: #c0392b;
}
.alert-icon {
  margin-right: 12px;
  font-size: 1.2rem;
}
.alert-content {
  flex: 1;
}
.alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.alert-message {
  font-size: 0.95rem;
}
</style>
