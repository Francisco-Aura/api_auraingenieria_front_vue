<template>
  <Teleport to="body">
  <div v-if="value" class="modal-overlay" @mousedown="iniciarSeleccion" @mouseup="finalizarSeleccion">
    <div class="modal-content modal-tarea" @click.stop @input.stop @mousedown.stop @mouseup.stop @dragover.prevent @drop.prevent>
      <!-- Header del modal -->
      <div class="modal-header">
        <h2 class="modal-title">{{ esEdicion ? 'Editar tarea' : 'Crear tarea' }}</h2>
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
                  @input="buscarClientes"
                  @focus="mostrarDropdownClientes = true"
                  class="form-control"
                  placeholder="Escribe el nombre del cliente..."
                />
                
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
                :class="{ 'drag-activo': dragActivo }"
                @dragover.prevent="onDragOver"
                @dragleave="onDragLeave"
                @drop.prevent="onDrop"
              >
                <input
                  type="file"
                  ref="fileInputCrear"
                  multiple
                  style="display:none"
                  @change="onArchivosCrearSelected"
                />
                <div class="drop-zone-hint">
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
import tareasApi from '@/services/tareasApi'

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
      oportunidadesFiltradas: [],
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
  },
  methods: {
    inicializarFormulario() {

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
        
        // Formatear fechas para los inputs
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
        
        // Fechas por defecto
        const hoy = new Date()
        this.fechaInicio = hoy.toISOString().split('T')[0]
        this.fechaVencimiento = hoy.toISOString().split('T')[0]
        this.horaInicio = '09:00'
        this.horaVencimiento = '18:00'
        
        // Limpiar cliente
        this.busquedaCliente = ''
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
        this.puntosSuministroCliente = []
        this.esPotencial = false
        this.formulario.clientePotencialNombre = null
        this.formulario.cups = null
        this.archivosACrear = []
        this.adjuntosExistentes = []
      }
      
    },

    async buscarClientes() {
      if (this.busquedaCliente.length === 0) {
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
        this.mostrarDropdownClientes = false
        return
      }

      // Mostrar dropdown al escribir
      this.mostrarDropdownClientes = true

      try {
        const base = `${process.env.VUE_APP_API_URL || 'http://localhost:8986'}`
        const params = new URLSearchParams({ 
          q: this.busquedaCliente, 
          page: '0', 
          size: '10' 
        })
        
        const responseClientes = await fetch(`${base}/api/clientes/buscar?${params.toString()}`)
        if (responseClientes.ok) {
          const clientes = await responseClientes.json()
          this.clientesFiltrados = Array.isArray(clientes?.content) ? clientes.content : []
        } else {
          this.clientesFiltrados = []
        }

        // Filtrar oportunidades localmente mientras escribes
        const oportunidadesCompletas = [
          { id: 1, codigo: '185', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' },
          { id: 2, codigo: '249', nombre: 'SOL DE LEVANTE PRODUCCIONES S.L' }
        ]
        
        this.oportunidadesFiltradas = oportunidadesCompletas.filter(o => 
          o.nombre.toLowerCase().includes(this.busquedaCliente.toLowerCase()) ||
          o.codigo.toLowerCase().includes(this.busquedaCliente.toLowerCase())
        )

      } catch (error) {
        console.error('Error buscando clientes:', error)
        this.clientesFiltrados = []
        this.oportunidadesFiltradas = []
      }
    },

    onDragOver() {
      this.dragActivo = true
    },

    onDragLeave(event) {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragActivo = false
      }
    },

    onDrop(event) {
      this.dragActivo = false
      this.procesarArchivos(Array.from(event.dataTransfer.files))
    },

    onArchivosCrearSelected(event) {
      this.procesarArchivos(Array.from(event.target.files))
      event.target.value = ''
    },

    procesarArchivos(files) {
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
        cancelButtonColor: '#6c757d',
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
          text: 'No se pudo eliminar el adjunto'
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
      if (!clienteId) {
        this.puntosSuministroCliente = []
        return
      }
      try {
        const base = process.env.VUE_APP_API_URL || 'http://localhost:8986'
        const res = await fetch(`${base}/api/puntos-suministro/cliente/${clienteId}/cartera`)
        if (res.ok) {
          const data = await res.json()
          // Construir lista con el CUPS luz y gas no vacíos
          const lista = []
          for (const ps of data) {
            if (ps.cupsluz) lista.push({ cups: ps.cupsluz, direccion: ps.direccion || '' })
            if (ps.cupsgas) lista.push({ cups: ps.cupsgas, direccion: ps.direccion || '' })
          }
          this.puntosSuministroCliente = lista
        } else {
          this.puntosSuministroCliente = []
        }
      } catch (e) {
        console.error('Error cargando puntos de suministro del cliente:', e)
        this.puntosSuministroCliente = []
      }
    },

    seleccionarOportunidad(oportunidad) {
      this.busquedaCliente = `${oportunidad.codigo} - ${oportunidad.nombre}`
      this.mostrarDropdownClientes = false
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

    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toLocaleDateString('es-ES')
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
        repetir: this.formulario.repetir || null,
        fechaInicio: this.formulario.fechaInicio,
        fechaVencimiento: this.formulario.fechaVencimiento,
        estadoId: this.formulario.estadoId || null,
        usuarioAsignadoId: this.formulario.usuarioAsignadoId || null,
        usuarioCreadorId: this.formulario.usuarioCreadorId || null,
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
      this.oportunidadesFiltradas = []
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

<style scoped>
/* Overlay y contenedor principal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
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
  height: 80%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
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

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Formulario compacto con filas */
.form-compact {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Filas del formulario */
.row-1, .row-2, .row-3 {
  display: grid;
  gap: 16px;
  align-items: start;
}

.row-1 {
  grid-template-columns: 1fr 2fr;
}

.row-2 {
  grid-template-columns: repeat(4, 1fr);
}

.row-3 {
  grid-template-columns: repeat(4, 1fr);
}

.row-cups {
  display: flex;
}

.row-4, .row-5 {
  display: flex;
}

.cliente-field {
  position: relative;
}

.cliente-tipo-toggle {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.btn-tipo {
  flex: 1;
  padding: 4px 8px;
  font-size: 0.78rem;
  border: 1px solid #cbd5e0;
  background: #f7fafc;
  border-radius: 6px;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.15s;
}

.btn-tipo.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
  font-weight: 600;
}

.hint-text {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
  color: #718096;
}

.adjuntos-existentes-wrapper {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #cbd5e0;
}

.adjuntos-existentes-header {
  font-size: 0.78rem;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 4px;
}

.adjuntos-loading,
.adjuntos-vacio {
  font-size: 0.8rem;
  color: #718096;
}

.adjunto-nombre-existente {
  cursor: pointer;
  color: #4c51bf;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.adjuntos-drop-zone {
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s;
}

.adjuntos-drop-zone.drag-activo {
  border-color: #667eea;
  background: #eef2ff;
}

.drop-zone-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drop-zone-icon {
  font-size: 1.3rem;
  color: #a0aec0;
  transition: color 0.15s;
}

.drag-activo .drop-zone-icon {
  color: #667eea;
}

.drop-zone-text {
  font-size: 0.82rem;
  color: #718096;
}

.drop-zone-limit {
  font-size: 0.75rem;
  color: #a0aec0;
  margin-left: auto;
}

.btn-adjuntar-crear {
  padding: 4px 12px;
  background: #f0f4ff;
  border: 1px solid #667eea;
  border-radius: 6px;
  color: #667eea;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-adjuntar-crear:hover {
  background: #e0e7ff;
}

.adjuntos-lista-crear {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.adjuntos-lista-crear li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #2d3748;
  background: #f7fafc;
  padding: 3px 8px;
  border-radius: 4px;
}

.adjunto-nombre {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adjunto-size {
  font-size: 0.75rem;
  color: #718096;
  white-space: nowrap;
}

.btn-remove-adjunto {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 0 2px;
  font-size: 0.8rem;
  margin-left: auto;
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
  gap: 8px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.form-group label i {
  color: #333;
  font-size: 0.85rem;
}

.required {
  color: #dc3545;
}

/* Validación de errores */
.input-error,
.input-error:focus {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15) !important;
}
.error-text {
  display: block;
  color: #e74c3c;
  font-size: 0.72rem;
  margin-top: 2px;
  line-height: 1.2;
}

/* Controles de formulario */
.form-control {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  background: #fafafa;
  box-sizing: border-box;
  font-weight: 500;
  height: 40px;
  display: flex;
  align-items: center;
}

.form-control:hover {
  border-color: #d0d0d0;
  background: #fff;
}

.form-control:focus {
  outline: none;
  border-color: #FCD700;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(252, 215, 0, 0.15);
}

textarea.form-control {
  resize: vertical;
  height: auto;
  min-height: 70px;
  font-family: inherit;
}

.prioridad-select {
  font-weight: 600;
  transition: all 0.3s ease;
  appearance: none;
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
  padding-right: 32px;
}

.prioridad-select option {
  padding: 8px;
  font-weight: 600;
  background: white;
  color: #333;
}

/* Colores dinámicos del select según la prioridad seleccionada */
.prioridad-selected-3 {
  background-color: #d4edda !important;
  color: #155724 !important;
  border-color: #28a745 !important;
}

.prioridad-selected-3:hover,
.prioridad-selected-3:focus {
  background-color: #c3e6cb !important;
  color: #155724 !important;
}

.prioridad-selected-2 {
  background-color: #fff3cd !important;
  color: #856404 !important;
  border-color: #ffc107 !important;
}

.prioridad-selected-2:hover,
.prioridad-selected-2:focus {
  background-color: #ffeeba !important;
  color: #856404 !important;
}

.prioridad-selected-1 {
  background-color: #f8d7da !important;
  color: #721c24 !important;
  border-color: #dc3545 !important;
}

.prioridad-selected-1:hover,
.prioridad-selected-1:focus {
  background-color: #f5c6cb !important;
  color: #721c24 !important;
}

.prioridad-selected-0 {
  background-color: #8b0000 !important;
  color: white !important;
  border-color: #5c0000 !important;
}

.prioridad-selected-0:hover,
.prioridad-selected-0:focus {
  background-color: #a52a2a !important;
  color: white !important;
}

/* Input con icon */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon i {
  position: absolute;
  left: 12px;
  color: #333;
  font-size: 0.9rem;
  pointer-events: none;
}

.input-with-icon .form-control {
  padding-left: 38px;
  width: 100%;
}

/* Input especial para cliente */
.cliente-input-wrapper {
  position: relative;
}

.cliente-arrow {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #FCD700;
  font-size: 1.2rem;
  font-weight: bold;
  animation: arrowPulse 2s ease-in-out infinite;
  z-index: 5;
}

@keyframes arrowPulse {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-50%) translateX(4px);
    opacity: 0.7;
  }
}

.cliente-input-wrapper .form-control {
  padding-left: 38px;
}

/* Fechas compactas */
.datetime-compact {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-input {
  flex: 1.5;
  min-width: 120px;
}

.time-input {
  flex: 0.8;
  min-width: 85px;
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
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-color);
}

.checkbox-compact label {
  margin: 0;
  cursor: pointer;
  font-size: 0.8rem;
  color: #333;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Dropdown de clientes */
.dropdown-clientes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #FCD700;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 4px;
}

.dropdown-section {
  padding: 6px 0;
}

.dropdown-header {
  padding: 8px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #FCD700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  border-bottom: 2px solid #FCD700;
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #333;
  border-bottom: 1px solid #f8f9fa;
  font-weight: 500;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, rgba(252, 215, 0, 0.15) 0%, rgba(252, 215, 0, 0.08) 100%);
  color: #333;
  padding-left: 16px;
  font-weight: 600;
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
  color: black;
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

.archivos-selector-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.archivos-count {
  font-size: 0.7rem;
  color: #6c757d;
  font-style: italic;
}

.btn-guardar-comentario {
  background: rgb(252, 215, 0);
  color: black;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
}

.btn-guardar-comentario:hover:not(:disabled) {
  background: #ffd700;
}

.btn-guardar-comentario:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comentario-adjuntos-mini {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #e9ecef;
  font-size: 0.65rem;
}

.adjunto-mini {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
  padding: 2px 0;
}

.adjunto-nombre-clickable {
  cursor: pointer;
  color: rgb(252, 215, 0);
  text-decoration: underline;
}

.adjunto-nombre-clickable:hover {
  color: #ffd700;
}

.adjunto-size {
  color: #adb5bd;
  font-size: 0.6rem;
}

/* Footer */
.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
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
@media (max-width: 1024px) {
  .modal-content { 
    max-width: 95vw; 
  }
  .row-1 {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .row-2 {
    grid-template-columns: 1fr 1fr;
  }
  .row-3 {
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
