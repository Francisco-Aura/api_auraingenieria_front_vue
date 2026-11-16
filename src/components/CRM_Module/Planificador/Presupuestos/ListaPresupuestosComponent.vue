<template>
  <div class="costes budget-list">
    <div v-if="conVolver" class="back-fila">
      <button type="button" class="secondary" @click="$emit('cerrar')">← Volver al inicio</button>
    </div>
    <div class="costes-titulo"><h1>Presupuestos</h1></div>
    <div class="coste-filtros" role="search">
      <label class="search">
        Buscar
        <input v-model="consulta" type="search" placeholder="Cliente, autor…">
      </label>
      <label>
        Cliente
        <select v-model="clienteSel">
          <option value="">Todos</option>
          <option v-for="c in opciones.clientes" :key="c.valor" :value="c.valor">{{ c.etiqueta }}</option>
        </select>
      </label>
      <label>
        Proyecto
        <select v-model="proyectoSel">
          <option value="">Todos</option>
          <option v-for="p in opciones.proyectos" :key="p.valor" :value="p.valor">{{ p.etiqueta }}</option>
        </select>
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
      <button type="button" class="toolbar-end" @click="$emit('nuevo')">+ Nuevo presupuesto</button>
    </div>

    <p v-if="errorServidor" class="paso-nota warn" role="alert">
      No se han podido leer los borradores del servidor ({{ errorServidor }}): se enseñan solo los de este navegador.
      <button type="button" class="enlace-boton" @click="cargar">Reintentar</button>
    </p>
    <p v-if="mensaje" class="paso-nota warn" role="alert">{{ mensaje }}</p>
    <p v-if="remotos === null && !errorServidor" class="muted">Cargando los borradores…</p>

    <p v-if="tabla.principales === 0" class="muted empty">
      {{ filas.length === 0 ? 'Todavía no hay presupuestos. Crea el primero con «Nuevo presupuesto».' : 'Ningún presupuesto cumple los filtros.' }}
    </p>
    <div v-else class="presupuesto-tabla-envoltorio">
      <table class="presupuesto-tabla">
        <colgroup>
          <col><col style="width: 150px"><col style="width: 190px"><col style="width: 110px"><col style="width: 130px"><col style="width: 170px"><col style="width: 250px">
        </colgroup>
        <thead>
          <tr>
            <th v-for="c in COLUMNAS" :key="c.clave" :class="c.clase" :aria-sort="ariaOrden(c.clave)">
              <button type="button" class="orden-boton" :class="{ on: orden && orden.key === c.clave }" title="Ordenar por esta columna" @click="orden = nextSort(orden, c.clave)">
                {{ c.etiqueta }}
                <span class="orden-icon" aria-hidden="true">{{ iconoOrden(c.clave) }}</span>
              </button>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <template v-for="it in tabla.items" :key="it.tipo === 'grupo' ? 'oferta-' + it.ofertaId : it.row.id">
            <tr v-if="it.tipo === 'grupo'" class="grupo-fila">
              <td colspan="7">
                <button type="button" class="grupo-alternar" :aria-expanded="desplegadas.has(it.ofertaId)"
                        :title="desplegadas.has(it.ofertaId) ? 'Ocultar las versiones' : 'Ver las versiones de este proyecto'" @click="alternar(it.ofertaId)">
                  <span aria-hidden="true">{{ desplegadas.has(it.ofertaId) ? '▾' : '▸' }}</span> {{ it.name }}
                </button>
                <span class="tag state local" title="Mismo cliente y mismo proyecto: solo uno se validará">Proyecto · {{ it.count }} versiones</span>
              </td>
            </tr>
            <tr v-else :class="{ 'variante-fila': it.hija }">
              <td>
                <button type="button" class="producto-enlace" @click="abrir(it.row)">{{ it.hija ? (tabla.etiquetas.get(it.row.id) || it.row.name) : it.row.name }}</button>
                <span v-if="it.row.customer === 'potencial'" class="tag state local" title="El cliente aún no existe en la intranet: se dará de alta cuando se valide el presupuesto">Cliente potencial</span>
                <span v-if="it.row.customer === ''" class="tag issue warn" title="Este presupuesto no tiene cliente vinculado: elígelo en «Editar parámetros»">Sin cliente</span>
                <span v-if="it.row.dirty" class="tag issue warn" title="Tienes cambios en este navegador que no se han guardado en el servidor">Cambios sin guardar</span>
                <span v-if="it.row.orphan" class="tag issue warn" title="Era un borrador compartido y su autor lo ha eliminado: solo queda la copia de este navegador">Ya no está compartido</span>
              </td>
              <td class="center">
                <span class="tag state" :class="etiquetaEstado(it.row).cls" :title="etiquetaEstado(it.row).title">{{ etiquetaEstado(it.row).label }}</span>
              </td>
              <td>
                <template v-if="it.row.kind === 'local'">Tú</template>
                <template v-else-if="it.row.owner">{{ it.row.owner }}</template>
                <span v-else class="muted">—</span>
              </td>
              <td class="num">
                {{ kw(it.row.kwp) }} kWp
                <div class="muted small">{{ it.row.panels }} paneles</div>
              </td>
              <td class="num"><template v-if="it.row.total > 0">{{ eur(it.row.total) }}</template><span v-else class="muted">—</span></td>
              <td>
                {{ fechaHora(it.row.updatedAt) }}
                <div v-if="it.row.kind !== 'local' && it.row.updatedBy" class="muted small">por {{ it.row.updatedBy }}</div>
              </td>
              <td class="num">
                <div class="fila-acciones">
                  <button type="button" class="secondary" :disabled="ocupado === it.row.id" @click="abrir(it.row)">Abrir</button>
                  <button type="button" class="secondary" :disabled="ocupado === it.row.id"
                          title="Copia el presupuesto entero: eliges si con el mismo cliente u otro"
                          @click="duplicar(it.row)">Duplicar</button>
                  <button v-if="it.row.kind === 'local' || it.row.mine || !it.row.owner || admin" type="button" class="icon-btn trash" title="Eliminar"
                          :aria-label="'Eliminar ' + it.row.name" :disabled="ocupado === it.row.id" @click="eliminar(it.row)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                      <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { usuarioActual } from '@/services/usuarioActual'
import { eur } from '@/utils/planificador/formato'
import { nextSort } from '@/utils/planificador/orden'
import { getLocal, listLocal, removeLocal } from '@/utils/planificador/almacenPresupuestos'
import {
  NIVEL_ADMIN, etiquetaEstado, construirFilas, contarPendientes, filtrarFilas, armarTabla, esVariantable, opcionesFiltro
} from '@/utils/planificador/listaPresupuestos'

const COLUMNAS = [
  { clave: 'name', etiqueta: 'Cliente / proyecto', clase: '' },
  { clave: 'kind', etiqueta: 'Estado', clase: 'center' },
  { clave: 'owner', etiqueta: 'Autor', clase: '' },
  { clave: 'kwp', etiqueta: 'Potencia', clase: 'num' },
  { clave: 'total', etiqueta: 'Presupuesto', clase: 'num' },
  { clave: 'updated', etiqueta: 'Última modificación', clase: '' }
]

// Lo primero que se ve al entrar en Presupuestos: los que se han ido haciendo. Los hay locales (solo en este navegador) y
// borradores compartidos (guardados en el servidor, visibles para todos los usuarios de la intranet).
export default {
  name: 'Lista-Presupuestos-Component',
  // abrir: un compartido (se ve su detalle) o un local (lo abre el asistente); duplicar: lo hace el asistente
  props: { conVolver: { type: Boolean, default: false } },
  emits: ['nuevo', 'abrir', 'abrir-local', 'duplicar', 'cerrar'],
  data() {
    return {
      COLUMNAS, remotos: null, errorServidor: null, version: 0, mensaje: null, ocupado: null, consulta: '', filtro: 'todos',
      clienteSel: '', proyectoSel: '', desplegadas: new Set(), orden: null
    }
  },
  computed: {
    usuario() { return usuarioActual() },
    validador() { return this.usuario.id === '1' },
    admin() { return this.usuario.nivel === NIVEL_ADMIN },
    filas() {
      // eslint-disable-next-line no-unused-expressions
      this.version // se sube para volver a leer los locales
      return construirFilas({ remotos: this.remotos, locales: listLocal(), copiaLocal: getLocal, usuario: this.usuario })
    },
    pendientes() { return contarPendientes(this.filas, this.validador) },
    // Los clientes y los proyectos (los del cliente elegido) que se pueden filtrar
    opciones() { return opcionesFiltro(this.filas, this.clienteSel) },
    filtradas() { return filtrarFilas(this.filas, this.consulta, this.filtro, this.clienteSel, this.proyectoSel) },
    tabla() { return armarTabla(this.filtradas, this.orden, this.desplegadas) }
  },
  watch: {
    // Al cambiar de cliente, el proyecto elegido solo vale si es de ese cliente
    clienteSel() { if (!this.opciones.proyectos.some((p) => p.valor === this.proyectoSel)) this.proyectoSel = '' }
  },
  mounted() {
    this.cargar()
    this.alVolver = () => { if (document.visibilityState === 'visible') this.cargar() }
    document.addEventListener('visibilitychange', this.alVolver)
    window.addEventListener('focus', this.alVolver)
  },
  beforeUnmount() {
    document.removeEventListener('visibilitychange', this.alVolver)
    window.removeEventListener('focus', this.alVolver)
  },
  methods: {
    eur, nextSort, etiquetaEstado, esVariantable,
    kw(n) { return n.toLocaleString('es-ES', { maximumFractionDigits: 2 }) },
    fechaHora(iso) {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    },
    ariaOrden(clave) {
      if (!this.orden || this.orden.key !== clave) return 'none'
      return this.orden.dir === 'asc' ? 'ascending' : 'descending'
    },
    iconoOrden(clave) {
      if (!this.orden || this.orden.key !== clave) return '↕'
      return this.orden.dir === 'asc' ? '▲' : '▼'
    },
    alternar(ofertaId) {
      const siguiente = new Set(this.desplegadas)
      if (!siguiente.delete(ofertaId)) siguiente.add(ofertaId)
      this.desplegadas = siguiente
    },
    async cargar() {
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
    abrir(fila) {
      if (fila.kind === 'local') this.$emit('abrir-local', fila.id)
      else this.$emit('abrir', fila.id)
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
