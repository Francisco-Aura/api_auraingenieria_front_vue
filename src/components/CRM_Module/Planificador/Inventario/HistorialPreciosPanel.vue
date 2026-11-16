<template>
  <div class="ph-panel">
    <button type="button" class="enlace-boton ph-alternar" :aria-expanded="abierto" @click="abierto = !abierto">
      {{ abierto ? '▾ Ocultar historial de precios' : '▸ Ver historial de precios' }}
    </button>
    <div v-if="abierto" class="ph-cuerpo">
      <p v-if="error" class="error-text">{{ error }}</p>
      <p v-else-if="puntos === null" class="muted">Cargando…</p>
      <p v-else-if="puntos.length === 0" class="muted">Este producto aún no tiene precio: el historial empieza cuando se le pone uno.</p>
      <template v-else>
        <svg class="ph-grafico" :viewBox="'0 0 ' + ANCHO + ' ' + ALTO" role="img" aria-label="Evolución del precio">
          <g v-for="v in marcasY" :key="'y' + v">
            <line class="ph-rejilla" :x1="MARGEN.izq" :x2="ANCHO - MARGEN.der" :y1="y(v)" :y2="y(v)" />
            <text class="ph-eje" :x="MARGEN.izq - 8" :y="y(v) + 4" text-anchor="end">{{ eur(v) }}</text>
          </g>
          <text v-for="(t, i) in marcasX" :key="'x' + i" class="ph-eje" :x="x(t)" :y="ALTO - 8" :text-anchor="anclaX(i)">{{ dia(t) }}</text>
          <g v-for="s in visibles" :key="s.key">
            <path class="ph-linea" :class="{ main: s.main }" :d="trazo(s)" :stroke="s.color" />
            <template v-for="(v, i) in s.values" :key="i">
              <circle v-if="v !== null" class="ph-punto" :cx="x(tiempos[i])" :cy="y(v)" :r="s.main ? 4.5 : 3.5" :fill="s.color">
                <title>{{ s.label + ': ' + eur(v) + ' / ' + unidad + ' (' + dia(tiempos[i]) + ')' }}</title>
              </circle>
            </template>
          </g>
        </svg>
        <div class="ph-leyenda">
          <button v-for="s in series" :key="s.key" type="button" class="ph-leyenda-elemento"
                  :class="{ off: ocultas.includes(s.key) }" :aria-pressed="!ocultas.includes(s.key)" @click="alternar(s.key)">
            <span class="ph-muestra" :style="{ background: s.color }" />{{ s.label }}
          </button>
        </div>
        <p v-if="puntos.length === 1" class="muted">
          Aún no ha cambiado de precio. El historial se empezó a guardar el {{ dia(tiempos[0]) }}; no se conservan los precios anteriores.
        </p>
        <table class="ph-tabla">
          <thead>
            <tr><th>Fecha</th><th>Proveedor</th><th class="num">Precio</th><th class="num">Cambio</th><th>Quién</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in cambios.slice(0, 12)" :key="c.p.at">
              <td>{{ dia(new Date(c.p.at).getTime()) }}</td>
              <td>{{ c.p.supplier || proveedor || '—' }}</td>
              <td class="num">{{ eur(c.p.price) }}</td>
              <td class="num" :class="claseCambio(c.delta)">{{ textoCambio(c.delta) }}</td>
              <td>{{ c.p.by || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>

<script>
import { planificadorApi, mensajeError } from '@/services/planificadorApi'
import { eur } from '@/utils/planificador/formato'

const COLORES = ['#2f80ed', '#27ae60', '#e67e22', '#9b51e0', '#eb5757', '#00a3a3', '#b8860b', '#d6336c']

// Historial de precios de un producto: gráfica con el precio del presupuestador y el de cada proveedor, y lista de cambios.
// Se despliega a petición (no pide nada al servidor hasta que se abre).
export default {
  name: 'Historial-Precios-Panel',
  props: {
    id: { type: String, required: true },
    unidad: { type: String, default: 'ud' },
    proveedor: { type: String, default: '' },
    version: { type: String, default: '' }
  },
  data() {
    return {
      ANCHO: 640, ALTO: 240, MARGEN: { izq: 62, der: 16, arriba: 14, abajo: 30 },
      abierto: false, puntos: null, error: null, ocultas: []
    }
  },
  computed: {
    tiempos() { return (this.puntos || []).map((p) => new Date(p.at).getTime()) },
    series() {
      const puntos = this.puntos || []
      const ultimo = puntos[puntos.length - 1]
      const nombrePrincipal = (ultimo && ultimo.supplier) || this.proveedor || 'Precio del presupuestador'
      const principal = { key: '__main', label: nombrePrincipal, main: true, color: 'var(--text-h)', values: puntos.map((p) => p.price) }
      const nombres = [...new Set(puntos.flatMap((p) => p.offers.map((o) => o.supplier)))]
      const otras = nombres.map((nombre, i) => ({
        key: nombre,
        label: nombre === nombrePrincipal ? nombre + ' (oferta)' : nombre,
        main: false,
        color: COLORES[i % COLORES.length],
        values: puntos.map((p) => {
          const oferta = p.offers.find((o) => o.supplier === nombre)
          return oferta && oferta.price > 0 ? oferta.price : null
        })
      }))
      // Si un proveedor vale siempre lo mismo que el precio del presupuestador, su línea quedaría debajo de la principal
      return [principal, ...otras.filter((s) => s.values.some((v, i) => v !== principal.values[i]))]
    },
    visibles() { return this.series.filter((s) => !this.ocultas.includes(s.key)).reverse() },
    t0() { return this.tiempos[0] },
    t1() { return Math.max(this.tiempos[this.tiempos.length - 1], Date.now()) },
    lapso() { return Math.max(this.t1 - this.t0, 1) },
    limites() {
      const todos = this.visibles.flatMap((s) => s.values).filter((v) => v !== null)
      const bajo = todos.length ? Math.min(...todos) : 0
      const alto = todos.length ? Math.max(...todos) : 1
      const holgura = (alto - bajo) * 0.15 || Math.max(alto * 0.1, 1)
      return { min: Math.max(0, bajo - holgura), max: alto + holgura }
    },
    marcasY() { return Array.from({ length: 5 }, (_, i) => this.limites.min + ((this.limites.max - this.limites.min) * i) / 4) },
    marcasX() { return this.lapso > 1 && this.tiempos.length > 0 ? [this.t0, this.t0 + this.lapso / 2, this.t1] : [this.t0] },
    cambios() {
      const todos = this.puntos || []
      return todos.map((p, i) => ({ p, delta: i > 0 ? p.price - todos[i - 1].price : null })).reverse()
    }
  },
  watch: {
    abierto() { this.cargar() },
    version() { this.cargar() }
  },
  methods: {
    eur,
    dia(ms) { return new Date(ms).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
    x(t) { return this.MARGEN.izq + ((t - this.t0) / this.lapso) * (this.ANCHO - this.MARGEN.izq - this.MARGEN.der) },
    y(v) { return this.MARGEN.arriba + (1 - (v - this.limites.min) / (this.limites.max - this.limites.min)) * (this.ALTO - this.MARGEN.arriba - this.MARGEN.abajo) },
    anclaX(i) {
      if (this.marcasX.length > 1 && i === 0) return 'start'
      if (this.marcasX.length > 1 && i === this.marcasX.length - 1) return 'end'
      return 'middle'
    },
    // Línea escalonada: el precio vale lo mismo hasta que cambia
    trazo(s) {
      let d = ''
      let previo = null
      s.values.forEach((v, i) => {
        if (v === null) { previo = null; return }
        if (previo === null) d += 'M' + this.x(this.tiempos[i]) + ',' + this.y(v)
        else d += 'L' + this.x(this.tiempos[i]) + ',' + this.y(previo) + 'L' + this.x(this.tiempos[i]) + ',' + this.y(v)
        previo = v
      })
      if (previo !== null) d += 'L' + this.x(this.t1) + ',' + this.y(previo)
      return d
    },
    alternar(clave) {
      this.ocultas = this.ocultas.includes(clave) ? this.ocultas.filter((k) => k !== clave) : [...this.ocultas, clave]
    },
    claseCambio(delta) { return delta === null ? '' : delta > 0 ? 'up' : delta < 0 ? 'down' : '' },
    textoCambio(delta) {
      if (delta === null) return '—'
      if (delta === 0) return 'igual'
      return (delta > 0 ? '+' : '−') + eur(Math.abs(delta))
    },
    async cargar() {
      if (!this.abierto) return
      try {
        this.puntos = await planificadorApi.historialPrecios(this.id)
        this.error = null
      } catch (e) {
        this.error = mensajeError(e) || 'No se pudo cargar el historial'
      }
    }
  }
}
</script>
