<template>
  <div class="costes budget-setup">
    <div class="back-fila">
      <button type="button" class="secondary" @click="$emit('cancelar')">{{ modo === 'nuevo' ? '← Volver a propuestas' : '← Volver al estudio' }}</button>
    </div>
    <div class="costes-titulo"><h1>{{ modo === 'nuevo' ? 'Nuevo estudio' : 'Parámetros del estudio' }}</h1></div>

    <form class="alta-formulario estudio-formulario" novalidate @submit.prevent="enviar">
      <fieldset class="alta-tarjeta estudio-cliente">
        <legend>{{ fijo ? 'Propuesta' : 'Cliente' }}</legend>
        <div v-if="fijo" class="proyecto-fijo"><strong>{{ v.customer.name }}</strong><span class="muted">{{ v.proyecto }}</span></div>
        <template v-else>
          <selector-cliente v-model="v.customer" documento="estudio" :invalido="intentado && !v.customer" @modo="modoCliente = $event" />
          <label class="cuestionario-campo wide">
            Nombre del proyecto
            <input v-model="v.proyecto" list="estudio-proyectos" placeholder="Ej.: Nave 2, fotovoltaica" maxlength="80" autocomplete="off">
            <datalist id="estudio-proyectos"><option v-for="p in proyectosSugeridos" :key="p" :value="p" /></datalist>
          </label>
        </template>
      </fieldset>

      <fieldset class="alta-tarjeta estudio-consumo">
        <legend>Consumo del cliente</legend>
        <div class="estudio-zonas">
          <!-- Cargado: sus datos con «Cambiar» y «Quitar». Vacío: toda la zona se pulsa. En los dos casos se puede soltar el fichero encima -->
          <div v-if="tieneSips" class="estudio-zona ok" :class="{ arrastrando: arrastrando === 'sips' }"
               @dragover.prevent="arrastrando = 'sips'" @dragleave="arrastrando = ''" @drop.prevent="soltar($event, 'sips')">
            <span class="estudio-zona-titulo">✓ SIPS cargado</span>
            <span class="estudio-zona-detalle">{{ v.suministro.tarifa || 'Sin tarifa' }}<template v-if="v.suministro.localidad"> · {{ v.suministro.localidad }}</template></span>
            <span class="estudio-zona-botones">
              <button type="button" class="secondary estudio-mini" :disabled="leyendo" @click="$refs.sips.click()">Cambiar</button>
              <button type="button" class="secondary estudio-mini estudio-quitar" :disabled="leyendo" @click="quitar('sips')">Quitar</button>
            </span>
          </div>
          <button v-else type="button" class="estudio-zona" :class="{ arrastrando: arrastrando === 'sips' }" :disabled="leyendo"
                  @click="$refs.sips.click()" @dragover.prevent="arrastrando = 'sips'" @dragleave="arrastrando = ''" @drop.prevent="soltar($event, 'sips')">
            <span class="estudio-zona-titulo">SIPS</span>
            <span class="estudio-zona-accion">Arrastra el .xlsx / .xls / .csv o haz clic</span>
          </button>

          <div v-if="curvaReal" class="estudio-zona ok" :class="{ arrastrando: arrastrando === 'curva' }"
               @dragover.prevent="arrastrando = 'curva'" @dragleave="arrastrando = ''" @drop.prevent="soltar($event, 'curva')">
            <span class="estudio-zona-titulo">✓ Curva de consumo</span>
            <span class="estudio-zona-detalle" :title="v.curva.origen">{{ v.curva.origen }}</span>
            <span class="estudio-zona-botones">
              <button type="button" class="secondary estudio-mini" :disabled="leyendo" @click="$refs.curva.click()">Cambiar</button>
              <button type="button" class="secondary estudio-mini estudio-quitar" :disabled="leyendo" @click="quitar('curva')">Quitar</button>
            </span>
          </div>
          <button v-else type="button" class="estudio-zona" :class="{ arrastrando: arrastrando === 'curva' }" :disabled="leyendo"
                  @click="$refs.curva.click()" @dragover.prevent="arrastrando = 'curva'" @dragleave="arrastrando = ''" @drop.prevent="soltar($event, 'curva')">
            <span class="estudio-zona-titulo">Curva horaria o cuartohoraria</span>
            <span v-if="tieneSips" class="estudio-zona-detalle">Ahora se usa la estimada con el SIPS</span>
            <span class="estudio-zona-accion">Arrastra el .xlsx / .xls / .csv o haz clic</span>
          </button>
          <input ref="sips" type="file" accept=".xlsx,.xls,.csv,.txt" hidden @change="elegido($event, 'sips')">
          <input ref="curva" type="file" accept=".xlsx,.xls,.csv,.txt" hidden @change="elegido($event, 'curva')">
        </div>
        <p v-if="leyendo" class="muted estudio-leyendo">Leyendo el fichero…</p>
        <p v-if="errorArchivo" class="error" role="alert">{{ errorArchivo }}</p>
        <div class="estudio-campos estudio-campos-4">
          <label v-if="!aislada" class="cuestionario-campo">Tarifa de acceso
            <select v-model="v.suministro.tarifa">
              <option value="">Sin tarifa</option>
              <option v-for="t in tarifas" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label class="cuestionario-campo estudio-ubicacion" :class="{ completa: aislada }">Ubicación de la instalación
            <span class="estudio-buscador">
              <span v-if="conUbicacion" class="estudio-ubicacion-fijada">
                <span>✓ {{ nombreLugar || 'Ubicación' }} · {{ fmt(v.instalacion.latitud, 2) }}°, {{ fmt(v.instalacion.longitud, 2) }}°</span>
                <button type="button" class="secondary estudio-mini estudio-quitar" @click.prevent="quitarUbicacion">Quitar</button>
              </span>
              <template v-else>
                <input v-model="lugar" type="text" role="combobox" autocomplete="off" :aria-expanded="abierto" :placeholder="v.suministro.localidad || 'Localidad, o coordenadas (40,42 -3,70)'"
                       @input="alEscribir" @keydown.enter.prevent="elegirPrimero" @keydown.esc="abierto = false" @blur="cerrarLuego">
                <ul v-if="abierto" class="estudio-sugerencias" role="listbox">
                  <li v-if="coordenadasEscritas"><button type="button" @mousedown.prevent="usarCoordenadas">Usar las coordenadas {{ fmt(coordenadasEscritas[0], 4) }}, {{ fmt(coordenadasEscritas[1], 4) }}</button></li>
                  <li v-else-if="buscando" class="muted">Buscando…</li>
                  <li v-else-if="errorLugar" class="muted">{{ errorLugar }}</li>
                  <li v-for="l in lugares" :key="l.nombre + l.latitud">
                    <button type="button" @mousedown.prevent="elegirLugar(l)"><span>{{ l.nombre }}</span><small>{{ fmt(l.latitud, 2) }}°, {{ fmt(l.longitud, 2) }}°</small></button>
                  </li>
                </ul>
              </template>
            </span>
          </label>
        </div>
        <div v-if="tieneSips && !curvaReal" class="estudio-periodos">
          <strong>Horario de funcionamiento</strong>
          <div class="estudio-horario-resumen">
            <span>{{ resumenHorario }}</span>
            <button type="button" class="secondary" @click="horarioAbierto = true">Personalizar</button>
          </div>
          <HorarioModal v-if="horarioAbierto" :horario="v.horario" @cerrar="horarioAbierto = false" @aplicar="aplicarHorario" />
        </div>
      </fieldset>

      <!-- Dos columnas por filas: cada pareja de tarjetas tiene la misma altura; Observaciones es la única que se estira (su casilla crece) -->
      <div class="estudio-columnas" :class="{ aislada }">
      <fieldset class="alta-tarjeta" :class="{ completa: !aislada }">
        <legend>{{ aislada ? 'Instalación' : 'Instalación y potencia contratada' }}</legend>
        <div class="estudio-campos estudio-campos-4">
          <div class="cuestionario-campo estudio-ancho">
            Tipo de instalación
            <div class="estudio-segmento" role="radiogroup" aria-label="Tipo de instalación">
              <button type="button" role="radio" :aria-checked="!aislada" :class="{ on: !aislada }" @click="v.economia.modo = 'red'">Conectada a la red</button>
              <button type="button" role="radio" :aria-checked="aislada" :class="{ on: aislada }" @click="v.economia.modo = 'aislada'">Aislada con grupo electrógeno</button>
            </div>
          </div>
          <label class="cuestionario-campo estudio-mitad">Paneles (kWp)<input v-model.number="v.instalacion.kwp" type="number" min="0" step="1" :placeholder="kwpPropuesto ? kwpPropuesto + ' (propuesta)' : 'Carga primero el consumo'" title="Vacío: se usa la potencia propuesta, la que produce más o menos la mitad de lo que consume el cliente al año"></label>
          <label class="cuestionario-campo estudio-mitad">Batería (kWh)<input v-model.number="v.instalacion.bateriaKwh" type="number" min="0" step="1" placeholder="0 = sin batería"></label>
          <div class="cuestionario-campo estudio-mitad">
            Orientación
            <div class="estudio-segmento" role="radiogroup" aria-label="Orientación">
              <button v-for="o in ORIENTACIONES" :key="o.id" type="button" role="radio" :aria-checked="v.instalacion.orientacion === o.id"
                      :class="{ on: v.instalacion.orientacion === o.id }" @click="v.instalacion.orientacion = o.id">{{ o.nombre }}</button>
            </div>
          </div>
          <label class="cuestionario-campo">Azimut (°)
            <input v-if="personalizada" v-model.number="v.instalacion.azimut" type="number" min="-180" max="180" step="5" placeholder="0 sur · -90 este">
            <input v-else :value="orientacionFija.azimut" type="text" disabled>
          </label>
          <label class="cuestionario-campo">Inclinación (°)
            <input v-if="personalizada" v-model.number="v.instalacion.inclinacion" type="number" min="0" max="90" step="1">
            <input v-else :value="orientacionFija.inclinacion" type="text" disabled>
          </label>
        </div>
        <div v-if="!aislada" class="estudio-periodos estudio-potencia">
          <div class="estudio-potencia-cabecera">
            <strong>Potencia contratada</strong>
            <button v-if="sugeridaPotencia" type="button" class="secondary estudio-mini" @click="usarSugerida">Usar la reducción sugerida</button>
          </div>
          <div class="estudio-campos">
            <label v-for="p in nPotencia" :key="'p' + p" class="cuestionario-campo">Reducción en P{{ p }} (kW)
              <input v-model.number="v.economia.reduccionPotencia[p - 1]" type="number" min="0" :max="maxReduccion(p)" step="1" :placeholder="placeholderReduccion(p)">
              <small class="muted">{{ infoPotencia(p) }}</small>
            </label>
            <label class="cuestionario-campo" :style="{ gridColumn: 'span ' + (nPotencia % 4 ? 4 - nPotencia % 4 : 1) }">Ahorro anual en potencia (€)
              <input v-if="!reducePotencia" v-model.number="v.economia.ahorroPotencia" type="number" min="0" step="100">
              <input v-else :value="precios && precios.potenciaCalculada ? fmt(precios.ahorroPotencia, 0) : 'Se calcula al crear'" type="text" disabled>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset v-if="aislada" class="alta-tarjeta estudio-ajustes">
        <legend>Grupo electrógeno y mantenimiento</legend>
        <div class="estudio-campos">
          <label class="cuestionario-campo">Gasoil (€/L)<input v-model.number="v.economia.precioGasoil" type="number" min="0.2" max="5" step="0.01"></label>
          <label class="cuestionario-campo">Consumo del grupo (L/kWh)<input v-model.number="v.economia.consumoGrupo" type="number" min="0.15" max="1" step="0.01"></label>
          <label class="cuestionario-campo">Mantenimiento del grupo (€/kWh)<input v-model.number="v.economia.mantenimientoGrupo" type="number" min="0" max="2" step="0.01"></label>
          <label class="cuestionario-campo">Mantenimiento y seguro (% de la inversión al año)<input v-model.number="v.economia.mantenimientoPct" type="number" min="0" max="10" step="0.1" :disabled="mantenimientoFijo"></label>
          <label class="cuestionario-campo">Mantenimiento fijo (€/año, vacío = % de la inversión)<input v-model.number="v.economia.mantenimiento" type="number" min="0" step="50"></label>
        </div>
      </fieldset>


      <fieldset class="alta-tarjeta estudio-coste-obs">
        <legend>Coste y observaciones</legend>
        <div class="estudio-periodos estudio-coste">
          <strong>Coste de la instalación</strong>
          <p v-if="conPresupuestoRef" class="estudio-coste-ref">
            <span>Según el presupuesto de <strong>{{ fmt(v.economia.presupuestoTotal, 0) }} €</strong> · {{ fmt(v.economia.presupuestoKwp, 2) }} kWp</span>
            <button type="button" class="secondary estudio-mini estudio-coste-boton" @click="usarProvisional">Poner un coste a mano</button>
          </p>
          <div v-else class="estudio-campos estudio-coste-manual">
            <label class="cuestionario-campo">Coste total (€)<input v-model.number="v.economia.inversionTotal" type="number" min="0" step="100" :placeholder="costeEstimado"></label>
            <button v-if="presupuestoGuardado" type="button" class="secondary estudio-mini estudio-coste-boton" @click="volverAlPresupuesto">Volver al presupuesto ({{ fmt(presupuestoGuardado.total, 0) }} €)</button>
          </div>
        </div>
        <div class="estudio-periodos estudio-observaciones">
          <strong>Observaciones</strong>
          <textarea v-model="v.observaciones" rows="2" maxlength="5000" aria-label="Observaciones" placeholder="Ej.: pendiente de la factura de julio; el cliente lo está hablando con su gestor" />
        </div>
      </fieldset>

      <fieldset v-if="!aislada" class="alta-tarjeta estudio-ajustes">
        <legend>Energía y mantenimiento</legend>
        <div class="estudio-campos">
          <label class="cuestionario-campo">Precio de la energía
            <select v-model="v.economia.modoPrecio">
              <option value="medio">Un precio medio</option>
              <option value="periodos">Por periodos (P1 a P{{ nEnergia }})</option>
            </select>
          </label>
          <label class="cuestionario-campo">{{ v.economia.modoPrecio === 'periodos' ? 'Precio medio si falta algún periodo (€/kWh)' : 'Precio medio de la energía (€/kWh)' }}<input v-model.number="v.economia.precioEnergia" type="number" min="0.005" max="1" step="0.005"></label>
          <label class="cuestionario-campo">Mantenimiento y seguro (% de la inversión al año)<input v-model.number="v.economia.mantenimientoPct" type="number" min="0" max="10" step="0.1" :disabled="mantenimientoFijo"></label>
        </div>

        <div v-if="v.economia.modoPrecio === 'periodos'" class="estudio-periodos">
          <strong>Energía por periodo (€/kWh)</strong>
          <label class="estudio-check"><input v-model="v.economia.incluyePeajes" type="checkbox"> Los precios ya incluyen peajes y cargos (precio con ATR)</label>
          <div class="estudio-campos">
            <label v-for="p in nEnergia" :key="'e' + p" class="cuestionario-campo">P{{ p }}
              <input v-model.number="v.economia.preciosPeriodo[p - 1]" type="number" min="0" max="1" step="0.001">
              <small v-if="boe && !v.economia.incluyePeajes" class="muted">+ {{ fmt(boe.energia[p - 1], 6) }} BOE = {{ total(p) }}</small>
            </label>
          </div>
        </div>

        <div class="estudio-periodos">
          <strong>Avanzado</strong>
          <div class="estudio-campos">
            <label class="cuestionario-campo">Mantenimiento fijo (€/año, vacío = % de la inversión)<input v-model.number="v.economia.mantenimiento" type="number" min="0" step="50"></label>
            <label class="cuestionario-campo">Reposición de batería e inversores (€)<input v-model.number="v.economia.reposicion" type="number" min="0" step="100" :placeholder="reposicionSugerida"></label>
            <label class="cuestionario-campo">Año de la reposición<input v-model.number="v.economia.reposicionAno" type="number" min="1" max="25" step="1" :disabled="!(Number(v.economia.reposicion) > 0)"></label>
          </div>
        </div>
      </fieldset>
      </div>

      <!-- Barra anclada abajo: el botón y los avisos de lo que falta se ven siempre, aunque el formulario sea largo -->
      <div class="alta-acciones">
        <div v-if="(intentado && problemas.length > 0) || errorEnvio" class="alta-problemas" role="alert">
          <template v-if="intentado"><p v-for="p in problemas" :key="p">{{ p }}</p></template>
          <p v-if="errorEnvio">{{ errorEnvio }}</p>
        </div>
        <button type="submit" :disabled="ocupado || leyendo">{{ ocupado ? 'Calculando…' : modo === 'nuevo' ? 'Crear estudio' : 'Modificar estudio' }}</button>
        <button type="button" class="secondary" :disabled="ocupado" @click="$emit('cancelar')">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script>
import SelectorCliente from '../Presupuestos/SelectorCliente.vue'
import HorarioModal from './HorarioModal.vue'
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { conCoste, conPresupuesto, estadoInicial, suministroVacio } from '@/utils/planificador/almacenEstudios'
import { fechaCorta } from '@/utils/planificador/preciosBoe'

const ORIENTACIONES = [{ id: 'este-oeste', nombre: 'Este-Oeste' }, { id: 'sur', nombre: 'Sur' }, { id: 'personalizada', nombre: 'Otra' }]
// Las tarifas de acceso que entiende el cálculo (periodos y precios del BOE)
const TARIFAS = ['2.0TD', '3.0TD', '6.1TD']

// Los parámetros de un estudio: se piden al crearlo (y se cambian con «Editar parámetros»). Aquí no se guarda nada: se recogen y,
// al pulsar el botón, el estudio se calcula y se enseña su resultado.
export default {
  name: 'Datos-Estudio-Component',
  components: { SelectorCliente, HorarioModal },
  props: {
    modo: { type: String, default: 'nuevo' },
    // Los parámetros con los que se abre (los de un estudio ya creado); sin ellos, los de partida
    base: { type: Object, default: null },
    // El último cálculo del estudio, para los precios del BOE y el ahorro en potencia
    calc: { type: Object, default: null },
    // Los clientes y proyectos de los estudios que ya hay, para sugerir los del cliente elegido
    existentes: { type: Array, default: () => [] },
    ocupado: { type: Boolean, default: false },
    errorEnvio: { type: String, default: '' }
  },
  emits: ['cancelar', 'enviar'],
  data() {
    const v = this.base ? JSON.parse(JSON.stringify(this.base)) : estadoInicial()
    // El cliente y el proyecto vienen del proyecto (se eligen una sola vez, al crearlo): aquí no se tocan. Se decide al abrir, no al teclear
    const fijo = !!v.customer && !!(v.proyecto || '').trim()
    return { presupuestoGuardado: null, fijo, modoCliente: "buscar", v, intentado: false, leyendo: false, errorArchivo: '', arrastrando: '', lugar: '', nombreLugar: '', lugares: [], boes: [], abierto: false, buscando: false, errorLugar: '', temporizador: null, ORIENTACIONES, horarioAbierto: false }
  },
  computed: {
    /** Dos números escritos en el buscador (40,42 -3,70) se toman como coordenadas. */
    coordenadasEscritas() {
      const m = /^\s*(-?\d{1,3}(?:[.,]\d+)?)\s*[;,\s]\s*(-?\d{1,3}(?:[.,]\d+)?)\s*$/.exec(this.lugar)
      if (!m) return null
      const lat = Number(m[1].replace(',', '.')), lon = Number(m[2].replace(',', '.'))
      return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? [lat, lon] : null
    },
    conUbicacion() { const i = this.v.instalacion; return [i.latitud, i.longitud].every((x) => x !== null && x !== '' && Number.isFinite(Number(x))) },
    /** El horario en una línea: «De 7 a 19 h · fuera de horario 15 % · fin de semana 10 %», y las jornadas distintas si las hay. */
    resumenHorario() {
      const h = this.v.horario
      const otras = h.excepciones.filter((x) => x.meses.length > 0).length
      return `De ${h.ini} a ${h.fin} h · fuera de horario ${h.fuera} % · fin de semana ${h.finde} %` + (otras ? ` · ${otras === 1 ? 'otra jornada' : otras + ' jornadas más'} por meses` : '')
    },
    tieneSips() { return !!(this.v.suministro.cups || this.v.suministro.sips) },
    /** Las tarifas a elegir; si el SIPS trae una que no está en la lista, también sale, para no perderla. */
    tarifas() {
      const t = this.v.suministro.tarifa
      return t && !TARIFAS.includes(t) ? [...TARIFAS, t] : TARIFAS
    },
    curvaReal() { return !!this.v.curva },
    /** La potencia que se usa si se deja vacía: la que produce la mitad del consumo anual (igual que el servidor), en tramos de 5 kWp. Null sin consumo. */
    kwpPropuesto() {
      let consumo = 0
      if (this.v.curva && this.v.curva.texto) consumo = this.v.curva.texto.split(',').reduce((a, x) => a + Number(x), 0) / 1000
      else if (this.v.suministro.sips) consumo = Number(this.v.suministro.sips.kwhAnual) || 0
      if (!(consumo > 0)) return null
      const porKwp = this.v.instalacion.orientacion === 'sur' ? 1685 : 1420
      return Math.max(5, Math.round((0.5 * consumo) / porKwp / 5) * 5)
    },
    precios() { const r = this.calc && this.calc.resultado; return r && r.precios ? r.precios : null },
    /** Los peajes y cargos del último cálculo, solo mientras valgan para la tarifa elegida ahora. */
    boe() {
      const b = this.precios && this.precios.regulados ? this.precios.regulados : null
      const t = this.v.suministro.tarifa
      return b && (!t || this.mismaTarifa(b.tarifa, t)) ? b : null
    },
    /** La tarifa elegida manda: al cambiarla cambian al momento los periodos que se piden. */
    es20() { return /2[.,]\s*0\s*TD/i.test(this.v.suministro.tarifa || (this.precios && this.precios.regulados && this.precios.regulados.tarifa) || '') },
    personalizada() { return this.v.instalacion.orientacion === 'personalizada' },
    /** Lo que usa el cálculo cuando la orientación no es a medida. */
    orientacionFija() { return this.v.instalacion.orientacion === 'sur' ? { azimut: '0 (sur)', inclinacion: 15 } : { azimut: '-90 y 90 (este y oeste)', inclinacion: 10 } },
    mantenimientoFijo() { return Number(this.v.economia.mantenimiento) > 0 },
    conPresupuestoRef() { return conPresupuesto(this.v) },
    aislada() { return this.v.economia.modo === 'aislada' },
    bateriaPuesta() { return Number(this.v.instalacion.bateriaKwh) > 0 },
    /** Lo que costaría con el precio por Wp de partida (y la batería), para la casilla vacía del coste total. */
    costeEstimado() {
      const e = this.v.economia
      const kwp = Number(this.v.instalacion.kwp) > 0 ? Number(this.v.instalacion.kwp) : this.kwpPropuesto
      if (!(kwp > 0)) return 'Carga primero el consumo'
      return 'Estimado: ' + this.fmt(kwp * 1000 * Number(e.precioWp) + Number(this.v.instalacion.bateriaKwh || 0) * Number(e.precioBateriaKwh || 0), 0) + ' € (si se deja vacío)'
    },
    /** Orientación para la casilla vacía de la reposición (no se aplica sola): unos 117 €/kWp de inversores y 146 €/kWh de batería. */
    reposicionSugerida() {
      const kwp = Number(this.v.instalacion.kwp) > 0 ? Number(this.v.instalacion.kwp) : this.kwpPropuesto
      if (!(kwp > 0)) return '0 = sin reposición'
      return 'Sugerido: ' + this.fmt(kwp * 116.7 + Number(this.v.instalacion.bateriaKwh || 0) * 145.8, 0) + ' €'
    },
    nEnergia() { return this.es20 ? 3 : 6 },
    nPotencia() { return this.es20 ? 2 : 6 },
    /** Reducción sugerida por periodo en el último cálculo (null si aún no hay o no sugiere bajar nada). */
    sugeridaPotencia() {
      const g = this.calc && this.calc.resultado && this.calc.resultado.graficas ? this.calc.resultado.graficas.potencia : null
      const s = g && Array.isArray(g.sugerida) ? g.sugerida : null
      return s && s.slice(0, this.nPotencia).some((x) => Number(x) > 0) ? s : null
    },
    reducePotencia() { return this.v.economia.reduccionPotencia.slice(0, this.nPotencia).some((x) => Number(x) > 0) },
    /** Los proyectos que ya tienen los estudios de ese cliente, para no escribirlos distinto. */
    proyectosSugeridos() {
      const nombre = this.v.customer && this.v.customer.name ? this.v.customer.name.trim().toLowerCase() : ''
      if (!nombre) return []
      return [...new Set(this.existentes.filter((s) => s.cliente.trim().toLowerCase() === nombre && s.proyecto).map((s) => s.proyecto))]
    },
    problemas() {
      const p = []
      if (!this.v.customer) p.push('Elige el cliente del estudio.')
      if (!this.tieneSips && !this.curvaReal) p.push('Sube el SIPS o la curva horaria del cliente.')
      return p
    }
  },
  watch: {
    // Con menos periodos (2.0TD) se vacían los que sobran, para que no queden valores ocultos que sigan contando
    nEnergia(n) { for (let i = n; i < 6; i++) this.v.economia.preciosPeriodo[i] = null },
    nPotencia(n) { for (let i = n; i < 6; i++) this.v.economia.reduccionPotencia[i] = null }
  },
  mounted() {
    // Los BOE que hay, para poder elegir uno concreto en los ajustes (sin elegir, se usa el vigente hoy)
    planificadorApi.preciosBoe().then((r) => { this.boes = r.boes }, () => undefined)
  },
  methods: {
    /** Deja de partir del presupuesto: el coste vuelve a ser el precio provisional (€/Wp). */
    usarProvisional() {
      const total = this.v.economia.presupuestoTotal
      const e = this.v.economia
      this.presupuestoGuardado = { id: e.presupuestoId, total: e.presupuestoTotal, kwp: e.presupuestoKwp }
      this.v = conCoste(this.v, null)
      if (Number(total) > 0) this.v.economia.inversionTotal = Number(total)
    },
    /** Vuelve a partir del presupuesto del que se venía (el coste a mano se vacía). */
    volverAlPresupuesto() {
      this.v = conCoste(this.v, this.presupuestoGuardado)
      this.v.economia.inversionTotal = null
      this.presupuestoGuardado = null
    },
    fechaCorta,
    mismaTarifa(a, b) {
      const n = (t) => String(t || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^(\d)(\d)TD$/, '$1.$2TD')
      return n(a) === n(b)
    },
    /** Lo máximo que se puede reducir de un periodo: la potencia que tiene contratada (sin tope si no se conoce). */
    maxReduccion(p) {
      const c = Number((this.v.suministro.potencias || [])[p - 1])
      return c > 0 ? c : undefined
    },
    /** Bajo cada reducción: la potencia contratada (SIPS), la punta registrada del último cálculo y el precio del BOE. */
    infoPotencia(p) {
      const c = Number((this.v.suministro.potencias || [])[p - 1])
      const g = this.calc && this.calc.resultado && this.calc.resultado.graficas ? this.calc.resultado.graficas.potencia : null
      const punta = g && g.punta ? Number(g.punta[p - 1]) : 0
      const partes = []
      if (c > 0) partes.push('Contratada ' + this.fmt(c, 0) + ' kW')
      if (punta > 0) partes.push('punta ' + this.fmt(punta, 0) + ' kW')
      if (this.boe) partes.push(this.fmt(this.boe.potencia[p - 1], 2) + ' €/kW·año')
      return partes.join(' · ')
    },
    /** En gris dentro de la casilla: la reducción sugerida (solo orienta: vacía, la reducción es 0). */
    placeholderReduccion(p) {
      const sug = this.sugeridaPotencia
      return sug && Number(sug[p - 1]) > 0 ? this.fmt(sug[p - 1], 0) + ' (sugerida)' : '0'
    },
    /** Rellena las reducciones con las sugeridas (se pueden corregir a mano). */
    usarSugerida() {
      const sug = this.sugeridaPotencia || []
      for (let i = 0; i < this.nPotencia; i++) this.v.economia.reduccionPotencia[i] = Number(sug[i]) > 0 ? Number(sug[i]) : null
    },
    aplicarHorario(h) {
      this.v.horario = h
      this.horarioAbierto = false
    },
    elegido(evento, tipo) {
      const archivo = evento.target.files && evento.target.files[0]
      evento.target.value = ''
      if (archivo) this.leer(archivo, tipo)
    },
    soltar(evento, tipo) {
      this.arrastrando = ''
      const archivo = evento.dataTransfer && evento.dataTransfer.files && evento.dataTransfer.files[0]
      if (archivo && !this.leyendo) this.leer(archivo, tipo)
    },
    /** El servidor lee el fichero y devuelve sus datos; no se guarda nada. */
    async leer(archivo, tipo) {
      this.leyendo = true
      this.errorArchivo = ''
      try {
        if (tipo === 'sips') {
          const r = await planificadorApi.leerSips(archivo)
          this.v.suministro = {
            // Si el SIPS no trae la tarifa (la tabla web no la trae), se queda la que se haya elegido
            cups: r.cups || '', tarifa: r.tarifa || this.v.suministro.tarifa || '', localidad: r.localidad || '', provincia: r.provincia || '', cnae: r.cnae || '',
            potencias: Array.isArray(r.potencias) ? r.potencias : [], sips: r.sips || null
          }
          this.ubicarDelSips()
        } else {
          const r = await planificadorApi.leerCurva(archivo)
          this.v.curva = { texto: r.texto, origen: r.origen || archivo.name }
        }
      } catch (e) {
        this.errorArchivo = mensajeError(e)
      } finally {
        this.leyendo = false
      }
    },
    quitar(tipo) {
      if (tipo === 'sips') this.v.suministro = suministroVacio()
      else this.v.curva = null
    },
    /** Mientras se escribe, sugiere lugares (con una pequeña espera para no preguntar a cada letra). */
    alEscribir() {
      clearTimeout(this.temporizador)
      this.errorLugar = ''
      const texto = this.lugar.trim()
      if (this.coordenadasEscritas) { this.lugares = []; this.abierto = true; return }
      if (texto.length < 3) { this.lugares = []; this.abierto = false; return }
      this.abierto = true
      this.buscando = true
      this.temporizador = setTimeout(() => this.buscarLugar(texto), 350)
    },
    async buscarLugar(texto) {
      this.buscando = true
      try {
        const r = await planificadorApi.buscarLugar(texto)
        if (texto !== this.lugar.trim()) return
        this.lugares = r
        this.errorLugar = r.length === 0 ? 'No se encontró ese lugar.' : ''
      } catch (e) {
        this.lugares = []
        this.errorLugar = mensajeError(e)
      } finally {
        this.buscando = false
      }
    },
    elegirPrimero() {
      if (this.coordenadasEscritas) this.usarCoordenadas()
      else if (this.lugares.length) this.elegirLugar(this.lugares[0])
    },
    elegirLugar(l) {
      this.fijar(l.latitud, l.longitud, l.nombre)
    },
    usarCoordenadas() {
      this.fijar(this.coordenadasEscritas[0], this.coordenadasEscritas[1], 'Coordenadas')
    },
    fijar(lat, lon, nombre) {
      this.v.instalacion.latitud = Math.round(lat * 100) / 100
      this.v.instalacion.longitud = Math.round(lon * 100) / 100
      this.nombreLugar = nombre
      this.lugar = ''
      this.lugares = []
      this.abierto = false
    },
    quitarUbicacion() {
      this.v.instalacion.latitud = null
      this.v.instalacion.longitud = null
      this.nombreLugar = ''
    },
    cerrarLuego() { setTimeout(() => { this.abierto = false }, 150) },
    /** Con un SIPS recién cargado y sin ubicación, se pone la de su localidad (o, si no, la de su provincia) si la encuentra en España. */
    async ubicarDelSips() {
      const { localidad, provincia } = this.v.suministro
      if (this.conUbicacion) return
      // El buscador de lugares compara solo con el nombre del sitio: se pregunta por la localidad sola y, si no sale, por la provincia
      const sin = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
      for (const texto of [localidad, provincia].filter(Boolean)) {
        try {
          const espana = (await planificadorApi.buscarLugar(texto)).filter((x) => x.nombre.endsWith('España'))
          const l = (provincia && espana.find((x) => sin(x.nombre).includes(sin(provincia)))) || espana[0]
          if (l) { if (!this.conUbicacion) this.elegirLugar(l); return }
        } catch (e) { /* se puede poner a mano */ }
      }
    },
    enviar() {
      this.intentado = true
      if (this.problemas.length > 0) return
      this.$emit('enviar', JSON.parse(JSON.stringify(this.v)))
    },
    /** Precio total de un periodo (energía + peajes y cargos), para enseñarlo junto al campo. */
    total(p) {
      const x = this.v.economia.preciosPeriodo[p - 1]
      return x === null || x === '' || Number.isNaN(Number(x)) ? '—' : this.fmt(Number(x) + this.boe.energia[p - 1], 4)
    },
    fmt(n, d) { return n === null || n === undefined || n === '' || Number.isNaN(Number(n)) ? '—' : Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d }) }
  }
}
</script>
