<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content" @click.stop>
      <!-- Header compacto -->
      <div class="modal-header">
        <div class="header-main">
          <h2 class="modal-title">{{ tarea.titulo }}</h2>
          <div class="header-badges">
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

      <!-- Body compacto -->
      <div class="modal-body">
        <!-- Tabs compactas -->
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

        <!-- Contenido de tabs -->
        <div class="tab-content">
          <!-- Tab de Información -->
          <div v-show="tabActiva === 0" class="tab-panel">
            <div class="info-layout">
              <!-- Primera fila: Acciones principales -->
              <div class="actions-row">
                <button class="btn-action btn-edit" @click="$emit('actualizar', tarea)">
                  <i class="fas fa-edit"></i>
                  Editar
                </button>
                
                <div class="estado-selector">
                  <label>Estado</label>
                  <select 
                    v-model="nuevoEstado" 
                    class="form-control-compact"
                    @change="cambiarEstado"
                  >
                    <option v-for="estado in estados" :key="estado.id" :value="estado.id">
                      {{ formatearEstadoNombre(estado.nombre) }}
                    </option>
                  </select>
                </div>
                
                <!-- Progreso compacto -->
                <div class="progress-compact" v-if="mostrarProgreso">
                  <label>Progreso</label>
                  <div class="progress-wrapper">
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: porcentajeProgreso + '%', backgroundColor: tarea.estadoColor || 'rgb(252, 215, 0)' }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ porcentajeProgreso }}%</span>
                  </div>
                </div>
              </div>

              <!-- Segunda fila: Información principal en grid -->
              <div class="info-grid">
                <!-- Descripción -->
                <div class="info-section description-section">
                  <h3 class="section-title">
                    <i class="fas fa-align-left"></i>
                    Descripción
                  </h3>
                  <p class="descripcion">
                    {{ tarea.descripcion || 'Sin descripción' }}
                  </p>
                </div>

                <!-- Detalles en grid compacto -->
                <div class="info-section details-section">
                  <h3 class="section-title">
                    <i class="fas fa-list"></i>
                    Detalles
                  </h3>
                  <div class="details-compact">
                    <div class="detail-row">
                      <div class="detail-item">
                        <strong>Asignado:</strong>
                        <span>{{ tarea.usuarioAsignadoNombre }}</span>
                      </div>
                      <div class="detail-item">
                        <strong>Creado por:</strong>
                        <span>{{ tarea.usuarioCreadorNombre }}</span>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <strong>F. Creación:</strong>
                        <span>{{ formatearFecha(tarea.fechaCreacion) }}</span>
                      </div>
                      <div class="detail-item" v-if="tarea.fechaInicio">
                        <strong>F. Inicio:</strong>
                        <span>{{ formatearFecha(tarea.fechaInicio) }}</span>
                      </div>
                    </div>
                    <div class="detail-row" v-if="tarea.fechaVencimiento || tarea.tiempoEstimado">
                      <div class="detail-item" v-if="tarea.fechaVencimiento">
                        <strong>F. Vencimiento:</strong>
                        <span>{{ formatearFecha(tarea.fechaVencimiento) }}</span>
                      </div>
                      <div class="detail-item" v-if="tarea.tiempoEstimado">
                        <strong>Tiempo estimado:</strong>
                        <span>{{ formatearTiempo(tarea.tiempoEstimado) }}</span>
                      </div>
                    </div>
                    <div class="detail-row" v-if="tarea.fechaCompletada">
                      <div class="detail-item">
                        <strong>F. Completado:</strong>
                        <span>{{ formatearFecha(tarea.fechaCompletada) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tercera fila: Relaciones y Etiquetas -->
              <div class="bottom-row" v-if="tarea.clienteRelacionadoNombre || tarea.etiquetas">
                <!-- Relaciones -->
                <div class="info-section relations-section" v-if="tarea.clienteRelacionadoNombre">
                  <h3 class="section-title">
                    <i class="fas fa-link"></i>
                    Relaciones
                  </h3>
                  <div class="relations-compact">
                    <div class="detail-item">
                      <strong>Cliente:</strong>
                      <span>{{ tarea.clienteRelacionadoNombre }}</span>
                    </div>
                    <div class="detail-item" v-if="tarea.puntoSuministroRelacionadoCUPS">
                      <strong>CUPS:</strong>
                      <span>{{ tarea.puntoSuministroRelacionadoCUPS }}</span>
                    </div>
                  </div>
                </div>

                <!-- Etiquetas -->
                <div class="info-section tags-section" v-if="tarea.etiquetas">
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
            </div>
          </div>

          <!-- Tab de Comentarios -->
          <div v-show="tabActiva === 1" class="tab-panel">
            <div class="comentarios-container">
              <!-- Lista compacta de comentarios -->
              <div class="comentarios-lista">
                <div v-if="comentarios.length === 0" class="sin-comentarios">
                  <i class="fas fa-comment fa-2x"></i>
                  <p>No hay comentarios</p>
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

              <!-- Nuevo comentario compacto -->
              <div class="nuevo-comentario">
                <textarea 
                  v-model="nuevoComentario" 
                  class="form-control-textarea"
                  rows="2"
                  maxlength="1000"
                  placeholder="Escribir comentario..."
                ></textarea>
                <div class="comentario-footer">
                  <div class="input-counter">{{ nuevoComentario.length }}/1000</div>
                  <button
                    class="btn-comentar"
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

      <!-- Footer compacto -->
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
      
      // Precargar el estado actual
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
        return `${minutos} min`
      }
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
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
/* Modal base */
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
  padding: 12px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
  width: 100%;
  max-width: 1100px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

/* Header compacto */
.modal-header {
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
  color: #2c3e50;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.header-main {
  flex: 1;
}

.modal-title {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
  color: #2c3e50;
}

.header-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.close-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  color: #2c3e50;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Body */
.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Tabs compactas */
.tabs {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.9rem;
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
  padding: 2px 5px;
  border-radius: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  min-width: 14px;
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
  padding: 12px 16px;
}

/* Layout de información compacto */
.info-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Fila de acciones */
.actions-row {
  display: grid;
  grid-template-columns: auto 200px 1fr;
  gap: 12px;
  align-items: end;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.btn-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  height: 32px;
}

.btn-edit {
  background: rgb(252, 215, 0);
  color: #2c3e50;
}

.btn-edit:hover {
  background: #e6c200;
  transform: translateY(-1px);
}

.estado-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.estado-selector label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.form-control-compact {
  padding: 4px 6px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
  height: 28px;
  background: white;
}

.form-control-compact:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

.progress-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-compact label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.7rem;
  min-width: 30px;
}

/* Grid de información */
.info-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

.info-section {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: uppercase;
}

.section-title i {
  color: rgb(252, 215, 0);
}

.descripcion {
  color: #495057;
  line-height: 1.4;
  margin: 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
}

/* Detalles compactos */
.details-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-item span {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Fila inferior */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.relations-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.etiqueta {
  background-color: rgba(252, 215, 0, 0.2);
  color: #2c3e50;
  padding: 3px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 500;
}

/* Comentarios compactos */
.comentarios-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comentarios-lista {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
}

.sin-comentarios {
  text-align: center;
  padding: 30px 16px;
  color: #6c757d;
}

.sin-comentarios i {
  margin-bottom: 8px;
  opacity: 0.5;
  color: rgb(252, 215, 0);
}

.comentario-item {
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.comentario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comentario-autor {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar {
  width: 28px;
  height: 28px;
  background-color: rgb(252, 215, 0);
  color: #2c3e50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.7rem;
}

.autor-info strong {
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
}

.autor-info small {
  color: #6c757d;
  font-size: 0.65rem;
}

.comentario-contenido p {
  margin: 0 0 4px 0;
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: #495057;
  line-height: 1.4;
}

.editado {
  color: #6c757d;
  font-style: italic;
  font-size: 0.65rem;
}

/* Nuevo comentario */
.nuevo-comentario {
  border-top: 1px solid #e9ecef;
  padding-top: 12px;
}

.form-control-textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 50px;
  margin-bottom: 6px;
}

.form-control-textarea:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.1);
}

.comentario-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-counter {
  font-size: 0.65rem;
  color: #6c757d;
}

.btn-comentar {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 26px;
}

.btn-comentar:hover:not(:disabled) {
  background: #e6c200;
  transform: translateY(-1px);
}

.btn-comentar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
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
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
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
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;
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
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  right: 6px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Footer del modal */
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1024px) {
  .modal-content { max-width: 96vw; max-height: 96vh; }
  .tab-panel { padding: 12px; }
  .content-grid { grid-template-columns: 1fr; gap: 12px; }
}
@media (max-width: 768px) {
  .modal-overlay {
    padding: 12px;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px;
  }
  
  .title-chips {
    width: 100%;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    justify-content: flex-start;
    padding: 10px 16px;
  }
  
  .tab-panel {
    padding: 16px;
  }
  
  .modal-footer {
    padding: 16px;
  }
}
</style>