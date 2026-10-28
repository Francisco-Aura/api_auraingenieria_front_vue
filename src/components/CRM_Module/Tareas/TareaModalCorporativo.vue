<template>
  <Teleport to="body">
  <div v-if="value" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tarea-modal-title" @mousedown="iniciarSeleccion" @mouseup="finalizarSeleccion">
    <div class="modal-content modal-tarea" @click.stop @input.stop @mousedown.stop @mouseup.stop @dragover.prevent @drop.prevent>
      <!-- Header del modal -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-tasks"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="tarea-modal-title" class="modal-title">{{ esEdicion ? 'Editar tarea' : 'Crear tarea' }}</h2>
          <span v-if="esEdicion && formulario.titulo" class="aura-modal-header__subtitulo">{{ formulario.titulo }}</span>
        </div>
        <button type="button" class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body del modal -->
      <div class="modal-body">
        <form @submit.prevent="guardar" class="form-compact" novalidate>
          
          <!-- Primera fila: Nombre, Cliente -->
          <div class="row-1">
            <div class="form-group">
              <label><i class="fas fa-file-alt"></i> Nombre <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="formulario.titulo" 
                class="form-control"
                :class="{ 'input-error': errores.titulo }"
                @input="errores.titulo = ''"
                required
                maxlength="200"
                placeholder="Título de la tarea"
              />
              <small v-if="errores.titulo" class="error-text"><i class="fas fa-exclamation-circle"></i> {{ errores.titulo }}</small>
            </div>

            <div class="form-group cliente-field">
              <label><i class="fas fa-user-tie"></i> Dirigido a <span class="required">*</span></label>
              
              <!-- Toggle cliente registrado / potencial -->
              <div class="cliente-tipo-toggle">
                <button type="button" :class="['btn-tipo', !esPotencial ? 'active' : '']" @click="esPotencial = false; formulario.clientePotencialNombre = null">
                  <i class="fas fa-user-check"></i> Cliente registrado
                </button>
                <button type="button" :class="['btn-tipo', esPotencial ? 'active' : '']" @click="esPotencial = true; formulario.clienteRelacionadoId = null; busquedaCliente = ''">
                  <i class="fas fa-user-clock"></i> Cliente potencial
                </button>
              </div>

              <!-- Búsqueda de cliente registrado -->
              <div v-if="!esPotencial" class="input-with-icon cliente-input-wrapper">
                <i class="fas fa-arrow-right cliente-arrow"></i>
                <input 
                  type="text" 
                  v-model="busquedaCliente"
                  @input="alEscribirCliente"
                  @focus="mostrarDropdownClientes = true"
                  class="form-control"
                  placeholder="Escribe el nombre del cliente..."
                />
                
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
                </div>
              </div>

              <!-- Texto libre para cliente potencial -->
              <div v-if="esPotencial" class="input-with-icon cliente-input-wrapper">
                <i class="fas fa-arrow-right cliente-arrow"></i>
                <input
                  type="text"
                  v-model="formulario.clientePotencialNombre"
                  class="form-control"
                  placeholder="Nombre del cliente potencial..."
                  maxlength="200"
                />
              </div>
            </div>
          </div>

          <!-- Fila CUPS: Punto de suministro (solo cuando hay cliente registrado) -->
          <div class="row-cups" v-if="!esPotencial && formulario.clienteRelacionadoId">
            <div class="form-group full-width">
              <label><i class="fas fa-bolt"></i> Punto de suministro (CUPS)</label>
              <select v-model="formulario.cups" class="form-control">
                <option :value="null">GENERAL</option>
                <option v-for="ps in puntosSuministroCliente" :key="ps.cups" :value="ps.cups">
                  {{ ps.cups }}<span v-if="ps.direccion"> — {{ ps.direccion }}</span>
                </option>
              </select>
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
                maxlength="10000"
                placeholder="Descripción detallada de la tarea..."
              ></textarea>
            </div>
          </div>

          <!-- Quinta fila: Adjuntos -->
          <div class="row-5">
            <div class="form-group full-width">
              <label><i class="fas fa-paperclip"></i> Adjuntos</label>
              <div
                class="adjuntos-drop-zone"
                role="region"
                aria-label="Adjuntar archivos a la tarea"
                aria-describedby="adjuntos-drop-zone-hint"
                :class="{ 'drag-activo': dragActivo }"
                @dragover.prevent="onDragOver"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop"
              >
                <div v-if="dragActivo" class="drop-zone-overlay">
                  <i class="fas fa-cloud-upload-alt"></i>
                  <span>Suelta los archivos aquí</span>
                </div>
                <input
                  type="file"
                  ref="fileInputCrear"
                  multiple
                  class="input-file-oculto"
                  @change="onArchivosCrearSelected"
                />
                <div id="adjuntos-drop-zone-hint" class="drop-zone-hint">
                  <i class="fas fa-cloud-upload-alt drop-zone-icon"></i>
                  <span class="drop-zone-text">Arrastra archivos aquí o</span>
                  <button type="button" class="btn-adjuntar-crear" @click="$refs.fileInputCrear.click()">
                    <i class="fas fa-folder-open"></i> Seleccionar
                  </button>
                  <span class="drop-zone-limit">Máx. 10 MB por archivo</span>
                </div>
                <ul v-if="archivosACrear.length > 0" class="adjuntos-lista-crear">
                  <li v-for="(f, idx) in archivosACrear" :key="idx">
                    <i class="fas fa-file"></i>
                    <span class="adjunto-nombre">{{ f.name }}</span>
                    <span class="adjunto-size">{{ formatFileSize(f.size) }}</span>
                    <button type="button" class="btn-remove-adjunto" @click="archivosACrear.splice(idx, 1)" title="Quitar">
                      <i class="fas fa-times"></i>
                    </button>
                  </li>
                </ul>
                <div v-if="esEdicion" class="adjuntos-existentes-wrapper">
                  <div class="adjuntos-existentes-header">Archivos ya adjuntados</div>
                  <div v-if="cargandoAdjuntosExistentes" class="adjuntos-loading">
                    <i class="fas fa-spinner fa-spin"></i> Cargando adjuntos...
                  </div>
                  <ul v-else-if="adjuntosExistentes.length > 0" class="adjuntos-lista-crear">
                    <li v-for="adj in adjuntosExistentes" :key="adj.id">
                      <span class="adjunto-nombre-existente" @click="descargarAdjuntoExistente(adj)">
                        <i class="fas fa-file-download"></i> {{ adj.nombreArchivo }}
                      </span>
                      <button
                        type="button"
                        class="btn-remove-adjunto"
                        :disabled="eliminandoAdjuntoId === adj.id"
                        @click="eliminarAdjuntoExistente(adj)"
                        title="Eliminar"
                      >
                        <i class="fas" :class="eliminandoAdjuntoId === adj.id ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
                      </button>
                    </li>
                  </ul>
                  <small v-else class="adjuntos-vacio">No hay adjuntos directos en esta tarea.</small>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer del modal -->
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrar" :disabled="guardando">
          <i class="fas fa-times"></i>
          Cancelar
        </button>
        <button type="button" class="btn btn-primary" @click="guardar" :disabled="guardando">
          <i v-if="guardando" class="fas fa-spinner fa-spin"></i>
          <i v-else :class="esEdicion ? 'fas fa-save' : 'fas fa-plus'"></i>
          {{ guardando ? 'Guardando...' : (esEdicion ? 'Guardar' : 'Crear') }}
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script>
import { textoError } from '@/utils/errores';
import tareasApi from '@/services/tareasApi'
import { fechaLocalISO } from '@/utils/fechas'

export default {
  name: 'TareaModalCorporativo',
  emits: ['guardar', 'cerrar', 'update:value'],
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
    },
    guardando: {
      type: Boolean,
      default: false
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
        clientePotencialNombre: null,
        cups: null,
        categoriaId: null,
        subcategoriaId: null,
        notificar: false,
        fijada: false,
        repetir: ''
      },
      esPotencial: false,
      dragActivo: false,
      archivosACrear: [],
      adjuntosExistentes: [],
      cargandoAdjuntosExistentes: false,
      eliminandoAdjuntoId: null,
      busquedaCliente: '',
      mostrarDropdownClientes: false,
      clientesFiltrados: [],
      puntosSuministroCliente: [],
      fechaInicio: '',
      horaInicio: '09:00',
      fechaVencimiento: '',
      horaVencimiento: '18:00',
      seleccionandoTexto: false,
      errores: {}
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
    
    'tarea.id': {
      handler() {
        if (this.value) {
          this.inicializarFormulario()
        }
      }
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
    clearTimeout(this.temporizadorBusquedaCliente)
  },
  methods: {
    inicializarFormulario() {
      // El modal no se desmonta entre aperturas: nada de la anterior (avisos en rojo,
      // fechas, cliente) puede quedarse en esta
      this.errores = {}

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
          clientePotencialNombre: this.tarea.clientePotencialNombre || null,
          cups: this.tarea.cups || null,
          categoriaId: this.tarea.categoriaId || null,
          subcategoriaId: this.tarea.subcategoriaId || null,
          notificar: Boolean(this.tarea.notificar),
          fijada: Boolean(this.tarea.fijada),
          repetir: this.tarea.repetir || ''
        }
        
        // Detectar si es cliente potencial al editar
        this.esPotencial = !this.tarea.clienteRelacionadoId && !!this.tarea.clientePotencialNombre
        
        // Formatear fechas para los inputs (día y hora locales: la fecha del
        // servidor no lleva zona horaria y no debe pasarse a UTC)
        // Una tarea sin fechas se edita sin fechas (antes salían las de la tarea abierta
        // antes y se guardaban en esta)
        if (this.tarea.fechaInicio) {
          const fechaIni = new Date(this.tarea.fechaInicio)
          this.fechaInicio = fechaLocalISO(fechaIni)
          this.horaInicio = fechaIni.toTimeString().slice(0, 5)
        } else {
          this.fechaInicio = ''
          this.horaInicio = '09:00'
        }
        if (this.tarea.fechaVencimiento) {
          const fecha = new Date(this.tarea.fechaVencimiento)
          this.fechaVencimiento = fechaLocalISO(fecha)
          this.horaVencimiento = fecha.toTimeString().slice(0, 5)
        } else {
          this.fechaVencimiento = ''
          this.horaVencimiento = '18:00'
        }
        
        // Cliente relacionado
        if (this.tarea.clienteRelacionadoId && this.tarea.clienteRelacionadoNombre) {
          this.busquedaCliente = this.tarea.clienteRelacionadoNombre
          this.clientesFiltrados = [{ 
            id: this.tarea.clienteRelacionadoId, 
            nombre: this.tarea.clienteRelacionadoNombre 
          }]
          this.cargarPuntosSuministroCliente(this.tarea.clienteRelacionadoId)
        } else if (this.tarea.clientePotencialNombre) {
          this.busquedaCliente = ''
          this.esPotencial = true
          this.puntosSuministroCliente = []
        } else {
          // Sin cliente: no se queda a la vista el de la tarea anterior
          this.busquedaCliente = ''
          this.clientesFiltrados = []
          this.puntosSuministroCliente = []
        }

        this.archivosACrear = []
        this.cargarAdjuntosEdicion()
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
        
        // Fechas por defecto: hoy, o el día elegido en el calendario («Nueva tarea»)
        const diaPropuesto = fechaLocalISO(this.tarea?.fechaVencimiento || new Date()) || fechaLocalISO(new Date())
        this.fechaInicio = diaPropuesto
        this.fechaVencimiento = diaPropuesto
        this.horaInicio = '09:00'
        this.horaVencimiento = '18:00'
        
        // Limpiar cliente
        this.busquedaCliente = ''
        this.clientesFiltrados = []
        this.puntosSuministroCliente = []
        this.esPotencial = false
        this.formulario.clientePotencialNombre = null
        this.formulario.cups = null
        this.archivosACrear = []
        this.adjuntosExistentes = []
      }
      
    },

    // Se busca cuando se deja de teclear un momento (antes, una petición por tecla); quitar
    // el cliente ligado o vaciar la lista es inmediato
    alEscribirCliente() {
      clearTimeout(this.temporizadorBusquedaCliente)
      if (this.busquedaCliente.trim().length === 0) {
        this.buscarClientes()
        return
      }
      this.temporizadorBusquedaCliente = setTimeout(() => this.buscarClientes(), 250)
    },

    async buscarClientes() {
      // Se busca a cada tecla: solo vale la respuesta de la última búsqueda (una
      // anterior que llegue tarde no puede sustituir a la lista buena)
      this.peticionClientes = (this.peticionClientes || 0) + 1
      const peticion = this.peticionClientes
      // Al vaciar «Dirigido a», la tarea deja de estar ligada al cliente que tenía (antes se
      // seguía guardando con él aunque no se viera). Escribir sin vaciarlo no lo quita, como
      // siempre: una tecla de más y su borrado no pueden dejar la tarea sin cliente ni CUPS
      if (this.formulario.clienteRelacionadoId && this.busquedaCliente.trim().length === 0) {
        this.formulario.clienteRelacionadoId = null
        this.formulario.cups = null
        this.puntosSuministroCliente = []
      }
      if (this.busquedaCliente.length === 0) {
        this.clientesFiltrados = []
        this.mostrarDropdownClientes = false
        return
      }

      // Mostrar dropdown al escribir
      this.mostrarDropdownClientes = true

      try {
        const data = await tareasApi.buscarClientes({ q: this.busquedaCliente, page: 0, size: 10 })
        if (peticion !== this.peticionClientes) return
        if (data) {
          this.clientesFiltrados = Array.isArray(data?.content) ? data.content : []
        } else {
          this.clientesFiltrados = []
        }

      } catch (error) {
        if (peticion !== this.peticionClientes) return
        console.error('Error buscando clientes:', error)
        this.clientesFiltrados = []
      }
    },

    onDragOver(event) {
      if (event?.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      this.dragActivo = true
    },

    onDragLeave(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragActivo = false
      }
    },

    onDrop(event) {
      this.dragActivo = false
      this.procesarArchivos(Array.from(event?.dataTransfer?.files || []))
    },

    onArchivosCrearSelected(event) {
      this.procesarArchivos(Array.from(event.target.files))
      event.target.value = ''
    },

    procesarArchivos(files) {
      if (!files || files.length === 0) return
      const MAX_SIZE = 10 * 1024 * 1024
      const nombresActuales = new Set(this.archivosACrear.map(f => f.name))
      const rechazados = []

      for (const file of files) {
        if (file.size > MAX_SIZE) {
          rechazados.push(`${file.name} (supera 10 MB)`)
          continue
        }
        if (nombresActuales.has(file.name)) continue
        this.archivosACrear.push(file)
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

    formatFileSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]
    },


    async cargarAdjuntosEdicion() {
      if (!this.esEdicion || !this.formulario.id) {
        this.adjuntosExistentes = []
        return
      }

      this.cargandoAdjuntosExistentes = true
      try {
        this.adjuntosExistentes = await tareasApi.obtenerAdjuntosTarea(this.formulario.id)
      } catch (error) {
        console.error('Error cargando adjuntos de tarea en edición:', error)
        this.adjuntosExistentes = []
      } finally {
        this.cargandoAdjuntosExistentes = false
      }
    },

    async descargarAdjuntoExistente(adjunto) {
      try {
        await tareasApi.descargarAdjunto(adjunto.id, adjunto.nombreArchivo)
      } catch (error) {
        console.error('Error descargando adjunto existente:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo descargar el adjunto'
        })
      }
    },

    async eliminarAdjuntoExistente(adjunto) {
      const confirmacion = await this.$swal.fire({
        title: '¿Eliminar adjunto?',
        text: adjunto.nombreArchivo,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar'
      })

      if (!confirmacion.isConfirmed) {
        return
      }

      this.eliminandoAdjuntoId = adjunto.id
      try {
        await tareasApi.eliminarAdjunto(adjunto.id)
        this.adjuntosExistentes = this.adjuntosExistentes.filter(a => a.id !== adjunto.id)
      } catch (error) {
        console.error('Error eliminando adjunto existente:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: textoError(error, 'No se pudo eliminar el adjunto')
        })
      } finally {
        this.eliminandoAdjuntoId = null
      }
    },

    seleccionarCliente(cliente) {
      this.formulario.clienteRelacionadoId = cliente.id
      this.busquedaCliente = cliente.nombre
      this.mostrarDropdownClientes = false
      // Resetear CUPS al cambiar de cliente y cargar sus puntos de suministro
      this.formulario.cups = null
      this.cargarPuntosSuministroCliente(cliente.id)
    },

    async cargarPuntosSuministroCliente(clienteId) {
      // Si se cambia de cliente rápido, los CUPS del anterior no pueden llegar después
      this.peticionCups = (this.peticionCups || 0) + 1
      const peticion = this.peticionCups
      if (!clienteId) {
        this.puntosSuministroCliente = []
        return
      }
      try {
        const data = await tareasApi.obtenerCarteraCupsCliente(clienteId)
        if (peticion !== this.peticionCups) return
        if (data) {
          // Construir lista con el CUPS luz y gas no vacíos
          const lista = []
          for (const ps of data) {
            if (ps.cupsluz?.trim()) lista.push({ cups: ps.cupsluz.trim(), direccion: ps.direccion || '' })
            if (ps.cupsgas?.trim()) lista.push({ cups: ps.cupsgas.trim(), direccion: ps.direccion || '' })
          }
          this.puntosSuministroCliente = lista
        } else {
          this.puntosSuministroCliente = []
        }
      } catch (e) {
        if (peticion !== this.peticionCups) return
        console.error('Error cargando puntos de suministro del cliente:', e)
        this.puntosSuministroCliente = []
      }
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

    usuarioActualId() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario.id ? parseInt(usuario.id) : null
    },

    guardar() {
      this.errores = {};

      // Validación de campos obligatorios
      if (!this.formulario.titulo || this.formulario.titulo.trim() === '') {
        this.errores.titulo = 'El título es obligatorio';
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
        fijada: Boolean(this.formulario.fijada),
        repetir: this.formulario.repetir || null,
        fechaInicio: this.formulario.fechaInicio,
        fechaVencimiento: this.formulario.fechaVencimiento,
        estadoId: this.formulario.estadoId || null,
        usuarioAsignadoId: this.formulario.usuarioAsignadoId || null,
        usuarioCreadorId: this.formulario.usuarioCreadorId || null,
        // Quién crea o edita (para no notificarle sus propios cambios)
        usuarioAccionId: this.usuarioActualId(),
        clienteRelacionadoId: this.formulario.clienteRelacionadoId || null,
        clientePotencialNombre: this.esPotencial ? (this.formulario.clientePotencialNombre || null) : null,
        cups: (!this.esPotencial && this.formulario.clienteRelacionadoId && this.formulario.cups) ? this.formulario.cups : null,
        categoriaId: this.formulario.categoriaId || null,
        subcategoriaId: this.formulario.subcategoriaId || null
      }


      this.$emit('guardar', tareaDTO, this.archivosACrear.slice())
    },

    cerrar() {
      // No cerrar si estamos seleccionando texto
      if (this.seleccionandoTexto) {
        this.seleccionandoTexto = false
        return
      }
      
      // Limpiar formulario al cerrar
      this.busquedaCliente = ''
      this.mostrarDropdownClientes = false
      this.clientesFiltrados = []
      this.puntosSuministroCliente = []
      this.esPotencial = false
      this.formulario.clientePotencialNombre = null
      this.formulario.cups = null
      this.archivosACrear = []
      this.adjuntosExistentes = []
      this.eliminandoAdjuntoId = null
      
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

<style scoped src="./TareaModalCorporativo.css"></style>
