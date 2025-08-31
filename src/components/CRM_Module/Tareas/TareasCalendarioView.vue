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
          <button class="btn-vista" :class="{ active: vista === 'mes' }" @click="cambiarVista('mes')">
            Mes
          </button>
          <button class="btn-vista" :class="{ active: vista === 'semana' }" @click="cambiarVista('semana')">
            Semana
          </button>
          <button class="btn-vista" :class="{ active: vista === 'hoy' }" @click="cambiarVista('hoy')">
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
    <div class="calendario-grid" :class="`vista-${vista}`">
      <div 
        v-for="(dia, index) in diasVista" 
        :key="index"
        class="dia-celda"
        :class="{
          'dia-otro-mes': !dia.esMesActual,
          'dia-hoy': esHoy(dia.fecha),
          'dia-fin-semana': esFindeSemana(dia.fecha),
          'dia-seleccionado': diaSeleccionado && esMismoDia(dia.fecha, diaSeleccionado.fecha)
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
          <button class="close-button" @click="diaSeleccionado = null">
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
    },
    diasVista() {
      if (this.vista === 'mes') {
        return this.diasDelMes
      } else if (this.vista === 'semana') {
        const dias = []
        const primerDiaSemana = new Date(this.año, this.mes, this.fechaActual.getDate() - this.fechaActual.getDay() + 1)
        for (let i = 0; i < 7; i++) {
          const fecha = new Date(primerDiaSemana.getTime() + i * 24 * 60 * 60 * 1000)
          dias.push({
            numero: fecha.getDate(),
            fecha: fecha,
            esMesActual: true
          })
        }
        return dias
      } else if (this.vista === 'hoy') {
        const hoy = new Date()
        return [
          { numero: hoy.getDate(), fecha: hoy, esMesActual: true }
        ]
      }
      return []
    }
  },
  methods: {
    cambiarVista(nuevaVista) {
      this.vista = nuevaVista
      this.diaSeleccionado = null
      
      if (nuevaVista === 'hoy') {
        this.fechaActual = new Date()
      }
    },
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
    esMismoDia(fecha1, fecha2) {
      return fecha1.getDate() === fecha2.getDate() &&
             fecha1.getMonth() === fecha2.getMonth() &&
             fecha1.getFullYear() === fecha2.getFullYear()
    },
    obtenerTareasDia(fecha) {
      return this.tareas.filter(tarea => {
        if (!tarea.fechaVencimiento) return false
        const fechaTarea = new Date(tarea.fechaVencimiento)
        return fechaTarea.getDate() === fecha.getDate() &&
               fechaTarea.getMonth() === fecha.getMonth() &&
               fechaTarea.getFullYear() === fecha.getFullYear()
      }).slice(0, this.vista === 'hoy' ? 10 : 3) // Mostrar más tareas en vista de hoy
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
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  position: relative;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calendario-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.btn-nav {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #495057;
  font-size: 0.9rem;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-nav:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: black;
}

.mes-actual {
  font-size: 1.2rem;
  font-weight: 700;
  color: black;
}

.vista-selector {
  display: flex;
  gap: 3px;
}

.btn-vista {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: #495057;
  font-weight: 500;
}

.btn-vista:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
}

.btn-vista.active {
  background: rgb(252, 215, 0);
  color: black;
  border-color: rgb(252, 215, 0);
}

.dias-semana {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e9ecef;
  padding: 1px;
  border-radius: 6px 6px 0 0;
  margin-bottom: 1px;
}

.dia-semana {
  background: #f8f9fa;
  padding: 8px 6px;
  text-align: center;
  font-weight: 600;
  color: #495057;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

/* Grid del calendario */
.calendario-grid {
  display: grid;
  gap: 1px;
  background: #e9ecef;
  padding: 1px;
  border-radius: 0 0 6px 6px;
}

/* Vista mensual */
.calendario-grid.vista-mes {
  grid-template-columns: repeat(7, 1fr);
}

/* Vista semanal */
.calendario-grid.vista-semana {
  grid-template-columns: repeat(7, 1fr);
}

/* Vista de hoy */
.calendario-grid.vista-hoy {
  grid-template-columns: 1fr;
  max-width: 400px;
  margin: 0 auto;
}

.dia-celda {
  background: white;
  min-height: 80px;
  padding: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
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
  color: black;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.dia-seleccionado {
  background: rgba(252, 215, 0, 0.15) !important;
  border: 2px solid rgb(252, 215, 0) !important;
}

.dia-fin-semana {
  background: #f8f9fa;
}

/* Vista de hoy - estilo especial */
.vista-hoy .dia-celda {
  min-height: 120px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.vista-hoy .dia-numero {
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.vista-hoy .tareas-dia {
  gap: 6px;
}

.vista-hoy .tarea-item {
  padding: 6px 8px;
  font-size: 0.75rem;
}

/* Vista semanal - ajustes */
.vista-semana .dia-celda {
  min-height: 100px;
}

.vista-semana .dia-numero {
  font-size: 0.9rem;
  font-weight: 700;
  color: black;
  margin-bottom: 8px;
  text-align: center;
}

.dia-numero {
  font-weight: 600;
  color: #495057;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.tareas-dia {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tarea-item {
  padding: 3px 6px;
  border-radius: 4px;
  color: black;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.tarea-item:hover {
  transform: scale(1.02);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tarea-hora {
  font-weight: 700;
  font-size: 0.6rem;
}

.tarea-titulo {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tarea-tipo {
  font-size: 0.75rem;
}

.mas-tareas {
  font-size: 0.6rem;
  color: #6c757d;
  font-style: italic;
  padding-left: 6px;
  font-weight: 500;
}

/* Panel lateral */
.panel-dia {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: white;
  box-shadow: -3px 0 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e9ecef;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px solid #e9ecef;
  background:  rgb(252, 215, 0);
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  color: black;
  text-transform: capitalize;
  font-weight: 700;
}

.close-button {
  top: 0.6rem;
  right: 0.8rem;
  background-color: #e74c3c;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.close-button:hover {
  background-color: #c0392b;
  transform: rotate(90deg);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.btn-nueva-tarea {
  width: 100%;
  background: rgb(252, 215, 0);
  border: none;
  color: black;
  padding: 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 16px;
}

.btn-nueva-tarea:hover {
  background: #e6c200;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tareas-lista h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
}

.sin-tareas {
  text-align: center;
  padding: 32px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px dashed #dee2e6;
}

.tarea-detalle {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
}

.tarea-detalle:hover {
  background: rgba(252, 215, 0, 0.1);
  transform: translateX(-3px);
  border-color: rgb(252, 215, 0);
}

.tarea-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tarea-tipo-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  color: black;
  font-size: 0.65rem;
  font-weight: 600;
}

.tarea-prioridad {
  font-size: 0.75rem;
  font-weight: 600;
}

.prioridad-1 { color: #dc3545; }
.prioridad-2 { color: #ffc107; }
.prioridad-3 { color: #28a745; }

.tarea-detalle .tarea-titulo {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: black;
}

.tarea-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.75rem;
  color: #6c757d;
}

.tarea-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tarea-info i {
  color: rgb(252, 215, 0);
}

.tarea-descripcion {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 0.75rem;
  line-height: 1.4;
}

.tarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #dee2e6;
}

.asignado-a {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6c757d;
}

.asignado-a i {
  color: rgb(252, 215, 0);
}

/* Transiciones */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
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
    gap: 12px;
  }

  .vista-selector {
    width: 100%;
    justify-content: center;
  }

  .dia-celda {
    min-height: 60px;
  }

  .vista-hoy .dia-celda {
    min-height: 100px;
    padding: 8px;
  }

  .tarea-item {
    font-size: 0.55rem;
    padding: 2px 4px;
  }

  .tarea-hora {
    font-size: 0.55rem;
  }

  .tarea-titulo {
    font-size: 0.6rem;
  }

  .calendario-container {
    padding: 12px;
  }
}
</style>
