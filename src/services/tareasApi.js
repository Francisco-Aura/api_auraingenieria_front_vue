import axios from 'axios'

const API_BASE_URL = 'http://localhost:8986/api'

// Configuración base de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

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

  async cambiarEstadoTarea(tareaId, estadoId) {
    const response = await api.patch(`/tareas/${tareaId}/estado/${estadoId}`)
    return response.data
  },

  async eliminarTarea(id) {
    await api.delete(`/tareas/${id}`)
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

  async obtenerTareasPorCliente(clienteId) {
    const response = await api.get(`/tareas/cliente/${clienteId}`)
    return response.data
  },

  async obtenerEstadisticasPorUsuario(usuarioId) {
    const response = await api.get(`/tareas/usuario/${usuarioId}/estadisticas`)
    return response.data
  }
}

export default tareasApi