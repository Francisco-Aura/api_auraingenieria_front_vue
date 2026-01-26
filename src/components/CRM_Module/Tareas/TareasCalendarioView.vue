<template>
  <div class="calendario-container">
    <!-- Cabecera del calendario -->
    <div class="calendario-header">
      <div class="navegacion-header">
        <button class="btn-nav" @click="mesAnterior" :disabled="vista === 'hoy'">
          <i class="fas fa-chevron-left"></i>
        </button>
        
        <h2 class="mes-actual">
          {{ nombreMes }} {{ año }}
        </h2>
        
        <button class="btn-nav" @click="mesSiguiente" :disabled="vista === 'hoy'">
          <i class="fas fa-chevron-right"></i>
        </button>

        <button class="btn-nav btn-hoy" @click="irAHoy" title="Ir a hoy">
          <i class="fas fa-home"></i>
          Hoy
        </button>
      </div>

      <div class="vista-selector">
        <button class="btn-vista" :class="{ active: vista === 'mes' }" @click="cambiarVista('mes')" title="Vista mensual">
          <i class="fas fa-calendar-alt"></i>
          Mes
        </button>
        <button class="btn-vista" :class="{ active: vista === 'semana' }" @click="cambiarVista('semana')" title="Vista semanal">
          <i class="fas fa-calendar-week"></i>
          Semana
        </button>
        <button class="btn-vista" :class="{ active: vista === 'hoy' }" @click="cambiarVista('hoy')" title="Vista del día">
          <i class="fas fa-calendar-day"></i>
          Hoy
        </button>
      </div>
    </div>

    <!-- Días de la semana - solo mostrar en vista mes y semana -->
    <div v-if="vista !== 'hoy'" class="dias-semana">
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
            :style="{ borderLeftColor: tarea.estadoColor || 'rgb(252, 215, 0)' }"
            :title="`${tarea.titulo} - ${tarea.estadoNombre}`"
            @click.stop="verDetalleTarea(tarea)">
            <span v-if="vista !== 'mes'" class="tarea-hora">{{ formatHora(tarea.fechaVencimiento) }}</span>
            <span class="tarea-titulo-corto">{{ tarea.titulo }}</span>
          </div>
          
          <div v-if="obtenerTareasDia(dia.fecha).length > mostrarTareasMaximo" class="mas-tareas">
            +{{ obtenerTareasDia(dia.fecha).length - mostrarTareasMaximo }} más
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop para cerrar al hacer click fuera -->
    <div v-if="diaSeleccionado && (vista === 'hoy' || mostrarPanelLateral)" 
         class="panel-backdrop" 
         @click="cerrarPanel">
    </div>

    <!-- Panel lateral de día seleccionado -->
    <transition name="slide">
      <div v-if="diaSeleccionado && (vista === 'hoy' || mostrarPanelLateral)" class="panel-dia">
        <div class="panel-header">
          <h3>{{ formatFechaCompleta(diaSeleccionado.fecha) }}</h3>
          <button class="close-button" @click="cerrarPanel">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="panel-content">
          <button class="btn btn-primary btn-nueva-tarea" @click="nuevaTareaEnDia">
            <i class="fas fa-plus"></i>
            Nueva tarea
          </button>
          
          <div class="tareas-lista">
            <h4>Tareas ({{ obtenerTareasDia(diaSeleccionado.fecha).length }})</h4>
            
            <div v-if="obtenerTareasDia(diaSeleccionado.fecha).length === 0" class="sin-tareas">
              <i class="fas fa-inbox fa-2x"></i>
              <p>No hay tareas para este día</p>
            </div>
            
            <div 
              v-for="tarea in obtenerTareasDia(diaSeleccionado.fecha)" 
              :key="tarea.id"
              class="tarea-detalle"
              @click="verDetalleTarea(tarea)">
              
              <div class="tarea-header-panel">
                <span class="tarea-tipo-badge" :style="{ backgroundColor: tarea.estadoColor || 'rgb(252, 215, 0)' }">
                  {{ tarea.estadoNombre }}
                </span>
                <span class="tarea-prioridad-badge" :class="`prioridad-${tarea.prioridad}`">
                  {{ getPrioridadTexto(tarea.prioridad) }}
                </span>
              </div>
              
              <h5 class="tarea-titulo-panel">{{ tarea.titulo }}</h5>
              
              <div class="tarea-info">
                <span v-if="tarea.clienteRelacionadoNombre">
                  <i class="fas fa-user"></i> {{ tarea.clienteRelacionadoNombre }}
                </span>
                <span v-if="formatHora(tarea.fechaVencimiento)">
                  <i class="fas fa-clock"></i> {{ formatHora(tarea.fechaVencimiento) }}
                </span>
              </div>
              
              <p v-if="tarea.descripcion" class="tarea-descripcion">{{ tarea.descripcion.substring(0, 100) }}...</p>
              
              <div class="tarea-footer-panel">
                <span class="asignado-a">
                  <i class="fas fa-user-circle"></i> {{ tarea.usuarioAsignadoNombre || 'No asignado' }}
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
      mostrarPanelLateral: false,
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
    mostrarTareasMaximo() {
      if (this.vista === 'mes') return 3
      if (this.vista === 'semana') return 4
      return 10
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
        const hoy = this.fechaActual
        const primerDiaSemana = new Date(hoy)
        primerDiaSemana.setDate(hoy.getDate() - hoy.getDay() + 1)
        
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
      if (nuevaVista === 'hoy') {
        this.fechaActual = new Date()
        this.diaSeleccionado = {
          numero: this.fechaActual.getDate(),
          fecha: this.fechaActual,
          esMesActual: true
        }
      } else {
        this.diaSeleccionado = null
      }
    },
    mesAnterior() {
      this.fechaActual = new Date(this.año, this.mes - 1, 1)
      this.diaSeleccionado = null
    },
    mesSiguiente() {
      this.fechaActual = new Date(this.año, this.mes + 1, 1)
      this.diaSeleccionado = null
    },
    irAHoy() {
      this.fechaActual = new Date()
      this.vista = 'hoy'
      this.diaSeleccionado = {
        numero: this.fechaActual.getDate(),
        fecha: this.fechaActual,
        esMesActual: true
      }
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
      }).slice(0, this.mostrarTareasMaximo)
    },
    seleccionarDia(dia) {
      this.diaSeleccionado = dia
      this.mostrarPanelLateral = true
    },
    cerrarPanel() {
      this.diaSeleccionado = null
      this.mostrarPanelLateral = false
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
    getPrioridadTexto(prioridad) {
      const textos = {
        0: 'Urgente',
        1: 'Alta',
        2: 'Media',
        3: 'Baja'
      }
      return textos[prioridad] || 'Normal'
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
  min-height: 600px;
}

.calendario-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
}

.navegacion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.btn-nav {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #495057;
  font-size: 0.9rem;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.btn-nav:hover:not(:disabled) {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: black;
}

.btn-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-nav i {
  font-size: 0.9rem;
}

.btn-hoy {
  background: rgb(252, 215, 0);
  color: black;
  border-color: rgb(252, 215, 0);
  font-weight: 600;
}

.btn-hoy:hover {
  background: #e6c200;
  border-color: #e6c200;
}

.mes-actual {
  font-size: 1.3rem;
  font-weight: 700;
  color: black;
  text-align: center;
  margin: 0;
  min-width: 200px;
}

.vista-selector {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.btn-vista {
  background: white;
  border: 1px solid #dee2e6;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-vista:hover {
  background: rgba(252, 215, 0, 0.1);
  border-color: rgb(252, 215, 0);
  color: black;
}

.btn-vista.active {
  background: rgb(252, 215, 0);
  color: black;
  border-color: rgb(252, 215, 0);
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(252, 215, 0, 0.2);
}

.btn-vista i {
  font-size: 1rem;
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
  padding: 12px 6px;
  text-align: center;
  font-weight: 700;
  color: #495057;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

/* Grid del calendario */
.calendario-grid {
  display: grid;
  gap: 1px;
  background: #e9ecef;
  padding: 1px;
  border-radius: 0 0 6px 6px;
}

.calendario-grid.vista-mes {
  grid-template-columns: repeat(7, 1fr);
}

.calendario-grid.vista-semana {
  grid-template-columns: repeat(7, 1fr);
}

.calendario-grid.vista-hoy {
  grid-template-columns: 1fr;
  max-width: 500px;
  margin: 0 auto;
}

.dia-celda {
  background: white;
  min-height: 90px;
  max-height: 120px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dia-celda:hover {
  background: rgba(252, 215, 0, 0.08);
}

.dia-otro-mes {
  background: #fafafa;
  opacity: 0.5;
}

.dia-hoy {
  background: rgba(252, 215, 0, 0.12);
}

.dia-hoy .dia-numero {
  background: rgb(252, 215, 0);
  color: black;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}

.dia-seleccionado {
  background: rgba(252, 215, 0, 0.18) !important;
  border: 2px solid rgb(252, 215, 0) !important;
}

.dia-fin-semana {
  background: #f8f9fa;
}

.vista-hoy .dia-celda {
  min-height: 150px;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.vista-hoy .dia-numero {
  font-size: 1.4rem;
  margin-bottom: 12px;
  font-weight: 700;
}

.vista-hoy .tareas-dia {
  gap: 8px;
}

.vista-hoy .tarea-item {
  padding: 8px 10px;
  font-size: 0.8rem;
}

.vista-semana .dia-celda {
  min-height: 110px;
}

.vista-semana .dia-numero {
  font-size: 0.95rem;
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
  gap: 4px;
  flex: 1;
  overflow: hidden;
  min-width: 0; /* Allow text truncation in children */
}

.tarea-item {
  padding: 4px 6px;
  border-radius: 4px;
  color: black;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  background-color: white;
  border-left: 3px solid transparent;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
  border-left-width: 4px;
  max-width: 100%;
  position: relative;
}

.tarea-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

/* Tooltip para título completo */
.tarea-item:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #2d3748;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: normal;
  max-width: 250px;
  word-wrap: break-word;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  margin-bottom: 4px;
  pointer-events: none;
}

.panel-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  z-index: 15;
  backdrop-filter: blur(1px);
}

.tarea-hora {
  font-weight: 700;
  font-size: 0.65rem;
  flex-shrink: 0;
}

.tarea-titulo-corto {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.mas-tareas {
  font-size: 0.65rem;
  color: #6c757d;
  font-style: italic;
  padding-left: 6px;
  font-weight: 500;
  margin-top: 2px;
}

/* Panel lateral */
.panel-dia {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 340px;
  background: white;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.12);
  z-index: 20;
  display: flex;
  flex-direction: column;
  border-left: 2px solid rgb(252, 215, 0);
  border-radius: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 2px solid rgb(252, 215, 0);
  background: linear-gradient(135deg, rgb(252, 215, 0), rgba(252, 215, 0, 0.8));
}

.panel-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: black;
  text-transform: capitalize;
  font-weight: 700;
}

.close-button {
  background-color: #e74c3c;
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
  z-index: 10;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.close-button:hover {
  background-color: #c0392b;
  transform: rotate(90deg) scale(1.1);
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
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.btn-nueva-tarea:hover {
  background: #e6c200;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.tareas-lista h4 {
  margin: 0 0 16px 0;
  color: #495057;
  font-size: 0.95rem;
  font-weight: 600;
}

.sin-tareas {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px dashed #dee2e6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.sin-tareas i {
  color: #dee2e6;
  opacity: 0.6;
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
  background: rgba(252, 215, 0, 0.12);
  transform: translateX(-4px);
  border-color: rgb(252, 215, 0);
  box-shadow: 0 2px 8px rgba(252, 215, 0, 0.15);
}

.tarea-header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.tarea-tipo-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.tarea-tipo-badge::before {
  content: '\f111';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  font-size: 0.5rem;
}

.tarea-prioridad-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
  border: 2px solid transparent;
}

.tarea-prioridad-badge.prioridad-0 { 
  background: #8b0000; 
  color: white;
  border-color: #5c0000;
}
.tarea-prioridad-badge.prioridad-1 { 
  background: #dc3545; 
  color: white;
  border-color: #bd2130;
}
.tarea-prioridad-badge.prioridad-2 { 
  background: #fff3cd; 
  color: #856404;
  border-color: #ffc107;
}
.tarea-prioridad-badge.prioridad-3 { 
  background: #d4edda; 
  color: #155724;
  border-color: #28a745;
}

/* Mantener estilos legacy para compatibilidad */
.tarea-prioridad {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.prioridad-0 { color: #8b0000; }
.prioridad-1 { color: #dc3545; }
.prioridad-2 { color: #856404; }
.prioridad-3 { color: #28a745; }

.tarea-titulo-panel {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: black;
  line-height: 1.3;
}

.tarea-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.tarea-footer-panel {
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
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .panel-dia {
    width: 300px;
  }

  .calendario-container {
    padding: 12px;
  }

  .dia-celda {
    min-height: 80px;
  }

  .tarea-item {
    font-size: 0.65rem;
  }
}

@media (max-width: 768px) {
  .panel-dia {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 0;
    border-left: none;
  }

  .calendario-header {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .navegacion-header {
    width: 100%;
  }

  .mes-actual {
    font-size: 1.1rem;
  }

  .vista-selector {
    width: 100%;
    gap: 4px;
  }

  .btn-vista {
    flex: 1;
    font-size: 0.75rem;
    padding: 6px 8px;
  }

  .dias-semana {
    grid-template-columns: repeat(7, 1fr);
  }

  .dia-semana {
    padding: 8px 2px;
    font-size: 0.65rem;
  }

  .dia-celda {
    min-height: 70px;
    padding: 6px;
  }

  .vista-semana .dia-celda {
    min-height: 90px;
  }

  .vista-hoy .dia-celda {
    min-height: 120px;
  }

  .dia-numero {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }

  .tarea-item {
    font-size: 0.6rem;
    padding: 2px 4px;
  }

  .tarea-hora {
    font-size: 0.55rem;
  }

  .tarea-titulo-corto {
    font-size: 0.6rem;
  }

  .mas-tareas {
    font-size: 0.55rem;
  }

  .calendario-container {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .calendario-header {
    gap: 8px;
  }

  .navegacion-header {
    gap: 6px;
  }

  .btn-nav,
  .btn-hoy {
    padding: 6px 8px;
    min-width: 36px;
    height: 36px;
    font-size: 0.8rem;
  }

  .mes-actual {
    font-size: 1rem;
  }

  .btn-vista {
    padding: 4px 6px;
    font-size: 0.65rem;
  }

  .vista-selector {
    gap: 3px;
  }

  .dias-semana {
    padding: 0.5px;
  }

  .dia-semana {
    padding: 4px 1px;
    font-size: 0.55rem;
  }

  .dia-celda {
    min-height: 60px;
  }

  .dia-numero {
    font-size: 0.65rem;
  }

  .tarea-item {
    font-size: 0.5rem;
    padding: 1px 2px;
  }
}
</style>
