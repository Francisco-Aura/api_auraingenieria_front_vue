<template>
  <div class="costes budget-list">
    <div v-if="conVolver" class="back-fila">
      <button type="button" class="secondary" @click="$emit('cerrar')">← Volver al inicio</button>
    </div>
    <div class="costes-titulo">
      <h1>Propuestas</h1>
      <div class="toolbar-altas">
        <button type="button" class="secondary" @click="$emit('abrir-boe')">Peajes y cargos del BOE</button>
        <button type="button" :disabled="alta.abierto" @click="abrirAlta">+ Nueva propuesta</button>
      </div>
    </div>
    <form v-if="alta.abierto" class="alta-proyecto" @submit.prevent="guardarAlta">
      <div v-if="alta.editando" class="proyecto-fijo"><strong>{{ alta.editando.cliente }}</strong><span class="muted">{{ alta.editando.proyecto }}</span></div>
      <template v-else>
        <selector-cliente v-model="alta.cliente" documento="propuesta" :invalido="alta.intentado && !alta.cliente" :cif-invalido="alta.intentado" />
        <label class="cuestionario-campo wide">
          Nombre
          <input v-model="alta.nombre" placeholder="Ej.: Nave 2, fotovoltaica" maxlength="80" autocomplete="off" :class="{ 'obligatorio-vacio': alta.intentado && !alta.nombre.trim() }">
        </label>
      </template>
      <datos-empresa-propuesta v-model="alta.empresa" :con-cif="!!alta.editando || (!!alta.cliente && alta.cliente.kind === 'existente')" :cif-invalido="alta.intentado" />
      <p v-if="alta.error" class="paso-nota warn" role="alert">{{ alta.error }}</p>
      <div class="alta-acciones">
        <button type="button" class="secondary" :disabled="alta.guardando" @click="alta.abierto = false">Cancelar</button>
        <button type="submit" :disabled="alta.guardando">{{ alta.editando ? 'Guardar cambios' : 'Crear propuesta' }}</button>
      </div>
    </form>
    <div class="coste-filtros" role="search">
      <label class="search">
        Buscar
        <input v-model="consulta" type="search" placeholder="Cliente, propuesta, autor…">
      </label>
      <label>
        Mostrar
        <select v-model="filtro">
          <option value="todos">Todos</option>
          <option value="borradores">Borradores compartidos</option>
          <option value="locales">Locales</option>
          <option v-if="validador" value="porvalidar">Pendientes{{ pendientes > 0 ? ' (' + pendientes + ')' : '' }}</option>
        </select>
      </label>
      <label v-if="seleccionando && proyectos.length > 0" class="seleccion-todas">
        <input type="checkbox" :checked="todasMarcadas" @change="marcarTodas">
        Seleccionar todas
      </label>
      <div class="filtros-derecha">
        <button v-if="proyectos.length > 0 && !seleccionando" type="button" class="btn-eliminar-varias" title="Marca varias propuestas y elimínalas de una vez" @click="alternarSeleccion">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg> Eliminar varias propuestas
        </button>
        <button v-else-if="seleccionando" type="button" class="secondary" @click="alternarSeleccion">Cancelar</button>
      </div>
    </div>
    <div v-if="seleccionando" class="seleccion-barra" role="status">
      <span><strong>Eliminar varias propuestas.</strong> {{ elegidas.length === 0 ? 'Marca con la casilla las que quieras borrar.' : cuenta(elegidas.length, 'propuesta marcada', 'propuestas marcadas') + ' (con sus estudios y presupuestos).' }}</span>
      <button type="button" class="btn-peligro" :disabled="!!ocupado || elegidas.length === 0" @click="eliminarMarcadas">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg> {{ elegidas.length === 0 ? 'Eliminar' : 'Eliminar ' + cuenta(elegidas.length, 'propuesta', 'propuestas') }}
      </button>
    </div>

    <p v-if="errorServidor" class="paso-nota warn" role="alert">
      No se han podido leer los borradores del servidor ({{ errorServidor }}): se enseñan solo los de este navegador.
      <button type="button" class="enlace-boton" @click="cargar">Reintentar</button>
    </p>
    <p v-if="mensaje" class="paso-nota warn" role="alert">{{ mensaje }}</p>
    <p v-if="remotos === null && !errorServidor" class="muted">Cargando los borradores…</p>

    <p v-if="proyectos.length === 0" class="muted empty">
      {{ filas.length === 0 ? 'Todavía no hay presupuestos ni estudios. Crea la primera con «Nueva propuesta».' : 'Nada cumple los filtros.' }}
    </p>
    <div v-else class="presupuesto-tabla-envoltorio">
      <table class="presupuesto-tabla proyectos-tabla">
        <colgroup>
          <col><col style="width: 22%"><col style="width: 26%"><col style="width: 150px"><col style="width: 120px">
        </colgroup>
        <thead>
          <tr>
            <th v-for="c in COLUMNAS" :key="c.etiqueta" :aria-sort="c.clave ? ariaOrden(c.clave) : null">
              <button v-if="c.clave" type="button" class="orden-boton" :class="{ on: orden && orden.key === c.clave }" title="Ordenar por esta columna" @click="orden = nextSort(orden, c.clave)">
                {{ c.etiqueta }}
                <span class="orden-icon" aria-hidden="true">{{ iconoOrden(c.clave) }}</span>
              </button>
              <template v-else>{{ c.etiqueta }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in renglones" :key="r.clave" :class="{ 'proyecto-fila': r.tipo === 'proyecto', 'variante-fila': r.tipo !== 'proyecto' }">
            <td v-if="r.tipo === 'mas' || r.tipo === 'menos'" colspan="5" class="ver-todos">
              <button type="button" class="enlace-boton" @click="alternarTodos(r.p.clave)">
                {{ r.tipo === 'mas' ? 'Ver ' + r.mas + (r.mas === 1 ? ' anterior' : ' anteriores') : 'Ver menos' }}
              </button>
            </td>
            <template v-else>
              <td>
                <div v-if="r.tipo === 'linea'" class="proyecto-nombre">
                  <span class="grupo-alternar-hueco" />
                  <div>
                    <div v-if="r.linea.presupuesto" class="proyecto-cliente">
                      {{ r.p.etiquetas.get(r.linea.presupuesto.id) || r.linea.presupuesto.name }}
                      <button v-if="r.linea.presupuesto.kind !== 'local'" type="button" class="enlace-boton version-editar" title="Cambiar el nombre de la versión" aria-label="Cambiar el nombre de la versión" :disabled="!!ocupado" @click="renombrarVersion(r.linea.presupuesto, r.p.etiquetas.get(r.linea.presupuesto.id))">✎</button>
                    </div>
                    <div class="muted small">{{ r.p.cliente }}<template v-if="r.p.proyecto"> · {{ r.p.proyecto }}</template></div>
                  </div>
                </div>
                <div v-else-if="r.tipo === 'proyecto'" class="proyecto-nombre">
                  <input v-if="seleccionando" type="checkbox" class="fila-marca" :checked="marcadas.includes(r.p.clave)" :aria-label="'Seleccionar ' + r.p.cliente + (r.p.proyecto ? ' · ' + r.p.proyecto : '')" @change="alternarMarca(r.p.clave)">
                  <button v-if="r.p.plegable" type="button" class="grupo-alternar" :aria-expanded="r.p.abierto"
                          :title="r.p.abierto ? 'Ocultar el detalle' : 'Ver todos los estudios y presupuestos'" @click="alternar(r.p.clave)">{{ r.p.abierto ? '▾' : '▸' }}</button>
                  <span v-else class="grupo-alternar-hueco" />
                  <div>
                    <div class="proyecto-cliente">{{ r.p.cliente }}</div>
                    <div v-if="r.p.proyecto || r.p.potencial || r.p.sinCliente" class="muted small">
                      {{ r.p.proyecto }}
                      <span v-if="r.p.potencial" class="tag state local" title="El cliente aún no existe en la intranet: se dará de alta cuando se valide el presupuesto">Cliente potencial</span>
                      <span v-if="r.p.sinCliente" class="tag issue warn" title="Falta vincular el cliente: elígelo en «Editar parámetros»">Sin cliente</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <template v-if="!r.linea"><span class="muted">{{ cuenta(r.p.estudios.length, 'estudio', 'estudios') }}</span></template>
                <div v-else-if="r.linea.estudio" class="celda-documento" :title="autor(r.linea.estudio)">
                  <div>
                    <button type="button" class="producto-enlace" @click="abrir(r.linea.estudio, r.linea.presupuesto)">{{ textoEstudio(r.linea.estudio) }}</button>
                    <span v-if="r.linea.masEstudios" class="mas-chip" title="Más estudios en esta propuesta">+{{ r.linea.masEstudios }}</span>
                    <div class="celda-estado"><span class="tag" :class="clasesEstado(r.linea.estudio)" :title="tituloEstado(r.linea.estudio)">{{ estadoTexto(r.linea.estudio) }}</span></div>
                  </div>
                  <div class="celda-acciones">
                    <button type="button" class="icon-btn trash icono-copiar" title="Duplicar el estudio" aria-label="Duplicar el estudio" :disabled="ocupado === r.linea.estudio.id" @click="duplicarEstudio(r.linea.estudio)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
                    </button>
                    <button type="button" class="icon-btn trash" title="Eliminar el estudio" aria-label="Eliminar el estudio" :disabled="ocupado === r.linea.estudio.id" @click="eliminarEstudio(r.linea.estudio)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    </button>
                  </div>
                </div>
                <button v-else-if="r.linea.huecoEstudio" type="button" class="hueco-crear" :disabled="ocupado === (r.linea.origen || r.p).id"
                        title="Crear el estudio de esta propuesta" @click="crearAsociado(r.linea.origen || r.p, 'estudio', r.p)">+ Estudio</button>
                <span v-else class="muted">{{ r.linea.continuacion ? '↳' : '—' }}</span>
              </td>
              <td>
                <template v-if="!r.linea"><span class="muted">{{ cuenta(r.p.presupuestos.length, 'presupuesto', 'presupuestos') }}</span></template>
                <div v-else-if="r.linea.presupuesto" class="celda-documento" :title="autor(r.linea.presupuesto)">
                  <div>
                    <button type="button" class="producto-enlace" @click="abrir(r.linea.presupuesto)">{{ textoPresupuesto(r.linea.presupuesto) }}</button>
                    <span v-if="r.linea.masPresupuestos" class="mas-chip" title="Más presupuestos en esta propuesta">+{{ r.linea.masPresupuestos }}</span>
                    <div class="celda-estado"><span class="tag" :class="clasesEstado(r.linea.presupuesto)" :title="tituloEstado(r.linea.presupuesto)">{{ estadoTexto(r.linea.presupuesto) }}</span></div>
                  </div>
                  <div class="celda-acciones">
                    <button type="button" class="icon-btn trash icono-copiar" title="Duplicar el presupuesto: eliges si con el mismo cliente u otro" aria-label="Duplicar el presupuesto" :disabled="ocupado === r.linea.presupuesto.id" @click="duplicar(r.linea.presupuesto)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
                    </button>
                    <button v-if="puedeEliminar(r.linea.presupuesto)" type="button" class="icon-btn trash" title="Eliminar el presupuesto" aria-label="Eliminar el presupuesto" :disabled="ocupado === r.linea.presupuesto.id" @click="eliminar(r.linea.presupuesto)">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>
                    </button>
                  </div>
                </div>
                <button v-else-if="r.linea.huecoPresupuesto" type="button" class="hueco-crear" :disabled="ocupado === (r.linea.origen || r.p).id"
                        title="Crear el presupuesto de esta propuesta" @click="crearAsociado(r.linea.origen || r.p, 'presupuesto', r.p)">+ Presupuesto</button>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <button v-if="r.tipo === 'proyecto' && r.p.final" type="button" class="tag state propuesta-final-boton" :class="r.p.final.etiqueta.cls" :title="'Propuesta final para el cliente · ' + r.p.final.etiqueta.label.toLowerCase()"
                        @click="propuestaFinal = r.p">{{ r.p.final.etiqueta.label === 'Falta propuesta' ? 'Propuesta final' : r.p.final.etiqueta.label }}</button>
              </td>
              <td class="muted small">
                <div class="celda-fecha">
                  <span>{{ fecha(r.tipo === 'proyecto' ? r.p.updatedAt : fechaDe(r.linea)) }}</span>
                  <div v-if="r.tipo === 'proyecto'" class="menu-ancla">
                    <button type="button" class="icon-btn" aria-haspopup="menu" :aria-expanded="menuFila === r.p.clave" :aria-label="'Más acciones de ' + r.p.cliente + ' · ' + r.p.proyecto"
                            :disabled="ocupado === r.p.clave" @click.stop="abrirMenuFila(r.p.clave, $event)">⋯</button>
                    <div v-if="menuFila === r.p.clave" class="menu-flotante" role="menu" :style="menuEstilo" @click.stop>
                      <button v-if="r.p.registro" type="button" role="menuitem" @click="editarPropuesta(r.p)">Editar propuesta</button>
                      <button type="button" role="menuitem" title="Copia la propuesta con todos sus estudios y presupuestos" @click="duplicarPropuesta(r.p)">Duplicar propuesta</button>
                      <button type="button" role="menuitem" class="peligro" title="Elimina la fila entera, con sus estudios y presupuestos" @click="eliminarPropuesta(r.p)">Eliminar propuesta</button>
                    </div>
                  </div>
                </div>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
    <modal-component v-if="propuestaFinal" :titulo="'Propuesta final · ' + propuestaFinal.cliente + (propuestaFinal.proyecto ? ' · ' + propuestaFinal.proyecto : '')" @cerrar="cerrarPropuestaFinal">
      <seccion-propuesta :presupuesto-id="propuestaFinal.final.presupuesto.id" :estudio-valido="!['rechazado', 'cancelado'].includes(propuestaFinal.final.estudio.estado)" @cambio="cargar" />
    </modal-component>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { usuarioActual } from '@/services/usuarioActual'
import { eur } from '@/utils/planificador/formato'
import { nextSort } from '@/utils/planificador/orden'
import { copyOf, getLocal, listLocal, putLocal, removeLocal } from '@/utils/planificador/almacenPresupuestos'
import {
  copyOf as copyOfEstudio, fromServer as fromServerEstudio, listLocal as listLocalEstudios, getLocal as getLocalEstudio,
  putLocal as putLocalEstudio, removeLocal as removeLocalEstudio
} from '@/utils/planificador/almacenEstudios'
import { parseCosts } from '@/utils/planificador/motor/costes'
import SelectorCliente from './SelectorCliente.vue'
import DatosEmpresaPropuesta from './DatosEmpresaPropuesta.vue'
import SeccionPropuesta from './SeccionPropuesta.vue'
import ModalComponent from '../Inventario/ModalComponent.vue'
import {
  NIVEL_ADMIN, etiquetaEstado, filasDeEstudios, construirFilas, contarPendientes, filtrarFilas, armarProyectos, esVariantable
} from '@/utils/planificador/listaPresupuestos'

// Solo se ordena por cliente y por fecha: los estudios y presupuestos de una propuesta van siempre juntos
const COLUMNAS = [
  { clave: 'name', etiqueta: 'Propuesta' },
  { clave: '', etiqueta: 'Estudio' },
  { clave: '', etiqueta: 'Presupuesto' },
  { clave: '', etiqueta: 'Propuesta final' },
  { clave: 'updated', etiqueta: 'Modificado' }
]

// El panel de alta y de edición de una propuesta: cliente y nombre (solo al crearla) y lo de la empresa que heredan sus presupuestos
const altaVacia = (extra = {}) => ({
  abierto: false, editando: null, cliente: null, nombre: '', empresa: { cif: '', logo: '', encaje: '' }, intentado: false, guardando: false, error: null, ...extra
})

// Lo primero que se ve al entrar en Presupuestos: los que se han ido haciendo. Los hay locales (solo en este navegador) y
// borradores compartidos (guardados en el servidor, visibles para todos los usuarios de la intranet).
export default {
  name: 'Lista-Presupuestos-Component',
  components: { SelectorCliente, DatosEmpresaPropuesta, SeccionPropuesta, ModalComponent },
  // abrir: un compartido (se ve su detalle) o un local (lo abre el asistente); duplicar: lo hace el asistente
  props: { conVolver: { type: Boolean, default: false } },
  emits: ['abrir', 'abrir-local', 'abrir-estudio', 'duplicar', 'cerrar', 'crear-estudio', 'crear-presupuesto', 'abrir-boe'],
  data() {
    return {
      COLUMNAS, estudiosRemotos: [], proyectosServidor: [], propuestaFinal: null, remotos: null, errorServidor: null, version: 0, mensaje: null, ocupado: null, consulta: '', filtro: 'todos',
      desplegadas: new Set(), verTodos: new Set(), orden: null, menuFila: null, menuEstilo: {}, marcadas: [], seleccionando: false,
      alta: altaVacia()
    }
  },
  computed: {
    usuario() { return usuarioActual() },
    validador() { return this.usuario.id === '1' },
    admin() { return this.usuario.nivel === NIVEL_ADMIN },
    filas() {
      // eslint-disable-next-line no-unused-expressions
      this.version // se sube para volver a leer los locales
      const estudios = filasDeEstudios({ remotos: this.estudiosRemotos, locales: listLocalEstudios(), usuario: this.usuario })
      return construirFilas({ remotos: this.remotos, locales: listLocal(), copiaLocal: getLocal, usuario: this.usuario, estudios })
    },
    pendientes() { return contarPendientes(this.filas, this.validador) },
    filtradas() { return filtrarFilas(this.filas, this.consulta, this.filtro) },
    // Los proyectos sin estudios ni presupuestos solo salen en «Todos» y si cumplen la búsqueda
    vacios() {
      if (this.filtro !== 'todos') return []
      const q = this.consulta.trim().toLowerCase()
      return this.proyectosServidor.filter((p) => !q || (p.customer.name + ' ' + p.project + ' ' + (p.created_by || '')).toLowerCase().includes(q))
    },
    // Las propuestas marcadas que se ven con los filtros de ahora (lo marcado y luego filtrado fuera no se toca)
    elegidas() { return this.proyectos.filter((p) => this.marcadas.includes(p.clave)) },
    todasMarcadas() { return this.proyectos.length > 0 && this.elegidas.length === this.proyectos.length },
    proyectos() { return armarProyectos(this.filas, this.filtradas, this.orden, this.desplegadas, this.verTodos, this.vacios, this.proyectosServidor) },
    // Las filas de la tabla: cada proyecto y, si está abierto, una por cada presupuesto (con su estudio)
    renglones() {
      const filas = []
      for (const p of this.proyectos) {
        filas.push({ clave: p.clave, tipo: 'proyecto', p, linea: p.abierto ? null : p.resumen })
        if (!p.abierto) continue
        for (const l of p.lineas) filas.push({ clave: p.clave + '/' + l.clave, tipo: l.mas ? 'mas' : l.menos ? 'menos' : 'linea', p, linea: l, mas: l.mas })
      }
      return filas
    }
  },
  watch: {
    // Al elegir un cliente de la intranet, su CIF (si lo tiene) se rellena solo mientras no se haya escrito otro
    'alta.cliente'(c) {
      if (c && c.kind === 'existente' && !this.alta.empresa.cif) this.alta.empresa = { ...this.alta.empresa, cif: c.cif || '' }
    }
  },
  mounted() {
    this.cargar()
    this.alVolver = () => { if (document.visibilityState === 'visible') this.cargar() }
    document.addEventListener('visibilitychange', this.alVolver)
    window.addEventListener('focus', this.alVolver)
    this.cerrarMenus = () => { this.menuFila = null }
    document.addEventListener('click', this.cerrarMenus)
    window.addEventListener('scroll', this.cerrarMenus, true)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.alVolver)
    window.removeEventListener('focus', this.alVolver)
    document.removeEventListener('click', this.cerrarMenus)
    window.removeEventListener('scroll', this.cerrarMenus, true)
  },
  methods: {
    eur, nextSort, etiquetaEstado, esVariantable,
    kw(n) { return n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) },
    ariaOrden(clave) {
      if (!this.orden || this.orden.key !== clave) return 'none'
      return this.orden.dir === 'asc' ? 'ascending' : 'descending'
    },
    iconoOrden(clave) {
      if (!this.orden || this.orden.key !== clave) return '↕'
      return this.orden.dir === 'asc' ? '▲' : '▼'
    },
    alternar(clave) {
      const siguiente = new Set(this.desplegadas)
      if (!siguiente.delete(clave)) siguiente.add(clave)
      this.desplegadas = siguiente
    },
    alternarTodos(clave) {
      const siguiente = new Set(this.verTodos)
      if (!siguiente.delete(clave)) siguiente.add(clave)
      this.verTodos = siguiente
    },
    /** El menú va con posición fija (la tabla tiene scroll y lo recortaría): bajo el botón, o encima si abajo no cabe. */
    abrirMenuFila(id, evento) {
      if (this.menuFila === id) { this.menuFila = null; return }
      const r = evento.currentTarget.getBoundingClientRect()
      const alto = 130
      const abajo = window.innerHeight - r.bottom
      const estilo = { right: Math.max(8, window.innerWidth - r.right) + 'px' }
      if (abajo < alto + 12 && r.top > alto + 12) estilo.bottom = window.innerHeight - r.top + 4 + 'px'
      else estilo.top = r.bottom + 4 + 'px'
      this.menuEstilo = estilo
      this.menuFila = id
    },
    abrirAlta() { this.alta = altaVacia({ abierto: true }) },
    // Editar lo de la empresa de una propuesta ya creada: el cliente y el nombre no se tocan
    async editarPropuesta(p) {
      this.menuFila = null
      this.mensaje = null
      try {
        const r = await planificadorApi.proyectoComercial(p.registro.id)
        this.alta = altaVacia({ abierto: true, editando: { id: r.id, cliente: r.customer.name, proyecto: r.project }, empresa: { cif: r.customer.cif || '', logo: r.logo, encaje: r.encaje } })
      } catch (e) {
        this.mensaje = mensajeError(e)
      }
    },
    async guardarAlta() {
      const a = this.alta
      a.intentado = true
      a.error = null
      // El CIF de un cliente potencial se escribe en su ficha; el de uno de la intranet, aquí
      const cif = (a.editando || (a.cliente && a.cliente.kind === 'existente') ? a.empresa.cif : (a.cliente && a.cliente.cif) || '').trim()
      if (!a.editando && (!a.cliente || !a.nombre.trim())) return
      if (cif.length < 5) return
      a.guardando = true
      try {
        const empresa = { cif, logo: a.empresa.logo, encaje: a.empresa.encaje }
        if (a.editando) await planificadorApi.guardarProyectoComercial(a.editando.id, empresa)
        else await planificadorApi.crearProyectoComercial(a.cliente, a.nombre.trim(), empresa)
        this.alta = altaVacia()
        this.cargar()
      } catch (e) {
        a.error = mensajeError(e)
        a.guardando = false
      }
    },
    // La propuesta entera: copia o elimina la fila con todos sus estudios y presupuestos
    async duplicarPropuesta(p) {
      this.menuFila = null
      this.ocupado = p.clave
      this.mensaje = null
      // Sin «(copia)» ni «v2» al final: la lista los toma por versiones del mismo proyecto y no saldría como propuesta aparte
      const proyecto = ('Copia de ' + (p.proyecto || 'propuesta')).slice(0, 80)
      try {
        // Primero se lee todo: si algo falla no queda una copia a medias
        const presupuestos = []
        for (const r of p.presupuestos) {
          const estado = r.kind === 'local' ? (getLocal(r.id) || {}).state : parseCosts((await planificadorApi.presupuesto(r.id)).data)
          if (!estado) throw new Error('Un presupuesto de la propuesta ya no está en este navegador.')
          presupuestos.push(estado)
        }
        const estudios = []
        for (const e of p.estudios) {
          const trabajo = e.kind === 'local' ? getLocalEstudio(e.id) : fromServerEstudio(await planificadorApi.estudio(e.id))
          if (!trabajo) throw new Error('Un estudio de la propuesta ya no está en este navegador.')
          estudios.push(trabajo)
        }
        if (p.registro) {
          const r = await planificadorApi.proyectoComercial(p.registro.id)
          await planificadorApi.crearProyectoComercial(r.customer, proyecto, { cif: r.customer.cif || '', logo: r.logo, encaje: r.encaje })
        }
        for (const estado of presupuestos) putLocal(copyOf({ ...estado, reference: proyecto }))
        for (const trabajo of estudios) {
          const copia = copyOfEstudio(trabajo)
          copia.state.proyecto = proyecto
          putLocalEstudio(copia)
        }
      } catch (e) {
        this.mensaje = 'No se ha podido duplicar la propuesta: ' + mensajeError(e)
      }
      this.ocupado = null
      this.refrescar()
    },
    async eliminarPropuesta(p) {
      this.menuFila = null
      const ajenos = p.presupuestos.filter((r) => !this.puedeEliminar(r))
      if (ajenos.length > 0) {
        this.mensaje = 'No se puede eliminar la propuesta: tiene presupuestos de otros usuarios (' + [...new Set(ajenos.map((r) => r.owner))].join(', ') + ').'
        return
      }
      const contenido = [
        p.estudios.length ? this.cuenta(p.estudios.length, 'estudio', 'estudios') : '',
        p.presupuestos.length ? this.cuenta(p.presupuestos.length, 'presupuesto', 'presupuestos') : ''
      ].filter(Boolean).join(' y ')
      const compartido = [...p.estudios, ...p.presupuestos].some((r) => r.kind !== 'local') || !!p.registro
      const texto = 'Se eliminará la propuesta «' + p.cliente + (p.proyecto ? ' · ' + p.proyecto : '') + '»' + (contenido ? ' con ' + contenido : '') +
        (compartido ? ' (lo compartido, para todos los usuarios de la intranet)' : '') + '. No se puede deshacer. ¿Continuar?'
      if (!window.confirm(texto)) return
      this.ocupado = p.clave
      this.mensaje = null
      try {
        await this.borrarPropuestaEntera(p)
      } catch (e) {
        this.mensaje = 'No se ha podido eliminar todo: ' + mensajeError(e)
      }
      this.ocupado = null
      this.version += 1
      this.cargar()
    },
    // Borra una propuesta con sus estudios y presupuestos (lo del servidor y lo local). Si el servidor ya no lo tiene (404) da igual: lo que importa es que desaparezca
    async borrarPropuestaEntera(p) {
      const borrar = async (peticion) => {
        try { await peticion() } catch (e) { if (!(e && e.response && e.response.status === 404)) throw e }
      }
      for (const r of p.presupuestos) {
        if (r.kind !== 'local') await borrar(() => planificadorApi.borrarPresupuesto(r.id))
        removeLocal(r.id)
      }
      for (const e of p.estudios) {
        if (e.kind !== 'local') await borrar(() => planificadorApi.borrarEstudio(e.id))
        removeLocalEstudio(e.id)
      }
      if (p.registro) await borrar(() => planificadorApi.borrarProyectoComercial(p.registro.id))
    },
    // «Eliminar varias»: las casillas solo se ven mientras se está eligiendo
    alternarSeleccion() {
      this.seleccionando = !this.seleccionando
      this.marcadas = []
    },
    alternarMarca(clave) {
      this.marcadas = this.marcadas.includes(clave) ? this.marcadas.filter((c) => c !== clave) : [...this.marcadas, clave]
    },
    marcarTodas() {
      this.marcadas = this.todasMarcadas ? [] : this.proyectos.map((p) => p.clave)
    },
    // Varias propuestas a la vez: se pregunta una sola vez, se saltan las que tienen presupuestos de otros usuarios y se cuenta lo que falló
    async eliminarMarcadas() {
      const ajenas = this.elegidas.filter((p) => p.presupuestos.some((r) => !this.puedeEliminar(r)))
      const borrables = this.elegidas.filter((p) => !ajenas.includes(p))
      this.mensaje = null
      if (borrables.length === 0) {
        this.mensaje = 'No se puede eliminar: las propuestas marcadas tienen presupuestos de otros usuarios.'
        return
      }
      const nombre = (p) => p.cliente + (p.proyecto ? ' · ' + p.proyecto : '')
      const texto = 'Se eliminarán ' + this.cuenta(borrables.length, 'propuesta', 'propuestas') + ' con todos sus estudios y presupuestos (lo compartido, para todos los usuarios de la intranet):\n\n' +
        borrables.map((p) => '· ' + nombre(p)).join('\n') +
        (ajenas.length ? '\n\nSe dejan ' + this.cuenta(ajenas.length, 'propuesta', 'propuestas') + ' con presupuestos de otros usuarios.' : '') + '\n\nNo se puede deshacer. ¿Continuar?'
      if (!window.confirm(texto)) return
      this.ocupado = 'varias'
      const fallos = []
      const fallidas = []
      for (const p of borrables) {
        try {
          await this.borrarPropuestaEntera(p)
        } catch (e) {
          fallos.push(nombre(p) + ' (' + mensajeError(e) + ')')
          fallidas.push(p.clave)
        }
      }
      // Quedan marcadas las que no se han podido eliminar y las que se dejaron
      this.marcadas = [...ajenas.map((p) => p.clave), ...fallidas]
      if (fallos.length) this.mensaje = 'No se han podido eliminar del todo: ' + fallos.join('; ') + '.'
      this.ocupado = null
      if (this.marcadas.length === 0) this.seleccionando = false
      this.version += 1
      this.cargar()
    },
    // Un estudio: la copia es local, con el mismo cliente y proyecto, así que queda dentro de la misma propuesta
    async duplicarEstudio(e) {
      this.ocupado = e.id
      this.mensaje = null
      try {
        const trabajo = e.kind === 'local' ? getLocalEstudio(e.id) : fromServerEstudio(await planificadorApi.estudio(e.id))
        if (!trabajo) throw new Error('Este estudio ya no está en este navegador.')
        putLocalEstudio(copyOfEstudio(trabajo))
      } catch (err) {
        this.mensaje = 'No se ha podido duplicar el estudio: ' + mensajeError(err)
      }
      this.ocupado = null
      this.refrescar()
    },
    eliminarEstudio(e) {
      const compartido = e.kind !== 'local'
      const texto = compartido
        ? 'Se eliminará el estudio de «' + e.name + '» para todos los usuarios de la intranet. No se puede deshacer. ¿Continuar?'
        : 'Se eliminará el estudio local de «' + e.name + '» de este navegador. No se puede deshacer. ¿Continuar?'
      if (!window.confirm(texto)) return
      this.ejecutar(e.id, async () => {
        if (compartido) {
          try { await planificadorApi.borrarEstudio(e.id) } catch (err) { return mensajeError(err) }
        }
        removeLocalEstudio(e.id)
        return null
      })
    },
    cuenta(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios) },
    fecha(iso) {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-ES', { dateStyle: 'short' })
    },
    fechaDe(linea) { return [linea.estudio, linea.presupuesto].filter(Boolean).map((r) => r.updatedAt || '').sort().pop() || '' },
    textoEstudio(e) { return e.kwp > 0 ? this.kw(e.kwp) + ' kWp' : 'Estudio' },
    textoPresupuesto(r) { return r.total > 0 ? this.eur(r.total) : r.kwp > 0 ? this.kw(r.kwp) + ' kWp' : 'Presupuesto' },
    // Debajo de cada documento, una sola línea: lo que requiere atención o, si no, la fase en la que está
    avisoDe(r) { return r.dirty || r.orphan },
    // El color orienta: gris = solo en este navegador, azul = en curso, ámbar = entregado y a la espera, verde = aprobado o aceptado, rojo = descartado o rechazado
    clasesEstado(r) { return r.dirty || r.orphan ? ['issue', 'warn'] : ['state', etiquetaEstado(r).cls] },
    tituloEstado(r) {
      if (r.dirty) return 'Hay cambios en este navegador que todavía no están guardados en el servidor'
      if (r.orphan) return 'El servidor ya no tiene este documento'
      return etiquetaEstado(r).title || ''
    },
    estadoTexto(r) {
      if (r.dirty) return 'Cambios sin guardar'
      if (r.orphan) return 'Ya no está compartido'
      return etiquetaEstado(r).label
    },
    autor(r) { return r.kind === 'local' ? 'Solo en este navegador' : (r.owner ? 'Autor: ' + r.owner : '') + (r.updatedBy ? ' · modificado por ' + r.updatedBy : '') },
    puedeEliminar(r) { return r.kind === 'local' || r.mine || !r.owner || this.admin },
    cerrarPropuestaFinal() {
      this.propuestaFinal = null
      this.cargar()
    },
    async cargar() {
      // Los estudios compartidos van aparte: si no se pueden leer, la lista sigue con lo demás (sin aviso: los locales siguen saliendo)
      planificadorApi.estudios().then((e) => { this.estudiosRemotos = e }, () => undefined)
      planificadorApi.proyectosComerciales().then((p) => { this.proyectosServidor = p }, () => undefined)
      try {
        this.remotos = await planificadorApi.presupuestos()
        this.errorServidor = null
      } catch (e) {
        this.errorServidor = mensajeError(e)
      }
    },
    async ejecutar(id, accion) {
      this.ocupado = id
      this.mensaje = null
      const problema = await accion()
      this.ocupado = null
      if (problema) this.mensaje = problema
      this.version += 1
      this.cargar()
    },
    // El coste de la instalación de un estudio sale del presupuesto de su fila: va con él al abrirlo
    costeDe(presupuesto) {
      return presupuesto && presupuesto.total > 0 && presupuesto.kwp > 0 ? { id: presupuesto.id, total: presupuesto.total, kwp: presupuesto.kwp } : null
    },
    // El nombre de una versión lo pone quien la hace (vale en cualquier estado); vacío vuelve a «Versión N»
    renombrarVersion(p, etiqueta) {
      const nombre = window.prompt('Nombre de la versión (vacío = Versión 1, Versión 2…):', p.variantName || etiqueta || '')
      if (nombre === null) return
      this.ejecutar(p.id, async () => {
        try {
          await planificadorApi.renombrarVariante(p.id, nombre.trim())
          return null
        } catch (e) {
          return mensajeError(e)
        }
      })
    },
    abrir(fila, presupuesto = null) {
      if (fila.tipo === 'estudio') this.$emit('abrir-estudio', { id: fila.id, kind: fila.kind === 'local' ? 'local' : 'compartido', presupuesto: this.costeDe(presupuesto) })
      else if (fila.kind === 'local') this.$emit('abrir-local', fila.id)
      else this.$emit('abrir', fila.id)
    },
    // Crea lo que falta (un estudio o un presupuesto) con el cliente y el proyecto de `origen`; si este está compartido, el nuevo
    // nace asociado a él al compartirlo (un elemento solo local no se puede asociar)
    // El CIF, el logo y el encaje de la propuesta del servidor a la que pertenece el proyecto, si la tiene
    async empresaDe(proyecto) {
      const r = proyecto && proyecto.registro
      if (!r) return null
      try {
        const x = await planificadorApi.proyectoComercial(r.id)
        return { cif: x.customer.cif || '', logo: x.logo, encaje: x.encaje }
      } catch (e) {
        return null
      }
    },
    async crearAsociado(origen, falta, proyecto) {
      this.ocupado = origen.id
      this.mensaje = null
      try {
        // Una propuesta vacía: lo que se crea sale con su cliente y su nombre, sin nada más de lo que partir
        if (origen.vacio) {
          if (falta === 'estudio') this.$emit('crear-estudio', { presupuestoId: '', customer: origen.customer, proyecto: origen.proyecto })
          else this.$emit('crear-presupuesto', { estudioId: '', customer: origen.customer, proyecto: origen.proyecto, kwp: 0, empresa: await this.empresaDe(proyecto) })
          return
        }
        const compartido = origen.kind !== 'local'
        if (falta === 'presupuesto') {
          const e = compartido ? await planificadorApi.estudio(origen.id) : (getLocalEstudio(origen.id) || {}).state
          if (!e) throw new Error('Este estudio ya no está en este navegador.')
          this.$emit('crear-presupuesto', { estudioId: compartido ? origen.id : '', customer: e.customer || null, proyecto: e.proyecto || '', kwp: origen.kwp, empresa: await this.empresaDe(proyecto) })
        } else {
          const estado = compartido ? parseCosts((await planificadorApi.presupuesto(origen.id)).data) : (getLocal(origen.id) || {}).state
          if (!estado) throw new Error('Este presupuesto ya no está en este navegador.')
          this.$emit('crear-estudio', { presupuestoId: compartido ? origen.id : '', customer: estado.customer, proyecto: estado.reference.trim(), presupuesto: this.costeDe(origen) })
        }
      } catch (e) {
        this.mensaje = mensajeError(e)
      } finally {
        this.ocupado = null
      }
    },
    // El asistente pregunta cómo duplicar (mismo cliente u otro) y lo hace; después llama a refrescar()
    duplicar(fila) {
      this.$emit('duplicar', { id: fila.id, compartido: fila.kind !== 'local', variante: esVariantable(fila), nombre: fila.name })
    },
    // Vuelve a leer los presupuestos locales y los del servidor (tras crear uno desde fuera de la lista)
    refrescar() {
      this.version += 1
      this.cargar()
    },
    eliminar(fila) {
      const compartido = fila.kind !== 'local'
      const texto = compartido
        ? 'Se eliminará el borrador «' + fila.name + '»' + (fila.mine || !fila.owner ? '' : ' de ' + fila.owner) + ' para todos los usuarios de la intranet. No se puede deshacer. ¿Continuar?'
        : 'Se eliminará el presupuesto local «' + fila.name + '» de este navegador. No se puede deshacer. ¿Continuar?'
      if (!window.confirm(texto)) return
      this.ejecutar(fila.id, async () => {
        if (compartido) {
          try { await planificadorApi.borrarPresupuesto(fila.id) } catch (e) { return mensajeError(e) }
        }
        removeLocal(fila.id)
        return null
      })
    }
  }
}
</script>
