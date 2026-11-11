<template>
  <DialogoRegistro titulo="Dibuja tu firma" @cerrar="$emit('cerrar')">
    <div>
      <p class="rh-nota" style="margin-bottom: 8px">
        Firma dentro del recuadro con el ratón, el dedo o un lápiz digital. Ctrl+Z deshace el último trazo y Ctrl+Y lo recupera.
      </p>
      <canvas
        ref="lienzo"
        class="rh-lienzo"
        role="img"
        aria-label="Recuadro para dibujar la firma"
        @pointerdown="empezarTrazo"
        @pointermove="seguirTrazo"
        @pointerup="acabarTrazo"
        @pointercancel="acabarTrazo"
      ></canvas>
    </div>
    <div class="rh-fila-botones">
      <button type="button" class="rh-btn" @click="$emit('cerrar')">Cancelar</button>
      <button type="button" class="rh-btn rh-empuja" :disabled="numTrazos === 0" @click="deshacer">↶ Deshacer</button>
      <button type="button" class="rh-btn" :disabled="numTrazos === 0" @click="borrar">Borrar todo</button>
      <button type="button" class="rh-btn rh-btn-primario" :disabled="puntos < 3" @click="$emit('usar', exportar())">Usar esta firma</button>
    </div>
  </DialogoRegistro>
</template>

<script>
import DialogoRegistro from './DialogoRegistro.vue';

const TINTA = '#141e78';
const GROSOR = 3; // px del trazo en pantalla
const ESCALA = 3; // el PNG se dibuja a mayor resolución para que el trazo salga suave
const ANCHO_MAX = 900;

function pintarTrazos(g, trazos, k, x0 = 0, y0 = 0) {
  g.strokeStyle = g.fillStyle = TINTA;
  g.lineWidth = GROSOR * k;
  g.lineCap = g.lineJoin = 'round';
  for (const t of trazos) {
    g.beginPath();
    g.moveTo((t[0][0] - x0) * k, (t[0][1] - y0) * k);
    if (t.length === 1) g.lineTo((t[0][0] - x0) * k + 0.01, (t[0][1] - y0) * k); // un punto suelto
    for (const [x, y] of t.slice(1)) g.lineTo((x - x0) * k, (y - y0) * k);
    g.stroke();
  }
}

// Lienzo para firmar con el ratón, el dedo o un lápiz digital. Los trazos no son reactivos (se repintan a mano);
// solo se avisa a la pantalla de cuántos hay para activar o desactivar los botones.
export default {
  name: 'DialogoFirmaDibujoRegistro',
  components: { DialogoRegistro },
  emits: ['usar', 'cerrar'],
  data() {
    return { numTrazos: 0, puntos: 0 };
  },
  created() {
    this.trazos = [];
    this.deshechos = [];
    this.dibujando = false;
  },
  mounted() {
    this.repintar();
    document.addEventListener('keydown', this.alPulsar);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.alPulsar);
  },
  methods: {
    repintar() {
      const c = this.$refs.lienzo;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      const g = c.getContext('2d');
      g.strokeStyle = '#d1d5db';
      g.setLineDash([4 * dpr, 4 * dpr]);
      g.lineWidth = dpr;
      g.beginPath();
      g.moveTo(30 * dpr, r.height * 0.72 * dpr);
      g.lineTo((r.width - 30) * dpr, r.height * 0.72 * dpr);
      g.stroke();
      g.setLineDash([]);
      pintarTrazos(g, this.trazos, dpr);
      this.numTrazos = this.trazos.length;
      this.puntos = this.trazos.reduce((n, t) => n + t.length, 0);
    },
    punto(e) {
      const r = this.$refs.lienzo.getBoundingClientRect();
      return [Math.min(Math.max(e.clientX - r.left, 0), r.width), Math.min(Math.max(e.clientY - r.top, 0), r.height)];
    },
    empezarTrazo(e) {
      e.currentTarget.setPointerCapture(e.pointerId);
      this.dibujando = true;
      this.deshechos = [];
      this.trazos.push([this.punto(e)]);
      this.repintar();
    },
    seguirTrazo(e) {
      if (!this.dibujando) return;
      this.trazos[this.trazos.length - 1].push(this.punto(e));
      this.repintar();
    },
    acabarTrazo() {
      this.dibujando = false;
    },
    deshacer() {
      const t = this.trazos.pop();
      if (t) {
        this.deshechos.push(t);
        this.repintar();
      }
    },
    rehacer() {
      const t = this.deshechos.pop();
      if (t) {
        this.trazos.push(t);
        this.repintar();
      }
    },
    borrar() {
      this.trazos = [];
      this.deshechos = [];
      this.repintar();
    },
    // Ctrl+Z / Ctrl+Y (o Ctrl+Mayús+Z) valen en cualquier momento mientras el diálogo está abierto, también justo después
    // de dibujar (al pulsar en el lienzo el foco no queda en ningún campo, así que no basta escuchar en un contenedor).
    alPulsar(e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || this.dibujando) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.deshacer();
      } else if (k === 'y' || (k === 'z' && e.shiftKey)) {
        e.preventDefault();
        this.rehacer();
      }
    },
    // PNG (data URL) con los trazos, recortado a la firma, con fondo transparente y como mucho 900 px de ancho.
    exportar() {
      const pts = this.trazos.flat();
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const margen = GROSOR + 0.03 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
      const x0 = Math.min(...xs) - margen;
      const y0 = Math.min(...ys) - margen;
      const w = Math.max(...xs) + margen - x0;
      const h = Math.max(...ys) + margen - y0;
      const k = Math.min(ESCALA, ANCHO_MAX / w);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * k));
      c.height = Math.max(1, Math.round(h * k));
      pintarTrazos(c.getContext('2d'), this.trazos, k, x0, y0);
      return c.toDataURL('image/png');
    }
  }
};
</script>
