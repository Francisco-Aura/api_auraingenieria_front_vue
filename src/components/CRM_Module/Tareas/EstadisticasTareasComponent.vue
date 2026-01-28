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
          <div class="stat-card" style="--color: #FF9800;">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.pendientes }}</div>
              <div class="stat-label">Pendientes</div>
            </div>
            <div class="stat-icon"><i class="fas fa-clock"></i></div>
          </div>

          <div class="stat-card" style="--color: #2196F3;">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.enProgreso }}</div>
              <div class="stat-label">En Progreso</div>
            </div>
            <div class="stat-icon"><i class="fas fa-play-circle"></i></div>
          </div>

          <div class="stat-card" style="--color: #F44336;">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.vencidas }}</div>
              <div class="stat-label">Vencidas</div>
            </div>
            <div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
          </div>

          <div class="stat-card" style="--color: #9C27B0;">
            <div class="stat-content">
              <div class="stat-number">{{ estadisticas.bloqueadas }}</div>
              <div class="stat-label">Bloqueadas</div>
            </div>
            <div class="stat-icon"><i class="fas fa-lock"></i></div>
          </div>

          <div class="stat-card" style="--color: #4CAF50;">
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
            <div class="metrica-item" :style="{ borderLeft: '4px solid #FF9800' }">
              <div class="metrica-header">
                <span class="metrica-label">Próximas a Vencer</span>
                <i class="fas fa-clock"></i>
              </div>
              <div class="metrica-valor" style="color: #FF9800;">
                {{ estadisticas.tareasProximasAVencer || 0 }}
              </div>
              <div class="metrica-descripcion">En los próximos 3 días</div>
            </div>

            <!-- Tareas Bloqueadas -->
            <div class="metrica-item" :style="{ borderLeft: '4px solid #9C27B0' }">
              <div class="metrica-header">
                <span class="metrica-label">Bloqueadas Actualmente</span>
                <i class="fas fa-lock"></i>
              </div>
              <div class="metrica-valor" style="color: #9C27B0;">
                {{ estadisticas.tareasBloqueadasPeriodo || 0 }}
              </div>
              <div class="metrica-descripcion">Requieren atención</div>
            </div>

            <!-- Tareas Sin Asignar -->
            <div class="metrica-item" :style="{ borderLeft: '4px solid #FF6B6B' }">
              <div class="metrica-header">
                <span class="metrica-label">Sin Asignar</span>
                <i class="fas fa-user-times"></i>
              </div>
              <div class="metrica-valor" style="color: #FF6B6B;">
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

<style scoped>
.estadisticas-container {
  background: white;
  border-radius: 12px;
  padding: 0;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Estilos para header desplegable */
.estadisticas-header {
  padding: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
}

.btn-toggle-estadisticas {
  width: 100%;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  transition: all 0.3s ease;
}

.btn-toggle-estadisticas:hover {
  background: rgba(99, 102, 241, 0.05);
}

.btn-toggle-estadisticas i:first-child {
  color: #6366f1;
  font-size: 1.2rem;
}

.btn-toggle-estadisticas span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.estadisticas-contenido {
  padding: 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-header-integrated {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header-left i {
  font-size: 1.1rem;
  color: #6366f1;
}

.header-left h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.periodo-badge {
  display: inline-block;
  background: #6366f1;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.filters-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-select-compact {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.filter-select-compact:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.filter-select-compact:hover {
  border-color: #9ca3af;
}

.filter-input-compact {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 130px;
}

.filter-input-compact:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.date-inputs-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.stats-content {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #f3f4f6;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: var(--color);
}

.stat-content {
  z-index: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 4px;
}

.stat-icon {
  font-size: 1.8rem;
  color: var(--color);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
  opacity: 1;
}

.progreso-semanal {
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f3f4f6;
}

.progreso-semanal h3 {
  margin: 0 0 12px 0;
  color: #334155;
  font-size: 1rem;
  font-weight: 600;
}

.progreso-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progreso-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%);
  transition: width 0.5s ease;
}

.progreso-texto {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
  text-align: center;
  font-weight: 500;
}

/* Estilos para Métricas Avanzadas */
.metricas-avanzadas {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.metricas-avanzadas h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.metricas-avanzadas h3 i {
  color: #6366f1;
}

.metricas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metrica-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.metrica-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: #6366f1;
}

.metrica-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metrica-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.metrica-header i {
  font-size: 1rem;
  color: #6366f1;
  opacity: 0.7;
}

.metrica-valor {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 8px 0;
}

.metrica-barra {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

.metrica-relleno {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.metrica-descripcion {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .stats-header-integrated {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .header-left {
    justify-content: center;
    text-align: center;
  }
  
  .filters-compact {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }
  
  .metricas-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
