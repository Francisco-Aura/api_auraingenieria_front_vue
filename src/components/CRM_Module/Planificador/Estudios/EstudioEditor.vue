<template>
  <div class="estudio">
    <div class="back-fila">
      <button type="button" class="secondary" @click="$emit('volver')">← Volver a propuestas</button>
    </div>
    <div class="costes-titulo">
      <div>
        <h1>{{ estudio.state.customer ? estudio.state.customer.name : 'Estudio' }}</h1>
        <p v-if="subtitulo" class="muted estudio-subtitulo">{{ subtitulo }}</p>
      </div>
    </div>

    <pestanas-propuesta activa="estudio" :estudio="pestanaEstudio" :presupuesto="pestanaPresupuesto" @ir="irAPresupuesto" />

    <section class="guardar-barra" :class="remoto ? 'shared' : 'local'" aria-label="Dónde se guarda este estudio">
      <div class="guardar-donde">
        <template v-if="remoto">
          <strong><svg class="estado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3.2" /><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" /><path d="M16 4.8a3.2 3.2 0 0 1 0 6M21 20v-1a5 5 0 0 0-3.5-4.7" /></svg>Compartido</strong>
          <span class="muted"> · lo ven y lo pueden modificar todos · versión {{ remoto.version }}{{ remoto.owner ? ' · creado por ' + remoto.owner : '' }}{{ remoto.updatedAt ? ' · guardado ' + fecha(remoto.updatedAt) + (remoto.updatedBy ? ' por ' + remoto.updatedBy : '') : '' }}</span>
        </template>
        <template v-else>
          <strong><svg class="estado-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M7 3v5h8V3M7 21v-7h10v7" /></svg>Local</strong><span class="muted"> · solo está en este navegador: nadie más lo ve</span>
        </template>
        <span v-if="sucio" class="tag issue warn" title="Hay cambios en este navegador que todavía no están guardados en el servidor">Cambios sin guardar</span>
        <label v-if="remoto" class="estudio-estado">Estado
          <select :value="remoto.estado" :disabled="guardando || sucio" :title="sucio ? 'Guarda los cambios antes de cambiar el estado' : 'Con «Aceptado» el estudio queda bloqueado'" @change="cambiarEstado">
            <option v-for="(e, id) in ESTADOS" :key="id" :value="id">{{ e.label }}</option>
          </select>
        </label>
        <span v-if="bloqueado" class="tag state validado" title="Un estudio aceptado no se modifica: cambia su estado para poder editarlo">Bloqueado</span>
      </div>
      <div class="guardar-acciones">
        <button type="button" :disabled="guardando || bloqueado || (!!remoto && !sucio)" :title="remoto ? 'Guarda los cambios en el servidor para todos' : 'Lo guarda en el servidor: lo verán y podrán modificarlo todos los usuarios de la intranet'" @click="$emit('guardar')">
          {{ guardando ? 'Guardando…' : remoto ? 'Guardar cambios' : 'Guardar y compartir' }}
        </button>
        <button v-if="remoto && !sucio" type="button" class="secondary" :disabled="guardando" @click="$emit('crear-presupuesto')">Crear presupuesto</button>
        <button v-if="(remoto && sucio) || (!remoto && cambiosLocales)" type="button" class="secondary" :disabled="guardando" :title="remoto ? 'Deshace los cambios sin guardar: vuelve a como estaba la última vez que se guardó' : 'Deshace los cambios hechos desde que abriste el estudio'" @click="$emit('descartar')">Descartar cambios</button>
      </div>
      <p v-if="errorGuardar && !conflicto" class="error guardar-mensaje" role="alert">{{ errorGuardar }}</p>
      <div v-if="conflicto && conflicto.kind === 'version'" class="guardar-conflicto" role="alert">
        <p><strong>⚠ No se han guardado tus cambios.</strong> {{ conflicto.message }}</p>
        <div class="guardar-acciones">
          <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'servidor')">Cargar su versión (descarto mis cambios)</button>
          <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'sobrescribir')">Guardar la mía encima</button>
          <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'copia')">Guardar mis cambios como copia local</button>
        </div>
      </div>
      <div v-if="conflicto && conflicto.kind === 'deleted'" class="guardar-conflicto" role="alert">
        <p><strong>⚠ Este estudio ya no existe en el servidor:</strong> su autor lo ha eliminado.</p>
        <div class="guardar-acciones">
          <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'recrear')">Volver a guardarlo y compartirlo</button>
          <button type="button" class="secondary" :disabled="guardando" @click="$emit('resolver', 'local')">Dejarlo como local</button>
        </div>
      </div>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="estudio.calc.aviso" class="estudio-aviso" role="status">{{ estudio.calc.aviso }}</p>

    <!-- Lo primero: es donde se edita el estudio. Plegado de inicio para no ocupar pantalla; «Editar parámetros» se ve siempre -->
    <details class="alta-tarjeta estudio-parametros" aria-label="Parámetros del estudio">
      <summary class="estudio-parametros-cabecera">
        <h2>Parámetros del estudio</h2>
        <button v-if="!bloqueado" type="button" class="enlace-boton" @click.stop.prevent="$emit('editar-parametros')">Editar parámetros</button>
      </summary>
      <dl class="estudio-resumen">
        <div class="ancho">
          <dt>Cliente</dt>
          <dd>
            <span v-if="cliente" class="tag state" :class="cliente.kind === 'potencial' ? 'local' : 'borrador'">{{ cliente.kind === 'potencial' ? 'Cliente potencial' : 'Cliente de la intranet' }}</span>
            {{ cliente ? cliente.name : '—' }}<span v-if="detalleCliente" class="muted"> · {{ detalleCliente }}</span>
          </dd>
        </div>
        <div v-if="suministro" class="ancho"><dt>Suministro</dt><dd>{{ suministro }}</dd></div>
        <div><dt>Instalación</dt><dd>{{ instalacion }}</dd></div>
        <div><dt>Ubicación y producción</dt><dd>{{ ubicacion }}</dd></div>
        <div v-if="!aislada"><dt>Precio de la energía</dt><dd>{{ precioEnergia }}</dd></div>
        <div v-else><dt>Coste del kWh del grupo</dt><dd>{{ costeGrupo }}</dd></div>
        <div>
          <dt>Inversión</dt>
          <dd>
            {{ inversion }}
            <select v-if="opcionesCoste.length > 0" class="estudio-coste-select" aria-label="Presupuesto del que sale el coste" :value="presupuestoActual" @change="$emit('elegir-presupuesto', $event.target.value)">
              <option v-for="o in opcionesCoste" :key="o.id" :value="o.id">{{ o.etiqueta }}</option>
            </select>
          </dd>
        </div>
        <div v-if="estudio.state.observaciones" class="ancho"><dt>Observaciones</dt><dd class="estudio-obs-texto">{{ estudio.state.observaciones }}</dd></div>
      </dl>
    </details>

    <section class="alta-tarjeta estudio-resultado" :class="{ recalculando: calculando }">
      <div class="estudio-resultado-cabecera">
        <h2>Resultado</h2>
        <span v-if="calculando" class="muted">Recalculando…</span>
        <div v-if="r" class="estudio-acciones">
          <button type="button" :disabled="ocupado || calculando" @click="abrirInforme">Descargar informe</button>
        </div>
      </div>
      <p v-if="!r" class="muted estudio-vacio">Sin consumo del cliente</p>
      <template v-else>
        <div class="estudio-kpis">
          <div class="principal"><b>{{ r.finanzas.retorno ? fmt(r.finanzas.retorno, 1) + ' años' : '—' }}</b><span>{{ r.finanzas.retorno ? 'retorno de la inversión' : 'no se recupera en 25 años' }}</span></div>
          <div><b>{{ fmt(r.finanzas.inversion, 0) }} €</b><span>inversión</span></div>
          <div><b>{{ fmt(r.simulacion.cobertura * 100, 0) }} %</b><span>del consumo cubierto</span></div>
          <div><b>{{ r.finanzas.tir !== null ? fmt(r.finanzas.tir * 100, 1) + ' %' : '—' }}</b><span>TIR</span></div>
          <div><b>{{ fmt(r.simulacion.solarConsumida / 1000, 0) }} MWh</b><span>solares de {{ fmt(r.consumo.consumoAnual / 1000, 0) }} MWh de consumo</span></div>
          <div v-if="r.grupo"><b>{{ fmt(r.grupo.litrosAhorrados, 0) }} L</b><span>de gasoil ahorrados al año</span></div>
          <div v-if="r.grupo"><b>{{ fmt(r.grupo.co2Ahorrado / 1000, 1) }} t</b><span>de CO₂ evitadas</span></div>
        </div>
        <p v-for="a in avisosPrecio" :key="a" class="estudio-aviso" role="status">{{ a }}</p>
        <div class="estudio-tabla">
          <table>
            <thead>
              <tr>
                <th>Potencia</th>
                <th v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ fmt(s.kwp, 0) }} kWp</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Consumo cubierto</td><td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ fmt(s.cobertura * 100, 0) }} %</td></tr>
              <tr><td>Inversión</td><td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ fmt(s.inversion, 0) }} €</td></tr>
              <tr><td>Ahorro año 1</td><td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ fmt(s.ahorroPrimerAno, 0) }} €</td></tr>
              <tr><td>Retorno</td><td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ s.retorno ? fmt(s.retorno, 1) + ' años' : '—' }}</td></tr>
              <tr><td>TIR</td><td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">{{ s.tir !== null ? fmt(s.tir * 100, 1) + ' %' : '—' }}</td></tr>
              <tr>
                <td />
                <td v-for="s in r.escenarios" :key="s.kwp" :class="{ actual: esActual(s) }">
                  <span v-if="esActual(s)" class="muted">actual</span>
                  <button v-else type="button" class="secondary estudio-mini" :disabled="calculando" title="Cambia la potencia del estudio a esta y lo recalcula todo con ella" @click="$emit('usar-kwp', Math.round(s.kwp))">Elegir esta</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <graficas-estudio v-if="r.graficas" :resultado="r" />
      </template>
    </section>

    <section v-if="r" class="alta-tarjeta estudio-recomendaciones" aria-label="Recomendaciones del estudio">
      <h2>Recomendaciones</h2>
      <p v-if="sugeridas.length === 0" class="muted">Ninguna recomendación se sugiere para este estudio.</p>
      <details v-for="x in sugeridas" :key="x.id" class="estudio-recomendacion">
        <summary>{{ x.titulo }}</summary>
        <div class="estudio-recomendacion-texto" v-html="formatoTexto(x.texto)" />
      </details>
    </section>

    <descargar-informe-modal v-if="eligiendo" :categorias="categoriasInforme" :ocupado="ocupado" @cerrar="eligiendo = false" @descargar="descargar($event.formato, $event.orden)" />

    <div class="estudio-pie">
      <button type="button" class="secondary peligro" :disabled="guardando || ocupado || bloqueado" @click="eliminar">Eliminar el estudio</button>
      <span class="muted">Creado {{ fecha(estudio.createdAt) }}<template v-if="remoto && remoto.updatedAt"> · última modificación {{ fecha(remoto.updatedAt) }}<template v-if="remoto.updatedBy"> por {{ remoto.updatedBy }}</template></template></span>
    </div>

  </div>
</template>

<script>
import GraficasEstudio from './GraficasEstudio.vue'
import DescargarInformeModal from './DescargarInformeModal.vue'
import PestanasPropuesta from '../PestanasPropuesta.vue'
import { construirCategorias } from '@/utils/planificador/graficasEstudio'
import { cuerpoInforme } from '@/utils/planificador/informePersonalizado'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { descargarArchivo, imprimirHtml } from '@/utils/planificador/documentos/descarga'
import { conPresupuesto, cuerpoDe, isDirty } from '@/utils/planificador/almacenEstudios'
import { ESTADOS_ESTUDIO, ETIQUETA_ESTADO } from '@/utils/planificador/listaPresupuestos'

// El resultado de un estudio y dónde está guardado. Los parámetros se piden en «Editar parámetros»; aquí solo se elige otra potencia
// de las que se comparan. Qué se guarda y dónde (local o compartido en el servidor) lo decide quien usa este componente.
export default {
  name: 'Estudio-Editor',
  components: { GraficasEstudio, DescargarInformeModal, PestanasPropuesta },
  props: {
    // La copia de trabajo: { id, state, calc, remote, createdAt }
    estudio: { type: Object, required: true },
    guardando: { type: Boolean, default: false },
    calculando: { type: Boolean, default: false },
    errorGuardar: { type: String, default: '' },
    conflicto: { type: Object, default: null },
    // Un estudio solo local tiene cambios respecto a como se abrió
    cambiosLocales: { type: Boolean, default: false },
    // Los presupuestos compartidos asociados al estudio ({ id, total, kwp, nombre }): de uno de ellos puede salir el coste
    presupuestos: { type: Array, default: () => [] },
    // Todos los presupuestos compartidos asociados ({ id, status }), con o sin importe: son los que se abren desde la pestaña «Presupuesto»
    asociados: { type: Array, default: () => [] }
  },
  emits: ['volver', 'editar-parametros', 'guardar', 'descartar', 'resolver', 'usar-kwp', 'elegir-presupuesto', 'eliminar', 'crear-presupuesto', 'cambiar-estado', 'abrir-presupuesto'],
  data() {
    return { ocupado: false, error: '', eligiendo: false, recomendaciones: [], ESTADOS: ESTADOS_ESTUDIO }
  },
  mounted() { this.cargarRecomendaciones() },
  watch: {
    // Al cambiar la potencia o los parámetros cambian los números de los textos
    'estudio.calc'() { this.cargarRecomendaciones() }
  },
  computed: {
    sugeridas() { return this.recomendaciones.filter((x) => x.sugerida) },
    /** Las categorías de gráficas y tablas y, al final, las recomendaciones de la biblioteca (textos; vienen marcadas las sugeridas para este estudio). */
    categoriasInforme() {
      if (!this.eligiendo || !this.r) return []
      const categorias = construirCategorias(this.r)
      if (this.recomendaciones.length) {
        categorias.push({ id: 'recomendaciones', nombre: 'Recomendaciones', modulos: this.recomendaciones.map((x) => ({ id: 'rec-' + x.id, nombre: x.titulo, tipo: 'texto', specs: [], titulo: x.titulo, texto: x.texto, sugerida: x.sugerida })) })
      }
      return categorias
    },
    // Un resultado a medias (sin finanzas o sin consumo: los de los estudios de ejemplo o los de una versión anterior) no se pinta
    r() { const r = this.estudio.calc.resultado; return r && r.simulacion && r.finanzas && r.consumo ? r : null },
    remoto() { return this.estudio.remote },
    /** El presupuesto que abre la pestaña: el aprobado, si lo hay; si no, del que sale el coste o el más reciente. */
    destinoPresupuesto() {
      const l = this.asociados
      return l.find((p) => p.status === 'validado') || l.find((p) => p.id === this.presupuestoActual) || l[0] || null
    },
    pestanaEstudio() {
      const e = this.remoto ? ESTADOS_ESTUDIO[this.remoto.estado] : null
      return { hay: true, estado: e ? e.label : this.remoto ? '' : 'Local', clase: e ? e.cls : 'local' }
    },
    pestanaPresupuesto() {
      const d = this.destinoPresupuesto
      return { hay: !!d, estado: d ? ETIQUETA_ESTADO[d.status] || '' : '', clase: d ? d.status : '' }
    },
    /** Un estudio aceptado queda bloqueado: solo se le cambia el estado. */
    bloqueado() { return !!this.remoto && this.remoto.estado === 'aceptado' },
    sucio() { return isDirty(this.estudio) },
    avisosPrecio() { return this.r && this.r.precios && Array.isArray(this.r.precios.avisos) ? this.r.precios.avisos : [] },
    cliente() { return this.estudio.state.customer },
    detalleCliente() {
      const c = this.cliente
      return c ? [c.tradeName && c.tradeName !== c.name ? c.tradeName : '', c.cif && 'CIF ' + c.cif, c.phone, c.email].filter(Boolean).join(' · ') : ''
    },
    /** CUPS, tarifa, localidad y potencias contratadas, en una línea. */
    suministro() {
      const s = this.estudio.state.suministro
      const pot = Array.isArray(s.potencias) && s.potencias.length ? s.potencias.map((p, i) => 'P' + (i + 1) + ' ' + this.fmt(p, 0)).join(' / ') + ' kW' : ''
      return [s.cups && 'CUPS ' + s.cups, s.tarifa, [s.localidad, s.provincia].filter(Boolean).join(', '), pot].filter(Boolean).join(' · ')
    },
    instalacion() {
      const i = this.estudio.state.instalacion
      const kwp = this.r ? this.r.simulacion.kwp : i.kwp
      const bateria = Number(i.bateriaKwh) > 0 ? ' + ' + this.fmt(i.bateriaKwh, 0) + ' kWh de batería' : ''
      const orientacion = i.orientacion === 'sur' ? 'Sur 15°' : i.orientacion === 'personalizada' ? 'Azimut ' + this.fmt(i.azimut, 0) + '°, ' + this.fmt(i.inclinacion, 0) + '° de inclinación' : 'Este-Oeste 10°'
      return this.fmt(kwp, 0) + ' kWp' + bateria + ' · ' + orientacion
    },
    ubicacion() {
      const i = this.estudio.state.instalacion
      const sol = this.r && this.r.solar
      const lugar = i.latitud !== null && i.latitud !== '' && i.longitud !== null && i.longitud !== '' ? this.fmt(i.latitud, 2) + '°, ' + this.fmt(i.longitud, 2) + '°' : ''
      const prod = sol ? this.fmt(sol.produccionEspecifica, 0) + ' kWh/kWp·año' + (sol.fuente === 'PVGIS' ? ' (PVGIS)' : ' (modelo)') : ''
      return [lugar, prod].filter(Boolean).join(' · ') || '—'
    },
    aislada() { return this.estudio.state.economia.modo === 'aislada' },
    costeGrupo() {
      const g = this.r && this.r.grupo
      return g ? this.fmt(g.costeKwh, 3) + ' €/kWh · ' + this.fmt(g.litrosPorKwh, 2) + ' L/kWh' : '—'
    },
    precioEnergia() {
      const p = this.r && this.r.precios
      if (!p) return '—'
      const medio = this.fmt(p.precioMedio, 3) + ' €/kWh'
      return p.modo === 'periodos' ? 'Por periodos (' + (p.regulados ? 'con BOE «' + p.regulados.nombre + '»' : 'sin BOE') + ') · media ' + medio : 'Medio · ' + medio
    },
    inversion() {
      const f = this.r && this.r.finanzas
      const e = this.estudio.state.economia
      const total = f && f.inversion ? this.fmt(f.inversion, 0) + ' €' : ''
      // Con un presupuesto de referencia el coste es el suyo; si no, el precio provisional
      return [total, conPresupuesto(this.estudio.state) ? 'según el presupuesto' : this.fmt(e.precioWp, 2) + ' €/Wp provisional'].filter(Boolean).join(' · ')
    },
    presupuestoActual() { return conPresupuesto(this.estudio.state) ? this.estudio.state.economia.presupuestoId : '' },
    /** Entre qué presupuestos se puede elegir el coste: solo si hay más de uno, o si el que se usa no es el único que hay. */
    opcionesCoste() {
      const lista = this.presupuestos
      if (lista.length === 0 || (lista.length === 1 && lista[0].id === this.presupuestoActual)) return []
      const etiqueta = (p, i) => this.fmt(p.total, 0) + ' €' + (p.nombre ? ' · ' + p.nombre : lista.length > 1 ? ' · v' + (lista.length - i) : '')
      return [...lista.map((p, i) => ({ id: p.id, etiqueta: 'Presupuesto de ' + etiqueta(p, i) })), { id: '', etiqueta: 'Coste provisional' }]
    },
    subtitulo() {
      const e = this.estudio.state
      return [e.proyecto, e.suministro.cups && 'CUPS ' + e.suministro.cups, e.suministro.tarifa].filter(Boolean).join(' · ')
    }
  },
  methods: {
    /** Texto de la recomendación con **negrita**, *cursiva*, listas con «- » y párrafos, como HTML (el texto se escapa antes). */
    formatoTexto(texto) {
      const inline = (s) => s
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
      return String(texto || '').split(/\n\s*\n/).map((bloque) => {
        const lineas = bloque.split('\n').map((l) => l.trim()).filter(Boolean)
        if (!lineas.length) return ''
        if (lineas.every((l) => /^[-•]\s+/.test(l))) return '<ul>' + lineas.map((l) => '<li>' + inline(l.replace(/^[-•]\s+/, '')) + '</li>').join('') + '</ul>'
        return '<p>' + lineas.map(inline).join('<br>') + '</p>'
      }).join('')
    },
    esActual(s) { return !!this.r && Math.round(s.kwp) === Math.round(this.r.simulacion.kwp) },
    /** El estudio entero tal como está en esta pantalla: el informe sale de él, esté o no guardado. */
    cuerpoInforme() { return { id: this.estudio.id, ...cuerpoDe(this.estudio.state) } },
    /** Abre la elección de módulos con las recomendaciones de este estudio (con sus números y las sugeridas); si no se pueden leer, el informe se ofrece igual sin ellas. */
    async abrirInforme() {
      await this.cargarRecomendaciones()
      this.eligiendo = true
    },
    async cargarRecomendaciones() {
      if (!this.r) { this.recomendaciones = []; return }
      try {
        this.recomendaciones = (await planificadorApi.recomendacionesDelEstudio(this.cuerpoInforme())).recomendaciones
      } catch (e) {
        this.recomendaciones = []
      }
    },
    /** Descarga el informe con los módulos elegidos (en su orden); las gráficas se dibujan aquí y viajan como SVG. */
    async descargar(formato, orden) {
      this.ocupado = true
      this.error = ''
      try {
        const cuerpo = { ...this.cuerpoInforme(), informe: cuerpoInforme(orden) }
        if (formato === 'html') {
          const { blob, nombre } = await planificadorApi.informeEstudioHtml(cuerpo)
          descargarArchivo(blob, nombre)
        } else {
          try {
            const { blob, nombre } = await planificadorApi.informeEstudioPdf(cuerpo)
            descargarArchivo(blob, nombre)
          } catch (e) {
            // Sin Chrome en el servidor: se imprime el HTML desde el navegador
            if (!(e && e.response && e.response.status === 501)) throw e
            const { blob, nombre } = await planificadorApi.informeEstudioHtml(cuerpo)
            await imprimirHtml(await blob.text(), nombre.replace(/\.html$/, ''))
          }
        }
        this.eligiendo = false
      } catch (e) {
        this.error = mensajeError(e)
        this.eligiendo = false
      } finally {
        this.ocupado = false
      }
    },
    irAPresupuesto() {
      if (this.destinoPresupuesto) this.$emit('abrir-presupuesto', this.destinoPresupuesto.id)
    },
    // El estado lo guarda quien usa este componente: la lista vuelve a mostrar el de siempre hasta que el servidor responda
    cambiarEstado(evento) {
      const nuevo = evento.target.value
      evento.target.value = this.remoto.estado
      if (nuevo === this.remoto.estado) return
      if (nuevo === 'aceptado' && !window.confirm('Con «Aceptado» el estudio queda bloqueado: no se podrá modificar hasta que cambies su estado. ¿Continuar?')) return
      this.$emit('cambiar-estado', nuevo)
    },
    eliminar() {
      const nombre = this.cliente ? this.cliente.name : 'este cliente'
      const aviso = this.remoto ? ' Se elimina también del servidor, para todos.' : ''
      if (window.confirm('¿Eliminar el estudio de «' + nombre + '»?' + aviso + ' No se puede deshacer.')) this.$emit('eliminar')
    },
    fmt(n, d) { return n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) },
    fecha(iso) {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }
}
</script>
