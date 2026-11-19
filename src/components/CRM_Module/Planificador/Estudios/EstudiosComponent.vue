<template>
  <div class="estudios">
    <datos-estudio-component v-if="vista === 'nuevo'" modo="nuevo" :base="baseNuevo" :ocupado="ocupado" :error-envio="errorEnvio" @cancelar="salir" @enviar="crearLocal" />
    <datos-estudio-component v-else-if="vista === 'parametros' && trabajo" modo="editar" :base="trabajo.state" :calc="trabajo.calc" :ocupado="ocupado" :error-envio="errorEnvio"
                             @cancelar="verEstudio" @enviar="cambiarParametros" />
    <estudio-editor v-else-if="vista === 'editar' && trabajo" :key="trabajo.id" :estudio="trabajo" :guardando="guardando" :calculando="calculando" :error-guardar="errorGuardar" :presupuestos="vinculados" :asociados="asociados" :conflicto="conflicto" :cambios-locales="cambiosLocales"
                    @volver="salir" @editar-parametros="editarParametros" @guardar="guardar()" @descartar="descartar" @resolver="resolver" @usar-kwp="usarKwp" @elegir-presupuesto="elegirPresupuesto" @eliminar="eliminar" @crear-presupuesto="crearPresupuesto" @cambiar-estado="cambiarEstado" @abrir-presupuesto="$emit('abrir-presupuesto', $event)" />
    <precios-boe-component v-else-if="vista === 'boe'" @volver="salir" />
    <template v-else>
      <div class="back-fila">
        <button type="button" class="secondary" @click="$emit('volver-a-presupuestos')">← Volver a propuestas</button>
      </div>
      <p v-if="aviso" class="paso-nota warn" role="alert">{{ aviso }}</p>
      <p v-else class="muted">Abriendo el estudio…</p>
    </template>
  </div>
</template>

<script>
import DatosEstudioComponent from './DatosEstudioComponent.vue'
import EstudioEditor from './EstudioEditor.vue'
import PreciosBoeComponent from './PreciosBoeComponent.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { calcDe, canonical, conCoste, copyOf, cuerpoDe, estadoInicial, fromServer, getLocal, isDirty, newLocal, putLocal, removeLocal, usaElCoste } from '@/utils/planificador/almacenEstudios'

const estadoHttp = (e) => (e && e.response ? e.response.status : null)
const clonar = (o) => JSON.parse(JSON.stringify(o))

// Un estudio (formulario de parámetros, resultado y precios del BOE). Se llega siempre desde la lista de Presupuestos y estudios, que lo
// abre ya con lo que necesita (el traspaso); al salir, vuelve a ella. Igual que el Presupuestador, siempre hay una copia de trabajo en
// este navegador («Local») y, al «Guardar y compartir», además el estudio en el servidor, que ven y modifican todos («Guardar cambios»).
export default {
  name: 'Estudios-Component',
  components: { DatosEstudioComponent, EstudioEditor, PreciosBoeComponent },
  props: {
    // Al abrirlo desde un presupuesto: { tipo: 'estudio', presupuestoId, customer, proyecto }. El estudio nuevo arranca con su cliente y proyecto
    // y, en cuanto se guarda y comparte, queda asociado a ese presupuesto.
    traspaso: { type: Object, default: null }
  },
  emits: ['crear-presupuesto', 'volver-a-presupuestos', 'abrir-presupuesto'],
  data() {
    const desde = this.traspaso && this.traspaso.tipo === 'estudio' ? this.traspaso : null
    return {
      desde,
      // Sin traspaso que abrir (el estudio se está leyendo, o no existe) no hay pantalla de estudio: solo el aviso
      vista: desde ? 'nuevo' : (this.traspaso && this.traspaso.tipo === 'boe' ? 'boe' : ''), trabajo: null, aviso: '',
      ocupado: false, calculando: false, guardando: false, errorEnvio: '', errorGuardar: '', conflicto: null, instantanea: null, vinculados: [], asociados: []
    }
  },
  computed: {
    /** Un estudio solo local: ¿ha cambiado desde que se abrió? (uno compartido compara con lo guardado en el servidor) */
    cambiosLocales() {
      const w = this.trabajo
      return !!w && !w.remote && !!this.instantanea && canonical(w.state) !== canonical(this.instantanea)
    },
    /** Los parámetros de partida de un estudio nuevo: vacíos, o con el cliente y el proyecto del presupuesto del que se viene. */
    baseNuevo() {
      if (!this.desde) return null
      const base = { ...estadoInicial(), customer: clonar(this.desde.customer), proyecto: this.desde.proyecto || '' }
      // Un estudio que nace de un presupuesto parte de su coste
      return this.desde.presupuesto ? conCoste(base, this.desde.presupuesto) : base
    }
  },
  mounted() {
    // 'abrir-estudio': desde la lista unificada, directo al estudio elegido
    if (this.traspaso && this.traspaso.tipo === 'abrir-estudio') this.abrir({ id: this.traspaso.id, kind: this.traspaso.kind, presupuesto: this.traspaso.presupuesto })
  },
  methods: {
    // Salir del estudio o del formulario: siempre a la lista de Presupuestos y estudios
    salir() {
      this.$emit('volver-a-presupuestos')
    },
    verEstudio() {
      this.errorEnvio = ''
      this.vista = 'editar'
    },
    editarParametros() {
      this.errorEnvio = ''
      this.vista = 'parametros'
    },
    /** La copia de trabajo se guarda en este navegador al modificarla. */
    actualizar(trabajo) {
      this.trabajo = { ...trabajo, updatedAt: new Date().toISOString() }
      putLocal(this.trabajo)
    },
    entrar(trabajo) {
      this.instantanea = trabajo.remote ? null : clonar(trabajo.state)
      this.conflicto = null
      this.errorGuardar = ''
      this.errorEnvio = ''
      this.actualizar(trabajo)
      this.vista = 'editar'
    },

    // ---- Calcular ---------------------------------------------------------------------------------------------------
    /** El servidor calcula el estudio entero sin guardarlo. Si no había potencia, la que propone pasa a los parámetros. */
    async calcular(estado) {
      const e = await planificadorApi.calcularEstudio(cuerpoDe(estado))
      const nuevo = clonar(estado)
      const kwp = e.datos && e.datos.instalacion ? Number(e.datos.instalacion.kwp) : 0
      if (!(Number(nuevo.instalacion.kwp) > 0) && kwp > 0) nuevo.instalacion.kwp = kwp
      return { estado: nuevo, calc: calcDe(e) }
    },
    async crearLocal(estado) {
      this.ocupado = true
      this.errorEnvio = ''
      try {
        const { estado: s, calc } = await this.calcular(estado)
        if (!calc.resultado.simulacion) {
          this.errorEnvio = calc.aviso || 'Con ese consumo no se puede calcular el estudio.'
          return
        }
        const nuevo = newLocal(s, calc)
        if (this.desde) nuevo.enlazarCon = this.desde.presupuestoId // se asocia al compartirlo
        this.entrar(nuevo)
      } catch (e) {
        this.errorEnvio = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    async cambiarParametros(estado) {
      this.ocupado = true
      this.errorEnvio = ''
      try {
        const { estado: s, calc } = await this.calcular(estado)
        if (!calc.resultado.simulacion) {
          this.errorEnvio = calc.aviso || 'Con ese consumo no se puede calcular el estudio.'
          return
        }
        this.actualizar({ ...this.trabajo, state: s, calc })
        this.vista = 'editar'
      } catch (e) {
        this.errorEnvio = mensajeError(e)
      } finally {
        this.ocupado = false
      }
    },
    /** Pasa a una de las potencias que se comparan en el resultado. */
    async usarKwp(kwp) {
      const w = this.trabajo
      if (!w) return
      this.calculando = true
      this.errorGuardar = ''
      try {
        const estado = clonar(w.state)
        estado.instalacion.kwp = kwp
        const { estado: s, calc } = await this.calcular(estado)
        if (this.trabajo && this.trabajo.id === w.id) this.actualizar({ ...this.trabajo, state: s, calc })
      } catch (e) {
        this.errorGuardar = 'No se ha podido recalcular: ' + mensajeError(e)
      } finally {
        this.calculando = false
      }
    },

    /**
     * El coste de la instalación pasa a ser el de un presupuesto `{ id, total, kwp }` (o, sin él, el precio provisional) y se recalcula.
     * Solo se recalcula si cambia algo: abrir un estudio desde su misma fila no lo toca.
     */
    async usarPresupuesto(presupuesto) {
      const w = this.trabajo
      if (!w || usaElCoste(w.state, presupuesto)) return
      this.calculando = true
      this.errorGuardar = ''
      try {
        const { estado, calc } = await this.calcular(conCoste(w.state, presupuesto))
        if (this.trabajo && this.trabajo.id === w.id) {
          // Un estudio solo local no se marca como cambiado por esto: es cómo se abre desde esa fila
          if (!w.remote) this.instantanea = clonar(estado)
          this.actualizar({ ...this.trabajo, state: estado, calc })
        }
      } catch (e) {
        this.errorGuardar = 'No se ha podido calcular con el coste del presupuesto: ' + mensajeError(e)
      } finally {
        this.calculando = false
      }
    },
    /** Los presupuestos compartidos asociados a este estudio, entre los que se puede elegir de cuál sale el coste. */
    async cargarVinculados() {
      const w = this.trabajo
      this.vinculados = []
      this.asociados = []
      if (!w || !w.remote) return
      try {
        const lista = await planificadorApi.presupuestos()
        if (!this.trabajo || this.trabajo.id !== w.id) return
        this.vinculados = lista.filter((b) => b.study_id === w.id && Number(b.budget_total) > 0 && Number(b.kwp) > 0)
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
          .map((b) => ({ id: b.id, total: Number(b.budget_total), kwp: Number(b.kwp), nombre: b.variant_name || '' }))
        this.asociados = lista.filter((b) => b.study_id === w.id).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).map((b) => ({ id: b.id, status: b.status }))
      } catch (e) {
        this.vinculados = []
        this.asociados = []
      }
    },
    elegirPresupuesto(id) {
      this.usarPresupuesto(id ? this.vinculados.find((p) => p.id === id) || null : null)
    },

    // ---- Abrir -------------------------------------------------------------------------------------------------------
    /** Desde una fila de la lista llega también su presupuesto: el estudio parte de su coste. */
    async abrir(fila) {
      await this.abrirEstudio(fila)
      if (this.trabajo && fila.presupuesto) await this.usarPresupuesto(fila.presupuesto)
      this.cargarVinculados()
    },
    async abrirEstudio(fila) {
      this.aviso = ''
      const local = getLocal(fila.id)
      if (fila.kind === 'local') {
        if (!local) {
          this.aviso = 'Este estudio ya no está en este navegador.'
          return
        }
        // Un estudio que ya no está en el servidor se abre como local
        this.entrar(local.remote ? { ...local, remote: null } : local)
        return
      }
      let completo
      try {
        completo = await planificadorApi.estudio(fila.id)
      } catch (e) {
        if (estadoHttp(e) === 404) {
          this.aviso = 'Este estudio ya no existe en el servidor: su autor lo ha eliminado.'
        } else if (local) {
          // Sin poder leer el servidor se abre la copia de este navegador
          this.entrar(local)
        } else {
          this.aviso = 'No se ha podido abrir el estudio: ' + mensajeError(e)
        }
        return
      }
      if (local && local.remote) {
        if (local.remote.version === completo.version) {
          this.entrar(local)
          return
        }
        if (isDirty(local) && window.confirm('Este estudio tiene cambios tuyos sin guardar y, mientras tanto, otra persona ha guardado una versión más reciente.\n\n' +
          'Aceptar: seguir con tus cambios (al guardar se te avisará de lo que ha cambiado).\nCancelar: abrir la versión actual y descartar tus cambios.')) {
          this.entrar(local)
          return
        }
      }
      this.entrar(fromServer(completo))
    },

    // ---- Guardar y compartir ----------------------------------------------------------------------------------------
    async guardar(forzar = false, recrear = false) {
      const w = this.trabajo
      if (!w) return
      if (!w.state.customer) {
        this.errorGuardar = 'Este estudio no tiene cliente: elígelo en «Editar parámetros» antes de guardarlo y compartirlo.'
        return
      }
      this.guardando = true
      this.errorGuardar = ''
      this.conflicto = null
      try {
        const cuerpo = cuerpoDe(w.state)
        const e = w.remote && !recrear
          ? await planificadorApi.guardarEstudio(w.id, { ...cuerpo, version: w.remote.version, force: forzar })
          : await planificadorApi.crearEstudio({ ...cuerpo, id: w.id })
        let guardado = fromServer(e)
        // Un estudio creado desde un presupuesto se asocia a él al compartirlo; si no se puede, se reintenta al volver a guardar
        if (w.enlazarCon) {
          try {
            await planificadorApi.asociarEstudio(w.enlazarCon, e.id)
          } catch (err) {
            guardado = { ...guardado, enlazarCon: w.enlazarCon }
            this.errorGuardar = 'El estudio se ha guardado, pero no se ha podido asociar al presupuesto: ' + mensajeError(err)
          }
        }
        this.actualizar(guardado)
      } catch (e) {
        const http = estadoHttp(e)
        if (http === 409 && w.remote && !recrear) this.conflicto = { kind: 'version', message: mensajeError(e) }
        else if (http === 404 && w.remote) this.conflicto = { kind: 'deleted' }
        else this.errorGuardar = 'No se ha podido guardar: ' + mensajeError(e)
      } finally {
        this.guardando = false
      }
    },
    // Deshacer los cambios sin guardar de un estudio compartido: vuelve a la versión que hay en el servidor
    async descartar() {
      const w = this.trabajo
      if (!w) return
      if (!w.remote) return this.descartarLocal()
      if (!window.confirm('Se descartarán los cambios sin guardar y el estudio volverá a como estaba guardado. ¿Continuar?')) return
      try {
        this.entrar(fromServer(await planificadorApi.estudio(w.id)))
      } catch (e) {
        if (estadoHttp(e) === 404) this.conflicto = { kind: 'deleted' }
        else this.errorGuardar = 'No se han podido deshacer los cambios: ' + mensajeError(e)
      }
    },
    // Un estudio solo local vuelve a como estaba al abrirlo
    async descartarLocal() {
      const w = this.trabajo
      if (!this.instantanea || !window.confirm('Se descartarán los cambios hechos desde que abriste el estudio. ¿Continuar?')) return
      this.calculando = true
      this.errorGuardar = ''
      try {
        const { estado, calc } = await this.calcular(clonar(this.instantanea))
        if (this.trabajo && this.trabajo.id === w.id) this.actualizar({ ...this.trabajo, state: estado, calc })
      } catch (e) {
        this.errorGuardar = 'No se han podido deshacer los cambios: ' + mensajeError(e)
      } finally {
        this.calculando = false
      }
    },
    async resolver(como) {
      const w = this.trabajo
      if (!w) return
      if (como === 'servidor') {
        if (!window.confirm('Se descartarán tus cambios sin guardar y se abrirá la versión que hay en el servidor. ¿Continuar?')) return
        try { this.entrar(fromServer(await planificadorApi.estudio(w.id))) } catch (e) { this.errorGuardar = 'No se ha podido cargar la versión del servidor: ' + mensajeError(e) }
      } else if (como === 'sobrescribir') {
        if (!window.confirm('Tus cambios sustituirán a lo que ha guardado la otra persona. ¿Guardar igualmente?')) return
        await this.guardar(true)
      } else if (como === 'copia') {
        // Los cambios propios quedan en una copia local y el original vuelve a ser lo que hay en el servidor
        const copia = copyOf(w)
        putLocal(copia)
        try { putLocal(fromServer(await planificadorApi.estudio(w.id))) } catch (e) { /* si no se puede leer, el original se queda como estaba */ }
        this.entrar(copia)
      } else if (como === 'recrear') {
        await this.guardar(false, true)
      } else {
        this.conflicto = null
        this.actualizar({ ...this.trabajo, remote: null })
      }
    },
    // El estado se guarda aparte de los parámetros (el botón solo está activo sin cambios pendientes)
    async cambiarEstado(estado) {
      const w = this.trabajo
      if (!w || !w.remote) return
      this.guardando = true
      this.errorGuardar = ''
      try {
        this.actualizar(fromServer(await planificadorApi.guardarEstudio(w.id, { estado, version: w.remote.version })))
      } catch (e) {
        this.errorGuardar = 'No se ha podido cambiar el estado: ' + mensajeError(e)
      } finally {
        this.guardando = false
      }
    },
    /** Abre el presupuestador con el cliente, el proyecto y la potencia de este estudio (solo un estudio compartido y sin cambios pendientes). */
    crearPresupuesto() {
      const w = this.trabajo
      if (!w || !w.remote) return
      const kwp = Number(w.state.instalacion.kwp)
      this.$emit('crear-presupuesto', { estudioId: w.id, customer: clonar(w.state.customer), proyecto: w.state.proyecto || '', kwp: kwp > 0 ? kwp : 0, bateria: Number(w.state.instalacion.bateriaKwh) > 0 })
    },
    async eliminar() {
      const w = this.trabajo
      if (!w) return
      try {
        if (w.remote) await planificadorApi.borrarEstudio(w.id)
      } catch (e) {
        if (estadoHttp(e) !== 404) {
          this.errorGuardar = 'No se ha podido eliminar: ' + mensajeError(e)
          return
        }
      }
      removeLocal(w.id)
      this.salir()
    }
  }
}
</script>
