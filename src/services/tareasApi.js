import axios from 'axios'

// Interceptor para reintentos automáticos en caso de timeout
axios.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config

    if (!config.__retryCount) {
      config.__retryCount = 0
    }

    const metodo = (config.method || 'get').toLowerCase()
    const esIdempotente = metodo === 'get' || metodo === 'head'

    const shouldRetry = (
      esIdempotente &&
      (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') &&
      config.__retryCount < 2
    )

    if (shouldRetry) {
      config.__retryCount++

      const delayMs = Math.pow(2, config.__retryCount) * 1000

      await new Promise(resolve => setTimeout(resolve, delayMs))

      return axios(config)
    }

    return Promise.reject(error)
  }
)

export const tareasApi = {
  // Configuración de módulos
  async verificarModuloActivo() {
    try {
      const response = await axios.get('/configuracion-modulos/GESTOR_TAREAS/activo')
      return response.data.activo
    } catch (error) {
      console.error('Error verificando módulo activo:', error)
      return false
    }
  },

  async activarModulo() {
    const response = await axios.post('/configuracion-modulos/GESTOR_TAREAS/activar')
    return response.data
  },

  async desactivarModulo() {
    const response = await axios.post('/configuracion-modulos/GESTOR_TAREAS/desactivar')
    return response.data
  },

  // Tareas
  async obtenerTareasPorUsuario(usuarioId) {
    const response = await axios.get(`/tareas/usuario/${usuarioId}`)
    return response.data
  },

  async obtenerTodasLasTareas() {
    const response = await axios.get('/tareas')
    return response.data
  },

  async obtenerTareaPorId(id) {
    const response = await axios.get(`/tareas/${id}`)
    return response.data
  },

  async crearTarea(tarea) {
    const response = await axios.post('/tareas', tarea)
    return response.data
  },

  async subirAdjuntosTarea(tareaId, archivos) {
    const resultados = []
    const lista = Array.isArray(archivos) ? archivos : []
    for (const archivo of lista) {
      if (!(archivo instanceof Blob)) {
        console.warn('Adjunto omitido por formato inválido:', archivo)
        continue
      }
      const formData = new FormData()
      formData.append('file', archivo)
      const response = await axios.post(`/tareas/${tareaId}/adjuntos`, formData)
      resultados.push(response.data)
    }
    return resultados
  },

  async obtenerAdjuntosTarea(tareaId) {
    const response = await axios.get(`/tareas/${tareaId}/adjuntos`)
    return response.data
  },

  async actualizarTarea(id, tarea) {
    const response = await axios.put(`/tareas/${id}`, tarea)
    return response.data
  },

  async cambiarEstadoTarea(tareaId, estadoId, motivoBloqueo = null) {
    if (motivoBloqueo) {
      // Usar endpoint avanzado con motivo
      const response = await axios.patch(`/tareas/${tareaId}/estado`, {
        estadoId: estadoId,
        motivoBloqueo: motivoBloqueo
      })
      return response.data
    } else {
      // Usar endpoint simple
      const response = await axios.patch(`/tareas/${tareaId}/estado/${estadoId}`)
      return response.data
    }
  },

  async eliminarTarea(id) {
    await axios.delete(`/tareas/${id}`)
  },

  async toggleFijada(id, fijada) {
    await axios.patch(`/tareas/${id}/fijada`, { fijada })
  },

  async contarTareasActivasPorUsuario(usuarioId) {
    const response = await axios.get(`/tareas/usuario/${usuarioId}/count`)
    return response.data.count
  },

  async obtenerTareasVencidas() {
    const response = await axios.get('/tareas/vencidas')
    return response.data
  },

  async obtenerTareasPorVencer(dias = 7) {
    const response = await axios.get(`/tareas/por-vencer?dias=${dias}`)
    return response.data
  },

  // Estados de tareas
  async obtenerEstados() {
    const response = await axios.get('/tareas/estados')
    return response.data
  },

  async obtenerEstadosNoFinales() {
    const response = await axios.get('/tareas/estados/no-finales')
    return response.data
  },

  // Notificaciones
  async obtenerNotificacionesPorUsuario(usuarioId) {
    const response = await axios.get(`/notificaciones-tareas/usuario/${usuarioId}`)
    return response.data
  },

  async obtenerNotificacionesNoLeidas(usuarioId) {
    const response = await axios.get(`/notificaciones-tareas/usuario/${usuarioId}/no-leidas`)
    return response.data
  },

  async contarNotificacionesNoLeidas(usuarioId) {
    const response = await axios.get(`/notificaciones-tareas/usuario/${usuarioId}/count-no-leidas`)
    return response.data.count
  },

  async marcarNotificacionComoLeida(notificacionId) {
    const response = await axios.patch(`/notificaciones-tareas/${notificacionId}/marcar-leida`)
    return response.data
  },

  async marcarTodasNotificacionesComoLeidas(usuarioId) {
    await axios.patch(`/notificaciones-tareas/usuario/${usuarioId}/marcar-todas-leidas`)
  },

  async eliminarNotificacion(id) {
    await axios.delete(`/notificaciones-tareas/${id}`)
  },

  // Comentarios
  async obtenerComentariosPorTarea(tareaId) {
    const response = await axios.get(`/comentarios-tareas/tarea/${tareaId}`)
    return response.data
  },

  async crearComentario(comentario) {
    const response = await axios.post('/comentarios-tareas', comentario)
    return response.data
  },

  async actualizarComentario(id, comentario, usuarioId) {
    const response = await axios.put(`/comentarios-tareas/${id}`, { comentario, usuarioId })
    return response.data
  },

  async eliminarComentario(id, usuarioId) {
    await axios.delete(`/comentarios-tareas/${id}`, { params: { usuarioId } })
  },

  async toggleFijadoComentario(id) {
    const response = await axios.patch(`/comentarios-tareas/${id}/fijado`)
    return response.data
  },

  async subirAdjuntoComentario(comentarioId, file) {
    if (!(file instanceof Blob)) {
      throw new Error('Archivo inválido para adjunto de comentario')
    }
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.post(`/comentarios-tareas/${comentarioId}/adjuntos`, formData)
    return response.data
  },

  async descargarAdjunto(adjuntoId, nombreArchivo) {
    const response = await axios.get(`/comentarios-tareas/adjuntos/${adjuntoId}`, {
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
    await axios.delete(`/comentarios-tareas/adjuntos/${adjuntoId}`)
  },

  async actualizarAdjunto(adjuntoId, file) {
    if (!(file instanceof Blob)) {
      throw new Error('Archivo inválido para actualización de adjunto')
    }
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await axios.put(`/comentarios-tareas/adjuntos/${adjuntoId}`, formData)
    return response.data
  },

  async obtenerTareasPorCliente(clienteId) {
    const response = await axios.get(`/tareas/cliente/${clienteId}`)
    return response.data
  },

  async obtenerActividadCliente(clienteId, nivelAcceso = 0) {
    const response = await axios.get(`/clientes/${clienteId}/timeline/actividad`, {
      params: { nivelAcceso }
    })
    return response.data
  },

  async obtenerNotasCliente(clienteId) {
    const response = await axios.get(`/clientes/${clienteId}/timeline/notas`)
    return response.data
  },

  async crearNotaCliente(clienteId, payload, archivos) {
    const lista = Array.isArray(archivos) ? archivos.filter(a => a instanceof Blob || a instanceof File) : [];
    if (lista.length > 0) {
      const formData = new FormData();
      formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      lista.forEach(archivo => formData.append('archivos', archivo));
      const response = await axios.post(`/clientes/${clienteId}/timeline/notas`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }
    const response = await axios.post(`/clientes/${clienteId}/timeline/notas`, payload)
    return response.data
  },

  async actualizarNotaCliente(clienteId, notaId, payload, archivos) {
    const lista = Array.isArray(archivos) ? archivos.filter(a => a instanceof Blob || a instanceof File) : [];
    if (lista.length > 0) {
      const formData = new FormData();
      formData.append('datos', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      lista.forEach(archivo => formData.append('archivos', archivo));
      const response = await axios.put(`/clientes/${clienteId}/timeline/notas/${notaId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }
    const response = await axios.put(`/clientes/${clienteId}/timeline/notas/${notaId}`, payload)
    return response.data
  },

  async descargarArchivoNota(clienteId, notaId) {
    const response = await axios.get(`/clientes/${clienteId}/timeline/notas/${notaId}/descargar`, {
      responseType: 'blob'
    });
    return response;
  },

  async eliminarNotaCliente(clienteId, notaId) {
    await axios.delete(`/clientes/${clienteId}/timeline/notas/${notaId}`)
  },

  async eliminarArchivoNotaCliente(clienteId, notaId) {
    const response = await axios.delete(`/clientes/${clienteId}/timeline/notas/${notaId}/archivo`)
    return response.data
  },

  async descargarAdjuntoNota(clienteId, notaId, adjuntoId) {
    const response = await axios.get(`/clientes/${clienteId}/timeline/notas/${notaId}/adjuntos/${adjuntoId}/descargar`, {
      responseType: 'blob'
    });
    return response;
  },

  async eliminarAdjuntoNotaCliente(clienteId, notaId, adjuntoId) {
    const response = await axios.delete(`/clientes/${clienteId}/timeline/notas/${notaId}/adjuntos/${adjuntoId}`)
    return response.data
  },

  async toggleFijadaNota(clienteId, notaId) {
    const response = await axios.patch(`/clientes/${clienteId}/timeline/notas/${notaId}/fijado`)
    return response.data
  },

  async obtenerTareasVencenHoy(usuarioId, nivelAcceso) {
    const response = await axios.get('/tareas/vencen-hoy', { params: { usuarioId, nivelAcceso } })
    return response.data
  },

  async obtenerIncidenciasCliente(clienteId) {
    const response = await axios.get(`/clientes/${clienteId}/timeline/incidencias`)
    return response.data
  },

  async obtenerCarteraCupsCliente(clienteId) {
    const response = await axios.get(`/puntos-suministro/cliente/${clienteId}/cartera`)
    return response.data
  },

  async obtenerEstadisticasPorUsuario(usuarioId, nivelAcceso = null) {
    try {
      let url = `/tareas/usuario/${usuarioId}/estadisticas`
      if (nivelAcceso !== null) {
        url += `?nivelAcceso=${nivelAcceso}`
      }
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error('Error en obtenerEstadisticasPorUsuario:', error)
      throw error
    }
  },

  // Categorías y subcategorías
  async obtenerCategorias() {
    const response = await axios.get('/tareas/categorias')
    return response.data
  },

  async obtenerCategoria(id) {
    const response = await axios.get(`/tareas/categorias/${id}`)
    return response.data
  },

  async obtenerSubcategoriasPorCategoria(categoriaId) {
    const response = await axios.get(`/tareas/categorias/${categoriaId}/subcategorias`)
    return response.data
  },

  async obtenerTodasSubcategorias() {
    const response = await axios.get('/tareas/categorias/subcategorias')
    return response.data
  },

  // Auditoría e Historial
  async obtenerHistorialTarea(tareaId) {
    try {
      const response = await axios.get(`/tareas/${tareaId}/historial`)
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
  async obtenerUsuarios() {
    const response = await axios.get('/usuarios')
    return response.data
  },

  // Clientes
  async buscarClientes(params) {
    const response = await axios.get('/clientes/buscar', { params })
    return response.data
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

    // Factor 1: ratio de tiempo activo vs bloqueado (sin bloqueos = 100%)
    const factorBloqueos = tiempoTotalSegundos > 0
      ? (tiempoActivoTotal / tiempoTotalSegundos) * 100
      : 100

    // Factor 2: puntualidad — penaliza el retraso respecto al vencimiento
    let factorPuntualidad = 100
    const ahora = new Date()
    const fechaVenc = tarea?.fechaVencimiento ? new Date(tarea.fechaVencimiento) : null
    const fechaInic = tarea?.fechaInicio
      ? new Date(tarea.fechaInicio)
      : tarea?.fechaCreacion ? new Date(tarea.fechaCreacion) : null
    const fechaFin = tarea?.fechaFinalizacion ? new Date(tarea.fechaFinalizacion) : null
    const esFinalizada = tarea?.estadoFinal === true

    if (fechaVenc) {
      const fechaReferencia = (esFinalizada && fechaFin) ? fechaFin : ahora
      if (fechaReferencia > fechaVenc) {
        const retrasoMs = fechaReferencia - fechaVenc
        // Duración planificada mínimo 1 día para evitar penalización infinita
        const duracionPlanMs = fechaInic
          ? Math.max(fechaVenc - fechaInic, 24 * 60 * 60 * 1000)
          : 24 * 60 * 60 * 1000
        const penalizacion = Math.min(100, (retrasoMs / duracionPlanMs) * 100)
        factorPuntualidad = Math.max(0, 100 - penalizacion)
      }
    }

    // Eficiencia combinada:
    // - Sin vencimiento definido: solo factor bloqueos
    // - Con vencimiento: 35% bloqueos + 65% puntualidad
    const eficiencia = fechaVenc
      ? Math.round(factorBloqueos * 0.35 + factorPuntualidad * 0.65)
      : Math.round(factorBloqueos)

    return {
      tiempoActivoTotal,
      tiempoBloqueadoTotal,
      tiempoTotalSegundos,
      totalBloqueos,
      bloqueos,
      eficiencia,
      factorBloqueos: Math.round(factorBloqueos),
      factorPuntualidad: fechaVenc ? Math.round(factorPuntualidad) : null,
      fechaCreacion: tarea?.fechaCreacion,
      fechaFinalizacion: tarea?.fechaFinalizacion
    }
  }
  
}

export default tareasApi