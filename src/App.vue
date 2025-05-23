<template>
  <div class="app-container">
    <router-view></router-view>
    <ChatComponent />
  </div>
</template>

<script>
import ChatComponent from './components/Chat.vue';

export default {
  name: 'App',
  components: {
    ChatComponent
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

:root {
  /* Colores principales */
  --primary-color: #ffc40c;
  --primary-dark: #ffc40c;
  --primary-light: #ffc40c;
  --secondary-color: #2c3e50;
  --accent-color: #f39c12;
  
  /* Fondos y superficies */
  --background-color: #f7f9fc;
  --surface-color: #ffffff;
  --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  
  /* Textos */
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --text-muted: #95a5a6;
  --text-light: #ecf0f1;
  
  /* Bordes */
  --border-color: #e0e0e0;
  --border-radius: 8px;
  
  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Estados */
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --info-color: #3498db;
}

/* Reset básico */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--background-color);
  color: var(--text-primary);
  font-family: 'Poppins', sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
}

.v-application {
  background-color: var(--background-color) !important;
  font-family: 'Poppins', sans-serif !important;
}

/* Estilos de tarjetas */
.card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

/* Estilos de botones */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  outline: none;
  font-size: 14px;
  text-decoration: none;
  white-space: nowrap;
}

.btn i {
  margin-right: 8px;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background-color: #34495e;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(44, 62, 80, 0.3);
}

.btn-accent {
  background-color: var(--accent-color);
  color: white;
}

.btn-accent:hover {
  background-color: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(243, 156, 18, 0.3);
}

.btn-success {
  background-color: var(--success-color);
  color: white;
}

.btn-success:hover {
  background-color: #27ae60;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(46, 204, 113, 0.3);
}

.btn-danger {
  background-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover {
  background-color: var(--primary-color);
  color: white;
}

/* Estilo para tablas */
.table-responsive {
  overflow-x: auto;
  width: 100%;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.data-table th {
  background-color: var(--primary-color);
  color: white;
  font-weight: 900;
  text-align: left;
  padding: 12px 16px;
  letter-spacing: 0.5px;
  font-size: 16px;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover {
  background-color: rgba(52, 152, 219, 0.05);
}

/* Estilo para inputs */
.form-control {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: var(--primary-color);
  outline: 0;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* Grid system */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -12px;
  margin-right: -12px;
}

.col {
  padding-left: 12px;
  padding-right: 12px;
  flex: 1;
}

.col-6 {
  flex: 0 0 50%;
  max-width: 50%;
  padding-left: 12px;
  padding-right: 12px;
}

.col-4 {
  flex: 0 0 33.333333%;
  max-width: 33.333333%;
  padding-left: 12px;
  padding-right: 12px;
}

.col-3 {
  flex: 0 0 25%;
  max-width: 25%;
  padding-left: 12px;
  padding-right: 12px;
}

/* Utilidades de margen y padding */
.mt-1 { margin-top: var(--spacing-xs); }
.mt-2 { margin-top: var(--spacing-sm); }
.mt-3 { margin-top: var(--spacing-md); }
.mt-4 { margin-top: var(--spacing-lg); }
.mt-5 { margin-top: var(--spacing-xl); }

.mb-1 { margin-bottom: var(--spacing-xs); }
.mb-2 { margin-bottom: var(--spacing-sm); }
.mb-3 { margin-bottom: var(--spacing-md); }
.mb-4 { margin-bottom: var(--spacing-lg); }
.mb-5 { margin-bottom: var(--spacing-xl); }

.ml-1 { margin-left: var(--spacing-xs); }
.ml-2 { margin-left: var(--spacing-sm); }
.ml-3 { margin-left: var(--spacing-md); }
.ml-4 { margin-left: var(--spacing-lg); }
.ml-5 { margin-left: var(--spacing-xl); }

.mr-1 { margin-right: var(--spacing-xs); }
.mr-2 { margin-right: var(--spacing-sm); }
.mr-3 { margin-right: var(--spacing-md); }
.mr-4 { margin-right: var(--spacing-lg); }
.mr-5 { margin-right: var(--spacing-xl); }

.p-1 { padding: var(--spacing-xs); }
.p-2 { padding: var(--spacing-sm); }
.p-3 { padding: var(--spacing-md); }
.p-4 { padding: var(--spacing-lg); }
.p-5 { padding: var(--spacing-xl); }

/* Utilidades de texto */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-left { text-align: left; }

.text-primary { color: var(--primary-color); }
.text-secondary { color: var(--secondary-color); }
.text-accent { color: var(--accent-color); }
.text-success { color: var(--success-color); }
.text-warning { color: var(--warning-color); }
.text-danger { color: var(--danger-color); }
.text-muted { color: var(--text-muted); }

/* Utilidades flex */
.d-flex { display: flex; }
.flex-row { flex-direction: row; }
.flex-column { flex-direction: column; }
.justify-content-center { justify-content: center; }
.justify-content-between { justify-content: space-between; }
.justify-content-end { justify-content: flex-end; }
.align-items-center { align-items: center; }
.align-items-start { align-items: flex-start; }
.align-items-end { align-items: flex-end; }
.flex-wrap { flex-wrap: wrap; }
.flex-grow-1 { flex-grow: 1; }

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.3s ease-in;
}

/* Utilities */
.shadow { box-shadow: var(--card-shadow); }
.rounded { border-radius: var(--border-radius); }
.w-100 { width: 100%; }
.h-100 { height: 100%; }
.overflow-hidden { overflow: hidden; }
.position-relative { position: relative; }
.position-absolute { position: absolute; }

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Asegurar que el chat esté por encima de todo */
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}
</style>
