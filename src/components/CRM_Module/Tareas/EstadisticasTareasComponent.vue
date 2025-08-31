<template>
  <div class="estadisticas-tareas">
    <div class="stats-grid">
      <div class="stat-card pendientes">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ estadisticas.pendientes }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
      </div>

      <div class="stat-card en-progreso">
        <div class="stat-icon">
          <i class="fas fa-play-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ estadisticas.enProgreso }}</div>
          <div class="stat-label">En Progreso</div>
        </div>
      </div>

      <div class="stat-card vencidas">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ estadisticas.vencidas }}</div>
          <div class="stat-label">Vencidas</div>
        </div>
      </div>

      <div class="stat-card completadas">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ estadisticas.completadas }}</div>
          <div class="stat-label">Completadas Hoy</div>
        </div>
      </div>
    </div>

    <!-- Gráfico de progreso semanal -->
    <div class="progreso-semanal">
      <h3>Progreso Semanal</h3>
      <div class="progreso-bar">
        <div 
          class="progreso-fill" 
          :style="{ width: porcentajeCompletadas + '%' }"
        ></div>
      </div>
      <p class="progreso-texto">
        {{ estadisticas.completadasSemana }} de {{ estadisticas.totalSemana }} tareas completadas esta semana
      </p>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'EstadisticasTareasComponent',
  data() {
    return {
      estadisticas: {
        total: 0,
        pendientes: 0,
        enProgreso: 0,
        completadas: 0,
        vencidas: 0
      },
      cargando: false
    }
  },
  computed: {
  },
  async mounted() {
    await this.cargarEstadisticas()
  },
  methods: {
    async cargarEstadisticas() {
      try {
        this.cargando = true
        
        // Obtener tareas según el usuario
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        let tareas = []
        
        if (usuario && usuario.nivelAcceso === 1) {
          // Admin: ver todas las tareas
          tareas = await tareasApi.obtenerTodasLasTareas()
        } else {
          if (!usuario.id) {
            console.error('No se encontró usuario logueado')
            return
          }
          tareas = await tareasApi.obtenerTareasPorUsuario(parseInt(usuario.id))
        }
        
        // Obtener estados para identificar cuáles son finales
        const estados = await tareasApi.obtenerEstados()
        const estadosFinales = estados.filter(e => e.estadoFinal === true).map(e => e.id)
        const estadosEnProgreso = estados.filter(e => 
          !e.estadoFinal && 
          e.nombre.toLowerCase().includes('progreso') || 
          e.nombre.toLowerCase().includes('proceso') ||
          e.nombre.toLowerCase().includes('trabajando')
        ).map(e => e.id)
        
        // Calcular estadísticas en tiempo real
        const ahora = new Date()
        
        this.estadisticas = {
          total: tareas.length,
          pendientes: tareas.filter(t => 
            !estadosFinales.includes(t.estadoId) && 
            !estadosEnProgreso.includes(t.estadoId)
          ).length,
          enProgreso: tareas.filter(t => estadosEnProgreso.includes(t.estadoId)).length,
          completadas: tareas.filter(t => estadosFinales.includes(t.estadoId)).length,
          vencidas: tareas.filter(t => {
            if (!t.fechaVencimiento || estadosFinales.includes(t.estadoId)) return false
            return new Date(t.fechaVencimiento) < ahora
          }).length
        }
        
      } catch (error) {
        console.error('Error cargando estadísticas:', error)
        // Mantener estadísticas en 0 en caso de error
        this.estadisticas = {
          total: 0,
          pendientes: 0,
          enProgreso: 0,
          completadas: 0,
          vencidas: 0
        }
      } finally {
        this.cargando = false
      }
    }
  }
}
</script>

<style scoped>
.estadisticas-tareas {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  border: 1px solid #e9ecef;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: white;
}

.stat-card.pendientes .stat-icon {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

.stat-card.en-progreso .stat-icon {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.stat-card.vencidas .stat-icon {
  background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
}

.stat-card.completadas .stat-icon {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
}

.stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  color: black;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

.progreso-semanal {
  margin-top: 16px;
}

.progreso-semanal h3 {
  margin: 0 0 8px 0;
  color: black;
  font-size: 0.9rem;
  font-weight: 600;
}

.progreso-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progreso-fill {
  height: 100%;
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  transition: width 0.3s ease;
}

.progreso-texto {
  margin: 0;
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 10px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
  
  .stat-icon {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}
</style>
