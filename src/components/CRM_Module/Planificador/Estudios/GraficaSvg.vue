<template>
  <figure class="grafica">
    <figcaption v-if="spec.titulo && !imprimir" class="grafica-titulo"><h3>{{ spec.titulo }}</h3></figcaption>
    <div v-if="leyenda.length && !imprimir" class="estudio-leyenda">
      <span v-for="s in leyenda" :key="s.nombre"><i :class="{ rayado: s.rayado, linea: s.tipo === 'linea' }" :style="{ background: s.rayado ? '' : s.color, borderColor: s.color }" />{{ s.nombre }}</span>
    </div>
    <svg :viewBox="'0 0 ' + W + ' ' + H" class="estudio-svg" :class="{ 'grafica-pdf': imprimir }" role="img" :aria-label="spec.titulo" @mousemove="mover" @mouseleave="hover = null">
      <defs>
        <pattern :id="uid" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="var(--bg-alt)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted)" stroke-width="1.6" />
        </pattern>
      </defs>

      <!-- Ejes -->
      <g class="eje">
        <template v-for="t in marcasY" :key="'y' + t.v">
          <line :x1="IZQ" :x2="W - DER" :y1="t.y" :y2="t.y" :class="{ cero: t.v === 0 }" />
          <text :x="IZQ - 6" :y="t.y + 4" text-anchor="end">{{ t.texto }}</text>
        </template>
        <text v-for="t in marcasX" :key="'x' + t.x" :x="t.px" :y="H - ABA + 16" text-anchor="middle">
          <tspan v-for="(l, k) in t.lineas" :key="k" :x="t.px" :dy="k ? 13 : 0" :class="{ pequeno: k > 0 }">{{ l }}</tspan>
        </text>
        <text class="unidad" :x="IZQ" :y="imprimir ? ARR - 9 : 14" text-anchor="start">{{ spec.unidad }}</text>
        <text v-if="spec.etiquetaX" class="unidad" :x="W - DER" :y="H - 4" text-anchor="end">{{ spec.etiquetaX }}</text>
      </g>

      <!-- Leyenda dentro del dibujo (solo al sacar la gráfica para el informe) -->
      <g v-if="imprimir" class="leyenda-svg">
        <g v-for="l in leyendaSvg" :key="l.nombre" :transform="'translate(' + l.x + ' ' + l.y + ')'">
          <rect :y="l.linea ? 4 : 0" width="11" :height="l.linea ? 3 : 11" rx="2" :fill="l.rayado ? 'url(#' + uid + ')' : l.color" :stroke="l.rayado ? 'var(--muted)' : 'none'" stroke-width="0.8" />
          <text x="16" y="10">{{ l.nombre }}</text>
        </g>
      </g>

      <!-- Zona sombreada -->
      <g v-if="spec.banda">
        <rect :x="px(spec.banda.x0)" :y="ARR" :width="Math.max(0, px(spec.banda.x1) - px(spec.banda.x0))" :height="H - ABA - ARR" class="banda-fija" />
        <text :x="px(spec.banda.x0) + 8" :y="ARR + 14" class="nota">{{ spec.banda.texto }}</text>
      </g>
      <rect v-if="hover !== null && hayBarras" :x="IZQ + columna * hover" :y="ARR" :width="columna" :height="H - ABA - ARR" class="banda" />

      <!-- Áreas -->
      <template v-for="a in areas" :key="'a' + a.nombre">
        <path :d="a.ruta" :fill="a.color" :opacity="a.opacidad" />
      </template>

      <!-- Barras -->
      <g v-if="hayBarras">
        <template v-for="(b, i) in barras" :key="'b' + i">
          <path v-for="(seg, k) in b" :key="k" :d="rutaBarra(seg)"
                :fill="seg.rayado ? 'url(#' + uid + ')' : seg.color" :stroke="seg.rayado ? 'var(--muted)' : 'none'" stroke-width="0.8"
                :opacity="hover === null || hover === i ? 1 : 0.5" />
        </template>
        <text v-for="t in valoresBarra" :key="t.k" :x="t.x" :y="t.y" text-anchor="middle" class="valor-barra">{{ t.texto }}</text>
        <!-- Informe: lo que en pantalla enseña el globo, escrito dentro de cada bloque -->
        <text v-for="t in valoresSegmento" :key="'s' + t.k" :x="t.x" :y="t.y" text-anchor="middle" :fill="t.color" :class="t.clase">{{ t.texto }}</text>
        <text v-for="t in etiquetasSobre" :key="'e' + t.i" :x="t.x" :y="t.y" text-anchor="middle" class="etiqueta">{{ t.texto }}</text>
      </g>

      <!-- Líneas -->
      <template v-for="l in lineas" :key="'l' + l.nombre">
        <path :d="l.ruta" fill="none" :stroke="l.color" :stroke-width="l.grosor" :stroke-dasharray="l.discontinua ? '5 4' : null" stroke-linejoin="round" stroke-linecap="round" />
      </template>

      <!-- Referencias -->
      <g v-if="spec.lineaH" class="ref">
        <line :x1="IZQ" :x2="W - DER" :y1="py(spec.lineaH.valor)" :y2="py(spec.lineaH.valor)" />
        <text :x="IZQ + 6" :y="py(spec.lineaH.valor) - 5">{{ spec.lineaH.texto }}</text>
      </g>
      <g v-for="v in (spec.vlineas || [])" :key="'v' + v.x" class="ref">
        <line :x1="px(v.x)" :x2="px(v.x)" :y1="ARR" :y2="H - ABA" />
        <text :x="px(v.x) + 5" :y="ARR + 12">{{ v.texto }}</text>
      </g>
      <g v-for="m in marcasPuestas" :key="'m' + m.x + m.texto" class="marca">
        <circle :cx="px(m.x)" :cy="py(m.y)" r="5.5" :fill="m.color || 'var(--brand)'" stroke="var(--bg)" stroke-width="1.5" />
        <text :x="m.tx" :y="m.ty" :text-anchor="m.ancla">{{ m.texto }}</text>
      </g>

      <line v-if="hover !== null && !hayBarras" :x1="guiaX" :x2="guiaX" :y1="ARR" :y2="H - ABA" class="guia" />
      <circle v-for="p in puntosHover" :key="'h' + p.nombre" :cx="guiaX" :cy="p.y" r="3.8" :fill="p.color" />

      <!-- Datos del punto o columna bajo el ratón -->
      <g v-if="hover !== null && globo" class="globo" :transform="'translate(' + globo.x + ' ' + globo.y + ')'">
        <rect :width="globo.w" :height="globo.h" rx="7" />
        <text class="titulo" x="12" y="19">{{ globo.titulo }}</text>
        <g v-for="(f, k) in globo.filas" :key="k" :transform="'translate(12 ' + (38 + k * 18) + ')'">
          <circle v-if="f.color" cx="4" cy="-4" r="4" :fill="f.color" />
          <text :x="f.color ? 16 : 0" y="0" :class="{ suave: !f.color }">{{ f.nombre }}</text>
          <text v-if="f.valor" :x="globo.w - 24" y="0" text-anchor="end" class="valor">{{ f.valor }}</text>
        </g>
      </g>
    </svg>
  </figure>
</template>

<script>
import { colocarMarcas } from '@/utils/planificador/colocarMarcas'
let contador = 0

/**
 * Gráfica SVG genérica: barras agrupadas o apiladas (con rayado), líneas (continuas, discontinuas o en escalón), áreas apiladas,
 * referencias, marcas y un globo con los valores al pasar el ratón. El `spec` describe qué dibujar; no sabe nada del estudio.
 */
export default {
  name: 'Grafica-Svg',
  props: { spec: { type: Object, required: true }, ancho: { type: Number, default: 760 }, alto: { type: Number, default: 300 }, imprimir: { type: Boolean, default: false } },
  data() {
    contador++
    return { hover: null, uid: 'raya' + contador, IZQ: 58, DER: 16 }
  },
  computed: {
    /** El borde de arriba: en el informe la leyenda va dentro del dibujo y ocupa una o más filas. */
    ARR() { return 24 + (this.imprimir ? Math.max(1, this.leyendaSvg.reduce((m, l) => Math.max(m, l.fila + 1), 0)) * 17 : 0) },
    leyendaSvg() {
      const r = []
      let x = this.IZQ
      let fila = 0
      for (const s of this.series.filter((z) => z.leyenda !== false)) {
        const w = 28 + s.nombre.length * 6.2
        if (x + w > this.W - this.DER && x > this.IZQ) { x = this.IZQ; fila++ }
        r.push({ nombre: s.nombre, color: s.color, rayado: s.rayado, linea: s.tipo === 'linea', x, y: 6 + fila * 17, fila })
        x += w + 8
      }
      return r
    },
    W() { return this.ancho },
    H() { return this.alto },
    ABA() { return this.dosLineas ? 46 : 34 },
    dosLineas() { return (this.spec.categorias || []).some((c) => Array.isArray(c) && c.length > 1) },
    series() { return this.spec.series || [] },
    seriesBarra() { return this.series.filter((s) => s.tipo === 'barra') },
    hayBarras() { return this.seriesBarra.length > 0 },
    n() {
      if (this.spec.categorias && this.spec.categorias.length) return this.spec.categorias.length
      return Math.max(0, ...this.series.map((s) => s.datos.length))
    },
    escalon() { return this.series.some((s) => s.escalon) },
    xs() { return this.spec.xs && this.spec.xs.length ? this.spec.xs : Array.from({ length: this.n }, (_, i) => i) },
    dominioX() {
      const a = Math.min(...this.xs)
      const b = Math.max(...this.xs)
      if (this.escalon) return [a, b + (this.xs.length > 1 ? this.xs[1] - this.xs[0] : 1)]
      return [a, b === a ? a + 1 : b]
    },
    columna() { return (this.W - this.IZQ - this.DER) / Math.max(1, this.n) },
    leyenda() { return this.series.filter((s) => s.leyenda !== false) },
    /** Los grupos de barras de cada categoría: las series con la misma `pila` se apilan; cada pila distinta va al lado. */
    grupos() {
      const claves = []
      for (const s of this.seriesBarra) { const k = s.pila || s.nombre; if (!claves.includes(k)) claves.push(k) }
      return claves
    },
    pilasArea() {
      const m = {}
      for (const s of this.series.filter((x) => x.tipo === 'area')) (m[s.pila || s.nombre] = m[s.pila || s.nombre] || []).push(s)
      return m
    },
    /** Lo más alto y lo más bajo que se dibuja, para escalar el eje vertical. */
    rango() {
      let min = 0
      let max = 0
      for (let i = 0; i < this.n; i++) {
        for (const k of this.grupos) {
          let pos = 0
          let neg = 0
          for (const s of this.seriesBarra.filter((x) => (x.pila || x.nombre) === k)) { const v = s.datos[i] || 0; if (v >= 0) pos += v; else neg += v }
          max = Math.max(max, pos)
          min = Math.min(min, neg)
        }
        for (const k of Object.keys(this.pilasArea)) {
          const t = this.pilasArea[k].reduce((a, s) => a + (s.datos[i] || 0), 0)
          max = Math.max(max, t)
          min = Math.min(min, t)
        }
        for (const s of this.series.filter((x) => x.tipo === 'linea')) { const v = s.datos[i]; if (v !== undefined && v !== null) { max = Math.max(max, v); min = Math.min(min, v) } }
      }
      if (this.spec.lineaH) max = Math.max(max, this.spec.lineaH.valor)
      if (this.spec.yMax !== undefined) max = this.spec.yMax
      if (this.spec.yMin !== undefined) min = this.spec.yMin
      const paso = this.paso((max - min) * (this.spec.etiquetas || this.spec.valores ? 1.08 : 1))
      const techo = Math.max(paso, Math.ceil((max * (this.spec.etiquetas || this.hayValores ? 1.07 : 1)) / paso) * paso)
      return { min: min < 0 ? -Math.ceil(-min / paso) * paso : 0, max: techo, paso }
    },
    hayValores() { return this.seriesBarra.some((s) => s.valores) },
    marcasY() {
      const { min, max, paso } = this.rango
      const r = []
      for (let v = min; v <= max + paso / 2; v += paso) r.push({ v: Math.round(v * 1e6) / 1e6, y: this.py(v), texto: this.numero(v) })
      return r
    },
    marcasX() {
      const r = []
      if (this.hayBarras || !this.spec.xTicks) {
        const cats = this.spec.categorias || []
        cats.forEach((c, i) => r.push({ x: i, px: this.IZQ + this.columna * (i + 0.5), lineas: Array.isArray(c) ? c : [c] }))
        return r
      }
      for (const t of this.spec.xTicks) r.push({ x: t.x, px: this.px(t.x), lineas: [t.texto] })
      return r
    },
    anchoBarra() { return Math.max(4, (this.columna * 0.78) / Math.max(1, this.grupos.length)) },
    /** Los rectángulos de cada categoría. */
    barras() {
      const salida = []
      for (let i = 0; i < this.n; i++) {
        const segs = []
        this.grupos.forEach((k, g) => {
          let pos = 0
          let neg = 0
          const grupoSegs = []
          const x = this.IZQ + this.columna * i + (this.columna - this.anchoBarra * this.grupos.length) / 2 + g * this.anchoBarra
          const ss = this.seriesBarra.filter((z) => (z.pila || z.nombre) === k)
          for (const s of ss) {
            const v = s.datos[i] || 0
            const desde = v >= 0 ? pos : neg
            const hasta = desde + v
            if (v >= 0) pos = hasta; else neg = hasta
            const y1 = this.py(Math.max(desde, hasta))
            const y2 = this.py(Math.min(desde, hasta))
            const resaltado = this.spec.resaltar === i && s.colorResaltado
            const seg = { x, w: this.anchoBarra - 1.5, y: y1, h: Math.max(0, y2 - y1), color: resaltado ? s.colorResaltado : s.color, rayado: s.rayado, arriba: false, abajo: false, valor: v, etiquetar: !ss.some((z) => z.valores) }
            segs.push(seg)
            if (seg.h > 0) grupoSegs.push(seg)
          }
          // Solo los extremos reales de la columna van redondeados; las uniones entre bloques, rectas.
          if (grupoSegs.length) {
            grupoSegs.reduce((a, b) => (b.y < a.y ? b : a)).arriba = true
            grupoSegs.reduce((a, b) => (b.y + b.h > a.y + a.h ? b : a)).abajo = true
          }
        })
        salida.push(segs)
      }
      return salida
    },
    /** Valor encima de cada barra de las series con `valores`. */
    valoresBarra() {
      const r = []
      for (let i = 0; i < this.n; i++) {
        this.grupos.forEach((k, g) => {
          const ss = this.seriesBarra.filter((z) => (z.pila || z.nombre) === k)
          const ultima = ss[ss.length - 1]
          if (!ultima.valores) return
          const total = ss.reduce((a, s) => a + (s.datos[i] || 0), 0)
          const x = this.IZQ + this.columna * i + (this.columna - this.anchoBarra * this.grupos.length) / 2 + g * this.anchoBarra + (this.anchoBarra - 1.5) / 2
          r.push({ k: i + '-' + g, x, y: this.py(Math.max(0, total)) - 4, texto: ultima.valores(total, i) })
        })
      }
      return r
    },
    /**
     * Solo en el informe, donde no hay ratón: el valor de cada bloque escrito dentro de él (sin ceros, sin unidades —van en el eje— y sin
     * los bloques tan finos que el número no cabría). Las columnas que ya llevan su valor encima no lo repiten.
     */
    valoresSegmento() {
      if (!this.imprimir) return []
      const r = []
      this.barras.forEach((segs, i) => segs.forEach((g, k) => {
        if (!g.etiquetar || g.h < 8.5 || Math.round(Math.abs(g.valor) * 10) === 0) return
        const texto = this.numero(g.valor, 1)
        if (texto.length * 5.4 > g.w) return
        r.push({ k: i + '-' + k, x: g.x + g.w / 2, y: g.y + g.h / 2 + (g.h < 12 ? 2.8 : 3.4), texto, color: g.rayado ? '#2c2c2e' : this.colorTexto(g.color),
          clase: 'valor-seg' + (g.h < 12 ? ' chico' : '') + (g.rayado ? ' sobre-trama' : '') })
      }))
      return r
    },
    /** Una etiqueta (por ejemplo el %) encima de lo más alto de cada categoría. */
    etiquetasSobre() {
      const e = this.spec.etiquetas
      if (!e) return []
      return e.map((texto, i) => {
        let tope = 0
        for (const k of this.grupos) tope = Math.max(tope, this.seriesBarra.filter((z) => (z.pila || z.nombre) === k).reduce((a, s) => a + Math.max(0, s.datos[i] || 0), 0))
        return { i, texto, x: this.IZQ + this.columna * (i + 0.5), y: this.py(tope) - 6 }
      }).filter((t) => t.texto)
    },
    areas() {
      const r = []
      for (const k of Object.keys(this.pilasArea)) {
        const ss = this.pilasArea[k]
        let base = new Array(this.n).fill(0)
        for (const s of ss) {
          const top = base.map((b, i) => b + (s.datos[i] || 0))
          r.push({ nombre: s.nombre, color: s.color, opacidad: s.opacidad || 0.85, ruta: this.rutaArea(top, base, s.escalon) })
          base = top
        }
      }
      return r
    },
    lineas() {
      return this.series.filter((s) => s.tipo === 'linea').map((s) => ({ nombre: s.nombre, color: s.color, discontinua: s.discontinua, grosor: s.grosor || 2.2, ruta: this.ruta(s.datos, s.escalon) }))
    },
    /** Cada marca con su texto ya colocado donde no tape las líneas, las barras ni otra etiqueta ({@link colocarMarcas}). */
    marcasPuestas() {
      const marcas = this.spec.marcas || []
      if (!marcas.length) return []
      return colocarMarcas({
        marcas, px: this.px, py: this.py, obstaculos: this.obstaculos(),
        limites: { x0: this.IZQ + 2, x1: this.W - this.DER - 2, y0: this.ARR - 4, y1: this.H - this.ABA + 2 }
      })
    },
    guiaX() {
      if (this.hover === null) return 0
      return this.hayBarras ? this.IZQ + this.columna * (this.hover + 0.5) : this.px(this.xs[this.hover]) + (this.escalon ? (this.px(this.xs[0] + 1) - this.px(this.xs[0])) / 2 : 0)
    },
    puntosHover() {
      if (this.hover === null || this.hayBarras) return []
      return this.series.filter((s) => s.tipo !== 'barra' && s.leyenda !== false && s.datos[this.hover] !== undefined && s.datos[this.hover] !== null)
        .map((s) => ({ nombre: s.nombre, color: s.color, y: this.py(this.cumulado(s, this.hover)) }))
    },
    globo() {
      const i = this.hover
      if (i === null) return null
      const filas = []
      for (const s of this.series) {
        if (s.leyenda === false || s.datos[i] === undefined || s.datos[i] === null) continue
        filas.push({ nombre: s.nombre, color: s.color, valor: s.fmt ? s.fmt(s.datos[i], i) : this.numero(s.datos[i], 1) + (this.spec.unidad ? ' ' + this.spec.unidad : '') })
      }
      for (const t of (this.spec.extra ? this.spec.extra(i) : [])) filas.push({ nombre: t, color: '', valor: '' })
      const titulo = this.spec.tituloGlobo ? this.spec.tituloGlobo(i) : String(Array.isArray((this.spec.categorias || [])[i]) ? this.spec.categorias[i][0] : (this.spec.categorias || [])[i] ?? this.xs[i])
      // Ancho a partir del texto real de cada fila (11px: ~6,2 px/carácter; valores en negrita ~6,9) + sangría del punto + hueco entre nombre y valor
      const anchoFila = (f) => (f.color ? 16 : 0) + f.nombre.length * 5.9 + (f.valor ? 18 + f.valor.length * 6.6 : 0)
      const w = Math.min(340, Math.max(170, 24 + Math.max(...filas.map(anchoFila), titulo.length * 7.6)))
      const h = 30 + filas.length * 18 + 4
      const x0 = this.guiaX
      const x = x0 + 16 + w > this.W - this.DER ? x0 - 16 - w : x0 + 16
      return { w, h, x: Math.max(this.IZQ, x), y: this.ARR + 4, titulo, filas }
    }
  },
  methods: {
    /** Rectángulo con las esquinas redondeadas solo arriba y/o abajo según sea extremo de la columna. */
    rutaBarra(seg) {
      // El trazo del rayado (0,8) se centra en el borde y sobresale 0,4: se mete esa mitad para alinear con los bloques sin trazo.
      const m = seg.rayado ? 0.4 : 0
      const s = { x: seg.x + m, y: seg.y + (seg.arriba ? m : 0), w: seg.w - 2 * m, h: seg.h - (seg.arriba ? m : 0) - (seg.abajo ? m : 0) }
      const r = Math.min(1.5, s.w / 2, s.h / 2)
      const a = seg.arriba ? r : 0
      const b = seg.abajo ? r : 0
      const x2 = s.x + s.w
      const y2 = s.y + s.h
      return `M${s.x + a},${s.y}H${x2 - a}${a ? `A${a},${a} 0 0 1 ${x2},${s.y + a}` : ''}V${y2 - b}${b ? `A${b},${b} 0 0 1 ${x2 - b},${y2}` : ''}H${s.x + b}${b ? `A${b},${b} 0 0 1 ${s.x},${y2 - b}` : ''}V${s.y + a}${a ? `A${a},${a} 0 0 1 ${s.x + a},${s.y}` : ''}Z`
    },
    paso(rango) {
      const bruto = (rango || 1) / 4
      const mag = Math.pow(10, Math.floor(Math.log10(bruto)))
      const f = bruto / mag
      return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag
    },
    numero(v, d = 0) { return Number(v).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: Math.abs(v) >= 100 ? 0 : d }) },
    py(v) {
      const { min, max } = this.rango
      return this.H - this.ABA - ((v - min) / (max - min)) * (this.H - this.ABA - this.ARR)
    },
    px(x) {
      if (this.hayBarras) return this.IZQ + this.columna * (x + 0.5)
      const [a, b] = this.dominioX
      return this.IZQ + ((x - a) / (b - a)) * (this.W - this.IZQ - this.DER)
    },
    cumulado(s, i) {
      if (s.tipo !== 'area') return s.datos[i]
      const ss = this.pilasArea[s.pila || s.nombre]
      let t = 0
      for (const z of ss) { t += z.datos[i] || 0; if (z === s) break }
      return t
    },
    puntos(datos, escalon) {
      const r = []
      datos.forEach((v, i) => {
        if (v === undefined || v === null) return
        const x = this.hayBarras ? this.IZQ + this.columna * (i + 0.5) : this.px(this.xs[i])
        r.push([x, this.py(v)])
        if (escalon) r.push([this.px(this.xs[i] + (this.xs.length > 1 ? this.xs[1] - this.xs[0] : 1)), this.py(v)])
      })
      return r
    },
    ruta(datos, escalon) { return this.puntos(datos, escalon).map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') },
    rutaArea(top, base, escalon) {
      const a = this.puntos(top, escalon)
      const b = this.puntos(base, escalon).reverse()
      if (!a.length) return ''
      return 'M' + a.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' L' + b.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z'
    },
    /** Texto oscuro sobre los colores claros y blanco sobre los oscuros (colores rgb o #hex; una variable CSS se toma por clara). */
    colorTexto(c) {
      const t = String(c || '')
      const hex = /^#([0-9a-f]{6})$/i.exec(t)
      const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(t)
      let v
      if (hex) { const n = parseInt(hex[1], 16); v = [n >> 16, (n >> 8) & 255, n & 255] } else if (rgb) v = [+rgb[1], +rgb[2], +rgb[3]]
      else return '#1c1c1e'
      return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255 > 0.62 ? '#1c1c1e' : '#ffffff'
    },
    /** Puntos por donde pasa algo dibujado (líneas, bordes de áreas, barras y la línea de referencia), para que las etiquetas no los tapen. */
    obstaculos() {
      const r = []
      const tramo = (a, b) => {
        const largo = Math.hypot(b[0] - a[0], b[1] - a[1])
        const n = Math.max(1, Math.ceil(largo / 4))
        for (let k = 0; k <= n; k++) r.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n])
      }
      const recorrer = (pts) => { for (let i = 0; i < pts.length - 1; i++) tramo(pts[i], pts[i + 1]); if (pts.length === 1) r.push(pts[0]) }
      for (const s of this.series.filter((z) => z.tipo === 'linea')) recorrer(this.puntos(s.datos, s.escalon))
      for (const k of Object.keys(this.pilasArea)) {
        let base = new Array(this.n).fill(0)
        for (const s of this.pilasArea[k]) {
          base = base.map((b, i) => b + (s.datos[i] || 0))
          recorrer(this.puntos(base, s.escalon))
        }
      }
      for (const segs of this.barras) for (const g of segs) for (let x = g.x; x <= g.x + g.w; x += 4) for (let y = g.y; y <= g.y + g.h; y += 4) r.push([x, y])
      if (this.spec.lineaH) tramo([this.IZQ, this.py(this.spec.lineaH.valor)], [this.W - this.DER, this.py(this.spec.lineaH.valor)])
      return r
    },
    /** El punto o la columna más cercana al ratón. */
    mover(e) {
      const caja = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - caja.left) / caja.width) * this.W
      let i
      if (this.hayBarras) i = Math.floor((x - this.IZQ) / this.columna)
      else {
        const [a, b] = this.dominioX
        const v = a + ((x - this.IZQ) / (this.W - this.IZQ - this.DER)) * (b - a)
        let mejor = 0
        this.xs.forEach((q, k) => { if (Math.abs(q - v) < Math.abs(this.xs[mejor] - v)) mejor = k })
        i = this.escalon ? this.xs.findIndex((q, k) => v >= q && (k === this.xs.length - 1 || v < this.xs[k + 1])) : mejor
      }
      this.hover = i < 0 || i >= this.n ? null : i
    }
  }
}
</script>
