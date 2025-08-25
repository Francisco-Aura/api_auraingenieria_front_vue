<template>
  <div class="tarea-card" :class="{ 'tarea-vencida': tarea.vencida }">
    <div class="tarea-header">
      <div class="tarea-info">
        <h3 class="tarea-titulo" @click="$emit('ver-detalle', tarea)">
          {{ tarea.titulo }}
        </h3>
        <p class="tarea-descripcion" v-if="tarea.descripcion">
          {{ tarea.descripcion.length > 100 ? tarea.descripcion.substring(0, 100) + '...' : tarea.descripcion }}
        </p>
      </div>
      
      <div class="tarea-acciones">
        <div class="dropdown">
          <button class="btn-icon dropdown-toggle" @click="toggleDropdown">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div class="dropdown-menu" v-if="showDropdown">
            <button class="dropdown-item" @click="$emit('ver-detalle', tarea)">
              <i class="fas fa-eye"></i>
              <span>Ver detalle</span>
            </button>
            <button class="dropdown-item" @click="$emit('actualizar', tarea)">
              <i class="fas fa-edit"></i>
              <span>Editar</span>
            </button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item text-danger" @click="$emit('eliminar', tarea.id)">
              <i class="fas fa-trash"></i>
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="tarea-metadata">
      <div class="metadata-row">
        <span class="badge" :class="getEstadoClass(tarea.estadoColor)">
          {{ tarea.estadoNombre }}
        </span>
        
        <span class="badge" :class="getPrioridadClass(tarea.prioridad)">
          <i class="fas" :class="getPrioridadIcon(tarea.prioridad)"></i>
          {{ tarea.prioridadTexto }}
        </span>
        
        <span v-if="tarea.vencida" class="badge badge-danger">
          <i class="fas fa-exclamation-triangle"></i>
          Vencida
        </span>
        
        <span v-else-if="tarea.diasParaVencimiento <= 3 && tarea.diasParaVencimiento >= 0" class="badge badge-warning">
          <i class="fas fa-clock"></i>
          {{ tarea.diasParaVencimiento }} días
        </span>
      </div>

      <div class="metadata-row">
        <div class="metadata-item">
          <i class="fas fa-user"></i>
          <span>{{ tarea.usuarioAsignadoNombre }}</span>
        </div>
        
        <div class="metadata-item" v-if="tarea.fechaVencimiento">
          <i class="fas fa-calendar"></i>
          <span>{{ formatearFecha(tarea.fechaVencimiento) }}</span>
        </div>
        
        <div class="metadata-item" v-if="tarea.tiempoEstimado">
          <i class="fas fa-clock"></i>
          <span>{{ formatearTiempo(tarea.tiempoEstimado) }}</span>
        </div>
      </div>

      <div class="metadata-row" v-if="tarea.clienteRelacionadoNombre || tarea.etiquetas">
        <div class="metadata-item" v-if="tarea.clienteRelacionadoNombre">
          <i class="fas fa-building"></i>
          <span>{{ tarea.clienteRelacionadoNombre }}</span>
        </div>
        
        <div class="etiquetas" v-if="tarea.etiquetas">
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

    <div class="tarea-footer">
      <div class="estados-rapidos">
        <button
          v-for="estado in estadosRapidos"
          :key="estado.id"
          :class="['btn', 'btn-sm', estado.id === tarea.estadoId ? 'btn-disabled' : 'btn-outline']"
          :disabled="estado.id === tarea.estadoId"
          @click="$emit('cambiar-estado', tarea.id, estado.id)"
        >
          {{ estado.nombre }}
        </button>
      </div>
      
      <div class="fecha-creacion">
        <small class="text-muted">
          Creada: {{ formatearFechaCorta(tarea.fechaCreacion) }}
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TareaCard',
  props: {
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
      showDropdown: false
    }
  },
  computed: {
    estadosRapidos() {
      // Mostrar solo los primeros 3 estados no finales para cambio rápido
      return this.estados
        .filter(e => !e.estadoFinal)
        .slice(0, 3)
    }
  },
  mounted() {
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
    },
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.showDropdown = false
      }
    },
    
    getEstadoClass(color) {
      return `badge-${color || 'primary'}`
    },
    
    getPrioridadClass(prioridad) {
      switch (prioridad) {
        case 1: return 'badge-danger'    // Alta - Rojo
        case 2: return 'badge-warning'   // Media - Naranja
        case 3: return 'badge-success'   // Baja - Verde
        default: return 'badge-primary'
      }
    },
    
    getPrioridadIcon(prioridad) {
      switch (prioridad) {
        case 1: return 'fa-arrow-up'
        case 2: return 'fa-minus'
        case 3: return 'fa-arrow-down'
        default: return 'fa-minus'
      }
    },
    
    formatearFecha(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    
    formatearFechaCorta(fecha) {
      if (!fecha) return ''
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
      })
    },
    
    formatearTiempo(minutos) {
      if (!minutos) return ''
      if (minutos < 60) {
        return `${minutos}min`
      }
      const horas = Math.floor(minutos / 60)
      const mins = minutos % 60
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
    },
    
    obtenerEtiquetas(etiquetas) {
      if (!etiquetas) return []
      return etiquetas.split(',').map(e => e.trim()).filter(e => e.length > 0)
    }
  }
}
</script>

<style scoped>
.tarea-card {
  background-color: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid var(--primary-color);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.tarea-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tarea-card.tarea-vencida {
  border-left-color: var(--danger-color);
  background-color: rgba(244, 67, 54, 0.02);
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.tarea-info {
  flex: 1;
}

.tarea-titulo {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  cursor: pointer;
  line-height: 1.3;
}

.tarea-titulo:hover {
  color: var(--primary-color);
}

.tarea-descripcion {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.tarea-acciones {
  margin-left: 1rem;
  flex-shrink: 0;
}

/* Dropdown */
.dropdown {
  position: relative;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 150px;
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.dropdown-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dropdown-item.text-danger {
  color: var(--danger-color);
}

.dropdown-item.text-danger:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 0.5rem 0;
}

.tarea-metadata {
  margin-bottom: 1rem;
}

.metadata-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.metadata-item i {
  font-size: 0.8rem;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-primary {
  background-color: var(--primary-color);
  color: black;
}

.badge-success {
  background-color: var(--success-color);
  color: white;
}

.badge-warning {
  background-color: var(--warning-color);
  color: white;
}

.badge-danger {
  background-color: var(--danger-color);
  color: white;
}

.badge-info {
  background-color: var(--info-color);
  color: white;
}

/* Etiquetas */
.etiquetas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.etiqueta {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.estados-rapidos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--primary-color);
  color: black;
}

.btn-disabled {
  background-color: var(--border-color);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  cursor: not-allowed;
}

.fecha-creacion {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.text-muted {
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .tarea-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .estados-rapidos {
    width: 100%;
  }
  
  .metadata-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }
}
</style>