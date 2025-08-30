<template>
  <div class="tareas-tabla-container">
    <!-- Cabecera con título y botón de nueva tarea -->
    <div class="tabla-header">
      <h2 class="tabla-title">
        <i class="fas fa-tasks"></i>
        {{ esVistaAdmin ? 'Todas las Tareas' : 'Mis Tareas' }}
        <span class="task-count">({{ tareasFiltradas.length }})</span>
      </h2>
      <button class="btn btn-primary btn-nueva-tarea" @click="$emit('nueva-tarea')">
        <i class="fas fa-plus"></i>
        Nueva Tarea
      </button>
    </div>

    <!-- Filtros -->
    <div class="filtros-container">
      <div class="filtro-group">
        <label>Tipo</label>
        <select v-model="filtros.tipo" @change="aplicarFiltros" class="form-control">
          <option value="">Todos</option>
          <option value="Llamada">📞 Llamada</option>
          <option value="Correo">✉️ Correo</option>
          <option value="Reunión">👥 Reunión</option>
          <option value="Visita">🏢 Visita</option>
          <option value="Por hacer">📋 Por hacer</option>
          <option value="Seguimiento">🔄 Seguimiento</option>
        </select>
      </div>
      
      <div class="filtro-group">
        <label>Asignada a</label>
        <select v-model="filtros.asignada" @change="aplicarFiltros" class="form-control">
          <option value="">Todos</option>
          <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
            {{ usuario.nombre }}
          </option>
        </select>
      </div>

      <div class="filtro-group">
        <label>Usuario</label>
        <select v-model="filtros.usuario" @change="aplicarFiltros" class="form-control">
          <option value="">Todos</option>
          <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
            {{ usuario.nombre }}
          </option>
        </select>
      </div>

      <div class="filtro-group">
        <label>Rango de fechas</label>
        <div class="date-range">
          <input type="date" v-model="filtros.fechaDesde" @change="aplicarFiltros" class="form-control" />
          <span>-</span>
          <input type="date" v-model="filtros.fechaHasta" @change="aplicarFiltros" class="form-control" />
        </div>
      </div>

      <button class="btn btn-secondary btn-buscar" @click="buscar">
        <i class="fas fa-search"></i>
        Buscar
      </button>
    </div>

    <!-- Tabla de tareas -->
    <div class="tabla-wrapper">
      <table class="tabla-tareas">
        <thead>
          <tr>
            <th class="th-checkbox">
              <input type="checkbox" @change="seleccionarTodas" v-model="todasSeleccionadas" />
            </th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Dirigida a</th>
            <th>Datos de contacto</th>
            <th>Estado</th>
            <th>Comentarios</th>
            <th>Fecha de creación</th>
            <th>Fecha de inicio</th>
            <th>Fecha de vencimiento</th>
            <th v-if="esVistaAdmin">Asignada a</th>
            <th>Usuario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tarea in tareasFiltradas" :key="tarea.id" 
              :class="{ 'tarea-vencida': tarea.vencida, 'tarea-completada': tarea.estadoNombre === 'COMPLETADA' }"
              @click="verDetalle(tarea)">
            <td class="td-checkbox" @click.stop>
              <input type="checkbox" v-model="tareasSeleccionadas" :value="tarea.id" />
            </td>
            <td class="td-nombre">
              <div class="tarea-titulo">{{ tarea.titulo }}</div>
              <div class="tarea-descripcion">{{ tarea.descripcion }}</div>
            </td>
            <td>
              <span class="tipo-badge" :class="`tipo-${tarea.tipo?.toLowerCase()}`">
                {{ getTipoIcon(tarea.tipo) }} {{ tarea.tipo || 'Por hacer' }}
              </span>
            </td>
            <td>
              <div v-if="tarea.clienteRelacionadoNombre" class="cliente-info">
                <i class="fas fa-user"></i>
                {{ tarea.clienteRelacionadoNombre }}
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <div v-if="tarea.clienteRelacionadoId" class="contacto-info">
                <span v-if="tarea.telefono"><i class="fas fa-phone"></i> {{ tarea.telefono }}</span>
                <span v-if="tarea.email"><i class="fas fa-envelope"></i> {{ tarea.email }}</span>
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td>
              <span class="estado-badge" :style="{ backgroundColor: tarea.estadoColor }">
                {{ tarea.estadoNombre }}
              </span>
            </td>
            <td class="td-comentarios">
              <div class="comentarios-preview">
                {{ tarea.ultimoComentario || '-' }}
              </div>
            </td>
            <td>{{ formatDate(tarea.fechaCreacion) }}</td>
            <td>{{ formatDate(tarea.fechaInicio) || '-' }}</td>
            <td>
              <span :class="{ 'fecha-vencida': tarea.vencida }">
                {{ formatDate(tarea.fechaVencimiento) || '-' }}
              </span>
            </td>
            <td v-if="esVistaAdmin">
              <div class="usuario-asignado">
                <i class="fas fa-user-circle"></i>
                {{ tarea.usuarioAsignadoNombre }}
              </div>
            </td>
            <td>{{ tarea.usuarioCreadorNombre }}</td>
            <td class="td-documentos">
              <div class="action-buttons">
                <button class="btn-icon btn-view" @click.stop="$emit('ver-detalle', tarea)" title="Ver detalle">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon btn-edit" @click.stop="$emit('actualizar', tarea)" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" @click.stop="$emit('eliminar', tarea.id)" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Estado vacío -->
      <div v-if="tareasFiltradas.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>No se encontraron tareas</h3>
        <p>Intenta ajustar los filtros o crea una nueva tarea</p>
      </div>
    </div>

    <!-- Paginación -->
    <div class="paginacion" v-if="totalPaginas > 1">
      <button class="btn-pagina" :disabled="paginaActual === 1" @click="cambiarPagina(paginaActual - 1)">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="pagina-info">Página {{ paginaActual }} de {{ totalPaginas }}</span>
      <button class="btn-pagina" :disabled="paginaActual === totalPaginas" @click="cambiarPagina(paginaActual + 1)">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TareasTablaView',
  props: {
    tareas: {
      type: Array,
      required: true
    },
    usuarios: {
      type: Array,
      default: () => []
    },
    estados: {
      type: Array,
      default: () => []
    },
    esVistaAdmin: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tareasFiltradas: [],
      tareasSeleccionadas: [],
      todasSeleccionadas: false,
      filtros: {
        tipo: '',
        asignada: '',
        usuario: '',
        fechaDesde: '',
        fechaHasta: ''
      },
      paginaActual: 1,
      tareasPorPagina: 10
    }
  },
  computed: {
    totalPaginas() {
      return Math.ceil(this.tareasFiltradas.length / this.tareasPorPagina)
    }
  },
  watch: {
    tareas: {
      immediate: true,
      handler() {
        this.aplicarFiltros()
      }
    }
  },
  methods: {
    aplicarFiltros() {
      let resultado = [...this.tareas]

      if (this.filtros.tipo) {
        resultado = resultado.filter(t => t.tipo === this.filtros.tipo)
      }

      if (this.filtros.asignada) {
        resultado = resultado.filter(t => t.usuarioAsignadoId === parseInt(this.filtros.asignada))
      }

      if (this.filtros.usuario) {
        resultado = resultado.filter(t => t.usuarioCreadorId === parseInt(this.filtros.usuario))
      }

      if (this.filtros.fechaDesde) {
        resultado = resultado.filter(t => new Date(t.fechaCreacion) >= new Date(this.filtros.fechaDesde))
      }

      if (this.filtros.fechaHasta) {
        resultado = resultado.filter(t => new Date(t.fechaCreacion) <= new Date(this.filtros.fechaHasta))
      }

      this.tareasFiltradas = resultado
    },

    buscar() {
      this.aplicarFiltros()
    },

    seleccionarTodas() {
      if (this.todasSeleccionadas) {
        this.tareasSeleccionadas = this.tareasFiltradas.map(t => t.id)
      } else {
        this.tareasSeleccionadas = []
      }
    },

    verDetalle(tarea) {
      this.$emit('ver-detalle', tarea)
    },

    verDocumentos(tarea) {
      this.$emit('ver-documentos', tarea)
    },

    formatDate(date) {
      if (!date) return null
      const d = new Date(date)
      return d.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getTipoIcon(tipo) {
      const iconos = {
        'Llamada': '●',
        'Correo': '●',
        'Reunión': '●',
        'Visita': '●',
        'Por hacer': '●',
        'Seguimiento': '●'
      }
      return iconos[tipo] || '●'
    },

    cambiarPagina(pagina) {
      this.paginaActual = pagina
    }
  }
}
</script>

<style scoped>
.tareas-tabla-container {
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.tabla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.tabla-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-count {
  font-size: 0.7rem;
  color: #6c757d;
  font-weight: normal;
}

.btn-nueva-tarea {
  background: #007bff;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-nueva-tarea:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.filtros-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.filtro-group label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #495057;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-buscar {
  background: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-buscar:hover {
  background: #0056b3;
}

.tabla-wrapper {
  overflow-x: auto;
  margin-bottom: 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.tabla-tareas {
  width: 100%;
  border-collapse: collapse;
}

.tabla-tareas thead {
  background: #ffffff;
}

.tabla-tareas th {
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.7rem;
  background: #f8f9fa;
}

.tabla-tareas tbody tr {
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabla-tareas tbody tr:hover {
  background: #f8f9fa;
}

.tabla-tareas td {
  padding: 8px 10px;
  color: #495057;
  font-size: 0.75rem;
}

.th-checkbox,
.td-checkbox {
  width: 32px;
  text-align: center;
}

.tarea-titulo {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 3px;
  font-size: 0.8rem;
}

.tarea-descripcion {
  font-size: 0.7rem;
  color: #6c757d;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tipo-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
}

.tipo-llamada { background: #fff3cd; color: #856404; }
.tipo-correo { background: #cce5ff; color: #004085; }
.tipo-reunión { background: #d4edda; color: #155724; }
.tipo-visita { background: #f8d7da; color: #721c24; }
.tipo-seguimiento { background: #d1ecf1; color: #0c5460; }

.cliente-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.contacto-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.7rem;
}

.contacto-info span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.estado-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  color: white;
  font-size: 0.7rem;
  font-weight: 500;
}

.comentarios-preview {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  color: #6c757d;
}

.fecha-vencida {
  color: #dc3545;
  font-weight: 600;
}

.usuario-asignado {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

.btn-documento {
  background: none;
  border: 1px solid #dee2e6;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
}

.btn-documento:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.tarea-vencida {
  background: #fff5f5 !important;
}

.tarea-completada {
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #6c757d;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 12px 0 6px;
  color: #495057;
  font-size: 0.9rem;
}

.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.btn-pagina {
  background: white;
  border: 1px solid #dee2e6;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.7rem;
}

.btn-pagina:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

.btn-pagina:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagina-info {
  font-size: 0.7rem;
  color: #6c757d;
}

.text-muted {
  color: #adb5bd;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.btn {
  padding: 3px 6px;
  border: 1px solid;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.65rem;
}

.btn-sm {
  padding: 2px 4px;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.btn-icon.btn-edit {
  color: #2196f3; /* Azul para editar */
}
.btn-icon.btn-edit:hover {
  background-color: rgba(33,150,243,0.1);
}

.btn-icon.btn-view {
  color: #43a047; /* Verde para ver */
}
.btn-icon.btn-view:hover {
  background-color: rgba(67,160,71,0.1);
}

.btn-icon.btn-delete {
  color: #f44336; /* Rojo para eliminar */
}
.btn-icon.btn-delete:hover {
  background-color: rgba(244,67,54,0.1);
}

/* Responsive */
@media (max-width: 1200px) {
  .filtros-container {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .tabla-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .filtros-container {
    flex-direction: column;
    align-items: stretch;
  }

  .date-range {
    flex-direction: column;
  }
}
</style>
