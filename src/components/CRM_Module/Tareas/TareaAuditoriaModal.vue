<template>
  <div v-if="value" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auditoria-modal-title" @click="cerrar">
    <div class="modal-auditoria" @click.stop>
      <!-- Header -->
      <div class="modal-header aura-modal-header">
        <span class="aura-modal-header__icono" aria-hidden="true"><i class="fas fa-history"></i></span>
        <div class="aura-modal-header__titulos">
          <h2 id="auditoria-modal-title">Auditoría de la tarea</h2>
          <span v-if="tarea" class="aura-modal-header__subtitulo"><span><strong>{{ tarea.titulo }}</strong></span></span>
        </div>
        <button type="button" class="close-button" @click="cerrar" aria-label="Cerrar">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Loading -->
      <div v-if="cargando" class="modal-body">
        <div class="metricas-panel">
          <div class="skeleton-line skeleton-line--sm skeleton-panel-title"></div>
          <div class="metricas-grid">
            <div v-for="n in 4" :key="'metrica-skeleton-' + n" class="metrica-card">
              <div class="skeleton-line skeleton-line--icon"></div>
              <div class="metrica-info">
                <div class="skeleton-line skeleton-line--sm skeleton-metrica-valor"></div>
                <div class="skeleton-line skeleton-line--sm skeleton-metrica-label"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="timeline-container">
          <div v-for="n in 3" :key="'timeline-skeleton-' + n" class="skeleton-line skeleton-line--lg skeleton-timeline-item"></div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="modal-body">
        <!-- Resumen de Métricas -->
        <div class="metricas-panel">
          <h3 class="section-title">
            <i class="fas fa-chart-pie"></i>
            Resumen de tiempos
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
            <!-- Desglose de factores -->
            <div class="eficiencia-desglose">
              <span class="desglose-item">
                <i class="fas fa-play-circle"></i>
                Sin bloqueos: <strong>{{ metricas.factorBloqueos ?? 100 }}%</strong>
              </span>
              <span class="desglose-item" v-if="metricas.factorPuntualidad !== null && metricas.factorPuntualidad !== undefined">
                <i class="fas fa-calendar-check"></i>
                Puntualidad: <strong :class="metricas.factorPuntualidad < 50 ? 'text-danger' : metricas.factorPuntualidad < 80 ? 'text-warning' : 'text-success'">{{ metricas.factorPuntualidad }}%</strong>
              </span>
              <span class="desglose-item desglose-vencida" v-if="metricas.factorPuntualidad !== null && metricas.factorPuntualidad < 100">
                <i class="fas fa-exclamation-triangle"></i>
                Tarea vencida
              </span>
            </div>
          </div>
        </div>

        <!-- Timeline de Estados -->
        <div class="timeline-panel">
          <h3 class="section-title">
            <i class="fas fa-stream"></i>
            Historial de estados
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
            Detalle de bloqueos
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

        <!-- Información de fechas -->
        <div class="fechas-panel">
          <h3 class="section-title">
            <i class="fas fa-calendar-check"></i>
            Información de fechas
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
import { cargarExcelJS, descargarLibroExcel } from '@/utils/excel'
import { fechaLocalISO } from '@/utils/fechas'

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
        const ExcelJS = await cargarExcelJS()
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
        await descargarLibroExcel(workbook, `Auditoria_Tarea_${this.tareaId}_${fechaLocalISO()}.xlsx`)
      } catch (error) {
        console.error('Error exportando auditoría:', error)
        this.$swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al exportar la auditoría a Excel'
        })
      }
    },

    cerrar() {
      this.$emit('cerrar')
    }
  }
}
</script>

<style scoped src="./TareaAuditoriaModal.css"></style>
