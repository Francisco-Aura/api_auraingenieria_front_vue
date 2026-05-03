<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-content modal-detalle" @click.stop>
      <!-- Body del modal (Sin header separado) -->
      <div class="modal-body">
          <!-- Título y Descripción ARRIBA - Ancho completo -->
          <div class="titulo-descripcion-header">
          <div class="campo-detalle titulo-campo">
            <label>Título</label>
            <div class="valor-campo titulo-valor">{{ tarea.titulo }}</div>
          </div>

          <div class="campo-detalle descripcion-campo" v-if="tarea.descripcion">
            <label>Descripción</label>
            <div class="valor-campo descripcion-completa">{{ tarea.descripcion }}</div>
          </div>
        </div>

        <div class="detalle-grid">
          <!-- Información principal -->
          <div class="info-section">
            <div class="campo-detalle">
              <label>Prioridad</label>
              <span class="prioridad-badge" :class="`prioridad-${tarea.prioridad}`">
                {{ getPrioridadTexto(tarea.prioridad) }}
              </span>
            </div>

            <div class="campo-detalle" v-if="tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre">
              <label>Cliente</label>
              <div class="cliente-info">
                <i class="fas fa-user"></i>
                {{ tarea.clienteRelacionadoNombre || tarea.clientePotencialNombre }}
                <span v-if="tarea.clientePotencialNombre && !tarea.clienteRelacionadoNombre" class="potencial-tag" title="Cliente potencial (no registrado)">
                  <i class="fas fa-user-clock"></i> Potencial
                </span>
              </div>
            </div>

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

            <div class="campo-detalle">
              <label>Fecha de creación</label>
              <div class="fecha-info">
                <i class="fas fa-clock"></i>
                {{ formatearFecha(tarea.fechaCreacion) }}
              </div>
            </div>

            <!-- Información adicional (Movido desde panel derecho) -->
            <div class="info-adicional-left">
              <div class="campo-detalle" v-if="tarea.etiquetas">
                <label>Etiquetas</label>
                <div class="etiquetas-container">
                  <span v-for="etiqueta in tarea.etiquetas.split(',')" :key="etiqueta.trim()" class="etiqueta-badge">
                    {{ etiqueta.trim() }}
                  </span>
                </div>
              </div>

              <div class="campo-detalle" v-if="tarea.tiempoEstimado">
                <label>Tiempo estimado</label>
                <div class="tiempo-info">
                  <i class="fas fa-clock"></i>
                  {{ tarea.tiempoEstimado }} minutos
                </div>
              </div>
            </div>
          </div>

          <!-- Panel Derecho (Acciones y Comentarios) -->
          <div class="right-panel">
            <div class="acciones-bar">
              <!-- Actions Row: Status Badge, Change Status Selector, Buttons -->
              <div class="acciones-row-horizontal">
                <!-- Estado Actual -->
                <div class="estado-badge-compact" :style="{ backgroundColor: tarea.estadoColor }">
                  <i :class="getEstadoIcon(tarea.estadoId)"></i>
                  {{ formatearEstadoNombre(tarea.estadoNombre) }}
                </div>

                <!-- Selector de Cambio de Estado con icono animado -->
                <div class="estado-selector-container">
                  <i class="fas fa-exchange-alt icon-cambiar-estado"></i>
                  <select 
                    v-model="estadoSeleccionado" 
                    class="select-cambiar-estado"
                    @change="onEstadoChange"
                  >
                    <option :value="null" disabled>Modificar estado</option>
                    <option v-for="estado in estadosDisponibles" :key="estado.id" :value="estado.id">
                      {{ formatearEstadoNombre(estado.nombre) }}
                    </option>
                  </select>
                </div>

                <!-- Botones de Acciones -->
                <button v-if="!tarea.estadoFinal" class="btn-action-compact btn-completar-compact" @click="mostrarConfirmacionCompletacion = true" title="Marcar tarea como completada">
                  <i class="fas fa-check-circle"></i>
                  <span>Completar</span>
                </button>
                <button class="btn-action-compact btn-auditoria-compact" @click="abrirAuditoria" title="Ver historial de cambios">
                  <i class="fas fa-history"></i>
                  <span>Auditoría</span>
                </button>
              </div>

               <!-- Motivo Cambio Estado (si se selecciona un nuevo estado) -->
              <div v-if="estadoSeleccionado && estadoSeleccionado !== tarea.estadoId" class="motivo-cambio-container">
                 <textarea 
                    v-model="comentarioCambioEstado"
                    class="form-control motivo-input"
                    :placeholder="esEstadoBloqueado ? 'Motivo del bloqueo...' : 'Comentario sobre el cambio...'"
                    rows="2"
                  ></textarea>
                  <button 
                    class="btn-aplicar-cambio-estado"
                    @click="aplicarCambioEstado"
                    :disabled="!puedeAplicarCambio"
                  >
                    <i class="fas fa-check"></i> Aplicar
                  </button>
              </div>
            </div>

            <!-- Modal de confirmación de completación -->
            <div v-if="mostrarConfirmacionCompletacion" class="modal-overlay-confirmacion" @click.self="cerrarConfirmacion">
              <div class="modal-confirmacion-completar">
                <div class="modal-header-confirmacion">
                  <h3>
                    <i class="fas fa-check-double"></i>
                    Confirmar Finalización
                  </h3>
                  <button class="btn-close" @click="cerrarConfirmacion">&times;</button>
                </div>
                <div class="modal-body-confirmacion">
                  <p class="titulo-tarea"><strong>{{ tarea.titulo }}</strong></p>
                  <div class="form-group-confirmacion">
                    <label for="comentario-completacion">
                      Comentario de Finalización <span class="required">*</span>
                    </label>
                    <textarea 
                      id="comentario-completacion"
                      v-model="comentarioCompletacion"
                      class="textarea-confirmacion"
                      placeholder="Resultado de la tarea..."
                      rows="4"
                    ></textarea>
                  </div>
                </div>
                <div class="modal-footer-confirmacion">
                  <button type="button" class="btn btn-cancelar" @click="cerrarConfirmacion">Cancelar</button>
                  <button 
                    type="button"
                    class="btn btn-confirmar-completar" 
                    @click.prevent="completarConComentario"
                    :disabled="comentarioCompletacion.trim().length === 0 || completandoTarea"
                  >
                    {{ completandoTarea ? 'Procesando...' : 'Confirmar' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Sección de Comentarios (Movida a la derecha) -->
            <div class="comentarios-section-right">
              <label class="section-label"><i class="fas fa-comments"></i> Comentarios</label>
              
              <!-- Nuevo Comentario siempre visible arriba -->
              <div class="comentario-nuevo-compact" style="position: relative;">
                <textarea 
                  v-model="nuevoComentario"
                  class="form-control textarea-autoresize"
                  rows="2"
                  placeholder="Escribe un comentario... usa @ para mencionar"
                  @input="onComentarioInput($event)"
                  @keydown="onComentarioKeydown($event)"
                  ref="textareaComentario"
                ></textarea>

                <!-- Dropdown de @menciones -->
                <div v-if="mencionDropdown.visible && mencionDropdown.usuarios.length > 0" class="mencion-dropdown">
                  <div
                    v-for="(usuario, idx) in mencionDropdown.usuarios"
                    :key="usuario.id"
                    class="mencion-item"
                    :class="{ 'mencion-activa': idx === mencionDropdown.indice }"
                    @mousedown.prevent="insertarMencion(usuario)"
                  >
                    <i class="fas fa-user-circle"></i>
                    {{ usuario.nombre }}
                  </div>
                </div>
                
                <div class="comentario-tools">
                   <div class="archivos-selector-mini">
                      <input 
                        type="file" 
                        ref="fileInput" 
                        @change="onFilesSelected" 
                        multiple 
                        style="display: none"
                      />
                      <button class="btn-clip" @click="$refs.fileInput.click()" title="Adjuntar archivos">
                        <i class="fas fa-paperclip"></i>
                      </button>
                      <span v-if="archivosSeleccionados.length > 0" class="files-count-badge">
                        {{ archivosSeleccionados.length }}
                      </span>
                   </div>
                   <button 
                    class="btn-send-mini"
                    @click="adjuntarComentario"
                    :disabled="!nuevoComentario.trim() || guardandoComentario"
                   >
                    <i class="fas fa-paper-plane"></i>
                   </button>
                </div>
                <!-- Preview Archivos -->
                <div v-if="archivosSeleccionados.length > 0" class="mini-files-preview">
                    <div v-for="(archivo, index) in archivosSeleccionados" :key="index" class="mini-file-tag">
                      <span>{{ archivo.name }}</span>
                      <span class="remove-file" @click="quitarArchivo(index)">&times;</span>
                    </div>
                </div>
              </div>
              
              <!-- Lista de comentarios con scroll -->
              <div v-if="cargandoComentarios" class="comentarios-loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando...
              </div>
              <div v-else-if="comentarios.length === 0" class="comentarios-vacio">
                No hay comentarios aún
              </div>
              <div v-else class="comentarios-lista-compact">
                <div 
                  v-for="comentario in comentarios" 
                  :key="comentario.id" 
                  class="comentario-item-compact"
                  :class="{ 'comentario-fijado': comentario.fijado }"
                >
                  <div class="comentario-header-compact">
                    <div class="comentario-info">
                      <span class="comentario-autor">{{ comentario.usuarioNombre || 'Usuario' }}</span>
                      <span v-if="comentario.fijado" class="fijado-badge" title="Comentario fijado">
                        <i class="fas fa-thumbtack"></i>
                      </span>
                      <span v-if="comentario.editado" class="editado-badge" title="Comentario editado">
                        <i class="fas fa-pencil-alt"></i> Editado
                      </span>
                      <span class="comentario-fecha">{{ formatDate(comentario.fechaCreacion) }}</span>
                      <span v-if="comentario.editado && comentario.fechaEdicion" class="comentario-fecha-edicion">
                        (Editado: {{ formatDate(comentario.fechaEdicion) }})
                      </span>
                    </div>
                    <div class="comentario-actions">
                      <button 
                        class="btn-fijar-comentario" 
                        @click="toggleFijadoComentario(comentario)"
                        :title="comentario.fijado ? 'Desfijar comentario' : 'Fijar comentario'"
                      >
                        <i class="fas fa-thumbtack"></i>
                      </button>
                      <button 
                        class="btn-editar-comentario" 
                        @click="iniciarEdicionComentario(comentario)"
                        :disabled="!puedeEditarComentario(comentario)"
                        :title="puedeEditarComentario(comentario) ? 'Editar comentario' : 'Solo el autor puede editar'"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        class="btn-eliminar-comentario" 
                        @click="confirmarEliminarComentario(comentario)"
                        :disabled="!puedeEliminarComentario()"
                        :title="puedeEliminarComentario() ? 'Eliminar comentario' : 'Solo administradores pueden eliminar'"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Modo de edición -->
                  <div v-if="comentarioEditando && comentarioEditando.id === comentario.id" class="comentario-edicion">
                    <textarea 
                      v-model="textoComentarioEditando"
                      class="form-control"
                      rows="3"
                    ></textarea>
                    <div class="comentario-edicion-actions">
                      <button class="btn-guardar-edicion" @click="guardarEdicionComentario(comentario)">
                        <i class="fas fa-check"></i> Guardar
                      </button>
                      <button class="btn-cancelar-edicion" @click="cancelarEdicionComentario">
                        <i class="fas fa-times"></i> Cancelar
                      </button>
                    </div>
                  </div>
                  
                  <!-- Modo de visualización -->
                  <div v-else class="comentario-contenido">{{ comentario.contenido }}</div>
                  
                  <div v-if="comentario.adjuntos && comentario.adjuntos.length > 0" class="comentario-adjuntos">
                    <div class="adjuntos-lista">
                      <div 
                        v-for="adjunto in comentario.adjuntos" 
                        :key="adjunto.id" 
                        class="adjunto-item-compact"
                      >
                        <span class="adjunto-nombre" @click="descargarAdjunto(adjunto)">
                          <i class="fas fa-file-download"></i> {{ adjunto.nombreArchivo }}
                        </span>
                        <div class="adjunto-actions">
                          <button 
                            class="btn-actualizar-adjunto" 
                            @click="iniciarActualizacionAdjunto(adjunto)"
                            title="Actualizar archivo"
                          >
                            <i class="fas fa-sync-alt"></i>
                          </button>
                          <button 
                            class="btn-eliminar-adjunto" 
                            @click="confirmarEliminarAdjunto(adjunto)"
                            title="Eliminar archivo"
                          >
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
          <button v-if="puedeEditarTarea" type="button" class="btn btn-primary" @click="editarTarea">
            <i class="fas fa-edit"></i>
            Editar tarea
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
import { tareasApi } from '@/services/tareasApi'

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
      comentarioCambioEstado: '',
      esEstadoBloqueado: false,
      mostrarAuditoria: false,
      mostrarConfirmacionCompletacion: false,
      comentarioCompletacion: '',
      completandoTarea: false,
      comentarios: [],
      cargandoComentarios: false,
      nuevoComentario: '',
      guardandoComentario: false,
      archivosSeleccionados: [],
      subiendoArchivos: false,
      comentarioEditando: null,
      textoComentarioEditando: '',
      adjuntoActualizando: null,
      mencionDropdown: {
        visible: false,
        usuarios: [],
        query: '',
        indice: 0,
        posicionCursor: 0
      },
      todosLosUsuarios: []
    }
  },
  computed: {
    // Usuario actual logueado
    usuarioActual() {
      return JSON.parse(localStorage.getItem('usuario') || '{}')
    },
    
    // Verifica si el usuario actual es administrador
    esAdmin() {
      return this.usuarioActual && this.usuarioActual.nivelAcceso === 1
    },
    
    /**
     * Verifica si el usuario actual puede editar esta tarea.
     * Las tareas creadas por un administrador (nivel 1) solo pueden ser editadas por administradores.
     */
    puedeEditarTarea() {
      if (!this.tarea) return false
      
      // Si el usuario actual es admin, puede editar cualquier tarea
      if (this.esAdmin) return true
      
      // Si la tarea fue creada por un admin (nivel 1), solo admin puede editarla
      if (this.tarea.nivelAccesoCreador === 1) return false
      
      // En cualquier otro caso, puede editar
      return true
    },
    
    // Filtrar estados disponibles (excluir el actual y finales)
    estadosDisponibles() {
      if (!this.estados || !Array.isArray(this.estados)) return []
      return this.estados.filter(e => !e.estadoFinal && e.id !== this.tarea?.estadoId)
    },
    puedeAplicarCambio() {
      if (!this.estadoSeleccionado) {
        return false
      }
      // Siempre requerir comentario para cualquier cambio de estado
      return this.comentarioCambioEstado.trim().length > 0
    }
  },
  watch: {
    value: {
      handler(val) {
        if (val && this.tarea && this.tarea.id) {
          // Inicializar estado como null para mostrar "Modificar estado"
          this.estadoSeleccionado = null
          // Resetear campos de comentario
          this.motivoBloqueo = ''
          this.comentarioCambioEstado = ''
          this.esEstadoBloqueado = false
          this.nuevoComentario = ''
          this.archivosSeleccionados = []
          // Cargar comentarios
          this.$nextTick(() => {
            this.cargarComentarios()
          })
        }
      },
      immediate: true
    },
    
    tarea: {
      handler(newTarea, oldTarea) {
        if (newTarea && newTarea.id && this.value) {
          // Resetear el selector al abrir nueva tarea
          this.estadoSeleccionado = null
          
          // Si la tarea cambió (no solo se actualizó), recargar comentarios
          if (!oldTarea || oldTarea.id !== newTarea.id) {
            this.$nextTick(() => {
              this.cargarComentarios()
            })
          }
        }
      },
      immediate: true,
      deep: false
    }
  },
  mounted() {
    // Cargar comentarios cuando el componente se monta
    if (this.value && this.tarea && this.tarea.id) {
      this.cargarComentarios()
    }
  },
  methods: {
    onEstadoChange() {
      const estado = this.estados.find(e => e.id === this.estadoSeleccionado)
      // Usar campo estadoBloqueo en vez de detectar por nombre
      this.esEstadoBloqueado = estado && estado.estadoBloqueo === true
    },

    async aplicarCambioEstado() {
      if (!this.estadoSeleccionado || this.estadoSeleccionado === this.tarea.estadoId) {
        return
      }

      if (!this.comentarioCambioEstado.trim()) {
        console.warn('Se requiere un comentario para cambiar el estado')
        return
      }

      try {
        // Primero crear el comentario sobre el cambio de estado
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        await this.$emit('crear-comentario-estado', {
          tareaId: this.tarea.id,
          contenido: this.comentarioCambioEstado.trim(),
          autor: usuario.nombre || 'Usuario'
        })
        
        // Luego cambiar el estado (con motivo si es bloqueo)
        const motivo = this.esEstadoBloqueado ? this.comentarioCambioEstado.trim() : null
        this.$emit('cambiar-estado', this.tarea.id, this.estadoSeleccionado, motivo)
      } catch (error) {
        console.error('Error cambiando estado:', error)
        // Revertir la selección en caso de error
        this.estadoSeleccionado = this.tarea.estadoId
        this.esEstadoBloqueado = false
        this.comentarioCambioEstado = ''
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
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'Por favor, introduce un comentario de finalización'
        })
        return
      }

      const estadoCompletado = this.estados.find(e => e.estadoFinal === true)
      if (!estadoCompletado) {
        console.error('No se encontró estado de finalización. Estados disponibles:', this.estados)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se encontró el estado de finalización. Por favor, recarga la página.'
        })
        return
      }

      this.completandoTarea = true
      try {
        // Crear comentario sin mutar el prop
        const nuevoComentario = {
          contenido: this.comentarioCompletacion.trim(),
          fijado: false,
          esComentarioCompletacion: true
        }
        
        // Emitir evento para agregar comentario y cambiar estado
        this.$emit('completar-con-comentario', {
          tareaId: this.tarea.id,
          estadoId: estadoCompletado.id,
          comentario: nuevoComentario
        })
        
        // Cerrar modal de confirmación después de un breve delay
        setTimeout(() => {
          this.cerrarConfirmacion()
        }, 300)
      } catch (error) {
        console.error('Error completando tarea:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al completar la tarea: ' + error.message
        })
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

    autoResizeTextarea(event) {
      const el = event.target
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    },

    onComentarioInput(event) {
      this.autoResizeTextarea(event)
      this.detectarMencion()
    },

    onComentarioKeydown(event) {
      if (!this.mencionDropdown.visible) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        this.mencionDropdown.indice = Math.min(
          this.mencionDropdown.indice + 1,
          this.mencionDropdown.usuarios.length - 1
        )
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        this.mencionDropdown.indice = Math.max(this.mencionDropdown.indice - 1, 0)
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        if (this.mencionDropdown.usuarios.length > 0) {
          event.preventDefault()
          this.insertarMencion(this.mencionDropdown.usuarios[this.mencionDropdown.indice])
        }
      } else if (event.key === 'Escape') {
        this.mencionDropdown.visible = false
      }
    },

    detectarMencion() {
      const texto = this.nuevoComentario
      const cursor = this.$refs.textareaComentario?.selectionStart || texto.length
      // Buscar hacia atrás desde el cursor hasta encontrar @ o espacio
      const fragmento = texto.substring(0, cursor)
      const match = fragmento.match(/@([\w.]*)$/)
      if (match) {
        const query = match[1].toLowerCase()
        this.mencionDropdown.query = query
        this.mencionDropdown.posicionCursor = cursor - match[0].length
        this.mencionDropdown.indice = 0
        // Cargar usuarios si aún no están cargados
        if (this.todosLosUsuarios.length === 0) {
          this.cargarUsuariosParaMencion()
        } else {
          this.filtrarUsuariosMencion(query)
        }
        this.mencionDropdown.visible = true
      } else {
        this.mencionDropdown.visible = false
      }
    },

    async cargarUsuariosParaMencion() {
      try {
        const base = process.env.VUE_APP_API_URL || 'http://localhost:8986'
        const res = await fetch(`${base}/api/usuarios`)
        if (res.ok) {
          this.todosLosUsuarios = await res.json()
          this.filtrarUsuariosMencion(this.mencionDropdown.query)
        }
      } catch (e) {
        console.error('Error cargando usuarios para menciones:', e)
      }
    },

    filtrarUsuariosMencion(query) {
      this.mencionDropdown.usuarios = this.todosLosUsuarios
        .filter(u => u.nombre && u.nombre.toLowerCase().includes(query))
        .slice(0, 6)
    },

    insertarMencion(usuario) {
      const pos = this.mencionDropdown.posicionCursor
      const cursor = this.$refs.textareaComentario?.selectionStart || this.nuevoComentario.length
      const texto = this.nuevoComentario
      const nombreSinEspacios = usuario.nombre.replace(/\s+/g, '')
      const antes = texto.substring(0, pos)
      const despues = texto.substring(cursor)
      this.nuevoComentario = `${antes}@${nombreSinEspacios} ${despues}`
      this.mencionDropdown.visible = false
      this.$nextTick(() => {
        const nuevaCursor = antes.length + nombreSinEspacios.length + 2
        const ta = this.$refs.textareaComentario
        if (ta) { ta.focus(); ta.setSelectionRange(nuevaCursor, nuevaCursor) }
      })
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
        case 0: return 'Urgente'
        case 1: return 'Alta'
        case 2: return 'Media'
        case 3: return 'Baja'
        default: return 'Normal'
      }
    },

    cerrar() {
      // Resetear campos de cambio de estado
      this.estadoSeleccionado = null
      this.motivoBloqueo = ''
      this.comentarioCambioEstado = ''
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
    },

    async cargarComentarios() {
      if (!this.tarea || !this.tarea.id) {
        console.warn('No se puede cargar comentarios: tarea no válida')
        return
      }
      
      this.cargandoComentarios = true
      this.comentarios = [] // Limpiar comentarios previos
      
      try {

        const comentariosData = await tareasApi.obtenerComentariosPorTarea(this.tarea.id)

        
        // Mapear los comentarios para usar el campo correcto
        this.comentarios = (comentariosData || []).map(comentario => ({
          id: comentario.id,
          usuarioId: comentario.usuarioId,
          usuarioNombre: comentario.usuarioNombre || 'Usuario',
          contenido: comentario.comentario || '',
          fechaCreacion: comentario.fechaCreacion,
          fechaEdicion: comentario.fechaEdicion,
          editado: comentario.editado || false,
          fijado: comentario.fijado || false,
          adjuntos: Array.isArray(comentario.adjuntos) ? comentario.adjuntos : []
        }))
        

      } catch (error) {
        console.error('Error cargando comentarios para tarea', this.tarea.id, ':', error)
        this.comentarios = []
      } finally {
        this.cargandoComentarios = false
      }
    },

    formatDate(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    },

    async descargarAdjunto(adjunto) {
      try {
        await tareasApi.descargarAdjunto(adjunto.id, adjunto.nombreArchivo)
      } catch (error) {
        console.error('Error descargando archivo:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al descargar el archivo'
        })
      }
    },

    async adjuntarComentario() {
      if (!this.nuevoComentario.trim()) return
      
      this.guardandoComentario = true
      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        
        // Crear el comentario primero con el formato correcto del DTO
        const comentarioCreado = await tareasApi.crearComentario({
          tareaId: this.tarea.id,
          usuarioId: usuario.id,
          comentario: this.nuevoComentario.trim()
        })
        
        // Si hay archivos seleccionados, subirlos
        if (this.archivosSeleccionados.length > 0) {
          this.subiendoArchivos = true
          
          for (const archivo of this.archivosSeleccionados) {
            try {
              await tareasApi.subirAdjuntoComentario(comentarioCreado.id, archivo)
            } catch (error) {
              console.error('Error subiendo archivo:', archivo.name, error)
              this.$swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Error al subir el archivo ${archivo.name}`
              })
            }
          }
          
          this.subiendoArchivos = false
        }
        
        // Limpiar campos y recargar comentarios
        this.nuevoComentario = ''
        this.archivosSeleccionados = []
        await this.cargarComentarios()
        
        // Notificar éxito al componente padre
        this.$emit('comentario-creado')
      } catch (error) {
        console.error('Error guardando comentario:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al guardar el comentario. Por favor, inténtalo de nuevo.'
        })
      } finally {
        this.guardandoComentario = false
        this.subiendoArchivos = false
      }
    },

    onFilesSelected(event) {
      const files = Array.from(event.target.files)
      this.archivosSeleccionados = [...this.archivosSeleccionados, ...files]
    },

    quitarArchivo(index) {
      this.archivosSeleccionados.splice(index, 1)
    },

    async toggleFijadoComentario(comentario) {
      try {
        await tareasApi.toggleFijadoComentario(comentario.id)
        await this.cargarComentarios()
      } catch (error) {
        console.error('Error al fijar/desfijar comentario:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar el comentario'
        })
      }
    },

    iniciarEdicionComentario(comentario) {
      this.comentarioEditando = comentario
      this.textoComentarioEditando = comentario.contenido
    },

    cancelarEdicionComentario() {
      this.comentarioEditando = null
      this.textoComentarioEditando = ''
    },

    async guardarEdicionComentario(comentario) {
      if (!this.textoComentarioEditando.trim()) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'El comentario no puede estar vacío'
        })
        return
      }

      try {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        await tareasApi.actualizarComentario(comentario.id, this.textoComentarioEditando.trim(), usuario.id)
        await this.cargarComentarios()
        this.cancelarEdicionComentario()
        
        this.$swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Comentario actualizado correctamente',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (error) {
        console.error('Error al actualizar comentario:', error)
        const mensaje = error.response?.data || 'Error al actualizar el comentario'
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensaje
        })
      }
    },

    async confirmarEliminarComentario(comentario) {
      const result = await this.$swal.fire({
        title: '¿Eliminar comentario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        try {
          const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
          await tareasApi.eliminarComentario(comentario.id, usuario.id)
          await this.cargarComentarios()
          
          this.$swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Comentario eliminado correctamente',
            timer: 1500,
            showConfirmButton: false
          })
        } catch (error) {
          console.error('Error al eliminar comentario:', error)
          const mensaje = error.response?.data || 'Error al eliminar el comentario'
          this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje
          })
        }
      }
    },

    puedeEditarComentario(comentario) {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return comentario.usuarioId === usuario.id
    },

    puedeEliminarComentario() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario.nivelAcceso === 1
    },

    async iniciarActualizacionAdjunto(adjunto) {
      // Crear input file temporal
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '*/*'
      
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const result = await this.$swal.fire({
          title: '¿Actualizar archivo?',
          text: `Se reemplazará "${adjunto.nombreArchivo}" por "${file.name}"`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sí, actualizar',
          cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
          try {
            await tareasApi.actualizarAdjunto(adjunto.id, file)
            await this.cargarComentarios()
            
            this.$swal.fire({
              icon: 'success',
              title: 'Actualizado',
              text: 'Archivo actualizado correctamente',
              timer: 1500,
              showConfirmButton: false
            })
          } catch (error) {
            console.error('Error al actualizar adjunto:', error)
            this.$swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error al actualizar el archivo'
            })
          }
        }
      }
      
      input.click()
    },

    async confirmarEliminarAdjunto(adjunto) {
      const result = await this.$swal.fire({
        title: '¿Eliminar archivo?',
        text: `Se eliminará "${adjunto.nombreArchivo}"`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      })

      if (result.isConfirmed) {
        try {
          await tareasApi.eliminarAdjunto(adjunto.id)
          await this.cargarComentarios()
          
          this.$swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'Archivo eliminado correctamente',
            timer: 1500,
            showConfirmButton: false
          })
        } catch (error) {
          console.error('Error al eliminar adjunto:', error)
          this.$swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al eliminar el archivo'
          })
        }
      }
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
  width: 95%;
  height: 95%;
  max-width: 1400px;
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
  display: none; /* Ocultar header completamente */
}

/* Botón cerrar flotante */
.close-button-floating {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 10;
}

.close-button-floating:hover {
  background-color: rgba(0, 0, 0, 0.7);
  transform: rotate(90deg);
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2d3748;
}

.tarea-id {
  font-size: 0.8rem;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.close-button {
  background-color: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #a0aec0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.close-button:hover {
  background-color: #f7fafc;
  color: #2d3748;
  transform: rotate(90deg);
}

/* Body del modal */
.modal-body {
  flex: 1;
  padding: 8px 12px 0 12px;
  overflow: hidden; /* Importante: hidden para delegar scroll a hijos */
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
}

/* Wrapper para body y footer */
.modal-body-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Título y descripción en la parte superior */
.titulo-descripcion-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 2px;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.titulo-campo {
  width: 100%;
}

.titulo-valor {
  font-size: 1rem;
  font-weight: 700;
  color: #2d3748;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.1;
}

.descripcion-campo {
  width: 100%;
}

.descripcion-completa {
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #667eea;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 70px;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.2;
}

.detalle-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 10px;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Sección de información */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 4px;
}

.campo-detalle {
  display: flex;
  flex-direction: column;
  gap: 2px;
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

.prioridad-0 { background: #7b0000; color: white; }
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

.potencial-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  background: #fff3cd;
  color: #856404;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
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

/* Sección de comentarios */
.comentarios-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e9ecef;
}

.comentarios-section > label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.comentarios-loading,
.comentarios-vacio {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.comentarios-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.comentario-item {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s ease;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.comentario-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.comentario-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.comentario-autor {
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
}

.comentario-fecha {
  font-size: 0.75rem;
  color: #6c757d;
}

.comentario-fijado {
  color: #ffc107;
  font-size: 0.9rem;
  margin-left: auto;
}

.comentario-contenido {
  font-size: 0.9rem;
  color: #212529;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.comentario-nuevo {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comentario-nuevo-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-adjuntar-comentario {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-adjuntar-comentario:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-adjuntar-comentario:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

/* Selector de archivos */
.archivos-selector {
  margin-top: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px dashed #dee2e6;
}

.btn-seleccionar-archivos {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-seleccionar-archivos:hover {
  background: #667eea;
  color: white;
}

.archivos-lista {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.archivo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 0.85rem;
}

.archivo-nombre {
  flex: 1;
  color: #495057;
  font-weight: 500;
}

.archivo-size {
  color: #6c757d;
  font-size: 0.75rem;
}

.btn-quitar-archivo {
  background: transparent;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s ease;
}

.btn-quitar-archivo:hover {
  color: #a71d2a;
  transform: scale(1.1);
}

/* Archivos adjuntos en comentarios */
.comentario-adjuntos {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.adjuntos-titulo {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.adjuntos-lista {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adjunto-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.adjunto-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateX(4px);
}

.adjunto-item i {
  color: #667eea;
}

.adjunto-nombre {
  flex: 1;
  color: #495057;
  font-weight: 500;
}

.adjunto-size {
  color: #6c757d;
  font-size: 0.75rem;
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
  padding: 6px 12px; 
  border-top: 1px solid #e9ecef;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
  margin-top: auto;
}

.footer-info {
  font-size: 0.8rem;
  color: #6c757d;
  flex: 1;
}

.footer-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
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
/* Nuevo Layout Estilos */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow: hidden;
}

.acciones-bar {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Fila horizontal con todos los controles */
.acciones-row-horizontal {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  flex-wrap: wrap; /* Para pantallas pequeñas */
}

/* Para hacerlo más bonito y alineado */
.acciones-row-horizontal > * {
  display: flex;
  align-items: center;
}


.estado-badge-compact {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* Selector de cambio de estado mejorado */
.estado-selector-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.select-cambiar-estado {
  padding: 6px 14px;
  padding-left: 36px;
  height: 34px;
  font-size: 0.85rem;
  width: auto;
  min-width: 150px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: #4a5568;
  appearance: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 16 16'%3E%3Cpath fill='%23718096' d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}

.select-cambiar-estado:hover {
  border-color: #cbd5e0;
  background-color: #f7fafc;
  transform: translateY(-1px);
}

.select-cambiar-estado:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

/* Icono animado */
.icon-cambiar-estado {
  position: absolute;
  left: 12px;
  font-size: 0.9rem;
  color: #718096;
  pointer-events: none;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.estado-selector-container:hover .icon-cambiar-estado {
  animation: exchangeRotate 0.6s ease-in-out infinite;
  opacity: 1;
}

.estado-selector-container .select-cambiar-estado:focus ~ .icon-cambiar-estado,
.estado-selector-container:has(.select-cambiar-estado:focus) .icon-cambiar-estado {
  animation: exchangePulse 0.5s ease infinite;
  opacity: 1;
}

@keyframes exchangeRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
}

@keyframes exchangePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* Botones de acciones compactos */
.btn-action-compact {
  padding: 0 16px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.btn-action-compact:active {
  transform: scale(0.98);
}

.btn-action-compact i {
  font-size: 0.95rem;
}

/* Specific colors for buttons if not defined elsewhere */
.btn-completar-compact {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}
.btn-completar-compact:hover {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.btn-auditoria-compact {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
}
.btn-auditoria-compact:hover {
  background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.btn-completar-compact {
  background: #28a745;
}
.btn-completar-compact:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.btn-auditoria-compact {
  background: #17a2b8;
}
.btn-auditoria-compact:hover {
  background: #138496;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.2);
}

/* Contenedor del motivo de cambio */
.motivo-cambio-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed #dee2e6;
}

.motivo-input {
  font-size: 0.85rem;
  min-height: 60px;
  resize: vertical;
}

.btn-aplicar-cambio-estado {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-aplicar-cambio-estado:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
}

.btn-aplicar-cambio-estado:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}


.motivo-cambio-container {
  margin-top: 5px;
  padding-top: 10px;
  border-top: 1px dashed #dee2e6;
}

.motivo-input {
  font-size: 0.85rem;
  min-height: 60px;
}

/* Comentarios Right Side */
.comentarios-section-right {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden; /* Important for scroll */
  border-top: 1px solid #e9ecef;
  padding-top: 4px;
  min-height: 0; /* Critical for flex scroll */
  margin-top: 0;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #4a5568;
  margin-bottom: 3px;
  display: block;
  flex-shrink: 0;
}

.comentarios-lista-compact {
  flex: 1;
  overflow-y: auto;
  padding: 5px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #fff;
  min-height: 0; /* Critical for scroll */
}

.comentarios-vacio {
  text-align: center;
  padding: 20px;
  color: #aaa;
  font-style: italic;
}

.comentario-item-compact {
  background: #f8f9fa;
  border-left: 3px solid #667eea;
  border-radius: 4px;
  padding: 7px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.comentario-item-compact.comentario-fijado {
  background: #fffbeb;
  border-left-color: #f59e0b;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.15);
}

.comentario-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #718096;
  margin-bottom: 5px;
  gap: 8px;
}

.comentario-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.comentario-autor { font-weight: 600; color: #2d3748; }

.comentario-fecha {
  font-size: 0.7rem;
  color: #a0aec0;
}

.fijado-badge {
  color: #f59e0b;
  font-size: 0.7rem;
}

.editado-badge {
  color: #8b5cf6;
  font-size: 0.7rem;
  font-style: italic;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.comentario-fecha-edicion {
  font-size: 0.7rem;
  color: #a0aec0;
  font-style: italic;
}

.comentario-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  background: rgba(102, 126, 234, 0.08);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.comentario-item-compact:hover .comentario-actions {
  background: rgba(102, 126, 234, 0.15);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.btn-fijar-comentario,
.btn-editar-comentario,
.btn-eliminar-comentario {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  position: relative;
}

.btn-fijar-comentario:disabled,
.btn-editar-comentario:disabled,
.btn-eliminar-comentario:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-fijar-comentario::before,
.btn-editar-comentario::before,
.btn-eliminar-comentario::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: -1;
}

.btn-fijar-comentario {
  color: #f59e0b;
}

.btn-fijar-comentario::before {
  background: rgba(245, 158, 11, 0.1);
  transform: scale(0);
}

.btn-fijar-comentario:hover {
  color: #f59e0b;
  opacity: 1;
  transform: scale(1.15);
}

.btn-fijar-comentario:hover::before {
  transform: scale(1);
}

.comentario-fijado .btn-fijar-comentario {
  color: #f59e0b;
  opacity: 1;
}

.btn-editar-comentario {
  color: #3182ce;
}

.btn-editar-comentario::before {
  background: rgba(49, 130, 206, 0.1);
  transform: scale(0);
}

.btn-editar-comentario:hover {
  color: #3182ce;
  opacity: 1;
  transform: scale(1.15);
}

.btn-editar-comentario:hover::before {
  transform: scale(1);
}

.btn-eliminar-comentario {
  color: #e53e3e;
}

.btn-eliminar-comentario::before {
  background: rgba(229, 62, 62, 0.1);
  transform: scale(0);
}

.btn-eliminar-comentario:hover {
  color: #e53e3e;
  opacity: 1;
  transform: scale(1.15);
}

.btn-eliminar-comentario:hover::before {
  transform: scale(1);
}

/* Mostrar más prominentemente al hover del comentario */
.comentario-item-compact:hover .btn-fijar-comentario,
.comentario-item-compact:hover .btn-editar-comentario,
.comentario-item-compact:hover .btn-eliminar-comentario {
  opacity: 0.8;
}

.comentario-edicion {
  margin-top: 8px;
}

.comentario-edicion textarea {
  width: 100%;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  transition: border-color 0.3s;
}

.comentario-edicion textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.comentario-edicion-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
}

.btn-guardar-edicion,
.btn-cancelar-edicion {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-guardar-edicion {
  background: #28a745;
  color: white;
}

.btn-guardar-edicion:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-cancelar-edicion {
  background: #6c757d;
  color: white;
}

.btn-cancelar-edicion:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.adjunto-item-compact {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
  border: 1.5px solid #d6e4ff;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.adjunto-item-compact::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.adjunto-item-compact:hover::before {
  left: 100%;
}

.adjunto-item-compact:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  transform: translateY(-2px);
}

.adjunto-nombre {
  flex: 1;
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.adjunto-nombre:hover {
  text-decoration: underline;
  color: #5568d3;
}

.adjunto-nombre i {
  font-size: 0.9rem;
}

.adjunto-actions {
  display: flex;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 1;
}

.adjunto-item-compact:hover .adjunto-actions {
  opacity: 1;
}

.btn-actualizar-adjunto,
.btn-eliminar-adjunto {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 8px;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.btn-actualizar-adjunto::before,
.btn-eliminar-adjunto::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: -1;
}

.btn-actualizar-adjunto {
  color: #3182ce;
}

.btn-actualizar-adjunto::before {
  background: rgba(49, 130, 206, 0.1);
  transform: scale(0);
}

.btn-actualizar-adjunto:hover {
  color: #2c5282;
  transform: scale(1.18) rotate(180deg);
}

.btn-actualizar-adjunto:hover::before {
  transform: scale(1);
}

.btn-eliminar-adjunto {
  color: #e53e3e;
}

.btn-eliminar-adjunto::before {
  background: rgba(229, 62, 62, 0.1);
  transform: scale(0);
}

.btn-eliminar-adjunto:hover {
  color: #c53030;
  transform: scale(1.18);
}

.btn-eliminar-adjunto:hover::before {
  transform: scale(1);
}

.comentario-nuevo-compact {
  margin-bottom: 6px;
  background: #f1f5f9;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.textarea-autoresize {
  resize: none;
  min-height: 60px;
  overflow-y: hidden;
  transition: height 0.1s ease;
}

.mencion-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.mencion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #2d3748;
  transition: background 0.1s;
}

.mencion-item:hover,
.mencion-item.mencion-activa {
  background: #eef2ff;
  color: #4c51bf;
}

.comentario-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.btn-clip {
  background: none;
  border: none;
  color: #4a5568;
  cursor: pointer;
  font-size: 1.1rem;
}

.btn-send-mini {
  background: #667eea;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.btn-send-mini:disabled { background: #cbd5e0; }

.mini-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}
.mini-file-tag {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  gap: 5px;
  align-items: center;
}
.remove-file { cursor: pointer; color: red; font-weight: bold; }

/* Info adicional left */
.info-adicional-left {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.adjunto-item-compact {
  font-size: 0.8rem;
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 0;
}
.adjunto-item-compact:hover { text-decoration: underline; }
</style>
