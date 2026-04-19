<template>
  <!-- Contenedor principal para la pantalla de inicio de sesión -->
  <div class="login-wrapper">
    <!-- Loading Spinner -->
    <Spinner :isLoading="isLoading" />

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
      <form @submit.prevent="submitForm" class="login-form" novalidate>
        <div class="input-group">
          <i class="fas fa-user"></i>
          <input 
            type="text" 
            v-model="username" 
            placeholder="Usuario" 
            :class="{ 'input-error': errores.username }"
            @input="errores.username = ''"
            class="input-field"
          />
        </div>
        <small v-if="errores.username" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.username }}</small>
        
        <div class="input-group">
          <i class="fas fa-lock"></i>
          <input 
            type="password" 
            v-model="password" 
            placeholder="Contraseña" 
            :class="{ 'input-error': errores.password }"
            @input="errores.password = ''"
            class="input-field"
          />
        </div>
        <small v-if="errores.password" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.password }}</small>
        
        <button type="submit" class="login-button" :disabled="isLoading">
          <span>{{ isLoading ? 'Autenticando...' : 'Acceder' }}</span>
          <i class="fas fa-arrow-right"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // Importa Axios para realizar solicitudes HTTP
import Spinner from '@/components/SpinnerComponent.vue'; // Importa el componente Spinner

export default {
  name: 'LoginComponent',
  components: {
    Spinner
  },
  // Define el estado reactivo del componente
  data() {
    return {
      username: '',
      password: '',
      loginError: false,
      isLoading: false,
      errores: {}
    };
  },
  methods: {
    // Método para manejar el envío del formulario
    validarFormulario() {
      this.errores = {};
      if (!this.username || !this.username.trim()) {
        this.errores.username = 'El usuario es obligatorio';
      }
      if (!this.password) {
        this.errores.password = 'La contraseña es obligatoria';
      }
      if (Object.keys(this.errores).length > 0) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Por favor, revise los campos marcados en rojo'
        });
        return false;
      }
      return true;
    },
    async submitForm() {
      this.loginError = false;
      if (!this.validarFormulario()) return;
      this.isLoading = true;
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
          this.isLoading = false; // Desactivar loading si hay error
        }
      } catch (error) {
        this.loginError = true;
        this.isLoading = false; // Desactivar loading en caso de error
        // Maneja errores en la solicitud, como credenciales incorrectas o problemas del servidor
        console.error('Error en la solicitud:', error);
      }
    },

    // Método para mostrar un mensaje al hacer clic en "¿Olvidaste tu contraseña?"
    showRecoverPasswordMessage() {
      this.$swal.fire({
        icon: 'info',
        title: 'Función no disponible',
        text: 'La funcionalidad de recuperación de contraseña aún no está implementada.'
      })
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');


:root {
  --accent-color: rgba(252, 215, 0);
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
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.007);
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(255, 255, 255, 0.068);
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 100px;
  height: auto;
  margin-bottom: 1rem;
}

.logo-container h1 {
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 500;
  margin: 0;
  font-family: 'Poppins', sans-serif;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group i {
  position: absolute;
  left: 0.8rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.input-field {
  width: 100%;
  padding: 0.6rem 0.8rem 0.6rem 2.2rem;
  border: 1px solid var(--border-color);
  border-radius: 0.2rem;
  font-size: 0.9rem;
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
  gap: 0.5rem;
  background: var(--primary-color);
  color: black;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 0.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button:hover:not(:disabled) {
  background: var(--secondary-color);
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.links-container {
  text-align: center;
  margin-top: 1rem;
}

.forgot-password {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: var(--accent-color);
}

@media (max-width: 480px) {
  .login-container {
    padding: 1.5rem 1rem;
  }
  
  .logo {
    width: 80px;
  }
  
  .input-field {
    padding: 0.5rem 0.6rem 0.5rem 1.8rem;
  }
}

.alert {
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  margin-bottom: 0.8rem;
  border-left: 4px solid #e74c3c;
  display: flex;
  align-items: center;
  background-color: rgba(231, 76, 60, 0.08);
  color: #c0392b;
}
.alert-icon {
  margin-right: 0.6rem;
  font-size: 1.1rem;
}
.alert-content {
  flex: 1;
}
.alert-title {
  font-weight: 600;
  margin-bottom: 0.2rem;
}
.alert-message {
  font-size: 0.9rem;
}

.input-error,
.input-error:focus {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15) !important;
}

.error-text {
  display: block;
  color: #e74c3c;
  font-size: 0.72rem;
  margin-top: 2px;
  line-height: 1.2;
}
</style>
