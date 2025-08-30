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
        <form @submit.prevent="guardar" class="form-compact">
          
          <!-- Primera fila: Tipo, Nombre, Cliente -->
          <div class="row-1">
            <div class="form-group">
              <label>Tipo</label>
              <div class="input-with-button">
                <select v-model="formulario.tipo" class="form-control">
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
                <button type="button" class="btn-icon">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Nombre <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formulario.titulo" 
                class="form-control"
                required
                placeholder="Título de la tarea"
              />
            </div>

            <div class="form-group cliente-field">
              <label>Dirigido a <span class="required">*</span></label>
              <div class="input-with-button">
                <input 
                  type="text" 
                  v-model="busquedaCliente"
                  @input="buscarClientes"
                  @focus="mostrarDropdownClientes = true"
                  class="form-control"
                  placeholder="Buscar cliente..."
                />
                <button type="button" class="btn-icon" @click="buscarClientes">
                  <i class="fas fa-search"></i>
                </button>
                
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
              <label>Fecha inicio</label>
              <div class="datetime-compact">
                <input type="date" v-model="fechaInicio" class="form-control date-input" />
                <input type="time" v-model="horaInicio" class="form-control time-input" />
              </div>
            </div>

            <div class="form-group">
              <label>Fecha vencimiento</label>
              <div class="datetime-compact">
                <input type="date" v-model="fechaVencimiento" class="form-control date-input" />
                <input type="time" v-model="horaVencimiento" class="form-control time-input" />
              </div>
            </div>

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

          <!-- Tercera fila: Asignación y Opciones -->
          <div class="row-3">
            <div class="form-group">
              <label>Asignada a</label>
              <select v-model="formulario.usuarioAsignadoId" class="form-control">
                <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group options-group">
              <label>Opciones</label>
              <div class="options-container">
                <div class="checkbox-compact">
                  <input type="checkbox" id="notificar" v-model="formulario.notificar" />
                  <label for="notificar">Notificar 1h antes</label>
                </div>
                <div class="checkbox-compact">
                  <input type="checkbox" id="enviarCorreo" v-model="formulario.enviarCorreo" />
                  <label for="enviarCorreo">Enviar correo</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Cuarta fila: Descripción -->
          <div class="row-4">
            <div class="form-group full-width">
              <label>Descripción</label>
              <textarea 
                v-model="formulario.descripcion" 
                class="form-control"
                rows="2"
                placeholder="Descripción detallada de la tarea..."
              ></textarea>
            </div>
          </div>

          <!-- Quinta fila: Comentarios -->
          <div class="row-5">
            <div class="form-group full-width">
              <label>Comentarios</label>
              <div class="comentarios-compact">
                <div class="comentario-input">
                  <textarea 
                    v-model="nuevoComentario" 
                    class="form-control"
                    rows="2"
                    placeholder="Añadir comentario..."
                  ></textarea>
                  <div class="comentario-actions">
                    <button type="button" class="btn-attach">
                      <i class="fas fa-paperclip"></i>
                      Adjuntar
                    </button>
                    <div class="checkbox-compact">
                      <input type="checkbox" id="fijarComentario" v-model="fijarComentario" />
                      <label for="fijarComentario">Fijar</label>
                    </div>
                  </div>
                </div>
                
                <!-- Lista de comentarios existentes -->
                <div v-if="formulario.comentarios && formulario.comentarios.length > 0" class="comentarios-lista">
                  <div v-for="(comentario, index) in formulario.comentarios" :key="index" class="comentario-item">
                    <div class="comentario-header">
                      <span class="comentario-autor">{{ comentario.autor }}</span>
                      <span class="comentario-fecha">{{ formatDate(comentario.fecha) }}</span>
                      <button type="button" class="btn-star" @click="toggleFijarComentario(index)">
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
        
        if (this.tarea.clienteRelacionadoId && this.tarea.clienteRelacionadoNombre) {
          this.formulario.clienteRelacionadoId = this.tarea.clienteRelacionadoId
          this.busquedaCliente = this.tarea.clienteRelacionadoNombre
          this.clientesFiltrados = [{ id: this.tarea.clienteRelacionadoId, nombre: this.tarea.clienteRelacionadoNombre }]
        }
        if (!this.formulario.tipo) {
          this.formulario.tipo = 'Seguimiento'
        }
      } else {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        this.formulario.usuarioAsignadoId = usuario.id ? parseInt(usuario.id) : null
        
        const estadoPendiente = this.estados.find(e => e.nombre === 'PENDIENTE')
        this.formulario.estadoId = estadoPendiente ? estadoPendiente.id : null
        
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
        const base = `${process.env.VUE_APP_API_URL || 'http://localhost:8986'}`
        const params = new URLSearchParams({ q: this.busquedaCliente, page: '0', size: '10' })
        const responseClientes = await fetch(`${base}/api/clientes/buscar?${params.toString()}`)
        if (responseClientes.ok) {
          const clientes = await responseClientes.json()
          this.clientesFiltrados = Array.isArray(clientes?.content) ? clientes.content : []
        } else {
          this.clientesFiltrados = []
        }

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
      if (!event.target.closest('.cliente-field')) {
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
      if (this.fechaInicio) {
        const fechaIni = new Date(this.fechaInicio + 'T' + this.horaInicio)
        this.formulario.fechaInicio = fechaIni.toISOString()
      }
      
      if (this.fechaVencimiento) {
        const fecha = new Date(this.fechaVencimiento + 'T' + this.horaVencimiento)
        this.formulario.fechaVencimiento = fecha.toISOString()
      }

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
/* Overlay y contenedor principal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 10px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
  border-radius: 10px 10px 0 0;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px 20px;
}

/* Formulario compacto con filas */
.form-compact {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Filas del formulario */
.row-1, .row-2, .row-3 {
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  gap: 12px;
  align-items: start;
}

.row-2 {
  grid-template-columns: repeat(4, 1fr);
}

.row-3 {
  grid-template-columns: 1.5fr 2fr;
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
  gap: 4px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
}

.required {
  color: #dc3545;
}

/* Controles de formulario */
.form-control {
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
  background: white;
  height: 32px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

textarea.form-control {
  resize: vertical;
  height: auto;
  min-height: 60px;
}

/* Input con botón */
.input-with-button {
  position: relative;
  display: flex;
  gap: 4px;
}

.input-with-button .form-control {
  flex: 1;
}

.btn-icon {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.btn-icon:hover {
  background: #e6c200;
  transform: translateY(-1px);
}

/* Fechas compactas */
.datetime-compact {
  display: flex;
  gap: 4px;
}

.date-input {
  flex: 2;
}

.time-input {
  flex: 1;
  min-width: 70px;
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
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: rgb(252, 215, 0);
}

.checkbox-compact label {
  margin: 0;
  cursor: pointer;
  font-size: 0.75rem;
  color: #495057;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
}

/* Dropdown de clientes */
.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 2px;
}

.dropdown-section {
  padding: 4px 0;
}

.dropdown-header {
  padding: 4px 8px;
  font-size: 0.6rem;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.dropdown-item {
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
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
  color: #2c3e50;
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

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 0 0 10px 10px;
}

.btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.8rem;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content { 
    max-width: 95vw; 
  }
  .row-1, .row-2, .row-3 {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .row-2 {
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