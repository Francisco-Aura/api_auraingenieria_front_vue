<template>
  <div class="kanban-container">
    <div class="kanban-header">
      <div class="header-left">
        <h2>Tablero Kanban</h2>
        <div class="view-options">
          <button :class="{ active: currentView === 'kanban' }" @click="currentView = 'kanban'">
            <i class="fas fa-columns"></i> Kanban
          </button>
          <button :class="{ active: currentView === 'calendar' }" @click="currentView = 'calendar'">
            <i class="fas fa-calendar"></i> Calendario
          </button>
        </div>
      </div>
      <div class="header-right">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input v-model="searchQuery" placeholder="Buscar tareas...">
        </div>
        <button class="add-task-btn" @click="showAddTaskModal = true">
          <i class="fas fa-plus"></i> Agregar Tarea
        </button>
        <button class="settings-btn" @click="showSettingsModal = true">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </div>

    <!-- Filtros mejorados -->
    <div class="filters-bar">
      <div class="filter-group">
        <label>Filtrar por:</label>
        <select v-model="selectedFilter">
          <option value="all">Todos</option>
          <option value="date">Fecha</option>
          <option value="priority">Prioridad</option>
          <option value="assignee">Asignado</option>
        </select>
      </div>

      <!-- Filtros de fecha -->
      <div class="filter-group date-filters" v-if="selectedFilter === 'date'">
        <div class="date-range">
          <label>Desde:</label>
          <input type="date" v-model="dateFilter.start">
        </div>
        <div class="date-range">
          <label>Hasta:</label>
          <input type="date" v-model="dateFilter.end">
        </div>
        <button class="clear-dates" @click="clearDateFilter">
          <i class="fas fa-times"></i> Limpiar
        </button>
      </div>

      <div class="filter-group" v-if="selectedFilter === 'priority'">
        <label>Prioridad:</label>
        <select v-model="priorityFilter">
          <option value="all">Todas</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>
      <div class="filter-group" v-if="selectedFilter === 'assignee'">
        <label>Asignado a:</label>
        <select v-model="assigneeFilter">
          <option value="all">Todos</option>
          <option v-for="user in users" :key="user" :value="user">{{ user }}</option>
        </select>
      </div>
    </div>

    <!-- Vista Kanban -->
    <div v-if="currentView === 'kanban'" class="kanban-board">
      <div v-for="(column, index) in filteredColumns" :key="index" class="kanban-column" :style="{ backgroundColor: column.color }">
        <div class="column-header">
          <h3>{{ column.title }}</h3>
          <div class="column-actions">
            <span class="task-count">{{ column.tasks.length }}</span>
            <button @click="editColumn(column)" class="edit-column-btn">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
        
        <div class="column-content">
          <!-- Agrupación por fechas -->
          <div v-for="(group, date) in groupTasksByDate(column.tasks)" :key="date" class="task-group">
            <div class="task-group-header">
              <span class="date-label">{{ formatGroupDate(date) }}</span>
              <span class="task-count">{{ group.length }}</span>
            </div>
            
            <draggable
              v-model="column.tasks"
              group="tasks"
              item-key="id"
              class="task-list"
              @change="onTaskMove"
              :filter="task => task.dueDate !== date"
            >
              <template #item="{ element }">
                <div v-if="element.dueDate === date" class="task-card" :class="getPriorityClass(element.priority)">
                  <div class="task-header">
                    <h4>{{ element.title }}</h4>
                    <div class="task-actions">
                      <button @click="editTask(element)" class="edit-btn">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="deleteTask(element)" class="delete-btn">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p class="task-description">{{ element.description }}</p>
                  <div class="task-tags">
                    <span v-for="tag in element.tags" :key="tag" class="task-tag" :style="{ backgroundColor: getTagColor(tag) }">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="task-footer">
                    <div class="task-meta">
                      <span class="task-priority" :class="element.priority">
                        <i class="fas fa-flag"></i> {{ element.priority }}
                      </span>
                      <span class="task-assignee">
                        <i class="fas fa-user"></i> {{ element.assignee }}
                      </span>
                    </div>
                    <span class="task-due-date" :class="{ 'overdue': isOverdue(element.dueDate) }">
                      <i class="fas fa-calendar"></i> {{ formatDate(element.dueDate) }}
                    </span>
                  </div>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Tareas sin fecha -->
          <div v-if="getTasksWithoutDate(column.tasks).length > 0" class="task-group">
            <div class="task-group-header">
              <span class="date-label">Sin fecha</span>
              <span class="task-count">{{ getTasksWithoutDate(column.tasks).length }}</span>
            </div>
            
            <draggable
              v-model="column.tasks"
              group="tasks"
              item-key="id"
              class="task-list"
              @change="onTaskMove"
              :filter="task => task.dueDate !== null"
            >
              <template #item="{ element }">
                <div v-if="!element.dueDate" class="task-card" :class="getPriorityClass(element.priority)">
                  <div class="task-header">
                    <h4>{{ element.title }}</h4>
                    <div class="task-actions">
                      <button @click="editTask(element)" class="edit-btn">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button @click="deleteTask(element)" class="delete-btn">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p class="task-description">{{ element.description }}</p>
                  <div class="task-tags">
                    <span v-for="tag in element.tags" :key="tag" class="task-tag" :style="{ backgroundColor: getTagColor(tag) }">
                      {{ tag }}
                    </span>
                  </div>
                  <div class="task-footer">
                    <div class="task-meta">
                      <span class="task-priority" :class="element.priority">
                        <i class="fas fa-flag"></i> {{ element.priority }}
                      </span>
                      <span class="task-assignee">
                        <i class="fas fa-user"></i> {{ element.assignee }}
                      </span>
                    </div>
                    <span class="task-due-date" :class="{ 'overdue': isOverdue(element.dueDate) }">
                      <i class="fas fa-calendar"></i> {{ formatDate(element.dueDate) }}
                    </span>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista Calendario -->
    <div v-else class="calendar-view">
      <div class="calendar-header">
        <button @click="previousMonth"><i class="fas fa-chevron-left"></i></button>
        <h3>{{ currentMonthName }} {{ currentYear }}</h3>
        <button @click="nextMonth"><i class="fas fa-chevron-right"></i></button>
      </div>
      <div class="calendar-grid">
        <div v-for="day in calendarDays" :key="day.date" class="calendar-day" :class="{ 'other-month': !day.currentMonth }">
          <div class="day-header">{{ day.dayOfMonth }}</div>
          <div class="day-tasks">
            <div v-for="task in getTasksForDay(day.date)" :key="task.id" class="calendar-task" :class="getPriorityClass(task.priority)">
              {{ task.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para agregar/editar tarea -->
    <div v-if="showAddTaskModal" class="modal">
      <div class="modal-content">
        <h3>{{ editingTask ? 'Editar Tarea' : 'Nueva Tarea' }}</h3>
        <form @submit.prevent="saveTask">
          <div class="form-group">
            <label>Título</label>
            <input v-model="taskForm.title" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="taskForm.description" required></textarea>
          </div>
          <div class="form-group">
            <label>Asignado a</label>
            <select v-model="taskForm.assignee" required>
              <option v-for="user in users" :key="user" :value="user">{{ user }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select v-model="taskForm.priority" required>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div class="form-group">
            <label>Etiquetas</label>
            <div class="tags-input">
              <div v-for="tag in taskForm.tags" :key="tag" class="tag">
                {{ tag }}
                <button type="button" @click="removeTag(tag)">&times;</button>
              </div>
              <input 
                v-model="newTag" 
                @keydown.enter.prevent="addTag"
                placeholder="Agregar etiqueta..."
              >
            </div>
          </div>
          <div class="form-group">
            <label>Fecha límite</label>
            <input type="date" v-model="taskForm.dueDate" required>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddTaskModal = false">Cancelar</button>
            <button type="submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de configuración -->
    <div v-if="showSettingsModal" class="modal">
      <div class="modal-content">
        <h3>Configuración del Tablero</h3>
        <div class="settings-section">
          <h4>Columnas</h4>
          <div v-for="(column, index) in columns" :key="index" class="column-settings">
            <input v-model="column.title" placeholder="Nombre de la columna">
            <input type="color" v-model="column.color">
            <button @click="removeColumn(index)" class="delete-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button @click="addColumn" class="add-column-btn">
            <i class="fas fa-plus"></i> Agregar Columna
          </button>
        </div>
        <div class="settings-section">
          <h4>Etiquetas</h4>
          <div v-for="(tag, index) in availableTags" :key="index" class="tag-settings">
            <input v-model="tag.name" placeholder="Nombre de la etiqueta">
            <input type="color" v-model="tag.color">
            <button @click="removeTag(index)" class="delete-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <button @click="addTag" class="add-tag-btn">
            <i class="fas fa-plus"></i> Agregar Etiqueta
          </button>
        </div>
        <div class="form-actions">
          <button @click="showSettingsModal = false">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal de edición de columna -->
    <div v-if="showColumnEditModal" class="modal">
      <div class="modal-content">
        <h3>Editar Columna</h3>
        <form @submit.prevent="saveColumnEdit">
          <div class="form-group">
            <label>Nombre de la Columna</label>
            <input v-model="columnEditForm.title" required>
          </div>
          <div class="form-group">
            <label>Color de Fondo</label>
            <input type="color" v-model="columnEditForm.color">
          </div>
          <div class="form-actions">
            <button type="button" @click="showColumnEditModal = false">Cancelar</button>
            <button type="submit">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import draggable from 'vuedraggable'

export default {
  name: 'KanbanComponent',
  components: {
    draggable
  },
  setup() {
    const currentView = ref('kanban')
    const showAddTaskModal = ref(false)
    const showSettingsModal = ref(false)
    const editingTask = ref(null)
    const searchQuery = ref('')
    const selectedFilter = ref('all')
    const priorityFilter = ref('all')
    const assigneeFilter = ref('all')
    const newTag = ref('')

    const columns = ref([
      {
        title: 'Por Hacer',
        color: '#f5f5f5',
        tasks: []
      },
      {
        title: 'En Progreso',
        color: '#e3f2fd',
        tasks: []
      },
      {
        title: 'En Revisión',
        color: '#fff3e0',
        tasks: []
      },
      {
        title: 'Completado',
        color: '#e8f5e9',
        tasks: []
      }
    ])

    const availableTags = ref([
      { name: 'Urgente', color: '#ff5252' },
      { name: 'Importante', color: '#ffd740' },
      { name: 'Documentación', color: '#64b5f6' }
    ])

    const users = ref(['Usuario 1', 'Usuario 2', 'Usuario 3'])

    const taskForm = reactive({
      title: '',
      description: '',
      assignee: '',
      priority: 'medium',
      tags: [],
      dueDate: ''
    })

    const currentDate = ref(new Date())
    const currentMonthName = computed(() => {
      return currentDate.value.toLocaleString('es', { month: 'long' })
    })
    const currentYear = computed(() => currentDate.value.getFullYear())

    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const days = []

      // Días del mes anterior
      for (let i = firstDay.getDay(); i > 0; i--) {
        const date = new Date(year, month, 1 - i)
        days.push({
          date: date.toISOString().split('T')[0],
          dayOfMonth: date.getDate(),
          currentMonth: false
        })
      }

      // Días del mes actual
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i)
        days.push({
          date: date.toISOString().split('T')[0],
          dayOfMonth: i,
          currentMonth: true
        })
      }

      // Días del mes siguiente
      const remainingDays = 42 - days.length
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i)
        days.push({
          date: date.toISOString().split('T')[0],
          dayOfMonth: date.getDate(),
          currentMonth: false
        })
      }

      return days
    })

    const addTask = () => {
      const newTask = {
        id: Date.now(),
        ...taskForm
      }
      columns.value[0].tasks.push(newTask)
      resetForm()
    }

    const editTask = (task) => {
      editingTask.value = task
      Object.assign(taskForm, task)
      showAddTaskModal.value = true
    }

    const deleteTask = (task) => {
      const column = columns.value.find(col => col.tasks.includes(task))
      if (column) {
        column.tasks = column.tasks.filter(t => t.id !== task.id)
      }
    }

    const saveTask = () => {
      if (editingTask.value) {
        const column = columns.value.find(col => col.tasks.includes(editingTask.value))
        if (column) {
          const index = column.tasks.findIndex(t => t.id === editingTask.value.id)
          column.tasks[index] = { ...editingTask.value, ...taskForm }
        }
      } else {
        addTask()
      }
      showAddTaskModal.value = false
      resetForm()
    }

    const resetForm = () => {
      editingTask.value = null
      taskForm.title = ''
      taskForm.description = ''
      taskForm.assignee = ''
      taskForm.priority = 'medium'
      taskForm.tags = []
      taskForm.dueDate = ''
      newTag.value = ''
    }

    const addTag = () => {
      if (newTag.value && !taskForm.tags.includes(newTag.value)) {
        taskForm.tags.push(newTag.value)
        newTag.value = ''
      }
    }

    const removeTag = (tag) => {
      taskForm.tags = taskForm.tags.filter(t => t !== tag)
    }

    const addColumn = () => {
      columns.value.push({
        title: 'Nueva Columna',
        color: '#f5f5f5',
        tasks: []
      })
    }

    const removeColumn = (index) => {
      if (columns.value.length > 1) {
        columns.value.splice(index, 1)
      }
    }

    const getPriorityClass = (priority) => {
      return `priority-${priority}`
    }

    const getTagColor = (tagName) => {
      const tag = availableTags.value.find(t => t.name === tagName)
      return tag ? tag.color : '#e0e0e0'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es')
    }

    const isOverdue = (date) => {
      return new Date(date) < new Date()
    }

    const getTasksForDay = (date) => {
      return columns.value.flatMap(col => 
        col.tasks.filter(task => task.dueDate === date)
      )
    }

    const previousMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
    }

    const nextMonth = () => {
      currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
    }

    const showColumnEditModal = ref(false)
    const editingColumnIndex = ref(null)
    const columnEditForm = reactive({
      title: '',
      color: ''
    })

    const editColumn = (column) => {
      const index = columns.value.findIndex(col => col === column)
      if (index !== -1) {
        editingColumnIndex.value = index
        columnEditForm.title = column.title
        columnEditForm.color = column.color
        showColumnEditModal.value = true
      }
    }

    const saveColumnEdit = () => {
      if (editingColumnIndex.value !== null) {
        columns.value[editingColumnIndex.value].title = columnEditForm.title
        columns.value[editingColumnIndex.value].color = columnEditForm.color
        showColumnEditModal.value = false
        editingColumnIndex.value = null
      }
    }

    const dateFilter = reactive({
      start: '',
      end: ''
    })

    const clearDateFilter = () => {
      dateFilter.start = ''
      dateFilter.end = ''
    }

    const filteredColumns = computed(() => {
      if (selectedFilter.value !== 'date' || (!dateFilter.start && !dateFilter.end)) {
        return columns.value
      }

      return columns.value.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => {
          const taskDate = new Date(task.dueDate)
          const startDate = dateFilter.start ? new Date(dateFilter.start) : null
          const endDate = dateFilter.end ? new Date(dateFilter.end) : null

          if (startDate && endDate) {
            return taskDate >= startDate && taskDate <= endDate
          } else if (startDate) {
            return taskDate >= startDate
          } else if (endDate) {
            return taskDate <= endDate
          }
          return true
        })
      }))
    })

    const groupTasksByDate = (tasks) => {
      const groups = {}
      tasks.forEach(task => {
        if (task.dueDate) {
          const date = task.dueDate.split('T')[0]
          if (!groups[date]) {
            groups[date] = []
          }
          groups[date].push(task)
        }
      })
      return groups
    }

    const getTasksWithoutDate = (tasks) => {
      return tasks.filter(task => !task.dueDate)
    }

    const formatGroupDate = (date) => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const taskDate = new Date(date)
      
      if (date === today.toISOString().split('T')[0]) {
        return 'Hoy'
      } else if (date === tomorrow.toISOString().split('T')[0]) {
        return 'Mañana'
      } else {
        return taskDate.toLocaleDateString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
      }
    }

    const onTaskMove = (evt) => {
      // Actualizar la columna de destino si es necesario
      if (evt.added) {
        const task = evt.added.element
        const newColumn = columns.value.find(col => col.tasks.includes(task))
        if (newColumn) {
          // Aquí puedes agregar lógica adicional cuando una tarea cambia de columna
        }
      }
    }

    return {
      currentView,
      columns,
      showAddTaskModal,
      showSettingsModal,
      editingTask,
      taskForm,
      searchQuery,
      selectedFilter,
      priorityFilter,
      assigneeFilter,
      users,
      availableTags,
      newTag,
      currentMonthName,
      currentYear,
      calendarDays,
      addTask,
      editTask,
      deleteTask,
      saveTask,
      addTag,
      removeTag,
      addColumn,
      removeColumn,
      getPriorityClass,
      getTagColor,
      formatDate,
      isOverdue,
      getTasksForDay,
      previousMonth,
      nextMonth,
      showColumnEditModal,
      columnEditForm,
      editColumn,
      saveColumnEdit,
      dateFilter,
      clearDateFilter,
      filteredColumns,
      groupTasksByDate,
      getTasksWithoutDate,
      formatGroupDate,
      onTaskMove
    }
  }
}
</script>

<style scoped>
.kanban-container {
  padding: 20px;
  height: 100%;
  background-color: #f7f9fc;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.view-options {
  display: flex;
  gap: 10px;
}

.view-options button {
  padding: 10px 20px;
  border: 2px solid #f39c12;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f39c12;
}

.view-options button:hover {
  background: #fff3e0;
  transform: translateY(-2px);
}

.view-options button.active {
  background: #f39c12;
  color: white;
  border-color: #f39c12;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #f39c12;
}

.search-box input {
  padding: 12px 20px 12px 45px;
  border: 2px solid #e0e0e0;
  border-radius: 30px;
  width: 250px;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.search-box input:focus {
  border-color: #f39c12;
  box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.1);
  outline: none;
}

.add-task-btn, .settings-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-task-btn {
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
}

.add-task-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(243, 156, 18, 0.3);
}

.settings-btn {
  background-color: white;
  color: #f39c12;
  border: 2px solid #f39c12;
}

.settings-btn:hover {
  background-color: #fff3e0;
  transform: translateY(-2px);
}

.filters-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group label {
  font-weight: 500;
  color: #666;
}

.filter-group select {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-group select:hover {
  border-color: #f39c12;
}

.filter-group select:focus {
  border-color: #f39c12;
  box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.1);
  outline: none;
}

.kanban-board {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  overflow-x: auto;
  padding: 10px 5px;
}

.kanban-column {
  flex: 1;
  min-width: 320px;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.kanban-column:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f5f5f5;
}

.column-header h3 {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-count {
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
}

.edit-column-btn {
  background: none;
  border: none;
  color: #f39c12;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.edit-column-btn:hover {
  background-color: #fff3e0;
  transform: translateY(-2px);
}

.task-list {
  min-height: 100px;
  padding: 5px;
}

.task-card {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-header h4 {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: #666;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  background-color: #fff3e0;
  color: #f39c12;
}

.delete-btn:hover {
  background-color: #ffebee;
  color: #f44336;
}

.task-description {
  font-size: 0.95em;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.task-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  color: white;
  font-weight: 500;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: #666;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.task-meta {
  display: flex;
  gap: 15px;
}

.task-priority {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.task-priority.high {
  color: #f44336;
}

.task-priority.medium {
  color: #f39c12;
}

.task-priority.low {
  color: #4caf50;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 6px;
}

.task-due-date.overdue {
  color: #f44336;
}

/* Calendar View */
.calendar-view {
  background: white;
  border-radius: 12px;
  padding: 25px;
  height: calc(100vh - 200px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.calendar-header button {
  background: none;
  border: 2px solid #f39c12;
  color: #f39c12;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-header button:hover {
  background: #fff3e0;
  transform: translateY(-2px);
}

.calendar-header h3 {
  font-size: 1.3em;
  font-weight: 600;
  color: #333;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 15px;
}

.calendar-day {
  min-height: 120px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}

.calendar-day:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.calendar-day.other-month {
  background-color: #f7f9fc;
  opacity: 0.7;
}

.day-header {
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calendar-task {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85em;
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  font-size: 1.4em;
  font-weight: 600;
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f5f5f5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #f39c12;
  box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.1);
  outline: none;
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tags-input:focus-within {
  border-color: #f39c12;
  box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.1);
}

.tag {
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0 4px;
  font-size: 1.2em;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.tag button:hover {
  opacity: 1;
  transform: scale(1.1);
}

.settings-section {
  margin-bottom: 30px;
}

.settings-section h4 {
  font-size: 1.2em;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.column-settings,
.tag-settings {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.column-settings input[type="text"],
.tag-settings input[type="text"] {
  flex: 1;
}

.column-settings input[type="color"],
.tag-settings input[type="color"] {
  width: 50px;
  height: 40px;
  padding: 2px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.add-column-btn,
.add-tag-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.add-column-btn:hover,
.add-tag-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f5f5f5;
}

.form-actions button {
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.form-actions button[type="submit"] {
  background: linear-gradient(135deg, #f39c12, #f1c40f);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.2);
}

.form-actions button[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(243, 156, 18, 0.3);
}

.form-actions button[type="button"] {
  background-color: white;
  border: 2px solid #e0e0e0;
  color: #666;
}

.form-actions button[type="button"]:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px);
}

/* Scrollbar personalizado */
.kanban-board::-webkit-scrollbar {
  height: 8px;
}

.kanban-board::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.kanban-board::-webkit-scrollbar-thumb {
  background: #f39c12;
  border-radius: 4px;
}

.kanban-board::-webkit-scrollbar-thumb:hover {
  background: #e67e22;
}

.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #f39c12;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #e67e22;
}

.date-filters {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #fff3e0;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #f39c12;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range label {
  font-weight: 500;
  color: #f39c12;
}

.date-range input[type="date"] {
  padding: 8px;
  border: 2px solid #f39c12;
  border-radius: 6px;
  color: #333;
}

.clear-dates {
  background: none;
  border: none;
  color: #f39c12;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.clear-dates:hover {
  background: rgba(243, 156, 18, 0.1);
}

.column-content {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding-right: 5px;
}

.task-group {
  margin-bottom: 20px;
}

.task-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(243, 156, 18, 0.1);
  border-radius: 6px;
  margin-bottom: 10px;
}

.date-label {
  font-weight: 500;
  color: #f39c12;
  text-transform: capitalize;
}

/* Estilos para el scrollbar de las columnas */
.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb {
  background: #f39c12;
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: #e67e22;
}
</style> 