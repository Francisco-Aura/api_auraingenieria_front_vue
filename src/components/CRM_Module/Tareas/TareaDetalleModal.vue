<template>
  <Teleport to="body">
    <div v-if="value" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tarea-detalle-title" @click="cerrar">
      <div class="modal-content modal-detalle" @click.stop>
      <!-- Cabecera común de Aura: el título de la tarea hace de título del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-clipboard-check"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="tarea-detalle-title">{{ tarea.titulo || 'Detalle de la tarea' }}</h2>
          <span class="aura-modal-header__subtitulo">
            <span class="aura-dato"><span class="aura-dato__etiqueta">Tarea</span>#{{ tarea.id }}</span>
            <span v-if="tarea.estadoNombre" class="aura-dato"><span class="aura-dato__etiqueta">Estado</span>{{ formatearEstadoNombre(tarea.estadoNombre) }}</span>
            <span v-if="tarea.fechaVencimiento" class="aura-dato"><span class="aura-dato__etiqueta">Vence</span>{{ formatearFecha(tarea.fechaVencimiento) }}</span>
          </span>
        </div>
        <button type="button" class="close-button" @click="cerrar" aria-label="Cerrar detalle de tarea">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
          <!-- Descripción arriba, a todo el ancho -->
          <div v-if="tarea.descripcion" class="titulo-descripcion-header">
          <div class="campo-detalle descripcion-campo">
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

            <div class="campo-detalle" v-if="tarea.clienteRelacionadoId">
              <label>Punto de suministro (CUPS)</label>
              <div class="cups-info">
                <i class="fas fa-bolt"></i>
                <span v-if="tarea.cups" class="cups-value">{{ tarea.cups }}</span>
                <span v-else class="cups-general">GENERAL</span>
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
            <div class="adjuntos-panel-right">
              <div class="adjuntos-panel-header">
                <label class="section-label"><i class="fas fa-paperclip"></i> Adjuntos de la tarea</label>
                <span class="adjuntos-total" v-if="adjuntosDirectos.length > 0">{{ adjuntosDirectos.length }}</span>
              </div>

              <div v-if="adjuntosDirectos.length === 0" class="adjuntos-empty">
                Sin archivos adjuntos
              </div>

              <div
                v-else
                ref="adjuntosLista"
                class="adjuntos-panel-lista"
                :class="{ 'adjuntos-colapsados': !adjuntosExpandidos }"
              >
                <button
                  v-for="adj in adjuntosDirectos"
                  :key="adj.id"
                  type="button"
                  class="adjunto-chip"
                  :disabled="adjuntoDescargandoId === adj.id"
                  @click="descargarAdjunto(adj)"
                  :title="adj.nombreArchivo || 'archivo'"
                >
                  <i v-if="adjuntoDescargandoId !== adj.id" :class="getIconoAdjunto(adj.nombreArchivo)"></i>
                  <i v-else class="fas fa-spinner fa-spin"></i>
                  <span class="adj-nombre">{{ adj.nombreArchivo }}</span>
                </button>
              </div>

              <div v-if="adjuntosDirectos.length > adjuntosVisiblesColapsado" class="adjuntos-panel-footer">
                <button type="button" class="btn-adjuntos-toggle" @click="toggleAdjuntosPanel">
                  <i :class="adjuntosExpandidos ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                  {{ adjuntosExpandidos ? 'Ver menos' : `Ver todos (+${adjuntosRestantes})` }}
                </button>
                <span class="adjuntos-counter">Mostrando {{ adjuntosMostrando }} de {{ adjuntosDirectos.length }}</span>
              </div>
            </div>

            <div class="acciones-bar">
              <!-- Actions Row: Status Badge, Change Status Selector, Buttons -->
              <div class="acciones-row-horizontal">
                <!-- Estado Actual -->
                <div class="estado-badge-compact" :style="{ backgroundColor: tarea.estadoColor }">
                  <i :class="getEstadoIcon(tarea.estadoId)"></i>
                  {{ formatearEstadoNombre(tarea.estadoNombre) }}
                </div>

                <!-- Selector de cambio de estado -->
                <div class="estado-selector-container task-action-control">
                  <i class="fas fa-exchange-alt icon-cambiar-estado"></i>
                  <select 
                    v-model="estadoSeleccionado" 
                    class="select-cambiar-estado"
                    @change="onEstadoChange"
                    aria-label="Modificar estado de la tarea"
                  >
                    <option :value="null">Cambiar estado</option>
                    <option v-for="estado in estadosDisponibles" :key="estado.id" :value="estado.id">
                      {{ formatearEstadoNombre(estado.nombre) }}
                    </option>
                  </select>
                </div>

                <!-- Botones de Acciones -->
                <button v-if="!tarea.estadoFinal" class="btn-action-compact task-action-control btn-completar-compact" @click="mostrarConfirmacionCompletacion = true" title="Marcar tarea como completada">
                  <i class="fas fa-check-circle"></i>
                  <span>Completar</span>
                </button>
                <button class="btn-action-compact task-action-control btn-auditoria-compact" @click="abrirAuditoria" title="Ver historial de cambios">
                  <i class="fas fa-history"></i>
                  <span>Auditoría</span>
                </button>
              </div>

               <!-- Motivo Cambio Estado (si se selecciona un nuevo estado) -->
              <div v-if="estadoSeleccionado && estadoSeleccionado !== tarea.estadoId" class="motivo-cambio-container estado-cambio-panel">
                  <div class="estado-cambio-summary">
                    <span class="estado-cambio-label">Nuevo estado</span>
                    <strong>{{ formatearEstadoNombre(estadoSeleccionadoInfo?.nombre) }}</strong>
                  </div>
                  <div class="estado-cambio-comentario">
                    <label for="comentarioCambioEstado" class="estado-cambio-comentario-label">
                      {{ esEstadoBloqueado ? 'Motivo del bloqueo' : 'Comentario del cambio' }}
                      <span class="required">*</span>
                    </label>
                    <textarea
                      id="comentarioCambioEstado"
                      v-model="comentarioCambioEstado"
                      class="form-control motivo-input"
                      :placeholder="esEstadoBloqueado ? 'Explica por qué se bloquea la tarea...' : 'Describe brevemente el cambio...'"
                      rows="2"
                    ></textarea>
                  </div>
                  <div class="estado-cambio-acciones">
                    <button type="button" class="btn-cancelar-cambio-estado" @click="cancelarCambioEstado">
                      <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn-aplicar-cambio-estado"
                      @click="aplicarCambioEstado"
                      :disabled="!puedeAplicarCambio"
                    >
                      <i class="fas fa-check"></i> Aplicar cambio
                    </button>
                  </div>
              </div>
            </div>

            <!-- Modal de confirmación de completación -->
            <div v-if="mostrarConfirmacionCompletacion" class="modal-overlay-confirmacion" @click.self="cerrarConfirmacion">
              <div class="modal-confirmacion-completar">
                <div class="modal-header-confirmacion aura-modal-header">
                  <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-check-double"></i></span>
                  <div class="aura-modal-header__titulos">
                    <h3>Confirmar finalización</h3>
                    <span class="aura-modal-header__subtitulo">Escriba el resultado para completar la tarea</span>
                  </div>
                  <button type="button" class="close-button" @click="cerrarConfirmacion" aria-label="Cerrar confirmación"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body-confirmacion">
                  <p class="titulo-tarea"><strong>{{ tarea.titulo }}</strong></p>
                  <div class="form-group-confirmacion">
                    <label for="comentario-completacion">
                      Comentario de finalización <span class="required">*</span>
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
              <div
                class="comentario-nuevo-compact"
                role="region"
                aria-label="Zona para adjuntar archivos al comentario"
                :aria-busy="dragActivoComentario"
                @dragover.prevent="onDragOverComentario"
                @dragleave="onDragLeaveComentario"
                @drop.prevent="onDropComentario"
                :class="{ 'drag-activo-comentario': dragActivoComentario }"
              >
                <div v-if="dragActivoComentario" class="drag-overlay-comentario">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Suelta para adjuntar</span>
                </div>
                <textarea 
                  v-model="nuevoComentario"
                  class="form-control textarea-autoresize"
                  rows="2"
                  placeholder="Escribe un comentario... usa @ para mencionar o arrastra archivos aquí"
                  @input="onComentarioInput($event)"
                  @keydown="onComentarioKeydown($event)"
                  ref="textareaComentario"
                ></textarea>

                <!-- Dropdown de @menciones -->
                <div v-if="mencionDropdown.visible && mencionDropdown.usuarios.length > 0" class="mencion-dropdown" :style="mencionDropdownStyle">
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
                        class="input-file-oculto"
                      />
                      <button type="button" class="btn-clip" @click="$refs.fileInput.click()" title="Adjuntar archivos" aria-label="Adjuntar archivos">
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
                      <i class="fas fa-file mini-file-tag-icon"></i>
                      <span>{{ archivo.name }}</span>
                      <span class="adjunto-size-mini">{{ formatFileSizeComentario(archivo.size) }}</span>
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
                      ref="textareaComentarioEditando"
                      @input="onComentarioEditandoInput($event)"
                      @keydown="onComentarioEditandoKeydown($event)"
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
  </Teleport>
</template>

<script>
import { textoError } from '@/utils/errores';
import TareaAuditoriaModal from './TareaAuditoriaModal.vue'
import tareasApi from '@/services/tareasApi'

export default {
  name: 'TareaDetalleModal',
  components: {
    TareaAuditoriaModal
  },
  emits: ['actualizar', 'cambiarEstado', 'completarConComentario', 'completar-con-comentario', 'crearComentarioEstado', 'crear-comentario-estado', 'comentario-creado', 'cerrar', 'update:value'],
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
      dragActivoComentario: false,
      subiendoArchivos: false,
      comentarioEditando: null,
      textoComentarioEditando: '',
      adjuntosDirectos: [],
      adjuntosExpandidos: false,
      adjuntosVisiblesColapsado: 4,
      onResizeAdjuntos: null,
      adjuntoDescargandoId: null,
      mencionDropdownStyle: {},
      mencionContexto: 'nuevo',
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
    estadoSeleccionadoInfo() {
      if (!this.estados || !Array.isArray(this.estados)) return null
      return this.estados.find(e => e.id === this.estadoSeleccionado) || null
    },
    puedeAplicarCambio() {
      if (!this.estadoSeleccionado) {
        return false
      }
      // Siempre requerir comentario para cualquier cambio de estado
      return this.comentarioCambioEstado.trim().length > 0
    },
    adjuntosMostrando() {
      if (!Array.isArray(this.adjuntosDirectos)) return 0
      if (this.adjuntosExpandidos) return this.adjuntosDirectos.length
      return Math.min(this.adjuntosVisiblesColapsado, this.adjuntosDirectos.length)
    },
    adjuntosRestantes() {
      if (!Array.isArray(this.adjuntosDirectos)) return 0
      return Math.max(this.adjuntosDirectos.length - this.adjuntosVisiblesColapsado, 0)
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
          this.adjuntosExpandidos = false
          // Cargar comentarios
          this.$nextTick(() => {
            this.cargarComentarios()
            this.cargarAdjuntosDirectos()
            this.recalcularAdjuntosVisiblesColapsado()
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
          this.adjuntosExpandidos = false
          
          // Si la tarea cambió (no solo se actualizó), recargar comentarios
          if (!oldTarea || oldTarea.id !== newTarea.id) {
            this.$nextTick(() => {
              this.cargarComentarios()
              this.cargarAdjuntosDirectos()
              this.recalcularAdjuntosVisiblesColapsado()
            })
          }
        }
      },
      immediate: true,
      deep: false
    },

    adjuntosDirectos() {
      this.$nextTick(() => {
        this.recalcularAdjuntosVisiblesColapsado()
      })
    }
  },
  mounted() {
    // Cargar comentarios y adjuntos cuando el componente se monta
    if (this.value && this.tarea && this.tarea.id) {
      this.cargarComentarios()
      this.cargarAdjuntosDirectos()
    }

    this.onResizeAdjuntos = () => {
      this.recalcularAdjuntosVisiblesColapsado()
    }
    window.addEventListener('resize', this.onResizeAdjuntos)
  },
  beforeUnmount() {
    if (this.onResizeAdjuntos) {
      window.removeEventListener('resize', this.onResizeAdjuntos)
      this.onResizeAdjuntos = null
    }
  },
  methods: {
    toggleAdjuntosPanel() {
      this.adjuntosExpandidos = !this.adjuntosExpandidos
      this.$nextTick(() => {
        this.recalcularAdjuntosVisiblesColapsado()
      })
    },

    recalcularAdjuntosVisiblesColapsado() {
      const lista = this.$refs.adjuntosLista
      if (!lista || !Array.isArray(this.adjuntosDirectos) || this.adjuntosDirectos.length === 0) {
        this.adjuntosVisiblesColapsado = 4
        return
      }

      const chips = lista.querySelectorAll('.adjunto-chip')
      if (!chips || chips.length === 0) {
        this.adjuntosVisiblesColapsado = 4
        return
      }

      const primeraFilaTop = chips[0].offsetTop
      let visiblesPrimeraFila = 0

      for (let i = 0; i < chips.length; i += 1) {
        if (chips[i].offsetTop !== primeraFilaTop) break
        visiblesPrimeraFila += 1
      }

      this.adjuntosVisiblesColapsado = Math.max(visiblesPrimeraFila, 1)
    },

    getIconoAdjunto(nombreArchivo) {
      const nombre = (nombreArchivo || '').toLowerCase()
      if (nombre.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'fas fa-file-image'
      if (nombre.endsWith('.pdf')) return 'fas fa-file-pdf'
      if (nombre.match(/\.(doc|docx|odt)$/)) return 'fas fa-file-word'
      if (nombre.match(/\.(xls|xlsx|csv)$/)) return 'fas fa-file-excel'
      if (nombre.match(/\.(zip|rar|7z)$/)) return 'fas fa-file-archive'
      return 'fas fa-file-download'
    },

    onEstadoChange() {
      const estado = this.estados.find(e => e.id === this.estadoSeleccionado)
      // Usar campo estadoBloqueo en vez de detectar por nombre
      this.esEstadoBloqueado = estado && estado.estadoBloqueo === true
      if (!this.estadoSeleccionado) this.comentarioCambioEstado = ''
    },

    /** Deshace la elección de estado sin tener que cerrar y abrir la tarea. */
    cancelarCambioEstado() {
      this.estadoSeleccionado = null
      this.comentarioCambioEstado = ''
      this.esEstadoBloqueado = false
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
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cambiar el estado de la tarea. Inténtelo de nuevo.'
        })
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
      this.detectarMencionNuevo()
    },

    onComentarioEditandoInput(event) {
      this.autoResizeTextarea(event)
      this.detectarMencionEdicion()
    },

    onComentarioKeydown(event) {
      this.mencionContexto = 'nuevo'
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

    onComentarioEditandoKeydown(event) {
      this.mencionContexto = 'edicion'
      this.onComentarioKeydown(event)
    },

    detectarMencionNuevo() {
      this.mencionContexto = 'nuevo'
      this.detectarMencion(this.nuevoComentario, this.$refs.textareaComentario)
    },

    detectarMencionEdicion() {
      this.mencionContexto = 'edicion'
      this.detectarMencion(this.textoComentarioEditando, this.getTextareaEdicionRef())
    },

    getTextareaEdicionRef() {
      const ref = this.$refs.textareaComentarioEditando
      return Array.isArray(ref) ? ref[0] : ref
    },

    detectarMencion(texto, textareaRef) {
      const textoSeguro = texto || ''
      const cursor = textareaRef?.selectionStart || textoSeguro.length
      // Buscar hacia atrás desde el cursor hasta encontrar @ o espacio
      const fragmento = textoSeguro.substring(0, cursor)
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
        // Calcular posición fija para que el dropdown no sea recortado por overflow:hidden
        this.$nextTick(() => {
          const ta = textareaRef
          if (ta) {
            const rect = ta.getBoundingClientRect()
            this.mencionDropdownStyle = {
              top: `${rect.bottom + 4}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`
            }
          }
        })
      } else {
        this.mencionDropdown.visible = false
      }
    },

    async cargarAdjuntosDirectos() {
      if (!this.tarea || !this.tarea.id) return
      try {
        const data = await tareasApi.obtenerAdjuntosTarea(this.tarea.id)
        if (Array.isArray(data)) {
          this.adjuntosDirectos = [...data].sort((a, b) => {
            const aId = Number(a?.id || 0)
            const bId = Number(b?.id || 0)
            return bId - aId
          })
        } else {
          this.adjuntosDirectos = []
        }
      } catch (e) {
        console.error('Error cargando adjuntos directos:', e)
        this.adjuntosDirectos = []
      }
    },

    async cargarUsuariosParaMencion() {
      try {
        const data = await tareasApi.obtenerUsuarios()
        if (data) {
          this.todosLosUsuarios = data
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
      const esEdicion = this.mencionContexto === 'edicion'
      const textarea = esEdicion ? this.getTextareaEdicionRef() : this.$refs.textareaComentario
      const textoActual = esEdicion ? this.textoComentarioEditando : this.nuevoComentario
      const cursor = textarea?.selectionStart || textoActual.length
      const nombreSinEspacios = usuario.nombre.replace(/\s+/g, '')
      const antes = textoActual.substring(0, pos)
      const despues = textoActual.substring(cursor)

      if (esEdicion) {
        this.textoComentarioEditando = `${antes}@${nombreSinEspacios} ${despues}`
      } else {
        this.nuevoComentario = `${antes}@${nombreSinEspacios} ${despues}`
      }

      this.mencionDropdown.visible = false
      this.$nextTick(() => {
        const nuevaCursor = antes.length + nombreSinEspacios.length + 2
        const ta = esEdicion ? this.getTextareaEdicionRef() : this.$refs.textareaComentario
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

    async descargarAdjunto(adjunto) {
      this.adjuntoDescargandoId = adjunto?.id || null
      try {
        await tareasApi.descargarAdjunto(adjunto.id, adjunto.nombreArchivo)
      } catch (error) {
        console.error('Error descargando archivo:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al descargar el archivo'
        })
      } finally {
        this.adjuntoDescargandoId = null
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
          text: textoError(error, 'Error al guardar el comentario. Por favor, inténtalo de nuevo.')
        })
      } finally {
        this.guardandoComentario = false
        this.subiendoArchivos = false
      }
    },

    onDragOverComentario(event) {
      if (event?.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      this.dragActivoComentario = true
    },

    onDragLeaveComentario(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragActivoComentario = false
      }
    },

    onDropComentario(event) {
      this.dragActivoComentario = false
      this.procesarArchivosComentario(Array.from(event?.dataTransfer?.files || []))
    },

    onFilesSelected(event) {
      this.procesarArchivosComentario(Array.from(event.target.files))
      event.target.value = ''
    },

    procesarArchivosComentario(files) {
      if (!files || files.length === 0) return
      const MAX_SIZE = 10 * 1024 * 1024
      const nombresActuales = new Set(this.archivosSeleccionados.map(f => f.name))
      const rechazados = []

      for (const file of files) {
        if (file.size > MAX_SIZE) {
          rechazados.push(`${file.name} (supera 10 MB)`)
          continue
        }
        if (nombresActuales.has(file.name)) continue
        this.archivosSeleccionados.push(file)
        nombresActuales.add(file.name)
      }

      if (rechazados.length > 0) {
        this.$swal.fire({
          icon: 'warning',
          title: 'Archivos no permitidos',
          text: rechazados.join(', ')
        })
      }
    },

    formatFileSizeComentario(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB']
      const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), 2)
      return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
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
          text: textoError(error, 'Error al actualizar el comentario')
        })
      }
    },

    iniciarEdicionComentario(comentario) {
      this.comentarioEditando = comentario
      this.textoComentarioEditando = comentario.contenido
      this.mencionDropdown.visible = false
    },

    cancelarEdicionComentario() {
      this.comentarioEditando = null
      this.textoComentarioEditando = ''
      this.mencionDropdown.visible = false
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
        this.mencionDropdown.visible = false
        
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
          confirmButtonColor: '#fcd700',
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
              text: textoError(error, 'Error al actualizar el archivo')
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
            text: textoError(error, 'Error al eliminar el archivo')
          })
        }
      }
    }
  }
}
</script>

<style scoped src="./TareaDetalleModal.css"></style>
