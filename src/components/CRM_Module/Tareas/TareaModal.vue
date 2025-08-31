<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content" @click.stop>
      <!-- Header del modal -->
      <div class="modal-header">
        <h2 class="modal-title">
          <i class="fas fa-plus-circle"></i>
          {{ esEdicion ? 'Editar Tarea' : 'Nueva Tarea' }}
        </h2>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="guardar" class="modal-body">
        <div class="form-grid">
          <!-- Título -->
          <div class="form-group full-width">
            <label for="titulo">Título de la tarea <span class="required">*</span></label>
            <div class="input-with-icon">
              <i class="fas fa-text-width icon-prefix"></i>
              <input 
                type="text" 
                id="titulo"
                v-model="formData.titulo" 
                class="form-control" 
                required
                maxlength="200"
                placeholder="Escribe un título descriptivo para la tarea"
              />
            </div>
            <div class="input-counter">{{ formData.titulo.length }}/200</div>
          </div>

          <!-- Descripción -->
          <div class="form-group full-width">
            <label for="descripcion">Descripción</label>
            <div class="input-with-icon">
              <i class="fas fa-align-left icon-prefix"></i>
              <textarea 
                id="descripcion"
                v-model="formData.descripcion" 
                class="form-control" 
                rows="3"
                maxlength="1000"
                placeholder="Describe detalladamente la tarea a realizar"
              ></textarea>
            </div>
            <div class="input-counter">{{ formData.descripcion.length }}/1000</div>
          </div>

          <!-- Usuario asignado y Prioridad -->
          <div class="form-group">
            <label for="usuarioAsignado">Usuario asignado <span class="required">*</span></label>
            <div class="input-with-icon">
              <i class="fas fa-user icon-prefix"></i>
              <select 
                id="usuarioAsignado"
                v-model="formData.usuarioAsignadoId" 
                class="form-control" 
                required
              >
                <option value="">Selecciona el usuario responsable</option>
                <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="prioridad">Prioridad</label>
            <div class="input-with-icon">
              <i class="fas fa-flag icon-prefix"></i>
              <select 
                id="prioridad"
                v-model="formData.prioridad" 
                class="form-control"
              >
                <option value="2">Media</option>
                <option value="1">Alta</option>
                <option value="3">Baja</option>
              </select>
            </div>
          </div>

          <!-- Estado y Fecha de vencimiento -->
          <div class="form-group">
            <label for="estado">Estado</label>
            <div class="input-with-icon">
              <i class="fas fa-tasks icon-prefix"></i>
              <select 
                id="estado"
                v-model="formData.estadoId" 
                class="form-control"
              >
                <option v-for="estado in estadosDisponibles" :key="estado.id" :value="estado.id">
                  {{ estado.nombre }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="fechaInicio">Fecha de inicio</label>
            <div class="input-with-icon">
              <i class="fas fa-calendar-plus icon-prefix"></i>
              <input 
                type="datetime-local" 
                id="fechaInicio"
                v-model="formData.fechaInicio" 
                class="form-control"
                placeholder="Fecha planificada para iniciar la tarea"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="fechaVencimiento">Fecha de vencimiento</label>
            <div class="input-with-icon">
              <i class="fas fa-calendar-alt icon-prefix"></i>
              <input 
                type="datetime-local" 
                id="fechaVencimiento"
                v-model="formData.fechaVencimiento" 
                class="form-control"
                placeholder="Fecha límite para completar la tarea"
              />
            </div>
          </div>

          <!-- Tiempo estimado y Etiquetas -->
          <div class="form-group">
            <label for="tiempoEstimado">Tiempo estimado (minutos)</label>
            <div class="input-with-icon">
              <i class="fas fa-clock icon-prefix"></i>
              <input 
                type="number" 
                id="tiempoEstimado"
                v-model="formData.tiempoEstimado" 
                class="form-control"
                min="0"
                placeholder="Tiempo aproximado en minutos"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="etiquetas">Etiquetas</label>
            <div class="input-with-icon">
              <i class="fas fa-tags icon-prefix"></i>
              <input 
                type="text" 
                id="etiquetas"
                v-model="formData.etiquetas" 
                class="form-control"
                placeholder="urgente, cliente, revisión"
              />
            </div>
            <small class="form-hint">Separadas por comas</small>
          </div>

          <!-- Cliente relacionado -->
          <div class="form-group full-width">
            <label for="clienteRelacionado">Cliente relacionado (opcional)</label>
            <div class="input-with-icon">
              <i class="fas fa-building icon-prefix"></i>
              <input 
                type="text" 
                id="clienteRelacionado"
                v-model="busquedaCliente" 
                class="form-control"
                placeholder="Busca y selecciona un cliente"
                @input="buscarClientes"
                @focus="mostrarDropdownClientes = true"
              />
            </div>
            
            <!-- Dropdown de clientes -->
            <div v-if="mostrarDropdownClientes && clientes.length > 0" class="dropdown-clientes">
              <div 
                v-for="cliente in clientes" 
                :key="cliente.id"
                class="dropdown-item"
                @click="seleccionarCliente(cliente)"
              >
                <strong>{{ cliente.nombre }}</strong>
                <small>{{ cliente.cif }}</small>
              </div>
            </div>
            
            <!-- Cliente seleccionado -->
            <div v-if="formData.clienteRelacionadoId" class="cliente-seleccionado">
              <span class="badge badge-primary">
                <i class="fas fa-check"></i>
                {{ clienteSeleccionadoNombre }}
              </span>
              <button type="button" class="btn-icon" @click="quitarCliente">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Archivos adjuntos -->
          <div class="form-group full-width">
            <label for="archivos">Archivos adjuntos</label>
            <div 
              class="dropzone"
              :class="{ 'dragover': dragover }"
              @dragenter.prevent="dragover = true"
              @dragover.prevent
              @dragleave.prevent="dragover = false"
              @drop.prevent="handleFileDrop"
              @click="$refs.fileInput.click()"
            >
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Arrastra archivos aquí o haz clic para seleccionar</p>
              <small>Máximo 5MB por archivo. Formatos: PDF, DOC, DOCX, XLS, XLSX, imágenes</small>
              <input 
                type="file" 
                ref="fileInput"
                @change="handleFileSelect"
                class="file-input-hidden" 
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>
            
            <!-- Lista de archivos seleccionados -->
            <div v-if="archivosSeleccionados.length > 0" class="archivos-lista">
              <div v-for="(archivo, index) in archivosSeleccionados" :key="index" class="archivo-item">
                <i class="fas fa-file"></i>
                <span class="archivo-nombre">{{ archivo.name }}</span>
                <span class="archivo-size">({{ formatFileSize(archivo.size) }})</span>
                <button type="button" class="btn-remove-file" @click="removerArchivo(index)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrar" :disabled="guardando">
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" @click="guardar" :disabled="!formularioValido || guardando">
          <i class="fas" :class="esEdicion ? 'fa-save' : 'fa-plus-circle'"></i>
          {{ esEdicion ? 'Actualizar' : 'Crear' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TareaModal',
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
    }
  },
  data() {
    return {
      formularioValido: false,
      guardando: false,
      clientes: [],
      cargandoClientes: false,
      busquedaCliente: '',
      mostrarDropdownClientes: false,
      timeoutBusqueda: null,
      dragover: false,
      archivosSeleccionados: [],
      
      formData: {
        titulo: '',
        descripcion: '',
        usuarioAsignadoId: null,
        usuarioCreadorId: null,
        estadoId: null,
        prioridad: 2,
        fechaInicio: '',
        fechaVencimiento: '',
        tiempoEstimado: null,
        etiquetas: '',
        clienteRelacionadoId: null
      }
    }
  },
  computed: {
    esEdicion() {
      return this.tarea && this.tarea.id
    },
    
    estadosDisponibles() {
      // Si es nueva tarea, mostrar solo estados no finales
      if (!this.esEdicion) {
        return this.estados.filter(e => !e.estadoFinal)
      }
      return this.estados
    },
    
    clienteSeleccionadoNombre() {
      if (!this.formData.clienteRelacionadoId) return ''
      const cliente = this.clientes.find(c => c.id === this.formData.clienteRelacionadoId)
      return cliente ? cliente.nombre : ''
    }
  },
  watch: {
    value(newVal) {
      if (newVal) {
        this.inicializar()
      }
    },
    
    tarea: {
      handler() {
        if (this.value) {
          this.inicializar()
        }
      },
      deep: true
    },
    
    busquedaCliente(val) {
      // Limpiar timeout anterior
      if (this.timeoutBusqueda) {
        clearTimeout(this.timeoutBusqueda)
      }
      
      // Implementar debounce de 300ms
      this.timeoutBusqueda = setTimeout(() => {
        if (val && val.length > 2) {
          this.buscarClientes(val)
        } else {
          this.clientes = []
          this.mostrarDropdownClientes = false
        }
      }, 300)
    },
    
    formData: {
      handler() {
        this.validarFormulario()
      },
      deep: true
    }
  },
  mounted() {
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
    if (this.timeoutBusqueda) {
      clearTimeout(this.timeoutBusqueda)
    }
  },
  methods: {
    inicializar() {
      this.resetForm()
      
      if (this.esEdicion) {
        this.cargarDatosTarea()
      } else {
        this.configurarNuevaTarea()
      }
    },
    
    resetForm() {
      this.formData = {
        titulo: '',
        descripcion: '',
        usuarioAsignadoId: null,
        usuarioCreadorId: null,
        estadoId: null,
        prioridad: 2,
        fechaInicio: '',
        fechaVencimiento: '',
        tiempoEstimado: null,
        etiquetas: '',
        clienteRelacionadoId: null
      }
      
      this.busquedaCliente = ''
      this.clientes = []
      this.mostrarDropdownClientes = false
    },
    
    cargarDatosTarea() {
      if (!this.tarea) return
      
      this.formData = {
        titulo: this.tarea.titulo || '',
        descripcion: this.tarea.descripcion || '',
        usuarioAsignadoId: this.tarea.usuarioAsignadoId,
        usuarioCreadorId: this.tarea.usuarioCreadorId,
        estadoId: this.tarea.estadoId,
        prioridad: this.tarea.prioridad || 2,
        fechaInicio: this.formatearFechaParaInput(this.tarea.fechaInicio),
        fechaVencimiento: this.formatearFechaParaInput(this.tarea.fechaVencimiento),
        tiempoEstimado: this.tarea.tiempoEstimado,
        etiquetas: this.tarea.etiquetas || '',
        clienteRelacionadoId: this.tarea.clienteRelacionadoId
      }
      
      // Si hay cliente relacionado, agregarlo a la lista
      if (this.tarea.clienteRelacionadoId && this.tarea.clienteRelacionadoNombre) {
        this.clientes = [{
          id: this.tarea.clienteRelacionadoId,
          nombre: this.tarea.clienteRelacionadoNombre
        }]
      }
    },
    
    configurarNuevaTarea() {
      // Configurar valores por defecto para nueva tarea
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (usuario.id) {
        this.formData.usuarioAsignadoId = parseInt(usuario.id)
        this.formData.usuarioCreadorId = parseInt(usuario.id)
      } else {
        console.error('No se encontró usuario en localStorage')
        this.$emit('error', 'No se pudo identificar el usuario actual')
        return
      }
      
      // Estado por defecto (primer estado no final)
      const estadoPendiente = this.estados.find(e => !e.estadoFinal)
      if (estadoPendiente) {
        this.formData.estadoId = estadoPendiente.id
      }
    },
    
    async buscarClientes(busqueda) {
      if (!busqueda || busqueda.length < 2) {
        this.clientes = []
        return
      }
      
      try {
        this.cargandoClientes = true
        // Llamar a la API de clientes
        const params = new URLSearchParams({ q: busqueda, page: '0', size: '10' })
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8986'}/api/clientes/buscar?${params.toString()}`)
        if (response.ok) {
          const json = await response.json()
          this.clientes = Array.isArray(json?.content) ? json.content : []
        } else {
          this.clientes = []
        }
      } catch (error) {
        console.error('Error buscando clientes:', error)
        this.clientes = []
      } finally {
        this.cargandoClientes = false
      }
    },
    
    seleccionarCliente(cliente) {
      this.formData.clienteRelacionadoId = cliente.id
      this.busquedaCliente = cliente.nombre
      this.mostrarDropdownClientes = false
    },
    
    quitarCliente() {
      this.formData.clienteRelacionadoId = null
      this.busquedaCliente = ''
    },
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.mostrarDropdownClientes = false
      }
    },
    
    formatearFechaParaInput(fecha) {
      if (!fecha) return ''
      
      try {
        const date = new Date(fecha)
        // Formato para datetime-local: YYYY-MM-DDTHH:MM
        return date.toISOString().slice(0, 16)
      } catch (error) {
        return ''
      }
    },
    
    validarFormulario() {
      this.formularioValido = !!(
        this.formData.titulo &&
        this.formData.usuarioAsignadoId &&
        this.formData.estadoId
      )
    },
    
    async guardar() {
      if (!this.formularioValido) return
      
      try {
        this.guardando = true
        
        const datosTarea = { ...this.formData }
        
        // Asegurar que usuarioCreadorId siempre tenga un valor
        if (!datosTarea.usuarioCreadorId) {
          const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
          if (usuario.id) {
            datosTarea.usuarioCreadorId = parseInt(usuario.id)
          } else {
            datosTarea.usuarioCreadorId = datosTarea.usuarioAsignadoId
          }
        }
        
        // Convertir fecha si existe
        if (datosTarea.fechaVencimiento) {
          datosTarea.fechaVencimiento = new Date(datosTarea.fechaVencimiento).toISOString()
        }
        
        // Si es edición, incluir el ID
        if (this.esEdicion) {
          datosTarea.id = this.tarea.id
        }
        
        this.$emit('guardar', datosTarea)
      } catch (error) {
        console.error('Error guardando tarea:', error)
      } finally {
        this.guardando = false
      }
    },
    
    handleFileDrop(event) {
      this.dragover = false
      const files = Array.from(event.dataTransfer.files)
      this.procesarArchivos(files)
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.procesarArchivos(files)
    },

    procesarArchivos(files) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          alert(`El archivo ${file.name} es demasiado grande. Máximo 5MB.`)
          return false
        }
        return true
      })
      
      this.archivosSeleccionados = [...this.archivosSeleccionados, ...validFiles]
    },

    removerArchivo(index) {
      this.archivosSeleccionados.splice(index, 1)
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    cerrar() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header del modal */
.modal-header {
  background: rgb(252, 215, 0);
  color: black;
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.close-button {
  top: 0.6rem;
  right: 0.8rem;
  background-color: #e74c3c;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.close-button:hover {
  background-color: #c0392b;
  transform: rotate(90deg);
}

/* Body del modal */
.modal-body {
  flex: 1;
  padding: 1.2rem;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.8rem;
}

.required {
  color: var(--danger-color);
}

.input-with-icon {
  position: relative;
}

.icon-prefix {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.input-with-icon .form-control {
  padding-left: 2rem;
}

.form-control {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  background-color: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.input-counter {
  text-align: right;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.form-hint {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Dropzone para archivos */
.dropzone {
  border: 2px dashed #dee2e6;
  border-radius: 6px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.dropzone:hover,
.dropzone.dragover {
  border-color: rgb(252, 215, 0);
  background: rgba(252, 215, 0, 0.05);
}

.dropzone i {
  font-size: 1.5rem;
  color: rgb(252, 215, 0);
  margin-bottom: 8px;
}

.dropzone p {
  margin: 0 0 6px 0;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.85rem;
}

.dropzone small {
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.file-input-hidden {
  display: none;
}

.archivos-lista {
  margin-top: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 8px;
  background: #f8f9fa;
}

.archivo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 6px;
  border: 1px solid #e9ecef;
}

.archivo-item:last-child {
  margin-bottom: 0;
}

.archivo-item i {
  color: rgb(252, 215, 0);
  font-size: 1rem;
}

.archivo-nombre {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8rem;
}

.archivo-size {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.btn-remove-file {
  background: #dc3545;
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
}

.btn-remove-file:hover {
  background: #c82333;
  transform: scale(1.1);
}

/* Dropdown de clientes */
.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  z-index: 100;
  max-height: 180px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.6rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item strong {
  color: var(--text-primary);
  font-size: 0.8rem;
}

.dropdown-item small {
  color: var(--text-secondary);
  font-size: 0.7rem;
}

/* Cliente seleccionado */
.cliente-seleccionado {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
}

.cliente-seleccionado .badge {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.2rem 0.4rem;
  background-color: rgb(252, 215, 0);
  color: black;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 500;
}

.btn-icon {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.1rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

/* Footer del modal */
.modal-footer {
  padding: 0.8rem 1.2rem;
  border-top: 1px solid var(--border-color);
  background-color: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: rgb(252, 215, 0);
  color: black;
}

.btn-primary:hover:not(:disabled) {
  background-color: #e6c200;
  transform: translateY(-1px);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>