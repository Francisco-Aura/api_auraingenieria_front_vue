<template>
  <div class="calendario-container">
    <!-- Cabecera del calendario -->
    <div class="calendario-header">
      <button class="btn-nav" @click="mesAnterior">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <h2 class="mes-actual">
        {{ nombreMes }} {{ año }}
      </h2>
      
      <button class="btn-nav" @click="mesSiguiente">
        <i class="fas fa-chevron-right"></i>
      </button>

      <div class="vista-selector">
        <button class="btn-vista" :class="{ active: vista === 'mes' }" @click="vista = 'mes'">
          Mes
        </button>
        <button class="btn-vista" :class="{ active: vista === 'semana' }" @click="vista = 'semana'">
          Semana
        </button>
        <button class="btn-vista" :class="{ active: vista === 'hoy' }" @click="irAHoy">
          Hoy
        </button>
      </div>
    </div>

    <!-- Días de la semana -->
    <div class="dias-semana">
      <div class="dia-semana" v-for="dia in diasSemana" :key="dia">
        {{ dia }}
      </div>
    </div>

    <!-- Grid del calendario -->
    <div class="calendario-grid">
      <div 
        v-for="(dia, index) in diasDelMes" 
        :key="index"
        class="dia-celda"
        :class="{
          'dia-otro-mes': !dia.esMesActual,
          'dia-hoy': esHoy(dia.fecha),
          'dia-fin-semana': esFindeSemana(dia.fecha)
        }"
        @click="seleccionarDia(dia)">
        
        <div class="dia-numero">{{ dia.numero }}</div>
        
        <div class="tareas-dia">
          <div 
            v-for="tarea in obtenerTareasDia(dia.fecha)" 
            :key="tarea.id"
            class="tarea-item"
            :style="{ backgroundColor: tarea.estadoColor || 'rgb(252, 215, 0)' }"
            @click.stop="verDetalleTarea(tarea)">
            <span class="tarea-hora">{{ formatHora(tarea.fechaVencimiento) }}</span>
            <span class="tarea-titulo">{{ tarea.titulo }}</span>
          </div>
          
          <div v-if="obtenerTareasDia(dia.fecha).length > 3" class="mas-tareas">
            +{{ obtenerTareasDia(dia.fecha).length - 3 }} más
          </div>
        </div>
      </div>
    </div>

    <!-- Panel lateral de día seleccionado -->
    <transition name="slide">
      <div v-if="diaSeleccionado" class="panel-dia">
        <div class="panel-header">
          <h3>{{ formatFechaCompleta(diaSeleccionado.fecha) }}</h3>
          <button class="btn-cerrar" @click="diaSeleccionado = null">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="panel-content">
          <button class="btn btn-primary btn-nueva-tarea" @click="nuevaTareaEnDia">
            <i class="fas fa-plus"></i>
            Nueva tarea para este día
          </button>
          
          <div class="tareas-lista">
            <h4>Tareas del día ({{ obtenerTareasDia(diaSeleccionado.fecha).length }})</h4>
            
            <div v-if="obtenerTareasDia(diaSeleccionado.fecha).length === 0" class="sin-tareas">
              No hay tareas programadas para este día
            </div>
            
            <div 
              v-for="tarea in obtenerTareasDia(diaSeleccionado.fecha)" 
              :key="tarea.id"
              class="tarea-detalle"
              @click="verDetalleTarea(tarea)">
              
              <div class="tarea-header">
                <span class="tarea-tipo-badge" :style="{ backgroundColor: tarea.estadoColor || 'rgb(252, 215, 0)' }">
                  {{ tarea.estadoNombre }}
                </span>
                <span class="tarea-prioridad" :class="`prioridad-${tarea.prioridad}`">
                  {{ getPrioridadIcon(tarea.prioridad) }}
                </span>
              </div>
              
              <h5 class="tarea-titulo">{{ tarea.titulo }}</h5>
              
              <div class="tarea-info">
                <span v-if="tarea.clienteRelacionadoNombre">
                  <i class="fas fa-user"></i> {{ tarea.clienteRelacionadoNombre }}
                </span>
                <span>
                  <i class="fas fa-clock"></i> {{ formatHora(tarea.fechaVencimiento) || 'Todo el día' }}
                </span>
              </div>
              
              <p class="tarea-descripcion">{{ tarea.descripcion }}</p>
              
              <div class="tarea-footer">
                <span class="asignado-a">
                  <i class="fas fa-user-circle"></i> {{ tarea.usuarioAsignadoNombre }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'TareasCalendarioView',
  props: {
    tareas: {
      type: Array,
      required: true
    },
    estados: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      fechaActual: new Date(),
      vista: 'mes',
      diaSeleccionado: null,
      diasSemana: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    }
  },
  computed: {
    año() {
      return this.fechaActual.getFullYear()
    },
    mes() {
      return this.fechaActual.getMonth()
    },
    nombreMes() {
      const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      return meses[this.mes]
    },
    diasDelMes() {
      const dias = []
      const primerDia = new Date(this.año, this.mes, 1)
      const ultimoDia = new Date(this.año, this.mes + 1, 0)
      
      // Ajustar para que la semana empiece en lunes
      let diaSemana = primerDia.getDay()
      if (diaSemana === 0) diaSemana = 7
      
      // Días del mes anterior
      const diasMesAnterior = diaSemana - 1
      for (let i = diasMesAnterior; i > 0; i--) {
        const fecha = new Date(this.año, this.mes, 1 - i)
        dias.push({
          numero: fecha.getDate(),
          fecha: fecha,
          esMesActual: false
        })
      }
      
      // Días del mes actual
      for (let i = 1; i <= ultimoDia.getDate(); i++) {
        const fecha = new Date(this.año, this.mes, i)
        dias.push({
          numero: i,
          fecha: fecha,
          esMesActual: true
        })
      }
      
      // Días del mes siguiente
      const diasRestantes = 42 - dias.length
      for (let i = 1; i <= diasRestantes; i++) {
        const fecha = new Date(this.año, this.mes + 1, i)
        dias.push({
          numero: i,
          fecha: fecha,
          esMesActual: false
        })
      }
      
      return dias
    }
  },
  methods: {
    mesAnterior() {
      this.fechaActual = new Date(this.año, this.mes - 1, 1)
    },
    mesSiguiente() {
      this.fechaActual = new Date(this.año, this.mes + 1, 1)
    },
    irAHoy() {
      this.fechaActual = new Date()
      this.vista = 'hoy'
    },
    esHoy(fecha) {
      const hoy = new Date()
      return fecha.getDate() === hoy.getDate() &&
             fecha.getMonth() === hoy.getMonth() &&
             fecha.getFullYear() === hoy.getFullYear()
    },
    esFindeSemana(fecha) {
      const dia = fecha.getDay()
      return dia === 0 || dia === 6
    },
    obtenerTareasDia(fecha) {
      return this.tareas.filter(tarea => {
        if (!tarea.fechaVencimiento) return false
        const fechaTarea = new Date(tarea.fechaVencimiento)
        return fechaTarea.getDate() === fecha.getDate() &&
               fechaTarea.getMonth() === fecha.getMonth() &&
               fechaTarea.getFullYear() === fecha.getFullYear()
      }).slice(0, 3) // Mostrar máximo 3 tareas por día en la vista
    },
    seleccionarDia(dia) {
      this.diaSeleccionado = dia
    },
    verDetalleTarea(tarea) {
      this.$emit('ver-detalle', tarea)
    },
    nuevaTareaEnDia() {
      this.$emit('nueva-tarea', this.diaSeleccionado.fecha)
    },
    formatHora(fecha) {
      if (!fecha) return null
      const d = new Date(fecha)
      return d.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    formatFechaCompleta(fecha) {
      return fecha.toLocaleDateString('es-ES', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    getTipoIcon() {
      return ''
    },
    getPrioridadIcon(prioridad) {
      const iconos = {
        1: 'Alta',
        2: 'Media',
        3: 'Baja'
      }
      return iconos[prioridad] || 'Media'
    }
  }
}
</script>

<style scoped>
.calendario-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  position: relative;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendario-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e9ecef;
}

.btn-nav {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #495057;
  font-size: 1rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-nav:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: #2c3e50;
}

.mes-actual {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.vista-selector {
  display: flex;
  gap: 4px;
}

.btn-vista {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.btn-vista:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
}

.btn-vista.active {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  border-color: rgb(252, 215, 0);
}

.dias-semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e9ecef;
  padding: 1px;
  border-radius: 8px 8px 0 0;
  margin-bottom: 1px;
}

.dia-semana {
  background: #f8f9fa;
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  color: #495057;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.calendario-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e9ecef;
  padding: 1px;
  border-radius: 0 0 8px 8px;
}

.dia-celda {
  background: white;
  min-height: 100px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border: none;
}

.dia-celda:hover {
  background: rgba(252, 215, 0, 0.05);
}

.dia-otro-mes {
  background: #fafafa;
  opacity: 0.5;
}

.dia-hoy {
  background: rgba(252, 215, 0, 0.1);
}

.dia-hoy .dia-numero {
  background: rgb(252, 215, 0);
  color: #2c3e50;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
}

.dia-fin-semana {
  background: #f8f9fa;
}

.dia-numero {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.tareas-dia {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tarea-item {
  padding: 4px 8px;
  border-radius: 6px;
  color: #2c3e50;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tarea-item:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tarea-hora {
  font-weight: 700;
  font-size: 0.7rem;
}

.tarea-titulo {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tarea-tipo {
  font-size: 0.875rem;
}

.mas-tareas {
  font-size: 0.7rem;
  color: #6c757d;
  font-style: italic;
  padding-left: 8px;
  font-weight: 500;
}

/* Panel lateral */
.panel-dia {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: white;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e9ecef;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid #e9ecef;
  background: linear-gradient(135deg, rgb(252, 215, 0) 0%, #e6c200 100%);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
  text-transform: capitalize;
  font-weight: 700;
}

.btn-cerrar {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 1.25rem;
  color: #2c3e50;
  cursor: pointer;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.btn-nueva-tarea {
  width: 100%;
  background: rgb(252, 215, 0);
  border: none;
  color: #2c3e50;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.btn-nueva-tarea:hover {
  background: #e6c200;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tareas-lista h4 {
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.sin-tareas {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

.tarea-detalle {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.tarea-detalle:hover {
  background: rgba(252, 215, 0, 0.1);
  transform: translateX(-4px);
  border-color: rgb(252, 215, 0);
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tarea-tipo-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  color: #2c3e50;
  font-size: 0.75rem;
  font-weight: 600;
}

.tarea-prioridad {
  font-size: 0.875rem;
  font-weight: 600;
}

.prioridad-1 { color: #dc3545; }
.prioridad-2 { color: #ffc107; }
.prioridad-3 { color: #28a745; }

.tarea-detalle .tarea-titulo {
  margin: 0 0 12px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
}

.tarea-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: #6c757d;
}

.tarea-info span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tarea-info i {
  color: rgb(252, 215, 0);
}

.tarea-descripcion {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 0.875rem;
  line-height: 1.5;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #dee2e6;
}

.asignado-a {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6c757d;
}

.asignado-a i {
  color: rgb(252, 215, 0);
}

/* Transiciones */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 768px) {
  .panel-dia {
    width: 100%;
  }

  .calendario-header {
    flex-direction: column;
    gap: 16px;
  }

  .vista-selector {
    width: 100%;
    justify-content: center;
  }

  .dia-celda {
    min-height: 80px;
  }

  .tarea-item {
    font-size: 0.625rem;
  }

  .calendario-container {
    padding: 16px;
  }
}
</style>
