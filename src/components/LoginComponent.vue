<template>
  <div class="login-wrapper">
    <Spinner :isLoading="isLoading" />

    <div class="login-container">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Aura Ingeniería" class="logo">
        <h1>Aura Ingeniería</h1>
      </div>
      <div v-if="loginError" class="alert alert-danger">
        <i class="fas fa-exclamation-triangle alert-icon"></i>
        <div class="alert-content">
          <div class="alert-title">{{ tituloError }}</div>
          <div class="alert-message">{{ mensajeError }}</div>
        </div>
      </div>
      
      <form @submit.prevent="submitForm" class="login-form" novalidate>
        <div class="input-group">
          <label for="login-username" class="sr-only">Usuario</label>
          <i class="fas fa-user"></i>
          <input 
            id="login-username"
            ref="campoUsuario"
            type="text" 
            v-model="username" 
            placeholder="Usuario" 
            autocomplete="username"
            :class="{ 'input-error': errores.username }"
            @input="errores.username = ''"
            class="input-field"
          />
        </div>
        <small v-if="errores.username" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.username }}</small>
        
        <div class="input-group">
          <label for="login-password" class="sr-only">Contraseña</label>
          <i class="fas fa-lock"></i>
          <input 
            id="login-password"
            ref="campoContrasena"
            type="password" 
            v-model="password" 
            placeholder="Contraseña" 
            autocomplete="current-password"
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
import axios from 'axios';
import Spinner from '@/components/SpinnerComponent.vue';

export default {
  name: 'LoginComponent',
  components: {
    Spinner
  },
  data() {
    return {
      username: '',
      password: '',
      loginError: false,
      tituloError: 'Error de autenticación',
      mensajeError: 'Usuario o contraseña incorrectos.',
      isLoading: false,
      errores: {}
    };
  },
  methods: {
    validarFormulario() {
      this.errores = {};
      if (!this.username || !this.username.trim()) {
        this.errores.username = 'El usuario es obligatorio';
      }
      if (!this.password) {
        this.errores.password = 'La contraseña es obligatoria';
      }
      if (Object.keys(this.errores).length > 0) {
        // Sin diálogo: los campos ya se marcan en rojo con su mensaje debajo. El foco va
        // al primero que falta para poder escribir directamente.
        this.$nextTick(() => {
          const campo = this.errores.username ? this.$refs.campoUsuario : this.$refs.campoContrasena;
          campo?.focus();
        });
        return false;
      }
      return true;
    },
    async peticionLogin() {
      const url = `${process.env.VUE_APP_API_URL}/usuarios/login`;
      try {
        return await axios.post(url, { user: this.username, pass: this.password });
      } catch (error) {
        // Backend anterior (solo tenía el login por GET) durante el despliegue
        const estado = error?.response?.status;
        if (estado === 404 || estado === 405) {
          return axios.get(url, { params: { user: this.username, pass: this.password } });
        }
        throw error;
      }
    },
    async submitForm() {
      this.loginError = false;
      if (!this.validarFormulario()) return;
      this.isLoading = true;
      try {
        // POST con las credenciales en el cuerpo: por GET quedaban en la URL (logs, historial)
        const response = await this.peticionLogin();

        if (response.status === 200) {
          const userData = response.data;
          localStorage.setItem('usuario', JSON.stringify(userData));
          this.$router.push('/dashboard/clientes');
        } else {
          this.loginError = true;
          this.isLoading = false;
        }
      } catch (error) {
        this.loginError = true;
        const motivoBloqueo = error?.response?.status === 429 ? error.response.data?.error : '';
        // Demasiados intentos: no es que la contraseña esté mal, es un bloqueo temporal
        this.tituloError = motivoBloqueo ? 'Acceso bloqueado temporalmente' : 'Error de autenticación';
        this.mensajeError = motivoBloqueo || 'Usuario o contraseña incorrectos.';
        this.isLoading = false;
        console.error('Error en la solicitud:', error?.response?.status);
      }
    }
  }
};
</script>

<style scoped src="./LoginComponent.css"></style>
