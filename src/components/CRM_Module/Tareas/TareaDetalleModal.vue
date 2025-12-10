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
                  <i :class="getEstadoIcon(tarea.estadoId)"></i>
                  {{ formatearEstadoNombre(tarea.estadoNombre) }}
                </span>
              </div>

              <div class="cambiar-estado">
                <label for="nuevoEstado">Cambiar estado</label>
                <select 
                  id="nuevoEstado"
                  v-model="estadoSeleccionado" 
                  class="form-control"
                  @change="onEstadoChange"
                >
                  <option v-for="estado in estados" :key="estado.id" :value="estado.id">
                    {{ formatearEstadoNombre(estado.nombre) }}
                  </option>
                </select>

                <!-- Campo de motivo para bloqueo -->
                <div v-if="esEstadoBloqueado" class="campo-motivo">
                  <label for="motivoBloqueo">Motivo del bloqueo <span class="required">*</span></label>
                  <textarea 
                    id="motivoBloqueo"
                    v-model="motivoBloqueo"
                    class="form-control"
                    placeholder="Describe el motivo por el cual se bloquea esta tarea..."
                    rows="3"
                  ></textarea>
                </div>

                <!-- Botón para aplicar el cambio -->
                <button 
                  class="btn btn-aplicar-cambio" 
                  @click="aplicarCambioEstado"
                  :disabled="!puedeAplicarCambio"
                >
                  <i class="fas fa-exchange-alt"></i>
                  Aplicar cambio
                </button>
              </div>
            </div>

            <!-- Botón de completar rápido -->
            <div class="accion-rapida" v-if="!tarea.estadoFinal">
              <button class="btn btn-completar-rapido" @click="mostrarConfirmacionCompletacion = true">
                <i class="fas fa-check-circle"></i>
                <span>Marcar como Completada</span>
              </button>
            </div>

            <!-- Modal de confirmación de completación -->
            <div v-if="mostrarConfirmacionCompletacion" class="modal-overlay-confirmacion" @click.self="cerrarConfirmacion">
              <div class="modal-confirmacion-completar">
                <div class="modal-header-confirmacion">
                  <h3>
                    <i class="fas fa-check-double"></i>
                    Confirmar Finalización de Tarea
                  </h3>
                  <button class="btn-close" @click="cerrarConfirmacion">&times;</button>
                </div>
                <div class="modal-body-confirmacion">
                  <p class="titulo-tarea"><strong>{{ tarea.titulo }}</strong></p>
                  <p class="aviso-importante">
                    <i class="fas fa-exclamation-triangle"></i>
                    Esta acción marcará la tarea como completada. Por favor, confirma con un comentario.
                  </p>
                  <div class="form-group-confirmacion">
                    <label for="comentario-completacion">
                      <i class="fas fa-comment"></i>
                      Comentario de Finalización <span class="required">*</span>
                    </label>
                    <textarea 
                      id="comentario-completacion"
                      v-model="comentarioCompletacion"
                      class="textarea-confirmacion"
                      placeholder="Describe el resultado de la tarea, acciones realizadas, etc."
                      rows="4"
                    ></textarea>
                    <p v-if="comentarioCompletacion.length === 0" class="contador-caracteres aviso">
                      Se requiere al menos un comentario
                    </p>
                    <p v-else class="contador-caracteres">
                      {{ comentarioCompletacion.length }} caracteres
                    </p>
                  </div>
                </div>
                <div class="modal-footer-confirmacion">
                  <button class="btn btn-cancelar" @click="cerrarConfirmacion">
                    <i class="fas fa-times"></i>
                    Cancelar
                  </button>
                  <button 
                    class="btn btn-confirmar-completar" 
                    @click="completarConComentario"
                    :disabled="comentarioCompletacion.trim().length === 0 || completandoTarea"
                  >
                    <i :class="completandoTarea ? 'fas fa-spinner fa-spin' : 'fas fa-check-circle'"></i>
                    {{ completandoTarea ? 'Procesando...' : 'Confirmar Finalización' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Botón de Auditoría -->
            <div class="accion-auditoria">
              <button class="btn btn-auditoria" @click="abrirAuditoria">
                <i class="fas fa-history"></i>
                Ver Auditoría
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

    <!-- Modal de Auditoría -->
    <TareaAuditoriaModal
      v-if="mostrarAuditoria"
      :value="mostrarAuditoria"
      :tareaId="tarea.id"
      @cerrar="mostrarAuditoria = false"
    />
  </div>
</template>

<script>
import TareaAuditoriaModal from './TareaAuditoriaModal.vue'

export default {
  name: 'TareaDetalleModal',
  components: {
    TareaAuditoriaModal
  },
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
      estadoSeleccionado: null,
      motivoBloqueo: '',
      esEstadoBloqueado: false,
      mostrarAuditoria: false,
      mostrarConfirmacionCompletacion: false,
      comentarioCompletacion: '',
      completandoTarea: false
    }
  },
  computed: {
    puedeAplicarCambio() {
      if (!this.estadoSeleccionado || this.estadoSeleccionado === this.tarea.estadoId) {
        return false
      }
      if (this.esEstadoBloqueado) {
        return this.motivoBloqueo.trim().length > 0
      }
      return true
    }
  },
  watch: {
    value(val) {
      if (val && this.tarea) {
        // Preseleccionar el estado actual cuando se abre el modal
        this.estadoSeleccionado = this.tarea.estadoId
        // Resetear campos de bloqueo
        this.motivoBloqueo = ''
        this.esEstadoBloqueado = false
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
    onEstadoChange() {
      const estado = this.estados.find(e => e.id === this.estadoSeleccionado)
      this.esEstadoBloqueado = estado && estado.nombre && estado.nombre.toLowerCase().includes('bloqueada')
      if (!this.esEstadoBloqueado) {
        this.motivoBloqueo = ''
      }
    },

    async aplicarCambioEstado() {
      if (!this.estadoSeleccionado || this.estadoSeleccionado === this.tarea.estadoId) {
        return
      }

      try {
        this.$emit('cambiar-estado', this.tarea.id, this.estadoSeleccionado, this.motivoBloqueo)
      } catch (error) {
        console.error('Error cambiando estado:', error)
        // Revertir la selección en caso de error
        this.estadoSeleccionado = this.tarea.estadoId
        this.esEstadoBloqueado = false
        this.motivoBloqueo = ''
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

    async completarConComentario() {
      if (!this.comentarioCompletacion.trim()) {
        console.warn('Se requiere un comentario para completar')
        return
      }

      const estadoCompletado = this.estados.find(e => e.estadoFinal === true)
      if (!estadoCompletado) {
        console.error('No se encontró estado de finalización')
        return
      }

      this.completandoTarea = true
      try {
        // Crear comentario sin mutar el prop
        const nuevoComentario = {
          contenido: this.comentarioCompletacion,
          fijado: false,
          esComentarioCompletacion: true
        }
        
        // Emitir evento para agregar comentario y cambiar estado
        this.$emit('completar-con-comentario', {
          tareaId: this.tarea.id,
          estadoId: estadoCompletado.id,
          comentario: nuevoComentario
        })
        
        // Cerrar modal
        setTimeout(() => {
          this.cerrarConfirmacion()
        }, 500)
      } catch (error) {
        console.error('Error completando tarea:', error)
      } finally {
        this.completandoTarea = false
      }
    },

    cerrarConfirmacion() {
      this.mostrarConfirmacionCompletacion = false
      this.comentarioCompletacion = ''
      this.completandoTarea = false
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
      // Resetear campos de cambio de estado
      this.estadoSeleccionado = this.tarea ? this.tarea.estadoId : null
      this.motivoBloqueo = ''
      this.esEstadoBloqueado = false
      this.mostrarAuditoria = false
      this.$emit('cerrar')
    },

    abrirAuditoria() {
      this.mostrarAuditoria = true
    },

    formatearDuracionCorta(segundos) {
      if (!segundos || segundos <= 0) return '0s'
      
      const dias = Math.floor(segundos / 86400)
      const horas = Math.floor((segundos % 86400) / 3600)
      const minutos = Math.floor((segundos % 3600) / 60)
      const segs = segundos % 60
      
      const partes = []
      if (dias > 0) partes.push(`${dias}d`)
      if (horas > 0) partes.push(`${horas}h`)
      if (minutos > 0) partes.push(`${minutos}m`)
      if (segs > 0 && dias === 0) partes.push(`${segs}s`)
      
      return partes.slice(0, 2).join(' ') || '0s'
    },

    getEstadoIcon(estadoId) {
      const estado = this.estados.find(e => e.id === estadoId)
      if (!estado) return 'fas fa-circle'
      
      if (estado.esBloqueo) return 'fas fa-lock'
      if (estado.cuentaTiempo) return 'fas fa-play'
      if (estado.estadoFinal) return 'fas fa-check-circle'
      
      const nombre = (estado.nombre || '').toLowerCase()
      if (nombre.includes('pendiente')) return 'fas fa-clock'
      if (nombre.includes('progreso')) return 'fas fa-spinner fa-spin'
      
      return 'fas fa-circle'
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
  height: 75%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
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
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  width: fit-content;
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  text-shadow: 0 1px 1px rgba(0,0,0,0.15);
}

.estado-badge-large i {
  font-size: 0.85rem;
}

.cambiar-estado {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo-motivo {
  margin-top: 8px;
}

.campo-motivo label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.campo-motivo textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-aplicar-cambio {
  margin-top: 8px;
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.btn-aplicar-cambio:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-aplicar-cambio:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.required {
  color: #dc3545;
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

.accion-auditoria {
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.btn-auditoria {
  width: 100%;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
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

.btn-auditoria:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(23, 162, 184, 0.3);
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

/* Modal de confirmación de completación */
.modal-overlay-confirmacion {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-confirmacion-completar {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header-confirmacion {
  padding: 24px;
  border-bottom: 2px solid #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
}

.modal-header-confirmacion h3 {
  margin: 0;
  color: white;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header-confirmacion i {
  font-size: 1.5rem;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-body-confirmacion {
  padding: 24px;
}

.titulo-tarea {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  border-radius: 4px;
}

.aviso-importante {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #856404;
  font-size: 0.9rem;
}

.aviso-importante i {
  flex-shrink: 0;
  margin-top: 2px;
}

.form-group-confirmacion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group-confirmacion label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group-confirmacion label .required {
  color: #e74c3c;
}

.textarea-confirmacion {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.9rem;
  resize: vertical;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.textarea-confirmacion:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.contador-caracteres {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.contador-caracteres.aviso {
  color: #e74c3c;
  font-weight: 500;
}

.modal-footer-confirmacion {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn-cancelar {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-cancelar:hover {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-confirmar-completar {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.btn-confirmar-completar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
}

.btn-confirmar-completar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-confirmar-completar i {
  font-size: 1rem;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>