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
          <button class="btn-icon dropdown-toggle" @click="toggleDropdown" aria-label="Más acciones" aria-haspopup="true" :aria-expanded="showDropdown">
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

<style scoped src="./TareaCard.css"></style>
