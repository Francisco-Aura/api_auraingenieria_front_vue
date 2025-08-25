<template>
  <transition name="drawer">
    <div v-if="visible" class="drawer-overlay" @click="cerrar">
      <div class="drawer-container" @click.stop>
        <!-- Header del drawer -->
        <div class="drawer-header">
          <div class="cliente-info">
            <h2>{{ cliente.nombre }}</h2>
            <span class="cliente-nif">NIF: {{ cliente.cif }}</span>
          </div>
          <button class="btn-cerrar" @click="cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Tabs de navegación -->
        <div class="drawer-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-button"
            :class="{ active: tabActiva === tab.id }"
            @click="tabActiva = tab.id">
            {{ tab.label }}
          </button>
        </div>

        <!-- Contenido de las tabs -->
        <div class="drawer-content">
          <!-- Tab Actividad -->
          <div v-if="tabActiva === 'actividad'" class="tab-content">
            <div class="actividad-header">
              <h3>Actividad reciente</h3>
              <button class="btn-filtro">
                <i class="fas fa-filter"></i>
              </button>
            </div>

            <div class="timeline">
              <div v-for="actividad in actividades" :key="actividad.id" class="timeline-item">
                <div class="timeline-marker" :class="`tipo-${actividad.tipo}`">
                  <i :class="getIconoActividad(actividad.tipo)"></i>
                </div>
                <div class="timeline-content">
                  <div class="actividad-header">
                    <span class="actividad-tipo">{{ actividad.tipo }}</span>
                    <span class="actividad-fecha">{{ formatDate(actividad.fecha) }}</span>
                  </div>
                  <h4 class="actividad-titulo">{{ actividad.titulo }}</h4>
                  <p class="actividad-descripcion">{{ actividad.descripcion }}</p>
                  <div class="actividad-usuario">
                    <i class="fas fa-user-circle"></i>
                    {{ actividad.usuarioNombre || 'Sistema' }}
                  </div>
                  <div v-if="actividad.tareaRelacionadaId" class="actividad-relacionada">
                    <i class="fas fa-link"></i>
                    <span>Relacionada con tarea: {{ actividad.tareaRelacionadaTitulo }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Notas -->
          <div v-if="tabActiva === 'notas'" class="tab-content">
            <div class="notas-header">
              <h3>Notas</h3>
              <button class="btn-nueva-nota" @click="mostrarFormularioNota = true">
                <i class="fas fa-plus"></i>
                Nueva nota
              </button>
            </div>

            <div v-if="mostrarFormularioNota" class="formulario-nota">
              <textarea 
                v-model="nuevaNota" 
                class="form-control"
                rows="4"
                placeholder="Escribe una nota..."
              ></textarea>
              <div class="formulario-acciones">
                <button class="btn btn-secondary" @click="cancelarNota">Cancelar</button>
                <button class="btn btn-primary" @click="guardarNota">Guardar</button>
              </div>
            </div>

            <div class="notas-lista">
              <div v-for="nota in notas" :key="nota.id" class="nota-item">
                <div class="nota-header">
                  <span class="nota-fecha">{{ formatDate(nota.fecha) }}</span>
                  <button class="btn-editar-nota" @click="editarNota(nota)">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
                <p class="nota-contenido">{{ nota.contenido }}</p>
                <div class="nota-autor">
                  <i class="fas fa-user-circle"></i>
                  {{ nota.autor }}
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Tareas -->
          <div v-if="tabActiva === 'tareas'" class="tab-content">
            <div class="tareas-header">
              <h3>Tareas</h3>
              <div class="tareas-filtros">
                <button 
                  class="filtro-chip"
                  :class="{ active: filtroTareas === 'todas' }"
                  @click="filtroTareas = 'todas'">
                  Todas ({{ tareas.length }})
                </button>
                <button 
                  class="filtro-chip"
                  :class="{ active: filtroTareas === 'pendientes' }"
                  @click="filtroTareas = 'pendientes'">
                  Pendientes ({{ tareasPendientes.length }})
                </button>
                <button 
                  class="filtro-chip"
                  :class="{ active: filtroTareas === 'completadas' }"
                  @click="filtroTareas = 'completadas'">
                  Completadas ({{ tareasCompletadas.length }})
                </button>
              </div>
            </div>

            <button class="btn-nueva-tarea" @click="crearNuevaTarea">
              <i class="fas fa-plus"></i>
              Nueva tarea
            </button>

            <div class="tareas-lista">
              <div 
                v-for="tarea in tareasFiltradas" 
                :key="tarea.id" 
                class="tarea-card"
                :class="{ 'tarea-completada': tarea.estadoNombre === 'COMPLETADA' }"
                @click="$emit('ver-tarea', tarea)">
                
                <div class="tarea-header">
                  <span class="tarea-estado" :style="{ backgroundColor: tarea.estadoColor }">
                    {{ tarea.estadoNombre }}
                  </span>
                  <span class="tarea-fecha">
                    <i class="fas fa-calendar"></i>
                    {{ formatDate(tarea.fechaVencimiento) }}
                  </span>
                </div>
                
                <h4 class="tarea-titulo">
                  <span v-if="tarea.tipo" class="tarea-tipo-icon">{{ getTipoIcon(tarea.tipo) }}</span>
                  {{ tarea.titulo }}
                </h4>
                
                <p class="tarea-descripcion">{{ tarea.descripcion }}</p>
                
                <div class="tarea-footer">
                  <span class="tarea-prioridad" :class="`prioridad-${tarea.prioridad}`">
                    {{ getPrioridadText(tarea.prioridad) }}
                  </span>
                  <span class="tarea-asignado">
                    <i class="fas fa-user-circle"></i>
                    {{ tarea.usuarioAsignadoNombre }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab Incidencias -->
          <div v-if="tabActiva === 'incidencias'" class="tab-content">
            <div class="incidencias-header">
              <h3>Incidencias</h3>
              <button class="btn-nueva-incidencia" @click="$emit('nueva-incidencia', cliente)">
                <i class="fas fa-plus"></i>
                Nueva incidencia
              </button>
            </div>

            <div class="incidencias-lista">
              <div v-for="incidencia in incidencias" :key="incidencia.id" class="incidencia-item">
                <div class="incidencia-header">
                  <span class="incidencia-tipo" :class="`tipo-${incidencia.tipo}`">
                    {{ incidencia.tipo }}
                  </span>
                  <span class="incidencia-fecha">{{ formatDate(incidencia.fecha) }}</span>
                </div>
                <h4 class="incidencia-titulo">{{ incidencia.titulo }}</h4>
                <p class="incidencia-descripcion">{{ incidencia.descripcion }}</p>
                <div class="incidencia-estado">
                  <span :class="incidencia.resuelta ? 'estado-resuelta' : 'estado-pendiente'">
                    {{ incidencia.resuelta ? 'Resuelta' : 'Pendiente' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'ClienteActividadDrawer',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    cliente: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      tabActiva: 'actividad',
      tabs: [
        { id: 'actividad', label: 'Actividad' },
        { id: 'notas', label: 'Notas' },
        { id: 'tareas', label: 'Tareas' },
        { id: 'incidencias', label: 'Incidencias' }
      ],
      actividades: [],
      notas: [],
      tareas: [],
      incidencias: [],
      filtroTareas: 'todas',
      mostrarFormularioNota: false,
      nuevaNota: ''
    }
  },
  computed: {
    tareasPendientes() {
      return this.tareas.filter(t => t.estadoNombre !== 'COMPLETADA' && t.estadoNombre !== 'CANCELADA')
    },
    tareasCompletadas() {
      return this.tareas.filter(t => t.estadoNombre === 'COMPLETADA')
    },
    tareasFiltradas() {
      if (this.filtroTareas === 'pendientes') {
        return this.tareasPendientes
      } else if (this.filtroTareas === 'completadas') {
        return this.tareasCompletadas
      }
      return this.tareas
    }
  },
  watch: {
    visible(val) {
      if (val && this.cliente) {
        this.cargarDatos()
      }
    },
    cliente() {
      if (this.visible) {
        this.cargarDatos()
      }
    }
  },
  methods: {
    async cargarDatos() {
      await Promise.all([
        this.cargarActividades(),
        this.cargarNotas(),
        this.cargarTareas(),
        this.cargarIncidencias()
      ])
    },

    async cargarActividades() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8986'}/api/actividades-cliente/cliente/${this.cliente.idCliente}`)
        if (response.ok) {
          this.actividades = await response.json()
        } else {
          console.error('Error cargando actividades:', response.statusText)
          this.actividades = []
        }
      } catch (error) {
        console.error('Error cargando actividades:', error)
        this.actividades = []
      }
    },

    async cargarNotas() {
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8986'}/api/actividades-cliente/cliente/${this.cliente.idCliente}/tipo/nota`)
        if (response.ok) {
          const actividades = await response.json()
          this.notas = actividades.map(actividad => ({
            id: actividad.id,
            contenido: actividad.descripcion,
            fecha: actividad.fecha,
            autor: actividad.usuarioNombre || 'Sistema'
          }))
        } else {
          console.error('Error cargando notas:', response.statusText)
          this.notas = []
        }
      } catch (error) {
        console.error('Error cargando notas:', error)
        this.notas = []
      }
    },

    async cargarTareas() {
      try {
        this.tareas = await tareasApi.obtenerTareasPorCliente(this.cliente.idCliente)
      } catch (error) {
        console.error('Error cargando tareas:', error)
        this.tareas = []
      }
    },

    async cargarIncidencias() {
      // Simular carga de incidencias
      this.incidencias = [
        {
          id: 1,
          tipo: 'técnica',
          titulo: 'Problema con la facturación',
          descripcion: 'El cliente reporta un error en el cálculo del último recibo',
          fecha: new Date(),
          resuelta: false
        }
      ]
    },

    async guardarNota() {
      if (this.nuevaNota.trim()) {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        
        try {
          const actividadData = {
            clienteId: this.cliente.idCliente,
            usuarioId: parseInt(usuario.id),
            tipo: 'nota',
            titulo: 'Nueva nota',
            descripcion: this.nuevaNota.trim()
          }
          
          const response = await fetch(`${process.env.VUE_APP_API_URL || 'http://localhost:8986'}/api/actividades-cliente`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(actividadData)
          })
          
          if (response.ok) {
            this.nuevaNota = ''
            this.mostrarFormularioNota = false
            await this.cargarNotas() // Recargar las notas
          } else {
            console.error('Error guardando nota:', response.statusText)
          }
        } catch (error) {
          console.error('Error guardando nota:', error)
        }
      }
    },

    cancelarNota() {
      this.nuevaNota = ''
      this.mostrarFormularioNota = false
    },

    editarNota(nota) {
      // Implementar edición de nota
      console.log('Editar nota:', nota)
    },

    getIconoActividad(tipo) {
      const iconos = {
        'llamada': 'fas fa-phone',
        'correo': 'fas fa-envelope',
        'reunion': 'fas fa-users',
        'visita': 'fas fa-building',
        'tarea': 'fas fa-tasks'
      }
      return iconos[tipo] || 'fas fa-circle'
    },

    getTipoIcon(tipo) {
      const iconos = {
        'Llamada': '📞',
        'Correo': '✉️',
        'Reunión': '👥',
        'Visita': '🏢',
        'Por hacer': '📋',
        'Seguimiento': '🔄'
      }
      return iconos[tipo] || '📋'
    },

    getPrioridadText(prioridad) {
      const textos = {
        1: '🔴 Alta',
        2: '🟡 Media',
        3: '🟢 Baja'
      }
      return textos[prioridad] || '🟡 Media'
    },

    formatDate(date) {
      if (!date) return '-'
      const d = new Date(date)
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      })
    },

    crearNuevaTarea() {
      this.$emit('nueva-tarea', this.cliente)
    },

    verTarea(tarea) {
      this.$emit('ver-tarea', tarea)
    },

    cerrar() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.drawer-container {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 500px;
  background: white;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.cliente-info h2 {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
}

.cliente-nif {
  font-size: 0.875rem;
  opacity: 0.9;
}

.btn-cerrar {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.drawer-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  background: rgba(102, 126, 234, 0.05);
}

.tab-button.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: white;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  background: white;
}

.tab-content {
  padding: 20px;
}

/* Timeline de actividad */
.actividad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actividad-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2c3e50;
}

.btn-filtro {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #6c757d;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
}

.timeline-marker {
  position: absolute;
  left: -30px;
  width: 32px;
  height: 32px;
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 0.875rem;
}

.timeline-marker.tipo-llamada {
  border-color: #ffc107;
  color: #ffc107;
}

.timeline-marker.tipo-correo {
  border-color: #17a2b8;
  color: #17a2b8;
}

.timeline-content {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
}

.timeline-content .actividad-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.actividad-tipo {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6c757d;
}

.actividad-fecha {
  font-size: 0.75rem;
  color: #adb5bd;
}

.actividad-titulo {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
}

.actividad-descripcion {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.5;
}

.actividad-usuario {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6c757d;
}

.actividad-relacionada {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #667eea;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
}

.actividad-relacionada i {
  color: #667eea;
}

/* Notas */
.notas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notas-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2c3e50;
}

.btn-nueva-nota {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.formulario-nota {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.formulario-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.nota-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.nota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nota-fecha {
  font-size: 0.75rem;
  color: #6c757d;
}

.btn-editar-nota {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
}

.nota-contenido {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.5;
}

.nota-autor {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6c757d;
}

/* Tareas */
.tareas-header {
  margin-bottom: 16px;
}

.tareas-header h3 {
  margin: 0 0 12px 0;
  font-size: 1.125rem;
  color: #2c3e50;
}

.tareas-filtros {
  display: flex;
  gap: 8px;
}

.filtro-chip {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #6c757d;
  transition: all 0.2s ease;
}

.filtro-chip:hover {
  background: #f8f9fa;
}

.filtro-chip.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-nueva-tarea {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.btn-nueva-tarea:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tarea-card {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tarea-card:hover {
  background: #e9ecef;
  transform: translateX(-4px);
}

.tarea-card.tarea-completada {
  opacity: 0.7;
}

.tarea-card .tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tarea-estado {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.tarea-fecha {
  font-size: 0.75rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tarea-card .tarea-titulo {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tarea-tipo-icon {
  font-size: 1rem;
}

.tarea-card .tarea-descripcion {
  margin: 0 0 8px 0;
  font-size: 0.75rem;
  color: #6c757d;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.tarea-prioridad {
  font-weight: 500;
}

.prioridad-1 { color: #dc3545; }
.prioridad-2 { color: #ffc107; }
.prioridad-3 { color: #28a745; }

.tarea-asignado {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
}

/* Incidencias */
.incidencias-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.incidencias-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #2c3e50;
}

.btn-nueva-incidencia {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.incidencia-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 3px solid #dc3545;
}

.incidencia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.incidencia-tipo {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  background: #dc3545;
  color: white;
}

.incidencia-fecha {
  font-size: 0.75rem;
  color: #6c757d;
}

.incidencia-titulo {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
}

.incidencia-descripcion {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.5;
}

.incidencia-estado {
  font-size: 0.75rem;
}

.estado-resuelta {
  color: #28a745;
  font-weight: 600;
}

.estado-pendiente {
  color: #dc3545;
  font-weight: 600;
}

/* Botones generales */
.btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: white;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.btn-secondary:hover {
  background: #f8f9fa;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

/* Transiciones */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer-container,
.drawer-leave-active .drawer-container {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-container,
.drawer-leave-to .drawer-container {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .drawer-container {
    width: 100%;
  }
}
</style>




