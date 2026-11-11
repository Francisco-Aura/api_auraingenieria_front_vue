<template>
  <datos-presupuesto-component v-if="vista === 'nuevo'" modo="nuevo" @cancelar="volverALista" @enviar="crearLocal" />
  <datos-presupuesto-component v-else-if="vista === 'parametros' && trabajo" modo="editar" :base="trabajo.state" @cancelar="vista = 'editar'" @enviar="cambiarParametros" />
  <editor-presupuesto-component
    v-else-if="vista === 'editar' && trabajo" :key="trabajo.id" :con-inventario="conInventario" @abrir-inventario="$emit('abrir-inventario')" :presupuesto="trabajo" :guardando="guardando" :error-guardar="errorGuardar" :conflicto="conflicto"
    @cambiar="actualizar" @numeros="actualizarNumeros" @volver="volverALista" @editar-parametros="vista = 'parametros'" @guardar="guardar()" @descartar="descartar"
    @duplicar="duplicarActual" @abrir-variante="abrirVariante" @variante-eliminada="varianteEliminada" @estado="cambiarEstado" @resolver="resolver"
  />
  <div v-else>
    <p v-if="aviso" class="step-note warn" role="alert">{{ aviso }}</p>
    <lista-presupuestos-component ref="lista" :con-volver="conVolver" @cerrar="$emit('cerrar')" @nuevo="vista = 'nuevo'" @abrir="(id) => abrir(id, true)" @abrir-local="(id) => abrir(id, false)" @duplicar="pedirDuplicado" />
  </div>
  <duplicar-presupuesto-modal v-if="duplicando" :nombre="duplicando.nombre" :variante="duplicando.variante" :como-inicial="duplicando.como" @cerrar="duplicando = null" @confirmar="duplicar" />
</template>

<script>
import ListaPresupuestosComponent from './ListaPresupuestosComponent.vue'
import DatosPresupuestoComponent from './DatosPresupuestoComponent.vue'
import EditorPresupuestoComponent from './EditorPresupuestoComponent.vue'
import DuplicarPresupuestoModal from './DuplicarPresupuestoModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { parseCosts } from '@/utils/planificador/motor/costes'
import {
  budgetName, canonical, copyOf, fromServer, getLocal, isDirty, listLocal, newLocal, putLocal, removeLocal
} from '@/utils/planificador/almacenPresupuestos'
import { cuerpoParaServidor, sincronizado } from '@/utils/planificador/datosPresupuesto'

const estadoHttp = (e) => (e && e.response ? e.response.status : null)

// El Presupuestador: lo primero que se ve es la lista; desde ella se crea uno nuevo (fijando sus datos de partida) o se abre uno.
// Aquí se decide dónde se guarda cada cambio: siempre una copia de trabajo en este navegador y, si es un borrador, además el
// servidor cuando se pulsa «Guardar».
export default {
  name: 'Asistente-Presupuesto-Component',
  props: { conVolver: { type: Boolean, default: false }, conInventario: { type: Boolean, default: false } },
  emits: ['cerrar', 'abrir-inventario'],
  components: { ListaPresupuestosComponent, DatosPresupuestoComponent, EditorPresupuestoComponent, DuplicarPresupuestoModal },
  data() {
    // duplicando: el presupuesto que se está duplicando mientras se elige el cliente de la copia
    return { vista: 'lista', trabajo: null, guardando: false, errorGuardar: null, conflicto: null, aviso: '', duplicando: null }
  },
  mounted() {
    this.temporizador = null
    this.pendiente = null
    window.addEventListener('pagehide', this.volcar)
  },
  beforeUnmount() {
    window.removeEventListener('pagehide', this.volcar)
    this.volcar()
  },
  methods: {
    // La copia de trabajo se guarda en este navegador al modificarla (con una pequeña espera: se teclea mucho)
    programarVolcado() {
      this.pendiente = this.trabajo
      window.clearTimeout(this.temporizador)
      this.temporizador = window.setTimeout(this.volcar, 300)
    },
    volcar() {
      window.clearTimeout(this.temporizador)
      if (this.pendiente) { putLocal(this.pendiente); this.pendiente = null }
    },
    volverALista() {
      this.volcar()
      this.trabajo = null
      this.conflicto = null
      this.errorGuardar = null
      this.vista = 'lista'
    },
    entrar(b) {
      this.volcar()
      putLocal(b)
      this.trabajo = b
      this.errorGuardar = null
      this.conflicto = null
      this.vista = 'editar'
    },
    actualizar(estado) {
      if (!this.trabajo || estado === this.trabajo.state) return
      this.trabajo = { ...this.trabajo, state: estado, updatedAt: new Date().toISOString() }
      this.programarVolcado()
    },
    actualizarNumeros(n) {
      const w = this.trabajo
      if (w && (w.numbers.kwp !== n.kwp || w.numbers.panels !== n.panels || w.numbers.total !== n.total)) {
        this.trabajo = { ...w, numbers: n }
        this.programarVolcado()
      }
    },
    crearLocal(estado) { this.entrar(newLocal(estado)) },
    cambiarParametros(estado) {
      this.actualizar(estado)
      this.vista = 'editar'
    },

    // ---- Abrir y copiar ----------------------------------------------------------------------------------------------
    async abrir(id, compartido) {
      this.volcar()
      this.aviso = ''
      const problema = await this.abrirPresupuesto(id, compartido)
      if (problema) this.aviso = problema
    },
    async abrirPresupuesto(id, compartido) {
      const local = getLocal(id)
      if (!compartido) {
        if (!local) return 'Este presupuesto ya no está en este navegador.'
        // Un borrador que ya no está en el servidor se abre como local
        this.entrar(local.remote ? { ...local, remote: null } : local)
        return null
      }
      let completo
      try {
        completo = await planificadorApi.presupuesto(id)
      } catch (e) {
        if (estadoHttp(e) === 404) return 'Este borrador ya no existe en el servidor: puede que su autor lo haya eliminado.'
        // Sin servidor se puede seguir con la copia de este navegador
        if (local) { this.entrar(local); return null }
        return 'No se ha podido abrir el borrador: ' + mensajeError(e)
      }
      // Un presupuesto enviado o validado se abre siempre como está en el servidor (nunca con una copia local con otros precios)
      if (completo.status === 'borrador' && local && local.remote && isDirty(local)) {
        if (local.remote.version === completo.version) { this.entrar(local); return null }
        const seguirConMios = window.confirm(
          'Tienes cambios sin guardar en este navegador sobre una versión anterior de «' + (completo.name || 'este presupuesto') + '»: otra persona ha guardado después.\n\n' +
          'Aceptar: seguir con tus cambios (al guardar se te avisará de lo que ha cambiado).\nCancelar: abrir la versión actual y descartar tus cambios.')
        if (seguirConMios) { this.entrar(local); return null }
      }
      this.entrar(fromServer(completo))
      return null
    },
    abrirVariante(id) {
      this.abrirPresupuesto(id, true).then((p) => { if (p) this.errorGuardar = p })
    },
    // Los nombres de los presupuestos que ya hay (de este navegador y del servidor), para numerar la versión siguiente sin repetir
    async nombresTomados() {
      const nombres = listLocal().map((l) => budgetName(l.state))
      try { nombres.push(...(await planificadorApi.presupuestos()).map((b) => b.name)) } catch (e) { /* sin servidor: solo los de este navegador */ }
      return nombres
    },
    // Duplicar (desde la lista o desde el editor): primero se pregunta si la copia lleva el mismo cliente o uno nuevo
    pedirDuplicado(datos) {
      this.volcar()
      this.duplicando = { ...datos, desdeEditor: false }
    },
    // `como` = 'variante' si se llega desde «+ Nueva variante» (sale marcada); desde «Duplicar», una copia
    duplicarActual(como) {
      const w = this.trabajo
      if (!w) return
      this.volcar()
      this.duplicando = {
        id: w.id, compartido: !!w.remote, variante: !!w.remote && w.remote.status !== 'descartado', nombre: budgetName(w.state), desdeEditor: true,
        como: como === 'variante' ? 'variante' : 'copia'
      }
    },
    // El estado del presupuesto que se duplica: el de la copia abierta, el de este navegador o el del servidor
    async estadoParaDuplicar({ id, compartido, desdeEditor }) {
      if (desdeEditor && this.trabajo) return this.trabajo.state
      if (compartido) return parseCosts((await planificadorApi.presupuesto(id)).data)
      const local = getLocal(id)
      if (!local) throw new Error('Este presupuesto ya no está en este navegador.')
      return local.state
    },
    // Por defecto es una copia local entera (con el mismo cliente o sin él, para elegir otro en «Parámetros»); solo si se pide
    // expresamente, un compartido se duplica como variante de su oferta (en el servidor)
    async duplicar({ cliente, variante, nombre }) {
      const d = this.duplicando
      this.duplicando = null
      if (!d) return
      const problema = (texto) => { if (d.desdeEditor) this.errorGuardar = texto; else this.aviso = texto }
      this.aviso = ''
      try {
        if (variante && d.variante) {
          const v = await planificadorApi.variantePresupuesto(d.id, nombre)
          const fallo = await this.abrirPresupuesto(v.id, true)
          if (fallo) problema(fallo)
          return
        }
        const estado = await this.estadoParaDuplicar(d)
        const copia = copyOf(estado, await this.nombresTomados(), cliente === 'otro')
        if (cliente === 'otro') {
          this.entrar(copia)
          this.vista = 'parametros'
        } else if (d.desdeEditor) {
          this.entrar(copia)
        } else {
          putLocal(copia)
          this.volverALista()
          // La lista ya está montada: hay que decirle que vuelva a leer (si no, la copia no sale hasta recargar la página)
          this.$nextTick(() => { if (this.$refs.lista) this.$refs.lista.refrescar() })
        }
      } catch (e) {
        problema('No se ha podido duplicar: ' + mensajeError(e))
      }
    },
    // Elimina la variante abierta (la tira ya la ha borrado en el servidor) y abre otra de su oferta
    async varianteEliminada(siguienteId) {
      if (!siguienteId) return
      window.clearTimeout(this.temporizador)
      this.pendiente = null
      if (this.trabajo) removeLocal(this.trabajo.id)
      const problema = await this.abrirPresupuesto(siguienteId, true)
      if (problema) this.errorGuardar = problema
    },

    // ---- Estado y guardado ---------------------------------------------------------------------------------------------
    async cambiarEstado({ accion, cif }) {
      const w = this.trabajo
      if (!w || !w.remote) return
      try {
        if (accion === 'send') await planificadorApi.enviarPresupuesto(w.id)
        else if (accion === 'validate') await planificadorApi.validarPresupuesto(w.id, cif || '')
        else await planificadorApi.desvalidarPresupuesto(w.id)
        this.entrar(fromServer(await planificadorApi.presupuesto(w.id)))
      } catch (e) {
        this.errorGuardar = mensajeError(e)
      }
    },
    async guardar(forzar = false, recrear = false) {
      const w = this.trabajo
      if (!w) return
      this.volcar()
      const cliente = w.state.customer
      if (!cliente) {
        this.errorGuardar = 'Este presupuesto no tiene cliente: elígelo en «Editar parámetros» antes de guardarlo y compartirlo.'
        return
      }
      this.guardando = true
      this.errorGuardar = null
      this.conflicto = null
      try {
        const cuerpo = cuerpoParaServidor(w, budgetName(w.state), cliente)
        const completo = w.remote && !recrear
          ? await planificadorApi.guardarPresupuesto(w.id, { ...cuerpo, version: w.remote.version, force: forzar })
          : await planificadorApi.crearPresupuesto({ ...cuerpo, id: w.id })
        this.trabajo = sincronizado(this.trabajo, completo, w.state, canonical)
        this.programarVolcado()
      } catch (e) {
        const http = estadoHttp(e)
        if (http === 409 && w.remote && !recrear) this.conflicto = { kind: 'version', message: mensajeError(e) }
        else if (http === 404 && w.remote) this.conflicto = { kind: 'deleted' }
        else this.errorGuardar = 'No se ha podido guardar: ' + mensajeError(e)
      } finally {
        this.guardando = false
      }
    },
    // Deshacer los cambios sin guardar de un borrador: vuelve a como estaba la última vez que se guardó o se abrió
    descartar() {
      const w = this.trabajo
      if (!w || !w.remote) return
      if (!window.confirm('Se descartarán los cambios sin guardar y el presupuesto volverá a como estaba guardado. ¿Continuar?')) return
      let estado
      try {
        estado = parseCosts(JSON.parse(w.remote.syncedJson))
      } catch (e) {
        this.errorGuardar = 'No se han podido deshacer los cambios. Abre el borrador otra vez desde la lista para cargar la versión guardada.'
        return
      }
      this.errorGuardar = null
      this.conflicto = null
      this.actualizar(estado)
    },
    async resolver(como) {
      const w = this.trabajo
      if (!w) return
      if (como === 'servidor') {
        if (!window.confirm('Se descartarán tus cambios sin guardar y se abrirá la versión que hay en el servidor. ¿Continuar?')) return
        try { this.entrar(fromServer(await planificadorApi.presupuesto(w.id))) } catch (e) { this.errorGuardar = 'No se ha podido cargar la versión del servidor: ' + mensajeError(e) }
      } else if (como === 'sobrescribir') {
        if (!window.confirm('Tus cambios sustituirán a lo que ha guardado la otra persona. ¿Guardar igualmente?')) return
        await this.guardar(true)
      } else if (como === 'copia') {
        // Los cambios propios quedan en una copia local y el original vuelve a ser lo que hay en el servidor
        const copia = copyOf(w.state, await this.nombresTomados())
        putLocal(copia)
        try { putLocal(fromServer(await planificadorApi.presupuesto(w.id))) } catch (e) { /* si no se puede leer, el original se queda como estaba */ }
        this.entrar(copia)
      } else if (como === 'recrear') {
        await this.guardar(false, true)
      } else {
        this.conflicto = null
        this.trabajo = { ...this.trabajo, remote: null }
        this.programarVolcado()
      }
    }
  }
}
</script>
