import axios from 'axios'

const API_BASE_URL = `${process.env.VUE_APP_API_URL}/api`

// Configuración base de Axios con timeout aumentado
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos (aumentado de 10s)
  headers: {
    'Content-Type': 'application/json',
  }
})

// Interceptor para reintentos automáticos en caso de timeout
api.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config
    
    // Si no tiene configuración de reintentos, inicializarla
    if (!config.__retryCount) {
      config.__retryCount = 0
    }
    
    // Solo reintentar en caso de timeout o error de red, máximo 2 reintentos
    const shouldRetry = (
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') &&
      config.__retryCount < 2
    )
    
    if (shouldRetry) {
      config.__retryCount++
      
      // Backoff exponencial: 1s, 2s, 4s...
      const delayMs = Math.pow(2, config.__retryCount) * 1000
      
      console.log(`Reintentando petición (intento ${config.__retryCount}/2) después de ${delayMs}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delayMs))
      
      return api(config)
    }
    
    return Promise.reject(error)
  }
)

export const tareasApi = {
  // Configuración de módulos
  async verificarModuloActivo() {
    try {
      const response = await api.get('/configuracion-modulos/GESTOR_TAREAS/activo')
      return response.data.activo
    } catch (error) {
      console.error('Error verificando módulo activo:', error)
      return false
    }
  },

  async activarModulo() {
    const response = await api.post('/configuracion-modulos/GESTOR_TAREAS/activar')
    return response.data
  },

  async desactivarModulo() {
    const response = await api.post('/configuracion-modulos/GESTOR_TAREAS/desactivar')
    return response.data
  },

  // Tareas
  async obtenerTareasPorUsuario(usuarioId) {
    const response = await api.get(`/tareas/usuario/${usuarioId}`)
    return response.data
  },

  async obtenerTodasLasTareas() {
    const response = await api.get('/tareas')
    return response.data
  },

  async obtenerTareaPorId(id) {
    const response = await api.get(`/tareas/${id}`)
    return response.data
  },

  async crearTarea(tarea) {
    const response = await api.post('/tareas', tarea)
    return response.data
  },

  async actualizarTarea(id, tarea) {
    const response = await api.put(`/tareas/${id}`, tarea)
    return response.data
  },

  async cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo = null) {
    if (motivoBloqueo) {
      // Usar endpoint avanzado con motivo
      const response = await api.patch(`/tareas/${tareaId}/estado`, {
        estadoId: estadoId,
        motivoBloqueo: motivoBloqueo
      })
      return response.data
    } else {
      // Usar endpoint simple
      const response = await api.patch(`/tareas/${tareaId}/estado/${estadoId}`)
      return response.data
    }
  },

  async eliminarTarea(id) {
    await api.delete(`/tareas/${id}`)
  },

  async toggleFijada(id, fijada) {
    await api.patch(`/tareas/${id}/fijada`, { fijada })
  },

  async contarTareasActivasPorUsuario(usuarioId) {
    const response = await api.get(`/tareas/usuario/${usuarioId}/count`)
    return response.data.count
  },

  async obtenerTareasVencidas() {
    const response = await api.get('/tareas/vencidas')
    return response.data
  },

  async obtenerTareasPorVencer(dias = 7) {
    const response = await api.get(`/tareas/por-vencer?dias=${dias}`)
    return response.data
  },

  // Estados de tareas
  async obtenerEstados() {
    const response = await api.get('/tareas/estados')
    return response.data
  },

  async obtenerEstadosNoFinales() {
    const response = await api.get('/tareas/estados/no-finales')
    return response.data
  },

  // Notificaciones
  async obtenerNotificacionesPorUsuario(usuarioId) {
    const response = await api.get(`/notificaciones-tareas/usuario/${usuarioId}`)
    return response.data
  },

  async obtenerNotificacionesNoLeidas(usuarioId) {
    const response = await api.get(`/notificaciones-tareas/usuario/${usuarioId}/no-leidas`)
    return response.data
  },

  async contarNotificacionesNoLeidas(usuarioId) {
    const response = await api.get(`/notificaciones-tareas/usuario/${usuarioId}/count-no-leidas`)
    return response.data.count
  },

  async marcarNotificacionComoLeida(notificacionId) {
    const response = await api.patch(`/notificaciones-tareas/${notificacionId}/marcar-leida`)
    return response.data
  },

  async marcarTodasNotificacionesComoLeidas(usuarioId) {
    await api.patch(`/notificaciones-tareas/usuario/${usuarioId}/marcar-todas-leidas`)
  },

  async eliminarNotificacion(id) {
    await api.delete(`/notificaciones-tareas/${id}`)
  },

  // Comentarios
  async obtenerComentariosPorTarea(tareaId) {
    const response = await api.get(`/comentarios-tareas/tarea/${tareaId}`)
    return response.data
  },

  async crearComentario(comentario) {
    const response = await api.post('/comentarios-tareas', comentario)
    return response.data
  },

  async actualizarComentario(id, comentario) {
    const response = await api.put(`/comentarios-tareas/${id}`, { comentario })
    return response.data
  },

  async eliminarComentario(id) {
    await api.delete(`/comentarios-tareas/${id}`)
  },

  async toggleFijadoComentario(id) {
    const response = await api.patch(`/comentarios-tareas/${id}/fijado`)
    return response.data
  },

  async subirAdjuntoComentario(comentarioId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.post(`/comentarios-tareas/${comentarioId}/adjuntos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async descargarAdjunto(adjuntoId, nombreArchivo) {
    const response = await api.get(`/comentarios-tareas/adjuntos/${adjuntoId}`, {
      responseType: 'blob'
    })
    
    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', nombreArchivo)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async eliminarAdjunto(adjuntoId) {
    await api.delete(`/comentarios-tareas/adjuntos/${adjuntoId}`)
  },

  async actualizarAdjunto(adjuntoId, file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await api.put(`/comentarios-tareas/adjuntos/${adjuntoId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  async obtenerTareasPorCliente(clienteId) {
    const response = await api.get(`/tareas/cliente/${clienteId}`)
    return response.data
  },

  async obtenerEstadisticasPorUsuario(usuarioId, nivelAcceso = null) {
    try {
      let url = `/tareas/usuario/${usuarioId}/estadisticas`
      if (nivelAcceso !== null) {
        url += `?nivelAcceso=${nivelAcceso}`
      }
      const response = await api.get(url)
      return response.data
    } catch (error) {
      console.error('Error en obtenerEstadisticasPorUsuario:', error)
      throw error
    }
  },

  // Categorías y subcategorías
  async obtenerCategorias() {
    const response = await api.get('/tareas/categorias')
    return response.data
  },

  async obtenerCategoria(id) {
    const response = await api.get(`/tareas/categorias/${id}`)
    return response.data
  },

  async obtenerSubcategoriasPorCategoria(categoriaId) {
    const response = await api.get(`/tareas/categorias/${categoriaId}/subcategorias`)
    return response.data
  },

  async obtenerTodasSubcategorias() {
    const response = await api.get('/tareas/categorias/subcategorias')
    return response.data
  },

  // Auditoría e Historial
  async obtenerHistorialTarea(tareaId) {
    try {
      const response = await api.get(`/tareas/${tareaId}/historial`)
      return response.data
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      return []
    }
  },

  // Métricas de tiempo de una tarea
  async obtenerMetricasTarea(tareaId) {
    try {
      const tarea = await this.obtenerTareaPorId(tareaId)
      const historial = await this.obtenerHistorialTarea(tareaId)
      
      const metricas = this.calcularMetricasDesdeHistorial(historial, tarea)
      
      return {
        tarea,
        historial,
        metricas
      }
    } catch (error) {
      console.error('Error obteniendo métricas:', error)
      throw error
    }
  },

  // Calcular métricas desde el historial
  calcularMetricasDesdeHistorial(historial, tarea) {
    let tiempoActivoTotal = 0
    let tiempoBloqueadoTotal = 0
    let totalBloqueos = 0
    const bloqueos = []

    // Procesar cada registro del historial
    if (Array.isArray(historial)) {
      historial.forEach(h => {
        // Sumar tiempo activo
        if (h.duracionActivaSegundos && h.duracionActivaSegundos > 0) {
          tiempoActivoTotal += h.duracionActivaSegundos
        }
        
        // Procesar bloqueos
        if (h.estadoBloqueo === true) {
          totalBloqueos++
          
          // Calcular duración del bloqueo si hay tiempoBloqueoSegundos o fechas
          let duracionBloqueo = h.tiempoBloqueoSegundos || 0
          if (!duracionBloqueo && h.fechaInicio && h.fechaFin) {
            const inicio = new Date(h.fechaInicio)
            const fin = new Date(h.fechaFin)
            duracionBloqueo = Math.floor((fin - inicio) / 1000)
          }
          
          if (duracionBloqueo > 0) {
            tiempoBloqueadoTotal += duracionBloqueo
          }
          
          bloqueos.push({
            fechaInicio: h.fechaInicio,
            fechaFin: h.fechaFin,
            duracion: duracionBloqueo,
            motivo: h.motivoBloqueo || 'Sin motivo especificado',
            usuario: h.usuarioNombre
          })
        }
      })
    }

    // Si la tarea tiene valores precalculados, usarlos como referencia
    if (tarea && tarea.duracionActivaSegundos) {
      tiempoActivoTotal = Math.max(tiempoActivoTotal, tarea.duracionActivaSegundos)
    }
    if (tarea && tarea.tiempoBloqueadoSegundos) {
      tiempoBloqueadoTotal = Math.max(tiempoBloqueadoTotal, tarea.tiempoBloqueadoSegundos)
    }
    if (tarea && tarea.totalBloqueos) {
      totalBloqueos = Math.max(totalBloqueos, tarea.totalBloqueos)
    }

    const tiempoTotalSegundos = tiempoActivoTotal + tiempoBloqueadoTotal
    const eficiencia = tiempoTotalSegundos > 0 
      ? Math.round((tiempoActivoTotal / tiempoTotalSegundos) * 100) 
      : 100

    return {
      tiempoActivoTotal,
      tiempoBloqueadoTotal,
      tiempoTotalSegundos,
      totalBloqueos,
      bloqueos,
      eficiencia,
      fechaCreacion: tarea?.fechaCreacion,
      fechaFinalizacion: tarea?.fechaFinalizacion
    }
  }
}

export default tareasApi