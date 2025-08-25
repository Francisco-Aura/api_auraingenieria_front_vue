<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content" @click.stop>
      <!-- Header del modal -->
      <div class="modal-header">
        <div class="title-content">
          <h2 class="modal-title">{{ tarea.titulo }}</h2>
          <div class="title-chips">
            <span class="badge" :class="getEstadoClass(tarea.estadoColor)">
              {{ formatearEstadoNombre(tarea.estadoNombre) }}
            </span>
            <span class="badge" :class="getPrioridadClass(tarea.prioridad)">
              {{ tarea.prioridadTexto }}
            </span>
          </div>
        </div>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Contenido del modal -->
      <div class="modal-body">
        <!-- Tabs -->
        <div class="tabs">
          <button 
            class="tab-btn" 
            :class="{ active: tabActiva === 0 }"
            @click="tabActiva = 0"
          >
            <i class="fas fa-info-circle"></i>
            Información
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: tabActiva === 1 }"
            @click="tabActiva = 1"
          >
            <i class="fas fa-comments"></i>
            Comentarios
            <span v-if="comentarios.length > 0" class="badge-count">{{ comentarios.length }}</span>
          </button>
        </div>

        <!-- Contenido de las tabs -->
        <div class="tab-content">
          <!-- Tab de Información -->
          <div v-show="tabActiva === 0" class="tab-panel">
            <div class="content-grid">
              <div class="content-main">
                <!-- Descripción -->
                <div class="section">
                  <h3 class="section-title">
                    <i class="fas fa-align-left"></i>
                    Descripción
                  </h3>
                  <p class="descripcion">
                    {{ tarea.descripcion || 'Sin descripción' }}
                  </p>
                </div>

                <!-- Metadatos -->
                <div class="section">
                  <h3 class="section-title">
                    <i class="fas fa-list"></i>
                    Detalles
                  </h3>
                  <div class="details-grid">
                    <div class="detail-item">
                      <strong>Usuario asignado:</strong>
                      <span>{{ tarea.usuarioAsignadoNombre }}</span>
                    </div>
                    <div class="detail-item">
                      <strong>Creado por:</strong>
                      <span>{{ tarea.usuarioCreadorNombre }}</span>
                    </div>
                    <div class="detail-item">
                      <strong>Fecha de creación:</strong>
                      <span>{{ formatearFecha(tarea.fechaCreacion) }}</span>
                    </div>
                    <div class="detail-item" v-if="tarea.fechaInicio">
                      <strong>Fecha de inicio:</strong>
                      <span>{{ formatearFecha(tarea.fechaInicio) }}</span>
                    </div>
                    <div class="detail-item" v-if="tarea.fechaVencimiento">
                      <strong>Fecha de vencimiento:</strong>
                      <span>{{ formatearFecha(tarea.fechaVencimiento) }}</span>
                    </div>
                    <div class="detail-item" v-if="tarea.tiempoEstimado">
                      <strong>Tiempo estimado:</strong>
                      <span>{{ formatearTiempo(tarea.tiempoEstimado) }}</span>
                    </div>
                    <div class="detail-item" v-if="tarea.fechaCompletada">
                      <strong>Fecha de completado:</strong>
                      <span>{{ formatearFecha(tarea.fechaCompletada) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Relaciones -->
                <div class="section" v-if="tarea.clienteRelacionadoNombre">
                  <h3 class="section-title">
                    <i class="fas fa-link"></i>
                    Relaciones
                  </h3>
                  <div class="detail-item">
                    <strong>Cliente:</strong>
                    <span>{{ tarea.clienteRelacionadoNombre }}</span>
                  </div>
                  <div class="detail-item" v-if="tarea.puntoSuministroRelacionadoCUPS">
                    <strong>CUPS:</strong>
                    <span>{{ tarea.puntoSuministroRelacionadoCUPS }}</span>
                  </div>
                </div>

                <!-- Etiquetas -->
                <div class="section" v-if="tarea.etiquetas">
                  <h3 class="section-title">
                    <i class="fas fa-tags"></i>
                    Etiquetas
                  </h3>
                  <div class="etiquetas">
                    <span 
                      v-for="etiqueta in obtenerEtiquetas(tarea.etiquetas)"
                      :key="etiqueta"
                      class="etiqueta"
                    >
                      {{ etiqueta }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="content-sidebar">
                <!-- Acciones rápidas -->
                <div class="section">
                  <h3 class="section-title">
                    <i class="fas fa-cogs"></i>
                    Acciones
                  </h3>
                  <div class="actions">
                    <button class="btn btn-outline btn-block" @click="$emit('actualizar', tarea)">
                      <i class="fas fa-edit"></i>
                      Editar Tarea
                    </button>
                    
                    <div class="form-group">
                      <label for="nuevoEstado">Cambiar estado</label>
                      <select 
                        id="nuevoEstado"
                        v-model="nuevoEstado" 
                        class="form-control"
                        @change="cambiarEstado"
                      >
                        <option v-for="estado in estados" :key="estado.id" :value="estado.id">
                          {{ formatearEstadoNombre(estado.nombre) }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Progreso -->
                <div class="section" v-if="mostrarProgreso">
                  <h3 class="section-title">
                    <i class="fas fa-chart-line"></i>
                    Progreso
                  </h3>
                  <div class="progreso">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: porcentajeProgreso + '%', backgroundColor: tarea.estadoColor || 'rgb(252, 215, 0)' }"
                      ></div>
                    </div>
                    <p class="progress-text">{{ porcentajeProgreso }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab de Comentarios -->
          <div v-show="tabActiva === 1" class="tab-panel">
            <div class="comentarios-container">
              <!-- Lista de comentarios -->
              <div class="comentarios-lista">
                <div v-if="comentarios.length === 0" class="sin-comentarios">
                  <i class="fas fa-comment fa-3x"></i>
                  <p>No hay comentarios aún</p>
                </div>
                
                <div
                  v-for="comentario in comentarios"
                  :key="comentario.id"
                  class="comentario-item"
                >
                  <div class="comentario-header">
                    <div class="comentario-autor">
                      <div class="avatar">
                        {{ comentario.usuarioNombre?.charAt(0).toUpperCase() }}
                      </div>
                      <div class="autor-info">
                        <strong>{{ comentario.usuarioNombre }}</strong>
                        <small>{{ formatearFecha(comentario.fechaCreacion) }}</small>
                      </div>
                    </div>
                    <div class="comentario-acciones" v-if="puedeEditarComentario(comentario)">
                      <button class="btn-icon" @click="editarComentario(comentario)">
                        <i class="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                  <div class="comentario-contenido">
                    <p>{{ comentario.comentario }}</p>
                    <small v-if="comentario.editado" class="editado">
                      (Editado el {{ formatearFecha(comentario.fechaEdicion) }})
                    </small>
                  </div>
                </div>
              </div>

              <!-- Nuevo comentario -->
              <div class="nuevo-comentario">
                <div class="form-group">
                  <label for="nuevoComentario">Agregar comentario</label>
                  <textarea 
                    id="nuevoComentario"
                    v-model="nuevoComentario" 
                    class="form-control"
                    rows="3"
                    maxlength="1000"
                    placeholder="Escribe tu comentario..."
                  ></textarea>
                  <div class="input-counter">{{ nuevoComentario.length }}/1000</div>
                </div>
                <div class="comentario-acciones-footer">
                  <button
                    class="btn btn-primary"
                    :disabled="!nuevoComentario.trim()"
                    :class="{ 'loading': guardandoComentario }"
                    @click="agregarComentario"
                  >
                    <i class="fas fa-paper-plane"></i>
                    Comentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrar">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'TareaDetalleModal',
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
    }
  },
  data() {
    return {
      tabActiva: 0,
      comentarios: [],
      nuevoComentario: '',
      guardandoComentario: false,
      nuevoEstado: null,
      cargandoComentarios: false
    }
  },
  computed: {
    mostrarProgreso() {
      return this.estados.length > 0
    },
    
    porcentajeProgreso() {
      if (!this.tarea || this.estados.length === 0) return 0
      
      const estadoActual = this.estados.find(e => e.id === this.tarea.estadoId)
      if (!estadoActual) return 0
      
      // Si la tarea está completada, mostrar 100%
      if (this.tarea.estadoFinal) return 100
      
      const totalEstados = this.estados.filter(e => !e.estadoFinal).length
      const posicionActual = estadoActual.orden || 1
      
      return Math.round((posicionActual / totalEstados) * 100)
    }
  },
  watch: {
    value(newVal) {
      if (newVal && this.tarea) {
        this.inicializar()
      }
    },
    
    tarea: {
      handler() {
        if (this.value && this.tarea) {
          this.inicializar()
        }
      },
      deep: true
    }
  },
  methods: {
    async inicializar() {
      if (!this.tarea) return
      
      this.nuevoEstado = this.tarea.estadoId
      await this.cargarComentarios()
    },
    
    async cargarComentarios() {
      if (!this.tarea?.id) return
      
      try {
        this.cargandoComentarios = true
        this.comentarios = await tareasApi.obtenerComentariosPorTarea(this.tarea.id)
      } catch (error) {
        console.error('Error cargando comentarios:', error)
      } finally {
        this.cargandoComentarios = false
      }
    },
    
    async agregarComentario() {
      if (!this.nuevoComentario.trim()) return
      
      try {
        this.guardandoComentario = true
        
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        const comentario = {
          tareaId: this.tarea.id,
          usuarioId: parseInt(usuario.id),
          comentario: this.nuevoComentario.trim()
        }
        
        await tareasApi.crearComentario(comentario)
        this.nuevoComentario = ''
        await this.cargarComentarios()
      } catch (error) {
        console.error('Error agregando comentario:', error)
      } finally {
        this.guardandoComentario = false
      }
    },
    
    async cambiarEstado() {
      if (this.nuevoEstado === this.tarea.estadoId) return
      try {
        this.$emit('cambiar-estado', this.tarea.id, this.nuevoEstado)
      } catch (error) {
        console.error('Error cambiando estado:', error)
      }
    },
    
    puedeEditarComentario(comentario) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return comentario.usuarioId === parseInt(usuario.id)
    },
    
    editarComentario(comentario) {
      // Implementar edición de comentarios
      console.log('Editar comentario:', comentario)
    },
    
    getEstadoClass(color) {
      return `badge-${color || 'primary'}`
    },
    
    getPrioridadClass(prioridad) {
      switch (prioridad) {
        case 1: return 'badge-danger'
        case 2: return 'badge-warning'
        case 3: return 'badge-success'
        default: return 'badge-primary'
      }
    },
    
    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    formatearTiempo(minutos) {
      if (!minutos) return ''
      if (minutos < 60) {
        return `${minutos} minutos`
      }
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      return mins > 0 ? `${horas}h ${mins}min` : `${horas} horas`
    },
    
    obtenerEtiquetas(etiquetas) {
      if (!etiquetas) return []
      return etiquetas.split(',').map(e => e.trim()).filter(e => e.length > 0)
    },
    
    formatearEstadoNombre(nombre) {
      if (!nombre) return ''
      return nombre.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase())
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
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 1400px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* Header del modal */
.modal-header {
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
  color: #2c3e50;
  padding: 24px 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.title-content {
  flex: 1;
}

.modal-title {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: #2c3e50;
}

.title-chips {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.close-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: #2c3e50;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Body del modal */
.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Tabs */
.tabs {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 16px 24px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
}

.tab-btn:hover {
  background-color: rgba(252, 215, 0, 0.1);
  color: #2c3e50;
}

.tab-btn.active {
  border-bottom-color: rgb(252, 215, 0);
  background-color: white;
  color: #2c3e50;
}

.badge-count {
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

/* Tab content */
.tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  overflow-y: auto;
  padding: 24px 28px;
}

/* Content grid */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.content-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Sections */
.section {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title i {
  color: rgb(252, 215, 0);
}

.descripcion {
  color: #495057;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.95rem;
}

/* Details grid */
.details-grid {
  display: grid;
  gap: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #2c3e50;
  font-weight: 600;
  min-width: 160px;
}

.detail-item span {
  color: #495057;
  text-align: right;
  font-weight: 500;
}

/* Etiquetas */
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.etiqueta {
  background-color: rgba(252, 215, 0, 0.2);
  color: #2c3e50;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Actions */
.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-block {
  width: 100%;
  justify-content: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background-color: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 3px rgba(252, 215, 0, 0.1);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.input-counter {
  text-align: right;
  font-size: 0.8rem;
  color: #6c757d;
}

/* Progress */
.progreso {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  font-size: 1.1rem;
}

/* Comentarios */
.comentarios-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comentarios-lista {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 24px;
}

.sin-comentarios {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.sin-comentarios i {
  margin-bottom: 16px;
  opacity: 0.5;
  color: rgb(252, 215, 0);
}

.comentario-item {
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.comentario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comentario-autor {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.autor-info {
  display: flex;
  flex-direction: column;
}

.autor-info strong {
  color: #2c3e50;
  font-size: 0.95rem;
  font-weight: 600;
}

.autor-info small {
  color: #6c757d;
  font-size: 0.8rem;
}

.comentario-contenido {
  color: #495057;
  line-height: 1.6;
}

.comentario-contenido p {
  margin: 0 0 8px 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

.editado {
  color: #6c757d;
  font-style: italic;
  font-size: 0.8rem;
}

.nuevo-comentario {
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
}

.comentario-acciones-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-primary {
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-warning {
  background-color: #ffc107;
  color: #212529;
}

.badge-danger {
  background-color: #dc3545;
  color: white;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-primary:hover:not(:disabled) {
  background-color: #e6c200;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  border: 2px solid rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-outline:hover:not(:disabled) {
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-icon {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background-color: rgba(252, 215, 0, 0.1);
  color: #2c3e50;
}

.loading {
  position: relative;
  pointer-events: none;
}

.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Footer del modal */
.modal-footer {
  padding: 24px 32px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content { max-width: 96vw; max-height: 96vh; }
  .tab-panel { padding: 16px; }
  .content-grid { grid-template-columns: 1fr; gap: 16px; }
}
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 20px;
  }
  
  .title-chips {
    width: 100%;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
    padding: 12px 20px;
  }
  
  .tab-panel {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 20px;
  }
}
</style>