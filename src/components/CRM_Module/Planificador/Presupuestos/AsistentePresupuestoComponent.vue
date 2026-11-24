<template>
  <datos-presupuesto-component v-if="vista === 'nuevo'" modo="nuevo" :base="baseNuevo" :hereda="!!(desde && desde.empresa)" @cancelar="volverALista" @enviar="crearLocal" />
  <datos-presupuesto-component v-else-if="vista === 'parametros' && trabajo" modo="editar" :base="trabajo.state" @cancelar="vista = 'editar'" @enviar="cambiarParametros" />
  <editor-presupuesto-component
    v-else-if="vista === 'editar' && trabajo" :key="trabajo.id" :con-inventario="conInventario" @abrir-inventario="$emit('abrir-inventario')" :presupuesto="trabajo" :guardando="guardando" :error-guardar="errorGuardar" :conflicto="conflicto"
    @cambiar="actualizar" @numeros="actualizarNumeros" @volver="volverALista" @editar-parametros="vista = 'parametros'" @guardar="guardar()" @descartar="descartar"
    @duplicar="duplicarActual" @abrir-variante="abrirVariante" @variante-eliminada="varianteEliminada" @estado="cambiarEstado" @resolver="resolver" @crear-estudio="crearEstudioDesde" @abrir-estudio="abrirEstudioDesde"
  />
  <div v-else>
    <p v-if="aviso" class="paso-nota warn" role="alert">{{ aviso }}</p>
    <lista-presupuestos-component ref="lista" :con-volver="conVolver" @cerrar="$emit('cerrar')" @abrir-estudio="$emit('abrir-estudio', $event)" @crear-estudio="$emit('crear-estudio', $event)" @abrir-boe="$emit('abrir-boe')" @crear-proyecto="$emit('crear-proyecto', $event)" @abrir-proyecto="$emit('abrir-proyecto', $event)" @crear-presupuesto="nuevoDesdeEstudio" @abrir="(id) => abrir(id, true)" @abrir-local="(id) => abrir(id, false)" @duplicar="pedirDuplicado" />
  </div>
  <duplicar-presupuesto-modal v-if="duplicando" :nombre="duplicando.nombre" :variante="duplicando.variante" @cerrar="duplicando = null" @confirmar="duplicar" />
</template>

<script>
import ListaPresupuestosComponent from './ListaPresupuestosComponent.vue'
import DatosPresupuestoComponent from './DatosPresupuestoComponent.vue'
import EditorPresupuestoComponent from './EditorPresupuestoComponent.vue'
import DuplicarPresupuestoModal from './DuplicarPresupuestoModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { parseCosts, EMPTY_COSTS, EMPTY_SURVEY } from '@/utils/planificador/motor/costes'
import {
  budgetName, canonical, copyOf, fromServer, getLocal, isDirty, newLocal, putLocal, removeLocal
} from '@/utils/planificador/almacenPresupuestos'
import { conEmpresaDePropuesta, cuerpoParaServidor, propuestaDelPresupuesto, sincronizado } from '@/utils/planificador/datosPresupuesto'

const estadoHttp = (e) => (e && e.response ? e.response.status : null)

// El Presupuestador: lo primero que se ve es la lista; desde ella se crea uno nuevo (fijando sus datos de partida) o se abre uno.
// Aquí se decide dónde se guarda cada cambio: siempre una copia de trabajo en este navegador y, si es un borrador, además el
// servidor cuando se pulsa «Guardar».
export default {
  name: 'Asistente-Presupuesto-Component',
  props: {
    conVolver: { type: Boolean, default: false },
    conInventario: { type: Boolean, default: false },
    // Al abrirlo desde un estudio: { tipo: 'presupuesto', estudioId, customer, proyecto, kwp }. El presupuesto nuevo arranca con su cliente,
    // proyecto y potencia y, al guardarlo y compartirlo, nace asociado a ese estudio.
    traspaso: { type: Object, default: null }
  },
  emits: ['cerrar', 'abrir-inventario', 'crear-estudio', 'abrir-estudio', 'abrir-boe', 'crear-proyecto', 'abrir-proyecto'],
  components: { ListaPresupuestosComponent, DatosPresupuestoComponent, EditorPresupuestoComponent, DuplicarPresupuestoModal },
  data() {
    // duplicando: el presupuesto que se está duplicando mientras se elige el cliente de la copia
    const desde = this.traspaso && this.traspaso.tipo === 'presupuesto' ? this.traspaso : null
    return { desde, vista: desde ? 'nuevo' : 'lista', trabajo: null, guardando: false, errorGuardar: null, conflicto: null, aviso: '', duplicando: null }
  },
  computed: {
    /** Los datos de partida de un presupuesto nuevo: vacíos, o con lo que trae el estudio del que se viene. */
    baseNuevo() {
      const d = this.desde
      if (!d) return null
      const customer = d.customer ? JSON.parse(JSON.stringify(d.customer)) : null
      return {
        ...EMPTY_COSTS, survey: { ...EMPTY_SURVEY, targetKwp: d.kwp > 0 ? d.kwp : EMPTY_SURVEY.targetKwp, futureBattery: d.bateria === true }, // un estudio con batería: inversor híbrido
        customer, client: (customer && customer.name) || '', reference: d.proyecto || '',
        ...(d.empresa ? { cif: d.empresa.cif || '', clientLogo: d.empresa.logo || '', encaje: d.empresa.encaje || '' } : {})
      }
    }
  },
  mounted() {
    // 'abrir-presupuesto': desde la pestaña «Presupuesto» de un estudio, directo al presupuesto elegido
    if (this.traspaso && this.traspaso.tipo === 'abrir-presupuesto') this.abrir(this.traspaso.id, true)
    this.temporizador = null
    this.pendiente = null
    this.guardarTras = null // espera para guardar en el servidor los parámetros recién cambiados
    this.guardarTrasId = null // el presupuesto al que pertenecen
    window.addEventListener('pagehide', this.volcar)
  },
  beforeUnmount() {
    window.removeEventListener('pagehide', this.volcar)
    window.clearTimeout(this.guardarTras)
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
    nuevo() {
      this.desde = null
      this.vista = 'nuevo'
    },
    // Desde la lista: un presupuesto nuevo con el cliente, el proyecto y la potencia de un estudio (asociado a él si está compartido)
    nuevoDesdeEstudio(datos) {
      this.desde = { tipo: 'presupuesto', ...datos }
      this.vista = 'nuevo'
    },
    // El estudio que se crea desde el editor de un presupuesto parte de su coste (su importe y sus kWp de ahora)
    crearEstudioDesde(datos) {
      const n = this.trabajo && this.trabajo.id === datos.presupuestoId ? this.trabajo.numbers : null
      this.$emit('crear-estudio', { ...datos, presupuesto: n && n.total > 0 && n.kwp > 0 ? { id: datos.presupuestoId, total: n.total, kwp: n.kwp } : null })
    },
    // La pestaña «Estudio» del presupuesto: el estudio se abre con el coste de este presupuesto (su importe y sus kWp de ahora)
    abrirEstudioDesde(datos) {
      const n = this.trabajo && this.trabajo.id === datos.presupuestoId ? this.trabajo.numbers : null
      this.$emit('abrir-estudio', { id: datos.id, kind: 'compartido', presupuesto: n && n.total > 0 && n.kwp > 0 ? { id: datos.presupuestoId, total: n.total, kwp: n.kwp } : null })
    },
    volverALista() {
      this.desde = null
      this.volcar()
      this.cancelarGuardadoDeParametros()
      this.trabajo = null
      this.conflicto = null
      this.errorGuardar = null
      this.vista = 'lista'
    },
    entrar(b) {
      this.volcar()
      this.cancelarGuardadoDeParametros()
      putLocal(b)
      this.trabajo = b
      this.errorGuardar = null
      this.conflicto = null
      this.vista = 'editar'
      this.completarEmpresa(b)
    },
    // El CIF, el logo y el encaje son de la propuesta: un borrador que no los tiene los toma de ella al abrirlo (uno enviado o aprobado no cambia)
    async completarEmpresa(b) {
      const s = b.state
      if ((b.remote && b.remote.status !== 'borrador') || (s.cif && s.clientLogo && s.encaje)) return
      try {
        const registro = propuestaDelPresupuesto(s, await planificadorApi.proyectosComerciales())
        if (!registro) return
        const propuesta = await planificadorApi.proyectoComercial(registro.id)
        if (!this.trabajo || this.trabajo.id !== b.id) return
        this.actualizar(conEmpresaDePropuesta(this.trabajo.state, propuesta))
      } catch (e) { /* sin propuesta que leer: el presupuesto se queda como está */ }
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
      // Tras cambiar los parámetros, el editor recalcula (catálogo, inversores…) y va mandando los números: se guarda cuando se calma
      if (this.guardarTrasId) this.programarGuardadoDeParametros(800)
    },
    crearLocal(estado) {
      const nuevo = newLocal({ ...estado, tramitesPendientes: true }) // el editor le pone las partidas de proyecto y trámites por defecto
      if (this.desde) nuevo.estudioOrigen = this.desde.estudioId // nace asociado a este estudio al compartirlo
      this.entrar(nuevo)
    },
    cambiarParametros(estado) {
      this.actualizar(estado)
      this.vista = 'editar'
      // En un borrador ya guardado en el servidor, «Guardar parámetros» ya lo guarda: no hay que confirmarlo otra vez con «Guardar cambios».
      // (Un presupuesto solo local no se comparte sin que se pida, y el guardado de verdad lo hace «Guardar y compartir».)
      const w = this.trabajo
      if (w && w.remote && w.remote.status === 'borrador') {
        this.guardarTrasId = w.id
        this.programarGuardadoDeParametros(5000) // si el editor no llegase a mandar números, se guarda igualmente pasado este tiempo
      }
    },
    // Espera a que el editor haya recalculado el resumen (potencia, paneles e importe que enseña la lista) antes de guardar
    programarGuardadoDeParametros(espera) {
      window.clearTimeout(this.guardarTras)
      this.guardarTras = window.setTimeout(() => {
        const w = this.trabajo
        const id = this.guardarTrasId
        this.guardarTrasId = null
        if (w && w.id === id && isDirty(w) && !this.guardando) this.guardar()
      }, espera)
    },
    cancelarGuardadoDeParametros() {
      window.clearTimeout(this.guardarTras)
      this.guardarTrasId = null
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
    // Duplicar (desde la lista o desde el editor): primero se pregunta si la copia lleva el mismo cliente o uno nuevo
    pedirDuplicado(datos) {
      this.volcar()
      this.duplicando = { ...datos, desdeEditor: false }
    },
    duplicarActual() {
      const w = this.trabajo
      if (!w) return
      this.volcar()
      this.duplicando = {
        id: w.id, compartido: !!w.remote, variante: !!w.remote && w.remote.status !== 'descartado', nombre: budgetName(w.state), desdeEditor: true
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
    // Con el mismo cliente es otra versión del mismo proyecto: un presupuesto compartido se guarda ya en el servidor como variante de
    // su oferta y uno local es una copia local (el listado las junta por cliente y proyecto). Con otro cliente es una copia local
    // sin cliente, que se abre en «Parámetros» para elegirlo.
    async duplicar({ cliente, nombre }) {
      const d = this.duplicando
      this.duplicando = null
      if (!d) return
      const problema = (texto) => { if (d.desdeEditor) this.errorGuardar = texto; else this.aviso = texto }
      this.aviso = ''
      try {
        if (cliente === 'mismo' && d.variante) {
          const v = await planificadorApi.variantePresupuesto(d.id, nombre)
          const fallo = await this.abrirPresupuesto(v.id, true)
          if (fallo) problema(fallo)
          return
        }
        const estado = await this.estadoParaDuplicar(d)
        const copia = copyOf(estado, cliente === 'otro')
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
      if (!w.state.reference.trim()) {
        this.errorGuardar = 'Este presupuesto no tiene nombre de proyecto: ponlo en «Editar parámetros» antes de guardarlo y compartirlo.'
        return
      }
      this.guardando = true
      this.errorGuardar = null
      this.conflicto = null
      try {
        const cuerpo = cuerpoParaServidor(w, budgetName(w.state), cliente)
        const completo = w.remote && !recrear
          ? await planificadorApi.guardarPresupuesto(w.id, { ...cuerpo, version: w.remote.version, force: forzar })
          : await planificadorApi.crearPresupuesto({ ...cuerpo, id: w.id, study_id: w.estudioOrigen || undefined })
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
        const copia = copyOf(w.state)
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
