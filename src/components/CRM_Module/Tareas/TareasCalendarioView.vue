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
            v-for="tarea in tareasVisiblesDia(dia.fecha)"
            :key="tarea.id"
            class="tarea-item"
            :style="{ borderLeftColor: tarea.estadoColor || 'rgb(252, 215, 0)' }"
            :title="`${tarea.titulo} - ${tarea.estadoNombre}`"
            @click.stop="verDetalleTarea(tarea)">
            <span v-if="vista !== 'mes'" class="tarea-hora">{{ formatHora(tarea.fechaVencimiento) }}</span>
            <span class="tarea-titulo-corto">{{ tarea.titulo }}</span>
          </div>

          <div v-if="tareasDelDia(dia.fecha).length > mostrarTareasMaximo" class="mas-tareas">
            +{{ tareasDelDia(dia.fecha).length - mostrarTareasMaximo }} más
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
            <h4>Tareas ({{ tareasDelDia(diaSeleccionado.fecha).length }})</h4>

            <div v-if="tareasDelDia(diaSeleccionado.fecha).length === 0" class="sin-tareas">
              <i class="fas fa-inbox fa-2x"></i>
              <p>No hay tareas para este día</p>
            </div>

            <div
              v-for="tarea in tareasDelDia(diaSeleccionado.fecha)"
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
    // Tareas agrupadas por día de vencimiento (clave AAAA-MM-DD local): se calcula
    // una vez por cambio de tareas en lugar de recorrer todas en cada celda
    tareasPorDia() {
      const porDia = new Map()
      for (const tarea of this.tareas) {
        if (!tarea.fechaVencimiento) continue
        const clave = this.claveDia(new Date(tarea.fechaVencimiento))
        if (!porDia.has(clave)) porDia.set(clave, [])
        porDia.get(clave).push(tarea)
      }
      return porDia
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
        // getDay() devuelve 0 el domingo: sin este ajuste, los domingos la vista
        // saltaba a la semana siguiente y el día actual no aparecía.
        const diaSemana = hoy.getDay()
        const desplazamiento = diaSemana === 0 ? -6 : 1 - diaSemana

        for (let i = 0; i < 7; i++) {
          // Aritmética de calendario, no de milisegundos: sumar 24 h se descuadra
          // la semana del cambio de hora (marzo y octubre).
          const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + desplazamiento + i)
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
    claveDia(fecha) {
      return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
    },
    // Todas las tareas que vencen ese día (panel lateral y contador «+N más»)
    tareasDelDia(fecha) {
      return this.tareasPorDia.get(this.claveDia(fecha)) || []
    },
    // Las que caben en la celda del calendario
    tareasVisiblesDia(fecha) {
      return this.tareasDelDia(fecha).slice(0, this.mostrarTareasMaximo)
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

<style scoped src="./TareasCalendarioView.css"></style>
