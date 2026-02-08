<template>
  <div v-if="value" class="modal-overlay" @click="cerrar">
    <div class="modal-auditoria" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-title">
            <i class="fas fa-history"></i>
            <h2>Auditoría de Tarea</h2>
          </div>
          <span class="tarea-titulo" v-if="tarea">{{ tarea.titulo }}</span>
        </div>
        <button class="close-button" @click="cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="loading-container">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Cargando auditoría...</p>
      </div>

      <!-- Content -->
      <div v-else class="modal-body">
        <!-- Resumen de Métricas -->
        <div class="metricas-panel">
          <h3 class="section-title">
            <i class="fas fa-chart-pie"></i>
            Resumen de Tiempos
          </h3>
          
          <div class="metricas-grid">
            <!-- Tiempo Total -->
            <div class="metrica-card total">
              <div class="metrica-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="metrica-info">
                <span class="metrica-valor">{{ formatearDuracion(metricas.tiempoTotalSegundos) }}</span>
                <span class="metrica-label">Tiempo Total</span>
              </div>
            </div>

            <!-- Tiempo Activo -->
            <div class="metrica-card activo">
              <div class="metrica-icon">
                <i class="fas fa-play-circle"></i>
              </div>
              <div class="metrica-info">
                <span class="metrica-valor">{{ formatearDuracion(metricas.tiempoActivoTotal) }}</span>
                <span class="metrica-label">Tiempo Activo</span>
              </div>
            </div>

            <!-- Tiempo Bloqueado -->
            <div class="metrica-card bloqueado">
              <div class="metrica-icon">
                <i class="fas fa-pause-circle"></i>
              </div>
              <div class="metrica-info">
                <span class="metrica-valor">{{ formatearDuracion(metricas.tiempoBloqueadoTotal) }}</span>
                <span class="metrica-label">Tiempo Bloqueado</span>
              </div>
            </div>

            <!-- Bloqueos -->
            <div class="metrica-card bloqueos">
              <div class="metrica-icon">
                <i class="fas fa-lock"></i>
              </div>
              <div class="metrica-info">
                <span class="metrica-valor">{{ metricas.totalBloqueos || 0 }}</span>
                <span class="metrica-label">Total Bloqueos</span>
              </div>
            </div>
          </div>

          <!-- Barra de Eficiencia -->
          <div class="eficiencia-container">
            <div class="eficiencia-header">
              <span class="eficiencia-label">Eficiencia de Trabajo</span>
              <span class="eficiencia-valor" :class="getEficienciaClass(metricas.eficiencia)">
                {{ metricas.eficiencia || 0 }}%
              </span>
            </div>
            <div class="eficiencia-bar">
              <div 
                class="eficiencia-progress" 
                :style="{ width: (metricas.eficiencia || 0) + '%' }"
                :class="getEficienciaClass(metricas.eficiencia)"
              ></div>
            </div>
            <div class="eficiencia-leyenda">
              <span class="leyenda-item activo">
                <span class="leyenda-dot"></span>
                Tiempo productivo
              </span>
              <span class="leyenda-item bloqueado">
                <span class="leyenda-dot"></span>
                Tiempo bloqueado
              </span>
            </div>
          </div>
        </div>

        <!-- Timeline de Estados -->
        <div class="timeline-panel">
          <h3 class="section-title">
            <i class="fas fa-stream"></i>
            Historial de Estados
          </h3>

          <div class="timeline-container" v-if="historial.length > 0">
            <div 
              v-for="(evento, index) in historial" 
              :key="evento.id" 
              class="timeline-item"
              :class="{ 
                'bloqueo': evento.estadoBloqueo,
                'activo': evento.estadoCuentaTiempo,
                'ultimo': index === 0
              }"
            >
              <div class="timeline-marker">
                <div class="marker-dot" :style="{ backgroundColor: evento.estadoColor || '#6c757d' }">
                  <i :class="getEstadoIcon(evento)"></i>
                </div>
                <div class="marker-line" v-if="index < historial.length - 1"></div>
              </div>
              
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="estado-badge" :style="{ backgroundColor: evento.estadoColor || '#6c757d' }">
                    {{ formatearEstadoNombre(evento.estadoNombre) }}
                  </span>
                  <span class="timeline-fecha">
                    <i class="fas fa-calendar-alt"></i>
                    {{ formatearFechaCompleta(evento.fechaInicio) }}
                  </span>
                </div>

                <div class="timeline-body">
                  <div class="timeline-duracion" v-if="evento.fechaFin">
                    <i class="fas fa-hourglass-half"></i>
                    <span>Duración: <strong>{{ calcularDuracionEvento(evento) }}</strong></span>
                  </div>
                  <div class="timeline-duracion activo-tag" v-else>
                    <i class="fas fa-hourglass-start"></i>
                    <span>Estado actual</span>
                  </div>

                  <!-- Motivo de bloqueo -->
                  <div class="motivo-bloqueo" v-if="evento.motivoBloqueo">
                    <div class="motivo-header">
                      <i class="fas fa-exclamation-triangle"></i>
                      <span>Motivo del bloqueo:</span>
                    </div>
                    <p class="motivo-texto">{{ evento.motivoBloqueo }}</p>
                  </div>

                  <!-- Comentario -->
                  <div class="evento-comentario" v-if="evento.comentario">
                    <i class="fas fa-comment"></i>
                    <span>{{ evento.comentario }}</span>
                  </div>

                  <!-- Usuario que realizó la acción -->
                  <div class="timeline-usuario" v-if="evento.usuarioNombre">
                    <i class="fas fa-user"></i>
                    <span>{{ evento.usuarioNombre }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="no-historial">
            <i class="fas fa-info-circle fa-2x"></i>
            <p>No hay historial de cambios registrado</p>
          </div>
        </div>

        <!-- Resumen de Bloqueos -->
        <div class="bloqueos-panel" v-if="metricas.bloqueos && metricas.bloqueos.length > 0">
          <h3 class="section-title">
            <i class="fas fa-ban"></i>
            Detalle de Bloqueos
          </h3>

          <div class="bloqueos-tabla">
            <table>
              <thead>
                <tr>
                  <th><i class="fas fa-calendar"></i> Fecha</th>
                  <th><i class="fas fa-clock"></i> Duración</th>
                  <th><i class="fas fa-comment-alt"></i> Motivo</th>
                  <th><i class="fas fa-user"></i> Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bloqueo, index) in metricas.bloqueos" :key="index">
                  <td>{{ formatearFecha(bloqueo.fechaInicio) }}</td>
                  <td class="duracion-cell">
                    <span class="duracion-badge">{{ formatearDuracion(bloqueo.duracion) }}</span>
                  </td>
                  <td class="motivo-cell">
                    <span class="motivo-truncated" :title="bloqueo.motivo">
                      {{ bloqueo.motivo || 'Sin especificar' }}
                    </span>
                  </td>
                  <td>{{ bloqueo.usuario || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Estadísticas de Bloqueos -->
          <div class="bloqueos-stats">
            <div class="stat-item">
              <span class="stat-label">Promedio por bloqueo:</span>
              <span class="stat-value">{{ calcularPromedioBloqueos() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bloqueo más largo:</span>
              <span class="stat-value">{{ calcularBloqueoMasLargo() }}</span>
            </div>
          </div>
        </div>

        <!-- Información de Fechas -->
        <div class="fechas-panel">
          <h3 class="section-title">
            <i class="fas fa-calendar-check"></i>
            Información de Fechas
          </h3>
          <div class="fechas-grid">
            <div class="fecha-item">
              <i class="fas fa-plus-circle"></i>
              <div class="fecha-info">
                <span class="fecha-label">Fecha de Creación</span>
                <span class="fecha-valor">{{ formatearFechaCompleta(metricas.fechaCreacion) }}</span>
              </div>
            </div>
            <div class="fecha-item" v-if="metricas.fechaFinalizacion">
              <i class="fas fa-check-circle"></i>
              <div class="fecha-info">
                <span class="fecha-label">Fecha de Finalización</span>
                <span class="fecha-valor">{{ formatearFechaCompleta(metricas.fechaFinalizacion) }}</span>
              </div>
            </div>
            <div class="fecha-item" v-else>
              <i class="fas fa-spinner"></i>
              <div class="fecha-info">
                <span class="fecha-label">Estado</span>
                <span class="fecha-valor estado-en-curso">En curso</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="cerrar">
          <i class="fas fa-times"></i>
          Cerrar
        </button>
        <button class="btn btn-primary" @click="exportarAuditoria">
          <i class="fas fa-file-export"></i>
          Exportar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { tareasApi } from '@/services/tareasApi'

export default {
  name: 'TareaAuditoriaModal',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    tareaId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      cargando: false,
      tarea: null,
      historial: [],
      metricas: {
        tiempoActivoTotal: 0,
        tiempoBloqueadoTotal: 0,
        tiempoTotalSegundos: 0,
        totalBloqueos: 0,
        bloqueos: [],
        eficiencia: 100,
        fechaCreacion: null,
        fechaFinalizacion: null
      }
    }
  },
  watch: {
    value: {
      handler(newVal) {
        if (newVal && this.tareaId) {
          this.cargarAuditoria()
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Cargar si el modal se abre directamente
    if (this.value && this.tareaId) {
      this.cargarAuditoria()
    }
  },
  methods: {
    async cargarAuditoria() {
      this.cargando = true
      try {

        const datos = await tareasApi.obtenerMetricasTarea(this.tareaId)

        this.tarea = datos.tarea
        this.historial = datos.historial || []
        this.metricas = datos.metricas || {
          tiempoActivoTotal: 0,
          tiempoBloqueadoTotal: 0,
          tiempoTotalSegundos: 0,
          totalBloqueos: 0,
          bloqueos: [],
          eficiencia: 100,
          fechaCreacion: null,
          fechaFinalizacion: null
        }

      } catch (error) {
        console.error('Error cargando auditoría:', error)
      } finally {
        this.cargando = false
      }
    },

    formatearDuracion(segundos) {
      if (!segundos || segundos <= 0) return '0m'
      
      const dias = Math.floor(segundos / 86400)
      const horas = Math.floor((segundos % 86400) / 3600)
      const minutos = Math.floor((segundos % 3600) / 60)
      
      let resultado = ''
      if (dias > 0) resultado += `${dias}d `
      if (horas > 0) resultado += `${horas}h `
      if (minutos > 0 || resultado === '') resultado += `${minutos}m`
      
      return resultado.trim()
    },

    formatearFecha(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatearFechaCompleta(fecha) {
      if (!fecha) return '-'
      return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatearEstadoNombre(nombre) {
      if (!nombre) return ''
      return nombre.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, t => t.toUpperCase())
    },

    calcularDuracionEvento(evento) {
      if (!evento.fechaInicio || !evento.fechaFin) return 'En curso'
      
      const inicio = new Date(evento.fechaInicio)
      const fin = new Date(evento.fechaFin)
      const segundos = Math.floor((fin - inicio) / 1000)
      
      return this.formatearDuracion(segundos)
    },

    getEstadoIcon(evento) {
      if (evento.estadoBloqueo) return 'fas fa-lock'
      if (evento.estadoCuentaTiempo) return 'fas fa-play'
      if (evento.estadoNombre?.toLowerCase().includes('complet')) return 'fas fa-check'
      if (evento.estadoNombre?.toLowerCase().includes('pendiente')) return 'fas fa-clock'
      return 'fas fa-circle'
    },

    getEficienciaClass(eficiencia) {
      if (eficiencia >= 80) return 'excelente'
      if (eficiencia >= 60) return 'buena'
      if (eficiencia >= 40) return 'regular'
      return 'baja'
    },

    calcularPromedioBloqueos() {
      if (!this.metricas.bloqueos || this.metricas.bloqueos.length === 0) return '0m'
      const total = this.metricas.bloqueos.reduce((sum, b) => sum + (b.duracion || 0), 0)
      const promedio = total / this.metricas.bloqueos.length
      return this.formatearDuracion(promedio)
    },

    calcularBloqueoMasLargo() {
      if (!this.metricas.bloqueos || this.metricas.bloqueos.length === 0) return '0m'
      const max = Math.max(...this.metricas.bloqueos.map(b => b.duracion || 0))
      return this.formatearDuracion(max)
    },

    async exportarAuditoria() {
      try {
        const ExcelJS = require('exceljs')
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Auditoría de Tarea')
        
        // Configurar título
        worksheet.mergeCells('A1:F1')
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'REPORTE DE AUDITORÍA DE TAREA'
        titleCell.font = { size: 16, bold: true }
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getRow(1).height = 30
        
        // Información de la tarea
        worksheet.addRow([])
        worksheet.addRow(['Tarea:', this.tarea?.titulo || 'N/A'])
        worksheet.addRow(['ID:', this.tareaId])
        worksheet.addRow(['Fecha del reporte:', new Date().toLocaleString('es-ES')])
        
        // Estilo para información básica (filas 3-5)
        for (let i = 3; i <= 5; i++) {
          worksheet.getCell(i, 1).font = { bold: true }
          worksheet.getCell(i, 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          }
          worksheet.getCell(i, 1).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          worksheet.getCell(i, 2).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
        
        worksheet.addRow([])
        
        // Métricas de tiempo
        worksheet.addRow(['MÉTRICAS DE TIEMPO'])
        worksheet.mergeCells('A7:F7')
        const metricasHeaderCell = worksheet.getCell('A7')
        metricasHeaderCell.font = { bold: true, size: 12 }
        metricasHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0D0' }
        }
        metricasHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' }
        metricasHeaderCell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        }
        worksheet.getRow(7).height = 22
        
        // Métricas individuales
        const metricas = [
          { label: 'Tiempo Total:', value: this.formatearDuracion(this.metricas.tiempoTotalSegundos) },
          { label: 'Tiempo Activo:', value: this.formatearDuracion(this.metricas.tiempoActivoTotal) },
          { label: 'Tiempo Bloqueado:', value: this.formatearDuracion(this.metricas.tiempoBloqueadoTotal) },
          { label: 'Total Bloqueos:', value: String(this.metricas.totalBloqueos) },
          { label: 'Eficiencia:', value: this.metricas.eficiencia + '%' }
        ]
        
        metricas.forEach(metrica => {
          const row = worksheet.addRow([metrica.label, metrica.value])
          row.getCell(1).font = { bold: true }
          row.getCell(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' }
          }
          row.getCell(1).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          row.getCell(2).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
          row.height = 20
        })
        
        worksheet.addRow([])
        
        // Historial de estados
        const historialTitleRow = worksheet.addRow(['HISTORIAL DE ESTADOS'])
        worksheet.mergeCells(`A${historialTitleRow.number}:F${historialTitleRow.number}`)
        const historialTitleCell = worksheet.getCell(`A${historialTitleRow.number}`)
        historialTitleCell.font = { bold: true, size: 12 }
        historialTitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD0D0D0' }
        }
        historialTitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        historialTitleCell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        }
        historialTitleRow.height = 22
        
        // Encabezados de tabla
        const headerRow = worksheet.addRow(['#', 'Estado', 'Fecha Inicio', 'Duración', 'Usuario', 'Motivo Bloqueo'])
        headerRow.font = { bold: true }
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8E8E8' }
        }
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
        headerRow.height = 22
        
        // Aplicar bordes a los encabezados
        for (let j = 1; j <= 6; j++) {
          headerRow.getCell(j).border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'medium' },
            right: { style: 'thin' }
          }
        }
        
        // Datos del historial - CORREGIR CÁLCULO DE DURACIONES
        this.historial.forEach((h, i) => {
          // La duración debe ser la que ya viene calculada en el registro del historial
          // No intentar sumar o calcular aquí, usar directamente los valores
          let duracion = '-'
          
          // Si es un estado que cuenta tiempo activo (no bloqueado)
          if (h.duracionActivaSegundos && h.duracionActivaSegundos > 0) {
            duracion = this.formatearDuracion(h.duracionActivaSegundos)
          } 
          // Si es un estado bloqueado
          else if (h.tiempoBloqueadoSegundos && h.tiempoBloqueadoSegundos > 0) {
            duracion = this.formatearDuracion(h.tiempoBloqueadoSegundos)
          }
          // Si no tiene duraciones específicas, intentar calcular desde las fechas
          else if (h.fechaFin && h.fechaInicio) {
            const inicio = new Date(h.fechaInicio)
            const fin = new Date(h.fechaFin)
            const segundos = Math.floor((fin - inicio) / 1000)
            if (segundos > 0) {
              duracion = this.formatearDuracion(segundos)
            }
          }
          
          const row = worksheet.addRow([
            i + 1,
            this.formatearEstadoNombre(h.estadoNombre),
            this.formatearFecha(h.fechaInicio),
            duracion,
            h.usuarioNombre || '-',
            h.motivoBloqueo || '-'
          ])
          
          // Bordes para todas las celdas
          for (let j = 1; j <= 6; j++) {
            row.getCell(j).border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
          }
          
          // Color de fondo alternado suave
          if (i % 2 === 0) {
            for (let j = 1; j <= 6; j++) {
              row.getCell(j).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFAFAFA' }
              }
            }
          }
          
          row.height = 20
          row.alignment = { vertical: 'middle' }
        })
        
        // Ajustar anchos de columnas
        worksheet.columns = [
          { width: 6 },   // #
          { width: 16 },  // Estado
          { width: 20 },  // Fecha
          { width: 15 },  // Duración
          { width: 20 },  // Usuario
          { width: 45 }   // Motivo Bloqueo
        ]
        
        // Generar y descargar el archivo
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Auditoria_Tarea_${this.tareaId}_${new Date().toISOString().split('T')[0]}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error exportando auditoría:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al exportar la auditoría a Excel'
        })
      }
    },

    generarReporteAuditoria() {
      let reporte = `REPORTE DE AUDITORÍA DE TAREA\n`
      reporte += `================================\n\n`
      reporte += `Tarea: ${this.tarea?.titulo || 'N/A'}\n`
      reporte += `ID: ${this.tareaId}\n`
      reporte += `Fecha del reporte: ${new Date().toLocaleString('es-ES')}\n\n`
      
      reporte += `MÉTRICAS DE TIEMPO\n`
      reporte += `------------------\n`
      reporte += `Tiempo Total: ${this.formatearDuracion(this.metricas.tiempoTotalSegundos)}\n`
      reporte += `Tiempo Activo: ${this.formatearDuracion(this.metricas.tiempoActivoTotal)}\n`
      reporte += `Tiempo Bloqueado: ${this.formatearDuracion(this.metricas.tiempoBloqueadoTotal)}\n`
      reporte += `Total Bloqueos: ${this.metricas.totalBloqueos}\n`
      reporte += `Eficiencia: ${this.metricas.eficiencia}%\n\n`
      
      reporte += `HISTORIAL DE ESTADOS\n`
      reporte += `--------------------\n`
      this.historial.forEach((h, i) => {
        reporte += `${i + 1}. ${this.formatearEstadoNombre(h.estadoNombre)}\n`
        reporte += `   Fecha: ${this.formatearFecha(h.fechaInicio)}\n`
        if (h.motivoBloqueo) {
          reporte += `   Motivo bloqueo: ${h.motivoBloqueo}\n`
        }
        if (h.usuarioNombre) {
          reporte += `   Usuario: ${h.usuarioNombre}\n`
        }
        reporte += `\n`
      })
      
      return reporte
    },

    cerrar() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-auditoria {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header */
.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 12px 12px 0 0;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.header-title i {
  font-size: 1.3rem;
}

.tarea-titulo {
  font-size: 0.9rem;
  opacity: 0.9;
  max-width: 500px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #6c757d;
  gap: 16px;
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.section-title i {
  color: #667eea;
}

/* Métricas Panel */
.metricas-panel {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
}

.metricas-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.metrica-card {
  background: white;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metrica-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metrica-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.metrica-card.total .metrica-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.metrica-card.activo .metrica-icon {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.metrica-card.bloqueado .metrica-icon {
  background: linear-gradient(135deg, #dc3545, #fd7e14);
  color: white;
}

.metrica-card.bloqueos .metrica-icon {
  background: linear-gradient(135deg, #6c757d, #495057);
  color: white;
}

.metrica-info {
  display: flex;
  flex-direction: column;
}

.metrica-valor {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}

.metrica-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Eficiencia */
.eficiencia-container {
  background: white;
  border-radius: 10px;
  padding: 16px;
}

.eficiencia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.eficiencia-label {
  font-weight: 600;
  color: #333;
}

.eficiencia-valor {
  font-size: 1.2rem;
  font-weight: 700;
}

.eficiencia-valor.excelente { color: #28a745; }
.eficiencia-valor.buena { color: #20c997; }
.eficiencia-valor.regular { color: #ffc107; }
.eficiencia-valor.baja { color: #dc3545; }

.eficiencia-bar {
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
}

.eficiencia-progress {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.eficiencia-progress.excelente { background: linear-gradient(90deg, #28a745, #20c997); }
.eficiencia-progress.buena { background: linear-gradient(90deg, #20c997, #28a745); }
.eficiencia-progress.regular { background: linear-gradient(90deg, #ffc107, #fd7e14); }
.eficiencia-progress.baja { background: linear-gradient(90deg, #dc3545, #fd7e14); }

.eficiencia-leyenda {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.8rem;
  color: #6c757d;
}

.leyenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.leyenda-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.leyenda-item.activo .leyenda-dot { background: #28a745; }
.leyenda-item.bloqueado .leyenda-dot { background: #dc3545; }

/* Timeline */
.timeline-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.timeline-container {
  position: relative;
  padding-left: 10px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
  position: relative;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.marker-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.marker-line {
  width: 2px;
  flex: 1;
  background: #dee2e6;
  margin-top: 4px;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 14px;
  border-left: 3px solid transparent;
}

.timeline-item.ultimo .timeline-content {
  background: rgba(102, 126, 234, 0.08);
  border-left-color: #667eea;
}

.timeline-item.bloqueo .timeline-content {
  background: rgba(220, 53, 69, 0.05);
  border-left-color: #dc3545;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.estado-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.timeline-fecha {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-duracion {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #495057;
}

.timeline-duracion.activo-tag {
  color: #28a745;
  font-weight: 600;
}

.motivo-bloqueo {
  background: rgba(220, 53, 69, 0.08);
  border-radius: 6px;
  padding: 10px;
  margin-top: 6px;
}

.motivo-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 4px;
}

.motivo-texto {
  margin: 0;
  font-size: 0.85rem;
  color: #495057;
  line-height: 1.4;
}

.evento-comentario {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
}

.timeline-usuario {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #6c757d;
}

.no-historial {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* Bloqueos Panel */
.bloqueos-panel {
  background: #fff5f5;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #ffcccc;
}

.bloqueos-tabla {
  overflow-x: auto;
}

.bloqueos-tabla table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.bloqueos-tabla th,
.bloqueos-tabla td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #ffe0e0;
}

.bloqueos-tabla th {
  background: rgba(220, 53, 69, 0.08);
  font-weight: 600;
  color: #dc3545;
}

.bloqueos-tabla th i {
  margin-right: 6px;
}

.bloqueos-tabla tr:hover {
  background: rgba(220, 53, 69, 0.04);
}

.duracion-badge {
  background: #dc3545;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.motivo-truncated {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.bloqueos-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #ffcccc;
}

.stat-item {
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
}

.stat-label {
  color: #6c757d;
}

.stat-value {
  font-weight: 600;
  color: #dc3545;
}

/* Fechas Panel */
.fechas-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.fechas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.fecha-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.fecha-item i {
  font-size: 1.5rem;
  color: #667eea;
}

.fecha-info {
  display: flex;
  flex-direction: column;
}

.fecha-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.fecha-valor {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
  text-transform: capitalize;
}

.estado-en-curso {
  color: #28a745;
  font-weight: 600;
}

/* Footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-primary {
  background: linear-gradient(135deg, #1d6f42 0%, #27ae60 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(29, 111, 66, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-auditoria {
    max-height: 100vh;
    border-radius: 0;
  }

  .metricas-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .fechas-grid {
    grid-template-columns: 1fr;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .bloqueos-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
