<template>
  <div class="estadisticas-container">
    <!-- Header desplegable solo para ADMIN (nivelAcceso = 1) -->
    <div v-if="esAdmin" class="estadisticas-header">
      <button class="btn-toggle-estadisticas" @click="mostrarEstadisticas = !mostrarEstadisticas">
        <i :class="mostrarEstadisticas ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
        <span><i class="fas fa-chart-bar"></i> Estadísticas {{ mostrarEstadisticas ? '(Ocultar)' : '(Ver)' }}</span>
      </button>
    </div>

    <!-- Contenedor desplegable de estadísticas -->
    <div v-if="esAdmin && mostrarEstadisticas" class="estadisticas-contenido">
      <!-- Encabezado con filtros integrados -->
      <div class="stats-header-integrated">
        <div class="header-left">
          <i class="fas fa-chart-bar"></i>
          <h2>Estadísticas</h2>
          <span class="periodo-badge">{{ textoPeriodo }}</span>
        </div>
        
        <!-- Filtros compactos integrados -->
        <div class="filters-compact">
          <select v-model="tipoRango" class="filter-select-compact" @change="cambiarRango(tipoRango)">
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="año">Este año</option>
            <option value="personalizado">Personalizado</option>
          </select>
          
          <!-- Selectores dinámicos compactos -->
          <select v-if="tipoRango === 'mes'" v-model.number="mesSeleccionado" class="filter-select-compact" @change="aplicarFiltrosPersonalizados">
            <option v-for="(nombre, index) in meses" :key="index" :value="index + 1">{{ nombre }}</option>
          </select>
          
          <select v-if="tipoRango === 'mes' || tipoRango === 'año'" v-model.number="añoSeleccionado" class="filter-select-compact" @change="aplicarFiltrosPersonalizados">
            <option v-for="año in años" :key="año" :value="año">{{ año }}</option>
          </select>
          
          <div v-if="tipoRango === 'personalizado'" class="date-inputs-compact">
            <input type="date" v-model="fechaDesde" class="filter-input-compact" @change="aplicarFiltrosPersonalizados" />
            <span class="date-separator">—</span>
            <input type="date" v-model="fechaHasta" class="filter-input-compact" @change="aplicarFiltrosPersonalizados" />
          </div>
        </div>
      </div>

      <!-- Grid de Estadísticas Básicas -->
      <div class="stats-content">
        <div class="stats-grid">
          <div class="stat-card stat-card--pendientes">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.pendientes }}</div>
              <div class="stat-label">Pendientes</div>
            </div>
            <div class="stat-icon"><i class="fas fa-clock"></i></div>
          </div>

          <div class="stat-card stat-card--progreso">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.enProgreso }}</div>
              <div class="stat-label">En Progreso</div>
            </div>
            <div class="stat-icon"><i class="fas fa-play-circle"></i></div>
          </div>

          <div class="stat-card stat-card--vencidas">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.vencidas }}</div>
              <div class="stat-label">Vencidas</div>
            </div>
            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          </div>

          <div class="stat-card stat-card--bloqueadas">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.bloqueadas }}</div>
              <div class="stat-label">Bloqueadas</div>
            </div>
            <div class="stat-icon"><i class="fas fa-lock"></i></div>
          </div>

          <div class="stat-card stat-card--completadas">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.completadas }}</div>
              <div class="stat-label">Completadas</div>
            </div>
            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
          </div>
        </div>

        <!-- Gráfico de progreso -->
        <div class="progreso-semanal">
          <h3>{{ textoProgreso }}</h3>
          <div class="progreso-bar">
            <div 
              class="progreso-fill" 
              :style="{ width: porcentajeCompletadas + '%' }"
            ></div>
          </div>
          <p class="progreso-texto">
            {{ estadisticas.completadasSemana }} de {{ estadisticas.totalSemana }} tareas completadas
          </p>
        </div>

        <!-- Métricas Avanzadas de Productividad -->
        <div class="metricas-avanzadas">
          <h3><i class="fas fa-chart-line"></i> Análisis de Productividad</h3>
          <div class="metricas-grid">
            <!-- Tasa de Completación -->
            <div class="metrica-item">
              <div class="metrica-header">
                <span class="metrica-label">Tasa de Completación</span>
                <i class="fas fa-check-double"></i>
              </div>
              <div class="metrica-valor">
                {{ Math.round(estadisticas.tasaCompletacion || 0) }}%
              </div>
              <div class="metrica-barra">
                <div 
                  class="metrica-relleno" 
                  :style="{ 
                    width: (estadisticas.tasaCompletacion || 0) + '%',
                    backgroundColor: getColorPorTasa(estadisticas.tasaCompletacion || 0)
                  }"
                ></div>
              </div>
              <div class="metrica-descripcion">Tareas completadas sobre total asignadas</div>
            </div>

            <!-- Eficiencia -->
            <div class="metrica-item">
              <div class="metrica-header">
                <span class="metrica-label">Eficiencia</span>
                <i class="fas fa-rocket"></i>
              </div>
              <div class="metrica-valor">
                {{ Math.round(estadisticas.eficiencia || 0) }}%
              </div>
              <div class="metrica-barra">
                <div 
                  class="metrica-relleno" 
                  :style="{ 
                    width: (estadisticas.eficiencia || 0) + '%',
                    backgroundColor: getColorPorEficiencia(estadisticas.eficiencia || 0)
                  }"
                ></div>
              </div>
              <div class="metrica-descripcion">Tareas completadas a tiempo</div>
            </div>

            <!-- Delay Promedio -->
            <div class="metrica-item">
              <div class="metrica-header">
                <span class="metrica-label">Delay Promedio</span>
                <i class="fas fa-hourglass-end"></i>
              </div>
              <div class="metrica-valor">
                {{ (estadisticas.delayPromedioDias || 0).toFixed(1) }}d
              </div>
              <div class="metrica-descripcion">Días de retraso en tareas vencidas</div>
            </div>

            <!-- Tareas Próximas a Vencer -->
            <div class="metrica-item metrica-item--proximas-vencer">
              <div class="metrica-header">
                <span class="metrica-label">Próximas a Vencer</span>
                <i class="fas fa-clock"></i>
              </div>
              <div class="metrica-valor">
                {{ estadisticas.tareasProximasAVencer || 0 }}
              </div>
              <div class="metrica-descripcion">En los próximos 3 días</div>
            </div>

            <!-- Tareas Bloqueadas -->
            <div class="metrica-item metrica-item--bloqueadas">
              <div class="metrica-header">
                <span class="metrica-label">Bloqueadas Actualmente</span>
                <i class="fas fa-lock"></i>
              </div>
              <div class="metrica-valor">
                {{ estadisticas.tareasBloqueadasPeriodo || 0 }}
              </div>
              <div class="metrica-descripcion">Requieren atención</div>
            </div>

            <!-- Tareas Sin Asignar -->
            <div class="metrica-item metrica-item--sin-asignar">
              <div class="metrica-header">
                <span class="metrica-label">Sin Asignar</span>
                <i class="fas fa-user-times"></i>
              </div>
              <div class="metrica-valor">
                {{ estadisticas.tareasSinAsignar || 0 }}
              </div>
              <div class="metrica-descripcion">Requieren asignación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'EstadisticasTareasComponent',
  data() {
    return {
      mostrarFiltros: true,
      mostrarEstadisticas: false,
      tipoRango: 'semana',
      mesSeleccionado: new Date().getMonth() + 1,
      añoSeleccionado: new Date().getFullYear(),
      fechaDesde: this.formatoFechaISO(new Date()),
      fechaHasta: this.formatoFechaISO(new Date()),
      meses: [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      años: this.generarAños(),
      estadisticas: {
        total: 0,
        pendientes: 0,
        enProgreso: 0,
        completadas: 0,
        vencidas: 0,
        bloqueadas: 0,
        completadasSemana: 0,
        totalSemana: 0,
        tasaCompletacion: 0,
        eficiencia: 0,
        delayPromedioDias: 0,
        tareasBloqueadasPeriodo: 0,
        tareasProximasAVencer: 0,
        prioridadPromedioPendientes: 0,
        tareasSinAsignar: 0
      },
      cargando: false,
      // Caché de tareas para evitar recargas innecesarias
      tareasCache: []
    }
  },
  computed: {
    porcentajeCompletadas() {
      if (!this.estadisticas.totalSemana || this.estadisticas.totalSemana === 0) return 0
      const porcentaje = (this.estadisticas.completadasSemana / this.estadisticas.totalSemana) * 100
      return Math.min(100, Math.round(porcentaje))
    },
    textoPeriodo() {
      const ahora = new Date()
      switch (this.tipoRango) {
        case 'hoy':
          return ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        case 'semana': {
          const inicio = this.getInicioDeSemana(ahora)
          const fin = new Date(inicio)
          fin.setDate(fin.getDate() + 6)
          return `${inicio.toLocaleDateString('es-ES')} al ${fin.toLocaleDateString('es-ES')}`
        }
        case 'mes': {
          return `${this.meses[this.mesSeleccionado - 1]} de ${this.añoSeleccionado}`
        }
        case 'año':
          return `Año ${this.añoSeleccionado}`
        case 'personalizado':
          return `${this.fechaDesde} al ${this.fechaHasta}`
        default:
          return ''
      }
    },
    textoProgreso() {
      switch (this.tipoRango) {
        case 'hoy':
          return 'Progreso de Hoy'
        case 'semana':
          return 'Progreso Semanal'
        case 'mes':
          return `Progreso de ${this.meses[this.mesSeleccionado - 1]}`
        case 'año':
          return `Progreso de ${this.añoSeleccionado}`
        case 'personalizado':
          return 'Progreso del Período'
        default:
          return 'Progreso'
      }
    },
    tipoRangoTexto() {
      switch (this.tipoRango) {
        case 'hoy':
          return 'de hoy'
        case 'semana':
          return 'de la semana'
        case 'mes':
          return `del mes`
        case 'año':
          return `del año`
        case 'personalizado':
          return 'del período'
        default:
          return 'del período'
      }
    },
    esAdmin() {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
      return usuario.nivelAcceso === 1 || usuario.nivelAcceso === '1'
    }
  },
  watch: {
    tipoRango() {
      // Usar caché si hay datos, si no cargar desde servidor
      if (this.tareasCache.length > 0) {
        this.procesarEstadisticasDesdeData(this.tareasCache)
      } else {
        this.cargarEstadisticas()
      }
    },
    mesSeleccionado() {
      if (this.tipoRango === 'mes') {
        if (this.tareasCache.length > 0) {
          this.procesarEstadisticasDesdeData(this.tareasCache)
        } else {
          this.cargarEstadisticas()
        }
      }
    },
    añoSeleccionado() {
      if (this.tipoRango === 'mes' || this.tipoRango === 'año') {
        if (this.tareasCache.length > 0) {
          this.procesarEstadisticasDesdeData(this.tareasCache)
        } else {
          this.cargarEstadisticas()
        }
      }
    }
  },
  async mounted() {
    // No cargar automáticamente, esperar datos del componente padre
    // await this.cargarEstadisticas()
  },
  methods: {
    // Método optimizado: recibe datos ya cargados del componente padre
    cargarEstadisticasConDatos(tareasPreCargadas) {
      if (!this.esAdmin) return
      
      // Guardar en caché para cuando el usuario cambie de rango
      this.tareasCache = tareasPreCargadas || []
      
      // Usar los datos precargados en lugar de hacer otra petición
      this.procesarEstadisticasDesdeData(this.tareasCache)
    },
    
    formatoFechaISO(fecha) {
      const year = fecha.getFullYear()
      const month = String(fecha.getMonth() + 1).padStart(2, '0')
      const day = String(fecha.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    generarAños() {
      const años = []
      const añoActual = new Date().getFullYear()
      for (let i = añoActual - 5; i <= añoActual + 2; i++) {
        años.push(i)
      }
      return años
    },
    getInicioDeSemana(fecha) {
      const date = new Date(fecha)
      const day = date.getDay()
      const diff = date.getDate() - day + (day === 0 ? -6 : 1)
      return new Date(date.setDate(diff))
    },
    cambiarRango(tipo) {
      this.tipoRango = tipo
      // Usar caché si está disponible
      if (this.tareasCache.length > 0) {
        this.procesarEstadisticasDesdeData(this.tareasCache)
      } else {
        this.cargarEstadisticas()
      }
    },
    aplicarFiltrosPersonalizados() {
      // Usar caché si está disponible
      if (this.tareasCache.length > 0) {
        this.procesarEstadisticasDesdeData(this.tareasCache)
      } else {
        this.cargarEstadisticas()
      }
    },
    
    // Procesar estadísticas desde datos ya cargados (sin petición al servidor)
    procesarEstadisticasDesdeData(todasLasTareas) {
      if (!todasLasTareas || todasLasTareas.length === 0) {
        this.resetearEstadisticas()
        return
      }
      
      // Calcular fechas según el rango
      const { fechaInicio, fechaFin } = this.calcularRangoFechas()
      
      // Filtrar tareas según el período
      const tareasFiltradas = this.filtrarTareasPorPeriodo(todasLasTareas, fechaInicio, fechaFin)
      
      // Calcular estadísticas
      this.calcularEstadisticasDesdeArray(tareasFiltradas, todasLasTareas)
    },
    
    calcularRangoFechas() {
      let fechaInicio, fechaFin
      const ahora = new Date()
      
      switch (this.tipoRango) {
        case 'hoy':
          fechaInicio = new Date(ahora)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(ahora)
          fechaFin.setHours(23, 59, 59, 999)
          break
        case 'semana': {
          const inicio = this.getInicioDeSemana(ahora)
          fechaInicio = new Date(inicio)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(inicio)
          fechaFin.setDate(fechaFin.getDate() + 6)
          fechaFin.setHours(23, 59, 59, 999)
          break
        }
        case 'mes':
          fechaInicio = new Date(this.añoSeleccionado, this.mesSeleccionado - 1, 1)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(this.añoSeleccionado, this.mesSeleccionado, 0)
          fechaFin.setHours(23, 59, 59, 999)
          break
        case 'año':
          fechaInicio = new Date(this.añoSeleccionado, 0, 1)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(this.añoSeleccionado, 11, 31)
          fechaFin.setHours(23, 59, 59, 999)
          break
        case 'personalizado':
          fechaInicio = new Date(this.fechaDesde)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(this.fechaHasta)
          fechaFin.setHours(23, 59, 59, 999)
          break
        default:
          fechaInicio = new Date(ahora)
          fechaInicio.setHours(0, 0, 0, 0)
          fechaFin = new Date(ahora)
          fechaFin.setHours(23, 59, 59, 999)
      }
      
      return { fechaInicio, fechaFin }
    },
    
    filtrarTareasPorPeriodo(tareas, fechaInicio, fechaFin) {
      return tareas.filter(tarea => {
        const completada = tarea.estadoNombre?.toLowerCase() === 'completada'
        
        if (completada) {
          if (!tarea.fechaFinalizacion) return false
          const fechaTerminacion = new Date(tarea.fechaFinalizacion)
          return fechaTerminacion >= fechaInicio && fechaTerminacion <= fechaFin
        } else {
          if (tarea.fechaInicio) {
            const fechaIni = new Date(tarea.fechaInicio)
            if (fechaIni >= fechaInicio && fechaIni <= fechaFin) return true
          }
          if (tarea.fechaVencimiento) {
            const fechaVenc = new Date(tarea.fechaVencimiento)
            if (fechaVenc >= fechaInicio && fechaVenc <= fechaFin) return true
          }
          if (tarea.fechaCreacion) {
            const fechaCrear = new Date(tarea.fechaCreacion)
            if (fechaCrear >= fechaInicio && fechaCrear <= fechaFin) return true
          }
          return false
        }
      })
    },
    
    calcularEstadisticasDesdeArray(tareasFiltradas, todasLasTareas) {
      const ahoraCalculo = new Date()
      
      const pendientes = tareasFiltradas.filter(t => t.estadoNombre?.toLowerCase() === 'pendiente').length
      const enProgreso = tareasFiltradas.filter(t => t.estadoNombre?.toLowerCase() === 'en progreso').length
      const completadas = tareasFiltradas.filter(t => t.estadoFinal === true).length
      // Usar el campo estadoBloqueo del DTO en vez de nombre hardcodeado
      const bloqueadas = tareasFiltradas.filter(t => t.estadoBloqueo === true).length
      
      const vencidas = tareasFiltradas.filter(t => {
        if (t.estadoFinal === true) return false
        if (!t.fechaVencimiento) return false
        return new Date(t.fechaVencimiento) < ahoraCalculo
      }).length
      
      const total = tareasFiltradas.length
      const tasaCompletacion = total > 0 ? (completadas / total) * 100 : 0
      
      // Estadísticas globales
      const tareasProximasAVencer = todasLasTareas.filter(t => {
        if (t.estadoFinal === true) return false
        if (!t.fechaVencimiento) return false
        const fechaVenc = new Date(t.fechaVencimiento)
        const tresDiasDesdeAhora = new Date(ahoraCalculo.getTime() + 3 * 24 * 60 * 60 * 1000)
        return fechaVenc > ahoraCalculo && fechaVenc <= tresDiasDesdeAhora
      }).length
      
      const tareasSinAsignar = todasLasTareas.filter(t => 
        !t.usuarioAsignadoId && t.estadoNombre?.toLowerCase() !== 'completada'
      ).length
      
      this.estadisticas = {
        ...this.estadisticas,
        pendientes,
        enProgreso,
        completadas,
        bloqueadas,
        vencidas,
        total,
        tasaCompletacion,
        tareasProximasAVencer,
        tareasSinAsignar,
        totalSemana: total,
        completadasSemana: completadas
      }
    },
    
    resetearEstadisticas() {
      this.estadisticas = {
        pendientes: 0,
        enProgreso: 0,
        completadas: 0,
        bloqueadas: 0,
        vencidas: 0,
        total: 0,
        tasaCompletacion: 0,
        eficiencia: 0,
        delayPromedioDias: 0,
        tareasProximasAVencer: 0,
        tareasBloqueadasPeriodo: 0,
        tareasSinAsignar: 0,
        totalSemana: 0,
        completadasSemana: 0
      }
    },
    
    async cargarEstadisticas() {
      // Si hay datos en caché, usar esos en lugar de hacer petición al servidor
      if (this.tareasCache && this.tareasCache.length > 0) {
        this.procesarEstadisticasDesdeData(this.tareasCache)
        return
      }
      
      try {
        this.cargando = true
        
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        if (!usuario.id) {
          console.error('No se encontró usuario logueado')
          return
        }
        
        // Obtener todas las tareas del usuario (solo si no hay caché)
        let todasLasTareas = []
        try {
          const esAdminUser = usuario.nivelAcceso === 1 || usuario.nivelAcceso === '1'
          if (esAdminUser) {
            todasLasTareas = await tareasApi.obtenerTodasLasTareas()
          } else {
            todasLasTareas = await tareasApi.obtenerTareasPorUsuario(parseInt(usuario.id))
          }
          
          // Guardar en caché
          this.tareasCache = todasLasTareas
          
          // Procesar estadísticas
          this.procesarEstadisticasDesdeData(todasLasTareas)
        } catch (error) {
          console.error('Error obteniendo tareas:', error)
          this.resetearEstadisticas()
        }
      } finally {
        this.cargando = false
      }
    },
    
    // Métodos helper para colorear las métricas
    getColorPorTasa(tasa) {
      if (tasa >= 80) return '#4CAF50' // Verde: excelente
      if (tasa >= 60) return '#FFC107' // Amarillo: bueno
      if (tasa >= 40) return '#FF9800' // Naranja: regular
      return '#F44336' // Rojo: malo
    },
    
    getColorPorEficiencia(eficiencia) {
      if (eficiencia >= 75) return '#4CAF50' // Verde: excelente
      if (eficiencia >= 50) return '#FFC107' // Amarillo: bueno
      if (eficiencia >= 25) return '#FF9800' // Naranja: regular
      return '#F44336' // Rojo: malo
    }
  }
}
</script>

<style scoped src="./EstadisticasTareasComponent.css"></style>
