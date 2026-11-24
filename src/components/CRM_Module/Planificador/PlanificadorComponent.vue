<template>
  <p v-if="estado === 'error'" class="error">No se pudo conectar con el servidor del Planificador.</p>

  <template v-if="cargadas">
    <!-- Presupuestador, inventario e inicio ocupan toda la pantalla (sin barra lateral) -->
    <div v-if="pantallaCompleta" class="layout focus">
      <main class="content">
        <inicio-component v-if="mostrarInicio" :disponibles="disponibles" :pendientes="{ costing: pendientesValidar }" @abrir="abrirArea" />
        <asistente-presupuesto-component v-else-if="foco === 'costing' && conLista" :con-volver="true" :con-inventario="funciones.inventory" :traspaso="traspaso" @cerrar="cerrarFoco" @abrir-inventario="abrirFoco('inventory')" @crear-estudio="abrirConTraspaso('studies', { tipo: 'estudio', ...$event })"
                                          @abrir-boe="abrirConTraspaso('studies', { tipo: 'boe' })" @abrir-estudio="abrirConTraspaso('studies', { tipo: 'abrir-estudio', ...$event })" />
        <estudios-component v-else-if="foco === 'studies' && funciones.studies" :traspaso="traspaso" @volver-a-presupuestos="volverAtras" @crear-presupuesto="abrirConTraspaso('costing', { tipo: 'presupuesto', ...$event })" @abrir-presupuesto="abrirConTraspaso('costing', { tipo: 'abrir-presupuesto', id: $event })" />
        <inventario-component v-else :etiqueta-volver="desde === 'costing' ? '← Volver al presupuestador' : '← Volver al inicio'" @cerrar="desde === 'costing' ? volverAtras() : cerrarFoco()" />
      </main>
    </div>
    <proyectos-component v-else :enlace="enlace" :con-volver="hayHerramientas" @volver="entrado = false" />
  </template>
</template>

<script>
import InicioComponent from './InicioComponent.vue'
import InventarioComponent from './Inventario/InventarioComponent.vue'
import AsistentePresupuestoComponent from './Presupuestos/AsistentePresupuestoComponent.vue'
import ProyectosComponent from './Proyectos/ProyectosComponent.vue'
import EstudiosComponent from './Estudios/EstudiosComponent.vue'
import { planificadorApi } from '@/services/planificadorApi'
import { esValidador } from '@/services/usuarioActual'

const CLAVE = 'planificador:nav'

// Enlace de un aviso de la intranet: ?proyecto=ID&tarea=ID abre ese proyecto y despliega esa tarea
function leerEnlace() {
  const q = new URLSearchParams(window.location.search)
  const proyecto = q.get('proyecto')
  return proyecto ? { proyecto, tarea: q.get('tarea') } : null
}

/**
 * Dónde se estaba al recargar: el Planificador va en un marco de la intranet y al recargar se carga de cero, así que la pantalla
 * (proyecto abierto, presupuestador, inventario) se guarda en la sesión del navegador. Un enlace de aviso manda sobre lo guardado.
 */
function leerGuardado() {
  if (leerEnlace()) return null
  try {
    const nav = JSON.parse(sessionStorage.getItem(CLAVE) || 'null')
    if (!nav || typeof nav !== 'object') return null
    // Un estudio se abre con lo que le pasa la lista (el traspaso), y eso no se guarda: al recargar, a la lista
    return nav.foco === 'studies' ? { ...nav, foco: 'costing' } : nav
  } catch (e) {
    return null
  }
}

// Contenedor del Planificador: pantalla de inicio (presupuestador, proyectos, inventario), cada una a pantalla completa, con el
// botón Atrás del navegador funcionando (una entrada del historial por pantalla) y el clic en «Planificador» del menú de la
// intranet llevando al inicio.
export default {
  name: 'Planificador-Component',
  components: { InicioComponent, InventarioComponent, AsistentePresupuestoComponent, ProyectosComponent, EstudiosComponent },
  data() {
    const guardado = leerGuardado()
    const enlace = leerEnlace()
    return {
      estado: 'cargando',
      cargadas: false,
      // Funciones del servidor: sin respuesta, todo apagado
      funciones: { budgeter: false, inventory: false, studies: false, local_files: false },
      entrado: enlace !== null || !!(guardado && guardado.entrado),
      foco: guardado && ['costing', 'inventory', 'studies'].includes(guardado.foco) ? guardado.foco : null,
      desde: guardado && guardado.foco === 'inventory' ? guardado.desde || null : null,
      pendientesValidar: 0,
      // Lo que una pantalla le pasa a otra al abrirla (p. ej. el cliente y el proyecto de un presupuesto para crear su estudio)
      traspaso: null,
      enlace,
      guardadoAlArrancar: guardado
    }
  },
  computed: {
    hayHerramientas() { return this.funciones.budgeter || this.funciones.inventory || this.funciones.studies },
    // La lista de presupuestos y estudios sirve para lo uno y para lo otro
    conLista() { return this.funciones.budgeter || this.funciones.studies },
    disponibles() { return ['projects', ...(this.conLista ? ['costing'] : []), ...(this.funciones.inventory ? ['inventory'] : [])] },
    mostrarInicio() { return this.hayHerramientas && !this.entrado && !this.foco },
    pantallaCompleta() { return this.mostrarInicio || (this.foco === 'costing' && this.conLista) || (this.foco === 'inventory' && this.funciones.inventory) || (this.foco === 'studies' && this.funciones.studies) }
  },
  watch: {
    entrado() { this.guardar() },
    foco() { this.guardar(); this.contarPendientes() },
    desde() { this.guardar() }
  },
  async mounted() {
    this.profundidad = 0
    this.reconstruirHistorial()
    window.addEventListener('popstate', this.alRetroceder)
    window.addEventListener('message', this.alMensaje)
    this.escucharMenu()
    try {
      this.estado = (await planificadorApi.salud()).status === 'ok' ? 'ok' : 'error'
    } catch (e) {
      this.estado = 'error'
    }
    try {
      this.funciones = await planificadorApi.funciones()
    } catch (e) {
      this.funciones = { budgeter: false, inventory: false, studies: false, local_files: false }
    }
    this.cargadas = true
    // Un aviso de «toca revisar los precios» abre el inventario (?revisar=precios)
    if (new URLSearchParams(window.location.search).get('revisar') === 'precios' && this.funciones.inventory) this.abrirFoco('inventory')
    this.contarPendientes()
  },
  beforeUnmount() {
    window.removeEventListener('popstate', this.alRetroceder)
    window.removeEventListener('message', this.alMensaje)
    if (this.quitarEscuchaMenu) this.quitarEscuchaMenu()
  },
  methods: {
    guardar() {
      try { sessionStorage.setItem(CLAVE, JSON.stringify({ entrado: this.entrado, foco: this.foco, desde: this.desde })) } catch (e) { /* sin almacenamiento de sesión: al recargar se empieza en el inicio */ }
    },
    // Presupuestos enviados al cliente que esperan validación (solo para quien valida): se lee al entrar y al volver del presupuestador
    contarPendientes() {
      if (!this.funciones.budgeter || !esValidador() || this.foco === 'costing') return
      planificadorApi.pendientesDeValidar().then((r) => { this.pendientesValidar = r.count }, () => { this.pendientesValidar = 0 })
    },
    abrirArea(area) {
      if (area === 'projects') this.entrado = true
      else this.abrirFoco(area)
    },
    // El presupuestador y el inventario ocupan toda la pantalla y no tienen dirección propia: cada pantalla que se abre añade una
    // entrada al historial, para que el botón Atrás deshaga solo el último paso y no salga del Planificador.
    mostrarFoco(vista, desde = null) {
      if (vista !== 'studies' && vista !== 'costing') this.traspaso = null
      this.foco = vista
      this.desde = vista === 'inventory' ? desde : null
    },
    abrirFoco(vista) {
      const desde = vista === 'inventory' && this.foco === 'costing' ? 'costing' : null
      if (this.foco !== vista) {
        this.profundidad += 1
        window.history.pushState({ plannerFocus: vista, depth: this.profundidad, from: desde }, '')
      }
      this.mostrarFoco(vista, desde)
    },
    // Abre otra pantalla llevándole algo (la destino lo recoge al montarse); un clic normal en el inicio no lleva nada
    abrirConTraspaso(vista, traspaso) {
      this.traspaso = traspaso
      this.abrirFoco(vista)
    },
    cerrarFoco() {
      this.mostrarFoco(null)
      if (this.profundidad > 0) {
        const atras = this.profundidad
        this.profundidad = 0
        window.history.go(-atras) // quita todas las entradas que añadió el Planificador
      }
    },
    volverAtras() { window.history.back() },
    alRetroceder(evento) {
      const estado = evento.state
      this.profundidad = (estado && estado.depth) || 0
      this.mostrarFoco((estado && estado.plannerFocus) || null, (estado && estado.from) || null)
    },
    // Al recargar en el presupuestador o el inventario se reconstruye el historial (una entrada por pantalla)
    reconstruirHistorial() {
      const g = this.guardadoAlArrancar
      if (g && ['costing', 'inventory', 'studies'].includes(g.foco)) {
        window.history.replaceState(null, '')
        this.profundidad = 1
        window.history.pushState({ plannerFocus: g.foco, depth: 1, from: g.desde || null }, '')
      } else if (window.history.state && window.history.state.plannerFocus) {
        window.history.replaceState(null, '') // la entrada de una pantalla se deja como una normal
      }
    },
    // Volver a la pantalla de inicio. La intranet lo pide al pulsar su menú «Planificador» mientras ya se está dentro
    irAInicio() {
      this.cerrarFoco()
      this.entrado = false
    },
    alMensaje(evento) {
      if (evento.origin !== window.location.origin) return
      if (evento.data && evento.data.tipo === 'planificador:inicio') this.irAInicio()
    },
    // El Planificador va en un marco de la intranet y se sirve desde su mismo origen: puede escuchar él mismo el clic en la opción
    // «Planificador» del menú (que está fuera del marco). Fuera de la intranet, o si el navegador no deja acceder a la página que
    // lo contiene, no hace nada.
    escucharMenu() {
      let fuera
      try {
        if (window.parent === window) return
        fuera = window.parent.document
      } catch (e) {
        return
      }
      const esMenu = (objetivo) => {
        // `instanceof Element` no sirve: el elemento es de otro documento y su clase Element es otra
        let el = objetivo && objetivo.nodeType === 1 ? objetivo : null
        // Campana de notificaciones y similares: nunca son la opción del menú
        if (el && el.closest('[class*="notif" i], [class*="bell" i], [class*="campana" i], [id*="notif" i], [aria-label*="notif" i], [title*="notif" i]')) return false
        const pulsable = 'a, button, li, [role="menuitem"], [role="link"], [role="button"], [role="tab"]'
        const limite = el && el.closest(pulsable) ? 6 : 3
        for (let nivel = 0; el && nivel < limite; nivel++, el = el.parentElement) {
          const texto = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
          const href = (el.getAttribute('href') || '').split('?')[0].replace(/\/+$/, '').toLowerCase()
          // Solo textos cortos con la palabra «planificador»: un contenedor grande que incluya otras opciones no es la opción
          if ((texto.length <= 40 && /(^|\s)planificador(\s|$)/.test(texto)) || href.endsWith('/planificador')) return true
          if (el.matches(pulsable)) break
        }
        return false
      }
      const alClic = (evento) => { if (esMenu(evento.target)) this.irAInicio() }
      fuera.addEventListener('click', alClic, true)
      this.quitarEscuchaMenu = () => fuera.removeEventListener('click', alClic, true)
    }
  }
}
</script>

<style src="./PlanificadorComponent.css"></style>
