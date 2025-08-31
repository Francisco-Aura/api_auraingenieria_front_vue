<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content modal-detalle" @click.stop>
      <!-- Header del modal -->
      <div class="modal-header">
        <div class="header-info">
          <h2 class="modal-title">
            <i class="fas fa-info-circle"></i>
            Detalle de Tarea
          </h2>
          <span class="tarea-id">#{{ tarea.id }}</span>
        </div>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body del modal -->
      <div class="modal-body">
        <div class="detalle-grid">
          <!-- Información principal -->
          <div class="info-section">
            <div class="campo-detalle">
              <label>Título</label>
              <div class="valor-campo">{{ tarea.titulo }}</div>
            </div>

            <div class="campo-detalle" v-if="tarea.descripcion">
              <label>Descripción</label>
              <div class="valor-campo descripcion-completa">{{ tarea.descripcion }}</div>
            </div>

            <div class="campos-row">
              <div class="campo-detalle">
                <label>Tipo</label>
                <span class="tipo-badge">{{ tarea.tipo || 'Por hacer' }}</span>
              </div>

              <div class="campo-detalle">
                <label>Prioridad</label>
                <span class="prioridad-badge" :class="`prioridad-${tarea.prioridad}`">
                  {{ getPrioridadTexto(tarea.prioridad) }}
                </span>
              </div>
            </div>

            <div class="campos-row" v-if="tarea.clienteRelacionadoNombre">
              <div class="campo-detalle">
                <label>Cliente</label>
                <div class="cliente-info">
                  <i class="fas fa-user"></i>
                  {{ tarea.clienteRelacionadoNombre }}
                </div>
              </div>
            </div>

            <div class="campos-row">
              <div class="campo-detalle">
                <label>Asignado a</label>
                <div class="usuario-info">
                  <i class="fas fa-user-circle"></i>
                  {{ tarea.usuarioAsignadoNombre }}
                </div>
              </div>

              <div class="campo-detalle">
                <label>Creado por</label>
                <div class="usuario-info">
                  <i class="fas fa-user"></i>
                  {{ tarea.usuarioCreadorNombre }}
                </div>
              </div>
            </div>

            <div class="campos-row">
              <div class="campo-detalle" v-if="tarea.fechaInicio">
                <label>Fecha de inicio</label>
                <div class="fecha-info">
                  <i class="fas fa-calendar-plus"></i>
                  {{ formatearFecha(tarea.fechaInicio) }}
                </div>
              </div>

              <div class="campo-detalle" v-if="tarea.fechaVencimiento">
                <label>Fecha de vencimiento</label>
                <div class="fecha-info" :class="{ 'fecha-vencida': tarea.vencida }">
                  <i class="fas fa-calendar-alt"></i>
                  {{ formatearFecha(tarea.fechaVencimiento) }}
                </div>
              </div>
            </div>

            <div class="campo-detalle">
              <label>Fecha de creación</label>
              <div class="fecha-info">
                <i class="fas fa-clock"></i>
                {{ formatearFecha(tarea.fechaCreacion) }}
              </div>
            </div>
          </div>

          <!-- Panel lateral de acciones -->
          <div class="acciones-section">
            <!-- Estado actual y cambio de estado -->
            <div class="estado-section">
              <div class="estado-actual">
                <label>Estado actual</label>
                <span class="estado-badge-large" :style="{ backgroundColor: tarea.estadoColor }">
                  <i class="fas fa-circle"></i>
                  {{ formatearEstadoNombre(tarea.estadoNombre) }}
                </span>
              </div>

              <div class="cambiar-estado">
                <label for="nuevoEstado">Cambiar estado</label>
                <select 
                  id="nuevoEstado"
                  v-model="estadoSeleccionado" 
                  class="form-control"
                  @change="cambiarEstado"
                >
                  <option v-for="estado in estados" :key="estado.id" :value="estado.id">
                    {{ formatearEstadoNombre(estado.nombre) }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Botón de completar rápido -->
            <div class="accion-rapida" v-if="!tarea.estadoFinal">
              <button class="btn btn-completar-rapido" @click="completarRapido">
                <i class="fas fa-check-circle"></i>
                Marcar como Completada
              </button>
            </div>

            <!-- Información adicional -->
            <div class="info-adicional">
              <div class="campo-info" v-if="tarea.etiquetas">
                <label>Etiquetas</label>
                <div class="etiquetas-container">
                  <span v-for="etiqueta in tarea.etiquetas.split(',')" :key="etiqueta.trim()" class="etiqueta-badge">
                    {{ etiqueta.trim() }}
                  </span>
                </div>
              </div>

              <div class="campo-info" v-if="tarea.tiempoEstimado">
                <label>Tiempo estimado</label>
                <div class="tiempo-info">
                  <i class="fas fa-clock"></i>
                  {{ tarea.tiempoEstimado }} minutos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <div class="footer-info">
          <span class="fecha-actualizacion">
            Última actualización: {{ formatearFecha(tarea.fechaActualizacion || tarea.fechaCreacion) }}
          </span>
        </div>
        <div class="footer-actions">
          <button type="button" class="btn btn-secondary" @click="cerrar">
            Cerrar
          </button>
          <button type="button" class="btn btn-primary" @click="editarTarea">
            <i class="fas fa-edit"></i>
            Editar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TareaDetalleModal',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    tarea: {
      type: Object,
      required: true
    },
    estados: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      estadoSeleccionado: null
    }
  },
  watch: {
    value(val) {
      if (val && this.tarea) {
        // Preseleccionar el estado actual cuando se abre el modal
        this.estadoSeleccionado = this.tarea.estadoId
      }
    },
    
    tarea: {
      handler(newTarea) {
        if (newTarea && this.value) {
          // Actualizar el estado seleccionado cuando cambia la tarea
          this.estadoSeleccionado = newTarea.estadoId
        }
      },
      immediate: true
    }
  },
  methods: {
    async cambiarEstado() {
      if (!this.estadoSeleccionado || this.estadoSeleccionado === this.tarea.estadoId) {
        return
      }

      try {
        this.$emit('cambiar-estado', this.tarea.id, this.estadoSeleccionado)
      } catch (error) {
        console.error('Error cambiando estado:', error)
        // Revertir la selección en caso de error
        this.estadoSeleccionado = this.tarea.estadoId
      }
    },

    async completarRapido() {
      const estadoCompletado = this.estados.find(e => e.estadoFinal === true)
      if (!estadoCompletado) {
        console.error('No se encontró estado de finalización')
        return
      }

      try {
        this.$emit('cambiar-estado', this.tarea.id, estadoCompletado.id)
      } catch (error) {
        console.error('Error completando tarea:', error)
      }
    },

    editarTarea() {
      this.$emit('actualizar', this.tarea)
    },

    formatearFecha(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatearEstadoNombre(nombre) {
      if (!nombre) return ''
      return nombre.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase())
    },

    getPrioridadTexto(prioridad) {
      switch (prioridad) {
        case 1: return 'Alta'
        case 2: return 'Media'
        case 3: return 'Baja'
        default: return 'Normal'
      }
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
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header del modal */
.modal-header {
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tarea-id {
  font-size: 0.8rem;
  opacity: 0.8;
  font-weight: 400;
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

/* Body del modal */
.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.detalle-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Sección de información */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.campo-detalle {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo-detalle label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.valor-campo {
  font-size: 0.95rem;
  color: #212529;
  line-height: 1.4;
}

.descripcion-completa {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  white-space: pre-wrap;
}

.campos-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tipo-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
  width: fit-content;
}

.prioridad-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  width: fit-content;
}

.prioridad-1 { background: #dc3545; color: white; }
.prioridad-2 { background: #ffc107; color: #212529; }
.prioridad-3 { background: #28a745; color: white; }

.cliente-info,
.usuario-info,
.fecha-info,
.tiempo-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #495057;
}

.fecha-info.fecha-vencida {
  color: #dc3545;
  font-weight: 600;
}

.etiquetas-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.etiqueta-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

/* Sección de acciones */
.acciones-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
}

.estado-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.estado-actual {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.estado-badge-large {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  width: fit-content;
}

.cambiar-estado {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cambiar-estado label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Botón de completar rápido */
.accion-rapida {
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.btn-completar-rapido {
  width: 100%;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-completar-rapido:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}

.info-adicional {
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.campo-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.campo-info:last-child {
  margin-bottom: 0;
}

.campo-info label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Footer del modal */
.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  font-size: 0.8rem;
  color: #6c757d;
}

.footer-actions {
  display: flex;
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
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
  }
  
  .modal-content {
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .detalle-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .campos-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-actions {
    width: 100%;
  }
  
  .btn {
    flex: 1;
    justify-content: center;
  }
}
</style>