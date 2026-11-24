<template>
  <div class="layout" :class="{ focus: creando }">
    <aside v-if="!creando" class="sidebar">
      <button v-if="conVolver" type="button" class="link back-inicio" @click="$emit('volver')">← Volver a inicio</button>
      <h1>Proyectos</h1>
      <ul class="proyecto-lista">
        <li v-for="p in abiertos" :key="p.id" :class="{ active: p.id === seleccionadoId }">
          <button type="button" class="link" @click="elegir(p.id)">{{ p.name }}<span v-if="!p.contract_generated_at && p.contract_generated_at !== undefined" class="pendiente-etiqueta" title="Contrato pendiente de generar">contrato</span></button>
          <button type="button" class="icon-btn" title="Eliminar proyecto" @click="eliminando = p">×</button>
        </li>
        <li v-for="d in borradores" :key="d.id" class="borrador-entrada">
          <button type="button" class="link" :title="'Seguir con el borrador (' + (d.updated_by || 'alguien') + ', ' + horaBorrador(d.updated_at) + ')'" @click="abrirBorrador(d.id)">📝 {{ d.name || 'Proyecto sin nombre' }} <span class="borrador-etiqueta">borrador</span></button>
          <button type="button" class="icon-btn" title="Descartar el borrador" @click="descartarBorrador(d)">×</button>
        </li>
        <li v-if="proyectos.length === 0 && borradores.length === 0" class="muted empty">Aún no hay proyectos.</li>
        <li v-else-if="abiertos.length === 0 && borradores.length === 0" class="muted empty">No hay proyectos en curso.</li>
      </ul>
      <button type="button" class="wide" @click="borradorAbierto = null; creando = true">+ Nuevo proyecto</button>

      <template v-if="terminados.length > 0">
        <button type="button" class="archivado-alternar" :aria-expanded="verTerminados || terminadoAbierto" @click="verTerminados = !verTerminados">
          <span aria-hidden="true">{{ verTerminados || terminadoAbierto ? '▾' : '▸' }}</span> Finalizados ({{ terminados.length }})
        </button>
        <ul v-if="verTerminados || terminadoAbierto" class="proyecto-lista archivado-lista">
          <li v-for="p in terminados" :key="p.id" :class="{ active: p.id === seleccionadoId }">
            <button type="button" class="link" @click="elegir(p.id)">{{ p.name }}<span v-if="!p.contract_generated_at && p.contract_generated_at !== undefined" class="pendiente-etiqueta" title="Contrato pendiente de generar">contrato</span></button>
            <button type="button" class="icon-btn" title="Eliminar proyecto" @click="eliminando = p">×</button>
          </li>
        </ul>
      </template>
    </aside>

    <main class="content" :class="{ 'drawer-abrir': seleccion && seleccionado && !creando }">
      <p v-if="error" class="error">Error: {{ error }}</p>

      <nuevo-proyecto-component v-if="creando" :key="borradorAbierto ? borradorAbierto.id : 'nuevo'" :plantillas="plantillas" :campos="camposContrato" :borrador="borradorAbierto"
                                @crear="alCrear" @cancelar="creando = false" @borradores-cambiados="cargarBorradores" />
      <p v-else-if="!seleccionado" class="muted">Selecciona un proyecto o crea uno nuevo.</p>
      <template v-else>
        <h1>{{ seleccionado.name }}</h1>
        <p class="muted proyecto-meta"><template v-if="seleccionado.start_date">Inicio: {{ seleccionado.start_date }}</template><template v-if="seleccionado.description"> · {{ seleccionado.description }}</template></p>

        <carpeta-dropbox-component :key="'dbx-' + seleccionado.id" :proyecto="seleccionado" @cambiado="proyectoActualizado" />
        <contrato-proyecto-component :key="'ctr-' + seleccionado.id" :proyecto="seleccionado" :base="contrato ? contrato.baseline : {}" @actualizado="proyectoActualizado" />

        <p v-if="terminadoAbierto" class="proyecto-terminado" role="status">✓ Proyecto finalizado: todas sus tareas están hechas, por eso está en «Finalizados». Si reabres alguna tarea, vuelve a la lista de proyectos.</p>
        <div v-if="atraso.late > 0" class="proyecto-alerta" :class="'level-' + levelOf(Math.max(atraso.days, 1))" role="alert">
          <strong>⚠ {{ atraso.late }} {{ atraso.late === 1 ? 'tarea con retraso' : 'tareas con retraso' }}</strong>
          <span v-if="atraso.days > 0"> · la entrega del proyecto se ha corrido {{ atraso.days }} {{ atraso.days === 1 ? 'día' : 'días' }}</span>
        </div>

        <nav class="seccion-pestanas" aria-label="Secciones del proyecto">
          <button type="button" :class="{ active: seccion === 'tareas' }" @click="seccion = 'tareas'">Tareas<span v-if="tareas.length > 0" class="pestana-total">{{ tareas.length }}</span></button>
          <button type="button" :class="{ active: seccion === 'cambios' }" @click="seccion = 'cambios'">Cambios<span v-if="contrato && contrato.changes.length > 0" class="pestana-total">{{ contrato.changes.length }}</span><span v-if="idsRevisar.size > 0" class="pestana-punto" title="Tareas con cambios por revisar" /></button>
          <div class="pestana-aside-grupo">
            <button type="button" class="pestana-aside" :class="{ active: seccion === 'actividad' }" @click="seccion = 'actividad'">Actividad</button>
            <button type="button" class="pestana-aside" :class="{ active: seccion === 'docs' }" @click="seccion = 'docs'">Documentos</button>
          </div>
        </nav>

        <div v-if="seccion === 'tareas'" class="vista-switch">
          <span class="muted">Ver como</span>
          <div class="vista-pestanas">
            <button type="button" :class="{ active: vista === 'cronograma' }" @click="vista = 'cronograma'">Cronograma</button>
            <button type="button" :class="{ active: vista === 'tablero' }" @click="vista = 'tablero'">Tablero</button>
            <button type="button" :class="{ active: vista === 'lista' }" @click="vista = 'lista'">Lista</button>
          </div>
        </div>

        <template v-if="seccion === 'tareas'">
          <div v-if="mostrarPlantilla" class="load-plantilla">
            <h2>Este proyecto aún no tiene pasos</h2>
            <p v-if="!plantillas[0]" class="muted">No se han podido cargar los pasos de la plantilla.</p>
            <template v-else>
              <p class="muted">Carga los {{ plantillas[0].step_count }} pasos de la instalación fotovoltaica y se planificarán desde la fecha de inicio.</p>
              <div class="row"><input v-model="inicioPlantilla" type="date"><button type="button" :disabled="ocupado" @click="aplicarPlantilla">Cargar los {{ plantillas[0].step_count }} pasos</button></div>
            </template>
          </div>
          <form class="row tarea-formulario" @submit.prevent="anadirTarea">
            <input v-model="tareaNombre" placeholder="Añadir tarea suelta"><input v-model="tareaInicio" type="date"><input v-model="tareaFin" type="date">
            <button type="submit">Añadir tarea</button>
          </form>
          <cronograma-component v-if="vista === 'cronograma' && !mostrarPlantilla" :key="seleccionado.id" :tareas="tareas" :colores="colores" :seleccion="seleccion" :al-cambiar="(id, c) => cambiarTarea(id, c)" @seleccionar="seleccion = $event" />
          <tablero-tareas-component v-if="vista === 'tablero' && !mostrarPlantilla" :tareas="tareas" :colores="colores" :seleccion="seleccion" :ids-revisar="idsRevisar" @seleccionar="seleccion = $event" @mover="pedirEstado" />
          <lista-tareas-component v-if="vista === 'lista' && !mostrarPlantilla" :tareas="tareas" :colores="colores" :seleccion="seleccion" :ids-revisar="idsRevisar" @seleccionar="seleccion = $event" @alternar-hecha="alternarHecha" />
        </template>

        <cambios-component v-if="seccion === 'cambios'" :proyecto-id="seleccionado.id" :contrato="contrato" :tareas="tareas" :al-guardar-cambios="guardarCambios" @abrir-tarea="abrirTarea" @editar-proyecto="editandoProyecto = true" />

        <actividad-component v-if="seccion === 'actividad'" :key="seleccionado.id" :proyecto-id="seleccionado.id" :refrescar="versionActividad" :tarea-ids="idsTareas" @abrir-tarea="abrirTarea" />

        <documentos-proyecto v-if="seccion === 'docs'" :key="seleccionado.id" :documentos="seleccionado.documents" :al-guardar="guardarDocumentos" />
      </template>
    </main>

    <panel-tarea-component v-if="seleccion && seleccionado && !creando && seccion !== 'docs'" :seleccion="seleccion" :tareas="tareas" :colores="colores" :acciones="acciones" :contrato="contrato"
                           @revisar-cambios="revisarCambios" @seleccionar="seleccion = $event" @cerrar="seleccion = null" @cambiar="(id, c) => cambiarTarea(id, c)" @pedir-estado="pedirEstado" @eliminar="quitarTarea" />

    <editar-proyecto-modal v-if="editandoProyecto && seleccionado" :key="seleccionado.id" :proyecto="seleccionado" :campos="camposContrato" :base="contrato ? contrato.baseline : {}" :al-guardar="guardarDatosProyecto" @cerrar="editandoProyecto = false" />
    <eliminar-proyecto-modal v-if="eliminando" :nombre="eliminando.name" :en-dropbox="!!eliminando.dropbox_path" :al-confirmar="() => quitarProyecto(eliminando)" @cerrar="eliminando = null" />
    <dialogos-tarea v-if="dialogo && tareaDialogo" :tipo="dialogo.tipo" :tarea="tareaDialogo" :acciones="accionesDe(tareaDialogo.id)" :al-bloquear="alBloquear" :al-finalizar="alFinalizar" @cerrar="dialogo = null" />
  </div>
</template>

<script>
import NuevoProyectoComponent from './NuevoProyectoComponent.vue'
import ListaTareasComponent from './ListaTareasComponent.vue'
import TableroTareasComponent from './TableroTareasComponent.vue'
import CronogramaComponent from './CronogramaComponent.vue'
import PanelTareaComponent from './PanelTareaComponent.vue'
import ActividadComponent from './ActividadComponent.vue'
import EliminarProyectoModal from './EliminarProyectoModal.vue'
import DialogosTarea from './DialogosTarea.vue'
import CambiosComponent from './CambiosComponent.vue'
import CarpetaDropboxComponent from './CarpetaDropboxComponent.vue'
import ContratoProyectoComponent from './ContratoProyectoComponent.vue'
import EditarProyectoModal from './EditarProyectoModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { phaseColors } from '@/utils/planificador/tareas/colores'
import { todayStr } from '@/utils/planificador/tareas/fechas'
import { levelOf, projectSlip } from '@/utils/planificador/tareas/retraso'
import { moveBlockedReason } from '@/utils/planificador/tareas/flujo'
import { projectLabelOf } from '@/utils/planificador/documentos/carpetas'
import DocumentosProyecto from './DocumentosProyecto.vue'
import { horaBorrador } from '@/utils/planificador/borradores'

// Proyectos y tareas: lista de proyectos, alta con plantilla y borradores, tablero y lista de tareas con su panel, y actividad.
export default {
  name: 'Proyectos-Component',
  // enlace: {proyecto, tarea} de un aviso de la intranet; con-volver: hay más herramientas y se puede volver al inicio
  props: { enlace: { type: Object, default: null }, conVolver: { type: Boolean, default: false } },
  emits: ['volver'],
  components: { NuevoProyectoComponent, ListaTareasComponent, TableroTareasComponent, CronogramaComponent, PanelTareaComponent, ActividadComponent, EliminarProyectoModal, DialogosTarea, CambiosComponent, EditarProyectoModal, CarpetaDropboxComponent, ContratoProyectoComponent , DocumentosProyecto},
  data() {
    return {
      proyectos: [], plantillas: [], borradores: [], seleccionadoId: null, cargadasDe: null, tareas: [], seleccion: null, contrato: null, camposContrato: [], editandoProyecto: false, estadoDropbox: null,
      creando: false, borradorAbierto: null, verTerminados: false, eliminando: null, dialogo: null, error: null, ocupado: false,
      seccion: 'tareas', vista: 'cronograma', versionActividad: 0, inicioPlantilla: todayStr(),
      tareaNombre: '', tareaInicio: todayStr(), tareaFin: todayStr()
    }
  },
  computed: {
    seleccionado() { return this.proyectos.find((p) => p.id === this.seleccionadoId) || null },
    colores() { return phaseColors(this.tareas) },
    atraso() { return projectSlip(this.tareas) },
    idsTareas() { return new Set(this.tareas.map((t) => t.id)) },
    // Tareas con algún cambio del contrato por revisar
    idsRevisar() { return new Set(Object.keys(this.contrato ? this.contrato.pending_by_task : {})) },
    mostrarPlantilla() { return !!this.seleccionado && this.cargadasDe === this.seleccionado.id && this.tareas.length === 0 },
    tareaDialogo() { return this.dialogo ? this.tareas.find((t) => t.id === this.dialogo.tareaId) || null : null },
    // Un proyecto con todas sus tareas hechas sale de la lista y pasa a «Finalizados» (se deduce de las tareas)
    abiertos() { return this.proyectos.filter((p) => !this.esTerminado(p)) },
    terminados() { return this.proyectos.filter((p) => this.esTerminado(p)) },
    terminadoAbierto() { return !!this.seleccionado && this.esTerminado(this.seleccionado) },
    acciones() { return this.accionesDe(this.seleccion && this.seleccion.kind === 'task' ? this.seleccion.id : '') }
  },
  watch: {
    seleccionadoId() { this.guardarDondeEstaba() },
    seccion() { this.guardarDondeEstaba() },
    vista() { this.guardarDondeEstaba() },
    // Si al aportar el último documento la tarea se cierra sola, el diálogo de finalizar ya no hace falta
    tareaDialogo(t) { if (t && this.dialogo && this.dialogo.tipo === 'finalize' && t.status === 'done') this.dialogo = null }
  },
  async mounted() {
    await this.ejecutar(async () => { this.proyectos = await planificadorApi.proyectos() })
    await this.recuperarDondeEstaba()
    planificadorApi.dropboxEstado().then((e) => { this.estadoDropbox = e }, () => { this.estadoDropbox = { enabled: false, base: '' } })
    planificadorApi.camposContrato().then((c) => { this.camposContrato = c }, () => undefined)
    planificadorApi.plantillas().then((p) => { this.plantillas = p }, () => { this.error = 'No se pudieron cargar las plantillas. Es posible que el servidor se esté reiniciando: recarga la página (Ctrl+F5).' })
    this.cargarBorradores()
    this.alVolver = () => { if (document.visibilityState === 'visible') this.cargarBorradores() }
    document.addEventListener('visibilitychange', this.alVolver)
    window.addEventListener('focus', this.alVolver)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.alVolver)
    window.removeEventListener('focus', this.alVolver)
  },
  methods: {
    horaBorrador,
    levelOf,
    esTerminado(p) {
      return p.id === this.seleccionadoId && this.cargadasDe === p.id && this.tareas.length > 0 ? this.tareas.every((t) => t.status === 'done') : !!p.finished
    },
    async ejecutar(accion) {
      try { this.error = null; await accion() } catch (e) { this.error = mensajeError(e) }
    },
    // Un aviso de la intranet abre el proyecto y despliega la tarea; si no, se vuelve a donde se estaba antes de recargar
    async recuperarDondeEstaba() {
      let guardado = null
      try { guardado = JSON.parse(sessionStorage.getItem('planificador:nav:proyectos') || 'null') } catch (e) { guardado = null }
      const enlace = this.enlace && this.enlace.proyecto ? this.enlace : null
      const id = enlace ? enlace.proyecto : guardado && guardado.seleccionadoId
      if (!id || !this.proyectos.some((p) => p.id === id)) return
      await this.elegir(id)
      if (enlace) { if (enlace.tarea && this.tareas.some((t) => t.id === enlace.tarea)) this.abrirTarea(enlace.tarea) } else if (guardado) {
        if (guardado.seccion) this.seccion = guardado.seccion
        if (guardado.vista) this.vista = guardado.vista
      }
    },
    guardarDondeEstaba() {
      try { sessionStorage.setItem('planificador:nav:proyectos', JSON.stringify({ seleccionadoId: this.seleccionadoId, seccion: this.seccion, vista: this.vista })) } catch (e) { /* sin almacenamiento de sesión: se empieza sin proyecto abierto */ }
    },
    cargarBorradores() { planificadorApi.borradores().then((b) => { this.borradores = b }, () => undefined) },
    async elegir(id) {
      this.creando = false
      this.dialogo = null
      if (id === this.seleccionadoId) return
      this.tareas = []
      this.contrato = null
      this.cargadasDe = null
      this.seleccion = null
      this.seleccionadoId = id
      await this.recargarTareas()
    },
    async recargarTareas() {
      const id = this.seleccionadoId
      if (!id) return
      await this.ejecutar(async () => {
        const [tareas, contrato] = await Promise.all([planificadorApi.tareas(id), planificadorApi.contrato(id)])
        if (id !== this.seleccionadoId) return
        this.tareas = tareas
        this.contrato = contrato
        this.cargadasDe = id
        this.versionActividad++
      })
    },
    // Guarda los datos del proyecto y el contrato de referencia (recalcula importes y datos vigentes)
    async guardarDocumentos(documentos) {
      const id = this.seleccionadoId
      await this.ejecutar(async () => {
        const p = await planificadorApi.actualizarProyecto(id, { documents: documentos })
        this.proyectos = this.proyectos.map((x) => (x.id === id ? p : x))
      })
    },
    async guardarDatosProyecto(datos) {
      const p = await planificadorApi.actualizarProyecto(this.seleccionadoId, datos)
      this.proyectos = this.proyectos.map((x) => (x.id === p.id ? p : x))
      this.contrato = await planificadorApi.contrato(this.seleccionadoId)
      this.editandoProyecto = false
    },
    // Un cambio puede repartir el importe entre los pagos pendientes, crear la tarea de facturar una ampliación o reabrir tareas
    // hechas: por eso se vuelven a pedir las tareas junto con el contrato.
    async guardarCambios(cambios) {
      const id = this.seleccionadoId
      await planificadorApi.actualizarProyecto(id, { changes: cambios })
      await this.recargarTareas()
    },
    // El servidor devuelve el proyecto entero (carpeta de Dropbox, contrato generado…): se sustituye en la lista
    proyectoActualizado(p) { this.proyectos = this.proyectos.map((x) => (x.id === p.id ? { ...x, ...p } : x)) },
    // Los archivos van solo a Dropbox: sin carpeta en el proyecto (o sin Dropbox en el servidor) no se puede subir nada
    bloqueoDeSubida() {
      if (this.seleccionado && this.seleccionado.dropbox_path) return null
      return this.estadoDropbox && !this.estadoDropbox.enabled ? 'Dropbox no está configurado en este servidor: no se pueden subir archivos.' : 'Este proyecto no tiene carpeta en Dropbox: créala desde la cabecera del proyecto para poder subir archivos.'
    },
    revisarCambios(tareaId, ids) { this.cambiarTarea(tareaId, { change_acks: ids }).then(() => this.recargarContrato()) },
    async recargarContrato() { if (this.seleccionadoId) this.contrato = await planificadorApi.contrato(this.seleccionadoId) },
    async abrirBorrador(id) {
      try { this.borradorAbierto = await planificadorApi.borrador(id); this.creando = true } catch (e) { this.error = mensajeError(e); this.cargarBorradores() }
    },
    async descartarBorrador(d) {
      if (!window.confirm('¿Descartar el borrador «' + (d.name || 'Proyecto sin nombre') + '»? Dejará de verlo todo el mundo.')) return
      await planificadorApi.borrarBorrador(d.id).catch(() => undefined)
      this.cargarBorradores()
    },
    async alCrear(proyecto) {
      this.cargarBorradores()  // el servidor consumió el borrador al crear el proyecto
      this.proyectos = [...this.proyectos, proyecto]
      this.creando = false
      this.seccion = 'tareas'
      this.tareas = []
      this.cargadasDe = null
      this.contrato = null
      this.seleccion = null
      this.seleccionadoId = proyecto.id
      await this.recargarTareas()
    },
    aplicarPlantilla() {
      this.ocupado = true
      this.ejecutar(async () => {
        const p = await planificadorApi.aplicarPlantilla(this.seleccionado.id, { template_id: this.plantillas[0].id, start_date: this.inicioPlantilla, exclude_steps: [] })
        this.proyectos = this.proyectos.map((x) => (x.id === p.id ? p : x))
        await this.recargarTareas()
      }).finally(() => { this.ocupado = false })
    },
    async quitarProyecto(p) {
      await planificadorApi.eliminarProyecto(p.id, p.name)
      this.proyectos = this.proyectos.filter((x) => x.id !== p.id)
      if (this.seleccionadoId === p.id) { this.seleccionadoId = null; this.seleccion = null; this.tareas = [] }
      this.eliminando = null
    },
    anadirTarea() {
      const nombre = this.tareaNombre.trim()
      if (!this.seleccionadoId || !nombre) return
      this.ejecutar(async () => {
        await planificadorApi.crearTarea(this.seleccionadoId, { name: nombre, start: this.tareaInicio, end: this.tareaFin })
        await this.recargarTareas()
        this.tareaNombre = ''
      })
    },
    abrirTarea(id) { this.seccion = 'tareas'; this.seleccion = { kind: 'task', id } },
    // Aplica un cambio y actualiza la lista; si la API lo rechaza, el error sube a quien llama
    async aplicarCambio(id, cambios) {
      const t = await planificadorApi.actualizarTarea(id, cambios)
      if ('start' in cambios || 'end' in cambios || 'depends_on' in cambios) {
        // Cambiar fechas o dependencias puede mover otras tareas: el servidor recalcula, así que se recarga
        await this.recargarTareas()
      } else {
        this.reemplazar(t)
        this.versionActividad++
      }
    },
    cambiarTarea(id, cambios) { return this.ejecutar(() => this.aplicarCambio(id, cambios)) },
    reemplazar(t) { this.tareas = this.tareas.map((x) => (x.id === t.id ? t : x)) },
    // Cambio de estado pedido desde cualquier vista. Bloquear pide el motivo; finalizar pide aportar lo que la tarea requiere
    pedirEstado(tarea, estado) {
      const porque = moveBlockedReason(tarea, estado)
      if (porque) { this.error = porque; return }
      if (estado === 'blocked') { this.dialogo = { tipo: 'block', tareaId: tarea.id }; return }
      if (tarea.status === estado) return
      if (estado === 'done') {
        const dados = new Set(tarea.attachments.map((a) => a.requirement))
        if (tarea.deliverables.some((d) => !d.na && !dados.has(d.key))) { this.dialogo = { tipo: 'finalize', tareaId: tarea.id }; return }
      }
      this.cambiarTarea(tarea.id, { status: estado })
    },
    // Reabrir una tarea terminada la deja En curso: una tarea iniciada no vuelve a Pendiente
    alternarHecha(tarea) { if (tarea.status === 'done') this.cambiarTarea(tarea.id, { status: 'doing' }); else this.pedirEstado(tarea, 'done') },
    async alBloquear(motivo, nota) {
      await this.aplicarCambio(this.tareaDialogo.id, { status: 'blocked', status_reason: motivo, status_note: nota })
      this.dialogo = null
    },
    async alFinalizar(notaCierre) {
      await this.aplicarCambio(this.tareaDialogo.id, { status: 'done', closing_note: notaCierre })
      this.dialogo = null
    },
    quitarTarea(id) {
      const t = this.tareas.find((x) => x.id === id)
      if (!window.confirm('¿Eliminar "' + (t ? t.name : 'esta tarea') + '"?')) return
      this.ejecutar(async () => {
        await planificadorApi.borrarTarea(id)
        if (this.seleccion && this.seleccion.kind === 'task' && this.seleccion.id === id) this.seleccion = null
        await this.recargarTareas()  // borrar una tarea limpia las dependencias que apuntaban a ella
      })
    },
    // Aportar el último documento obligatorio cierra la tarea en el servidor, y cerrarla puede replanificar las siguientes
    async despuesDeAportar(t) { if (t.status === 'done') await this.recargarTareas(); else { this.reemplazar(t); this.versionActividad++ } },
    accionesDe(tareaId) {
      const carpeta = this.seleccionado ? this.seleccionado.dropbox_path : ''
      return {
        dropbox: !!carpeta, subidaBloqueada: this.bloqueoDeSubida(), etiquetaProyecto: carpeta ? projectLabelOf(carpeta) : '',
        subirArchivo: async (archivo, requisito) => this.despuesDeAportar(await planificadorApi.subirArchivo(tareaId, archivo, requisito)),
        aportarEnlace: async (url, nombre, requisito) => this.despuesDeAportar(await planificadorApi.aportarEnlace(tareaId, url, nombre, requisito)),
        aportarNota: async (texto, requisito) => this.despuesDeAportar(await planificadorApi.aportarNota(tareaId, texto, requisito)),
        quitar: async (adjuntoId) => { this.reemplazar(await planificadorApi.quitarAdjunto(tareaId, adjuntoId)); this.versionActividad++ },
        // «No aplica» puede cerrar la tarea (y replanificar las siguientes), igual que aportar el último documento
        cambiarEntregables: async (lista) => this.despuesDeAportar(await planificadorApi.actualizarTarea(tareaId, { deliverables: lista }))
      }
    }
  }
}
</script>
