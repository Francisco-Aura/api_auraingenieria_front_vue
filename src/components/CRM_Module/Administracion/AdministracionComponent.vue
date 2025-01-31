<template>
    <div class="admin-dashboard">
      <!-- Encabezado con iconos para cada tabla -->
      <div class="icon-bar">
        <button v-for="tabla in tablas" :key="tabla.nombre" @click="cargarDatos(tabla)" :class="{ active: tablaSeleccionada === tabla }">
          <i :class="['icon', tabla.icono]"></i>
          <span>.{{ tabla.nombre }}</span>
        </button>
      </div>
  
      <!-- Botón CREAR que solo se muestra si hay una tabla seleccionada -->
      <button v-if="tablaSeleccionada" @click="nuevoRegistro()">CREAR</button>

      <!-- Formulario de edición/inserción -->
      <div v-if="mostrarFormulario" class="formulario">
        <h3>{{ editando ? 'Editar Registro' : `Nuevo Registro en ${this.tablaSeleccionada.nombre}`}}</h3>
        <form @submit.prevent="guardarRegistro">
          <div v-for="col in columnasFiltradas" :key="col">
            <label>{{ col }}</label>
            <input v-model="registro[col]" />
          </div>
          <button type="submit">Guardar</button>
          <button type="button" @click="mostrarFormulario = false">Cancelar</button>
        </form>
      </div>
    </div>

      <!-- Tabla dinámica -->
      <div class="tabla-container">
        <table>
          <thead>
            <tr>
              <th v-for="col in columnas" :key="col">{{ col }}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in datos" :key="fila.id">
              <td v-for="col in columnas" :key="col">{{ fila[col] }}</td>
              <td>
                <button @click="editarRegistro(fila)">✏️</button>
                <button @click="eliminarRegistro(fila.id)">🗑️</button>                
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        tablas: [
          { nombre: "Comercializadoras", url:`${process.env.VUE_APP_API_URL}/api/comercializadoras`, icono: "fas fa-building" },
          { nombre: "Gestoras", url: `${process.env.VUE_APP_API_URL}/api/gestoras`, icono: "fas fa-briefcase" },
          { nombre: "Métodos de Pago", url: `${process.env.VUE_APP_API_URL}/api/metodos-pago`, icono: "fas fa-credit-card" },
          { nombre: "Niveles de Acceso", url: `${process.env.VUE_APP_API_URL}/api/niveles-acceso`, icono: "fas fa-user-shield" },
          { nombre: "Pago Plazos", url: `${process.env.VUE_APP_API_URL}/api/pagos-plazos`, icono: "fas fa-calendar-check" },
          { nombre: "Productos", url: `${process.env.VUE_APP_API_URL}/api/productos`, icono: "fas fa-box-open" },
          { nombre: "Sectores", url: `${process.env.VUE_APP_API_URL}/api/sectores`, icono: "fas fa-industry" },
          { nombre: "Subtipologías", url: `${process.env.VUE_APP_API_URL}/api/subtipologias`, icono: "fas fa-tags" },
          { nombre: "Tarifas Gas", url: `${process.env.VUE_APP_API_URL}/api/tarifas-gas`, icono: "fas fa-fire" },
          { nombre: "Tarifas Luz", url: `${process.env.VUE_APP_API_URL}/api/tarifasLuz`, icono: "fas fa-bolt" },
          { nombre: "Usuarios", url: `${process.env.VUE_APP_API_URL}/api/usuarios`, icono: "fas fa-users" }
        ],
        tablaSeleccionada: null,
        datos: [],
        columnas: [],
        mostrarFormulario: false,
        registro: {},
        editando: false
      };
    },
    computed: {
      columnasFiltradas() {
        return this.columnas.filter(col => col !== "id");
      }
    },
    methods: {
      async cargarDatos(tabla) {
        this.tablaSeleccionada = tabla;
        this.mostrarFormulario = false;
        try {
          const respuesta = await axios.get(tabla.url);
          this.datos = respuesta.data;
          this.columnas = Object.keys(this.datos[0] || {});
        } catch (error) {
          console.error("Error al cargar datos", error);
        }
      },
      nuevoRegistro() {
        this.registro = {};
        this.mostrarFormulario = true;
        this.editando = false;
      },
      editarRegistro(fila) {
        this.registro = { ...fila };
        this.mostrarFormulario = true;
        this.editando = true;
      },
      async guardarRegistro() {
        try {
          if (this.editando) {
            await axios.put(`${this.tablaSeleccionada.url}/${this.registro.id}`, this.registro);
          } else {
            const respuesta = await axios.post(this.tablaSeleccionada.url, this.registro);
            this.datos.push(respuesta.data);
          }
          this.mostrarFormulario = false;
          this.cargarDatos(this.tablaSeleccionada);
        } catch (error) {
          console.error("Error al guardar registro", error);
        }
      },
      async eliminarRegistro(id) {
        if (confirm("¿Seguro que deseas eliminar este registro?")) {
          try {
            await axios.delete(`${this.tablaSeleccionada.url}/${id}`);
            this.cargarDatos(this.tablaSeleccionada);
          } catch (error) {
            console.error("Error al eliminar registro", error);
          }
        }
      }
    }
  };
  </script>
  
  <style scoped>
    .icon-bar button .icon {
      color: black; /* Color negro para los iconos */
    }

    button {
        border: 1px;
        color: #f5c600;  
        background-color: #333;     
        border-radius: 5px;
    }

    button:hover {
      color:#333;
      background-color: #f5c600; 
    }
    .admin-dashboard {
        padding: 20px;
        text-align: center;
    }
    .icon-bar {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }
    .icon-bar button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 10px;
        font-size: 18px;
        margin: 5px;
    }
    .icon-bar .active {
        color: #47453e;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }

    table th, table td {
        padding: 0.5rem;
        border-bottom: 1px solid #ddd;
    }

    table th {
        background-color: #333;
        color: #f5c600;
    }

    table tr:nth-child(even) {
        background-color: #f2f2f2;
    }

    table tr:hover {
        background-color: #eaeaea;
    }

    .formulario {
        margin-top: 20px;
        padding: 15px;
        background: white;
        border-radius: 5px;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    }
  </style>
  