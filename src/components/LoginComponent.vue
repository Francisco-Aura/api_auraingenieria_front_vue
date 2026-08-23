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
          <div class="alert-title">Error de autenticación</div>
          <div class="alert-message">Usuario o contraseña incorrectos.</div>
        </div>
      </div>
      
      <form @submit.prevent="submitForm" class="login-form" novalidate>
        <div class="input-group">
          <label for="login-username" class="sr-only">Usuario</label>
          <i class="fas fa-user"></i>
          <input 
            id="login-username"
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
        const response = await axios.get(`${process.env.VUE_APP_API_URL}/usuarios/login`, {
          params: {
            user: this.username,
            pass: this.password
          }
        });

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
        this.isLoading = false;
        console.error('Error en la solicitud:', error);
      }
    }
  }
};
</script>

<style scoped src="./LoginComponent.css"></style>
