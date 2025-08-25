<template>
  <div class="filtro-avanzado" :class="{ 'expandido': mostrarFiltros }">
    <button class="btn-toggle-filtros" @click="toggleFiltros">
      <i class="fas fa-filter"></i>
      <span>Filtros Avanzados</span>
      <i class="fas fa-chevron-down" :class="{ 'rotated': mostrarFiltros }"></i>
    </button>

    <div v-if="mostrarFiltros" class="filtros-contenido">
      <div class="filtros-grid">
        <!-- Filtros de estado -->
        <div class="filtro-section">
          <label>Estados</label>
          <div class="checkbox-group">
            <label v-for="estado in estados" :key="estado.id" class="checkbox-label">
              <input 
                type="checkbox" 
                :value="estado.id" 
                v-model="filtros.estadosSeleccionados"
                @change="aplicarFiltros"
              />
              <span class="checkmark" :style="{ backgroundColor: estado.color }"></span>
              {{ formatearEstadoNombre(estado.nombre) }}
            </label>
          </div>
        </div>

        <!-- Filtros de prioridad -->
        <div class="filtro-section">
          <label>Prioridades</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="1" 
                v-model="filtros.prioridadesSeleccionadas"
                @change="aplicarFiltros"
              />
              <span class="checkmark priority-alta"></span>
              Alta
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="2" 
                v-model="filtros.prioridadesSeleccionadas"
                @change="aplicarFiltros"
              />
              <span class="checkmark priority-media"></span>
              Media
            </label>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                value="3" 
                v-model="filtros.prioridadesSeleccionadas"
                @change="aplicarFiltros"
              />
              <span class="checkmark priority-baja"></span>
              Baja
            </label>
          </div>
        </div>

        <!-- Filtros de fecha -->
        <div class="filtro-section">
          <label>Rango de fechas</label>
          <div class="fecha-inputs">
            <div class="input-group">
              <label class="input-label">Desde:</label>
              <input 
                type="date" 
                v-model="filtros.fechaDesde" 
                @change="aplicarFiltros"
                class="form-control"
              />
            </div>
            <div class="input-group">
              <label class="input-label">Hasta:</label>
              <input 
                type="date" 
                v-model="filtros.fechaHasta" 
                @change="aplicarFiltros"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <!-- Filtros de etiquetas -->
        <div class="filtro-section">
          <label>Etiquetas</label>
          <input 
            type="text" 
            v-model="filtros.etiquetas" 
            @input="aplicarFiltros"
            class="form-control"
            placeholder="urgente, revisión, cliente..."
          />
        </div>
      </div>

      <div class="filtros-acciones">
        <button class="btn btn-secondary" @click="limpiarFiltros">
          <i class="fas fa-eraser"></i>
          Limpiar Filtros
        </button>
        <button class="btn btn-primary" @click="aplicarFiltros">
          <i class="fas fa-search"></i>
          Aplicar Filtros
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FiltroAvanzadoTareas',
  props: {
    estados: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      mostrarFiltros: false,
      filtros: {
        estadosSeleccionados: [],
        prioridadesSeleccionadas: [],
        fechaDesde: '',
        fechaHasta: '',
        etiquetas: ''
      }
    }
  },
  methods: {
    toggleFiltros() {
      this.mostrarFiltros = !this.mostrarFiltros
    },

    aplicarFiltros() {
      this.$emit('filtros-aplicados', { ...this.filtros })
    },

    limpiarFiltros() {
      this.filtros = {
        estadosSeleccionados: [],
        prioridadesSeleccionadas: [],
        fechaDesde: '',
        fechaHasta: '',
        etiquetas: ''
      }
      this.aplicarFiltros()
    },

    formatearEstadoNombre(nombre) {
      if (!nombre) return ''
      return nombre.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase())
    }
  }
}
</script>

<style scoped>
.filtro-avanzado {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-toggle-filtros {
  width: 100%;
  background: #f8f9fa;
  border: none;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
  color: #495057;
  transition: all 0.2s ease;
}

.btn-toggle-filtros:hover {
  background: #e9ecef;
}

.btn-toggle-filtros i.fa-chevron-down {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.btn-toggle-filtros i.fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.filtros-contenido {
  padding: 20px;
  border-top: 1px solid #e9ecef;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.filtro-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filtro-section > label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid #dee2e6;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  border-color: #4CAF50;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark:after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0px;
  width: 3px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.priority-alta {
  background-color: #F44336 !important;
  border-color: #F44336 !important;
}

.priority-media {
  background-color: #FF9800 !important;
  border-color: #FF9800 !important;
}

.priority-baja {
  background-color: #4CAF50 !important;
  border-color: #4CAF50 !important;
}

.fecha-inputs {
  display: flex;
  gap: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 500;
}

.form-control {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.filtros-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .filtros-grid {
    grid-template-columns: 1fr;
  }
  
  .fecha-inputs {
    flex-direction: column;
  }
  
  .filtros-acciones {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

