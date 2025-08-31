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
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-toggle-filtros {
  width: 100%;
  background: linear-gradient(135deg, white, white);
  border: none;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  color: black;
  transition: all 0.2s ease;
  font-size: 0.85rem;
}

.btn-toggle-filtros:hover {
  transform: translateY(-2px);
}

.btn-toggle-filtros i.fa-chevron-down {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.btn-toggle-filtros i.fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.filtros-contenido {
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.filtro-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filtro-section > label {
  font-weight: 600;
  color: black;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #495057;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(252, 215, 0, 0.1);
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 14px;
  height: 14px;
  border: 2px solid #dee2e6;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  border-color: rgb(252, 215, 0);
  background: rgb(252, 215, 0);
}

.checkbox-label input[type="checkbox"]:checked + .checkmark:after {
  content: '';
  position: absolute;
  left: 2px;
  top: -1px;
  width: 2px;
  height: 6px;
  border: solid black;
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
  gap: 6px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.input-label {
  font-size: 0.65rem;
  color: #6c757d;
  font-weight: 500;
}

.form-control {
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: rgb(252, 215, 0);
  box-shadow: 0 0 0 2px rgba(252, 215, 0, 0.15);
}

.filtros-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}

.btn-primary {
  background: rgb(252, 215, 0);
  color: black;
}

.btn-primary:hover {
  background: var(--primary-color);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
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

