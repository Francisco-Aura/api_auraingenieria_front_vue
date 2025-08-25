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
        pendientes: 0,
        enProgreso: 0,
        vencidas: 0,
        completadas: 0,
        total: 0
      },
      cargando: false
    }
  },
  computed: {
    porcentajeCompletadas() {
      if (this.estadisticas.totalSemana === 0) return 0
      return Math.round((this.estadisticas.completadasSemana / this.estadisticas.totalSemana) * 100)
    }
  },
  async mounted() {
    await this.cargarEstadisticas()
  },
  methods: {
    async cargarEstadisticas() {
      try {
        this.cargando = true
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
        
        if (!usuario.id) return
        
        // Obtener estadísticas del backend
        const stats = await tareasApi.obtenerEstadisticasPorUsuario(parseInt(usuario.id))
        this.estadisticas = {
          pendientes: stats.pendientes || 0,
          enProgreso: stats.enProgreso || 0,
          vencidas: stats.vencidas || 0,
          completadas: stats.completadasHoy || 0,
          completadasSemana: stats.completadasSemana || 0,
          totalSemana: stats.totalSemana || 0,
          total: (stats.pendientes || 0) + (stats.enProgreso || 0) + (stats.vencidas || 0) + (stats.completadasHoy || 0)
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error)
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
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.progreso-semanal {
  margin-top: 24px;
}

.progreso-semanal h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.1rem;
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
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  transition: width 0.3s ease;
}

.progreso-texto {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style>
