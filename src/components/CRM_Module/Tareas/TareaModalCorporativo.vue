<template>
  <div v-if="value" class="modal-overlay" @mousedown="iniciarSeleccion" @mouseup="finalizarSeleccion">
    <div class="modal-content modal-tarea" @click.stop @input.stop @mousedown.stop @mouseup.stop>
      <!-- Header del modal -->
      <div class="modal-header">
        <h2 class="modal-title">{{ esEdicion ? 'Editar tarea' : 'Crear tarea' }}</h2>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body del modal -->
      <div class="modal-body">
        <form @submit.prevent="guardar" class="form-compact">
          
          <!-- Primera fila: Nombre, Cliente -->
          <div class="row-1">
            <div class="form-group">
              <label><i class="fas fa-file-alt"></i> Nombre <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formulario.titulo" 
                class="form-control"
                required
                placeholder="Título de la tarea"
              />
            </div>

            <div class="form-group cliente-field">
              <label><i class="fas fa-user-tie"></i> Dirigido a <span class="required">*</span></label>
              <div class="input-with-icon cliente-input-wrapper">
                <i class="fas fa-arrow-right cliente-arrow"></i>
                <input 
                  type="text" 
                  v-model="busquedaCliente"
                  @input="buscarClientes"
                  @focus="mostrarDropdownClientes = true"
                  class="form-control"
                  placeholder="Escribe el nombre del cliente..."
                />
                
                <!-- Dropdown de clientes -->
                <div v-if="mostrarDropdownClientes && (clientesFiltrados.length > 0 || oportunidadesFiltradas.length > 0)" class="dropdown-clientes">
                  <div v-if="clientesFiltrados.length > 0" class="dropdown-section">
                    <div class="dropdown-header">CLIENTES</div>
                    <div 
                      v-for="cliente in clientesFiltrados" 
                      :key="`cliente-${cliente.id}`"
                      class="dropdown-item"
                      @click="seleccionarCliente(cliente)">
                      {{ cliente.nombre }}
                    </div>
                  </div>
                  <div v-if="oportunidadesFiltradas.length > 0" class="dropdown-section">
                    <div class="dropdown-header">OPORTUNIDADES</div>
                    <div 
                      v-for="oportunidad in oportunidadesFiltradas" 
                      :key="`op-${oportunidad.id}`"
                      class="dropdown-item"
                      @click="seleccionarOportunidad(oportunidad)">
                      {{ oportunidad.codigo }} - {{ oportunidad.nombre }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Segunda fila: Fechas, Prioridad, Repetir -->
          <div class="row-2">
            <div class="form-group">
              <label><i class="fas fa-calendar-alt"></i> Fecha inicio</label>
              <div class="datetime-compact">
                <input type="date" v-model="fechaInicio" class="form-control date-input" />
                <input type="time" v-model="horaInicio" class="form-control time-input" />
              </div>
            </div>

            <div class="form-group">
              <label><i class="fas fa-hourglass-end"></i> Fecha vencimiento</label>
              <div class="datetime-compact">
                <input type="date" v-model="fechaVencimiento" class="form-control date-input" />
                <input type="time" v-model="horaVencimiento" class="form-control time-input" />
              </div>
            </div>

            <div class="form-group">
              <label><i class="fas fa-exclamation-triangle"></i> Prioridad</label>
              <select v-model="formulario.prioridad" class="form-control prioridad-select" :class="`prioridad-selected-${formulario.prioridad}`">
                <option :value="3">⬇ Baja</option>
                <option :value="2">― Media</option>
                <option :value="1">⬆ Alta</option>
                <option :value="0">⚠ Urgente</option>
              </select>
            </div>

            <div class="form-group">
              <label><i class="fas fa-sync"></i> Repetir</label>
              <select v-model="formulario.repetir" class="form-control">
                <option value="">No repetir</option>
                <option value="diario">Diariamente</option>
                <option value="semanal">Semanalmente</option>
                <option value="mensual">Mensualmente</option>
                <option value="anual">Anualmente</option>
              </select>
            </div>
          </div>

          <!-- Tercera fila: Asignación, Categoría y Opciones -->
          <div class="row-3">
            <div class="form-group">
              <label><i class="fas fa-user-check"></i> Asignada a</label>
              <select v-model="formulario.usuarioAsignadoId" class="form-control">
                <option :value="null">Sin asignar</option>
                <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label><i class="fas fa-list"></i> Categoría</label>
              <select v-model="formulario.categoriaId" class="form-control" @change="onCategoriaChange">
                <option :value="null">Sin categoría</option>
                <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                  {{ categoria.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label><i class="fas fa-tag"></i> Subcategoría</label>
              <select v-model="formulario.subcategoriaId" class="form-control" :disabled="!formulario.categoriaId">
                <option :value="null">Sin subcategoría</option>
                <option v-for="subcategoria in subcategoriasFiltradas" :key="subcategoria.id" :value="subcategoria.id">
                  {{ subcategoria.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group options-group">
              <label><i class="fas fa-cog"></i> Opciones</label>
              <div class="options-container">
                <div class="checkbox-compact">
                  <input type="checkbox" id="notificar" v-model="formulario.notificar" />
                  <label for="notificar"><i class="fas fa-bell"></i> Notificar 1h antes</label>
                </div>
                <div class="checkbox-compact">
                  <input type="checkbox" id="fijada" v-model="formulario.fijada" />
                  <label for="fijada"><i class="fas fa-thumbtack"></i> Fijar tarea</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuarta fila: Descripción -->
          <div class="row-4">
            <div class="form-group full-width">
              <label><i class="fas fa-pen-fancy"></i> Descripción</label>
              <textarea 
                v-model="formulario.descripcion" 
                class="form-control"
                rows="2"
                placeholder="Descripción detallada de la tarea..."
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrar">
          <i class="fas fa-times"></i>
          Cancelar
        </button>
        <button type="button" class="btn btn-primary" @click="guardar">
          <i :class="esEdicion ? 'fas fa-save' : 'fas fa-plus'"></i>
          {{ esEdicion ? 'Guardar' : 'Crear' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TareaModalCorporativo',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    tarea: {
      type: Object,
      default: null
    },
    estados: {
      type: Array,
      default: () => []
    },
    usuarios: {
      type: Array,
      default: () => []
    },
    categorias: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      formulario: {
        id: null,
        titulo: '',
        descripcion: '',
        usuarioAsignadoId: null,
        usuarioCreadorId: null,
        estadoId: null,
        prioridad: 2,
        fechaInicio: null,
        fechaVencimiento: null,
        clienteRelacionadoId: null,
        categoriaId: null,
        subcategoriaId: null,
        notificar: false,
        fijada: false,
        repetir: ''
      },
      busquedaCliente: '',
      mostrarDropdownClientes: false,
      clientesFiltrados: [],
      oportunidadesFiltradas: [],
      fechaInicio: '',
      horaInicio: '09:00',
      fechaVencimiento: '',
      horaVencimiento: '18:00',
      seleccionandoTexto: false
    }
  },
  computed: {
    esEdicion() {
      return this.tarea && this.tarea.id != null
    },
    subcategoriasFiltradas() {
      if (!this.formulario.categoriaId) return []
      const categoria = this.categorias.find(c => c.id === this.formulario.categoriaId)
      return categoria?.subcategorias || []
    }
  },
  watch: {
    value(val) {

      if (val) {
        this.inicializarFormulario()
      }
    },
    
    tarea: {
      handler(newVal) {

        if (this.value) {
          this.inicializarFormulario()
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.value) {
      this.inicializarFormulario()
    }
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    inicializarFormulario() {

      if (this.tarea && this.tarea.id) {

        // Modo edición: cargar datos de la tarea existente
        this.formulario = {
          id: this.tarea.id,
          titulo: this.tarea.titulo || '',
          descripcion: this.tarea.descripcion || '',
          usuarioAsignadoId: this.tarea.usuarioAsignadoId || null,
          usuarioCreadorId: this.tarea.usuarioCreadorId || null,
          estadoId: this.tarea.estadoId || null,
          prioridad: this.tarea.prioridad !== undefined && this.tarea.prioridad !== null ? this.tarea.prioridad : 2,
          fechaInicio: this.tarea.fechaInicio || null,
          fechaVencimiento: this.tarea.fechaVencimiento || null,
          clienteRelacionadoId: this.tarea.clienteRelacionadoId || null,
          categoriaId: this.tarea.categoriaId || null,
          subcategoriaId: this.tarea.subcategoriaId || null,
          notificar: Boolean(this.tarea.notificar),
          fijada: Boolean(this.tarea.fijada),
          repetir: this.tarea.repetir || ''
        }
        
        // Formatear fechas para los inputs
        if (this.tarea.fechaInicio) {
          const fechaIni = new Date(this.tarea.fechaInicio)
          this.fechaInicio = fechaIni.toISOString().split('T')[0]
          this.horaInicio = fechaIni.toTimeString().slice(0, 5)
        }
        if (this.tarea.fechaVencimiento) {
          const fecha = new Date(this.tarea.fechaVencimiento)
          this.fechaVencimiento = fecha.toISOString().split('T')[0]
          this.horaVencimiento = fecha.toTimeString().slice(0, 5)
        }
        
        // Cliente relacionado
        if (this.tarea.clienteRelacionadoId && this.tarea.clienteRelacionadoNombre) {
          this.busquedaCliente = this.tarea.clienteRelacionadoNombre
          this.clientesFiltrados = [{ 
            id: this.tarea.clienteRelacionadoId, 
            nombre: this.tarea.clienteRelacionadoNombre 
          }]
        }
      } else {
        // Modo creación: valores por defecto
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        this.formulario = {
          id: null,
          titulo: '',
          descripcion: '',
          usuarioAsignadoId: usuario.id ? parseInt(usuario.id) : null,
          usuarioCreadorId: usuario.id ? parseInt(usuario.id) : null,
          estadoId: null,
          prioridad: 2,
          fechaInicio: null,
          fechaVencimiento: null,
          clienteRelacionadoId: null,
          categoriaId: null,
          subcategoriaId: null,
          notificar: false,
          fijada: false,
          repetir: ''
        }
        
        // Estado por defecto (PENDIENTE)
        const estadoPendiente = this.estados.find(e => 
          e.nombre?.toUpperCase() === 'PENDIENTE' || 
          e.nombre?.toLowerCase() === 'pendiente'
        )
        if (estadoPendiente) {
          this.formulario.estadoId = estadoPendiente.id
        }
        
        // Fechas por defecto
        const hoy = new Date()
        this.fechaInicio = hoy.toISOString().split('T')[0]
        this.fechaVencimiento = hoy.toISOString().split('T')[0]
        this.horaInicio = '09:00'
        this.horaVencimiento = '18:00'
        
        // Limpiar cliente
        this.busquedaCliente = ''
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
      }
      
      // Limpiar nuevo comentario
      this.nuevoComentario = ''
      this.fijarComentario = false
      

    },

    async buscarClientes() {
      if (this.busquedaCliente.length === 0) {
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
        this.mostrarDropdownClientes = false
        return
      }

      // Mostrar dropdown al escribir
      this.mostrarDropdownClientes = true

      try {
        const base = `${process.env.VUE_APP_API_URL || 'http://localhost:8986'}`
        const params = new URLSearchParams({ 
          q: this.busquedaCliente, 
          page: '0', 
          size: '10' 
        })
        
        const responseClientes = await fetch(`${base}/api/clientes/buscar?${params.toString()}`)
        if (responseClientes.ok) {
          const clientes = await responseClientes.json()
          this.clientesFiltrados = Array.isArray(clientes?.content) ? clientes.content : []
        } else {
          this.clientesFiltrados = []
        }

        // Filtrar oportunidades localmente mientras escribes
        const oportunidadesCompletas = [
          { id: 1, codigo: '185', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' },
          { id: 2, codigo: '249', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' }
        ]
        
        this.oportunidadesFiltradas = oportunidadesCompletas.filter(o => 
          o.nombre.toLowerCase().includes(this.busquedaCliente.toLowerCase()) ||
          o.codigo.toLowerCase().includes(this.busquedaCliente.toLowerCase())
        )

      } catch (error) {
        console.error('Error buscando clientes:', error)
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
      }
    },

    seleccionarCliente(cliente) {
      this.formulario.clienteRelacionadoId = cliente.id
      this.busquedaCliente = cliente.nombre
      this.mostrarDropdownClientes = false
    },

    seleccionarOportunidad(oportunidad) {
      this.busquedaCliente = `${oportunidad.codigo} - ${oportunidad.nombre}`
      this.mostrarDropdownClientes = false
    },

    onCategoriaChange() {
      // Limpiar subcategoría cuando cambia la categoría
      this.formulario.subcategoriaId = null
    },

    handleClickOutside(event) {
      if (!event.target.closest('.cliente-field')) {
        this.mostrarDropdownClientes = false
      }
    },

    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('es-ES')
    },

    guardar() {

      // Validación básica
      if (!this.formulario.titulo || this.formulario.titulo.trim() === '') {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'El título es obligatorio'
        })
        return
      }
      

      
      // Construir fechas completas manteniendo la zona horaria local
      if (this.fechaInicio && this.horaInicio) {
        // Crear string en formato ISO sin convertir a UTC
        // Formato: YYYY-MM-DDTHH:mm:ss (sin Z para mantener hora local)
        this.formulario.fechaInicio = `${this.fechaInicio}T${this.horaInicio}:00`
      } else {
        this.formulario.fechaInicio = null
      }
      
      if (this.fechaVencimiento && this.horaVencimiento) {
        // Crear string en formato ISO sin convertir a UTC
        this.formulario.fechaVencimiento = `${this.fechaVencimiento}T${this.horaVencimiento}:00`
      } else {
        this.formulario.fechaVencimiento = null
      }
      
      // Asegurar que el usuarioCreadorId esté presente para nuevas tareas
      if (!this.esEdicion && !this.formulario.usuarioCreadorId) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        this.formulario.usuarioCreadorId = usuario.id ? parseInt(usuario.id) : null
      }

      // Preparar DTO según estructura del backend
      const tareaDTO = {
        id: this.formulario.id || null,
        titulo: this.formulario.titulo,
        descripcion: this.formulario.descripcion || null,
        prioridad: parseInt(this.formulario.prioridad) !== null && !isNaN(parseInt(this.formulario.prioridad)) ? parseInt(this.formulario.prioridad) : 2,
        notificar: Boolean(this.formulario.notificar),
        enviarCorreo: Boolean(this.formulario.enviarCorreo),
        repetir: this.formulario.repetir || null,
        fechaInicio: this.formulario.fechaInicio,
        fechaVencimiento: this.formulario.fechaVencimiento,
        estadoId: this.formulario.estadoId || null,
        usuarioAsignadoId: this.formulario.usuarioAsignadoId || null,
        usuarioCreadorId: this.formulario.usuarioCreadorId || null,
        clienteRelacionadoId: this.formulario.clienteRelacionadoId || null,
        categoriaId: this.formulario.categoriaId || null,
        subcategoriaId: this.formulario.subcategoriaId || null
      }


      this.$emit('guardar', tareaDTO)
    },

    cerrar() {
      // No cerrar si estamos seleccionando texto
      if (this.seleccionandoTexto) {
        this.seleccionandoTexto = false
        return
      }
      
      // Limpiar formulario al cerrar
      this.nuevoComentario = ''
      this.fijarComentario = false
      this.busquedaCliente = ''
      this.mostrarDropdownClientes = false
      this.clientesFiltrados = []
      this.oportunidadesFiltradas = []
      
      this.$emit('update:value', false)
      this.$emit('cerrar')
    },

    iniciarSeleccion(event) {
      // Solo si el clic es directamente en el overlay (no en el contenido)
      if (event.target.classList.contains('modal-overlay')) {
        this.seleccionandoTexto = true
      }
    },

    finalizarSeleccion(event) {
      // Si el mouseup es en el overlay (fuera del contenido), cerrar
      if (event.target.classList.contains('modal-overlay')) {
        // Solo cerrar si fue un clic rápido, no una selección de texto larga
        setTimeout(() => {
          if (this.seleccionandoTexto) {
            this.cerrar()
          }
        }, 100)
      } else {
        // Si fue dentro del contenido, no hacer nada
        this.seleccionandoTexto = false
      }
    }
  }
}
</script>

<style scoped>
/* Overlay y contenedor principal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.modal-content {
  background: white;
  border-radius: 0.4rem;
  width: 70%;
  height: 80%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Formulario compacto con filas */
.form-compact {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Filas del formulario */
.row-1, .row-2, .row-3 {
  display: grid;
  gap: 16px;
  align-items: start;
}

.row-1 {
  grid-template-columns: 1fr 2fr;
}

.row-2 {
  grid-template-columns: repeat(4, 1fr);
}

.row-3 {
  grid-template-columns: repeat(4, 1fr);
}

.row-4, .row-5 {
  display: flex;
}

.cliente-field {
  position: relative;
}

.options-group {
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
}

/* Grupos de formulario */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group label i {
  color: #333;
  font-size: 0.85rem;
}

.required {
  color: #dc3545;
}

/* Controles de formulario */
.form-control {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  background: #fafafa;
  box-sizing: border-box;
  font-weight: 500;
  height: 40px;
  display: flex;
  align-items: center;
}

.form-control:hover {
  border-color: #d0d0d0;
  background: #fff;
}

.form-control:focus {
  outline: none;
  border-color: #FCD700;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(252, 215, 0, 0.15);
}

textarea.form-control {
  resize: vertical;
  height: auto;
  min-height: 70px;
  font-family: inherit;
}

.prioridad-select {
  font-weight: 600;
  transition: all 0.3s ease;
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
  padding-right: 32px;
}

.prioridad-select option {
  padding: 8px;
  font-weight: 600;
  background: white;
  color: #333;
}

/* Colores dinámicos del select según la prioridad seleccionada */
.prioridad-selected-3 {
  background-color: #d4edda !important;
  color: #155724 !important;
  border-color: #28a745 !important;
}

.prioridad-selected-3:hover,
.prioridad-selected-3:focus {
  background-color: #c3e6cb !important;
  color: #155724 !important;
}

.prioridad-selected-2 {
  background-color: #fff3cd !important;
  color: #856404 !important;
  border-color: #ffc107 !important;
}

.prioridad-selected-2:hover,
.prioridad-selected-2:focus {
  background-color: #ffeeba !important;
  color: #856404 !important;
}

.prioridad-selected-1 {
  background-color: #f8d7da !important;
  color: #721c24 !important;
  border-color: #dc3545 !important;
}

.prioridad-selected-1:hover,
.prioridad-selected-1:focus {
  background-color: #f5c6cb !important;
  color: #721c24 !important;
}

.prioridad-selected-0 {
  background-color: #8b0000 !important;
  color: white !important;
  border-color: #5c0000 !important;
}

.prioridad-selected-0:hover,
.prioridad-selected-0:focus {
  background-color: #a52a2a !important;
  color: white !important;
}

/* Input con icon */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon i {
  position: absolute;
  left: 12px;
  color: #333;
  font-size: 0.9rem;
  pointer-events: none;
}

.input-with-icon .form-control {
  padding-left: 38px;
  width: 100%;
}

/* Input especial para cliente */
.cliente-input-wrapper {
  position: relative;
}

.cliente-arrow {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #FCD700;
  font-size: 1.2rem;
  font-weight: bold;
  animation: arrowPulse 2s ease-in-out infinite;
  z-index: 5;
}

@keyframes arrowPulse {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-50%) translateX(4px);
    opacity: 0.7;
  }
}

.cliente-input-wrapper .form-control {
  padding-left: 38px;
}

/* Fechas compactas */
.datetime-compact {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-input {
  flex: 1.5;
  min-width: 120px;
}

.time-input {
  flex: 0.8;
  min-width: 85px;
}

/* Opciones */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-compact {
  display: flex;
  align-items: center;
  gap: 6px;
}

.checkbox-compact input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.checkbox-compact label {
  margin: 0;
  cursor: pointer;
  font-size: 0.8rem;
  color: #333;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Dropdown de clientes */
.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #FCD700;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
}

.dropdown-section {
  padding: 6px 0;
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #FCD700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 2px solid #FCD700;
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #333;
  border-bottom: 1px solid #f8f9fa;
  font-weight: 500;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, rgba(252, 215, 0, 0.15) 0%, rgba(252, 215, 0, 0.08) 100%);
  color: #333;
  padding-left: 16px;
  font-weight: 600;
}

.dropdown-item:last-child {
  border-bottom: none;
}

/* Comentarios compactos */
.comentarios-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comentario-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comentario-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.btn-attach {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #6c757d;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
}

.btn-attach:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: black;
}

.comentarios-lista {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 8px;
  background: #f8f9fa;
}

.comentario-item {
  padding: 6px;
  background: white;
  border-radius: 3px;
  margin-bottom: 4px;
  border: 1px solid #e9ecef;
}

.comentario-item:last-child {
  margin-bottom: 0;
}

.comentario-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
  font-size: 0.65rem;
}

.comentario-autor {
  font-weight: 600;
  color: #495057;
}

.comentario-fecha {
  color: #6c757d;
}

.btn-star {
  margin-left: auto;
  background: none;
  border: none;
  color: rgb(252, 215, 0);
  cursor: pointer;
  padding: 2px;
  font-size: 0.7rem;
  transition: all 0.2s ease;
}

.btn-star:hover {
  transform: scale(1.1);
}

.comentario-texto {
  font-size: 0.7rem;
  color: #495057;
  line-height: 1.3;
}

.archivos-selector-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.archivos-count {
  font-size: 0.7rem;
  color: #6c757d;
  font-style: italic;
}

.btn-guardar-comentario {
  background: rgb(252, 215, 0);
  color: black;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
}

.btn-guardar-comentario:hover:not(:disabled) {
  background: #ffd700;
}

.btn-guardar-comentario:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comentario-adjuntos-mini {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e9ecef;
  font-size: 0.65rem;
}

.adjunto-mini {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
  padding: 2px 0;
}

.adjunto-nombre-clickable {
  cursor: pointer;
  color: rgb(252, 215, 0);
  text-decoration: underline;
}

.adjunto-nombre-clickable:hover {
  color: #ffd700;
}

.adjunto-size {
  color: #adb5bd;
  font-size: 0.6rem;
}

/* Footer */
.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--primary-color);
  color: black;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content { 
    max-width: 95vw; 
  }
  .row-1 {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .row-2 {
    grid-template-columns: 1fr 1fr;
  }
  .row-3 {
    grid-template-columns: 1fr 1fr;
  }
  .cliente-field {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 5px;
  }
  .modal-content {
    max-height: 95vh;
  }
  .modal-body {
    padding: 12px 15px;
  }
  .row-1, .row-2, .row-3 {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .datetime-compact {
    gap: 6px;
  }
  .comentario-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
}
</style>
