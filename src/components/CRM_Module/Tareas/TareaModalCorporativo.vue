<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content modal-tarea" @click.stop>
      <!-- Header del modal -->
      <div class="modal-header">
        <h2 class="modal-title">Crear tarea</h2>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body del modal -->
      <div class="modal-body">
        <form @submit.prevent="guardar">
          <!-- Primera fila: Tipo y Nombre -->
          <div class="form-row">
            <div class="form-group tipo-group">
              <label>Tipo</label>
              <div class="tipo-selector">
                <select v-model="formulario.tipo" class="form-control tipo-select">
                  <option value="Seguimiento">Seguimiento</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Correo">Correo</option>
                  <option value="Reunión">Reunión</option>
                  <option value="Visita">Visita</option>
                  <option value="Evento Calendly">Evento Calendly</option>
                  <option value="Evento Google Calendar">Evento Google Calendar</option>
                  <option value="Videoconferencia - Zoom">Videoconferencia - Zoom</option>
                  <option value="Videoconferencia - Google Meet">Videoconferencia - Google Meet</option>
                  <option value="Por hacer">Por hacer</option>
                  <option value="Por facturar">Por facturar</option>
                </select>
                <button type="button" class="btn-add-tipo">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div class="form-group flex-grow">
              <label>Nombre <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formulario.titulo" 
                class="form-control"
                required
                placeholder="Título de la tarea"
              />
            </div>
          </div>

          <!-- Segunda fila: Dirigido a -->
          <div class="form-row">
            <div class="form-group">
              <label>Dirigido a <span class="required">*</span></label>
              <div class="cliente-selector">
                <input 
                  type="text" 
                  v-model="busquedaCliente"
                  @input="buscarClientes"
                  @focus="mostrarDropdownClientes = true"
                  class="form-control"
                  placeholder="Introduce al menos 3 caracteres para buscar"
                />
                <button type="button" class="btn-search" @click="buscarClientes">
                  <i class="fas fa-search"></i>
                </button>
                
                <!-- Dropdown de clientes -->
                <div v-if="mostrarDropdownClientes && clientesFiltrados.length > 0" class="dropdown-clientes">
                  <div class="dropdown-section">
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

          <!-- Tercera fila: Descripción -->
          <div class="form-row">
            <div class="form-group">
              <label>Descripción</label>
              <textarea 
                v-model="formulario.descripcion" 
                class="form-control"
                rows="4"
                placeholder="Descripción detallada de la tarea..."
              ></textarea>
            </div>
          </div>

          <!-- Cuarta fila: Fechas -->
          <div class="form-row">
            <div class="form-group">
              <label>Fecha de inicio</label>
              <div class="datetime-input">
                <input 
                  type="date" 
                  v-model="fechaInicio" 
                  class="form-control"
                />
                <input 
                  type="time" 
                  v-model="horaInicio" 
                  class="form-control time-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Fecha de vencimiento</label>
              <div class="datetime-input">
                <input 
                  type="date" 
                  v-model="fechaVencimiento" 
                  class="form-control"
                />
                <input 
                  type="time" 
                  v-model="horaVencimiento" 
                  class="form-control time-input"
                />
              </div>
            </div>
          </div>

          <!-- Quinta fila: Notificación y Asignación -->
          <div class="form-row">
            <div class="form-group">
              <div class="checkbox-group">
                <input 
                  type="checkbox" 
                  id="notificar" 
                  v-model="formulario.notificar"
                />
                <label for="notificar">Se notificará una hora antes</label>
              </div>
            </div>

            <div class="form-group">
              <label>Asignada a</label>
              <select v-model="formulario.usuarioAsignadoId" class="form-control">
                <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
              <div class="checkbox-group mt-2">
                <input 
                  type="checkbox" 
                  id="enviarCorreo" 
                  v-model="formulario.enviarCorreo"
                />
                <label for="enviarCorreo">Enviar correo al usuario asignado</label>
              </div>
            </div>
          </div>

          <!-- Sexta fila: Prioridad y Repetir -->
          <div class="form-row">
            <div class="form-group">
              <label>Prioridad</label>
              <select v-model="formulario.prioridad" class="form-control">
                <option :value="3">🟢 Baja</option>
                <option :value="2">🟡 Media</option>
                <option :value="1">🔴 Alta</option>
              </select>
            </div>

            <div class="form-group">
              <label>Repetir</label>
              <select v-model="formulario.repetir" class="form-control">
                <option value="">No repetir</option>
                <option value="diario">Diariamente</option>
                <option value="semanal">Semanalmente</option>
                <option value="mensual">Mensualmente</option>
                <option value="anual">Anualmente</option>
              </select>
            </div>
          </div>

          <!-- Séptima fila: Comentarios -->
          <div class="form-row">
            <div class="form-group">
              <label>Comentarios</label>
              <div class="comentarios-container">
                <textarea 
                  v-model="nuevoComentario" 
                  class="form-control"
                  rows="3"
                  placeholder="Añadir un comentario..."
                ></textarea>
                <div class="comentarios-opciones">
                  <button type="button" class="btn-adjuntar">
                    <i class="fas fa-paperclip"></i>
                    Busca o arrastra y suelta tus archivos aquí
                  </button>
                  <div class="checkbox-group">
                    <input 
                      type="checkbox" 
                      id="fijarComentario" 
                      v-model="fijarComentario"
                    />
                    <label for="fijarComentario">
                      Que puedan ir saliendo en listado y que se pueda marcar la opción de fijar al inicio
                    </label>
                  </div>
                </div>
                
                <!-- Lista de comentarios -->
                <div v-if="formulario.comentarios && formulario.comentarios.length > 0" class="comentarios-lista">
                  <div v-for="(comentario, index) in formulario.comentarios" :key="index" class="comentario-item">
                    <div class="comentario-header">
                      <span class="comentario-autor">{{ comentario.autor }}</span>
                      <span class="comentario-fecha">{{ formatDate(comentario.fecha) }}</span>
                      <button type="button" class="btn-fijar" @click="toggleFijarComentario(index)">
                        <i :class="comentario.fijado ? 'fas fa-star' : 'far fa-star'"></i>
                      </button>
                    </div>
                    <div class="comentario-texto">{{ comentario.texto }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrar">
          Cancelar
        </button>
        <button type="button" class="btn btn-primary" @click="guardar">
          Crear
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
    }
  },
  data() {
    return {
      formulario: {
        titulo: '',
        descripcion: '',
        tipo: 'Seguimiento',
        usuarioAsignadoId: null,
        estadoId: null,
        prioridad: 2,
        fechaInicio: null,
        fechaVencimiento: null,
        clienteRelacionadoId: null,
        notificar: false,
        enviarCorreo: false,
        repetir: '',
        comentarios: []
      },
      busquedaCliente: '',
      mostrarDropdownClientes: false,
      clientesFiltrados: [],
      oportunidadesFiltradas: [],
      fechaInicio: '',
      horaInicio: '09:00',
      fechaVencimiento: '',
      horaVencimiento: '18:00',
      nuevoComentario: '',
      fijarComentario: false
    }
  },
  watch: {
    value(val) {
      if (val) {
        this.inicializarFormulario()
      }
    },
    
    tarea: {
      handler() {
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
      if (this.tarea) {
        this.formulario = { ...this.tarea }
        // Precargar fechas en edición
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
        
        // Precargar cliente en edición
        if (this.tarea.clienteRelacionadoId && this.tarea.clienteRelacionadoNombre) {
          this.formulario.clienteRelacionadoId = this.tarea.clienteRelacionadoId
          this.busquedaCliente = this.tarea.clienteRelacionadoNombre
          this.clientesFiltrados = [{ id: this.tarea.clienteRelacionadoId, nombre: this.tarea.clienteRelacionadoNombre }]
        }
        // Asegurar tipo válido
        if (!this.formulario.tipo) {
          this.formulario.tipo = 'Seguimiento'
        }
      } else {
        // Establecer valores por defecto
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        this.formulario.usuarioAsignadoId = usuario.id ? parseInt(usuario.id) : null
        
        // Estado por defecto
        const estadoPendiente = this.estados.find(e => e.nombre === 'PENDIENTE')
        this.formulario.estadoId = estadoPendiente ? estadoPendiente.id : null
        
        // Fecha por defecto (hoy)
        const hoy = new Date()
        this.fechaInicio = hoy.toISOString().split('T')[0]
        this.fechaVencimiento = hoy.toISOString().split('T')[0]
      }
    },

    async buscarClientes() {
      if (this.busquedaCliente.length < 3) {
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
        return
      }

      try {
        // Búsqueda server-side por nombre o CIF
        const base = `${process.env.VUE_APP_API_URL || 'http://localhost:8986'}`
        const params = new URLSearchParams({ q: this.busquedaCliente, page: '0', size: '10' })
        const responseClientes = await fetch(`${base}/api/clientes/buscar?${params.toString()}`)
        if (responseClientes.ok) {
          const clientes = await responseClientes.json()
          this.clientesFiltrados = Array.isArray(clientes?.content) ? clientes.content : []
        } else {
          this.clientesFiltrados = []
        }

        // Simular búsqueda de oportunidades (placeholder)
        this.oportunidadesFiltradas = [
          { id: 1, codigo: '185', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' },
          { id: 2, codigo: '249', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' }
        ].filter(o => 
          o.nombre.toLowerCase().includes(this.busquedaCliente.toLowerCase()) ||
          o.codigo.includes(this.busquedaCliente)
        )

        this.mostrarDropdownClientes = true
      } catch (error) {
        console.error('Error buscando clientes:', error)
        this.clientesFiltrados = []
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

    handleClickOutside(event) {
      if (!event.target.closest('.cliente-selector')) {
        this.mostrarDropdownClientes = false
      }
    },

    toggleFijarComentario(index) {
      if (this.formulario.comentarios[index]) {
        this.formulario.comentarios[index].fijado = !this.formulario.comentarios[index].fijado
      }
    },

    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('es-ES')
    },

    guardar() {
      // Combinar fecha y hora de inicio
      if (this.fechaInicio) {
        const fechaIni = new Date(this.fechaInicio + 'T' + this.horaInicio)
        this.formulario.fechaInicio = fechaIni.toISOString()
      }
      
      // Combinar fecha y hora de vencimiento
      if (this.fechaVencimiento) {
        const fecha = new Date(this.fechaVencimiento + 'T' + this.horaVencimiento)
        this.formulario.fechaVencimiento = fecha.toISOString()
      }

      // Añadir comentario si hay uno nuevo
      if (this.nuevoComentario) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        this.formulario.comentarios = this.formulario.comentarios || []
        this.formulario.comentarios.push({
          texto: this.nuevoComentario,
          autor: usuario.nombre || 'Usuario',
          fecha: new Date(),
          fijado: this.fijarComentario
        })
      }

      this.$emit('guardar', this.formulario)
    },

    cerrar() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
/* Overlay con mayor z-index para quedar por encima de otros modales */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 1280px;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e9ecef;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.25rem;
  color: #2c3e50;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

/* Compactar layout */
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.flex-grow {
  flex: 2;
}

.form-group.tipo-group {
  flex: 0 0 300px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
}

.required {
  color: #dc3545;
}

.form-control {
  padding: 10px 14px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(252, 215, 0, 0.1);
}

.tipo-selector {
  display: flex;
  gap: 8px;
}

.tipo-select {
  flex: 1;
}

.btn-add-tipo {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
}

.btn-add-tipo:hover {
  background: #e6c200;
  transform: translateY(-1px);
}

.cliente-selector {
  position: relative;
  display: flex;
  gap: 8px;
}

.cliente-selector .form-control {
  flex: 1;
}

.btn-search {
  background: rgb(252, 215, 0);
  border: none;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #2c3e50;
  font-weight: 600;
}

.btn-search:hover {
  background: #e6c200;
  transform: translateY(-1px);
}

.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
}

.dropdown-section {
  padding: 8px 0;
}

.dropdown-header {
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

/* Dropdown de clientes más compacto */
.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: #495057;
  border-bottom: 1px solid #f8f9fa;
}

.dropdown-item:hover {
  background: rgba(252, 215, 0, 0.1);
  color: #2c3e50;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.datetime-input {
  display: flex;
  gap: 12px;
}

.time-input {
  max-width: 140px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: rgb(252, 215, 0);
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.mt-2 {
  margin-top: 16px;
}

.comentarios-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comentarios-opciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-adjuntar {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-adjuntar:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.comentarios-lista {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
}

.comentario-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
}

.comentario-item:last-child {
  margin-bottom: 0;
}

.comentario-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.comentario-autor {
  font-weight: 600;
  color: #495057;
}

.comentario-fecha {
  color: #6c757d;
}

.btn-fijar {
  margin-left: auto;
  background: none;
  border: none;
  color: rgb(252, 215, 0);
  cursor: pointer;
  padding: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-fijar:hover {
  transform: scale(1.1);
}

.comentario-texto {
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 32px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
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
  background: rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-primary:hover {
  background: #e6c200;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content { max-width: 96vw; max-height: 96vh; }
  .modal-body { padding: 16px; }
  .form-row { flex-direction: column; gap: 12px; }
}
</style>
